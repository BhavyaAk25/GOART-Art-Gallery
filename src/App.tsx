import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { paintings } from './data/paintings'
import Frame3D from './components/Frame3D'
import type { RenderStatus } from './components/Frame3D'
import PaintLoader from './components/PaintLoader'
import ChatBot from './components/ChatBot'
import { canUseWebGL, prefersReducedMotion } from './lib/webgl'

type Direction = 'next' | 'prev'

const HEADER_H = 64
const FOOTER_H = 56
const LOADER_DELAY_MS = 240

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const preloadImage = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new Image()
    // Match the WebGL texture request (CORS, no referrer) so the browser cache is reused.
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })

function App() {
  const feed = useMemo(() => shuffle(paintings), [])
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<Direction | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [imageAspect, setImageAspect] = useState(0.75)
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [webglEnabled, setWebglEnabled] = useState(() => canUseWebGL() && !prefersReducedMotion())
  const [webglStatus, setWebglStatus] = useState<RenderStatus>('loading')
  const [loaderVisible, setLoaderVisible] = useState(false)
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const lastDirRef = useRef<Direction>('next')

  const requested = feed[requestedIndex]
  const displayed = feed[displayedIndex]
  const waitingForNext = requestedIndex !== displayedIndex
  const allFailed = failedIds.size >= feed.length

  // ---- Navigation ---------------------------------------------------------

  const stepFrom = useCallback(
    (from: number, dir: Direction, skip: ReadonlySet<string>) => {
      const delta = dir === 'next' ? 1 : -1
      for (let n = 1; n <= feed.length; n += 1) {
        const i = (from + delta * n + feed.length) % feed.length
        if (!skip.has(feed[i].id)) return i
      }
      return from
    },
    [feed],
  )

  const go = useCallback(
    (dir: Direction) => {
      setInspecting(false)
      setSlideDir(dir)
      lastDirRef.current = dir
      setRequestedIndex((prev) => stepFrom(prev, dir, failedIds))
    },
    [failedIds, stepFrom],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      if (e.key === 'ArrowRight') go('next')
      else if (e.key === 'ArrowLeft') go('prev')
      else if (e.key === 'Escape') setInspecting(false)
      else if (e.key === 'i' || e.key === 'I') setInspecting((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // Clear the slide animation class once it has played.
  useEffect(() => {
    if (!slideDir) return undefined
    const t = window.setTimeout(() => setSlideDir(null), 620)
    return () => window.clearTimeout(t)
  }, [slideDir])

  // ---- Failure handling ---------------------------------------------------

  const handleImageError = useCallback(
    (url: string) => {
      const index = feed.findIndex((p) => p.imageUrl === url)
      if (index === -1) return
      const painting = feed[index]
      const nextFailed = new Set(failedIds).add(painting.id)
      setFailedIds(nextFailed)
      setNotice(`Couldn’t load “${painting.title}”. Skipped it.`)
      if (nextFailed.size >= feed.length) return
      if (index === requestedIndex) {
        const next = stepFrom(index, lastDirRef.current, nextFailed)
        setRequestedIndex(next)
        // On first load nothing valid is displayed yet, so move both indices.
        if (index === displayedIndex && webglStatus !== 'ready') setDisplayedIndex(next)
      }
    },
    [displayedIndex, failedIds, feed, requestedIndex, stepFrom, webglStatus],
  )

  useEffect(() => {
    if (!notice) return undefined
    const t = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(t)
  }, [notice])

  // ---- Image loading ------------------------------------------------------

  // Measure the displayed painting so the card matches its aspect ratio.
  useEffect(() => {
    if (!displayed) return undefined
    let canceled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      if (!canceled && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImageAspect(img.naturalWidth / img.naturalHeight)
      }
    }
    img.src = displayed.imageUrl
    return () => {
      canceled = true
    }
  }, [displayed])

  // Non-WebGL path: wait for the requested image before swapping it in.
  useEffect(() => {
    if (webglEnabled || !requested || !waitingForNext) return undefined
    let canceled = false
    preloadImage(requested.imageUrl)
      .catch(() => new Promise((r) => window.setTimeout(r, 600)).then(() => preloadImage(requested.imageUrl)))
      .then(
        () => {
          if (!canceled) setDisplayedIndex(requestedIndex)
        },
        () => {
          if (!canceled) handleImageError(requested.imageUrl)
        },
      )
    return () => {
      canceled = true
    }
  }, [handleImageError, requested, requestedIndex, waitingForNext, webglEnabled])

  // Warm the cache for the neighbours so next/prev feel instant.
  useEffect(() => {
    const neighbours = [stepFrom(requestedIndex, 'next', failedIds), stepFrom(requestedIndex, 'prev', failedIds)]
    for (const i of neighbours) preloadImage(feed[i].imageUrl).catch(() => {})
  }, [failedIds, feed, requestedIndex, stepFrom])

  // Show the loader only if loading takes longer than a moment (immediately on context loss).
  const needsLoader =
    !allFailed && (waitingForNext || webglStatus === 'context_lost' || (webglEnabled && webglStatus === 'loading'))
  useEffect(() => {
    if (!needsLoader) return undefined
    const t = window.setTimeout(() => setLoaderVisible(true), webglStatus === 'context_lost' ? 0 : LOADER_DELAY_MS)
    return () => {
      window.clearTimeout(t)
      setLoaderVisible(false)
    }
  }, [needsLoader, webglStatus])

  // ---- Layout -------------------------------------------------------------

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const placement = viewport.w >= 900 ? 'right' : 'bottom'
  const plaqueGap = 18
  const plaqueW = Math.min(360, Math.max(260, Math.round(viewport.w * 0.28)))
  const plaqueH = Math.min(260, Math.max(190, Math.round((viewport.h - HEADER_H) * 0.3)))
  const reservedW = inspecting && placement === 'right' ? plaqueW + plaqueGap : 0
  const reservedH = inspecting && placement === 'bottom' ? plaqueH + plaqueGap : 0
  const sidePadding = viewport.w < 640 ? 24 : 160 // keep the art clear of the arrow buttons
  const availableW = Math.min(Math.max(220, viewport.w - sidePadding - reservedW), 1400)
  const availableH = Math.min(Math.max(220, (viewport.h - HEADER_H - FOOTER_H) * 0.94 - reservedH), 1400)
  const fit =
    imageAspect >= availableW / availableH
      ? { w: availableW, h: availableW / imageAspect }
      : { w: availableH * imageAspect, h: availableH }

  // ---- Tap vs. drag on the painting --------------------------------------

  const gestureRef = useRef({ x: 0, y: 0, moved: false, pointerId: null as number | null })

  const onCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    gestureRef.current = { x: e.clientX, y: e.clientY, moved: false, pointerId: e.pointerId }
  }
  const onCardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (g.pointerId !== e.pointerId) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (dx * dx + dy * dy > 100) g.moved = true
  }
  const onCardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (g.pointerId !== e.pointerId) return
    if (!g.moved) setInspecting((v) => !v)
    g.pointerId = null
  }

  const restRotation = inspecting
    ? placement === 'right'
      ? { x: 0.06, y: -0.18 }
      : { x: 0.12, y: 0 }
    : { x: 0, y: 0 }

  // In WebGL mode the canvas keeps rendering the previous texture while loading, so the flat
  // image is only needed when WebGL is off or its context was lost.
  const showFallbackImage = !webglEnabled || webglStatus === 'context_lost'

  return (
    <div className="flex min-h-[100dvh] flex-col text-ink-800 font-mobile">
      <header className="sticky top-0 z-20 border-b border-ink-800/5 bg-sand-50/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-center px-4">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.45em] text-ink-900">GOART</h1>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-3 py-3">
        {allFailed ? (
          <div className="max-w-sm text-center">
            <p className="font-display text-3xl text-ink-900">The gallery is closed for a moment</p>
            <p className="mt-3 text-sm text-ink-700/80">
              We couldn’t load any paintings. Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-ink-900 px-5 py-2 text-sm text-sand-50 transition hover:bg-ink-700"
            >
              Reload
            </button>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center gap-5 transition-all duration-500 ${
              inspecting && placement === 'bottom' ? 'flex-col' : 'flex-row'
            }`}
          >
            <div
              className={`relative cursor-pointer touch-none select-none rounded-2xl ${
                slideDir === 'next' ? 'slide-next' : slideDir === 'prev' ? 'slide-prev' : ''
              } ${webglEnabled ? '' : 'overflow-hidden bg-sand-100 shadow-card ring-1 ring-ink-800/10'}`}
              style={{ width: `${fit.w}px`, height: `${fit.h}px` }}
              onPointerDown={onCardPointerDown}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              role="button"
              tabIndex={0}
              aria-pressed={inspecting}
              aria-label={displayed ? `${displayed.title} by ${displayed.artist}. Show details.` : 'Painting'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setInspecting((v) => !v)
                }
              }}
            >
              {displayed && (
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
                    showFallbackImage ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage: `url("${displayed.imageUrl}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                  }}
                  aria-hidden
                />
              )}
              {webglEnabled && requested && (
                <Frame3D
                  imageUrl={requested.imageUrl}
                  direction={slideDir}
                  frozen={inspecting}
                  restRotation={restRotation}
                  onRenderStatus={(status) => {
                    if (status === 'unsupported') setWebglEnabled(false)
                    setWebglStatus(status)
                  }}
                  onTextureError={handleImageError}
                  onTextureReady={(readyUrl) => {
                    if (readyUrl !== requested.imageUrl) return
                    setDisplayedIndex(requestedIndex)
                  }}
                />
              )}
            </div>

            {displayed && inspecting && (
              <aside
                className="overlay-ink overflow-y-auto rounded-2xl border border-ink-900/10 bg-sand-100/95 px-5 py-4 text-ink-900 shadow-card backdrop-blur"
                style={
                  placement === 'right'
                    ? { width: `${plaqueW}px` }
                    : { width: `${Math.min(Math.max(fit.w, 280), viewport.w - 24)}px`, maxHeight: `${plaqueH}px` }
                }
                aria-label="About this painting"
              >
                <p className="text-[11px] uppercase tracking-[0.32em] text-ink-700/70">
                  {displayed.artist} · {displayed.year}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-900">
                  {displayed.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-800/85">{displayed.description}</p>
                <p className="mt-3 text-xs text-ink-700/70">{displayed.medium}</p>
                <p className="mt-1 text-xs text-ink-700/60">Image: Art Institute of Chicago</p>
              </aside>
            )}
          </div>
        )}

        {loaderVisible && needsLoader && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <PaintLoader label="Hanging the next work" />
          </div>
        )}

        {!allFailed && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2 sm:px-6">
            <button
              type="button"
              onClick={() => go('prev')}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card ring-1 ring-ink-900/10 backdrop-blur transition hover:-translate-x-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-900"
              aria-label="Previous painting"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path d="M14.5 5.75 8.25 12l6.25 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go('next')}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card ring-1 ring-ink-900/10 backdrop-blur transition hover:translate-x-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-900"
              aria-label="Next painting"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path d="M9.5 5.75 15.75 12 9.5 18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {notice && (
          <div
            className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-ink-900/90 px-4 py-2 text-xs text-sand-50 shadow-card"
            role="status"
          >
            {notice}
          </div>
        )}
      </main>

      {!allFailed && displayed && (
        <footer className="flex h-14 items-center justify-between gap-4 px-5 pr-24 text-xs text-ink-700/80 sm:pr-48">
          <p className="min-w-0 truncate">
            <span className="font-semibold text-ink-900">{displayed.title}</span>
            <span className="text-ink-700/60"> · {displayed.artist}</span>
          </p>
          <p className="hidden shrink-0 tabular-nums sm:block">
            {displayedIndex + 1} / {feed.length} · tap the painting for details
          </p>
        </footer>
      )}

      {displayed && !allFailed && <ChatBot painting={displayed} />}
    </div>
  )
}

export default App
