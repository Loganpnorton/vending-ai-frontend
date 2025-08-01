import { useState, useEffect, useCallback, useRef } from 'react';

interface StatusData {
  battery: number;
  stock_level: number;
  temperature: number;
  errors: string[];
  uptime_minutes: number;
}

interface CheckinPayload {
  machine_id: string;
  status: StatusData;
}

interface UseMachineCheckinOptions {
  intervalMinutes?: number;
  enabled?: boolean;
  baseUrl?: string;
  authToken?: string;
}

const useMachineCheckin = (options: UseMachineCheckinOptions = {}) => {
  const { 
    intervalMinutes = 5, 
    enabled = true,
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://your-domain.com',
    authToken = localStorage.getItem('auth_token') || ''
  } = options;
  
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastSuccessfulCheckin, setLastSuccessfulCheckin] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const uptimeStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get machine credentials from localStorage
  const getMachineCredentials = useCallback((): { machine_id: string } | null => {
    const machineId = localStorage.getItem('machine_id');
    
    if (!machineId) {
      console.log('❌ No machine ID found in localStorage');
      return null;
    }
    
    return { machine_id: machineId };
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
      battery: 100, // Hardcoded for now
      stock_level: 0, // Stub - could be calculated from product data
      temperature: 37, // Stub temperature
      errors: [], // Empty unless real error logic is implemented
      uptime_minutes: getUptimeMinutes(),
    };
  }, [getUptimeMinutes]);

  // Perform check-in
  const performCheckin = useCallback(async (): Promise<boolean> => {
    const credentials = getMachineCredentials();
    if (!credentials) {
      console.log('❌ Check-in failed: No machine credentials');
      return false;
    }

    if (!authToken) {
      console.log('❌ Check-in failed: No authentication token');
      setLastError('Authentication token required');
      return false;
    }

    setIsCheckingIn(true);
    setLastError(null);

    try {
      const statusData = generateStatusData();
      const payload: CheckinPayload = {
        machine_id: credentials.machine_id,
        status: statusData,
      };

      console.log('🔄 Performing machine check-in...');
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      console.log('🔑 Auth Token:', authToken ? `${authToken.substring(0, 8)}...` : 'None');
      console.log('🌐 Base URL:', baseUrl);

      // Check if we're in development mode (no API endpoint)
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment && !baseUrl.includes('your-domain.com')) {
        // Simulate successful check-in in development
        console.log('🔄 Development mode: Simulating successful check-in');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        setLastSuccessfulCheckin(new Date());
        localStorage.setItem('last_successful_checkin', new Date().toISOString());
        console.log('✅ Check-in successful (simulated)');
        return true;
      }

      const response = await fetch(`${baseUrl}/api/machine-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Check-in successful:', result);
      
      setLastSuccessfulCheckin(new Date());
      localStorage.setItem('last_successful_checkin', new Date().toISOString());
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Check-in failed:', errorMessage);
      setLastError(errorMessage);
      return false;
    } finally {
      setIsCheckingIn(false);
    }
  }, [getMachineCredentials, generateStatusData, authToken, baseUrl]);

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

  // Load last successful check-in from localStorage on mount
  useEffect(() => {
    const lastCheckin = localStorage.getItem('last_successful_checkin');
    if (lastCheckin) {
      setLastSuccessfulCheckin(new Date(lastCheckin));
    }
  }, []);

  return {
    checkin,
    isCheckingIn,
    lastSuccessfulCheckin,
    lastError,
    uptimeMinutes: getUptimeMinutes(),
  };
};

export default useMachineCheckin; 