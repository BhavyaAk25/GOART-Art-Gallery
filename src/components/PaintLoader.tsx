type Props = {
  className?: string
  label?: string
}

function PaintLoader({ className, label = 'Loading painting' }: Props) {
  return (
    <div className={className} role="status" aria-label={label}>
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 brush-orbit">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -translate-y-16 brush-wobble drop-shadow-sm">
              <svg
                width="90"
                height="32"
                viewBox="0 0 78 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <defs>
                  <linearGradient id="handle" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#2a231c" />
                    <stop offset="0.55" stopColor="#120f0b" />
                    <stop offset="1" stopColor="#2a231c" />
                  </linearGradient>
                  <linearGradient id="handleHi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  <linearGradient id="ferrule" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ead8b5" />
                    <stop offset="0.5" stopColor="#d6b78a" />
                    <stop offset="1" stopColor="#caa06a" />
                  </linearGradient>
                  <linearGradient id="bristles" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#1b1612" />
                    <stop offset="0.6" stopColor="#0f0c09" />
                    <stop offset="1" stopColor="#2a231c" />
                  </linearGradient>
                </defs>

                <rect x="2" y="11" width="44" height="10" rx="5" fill="url(#handle)" />
                <rect x="6" y="12" width="34" height="3" rx="1.5" fill="url(#handleHi)" />

                <rect x="46" y="9" width="14" height="14" rx="4" fill="url(#ferrule)" />
                <rect x="48" y="10" width="10" height="2" rx="1" fill="rgba(255,255,255,0.18)" />

                <path d="M60 7 L76 14 L60 21 Q58 14 60 7 Z" fill="url(#bristles)" />
                <path d="M70 12 L76 14 L70 16 Q71 14 70 12 Z" fill="rgba(255,255,255,0.08)" />

                <path
                  d="M75.5 14.1 C73.6 15.2 72.2 15.7 70.2 16.0 C71.2 14.9 71.2 13.3 70.2 12.2 C72.2 12.5 73.6 13.0 75.5 14.1 Z"
                  fill="rgba(24,20,15,0.85)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaintLoader
