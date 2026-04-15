/** Indicatore di caricamento compatto (pulsanti, righe lista). */
export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin ${className}`}
      aria-hidden
    />
  );
}
