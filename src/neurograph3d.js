/**
 * neurograph3d: the anatomical brain as a 3D particle cloud. Raw WebGL 1,
 * zero dependencies, no build step. Shares BRAIN_SHAPE with the 2D module.
 *
 *   import { createNeurograph3D } from './neurograph3d.js';
 *   const brain = createNeurograph3D(document.querySelector('canvas'), { density: 1 });
 *   brain.wave();
 *   brain.destroy();
 *
 * Throws Error("neurograph3d: WebGL is not available") when the canvas cannot
 * give a WebGL context, so callers can fall back to createNeurograph.
 */
import { BRAIN_SHAPE } from "./neurograph.js";

export const DEFAULTS_3D = {
  density: 1,
  links: true,
  pulses: 120,
  stars: 3000,
  glow: 1,
  colorA: "#66EBF7",
  colorB: "#AD99FF",
  background: "#02050B",
  autoRotate: true,
  rotateAmplitude: 0.62,
  intro: true,
  introMs: 4200,
  ambientWaves: true,
  fps: 0,
  maxDpr: 2,
  interactive: true,
  respectReducedMotion: true,
  fit: "contain",
  onFrame: null,
};

const FOV = 34;
const NEAR = 0.1;
const FAR = 200;
const TAN_HALF = Math.tan(FOV * Math.PI / 360);
const BASE_DIST = 3.62;

/* ---------- anatomy ---------- */

function decodeLine(s) {
  const a = s.split(" ").map(Number);
  const p = [];
  for (let i = 0; i + 1 < a.length; i += 2) p.push([(a[i] - 500) / 500, -(a[i + 1] - 420) / 500]);
  return p;
}

const OUT = decodeLine(BRAIN_SHAPE.outline[0]);
const SULCI = BRAIN_SHAPE.sulci.map(decodeLine);
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
OUT.forEach(function (p) {
  minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
  minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
});
const CX = (minX + maxX) / 2;
const CY = (minY + maxY) / 2 + 0.06;
const RX = (maxX - minX) / 2;
const RY = (maxY - minY) / 2;
const HALF = 0.66;

function inside(x, y) {
  let c = false;
  for (let i = 0, j = OUT.length - 1; i < OUT.length; j = i++) {
    const a = OUT[i], b = OUT[j];
    if (((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
  }
  return c;
}

function zmax(x, y) {
  const ex = (x - CX) / RX, ey = (y - CY) / (RY * 1.05), e = ex * ex + ey * ey;
  return HALF * Math.pow(Math.max(0, 1 - e), 0.62) + 0.02;
}

function makeRng() {
  let s = 20260929;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function buildModel(density, links, starCount) {
  const rnd = makeRng();
  const nSurf = Math.round(8200 * density);
  const nIn = Math.round(1800 * density);
  const sulStep = 0.012 / Math.pow(density, 0.62);
  const linkProb = 0.5 - 0.14 * (1 - Math.min(1, density));
  const outStride = density < 0.7 ? 2 : 1;
  const pos = [], scat = [], seed = [], kind = [];

  function push(x, y, z, k) {
    pos.push(x, y, z); kind.push(k); seed.push(rnd());
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 5 + rnd() * 7;
    scat.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.6, r * Math.cos(ph));
  }

  let tries = 0;
  while (pos.length / 3 < nSurf && tries++ < nSurf * 20) {
    const x = minX + rnd() * (maxX - minX), y = minY + rnd() * (maxY - minY);
    if (!inside(x, y)) continue;
    const side = rnd() < 0.5 ? -1 : 1, z = zmax(x, y) * (0.93 + rnd() * 0.07);
    push(x, y, side * (z + 0.012), 0);
  }
  tries = 0;
  const k0 = pos.length / 3;
  while (pos.length / 3 < k0 + nIn && tries++ < nIn * 20) {
    const xi = minX + rnd() * (maxX - minX), yi = minY + rnd() * (maxY - minY);
    if (!inside(xi, yi)) continue;
    push(xi, yi, (rnd() * 2 - 1) * zmax(xi, yi) * 0.8, 2);
  }
  SULCI.forEach(function (line) {
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / sulStep));
      for (let t = 0; t < n; t++) {
        const x = a[0] + (b[0] - a[0]) * t / n, y = a[1] + (b[1] - a[1]) * t / n, z = zmax(x, y) * 0.985 + 0.012;
        push(x, y, z, 1); push(x, y, -z, 1);
      }
    }
  });
  for (let o = 0; o < OUT.length; o += outStride) push(OUT[o][0], OUT[o][1], 0, 1);
  const count = pos.length / 3;

  // Candidate selection always consumes the RNG so the shape and the stars
  // stay identical whether or not links are enabled.
  const CELL = 0.1, grid = {}, cand = [];
  for (let i = 0; i < count; i++) {
    if (kind[i] === 2 || rnd() > linkProb) continue;
    cand.push(i);
    const gk = Math.floor(pos[i * 3] / CELL) + "," + Math.floor(pos[i * 3 + 1] / CELL) + "," + Math.floor(pos[i * 3 + 2] / CELL);
    (grid[gk] || (grid[gk] = [])).push(i);
  }
  const seg = [], segPts = [], MAXD = 0.085, deg = {};
  if (links) {
    cand.forEach(function (i) {
      const cx = Math.floor(pos[i * 3] / CELL), cy = Math.floor(pos[i * 3 + 1] / CELL), cz = Math.floor(pos[i * 3 + 2] / CELL);
      let made = 0;
      for (let dx = -1; dx <= 1 && made < 3; dx++) for (let dy = -1; dy <= 1 && made < 3; dy++) for (let dz = -1; dz <= 1 && made < 3; dz++) {
        const cellL = grid[(cx + dx) + "," + (cy + dy) + "," + (cz + dz)];
        if (!cellL) continue;
        for (let q = 0; q < cellL.length && made < 3; q++) {
          const j = cellL[q];
          if (j <= i || (deg[j] || 0) >= 4) continue;
          const d = Math.hypot(pos[i * 3] - pos[j * 3], pos[i * 3 + 1] - pos[j * 3 + 1], pos[i * 3 + 2] - pos[j * 3 + 2]);
          if (d > MAXD || d < 0.02) continue;
          seg.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
          segPts.push([i, j]); made++;
          deg[i] = (deg[i] || 0) + 1; deg[j] = (deg[j] || 0) + 1;
        }
      }
    });
  }

  const stars = new Float32Array(starCount * 3);
  for (let st = 0; st < starCount; st++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 25 + rnd() * 50;
    stars[st * 3] = r * Math.sin(ph) * Math.cos(th);
    stars[st * 3 + 1] = r * Math.cos(ph) * 0.7;
    stars[st * 3 + 2] = -Math.abs(r * Math.sin(ph) * Math.sin(th)) - 8;
  }

  const packed = new Float32Array(count * 8);
  for (let i = 0; i < count; i++) {
    packed[i * 8] = pos[i * 3]; packed[i * 8 + 1] = pos[i * 3 + 1]; packed[i * 8 + 2] = pos[i * 3 + 2];
    packed[i * 8 + 3] = scat[i * 3]; packed[i * 8 + 4] = scat[i * 3 + 1]; packed[i * 8 + 5] = scat[i * 3 + 2];
    packed[i * 8 + 6] = seed[i]; packed[i * 8 + 7] = kind[i];
  }
  return { rnd: rnd, count: count, pos: pos, packed: packed, seg: seg, segPts: segPts, segGpu: new Float32Array(seg), stars: stars };
}

/* ---------- math ---------- */

function perspective(out, fovDeg, aspect, near, far) {
  const f = 1 / Math.tan(fovDeg * Math.PI / 360), nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
}

function lookAt(out, ex, ey, ez, cx, cy, cz) {
  let zx = ex - cx, zy = ey - cy, zz = ez - cz;
  let l = 1 / Math.hypot(zx, zy, zz); zx *= l; zy *= l; zz *= l;
  let xx = zz, xy = 0, xz = -zx;
  l = 1 / Math.hypot(xx, xy, xz); xx *= l; xy *= l; xz *= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
}

function mul(out, a, b) {
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
}

function parseHex(hex, fallback) {
  let h = String(hex || "").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || isNaN(n)) return fallback;
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function scaled(c, k) {
  return [Math.min(1, c[0] * k[0]), Math.min(1, c[1] * k[1]), Math.min(1, c[2] * k[2])];
}

/* ---------- shaders ---------- */

const FRAG_PRECISION = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n";

const POINTS_VS = [
  "uniform mat4 uView, uProj;",
  "uniform float uTime, uIntro, uScale, uWaveR, uMaxPt; uniform vec3 uWaveO, uColA, uColB;",
  "attribute vec3 position; attribute vec3 aScatter; attribute float aSeed; attribute float aKind;",
  "varying float vA; varying vec3 vC;",
  "void main(){",
  " float t = clamp(uIntro*1.35 - aSeed*0.35, 0., 1.); t = 1. - pow(1. - t, 4.);",
  " vec3 p = mix(aScatter, position, t);",
  " p += 0.006*vec3(sin(uTime*.6+aSeed*40.), cos(uTime*.5+aSeed*31.), sin(uTime*.45+aSeed*17.));",
  " vec4 mv = uView*vec4(p,1.); float d = -mv.z;",
  " float wd = (distance(position,uWaveO)-uWaveR)/0.09; float w = exp(-wd*wd);",
  " float tw = .72 + .28*sin(uTime*1.7 + aSeed*70.);",
  " float base = aKind > 1.5 ? .28 : (aKind > .5 ? 1. : .5);",
  " vA = base*tw*mix(.25,1.,t) + w*1.4;",
  " vec3 hot = vec3(1.,.97,.9);",
  " vC = mix(uColA, uColB, smoothstep(-.8,.8, position.x + .35*position.y));",
  " vC = mix(vC, hot, clamp(w,0.,1.)*.8);",
  " float sz = aKind > 1.5 ? .010 : (aKind > .5 ? .018 : .013);",
  " gl_PointSize = min(uMaxPt, max(1.2, uScale*sz*(1. + w*1.8)/d));",
  " vA *= smoothstep(10., 2.6, d);",
  " gl_Position = uProj*mv;",
  "}"].join("\n");

const POINTS_FS = FRAG_PRECISION + [
  "varying float vA; varying vec3 vC;",
  "void main(){ vec2 c = gl_PointCoord - .5; float r = length(c); float core = smoothstep(.5, .0, r); core *= core; float hot = smoothstep(.16, .0, r);",
  " gl_FragColor = vec4((vC*core + vec3(1.)*hot*.55)*vA, 1.); }"].join("\n");

const LINES_VS = [
  "uniform mat4 uView, uProj; uniform float uWaveR; uniform vec3 uWaveO;",
  "attribute vec3 position; varying float vW; varying vec3 vP;",
  "void main(){ vP = position; float wd = (distance(position,uWaveO)-uWaveR)/0.12; vW = exp(-wd*wd); gl_Position = uProj*uView*vec4(position,1.); }"].join("\n");

const LINES_FS = FRAG_PRECISION + [
  "uniform float uLine; uniform vec3 uColA, uColB; varying float vW; varying vec3 vP;",
  "void main(){ vec3 c = mix(uColA, uColB, smoothstep(-.8,.8,vP.x+.35*vP.y)); gl_FragColor = vec4(c*(.10*uLine + vW*.55), 1.); }"].join("\n");

const PULSE_VS = [
  "uniform mat4 uView, uProj; uniform float uScale, uMaxPt; attribute vec3 position;",
  "void main(){ vec4 mv = uView*vec4(position,1.); gl_PointSize = min(uMaxPt, uScale*.05/(-mv.z)); gl_Position = uProj*mv; }"].join("\n");

const PULSE_FS = FRAG_PRECISION + [
  "void main(){ float r = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,r); a = a*a*a; gl_FragColor = vec4(vec3(.85,1.,1.)*a*1.6, 1.); }"].join("\n");

const STARS_VS = [
  "uniform mat4 uView, uProj; uniform float uRot, uSize; attribute vec3 position;",
  "void main(){ float c = cos(uRot), s = sin(uRot); vec3 p = vec3(c*position.x + s*position.z, position.y, -s*position.x + c*position.z);",
  " gl_PointSize = uSize; gl_Position = uProj*uView*vec4(p,1.); }"].join("\n");

const STARS_FS = FRAG_PRECISION + "void main(){ gl_FragColor = vec4(vec3(.5608,.7137,.8471), .55); }";

const NEB_VS = [
  "uniform mat4 uProj; uniform vec3 uCenter; uniform vec2 uSize; attribute vec2 corner; varying vec2 vUv;",
  "void main(){ vUv = corner + .5; gl_Position = uProj*vec4(uCenter + vec3(corner*uSize, 0.), 1.); }"].join("\n");

const NEB_FS = FRAG_PRECISION + [
  "uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;",
  "void main(){ float r = length((vUv - .5)*2.);",
  " float a = r < .4 ? mix(.55, .16, r/.4) : mix(.16, 0., clamp((r-.4)/.6, 0., 1.));",
  " gl_FragColor = vec4(uColor*(a*uOpacity), 1.); }"].join("\n");

/* ---------- instance ---------- */

export function createNeurograph3D(canvas, options) {
  const opts = Object.assign({}, DEFAULTS_3D, options || {});
  const glAttrs = { antialias: true, alpha: false, powerPreference: "high-performance" };
  let gl = null;
  try { gl = canvas.getContext("webgl", glAttrs) || canvas.getContext("experimental-webgl", glAttrs); } catch (e) { gl = null; }
  if (!gl) throw new Error("neurograph3d: WebGL is not available");

  const reduced = !!(opts.respectReducedMotion && typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const view = new Float32Array(16), proj = new Float32Array(16), vp = new Float32Array(16);
  const camState = { dist: BASE_DIST, lookY: 0.035, scale: 1 };
  let prevTouchAction = "", bound = false;
  let model = null, pulseState = [], pulseBuf = null, pulseCount = 0, pulseActive = 0;
  let progs = null, bufs = null, maxPt = 64;
  let cssW = 0, cssH = 0, dpr = 1;
  let running = false, destroyed = false, lost = false, raf = 0;
  const t0 = performance.now();
  let last = t0, lastDraw = 0, lastNow = t0, nextAmbient = t0 + 9000;
  let wave = null, waveO = [0, 0, 5], waveR = 9;
  let colA, colB, colLA, colLB, neb1, neb2, neb3, bg;
  let dragging = false, yawOff = 0, yawVel = 0, downX = 0, downY = 0, moved = false, lastMoveT = 0;
  let ro = null, api = null;

  function applyColors() {
    colA = parseHex(opts.colorA, [0.4, 0.92, 0.97]);
    colB = parseHex(opts.colorB, [0.68, 0.6, 1]);
    colLA = scaled(colA, [0.96, 0.96, 0.96]);
    colLB = scaled(colB, [0.96, 0.96, 0.96]);
    neb1 = scaled(colA, [0.5882, 0.8511, 0.9312]);
    neb2 = scaled(colB, [0.8092, 0.719, 1]);
    neb3 = scaled([(colA[0] + colB[0]) / 2, (colA[1] + colB[1]) / 2, (colA[2] + colB[2]) / 2], [0.5818, 0.8247, 1]);
    bg = parseHex(opts.background, [0.0078, 0.0196, 0.0431]);
  }

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      releaseContext();
      throw new Error("neurograph3d: shader compile failed: " + log);
    }
    return sh;
  }

  // the canvas stays bound to WebGL after getContext, so a 2D fallback needs a fresh canvas anyway;
  // losing the context at least frees the GPU memory right away
  function releaseContext() {
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  }

  function program(vs, fs, attribs, uniforms) {
    const p = gl.createProgram(), v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v); gl.attachShader(p, f);
    attribs.forEach(function (name, i) { gl.bindAttribLocation(p, i, name); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      gl.deleteProgram(p); gl.deleteShader(v); gl.deleteShader(f);
      releaseContext();
      throw new Error("neurograph3d: program link failed: " + log);
    }
    gl.deleteShader(v); gl.deleteShader(f);
    const u = {};
    uniforms.forEach(function (name) { u[name] = gl.getUniformLocation(p, name); });
    return { p: p, u: u };
  }

  function initGL() {
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    maxPt = range && range[1] ? range[1] : 64;
    progs = {
      points: program(POINTS_VS, POINTS_FS, ["position", "aScatter", "aSeed", "aKind"],
        ["uView", "uProj", "uTime", "uIntro", "uScale", "uWaveR", "uMaxPt", "uWaveO", "uColA", "uColB"]),
      lines: program(LINES_VS, LINES_FS, ["position"], ["uView", "uProj", "uWaveR", "uWaveO", "uLine", "uColA", "uColB"]),
      pulses: program(PULSE_VS, PULSE_FS, ["position"], ["uView", "uProj", "uScale", "uMaxPt"]),
      stars: program(STARS_VS, STARS_FS, ["position"], ["uView", "uProj", "uRot", "uSize"]),
      neb: program(NEB_VS, NEB_FS, ["corner"], ["uProj", "uCenter", "uSize", "uColor", "uOpacity"]),
    };
    bufs = { points: gl.createBuffer(), lines: gl.createBuffer(), pulses: gl.createBuffer(), stars: gl.createBuffer(), quad: gl.createBuffer() };
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    uploadModel();
  }

  function uploadModel() {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.points);
    gl.bufferData(gl.ARRAY_BUFFER, model.packed, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.lines);
    gl.bufferData(gl.ARRAY_BUFFER, model.segGpu, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.stars);
    gl.bufferData(gl.ARRAY_BUFFER, model.stars, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.pulses);
    gl.bufferData(gl.ARRAY_BUFFER, pulseBuf, gl.DYNAMIC_DRAW);
  }

  function resetPulses() {
    pulseCount = model.segPts.length ? Math.max(0, Math.round(opts.pulses)) : 0;
    pulseBuf = new Float32Array(Math.max(1, pulseCount) * 3);
    pulseState = [];
    for (let s = 0; s < pulseCount; s++) pulseState.push({ seg: -1, t: 0, sp: 0 });
    pulseActive = 0;
  }

  function rebuild() {
    model = buildModel(Math.max(0.05, opts.density), !!opts.links, Math.max(0, Math.round(opts.stars)));
    resetPulses();
    if (bufs && !lost) uploadModel();
  }

  function spawnPulse(near) {
    const n = model.segPts.length, pos = model.pos, rnd = model.rnd;
    for (let s = 0; s < pulseCount; s++) {
      if (pulseState[s].seg >= 0) continue;
      let best = Math.floor(rnd() * n);
      if (near) {
        let bd = 1e9;
        for (let k = 0; k < 24; k++) {
          const c = Math.floor(rnd() * n), i = model.segPts[c][0];
          const d = Math.hypot(pos[i * 3] - near.x, pos[i * 3 + 1] - near.y, pos[i * 3 + 2] - near.z);
          if (d < bd) { bd = d; best = c; }
        }
      }
      pulseState[s] = { seg: best, t: 0, sp: 0.9 + rnd() * 1.4, hops: near ? 5 : 2 };
      return;
    }
  }

  function fireWave(origin, strong, now) {
    wave = { t0: now, dur: strong ? 1900 : 2600 };
    waveO = [origin.x, origin.y, origin.z];
    const n = strong ? 18 : 6;
    for (let i = 0; i < n; i++) spawnPulse(origin);
  }

  function resize() {
    if (destroyed) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    cssW = w; cssH = h;
    dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
    const bw = Math.floor(w * dpr), bh = Math.floor(h * dpr);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const aspect = w / h, portrait = aspect < 1;
    camState.dist = portrait ? 1.12 / (TAN_HALF * aspect) : Math.max(BASE_DIST, 1.25 / (TAN_HALF * aspect));
    camState.scale = bh / (2 * TAN_HALF) * (portrait ? camState.dist / BASE_DIST : 1);
    camState.lookY = portrait ? 0.035 - 0.4 * camState.dist * TAN_HALF : 0.035;
    perspective(proj, FOV, aspect, NEAR, FAR);
    updateCamera(lastNow);
    if (!running || reduced) drawOnce();
  }

  function introProgress(now) {
    if (reduced || !opts.intro) return 1;
    return Math.min(1, (now - t0) / Math.max(1, opts.introMs));
  }

  function updateCamera(now) {
    const el = reduced ? 0 : (now - t0) / 1000;
    const ease = 1 - Math.pow(1 - introProgress(now), 3);
    const dist = camState.dist + (1 - ease) * 7;
    const orbit = opts.autoRotate && !reduced;
    const yaw = (orbit ? opts.rotateAmplitude * Math.sin(el * Math.PI * 2 / 52) : 0) + (1 - ease) * 1.2 + yawOff;
    const pitch = reduced ? 0.05 : (orbit ? 0.07 + 0.06 * Math.sin(el * Math.PI * 2 / 37) : 0.07);
    lookAt(view,
      Math.sin(yaw) * dist * Math.cos(pitch), Math.sin(pitch) * dist + 0.02, Math.cos(yaw) * dist * Math.cos(pitch),
      0.04, camState.lookY, 0);
    mul(vp, proj, view);
  }

  function enableAttribs(n) {
    for (let i = 0; i < 4; i++) { if (i < n) gl.enableVertexAttribArray(i); else gl.disableVertexAttribArray(i); }
  }

  function bindPositions(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    enableAttribs(1);
  }

  function draw(now) {
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;
    const el = reduced ? 0 : (now - t0) / 1000;
    const ip = introProgress(now);
    gl.viewport(0, 0, W, H);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    if (opts.glow > 0) {
      const N = progs.neb, g = opts.glow;
      gl.useProgram(N.p);
      gl.uniformMatrix4fv(N.u.uProj, false, proj);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufs.quad);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      enableAttribs(1);
      const list = [
        [neb2, 7.5, 1.1, -0.1, -3, (0.42 + 0.1 * Math.cos(el * 0.23)) * g],
        [neb1, 7, -0.8, 0.3, -2.5, (0.45 + 0.1 * Math.sin(el * 0.3)) * g],
        [neb3, 3.4, 0, 0, -0.6, 0.28 * g],
      ];
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        gl.uniform3f(N.u.uCenter,
          view[0] * n[2] + view[4] * n[3] + view[8] * n[4] + view[12],
          view[1] * n[2] + view[5] * n[3] + view[9] * n[4] + view[13],
          view[2] * n[2] + view[6] * n[3] + view[10] * n[4] + view[14]);
        gl.uniform2f(N.u.uSize, n[1], n[1] * 0.8);
        gl.uniform3fv(N.u.uColor, n[0]);
        gl.uniform1f(N.u.uOpacity, n[5]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    let P = progs.points;
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniform1f(P.u.uTime, el);
    gl.uniform1f(P.u.uIntro, ip);
    gl.uniform1f(P.u.uScale, camState.scale);
    gl.uniform1f(P.u.uWaveR, waveR);
    gl.uniform1f(P.u.uMaxPt, maxPt);
    gl.uniform3fv(P.u.uWaveO, waveO);
    gl.uniform3fv(P.u.uColA, colA);
    gl.uniform3fv(P.u.uColB, colB);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufs.points);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 24);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 28);
    enableAttribs(4);
    gl.drawArrays(gl.POINTS, 0, model.count);

    if (model.segGpu.length) {
      P = progs.lines;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uView, false, view);
      gl.uniformMatrix4fv(P.u.uProj, false, proj);
      gl.uniform1f(P.u.uWaveR, waveR);
      gl.uniform3fv(P.u.uWaveO, waveO);
      gl.uniform1f(P.u.uLine, Math.max(0, Math.min(1, (ip - 0.55) / 0.45)));
      gl.uniform3fv(P.u.uColA, colLA);
      gl.uniform3fv(P.u.uColB, colLB);
      bindPositions(bufs.lines);
      gl.drawArrays(gl.LINES, 0, model.segGpu.length / 3);
    }

    if (pulseActive) {
      P = progs.pulses;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uView, false, view);
      gl.uniformMatrix4fv(P.u.uProj, false, proj);
      gl.uniform1f(P.u.uScale, camState.scale);
      gl.uniform1f(P.u.uMaxPt, maxPt);
      bindPositions(bufs.pulses);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pulseBuf);
      gl.drawArrays(gl.POINTS, 0, pulseActive);
    }

    if (model.stars.length) {
      P = progs.stars;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uView, false, view);
      gl.uniformMatrix4fv(P.u.uProj, false, proj);
      gl.uniform1f(P.u.uRot, el * 0.004);
      gl.uniform1f(P.u.uSize, Math.min(maxPt, 1.3 * dpr));
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bindPositions(bufs.stars);
      gl.drawArrays(gl.POINTS, 0, model.stars.length / 3);
    }
  }

  function simulate(now, dt) {
    if (wave) {
      const wp = (now - wave.t0) / wave.dur;
      if (wp >= 1) { wave = null; waveR = 9; } else waveR = (1 - Math.pow(1 - wp, 2)) * 2.4;
    }
    if (dragging) {
      yawVel *= Math.exp(-dt * 6);
    } else {
      yawOff = Math.max(-2.2, Math.min(2.2, yawOff + yawVel * dt));
      yawVel *= Math.exp(-dt * 3.5);
      yawOff *= Math.exp(-dt * 0.6);
    }
    const ip = introProgress(now);
    const rnd = model.rnd, n = model.segPts.length;
    if (opts.ambientWaves && ip >= 1 && now > nextAmbient) {
      nextAmbient = now + 11000 + rnd() * 6000;
      const ai = Math.floor(rnd() * model.count);
      fireWave({ x: model.pos[ai * 3], y: model.pos[ai * 3 + 1], z: model.pos[ai * 3 + 2] }, false, now);
    }
    if (pulseCount && ip > 0.8 && rnd() < opts.pulses / 750) spawnPulse(null);
    const seg = model.seg, pp = pulseBuf;
    let k3 = 0;
    for (let s = 0; s < pulseCount; s++) {
      const ps = pulseState[s];
      if (ps.seg < 0) continue;
      ps.t += dt * ps.sp * 3.2;
      if (ps.t >= 1) {
        ps.hops--;
        if (ps.hops <= 0) { ps.seg = -1; continue; }
        const end = model.segPts[ps.seg][1];
        let nx = -1;
        for (let k = 0; k < 12; k++) { const c = Math.floor(rnd() * n); if (model.segPts[c][0] === end) { nx = c; break; } }
        ps.seg = nx >= 0 ? nx : Math.floor(rnd() * n);
        ps.t = 0;
      }
      const o = ps.seg * 6;
      pp[k3] = seg[o] + (seg[o + 3] - seg[o]) * ps.t;
      pp[k3 + 1] = seg[o + 1] + (seg[o + 4] - seg[o + 1]) * ps.t;
      pp[k3 + 2] = seg[o + 2] + (seg[o + 5] - seg[o + 2]) * ps.t;
      k3 += 3;
    }
    pulseActive = k3 / 3;
  }

  function render(now) {
    lastNow = now;
    updateCamera(now);
    draw(now);
    if (typeof opts.onFrame === "function") opts.onFrame(api);
  }

  function drawOnce() {
    if (lost || destroyed || !progs) return;
    render(reduced ? t0 : lastNow);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const frameMin = opts.fps > 0 ? 1000 / opts.fps : 0;
    if (frameMin && now - lastDraw < frameMin - 1) return;
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    simulate(now, dt);
    render(now);
  }

  function start() {
    if (running || destroyed || lost) return;
    running = true;
    if (reduced) { drawOnce(); return; }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---------- interaction ---------- */

  function nearestPoint(px, py) {
    const pos = model.pos, centerW = vp[15];
    let best = -1, bd = 1e18;
    for (let i = 0; i < model.count; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (w <= 0 || w > centerW) continue;
      const sx = ((vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w * 0.5 + 0.5) * cssW;
      const sy = (-(vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w * 0.5 + 0.5) * cssH;
      const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function onDown(e) {
    dragging = true; moved = false; downX = e.clientX; downY = e.clientY; yawVel = 0; lastMoveT = performance.now();
    if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) { dragging = true; } }
  }

  function onMove(e) {
    if (!dragging) return;
    const nowT = performance.now();
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 5) moved = true;
    const dYaw = (e.movementX || 0) * 0.005;
    yawOff = Math.max(-2.2, Math.min(2.2, yawOff - dYaw));
    yawVel = yawVel * 0.5 + (-dYaw / (Math.max(1, nowT - lastMoveT) / 1000)) * 0.5;
    lastMoveT = nowT;
    if (!running || reduced) { updateCamera(lastNow); drawOnce(); }
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastMoveT > 90) yawVel = 0;
    if (moved) return;
    const r = canvas.getBoundingClientRect();
    const i = nearestPoint(e.clientX - r.left, e.clientY - r.top);
    if (i >= 0) fireWave({ x: model.pos[i * 3], y: model.pos[i * 3 + 1], z: model.pos[i * 3 + 2] }, true, performance.now());
  }

  function onCancel() { dragging = false; }

  function bindInteraction() {
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    bound = true;
    prevTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = "pan-y";
  }

  function unbindInteraction() {
    if (!bound) return;
    bound = false;
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onCancel);
    canvas.style.touchAction = prevTouchAction;
  }

  /* ---------- lifecycle ---------- */

  function onLost(e) {
    e.preventDefault();
    const was = running;
    stop();
    running = was;
    lost = true;
  }

  function onRestored() {
    lost = false;
    initGL();
    if (running) { running = false; start(); } else drawOnce();
  }

  applyColors();
  rebuild();
  initGL();
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  if (typeof ResizeObserver === "function") { ro = new ResizeObserver(resize); ro.observe(canvas); } else window.addEventListener("resize", resize);
  if (opts.interactive) bindInteraction();

  api = {
    wave: function (point) {
      if (destroyed) return;
      let p = point;
      if (!p) {
        const i = Math.floor(model.rnd() * model.count);
        p = { x: model.pos[i * 3], y: model.pos[i * 3 + 1], z: model.pos[i * 3 + 2] };
      }
      fireWave(p, true, performance.now());
    },
    project: function (p) {
      const w = vp[3] * p.x + vp[7] * p.y + vp[11] * p.z + vp[15];
      const nx = (vp[0] * p.x + vp[4] * p.y + vp[8] * p.z + vp[12]) / w;
      const ny = (vp[1] * p.x + vp[5] * p.y + vp[9] * p.z + vp[13]) / w;
      return { x: (nx * 0.5 + 0.5) * cssW, y: (-ny * 0.5 + 0.5) * cssH, visible: w > 0 && Math.abs(nx) <= 1 && Math.abs(ny) <= 1 };
    },
    surfacePoint: function (u, v) {
      const x = (u - 500) / 500, y = -(v - 420) / 500;
      return { x: x, y: y, z: zmax(x, y) + 0.012 };
    },
    update: function (next) {
      if (destroyed) return api;
      const prev = Object.assign({}, opts);
      Object.assign(opts, next || {});
      applyColors();
      if (opts.density !== prev.density || opts.links !== prev.links || opts.stars !== prev.stars) rebuild();
      else if (opts.pulses !== prev.pulses) {
        resetPulses();
        if (!lost) { gl.bindBuffer(gl.ARRAY_BUFFER, bufs.pulses); gl.bufferData(gl.ARRAY_BUFFER, pulseBuf, gl.DYNAMIC_DRAW); }
      }
      if (opts.maxDpr !== prev.maxDpr) resize();
      if (opts.interactive !== prev.interactive) { if (opts.interactive) bindInteraction(); else unbindInteraction(); }
      if (!running || reduced) drawOnce();
      return api;
    },
    start: start,
    stop: stop,
    destroy: function () {
      if (destroyed) return;
      stop();
      destroyed = true;
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      unbindInteraction();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (!lost) {
        Object.keys(bufs).forEach(function (k) { gl.deleteBuffer(bufs[k]); });
        Object.keys(progs).forEach(function (k) { gl.deleteProgram(progs[k].p); });
      }
      bufs = null; progs = null; model = null;
    },
    get nodeCount() { return model ? model.count : 0; },
    get linkCount() { return model ? model.segPts.length : 0; },
  };

  resize();
  start();
  return api;
}

export default createNeurograph3D;
