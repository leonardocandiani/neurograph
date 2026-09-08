<!-- readme-padrao:header -->
<!-- Banner -->
<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:1a1a2e,100:00d9ff&height=200&section=header&text=neurograph&fontSize=54&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=A%20neural%20network%20inside%20a%20real%20brain&descAlignY=58&descSize=16" alt="neurograph" width="100%" />
</div>

<!-- Typing -->
<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=21&duration=2800&pause=900&color=00d9ff&center=true&vCenter=true&width=840&lines=A+neural+network+inside+a+real+brain;Nodes+are+born+on+52+real+sulci%2C+spaced+by+arc+length;Turn+the+outline+off+and+it+still+reads+as+a+brain;Zero+dependencies%2C+one+canvas%2C+HTML+React+or+Next.js" alt="A neural network inside a real brain" />
</div>

<div align="center">

  <br>
  <img src="assets/hero.webp" alt="neurograph: a network of glowing nodes filling an anatomical brain silhouette" width="820" />
  <br><br>

  <p><strong>Connected nodes that follow the real folds of a human brain.</strong></p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-00d9ff?style=for-the-badge" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/dependencies-zero-00d9ff?style=for-the-badge" alt="dependencies: zero" />
    <img src="https://img.shields.io/badge/size-~25KB-1a1a2e?style=for-the-badge" alt="size: ~25KB" />
    <img src="https://img.shields.io/badge/works%20with-HTML%2C%20React%2C%20Next.js-1a1a2e?style=for-the-badge" alt="works with: HTML, React, Next.js" />
    <a href="https://github.com/leonardocandiani/neurograph/pulls"><img src="https://img.shields.io/badge/PRs-welcome-1a1a2e?style=for-the-badge" alt="PRs: welcome" /></a>
  </p>

  <p>
    <a href="#the-honest-part-first">The honest part first</a> •
    <a href="#quick-start">Quick start</a> •
    <a href="#see-it">See it</a> •
    <a href="#where-the-anatomy-comes-from">Where the anatomy comes from</a> •
    <a href="#options">Options</a> •
    <a href="#javascript-api">JavaScript API</a> •
    <a href="#other-shapes">Other shapes</a> •
    <a href="#license">License</a>
  </p>
</div>

<br>

> **neurograph** ships the anatomy as data: a public domain lateral illustration was traced with marching squares and simplified to 10KB of polylines, so the component draws a real cortex with no image request, no WebGL and no dependencies.

## What it is

```yaml
product:   animated brain network for hero sections and backgrounds
runtime:   plain canvas 2D, no WebGL, no build step, about 25KB
anatomy:   1 outline + 52 sulci traced from a public domain illustration, about 10KB of points
placement: nodes born on the sulci at constant arc length, each held by a spring
modes:     brain · globe · free field
use with:  plain HTML · React · Next.js (use client included)
a11y:      honours prefers-reduced-motion with a single static frame
license:   MIT
```

<!-- /readme-padrao:header -->

Every "particles with lines" background draws the same floating cloud. neurograph
draws a **brain**: the silhouette, the cerebellum, the brain stem and 52 real sulci
come from a public-domain anatomical illustration, converted into geometry the
component ships with. Most of the nodes are born **on the folds**, so the network
traces the cortex instead of hovering in a rectangle.

No build step. No dependencies. No image requests. One canvas.

![neurograph with its control panel](assets/showcase.webp)

---

## The honest part first

| What it is | What it is not |
| --- | --- |
| A 2D canvas effect with real anatomical geometry baked in | A 3D brain model, an MRI viewer or a neuroscience tool |
| One lateral (side) view, mirrorable with `flip` | Multiple angles, rotation or slices of a brain |
| A decorative hero / background element | A data visualization: the links mean nothing |
| ~25KB of JS, no assets to fetch | Free at any node count, see [Performance](#performance) |

The sulci are anatomically placed, but this is art direction, not science. If you
need a real brain atlas, look at [Netron](https://netron.app) or a proper
neuroimaging stack instead.

---

## Quick start

### Zero install

Double-click **`index.html`**. It is fully self-contained: no Node, no server, no
internet. Full control panel included.

### React / Next.js

Copy `src/` into your project:

```jsx
import Neurograph from "./neurograph/Neurograph.jsx";

export default function Hero() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Neurograph count={1100} followSulci={0.6} colorA="#22d3ee" colorB="#a855f7" />
      <h1 style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center" }}>
        Your headline
      </h1>
    </div>
  );
}
```

The canvas fills 100% of its parent, so **give the parent a height**. The file
already starts with `"use client"` for the Next.js app router.

Prefer a single file? `src/Neurograph.standalone.jsx` is the whole thing, engine
and geometry included, with the same props.

### Plain JavaScript

```js
import { createNeurograph } from "./neurograph/neurograph.js";

const brain = createNeurograph(document.querySelector("#canvas"), {
  count: 1100,
  colorA: "#34d399",
  colorB: "#0ea5e9",
});

brain.update({ anatomy: 0 });  // hide the outline, keep only the network
brain.stop();                  // pause, e.g. when it leaves the viewport
brain.destroy();               // remove listeners and cancel the RAF loop
```

`src/neurograph.js` is an ES module, so `<script type="module">` needs to be
served over http (Chrome blocks modules on `file://`). From the repo root:

```bash
npx serve .              # then open http://localhost:3000/examples/vanilla/
python3 -m http.server   # or http://localhost:8000/examples/vanilla/
```

---

## See it

```bash
open index.html          # double-click works too
```

`index.html` inlines everything, so there are no relative-path or CORS gotchas.
`examples/vanilla/` is the same thing wired the "real" way, importing from `src/`.
`examples/vite-react/` is a working React app:

```bash
cd examples/vite-react && npm install && npm run dev
```

![the React example running under Vite](assets/react.webp)

---

## Where the anatomy comes from

The shape is not hand-drawn and it is not an SVG the component fetches at runtime.
A public-domain lateral illustration was rasterized and turned into polylines:

1. rasterize at 900px wide;
2. binary mask from alpha + luminance, with a flood fill from the borders to close
   interior holes;
3. **marching squares** to trace contours;
4. **Douglas-Peucker** simplification (ε ≈ 1.6px for the outline, 1.9px for the sulci);
5. normalize to integers `0..1000` relative to the brain width.

![from public-domain illustration to shipped geometry](assets/extraction.webp)

The result is 1 outer contour (87 points, including cerebellum and brain stem)
plus 52 sulci polylines (~1180 points): about 10KB of numbers, embedded in the
module as `BRAIN_SHAPE`.

Two details make it read as a brain instead of noise:

- **Constant arc-length spacing.** Nodes on the sulci are spaced by distance along
  each fold, not sampled at random. Without it the cerebellum, which is densely
  hatched, swallows almost every node.
- **Anchored nodes.** Every node orbits the point where it was born, held by a
  spring (`cohesion`). It breathes, but it never dissolves the anatomy.

Turn the outline off entirely with `anatomy: 0` and the brain is still perfectly
readable, drawn only by the nodes:

![the same brain drawn only by nodes, with the silhouette hidden](assets/network-only.webp)

---

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `shape` | `'brain' \| 'network' \| 'globe'` | `'brain'` | anatomical silhouette, free field or spinning sphere |
| `count` | number | `1100` | number of nodes |
| `linkDistance` | number | `46` | max connection distance, in px |
| `followSulci` | 0..1 | `0.6` | share of nodes born **on the real sulci** |
| `cohesion` | 0..1 | `0.35` | spring holding each node near its anchor |
| `speed` | 0..2 | `0.45` | overall speed |
| `pulses` | number | `26` | synapses travelling at the same time |
| `glow` | 0..1 | `0.55` | glow strength |
| `anatomy` | 0..1 | `0.28` | outline + sulci opacity (`0` = network only) |
| `colorA` / `colorB` | hex | `#22d3ee` / `#a855f7` | gradient endpoints |
| `interactive` | boolean | `true` | mouse repulsion + click wave |
| `flip` | boolean | `false` | mirror the brain horizontally |
| `maxDpr` | number | `2` | devicePixelRatio ceiling |
| `respectReducedMotion` | boolean | `true` | render a single static frame under `prefers-reduced-motion` |

Changing `shape`, `count`, `followSulci` or `flip` rebuilds the node set.
Everything else applies on the next frame, without rebuilding anything.

## JavaScript API

```js
const brain = createNeurograph(canvas, options);

brain.update({ colorA: "#f472b6" });  // runtime options, rebuilds only if needed
brain.rebuild();                      // force a full rebuild
brain.stop();                         // cancel the animation frame loop
brain.start();                        // resume
brain.options;                        // current resolved options
brain.nodeCount;                      // nodes actually placed
brain.destroy();                      // listeners + RAF cleanup
```

TypeScript definitions live in [`src/neurograph.d.ts`](src/neurograph.d.ts).

## Other shapes

The same engine ships two non-anatomical modes, for when you want the look without
the brain.

<table>
<tr>
<td width="50%"><img src="assets/globe.webp" alt="globe mode: nodes on a slowly rotating sphere" /></td>
<td width="50%"><img src="assets/free-field.webp" alt="free field mode: a classic connected-particles background" /></td>
</tr>
<tr>
<td align="center"><code>shape: "globe"</code></td>
<td align="center"><code>shape: "network"</code></td>
</tr>
</table>

## Performance

- Links go through a **spatial grid**, not O(n²). 1100 nodes hold 60fps
  comfortably; ~1600 is a sane ceiling on a normal machine.
- `devicePixelRatio` is capped at 2 (`maxDpr`) so 3x displays don't quadruple the
  fill cost.
- The brain mode calls `isPointInPath` per node per frame to keep nodes inside the
  silhouette. That is the single most expensive part; lower `count` before
  anything else.
- Call `brain.stop()` when the element leaves the viewport (`IntersectionObserver`)
  if you care about battery.
- `prefers-reduced-motion: reduce` renders one static frame and stops. It still
  looks like a brain.

## Swap the shape

`BRAIN_SHAPE` is just `{ aspect, outline: string[], sulci: string[] }`, where each
string is `"x y x y x y ..."` in integers `0..1000` (x normalized by width, y on
the same scale). Swap it for a front view, a top view, or your own logo, and the
whole engine keeps working.

## Credits

The anatomy is derived from a **public-domain** lateral illustration of the human
brain from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Brain-outline-lateral.svg),
transformed into geometry as described in [CREDITS.md](CREDITS.md). No attribution
is legally required for public-domain work; the credit is courtesy.

## License

[MIT](LICENSE) © Leonardo Candiani

<!-- readme-padrao:footer -->
<br>

---

<div align="center">
  <p><strong>Built by <a href="https://github.com/leonardocandiani">Leonardo Candiani</a></strong> · More projects at <a href="https://github.com/leonardocandiani?tab=repositories">github.com/leonardocandiani</a></p>
  <p>Leonardo Candiani builds AI agents that talk, decide and close deals. Cofounder of SixQuasar, operating Proteauto, SegSmart and IACall end to end.</p>
  <a href="https://leonardocandiani.com.br">
    <img src="https://img.shields.io/badge/-Website-0d1117?style=for-the-badge&logo=safari&logoColor=00d9ff" alt="Website" />
  </a>
  <a href="https://github.com/leonardocandiani">
    <img src="https://img.shields.io/badge/-GitHub-0d1117?style=for-the-badge&logo=github&logoColor=00d9ff" alt="GitHub" />
  </a>
  <a href="https://instagram.com/leonardocandiani">
    <img src="https://img.shields.io/badge/-Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" />
  </a>
  <a href="https://youtube.com/@oleonardocandiani">
    <img src="https://img.shields.io/badge/-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube" />
  </a>
</div>

<br>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d9ff,50:1a1a2e,100:0d1117&height=120&section=footer&text=Thanks%20for%20stopping%20by&fontSize=18&fontColor=ffffff&fontAlignY=72" alt="Thanks for stopping by" width="100%" />
</div>
<!-- /readme-padrao:footer -->
