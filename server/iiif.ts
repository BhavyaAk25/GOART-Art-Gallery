/**
 * Same-origin image proxy for the Art Institute of Chicago IIIF service.
 *
 * Why: artic.edu rejects image requests that carry a third-party `Referer`
 * (hotlink protection) with a 403 that has no CORS headers. Browsers report that
 * as a CORS error, and WebGL can't use the image, which left frames blank.
 * Fetching server-side without browser headers avoids the block.
 *
 * Only exact IIIF image paths are allowed, so this cannot be used as an open proxy.
 */

const IIIF_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/full\/\d{2,4},\/0\/default\.jpg$/

export function upstreamUrl(path: string): string | null {
  return IIIF_PATH.test(path) ? `https://www.artic.edu/iiif/2/${path}` : null
}

export async function fetchIiifImage(path: string): Promise<Response> {
  const url = upstreamUrl(path)
  if (!url) return new Response('Not found', { status: 404 })

  const upstream = await fetch(url, {
    headers: { Accept: 'image/jpeg', 'User-Agent': 'GOART-Gallery/1.0 (+https://goart-art-gallery.vercel.app)' },
    signal: AbortSignal.timeout(15_000),
  }).catch((error: unknown) => {
    console.error('IIIF fetch failed', url, error)
    return null
  })

  if (!upstream || !upstream.ok) {
    const detail = upstream ? String(upstream.status) : 'network-error'
    if (upstream) console.error('IIIF upstream error', url, upstream.status)
    return new Response('Image unavailable', {
      status: 502,
      headers: { 'Cache-Control': 'no-store', 'X-Upstream-Status': detail },
    })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
      // Cache in the browser for a day and on Vercel's CDN for 30 days.
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    },
  })
}
