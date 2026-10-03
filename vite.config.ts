import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleChat } from './server/chat.js'

// Dev-only mirror of the Vercel function in api/chat.ts.
const devApi = (apiKey: string | undefined, model: string | undefined): Plugin => ({
  name: 'goart-dev-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end()
        return
      }
      let raw = ''
      req.on('data', (chunk) => {
        raw += chunk
      })
      req.on('end', async () => {
        let payload: unknown
        try {
          payload = JSON.parse(raw)
        } catch {
          payload = null
        }
        const result = await handleChat(payload, apiKey, model)
        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result.body))
      })
    })
  },
})

export default defineConfig(({ mode }) => {
  // Load all env vars (not only VITE_*) for server-side use. These are never exposed to the client.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), devApi(env.GROQ_API_KEY, env.GROQ_MODEL || undefined)],
    build: {
      rollupOptions: {
        output: {
          // three.js is large and rarely changes; keep it in its own cacheable chunk.
          manualChunks: { three: ['three'] },
        },
      },
    },
  }
})
