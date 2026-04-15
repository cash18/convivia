/** Illustrazione vettoriale (sempre nitida) per la strip tra trust e funzionalità. */
export function LandingFeaturesIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="lf-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="45%" stopColor="#f0fdfa" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="lf-card" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.9" />
        </linearGradient>
        <filter id="lf-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#059669" floodOpacity="0.12" />
        </filter>
      </defs>
      <rect width="800" height="450" rx="28" fill="url(#lf-bg)" />
      <rect x="48" y="52" width="220" height="200" rx="18" fill="url(#lf-card)" stroke="#d1fae5" strokeWidth="1.5" filter="url(#lf-soft)" />
      <rect x="72" y="78" width="172" height="10" rx="4" fill="#a7f3d0" />
      <rect x="72" y="100" width="120" height="8" rx="3" fill="#e2e8f0" />
      {Array.from({ length: 4 }).map((_, row) => (
        <g key={row}>
          {Array.from({ length: 5 }).map((__, col) => (
            <rect
              key={`${row}-${col}`}
              x={72 + col * 34}
              y={124 + row * 28}
              width="28"
              height="22"
              rx="5"
              fill={row + col === 0 ? "#d1fae5" : "#f1f5f9"}
              stroke="#cbd5e1"
              strokeWidth="0.75"
            />
          ))}
        </g>
      ))}
      <rect x="300" y="72" width="240" height="248" rx="20" fill="url(#lf-card)" stroke="#d1fae5" strokeWidth="1.5" filter="url(#lf-soft)" />
      <rect x="324" y="98" width="140" height="9" rx="4" fill="#86efac" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="324" y={128 + i * 52} width="192" height="40" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <path
            d="M340 148l6 6 12-14"
            stroke="#059669"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="368" y="142" width="120" height="8" rx="3" fill="#cbd5e1" />
          <rect x="368" y="156" width="80" height="6" rx="2" fill="#e2e8f0" />
        </g>
      ))}
      <circle cx="620" cy="160" r="56" fill="#ffffff" stroke="#6ee7b7" strokeWidth="2" filter="url(#lf-soft)" />
      <text x="620" y="178" textAnchor="middle" fontSize="44" fontWeight="700" fill="#047857" fontFamily="system-ui, sans-serif">
        €
      </text>
      <circle cx="620" cy="290" r="8" fill="#34d399" opacity="0.85" />
      <circle cx="660" cy="270" r="5" fill="#5eead4" opacity="0.7" />
      <rect x="580" y="320" width="160" height="56" rx="14" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
      <rect x="600" y="338" width="120" height="8" rx="3" fill="#bbf7d0" />
      <rect x="600" y="354" width="72" height="6" rx="2" fill="#d1fae5" />
    </svg>
  );
}
