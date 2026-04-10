import { ConviviaMark } from "@/components/ConviviaMark";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <ConviviaMark size={40} className="shrink-0 rounded-[22%] shadow-lg shadow-emerald-600/30 ring-2 ring-white/50" />
      <span className="bg-gradient-to-r from-slate-900 to-emerald-950 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
        Convivia
      </span>
    </span>
  );
}
