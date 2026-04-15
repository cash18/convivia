import { ConviviaMark } from "@/components/ConviviaMark";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <ConviviaMark
        size={40}
        className="shrink-0 rounded-[24%] shadow-md shadow-emerald-600/15 ring-1 ring-slate-900/[0.06]"
      />
      <span className="flex min-w-0 flex-col items-start gap-1 leading-none">
        <span className="font-sans text-[1.125rem] font-bold tracking-[-0.04em] text-slate-900 sm:text-xl sm:tracking-[-0.045em]">
          Convivia
        </span>
        <span className="font-sans text-[0.625rem] font-semibold tracking-[0.2em] text-emerald-800/85 sm:text-[0.6875rem] sm:tracking-[0.22em]">
          HOME
        </span>
        <span
          className="mt-0.5 h-[3px] w-11 max-w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 sm:mt-1 sm:w-14"
          aria-hidden
        />
      </span>
    </span>
  );
}
