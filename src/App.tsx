import { useEffect, useMemo, useState } from 'react'
import { paintings } from './data/paintings'

type OpenState = Record<string, boolean>

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function App() {
  const [openCards, setOpenCards] = useState<OpenState>({})
  const feed = useMemo(() => shuffle(paintings), [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCards({})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-sand-50 text-ink-800">
      <header className="sticky top-0 z-20 border-b border-ink-800/5 bg-sand-50/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-4 md:px-8">
          <div className="text-3xl font-bold uppercase tracking-[0.35em] text-ink-900 font-display">
            GOART
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory">
        {feed.map((painting, index) => {
          const isOpen = Boolean(openCards[painting.id])

          return (
            <section
              key={painting.id}
              className="relative flex h-screen items-center justify-center snap-start px-4 py-6 md:px-8"
              onClick={() => toggleCard(painting.id)}
            >
              <div className="absolute left-6 top-8 text-xs uppercase tracking-[0.32em] text-ink-700/70">
                {String(index + 1).padStart(2, '0')} / {feed.length} · Swipe
              </div>

              <div className="relative h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-sand-100 ring-1 ring-ink-800/8 shadow-card transition duration-700">
                <img
                  src={painting.imageUrl}
                  alt={`${painting.title} by ${painting.artist}`}
                  className={`h-full w-full object-contain bg-sand-200 transition duration-700 ${
                    isOpen ? 'scale-[1.04] blur-[1px] opacity-35' : 'opacity-100 kenburns'
                  }`}
                  loading="lazy"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />

                <div className="pointer-events-none absolute left-7 right-7 bottom-8 flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.38em] text-sand-50">
                      {painting.artist}
                    </p>
                    <h2 className="text-3xl font-semibold text-sand-50 drop-shadow md:text-4xl">
                      {painting.title}
                    </h2>
                    <p className="text-sm text-sand-100/90">
                      {painting.year} · {painting.medium}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-ink-900/50 px-3 py-1 text-xs text-sand-50 md:inline-flex">
                    Tap to reveal
                  </span>
                </div>

                {isOpen && (
                  <div className="overlay-ink absolute inset-0 flex flex-col justify-center gap-4 bg-sand-50/90 px-6 py-8 text-left text-ink-800 backdrop-blur-md md:px-12 md:py-10">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-ink-700/70">
                      <span>{painting.artist}</span>
                      <span className="h-px w-8 bg-ink-700/20" />
                      <span>{painting.year}</span>
                    </div>
                    <h3 className="text-4xl font-semibold text-ink-900 md:text-5xl">{painting.title}</h3>
                    <p className="max-w-2xl text-base leading-relaxed text-ink-800/80 md:text-lg">
                      {painting.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs md:text-sm">
                      <span className="rounded-full bg-ink-900/10 px-3 py-1 text-ink-900">{painting.medium}</span>
                      <span className="rounded-full bg-ink-900/10 px-3 py-1 text-ink-900">20th century</span>
                      <span className="rounded-full bg-ink-900/10 px-3 py-1 text-ink-900">Tap to close</span>
                    </div>
                    <p className="text-xs text-ink-700/70">Click/Tap anywhere or press Esc to return to the full painting.</p>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}

export default App
