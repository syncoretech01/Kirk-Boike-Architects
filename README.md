# Kirk Boike Architects

Marketing site for Kirk Boike Architects, a residential architecture and structural design studio in Port Townsend, Washington.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Stack

- Vite, vanilla JS, native CSS (design tokens in `src/styles/main.css`)
- Three.js: one shared WebGL canvas (`src/three/stage.js`) renders four views of a procedural house model (`src/three/house.js`)
- GSAP + ScrollTrigger + Flip + SplitText for scroll choreography, pins and the project card morph
- Lenis for smooth scrolling
- Motion (`motion`) for in-view reveals and magnetic buttons
- anime.js for the blueprint loading animation

## Where things live

| Section | Files |
| --- | --- |
| Loader (blueprint drawing) | `src/ui/loader.js` |
| Hero (plan to 3D morph, drag to rotate) | `src/three/views/hero.js` |
| Services (scroll-controlled assembly) | `src/three/views/assembly.js` |
| Structural x-ray hover | `src/ui/xray.js`, `src/ui/edges.js` |
| Projects (card to fullscreen morph, before/after slider) | `src/ui/projects.js`, `src/data/projects.js` |
| Drawing to render wipe | `src/ui/render.js` |
| Anatomy explorer (explode, cutaway, x-ray, hotspots, layer reveal) | `src/three/views/explorer.js` |
| Interior to exterior fly-through | `src/three/views/flythrough.js` |
| Process timeline (horizontal) | `src/ui/process.js` |
| Studio and site plan parallax | `src/ui/studio.js` |
| Contact form | `src/ui/contact.js` |

## Content to replace before launch

- Project photography in `src/data/projects.js` and the section images in `index.html` are Picsum placeholders.
- Testimonials in `index.html` are sample copy.
- The contact form hands off to `hello@kirkboikearchitects.com` via `mailto:` in `src/ui/contact.js`; swap in the studio's real address or a form endpoint.
