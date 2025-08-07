

interface ProductUI {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_level: number;
  slot_position?: string;
  machineOffline: boolean;
}

interface ProductCardProps {
  p: ProductUI;
  onBuy: () => void;
}

export function ProductCard({ p, onBuy }: ProductCardProps) {
  const out = p.stock_level <= 0 || p.machineOffline;
  
  return (
    <div className="rounded-xl border border-[#1C1F26] bg-[#111318] hover:border-[#2A2F3A] transition">
      <div className={`relative aspect-square overflow-hidden rounded-t-xl bg-[#0D0F14] ${out ? "opacity-60" : ""}`}>
        {p.slot_position && (
          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border border-[#2A2F3A] bg-[#0B0C0F]/70">
            Slot {p.slot_position}
          </span>
        )}
        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
      </div>
      <div className="mt-3 px-3 text-[13px] md:text-sm font-medium line-clamp-2">{p.name}</div>
      <div className="px-3 pb-2 pt-1 text-sm md:text-base font-semibold">${p.price.toFixed(2)}</div>
      <div className="flex items-center justify-between px-3 pb-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
          out ? "text-rose-400 border border-rose-500/40 bg-rose-500/10"
              : "text-emerald-400 border border-emerald-500/40 bg-emerald-500/10"
        }`}>
          {out ? "OUT OF STOCK" : "In Stock"}
        </span>
        <button
          disabled={out}
          aria-disabled={out}
          className={`px-3 py-2 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-[#3B82F6] ${
            out ? "bg-[#1C1F26] text-[#6B7280] cursor-not-allowed"
                : "bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          }`}
          onClick={onBuy}
        >
          Buy
        </button>
      </div>
    </div>
  );
} 