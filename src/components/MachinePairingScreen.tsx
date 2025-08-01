import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if credentials are available
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface PairingData {
  pairing_code: string;
  link_id: string;
}

interface MachineData {
  machine_id: string;
  machine_token: string;
}

interface MachinePairingScreenProps {
  onPairingComplete?: () => void;
}

const MachinePairingScreen: React.FC<MachinePairingScreenProps> = ({ onPairingComplete }) => {
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Check if machine is already paired
  const checkExistingPairing = useCallback(() => {
    const machineId = localStorage.getItem('machine_id');
    const machineToken = localStorage.getItem('machine_token');
    
    if (machineId && machineToken) {
      // Notify parent component to switch to product screen
      onPairingComplete?.();
      return true;
    }
    return false;
  }, [onPairingComplete]);

  // Create pending machine link
  const createPendingMachineLink = useCallback(async () => {
    if (!supabase) {
      // Demo mode - generate a mock pairing code for testing
      setIsLoading(true);
      setTimeout(() => {
        const mockPairingCode = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingData({
          pairing_code: mockPairingCode,
          link_id: 'demo-link-id'
        });
        setIsPolling(true);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Calling create_pending_machine_link...');
      const { data, error } = await supabase.rpc('create_pending_machine_link');
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        console.log('Setting pairing data:', data[0]);
        setPairingData(data[0]);
        setIsPolling(true);
      } else {
        console.log('No data returned from RPC');
        setError('No pairing data returned from server');
      }
    } catch (err) {
      console.error('Error creating pairing link:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pairing code');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Poll for machine pairing
  const pollForMachinePairing = useCallback(async () => {
    if (!pairingData?.pairing_code) return;

    // Demo mode - simulate pairing after 10 seconds
    if (!supabase) {
      const demoStartTime = localStorage.getItem('demo_start_time');
      if (!demoStartTime) {
        localStorage.setItem('demo_start_time', Date.now().toString());
        return;
      }
      
      const elapsed = Date.now() - parseInt(demoStartTime);
      if (elapsed > 10000) { // 10 seconds
        localStorage.setItem('machine_id', 'demo-machine-id');
        localStorage.setItem('machine_token', 'demo-machine-token');
        localStorage.removeItem('demo_start_time');
        setIsPolling(false);
        onPairingComplete?.();
      }
      return;
    }

    try {
      console.log('Polling for pairing with code:', pairingData.pairing_code);
      const { data, error } = await supabase.rpc('get_machine_id_by_pairing_code', {
        code: pairingData.pairing_code
      });

      console.log('Polling response:', { data, error });

      if (error) {
        console.error('Polling error:', error);
        return;
      }

      // Check if we got a valid response with machine data
      if (data && Array.isArray(data) && data.length > 0) {
        const machineData = data[0];
        console.log('Machine data received:', machineData);
        
        if (machineData.machine_id && machineData.machine_token) {
          console.log('✅ Pairing successful! Storing credentials...');
          
          // Store machine data in localStorage
          localStorage.setItem('machine_id', machineData.machine_id);
          localStorage.setItem('machine_token', machineData.machine_token);
          
          // Stop polling
          setIsPolling(false);
          
          console.log('✅ Credentials stored, redirecting to product screen...');
          
          // Notify parent component to switch to product screen
          onPairingComplete?.();
        } else {
          console.log('No machine data found yet, continuing to poll...');
        }
      } else {
        console.log('No pairing data found yet, continuing to poll...');
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }, [pairingData?.pairing_code, supabase, onPairingComplete]);

  // Reset pairing process
  const resetPairing = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Initialize component
  useEffect(() => {
    if (!checkExistingPairing()) {
      createPendingMachineLink();
    }
  }, [checkExistingPairing, createPendingMachineLink]);

  // Set up polling
  useEffect(() => {
    if (!isPolling || !pairingData?.pairing_code) return;

    const pollInterval = setInterval(pollForMachinePairing, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isPolling, pairingData?.pairing_code, pollForMachinePairing]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing pairing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-600 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Pairing Error</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={createPendingMachineLink}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Machine Pairing</h1>
          <p className="text-gray-300 text-lg">
            Scan this code or enter the pairing code in your dashboard to link this machine
          </p>
          {!supabase && (
            <div className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg inline-block">
              <span className="font-semibold">Demo Mode:</span> No Supabase credentials configured
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          {/* Pairing Code Display */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Pairing Code</h2>
            <div className="bg-gray-700 rounded-lg p-6 inline-block">
              <div className="text-6xl font-mono font-bold text-blue-400 tracking-wider">
                {pairingData?.pairing_code || 'Loading...'}
              </div>
            </div>
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-400">
              Debug: pairingData = {JSON.stringify(pairingData)}
            </div>
          </div>

          {/* QR Code */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">QR Code</h2>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG
                value={`https://admin.nextgenvending.com/pair?code=${pairingData?.pairing_code}`}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-400">Waiting for pairing...</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
            <ol className="text-gray-300 text-left space-y-2">
              <li>1. Open your admin dashboard</li>
              <li>2. Navigate to the machine pairing section</li>
              <li>3. Scan the QR code or enter the 6-digit pairing code</li>
              <li>4. This machine will automatically connect once paired</li>
            </ol>
          </div>

          {/* Debug Button */}
          <div className="mt-8">
            <button
              onClick={resetPairing}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Reset Pairing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachinePairingScreen; 