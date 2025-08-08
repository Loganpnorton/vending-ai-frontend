import React from 'react';
import type { MachineProduct } from '../lib/supabase';

interface ProductModalProps {
  product: MachineProduct;
  isOnline: boolean;
  isProcessing: boolean;
  onPurchase: () => void;
  onClose: () => void;
  error: string | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOnline,
  isProcessing,
  onPurchase,
  onClose,
  error,
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const isOutOfStock = product.stock_level <= 0;
  const canPurchase = isOnline && !isOutOfStock && !isProcessing;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Product Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Product Image */}
        <div className="p-6">
          <div className="aspect-square bg-gray-700 rounded-xl mb-6 flex items-center justify-center">
            {product.product?.image_url ? (
              <img
                src={product.product.image_url}
                alt={product.product.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className="text-8xl text-gray-500 hidden">
              {product.product?.name?.charAt(0) || '?'}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {product.product?.name || 'Unknown Product'}
              </h3>
              {product.product?.description && (
                <p className="text-gray-300 text-sm">
                  {product.product.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Price</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatPrice(product.product?.price || 0)}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Stock</div>
                <div className={`text-2xl font-bold ${isOutOfStock ? 'text-red-400' : 'text-blue-400'}`}>
                  {product.stock_level}
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Slot Position</div>
              <div className="text-lg font-semibold text-white">
                {product.slot_position}
              </div>
            </div>

            {product.product?.category && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Category</div>
                <div className="text-lg font-semibold text-white">
                  {product.product.category}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-600 text-white p-4 rounded-lg">
              <div className="font-semibold mb-1">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-700 space-y-3">
          {!isOnline ? (
            <div className="bg-red-600 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Machine Offline</div>
              <div className="text-sm">This machine is currently offline and cannot process purchases.</div>
            </div>
          ) : isOutOfStock ? (
            <div className="bg-orange-600 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Out of Stock</div>
              <div className="text-sm">This product is currently unavailable.</div>
            </div>
          ) : (
            <button
              onClick={onPurchase}
              disabled={!canPurchase}
              className={`
                w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200
                ${canPurchase
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Processing...
                </div>
              ) : (
                `Buy for ${formatPrice(product.product?.price || 0)}`
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
