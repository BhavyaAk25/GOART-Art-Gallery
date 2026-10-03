import { fetchIiifImage } from '../server/iiif.js'

// Vercel serverless function: GET /iiif/<image-id>/full/843,/0/default.jpg
// (vercel.json rewrites /iiif/* to /api/iiif?path=*)
export async function GET(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path') ?? ''
  return fetchIiifImage(path)
}
