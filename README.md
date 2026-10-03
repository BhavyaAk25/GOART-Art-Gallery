# GOART — Art Gallery

**🏆 Winner, Excellence in Art Curation Award · [InnovArt 2026 Hackathon](https://innovart2026.devpost.com/)**

GOART is a museum-wall gallery for the web. It shows 30 works by **Henri Matisse**, **Pablo Picasso**, and **Katsushika Hokusai** in tactile 3D wooden frames, each with a short curator's note and an **AI art guide** you can question about the piece.

🔗 **Live:** https://goart-art-gallery.vercel.app/

## Features

- **3D frames:** each painting sits in a WebGL wooden frame sized to its real aspect ratio. Drag to tilt it and see the wood-plank back.
- **Museum plaque:** tap or click a painting (or press <kbd>I</kbd>) for its title, date, medium, and a two-sentence note.
- **AI Art Guide:** ask about technique, history, symbolism, or the artist. Answers come from Groq through a server-side function, so the API key never reaches the browser.
- **Smooth browsing:** the current painting stays on screen until the next one is ready, then crossfades in. Neighbouring works are preloaded, and a painterly loader appears only if loading is slow.
- **Resilient:** any painting that fails to load is skipped with a short notice instead of leaving a blank frame.
- **Accessible and responsive:** works on phones and desktops, supports keyboard navigation (<kbd>←</kbd> <kbd>→</kbd> <kbd>Esc</kbd>), and respects `prefers-reduced-motion` (falls back to flat images).

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS 3.4 · Cormorant Garamond + Manrope |
| 3D | three.js (with a flat-image fallback when WebGL is unavailable) |
| AI | Groq Chat Completions (`openai/gpt-oss-120b` by default) via a Vercel function |
| Hosting | Vercel (static site + `api/` serverless functions) |

## Getting started

Requires Node 18+ (tested on Node 22).

```bash
npm install
cp .env.example .env.local   # then add your GROQ_API_KEY
npm run dev                  # http://localhost:5173
```

The gallery works without a key. Only the Art Guide needs `GROQ_API_KEY`; without one it shows a friendly "not configured" message.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server, including a local version of `/api/chat` |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build locally (static only, no API routes) |
| `npm run lint` | ESLint |

## Deploying to Vercel

1. Import the repo into Vercel (framework preset: **Vite**).
2. Under **Settings → Environment Variables**, add `GROQ_API_KEY`. Optionally add `GROQ_MODEL`.
3. Deploy. `vercel.json` sets long cache headers for the bundled images.

> ⚠️ Use `GROQ_API_KEY`, **not** `VITE_GROQ_API_KEY`. Anything prefixed with `VITE_` is embedded in the public JavaScript bundle.

## Project structure

```
api/
  chat.ts            Vercel function: POST /api/chat (Art Guide, rate limited)
server/
  chat.ts            Shared chat logic: validation, prompt, Groq call
public/paintings/    Public-domain images, bundled locally
src/
  App.tsx            Gallery: navigation, loading state, plaque, layout
  components/
    Frame3D.tsx      three.js frame, texture crossfade, drag-to-tilt, context-loss recovery
    PaintLoader.tsx  Brush-stroke loading indicator
    ChatBot.tsx      Art Guide chat UI
  data/paintings.ts  The 30 works: metadata, notes, and image paths
  lib/webgl.ts       One-time WebGL capability check
```

## Images and licensing

All artwork images come from the [Art Institute of Chicago](https://www.artic.edu/) (AIC) collection.

- **Public-domain works** (all Hokusai prints and three Matisse paintings) are bundled in `public/paintings/` and served as static files.
- **Works still under copyright** (most Matisse and all Picasso) are **not** stored in this repository. They load directly from AIC's IIIF service at its reduced, fair-use size (843px).

**Why `no-referrer`?** AIC blocks image requests that carry a third-party `Referer` (hotlink protection). The 403 it returns has no CORS headers, so the browser reports a CORS error, WebGL can't use the image, and the frame stays blank. `index.html` sets `<meta name="referrer" content="no-referrer">`, so the requests go through. Don't remove it. (A server-side proxy doesn't work either, because AIC also blocks Vercel's datacenter IPs.)

### Adding a painting

1. Find the work with the [AIC API](https://api.artic.edu/docs/) and note its `image_id` and `is_public_domain`.
2. Add an entry to `src/data/paintings.ts`:
   - public domain: download `https://www.artic.edu/iiif/2/{image_id}/full/1200,/0/default.jpg` to `public/paintings/{id}.jpg`, then use `imageUrl: '/paintings/{id}.jpg'`
   - otherwise: `imageUrl: 'https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg'`

## How it works

- **Requested vs. displayed:** the app tracks the painting the visitor asked for separately from the one that is ready to show. The display only switches once the new image has loaded, so fast tapping never flashes a blank frame.
- **WebGL lifecycle:** WebGL support is checked once and cached. Probing on every render used to create a new context each time and exhaust the browser's limit, which evicted the live frame. If the context is still lost (for example under GPU pressure), the app shows the flat image and loader, then rebuilds the renderer when the context comes back.
- **Art Guide safety:** the client sends only a painting id and the conversation. The server looks up the painting itself, builds the system prompt, limits history length and message size, and rate-limits each IP. Replies render as plain text.

## Credits

Built by Bhavya Khimavat for InnovArt 2026. Artwork images courtesy of the Art Institute of Chicago. Code released under the [MIT License](LICENSE). The license covers the code, not the artworks.
