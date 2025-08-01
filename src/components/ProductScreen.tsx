import React, { useState, useEffect } from 'react';
import useMachineCheckin from '../hooks/useMachineCheckin';

interface ProductScreenProps {
  onReset?: () => void;
}

const ProductScreen: React.FC<ProductScreenProps> = ({ onReset }) => {
  // Initialize machine check-in hook first
  const {
    checkin,
    isCheckingIn,
    lastSuccessfulCheckin,
    lastError,
    uptimeMinutes,
  } = useMachineCheckin({
    intervalMinutes: 5,
    enabled: true,
  });

  // State for machine credentials
  const [machineId, setMachineId] = useState<string | null>(null);
  const [machineToken, setMachineToken] = useState<string | null>(null);

  useEffect(() => {
    // Load machine credentials from localStorage
    const storedMachineId = localStorage.getItem('machine_id');
    const storedMachineToken = localStorage.getItem('machine_token');
    
    setMachineId(storedMachineId);
    setMachineToken(storedMachineToken);
  }, []);

  const handleReset = () => {
    localStorage.clear();
    onReset?.();
  };

  const handleManualCheckin = async () => {
    const success = await checkin();
    if (success) {
      console.log('✅ Manual check-in successful');
    } else {
      console.log('❌ Manual check-in failed');
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const formatUptime = (minutes: number): string => {
    if (isNaN(minutes) || minutes < 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Vending Machine</h1>
          <p className="text-gray-300 text-lg">
            Machine is paired and ready for operation
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Machine Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Machine Status</h2>
            
            <div className="space-y-4">
              {/* Machine ID */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Machine ID:</span>
                <span className="text-white font-mono text-sm">{machineId || 'Unknown'}</span>
              </div>

              {/* Uptime */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Uptime:</span>
                <span className="text-green-400 font-mono">{formatUptime(uptimeMinutes)}</span>
              </div>

              {/* Check-in Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Last Check-in:</span>
                <span className={`font-mono text-sm ${lastSuccessfulCheckin ? 'text-green-400' : 'text-red-400'}`}>
                  {formatTime(lastSuccessfulCheckin)}
                </span>
              </div>

              {/* Check-in Status Indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-300">Status:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isCheckingIn ? 'bg-yellow-500 animate-pulse' : lastError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`text-sm ${isCheckingIn ? 'text-yellow-400' : lastError ? 'text-red-400' : 'text-green-400'}`}>
                    {isCheckingIn ? 'Checking in...' : lastError ? 'Error' : 'Online'}
                  </span>
                </div>
              </div>

              {/* Error Display */}
              {lastError && (
                <div className="bg-red-600 text-white p-3 rounded-md text-sm">
                  <strong>Last Error:</strong> {lastError}
                </div>
              )}
            </div>

            {/* Manual Check-in Button */}
            <div className="mt-6">
              <button
                onClick={handleManualCheckin}
                disabled={isCheckingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:cursor-not-allowed"
              >
                {isCheckingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking in...
                  </div>
                ) : (
                  'Manual Check-in'
                )}
              </button>
            </div>
          </div>

          {/* Product Display (Placeholder) */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Products</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Sample Product</h3>
                <p className="text-gray-300 text-sm mb-2">A delicious beverage</p>
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">$2.50</span>
                  <span className="text-gray-400 text-sm">In Stock</span>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Another Product</h3>
                <p className="text-gray-300 text-sm mb-2">A tasty snack</p>
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">$1.75</span>
                  <span className="text-gray-400 text-sm">In Stock</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Product selection and purchase functionality coming soon...
              </p>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Debug Information</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Machine Token: {machineToken ? `${machineToken.substring(0, 8)}...` : 'None'}</div>
            <div>Check-in Interval: 5 minutes</div>
            <div>Auto Check-in: Enabled</div>
            <div>Last Successful: {lastSuccessfulCheckin?.toISOString() || 'Never'}</div>
            <div>Development Mode: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition duration-200"
          >
            Reset Pairing
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductScreen; 