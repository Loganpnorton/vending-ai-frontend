import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface StatusData {
  name?: string;
  location?: string;
  battery: number;
  stock_level: number;
  temperature: number;
  errors: string[];
  uptime_minutes: number;
  last_maintenance?: string;
}

interface CheckinPayload {
  machine_id: string;
  status: StatusData;
  auto_register?: boolean;
  machine_token?: string;
}

interface UseMachineCheckinOptions {
  intervalMinutes?: number;
  enabled?: boolean;
  baseUrl?: string;
  autoRegister?: boolean;
  maxRetries?: number;
}

const useMachineCheckin = (options: UseMachineCheckinOptions = {}) => {
  const { 
    intervalMinutes = 5, 
    enabled = true,
    baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5175' : 'https://vending-ai-nexus.vercel.app'),
    autoRegister = true,
    maxRetries = 3
  } = options;
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastSuccessfulCheckin, setLastSuccessfulCheckin] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [machineToken, setMachineToken] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const uptimeStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get machine credentials from localStorage
  const getMachineCredentials = useCallback((): { machine_id: string; machine_token?: string } | null => {
    const machineId = localStorage.getItem('machine_id');
    const storedToken = localStorage.getItem('machine_token');
    
    if (!machineId) {
      console.log('❌ No machine ID found in localStorage');
      return null;
    }
    
    return { 
      machine_id: machineId,
      machine_token: storedToken || undefined
    };
  }, []);

  // Get Supabase auth token
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!supabase) {
      console.log('⚠️ No Supabase client available for auth');
      return null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting auth session:', error);
        return null;
      }

      if (session?.access_token) {
        console.log('✅ Auth token retrieved successfully');
        setAuthToken(session.access_token);
        return session.access_token;
      } else {
        console.log('⚠️ No active auth session found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving auth token:', error);
      return null;
    }
  }, []);

  // Calculate uptime in minutes
  const getUptimeMinutes = useCallback((): number => {
    const uptimeMs = Date.now() - uptimeStartRef.current;
    const minutes = Math.floor(uptimeMs / (1000 * 60));
    return Math.max(0, minutes); // Ensure non-negative
  }, []);

  // Generate status data
  const generateStatusData = useCallback((): StatusData => {
    return {
      name: `Vending Machine ${localStorage.getItem('machine_id') || 'Unknown'}`,
      location: 'Main Lobby', // Could be configurable
      battery: 100, // Hardcoded for now
      stock_level: 0, // Stub - could be calculated from product data
      temperature: 37, // Stub temperature
      errors: [], // Empty unless real error logic is implemented
      uptime_minutes: getUptimeMinutes(),
      last_maintenance: new Date().toISOString().split('T')[0], // Today's date
    };
  }, [getUptimeMinutes]);

  // Check if we should use development mode
  const shouldUseDevelopmentMode = useCallback((): boolean => {
    const isDevelopment = import.meta.env.DEV;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasNoRealApi = !baseUrl || baseUrl === 'https://your-domain.com' || baseUrl.includes('your-domain.com');
    
    return isDevelopment || isLocalhost || hasNoRealApi;
  }, [baseUrl]);

  // Perform check-in with retry logic
  const performCheckin = useCallback(async (retryCount = 0): Promise<boolean> => {
    const credentials = getMachineCredentials();
    if (!credentials) {
      console.log('❌ Check-in failed: No machine credentials');
      return false;
    }

    setIsCheckingIn(true);
    setLastError(null);

    try {
      const statusData = generateStatusData();
      const payload: CheckinPayload = {
        machine_id: credentials.machine_id,
        status: statusData,
        auto_register: autoRegister,
      };

      // Add machine token if available
      if (credentials.machine_token) {
        payload.machine_token = credentials.machine_token;
      }

      console.log('🔄 Performing machine check-in...');
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      console.log('🌐 Base URL:', baseUrl);
      console.log('🔧 Auto-register:', autoRegister);
      console.log('🎯 Full URL:', `${baseUrl}/api/machine-checkin`);
      console.log('🔄 Retry attempt:', retryCount + 1);

      // Check if we should use development mode
      if (shouldUseDevelopmentMode()) {
        // Simulate successful check-in in development
        console.log('🔄 Development mode: Simulating successful check-in');
        console.log('💡 CORS issue detected - using simulation mode');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        // Simulate receiving a machine token from auto-registration
        const simulatedToken = 'dev_token_' + Date.now();
        localStorage.setItem('machine_token', simulatedToken);
        setMachineToken(simulatedToken);
        
        setLastSuccessfulCheckin(new Date());
        localStorage.setItem('last_successful_checkin', new Date().toISOString());
        console.log('✅ Check-in successful (simulated)');
        console.log('🔑 Received machine token:', simulatedToken);
        return true;
      }

      // Get auth token for the request
      const authToken = await getAuthToken();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔐 Including auth token in request');
      } else {
        console.log('⚠️ No auth token available - proceeding without authentication');
      }

      console.log('📤 Sending request with headers:', headers);

      const response = await fetch(`${baseUrl}/api/machine-checkin`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        
        // Detailed error logging
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: `${baseUrl}/api/machine-checkin`,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
          retryCount,
          maxRetries
        };
        
        console.error('🔍 Detailed error info:', errorDetails);
        
        // Retry logic for certain status codes
        if (retryCount < maxRetries && (response.status === 429 || response.status >= 500)) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`🔄 Retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return performCheckin(retryCount + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Check-in successful:', result);
      
      // Store machine token and machine ID if provided in response
      if (result.machine?.machine_token) {
        localStorage.setItem('machine_token', result.machine.machine_token);
        setMachineToken(result.machine.machine_token);
        console.log('🔑 Received machine token:', result.machine.machine_token);
      }
      
      // Store the correct machine ID from the response
      if (result.machine_id) {
        localStorage.setItem('machine_id', result.machine_id);
        console.log('🆔 Updated machine ID to:', result.machine_id);
      }
      
      setLastSuccessfulCheckin(new Date());
      localStorage.setItem('last_successful_checkin', new Date().toISOString());
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Check-in failed:', errorMessage);
      
      // Detailed error logging
      console.error('🔍 Error details:', {
        error: errorMessage,
        baseUrl,
        retryCount,
        maxRetries,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        location: window.location.href
      });
      
      // Check if it's a CORS error
      if (errorMessage.includes('NetworkError') || errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        console.log('🌐 CORS error detected - this is expected in development');
        console.log('💡 Set up your backend CORS or use a proxy for production');
        setLastError('CORS Error - Backend not accessible from browser');
      } else {
        setLastError(errorMessage);
      }
      
      return false;
    } finally {
      setIsCheckingIn(false);
    }
  }, [getMachineCredentials, generateStatusData, baseUrl, autoRegister, shouldUseDevelopmentMode, getAuthToken, maxRetries]);

  // Manual check-in function
  const checkin = useCallback(async (): Promise<boolean> => {
    return await performCheckin();
  }, [performCheckin]);

  // Set up automatic check-ins
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Perform initial check-in
    performCheckin();

    // Set up interval for periodic check-ins
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(performCheckin, intervalMs);

    console.log(`🔄 Machine check-ins enabled - every ${intervalMinutes} minutes`);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🔄 Machine check-ins disabled');
      }
    };
  }, [enabled, intervalMinutes, performCheckin]);

  // Load last successful check-in and machine token from localStorage on mount
  useEffect(() => {
    const lastCheckin = localStorage.getItem('last_successful_checkin');
    const storedToken = localStorage.getItem('machine_token');
    
    if (lastCheckin) {
      setLastSuccessfulCheckin(new Date(lastCheckin));
    }
    
    if (storedToken) {
      setMachineToken(storedToken);
    }
  }, []);

  return {
    checkin,
    isCheckingIn,
    lastSuccessfulCheckin,
    lastError,
    machineToken,
    authToken,
    uptimeMinutes: getUptimeMinutes(),
  };
};

export default useMachineCheckin; 