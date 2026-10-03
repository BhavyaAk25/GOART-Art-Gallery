let cached: boolean | null = null

/**
 * Detects WebGL support once and caches the result.
 *
 * Probing creates a real WebGL context, and browsers cap active contexts (~16).
 * Probing on every render used to exhaust that limit and evict the live
 * renderer's context, so we probe a single time and release the probe context.
 */
export function canUseWebGL(): boolean {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    cached = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
