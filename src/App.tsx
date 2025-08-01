import { useState, useEffect } from 'react';
import MachinePairingScreen from './components/MachinePairingScreen';
import ProductScreen from './components/ProductScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'pairing' | 'products'>('pairing');

  useEffect(() => {
    // Check if machine is already paired
    const machineId = localStorage.getItem('machine_id');
    const machineToken = localStorage.getItem('machine_token');
    
    if (machineId && machineToken) {
      setCurrentScreen('products');
    }
  }, []);

  return (
    <div className="App">
      {currentScreen === 'pairing' ? (
        <MachinePairingScreen onPairingComplete={() => setCurrentScreen('products')} />
      ) : (
        <ProductScreen onReset={() => setCurrentScreen('pairing')} />
      )}
    </div>
  );
}

export default App;
