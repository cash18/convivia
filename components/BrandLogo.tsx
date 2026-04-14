import { ConviviaMark } from "@/components/ConviviaMark";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <ConviviaMark
        size={40}
        className="shrink-0 rounded-[24%] shadow-md shadow-emerald-600/15 ring-1 ring-slate-900/[0.06]"
      />
      <span className="flex min-w-0 flex-col items-start gap-1.5 leading-none">
        <span className="font-sans text-[1.125rem] font-bold tracking-[-0.04em] text-slate-900 sm:text-xl sm:tracking-[-0.045em]">
          Convivia
        </span>
        <span
          className="h-[3px] w-9 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 sm:w-10"
          aria-hidden
        />
      </span>
    </span>
  );
}
