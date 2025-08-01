import React, { useState } from 'react';
import ProductSyncGrid from './ProductSyncGrid';

const ProductSyncDemo: React.FC = () => {
  const [machineId, setMachineId] = useState<string>('');
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (machineId.trim()) {
      setShowDemo(true);
    }
  };

  const handleReset = () => {
    setMachineId('');
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Product Sync Demo</h1>
          <p className="text-gray-300 text-lg">
            Test the product sync functionality with different machine IDs
          </p>
        </div>

        {!showDemo ? (
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">Configure Demo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="machineId" className="block text-gray-300 text-sm font-medium mb-2">
                  Machine ID
                </label>
                <input
                  type="text"
                  id="machineId"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  placeholder="Enter machine UUID or 'demo' for testing"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use a valid UUID or 'demo' to test with mock data
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                Load Products
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-900/20 rounded-md">
              <h3 className="text-blue-300 font-semibold mb-2">Demo Instructions</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Enter a valid machine UUID to test with real data</li>
                <li>• Enter 'demo' to test with mock data</li>
                <li>• Leave empty to test error handling</li>
                <li>• Check browser console for detailed logs</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-900/20 rounded-md">
              <h3 className="text-yellow-300 font-semibold mb-2">Configuration Required</h3>
              <p className="text-yellow-200 text-sm">
                Make sure to set up your Supabase environment variables:
              </p>
              <code className="block mt-2 text-xs bg-gray-700 p-2 rounded">
                VITE_SUPABASE_URL=your_project_url<br/>
                VITE_SUPABASE_ANON_KEY=your_anon_key
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Machine: {machineId}</h2>
                <p className="text-gray-400">Product inventory for the selected machine</p>
              </div>
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Change Machine
              </button>
            </div>

            <ProductSyncGrid machineId={machineId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSyncDemo; 