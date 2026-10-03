// Sanchalan logo: interconnected nodes forming an operational network.
// Neutral, professional — matches the enterprise aesthetic.

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring: the event */}
      <circle cx="16" cy="16" r="13" stroke="#111827" strokeWidth="2.5" />
      {/* Inner nodes: connected operations */}
      <circle cx="16" cy="10" r="3" fill="#111827" />
      <circle cx="11" cy="19" r="3" fill="#111827" />
      <circle cx="21" cy="19" r="3" fill="#111827" />
      {/* Connections */}
      <line x1="16" y1="13" x2="11" y2="16.5" stroke="#111827" strokeWidth="1.5" />
      <line x1="16" y1="13" x2="21" y2="16.5" stroke="#111827" strokeWidth="1.5" />
      <line x1="12.5" y1="20.5" x2="19.5" y2="20.5" stroke="#111827" strokeWidth="1.5" />
    </svg>
  );
}

export function LogoWithWordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <div>
        <div className="text-[15px] font-bold tracking-tight text-gray-900 leading-none">Sanchalan</div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Event Command Center</div>
      </div>
    </div>
  );
}
