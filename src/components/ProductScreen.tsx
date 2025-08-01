import React, { useState, useEffect } from 'react';
import useMachineCheckin from '../hooks/useMachineCheckin';
import ApiTestPanel from './ApiTestPanel';
import MachineProductList from './MachineProductList';

interface ProductScreenProps {
  onReset?: () => void;
}

const ProductScreen: React.FC<ProductScreenProps> = ({ onReset }) => {
  // State for machine credentials
  const [machineId, setMachineId] = useState<string | null>(null);
  const [machineToken, setMachineToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [showApiTestPanel, setShowApiTestPanel] = useState(false);

  // Initialize machine check-in hook first
  const {
    checkin,
    isCheckingIn,
    lastSuccessfulCheckin,
    lastError,
    machineToken: hookMachineToken,
    authToken,
    uptimeMinutes,
  } = useMachineCheckin({
    intervalMinutes: 5,
    enabled: true,
    baseUrl: apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'https://vending-ai-nexus.vercel.app',
    autoRegister: true,
  });

  useEffect(() => {
    // Load machine credentials from localStorage
    const storedMachineId = localStorage.getItem('machine_id');
    const storedMachineToken = localStorage.getItem('machine_token');
    const storedApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://vending-ai-nexus.vercel.app';
    const manuallySetApiUrl = localStorage.getItem('api_base_url');
    
    console.log('🔍 Loading machine credentials...');
    console.log('📱 Machine ID:', storedMachineId);
    console.log('🔑 Machine Token:', storedMachineToken ? `${storedMachineToken.substring(0, 8)}...` : 'None');
    console.log('🌐 Environment API Base URL:', storedApiBaseUrl);
    console.log('🔧 Manually Set API URL:', manuallySetApiUrl);
    console.log('🎯 Final API Base URL:', manuallySetApiUrl || storedApiBaseUrl);
    
    setMachineId(storedMachineId);
    setMachineToken(storedMachineToken);
    setApiBaseUrl(manuallySetApiUrl || storedApiBaseUrl);
  }, []);

  // Update machine token when hook receives it
  useEffect(() => {
    if (hookMachineToken) {
      setMachineToken(hookMachineToken);
    }
  }, [hookMachineToken]);

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

  const handleSetApiUrl = () => {
    const url = prompt('Enter your API base URL:', apiBaseUrl || 'https://vending-ai-nexus.vercel.app');
    if (url) {
      localStorage.setItem('api_base_url', url);
      setApiBaseUrl(url);
      console.log('✅ API base URL set:', url);
    }
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('api_base_url');
    const defaultUrl = import.meta.env.VITE_API_BASE_URL || 'https://vending-ai-nexus.vercel.app';
    setApiBaseUrl(defaultUrl);
    console.log('✅ API base URL reset to default:', defaultUrl);
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

  const getStatusColor = () => {
    if (isCheckingIn) return 'text-yellow-400';
    if (lastError) return 'text-red-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (isCheckingIn) return 'Checking in...';
    if (lastError) return 'Error';
    return 'Online';
  };

  const isCorsError = lastError?.includes('CORS');

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

              {/* Machine Token Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Machine Token:</span>
                <span className={`font-mono text-sm ${machineToken ? 'text-green-400' : 'text-yellow-400'}`}>
                  {machineToken ? 'Present' : 'Auto-registering...'}
                </span>
              </div>

              {/* Auth Token Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Auth Token:</span>
                <span className={`font-mono text-sm ${authToken ? 'text-green-400' : 'text-yellow-400'}`}>
                  {authToken ? 'Present' : 'Not available'}
                </span>
              </div>

              {/* API Base URL */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">API Base URL:</span>
                <span className="text-white font-mono text-sm">
                  {apiBaseUrl || 'Not configured'}
                </span>
              </div>

              {/* Auto-Registration Status */}
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Auto-Registration:</span>
                <span className="text-green-400 font-semibold">Enabled</span>
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
                  <span className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* Error Display */}
              {lastError && (
                <div className="bg-red-600 text-white p-3 rounded-md text-sm">
                  <strong>Last Error:</strong> {lastError}
                  {isCorsError && (
                    <div className="mt-2 text-yellow-200">
                      💡 This is expected in development. Set up CORS on your backend for production.
                    </div>
                  )}
                </div>
              )}

              {/* Development Mode Info */}
              {isCorsError && (
                <div className="bg-blue-600 text-white p-3 rounded-md text-sm">
                  <strong>Development Mode:</strong> Using simulated check-ins due to CORS restrictions.
                  <br />
                  <span className="text-blue-200">✅ Machine check-ins are working (simulated)</span>
                </div>
              )}
            </div>

            {/* Configuration Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={handleSetApiUrl}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Set API URL
              </button>

              <button
                onClick={handleResetApiUrl}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Reset API URL to Default
              </button>

              <button
                onClick={handleManualCheckin}
                disabled={isCheckingIn}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:cursor-not-allowed"
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

              <button
                onClick={() => setShowApiTestPanel(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Test API Connection
              </button>
            </div>
          </div>

          {/* Product List */}
          <MachineProductList machineId={machineId || 'unknown'} />
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Debug Information</h3>
                      <div className="text-xs text-gray-400 space-y-1">
              <div>Machine ID: {machineId || 'None'}</div>
              <div>Machine Token: {machineToken ? `${machineToken.substring(0, 8)}...` : 'None'}</div>
              <div>Auth Token: {authToken ? `${authToken.substring(0, 8)}...` : 'None'}</div>
              <div>Environment API URL: {import.meta.env.VITE_API_BASE_URL || 'Not set'}</div>
              <div>Manual API URL: {localStorage.getItem('api_base_url') || 'Not set'}</div>
              <div>Current API URL: {apiBaseUrl || 'Not configured'}</div>
              <div>Auto-Registration: Enabled</div>
              <div>Check-in Interval: 5 minutes</div>
              <div>Auto Check-in: Enabled</div>
              <div>Last Successful: {lastSuccessfulCheckin?.toISOString() || 'Never'}</div>
              <div>Development Mode: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
              <div>CORS Error: {isCorsError ? 'Yes' : 'No'}</div>
              <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not set'}</div>
              <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Not set'}</div>
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

      {/* API Test Panel */}
      {showApiTestPanel && (
        <ApiTestPanel onClose={() => setShowApiTestPanel(false)} />
      )}
    </div>
  );
};

export default ProductScreen; 