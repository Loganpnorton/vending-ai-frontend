import React, { useState, useEffect } from 'react';
import type { MachineProduct } from '../lib/supabase';

interface PurchaseSuccessModalProps {
  product: MachineProduct;
  onClose: () => void;
}

const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  product,
  onClose,
}) => {
  const [stage, setStage] = useState<'processing' | 'dispensing' | 'complete'>('processing');

  useEffect(() => {
    // Simulate purchase flow
    const timer1 = setTimeout(() => setStage('dispensing'), 1000);
    const timer2 = setTimeout(() => setStage('complete'), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStageContent = () => {
    switch (stage) {
      case 'processing':
        return {
          icon: '💳',
          title: 'Processing Payment',
          message: 'Please wait while we process your payment...',
          animation: 'animate-pulse',
        };
      case 'dispensing':
        return {
          icon: '📦',
          title: 'Dispensing Product',
          message: 'Your item is being dispensed...',
          animation: 'animate-bounce',
        };
      case 'complete':
        return {
          icon: '✅',
          title: 'Thank You!',
          message: 'Please collect your item from the dispenser.',
          animation: '',
        };
    }
  };

  const stageContent = getStageContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8 text-center">
        {/* Stage Icon */}
        <div className={`text-8xl mb-6 ${stageContent.animation}`}>
          {stageContent.icon}
        </div>

        {/* Stage Title */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {stageContent.title}
        </h2>

        {/* Stage Message */}
        <p className="text-gray-300 text-lg mb-6">
          {stageContent.message}
        </p>

        {/* Product Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
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
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white">
                {product.product?.name || 'Unknown Product'}
              </h3>
              <p className="text-green-400 font-bold">
                {formatPrice(product.product?.price || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
          <div 
            className={`bg-green-500 h-3 rounded-full transition-all duration-1000 ${
              stage === 'processing' ? 'w-1/3' : 
              stage === 'dispensing' ? 'w-2/3' : 
              'w-full'
            }`}
          ></div>
        </div>

        {/* Action Button */}
        {stage === 'complete' && (
          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Done
          </button>
        )}

        {/* Auto-close message */}
        {stage === 'complete' && (
          <p className="text-gray-400 text-sm mt-4">
            This window will close automatically in a few seconds
          </p>
        )}
      </div>
    </div>
  );
};

export default PurchaseSuccessModal;
