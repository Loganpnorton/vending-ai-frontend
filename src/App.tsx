import { useState, useEffect } from 'react';
import MachinePairingScreen from './components/MachinePairingScreen';
import ProductScreen from './components/ProductScreen';
import UserMachineProductsDemo from './components/UserMachineProductsDemo';
import AuthWrapper from './components/AuthWrapper';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'pairing' | 'products' | 'user-products'>('pairing');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if machine is already paired
    const machineId = localStorage.getItem('machine_id');
    const machineToken = localStorage.getItem('machine_token');
    
    if (machineId && machineToken) {
      setCurrentScreen('products');
    }

    // Check for deep link with pairing code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setPairingCode(code);
    }

    // Check for user products demo route
    if (window.location.pathname === '/user-products') {
      setCurrentScreen('user-products');
    }

    setIsLoading(false);
  }, []);

  // Handle pairing completion
  const handlePairingComplete = () => {
    setCurrentScreen('products');
  };

  // Handle reset
  const handleReset = () => {
    localStorage.clear();
    setCurrentScreen('pairing');
    setPairingCode(null);
  };

  // Handle navigation
  const handleNavigateToUserProducts = () => {
    setCurrentScreen('user-products');
  };

  const handleNavigateToPairing = () => {
    setCurrentScreen('pairing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Navigation component
  const Navigation = () => (
    <div className="bg-white shadow-sm border-b px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Vending Machine UI</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleNavigateToPairing}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentScreen === 'pairing' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Machine Pairing
          </button>
          <button
            onClick={() => setCurrentScreen('products')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentScreen === 'products' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Product Sync
          </button>
          <button
            onClick={handleNavigateToUserProducts}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentScreen === 'user-products' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Machine Products
          </button>
        </div>
      </div>
    </div>
  );

  // Render different screens
  if (currentScreen === 'user-products') {
    return (
      <div className="App">
        <Navigation />
        <UserMachineProductsDemo />
      </div>
    );
  }

  if (currentScreen === 'products') {
    return (
      <div className="App">
        <Navigation />
        <ProductScreen onReset={handleReset} />
      </div>
    );
  }

  // For pairing screen, require authentication
  return (
    <div className="App">
      <Navigation />
      <AuthWrapper 
        redirectUrl={pairingCode ? `/machines/pair?code=${pairingCode}` : undefined}
      >
        <MachinePairingScreen 
          onPairingComplete={handlePairingComplete}
          initialPairingCode={pairingCode}
        />
      </AuthWrapper>
    </div>
  );
}

export default App;
