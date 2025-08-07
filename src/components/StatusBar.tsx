

interface StatusBarProps {
  machineCode: string;
  lastCheckin: string;
  apiDomain: string;
}

export function StatusBar({ machineCode, lastCheckin, apiDomain }: StatusBarProps) {
  return (
    <div className="sticky bottom-0 bg-[#0B0C0F]/90 border-t border-[#1C1F26] backdrop-blur">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <span className="text-[#A7ADBB]">Powered by NextGen Vending</span>
          <span className="text-[#A7ADBB]">
            Machine: {machineCode} • Last check-in: {lastCheckin} • API: {apiDomain}
          </span>
        </div>
      </div>
    </div>
  );
} 