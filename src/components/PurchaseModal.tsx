

interface ProductUI {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_level: number;
  slot_position?: string;
  machineOffline: boolean;
}

interface PurchaseModalProps {
  product: ProductUI | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PurchaseModal({ product, isOpen, onClose, onConfirm }: PurchaseModalProps) {
  if (!isOpen || !product) return null;

  const isDisabled = product.stock_level <= 0 || product.machineOffline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#111318] border border-[#1C1F26] text-[#E6E8EE] rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Image */}
          <div className="w-full md:w-1/2">
            <div className="aspect-square overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-t-none">
              <img
                src={product.image_url}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Right side - Content */}
          <div className="w-full md:w-1/2 p-6 flex flex-col">
            {/* Product info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">
                {product.name}
              </h2>
              <p className="text-xl font-bold mb-4">
                ${product.price.toFixed(2)}
              </p>
              
              <div className="space-y-2 text-sm text-[#A7ADBB]">
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span className={isDisabled ? 'text-rose-400' : 'text-emerald-400'}>
                    {isDisabled ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
                {product.slot_position && (
                  <div className="flex justify-between">
                    <span>Slot:</span>
                    <span>{product.slot_position}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-[#2A2F3A] text-[#A7ADBB] hover:bg-[#1C1F26] transition-colors focus:ring-2 focus:ring-[#3B82F6]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className={`
                  flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                  focus:ring-2 focus:ring-[#3B82F6]
                  ${isDisabled
                    ? 'bg-[#1C1F26] text-[#6B7280] cursor-not-allowed'
                    : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer'
                  }
                `}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 