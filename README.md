# GOART —  Art Gallery (Matisse + Picasso + Hokusai)

A lightweight React + TypeScript + Vite mobile art gallery for exploring masterworks by Matisse, Picasso, and Hokusai. Museum-wall style viewer with 3D wooden frames, interactive tilt controls, curated descriptions, and **AI-powered chat** to learn more about each painting. Designed to keep the art first: warm neutral palette, luxe display type, minimal chrome.

## Live Demo
🔗 **https://goart-art-gallery.vercel.app/**

## What this is
- **Museum-wall viewer**: painting defines the frame, scaling to fit the viewport while preserving aspect ratio (portrait/landscape).
- **3D wooden frames**: WebGL-powered frames with drag-to-tilt interaction and wooden plank texture on the back.
- **Navigation**: Side arrows to browse paintings; tap to reveal an "inspect" plaque with title/artist/year/medium/description.
- **AI Art Guide**: Chat with an AI to ask questions about each painting—learn about technique, history, artist background, symbolism, and more.
- **Content**: 30 paintings (10 Matisse, 10 Picasso, 10 Hokusai) pulled from the Art Institute of Chicago IIIF service, with two-sentence descriptions.
- **Responsive**: Works on both mobile devices and desktop browsers.

## AI Chat Feature

The AI Art Guide allows users to have conversations about each painting. When viewing a painting, users can:
- Ask about the artist's technique and style
- Learn about the historical context
- Understand symbolism and meaning
- Compare with other works
- Get educational insights

**Tech Stack for AI:**
- **Groq API** - Fast AI inference with Llama 3.1 model
- Context-aware prompts include painting metadata (title, artist, year, medium, description)
- Streaming responses for real-time chat experience

## Stack & rationale
- **React + TypeScript + Vite**: fast dev server + typed components.
- **Tailwind CSS 3.4**: rapid styling and theme tokens; chose to pin v3 after the v4 CLI path was unreliable.
- **Fonts**: Cormorant Garamond (masthead, “luxury” feel), Space Grotesk (body), Manrope (mobile UI clarity). Loaded via Google Fonts in `src/index.css`.
- **Three.js (mobile 3D frame)**: lightweight WebGL box frame for the active card (painting on front, wood sides/back, drag-to-tilt), with CSS fallback when WebGL is unavailable or reduced-motion is set.
- **IIIF images**: Art Institute of Chicago API delivers stable, hotlink-friendly JPEGs (Wikimedia/WikiArt returned 403/404). URLs are direct `https://www.artic.edu/iiif/2/{image_id}/full/1200,/0/default.jpg`.

## Setup
- Requirements: Node 18+ (tested on Node 22) and npm.
- Install: `npm install`

## Run
- **Development**: `npm run dev` → open the shown localhost (usually `http://localhost:5173/`).
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Key files
- `src/MobileApp.tsx` — main app component with gallery logic, navigation, and inspect mode.
- `src/mobile.tsx` + `mobile.html` — app entry point.
- `src/components/Frame3D.tsx` — Three.js 3D frame (builds box geometry to match each painting's aspect and fits camera to avoid clipping).
- `src/components/PaintLoader.tsx` — brush-only loading indicator (used when a slide is "slow" or WebGL context is lost).
- `src/data/paintings.ts` — the dataset of 30 paintings (10 Matisse, 10 Picasso, 10 Hokusai) with title/artist/year/medium/description/imageUrl. Edit or extend here to change content.
- `src/index.css` — global theme, fonts, and animations (`slide-next/slide-prev`).
- `tailwind.config.js` — theme tokens (sand/ink palette, fonts).

## Interactions & behavior
- **Navigation**: Side arrows navigate between paintings with smooth slide transitions and scale animations.
- **3D Interaction**: Drag/swipe to tilt and rotate the wooden frame; the painting stays centered while the frame moves around it.
- **Inspect Mode**: Tap (not drag) to reveal a museum-style plaque with title, artist, year, medium, and description. The plaque appears beside (desktop) or below (mobile) the painting.
- **Aspect Preservation**: Each painting scales to fit the viewport while maintaining its original aspect ratio (portrait/landscape).
- **State Management**: Keeps navigation state and tilt rotation; requested vs displayed indices prevent blank frames during loading.
- **Loading**: images are remote IIIF JPEGs. If the IIIF service is offline, images can fail to load; replace URLs in `src/data/paintings.ts` if needed.
- **Smooth transitions**: Keeps the last displayed painting on screen until the next painting is ready, then crossfades in WebGL (or swaps in the fallback image path).
- **Loading indicator**: A brush-only loader appears only if the next painting takes longer than a short threshold to become ready (and appears immediately during WebGL context loss).

## Content choices (why AIC IIIF)
- Initial Wikimedia/WikiArt links returned 403/404 in-browser due to hotlink protection.
- Switched to Art Institute of Chicago’s IIIF API: stable, public-domain images, consistent sizing.
- Each entry has a two-sentence description to give more interpretive context than the earlier one-liners.

## Design notes
- **Palette**: warm beige background with subtle radial accents; dark ink text; minimal chroma so the paintings lead.
- **Type**: Cormorant Garamond for the GOART masthead; Manrope for UI clarity and legibility.
- **3D Frames**: soft shadows (`shadow-card`), wooden texture on back, rounded corners; paintings sit on transparent planes in front of the frame.
- **Motion**: Card transitions use eased translate/scale + tilt; 3D frame interaction via WebGL (with CSS fallback for non-WebGL browsers).

## Known constraints / gotchas
- Requires network to load IIIF images.
- If you add new works from AIC, grab `image_id` from their API and use the same IIIF URL pattern. If you use another museum, ensure hotlinking is allowed.
- WebGL texture load timing: the 3D frame loads textures asynchronously; the UI keeps showing the previous painting until the new texture is ready, and then fades to it.
- WebGL context loss (Chrome DevTools device emulation / heavy GPU load): some environments can intermittently lose the WebGL context (the renderer goes blank). The app detects this, shows a loader + last-known image, and rebuilds the renderer after restore.

## How to extend
- Add or reorder works in `src/data/paintings.ts` (currently 30 paintings from Matisse, Picasso, and Hokusai); the feeds shuffle on load.
- Adjust palette or typography in `tailwind.config.js` and `src/index.css`.
- Tweak mobile animation timing in `src/index.css` (`slide-next`/`slide-prev`).
- Add more metadata chips in the overlay if desired (movement, museum, tags).

## Engineering notes

### Rendering modes
- **WebGL mode** (preferred): `Frame3D` renders the frame and painting as textures on a plane.
- **Non‑WebGL fallback**: uses a `background-image` centered/contained, so the browser never flashes its broken-image placeholder mid-transition.

### State model: requested vs displayed
The app uses two indices:
- **Requested**: the user’s target slide (changes immediately on next/prev).
- **Displayed**: the slide currently guaranteed to be renderable (only changes after the new painting is ready).

This prevents:
- “Flash” when a new image is still loading.
- Blank/broken UI when users tap next/prev rapidly.

### Texture loading & crossfade
- WebGL mode keeps rendering the current painting until the next texture finishes loading.
- Once ready, it crossfades inside WebGL (no DOM overlay needed).

### WebGL context loss resilience
Some environments (especially Chrome DevTools device emulation) can lose the WebGL context.
When this happens:
- The renderer pauses.
- The UI shows the last-known painting behind a loader.
- When the context is restored, `Frame3D` rebuilds the renderer and reloads the last requested URL.

### Loader behavior
- The loader is a **brush-only orbit**.
- It appears only after a short delay if the next painting still isn’t ready.
- During WebGL context loss, it shows immediately.

## Brief history of fixes
- **Image reliability**: Wikimedia/WikiArt → 403/404; switched to Art Institute IIIF.
- **Tailwind CLI**: Tailwind 4 alpha tooling failed locally; pinned to Tailwind 3.4 and re-inited config.
- **Desktop cropping**: switched desktop images to `object-contain` to prevent artwork from being cut off.
- **Mobile “boxed” art**: moved from a fixed-size “card” to a viewport-fit layout where the painting’s aspect defines the frame.
- **Mobile 3D frame correctness**: fixed face assignment (front vs back), CORS texture loading, and camera fit so the painting isn’t clipped when tilting.
- **Mobile blank frames**: texture could load before the scene was ready; fixed by queueing the pending URL until the mesh exists and adding a placeholder image until `Frame3D` signals texture readiness.
- **Mobile inspect mode**: added tap-vs-drag detection so a tap reveals a museum-style plaque without interfering with tilt interaction; navigation closes the plaque.
- **Transitions**: added slide/scale animation and keyed renders for deck feel; added ink-wipe overlay, Ken Burns idle drift on desktop.
- **Mobile no-flash + context stability**: eliminated the “broken image / white flash” during navigation by keeping “displayed vs requested” state on mobile, crossfading textures inside WebGL, handling WebGL context loss/restores, and showing a brush-only loader only when needed.
- **Frame polish**: increased tilt range for more tactile interaction; added a wooden-planks back texture; reduced z-fighting/edge artifacts by controlling render order and separation.

## Verification
- `npm run lint`
- `npm run build`

## Troubleshooting
### If a painting doesn’t appear immediately
- The mobile viewer is designed to keep showing the last-good painting until the next is ready; on slow networks you should see the loader briefly.

### If you see repeated redirects in Network
- AIC image requests commonly appear as `307 → 200` redirects to their CDN; this is expected.
- If you enabled **Disable cache** in DevTools, you’ll force more network/texture churn and may trigger context loss more easily.

### If you see WebGL “Context Lost/Restored” in Console
- This can happen in Chrome DevTools device emulation or under GPU pressure.
- Close other GPU-heavy tabs, avoid **Disable cache** during normal use, and retry; the app will rebuild the renderer after restore.

### Debug checklist (fast)
1) DevTools → Network: filter `artic.edu`, watch for `200`, `(canceled)`, or `ERR_*`.
2) DevTools → Console: look for WebGL context lost/restored messages.
3) Test without device emulation to see if the issue is emulation-only.

## Quick start (TL;DR)
1) `npm install`
2) `npm run dev`
3) Edit `src/data/paintings.ts` to swap or add works.

## Implementation Notes: AI Chat Feature

### Files to create:
1. `src/components/ChatBot.tsx` - Chat UI component with:
   - Floating chat button (bottom-right corner)
   - Expandable chat dialog
   - Message input field
   - Message history display
   - Loading states

2. `src/services/groq.ts` - Groq API integration:
   - Function to call Groq API with painting context
   - System prompt that includes painting metadata
   - Error handling

### Integration points:
- Add ChatBot component to `MobileApp.tsx`
- Pass current painting data to ChatBot
- ChatBot receives: title, artist, year, medium, description

### Environment variables (for Vercel):
- `VITE_GROQ_API_KEY` - Groq API key (set in Vercel dashboard)

### API endpoint pattern:
```javascript
// Groq API call
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: `You are an art expert...` },
      { role: 'user', content: userQuestion }
    ]
  })
})
```

### Hackathon Submission:
- **Event**: InnovArt 2026 (https://innovart2026.devpost.com/)
- **Deadline**: January 3, 2026 at 12:00 PM EST (8:00 PM Kuwait)
- **Requirements**: Submit to Devpost + Register presentation + Present Jan 4

## Problems Faced & Solutions

### Problem 1: Image 403/404 Errors
**Issue**: Initial image sources (Wikimedia/WikiArt) returned 403/404 due to hotlink protection.
**Solution**: Switched to Art Institute of Chicago's IIIF API which allows public hotlinking.
**URL Pattern**: `https://www.artic.edu/iiif/2/{image_id}/full/1200,/0/default.jpg`

### Problem 2: Images Not Loading (Loader Spinning)
**Issue**: Paintings show loader indefinitely, broken image icon appears.
**Possible Causes**:
- Art Institute API temporarily slow/down
- Network connectivity issues
- Browser cache with stale data
**Solutions**:
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Check DevTools Network tab for failed requests
- Try different browser
- Wait and retry (API may be temporarily slow)

### Problem 3: Tailwind CSS v4 Issues
**Issue**: Tailwind v4 CLI tooling was unreliable during setup.
**Solution**: Pinned to Tailwind CSS v3.4 for stability.

### Problem 4: WebGL Context Loss
**Issue**: Chrome DevTools device emulation or GPU pressure causes WebGL context loss.
**Solution**: App detects context loss, shows fallback image + loader, rebuilds renderer on restore.

### Problem 5: Mobile Blank Frames During Navigation
**Issue**: White flash/blank frames when switching paintings quickly.
**Solution**: Implemented "requested vs displayed" state model - keeps showing current painting until next one is fully loaded.

### Problem 6: GitHub Push Authentication
**Issue**: GitHub no longer accepts passwords for git operations.
**Solution**: Use Personal Access Token (PAT) instead of password:
1. Create token at https://github.com/settings/tokens
2. Use token as password when git asks for credentials
3. Revoke token after use for security

### Problem 7: Environment Variables for API Keys
**Issue**: Need to store API keys securely without committing to git.
**Solution**:
- Local: Use `.env.local` file (already in .gitignore via `*.local`)
- Vercel: Add environment variables in Vercel dashboard
- Variable format: `VITE_GROQ_API_KEY=your_key_here`

### Problem 8: Hidden Files Not Visible
**Issue**: `.env.local` file not visible in Finder (macOS).
**Solution**:
- Press Cmd+Shift+. in Finder to show hidden files
- Or use terminal: `nano /path/to/.env.local`  
