import { handleChat } from '../server/chat.js'

// Vercel serverless function: POST /api/chat
// Requires GROQ_API_KEY (server-side only, never VITE_-prefixed). Optional: GROQ_MODEL.

// Best-effort per-instance rate limit so the public endpoint can't easily drain the Groq quota.
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 15
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5_000) hits.clear()
  return recent.length > MAX_REQUESTS_PER_WINDOW
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return Response.json({ error: 'You’re asking quickly! Please wait a moment and try again.' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = await handleChat(payload, process.env.GROQ_API_KEY, process.env.GROQ_MODEL || undefined)
  return Response.json(result.body, { status: result.status })
}
