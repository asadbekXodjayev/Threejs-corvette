# Build Prompt — Three.js Scroll-Rotation Corvette Scene

Paste this into Claude Code. Drop your two assets into `public/` first and rename them
to match (or update the filenames in the CONFIG block below).

- `public/corvette.glb`  ← your car model
- `public/lightning.gif`  ← your lightning background

---

## TASK

Build a scroll-storytelling web scene with **Vite + Three.js**. A 3D Corvette sits
centered on the ground of a full-screen animated lightning background. As the user
scrolls down, the car rotates **clockwise** and eases to a stop showing its
**rear three-quarter** (front pointing screen-right, rear and side visible). Scrolling
back up reverses it smoothly.

## STACK

- Vite (vanilla JS, no framework)
- `three` (latest)
- `lenis` for smooth scroll
- Use `GLTFLoader` and `DRACOLoader` (the model may be Draco-compressed)
- Use `RoomEnvironment` for image-based reflections on the car paint

## PROJECT STRUCTURE

```
index.html
main.js
style.css
public/
  corvette.glb
  lightning.gif
```

## CRITICAL IMPLEMENTATION RULES

1. **GIF is NOT a WebGL texture.** Do not load the GIF into Three.js — it will freeze
   on one frame. Instead render it as a full-screen HTML element behind the canvas:
   a `<div id="bg">` with `background: url(/lightning.gif) center/cover no-repeat;`,
   `position: fixed; inset: 0; z-index: -1;`.

2. **Canvas must be transparent** so the GIF shows through:
   `new WebGLRenderer({ alpha: true, antialias: true })` and
   `renderer.setClearAlpha(0)`. The canvas sits above `#bg` (`z-index: 1`) and is
   `position: fixed`.

3. **Color/tone:** `renderer.outputColorSpace = SRGBColorSpace`,
   `renderer.toneMapping = ACESFilmicToneMapping`, `toneMappingExposure ≈ 1.0`.

4. **Center & ground the model.** After load:
   - Compute the model's bounding box (`Box3.setFromObject`).
   - Recenter it to the world origin on X/Z.
   - Scale uniformly so its length fits the target size (see CONFIG).
   - Set its Y so the bottom of the bounding box sits on `y = 0` (the ground plane),
     then apply `GROUND_OFFSET_Y` for fine tuning against the GIF's horizon.

5. **Contact shadow (grounds the car).** Add a horizontal plane at `y = 0` just under
   the car using a radial-gradient canvas texture (dark center fading to transparent)
   on a `MeshBasicMaterial` with `transparent: true`, `depthWrite: false`. Size it a
   bit wider than the car. This is what makes it look like it's on the road, not
   floating.

6. **Lighting (dark stormy mood):**
   - Low bluish `AmbientLight` (cool, dim).
   - One `DirectionalLight` as a soft key light from upper-left.
   - `RoomEnvironment` + `PMREMGenerator` set as `scene.environment` for realistic
     paint reflections.
   - **Lightning flicker (nice touch):** a `DirectionalLight` (cool white/blue) whose
     intensity is near-zero most of the time but randomly spikes for a few frames to
     simulate lightning strikes hitting the car. Keep it subtle.

## SCROLL ROTATION

- Give the page enough scroll height: a `.scroll-space` div at `SCROLL_HEIGHT_VH`
  (e.g. `300vh`).
- Each frame compute `progress = scrollY / (document.body.scrollHeight - innerHeight)`,
  clamped 0–1.
- Ease progress with a smoothstep (`p*p*(3-2*p)`) so it accelerates then eases to a
  full stop at the end.
- Map eased progress to yaw:
  `car.rotation.y = degToRad(SCROLL_START_YAW + easedProgress * SCROLL_SWEEP_DEG)`.
- Use `Lenis` for smooth scroll; drive the render loop from Lenis's frame callback
  (or `requestAnimationFrame` + `lenis.raf`).
- Reversing scroll must smoothly reverse the rotation (it will, since it's a pure
  function of scroll position — no accumulated state).

## CAMERA

- `PerspectiveLayout` fov ~35, positioned slightly above the car looking at its center,
  framing it in the lower-center third of the screen (matching the GIF's ground area).
- Handle window resize (update camera aspect + renderer size).

## CONFIG (top of main.js — expose these so I can tune by eye)

```js
const CONFIG = {
  MODEL_URL: '/corvette.glb',
  CAR_TARGET_LENGTH: 4.5,   // world units the car's longest side is scaled to
  GROUND_OFFSET_Y: 0.0,     // nudge car up/down onto the GIF's ground line
  CAMERA_FOV: 35,
  CAMERA_POS: [0, 1.4, 7],  // x, y, z
  CAMERA_LOOK: [0, 0.6, 0], // point camera looks at

  SCROLL_HEIGHT_VH: 300,
  SCROLL_START_YAW: 35,     // deg — starting angle (front three-quarter)
  SCROLL_SWEEP_DEG: -215,   // deg — negative = clockwise from above; ends on rear 3/4
                            //   tune START + SWEEP so it STOPS on rear three-quarter,
                            //   front pointing screen-right

  LIGHTNING_ENABLED: true,
};
```

> Because `.glb` export orientations vary, after wiring it up, adjust
> `SCROLL_START_YAW` and `SCROLL_SWEEP_DEG` so the car begins on a front three-quarter
> and ends showing the **rear + side with the front pointing right**. Flip the sign of
> `SCROLL_SWEEP_DEG` if it rotates the wrong way.

## ACCEPTANCE CRITERIA

- Lightning GIF animates full-screen behind a transparent canvas.
- Corvette is centered, correctly scaled, and grounded with a soft shadow (not
  floating).
- Scrolling down rotates the car clockwise and eases to a clean stop on the rear
  three-quarter; scrolling up reverses it smoothly.
- Dark, moody lighting with visible paint reflections; occasional lightning flicker on
  the car.
- Responsive to window resize. No console errors. Runs with `npm run dev`.

## DELIVERABLES

Provide the full `index.html`, `main.js`, `style.css`, a `package.json` with the right
deps, and a short README with `npm install` / `npm run dev` and where to place the two
assets.
