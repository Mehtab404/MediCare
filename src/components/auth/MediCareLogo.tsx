/** MediCare mark: a medical cross with a hummingbird cut out of it. Only one instance per page (fixed mask id). */
export default function MediCareLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MediCare logo"
    >
      <defs>
        <mask id="medicare-hummingbird-mask">
          <rect x="0" y="0" width="120" height="120" fill="white" />
          <g fill="black" stroke="black" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M56 47 C43 38, 30 31, 21 27 C28 36, 37 44, 49 51 Z" />
            <path d="M51 54 C37 51, 24 47, 15 44 C24 53, 35 59, 48 61 Z" />
            <path d="M48 60 C43 72, 39 84, 36 96 C44 87, 52 77, 58 67 C63 59, 67 51, 74 49 L99 47.5 L74 44.5 C71 39, 64 38, 59 42 C56 45, 53 49, 50 53 Z" />
          </g>
          <circle cx="65.5" cy="44.5" r="1.4" fill="white" />
        </mask>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="28" fill="#F8FAFC" />
      <g mask="url(#medicare-hummingbird-mask)">
        <rect x="43" y="16" width="34" height="88" rx="9" fill="#0F172A" />
        <rect x="16" y="43" width="88" height="34" rx="9" fill="#0F172A" />
      </g>
    </svg>
  );
}
