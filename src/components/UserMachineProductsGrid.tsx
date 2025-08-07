import React from 'react';
import useUserMachineProducts from '../hooks/useUserMachineProducts';

interface UserMachineProductsGridProps {
  machineId: string;
  className?: string;
  showMachineInfo?: boolean;
  showUserInfo?: boolean;
}

const UserMachineProductsGrid: React.FC<UserMachineProductsGridProps> = ({
  machineId,
  className = '',
  showMachineInfo = true,
  showUserInfo = false
}) => {
  const {
    products,
    loading,
    error,
    lastFetched,
    refresh,
    machineInfo,
    userInfo,
    count
  } = useUserMachineProducts({
    machineId,
    autoRefresh: true,
    refreshInterval: 30
  });

  const getStockStatus = (stockLevel: number, parLevel: number) => {
    if (stockLevel === 0) return 'out-of-stock';
    if (stockLevel <= parLevel * 0.2) return 'low-stock';
    return 'in-stock';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-4 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refresh}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Header with machine and user info */}
      <div className="mb-6">
        {showMachineInfo && machineInfo && (
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {machineInfo.name}
            </h2>
            <p className="text-gray-600">
              Machine Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{machineInfo.machine_code}</span>
            </p>
          </div>
        )}
        
        {showUserInfo && userInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">User:</span> {userInfo.email}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Products ({count})
            </h3>
            {lastFetched && (
              <span className="text-sm text-gray-500">
                Last updated: {formatTimeAgo(lastFetched)}
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-500">
            No products are currently assigned to this machine for your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock_level, product.par_level);
            
            return (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
                  stockStatus === 'out-of-stock' ? 'border-red-200 opacity-60' :
                  stockStatus === 'low-stock' ? 'border-yellow-200' : 'border-green-200'
                }`}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x200/cccccc/666666?text=${encodeURIComponent(product.name.substring(0, 2).toUpperCase())}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-4xl font-bold text-gray-400">
                        {product.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Stock Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    stockStatus === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                    stockStatus === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                     stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                  </div>
                  
                  {/* Slot Position Badge */}
                  {product.slot_position && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Slot {product.slot_position}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Stock Information */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock Level:</span>
                      <span className={`font-medium ${
                        stockStatus === 'out-of-stock' ? 'text-red-600' :
                        stockStatus === 'low-stock' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {product.stock_level}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Par Level:</span>
                      <span className="font-medium text-gray-900">{product.par_level}</span>
                    </div>
                    
                    {product.product_code && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Product Code:</span>
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                          {product.product_code}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round((product.stock_level / product.par_level) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          stockStatus === 'out-of-stock' ? 'bg-red-500' :
                          stockStatus === 'low-stock' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((product.stock_level / product.par_level) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserMachineProductsGrid; 