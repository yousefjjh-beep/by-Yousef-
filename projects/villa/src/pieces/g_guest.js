// Piece: g_guest — Ground floor: guest bedroom + en-suite, lobby, guest hall, 2 WCs, guest dining,
// private saloon, main saloon, void over the basement men patio, slabs/roof above.
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'Guest Hall', level: 'G', x: 33.3, z: 37.8, yaw: 0 },
  { name: 'Main Saloon', level: 'G', x: 41.5, z: 37.4, yaw: -Math.PI / 2 },
  { name: 'Guest Dining', level: 'G', x: 39.0, z: 32.6, yaw: 0 },
  { name: 'Private Saloon', level: 'G', x: 27.5, z: 37.0, yaw: Math.PI / 2 },
  { name: 'Guest Bedroom', level: 'G', x: 29.5, z: 27.8, yaw: 0 },
];
export const views = [
  { name: 'main saloon from hall door', level: 'G', x: 37.5, z: 35.2, yaw: -112, pitch: -10, fov: 70 },
  { name: 'guest dining from SE', level: 'G', x: 44.2, z: 33.2, yaw: 28, pitch: -9, fov: 70 },
  { name: 'guest bedroom', level: 'G', x: 31.3, z: 28.2, yaw: 40, pitch: -10, fov: 70 },
  { name: 'private saloon', level: 'G', x: 29.4, z: 35.1, yaw: 112, pitch: -12, fov: 70 },
];

const CEIL = 3.8, SLAB = 4.18, DOORH = 2.7, WINTOP = 2.85;

export function build(ctx) {
  const { box, boxC, rect, place } = ctx;
  const PI = Math.PI;

  // ---------------- materials ----------------
  const plaster = M.plaster();
  const ext = M.extStone();
  // fine, low-contrast cream marble; fully wrapped (seamless) and mapped in world space by wfloor()
  const marble = mat({ color: '#ffffff', map: tex.custom('g_guest_cream3', (g, n) => {
    g.fillStyle = '#c4b08d'; g.fillRect(0, 0, n, n);
    let s = 91; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const wrap = (f) => { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { g.save(); g.translate(dx, dy); f(); g.restore(); } };
    for (let i = 0; i < 260; i++) { const x = R() * n, y = R() * n, r = 12 + R() * 40; const c = R() < 0.5 ? '208,192,160' : '184,166,134'; wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},0.22)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }); }
    for (let v = 0; v < 5; v++) { const pts = []; let x = R() * n, y = R() * n; const a = R() * 6.28; for (let k = 0; k < 14; k++) { pts.push([x, y]); x += Math.cos(a) * 22 + (R() - 0.5) * 18; y += Math.sin(a) * 22 + (R() - 0.5) * 18; } const lw = 0.5 + R() * 0.8;
      wrap(() => { g.strokeStyle = 'rgba(170,150,115,0.14)'; g.lineWidth = lw; g.beginPath(); pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); }); }
    for (let i = 0; i < 2500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(212,198,168,0.18)' : 'rgba(176,158,124,0.12)'; g.fillRect(R() * n, R() * n, 1.5, 1.5); }
  }), tile: 1.6, rough: 0.3 });
  // floor rect with world-space UVs (no seams between adjacent rects)
  function wfloor(x0, z0, x1, z1, y, m) {
    const T = m.userData.tile || 1, geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + cx) / T, -(pos.getZ(i) + cz) / T);
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(cx, y, cz); mesh.receiveShadow = true;
    return ctx.add(mesh, { walk: true, cast: false });
  }
  const floorTile = mat({ color: '#ffffff', map: tex.tiles('#cdcfd2', '#8a8c90', 10, 0.02, 33), tile: 2.4, rough: 0.3 });
  const wallTile = mat({ color: '#ffffff', map: tex.tiles('#f3f1ec', '#d2cdc5', 4, 0.02, 34), tile: 1.2, rough: 0.35 });
  const slabM = mat({ color: '#cfc9bf', rough: 0.9 });
  const ceilM = M.ceiling();
  const roofM = mat({ color: '#ffffff', map: tex.tiles('#cfcac1', '#a9a49b', 4, 0.04, 35), tile: 2.4, rough: 0.9 });
  const doorC = '#7c423c';
  const leafM = mat({ color: doorC, rough: 0.45 });
  const caseM = mat({ color: '#5a3424', map: tex.wood('#5a3424', 2, 36), tile: 1, rough: 0.45 });
  const blueM = mat({ color: '#0b86c8', rough: 0.7 }); const darkGlM = mat({ color: '#3d4247', rough: 0.5 });
  const skirtM = mat({ color: '#c9b48e', rough: 0.4 });
  const coveLight = mat({ color: '#fff4dc', emissive: '#ffe7bd', emissiveIntensity: 0.9, key: 'g_guest_cove' });
  const curtainM = mat({ color: '#efe6d4', map: tex.carpet('#efe6d4', 37), tile: 0.5, rough: 1 });

  // ---------------- wall helpers ----------------
  // horizontal wall at z from x0 to x1. n/s = north/south face materials. ops: [{a,b,y0,h,glass,door,...}] absolute x
  const toOps = (start, ops) => ops.map((o) => ({ at: (o.a + o.b) / 2 - start, w: o.b - o.a, y0: o.y0 ?? 0, h: o.h ?? (o.glass ? WINTOP - (o.y0 ?? 0) : DOORH), glass: !!o.glass }));
  function hw(z, x0, x1, o = {}) {
    const { t = 0.18, n = plaster, s = plaster, ops = [], y0 = 0, h = CEIL } = o;
    ctx.wall(x0, z, x1, z, { t, mA: s, mB: n, y0, h: h - y0, openings: toOps(x0, ops).map((p) => ({ ...p, y0: p.y0 - y0 })) });
    ops.forEach((p) => { if (p.glass) glassBead('h', z, p.a, p.b, p.y0 ?? 0, t, p.dark); else casing('h', z, p.a, p.b, t); });
  }
  function vw(x, z0, z1, o = {}) {
    const { t = 0.18, w = plaster, e = plaster, ops = [], y0 = 0, h = CEIL } = o;
    ctx.wall(x, z0, x, z1, { t, mA: w, mB: e, y0, h: h - y0, openings: toOps(z0, ops).map((p) => ({ ...p, y0: p.y0 - y0 })) });
    ops.forEach((p) => { if (p.glass) glassBead('v', x, p.a, p.b, p.y0 ?? 0, t, p.dark); else casing('v', x, p.a, p.b, t); });
  }
  // blue glazing line (plan colour) on the sill + frame
  function glassBead(dir, c, a, b, y, t, dark = false) {
    const m = dark ? darkGlM : blueM, h = t / 2 + 0.01;
    if (dir === 'h') box(a, y, c - h, b, y + 0.04, c + h, m); else box(c - h, y, a, c + h, y + 0.04, b, m);
  }
  // door casing: jamb posts + head on both faces
  function casing(dir, c, a, b, t) {
    const T = t / 2 + 0.025, pw = 0.07;
    if (dir === 'h') { box(a - pw, 0, c - T, a, DOORH + 0.07, c + T, caseM); box(b, 0, c - T, b + pw, DOORH + 0.07, c + T, caseM); box(a, DOORH, c - T, b, DOORH + 0.07, c + T, caseM); }
    else { box(c - T, 0, a - pw, c + T, DOORH + 0.07, a, caseM); box(c - T, 0, b, c + T, DOORH + 0.07, b + pw, caseM); box(c - T, DOORH, a, c + T, DOORH + 0.07, b, caseM); }
  }
  // hinged door leaf: hinge (hx,hz), closing direction (ux,uz), opens toward side (sx,sz)
  const sillM = mat({ color: '#8f463f', rough: 0.5 });
  const openLeafM = mat({ color: '#5c4a43', rough: 0.5 });
  function hdoor(hx, hz, ux, uz, w, sx, sz, open = 0.78, ajar = true) {
    if (!ajar) open = 0;
    // red-brown threshold strip filling the opening (plan draws the doorway in red)
    const ex = hx + ux * w, ez = hz + uz * w, T = 0.07;
    box(Math.min(hx, ex) - (ux ? 0 : T), 0, Math.min(hz, ez) - (uz ? 0 : T), Math.max(hx, ex) + (ux ? 0 : T), 0.015, Math.max(hz, ez) + (uz ? 0 : T), sillM);
    const th0 = Math.atan2(-uz, ux); let swing = 1;
    const th = th0 + open; if (Math.cos(th) * sx + -Math.sin(th) * sz < 0) swing = -1;
    const piv = new THREE.Group(); piv.position.set(hx, 0, hz); piv.rotation.y = th0 + swing * open;
    const lm = open ? openLeafM : leafM;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, DOORH - 0.02, 0.06), lm); leaf.position.set((w - 0.04) / 2 + 0.02, (DOORH - 0.02) / 2 + 0.01, 0); piv.add(leaf);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, DOORH - 0.02, 0.07), leafM); edge.position.set(w - 0.045, (DOORH - 0.02) / 2 + 0.01, 0); piv.add(edge);
    [-1, 1].forEach((k) => { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), M.steel()); hd.position.set(w - 0.15, 1.05, k * 0.05); piv.add(hd); });
    ctx.add(piv);
  }
  // sliding (pocket) leaf, partly open: leaf lies in the wall plane
  function slideLeaf(dir, c, a, b) {
    if (dir === 'h') box(a, 0.01, c - 0.05, b, DOORH - 0.02, c + 0.05, leafM); else box(c - 0.05, 0.01, a, c + 0.05, DOORH - 0.02, b, leafM);
  }
  // curtains stacked at the sides of a big window
  function curtains(dir, c, a, b, inward) {
    const off = c + inward * 0.16;
    if (dir === 'h') box(a - 0.1, 2.9, off - 0.06, b + 0.1, 3.05, off + 0.06, curtainM); else box(off - 0.06, 2.9, a - 0.1, off + 0.06, 3.05, b + 0.1, curtainM);
  }

  // ---------------- floors ----------------
  [[27.0, 23.85, 31.72, 28.69], [31.72, 23.85, 33.87, 25.85], [33.87, 23.85, 44.8, 33.8], [28.75, 28.69, 33.87, 33.8],
    [24.1, 33.8, 46.75, 39.1], [35.8, 39.1, 46.75, 40.75]].forEach(([a, b, c, d]) => wfloor(a, b, c, d, L.G + 0.003, marble));
  rect(31.72, 25.85, 33.87, 28.69, L.G, floorTile); // en-suite
  rect(27.0, 28.69, 28.75, 33.8, L.G, floorTile); // WC
  // slab on grade where nothing is below (east of the men saloon, and everything south of z 33.8)
  box(40.5, -0.32, 23.78, 44.96, -0.02, 33.8, slabM);
  box(23.93, -0.32, 33.8, 35.7, -0.02, 39.225, slabM); box(35.7, -0.32, 33.8, 46.93, -0.02, 40.95, slabM);

  // ---------------- walls ----------------
  // shared north wall (my half, toward my rooms) with doors to the service wing
  hw(23.83, 27.0, 44.96, { t: 0.1, ops: [{ a: 36.5, b: 37.55 }, { a: 38.95, b: 40.1 }] });
  hdoor(37.55, 23.85, -1, 0, 1.05, 0, 1); // lobby north door, hinge east, swings into lobby
  hdoor(40.1, 23.85, -1, 0, 1.15, 0, 1); // dining north door
  // guest bedroom west (exterior to the void) with window
  vw(27.03, 23.78, 28.76, { t: 0.22, w: ext, e: plaster, y0: -0.42, h: SLAB, ops: [{ a: 25.25, b: 27.25, y0: 0.45, glass: true }] });
  curtains('v', 27.03, 25.25, 27.25, 1);
  // WC west (exterior to the void) with window
  vw(27.03, 28.76, 33.9, { t: 0.22, w: ext, e: wallTile, y0: -0.42, h: SLAB, ops: [{ a: 30.35, b: 32.1, y0: 1.1, glass: true }] });
  // bedroom / lobby partition with door
  vw(33.87, 23.88, 25.85, { w: plaster, e: plaster, ops: [{ a: 23.98, b: 25.05 }] });
  hdoor(33.87, 23.98, 0, 1, 1.07, -1, 0);
  vw(33.87, 25.85, 28.62, { w: wallTile, e: plaster });
  // en-suite
  vw(31.72, 25.35, 28.62, { w: plaster, e: wallTile });
  hw(25.85, 31.79, 33.8, { t: 0.12, n: plaster, s: wallTile, ops: [{ a: 32.02, b: 32.88 }] });
  hdoor(32.02, 25.85, 1, 0, 0.86, 0, 1);
  // long wall z 28.69: bedroom/en-suite south, WC/hall north, lobby south (door to alcove)
  hw(28.69, 27.14, 37.68, { ops: [{ a: 36.5, b: 37.55 }] });
  hdoor(37.55, 28.69, -1, 0, 1.05, 0, -1);
  // WC / powder partition with pocket door
  vw(28.75, 28.76, 33.7, { t: 0.12, w: wallTile, e: plaster, ops: [{ a: 31.05, b: 32.7 }] });
  slideLeaf('v', 28.75, 31.05, 32.7);
  // x 30.73: powder + private saloon east wall / hall west wall
  vw(30.73, 28.76, 38.98, { ops: [{ a: 30.35, b: 32.1 }, { a: 34.05, b: 35.45 }] });
  slideLeaf('v', 30.73, 30.35, 32.1);
  hdoor(30.73, 34.05, 0, 1, 1.4, -1, 0); // into private saloon
  // x 35.8: hall east (alcove opening) + main saloon west
  vw(35.8, 28.76, 30.25, { t: 0.2 });
  vw(35.8, 32.25, 39.0, { t: 0.2, ops: [{ a: 34.05, b: 35.5 }] });
  hdoor(35.8, 34.05, 0, 1, 1.45, 1, 0); // into main saloon
  vw(35.8, 39.0, 40.95, { t: 0.2, w: ext, e: plaster, h: SLAB });
  // dining west wall with double door from the alcove
  vw(37.75, 23.88, 33.7, { ops: [{ a: 30.3, b: 32.2 }] });
  hdoor(37.75, 30.3, 0, 1, 0.95, 1, 0, 0, false); hdoor(37.75, 32.2, 0, -1, 0.95, 1, 0, 0, false);
  // dining east (exterior)
  vw(44.85, 23.78, 33.9, { t: 0.22, w: plaster, e: ext, h: SLAB });
  // z 33.8: void south / private saloon north (exterior part), WC south, main saloon north
  hw(33.8, 23.93, 27.14, { t: 0.2, n: ext, s: plaster, y0: -0.42, h: SLAB });
  hw(33.8, 27.14, 30.66, { t: 0.2, n: wallTile, s: plaster });
  hw(33.8, 35.9, 44.74, { t: 0.2 });
  hw(33.8, 44.74, 46.93, { t: 0.2, n: ext, s: plaster, h: SLAB });
  // private saloon west (exterior) with glazing
  vw(24.05, 33.7, 39.23, { t: 0.25, w: ext, e: plaster, h: SLAB, ops: [{ a: 34.94, b: 37.94, y0: 0.15, glass: true }] });
  curtains('v', 24.05, 34.94, 37.94, 1);
  // south facade z 39.1: private saloon + hall double entrance door
  hw(39.1, 23.93, 35.7, { t: 0.25, n: plaster, s: ext, h: SLAB, ops: [{ a: 32.3, b: 34.3 }] });
  hdoor(32.3, 39.1, 1, 0, 1.0, 0, -1, 0.95); hdoor(34.3, 39.1, -1, 0, 1.0, 0, -1, 0.95);
  // main saloon south (glazing) + east
  hw(40.82, 35.7, 46.93, { t: 0.25, n: plaster, s: ext, h: SLAB, ops: [{ a: 37.5, b: 39.5, y0: 0.1, glass: true }, { a: 40.4, b: 42.4, y0: 0.1, glass: true }, { a: 43.4, b: 45.4, y0: 0.1, glass: true, dark: true }] });
  curtains('h', 40.82, 37.5, 39.45, -1); curtains('h', 40.82, 40.45, 42.4, -1); curtains('h', 40.82, 43.4, 45.3, -1);
  vw(46.8, 33.7, 40.95, { t: 0.25, w: plaster, e: ext, h: SLAB, ops: [{ a: 35.8, b: 36.8, y0: 0.9, glass: true, dark: true }, { a: 38.0, b: 39.5, y0: 0.9, glass: true, dark: true }] });

  // ---------------- void over the basement men patio (x 24-27, z 23.8-33.8): open, guarded ----------------
  const curb = mat({ color: '#bdb8b0', rough: 0.8 });
  box(23.93, -0.42, 23.78, 24.13, 0.12, 33.7, curb); // west curb
  box(24.13, -0.42, 23.78, 26.92, 0.12, 23.93, curb); // north curb
  [[24.03, 23.85, 24.03, 33.7], [24.13, 23.86, 26.92, 23.86]].forEach(([x0, z0, x1, z1]) => {
    const w = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = x0 === x1 ? PI / 2 : 0;
    boxC(cx, 0.12 + 0.5, cz, w, 1.0, 0.02, M.glass(), ry, { collide: true });
    boxC(cx, 1.15, cz, w, 0.05, 0.06, M.steel(), ry);
  });

  // ---------------- slab above (3.8-4.18), ceilings, coves, lights ----------------
  box(23.93, CEIL, 23.78, 46.93, SLAB, 33.8, slabM); // incl. the void (first-floor bedroom two / terrace above) and the canopy east of dining
  box(23.93, CEIL, 33.8, 46.93, SLAB, 40.95, slabM);
  rect(23.93, 23.78, 46.93, 40.95, CEIL - 0.005, ceilM, { up: false });
  // roof over the single-storey part of the main saloon (nothing above on the first floor)
  rect(42.5, 33.8, 46.93, 40.95, SLAB + 0.003, roofM);
  box(46.68, SLAB, 33.8, 46.93, SLAB + 0.85, 40.95, ext); // east parapet
  box(35.7, SLAB, 40.7, 46.68, SLAB + 0.85, 40.95, ext); // south parapet (terrace guard / roof)
  box(42.5, SLAB, 33.8, 46.68, SLAB + 0.85, 33.95, ext); // north edge upstand
  box(35.7, SLAB, 39.0, 35.9, SLAB + 0.85, 40.7, ext);
  // coffered cove + downlights per room
  function cove(x0, z0, x1, z1, b = 0.45, nx = 0, nz = 0) {
    const y0 = CEIL - 0.3;
    box(x0, y0, z0, x1, CEIL, z0 + b, ceilM); box(x0, y0, z1 - b, x1, CEIL, z1, ceilM);
    box(x0, y0, z0 + b, x0 + b, CEIL, z1 - b, ceilM); box(x1 - b, y0, z0 + b, x1, CEIL, z1 - b, ceilM);
    // hidden LED strip on the inner lip
    box(x0 + b, y0 + 0.02, z0 + b, x1 - b, y0 + 0.05, z0 + b + 0.03, coveLight); box(x0 + b, y0 + 0.02, z1 - b - 0.03, x1 - b, y0 + 0.05, z1 - b, coveLight);
    box(x0 + b, y0 + 0.02, z0 + b, x0 + b + 0.03, y0 + 0.05, z1 - b, coveLight); box(x1 - b - 0.03, y0 + 0.02, z0 + b, x1 - b, y0 + 0.05, z1 - b, coveLight);
    for (let i = 0; i < nx; i++) { const x = x0 + b / 2 + (i + 0.5) * (x1 - x0 - b) / nx; ctx.downlight(x, z0 + b / 2, y0); ctx.downlight(x, z1 - b / 2, y0); }
    for (let j = 0; j < nz; j++) { const z = z0 + b / 2 + (j + 0.5) * (z1 - z0 - b) / nz; ctx.downlight(x0 + b / 2, z, y0); ctx.downlight(x1 - b / 2, z, y0); }
  }
  cove(27.14, 23.88, 31.65, 28.61, 0.45, 4, 4);
  cove(37.85, 23.88, 44.73, 33.7, 0.5, 5, 8);
  cove(35.92, 33.9, 46.67, 40.69, 0.55, 8, 5);
  cove(24.18, 33.9, 30.65, 38.97, 0.45, 5, 4);
  cove(30.83, 28.77, 35.69, 38.97, 0.45, 3, 7);
  // chandelier-free hall / lobby / wet rooms: downlights
  [[35.8, 25.0], [35.8, 27.0], [32.8, 24.8], [32.8, 26.8], [32.8, 27.8], [27.9, 30.0], [27.9, 32.4], [29.7, 30.0], [29.7, 32.4], [36.7, 30.0], [36.7, 32.5]].forEach(([x, z]) => ctx.downlight(x, z, CEIL));
  // pendant over the dining table: long linear light (above the plan cut)
  box(41.15, 2.75, 26.6, 41.45, 2.85, 30.7, mat({ color: '#2f2a26', rough: 0.4, metal: 0.6 }));
  box(41.18, 2.74, 26.65, 41.42, 2.75, 30.65, M.lightPanel());
  // skirting along main room walls (low; follows the inner faces)
  const skirt = (x0, z0, x1, z1) => box(x0, 0, z0, x1, 0.1, z1, skirtM);
  skirt(37.83, 23.88, 44.73, 23.9); skirt(44.72, 23.88, 44.74, 33.7); skirt(37.83, 33.68, 44.73, 33.7);
  skirt(35.9, 40.68, 46.67, 40.7); skirt(46.66, 33.9, 46.68, 40.69); skirt(35.92, 33.9, 46.67, 33.92);

  // soft contact shadow band along walls (plan reads with soft drop shadows)
  function aoBand(x0, z0, x1, z1, w = 0.35, a = 0.22) {
    const ppm = 30, cw = Math.max(8, Math.round((x1 - x0) * ppm)), chh = Math.max(8, Math.round((z1 - z0) * ppm)), e = w * ppm;
    const c = document.createElement('canvas'); c.width = cw; c.height = chh; const g = c.getContext('2d');
    const side = (x, y, ww, hh, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, `rgba(70,50,30,${a})`); gr.addColorStop(1, 'rgba(70,50,30,0)'); g.fillStyle = gr; g.fillRect(x, y, ww, hh); };
    side(0, 0, cw, e, 0, 0, 0, e); side(0, chh - e, cw, e, 0, chh, 0, chh - e); side(0, 0, e, chh, 0, 0, e, 0); side(cw - e, 0, e, chh, cw, 0, cw - e, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.position.set((x0 + x1) / 2, 0.006, (z0 + z1) / 2); m.renderOrder = 1; ctx.add(m);
  }
  [[27.14, 23.88, 33.78, 28.6], [33.96, 23.88, 37.66, 28.6], [37.84, 23.88, 44.74, 33.7], [30.82, 28.78, 35.7, 39.0], [35.9, 28.78, 37.66, 33.7],
    [24.18, 33.9, 30.64, 38.98], [35.9, 33.9, 46.68, 40.7]].forEach((r) => aoBand(...r));

  // ---------------- furniture helpers ----------------
  // shag rug: one canvas per rug, fur strokes + ragged alpha edge, optional darker inner square
  let rugN = 0;
  function rug(x0, z0, x1, z1, base, seed, inner = null, y = 0.012) {
    const W = x1 - x0, D = z1 - z0, ppm = 150, cw = Math.round(W * ppm), chh = Math.round(D * ppm);
    const c = document.createElement('canvas'); c.width = cw; c.height = chh; const g = c.getContext('2d');
    let st = seed * 7919 + 13; const R = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
    const m = 10; const col = new THREE.Color(base);
    const fur = (bx0, by0, bx1, by1, cc, n, edge) => {
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const k = 0.6 + R() * 0.75; g.strokeStyle = '#' + cc.clone().multiplyScalar(k).getHexString();
        g.lineWidth = 1.5 + R() * 2.5;
        let x, y, a;
        if (edge) { const side = (R() * 4) | 0, t = R(); if (side === 0) { x = bx0 + t * (bx1 - bx0); y = by0 + 2; a = -Math.PI / 2; } else if (side === 1) { x = bx0 + t * (bx1 - bx0); y = by1 - 2; a = Math.PI / 2; } else if (side === 2) { x = bx0 + 2; y = by0 + t * (by1 - by0); a = Math.PI; } else { x = bx1 - 2; y = by0 + t * (by1 - by0); a = 0; } a += (R() - 0.5) * 1.6; }
        else { x = bx0 + R() * (bx1 - bx0); y = by0 + R() * (by1 - by0); a = R() * 6.283; }
        const l = edge ? 3 + R() * 9 : 3 + R() * 7;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    };
    g.fillStyle = base; g.fillRect(m, m, cw - 2 * m, chh - 2 * m);
    fur(m, m, cw - m, chh - m, col, Math.round(cw * chh / 9), false);
    fur(m, m, cw - m, chh - m, col, Math.round((cw + chh) * 2.2), true);
    if (inner) { const [ix0, iz0, ix1, iz1, ib] = inner; const ic = new THREE.Color(ib); const a = (ix0 - x0) * ppm, b = (iz0 - z0) * ppm, cc2 = (ix1 - x0) * ppm, d = (iz1 - z0) * ppm; g.fillStyle = ib; g.fillRect(a, b, cc2 - a, d - b); fur(a, b, cc2, d, ic, Math.round((cc2 - a) * (d - b) / 9), false); fur(a, b, cc2, d, ic, Math.round((cc2 - a + d - b) * 1.5), true); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const mm = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 1 });
    const geo = new THREE.PlaneGeometry(W, D); geo.rotateX(-Math.PI / 2);
    const r = new THREE.Mesh(geo, mm); r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); r.receiveShadow = true; r.name = 'g_guest_rug' + (rugN++);
    ctx.add(r); return r;
  }
  // domed side table (grey by default)
  // soft drop shadow quad under small furniture
  const shadowTex = tex.custom('g_guest_softshadow', (g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, n * 0.2, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(60,40,25,0.45)'); gr.addColorStop(1, 'rgba(60,40,25,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128);
  const shadowM = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const dropShadow = (x, z, w, d) => { const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, shadowM); m.position.set(x + 0.06, 0.007, z + 0.06); m.renderOrder = 1; ctx.add(m); };
  // wood drum table
  const roundT = (x, z, r, col = '#b89c78', h = 0.5) => {
    const m = mat({ color: '#ffffff', map: tex.wood(col, 3, 47), tile: 0.6, rough: 0.45 });
    ctx.cyl(x, 0, z, r, h, m, 32); ctx.cyl(x, h, z, r - 0.025, 0.012, mat({ color: col, rough: 0.35 }), 32);
    dropShadow(x, z, r * 2.6, r * 2.6);
  };
  // square side table: darker body + lighter inset top so its edge reads, with drop shadow
  const sqT = (x, z, s, col, h = 0.5) => {
    const m = mat({ color: '#b8a582', rough: 0.4 }), t = mat({ color: col, rough: 0.35 });
    box(x - s / 2, 0, z - s / 2, x + s / 2, h, z + s / 2, m, { collide: true }); box(x - s / 2 + 0.04, h, z - s / 2 + 0.04, x + s / 2 - 0.04, h + 0.012, z + s / 2 - 0.04, t);
    dropShadow(x, z, s * 1.5, s * 1.5);
  };
  // sofa, optionally with scattered pillows at the arms
  const pillowM = F.fabric('#d9d1c3');
  const sofa = (x, z, ry, len, depth, color, cushions, pillows = false) => {
    const g = F.sofa({ len, depth, color, cushions, legs: '#3b2a1f' });
    if (pillows) [-1, 1].forEach((k) => { const p = new THREE.Group(); F.rbx(p, 0.38, 0.13, 0.38, 0.05, 0, 0, 0, pillowM); p.position.set(k * (len / 2 - 0.4), 0.6, -depth / 2 + 0.36); p.rotation.set(-0.5, k * 0.35, 0); g.add(p); });
    place(g, x, 0, z, ry, { collide: true });
  };

  // ---------------- GUEST BEDROOM ----------------
  rug(28.05, 24.9, 30.8, 26.75, '#7a6750', 41);
  place(F.bed({ w: 1.65, l: 1.95, color: '#ece4d3', throwC: '#e4dac6', head: '#7a5f46', headH: 1.3 }), 29.3, 0, 23.88 + 0.14 + 0.975, 0, { collide: true });
  // quilted pattern on the duvet (grid like the plan)
  const quilt = mat({ color: '#ffffff', map: tex.custom('quilt', (g, n) => { g.fillStyle = '#d2d0cc'; g.fillRect(0, 0, n, n); g.strokeStyle = '#a49c8e'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * n / 8, 0); g.lineTo(i * n / 8, n); g.stroke(); g.beginPath(); g.moveTo(0, i * n / 8); g.lineTo(n, i * n / 8); g.stroke(); } }, 256), tile: 0.8, rough: 0.95 });
  box(28.5, 0.56, 24.75, 30.1, 0.6, 25.95, quilt);
  // wall-mounted TV + low console on the south wall facing the bed
  box(28.5, 1.15, 28.57, 30.1, 2.05, 28.61, M.black());

  // ---------------- bathroom fixtures (own builders, read clearly from above) ----------------
  const cream = mat({ color: '#e2d2ac', rough: 0.2 }), creamIn = mat({ color: '#c4b088', rough: 0.2 });
  const porc = mat({ color: '#f4f2ee', rough: 0.15 }), basinIn = mat({ color: '#c9c6c0', rough: 0.15 });
  const cisternM = mat({ color: '#b4b3b0', rough: 0.3 });
  const counterTop = mat({ color: '#d6ccb8', rough: 0.3 }), counterCab = mat({ color: '#c8bca4', rough: 0.5 });
  const woodCab = mat({ color: '#ffffff', map: tex.wood('#6e5640', 3, 46), tile: 0.8, rough: 0.45 });
  // bathtub, axis-aligned box x0..x1, z0..z1, rim 0.09
  function rrShape(w, d, r, sh = new THREE.Shape()) {
    const x = -w / 2, y = -d / 2; sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + d - r); sh.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    sh.lineTo(x + r, y + d); sh.quadraticCurveTo(x, y + d, x, y + d - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); return sh;
  }
  // freestanding roll-top tub centred at (cx,cz), long axis along x
  function tub(cx, cz, L = 1.6, W = 0.72) {
    const g = new THREE.Group();
    const sh = rrShape(L, W, 0.34); sh.holes.push(rrShape(L - 0.16, W - 0.16, 0.27, new THREE.Path()));
    const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 14 }), cream);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    const base = new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(L - 0.12, W - 0.12, 0.29), { depth: 0.12, bevelEnabled: false, curveSegments: 14 }), creamIn);
    base.rotation.x = -Math.PI / 2; base.position.y = 0.12; g.add(base);
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16), M.steel()); drain.position.set(L / 2 - 0.3, 0.245, 0); g.add(drain);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.12, 10), M.steel()); f.position.set(a * (L / 2 - 0.22), 0.06, b * (W / 2 - 0.14)); g.add(f); });
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10), M.steel()); tap.position.set(L / 2 + 0.08, 0.45, 0); g.add(tap);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), M.steel()); sp.position.set(L / 2 - 0.01, 0.89, 0); g.add(sp);
    place(g, cx, 0, cz, 0, { collide: true });
  }
  // WC: (x,z) = centre of the bowl, (dx,dz) = direction it faces
  function wc(x, z, dx, dz) {
    const g = new THREE.Group();
    F.rbx(g, 0.46, 0.75, 0.18, 0.04, 0, 0.375, -0.33, cisternM);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.4, 24), porc); bowl.scale.set(1, 1, 1.35); bowl.position.set(0, 0.2, 0); g.add(bowl);
    const inn = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 24), basinIn); inn.scale.set(1, 1, 1.3); inn.position.set(0, 0.401, 0.02); g.add(inn);
    place(g, x, 0, z, Math.atan2(-dx, -dz) + Math.PI, { collide: true });
  }
  // counter with rectangular sink (beige)
  function counter(x0, z0, x1, z1, sx0, sz0, sx1, sz1) {
    box(x0, 0, z0, x1, 0.8, z1, counterCab, { collide: true }); box(x0 - 0.01, 0.8, z0 - 0.01, x1 + 0.01, 0.84, z1 + 0.01, counterTop);
    box(sx0, 0.84, sz0, sx1, 0.845, sz1, porc); box(sx0 + 0.05, 0.845, sz0 + 0.05, sx1 - 0.05, 0.848, sz1 - 0.05, basinIn);
  }

  // ---------------- EN-SUITE ----------------
  tub(32.72, 28.16, 1.6, 0.72);
  wc(32.25, 27.0, 1, 0);
  // wood vanity with round basin on the east wall
  box(33.25, 0, 25.98, 33.78, 0.82, 27.5, woodCab, { collide: true }); box(33.23, 0.82, 25.96, 33.78, 0.86, 27.52, woodCab);
  ctx.cyl(33.5, 0.86, 26.6, 0.19, 0.08, cream, 28); ctx.cyl(33.5, 0.861, 26.6, 0.13, 0.081, creamIn, 28);
  box(33.73, 0.94, 26.57, 33.77, 1.12, 26.63, M.steel());
  box(33.75, 1.2, 26.1, 33.78, 2.0, 27.3, mat({ color: '#cfd6da', rough: 0.05, metal: 0.9 }));
  box(31.85, 1.0, 26.2, 31.88, 1.03, 26.6, M.steel());

  // ---------------- WC (tiled) + powder room ----------------
  counter(27.25, 28.8, 28.45, 29.38, 27.55, 28.92, 28.15, 29.26);
  wc(27.5, 33.2, 0, -1);
  { const g = new THREE.Group(); F.rbx(g, 0.36, 0.38, 0.52, 0.1, 0, 0.19, 0.03, porc); const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), basinIn); b.position.set(0, 0.385, 0.05); g.add(b); place(g, 28.2, 0, 33.38, PI, { collide: true }); }
  counter(29.2, 28.8, 30.3, 29.38, 29.45, 28.92, 30.05, 29.26);
  counter(29.05, 33.12, 30.25, 33.7, 29.35, 33.24, 29.95, 33.58);

  // ---------------- LOBBY / HALL ----------------

  // ---------------- GUEST DINING ----------------
  {
    const plank = tex.custom('g_guest_planks', (g, n) => {
      let st = 991; const R = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
      const cols = ['#76563f', '#70513c', '#7a5942', '#6c4e3a', '#755640', '#71533d'];
      const bw = n / 6;
      for (let b = 0; b < 6; b++) {
        g.fillStyle = cols[b]; g.fillRect(b * bw, 0, bw, n);
        for (let k = 0; k < 40; k++) { const x = b * bw + R() * bw; g.strokeStyle = R() < 0.5 ? 'rgba(170,135,105,0.3)' : 'rgba(40,24,16,0.35)'; g.lineWidth = 0.6 + R() * 1.6; g.beginPath(); g.moveTo(x, 0); let xx = x; for (let y = 0; y <= n; y += 32) { xx += (R() - 0.5) * 3; g.lineTo(Math.min(Math.max(xx, b * bw + 1), b * bw + bw - 1), y); } g.stroke(); }
        g.fillStyle = 'rgba(30,18,12,0.45)'; g.fillRect(b * bw, 0, 1.5, n); for (let q = 0; q < 25; q++) { g.fillStyle = R() < 0.5 ? 'rgba(165,130,100,0.18)' : 'rgba(35,22,15,0.22)'; const yy = R() * n, hh = 20 + R() * 120; g.fillRect(b * bw + R() * bw * 0.6, yy, 3 + R() * 18, hh); }
      }
    });
    const tableTop = mat({ color: '#ffffff', map: plank, tile: 1.2, rough: 0.5, key: 'g_guest_tabletop' });
    box(40.7, 0.72, 26.2, 41.9, 0.78, 31.1, tableTop, { collide: true });
    const legM = mat({ color: '#3a2a20', rough: 0.5 });
    box(40.9, 0, 26.6, 41.7, 0.72, 26.8, legM); box(40.9, 0, 30.5, 41.7, 0.72, 30.7, legM); box(41.2, 0.5, 26.8, 41.4, 0.6, 30.5, legM);
    // dining chair: white cushion on a grey frame (plan: white squares with grey outline)
    const seatW = F.fabric('#fbfaf7'), frameM = mat({ color: '#4a4a4c', rough: 0.4 });
    const chair = () => { const g = new THREE.Group();
      F.rbx(g, 0.52, 0.06, 0.52, 0.02, 0, 0.43, 0, frameM); F.rbx(g, 0.46, 0.08, 0.46, 0.03, 0, 0.5, 0.01, seatW);
      F.rbx(g, 0.52, 0.62, 0.07, 0.02, 0, 0.8, -0.23, frameM); F.rbx(g, 0.46, 0.56, 0.05, 0.02, 0, 0.82, -0.19, seatW);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), frameM); l.position.set(a * 0.22, 0.21, b * 0.22); g.add(l); });
      return g; };
    [26.75, 27.6, 28.45, 29.3, 30.15, 31.0].forEach((z) => { place(chair(), 40.33, 0, z, PI / 2); place(chair(), 42.27, 0, z, -PI / 2); });
    place(chair(), 41.3, 0, 25.85, 0); place(chair(), 41.3, 0, 31.6, PI);
  }

  // ---------------- PRIVATE SALOON (dark brown) ----------------
  {
    const c = '#ab9c8a', d = 0.75;
    rug(25.6, 35.4, 29.3, 37.9, '#9c8868', 43, [26.6, 35.75, 28.1, 37.25, '#76654f']);
    // north row (face south)
    sofa(24.6, 34.42, 0, 0.7, d, c, 1); sofa(26.1, 34.42, 0, 1.8, d, c, 2); roundT(27.4, 34.42, 0.21, '#7a604a'); sofa(28.67, 34.42, 0, 1.85, d, c, 2);
    // south row (face north)
    sofa(24.6, 38.55, PI, 0.7, d, c, 1); sofa(26.0, 38.55, PI, 1.9, d, c, 2); sqT(27.4, 38.55, 0.55, '#7a7a78'); sofa(28.7, 38.55, PI, 1.8, d, c, 2); sofa(30.12, 38.55, PI, 0.7, d, c, 1);
    // east (face west) and west (face east)
    sofa(30.12, 35.87, -PI / 2, 0.72, d, c, 1); roundT(30.2, 36.75, 0.24, '#7a604a'); sofa(30.12, 37.55, -PI / 2, 0.72, d, c, 1);
    sofa(24.62, 36.55, PI / 2, 1.9, d, c, 2);
  }

  // ---------------- MAIN SALOON (cream) ----------------
  {
    const c = '#c9c0b0', grey = '#cfd0cf', d = 0.85, tb = '#d2c4a6';
    rug(37.8, 35.25, 45.2, 39.4, '#8a7963', 45);
    // north row
    sofa(38.75, 34.45, 0, 1.5, d, c, 2, true); roundT(40.05, 34.45, 0.33); sofa(41.67, 34.45, 0, 2.15, d, c, 3, true); sqT(43.27, 34.45, 0.62, tb); sofa(44.5, 34.45, 0, 1.4, d, c, 2, true); roundT(45.95, 34.45, 0.34);
    // south row
    roundT(37.42, 40.25, 0.33); sofa(38.75, 40.25, PI, 1.5, d, c, 2, true); sqT(40.07, 40.25, 0.62, tb); sofa(41.67, 40.25, PI, 2.15, d, c, 3, true); sqT(43.3, 40.25, 0.62, tb); sofa(44.57, 40.25, PI, 1.4, d, grey, 2, true); roundT(45.95, 40.25, 0.34);
    // west column (face east)
    sofa(36.75, 36.25, PI / 2, 0.72, d, c, 1); sofa(36.75, 37.77, PI / 2, 1.95, d, c, 2, true); sofa(36.75, 39.3, PI / 2, 0.72, d, c, 1);
    // east column (face west)
    sofa(45.95, 36.02, -PI / 2, 2.05, d, c, 2, true); sqT(45.95, 37.72, 0.62, tb); sofa(45.95, 39.0, -PI / 2, 1.5, d, grey, 2, true);
  }
}
