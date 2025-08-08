import React, { useState } from 'react';
import type { MachineProduct } from '../lib/supabase';

interface PaymentModalProps {
  product: MachineProduct;
  onPaymentComplete: (paymentMethod: string) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ product, onPaymentComplete, onClose }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
    { id: 'debit_card', name: 'Debit Card', icon: '💳', description: 'Any debit card' },
    { id: 'mobile_pay', name: 'Mobile Pay', icon: '📱', description: 'Apple Pay, Google Pay' },
    { id: 'cash', name: 'Cash', icon: '💵', description: 'Exact change only' },
    { id: 'contactless', name: 'Contactless', icon: '📡', description: 'Tap to pay' },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    onPaymentComplete(selectedPaymentMethod);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Product Summary */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
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
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">
                {product.product?.name || 'Unknown Product'}
              </h3>
              <p className="text-gray-400 text-sm">
                Slot {product.slot_position}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {formatPrice(product.product?.price || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handlePaymentMethodSelect(method.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedPaymentMethod === method.id
                    ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{method.name}</div>
                    <div className="text-sm text-gray-400">{method.description}</div>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <div className="text-blue-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-700 space-y-3">
          <button
            onClick={handlePaymentSubmit}
            disabled={!selectedPaymentMethod || isProcessing}
            className={`
              w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200
              ${selectedPaymentMethod && !isProcessing
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Processing Payment...
              </div>
            ) : (
              `Pay ${formatPrice(product.product?.price || 0)}`
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Payment Security Notice */}
        <div className="px-6 pb-6">
          <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-300 text-sm font-medium">Secure Payment</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
