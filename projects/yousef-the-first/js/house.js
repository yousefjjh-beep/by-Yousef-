// The house, Direction B: TARA's courtyard plan scaled to ~46 x 21 m.
// Units are metres. x runs east (right on the sheet), z runs south (down on the sheet), y is up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lineMaterial } from './materials.js';

export const ROOMS = [
  { id: 'living', name: 'LIVING', r: [8, 1, 17, 8], h: 6.0, lp: [12.5, 6.9] },
  { id: 'gallery', name: 'ENTRY GALLERY', r: [9, 8, 12.5, 17], h: 4.2, lp: [10.75, 9.6], vertical: true },
  { id: 'garden', name: 'INNER GARDEN', r: [17, 1, 23, 8], open: true, lp: [20, 7.2] },
  { id: 'court', name: 'LIGHT COURT', r: [12.5, 8, 15, 14], open: true, lp: [13.75, 13.2], small: true },
  { id: 'dining', name: 'DINING', r: [15, 8, 23, 14.5], h: 4.2, lp: [19, 13.6] },
  { id: 'kitchen', name: 'KITCHEN', r: [15, 14.5, 23, 19], h: 4.2, lp: [19, 17.6] },
  { id: 'pantry', name: 'PANTRY', r: [12.5, 14, 15, 19], h: 4.2, lp: [13.75, 16.5], small: true },
  { id: 'powder', name: 'POWDER', r: [6, 12.5, 9, 17], h: 3.4, lp: [7.5, 14.8], small: true },
  { id: 'laundry', name: 'LAUNDRY', r: [6, 8, 9, 12.5], h: 3.4, lp: [7.5, 10.3], small: true },
  { id: 'carport', name: 'CARPORT', r: [0, 9, 6, 19.5], h: 3.0, lp: [3, 14.3] },
  { id: 'terrace', name: 'TERRACE', r: [23, 8, 27.5, 19], h: 3.8, lp: [25.25, 16.6] },
  { id: 'passage', name: 'PASSAGE', r: [23, 1, 25.5, 8], h: 3.8, lp: [24.25, 6.6], small: true },
  { id: 'dressing', name: 'DRESSING', r: [25.5, 1, 29, 7], h: 3.8, lp: [27.25, 4.0], small: true },
  { id: 'master', name: 'MASTER BEDROOM', r: [29, 1, 37, 7], h: 3.8, lp: [33, 5.4] },
  { id: 'bath', name: 'BATH', r: [37, 1, 41.5, 7], h: 3.8, lp: [39.25, 5.6], small: true },
  { id: 'spa', name: 'SPA TERRACE', r: [41.5, 1, 45, 7], open: true, lp: [43.25, 6.2], small: true },
  { id: 'pool', name: 'POOL', r: [29, 12, 43, 16.5], open: true, lp: [36, 14.25] },
  { id: 'poolhouse', name: 'POOL HOUSE', r: [43.5, 10, 46, 19], h: 3.0, lp: [44.75, 14.5], small: true, vertical: true },
];

export const TREES = [
  [20.2, 4.4, 1.25, 1], [13.7, 10.0, 0.7, 2], [13.6, 12.7, 0.6, 3],
  [10.5, -1.6, 1.0, 4], [14.8, -1.9, 0.85, 5], [3.5, -0.8, 1.1, 6], [27, -1.6, 0.9, 7], [35, -1.8, 1.0, 8],
  [5.2, 22.6, 1.15, 9], [16.8, 22.9, 0.95, 10], [25, 21.8, 1.2, 11], [34, 21.6, 1.0, 12], [43, 21.2, 0.9, 13],
  [46.9, 4.6, 1.15, 14], [46.8, 0.4, 0.95, 16], [47.0, 8.4, 1.0, 17], [1.0, -1.2, 1.1, 15],
];

function worldUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u, v;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

export function buildHouse(M) {
  const root = new THREE.Group();
  const lists = {};          // material key -> [geometry]
  const shadowless = new Set(['glass', 'water', 'spaWater', 'glow', 'fire', 'art', 'mirror']);
  const edgeArrays = [];
  const addEdges = (geo, thr = 20) => {
    const e = new THREE.EdgesGeometry(geo, thr);
    edgeArrays.push(e.attributes.position.array);
    e.dispose();
  };
  const push = (key, geo, edges = true, thr = 20) => {
    worldUV(geo);
    if (edges) addEdges(geo, thr);
    const g = geo.index ? geo.toNonIndexed() : geo;
    (lists[key] ||= []).push(g);
  };
  // axis-aligned box from min/max corners
  const box = (key, x0, y0, z0, x1, y1, z1, edges = true) => {
    if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return;
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    push(key, g, edges);
  };
  const rbox = (key, cx, y0, cz, w, h, d, r = 0.04, rotY = 0, rotX = 0) => {
    const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
    g.rotateX(rotX); g.rotateY(rotY); g.translate(cx, y0 + h / 2, cz);
    push(key, g, true, 35);
  };
  const cyl = (key, cx, y0, cz, r, h, seg = 32) => {
    const g = new THREE.CylinderGeometry(r, r, h, seg); g.translate(cx, y0 + h / 2, cz); push(key, g, true, 30);
  };

  // ---------- walls ----------
  // axis 'x': wall runs along x at z = c, from a to b.  axis 'z': runs along z at x = c.
  const glazing = (axis, c, a, b, sill, head, t = 0.2) => {
    const P = (u0, y0, w0, u1, y1, w1, key) => axis === 'x' ? box(key, u0, y0, c + w0, u1, y1, c + w1) : box(key, c + w0, y0, u0, c + w1, y1, u1);
    P(a, sill, -0.015, b, head, 0.015, 'glass');
    const fw = 0.06, fd = Math.min(0.12, t * 0.6);
    P(a, sill, -fd / 2, b, sill + 0.05, fd / 2, 'bronze');            // bottom rail
    P(a, head - 0.06, -fd / 2, b, head, fd / 2, 'bronze');            // head rail
    const n = Math.max(1, Math.round((b - a) / 1.6));
    for (let i = 0; i <= n; i++) {
      const u = a + (b - a) * i / n;
      P(Math.max(a, u - fw / 2), sill, -fd / 2, Math.min(b, u + fw / 2), head, fd / 2, 'bronze');
    }
  };
  const wall = (axis, c, a, b, { t = 0.2, h = 4.2, mat = 'plaster', y0 = 0, ops = [] } = {}) => {
    const cuts = [a, b, ...ops.flatMap(o => [o.a, o.b])].filter(v => v >= a && v <= b).sort((p, q) => p - q);
    const P = (u0, y0_, u1, y1) => axis === 'x' ? box(mat, u0, y0_, c - t / 2, u1, y1, c + t / 2) : box(mat, c - t / 2, y0_, u0, c + t / 2, y1, u1);
    for (let i = 0; i < cuts.length - 1; i++) {
      const u0 = cuts[i], u1 = cuts[i + 1]; if (u1 - u0 < 1e-4) continue;
      const mid = (u0 + u1) / 2, op = ops.find(o => mid > o.a && mid < o.b);
      if (!op) { P(u0, y0, u1, h); continue; }
      if (op.sill > y0) P(u0, y0, u1, op.sill);
      if (op.head < h) P(u0, op.head, u1, h);
      if (op.type === 'glass') glazing(axis, c, u0, u1, op.sill, op.head, t);
    }
  };
  const G = (a, b, sill = 0, head = 99, type = 'glass') => ({ a, b, sill, head, type });

  const E = 0.35, I = 0.2;
  // Living (9 x 7, 6 m high)
  wall('x', 1, 7.825, 17.175, { t: E, h: 6, ops: [G(8.175, 16.825, 0, 6)] });
  wall('z', 8, 0.825, 8.175, { t: E, h: 6, mat: 'travertine', ops: [G(1.175, 2.8, 0, 6), G(3.1, 5.9, 4.6, 5.6), G(6.2, 7.9, 0, 6)] });
  wall('z', 17, 1.175, 7.9, { t: I, h: 6, ops: [G(1.175, 7.9, 0, 6)] });
  wall('x', 8, 8.175, 16.9, { t: I, h: 6, ops: [G(9.1, 12.4, 0, 4.2, 'void'), G(12.6, 14.9, 0, 4.2), G(15.25, 16.75, 0, 3.0, 'void')] });
  // Entry gallery (3.5 x 9, 4.2 m)
  wall('z', 9, 8.1, 16.825, { t: I, h: 4.2 });
  wall('z', 12.5, 8.1, 16.825, { t: I, h: 4.2, ops: [G(8.1, 13.9, 0, 4.2)] });
  wall('z', 12.5, 16.825, 19.175, { t: I, h: 4.2, mat: 'travertine' });
  wall('x', 17, 8.825, 12.4, { t: E, h: 4.2, mat: 'travertine', ops: [G(9.85, 11.65, 0, 3.6, 'void')] });
  // Service block
  wall('z', 6, 7.825, 17.175, { t: E, h: 3.4 });
  wall('x', 8, 5.825, 7.825, { t: E, h: 3.4 });
  wall('x', 17, 6.175, 8.825, { t: E, h: 3.4, mat: 'travertine' });
  wall('x', 12.5, 6.175, 8.9, { t: I, h: 3.4, ops: [G(7.2, 8.1, 0, 2.6, 'void')] });
  // Pantry / kitchen / dining
  wall('x', 14, 12.6, 14.9, { t: I, h: 4.2 });
  wall('x', 19, 12.325, 23.1, { t: E, h: 4.2, mat: 'travertine', ops: [G(15.6, 22.4, 2.5, 3.7)] });
  wall('z', 15, 8.1, 14.0, { t: I, h: 4.2, ops: [G(8.1, 14.0, 0, 4.2)] });
  wall('z', 15, 14.0, 18.825, { t: I, h: 4.2, ops: [G(17.2, 18.2, 0, 2.6, 'void')] });
  wall('x', 8, 17.1, 22.9, { t: I, h: 4.2, ops: [G(17.1, 22.9, 0, 4.2)] });
  wall('z', 23, 0.825, 19.1, { t: I, h: 4.2, ops: [G(1.175, 7.9, 0, 3.8), G(8.1, 11.3, 0, 4.2), G(11.3, 14.3, 0, 3.4, 'void'), G(14.3, 18.9, 0, 4.2)] });
  glazing('z', 22.92, 14.4, 17.3, 0, 3.35, 0.1);                  // sliding panel, pushed open behind the fixed glass
  // Garden wall
  wall('x', 1, 17.175, 22.9, { t: E, h: 3.0 });
  // Master wing
  wall('x', 1, 22.9, 41.675, { t: E, h: 3.8, ops: [G(35.3, 36.7, 0.9, 3.2)] });
  wall('x', 7, 25.4, 41.675, { t: E, h: 3.8, ops: [G(29.1, 32.3, 0, 3.8), G(32.3, 35.1, 0, 3.2, 'void'), G(35.1, 36.9, 0, 3.8), G(38, 41, 1.1, 3.2)] });
  glazing('x', 6.9, 29.4, 32.2, 0, 3.15, 0.1);                    // bedroom slider, open
  wall('z', 25.5, 1.175, 6.825, { t: I, h: 3.8, ops: [G(3.0, 4.2, 0, 2.6, 'void')] });
  wall('z', 29, 1.175, 6.825, { t: I, h: 3.8, ops: [G(5.4, 6.4, 0, 2.6, 'void')] });
  wall('z', 37, 1.175, 6.825, { t: I, h: 3.8, ops: [G(5.4, 6.4, 0, 2.6, 'void')] });
  wall('z', 41.5, 1.175, 6.825, { t: I, h: 3.8, ops: [G(1.175, 4.3, 0, 3.8), G(4.3, 6.3, 0, 3.2, 'void'), G(6.3, 6.825, 0, 3.8)] });
  glazing('z', 41.42, 2.3, 4.25, 0, 3.15, 0.1);                   // bath slider, parked open
  wall('x', 1, 41.675, 45.175, { t: E, h: 2.4 });
  wall('z', 45, 1.175, 7.0, { t: E, h: 0.95, mat: 'travertine' });   // low stone parapet: the spa looks out over the garden
  // Pool house
  wall('z', 43.5, 9.825, 19.175, { t: I, h: 3.0, ops: [G(13.8, 15.2, 0, 2.6, 'void')] });
  wall('z', 46, 9.825, 19.175, { t: I, h: 3.0 });
  wall('x', 10, 43.4, 46.1, { t: I, h: 3.0 });
  wall('x', 19, 43.4, 46.1, { t: I, h: 3.0 });
  wall('x', 14.5, 43.6, 45.9, { t: I, h: 3.0, ops: [G(44.2, 45.2, 0, 2.4, 'void')] });
  // Perimeter walls
  wall('x', -3, -2, 48, { t: 0.3, h: 2.2 });
  wall('z', 48, -3, 24, { t: 0.3, h: 2.2 });
  wall('z', -2, -3, 8.5, { t: 0.3, h: 2.2 });

  // ---------- columns ----------
  for (const z of [9.3, 14.3, 19.2]) box('steel', 0.1, 0, z - 0.1, 0.3, 3.0, z + 0.1);
  for (const z of [8.3, 13.6, 18.85]) box('plaster', 27.15, 0, z - 0.15, 27.45, 3.8, z + 0.15);

  // ---------- floors ----------
  const slab = (key, x0, z0, x1, z1, top = 0) => box(key, x0, top - 0.3, z0, x1, top, z1);
  slab('oak', 8, 1, 17, 8);
  slab('travertine', 9, 8, 12.5, 17);
  slab('travertine', 9, 17, 12.5, 19.6);            // porch
  slab('travertine', 15, 8, 23, 19);
  slab('travertine', 12.5, 14, 15, 19);
  slab('travertine', 6, 8, 9, 17);
  slab('oak', 23, 1, 41.5, 7);
  slab('travertine', 37, 1, 41.5, 7);
  slab('limestone', 41.5, 1, 45, 1.9);              // spa terrace, around the sunken spa
  slab('limestone', 41.5, 4.4, 45, 7);
  slab('limestone', 41.5, 1.9, 42.2, 4.4);
  slab('limestone', 44.7, 1.9, 45, 4.4);
  slab('limestone', 23, 8, 27.5, 19);
  slab('gravel', 12.5, 8, 15, 14, -0.03);
  slab('gravel', 17, 1, 23, 8, -0.03);
  slab('limestone', 18.5, 3.6, 22.0, 5.2, -0.01);   // stone pad under the olive
  slab('limestone', 43.5, 10, 46, 19);
  // Pool deck as four strips around the water
  slab('limestone', 27.5, 8, 45.5, 12, -0.01);
  slab('limestone', 27.5, 16.5, 45.5, 19.6, -0.01);
  slab('limestone', 27.5, 12, 29, 16.5, -0.01);
  slab('limestone', 43, 12, 43.5, 16.5, -0.01);
  box('water', 29, -1.2, 12, 43, -0.015, 16.5);
  box('gravel', -2, -0.33, 8.6, 6, -0.02, 26);       // drive
  // Arrival: reflecting pool with floating travertine steps
  box('limestone', 8.4, -0.3, 19.6, 13.1, 0.03, 19.85);
  box('limestone', 8.4, -0.3, 23.35, 13.1, 0.03, 23.6);
  box('limestone', 8.4, -0.3, 19.85, 8.65, 0.03, 23.35);
  box('limestone', 12.85, -0.3, 19.85, 13.1, 0.03, 23.35);
  box('water', 8.65, -0.6, 19.85, 12.85, -0.015, 23.35);
  for (const z of [20.0, 20.9, 21.8, 22.7]) box('travertine', 9.95, -0.15, z, 11.55, 0.05, z + 0.6);
  box('travertine', 9.6, -0.3, 23.6, 11.9, 0.0, 26);  // path to the street

  // ---------- roofs ----------
  const roof = (x0, z0, x1, z1, y, th = 0.45, key = 'roof') => box(key, x0, y, z0, x1, y + th, z1);
  roof(7.65, 0.65, 17.35, 8.1, 6.0);
  roof(8.8, 7.9, 12.7, 17.2, 4.2);
  roof(8.6, 17.0, 12.4, 19.6, 3.85, 0.35);          // porch canopy
  roof(5.65, 7.65, 8.8, 17.35, 3.4, 0.4);
  roof(12.4, 13.9, 15.0, 19.35, 4.2);
  roof(14.9, 7.9, 23.1, 19.35, 4.2);
  roof(22.9, 0.65, 38.6, 7.35, 3.8, 0.4);            // master wing, with a skylight over the bath
  roof(39.6, 0.65, 41.85, 7.35, 3.8, 0.4);
  roof(38.6, 0.65, 39.6, 1.7, 3.8, 0.4);
  roof(38.6, 4.0, 39.6, 7.35, 3.8, 0.4);
  box('glass', 38.6, 4.17, 1.7, 39.6, 4.2, 4.0);
  roof(23.1, 7.35, 27.6, 19.35, 3.8, 0.3);
  roof(43.3, 9.65, 46.2, 19.35, 3.0, 0.35);
  roof(-0.2, 9.0, 6.0, 19.7, 3.0, 0.3, 'roofSteel');

  // ---------- gallery ----------
  box('walnut', 9.1, 0.38, 10.9, 9.55, 0.44, 13.9);                 // floating console
  box('travertine', 9.1, 0, 11.0, 9.5, 0.38, 11.4);
  box('travertine', 9.1, 0, 13.4, 9.5, 0.38, 13.8);
  box('walnut', 9.1, 0.9, 10.55, 9.13, 3.2, 14.25);                 // painting backing
  box('travertine', 11.55, 0, 14.75, 12.05, 1.0, 15.25);            // plinth
  box('glow', 10.71, 4.17, 8.5, 10.79, 4.2, 16.6, false);           // ceiling light slot
  // ---------- living ----------
  box('basalt', 8.175, 0, 2.85, 8.8, 0.38, 6.15);                   // hearth bench
  box('basalt', 8.175, 0.38, 2.9, 8.24, 1.25, 6.1);                 // fireplace surround
  box('fire', 8.245, 0.5, 3.2, 8.26, 1.05, 5.8, false);
  box('wool', 9.7, 0, 2.3, 15.2, 0.015, 6.7);                       // rug 5.5 x 4.4
  // L-sofa, back to the north glass, return along the east
  box('walnut', 10.3, 0.015, 2.1, 15.25, 0.08, 3.0);
  box('walnut', 14.45, 0.015, 3.0, 15.25, 0.08, 5.5);
  rbox('linen', 12.75, 0.08, 2.58, 5.0, 0.3, 1.05, 0.05);
  rbox('linen', 14.88, 0.08, 4.3, 1.05, 0.3, 2.6, 0.05);
  for (let i = 0; i < 3; i++) rbox('linen', 10.95 + i * 1.36, 0.38, 2.8, 1.32, 0.14, 0.78, 0.06);
  rbox('linen', 14.82, 0.38, 3.55, 0.78, 0.14, 1.0, 0.06);
  rbox('linen', 14.82, 0.38, 4.75, 0.78, 0.14, 1.3, 0.06);
  for (let i = 0; i < 4; i++) rbox('linen', 10.75 + i * 1.12, 0.38, 2.22, 1.08, 0.48, 0.24, 0.08, 0, -0.12);
  rbox('linen', 15.1, 0.38, 3.4, 0.24, 0.48, 1.1, 0.08);
  rbox('linen', 15.1, 0.38, 4.6, 0.24, 0.48, 1.3, 0.08);
  // coffee table + side table
  rbox('basalt', 12.3, 0, 4.45, 1.8, 0.34, 1.1, 0.04);
  cyl('bronze', 10.45, 0, 2.95, 0.22, 0.48);
  // lounge chairs facing the fire... the pair flanks the hearth facing east
  for (const z of [3.2, 5.7]) {
    for (const [dx, dz] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]]) box('walnut', 9.85 + dx - 0.025, 0, z + dz - 0.025, 9.85 + dx + 0.025, 0.22, z + dz + 0.025);
    rbox('leather', 9.85, 0.2, z, 0.9, 0.18, 0.86, 0.06);
    rbox('leather', 9.47, 0.36, z, 0.18, 0.4, 0.86, 0.07);
  }
  // linear pendant over the coffee table, hung from the 6 m ceiling
  box('bronze', 10.6, 2.9, 4.42, 14.0, 2.96, 4.48);
  box('glow', 10.65, 2.885, 4.43, 13.95, 2.9, 4.47, false);
  box('bronze', 10.8, 2.96, 4.445, 10.81, 6.0, 4.455, false);
  box('bronze', 13.79, 2.96, 4.445, 13.8, 6.0, 4.455, false);
  // potted olive in the corner by the glass
  cyl('basalt', 16.2, 0, 7.2, 0.38, 0.62);
  // ---------- dining (8 x 6.5) ----------
  box('wool', 16.3, 0, 9.5, 21.7, 0.012, 12.9);
  rbox('walnut', 19, 0.72, 11.2, 4.2, 0.05, 1.25, 0.012);          // table top
  for (const x of [17.4, 20.6]) box('travertine', x - 0.07, 0, 10.75, x + 0.07, 0.72, 11.65);
  const chair = (cx, cz, face) => {                                  // face: direction the sitter looks (+1 = +z, -1 = -z, 2 = +x, -2 = -x)
    const along = Math.abs(face) === 2;
    const bx = along ? -Math.sign(face) * 0.24 : 0, bz = along ? 0 : -Math.sign(face) * 0.24;
    for (const [dx, dz] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]]) box('walnut', cx + dx - 0.018, 0, cz + dz - 0.018, cx + dx + 0.018, 0.44, cz + dz + 0.018);
    rbox('linen', cx, 0.42, cz, 0.5, 0.07, 0.48, 0.03);
    rbox('linen', cx + bx, 0.5, cz + bz, along ? 0.06 : 0.5, 0.4, along ? 0.5 : 0.06, 0.025);
  };
  for (let i = 0; i < 4; i++) { chair(17.5 + i * 1.0, 10.3, 1); chair(17.5 + i * 1.0, 12.1, -1); }
  chair(16.45, 11.2, 2); chair(21.55, 11.2, -2);
  box('bronze', 17.6, 2.15, 11.17, 20.4, 2.2, 11.23);              // linear pendant
  box('glow', 17.65, 2.14, 11.18, 20.35, 2.15, 11.22, false);
  box('bronze', 17.8, 2.2, 11.195, 17.81, 4.2, 11.205, false);
  box('bronze', 20.19, 2.2, 11.195, 20.2, 4.2, 11.205, false);
  cyl('basalt', 22.35, 0, 8.75, 0.34, 0.55);                         // planter in the corner
  // ---------- kitchen (8 x 4.5) ----------
  box('walnut', 17.1, 0, 15.8, 20.9, 0.88, 16.8);                   // island base
  box('travertine', 17.0, 0.88, 15.75, 21.0, 0.95, 16.85);          // waterfall top
  box('travertine', 17.0, 0, 15.75, 17.07, 0.88, 16.85);
  box('travertine', 20.93, 0, 15.75, 21.0, 0.88, 16.85);
  for (let i = 0; i < 4; i++) { const x = 17.6 + i * 0.95; cyl('bronze', x, 0, 15.3, 0.025, 0.66, 10); cyl('leather', x, 0.66, 15.3, 0.2, 0.06, 24); }
  box('walnut', 15.4, 0, 18.2, 22.6, 0.88, 18.825);                 // back run
  box('travertine', 15.35, 0.88, 18.15, 22.65, 0.95, 18.825);
  box('travertine', 15.35, 0.95, 18.76, 22.65, 2.5, 18.825);        // stone splashback to the window sill
  box('steel', 18.4, 0.95, 18.3, 19.6, 0.96, 18.75);                // induction hob
  box('glow', 15.4, 0.86, 18.17, 22.6, 0.875, 18.2, false);          // toe-kick light strip
  box('walnut', 15.1, 0, 14.6, 15.75, 3.4, 16.9);                    // tall larder wall
  for (const x of [17.9, 19.0, 20.1]) {                              // three pendants over the island
    box('bronze', x - 0.004, 1.95, 16.296, x + 0.004, 4.2, 16.304, false);
    cyl('bronze', x, 1.7, 16.3, 0.13, 0.25, 24);
    box('glow', x - 0.1, 1.69, 16.2, x + 0.1, 1.7, 16.4, false);
  }
  // ---------- terrace and pool ----------
  const lounger = (x, z) => {
    box('walnut', x - 0.37, 0, z - 0.95, x + 0.37, 0.22, z + 0.95);
    rbox('linen', x, 0.22, z + 0.25, 0.7, 0.09, 1.35, 0.04);
    rbox('linen', x, 0.24, z - 0.62, 0.7, 0.09, 0.62, 0.04, 0, -0.75);
  };
  for (let i = 0; i < 4; i++) lounger(31.5 + i * 2.5, 17.9);
  rbox('linen', 25.0, 0, 15.3, 2.6, 0.38, 0.95, 0.06);               // outdoor sofas
  rbox('linen', 25.0, 0, 18.0, 2.6, 0.38, 0.95, 0.06);
  rbox('linen', 25.0, 0.38, 14.95, 2.6, 0.38, 0.22, 0.06);
  rbox('linen', 25.0, 0.38, 18.35, 2.6, 0.38, 0.22, 0.06);
  rbox('basalt', 25.0, 0, 16.65, 1.2, 0.34, 0.8, 0.03);
  for (const x of [23.8, 26.6]) cyl('basalt', x, 0, 8.9, 0.42, 0.7);
  // ---------- master bedroom (8 x 6) ----------
  box('wool', 30.8, 0, 1.9, 35.2, 0.012, 5.4);
  box('walnut', 29.1, 0, 1.175, 35.1, 3.8, 1.24);                   // walnut wall behind the bed
  box('glow', 29.1, 3.74, 1.25, 35.1, 3.76, 1.28, false);            // wall-washer slot above it
  box('walnut', 31.8, 0, 1.3, 34.2, 0.24, 3.55);                    // bed platform
  rbox('linen', 33, 0.24, 2.45, 2.2, 0.26, 2.1, 0.06);              // mattress
  rbox('linen', 33, 0.46, 2.9, 2.26, 0.1, 1.3, 0.05);               // folded throw
  for (const x of [32.45, 33.55]) rbox('linen', x, 0.5, 1.62, 0.95, 0.22, 0.4, 0.09);
  rbox('linen', 33, 0, 1.25, 3.8, 1.25, 0.14, 0.05);                 // upholstered headboard
  for (const x of [31.15, 34.85]) {
    box('walnut', x - 0.3, 0.12, 1.31, x + 0.3, 0.5, 1.75);          // floating nightstands
    cyl('bronze', x, 0.5, 1.5, 0.012, 0.42, 8);
    cyl('glow', x, 0.92, 1.5, 0.13, 0.2, 24);
  }
  rbox('leather', 33, 0, 3.95, 1.7, 0.44, 0.45, 0.05);             // bench at the foot
  rbox('leather', 36.1, 0.0, 5.6, 0.85, 0.36, 0.85, 0.06);          // reading chair
  rbox('leather', 36.45, 0.36, 5.6, 0.16, 0.42, 0.85, 0.06);
  box('walnut', 25.7, 0, 1.175, 28.9, 2.6, 1.8);                    // dressing room joinery
  box('walnut', 25.7, 0, 6.2, 28.9, 2.6, 6.825);
  // ---------- bath (4.5 x 6) ----------
  rbox('travertine', 39.1, 0, 2.85, 0.9, 0.55, 1.8, 0.18);         // freestanding stone tub under the skylight
  box('water', 38.78, 0.40, 2.08, 39.42, 0.48, 3.62);
  cyl('bronze', 39.1, 0, 1.78, 0.018, 1.02, 10);                   // floor-standing tap
  box('bronze', 39.085, 0.98, 1.78, 39.115, 1.0, 2.02);
  box('travertine', 39.9, 0, 1.175, 41.4, 3.8, 1.22);              // stone wall behind the vanity
  box('walnut', 40.0, 0.42, 1.22, 41.3, 0.84, 1.72);               // floating vanity
  box('travertine', 39.95, 0.84, 1.22, 41.35, 0.9, 1.76);
  for (const x of [40.35, 40.95]) { box('basalt', x - 0.2, 0.9, 1.35, x + 0.2, 0.92, 1.66); cyl('bronze', x, 0.9, 1.29, 0.012, 0.2, 8); }
  box('mirror', 40.05, 1.12, 1.225, 41.25, 2.4, 1.24);             // mirror, lit from behind
  box('glow', 40.08, 1.08, 1.226, 41.22, 1.1, 1.23, false);
  box('basalt', 37.1, 0, 1.175, 38.35, 0.025, 3.0);                // walk-in rain shower in basalt
  box('basalt', 37.1, 0, 1.22, 38.35, 2.7, 1.26);
  box('basalt', 37.1, 0, 1.22, 37.15, 2.7, 3.0);
  box('glass', 37.15, 0.02, 2.97, 38.0, 2.3, 2.99);
  box('bronze', 37.5, 2.5, 1.75, 37.95, 2.52, 2.25);               // rain head
  box('bronze', 37.7, 2.52, 1.26, 37.75, 2.55, 1.8);
  box('walnut', 38.4, 0.4, 6.35, 40.7, 0.45, 6.75);                 // slatted bench
  for (const x of [38.55, 40.55]) box('travertine', x - 0.06, 0, 6.38, x + 0.06, 0.4, 6.72);
  for (let i = 0; i < 3; i++) box('linen', 39.0 + i * 0.32, 0.45, 6.42, 39.26 + i * 0.32, 0.53, 6.68);   // folded towels
  cyl('basalt', 41.0, 0, 6.45, 0.26, 0.48);
  // ---------- spa terrace ----------
  box('basalt', 42.2, -0.3, 1.9, 44.7, 0.03, 2.05);                 // basalt coping
  box('basalt', 42.2, -0.3, 4.25, 44.7, 0.03, 4.4);
  box('basalt', 42.2, -0.3, 2.05, 42.35, 0.03, 4.25);
  box('basalt', 44.55, -0.3, 2.05, 44.7, 0.03, 4.25);
  box('spaWater', 42.35, -0.9, 2.05, 44.55, -0.028, 4.25);
  box('basalt', 42.35, -0.45, 2.05, 44.55, -0.42, 2.45);            // submerged bench
  box('walnut', 43.95, 0, 5.0, 44.7, 0.24, 6.85);                   // teak daybed
  rbox('linen', 44.32, 0.24, 6.1, 0.7, 0.1, 1.4, 0.04);
  rbox('linen', 44.32, 0.26, 5.3, 0.7, 0.1, 0.55, 0.04, 0, -0.7);
  cyl('basalt', 42.0, 0, 1.55, 0.3, 0.55);
  // ---------- merge static geometry ----------
  for (const [key, geos] of Object.entries(lists)) {
    const geo = mergeGeometries(geos, false);
    const mesh = new THREE.Mesh(geo, M[key]);
    mesh.castShadow = !shadowless.has(key);
    mesh.receiveShadow = key !== 'glow' && key !== 'fire';
    if (key === 'glass') mesh.renderOrder = 2;
    root.add(mesh);
  }

  // ---------- trees and shrubs (not cut by the plan; they grow as the walls rise) ----------
  const trees = [];
  const plant = (x, z, s, seed, { base = 0, shrub = false, len = 0 } = {}) => {
    let k = seed * 9301 + 49297; const r = () => ((k = (k * 16807) % 2147483647) / 2147483647);
    const g = new THREE.Group(); g.position.set(x, base, z);
    const leafG = [], barkG = [];
    const th = shrub ? 0 : 1.9 * s + r() * 0.5;
    if (!shrub) {
      const tr = new THREE.CylinderGeometry(0.06 * s, 0.12 * s, th + 0.4 * s, 9); tr.translate(0, (th + 0.4 * s) / 2, 0); barkG.push(tr);
      for (let i = 0; i < 3; i++) {
        const bl = 0.9 * s, b = new THREE.CylinderGeometry(0.025 * s, 0.05 * s, bl, 6); b.translate(0, bl / 2, 0);
        b.rotateZ(0.7 + r() * 0.3); b.rotateY(i * 2.1 + r()); b.translate(0, th * (0.75 + r() * 0.2), 0); barkG.push(b);
      }
    }
    const C = new THREE.Vector3(0, shrub ? 0.42 * s : th + 0.85 * s, 0);
    const R = shrub ? new THREE.Vector3(Math.max(0.55 * s, len / 2), 0.42 * s, 0.5 * s) : new THREE.Vector3(1.45 * s, 1.05 * s, 1.45 * s);
    const n = shrub ? Math.round(30 + len * 26) : Math.round(150 * s + 40);
    const col = new THREE.Color(), cn = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, e = Math.acos(2 * r() - 1), rr = 0.45 + 0.55 * Math.cbrt(r());
      const cx = C.x + R.x * rr * Math.sin(e) * Math.cos(a), cy = C.y + R.y * rr * Math.cos(e), cz = C.z + R.z * rr * Math.sin(e) * Math.sin(a);
      const sz = (0.7 + r() * 0.5) * Math.sqrt(s) * (shrub ? 0.8 : 1);
      const q = new THREE.PlaneGeometry(sz, sz);
      q.rotateZ(r() * Math.PI); q.rotateX((r() - 0.5) * 2.4); q.rotateY(r() * Math.PI * 2);
      q.translate(cx, Math.max(cy, sz * 0.35), cz);
      const pos = q.attributes.position, nor = q.attributes.normal, colors = new Float32Array(pos.count * 3);
      col.setHSL(0.17 + r() * 0.06, 0.25 + r() * 0.2, 0.8 + r() * 0.2);
      for (let j = 0; j < pos.count; j++) {
        cn.set(pos.getX(j), pos.getY(j), pos.getZ(j)).sub(C).divide(R).normalize();
        nor.setXYZ(j, cn.x, cn.y, cn.z);
        const lift = 0.7 + 0.45 * (pos.getY(j) - C.y + R.y) / (2 * R.y);
        colors[j * 3] = col.r * lift; colors[j * 3 + 1] = col.g * lift; colors[j * 3 + 2] = col.b * lift;
      }
      q.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      leafG.push(q.toNonIndexed());
    }
    const lm = new THREE.Mesh(mergeGeometries(leafG), M.leaf);
    lm.castShadow = lm.receiveShadow = true; g.add(lm);
    if (barkG.length) { const bm = new THREE.Mesh(mergeGeometries(barkG.map(q => { worldUV(q); return q.index ? q.toNonIndexed() : q; })), M.bark); bm.castShadow = bm.receiveShadow = true; g.add(bm); }
    root.add(g); trees.push(g);
  };
  for (const [x, z, s, seed] of TREES) plant(x, z, s, seed);
  plant(16.2, 7.2, 0.42, 99, { base: 0.62 });
  plant(22.35, 8.75, 0.36, 98, { base: 0.55 });
  plant(42.0, 1.55, 0.36, 97, { base: 0.55 });                        // olive by the spa
  plant(41.0, 6.45, 0.24, 96, { base: 0.48 });                        // small olive in the bath                       // potted olive in dining
  for (const x of [23.8, 26.6]) plant(x, 8.9, 0.4, Math.round(x * 7), { base: 0.7 });                        // potted olive in the living room
  for (let x = 13.6; x < 22.6; x += 1.5) plant(x, 19.75, 0.9, Math.round(x * 10), { shrub: true, len: 1.6 });
  plant(7.3, 18.0, 0.9, 77, { shrub: true, len: 1.9 });
  plant(-1.2, 12.0, 0.9, 78, { shrub: true, len: 1.4 });
  for (let z = -1.6; z < 9.5; z += 1.7) plant(47.3, z, 1.05, Math.round(z * 13 + 400), { shrub: true, len: 1.8 });   // hedge along the east wall

  // ---------- the front door: 1.8 x 3.6 m oak pivot ----------
  const door = new THREE.Group(); door.position.set(10.3, 0, 17.0);
  const dg = new THREE.BoxGeometry(1.8, 3.58, 0.1); dg.translate(0.45, 1.79, 0);
  const dgw = dg.clone(); dgw.translate(10.3, 0, 17); worldUV(dgw); dg.setAttribute('uv', dgw.attributes.uv);
  const dm = new THREE.Mesh(dg, M.oakDoor); dm.castShadow = dm.receiveShadow = true; door.add(dm);
  const hg = new THREE.BoxGeometry(0.035, 1.4, 0.24); hg.translate(1.15, 1.3, 0); worldUV(hg);
  door.add(new THREE.Mesh(hg, M.bronze));
  const del = new THREE.LineSegments(new THREE.EdgesGeometry(dg), lineMaterial()); door.add(del);
  root.add(door);

  // ---------- the painting ----------
  const art = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), M.art);
  art.rotation.y = Math.PI / 2; art.position.set(9.135, 2.05, 12.4); root.add(art);

  // ---------- bronze sculpture on the plinth ----------
  const sc = new THREE.Mesh(new THREE.TorusKnotGeometry(0.2, 0.055, 160, 16, 2, 3), M.bronze);
  sc.position.set(11.8, 1.32, 15.0); sc.rotation.set(0.4, 0.6, 0); sc.castShadow = true; root.add(sc);

  // ---------- one merged set of ink lines ----------
  let total = 0; for (const a of edgeArrays) total += a.length;
  const all = new Float32Array(total); let o = 0; for (const a of edgeArrays) { all.set(a, o); o += a.length; }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(all, 3));
  const lines = new THREE.LineSegments(lg, lineMaterial()); lines.renderOrder = 3; lines.frustumCulled = false;
  root.add(lines);

  return { root, door, trees };
}
