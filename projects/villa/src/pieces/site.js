// Piece: site — everything outdoors at grade: boundary walls + gates, driveway, car pergola,
// brick walks/terraces, lawns & planters with white curbs, trees, palms, raised fountain pool, front court.
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'Site: west gate', level: 'G', x: 2.2, z: 18.4, yaw: -Math.PI / 2 },
  { name: 'Site: front court', level: 'G', x: 9, z: 23, yaw: -Math.PI / 2 },
  { name: 'Site: garden lawn', level: 'G', x: 4, z: 41, yaw: -Math.PI / 4 },
  { name: 'Site: south terrace', level: 'G', x: 33, z: 41.5, yaw: Math.PI / 2 },
];
export const views = [
  { name: 'driveway from the gate', level: 'G', x: 1.2, z: 17.6, yaw: -150, pitch: -6, fov: 70 },
  { name: 'garden lawn toward pool', level: 'G', x: 3.2, z: 44.2, yaw: -40, pitch: -6, fov: 70 },
  { name: 'south terrace looking west', level: 'G', x: 34, z: 41.6, yaw: 80, pitch: -6, fov: 70 },
  { name: 'pool & front court', level: 'G', x: 9.6, z: 32.6, yaw: -30, pitch: -8, fov: 70 },
];

// ---------------------------------------------------------------- helpers
const rngf = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
function arcByX(cx, cz, r, x0, x1, n = 24, sgn = 1) { // z = cz + sgn*sqrt(r²-(x-cx)²)
  const out = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; out.push([x, cz + sgn * Math.sqrt(Math.max(0, r * r - (x - cx) ** 2))]); } return out;
}
function arcByZ(cx, cz, r, z0, z1, n = 24, sgn = -1) { // x = cx + sgn*sqrt(r²-(z-cz)²)
  const out = []; for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; out.push([cx + sgn * Math.sqrt(Math.max(0, r * r - (z - cz) ** 2)), z]); } return out;
}
function spline(ctrl, n = 30) { return new THREE.SplineCurve(ctrl.map(([x, z]) => new THREE.Vector2(x, z))).getPoints(n).map((v) => [v.x, v.y]); }
const R4 = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// split a bounding rect into rectangles that avoid all exclusion rects ([x0,z0,x1,z1])
function freeRects(b, excl) {
  const xs = [...new Set([b[0], b[2], ...excl.flatMap((r) => [r[0], r[2]])].filter((v) => v >= b[0] && v <= b[2]))].sort((a, c) => a - c);
  const zs = [...new Set([b[1], b[3], ...excl.flatMap((r) => [r[1], r[3]])].filter((v) => v >= b[1] && v <= b[3]))].sort((a, c) => a - c);
  const rows = [];
  for (let j = 0; j < zs.length - 1; j++) {
    const cz = (zs[j] + zs[j + 1]) / 2, runs = []; let s = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2; const blocked = excl.some((r) => cx > r[0] && cx < r[2] && cz > r[1] && cz < r[3]);
      if (!blocked && s === null) s = xs[i]; if (blocked && s !== null) { runs.push([s, xs[i]]); s = null; }
    }
    if (s !== null) runs.push([s, xs[xs.length - 1]]); rows.push({ z0: zs[j], z1: zs[j + 1], runs });
  }
  const out = []; let open = [];
  for (const row of rows) {
    const next = [];
    for (const [a, c] of row.runs) { const o = open.find((q) => q.x0 === a && q.x1 === c); if (o) { o.z1 = row.z1; next.push(o); } else next.push({ x0: a, x1: c, z0: row.z0, z1: row.z1 }); }
    open.filter((q) => !next.includes(q)).forEach((q) => out.push(q)); open = next;
  }
  open.forEach((q) => out.push(q));
  return out.map((q) => [q.x0, q.z0, q.x1, q.z1]);
}

// merge several (geometry, materialIndex, matrix) parts into one mesh with groups (so plan-view bbox starts at ground)
function merged(parts, mats) {
  const pos = [], nor = [], uv = [], groups = [];
  for (const { geo, mi, m4 } of parts) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m4);
    const start = pos.length / 3; const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
    groups.push([start, p.count, mi]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  groups.forEach(([s, c, mi]) => g.addGroup(s, c, mi)); return new THREE.Mesh(g, mats);
}
const m4 = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// ---------------------------------------------------------------- materials
function brickTex() { // herringbone pavers 0.25 x 0.5 m, 16x16 units per 4 m tile, light grout
  return tex.custom('site-brick-herring3', (g, n) => {
    const u = n / 16, R = rngf(77); g.fillStyle = '#cbbfae'; g.fillRect(0, 0, n, n);
    const base = [0x98, 0x5c, 0x4a];
    const br = (x, y, w, h) => { const f = 0.9 + R() * 0.2, f2 = 0.95 + R() * 0.1; g.fillStyle = `rgb(${base[0] * f | 0},${base[1] * f * f2 | 0},${base[2] * f * f2 | 0})`; g.fillRect(x * u + 1.5, y * u + 1.5, w * u - 3, h * u - 3); };
    for (let c = -10; c < 10; c++) for (let k = -20; k < 40; k++) { const ox = c * 4; br(ox + k, k, 2, 1); br(ox + k, k + 1, 1, 2); }
    const R2 = rngf(5); for (let i = 0; i < 9000; i++) { g.fillStyle = R2() < .5 ? '#fff' : '#000'; g.globalAlpha = .04 + R2() * .05; g.fillRect(R2() * n, R2() * n, 2, 2); } g.globalAlpha = 1;
  }, 1024);
}
function hedgeTex() { // dark grey-green shrub band (plan ~ rgb 92,106,75)
  return tex.custom('site-hedge2', (g, n) => {
    g.fillStyle = '#4a5639'; g.fillRect(0, 0, n, n); const R = rngf(31);
    for (let i = 0; i < 3200; i++) { g.fillStyle = ['#5f6e48', '#36402a', '#6c7b52', '#2b3322', '#7d8a62'][(R() * 5) | 0]; g.globalAlpha = .55; g.beginPath(); g.arc(R() * n, R() * n, 2 + R() * 7, 0, 7); g.fill(); } g.globalAlpha = 1;
  });
}
function canopyTex() { // copied from plan tree symbols: faceted disc, yellow-green upper-left (~#a6cf62/#80a858),
  // pale grey-white sun sector lower-right (~#cfd6c8), thin dark branch star, dark rim, dark centre
  return tex.custom('site-canopy5', (g, n) => {
    const c = n / 2, R = rngf(21); g.clearRect(0, 0, n, n);
    const facets = 11, rad = c * .97, pts = []; for (let k = 0; k < facets; k++) { const a = k / facets * 6.283 + .1; const rr = rad * (.94 + R() * .06); pts.push([c + Math.cos(a) * rr, c + Math.sin(a) * rr]); }
    const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    path(); const gr = g.createLinearGradient(c * .2, c * .2, n * .9, n * .9); gr.addColorStop(0, '#b0d866'); gr.addColorStop(.5, '#8fbd56'); gr.addColorStop(.68, '#9cc06a'); gr.addColorStop(.82, '#ccd6c2'); gr.addColorStop(1, '#bcc6b6');
    g.fillStyle = gr; g.fill(); g.save(); path(); g.clip();
    for (let i = 0; i < 700; i++) { const x = R() * n, y = R() * n; const lit = (x + y) / n; g.fillStyle = lit < 1.3 ? ['#7aa84a', '#c2e27a', '#8dbb52', '#6c9640'][(R() * 4) | 0] : ['#e2e7de', '#b8c6a8', '#cbd8b8'][(R() * 3) | 0]; g.globalAlpha = .3; g.beginPath(); g.arc(x, y, 3 + R() * 10, 0, 7); g.fill(); }
    g.globalAlpha = .85; g.strokeStyle = '#2f3d22'; g.lineWidth = 2.5;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + R() * .4; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * rad * .92, c + Math.sin(a) * rad * .92); g.stroke(); }
    g.restore(); g.globalAlpha = 1; g.strokeStyle = '#59614f'; g.lineWidth = 2.5; path(); g.stroke();
    g.fillStyle = '#1f2a16'; g.beginPath(); g.arc(c, c, 6, 0, 7); g.fill();
  });
}
function frondTex() { // feathery pinnate frond with alpha: yellow-green leaflets, dark midrib
  return tex.custom('site-frond3', (g, n) => {
    g.clearRect(0, 0, n, n); const R = rngf(44), cx = n / 2;
    for (let y = n * .02; y < n * .98; y += 5) { const t = y / n, w = Math.sin(Math.PI * t) * n * .46;
      for (const sd of [-1, 1]) { g.strokeStyle = ['#a9c64c', '#c9dc6a', '#86a83a', '#6f8f30'][(R() * 4) | 0]; g.lineWidth = 3.2 + R() * 1.6; g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + sd * w * .5, y - 4, cx + sd * w * (.8 + R() * .2), y + 14 + R() * 10); g.stroke(); } }
    g.strokeStyle = '#4e5e24'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, n); g.stroke();
  }, 256);
}
function blobTex() { return tex.custom('site-blob', (g, n) => { const c = n / 2; const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(20,25,15,.55)'); gr.addColorStop(.6, 'rgba(20,25,15,.35)'); gr.addColorStop(1, 'rgba(20,25,15,0)'); g.clearRect(0, 0, n, n); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 256); }
function waterTex() { // caustic network over faint pool tiles (plan water ~ rgb 120,175,215)
  return tex.custom('site-water3', (g, n) => {
    g.fillStyle = '#6aa6d6'; g.fillRect(0, 0, n, n); const R = rngf(62);
    g.strokeStyle = 'rgba(40,90,150,.25)'; g.lineWidth = 1; for (let i = 0; i <= n; i += n / 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, n); g.moveTo(0, i); g.lineTo(n, i); g.stroke(); }
    for (let i = 0; i < 140; i++) { g.strokeStyle = R() < .7 ? '#d8f0fb' : '#9fd0ee'; g.globalAlpha = .25 + R() * .45; g.lineWidth = 1 + R() * 2.5; g.beginPath(); let x = R() * n, y = R() * n; g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { const x2 = x + (R() - .5) * 90, y2 = y + (R() - .5) * 90; g.quadraticCurveTo(x + (R() - .5) * 60, y + (R() - .5) * 60, x2, y2); x = x2; y = y2; } g.stroke(); }
    g.globalAlpha = 1;
  });
}
function lawnTex() {
  return tex.custom('site-lawn', (g, n) => {
    g.fillStyle = '#5a8143'; g.fillRect(0, 0, n, n); const R = rngf(17);
    for (let i = 0; i < 60; i++) { g.fillStyle = R() < .5 ? '#66904c' : '#4a6f38'; g.globalAlpha = .25; g.beginPath(); g.arc(R() * n, R() * n, 20 + R() * 50, 0, 7); g.fill(); }
    for (let i = 0; i < 20000; i++) { g.fillStyle = R() < .5 ? '#79a35a' : '#476b35'; g.globalAlpha = .3; g.fillRect(R() * n, R() * n, 1, 3); } g.globalAlpha = 1;
  });
}
function turfTex() { // striped green/yellow planting like the plan
  return tex.custom('site-turf', (g, n) => {
    g.fillStyle = '#6f9a2c'; g.fillRect(0, 0, n, n); const R = rngf(9);
    for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? '#86b53a' : '#5a8323'; g.globalAlpha = .35; g.fillRect(R() * n, R() * n, 2, 2); }
    g.globalAlpha = 1; g.strokeStyle = '#d9cf3a'; g.lineWidth = 9;
    for (let k = 0; k < 6; k++) { const y = (k + .5) * n / 6; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= n; x += 16) g.lineTo(x, y + Math.sin(x / 50 + k) * 6 + (R() - .5) * 4); g.stroke(); }
    g.fillStyle = '#222'; g.beginPath(); g.arc(n * .3, n * .52, 6, 0, 7); g.fill();
  });
}
function driveTex() { return tex.custom('site-drive', (g, n) => { g.fillStyle = '#d8d9da'; g.fillRect(0, 0, n, n); const R = rngf(3); for (let i = 0; i < 6000; i++) { g.fillStyle = R() < .5 ? '#e6e7e8' : '#c4c5c7'; g.globalAlpha = .4; g.fillRect(R() * n, R() * n, 2, 2); } g.globalAlpha = 1; }); }

// ---------------------------------------------------------------- build
export function build(ctx) {
  const G0 = L.G;
  const mBrick = mat({ color: '#ffffff', map: brickTex(), tile: 4, rough: .85 });
  const mHedge = mat({ color: '#ffffff', map: hedgeTex(), tile: 2.5, rough: .95 });
  const mLawn = mat({ color: '#ffffff', map: lawnTex(), tile: 6, rough: .95 });
  const mStone = mat({ color: '#ddd6c8', map: tex.plaster('#ddd6c8', 41), tile: 1.5, rough: .8 });
  const mCurb = mat({ color: '#f4f3ef', rough: .6 });
  const mDrive = mat({ color: '#ffffff', map: driveTex(), tile: 3, rough: .85 });
  const mTiles = mat({ color: '#ffffff', map: tex.tiles('#e6e3dc', '#b9b5ad', 4, .03, 51), tile: 2, rough: .7 });
  const mGreyTiles = mat({ color: '#ffffff', map: tex.tiles('#cfd0d0', '#9a9b9c', 4, .04, 52), tile: 2, rough: .7 });
  const mPale = mat({ color: '#ffffff', map: tex.tiles('#efede8', '#d6d3cc', 2, .02, 53), tile: 2, rough: .8 });
  const mBlank = mat({ color: '#ffffff', rough: 1 }); // plan leaves these strips blank (white)
  const mGreyStone = mat({ color: '#ffffff', map: tex.basket('#8f8f8f', 8, 54), tile: 3, rough: .8 });
  const mFill = mat({ color: '#b9b4aa', rough: 1 });
  const mWall = mat({ color: '#e2d2b6', map: tex.plaster('#e2d2b6', 43), tile: 3, rough: .9 });
  const mCap = mat({ color: '#8f8b84', rough: .7 });
  const mAsphalt = mat({ color: '#ffffff', map: tex.custom('site-asphalt', (g, n) => { g.fillStyle = '#56585b'; g.fillRect(0, 0, n, n); const R = rngf(8); for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? '#6a6c70' : '#46484b'; g.fillRect(R() * n, R() * n, 2, 2); } }), tile: 4, rough: .95 });
  const mSidewalk = mat({ color: '#ffffff', map: tex.tiles('#cfc6b4', '#a59c8a', 4, .05, 55), tile: 1.6, rough: .85 });
  const mGate = mat({ color: '#3b3632', rough: .45, metal: .6 });

  const flat = (pts, y, m) => ctx.poly(pts, y, m);

  const slab = (pts, top, h, mats) => ctx.poly(pts, top, mats, { thick: h });

  // ---------- holes (sunken courts / ramp owned by other pieces)
  const HOLES = [
    [16.9, 14.6, 26.9, 23.8], [16.9, 23.8, 24.06, 30.2], // b_men sunken patio + pool terrace (open to sky)
    [24, 23.5, 27.3, 33.5],  // men patio light-well (X on the ground plan)
    [24, 39, 28.3, 40.5],    // men-patio stair opening at grade
    [5, 0.5, 17, 5],         // b_garage car ramp
    [34.5, 0, 49, 15],       // b_wellness pool court
  ];
  const HOUSE = [
    [7.3, 3.8, 34.5, 14.6], [22, 2.1, 29.5, 3.8], [29.5, 0, 34.5, 3.8], [7.3, 14.6, 17, 20],
    [27, 14.6, 47.1, 25.7], [27, 25.7, 44.2, 33.5], [24, 33.5, 35.9, 39.23], [35.9, 33.5, 46.9, 40.95], [46.4, 21, 48.2, 25.7],
  ];
  // other grade surfaces (not brick)
  const DRIVE = [[1.5, 5, 5.75, 25], [0, 17.1, 1.5, 19.8], [5, 0, 17, 0.5]];
  const TILES = [[7.3, 20, 17, 23.5], [11.8, 23.5, 17, 26.1]];
  const GREYT = [[16.9, 30.2, 24.06, 31.75]];
  const PALE = [[17, 0, 22, 3.8], [22, 0, 29.5, 2.1]];
  const BLANK = [[44.2, 25.7, 49, 33.5], [46.9, 33.5, 49, 47], [48.2, 21, 49, 25.7]];
  const GSTONE = [[47.1, 15, 49, 21]];
  const SPECIAL = [[0, 0, 5, 5], [0, 44.8, 2.2, 47]];

  // under-house / gap fill (slightly below grade so room floors at 0 never fight)
  freeRects([0, 0, 49, 47], [...HOLES, [0, 44.8, 2.2, 47]]).forEach((r) => flat(R4(...r), G0 - 0.04, mFill));
  ctx.poly([[0, 44.8], [2.2, 47], [2.2, 44.8]].reverse(), G0 - 0.04, mFill);

  // brick everywhere that is outdoors and not something else
  freeRects([0, 0, 49, 47], [...HOLES, ...HOUSE, ...DRIVE, ...TILES, ...GREYT, ...PALE, ...BLANK, ...GSTONE, ...SPECIAL]).forEach((r) => flat(R4(...r), G0, mBrick));
  flat([[0, 44.8], [2.2, 44.8], [2.2, 47]], G0, mBrick);
  DRIVE.forEach((r) => flat(R4(...r), G0, mDrive));
  TILES.forEach((r) => flat(R4(...r), G0, mTiles));
  GREYT.forEach((r) => flat(R4(...r), G0, mGreyTiles));
  PALE.forEach((r) => flat(R4(...r), G0, mPale));
  BLANK.forEach((r) => flat(R4(...r), G0, mBlank));
  GSTONE.forEach((r) => flat(R4(...r), G0, mGreyStone));

  // NW corner: curved driveway (circle C(7.2,5.8) r5.7) + brick band + small walled service yard
  const C0 = [7.2, 5.8], RD = 5.7;
  const arcNW = []; { const a0 = Math.atan2(0.54 - C0[1], 5 - C0[0]), a1 = Math.atan2(5 - C0[1], 1.56 - C0[0]); for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24; arcNW.push([C0[0] + RD * Math.cos(a), C0[1] + RD * Math.sin(a)]); } }
  // arcNW runs from (5,0.54) anticlockwise-in-plan to (1.56,5)
  flat([[1.5, 5], [5, 5], ...arcNW], G0, mDrive);
  curbLine(arcNW, false, 0.06, 0.15, mat({ color: '#a7a6a2', rough: .7 })); // soft mid-grey kerb (plan)
  flat([[0, 3.1], [1.6, 3.1], [3.25, 1.4], [3.25, 0], [5, 0], ...arcNW, [1.5, 5], [0, 5]], G0, mBrick);
  flat([[0, 0], [3.25, 0], [3.25, 1.4], [1.6, 3.1], [0, 3.1]], G0 + 0.005, mPale);
  ctx.wall(3.25, 0.1, 3.25, 1.4, { h: 2.4, t: 0.22, m: mWall });
  ctx.wall(3.25, 1.4, 1.6, 3.1, { h: 2.4, t: 0.22, m: mWall });
  ctx.wall(1.6, 3.1, 0.1, 3.1, { h: 2.4, t: 0.22, m: mWall, openings: [{ at: 0.8, w: 0.9, h: 2.1, door: { color: '#5a5048', swing: -1, open: 0.5 } }] });

  // ---------- curbs: thin white boxes along a polyline
  function curbLine(pts, closed = true, top = 0.18, w = 0.1, m = mCurb) {
    const n = pts.length, segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % n]; const len = Math.hypot(bx - ax, bz - az); if (len < 0.02) continue;
      ctx.boxC((ax + bx) / 2, top / 2, (az + bz) / 2, len + w * 0.6, top, w, m, Math.atan2(-(bz - az), bx - ax));
    }
  }
  // raised planter: dark ground-cover band (outer) with an inner lawn bordered by a white curb
  function planter(outer, inner, h = 0.15, lawn = mLawn) {
    slab(outer, G0 + h, h, [mHedge, mStone]);
    if (inner) { flat(inner, G0 + h + 0.006, lawn); curbLine(inner, true, h + 0.05, 0.1); }
  }

  // ---------- planters & lawns
  // SW garden: lawn edge, band 2 and the sliver are concentric arcs around one centre (fitted to the plan grid)
  const CC = [19.5, 26.0];
  const arcX = (r, x0, x1, n = 40) => arcByX(CC[0], CC[1], r, x0, x1, n);
  // big curved lawn (SW): NE edge = arc r15.0, white kerb = arc r15.9
  planter([[1.5, 35.1], [6.75, 33.9], ...arcX(15.0, 6.9, 20.4), [20.4, 45.6], [3.9, 45.6], [1.5, 43.2]],
    [[2.5, 36.0], [6.6, 35.25], ...arcX(15.9, 6.75, 19.9), [19.9, 44.5], [4.1, 44.5], [2.5, 42.8]], 0.14);
  // trapezoid planter (west)
  planter([[1.5, 26.5], [5.9, 26.5], [6.9, 32.6], [1.5, 32.6]], [[2.4, 27.5], [4.9, 27.5], [5.75, 32.0], [2.4, 32.0]], 0.16,
    mat({ color: '#ffffff', map: tex.custom('site-lawn-pale', (g, n) => { g.fillStyle = '#6f8f5c'; g.fillRect(0, 0, n, n); const R = rngf(4); for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? '#8aa877' : '#5a7a48'; g.globalAlpha = .35; g.fillRect(R() * n, R() * n, 2, 3); } }), tile: 3, rough: .95 }));
  // curved band 1 (crescent between front court and the big walk): east edge + kerb are arcs around the pool centre
  { const PC = [18.05, 27.56], arcZ = (r, z0, z1, n = 30) => arcByZ(PC[0], PC[1], r, z0, z1, n, -1);
    const east = arcZ(7.0, 23.45, 31.0);
    slab([[7.3, 23.45], ...east, [10.9, 31.6], [8.3, 31.95], [7.75, 31.3], [7.4, 30.0]], G0 + 0.17, 0.17, [mHedge, mStone]);
    const curb = arcZ(8.8, 23.9, 31.4), eIn = arcZ(7.25, 23.9, 30.9);
    flat([...curb, [10.75, 31.35], ...eIn.slice().reverse()], G0 + 0.176, mLawn);
    curbLine(curb, false, 0.22, 0.09); }
  // curved band 2 (south of the pool): NE edge arc r10.4, SW edge arc r12.5, kerb r11.6, lawn strip r11.6-12.25
  slab([...arcX(10.4, 11.6, 20.9), ...arcX(12.5, 20.9, 9.3)], G0 + 0.15, 0.15, [mHedge, mStone]);
  { const k = arcX(11.6, 10.3, 20.6), o = arcX(12.25, 20.6, 9.75); flat([...k, ...o], G0 + 0.156, mLawn); curbLine(k, false, 0.2, 0.09); }
  // dark planting sliver between pool and band 2 (arc r9.0-9.3)
  slab([...arcX(9.0, 14.3, 18.4, 16), ...arcX(9.3, 18.4, 14.0, 16)], G0 + 0.1, 0.1, [mHedge, mStone]);
  // front court planter with shrubs
  planter(R4(8.2, 21.3, 13.2, 22.5), R4(8.45, 21.5, 12.95, 22.3), 0.35);
  // east L planter beside the men-patio stair
  planter([[22.6, 33.5], [24.0, 33.5], [24.0, 40.5], [28.4, 40.5], [28.4, 42.5], [22.6, 42.5]],
    [[22.8, 33.8], [23.8, 33.8], [23.8, 40.7], [28.2, 40.7], [28.2, 42.3], [22.8, 42.3]], 0.2);
  // south boundary planters
  planter(R4(22.0, 44.3, 33.2, 46.75), R4(22.6, 44.6, 32.6, 46.6), 0.3);
  planter(R4(35.9, 42.8, 46.9, 46.75), R4(36.3, 43.2, 46.5, 46.5), 0.3);
  // tiny courtyard lawn between woman saloon and entrance (open to the sky)
  flat(R4(7.4, 12.6, 9.25, 15.5), G0 + 0.012, mHedge);

  // ---------- fountain pool (raised basin) + striped planting
  const poolPts = (ins) => {
    const r = 6.13 - ins, C = [18.05, 27.56]; const zt = 26.05 + ins, xr = 16.8 - ins;
    const zb = C[1] + Math.sqrt(r * r - (xr - C[0]) ** 2); const xt = C[0] - Math.sqrt(r * r - (zt - C[1]) ** 2);
    const a0 = Math.atan2(zb - C[1], xr - C[0]), a1 = Math.atan2(zt - C[1], xt - C[0]) + 2 * Math.PI * 0;
    const arc = []; let A1 = a1; if (A1 < a0) A1 += 2 * Math.PI; for (let i = 0; i <= 30; i++) { const a = a0 + (A1 - a0) * i / 30; arc.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]); }
    return [[13.95 - ins, zt], [14.75 - ins, 30.3 - ins], [xr, 30.3 - ins], ...arc];
  };
  // ring = outer minus inner as two extrusions (ring via holes)
  const mCope = mat({ color: '#4d5862', rough: .5 });
  curbLine(poolPts(0.07), true, 0.42, 0.14, mCope); // dark coping wall (built as segments: the holed extrusion mis-triangulated)
  const mPoolFloor = mat({ color: '#ffffff', map: tex.mosaic(['#3f9fdc', '#56b2e8', '#3590d2', '#6cc2ee'], 24, 61), tile: 1, rough: .3 });
  flat(poolPts(0.12), G0 + 0.02, mPoolFloor);
  // opaque-looking water, colour sampled from the plan (~#78aed6) with ripple texture
  flat(poolPts(0.12), G0 + 0.34, mat({ color: '#ffffff', map: waterTex(), tile: 2.5, rough: .4, key: 'site-water3' }));
  curbLine(poolPts(0.19), true, 0.425, 0.1, mat({ color: '#ffffff', map: tex.tiles('#e9eef0', '#aab4ba', 8, .02, 63), tile: .8, rough: .5 })); // light tiled rim inside the dark edge
  // dark internal divider walls (shallow bench lane along the turf): slanted west wall, cross wall, south wall of the lane
  { const dw = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az); ctx.boxC((ax + bx) / 2, G0 + 0.19, (az + bz) / 2, len, 0.38, 0.1, mCope, Math.atan2(-(bz - az), bx - ax)); };
    dw(12.55, 26.1, 13.42, 30.3); dw(12.98, 28.25, 14.4, 28.25); dw(13.4, 30.3, 16.75, 30.3); }
  // striped turf/planting bed east of the pool (slanted west edge, white border)
  { const tp = [[14.05, 26.05], [16.75, 26.05], [16.75, 30.22], [14.85, 30.22]];
    ctx.poly(tp, G0 + 0.4, [mat({ color: '#ffffff', map: turfTex(), tile: 4.2, rough: .95, key: 'site-turf2' }), mStone], { thick: 0.4 });
    curbLine(tp, true, 0.44, 0.08); }
  // little white planter cap at the pool's north tip (plan: pale block at x 12.3-13.7, z 23.6-24.4)
  ctx.poly([[12.0, 23.55], [13.7, 23.55], [14.1, 26.0], [13.0, 26.0], [12.2, 25.0]], G0 + 0.45, [mCurb, mStone], { thick: 0.45 });

  // ---------- front court furniture: outdoor table + 4 chairs
  { const tm = mat({ color: '#f2f1ec', rough: .4 }); ctx.box(14.25, G0 + 0.72, 23.1, 16.15, G0 + 0.76, 23.7, tm, { collide: true });
    ctx.box(14.4, G0 + 0.761, 23.36, 16.0, G0 + 0.766, 23.44, mat({ color: '#c8322b', rough: .5 }));
    [[14.4, 23.2], [16.0, 23.2], [14.4, 23.6], [16.0, 23.6]].forEach(([x, z]) => ctx.box(x - .03, G0, z - .03, x + .03, G0 + 0.72, z + .03, M.steel()));
    const ch = (x, z, ry) => ctx.place(F.chair({ color: '#f4f2ee', frame: '#d9d6cf' }), x, G0, z, ry, { collide: true });
    ch(14.7, 22.55, 0); ch(15.8, 22.55, 0); ch(14.7, 24.25, Math.PI); ch(15.8, 24.25, Math.PI); }

  // ---------- trees, palms, shrubs (merged single meshes so their plan-view bbox starts at grade)
  const mTrunk = mat({ color: '#6b4f36', rough: .9 });
  const mLeafA = mat({ color: '#5f9e34', rough: .8 }), mLeafB = mat({ color: '#8dbf4e', rough: .75 }), mLeafC = mat({ color: '#4d8a2a', rough: .85 });
  const mFrond = mat({ color: '#ffffff', map: frondTex(), rough: .8, side: THREE.DoubleSide, key: 'site-frondA' }), mFrond2 = mat({ color: '#e4edc4', map: frondTex(), rough: .8, side: THREE.DoubleSide, key: 'site-frondB' });
  [mFrond, mFrond2].forEach((m) => { m.alphaTest = .45; m.transparent = false; });
  const ico = new THREE.IcosahedronGeometry(1, 2), cylT = new THREE.CylinderGeometry(.11, .17, 1, 8);
  let seed = 11;
  const discGeo = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
  const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const mCanopy = mat({ color: '#ffffff', map: canopyTex(), rough: .85, key: 'site-canopy5' }); mCanopy.alphaTest = .5;
  const mUnder = mat({ color: '#88b552', rough: .85 });
  const mBlob = mat({ color: '#ffffff', map: blobTex(), transparent: true, rough: 1, key: 'site-blob' }); mBlob.depthWrite = false;
  function tree(x, z, r = 1, base = 0) {
    const R = rngf(seed += 7); const parts = [];
    parts.push({ geo: cylT, mi: 0, m4: m4(0, 1.1, 0, .65, 2.2, .65) });
    const rr = 0.875 * (0.9 + R() * 0.2) * (r < .85 ? .92 : 1), ry = R() * 6.28; // 1.6-1.9 m canopies (plan)
    // umbrella canopy: pale underside dome + flat radial top disc (plan symbol: spokes + white rim)
    parts.push({ geo: ico, mi: 1, m4: m4(0, 2.55, 0, rr * .98, rr * .7, rr * .98) });
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + R(); parts.push({ geo: ico, mi: 1, m4: m4(Math.cos(a) * rr * .45, 2.35, Math.sin(a) * rr * .45, rr * .55, rr * .5, rr * .55) }); }
    parts.push({ geo: discGeo, mi: 2, m4: m4(0, 2.55 + rr * .71, 0, rr, 1, rr, 0, ry, 0) });
    const mesh = merged(parts, [mTrunk, mUnder, mCanopy]); mesh.position.set(x, G0 + base, z); ctx.add(mesh);
    const sh = new THREE.Mesh(blobGeo, mBlob); sh.scale.set(rr * 2.4, 1, rr * 2.4); sh.position.set(x - rr * .35, G0 + base + .012, z + rr * .3); // plan: soft shadow to the lower-left sh.renderOrder = 2; ctx.add(sh, { walk: false, cast: false });
    ctx.cyl(x, G0 + base, z, 0.18, 1.5, mTrunk, 8, { collide: true }).visible = false;
  }
  const frondGeo = (() => { const g = new THREE.PlaneGeometry(.95, 2.6, 1, 6); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 1.3; const w = Math.sin(Math.PI * y / 2.6) * 1.1 + .1; p.setX(k, p.getX(k) * w); p.setY(k, y); p.setZ(k, -0.13 * y * y); } g.computeVertexNormals(); return g; })();
  function palm(x, z, h = 6, base = 0, n = 12, scale = 1) {
    const R = rngf(seed += 13); const parts = [{ geo: new THREE.CylinderGeometry(.14 * scale, .24 * scale, h, 10), mi: 0, m4: m4(0, h / 2, 0) }];
    for (let i = 0; i < n; i++) { const ry = i / n * Math.PI * 2 + R() * .3, tilt = -Math.PI / 2 + .45 + R() * .35;
      const mm = new THREE.Matrix4().makeTranslation(0, h, 0).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeRotationX(tilt)).multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
      parts.push({ geo: frondGeo, mi: i % 3 ? 1 : 2, m4: mm }); }
    parts.push({ geo: discGeo, mi: 3, m4: m4(0, h + .05, 0, .28 * scale, 1, .28 * scale) }); // dark crown centre
    const mesh = merged(parts, [mat({ color: '#8a6d4b', rough: .95 }), mFrond, mFrond2, mat({ color: '#3b4a22', rough: .9 })]); mesh.position.set(x, G0 + base, z); ctx.add(mesh);
    const sh = new THREE.Mesh(blobGeo, mBlob); const d = 4.6 * scale; sh.scale.set(d, 1, d); sh.position.set(x - .45 * scale, G0 + base + .013, z + .4 * scale); sh.renderOrder = 2; ctx.add(sh, { walk: false, cast: false });
  }
  function shrub(x, z, r = .5, base = 0) {
    const R = rngf(seed += 5); const parts = []; for (let i = 0; i < 4; i++) parts.push({ geo: ico, mi: i % 2, m4: m4((R() - .5) * r, r * .6 + R() * r * .3, (R() - .5) * r, r * .6, r * .55, r * .6) });
    const mesh = merged(parts, [mLeafA, mLeafB]); mesh.position.set(x, G0 + base, z); ctx.add(mesh);
  }
  // round-canopy trees exactly where the plan's circles are
  [[8.1, 14.2, .85, 0],
    [8.3, 24.8, 1.1, .17], [10.8, 24.2, 1.2, .17], [10.0, 27.3, .9, .17], [8.25, 28.2, 1.0, .17], [9.2, 30.2, 1.2, .17],
    [11.4, 33.9, 1.0, .15], [12.8, 35.7, 1.0, .15], [14.25, 36.3, 1.15, .15], [17.7, 37.6, .9, .15], [19.5, 37.4, 1.1, .15],
    [2.1, 37.4, 1.1, .14], [1.9, 42.0, 1.1, .14], [7.25, 34.6, 1.0, .14], [8.6, 37.3, 1.0, .14], [5.5, 38.4, .9, .14], [4.25, 39.25, .8, .14],
    [12.0, 39.4, .95, .14], [15.75, 40.9, .85, .14], [5.4, 44.75, 1.1, .14], [11.0, 45.0, 1.1, .14], [17.0, 44.9, 1.1, .14],
    [22.9, 34.3, .8, .2], [23.0, 36.5, .8, .2], [23.0, 38.6, .8, .2], [22.9, 41.4, .9, .2], [26.4, 41.4, 1.1, .2],
    [23.25, 45.5, .75, .3], [31.4, 45.5, .75, .3], [41.25, 45.0, 1.1, .3], [44.4, 45.0, 1.1, .3],
  ].forEach(([x, z, r, b]) => tree(x, z, r, b));
  palm(20.0, 34.9, 4.2, 0, 12, .72); palm(24.7, 46.0, 3.2, .3, 11, .55); palm(26.3, 46.2, 3.6, .3, 11, .58); palm(28.1, 45.7, 3.4, .3, 11, .6); palm(29.6, 46.15, 3.0, .3, 11, .55); palm(37.5, 44.6, 3.6, .3, 12, .62);
  palm(3.6, 29.2, 2.6, .16, 9, .6); palm(4.3, 29.9, 2.2, .16, 9, .55); palm(3.4, 30.2, 1.9, .16, 8, .5); // multi-stem cluster
  [[9.4, 22.0, .45], [10.2, 21.8, .55], [10.9, 21.6, .5], [11.6, 21.95, .5], [12.4, 21.8, .4]].forEach(([x, z, r]) => shrub(x, z, r, .35));
  [[16.9, 43.1, .45], [17.6, 42.9, .5], [18.3, 42.7, .45]].forEach(([x, z, r]) => shrub(x, z, r, .14));

  // ---------- car pergola with red car
  { const mW = mat({ color: '#f6f6f3', rough: .5 });
    [[1.65, 21.5], [5.6, 21.5], [1.65, 24.8], [5.6, 24.8]].forEach(([x, z]) => ctx.box(x - .09, G0, z - .09, x + .09, G0 + 2.35, z + .09, mW, { collide: true }));
    [21.5, 24.8].forEach((z) => ctx.box(1.4, G0 + 2.25, z - .08, 5.85, G0 + 2.42, z + .08, mW));
    [1.63, 2.44, 2.94, 3.44, 3.94, 4.44, 4.94, 5.63].forEach((x) => ctx.box(x - .05, G0 + 2.42, 21.2, x + .05, G0 + 2.55, 25.05, mW));
    // pale slab under the pergola with a dark edge (plan)
    flat(R4(1.5, 21.2, 5.75, 25.2), G0 + 0.006, mat({ color: '#e4e3e0', rough: .8 }));
    const car = F.car({ color: '#9c4a36', len: 3.5, w: 1.3 }); ctx.place(car, 2.58, G0, 23.35, 0, { collide: true }); }

  // ---------- boundary walls (beige render, 2.4 m, pilasters, gates)
  const WH = 2.4, WT = 0.25;
  const bw = (x1, z1, x2, z2, openings = []) => ctx.wall(x1, z1, x2, z2, { h: WH, t: WT, off: -WT / 2, m: mWall, openings });
  bw(0, 0, 49, 0);
  bw(49, 0, 49, 21); bw(49, 21, 47, 21); bw(47, 21, 47, 47); // east boundary steps in to x47 south of the kitchen (plan: blank beyond)
  bw(47, 47, 2.2, 47, [{ at: 47 - 28.2, w: 1.2, h: 2.2, door: { color: '#4a423b', swing: -1, open: 0.9 } }]);
  bw(2.2, 47, 0, 44.8);
  // west wall (south -> north): vehicle gate z 17.1-19.8, pedestrian gate z ~7.6
  bw(0, 44.8, 0, 0, [{ at: 44.8 - 18.45, w: 2.7, h: WH }, { at: 44.8 - 7.6, w: 1.0, h: 2.2, door: { color: '#4a423b', swing: 1, open: 1.0 } }]);
  // coping on top of the walls + pilasters
  const caps = [[0, 0, 49, 0], [49, 0, 49, 21], [49, 21, 47, 21], [47, 21, 47, 47], [47, 47, 2.2, 47], [2.2, 47, 0, 44.8], [0, 44.8, 0, 19.8], [0, 17.1, 0, 0]];
  caps.forEach(([x1, z1, x2, z2]) => { const len = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / len, uz = (z2 - z1) / len, nx = uz, nz = -ux, o = -WT / 2;
    const cx = (x1 + x2) / 2 + nx * o, cz = (z1 + z2) / 2 + nz * o, ry = Math.atan2(-(z2 - z1), x2 - x1);
    ctx.boxC(cx, G0 + WH + 0.04, cz, len, 0.08, WT + 0.08, mCap, ry);
    });
  // rounded gate piers + open steel gate leaves (swing inwards)
  [17.1, 19.8].forEach((z) => { ctx.cyl(0.05, G0, z, 0.4, 2.7, mWall, 24, { collide: true }); ctx.cyl(0.05, G0 + 2.7, z, 0.46, 0.08, mCap, 24); });
  { const leaf = (hz, dir) => { const g = new THREE.Group(); const w = 1.3; for (let i = 0; i <= 10; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.04, 2.1, .04), mGate); b.position.set(i * w / 10, 1.15, 0); g.add(b); }
      [0.15, 1.1, 2.15].forEach((y) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, .07, .06), mGate); r.position.set(w / 2, y, 0); g.add(r); });
      g.position.set(0.15, G0, hz); g.rotation.y = dir * 1.15; ctx.add(g); };
    leaf(17.4, 1); leaf(19.5, -1); }

  // ---------- street outside the west gate
  flat([[-2.6, -6], [0, -6], [0, 53], [-2.6, 53]], G0 + 0.0, mSidewalk);
  ctx.box(-2.75, G0 - .2, -6, -2.6, G0 + .0, 53, mStone);
  flat([[-12, -6], [-2.75, -6], [-2.75, 53], [-12, 53]], G0 - 0.15, mAsphalt);
  for (let z = -4; z < 52; z += 6) ctx.box(-7.5, G0 - .149, z, -7.3, G0 - .145, z + 3, mat({ color: '#f2f0e8', rough: .6 }));
  // gate apron: driveway continues across the pavement
  flat([[-2.6, 17.1], [0, 17.1], [0, 19.8], [-2.6, 19.8]], G0 + 0.004, mDrive);
}
