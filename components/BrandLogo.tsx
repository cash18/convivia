import { ConviviaMark } from "@/components/ConviviaMark";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <ConviviaMark size={40} className="shrink-0 shadow-lg shadow-indigo-500/30 ring-2 ring-white/50 rounded-[22%]" />
      <span className="bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
        Convivia
      </span>
    </span>
  );
}
