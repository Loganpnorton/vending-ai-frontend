import React, { useState, useEffect } from 'react';
import KioskInterface from './KioskInterface';
import MachinePairingScreen from './MachinePairingScreen';
import useMachineCheckin from '../hooks/useMachineCheckin';

const KioskScreen: React.FC = () => {
  const [machineId, setMachineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize machine check-in to get proper UUID
  const { checkin } = useMachineCheckin({
    intervalMinutes: 5,
    enabled: false, // Don't auto-start, we'll trigger manually
    autoRegister: true,
  });

  useEffect(() => {
    // Check if machine is already paired
    const storedMachineId = localStorage.getItem('machine_id');
    const storedMachineToken = localStorage.getItem('machine_token');
    
    if (storedMachineId && storedMachineToken) {
      // If we have a machine ID that's not a UUID, trigger a check-in to get the proper UUID
      if (!storedMachineId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('🔄 Machine ID is not a UUID, triggering check-in to get proper ID...');
        checkin().then((success) => {
          if (success) {
            const newMachineId = localStorage.getItem('machine_id');
            if (newMachineId && newMachineId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              console.log('✅ Got proper UUID:', newMachineId);
              setMachineId(newMachineId);
            }
          }
          setIsLoading(false);
        });
      } else {
        setMachineId(storedMachineId);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [checkin]);

  // Listen for machine ID updates from check-in
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'machine_id' && e.newValue) {
        console.log('🔄 Machine ID updated from storage:', e.newValue);
        setMachineId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handlePairingComplete = (machineId?: string) => {
    if (machineId) {
      setMachineId(machineId);
    }
  };

  const handleReset = () => {
    localStorage.clear();
    setMachineId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing kiosk...</p>
        </div>
      </div>
    );
  }

  // If no machine is paired, show pairing screen
  if (!machineId) {
    return (
      <div className="min-h-screen bg-gray-900">
        <MachinePairingScreen 
          onPairingComplete={handlePairingComplete}
          isKioskMode={true}
        />
      </div>
    );
  }

  // Show kiosk interface
  return (
    <div className="min-h-screen bg-gray-900">
      <KioskInterface machineId={machineId} />
      
      {/* Admin Controls (hidden by default, can be shown with keyboard shortcut) */}
      <div className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          title="Reset Machine Pairing (Admin)"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default KioskScreen;
