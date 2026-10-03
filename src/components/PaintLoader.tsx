import { useId } from 'react'

type Props = {
  className?: string
  label?: string
}

// Three brush strokes, one per artist in the collection, that paint themselves on in turn.
const STROKES = [
  { d: 'M18 74 C 58 34, 96 104, 140 64 S 222 30, 262 58', color: '#2b4fa2', width: 15, delay: '0s' }, // Matisse cobalt
  { d: 'M24 52 C 70 76, 110 22, 150 50 S 220 86, 256 44', color: '#c0562f', width: 11, delay: '0.22s' }, // Picasso terracotta
  { d: 'M30 92 C 80 70, 120 98, 166 80 S 228 62, 252 84', color: '#1d3a4f', width: 8, delay: '0.44s' }, // Hokusai Prussian blue
]

function PaintLoader({ className = '', label = 'Loading painting' }: Props) {
  const filterId = `brush-${useId().replace(/:/g, '')}`

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-3xl bg-sand-50/85 px-6 pb-4 pt-3 shadow-card ring-1 ring-ink-900/5 backdrop-blur-md ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg width="180" height="78" viewBox="0 0 280 120" fill="none" aria-hidden className="overflow-visible">
        <defs>
          {/* Roughen the stroke edges so they read as bristle marks rather than vector lines. */}
          <filter id={filterId} x="-10%" y="-30%" width="120%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          {STROKES.map((s) => (
            <path
              key={s.color}
              d={s.d}
              pathLength={1}
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="paint-stroke"
              style={{ animationDelay: s.delay }}
            />
          ))}
        </g>
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-ink-700/70">{label}</span>
    </div>
  )
}

export default PaintLoader
