import * as THREE from 'three';
// ---- procedural texture helpers (no external image files) ----
export function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h, c);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function rng(seed = 1) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
// speckle / grain overlay on a 2d context
export function grain(g, w, h, amount = 0.08, seed = 7, size = 1) {
  const r = rng(seed); const n = (w * h) / (size * size) * 0.5;
  for (let i = 0; i < n; i++) { const v = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${r() * amount})`; g.fillRect(r() * w, r() * h, size, size); }
}
// soft blotchy tonal variation
export function blotches(g, w, h, count = 60, alpha = 0.05, seed = 3, rad = [20, 120]) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) { const x = r() * w, y = r() * h, R = rad[0] + r() * (rad[1] - rad[0]); const v = r() < 0.5 ? 0 : 255;
    const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(${v},${v},${v},${alpha})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); }
}
// build a tangent-space normal map from a greyscale height canvas
export function normalFromHeight(src, strength = 2, opts = {}) {
  const w = src.width, h = src.height; const sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  return canvasTex(w, h, (g) => { const im = g.createImageData(w, h); const H = (x, y) => sd[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; im.data[i] = (-dx / l * .5 + .5) * 255; im.data[i + 1] = (dy / l * .5 + .5) * 255; im.data[i + 2] = (1 / l * .5 + .5) * 255; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); }, { srgb: false, ...opts });
}
// box with UVs in metres (so a texture with repeat 1/tileSize tiles correctly)
export function boxM(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d); const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    if (ax > .5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > .5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i)); }
  return geo;
}
// vertical wall panel (in a plane) with rectangular or polygonal holes, UVs in metres.
// outline & holes: arrays of [u,v] in metres (u along wall, v up). Returns ShapeGeometry in XY plane (extrude depth optional).
export function wallWithHoles(outline, holes = [], depth = 0) {
  const s = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v)));
  for (const hpts of holes) s.holes.push(new THREE.Path(hpts.map(([u, v]) => new THREE.Vector2(u, v))));
  return depth > 0 ? new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }) : new THREE.ShapeGeometry(s);
}
export const std = (o) => new THREE.MeshStandardMaterial(o);

// ONE STONE for the whole mosque, inside and out (client, 17 Nov): smooth honed limestone, warm beige,
// large panels 1.28 x 0.64 m in running bond with fine tight joints. UVs are metres; joints fall every 0.64 m from v = 0.
export function honedLimestone(seed = 29) {
  return canvasTex(512, 512, (g, w, h) => { const r = rng(seed); g.fillStyle = 'rgb(168,148,116)'; g.fillRect(0, 0, w, h); const ph = h / 4, pw = w / 2;
    for (let j = 0; j < 4; j++) for (let i = -1; i < 2; i++) { const v = 0.975 + r() * 0.05; g.fillStyle = `rgb(${222 * v | 0},${200 * v | 0},${160 * v | 0})`; g.fillRect(i * pw + (j % 2) * pw / 2 + 1, j * ph + 1, pw - 1.5, ph - 1.5); }
    blotches(g, w, h, 70, 0.022, seed + 1, [30, 140]); grain(g, w, h, 0.035, seed + 2, 1); }, { repeat: [1 / 2.56, 1 / 2.56] });
}
