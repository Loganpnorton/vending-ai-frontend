import React from 'react';

const OfflineOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-red-900 bg-opacity-95 flex items-center justify-center z-40">
      <div className="text-center p-8">
        <div className="text-red-400 text-8xl mb-6 animate-pulse">
          ⚠️
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Machine Offline
        </h1>
        <p className="text-red-200 text-xl mb-6">
          This machine is currently offline and cannot process purchases.
        </p>
        <div className="bg-red-800 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-white mb-2">
            What you can do:
          </h2>
          <ul className="text-red-200 text-sm space-y-2 text-left">
            <li>• Try again in a few minutes</li>
            <li>• Contact support if the issue persists</li>
            <li>• Look for another machine nearby</li>
          </ul>
        </div>
        <div className="mt-6 text-red-300 text-sm">
          <p>Last sync: More than 2 minutes ago</p>
          <p>Please wait for the machine to come back online</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineOverlay;
