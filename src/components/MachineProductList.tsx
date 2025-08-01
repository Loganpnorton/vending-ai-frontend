import React from 'react';
import useMachineProducts from '../hooks/useMachineProducts';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_level: number;
  image_url?: string;
  description?: string;
  category?: string;
  is_available: boolean;
}

interface MachineProductListProps {
  machineId: string;
  className?: string;
}

const MachineProductList: React.FC<MachineProductListProps> = ({ 
  machineId, 
  className = '' 
}) => {
  const {
    products,
    loading,
    error,
    lastFetched,
    refresh,
  } = useMachineProducts({
    machineId,
    autoRefresh: true,
    refreshInterval: 30, // Refresh every 30 seconds
  });

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockStatus = (stockLevel: number): { text: string; color: string } => {
    if (stockLevel === 0) {
      return { text: 'Out of Stock', color: 'text-red-400' };
    } else if (stockLevel <= 5) {
      return { text: 'Low Stock', color: 'text-yellow-400' };
    } else {
      return { text: 'In Stock', color: 'text-green-400' };
    }
  };

  const formatLastFetched = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  if (loading && products.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Products</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Loading skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Products</h2>
          <button
            onClick={refresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
        
        <div className="bg-red-600 text-white p-4 rounded-md">
          <h3 className="font-semibold mb-2">Error Loading Products</h3>
          <p className="text-sm">{error}</p>
          {error.includes('CORS') && (
            <p className="text-red-200 text-sm mt-2">
              💡 This is expected in development. Set up CORS on your backend for production.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Products</h2>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-400 text-sm">Refreshing...</span>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-1 rounded text-sm disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>

        {/* Last updated info */}
        {lastFetched && (
          <div className="text-xs text-gray-400 mb-4">
            Last updated: {formatLastFetched(lastFetched)}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No products found</div>
            <p className="text-gray-500 text-sm">
              This machine doesn't have any products configured yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock_level);
              
              return (
                <div 
                  key={product.id} 
                  className={`bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:bg-gray-650 ${
                    !product.is_available ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center ${
                        product.image_url ? 'hidden' : ''
                      }`}>
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          {product.category && (
                            <span className="inline-block bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded mt-2">
                              {product.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          <span className="text-green-400 font-bold text-lg">
                            {formatPrice(product.price)}
                          </span>
                          <span className={`text-sm ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                          {product.stock_level > 0 && (
                            <span className="text-gray-400 text-xs">
                              {product.stock_level} available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability indicator */}
                  {!product.is_available && (
                    <div className="mt-2 text-red-400 text-sm">
                      ⚠️ Product temporarily unavailable
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
            <div>Machine ID: {machineId}</div>
            <div>Products loaded: {products.length}</div>
            <div>Last fetched: {lastFetched?.toISOString() || 'Never'}</div>
            <div>Auto-refresh: Enabled (30s)</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineProductList; 