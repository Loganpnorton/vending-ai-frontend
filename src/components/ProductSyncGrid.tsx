import React from 'react';
import useProductSync from '../hooks/useProductSync';

interface ProductSyncGridProps {
  machineId: string;
  className?: string;
}

const ProductSyncGrid: React.FC<ProductSyncGridProps> = ({ 
  machineId, 
  className = '' 
}) => {
  const {
    assignedProducts,
    loading,
    error,
    lastFetched,
    refetch,
  } = useProductSync({
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

  const getStockStatus = (stockLevel: number): { text: string; color: string; bgColor: string } => {
    if (stockLevel === 0) {
      return { text: 'Out of Stock', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    } else if (stockLevel <= 5) {
      return { text: 'Low Stock', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    } else {
      return { text: 'In Stock', color: 'text-green-400', bgColor: 'bg-green-900/20' };
    }
  };

  const formatLastFetched = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  if (loading && assignedProducts.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Product Inventory</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Loading skeleton */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="space-y-3">
                <div className="w-full h-32 bg-gray-600 rounded-lg"></div>
                <div className="space-y-2">
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
          <h2 className="text-2xl font-semibold text-white">Product Inventory</h2>
          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
        
        <div className="bg-red-600 text-white p-4 rounded-md">
          <h3 className="font-semibold mb-2">Error Loading Products</h3>
          <p className="text-sm">{error}</p>
          {error.includes('Supabase client not configured') && (
            <p className="text-red-200 text-sm mt-2">
              💡 Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Product Inventory</h2>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-400 text-sm">Refreshing...</span>
            </div>
          )}
          <button
            onClick={refetch}
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

        {assignedProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No products found</div>
            <p className="text-gray-500 text-sm">
              This machine doesn't have any products configured yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedProducts.map((assignedProduct) => {
              const stockStatus = getStockStatus(assignedProduct.stock_level);
              const isOutOfStock = assignedProduct.stock_level === 0;
              
              return (
                <div 
                  key={assignedProduct.id} 
                  className={`bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:bg-gray-650 ${
                    isOutOfStock ? 'opacity-60' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div className="mb-3">
                    {assignedProduct.product.image_url ? (
                      <img
                        src={assignedProduct.product.image_url}
                        alt={assignedProduct.product.name}
                        className="w-full h-32 rounded-lg object-cover bg-gray-600"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-32 rounded-lg bg-gray-600 flex items-center justify-center ${
                      assignedProduct.product.image_url ? 'hidden' : ''
                    }`}>
                      <span className="text-gray-400 text-4xl">📦</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-white truncate flex-1">
                        {assignedProduct.product.name}
                      </h3>
                      <span className="text-green-400 font-bold text-lg ml-2">
                        {formatPrice(assignedProduct.product.price)}
                      </span>
                    </div>

                    {assignedProduct.product.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {assignedProduct.product.description}
                      </p>
                    )}

                    {/* Product Code */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs font-mono">
                        {assignedProduct.product.product_code}
                      </span>
                      {assignedProduct.slot_position && (
                        <span className="text-blue-400 text-xs font-semibold">
                          Slot {assignedProduct.slot_position}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className={`flex items-center justify-between p-2 rounded ${stockStatus.bgColor}`}>
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                      {assignedProduct.stock_level > 0 && (
                        <span className="text-gray-300 text-xs">
                          {assignedProduct.stock_level} available
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    {assignedProduct.product.category && (
                      <span className="inline-block bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
                        {assignedProduct.product.category}
                      </span>
                    )}
                  </div>

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-red-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-red-400 font-bold text-lg">OUT OF STOCK</span>
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
            <div>Products loaded: {assignedProducts.length}</div>
            <div>Last fetched: {lastFetched?.toISOString() || 'Never'}</div>
            <div>Auto-refresh: Enabled (30s)</div>
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not set'}</div>
            <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Not set'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSyncGrid; 