import { useState } from 'react';
import { Header } from './Header';
import { ProductGrid } from './ProductGrid';
import { EmptyState } from './EmptyState';
import { StatusBar } from './StatusBar';
import { PurchaseModal } from './PurchaseModal';

interface ProductUI {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_level: number;
  slot_position?: string;
  machineOffline: boolean;
}

interface VendingMachineProps {
  // Header props
  machineName: string;
  machineCode: string;
  isOnline: boolean;
  lastSync: string;
  battery: number;
  
  // Product data
  products: ProductUI[];
  
  // Status bar props
  lastCheckin: string;
  apiDomain: string;
  
  // Callbacks
  onBuyProduct: (productId: string) => void;
  onPurchaseConfirm: (productId: string) => void;
}

export function VendingMachine({
  machineName,
  machineCode,
  isOnline,
  lastSync,
  battery,
  products,
  lastCheckin,
  apiDomain,
  onBuyProduct,
  onPurchaseConfirm
}: VendingMachineProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductUI | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBuyClick = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
    onBuyProduct(productId);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handlePurchaseConfirm = () => {
    if (selectedProduct) {
      onPurchaseConfirm(selectedProduct.id);
      handleModalClose();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-[#E6E8EE]">
      <Header
        name={machineName}
        code={machineCode}
        online={isOnline}
        lastSync={lastSync}
        battery={battery}
      />
      
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        {products.length > 0 ? (
          <ProductGrid
            products={products}
            onBuy={handleBuyClick}
          />
        ) : (
          <EmptyState />
        )}
      </main>
      
      <StatusBar
        machineCode={machineCode}
        lastCheckin={lastCheckin}
        apiDomain={apiDomain}
      />
      
      <PurchaseModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handlePurchaseConfirm}
      />
    </div>
  );
} 