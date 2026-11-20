// Material textures.
// If a CC0 set exists in ./textures/<name>/ (color.jpg, roughness.jpg, normal.jpg — ambientCG / Poly Haven
// naming, renamed), it is used. Otherwise a stand-in is generated here, procedurally, in code.
import * as THREE from 'three';

// ---------- periodic value noise (tileable) ----------
function makeNoise(seed) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const h = (i, j) => p[(p[i & 255] + (j & 255)) & 511] / 255;
  const sm = t => t * t * (3 - 2 * t);
  return (x, y, px, py) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = h(x0, y0), b = h(x1, y0), c = h(x0, y1), d = h(x1, y1);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbm(n, u, v, px, py, oct = 4) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += amp * n(u * px * f, v * py * f, px * f, py * f);
    norm += amp; amp *= 0.5; f *= 2;
  }
  return sum / norm;
}
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Build color / height / roughness canvases from a per-pixel function.
let SCALE = 1;
export function setTextureScale(k) { SCALE = k; }
function bake(N, M, fn) {
  N = Math.max(128, Math.round(N * SCALE)); M = Math.max(128, Math.round(M * SCALE));
  const mk = () => { const c = document.createElement('canvas'); c.width = N; c.height = M; return c; };
  const cc = mk(), hc = mk(), rc = mk();
  const ci = cc.getContext('2d').createImageData(N, M), hi = hc.getContext('2d').createImageData(N, M), ri = rc.getContext('2d').createImageData(N, M);
  const out = { r: 0, g: 0, b: 0, h: 0.5, rough: 0.5 };
  for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
    out.h = 0.5; out.rough = 0.5;
    fn(x / N, y / M, out);
    const k = (y * N + x) * 4;
    ci.data[k] = out.r; ci.data[k + 1] = out.g; ci.data[k + 2] = out.b; ci.data[k + 3] = 255;
    const hv = Math.max(0, Math.min(255, out.h * 255)); hi.data[k] = hi.data[k + 1] = hi.data[k + 2] = hv; hi.data[k + 3] = 255;
    const rv = Math.max(0, Math.min(255, out.rough * 255)); ri.data[k] = ri.data[k + 1] = ri.data[k + 2] = rv; ri.data[k + 3] = 255;
  }
  cc.getContext('2d').putImageData(ci, 0, 0); hc.getContext('2d').putImageData(hi, 0, 0); rc.getContext('2d').putImageData(ri, 0, 0);
  return { color: cc, height: hc, rough: rc };
}

const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));

const GEN = {
  // Honed travertine, 1.6 m square texture = two slabs 0.8 x 1.6 (vein bands run along u)
  travertine(N = 1024) {
    const n = makeNoise(11), m = makeNoise(29), r = rand(5);
    const tones = Array.from({ length: 4 }, () => (r() - 0.5) * 14);
    return bake(N, N, (u, v, o) => {
      const slab = v < 0.5 ? 0 : 1, col = u < 0.5 ? 0 : 1;
      const band = fbm(n, u + slab * 0.37, v, 3, 24, 5);
      const pore = m(u * 160, v * 90, 160, 90);
      const pit = pore > 0.86 ? (pore - 0.86) * 6 : 0;
      const t = tones[slab * 2 + col] + (band - 0.5) * 34;
      const jx = Math.min(u, 1 - u, Math.abs(u - 0.5)) * 1.6, jz = Math.min(v, 1 - v, Math.abs(v - 0.5)) * 1.6;
      const joint = Math.min(jx, jz) < 0.0018 ? 1 : 0;
      o.r = clamp(214 + t - pit * 70 - joint * 50); o.g = clamp(197 + t * 0.95 - pit * 70 - joint * 50); o.b = clamp(172 + t * 0.85 - pit * 60 - joint * 46);
      o.h = 0.6 - pit * 0.5 - joint * 0.4 + (band - 0.5) * 0.05;
      o.rough = 0.42 + pit * 0.4 + (band - 0.5) * 0.08;
    });
  },
  // Warm lime plaster, 3 m texture
  plaster(N = 1024) {
    const n = makeNoise(3), m = makeNoise(77);
    return bake(N, N, (u, v, o) => {
      const big = fbm(n, u, v, 4, 4, 5), fine = m(u * 300, v * 300, 300, 300);
      const t = (big - 0.5) * 12 + (fine - 0.5) * 4;
      o.r = clamp(236 + t); o.g = clamp(230 + t); o.b = clamp(220 + t * 0.9);
      o.h = 0.5 + (fine - 0.5) * 0.35 + (big - 0.5) * 0.2; o.rough = 0.88 + (fine - 0.5) * 0.08;
    });
  },
  // Wide-plank natural oak, 2.4 m texture, 10 planks of 0.24 m, boards run along v
  oak(N = 1024, dark = false) {
    const n = makeNoise(dark ? 41 : 17), m = makeNoise(dark ? 43 : 19), r = rand(dark ? 8 : 9);
    const planks = Array.from({ length: 10 }, () => ({ off: r(), tone: (r() - 0.5) * 18, seed: r() * 50 }));
    return bake(N, N, (u, v, o) => {
      const pi = Math.min(9, Math.floor(u * 10)), pl = planks[pi];
      const pu = u * 10 - pi;
      const vv = (v + pl.off) % 1;
      const grain = fbm(n, u + pl.seed, vv, 64, 3, 4);
      const ring = Math.sin((grain * 9 + pu * 2.0) * Math.PI * 2) * 0.5 + 0.5;
      const fleck = m(u * 400, vv * 40, 400, 40);
      const edge = (pu < 0.012 || pu > 0.988 || Math.abs(vv - 0.5) < 0.0015) ? 1 : 0;
      const t = pl.tone + (ring - 0.5) * 16 + (fleck - 0.5) * 10;
      if (dark) { o.r = clamp(92 + t * 0.8 - edge * 40); o.g = clamp(62 + t * 0.6 - edge * 30); o.b = clamp(44 + t * 0.45 - edge * 24); }
      else { o.r = clamp(190 + t - edge * 60); o.g = clamp(153 + t * 0.85 - edge * 55); o.b = clamp(112 + t * 0.7 - edge * 45); }
      o.h = 0.55 + (ring - 0.5) * 0.08 - edge * 0.5; o.rough = 0.58 + (fleck - 0.5) * 0.1 + edge * 0.2;
    });
  },
  walnut(N = 512) { return GEN.oak(N, true); },
  // Natural linen weave, 0.5 m texture
  linen(N = 512) {
    const n = makeNoise(51), r = rand(13); const slubs = makeNoise(53);
    return bake(N, N, (u, v, o) => {
      const wx = Math.sin(u * Math.PI * 2 * 160) * 0.5 + 0.5, wy = Math.sin(v * Math.PI * 2 * 160) * 0.5 + 0.5;
      const w = (Math.floor(u * 160) + Math.floor(v * 160)) % 2 ? wx : wy;
      const sl = slubs(u * 12, v * 200, 12, 200);
      const t = (w - 0.5) * 12 + (fbm(n, u, v, 6, 6, 3) - 0.5) * 10 + (sl > 0.8 ? 10 : 0);
      o.r = clamp(212 + t); o.g = clamp(204 + t); o.b = clamp(190 + t * 0.9);
      o.h = 0.4 + w * 0.3; o.rough = 0.95;
    });
  },
  // Hand-knotted wool rug, 1 m texture
  wool(N = 512) {
    const n = makeNoise(61), m = makeNoise(62);
    return bake(N, N, (u, v, o) => {
      const t = (fbm(n, u, v, 8, 8, 4) - 0.5) * 18 + (m(u * 220, v * 220, 220, 220) - 0.5) * 14;
      o.r = clamp(200 + t); o.g = clamp(190 + t); o.b = clamp(172 + t * 0.9);
      o.h = 0.5 + (t / 40); o.rough = 1.0;
    });
  },
  // Limestone paving, 2.4 m texture, slabs 1.2 x 0.6 running bond
  limestone(N = 1024) {
    const n = makeNoise(71), m = makeNoise(72), r = rand(21);
    const tones = Array.from({ length: 16 }, () => (r() - 0.5) * 12);
    return bake(N, N, (u, v, o) => {
      const row = Math.floor(v * 4), shift = (row % 2) * 0.25;
      const uu = (u + shift) % 1, col = Math.floor(uu * 2);
      const ju = Math.min(uu * 2 - col, 1 - (uu * 2 - col)) * 1.2, jv = Math.min(v * 4 - row, 1 - (v * 4 - row)) * 0.6;
      const joint = Math.min(ju, jv) < 0.004 ? 1 : 0;
      const t = tones[row * 2 + col] + (fbm(n, u, v, 6, 6, 4) - 0.5) * 16 + (m(u * 200, v * 200, 200, 200) - 0.5) * 8;
      o.r = clamp(206 + t - joint * 60); o.g = clamp(199 + t - joint * 60); o.b = clamp(184 + t - joint * 55);
      o.h = 0.55 - joint * 0.5; o.rough = 0.75;
    });
  },
  gravel(N = 512) {
    const n = makeNoise(81), m = makeNoise(82);
    return bake(N, N, (u, v, o) => {
      const s = m(u * 140, v * 140, 140, 140), q = n(u * 60, v * 60, 60, 60);
      const t = (s - 0.5) * 50 + (q - 0.5) * 20;
      o.r = clamp(186 + t); o.g = clamp(178 + t); o.b = clamp(164 + t);
      o.h = s; o.rough = 0.95;
    });
  },
  lawn(N = 512) {
    const n = makeNoise(91), m = makeNoise(92);
    return bake(N, N, (u, v, o) => {
      const b = fbm(n, u, v, 6, 6, 4), s = m(u * 260, v * 260, 260, 260);
      const t = (b - 0.5) * 30 + (s - 0.5) * 34;
      o.r = clamp(88 + t * 0.7); o.g = clamp(106 + t); o.b = clamp(58 + t * 0.4);
      o.h = s; o.rough = 0.95;
    });
  },
  basalt(N = 512) {
    const n = makeNoise(101), m = makeNoise(102);
    return bake(N, N, (u, v, o) => {
      const t = (fbm(n, u, v, 5, 5, 5) - 0.5) * 16 + (m(u * 300, v * 300, 300, 300) - 0.5) * 10;
      o.r = clamp(60 + t); o.g = clamp(57 + t); o.b = clamp(54 + t);
      o.h = 0.5 + t / 60; o.rough = 0.55;
    });
  },
};

// An abstract canvas painting for the gallery wall (original, generated here).
export function paintingTexture() {
  const W = 1440, H = 880, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); const r = rand(1234);
  g.fillStyle = '#ebe4d6'; g.fillRect(0, 0, W, H);
  // calm colour fields with soft, hand-made edges
  const field = (x, y, w, h, col, a) => {
    g.save(); g.filter = 'blur(6px)'; g.globalAlpha = a; g.fillStyle = col;
    g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i <= 20; i++) g.lineTo(x + w * i / 20, y + (r() - 0.5) * 10);
    for (let i = 0; i <= 12; i++) g.lineTo(x + w + (r() - 0.5) * 10, y + h * i / 12);
    for (let i = 20; i >= 0; i--) g.lineTo(x + w * i / 20, y + h + (r() - 0.5) * 10);
    for (let i = 12; i >= 0; i--) g.lineTo(x + (r() - 0.5) * 10, y + h * i / 12);
    g.fill(); g.restore();
  };
  field(90, 80, 760, 470, '#b8743e', 0.92);
  field(120, 110, 700, 410, '#c4864d', 0.55);
  field(90, 600, 760, 200, '#d9c3a0', 0.9);
  field(920, 80, 430, 720, '#2c2925', 0.94);
  field(950, 110, 370, 660, '#3a352f', 0.5);
  // canvas weave
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4, w = ((x % 4 < 2) ^ (y % 4 < 2)) ? 5 : -5, n = (r() - 0.5) * 10;
    d[k] += w + n; d[k + 1] += w + n; d[k + 2] += w + n;
  }
  g.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

const cache = {};
let manifest;
async function available(name) {
  manifest ||= fetch('textures/manifest.json').then(r => r.ok ? r.json() : { sets: [] }).catch(() => ({ sets: [] }));
  return (await manifest).sets.includes(name);
}

// Returns { map, bumpMap|normalMap, roughnessMap, tile } for a material set.
export async function textureSet(name, tileMeters, renderer) {
  if (cache[name]) return cache[name];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const prep = (t, srgb) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
    t.repeat.set(1 / tileMeters, 1 / tileMeters);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  let set;
  const base = `textures/${name}/`;
  if (await available(name)) {
    const L = new THREE.TextureLoader();
    const ld = u => new Promise(res => L.load(u, res, undefined, () => res(null)));
    const [map, rough, normal] = await Promise.all([ld(base + 'color.jpg'), ld(base + 'roughness.jpg'), ld(base + 'normal.jpg')]);
    set = { map: prep(map, true), roughnessMap: rough && prep(rough), normalMap: normal && prep(normal), source: 'cc0' };
  } else {
    const gen = GEN[name]();
    set = {
      map: prep(new THREE.CanvasTexture(gen.color), true),
      bumpMap: prep(new THREE.CanvasTexture(gen.height)),
      roughnessMap: prep(new THREE.CanvasTexture(gen.rough)),
      source: 'generated',
    };
  }
  cache[name] = set;
  return set;
}

// Leaf cluster for tree cards: olive-like lanceolate leaves on a transparent background (generated here).
export function leafTexture() {
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'); const r = rand(77);
  g.clearRect(0, 0, N, N);
  // a few twigs
  g.strokeStyle = 'rgba(70,58,44,1)'; g.lineWidth = 3;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(N / 2, N / 2); g.lineTo(N / 2 + (r() - 0.5) * N * 0.8, N / 2 + (r() - 0.5) * N * 0.8); g.stroke(); }
  for (let i = 0; i < 150; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * N * 0.4;
    const x = N / 2 + Math.cos(a) * d, y = N / 2 + Math.sin(a) * d;
    const L = 26 + r() * 22, W = 5 + r() * 4, rot = r() * Math.PI;
    const l = 30 + r() * 40, sat = 18 + r() * 22, hue = 70 + r() * 25;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = `hsl(${hue},${sat}%,${l}%)`;
    g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `hsla(${hue},${sat}%,${l + 12}%,0.6)`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Gentle ripples for still water: tileable normal map built from periodic noise.
export function waterNormal() {
  const N = 512, n = makeNoise(303), m = makeNoise(304);
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    H[y * N + x] = fbm(n, u, v, 6, 6, 4) * 0.7 + fbm(m, u, v, 20, 14, 3) * 0.3;
  }
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), id = g.createImageData(N, N), s = 6.0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const hx = H[y * N + (x + 1) % N] - H[y * N + (x + N - 1) % N];
    const hy = H[((y + 1) % N) * N + x] - H[((y + N - 1) % N) * N + x];
    let nx = -hx * s, ny = -hy * s, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (y * N + x) * 4;
    id.data[k] = (nx * 0.5 + 0.5) * 255; id.data[k + 1] = (ny * 0.5 + 0.5) * 255; id.data[k + 2] = (nz * 0.5 + 0.5) * 255; id.data[k + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 3, 1 / 3); return t;
}
