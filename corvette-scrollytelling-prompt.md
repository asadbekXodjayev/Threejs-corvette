# Corvette Legacy — A Scrollytelling 3D Experience

**Master build prompt for Claude Code (Opus 4.8).** Paste this whole document as
your first message in a fresh Claude Code session. It's written as one
continuous brief but sequenced so Opus can build it in checkpointed phases
(see "Build Phases" at the end) instead of attempting everything in one shot.

---

## 0. Mission

Build an award-winning, single-page scrollytelling website that tells the
story of three generations of Corvette through 3D. As the user scrolls, the
camera moves cinematically around each car, text and specs reveal in sync,
and the experience feels like a Porsche/Apple-product-page-grade automotive
film — not a product configurator with an orbit control bolted on.

**Reference bar:** think Awwwards Site of the Day for automotive/luxury
brands — Lusion, Active Theory, Resn-style motion craft. Confident easing,
generous negative space, typography that feels like a spec sheet, and camera
work that never feels like a default OrbitControls demo.

## 1. The cars (assets the user will provide)

Three `.glb` files, placed by the user at:

```
/public/models/01-c5-black.glb
/public/models/02-z06-carbon-2011.glb
/public/models/03-zr1-c6.glb
```

| Chapter | Car | Chapter title | Environment | Mood |
|---|---|---|---|---|
| 1 | C5 Corvette, black | **"The Reawakening"** | Forest backroad at twilight, storm rolling in, rain, constant lightning | Raw and elemental — the car unleashed into weather, shot handheld |
| 2 | 2011 Corvette Z06 Carbon | **"The Purist"** | Empty race track / pit lane, golden hour | Naturally-aspirated, track-bred. Macro texture shots of carbon weave. |
| 3 | C6 ZR1 | **"The Apex Predator"** | Moody concrete garage, tight overhead spots, volumetric haze | Supercharged, engineered — the reveal of what's under the hood window |

Every chapter gets its own fully art-directed environment, not a shared
generic backdrop — see §6 for the full build spec on each.

Create `/src/config/cars.config.js` (or `.ts`) as a single source of truth —
filename, display name, chapter title, tagline, spec chips, and per-chapter
camera keyframes (see §5) all live here, so the story content is data-driven
and easy to edit without touching component code.

**Do not hardcode specs you can't verify against the actual trim in the
file** — use the copy below as the real narrative content, but if the user's
specific C5 trim (base/Z06/convertible) changes the numbers, ask them or mark
the field `TODO: confirm`.

### Narrative copy (use this verbatim as the default content)

**Chapter 1 — C5, black — "The Reawakening"**
> 1997. A clean-sheet platform. The first Corvette built around a hydroformed
> perimeter frame and a rear-mounted transaxle for near-perfect weight
> balance. This is the car that re-earned Corvette's seat among the world's
> great sports cars.
- ENGINE — LS1 5.7L V8
- POWER — ~345 HP *(confirm trim/year)*
- ARCHITECTURE — Hydroformed frame · rear transaxle · 50/50 weight balance

**Chapter 2 — 2011 Z06 Carbon — "The Purist"**
> No turbo. No supercharger. Just 7.0 liters of naturally-aspirated V8
> breathing through a 7,000 RPM redline. Carbon fiber where it matters most —
> hood, roof, splitter — cut weight without cutting character.
- ENGINE — LS7 7.0L V8 (427 ci)
- POWER — 505 HP / 470 LB-FT
- SIGNATURE — Carbon fiber hood, roof & front splitter
- REDLINE — 7,000 RPM

**Chapter 3 — C6 ZR1 — "The Apex Predator"**
> Codenamed Blue Devil. An Eaton supercharger sits under a window of
> polycarbonate glass, visible through the hood — proof of what's making 638
> horsepower. At launch, it was the fastest, most powerful production
> Corvette ever built.
- ENGINE — LS9 6.2L Supercharged V8
- POWER — 638 HP / 604 LB-FT
- TOP SPEED — 205 MPH
- BRAKES — Brembo carbon-ceramic
- SIGNATURE — Polycarbonate hood window over the supercharger

**Finale**
> Headline: "THREE GENERATIONS. ONE BLOODLINE."
> A side-by-side comparison table of all three cars' specs, plus a closing
> CTA / credits panel.

## 2. Tech stack

```
Vite + React + TypeScript
three, @react-three/fiber, @react-three/drei
gsap + gsap/ScrollTrigger
@studio-freight/lenis        // smooth scroll, bound to ScrollTrigger's scroller proxy
postprocessing / @react-three/postprocessing   // Bloom, Vignette, tone mapping
zustand                      // lightweight global state: loading progress, active chapter, audio on/off
```

Why this combo over alternatives: R3F because this is a React app; GSAP
ScrollTrigger + Lenis is the proven pairing for pinned, scrubbed,
scroll-driven cinematic sequences (Theatre.js is the alternative if you'd
rather keyframe camera moves visually in an editor — mention this to the user
as an option, but default to GSAP for a code-driven, easily-versioned
timeline).

## 3. Asset pipeline (do this before wiring the scene)

The provided `.glb` files are very likely uncompressed/unoptimized. Before
loading them in the app:

1. Run each through `gltf-transform`:
   ```
   gltf-transform optimize 01-c5-black.glb 01-c5-black.glb --texture-compress ktx2
   ```
2. Set up `DRACOLoader` + `KTX2Loader` + `MeshoptDecoder` on the `GLTFLoader`
   (via drei's `useGLTF.preload()` + `useGLTF(url, true /* draco */)`, or a
   manual loader if not using drei's helper). Copy the Draco/Basis decoder
   files into `/public/draco/` and `/public/basis/` — **this is the #1 silent
   failure mode**, verify the files actually exist at those paths.
3. Log each model's bounding box on load (`new THREE.Box3().setFromObject()`)
   — glTF exports are sometimes off by orders of magnitude in scale; normalize
   so all three cars sit at a consistent real-world scale (~4.5m long) before
   building camera paths around them.
4. Target: all three compressed GLBs combined **under ~15MB** so they can all
   preload during the loading screen with no in-scroll pop-in.

## 4. Loading experience

- A `LoadingManager` tracks all three GLB loads (yes, preload all three up
  front — there are only three, and the whole point of the story is fast
  chapter transitions with no reload).
- Full-screen loading view: center-screen animated mark (a simple, original
  crossed-flag-inspired SVG mark — do not reproduce actual Corvette or GM
  logos/trademarks), a thin progress bar tied to real byte progress (not a
  fake timer), and the percentage.
- On `onLoad`, animate the loader out (scale/fade, ~600ms, `power3.inOut`)
  and reveal the hero section. Respect `prefers-reduced-motion` — swap the
  fancy exit for a plain crossfade.
- If loading fails (bad path, missing decoder), show a clear inline error,
  not a silent frozen spinner.

## 5. Scene & scroll architecture

- **One persistent `<Canvas>`** for the whole page (don't remount per
  chapter — you'll pay for context re-creation and get stutter). All three
  car models are loaded into the scene once; only the active car is
  visible/lit, the other two sit parked off-camera.
- **Lenis** drives smooth scroll; bind it into GSAP's `ScrollTrigger`
  scroller proxy so `ScrollTrigger`'s pin/scrub math stays in sync with
  Lenis's easing.
- Each chapter is a pinned `ScrollTrigger` section. While pinned, scroll
  progress (0→1) drives:
  1. **Camera motion = a full 360° orbit around the car**, mapped directly to
     scroll progress (0→1 → 0°→360° azimuth around the model's pivot). This
     is the core camera language for every chapter — not a curated
     point-to-point cinematic path. Still author it with intent, not as a flat
     circle:
     - Vary **radius** and **height** as a function of azimuth angle (an
       array of `{angle, radius, height}` keyframes interpolated with
       `THREE.CatmullRomCurve3`, or a lookup curve per chapter) so the orbit
       tightens into close-ups at specific angles — badge, wheel, the ZR1's
       hood window — and pulls wide again for hero angles elsewhere in the
       same continuous sweep.
     - `camera.lookAt` stays locked on the car's pivot (or a slightly raised
       offset for tight detail beats) throughout.
     - The full 360° should resolve over the chapter's entire pinned scroll
       distance so the pacing reads as deliberate, not fast-spun.
  2. **Chapter 1 only — handheld camera shake.** Layer procedural shake on
     top of the orbit: per-frame position/rotation jitter driven by simplex
     noise (`simplex-noise` npm package), small amplitude (a few mm of
     position, fractions of a degree of rotation), sampled at a frequency
     that reads as "someone holding a camera in the rain," not a broken
     render. Spike the amplitude briefly (~150ms) in sync with each lightning
     flash for a startled-operator effect. Keep Chapters 2 and 3 clean/
     stabilized by contrast — the shake is a deliberate choice specific to
     the storm chapter, not a global treatment.
  3. Text overlay opacity/transform (headline + spec chips fade/slide in at
     specific progress thresholds, not linearly with scroll).
  4. Chapter-specific material/lighting beats (see §6).
- Chapter **transitions**: as one chapter's pin ends, cross-fade the outgoing
  car's visibility/opacity while the incoming car's rim light ramps up and
  the camera settles into its next establishing shot. A very subtle
  chromatic-aberration/speed-blur post-process pulse on the transition sells
  the "cut" without being gimmicky — keep it under ~300ms and only during
  transitions, never during normal scroll.

## 6. Environments, lighting & materials (per chapter)

Each chapter is a **fully art-directed environment build**, not a shared
generic studio backdrop with different lights. Chapter 1 is an outdoor
storm scene, Chapter 3 is an indoor garage — treat each as its own small
scene graph, swapped in/out with the car.

### Chapter 1 — C5, black — forest backroad, twilight storm

- **Sky** — a dusk/storm gradient: either a custom HDRI (twilight + visible
  cloud structure, so lightning has something to illuminate) set as both
  `scene.environment` and `scene.background`, or a shader-driven sky dome
  (deep purple-grey near the horizon, darker overhead, a drifting
  storm-cloud layer).
- **Fog** — `THREE.FogExp2`, dense enough that the road and trees fade into
  twilight within a short visible range. This does double duty: it sets the
  storm mood *and* means you don't need to model a fully detailed forest —
  fog and silhouettes do the work.
- **Road** — a single wet asphalt road plane with lane markings, low
  roughness plus a subtle animated normal map for puddle ripple, so it picks
  up reflections of the sky and each lightning flash.
- **Trees** — low-poly or billboard tree silhouettes lining the road,
  denser in the midground, dissolving into fog toward the background. Do not
  attempt a photoreal forest — it's unnecessary cost for a shot that's
  mostly about fog, silhouette, and light.
- **Rain** — a GPU-instanced particle system (thin, elongated falling
  streak sprites with slight wind drift), not CPU-updated particles; this is
  the single biggest perf risk in the whole app, budget and profile it early
  on mid-tier hardware. Optionally add a very subtle rain-on-lens
  post-process overlay, used lightly enough that it never obscures the car.
- **Lightning** — an autonomous strobe loop (not scroll-tied), firing at
  irregular intervals (~every 4–9s, randomized so it doesn't feel
  metronomic). Each flash: spikes ambient/environment intensity and a
  flash-tinted `DirectionalLight` for ~80–150ms with a sharp attack and a
  flickering decay (real lightning isn't a linear blink), optionally reveals
  a simple animated bolt shape in the sky layer, and briefly rim-lights the
  car and wet road. **Clamp flash intensity in tone mapping** so it reads as
  a bright flash rather than a blown-out white frame — see the zero-defect
  note below.
- **Audio (if sound is enabled)** — a distant thunder rumble ~200–400ms
  after each visual flash; light outruns sound, and that delay is what
  sells it as real weather rather than a lighting bug.
- **Paint** — `MeshPhysicalMaterial` with a `clearcoat` layer for wet
  automotive gloss; black paint is the hardest material here to read at all,
  so lean on the flash/rim lighting above to trace body lines rather than
  trying to fix it with flat fill light.
- **Camera** — the 360° orbit + handheld shake described in §5.

### Chapter 2 — 2011 Z06 Carbon — empty race track / pit lane, golden hour

- **Sky/key light** — a low, warm sun near the horizon (golden-hour HDRI or
  a shader-driven amber-to-soft-blue gradient sky) as a single strong,
  low-angle `DirectionalLight` — this produces the long dramatic shadows and
  the exact **grazing light angle that makes the carbon-fiber weave normal
  map glint**. Time the 360° orbit so the car passes directly through that
  backlit/sidelit angle at least once — that's the chapter's signature beat,
  same role the hood-window shot plays for the ZR1.
- **Track surface** — an asphalt racing line with painted curbing (the
  classic red/white kerb stripes) at the track edge and faint pit-lane
  markings underfoot; keep the geometry simple, let the low sun and long
  shadows carry the realism.
- **Background** — a distant, softly out-of-focus pit wall/garage row and a
  hint of empty grandstand silhouette (depth-of-field or just fog/distance
  fade) — enough to read as "race track," never competing with the car for
  attention. **Empty** is the point: no crowd, no other cars — solitary,
  purist mood.
- **Atmosphere** — an optional subtle heat-shimmer post-process distortion
  low over the track surface (cheap screen-space effect, ties into the
  naturally-aspirated/track-day heat of the theme), plus light dust motes
  catching the low sun if a haze/volumetric pass is already in the budget
  from Ch.3's garage — reuse it here rather than building a second bespoke
  volumetric system.
- **Lens** — a restrained anamorphic-style lens flare when the orbit angle
  points the camera toward the sun; keep it subtle and only active near that
  angle, not a constant screen-space gimmick.
- **Camera** — clean, stabilized 360° orbit (same treatment as Ch.3 — Ch.1's
  handheld shake stays exclusive to the storm chapter).

### Chapter 3 — C6 ZR1 — garage

- **Space** — a moody, minimalist concrete-floor garage: polished but not
  mirror-black concrete (`<MeshReflectorMaterial>`, lower blur / restrained
  reflectivity), a plain wall or partially-raised roller door as backdrop,
  no clutter competing with the car.
- **Lighting** — 2–3 tight overhead spot/rect-area lights aimed down at the
  car (classic "under inspection" garage look), with **volumetric light
  shafts** through a light haze (a volumetric-light post-process pass, or a
  cheap cone-geometry + additive-blend trick) — this is what turns "dim
  garage" into "cool garage."
- **Accent** — a thin strip of cool blue-white LED underlighting along the
  floor/wall base (a nod to the ZR1's "Blue Devil" codename), played against
  the warmer overhead spots for contrast.
- **The signature beat** — as the orbit sweeps past the hood, tighten radius
  and aim a dedicated light at the polycarbonate hood window so the
  supercharger underneath is clearly visible and rim-lit at that exact
  angle. This is the chapter's whole reason for existing — don't let it get
  lost in a uniform orbit.
- **Camera** — clean, stabilized 360° orbit, no handheld shake — a
  deliberate contrast with Chapter 1's chaos.

### Zero-defect rendering requirement (all chapters — critical given Ch.1's dramatic lighting and the full 360° camera)

Treat this as a hard QA gate, not a nice-to-have — the brief explicitly asks
for no visible rendering defects anywhere in the experience:

- No z-fighting on coplanar surfaces (road/puddle layers, floor decals) —
  use `polygonOffset` or authored geometry gaps, never overlapping planes.
- No shadow acne or peter-panning on the car, road, or garage floor — tune
  `shadow.bias`/`normalBias` per light and tighten shadow-camera frustums to
  actual scene bounds.
- No UV seams or texture cracks on car paint/road textures at any distance,
  including the tightest orbit close-ups.
- No backface holes or culling artifacts from **any** orbit angle — since
  the camera now circles the full 360° of every car, check angles the
  source model may not have expected to be seen (underbody, interior through
  glass) and either dress them minimally or keep the orbit's radius/height
  out of any unmodeled void.
- No blown-out, clipped-white lightning flash frames — verify against the
  actual tone-mapping curve in use (ACES Filmic recommended).
- No popping/T-posed geometry from LOD swaps or texture streaming mid-orbit.
- No flicker/z-fight between the rain particle layer and the car/road
  geometry at any camera distance.

All PBR materials render black without light/an environment map — verify
`scene.environment` is set before debugging "why does my car look wrong."

## 7. Visual design system

- **Typography:** one bold, condensed display face for chapter headlines
  (huge, editorial, like a spec-sheet cover), one monospace/technical face
  for spec chips (ENGINE / POWER / etc., all-caps, letter-spaced — reads like
  a data readout).
- **Palette:** near-black background (`#0a0a0a`), off-white text, one accent
  color per chapter pulled from that car's identity (e.g., a warm ember red
  for the C5, a cool graphite/silver for the carbon Z06, an electric blue
  accent for the "Blue Devil" ZR1) — used sparingly, in spec-chip underlines
  and progress indicators, not backgrounds.
- **Layout:** generous negative space; text anchored to one side while the
  car owns the rest of the frame; no boxed "card" UI — this should feel like
  a film, not a dashboard.
- **Chrome/UI polish (the difference between "nice" and "award-winning"):**
  - Custom cursor (subtle, expands on hover over interactive elements).
  - A slim vertical progress rail with 3 dots (one per chapter) + a
    continuous fill — click a dot to jump-scroll to that chapter.
  - Hide the native scrollbar; the progress rail *is* the scroll indicator.
  - A muted/unmuted toggle for optional ambient sound design (a very subtle
    engine idle/rev swell on chapter transitions — never autoplay with sound
    on; default muted).
  - Smooth, eased "scroll to continue" cue on the hero that fades out after
    first scroll input.

## 8. Performance & responsiveness

- Compressed assets per §3; instancing not needed here (only 3 hero models),
  but do dispose the two inactive cars' shadow-casting/heavy post-processing
  contribution when they're off-camera (cheap culling, not full disposal,
  since you'll swap back to them if the user scrolls up).
- On-demand rendering where possible is hard with a continuously scrubbed
  camera, but at minimum cap `devicePixelRatio` at 2, and drop
  post-processing passes (bloom/AO) on detected low-end/mobile GPUs.
- **Mobile:** pinned scroll-scrubbed camera work is heavy and finicky on
  mobile Safari in particular. Provide a simplified mobile path — shorter
  camera paths, no reflective floor, reduced post-processing — rather than
  disabling 3D outright.
- **Chapter 1's storm is the single heaviest scene** — rain particle count,
  fog, and the lightning strobe's light spikes all add up. Budget rain
  particle count on desktop, then define a reduced tier (fewer/larger
  streaks, or a cheaper shader-only rain effect) for mobile/low-end GPUs.
  Test that the lightning strobe's intensity spike doesn't cause visible
  frame-time stalls when it fires.
- **Chapter 3's volumetric god-rays** are a common frame-time spike source —
  gate them behind a GPU-tier check same as bloom/AO, with a flat-lit
  fallback that keeps the spot-light staging but drops the volumetric pass.
- **`prefers-reduced-motion`:** replace scroll-scrubbed camera moves with
  simple per-chapter cross-fades between static hero angles; keep all copy
  and specs, just remove the continuous camera choreography.
- Always dispose geometries/materials/textures on unmount if any chapter
  content is ever conditionally mounted; R3F handles most of this
  automatically but verify with `r3f-perf` during a final pass.

## 9. Accessibility

- All copy available to screen readers even though it's animated in (avoid
  `visibility:hidden`-only patterns that also hide from AT; animate opacity
  on elements that remain in the DOM and in reading order).
- Keyboard users: chapter progress dots and mute toggle are real, focusable,
  labeled buttons; scrolling works normally without requiring pointer drag.
- Sufficient contrast for text over the 3D canvas — use a subtle gradient
  scrim behind text blocks if a light-colored car chapter ever risks washing
  out the copy.

## 10. Definition of done (acceptance checklist)

- [ ] Loading screen shows real progress for all 3 GLBs, no fake timers.
- [ ] All three cars load once, compressed, under target size budget.
- [ ] Each chapter completes a full 360° scroll-driven orbit with
      radius/height variation authored for detail beats, not a flat circle.
- [ ] Ch.1's handheld camera shake reads as intentional/cinematic, not a
      broken render — and is absent from Ch.2/Ch.3's stabilized orbits.
- [ ] Black C5 reads clearly as black with defined body lines against the
      forest/storm backdrop (not a void).
- [ ] Rain, fog, and the lightning strobe all run at acceptable frame time
      on mid-tier hardware, with a reduced-cost mobile tier.
- [ ] Lightning flashes never clip to blown-out white (tone-mapping verified).
- [ ] Carbon weave visibly glints during at least one camera beat in Ch. 2,
      timed to the orbit passing through the golden-hour grazing-light angle.
- [ ] Garage volumetric god-rays + hood-window/supercharger reveal land as
      the clear signature beat of Ch. 3, with a flat-lit fallback tier.
- [ ] Zero-defect QA pass complete — no z-fighting, shadow acne, UV seams,
      backface holes at any of the 360° orbit angles, or LOD/texture pop.
- [ ] Text/spec-chip reveals are progress-threshold-driven, not just
      linear opacity with scroll.
- [ ] Chapter transitions read as directed cuts, not abrupt pops.
- [ ] Progress rail with 3 clickable chapter dots works.
- [ ] Mute toggle present, defaults muted, no autoplay-with-sound.
- [ ] `prefers-reduced-motion` fallback implemented and tested.
- [ ] Mobile path tested — no scroll-jank, reduced post-processing kicks in.
- [ ] No console errors; Draco/KTX2 decoder paths verified working.

## 11. Build phases (work through these as checkpoints, not all at once)

1. **Scaffold** — Vite/React/R3F project, one car loading + orbit-controls
   debug view, confirm scale/lighting basics work before any scroll logic.
2. **Loading screen** — real LoadingManager progress across all 3 models.
3. **Scroll engine** — Lenis + ScrollTrigger wiring, one pinned section with
   a single test camera curve, prove the scrub math feels good before
   authoring all three chapters' curves.
4. **Chapter 1 (C5)** — this is the heaviest chapter, build it in sub-steps:
   sky/fog/road/tree environment first (static, no rain/lightning) → 360°
   orbit camera with radius/height keyframes → rain particles → lightning
   strobe → handheld camera shake layered in last, once the base orbit
   already feels right without it.
5. **Chapter 2 (Z06 Carbon)** — race track/pit lane environment (track
   surface, low golden-hour key light, distant pit-wall backdrop) → 360°
   orbit timed so the car passes through the grazing-light angle → carbon
   material/lighting tuning against that light.
6. **Chapter 3 (ZR1)** — garage environment (floor, spots, god-rays) → 360°
   orbit → the hood-window/supercharger signature beat.
7. **Transitions + finale/comparison section.**
8. **Polish pass** — progress rail, cursor, sound toggle, post-processing.
9. **Performance + accessibility + reduced-motion pass** — profile with
   `r3f-perf`, test mobile, verify a11y checklist.

---

*Note to Claude Code: if the user's actual GLB scale, pivot points, or
material setup (e.g. Blender-exported names) differ from assumptions above,
inspect the files first (`gltf-transform inspect`) and adapt rather than
guessing — especially before authoring camera curves, since those are
authored relative to each model's real dimensions and origin.*
