

interface HeaderProps {
  name: string;
  code: string;
  online: boolean;
  lastSync: string;
  battery: number;
}

export function Header({ name, code, online, lastSync, battery }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0C0F]/90 backdrop-blur border-b border-[#1C1F26]">
      <div className="max-w-[1400px] mx-auto h-16 flex items-center justify-between px-4 md:px-6 lg:px-8">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">{name}</h1>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#2A2F3A] text-[#A7ADBB]">
            {code}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${
            online ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />
            {online ? "Online" : "Offline"}
          </span>
          <span className="text-[#A7ADBB]">Last sync: {lastSync}</span>
          <span className="text-[#A7ADBB]">Battery: {battery}%</span>
        </div>
      </div>
    </header>
  );
} 