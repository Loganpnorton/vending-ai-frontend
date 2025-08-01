import React from 'react';

interface ProductScreenProps {
  onReset?: () => void;
}

const ProductScreen: React.FC<ProductScreenProps> = ({ onReset }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Product Screen</h1>
        <p className="text-gray-300 text-lg mb-6">
          Machine successfully paired! This is the placeholder product screen.
        </p>
        <div className="bg-gray-800 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-white mb-4">Machine Info</h2>
          <div className="text-left text-gray-300 space-y-2">
            <p><strong>Machine ID:</strong> {localStorage.getItem('machine_id')}</p>
            <p><strong>Token:</strong> {localStorage.getItem('machine_token')?.substring(0, 20)}...</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            onReset?.();
          }}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Reset Machine
        </button>
      </div>
    </div>
  );
};

export default ProductScreen; 