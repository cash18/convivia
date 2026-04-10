/** Marchio Convivia: casa condivisa + collegamento (stesso concetto dell’icona app / PWA). */
export function ConviviaMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="cv-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#cv-mark-bg)" />
      <path
        d="M256 148 L388 248 V408 H124 V248 Z"
        stroke="#ffffff"
        strokeWidth="22"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.12)"
      />
      <path d="M256 148 L124 248" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
      <path d="M256 148 L388 248" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
      <rect x="218" y="302" width="76" height="106" rx="12" fill="#ffffff" fillOpacity={0.92} />
      <circle cx="168" cy="392" r="22" fill="#6ee7b7" />
      <circle cx="344" cy="392" r="22" fill="#5eead4" />
      <path
        d="M190 392 Q256 352 322 392"
        stroke="#ffffff"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
