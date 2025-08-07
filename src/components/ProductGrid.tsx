
import { ProductCard } from './ProductCard';

interface ProductUI {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_level: number;
  slot_position?: string;
  machineOffline: boolean;
}

interface ProductGridProps {
  products: ProductUI[];
  onBuy: (productId: string) => void;
}

export function ProductGrid({ products, onBuy }: ProductGridProps) {
  // Sort products by slot_position, then by name
  const sortedProducts = [...products].sort((a, b) => {
    if (a.slot_position && b.slot_position) {
      return a.slot_position.localeCompare(b.slot_position);
    }
    if (a.slot_position) return -1;
    if (b.slot_position) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="py-6 md:py-8">
      <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            p={product}
            onBuy={() => onBuy(product.id)}
          />
        ))}
      </div>
    </div>
  );
} 