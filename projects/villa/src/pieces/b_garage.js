// Piece: b_garage — basement garage parking (20x9), drive lane, car ramp, stair to grade, driver's room + WC, slab over.
import { THREE, L, F, mat, tex, M } from '../lib.js';

export const rooms = [
  { name: 'Garage parking', level: 'B', x: 18, z: 8, yaw: Math.PI / 2 },
  { name: "Driver's room", level: 'B', x: 25.5, z: 1.6, yaw: Math.PI / 2 },
  { name: 'Car ramp (top)', level: 'G', x: 4.5, z: 4.5, yaw: -Math.PI / 2 },
];
export const views = [
  { name: 'garage from east door', level: 'B', x: 26.0, z: 8.4, yaw: 95, pitch: -10, fov: 70 },
  { name: 'ramp from grade', level: 'G', x: 4.2, z: 3.6, yaw: -75, pitch: -16, fov: 70 },
  { name: 'stair & lane from garage', level: 'B', x: 21.5, z: 9.6, yaw: 62, pitch: -4, fov: 72 },
  { name: "driver's room", level: 'B', x: 26.2, z: 3.2, yaw: 60, pitch: -12, fov: 75 },
];

const B = L.B; // -3.6
const TOP = -0.02; // walls run up into the slab

// ---------------------------------------------------------------------------
// Ramp profile: grade until x=8, -3.6 from x=21, parabolic transitions of 1.5 m
const RX0 = 8.0, RX1 = 21.0, RT = 1.5, RS = 3.6 / (RX1 - RX0 - RT);
export function rampY(x) {
  if (x <= RX0) return 0;
  if (x >= RX1) return B;
  if (x < RX0 + RT) return -RS * (x - RX0) ** 2 / (2 * RT);
  if (x > RX1 - RT) return B + RS * (RX1 - x) ** 2 / (2 * RT);
  return -RS * RT / 2 - RS * (x - RX0 - RT);
}

export function build(ctx) {
  const { box, rect, poly, wall } = ctx;

  // ---------------- materials ----------------
  const garageFloor = mat({ color: '#dadadc', tile: 3, rough: .35, map: tex.custom('bg_floor', (g, n) => {
    g.fillStyle = '#e4e4e2'; g.fillRect(0, 0, n, n);
    const R = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(77);
    for (let i = 0; i < 4000; i++) { g.fillStyle = R() < .5 ? '#f2f2f0' : '#d4d4d2'; g.globalAlpha = .12; g.fillRect(R() * n, R() * n, 3, 3); }
    g.globalAlpha = 1; g.fillStyle = '#b4b4b6';
    for (let k = 0; k < 16; k++) g.fillRect(0, k * n / 16, n, 2.5); // fine epoxy joint lines along x
  }) });
  const rampMat = mat({ color: '#e6e6e8', tile: 2, rough: .8, map: tex.custom('bg_ramp', (g, n) => {
    g.fillStyle = '#e3e3e2'; g.fillRect(0, 0, n, n);
    const R = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(31);
    for (let i = 0; i < 6000; i++) { g.fillStyle = R() < .5 ? '#ececea' : '#d6d6d4'; g.globalAlpha = .12; g.fillRect(R() * n, R() * n, 2, 2); }
    g.globalAlpha = 1;
  }) });
  const hatchMat = mat({ color: '#ffffff', tile: 1.6, rough: .7, map: tex.custom('bg_hatch', (g, n) => {
    g.fillStyle = '#fdfdfd'; g.fillRect(0, 0, n, n); g.fillStyle = '#bdbdbd';
    for (let k = 0; k < 16; k++) g.fillRect(k * n / 16, 0, n / 110, n); }) });
  const concrete = mat({ color: '#d9d6d0', map: tex.plaster('#d6d3cc', 41), tile: 3, rough: .95 });
  const curbMat = mat({ color: '#b9b8b4', rough: .8 });
  const kerbMat = mat({ color: '#e6e6e8', map: tex.plaster('#a9a9a6', 42), tile: 2, rough: .9 });
  const laneMat = mat({ color: '#f2f2f2', map: tex.plaster('#e4e4e3', 48), tile: 3, rough: .85 });
  const paverMat = mat({ color: '#d4d4d6', map: tex.basket('#9a9a9c', 8, 49), tile: 2.4, rough: .9 });
  const voidMat = mat({ color: '#f2f2f2', rough: .95 });
  const garWall = M.plaster();
  const dado = mat({ color: '#8f9396', rough: .6 });
  const ext = M.extStone();
  const stairWall = mat({ color: '#efe6d6', map: tex.plaster('#ece2d0', 43), tile: 2, rough: .9 });
  const treadMat = mat({ color: '#ffffff', map: tex.custom('bg_tread', (g, n) => {
    g.fillStyle = '#7f7b74'; g.fillRect(0, 0, n, n);
    for (let k = 0; k < 10; k++) { g.fillStyle = k % 2 ? '#76726b' : '#88847c'; g.fillRect(k * n / 10, 0, n / 20, n); }
  }), tile: 1, rough: .5 });
  const nosing = mat({ color: '#4d4740', rough: .5 });
  const stairNose = mat({ color: '#5d5952', rough: .5 });
  const landingStone = mat({ color: '#f0ece4', map: tex.marble('#f1ede5', '#d8d2c6', 44), tile: 2, rough: .4 });
  const driverFloor = mat({ color: '#ffffff', map: tex.custom('bg_drv', (g, n) => {
    g.fillStyle = '#bb9a6c'; g.fillRect(0, 0, n, n);
    const R = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(5);
    for (let i = 0; i < 26000; i++) { g.fillStyle = R() < .5 ? '#e2c49a' : '#7f5f3a'; g.globalAlpha = .55; g.fillRect(R() * n, R() * n, 2.5, 2.5); }
    g.globalAlpha = 1;
  }), tile: 2.5, rough: .8 });
  const wcTile = mat({ color: '#ffffff', map: tex.custom('bg_wct', (g, n) => { g.fillStyle = '#3c3c3c'; g.fillRect(0, 0, n, n); const s = n / 4; g.fillStyle = '#f2f2f0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(i * s + 5, j * s + 5, s - 10, s - 10); }), tile: 1.0, rough: .3 });
  const wcWall = mat({ color: '#f3f1ec', map: tex.tiles('#f4f2ee', '#cfcac2', 3, .01, 46), tile: .9, rough: .3 });
  const drvWall = mat({ color: '#f1e8d8', map: tex.plaster('#efe5d3', 47), tile: 2, rough: .9 });
  const slabMat = M.ceiling();
  const lineMat = mat({ color: '#7c8085', rough: .6 });
  const chevDark = mat({ color: '#4a5562', rough: .6 });
  const chevLight = mat({ color: '#9aa3ad', rough: .6 });
  const ledMat = mat({ color: '#ffffff', emissive: '#f4f7ff', emissiveIntensity: 1.4, key: 'bg_led' });

  // ---------------- custom geometry helpers ----------------
  // prism following the ramp profile between z0..z1, x from xa..xb; top at rampY(x)+off, bottom at `bot`
  function rampPrism(xa, xb, z0, z1, off, m, { walk = false, sides = true, bot = B - 0.02, n = 64, anchor = false } = {}) {
    const t = m.userData.tile || 1;
    const pos = [], uv = [], idx = [];
    const xs = []; for (let i = 0; i <= n; i++) xs.push(xa + (xb - xa) * i / n);
    // top surface
    let s = 0; let px = xa, py = rampY(xa) + off;
    xs.forEach((x, i) => { const y = rampY(x) + off; if (i) s += Math.hypot(x - px, y - py); px = x; py = y;
      pos.push(x, y, z0, x, y, z1); uv.push(s / t, 0, s / t, (z1 - z0) / t); });
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    if (anchor) { pos.push(xa, B, z0); uv.push(0, 0); } // unreferenced vertex: bbox reaches the floor so the plan cut keeps it
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const top = new THREE.Mesh(g, m); ctx.add(top, { walk, cast: false });
    if (sides) {
      for (const [z, flip] of [[z0, true], [z1, false]]) {
        const p2 = [], u2 = [], i2 = [];
        xs.forEach((x) => { const y = rampY(x) + off; p2.push(x, y, z, x, bot, z); u2.push(x / t, y / t, x / t, bot / t); });
        for (let i = 0; i < n; i++) { const a = i * 2; if (flip) i2.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); else i2.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(u2, 2)); g2.setIndex(i2); g2.computeVertexNormals();
        ctx.add(new THREE.Mesh(g2, m), { cast: false });
      }
    }
    return top;
  }
  // a sloped bar from (xa,ya,z) to (xb,yb,z) of section w(z) x h(y)
  function bar(xa, ya, xb, yb, z, w, h, m) {
    const len = Math.hypot(xb - xa, yb - ya); const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), m);
    mesh.position.set((xa + xb) / 2, (ya + yb) / 2, z); mesh.rotation.z = Math.atan2(yb - ya, xb - xa); ctx.add(mesh); return mesh;
  }

  // door swing arc drawn on the floor (plan symbol): centre (cx,cz), plan angles a0..a1 (0 = +x/east, PI/2 = +z/south)
  const arcMat = mat({ color: '#5f5f61', rough: .6 });
  function swingArc(cx, cz, r, a0, a1, hwid = .012) { const m = new THREE.Mesh(new THREE.RingGeometry(r - hwid, r + hwid, 28, 1, -a1, a1 - a0), arcMat); m.rotation.x = -Math.PI / 2; m.position.set(cx, B + .005, cz); ctx.add(m, { cast: false }); }

  // =====================================================================
  // 1. CURVED AT-GRADE APPROACH (NW corner) + curved guide wall
  // =====================================================================
  const outer = [[0.15, 6.45], [0.75, 6.25], [1.3, 5.85], [1.7, 5.25], [2.0, 4.5], [2.35, 3.6], [2.85, 2.7], [3.5, 1.85], [4.3, 1.15], [5.2, 0.62], [6.0, 0.33], [6.8, 0.15]];
  const arcIn = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; arcIn.push([7.4 - 1.75 * Math.cos(a), 6.3 - 2.4 * Math.sin(a)]); } // (5.65,6.3) -> (7.4,3.9)
  const fillPts = [...outer, [7.3, 0.15], [7.3, 3.85], ...[...arcIn].reverse(), [5.65, 6.45]];
  poly(fillPts, 0.0, rampMat, { thick: 3.6 });
  // curved guide wall (low wall at grade, retaining the earth fill down to the basement)
  for (let i = 0; i < outer.length - 1; i++) {
    const [a, b] = [outer[i], outer[i + 1]];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / dl, uz = (b[1] - a[1]) / dl, e = 0.13; // overlap segments at the joints
    wall(a[0] - ux * e, a[1] - uz * e, b[0] + ux * e, b[1] + uz * e, { y0: B, h: 3.6 + 0.75, t: 0.3, off: 0.15, mA: concrete, mB: ext });
  }
  // stair-top landing at grade (rounded corner) — light stone
  poly([...arcIn, [7.45, 3.9], [7.45, 6.3]], 0.0, mat({ color: '#f7f7f6', rough: .5 }), { thick: 3.6 });
  // curved kerb along the landing's rounded edge
  // stippled light curb rim following the landing's quarter curve (+ along its south edge)
  { const stip = mat({ color: '#ffffff', tile: 0.6, rough: .8, map: tex.custom('bg_stip', (g, n) => { g.fillStyle = '#8f8f8d'; g.fillRect(0, 0, n, n); g.fillStyle = '#f4f4f2';
      const c = 10, r = 3; for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) { const o = j % 2 ? n / c / 2 : 0; g.fillRect(i * n / c + o + 3, j * n / r + 3, n / c - 6, n / r - 6); g.fillRect(i * n / c + o - n + 3, j * n / r + 3, n / c - 6, n / r - 6); } }) });
    const E = (k, a) => [7.4 - (1.75 + k) * Math.cos(a), 6.3 - (2.4 + k) * Math.sin(a)];
    const quad = (pts) => { let A = 0; pts.forEach(([x, z], i) => { const [x2, z2] = pts[(i + 1) % pts.length]; A += x * z2 - x2 * z; }); if (A < 0) pts.reverse(); poly(pts, 0.01, stip, { thick: 3.61, walk: false }); };
    const NS = 16; for (let i = 0; i < NS; i++) { const a0 = i / NS * Math.PI / 2, a1 = (i + 1) / NS * Math.PI / 2; quad([E(0, a0), E(0, a1), E(.28, a1), E(.28, a0)]); }
    quad([[5.41, 6.3], [7.3, 6.3], [7.3, 6.52], [5.41, 6.52]]); }
  // ---- straight driveway lane continuing south (grade; tops 1.5 cm under site's driveway so they only read in the B plan cut)
  const GY = -0.015, GT = 3.6 + GY;
  poly([[1.5, 6.4], [5.65, 6.4], [5.65, 14.5], [1.5, 14.5]], GY, laneMat, { thick: GT, walk: false });
  poly([[0.0, 6.5], [1.5, 6.4], [1.5, 14.5], [0.0, 14.5]], GY, paverMat, { thick: GT, walk: false });
  poly([[5.65, 6.3], [7.22, 6.3], [7.22, 14.5], [5.65, 14.5]], GY, paverMat, { thick: GT, walk: false });
  for (const x of [1.5, 5.65]) box(x - .05, GY - 0.01, 6.4, x + .05, GY + 0.001, 14.5, kerbMat);
  // earth / ground mass south of the garage (white on the plan)
  poly([[7.22, 12.88], [16.82, 12.88], [16.82, 14.5], [7.22, 14.5]], GY, voidMat, { thick: GT, walk: false });

  // chevrons painted on the approach / ramp
  const chev = [[3.05, 4.65, -55, chevDark], [4.95, 3.45, -50, chevDark], [6.45, 2.35, -22, chevDark], [7.8, 2.15, 0, chevDark], [9.2, 2.15, 0, chevDark], [10.5, 2.15, 0, chevDark], [11.8, 2.15, 0, chevLight]];
  for (const [x, z, deg, m] of chev) {
    const outerG = new THREE.Group(); outerG.position.set(x, rampY(x) + 0.012, z); outerG.rotation.y = -deg * Math.PI / 180; // deg<0 = heading north of east
    const inner = new THREE.Group(); const slope = (rampY(x + 0.05) - rampY(x - 0.05)) / 0.1; inner.rotation.z = Math.atan(slope); outerG.add(inner);
    for (const sgn of [1, -1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.6, 0.15), m); const a = sgn * Math.PI / 4; b.position.set(-0.375 * Math.cos(a) + 0.05, -0.8, -0.375 * Math.sin(a) * -1); b.rotation.y = a; inner.add(b); }
    ctx.add(outerG, { cast: false });
  }

  // =====================================================================
  // 2. RAMP (x 7.3 → 22, z 0.3 → 3.85) + retaining walls, curbs, railing
  // =====================================================================
  rampPrism(7.3, 22.05, 0.3, 3.85, 0, rampMat, { walk: true, n: 90 });
  rampPrism(10.0, 11.6, 0.85, 3.85, 0.006, hatchMat, { sides: false, n: 16, anchor: true }); // pale hatched pedestrian band across the ramp
  rampPrism(10.0, 11.6, 0.3, 0.85, 0.156, hatchMat, { sides: false, n: 16, anchor: true });
  rampPrism(7.3, 19.3, 0.3, 0.85, 0.15, kerbMat, { n: 60 }); // north walkway kerb (grey band on plan)
  ctx.cyl(19.3, rampY(19.3) + 0.15 - 0.6, 0.575, 0.275, 0.6, kerbMat, 20);
  rampPrism(19.3, 22.05, 0.3, 0.5, 0.15, curbMat, { n: 20 });
  rampPrism(14.45, 21.6, 3.62, 3.85, 0.15, curbMat, { n: 40 }); // south curb along the open edge
  // north retaining wall along the site boundary
  wall(6.8, 0.15, 21.95, 0.15, { y0: B, h: 3.85, t: 0.3, mA: concrete, mB: ext });
  // painted yellow edge line at base of north wall (eye-level detail)
  // guard rail on the ramp's open south edge (x 14.45 → 21)
  const steel = M.steel();
  for (let x = 14.7; x <= 20.9; x += 1.25) ctx.box(x - .03, rampY(x) + .15, 3.71, x + .03, rampY(x) + 1.1, 3.77, steel);
  for (let i = 0; i < 8; i++) { const xa = 14.6 + i * (6.4 / 8), xb = xa + 6.4 / 8; bar(xa, rampY(xa) + 1.1, xb, rampY(xb) + 1.1, 3.74, .06, .05, steel); bar(xa, rampY(xa) + .6, xb, rampY(xb) + .6, 3.74, .03, .03, steel); }

  // =====================================================================
  // 3. STAIR from garage (-3.6, east) up to grade (0, west)
  // =====================================================================
  // two flights + mid landing (plan): bottom flight x 13.4 -> 11.3 (10 risers), landing 10.3-11.3, top flight 10.3 -> 8.1 (11 risers), top landing 7.41-8.1 at grade
  const rise = 3.6 / 21, F1 = [13.4, 11.3, 10], F2 = [10.3, 8.1, 11];
  const flight = ([xs, xe, nr], y0) => { const run = (xs - xe) / nr; for (let i = 1; i <= nr; i++) {
    const xa = xs - run * i, xb = xs - run * (i - 1), y = y0 + rise * i;
    box(xa, B, 3.97, xb, y, 5.55, treadMat, { walk: true }); box(xb - 0.03, y - 0.02, 3.97, xb + 0.005, y + 0.003, 5.55, stairNose); } };
  const landM = mat({ color: '#8e8a83', rough: .5 });
  flight(F1, B); box(10.3, B, 3.97, 11.3, B + 10 * rise, 5.55, landM, { walk: true }); flight(F2, B + 10 * rise);
  box(7.41, B, 3.97, 8.1, 0, 5.55, landM, { walk: true });
  { // centre handrail: one merged mesh (its bottom is at the garage floor, so the whole rail shows in the plan cut)
    const railM = mat({ color: '#4a4844', rough: .4, metal: .5 }); const parts = []; const xs = [13.4, 11.3, 10.3, 8.1];
    const add = (geo, m4) => { const gg = geo.toNonIndexed(); gg.applyMatrix4(m4); parts.push(gg); };
    for (let q = 0; q < xs.length - 1; q++) { const xa = xs[q], xb = xs[q + 1], ya = stairY(xa) + .9, yb = stairY(xb) + .9, len = Math.hypot(xb - xa, yb - ya);
      add(new THREE.BoxGeometry(len, .05, .06), new THREE.Matrix4().compose(new THREE.Vector3((xa + xb) / 2, (ya + yb) / 2, 4.76), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.atan2(yb - ya, xb - xa))), new THREE.Vector3(1, 1, 1))); }
    for (const x of [13.3, 11.4, 10.2, 8.2]) add(new THREE.BoxGeometry(.05, .9, .05), new THREE.Matrix4().makeTranslation(x, stairY(x) + .45, 4.76));
    const pos = [], nor = []; parts.forEach((gg) => { pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array); });
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    ctx.add(new THREE.Mesh(mg, railM), { collide: false }); }
  function stairY(x) { if (x >= 13.4) return B; if (x >= 11.3) return B + 10 * rise * (13.4 - x) / 2.1; if (x >= 10.3) return B + 10 * rise; if (x >= 8.1) return B + 10 * rise + 11 * rise * (10.3 - x) / 2.2; return 0; }
  rect(13.4, 3.97, 14.3, 5.55, B, mat({ color: '#f5f5f3', rough: .5 })); // bottom landing (white on plan)
  // stair walls
  wall(7.3, 5.65, 14.45, 5.65, { y0: B, h: 3.58, t: 0.2, mA: garWall, mB: stairWall });
  wall(7.45, 3.9, 14.45, 3.9, { y0: B, h: 3.6, t: 0.15, mA: stairWall, mB: concrete });
  { const pill = mat({ color: '#f0f0f0', map: tex.plaster('#b4b4b4', 50), tile: 2, rough: .8 });
    box(14.3, B, 3.85, 14.9, B + 3.58, 4.325, pill, { collide: true }); box(14.3, B, 5.325, 14.9, B + 3.58, 5.8, pill, { collide: true }); box(14.3, B + 2.2, 4.325, 14.9, B + 3.58, 5.325, pill, { collide: true });
    ctx.door(14.9, 4.325, 0, 1, 1.0, 2.2, B, { color: '#6b4a2f', swing: 1, open: Math.PI / 2 });
    swingArc(14.9, 4.325, 0.97, 0, Math.PI / 2);
    for (const z of [3.85, 5.8]) ctx.cyl(14.6, B, z, 0.3, 3.58, pill, 20, { collide: true }); }
  // glass balustrade on top of the stair/ramp dividing wall (open to sky)
  { const gl = new THREE.Mesh(new THREE.BoxGeometry(14.45 - 7.45, 1.0, 0.02), M.glass()); gl.position.set((7.45 + 14.45) / 2, 0.5, 3.9); ctx.add(gl, { collide: true, cast: false });
    ctx.box(7.45, 1.0, 3.86, 14.45, 1.05, 3.94, steel); }
  // handrail along south wall (pitch line) + brackets
  { const xs = [14.3, 13.4, 11.3, 10.3, 8.1, 7.45]; for (let q = 0; q < xs.length - 1; q++) bar(xs[q], stairY(xs[q]) + 0.9, xs[q + 1], stairY(xs[q + 1]) + 0.9, 5.49, .05, .05, steel);
    for (const x of [8.6, 9.6, 10.8, 11.9, 12.9]) { const y = stairY(x) + 0.9; ctx.box(x - .02, y - .08, 5.49, x + .02, y, 5.55, steel); } }

  // =====================================================================
  // 4. GARAGE PARKING 20x9 (+ drive lane x14.45-22, z3.9-5.65)
  // =====================================================================
  poly([[7.47, 5.75], [14.55, 5.75], [14.55, 3.9], [26.8, 3.9], [26.8, 11.6], [16.58, 11.6], [16.58, 12.63], [7.47, 12.63]], B, garageFloor);
  // darker kerb / walkway strips along west and south (grey bands on plan)
  box(7.47, B, 5.75, 8.05, B + .1, 12.63, kerbMat);
  box(8.05, B, 11.9, 16.58, B + .1, 12.63, kerbMat);
  // walls
  wall(7.35, 12.85, 7.35, 5.55, { y0: B, h: 3.58, t: 0.25, mA: garWall, mB: ext });
  wall(7.25, 12.75, 16.7, 12.75, { y0: B, h: 3.58, t: 0.25, mA: ext, mB: garWall });
  wall(16.7, 12.85, 16.7, 11.6, { y0: B, h: 3.58, t: 0.25, mA: ext, mB: garWall });
  wall(16.58, 11.72, 26.9, 11.72, { y0: B, h: 3.58, t: 0.25, mA: ext, mB: garWall });
  // east wall, my half of the wall shared with the living hall, with the door opening (arrow on plan)
  wall(26.85, 0.05, 26.85, 11.6, { y0: B, h: 3.58, t: 0.1, mA: garWall, mB: garWall, openings: [{ at: 8.45 - 0.05, w: 1.6, h: 2.4 }] });
  // door frame for that opening
  ctx.box(26.75, B, 7.6, 26.9, B + 2.45, 7.65, nosing); ctx.box(26.75, B, 9.2, 26.9, B + 2.45, 9.25, nosing); ctx.box(26.75, B + 2.4, 7.6, 26.9, B + 2.45, 9.25, nosing);
  // grey dado band on garage walls (eye level detail)
  const dadoRuns = [[7.5, 5.76, 7.52, 12.6], [7.5, 12.6, 16.55, 12.62], [16.55, 11.6, 16.57, 12.62], [16.55, 11.58, 26.8, 11.6], [26.78, 3.95, 26.8, 7.6], [26.78, 9.25, 26.8, 11.6], [8, 5.75, 14.35, 5.77], [22.15, 3.95, 26.8, 3.97]];
  for (const [a, b, c, d] of dadoRuns) box(a, B, b, c, B + 1.0, d, dado);
  // parking markings (as on plan)
  const line = (xa, za, xb, zb) => box(xa, B, za, xb, B + .004, zb, lineMat);
  [[7.6, 9.3], [9.7, 11.4], [11.9, 13.2]].forEach(([a, b]) => line(a, 8.82, b, 8.88));
  [[23.0, 24.4], [25.0, 26.4]].forEach(([a, b]) => line(a, 6.6, b, 6.66));
  line(18.67, 9.8, 18.73, 11.55); line(25.57, 9.7, 25.63, 11.55);
  // wheel stops
  for (const z of [7.65, 10.5]) box(7.95 + .2, B, z - .7, 8.15 + .2, B + .1, z + .7, curbMat);
  // painted direction sign (circle + arrow to the east door)
  const signMat = mat({ color: '#ffffff', transparent: true, rough: .5, key: 'bg_sign', map: tex.custom('bg_sign', (g, n) => {
    g.clearRect(0, 0, n, n); g.strokeStyle = '#4a5562'; g.lineWidth = n * .06; g.beginPath(); g.arc(n / 2, n / 2, n * .42, 0, Math.PI * 2); g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(n * .27, n / 2); g.lineTo(n * .72, n / 2); g.moveTo(n * .55, n * .33); g.lineTo(n * .72, n / 2); g.lineTo(n * .55, n * .67); g.stroke();
  }, 256) });
  { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), signMat); pl.rotation.x = -Math.PI / 2; pl.position.set(25.5, B + .006, 8.85); ctx.add(pl, { cast: false }); }

  // cars (all nose to the west as drawn)
  const champ = '#96855f';
  [[10.6, 7.65], [10.6, 10.55], [24.2, 5.35], [22.1, 10.4]].forEach(([x, z]) => ctx.place(sedan(champ), x, B, z, 0, { collide: true }));

  // =====================================================================
  // 5. DRIVER'S ROOM + WC
  // =====================================================================
  wall(21.95, 0.15, 26.9, 0.15, { y0: B, h: 3.6, t: 0.3, mA: drvWall, mB: ext });
  wall(22.05, 0.3, 22.05, 3.85, { y0: B, h: 3.58, t: 0.2, mA: concrete, mB: drvWall, openings: [
    { at: 0.75, w: 0.9, h: 3.58, door: { color: '#f2f0ea', swing: 1, open: 1.3 } },
    { at: 2.45, w: 1.5, y0: 1.0, h: 2.58, glass: true }] });
  box(22.0, B + 1.0, 1.95, 22.08, B + 2.3, 3.45, mat({ color: '#3aa6e0', rough: .2, key: 'bg_glzline' }), { cast: false });
  wall(22.05, 3.85, 26.85, 3.85, { y0: B, h: 3.58, t: 0.2, mA: garWall, mB: drvWall });
  rect(22.15, 0.3, 26.8, 3.75, B, driverFloor);
  swingArc(22.12, 0.3, 0.86, 0, Math.PI / 2, .022);
  // WC (x 22.15–24.15, z 2.3–3.75)
  wall(22.15, 2.3, 24.2, 2.3, { y0: B, h: 3.58, t: 0.1, mA: wcWall, mB: drvWall, openings: [{ at: 1.3, w: 0.7, h: 2.1 }] });
  wall(24.15, 2.25, 24.15, 3.75, { y0: B, h: 3.58, t: 0.12, mA: drvWall, mB: wcWall });
  ctx.rect(22.15, 2.35, 24.09, 3.75, B + .003, wcTile);
  // skirting in driver's room
  for (const [a, b, c, d] of [[22.15, 0.3, 26.8, 0.32], [24.21, 3.73, 26.8, 3.75], [26.78, 0.3, 26.8, 3.75]]) box(a, B, b, c, B + .1, d, nosing);

  // =====================================================================
  // 6. SLAB over garage / lane / driver room (ceiling -0.4, top -0.02), stair & ramp left open
  // =====================================================================
  const slab = poly([[21.95, 0.0], [26.9, 0.0], [26.9, 11.85], [16.82, 11.85], [16.82, 12.88], [7.22, 12.88], [7.22, 5.55], [14.35, 5.55], [14.35, 3.78], [21.95, 3.78]], TOP, slabMat, { thick: 0.38, walk: false });
  // edge beams (downstands) under the ground-floor walls above
  box(14.35, -0.9, 3.75, 21.95, -0.4, 3.97, slabMat);
  box(14.35, -0.9, 3.78, 14.9, -0.4, 6.2, slabMat);
  // linear LED fittings over the parking, downlights in the lane and rooms
  for (const z of [6.6, 9.0, 11.0]) for (const x0 of [8.5, 13.0, 17.5, 22.0]) box(x0, -0.43, z - .04, x0 + 3.5, -0.4, z + .04, ledMat, { cast: false });
  for (const x of [16, 18.5, 21]) ctx.downlight(x, 4.8, -0.4, .1);
  for (const [x, z] of [[24.0, 1.2], [25.8, 1.2], [25.6, 3.0], [23.15, 3.05]]) ctx.downlight(x, z, -0.4, .08);
  // wall lights on stair
  for (const x of [9.2, 12.3]) box(x - .2, stairY(x) + 0.25, 5.53, x + .2, stairY(x) + 0.3, 5.55, ledMat, { cast: false });
}

// sedan, local coords: length along x, NOSE at -x, origin at floor centre
// plan-shaped slab: outline pts [[x,z]] extruded from y0 to y1
function plate(g, pts, y0, y1, m) {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: true, bevelThickness: Math.min(.06, (y1 - y0) / 3), bevelSize: .05, bevelSegments: 2, curveSegments: 6 });
  const mesh = new THREE.Mesh(geo, m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = y0; g.add(mesh); return mesh;
}
function rounded(x0, z0, x1, z1, rN, rT) { // rounded rectangle; nose (x0) radius rN, tail (x1) radius rT
  const pts = []; const arc = (cx, cz, r, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } };
  arc(x0 + rN, z0 + rN, rN, Math.PI, 1.5 * Math.PI); arc(x1 - rT, z0 + rT, rT, 1.5 * Math.PI, 2 * Math.PI);
  arc(x1 - rT, z1 - rT, rT, 0, .5 * Math.PI); arc(x0 + rN, z1 - rN, rN, .5 * Math.PI, Math.PI); return pts;
}
function sedanBody(hl2, hw, grow = 0) { // top-down sedan outline: tapered nose (-x) and tail, widest at the doors
  const top = []; const N = 120;
  for (let i = 0; i <= N; i++) { const t = -1 + 2 * i / N, x = t * hl2;
    const c = t < 0 ? .7 : .8, e = Math.max(0, (Math.abs(t) - c) / (1 - c));
    const w = (1 - .05 * t * t - (t < 0 ? .16 * (-t) ** 2.5 : 0)) * Math.max(0, 1 - e ** 2.6) ** .5;
    top.push([x, (hw + grow) * w]); }
  top[0][0] -= grow; top[N][0] += grow;
  return [...top.map(([x, z]) => [x, -z]), ...top.reverse().slice(1, -1).map(([x, z]) => [x, z])];
}
// glasshouse: side-profile extrusion (sloped windshield / rear screen) tapered in plan toward the roof
function cabin(g, m, hw) {
  const pr = new THREE.Shape([new THREE.Vector2(-1.08, 0), new THREE.Vector2(1.8, 0), new THREE.Vector2(1.08, .4), new THREE.Vector2(-.35, .4)]);
  const W = 1.4; const geo = new THREE.ExtrudeGeometry(pr, { depth: W, bevelEnabled: false }); geo.translate(0, 0, -W / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); const k = 1 - .14 * y / .4 - (x < -.8 ? .12 * (-.8 - x) / .28 : 0) - (x > 1.5 ? .15 * (x - 1.5) / .35 : 0); p.setZ(i, p.getZ(i) * k); }
  geo.computeVertexNormals(); const mesh = new THREE.Mesh(geo, m); mesh.position.y = .8; g.add(mesh); return mesh;
}
// top-view paint for the sedan (u along length nose->tail, v across width), copied from the plan's car
function carTex(hl2, hw) {
  return tex.custom('bg_cartop3', (g, n) => {
    const U = (u) => u * n, V = (v) => v * n;
    g.fillStyle = '#a08d68'; g.fillRect(0, 0, n, n);
    // body outline
    const out = sedanBody(hl2, hw).map(([x, z]) => [U((x + hl2) / (2 * hl2)), V((z + hw) / (2 * hw))]);
    const path = () => { g.beginPath(); out.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    let gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, '#9e8b66'); gr.addColorStop(.18, '#bba886'); gr.addColorStop(.5, '#cbb995'); gr.addColorStop(.82, '#bba886'); gr.addColorStop(1, '#9a8762');
    path(); g.fillStyle = gr; g.fill();
    // hood highlight + crease lines
    gr = g.createLinearGradient(0, 0, U(.3), 0); gr.addColorStop(0, 'rgba(255,248,230,0.0)'); gr.addColorStop(.5, 'rgba(255,248,230,0.18)'); gr.addColorStop(1, 'rgba(255,248,230,0)');
    g.fillStyle = gr; g.fillRect(U(.03), V(.22), U(.22), V(.56));
    g.strokeStyle = 'rgba(110,94,64,.55)'; g.lineWidth = n * .004;
    for (const v of [.3, .7]) { g.beginPath(); g.moveTo(U(.04), V(v + (v < .5 ? .05 : -.05))); g.quadraticCurveTo(U(.14), V(v), U(.26), V(v + (v < .5 ? -.02 : .02))); g.stroke(); }
    g.strokeStyle = 'rgba(120,102,70,.6)'; g.beginPath(); g.moveTo(U(.02), V(.5)); g.lineTo(U(.25), V(.5)); g.stroke();
    g.strokeStyle = 'rgba(255,250,235,.35)'; g.lineWidth = n * .006; g.beginPath(); g.moveTo(U(.03), V(.47)); g.lineTo(U(.24), V(.47)); g.stroke(); g.lineWidth = n * .004;
    g.fillStyle = 'rgba(240,236,222,.8)'; for (const v of [.2, .8]) { g.beginPath(); g.ellipse(U(.035), V(v), U(.015), V(.09), 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(110,94,64,.55)';
    // door crease lines along the sides
    for (const v of [.1, .9]) { g.beginPath(); g.moveTo(U(.3), V(v)); g.lineTo(U(.86), V(v)); g.stroke(); }
    // cabin outline (darker band = side glass)
    g.fillStyle = '#7d6c55'; g.beginPath(); g.moveTo(U(.27), V(.14)); g.lineTo(U(.43), V(.18)); g.lineTo(U(.73), V(.18)); g.quadraticCurveTo(U(.84), V(.18), U(.87), V(.22));
    g.lineTo(U(.87), V(.78)); g.quadraticCurveTo(U(.84), V(.82), U(.73), V(.82)); g.lineTo(U(.43), V(.82)); g.lineTo(U(.27), V(.86)); g.closePath(); g.fill();
    // windscreen (curved front edge toward the nose)
    gr = g.createLinearGradient(U(.23), 0, U(.43), 0); gr.addColorStop(0, '#6a5946'); gr.addColorStop(.6, '#86745c'); gr.addColorStop(1, '#6f5e4a');
    g.fillStyle = gr; g.beginPath(); g.moveTo(U(.28), V(.15)); g.quadraticCurveTo(U(.215), V(.5), U(.28), V(.85)); g.lineTo(U(.43), V(.76)); g.quadraticCurveTo(U(.415), V(.5), U(.43), V(.24)); g.closePath(); g.fill();
    // rear screen (curved back edge toward the tail)
    gr = g.createLinearGradient(U(.72), 0, U(.89), 0); gr.addColorStop(0, '#7a6852'); gr.addColorStop(.5, '#937f65'); gr.addColorStop(1, '#7a6852');
    g.fillStyle = gr; g.beginPath(); g.moveTo(U(.72), V(.25)); g.quadraticCurveTo(U(.73), V(.5), U(.72), V(.75)); g.lineTo(U(.855), V(.79)); g.quadraticCurveTo(U(.9), V(.5), U(.855), V(.21)); g.closePath(); g.fill();
    // roof panel
    gr = g.createLinearGradient(0, V(.25), 0, V(.75)); gr.addColorStop(0, '#c6b593'); gr.addColorStop(.5, '#dccdae'); gr.addColorStop(1, '#c6b593');
    g.fillStyle = gr; g.beginPath(); g.moveTo(U(.43), V(.24)); g.lineTo(U(.72), V(.25)); g.quadraticCurveTo(U(.73), V(.5), U(.72), V(.75)); g.lineTo(U(.43), V(.76)); g.quadraticCurveTo(U(.415), V(.5), U(.43), V(.24)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(95,80,58,.6)'; g.lineWidth = n * .003; g.stroke();
    // body edge
    path(); g.strokeStyle = '#7f6d4d'; g.lineWidth = n * .008; g.stroke();
  }, 1024);
}
function shadowTex() {
  return tex.custom('bg_carshadow', (g, n) => { g.clearRect(0, 0, n, n); g.filter = 'blur(' + Math.round(n * .035) + 'px)'; g.fillStyle = 'rgba(30,26,22,0.55)';
    const r = n * .12; const x0 = n * .08, y0 = n * .16, x1 = n * .92, y1 = n * .84;
    g.beginPath(); g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y1 - r); g.quadraticCurveTo(x1, y1, x1 - r, y1); g.lineTo(x0 + r, y1); g.quadraticCurveTo(x0, y1, x0, y1 - r); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.fill(); g.filter = 'none'; }, 256);
}
// planar top-down UVs (group-local x,z -> u,v) so the painted texture lands exactly in plan
function projUV(mesh, hl2, hw) {
  mesh.updateMatrix(); const p = mesh.geometry.attributes.position, v = new THREE.Vector3(), uv = [];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrix); uv.push((v.x + hl2) / (2 * hl2), 1 - (v.z + hw) / (2 * hw)); }
  mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}
function sedan(color) {
  const g = new THREE.Group();
  const Lc = 4.9, W = 1.9, hl2 = Lc / 2, hw = W / 2;
  const ctex = carTex(hl2, hw); const paint = sedan.paint || (sedan.paint = new THREE.MeshStandardMaterial({ color: '#9d988f', map: ctex, emissive: '#ffffff', emissiveMap: ctex, emissiveIntensity: .42, roughness: .5, metalness: .1 }));
  const b = mat({ color, rough: .4, metal: .2 });
  // soft drop shadow decal (down-right on plan)
  { const sh = new THREE.Mesh(new THREE.PlaneGeometry(Lc + .7, W + .7), mat({ color: '#ffffff', map: shadowTex(), transparent: true, rough: 1, key: 'bg_carshadowm' }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(.12, .006, .15); sh.renderOrder = 1; g.add(sh); }
  const body = plate(g, sedanBody(hl2, hw), .3, .8, paint); projUV(body, hl2, hw);  // body (tapered nose/tail)
  const cab = cabin(g, paint, hw); projUV(cab, hl2, hw);                              // glasshouse
  const roof = plate(g, rounded(-.35, -hw + .4, 1.0, hw - .4, .14, .12), 1.2, 1.24, paint); projUV(roof, hl2, hw);
  const tm = M.black(); const rim = M.steel();
  for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .24, 18), tm); wh.rotation.x = Math.PI / 2; wh.position.set(a * 1.45, .34, c * (hw - .14)); g.add(wh);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .245, 12), rim); hub.rotation.x = Math.PI / 2; hub.position.copy(wh.position); g.add(hub);
  }
  const hlm = mat({ color: '#f4f4ef', emissive: '#fffbe8', emissiveIntensity: .4, key: 'bg_hl' }), tl = mat({ color: '#6a1515', rough: .4, key: 'bg_tl2' });
  const mirM = mat({ color: '#a39472', rough: .4 });
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, .34), hlm); h.position.set(-hl2 + .3, .66, s * .42); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(.06, .08, .34), tl); t.position.set(hl2 - .1, .62, s * .52); g.add(t);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.06, .04, .12), mirM); arm.position.set(-.98, .9, s * (hw - .02)); g.add(arm);
    const mirr = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 6), mirM); mirr.scale.set(.7, .55, 1.2); mirr.position.set(-.93, .92, s * (hw + .1)); mirr.rotation.y = s * .5; g.add(mirr);
  }
  return g;
}
