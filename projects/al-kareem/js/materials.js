// Materials: CC0-ready PBR set with procedural stand-ins, plus the
// "drawing → material" reveal patch every surface in the scene shares.
import * as THREE from 'three';

export const PAPER = new THREE.Color(0.953, 0.941, 0.914);   // sheet colour (sRGB, output space)
export const INK = new THREE.Color(0.075, 0.075, 0.085);
export const GLOW = new THREE.Color(1.0, 0.72, 0.38);

// ---------------------------------------------------------------- reveal zones
// Each zone sweeps material across the drawing along a direction. A fragment
// belongs to the hall zone when it is inside the hall rectangle and below its
// roof; everything else is exterior.
export const REVEAL = {
  uExtOrigin: { value: new THREE.Vector3() },
  uExtDir: { value: new THREE.Vector3(1, 0, 0) },
  uExtFront: { value: -1e4 },
  uHallOrigin: { value: new THREE.Vector3() },
  uHallDir: { value: new THREE.Vector3(1, 0, 0) },
  uHallFront: { value: -1e4 },
  uSoft: { value: 6.0 },
  uHallC: { value: new THREE.Vector2() },
  uHallU: { value: new THREE.Vector2(1, 0) },
  uHallHalf: { value: new THREE.Vector2(1, 1) },
  uHallTop: { value: 7.7 },
  uDomeC: { value: new THREE.Vector2() },
  uDomeR: { value: 3.3 },
  uDomeTop: { value: 15.0 },
  uPaper: { value: PAPER.clone() },
  uInk: { value: INK.clone() },
  uGlowCol: { value: GLOW.clone() },
  uLineAlpha: { value: 1.0 },
  uIntAmb: { value: 0.3 },
  uPocheOn: { value: 1.0 },
};

const REVEAL_GLSL = /* glsl */`
uniform vec3 uExtOrigin; uniform vec3 uExtDir; uniform float uExtFront;
uniform vec3 uHallOrigin; uniform vec3 uHallDir; uniform float uHallFront;
uniform vec2 uDomeC; uniform float uDomeR; uniform float uDomeTop;
uniform float uSoft; uniform vec2 uHallC; uniform vec2 uHallU; uniform vec2 uHallHalf; uniform float uHallTop;
uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uGlowCol;
uniform float uZone; uniform float uPoche; uniform vec3 uTint; uniform float uIntAmb; uniform float uPocheOn; uniform float uDomeHole;
varying vec3 vRWorld;
float rvZoneIsHall(vec3 w){
  if (uZone > 1.5) return 0.0;
  if (uZone > 0.5) return 1.0;
  vec2 d = w.xz - uHallC;
  vec2 v = vec2(-uHallU.y, uHallU.x);
  float a = abs(dot(d, uHallU)), b = abs(dot(d, v));
  if (length(w.xz - uDomeC) < uDomeR && w.y < uDomeTop) return 1.0;
  return (a < uHallHalf.x - 0.12 && b < uHallHalf.y - 0.12 && w.y < uHallTop) ? 1.0 : 0.0;
}
float rvInHallGeo(vec3 w){
  vec2 d = w.xz - uHallC; vec2 v = vec2(-uHallU.y, uHallU.x);
  float a = abs(dot(d, uHallU)), b = abs(dot(d, v));
  float inR = step(a, uHallHalf.x - 0.05) * step(b, uHallHalf.y - 0.05) * step(w.y, uHallTop);
  float inD = step(length(w.xz - uDomeC), uDomeR + 0.2) * step(w.y, uDomeTop);
  return max(inR, inD);
}
// 0 = still drawing, 1 = material. g = glow at the sweep front.
float rvAmount(vec3 w, out float g){
  float h = rvZoneIsHall(w);
  vec3 o = mix(uExtOrigin, uHallOrigin, h);
  vec3 dir = mix(uExtDir, uHallDir, h);
  float front = mix(uExtFront, uHallFront, h);
  float d = dot(w - o, dir);
  float f = smoothstep(front, front - uSoft, d);
  float x = (d - (front - uSoft * 0.35)) / (uSoft * 0.22);
  g = exp(-x * x) * (1.0 - f) * step(-1e3, front);
  return f;
}
`;

function injectVertex(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vRWorld;')
    .replace('#include <project_vertex>', `#include <project_vertex>
      vec4 rvW = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        rvW = instanceMatrix * rvW;
      #endif
      vRWorld = (modelMatrix * rvW).xyz;`);
}

function bindUniforms(sh, own) {
  Object.assign(sh.uniforms, REVEAL, own);
}

// Patch a lit/unlit mesh material.
export function revealMesh(mat, opts = {}) {
  const own = {
    uZone: { value: opts.zone === 'hall' ? 1 : opts.zone === 'ext' ? 2 : 0 },
    uPoche: { value: opts.poche === false ? 0 : 1 },
    uTint: { value: opts.tint ? new THREE.Color().setStyle(opts.tint, THREE.LinearSRGBColorSpace) : PAPER.clone() },
    uDomeHole: { value: 0 },
  };
  if (opts.poche !== false && mat.side === THREE.FrontSide) mat.side = THREE.DoubleSide;
  mat.userData.reveal = own;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    bindUniforms(sh, own);
    injectVertex(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + REVEAL_GLSL)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { float ih = rvInHallGeo(vRWorld);
          reflectedLight.indirectDiffuse *= mix(1.0, uIntAmb, ih);
          reflectedLight.indirectSpecular *= mix(1.0, uIntAmb * 1.6, ih); }`)
      .replace(/}\s*$/, `
        if (uDomeHole > 0.5 && length(vRWorld.xz - uDomeC) < uDomeR - 0.05 && vRWorld.y > 9.3 && vRWorld.y < 11.2) discard;
        float rvG; float rvF = rvAmount(vRWorld, rvG);
        vec3 rvC = gl_FragColor.rgb;
        if (!gl_FrontFacing && uPoche > 0.5 && uPocheOn > 0.5) {
          gl_FragColor = vec4(uInk, 1.0); // section poché, always ink
        } else {
          gl_FragColor.rgb = mix(uTint, rvC, rvF) + uGlowCol * rvG * 0.55;
          gl_FragColor.a = mix(1.0, gl_FragColor.a, rvF);
        }
      }`);
  };
  mat.customProgramCacheKey = () => 'rv' + (opts.zone || 'a') + (opts.poche === false ? 'n' : 'p') + (mat.type);
  return mat;
}

// Ink line material that fades out as the material arrives.
export function inkLines(opts = {}) {
  const m = new THREE.LineBasicMaterial({
    color: opts.color || INK, transparent: true, depthWrite: false,
    opacity: opts.opacity ?? 1,
  });
  const own = {
    uZone: { value: opts.zone === 'hall' ? 1 : opts.zone === 'ext' ? 2 : 0 },
    uPoche: { value: 0 }, uTint: { value: new THREE.Color() },
    uFade: { value: opts.fade ?? 1 },
  };
  m.userData.reveal = own;
  m.onBeforeCompile = (sh) => {
    bindUniforms(sh, own);
    injectVertex(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + REVEAL_GLSL + '\nuniform float uLineAlpha; uniform float uFade;')
      .replace(/}\s*$/, `
        float rvG; float rvF = rvAmount(vRWorld, rvG);
        gl_FragColor.a *= (1.0 - rvF) * uLineAlpha * uFade;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uGlowCol, rvG * 0.6);
      }`);
  };
  m.customProgramCacheKey = () => 'ink' + (opts.zone || 'a');
  return m;
}

// ---------------------------------------------------------------- noise
function hash(i, j, s) {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const p = period;
  const a = hash(((xi % p) + p) % p, ((yi % p) + p) % p, seed);
  const b = hash((((xi + 1) % p) + p) % p, ((yi % p) + p) % p, seed);
  const c = hash(((xi % p) + p) % p, (((yi + 1) % p) + p) % p, seed);
  const d = hash((((xi + 1) % p) + p) % p, (((yi + 1) % p) + p) % p, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, base, oct, seed) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise(x * base * f, y * base * f, base * f, seed + o * 17);
    amp *= 0.5; f *= 2;
  }
  return s;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function canvasTex(size, draw, { srgb = true, repeat = true } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Build colour + roughness + normal maps from a per-pixel function
// fn(u,v) -> [r,g,b, rough, height]
function pbrSet(size, fn, normalStrength = 2) {
  const col = new Uint8ClampedArray(size * size * 4);
  const rgh = new Uint8ClampedArray(size * size * 4);
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = fn(x / size, y / size);
    const i = (y * size + x);
    col[i * 4] = o[0] * 255; col[i * 4 + 1] = o[1] * 255; col[i * 4 + 2] = o[2] * 255; col[i * 4 + 3] = 255;
    const r = o[3] * 255; rgh[i * 4] = r; rgh[i * 4 + 1] = r; rgh[i * 4 + 2] = r; rgh[i * 4 + 3] = 255;
    hgt[i] = o[4];
  }
  const nrm = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const l = hgt[y * size + ((x - 1 + size) % size)], r = hgt[y * size + ((x + 1) % size)];
    const u = hgt[((y - 1 + size) % size) * size + x], d = hgt[((y + 1) % size) * size + x];
    let nx = (l - r) * normalStrength, ny = (d - u) * normalStrength, nz = 1;
    const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
    const i = (y * size + x) * 4;
    nrm[i] = (nx * 0.5 + 0.5) * 255; nrm[i + 1] = (ny * 0.5 + 0.5) * 255; nrm[i + 2] = (nz * 0.5 + 0.5) * 255; nrm[i + 3] = 255;
  }
  const mk = (arr, srgb) => {
    const t = new THREE.DataTexture(arr, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { map: mk(col, true), roughnessMap: mk(rgh, false), normalMap: mk(nrm, false) };
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ---- white render (lime plaster)
function plasterSet() {
  return pbrSet(512, (u, v) => {
    const n = fbm(u, v, 6, 5, 3), m = fbm(u, v, 40, 3, 9);
    const k = 0.93 + n * 0.06 + m * 0.02;
    return [k * 0.985, k * 0.965, k * 0.93, 0.82 + m * 0.12, n * 0.5 + m * 0.35];
  }, 1.4);
}

// ---- split-face travertine cladding (coursed random rubble), 2.2 m tile
function stoneSet() {
  const S = 1024, R = rng(11);
  const rows = []; let y = 0;
  while (y < 1) { const h = lerp(0.075, 0.15, R()); rows.push([y, Math.min(1, y + h)]); y += h; }
  rows[rows.length - 1][1] = 1;
  const blocks = rows.map(([y0, y1]) => {
    const xs = []; const start = R() * 0.2; let x = start;
    while (x < start + 1) { const w = lerp(0.12, 0.3, R()); xs.push([x, x + w, R(), R()]); x += w; }
    return { y0, y1, xs, start };
  });
  return pbrSet(S, (u, v) => {
    const row = blocks.find((b) => v >= b.y0 && v < b.y1) || blocks[blocks.length - 1];
    let uu = u; if (uu < row.start) uu += 1;
    const bl = row.xs.find((b) => uu >= b[0] && uu < b[1]) || row.xs[row.xs.length - 1];
    const warp = fbm(u, v, 18, 3, 3) * 0.012;
    const edge = Math.min(uu - bl[0], bl[1] - uu, v - row.y0, row.y1 - v) + warp - 0.006;
    const fine = fbm(u, v, 64, 3, 5), mid = fbm(u, v, 16, 4, 7), coarse = fbm(u, v, 4, 3, 9);
    const pits = fbm(u, v, 120, 2, 13);
    if (edge < 0.0025) return [0.5, 0.44, 0.36, 0.97, -0.4];
    const bulge = Math.pow(clamp01(edge / 0.035), 0.45);
    const tone = bl[2], tone2 = bl[3];
    const base = [lerp(0.8, 0.92, tone), lerp(0.71, 0.82, tone) - tone2 * 0.025, lerp(0.55, 0.67, tone) - tone2 * 0.04];
    const k = 0.84 + mid * 0.18 + fine * 0.1 + coarse * 0.06 - (pits > 0.7 ? 0.12 : 0);
    const h = bulge * (0.35 + mid * 0.9 + fine * 0.4 + tone2 * 0.4) - (pits > 0.7 ? 0.25 : 0);
    return [base[0] * k, base[1] * k, base[2] * k, 0.92 - fine * 0.1, h];
  }, 7);
}

// ---- forecourt paving: honed travertine slabs, wettish sheen. 3.6 m tile
function pavingSet() {
  const R = rng(21), S = 1024;
  const rows = []; let y = 0;
  while (y < 1) { const h = [0.1667, 0.1667, 0.25][Math.floor(R() * 3)]; rows.push([y, Math.min(1, y + h)]); y += h; }
  const blocks = rows.map(([y0, y1]) => {
    const xs = []; let x = 0; const off = Math.floor(R() * 4) / 12;
    while (x < 1) { const w = [0.1667, 0.25, 0.3333][Math.floor(R() * 3)]; xs.push([x, x + w, R()]); x += w; }
    return { y0, y1, xs, off };
  });
  return pbrSet(S, (u, v) => {
    const row = blocks.find((b) => v >= b.y0 && v < b.y1) || blocks[blocks.length - 1];
    const uu = (u + row.off) % 1;
    const bl = row.xs.find((b) => uu >= b[0] && uu < b[1]) || row.xs[row.xs.length - 1];
    const edge = Math.min(uu - bl[0], bl[1] - uu, v - row.y0, row.y1 - v);
    const vein = Math.abs(Math.sin((u * 3 + fbm(u, v, 6, 4, 2) * 2.2) * 9 + bl[2] * 20));
    const n = fbm(u, v, 30, 3, 4);
    const t = bl[2];
    const k = 0.9 + n * 0.12 - (vein < 0.06 ? 0.05 : 0);
    const c = [lerp(0.76, 0.84, t) * k, lerp(0.68, 0.76, t) * k, lerp(0.56, 0.64, t) * k];
    if (edge < 0.0016) return [0.45, 0.42, 0.38, 0.9, -0.5];
    return [c[0], c[1], c[2], 0.42 + n * 0.3, 0];
  }, 2.5);
}

function asphaltSet() {
  return pbrSet(512, (u, v) => {
    const n = fbm(u, v, 60, 3, 31), m = fbm(u, v, 4, 3, 32);
    const k = 0.2 + n * 0.08 + m * 0.04;
    return [k, k * 0.98, k * 0.95, 0.85, n];
  }, 3);
}

function walnutSet() {
  return pbrSet(512, (u, v) => {
    const w = fbm(u, v * 0.25, 6, 4, 41);
    const g = Math.sin(u * 140 + w * 22) * 0.5 + 0.5;
    const fleck = fbm(u, v, 80, 2, 43);
    const k = 0.72 + g * 0.18 + fleck * 0.12;
    return [0.30 * k, 0.175 * k, 0.1 * k, 0.42 + g * 0.12, g * 0.15];
  }, 1.0);
}

function marbleSet() {
  return pbrSet(512, (u, v) => {
    const w = fbm(u, v, 3, 5, 51);
    const vein = Math.pow(1 - Math.abs(Math.sin((u + v * 0.6 + w * 1.4) * 5)), 22);
    const k = 0.95 - vein * 0.13 + fbm(u, v, 40, 2, 52) * 0.025;
    return [k * 0.97, k * 0.95, k * 0.91, 0.18, -vein * 0.1];
  }, 0.6);
}

function soilSet() {
  return pbrSet(256, (u, v) => {
    const n = fbm(u, v, 30, 4, 61);
    const k = 0.25 + n * 0.2;
    return [k * 1.1, k * 0.85, k * 0.6, 0.95, n];
  }, 3);
}

// prayer carpet — Al-Mira Centre pattern ASTP.23.12.27-6.6.1 (100% acrylic roll):
// one tile = 65 cm (along the row) x 133 cm (row depth): 28 cm violet band with
// rosettes (toward the qibla) + 105 cm krem field with black and violet stripes.
// Colours: EH1078 Krem, EH0000 Violet, EH1016 Black.
function carpetTex() {
  const PX = 8; // px per cm
  const W = 65 * PX, H = 133 * PX;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const KREM = '#ecdecb', VIOLET = '#74418f', BLACK = '#151216', LILAC = '#c4a8dc';
  // pattern y (cm from the back edge) -> canvas y, flipped so the band sits at the qibla side (canvas top)
  const Y = (cm) => (133 - cm) * PX;
  const band = (y0, y1, col) => { ctx.fillStyle = col; ctx.fillRect(0, Y(y1), W, (y1 - y0) * PX); };
  ctx.fillStyle = KREM; ctx.fillRect(0, 0, W, H);
  const line = (y, t, col) => band(y - t / 2, y + t / 2, col);
  const ticks = (y0, y1) => {
    band(y0, y1, BLACK);
    const m0 = y0 + (y1 - y0) * 0.3, m1 = y1 - (y1 - y0) * 0.3;
    band(m0, m1, LILAC);
    ctx.fillStyle = VIOLET;
    for (let x = 0; x < 65; x += 1.0) ctx.fillRect(x * PX, Y(m1 + 0.25), 0.45 * PX, (m1 - m0 + 0.5) * PX);
    ctx.fillStyle = BLACK;
    for (let x = 0.5; x < 65; x += 2.0) ctx.fillRect(x * PX, Y(m1), 0.3 * PX, (m1 - m0) * PX);
  };
  const zig = (y0, y1, col, rows = 2) => {
    ctx.strokeStyle = col; ctx.lineWidth = 0.32 * PX;
    const h = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      const a = y0 + r * h + h * 0.15, b = y0 + (r + 1) * h - h * 0.15;
      ctx.beginPath();
      for (let x = 0, k = 0; x <= 65.01; x += 1.3, k++) { const yy = k % 2 ? a : b; if (!k) ctx.moveTo(x * PX, Y(yy)); else ctx.lineTo(x * PX, Y(yy)); }
      ctx.stroke();
    }
  };
  line(2.4, 0.45, VIOLET);
  ticks(13.0, 17.9);
  zig(24.2, 29.2, VIOLET);
  ticks(35.9, 40.9);
  line(47.7, 0.7, BLACK); zig(48.4, 51.2, VIOLET, 1); line(51.7, 0.6, BLACK); zig(52.2, 55.0, VIOLET, 1); line(55.8, 0.8, BLACK);
  ticks(64.2, 69.2);
  zig(75.7, 80.4, VIOLET);
  ticks(87.1, 91.9);
  line(101.9, 0.45, VIOLET);
  // the violet prayer band with three rosettes
  band(105, 133, VIOLET);
  const ros = (cx, cy, r) => {
    const X = cx * PX, YY = Y(cy), R = r * PX;
    ctx.strokeStyle = LILAC; ctx.lineWidth = 0.28 * PX;
    ctx.beginPath(); ctx.arc(X, YY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([0.35 * PX, 0.35 * PX]);
    ctx.beginPath(); ctx.arc(X, YY, R * 0.86, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 0.22 * PX; ctx.strokeStyle = '#e8dcf2';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(X + Math.cos(a) * R * 0.36, YY + Math.sin(a) * R * 0.36, R * 0.36, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#e8dcf2';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, rr = R * 0.76;
      ctx.beginPath();
      ctx.moveTo(X + Math.cos(a) * rr, YY + Math.sin(a) * rr);
      ctx.lineTo(X + Math.cos(a + 0.12) * R * 0.6, YY + Math.sin(a + 0.12) * R * 0.6);
      ctx.lineTo(X + Math.cos(a - 0.12) * R * 0.6, YY + Math.sin(a - 0.12) * R * 0.6);
      ctx.closePath(); ctx.fill();
    }
  };
  [10.8, 32.5, 54.2].forEach((x) => ros(x, 119, 7.4));
  // pile: slight noise
  const id = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) { const k = 0.93 + Math.random() * 0.1; id.data[i] *= k; id.data[i + 1] *= k; id.data[i + 2] *= k; }
  ctx.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

function frondTex() {
  return canvasTex(512, (ctx, S) => {
    ctx.clearRect(0, 0, S, S);
    const R = rng(7);
    // rachis from left to right, leaflets both sides
    ctx.strokeStyle = '#5b6b2e'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, S / 2); ctx.lineTo(S, S / 2); ctx.stroke();
    for (let i = 0; i < 70; i++) {
      const x = 20 + i * (S - 30) / 70;
      const len = S * 0.46 * Math.sin(Math.PI * (0.15 + 0.85 * x / S)) ;
      for (const s of [-1, 1]) {
        const g = 70 + R() * 50;
        ctx.strokeStyle = `rgb(${g * 0.6 | 0},${g + 30 | 0},${g * 0.35 | 0})`;
        ctx.lineWidth = 3 + R() * 2;
        ctx.beginPath(); ctx.moveTo(x, S / 2);
        ctx.quadraticCurveTo(x + len * 0.35, S / 2 + s * len * 0.6, x + len * 0.55, S / 2 + s * len * (0.95 + R() * 0.05));
        ctx.stroke();
      }
    }
  }, { repeat: false });
}

function trunkTex() {
  return canvasTex(256, (ctx, S) => {
    ctx.fillStyle = '#7a6448'; ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 8) {
      ctx.fillStyle = `rgba(40,30,20,${0.35 + Math.random() * 0.3})`;
      ctx.fillRect(0, y, S, 2 + Math.random() * 2);
      ctx.fillStyle = `rgba(160,135,100,${0.3})`;
      ctx.fillRect(0, y + 4, S, 2);
    }
  });
}

// ---------------------------------------------------------------- optional CC0 files
// Drop ambientCG / Poly Haven maps into /textures as <key>_color.jpg,
// <key>_rough.jpg, <key>_normal.jpg and they replace the procedural set.
async function tryFiles(key) {
  const base = `textures/${key}`;
  try {
    const r = await fetch(`${base}_color.jpg`, { method: 'HEAD' });
    if (!r.ok) return null;
  } catch { return null; }
  const L = new THREE.TextureLoader();
  const load = (s, srgb) => new Promise((res) => L.load(`${base}_${s}.jpg`, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t);
  }, undefined, () => res(null)));
  const [map, roughnessMap, normalMap] = await Promise.all([load('color', true), load('rough', false), load('normal', false)]);
  return { map, roughnessMap, normalMap };
}

// ---------------------------------------------------------------- library
export async function buildMaterials() {
  const sets = {
    plaster: (await tryFiles('plaster')) || plasterSet(),
    stone: (await tryFiles('stone')) || stoneSet(),
    paving: (await tryFiles('paving')) || pavingSet(),
    asphalt: (await tryFiles('asphalt')) || asphaltSet(),
    walnut: (await tryFiles('walnut')) || walnutSet(),
    marble: (await tryFiles('marble')) || marbleSet(),
    soil: soilSet(),
  };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {};
  M.plaster = std({ ...sets.plaster, color: 0xe4ded3, roughness: 1, normalScale: new THREE.Vector2(0.35, 0.35) });
  M.plasterIn = std({ ...sets.plaster, color: 0xfffcf6, roughness: 1, envMapIntensity: 0.45, normalScale: new THREE.Vector2(0.2, 0.2) });
  M.stone = std({ ...sets.stone, color: 0xffffff, roughness: 1, envMapIntensity: 0.7, normalScale: new THREE.Vector2(1.6, 1.6) });
  M.paving = std({ ...sets.paving, color: 0xf4e9d8, roughness: 1, envMapIntensity: 0.8, normalScale: new THREE.Vector2(0.4, 0.4) });
  M.asphalt = std({ ...sets.asphalt, color: 0xffffff, roughness: 1 });
  M.limeSmooth = std({ ...sets.paving, color: 0xf6eddc, roughness: 1, envMapIntensity: 0.6 });
  M.kerb = std({ ...sets.paving, color: 0xdedad2, roughness: 0.8 });
  M.walnut = std({ ...sets.walnut, color: 0xffffff, roughness: 1, envMapIntensity: 0.6 });
  M.walnutDoor = std({ ...sets.walnut, color: 0xffffff, roughness: 1, envMapIntensity: 0.8 });
  M.marble = std({ ...sets.marble, color: 0xffffff, roughness: 1, envMapIntensity: 0.7 });
  M.soil = std({ ...sets.soil, color: 0xffffff, roughness: 1 });
  M.bronze = std({ color: 0x9a7444, metalness: 1, roughness: 0.32, envMapIntensity: 1.3 });
  M.brass = std({ color: 0xd9b46a, metalness: 1, roughness: 0.22, envMapIntensity: 1.4 });
  M.gold = std({ color: 0xd6ad62, metalness: 1, roughness: 0.25, emissive: 0x3a2508, emissiveIntensity: 0.6 });
  M.glass = std({ color: 0x1a1d1f, metalness: 0.1, roughness: 0.04, envMapIntensity: 1.6,
    emissive: 0xffb25e, emissiveIntensity: 0.16, transparent: true, opacity: 0.55, depthWrite: false });
  M.glassIn = std({ color: 0xbfc7c9, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false, envMapIntensity: 0.6 });
  M.carpet = std({ map: carpetTex(), roughness: 0.95, color: 0xffffff, envMapIntensity: 0.3 });
  M.ceiling = std({ ...sets.plaster, color: 0xf7f1e6, roughness: 1, envMapIntensity: 0.35 });
  M.domeIn = std({ color: 0xd8b77c, metalness: 0.45, roughness: 0.4, envMapIntensity: 0.6, side: THREE.BackSide, emissive: 0x6a4818, emissiveIntensity: 0.55 });
  M.led = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  M.ledIn = new THREE.MeshBasicMaterial({ color: 0xffcf8a });
  M.lantern = std({ color: 0xfff1d6, emissive: 0xffc27a, emissiveIntensity: 2.2, roughness: 0.5 });
  M.bulb = new THREE.MeshBasicMaterial({ color: 0xfff0d0 });
  M.trunk = std({ map: trunkTex(), roughness: 0.95 });
  M.frond = std({ map: frondTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 });
  M.leaf = std({ color: 0x4d6233, roughness: 0.9 });
  M.olive = std({ color: 0x8a9772, roughness: 0.85 });
  M.flowerPurple = std({ color: 0x7a5a9e, roughness: 0.9 });
  M.flowerWhite = std({ color: 0xe9e4d8, roughness: 0.9 });
  M.flowerYellow = std({ color: 0xd8b23a, roughness: 0.9 });
  M.rock = std({ ...sets.stone, color: 0xb9a688, roughness: 1 });
  M.neighbour = std({ ...sets.plaster, color: 0xb9b0a3, roughness: 1 });

  // repeat scales (metres per tile)
  const rep = (m, s) => ['map', 'roughnessMap', 'normalMap'].forEach((k) => {
    if (m[k]) { m[k] = m[k].clone(); m[k].repeat.set(1 / s, 1 / s); m[k].needsUpdate = true; }
  });
  rep(M.plaster, 3); rep(M.plasterIn, 3); rep(M.stone, 3.0); rep(M.paving, 3.6); rep(M.asphalt, 6);
  rep(M.walnut, 1.2); rep(M.walnutDoor, 1.2); rep(M.marble, 2.4); rep(M.soil, 2); rep(M.kerb, 3.6); rep(M.limeSmooth, 2.0); rep(M.rock, 1.5);
  rep(M.neighbour, 3); rep(M.ceiling, 3);
  M.carpet.map.repeat.set(1 / 0.65, 1 / 1.33);

  const tints = {
    frond: '#dcdfd0', trunk: '#dcdfd0', leaf: '#dde0d0', olive: '#dde0d0', flowerPurple: '#dde0d0', flowerWhite: '#dde0d0',
    flowerYellow: '#dde0d0', rock: '#e8e5dc', soil: '#ebe8df',
  };
  // single-sided SketchUp faces (doors, screens) seen from both sides
  M.walnutTwo = std({ ...sets.walnut, color: 0xffffff, roughness: 1, envMapIntensity: 0.8, side: THREE.DoubleSide });
  M.bronzeTwo = std({ color: 0x9a7444, metalness: 1, roughness: 0.32, envMapIntensity: 1.3, side: THREE.DoubleSide });
  rep(M.walnutTwo, 1.2);
  const hall = new Set(['domeIn']);
  const ext = new Set(['glass', 'bronze', 'bronzeTwo', 'walnutTwo', 'walnutDoor', 'neighbour', 'asphalt', 'kerb', 'led']);
  for (const [k, m] of Object.entries(M)) {
    revealMesh(m, {
      zone: hall.has(k) ? 'hall' : ext.has(k) ? 'ext' : undefined,
      poche: !['frond', 'glass', 'glassIn', 'led', 'ledIn', 'bulb', 'domeIn', 'neighbour', 'walnutTwo', 'bronzeTwo'].includes(k),
      tint: tints[k],
    });
  }
  return M;
}
