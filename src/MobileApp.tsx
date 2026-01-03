import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { paintings } from './data/paintings'
import Frame3D from './components/Frame3D'
import PaintLoader from './components/PaintLoader'

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function MobileApp() {
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<'next' | 'prev' | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const feed = useMemo(() => shuffle(paintings), [])
  const [imageAspect, setImageAspect] = useState<number>(0.75)
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  })
  const slideResetTimeoutRef = useRef<number | null>(null)
  const [webglStatus, setWebglStatus] = useState<'loading' | 'ready' | 'context_lost'>('loading')
  const [loaderVisible, setLoaderVisible] = useState(false)
  const loaderTimeoutRef = useRef<number | null>(null)

  const webglEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    try {
      const canvas = document.createElement('canvas')
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!slideDir) return undefined
    if (slideResetTimeoutRef.current) {
      window.clearTimeout(slideResetTimeoutRef.current)
    }
    slideResetTimeoutRef.current = window.setTimeout(() => {
      setSlideDir(null)
    }, 620)

    return () => {
      if (slideResetTimeoutRef.current) window.clearTimeout(slideResetTimeoutRef.current)
      slideResetTimeoutRef.current = null
    }
  }, [slideDir])

  useEffect(() => {
    const displayed = feed[displayedIndex]
    if (!displayed) return
    let canceled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (canceled) return
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImageAspect(img.naturalWidth / img.naturalHeight)
      }
    }
    img.src = displayed.imageUrl
    return () => {
      canceled = true
    }
  }, [feed, displayedIndex])

  const handleNext = () => {
    setInspecting(false)
    setSlideDir('next')
    setRequestedIndex((prev) => (prev + 1) % feed.length)
  }

  const handlePrev = () => {
    setInspecting(false)
    setSlideDir('prev')
    setRequestedIndex((prev) => (prev - 1 + feed.length) % feed.length)
  }

  const requested = feed[requestedIndex]
  const displayed = feed[displayedIndex]

  const placement = viewport.w >= 900 ? 'right' : 'bottom'
  const plaqueGap = 18
  const plaqueW = Math.min(360, Math.max(260, Math.round(viewport.w * 0.28)))
  const plaqueH = Math.min(240, Math.max(180, Math.round((viewport.h - 64) * 0.26)))

  const reservedW = inspecting && placement === 'right' ? plaqueW + plaqueGap : 0
  const reservedH = inspecting && placement === 'bottom' ? plaqueH + plaqueGap : 0

  const availableW = Math.min(Math.max(240, viewport.w * 0.98 - reservedW), 1600)
  const availableH = Math.min(Math.max(240, (viewport.h - 64) * 0.98 - reservedH), 1600)
  const fit =
    imageAspect >= availableW / availableH
      ? { w: availableW, h: availableW / imageAspect }
      : { w: availableH * imageAspect, h: availableH }

  const cardStyle = displayed ? { width: `${fit.w}px`, height: `${fit.h}px` } : undefined

  const gestureRef = useRef<{ x: number; y: number; moved: boolean; pointerId: number | null }>({
    x: 0,
    y: 0,
    moved: false,
    pointerId: null,
  })

  const handleCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement | null)?.closest('button')) return
    gestureRef.current = { x: e.clientX, y: e.clientY, moved: false, pointerId: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleCardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gestureRef.current.pointerId !== e.pointerId) return
    const dx = e.clientX - gestureRef.current.x
    const dy = e.clientY - gestureRef.current.y
    if (dx * dx + dy * dy > 100) {
      gestureRef.current.moved = true
    }
  }

  const handleCardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gestureRef.current.pointerId !== e.pointerId) return
    if (!gestureRef.current.moved) {
      setInspecting((prev) => !prev)
    }
    gestureRef.current.pointerId = null
  }

  const restRotation =
    inspecting
      ? placement === 'right'
        ? { x: 0.06, y: -0.18 }
        : { x: 0.12, y: 0 }
      : { x: 0, y: 0 }

  const waitingForNext = requestedIndex !== displayedIndex
  const requestedUrl = requested?.imageUrl ?? null

  useEffect(() => {
    if (loaderTimeoutRef.current) window.clearTimeout(loaderTimeoutRef.current)

    if (!waitingForNext && webglStatus !== 'context_lost') {
      loaderTimeoutRef.current = window.setTimeout(() => setLoaderVisible(false), 0)
      return () => {
        if (loaderTimeoutRef.current) window.clearTimeout(loaderTimeoutRef.current)
        loaderTimeoutRef.current = null
      }
    }

    const delay = webglStatus === 'context_lost' ? 0 : 240
    loaderTimeoutRef.current = window.setTimeout(() => setLoaderVisible(true), delay)
    return () => {
      if (loaderTimeoutRef.current) window.clearTimeout(loaderTimeoutRef.current)
      loaderTimeoutRef.current = null
    }
  }, [waitingForNext, webglStatus])

  const preloadSeqRef = useRef(0)
  useEffect(() => {
    if (webglEnabled) return
    if (!requested) return
    if (requestedIndex === displayedIndex) return

    const seq = (preloadSeqRef.current += 1)
    let canceled = false

    const attemptLoad = (attempt: number) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (canceled) return
        if (seq !== preloadSeqRef.current) return
        setDisplayedIndex(requestedIndex)
      }
      img.onerror = () => {
        if (canceled) return
        if (seq !== preloadSeqRef.current) return
        if (attempt >= 2) return
        window.setTimeout(() => attemptLoad(attempt + 1), 450)
      }
      img.src = requested.imageUrl
    }

    attemptLoad(0)

    return () => {
      canceled = true
    }
  }, [displayedIndex, requested, requestedIndex, webglEnabled])

  return (
    <div className="min-h-screen bg-sand-50 text-ink-800 font-mobile">
      <header className="sticky top-0 z-20 border-b border-ink-800/5 bg-sand-50/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-4">
          <div className="text-2xl font-semibold uppercase tracking-[0.45em] text-ink-900 font-display">
            GOART
          </div>
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-2 py-2">
        <div
          className={`flex items-center justify-center gap-6 transition-all duration-500 ${
            inspecting && placement === 'bottom' ? 'flex-col' : 'flex-row'
          }`}
        >
          <div
            className={`relative overflow-hidden rounded-2xl transition duration-700 ${
              slideDir === 'next' ? 'slide-next' : slideDir === 'prev' ? 'slide-prev' : ''
            } ${
              webglEnabled
                ? 'bg-transparent ring-0 shadow-none'
                : 'bg-sand-100 ring-1 ring-ink-800/8 shadow-card'
            }`}
            style={{
              ...(webglEnabled ? { boxShadow: 'none' } : {}),
              ...(cardStyle ?? {}),
            }}
            onPointerDown={handleCardPointerDown}
            onPointerMove={handleCardPointerMove}
            onPointerUp={handleCardPointerUp}
          >
            {displayed && (
              <>
                {!webglEnabled && (
                  <div className="absolute inset-0">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `url(${displayed.imageUrl})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                      }}
                      aria-label={`${displayed.title} by ${displayed.artist}`}
                      role="img"
                    />
                  </div>
                )}
                {webglEnabled && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className={`h-full w-full transition-opacity duration-300 ${
                          waitingForNext || webglStatus !== 'ready' ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          backgroundImage: `url(${displayed.imageUrl})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundSize: 'contain',
                        }}
                        aria-hidden
                      />
                    </div>
                    <Frame3D
                      imageUrl={requested?.imageUrl ?? displayed.imageUrl}
                      direction={slideDir}
                      frozen={inspecting}
                      restRotation={restRotation}
                      onRenderStatus={(status) => setWebglStatus(status)}
                      onTextureReady={(readyUrl) => {
                        if (!readyUrl) return
                        if (requestedUrl && readyUrl !== requestedUrl) return
                        if (requestedIndex !== displayedIndex) setDisplayedIndex(requestedIndex)
                        setLoaderVisible(false)
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {loaderVisible && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <PaintLoader className="transform-gpu" />
            </div>
          )}

          {displayed && inspecting && (
            <aside
              className="max-w-sm rounded-2xl border border-ink-900/10 bg-sand-100/90 px-5 py-4 text-ink-900 shadow-card backdrop-blur transition-all duration-500"
              style={
                placement === 'right'
                  ? { width: `${plaqueW}px` }
                  : { width: `${Math.min(fit.w, viewport.w * 0.94)}px`, maxHeight: `${plaqueH}px` }
              }
              onClick={() => setInspecting(false)}
            >
              <p className="text-[11px] uppercase tracking-[0.32em] text-ink-700/70">
                {displayed.artist} · {displayed.year}
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink-900">
                {displayed.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-800/80">{displayed.description}</p>
              <p className="mt-3 text-xs text-ink-700/70">{displayed.medium}</p>
              <p className="mt-3 text-xs text-ink-700/70">Tap anywhere to close.</p>
            </aside>
          )}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card ring-1 ring-ink-900/10 transition hover:-translate-x-1 hover:bg-white"
            aria-label="Previous painting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M14.5 5.75 8.25 12l6.25 6.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card ring-1 ring-ink-900/10 transition hover:translate-x-1 hover:bg-white"
            aria-label="Next painting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M9.5 5.75 15.75 12 9.5 18.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  )
}

export default MobileApp
