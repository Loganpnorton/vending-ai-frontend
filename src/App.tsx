
import { VendingMachine } from './components/VendingMachine';
import './App.css';

// Sample product data for demonstration
const sampleProducts = [
  {
    id: '1',
    name: 'Coca-Cola Classic',
    price: 2.50,
    image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop',
    stock_level: 5,
    slot_position: 'A1',
    machineOffline: false
  },
  {
    id: '2',
    name: 'Pepsi Max',
    price: 2.25,
    image_url: 'https://images.unsplash.com/photo-1554866585-aa9f0b1b0b8c?w=400&h=400&fit=crop',
    stock_level: 0,
    slot_position: 'A2',
    machineOffline: false
  },
  {
    id: '3',
    name: 'Snickers Bar',
    price: 1.75,
    image_url: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400&h=400&fit=crop',
    stock_level: 8,
    slot_position: 'B1',
    machineOffline: false
  },
  {
    id: '4',
    name: 'Doritos Nacho Cheese',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1600952841116-611392152d1f?w=400&h=400&fit=crop',
    stock_level: 3,
    slot_position: 'B2',
    machineOffline: false
  },
  {
    id: '5',
    name: 'Water Bottle',
    price: 1.50,
    image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
    stock_level: 12,
    slot_position: 'C1',
    machineOffline: false
  },
  {
    id: '6',
    name: 'KitKat Chunky',
    price: 2.00,
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    stock_level: 0,
    slot_position: 'C2',
    machineOffline: false
  }
];

function App() {
  const handleBuyProduct = (productId: string) => {
    console.log('Buy clicked for product:', productId);
  };

  const handlePurchaseConfirm = (productId: string) => {
    console.log('Purchase confirmed for product:', productId);
  };

  return (
    <VendingMachine
      machineName="Vending Machine"
      machineCode="VM-6229-018"
      isOnline={true}
      lastSync="2 minutes ago"
      battery={85}
      products={sampleProducts}
      lastCheckin="2 minutes ago"
      apiDomain="api.nextgenvending.com"
      onBuyProduct={handleBuyProduct}
      onPurchaseConfirm={handlePurchaseConfirm}
    />
  );
}

export default App;
