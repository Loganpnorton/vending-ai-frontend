import { useState, useEffect, useCallback, useRef } from 'react';

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
}

const useMachineCheckin = (options: UseMachineCheckinOptions = {}) => {
  const { 
    intervalMinutes = 5, 
    enabled = true,
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-domain.com',
    autoRegister = true
  } = options;
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastSuccessfulCheckin, setLastSuccessfulCheckin] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [machineToken, setMachineToken] = useState<string | null>(null);
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

  // Perform check-in
  const performCheckin = useCallback(async (): Promise<boolean> => {
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

      const response = await fetch(`${baseUrl}/api/machine-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Check-in successful:', result);
      
      // Store machine token if provided in response
      if (result.machine?.machine_token) {
        localStorage.setItem('machine_token', result.machine.machine_token);
        setMachineToken(result.machine.machine_token);
        console.log('🔑 Received machine token:', result.machine.machine_token);
      }
      
      setLastSuccessfulCheckin(new Date());
      localStorage.setItem('last_successful_checkin', new Date().toISOString());
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Check-in failed:', errorMessage);
      
      // Check if it's a CORS error
      if (errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
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
  }, [getMachineCredentials, generateStatusData, baseUrl, autoRegister, shouldUseDevelopmentMode]);

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
    uptimeMinutes: getUptimeMinutes(),
  };
};

export default useMachineCheckin; 