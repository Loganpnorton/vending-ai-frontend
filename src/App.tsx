import { useState, useEffect } from 'react';
import MachinePairingScreen from './components/MachinePairingScreen';
import ProductScreen from './components/ProductScreen';
import AuthWrapper from './components/AuthWrapper';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'pairing' | 'products'>('pairing');
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

  // If user is already paired, show product screen without auth
  if (currentScreen === 'products') {
    return (
      <div className="App">
        <ProductScreen onReset={handleReset} />
      </div>
    );
  }

  // For pairing screen, require authentication
  return (
    <div className="App">
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
