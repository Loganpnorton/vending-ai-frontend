import React, { useState } from 'react';

interface ApiTestPanelProps {
  onClose: () => void;
}

const ApiTestPanel: React.FC<ApiTestPanelProps> = ({ onClose }) => {
  const [testUrl, setTestUrl] = useState('https://vending-ai-nexus.vercel.app');
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testApiConnection = async () => {
    setIsTesting(true);
    setTestResult('Testing...');

    try {
      console.log('🧪 Testing API connection to:', testUrl);
      
      const response = await fetch(`${testUrl}/api/machine-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machine_id: 'test-machine',
          status: {
            name: 'Test Machine',
            location: 'Test Location',
            battery: 100,
            stock_level: 0,
            temperature: 37,
            errors: [],
            uptime_minutes: 0,
            last_maintenance: new Date().toISOString().split('T')[0],
          },
          auto_register: true,
        }),
      });

      const responseText = await response.text();
      
      console.log('📥 Test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      });

      if (response.ok) {
        setTestResult(`✅ SUCCESS (${response.status})\n\nResponse:\n${responseText}`);
      } else {
        setTestResult(`❌ ERROR (${response.status})\n\nResponse:\n${responseText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Test failed:', error);
      setTestResult(`❌ CONNECTION FAILED\n\nError:\n${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testWithAuth = async () => {
    setIsTesting(true);
    setTestResult('Testing with auth...');

    try {
      // Get Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setTestResult('❌ SUPABASE NOT CONFIGURED\n\nPlease set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Get auth token
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setTestResult(`❌ AUTH ERROR\n\nError:\n${error.message}`);
        return;
      }

      if (!session?.access_token) {
        setTestResult('❌ NO AUTH SESSION\n\nPlease log in via Supabase authentication');
        return;
      }

      console.log('🧪 Testing API with auth token...');
      
      const response = await fetch(`${testUrl}/api/machine-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          machine_id: 'test-machine',
          status: {
            name: 'Test Machine',
            location: 'Test Location',
            battery: 100,
            stock_level: 0,
            temperature: 37,
            errors: [],
            uptime_minutes: 0,
            last_maintenance: new Date().toISOString().split('T')[0],
          },
          auto_register: true,
        }),
      });

      const responseText = await response.text();
      
      console.log('📥 Auth test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      });

      if (response.ok) {
        setTestResult(`✅ AUTH SUCCESS (${response.status})\n\nResponse:\n${responseText}`);
      } else {
        setTestResult(`❌ AUTH ERROR (${response.status})\n\nResponse:\n${responseText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Auth test failed:', error);
      setTestResult(`❌ AUTH CONNECTION FAILED\n\nError:\n${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">API Test Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              API Base URL:
            </label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              placeholder="https://your-backend.com"
            />
          </div>

          {/* Test Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={testApiConnection}
              disabled={isTesting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded"
            >
              {isTesting ? 'Testing...' : 'Test Without Auth'}
            </button>
            
            <button
              onClick={testWithAuth}
              disabled={isTesting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded"
            >
              {isTesting ? 'Testing...' : 'Test With Auth'}
            </button>
          </div>

          {/* Result Display */}
          {testResult && (
            <div className="bg-gray-700 rounded p-4">
              <h3 className="text-white font-medium mb-2">Test Result:</h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {testResult}
              </pre>
            </div>
          )}

          {/* Quick Test URLs */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-white font-medium mb-2">Quick Test URLs:</h3>
            <div className="space-y-2">
              <button
                onClick={() => setTestUrl('http://localhost:3000')}
                className="block w-full text-left text-blue-400 hover:text-blue-300 text-sm"
              >
                🏠 Local Development: http://localhost:3000
              </button>
              <button
                onClick={() => setTestUrl('https://vending-ai-nexus.vercel.app')}
                className="block w-full text-left text-blue-400 hover:text-blue-300 text-sm"
              >
                ☁️ Vercel Deployment: https://vending-ai-nexus.vercel.app
              </button>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-white font-medium mb-2">Environment Info:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <div>VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL || 'Not set'}</div>
              <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}</div>
              <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</div>
              <div>Development Mode: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
              <div>Current Hostname: {window.location.hostname}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPanel; 