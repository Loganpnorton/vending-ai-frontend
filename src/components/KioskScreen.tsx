import React, { useState, useEffect } from 'react';
import KioskInterface from './KioskInterface';
import MachinePairingScreen from './MachinePairingScreen';

const KioskScreen: React.FC = () => {
  const [machineId, setMachineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if machine is already paired
    const storedMachineId = localStorage.getItem('machine_id');
    const storedMachineToken = localStorage.getItem('machine_token');
    
    if (storedMachineId && storedMachineToken) {
      setMachineId(storedMachineId);
    }

    setIsLoading(false);
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
