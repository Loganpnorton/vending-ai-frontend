import React, { useState, useEffect } from 'react';
import useMachineData from '../hooks/useMachineData';
import usePurchase from '../hooks/usePurchase';
import type { MachineProduct } from '../lib/supabase';
import ProductModal from './ProductModal';
import PurchaseSuccessModal from './PurchaseSuccessModal';
import OfflineOverlay from './OfflineOverlay';
import PaymentModal from './PaymentModal';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';

interface KioskInterfaceProps {
  machineId: string;
}

const KioskInterface: React.FC<KioskInterfaceProps> = ({ machineId }) => {
  const [selectedProduct, setSelectedProduct] = useState<MachineProduct | null>(null);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    machine,
    products,
    loading,
    error,
    isOnline,
    lastSyncMinutes,
  } = useMachineData({
    machineId,
    autoRefresh: true,
    refreshInterval: 30,
  });

  const {
    purchaseProduct,
    resetPurchase,
    isProcessing,
    error: purchaseError,
    lastPurchase,
  } = usePurchase({
    machineId,
    onSuccess: () => {
      setShowPurchaseSuccess(true);
      setSelectedProduct(null);
      setShowPaymentModal(false);
    },
    onError: (error) => {
      console.error('Purchase error:', error);
    },
  });

  // Auto-hide purchase success modal after 5 seconds
  useEffect(() => {
    if (showPurchaseSuccess) {
      const timer = setTimeout(() => {
        setShowPurchaseSuccess(false);
        resetPurchase();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPurchaseSuccess, resetPurchase]);

  const handleProductClick = (product: MachineProduct) => {
    if (!isOnline) return; // Don't allow interaction when offline
    setSelectedProduct(product);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;
    
    // Show payment modal first
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentMethod: string) => {
    if (!selectedProduct) return;
    
    console.log('Payment completed with method:', paymentMethod);
    const success = await purchaseProduct(selectedProduct);
    if (success) {
      setSelectedProduct(null);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockStatus = (stockLevel: number): { text: string; color: string; icon: string } => {
    if (stockLevel <= 0) {
      return { text: 'Out of Stock', color: 'text-red-500', icon: '❌' };
    } else if (stockLevel <= 3) {
      return { text: `Only ${stockLevel} left!`, color: 'text-orange-500', icon: '⚠️' };
    } else {
      return { text: 'In Stock', color: 'text-green-500', icon: '✅' };
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.product?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.product?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.product?.category).filter(Boolean) as string[]))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading vending machine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Machine</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-yellow-500 text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-white mb-2">Machine Not Found</h1>
          <p className="text-gray-300">The specified machine could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Offline Overlay */}
      {!isOnline && <OfflineOverlay />}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{machine.name}</h1>
              <p className="text-gray-300 text-sm">Machine Code: {machine.code}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-gray-400 text-xs">
                Last sync: {lastSyncMinutes} minutes ago
              </p>
              {machine.battery !== undefined && (
                <p className="text-gray-400 text-xs">
                  Battery: {machine.battery}%
                </p>
              )}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
            />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Products Found</h2>
            <p className="text-gray-400">
              {searchQuery ? `No products match "${searchQuery}"` : 'This machine is currently empty.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}

        {/* Product Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_level);
              const isOutOfStock = product.stock_level <= 0;
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`
                    bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${isOnline && !isOutOfStock 
                      ? 'hover:bg-gray-700 hover:scale-105 active:scale-95' 
                      : 'opacity-60 cursor-not-allowed'
                    }
                    ${isOutOfStock ? 'grayscale' : ''}
                  `}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative">
                    {product.product?.image_url ? (
                      <img
                        src={product.product.image_url}
                        alt={product.product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="text-4xl text-gray-500 hidden">
                      {product.product?.name?.charAt(0) || '?'}
                    </div>
                    
                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs">{stockStatus.icon}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-sm line-clamp-2">
                      {product.product?.name || 'Unknown Product'}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-400">
                        {formatPrice(product.product?.price || 0)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {product.slot_position}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                      <span className="text-xs text-gray-400">
                        {product.stock_level}/{product.max_stock_level}
                      </span>
                    </div>

                    {product.product?.category && (
                      <div className="text-xs text-gray-400">
                        {product.product.category}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_level);
              const isOutOfStock = product.stock_level <= 0;
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`
                    bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${isOnline && !isOutOfStock 
                      ? 'hover:bg-gray-700' 
                      : 'opacity-60 cursor-not-allowed'
                    }
                    ${isOutOfStock ? 'grayscale' : ''}
                  `}
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.product?.image_url ? (
                        <img
                          src={product.product.image_url}
                          alt={product.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">
                          {product.product?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg">
                        {product.product?.name || 'Unknown Product'}
                      </h3>
                      {product.product?.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {product.product.description}
                        </p>
                      )}
                      {product.product?.category && (
                        <p className="text-gray-500 text-xs">
                          {product.product.category}
                        </p>
                      )}
                    </div>

                    {/* Price and Stock */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">
                        {formatPrice(product.product?.price || 0)}
                      </div>
                      <div className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </div>
                      <div className="text-xs text-gray-400">
                        Slot {product.slot_position}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOnline={isOnline}
          isProcessing={isProcessing}
          onPurchase={handlePurchase}
          onClose={() => setSelectedProduct(null)}
          error={purchaseError}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedProduct && (
        <PaymentModal
          product={selectedProduct}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Purchase Success Modal */}
      {showPurchaseSuccess && lastPurchase && (
        <PurchaseSuccessModal
          product={lastPurchase}
          onClose={() => {
            setShowPurchaseSuccess(false);
            resetPurchase();
          }}
        />
      )}
    </div>
  );
};

export default KioskInterface;
