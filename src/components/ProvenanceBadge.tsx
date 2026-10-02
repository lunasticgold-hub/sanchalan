import { SRC } from '../config';

export default function ProvenanceBadge({ source }: { source: string }) {
  if (source === SRC.AI) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-300">
        🤖 AI-generated · verify
      </span>
    );
  }
  if (source === SRC.VERIFIED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-300">
        ✅ Verified
      </span>
    );
  }
  return null;
}
