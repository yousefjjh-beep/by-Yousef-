// Piece: f_south — first floor south wing: bedroom two (+bath), master suite (dressing, bath, hall, bedroom 1,
// living room), bedroom 2, bedroom three suite (hall/dressing, bath, living, bedroom), corridor, south terrace, roof.
import { L, tex, mat, M, F, THREE } from '../lib.js';

export const rooms = [
  { name: 'Master suite living', level: 'F', x: 36.8, z: 35.0, yaw: Math.PI * 0.75 },
  { name: 'Bedroom two', level: 'F', x: 29.8, z: 24.6, yaw: Math.PI * 0.8 },
  { name: 'Bedroom 1 (master)', level: 'F', x: 30.0, z: 34.4, yaw: Math.PI * 0.75 },
  { name: 'Bedroom three suite', level: 'F', x: 38.6, z: 25.0, yaw: -Math.PI * 0.6 },
];
export const views = [
  { name: 'master living room from NE', level: 'F', x: 37.2, z: 34.4, yaw: 140, pitch: -10, fov: 70 },
  { name: 'bedroom two from passage', level: 'F', x: 30.3, z: 24.3, yaw: 120, pitch: -12, fov: 70 },
  { name: 'bedroom three living to bedroom', level: 'F', x: 38.3, z: 33.2, yaw: -40, pitch: -8, fov: 70 },
  { name: 'master bathroom', level: 'F', x: 30.4, z: 31.1, yaw: 75, pitch: -12, fov: 72 },
];

const Y = L.F, CEIL = 7.6, WH = CEIL - Y;

export function build(ctx) {
  // ---------------------------------------------------------------- materials
  const woodTex = (key, base, seed) => tex.custom(key, (g, n) => {
    let s = seed; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); const boards = 8, w = n / boards;
    for (let i = 0; i < boards; i++) { const k = .975 + R() * .05; g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; g.fillRect(i * w, 0, w, n);
      // visible grain stripes running along the planks
      for (let j = 0; j < 7; j++) { g.globalAlpha = .10 + R() * .12; g.fillStyle = R() < .6 ? '#d8bea0' : '#fff6ea'; const x = i * w + R() * w; g.fillRect(x, 0, 1 + R() * 3, n); }
      g.globalAlpha = 1; g.fillStyle = '#d6bc9c'; g.fillRect(i * w, 0, 1.5, n); g.fillRect(i * w, R() * n, w, 1.2); }
  });
  const woodFloor = mat({ color: '#ffffff', map: woodTex('fs_wood2', [232, 216, 198], 41), tile: 1.8, rough: .55 });
  const blushWood = mat({ color: '#ffffff', map: woodTex('fs_wood_blush', [238, 221, 208], 43), tile: 1.8, rough: .55 });
  const pinkFloor = mat({ color: '#ffffff', map: tex.custom('fs_pink', (g, n) => { g.fillStyle = 'rgb(226,207,199)'; g.fillRect(0, 0, n, n); let s = 9; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); for (let i = 0; i < 2500; i++) { g.globalAlpha = .08; g.fillStyle = R() < .5 ? '#f0dcd2' : '#d0b8ae'; g.fillRect(R() * n, R() * n, 6, 6); } g.globalAlpha = 1; }, 256), tile: 3, rough: .8 });
  const bathTile = mat({ color: '#ffffff', map: tex.custom('fs_btile', (g, n) => { g.fillStyle = '#4c5154'; g.fillRect(0, 0, n, n); const c = 4, s = n / c; for (let i = 0; i < c; i++) for (let j = 0; j < c; j++) { g.fillStyle = (i + j) % 3 ? '#fcfcfb' : '#f3f4f4'; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); } }, 256), tile: 1.2, rough: .25 });
  // fine brick herringbone (blocks 0.5 x 0.25 m at 45°), muted taupe with thin darker grout. Canvas period = 2*sqrt2*u.
  const herring = mat({ color: '#ffffff', map: tex.custom('fs_herr2', (g, n) => {
    g.fillStyle = '#8c7762'; g.fillRect(0, 0, n, n); const sc = n / (2 * Math.SQRT2); let q = 17; const R = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296);
    const cols = ['#c6b098', '#bea78f', '#c9b49d', '#b9a28a', '#c2ab93']; const gr = .045;
    g.save(); g.translate(0, 0); g.rotate(Math.PI / 4); g.scale(sc, sc);
    for (let k = -12; k < 12; k++) for (let m = -8; m < 8; m++) {
      const x = k + 2 * m, y = k - 2 * m;
      g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(x + gr, y + gr, 2 - 2 * gr, 1 - 2 * gr);
      g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(x - 1 + gr, y + gr, 1 - 2 * gr, 2 - 2 * gr);
    }
    g.restore();
  }, 512), tile: 0.25 * 2 * Math.SQRT2, rough: .8 });
  const terraceM = mat({ color: '#ffffff', map: tex.tiles('#dcdad4', '#b4b0a8', 4, .03, 45), tile: 2.4, rough: .8 });
  const plaster = mat({ color: '#f4eee5', map: tex.plaster('#f4eee5', 46), tile: 2, rough: .9 });
  const pinkWall = mat({ color: '#f5e6df', map: tex.plaster('#f5e6df', 47), tile: 2, rough: .9 });
  const wallTile = mat({ color: '#ffffff', map: tex.tiles('#f7f7f5', '#c9cacb', 3, .015, 48), tile: 1.2, rough: .2 });
  const ext = M.extStone();
  const ceilM = M.ceiling();
  const roofM = mat({ color: '#d8d2c6', map: tex.plaster('#d8d2c6', 49), tile: 3, rough: .95 });
  const skirtM = mat({ color: '#e6dccd', rough: .5 });
  const blueSill = mat({ color: '#3fa9ef', emissive: '#2f8fd8', emissiveIntensity: .35, rough: .3, key: 'fs_bluesill' });
  const curtainM = mat({ color: '#ffffff', map: tex.carpet('#e8dfcf', 50), tile: .5, rough: 1 });
  const doorC = '#7a5a3e';
  const brownSofa = '#9c8a74', cream = '#e3d5b4';

  // ---------------------------------------------------------------- helpers
  const glassLine = (x1, z1, x2, z2, a, b, off = 0) => { // blue sill strip to read as glazing in plan
    { const l0 = Math.hypot(x2 - x1, z2 - z1), nx = (z2 - z1) / l0, nz = -(x2 - x1) / l0; x1 += nx * off; x2 += nx * off; z1 += nz * off; z2 += nz * off; }
    const len = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / len, uz = (z2 - z1) / len;
    const p = (s) => [x1 + ux * s, z1 + uz * s];
    const [ax, az] = p(a), [bx_, bz] = p(b);
    const t = 0.2; ctx.box(Math.min(ax, bx_) - (uz ? t / 2 : 0), Y, Math.min(az, bz) - (ux ? t / 2 : 0), Math.max(ax, bx_) + (uz ? t / 2 : 0), Y + 0.04, Math.max(az, bz) + (ux ? t / 2 : 0), blueSill);
  };
  // interior wall centred on the line
  const wl = (x1, z1, x2, z2, o = {}) => ctx.wall(x1, z1, x2, z2, { y0: Y, h: WH, t: o.t ?? 0.15, m: plaster, ...o });
  // exterior wall: travel so the interior is on the LEFT; wall body sits outside the line. glass: [[a,b],...]
  const ext_ = (x1, z1, x2, z2, glass = [], { inner = plaster, parapet = true, t = 0.25 } = {}) => {
    const openings = glass.map(([a, b]) => ({ at: (a + b) / 2, w: b - a, y0: 0, h: 3.0, glass: true }));
    ctx.wall(x1, z1, x2, z2, { y0: Y, h: WH, t, off: -t / 2, mA: ext, mB: inner, openings });
    glass.forEach(([a, b]) => glassLine(x1, z1, x2, z2, a, b, -t / 2));
    if (parapet) ctx.wall(x1, z1, x2, z2, { y0: CEIL, h: 1.4, t, off: -t / 2, m: ext, collide: false });
  };
  const floor = (x0, z0, x1, z1, m) => ctx.rect(x0, z0, x1, z1, Y, m);
  const ceiling = (x0, z0, x1, z1) => ctx.rect(x0, z0, x1, z1, CEIL - 0.005, ceilM, { up: false });
  const lights = (x0, z0, x1, z1, nx, nz, y = CEIL) => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ctx.downlight(x0 + (x1 - x0) * (i + .5) / nx, z0 + (z1 - z0) * (j + .5) / nz, y, .07); };
  // dropped-ceiling border with a glowing cove line (all above the plan cut)
  const coveM = mat({ color: '#fff4dc', emissive: '#ffe6b8', emissiveIntensity: 1.1, key: 'fs_cove' });
  const cove = (x0, z0, x1, z1, b = 0.55) => {
    const y0 = CEIL - 0.28;
    ctx.box(x0, y0, z0, x1, CEIL, z0 + b, ceilM); ctx.box(x0, y0, z1 - b, x1, CEIL, z1, ceilM);
    ctx.box(x0, y0, z0 + b, x0 + b, CEIL, z1 - b, ceilM); ctx.box(x1 - b, y0, z0 + b, x1, CEIL, z1 - b, ceilM);
    const e = 0.03; ctx.box(x0 + b, y0, z0 + b, x1 - b, y0 + e, z0 + b + e, coveM); ctx.box(x0 + b, y0, z1 - b - e, x1 - b, y0 + e, z1 - b, coveM);
    ctx.box(x0 + b, y0, z0 + b, x0 + b + e, y0 + e, z1 - b, coveM); ctx.box(x1 - b - e, y0, z0 + b, x1 - b, y0 + e, z1 - b, coveM);
    lights(x0 + b / 2, z0 + b / 2, x1 - b / 2, z0 + b / 2 + .01, Math.max(2, Math.round((x1 - x0) / 1.6)), 1, y0);
    lights(x0 + b / 2, z1 - b / 2, x1 - b / 2, z1 - b / 2 + .01, Math.max(2, Math.round((x1 - x0) / 1.6)), 1, y0);
  };
  const skirt = (x0, z0, x1, z1, inset = 0.08) => {
    const h = 0.1, t = 0.015;
    ctx.box(x0 + inset, Y, z0 + inset, x1 - inset, Y + h, z0 + inset + t, skirtM); ctx.box(x0 + inset, Y, z1 - inset - t, x1 - inset, Y + h, z1 - inset, skirtM);
    ctx.box(x0 + inset, Y, z0 + inset, x0 + inset + t, Y + h, z1 - inset, skirtM); ctx.box(x1 - inset - t, Y, z0 + inset, x1 - inset, Y + h, z1 - inset, skirtM);
  };
  const place = (obj, x, z, ry = 0, opts = {}) => ctx.place(obj, x, Y, z, ry, opts);
  const curtains = (x, z, alongX, len) => { // two curtain stacks at the ends of a window
    const w = 0.35, d = 0.1;
    for (const s of [0, 1]) {
      const c = alongX ? [x + (s ? len - w : 0) + w / 2, z] : [x, z + (s ? len - w : 0) + w / 2];
      ctx.boxC(c[0], (Y + 0.25 + CEIL - 0.12) / 2, c[1], alongX ? w : d, CEIL - 0.12 - Y - 0.25, alongX ? d : w, curtainM);
    }
  };

  // wardrobe with "hanger" plan symbol on top (like the plan's white zig-zag boxes)
  const hangerTex = (vertical) => tex.custom('fs_hanger' + (vertical ? 'V' : 'H'), (g, n) => {
    g.fillStyle = '#fbfbf9'; g.fillRect(0, 0, n, n);
    g.save(); if (vertical) { g.translate(n, 0); g.rotate(Math.PI / 2); }
    g.strokeStyle = '#8c8c8c'; g.lineWidth = 6; g.strokeRect(3, 3, n - 6, n - 6);
    g.lineWidth = 4; g.beginPath(); g.moveTo(n * .08, n * .3); g.lineTo(n * .3, n * .75); g.lineTo(n * .5, n * .3); g.lineTo(n * .7, n * .75); g.lineTo(n * .92, n * .3); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(0, n * .5); g.lineTo(n, n * .5); g.stroke();
    g.restore();
  }, 128);
  const wardM = mat({ color: '#f2eee6', rough: .45 });
  const wardLine = mat({ color: '#b9b2a6', rough: .5 });
  const wardrobe = (x0, z0, x1, z1, h = 2.45) => {
    ctx.box(x0, Y, z0, x1, Y + h, z1, wardM, { collide: true });
    const vertical = (z1 - z0) > (x1 - x0); const d = vertical ? x1 - x0 : z1 - z0;
    ctx.rect(x0, z0, x1, z1, Y + h + 0.004, mat({ color: '#ffffff', map: hangerTex(vertical), tile: d, rough: .6 }), { walk: false });
    // door joints on the long faces
    const len = vertical ? z1 - z0 : x1 - x0, n = Math.max(1, Math.round(len / 0.6));
    for (let i = 1; i < n; i++) { const s = len * i / n; if (vertical) { ctx.box(x0 - .005, Y + .05, z0 + s - .005, x1 + .005, Y + h - .05, z0 + s + .005, wardLine); } else { ctx.box(x0 + s - .005, Y + .05, z0 - .005, x0 + s + .005, Y + h - .05, z1 + .005, wardLine); } }
  };
  const rug = (x0, z0, x1, z1, color = '#8b7660', border = '#a3907a') => place(F.rug({ w: x1 - x0, d: z1 - z0, color, border }), (x0 + x1) / 2, (z0 + z1) / 2);
  const shagM = mat({ color: '#ffffff', map: tex.custom('fs_shag2', (g, n) => { g.fillStyle = '#a99785'; g.fillRect(0, 0, n, n); let q = 7; const R = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 14000; i++) { const r = R(); g.fillStyle = r < .35 ? '#c6b6a4' : r < .7 ? '#85735f' : '#a08c78'; g.globalAlpha = .55; g.save(); g.translate(R() * n, R() * n); g.rotate(R() * 6.3); g.fillRect(0, 0, 1.5, 5); g.restore(); } g.globalAlpha = 1; }, 256), tile: .7, rough: 1 });
  const fringeM = mat({ color: '#ffffff', map: tex.custom('fs_fringe', (g, n) => { g.clearRect(0, 0, n, n); let q = 3; const R = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 2600; i++) { const r = R(); g.fillStyle = r < .4 ? '#b9a895' : r < .75 ? '#7e6c59' : '#9c8975'; g.globalAlpha = .85; g.save(); g.translate(R() * n, R() * n); g.rotate(R() * 6.3); g.fillRect(-1, -4, 2.5, 8); g.restore(); } g.globalAlpha = 1; }, 256), tile: .5, rough: 1, transparent: true, key: 'fs_fringeM' });
  const shagRug = (x0, z0, x1, z1) => {
    ctx.rect(x0, z0, x1, z1, Y + 0.022, shagM, { walk: false });
    const f = 0.14; // ragged shaggy border
    ctx.rect(x0 - f, z0 - f, x1 + f, z0 + f, Y + 0.02, fringeM, { walk: false }); ctx.rect(x0 - f, z1 - f, x1 + f, z1 + f, Y + 0.019, fringeM, { walk: false });
    ctx.rect(x0 - f, z0 + f, x0 + f, z1 - f, Y + 0.02, fringeM, { walk: false }); ctx.rect(x1 - f, z0 + f, x1 + f, z1 - f, Y + 0.019, fringeM, { walk: false });
    ctx.box(x0 + .02, Y, z0 + .02, x1 - .02, Y + 0.018, z1 - .02, shagM).castShadow = false;
  };
  // bed: single pale cream-beige duvet with soft rumple shading, cream pillows (as drawn on the plan)
  const duvetM = mat({ color: '#ffffff', map: tex.custom('fs_duvet', (g, n) => {
    g.fillStyle = '#cbbc9c'; g.fillRect(0, 0, n, n); let q = 23; const R = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 18; i++) { const x = R() * n, y = R() * n, w = 80 + R() * 140, a = R() * Math.PI; const gr = g.createLinearGradient(x - w / 4, y, x + w / 4, y);
      const dark = R() < .5; gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, dark ? 'rgba(120,100,70,.07)' : 'rgba(255,248,232,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - w / 4, y - w, w / 2, w * 2); g.restore(); }
  }, 256), rough: .95 });
  const bedBaseM = mat({ color: '#a68b66', rough: .6 }), pillowM = mat({ color: '#ddd1b6', rough: .95 });
  const bed = (x, z, ry, w = 1.8, l = 2.1) => {
    const gp = new THREE.Group(); const B = (bw, bh, bd, px, py, pz, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m); me.position.set(px, py, pz); me.castShadow = true; me.receiveShadow = true; gp.add(me); };
    B(w + .1, .3, l, 0, .17, 0, bedBaseM); B(w + .3, 1.2, .12, 0, .6, -l / 2 - .02, bedBaseM);
    B(w + .04, .26, l - .12, 0, .44, .05, duvetM);
    for (let i = 0; i < 2; i++) B(w / 2 - .12, .15, .38, (i - .5) * w / 2, .62, -l / 2 + .3, pillowM);
    place(gp, x, z, ry, { collide: true });
  };
  const nightM = mat({ color: '#ffffff', map: tex.wood('#4e3d2e', 2, 53), tile: .6, rough: .45 });
  const lampShade = mat({ color: '#e6d6b8', emissive: '#ffe7b8', emissiveIntensity: .12, rough: .9, key: 'fs_lampshade' });
  const lampBase = mat({ color: '#6b5844', rough: .4 });
  const night = (x, z) => { ctx.box(x - .28, Y, z - .26, x + .28, Y + .55, z + .26, nightM, { collide: true }); }; // plain brown box (plan shows no lamp)
  const sofa = (x, z, ry, len, depth = .8) => place(F.sofa({ len, depth, color: brownSofa, cushions: Math.max(1, Math.round(len / .75)), legs: '#3e2f22' }), x, z, ry, { collide: true });
  const chair = (x, z, ry, s = .62) => place(F.sofa({ len: s, depth: s, color: brownSofa, cushions: 1, legs: '#3e2f22' }), x, z, ry, { collide: true });
  const ottoman = (x, z, s = .55) => place(F.ottoman({ w: s, d: s, h: .42, color: '#7a6450' }), x, z);
  const toilet = (x, z, ry) => place(F.toilet(), x, z, ry);
  const marbleTop = mat({ color: '#ffffff', map: tex.marble('#ece6dc', '#c9bca6', 51), tile: 1, rough: .2 });
  const cabM = mat({ color: '#ffffff', map: tex.wood('#d8c7a8', 3, 52), tile: .8, rough: .5 });
  const mirrorM = mat({ color: '#cfdce3', rough: .02, metal: .9 });
  // vanity along a wall: (x0,z0)-(x1,z1) footprint, wall side 'w'|'e'|'n'|'s', basins count
  const vanity = (x0, z0, x1, z1, side, basins = 1) => {
    ctx.box(x0, Y + .1, z0, x1, Y + .82, z1, cabM, { collide: true }); ctx.box(x0 - .01, Y + .82, z0 - .01, x1 + .01, Y + .86, z1 + .01, marbleTop);
    const along = side === 'w' || side === 'e'; const len = along ? z1 - z0 : x1 - x0;
    for (let i = 0; i < basins; i++) { const s = len * (i + .5) / basins; const cx = along ? (x0 + x1) / 2 : x0 + s, cz = along ? z0 + s : (z0 + z1) / 2; const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .16, .1, 20), M.white()); b.position.set(cx, Y + .9, cz); ctx.add(b); }
    const m = 0.02; if (side === 'w') ctx.box(x0 - .02, Y + 1.1, z0 + .05, x0 - .02 + m, Y + 2.1, z1 - .05, mirrorM); if (side === 'e') ctx.box(x1 + .02 - m, Y + 1.1, z0 + .05, x1 + .02, Y + 2.1, z1 - .05, mirrorM);
    if (side === 'n') ctx.box(x0 + .05, Y + 1.1, z0 - .02, x1 - .05, Y + 2.1, z0 - .02 + m, mirrorM); if (side === 's') ctx.box(x0 + .05, Y + 1.1, z1 + .02 - m, x1 - .05, Y + 2.1, z1 + .02, mirrorM);
  };
  const tub = (x0, z0, x1, z1) => { const w = Math.min(x1 - x0, z1 - z0), l = Math.max(x1 - x0, z1 - z0); place(F.bathtub({ l, w }), (x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) > (z1 - z0) ? Math.PI / 2 : 0, { collide: true }); };
  const drain = (x, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .01, 16), mat({ color: '#4a4a4a', rough: .4, metal: .6 })); m.position.set(x, Y + .01, z); ctx.add(m); };
  const showerGlass = (x0, z0, x1, z1) => { ctx.box(x0, Y, z0, x1, Y + 2.1, z1, M.glass(), { collide: true }); };

  // ---- tan sanitaryware like the plan (outlined tan pieces), all plan coords
  const tanM = mat({ color: '#c2b392', rough: .75, key: 'fs_tan' });
  const tanIn = mat({ color: '#d2c4a5', rough: .75, key: 'fs_tanin' });
  const rimM = mat({ color: '#857459', rough: .8, key: 'fs_rim' });
  const brownV = mat({ color: '#ffffff', map: tex.custom('fs_vwood', (g, n) => { g.fillStyle = '#8c7a63'; g.fillRect(0, 0, n, n); let q = 5; const R = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296); for (let i = 0; i < 60; i++) { g.globalAlpha = .12; g.fillStyle = R() < .5 ? '#6f5e49' : '#a08d74'; g.fillRect(0, R() * n, n, 1 + R() * 3); } g.globalAlpha = 1; }, 256), tile: .8, rough: .8 });
  const rrPts = (x0, z0, x1, z1, r, k = 5) => { const P = []; const c = [[x1 - r, z0 + r, -Math.PI / 2], [x1 - r, z1 - r, 0], [x0 + r, z1 - r, Math.PI / 2], [x0 + r, z0 + r, Math.PI]];
    for (const [cx, cz, a0] of c) for (let i = 0; i <= k; i++) { const a = a0 + (Math.PI / 2) * i / k; P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return P; };
  const elPts = (cx, cz, rx, rz, k = 40) => Array.from({ length: k }, (_, i) => [cx + Math.cos(i / k * 6.2832) * rx, cz + Math.sin(i / k * 6.2832) * rz]);
  const solid = (pts, y0, y1, m) => ctx.poly(pts, Y + y1, m, { thick: y1 - y0, walk: false });
  const flat = (pts, y, m) => ctx.poly(pts, Y + y, m, { walk: false });
  // rectangular built-in tub: tan body, dark rim outline, lighter rounded basin
  const tubR = (x0, z0, x1, z1) => {
    solid(rrPts(x0, z0, x1, z1, .06), 0, .55, tanM); flat(rrPts(x0, z0, x1, z1, .06), .552, rimM);
    flat(rrPts(x0 + .03, z0 + .03, x1 - .03, z1 - .03, .05), .554, tanM);
    const b = .1; flat(rrPts(x0 + b, z0 + b, x1 - b, z1 - b, Math.min(x1 - x0, z1 - z0) / 2 - b - .02), .556, rimM);
    flat(rrPts(x0 + b + .02, z0 + b + .02, x1 - b - .02, z1 - b - .02, Math.min(x1 - x0, z1 - z0) / 2 - b - .04), .558, tanIn);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; flat(elPts(cx, cz, .025, .025, 12), .56, rimM);
    ctx.box(x0, Y, z0, x1, Y + .55, z1, hiddenM, { collide: true });
  };
  // freestanding oval tub
  const tubO = (cx, cz, rx, rz) => {
    solid(elPts(cx, cz, rx - .04, rz - .04), 0, .1, rimM); solid(elPts(cx, cz, rx, rz), .1, .58, tanM);
    flat(elPts(cx, cz, rx, rz), .582, rimM); flat(elPts(cx, cz, rx - .03, rz - .03), .584, tanM);
    flat(elPts(cx, cz, rx - .1, rz - .09), .586, rimM); flat(elPts(cx, cz, rx - .12, rz - .11), .588, tanIn);
    flat(elPts(cx, cz, .025, .025, 12), .59, rimM);
    ctx.box(cx - rx, Y, cz - rz, cx + rx, Y + .58, cz + rz, hiddenM, { collide: true });
  };
  // WC: tank against wall (dir = unit vector from wall into room), bowl outlined
  const wc = (cx, cz, dx, dz) => {
    const tx = cx - dx * .22, tz = cz - dz * .22, tw = .2, tl = .5;
    const [hx, hz] = dx ? [tw / 2 * Math.abs(dx) + 0, tl / 2] : [tl / 2, tw / 2];
    solid(rrPts(tx - hx, tz - hz, tx + hx, tz + hz, .03), 0, .8, tanM); flat(rrPts(tx - hx, tz - hz, tx + hx, tz + hz, .03), .802, rimM); flat(rrPts(tx - hx + .02, tz - hz + .02, tx + hx - .02, tz + hz - .02, .02), .804, tanM);
    const bx_ = cx + dx * .06, bz = cz + dz * .06, rx = dx ? .26 : .19, rz = dx ? .19 : .26;
    solid(elPts(bx_, bz, rx * .8, rz * .8), 0, .3, tanM); solid(elPts(bx_, bz, rx, rz), .3, .4, tanM);
    flat(elPts(bx_, bz, rx, rz), .402, rimM); flat(elPts(bx_, bz, rx - .025, rz - .025), .404, tanM); flat(elPts(bx_, bz, rx - .08, rz - .07), .406, tanIn);
  };
  // basin counter: cabinet (brown wood or tan) with round/oval inset basin(s)
  const basinCounter = (x0, z0, x1, z1, cab, basins = [], mirrorSide = null) => {
    ctx.box(x0, Y, z0, x1, Y + .82, z1, cab, { collide: true });
    flat(rrPts(x0, z0, x1, z1, .015), .821, rimM); flat(rrPts(x0 + .015, z0 + .015, x1 - .015, z1 - .015, .01), .823, cab);
    for (const [bx_, bz, rx, rz] of basins) { flat(elPts(bx_, bz, rx, rz), .826, rimM); flat(elPts(bx_, bz, rx - .025, rz - .025), .828, tanM); flat(elPts(bx_, bz, rx - .07, rz - .07), .83, tanIn); flat(elPts(bx_, bz, .02, .02, 10), .832, rimM); }
    const m = .02, s = mirrorSide; if (s === 'w') ctx.box(x0 - .02, Y + 1.1, z0 + .05, x0 - .02 + m, Y + 2.1, z1 - .05, mirrorM); if (s === 'e') ctx.box(x1 + .02 - m, Y + 1.1, z0 + .05, x1 + .02, Y + 2.1, z1 - .05, mirrorM);
    if (s === 'n') ctx.box(x0 + .05, Y + 1.1, z0 - .02, x1 - .05, Y + 2.1, z0 - .02 + m, mirrorM); if (s === 's') ctx.box(x0 + .05, Y + 1.1, z1 + .02 - m, x1 - .05, Y + 2.1, z1 + .02, mirrorM);
  };
  const hiddenM = new THREE.MeshBasicMaterial({ visible: false }); hiddenM.userData.tile = 1;
  const tapM = mat({ color: '#6e5a45', rough: .4 });

  // ================================================================ FLOORS
  floor(24.0, 23.75, 30.65, 28.65, mat({ color: '#ffffff', map: tex.carpet('#ece2d3', 61), tile: .6, rough: 1 })); // bedroom two: pale cream carpet
  floor(30.65, 23.75, 33.9, 26.05, woodFloor);           // bedroom two passage / dressing
  floor(30.65, 26.05, 33.9, 28.65, bathTile);            // bedroom two bath
  // open landing = continuation of f_north's family living (plain cream, same material as theirs, no walls)
  floor(33.9, 23.75, 37.75, 28.65, mat({ color: '#ffffff', map: tex.plaster('#efe6d9', 62), tile: 3, rough: .85 })); // flat plain beige
  floor(24.0, 28.65, 26.95, 33.75, herring);             // master dressing / sitting (herringbone)
  floor(26.95, 28.65, 30.65, 33.75, bathTile);           // master bath
  floor(30.65, 28.65, 37.75, 39.0, woodFloor);           // master suite hall + living
  floor(24.0, 33.75, 30.65, 39.0, woodFloor);            // bedroom 1
  floor(37.75, 23.75, 42.56, 28.65, pinkFloor);          // bedroom three hall
  floor(42.56, 26.3, 46.95, 28.65, pinkFloor);
  floor(42.56, 23.75, 46.95, 26.3, bathTile);            // bedroom three bath
  floor(37.75, 28.65, 46.95, 33.75, pinkFloor);          // bedroom three living + bedroom
  floor(37.75, 33.75, 42.5, 39.0, blushWood);            // bedroom 2 (faint blush planks)
  floor(35.75, 39.0, 42.5, 40.8, terraceM);              // south terrace (slab = ground piece)

  // ================================================================ EXTERIOR WALLS (+ parapets)
  // west façade, north → south
  ext_(24.0, 23.5, 24.0, 39.25, [[0.6, 2.4], [2.7, 4.9], [10.7, 15.3]]);
  // south façade, west → east (master living glass, bedroom 2 glass)
  ext_(23.75, 39.0, 42.5, 39.0, [[8.0, 11.65], [14.25, 18.55]]);
  // bedroom 2 east side, south → north
  ext_(42.5, 39.25, 42.5, 33.75);
  // bedroom three B.room south side, west → east
  ext_(42.5, 33.75, 47.2, 33.75, [[0.4, 1.4], [1.5, 2.9], [3.0, 4.3]]);
  // east façade, south → north
  ext_(46.95, 34.0, 46.95, 23.5);
  // north façade of bedroom two, east → west (only x 24–27 is outdoors)
  ext_(27.0, 23.75, 23.75, 23.75, [[0.2, 1.3]]);
  // terrace parapets (low walls with glass top)
  const terr = (x1, z1, x2, z2) => { ctx.wall(x1, z1, x2, z2, { y0: Y, h: 0.5, t: 0.2, off: -0.1, m: ext }); ctx.wall(x1, z1, x2, z2, { y0: Y + 0.5, h: 0.6, t: 0.03, off: -0.1, m: M.glass(), collide: true }); };
  terr(35.75, 39.0, 35.75, 41.0); terr(35.55, 40.8, 42.7, 40.8); terr(42.5, 41.0, 42.5, 39.0);
  // shared walls with f_north (half thickness, on our side)
  wl(27.0, 23.8, 33.9, 23.8, { t: 0.1 });
  wl(37.75, 23.8, 46.95, 23.8, { t: 0.1, m: pinkWall });

  // ================================================================ INTERIOR WALLS
  const D = (at, w, swing = 1, open = 1.25) => ({ at, w, y0: 0, h: 2.7, door: { color: doorC, swing, open } });
  const O = (at, w) => ({ at, w, y0: 0, h: 2.7 });
  // z = 28.65 line: bedroom two / herringbone / baths / master suite north, entrance door from corridor
  wl(24.0, 28.65, 36.08, 28.65);
  wl(36.03, 28.65, 36.03, 30.2, { t: 0.12 });                       // stub beside the suite entry
  ctx.box(36.1, Y, 28.8, 36.14, Y + 2.6, 29.7, mat({ color: '#ffffff', map: tex.wood(doorC, 2), tile: 1, rough: .5 })); // sliding leaf parked on the stub
  wl(37.17, 28.65, 37.75, 28.65);
  // x = 30.65 north part: bedroom two | passage / bath
  wl(30.65, 23.75, 30.65, 28.65, { openings: [O(25.1 - 23.75, 1.3)] });
  // passage | bath two
  wl(30.65, 26.05, 33.9, 26.05, { openings: [D(32.25 - 30.65, 0.85, -1)], mA: wallTile });
  // x = 33.9: passage/bath | corridor, door from corridor
  wl(33.9, 23.75, 33.9, 24.5); wl(33.9, 25.55, 33.9, 28.65); wl(33.4, 25.55, 33.9, 25.55, { t: 0.12 });
  // herringbone dressing | master bath (glass partition + opening)
  wl(26.95, 28.65, 26.95, 33.75, { openings: [{ at: 30.8 - 28.65, w: 1.1, y0: 0, h: 3.0, glass: true }, O(31.85 - 28.65, 0.85)], mA: plaster, mB: wallTile });
  glassLine(26.95, 28.65, 26.95, 33.75, 30.25 - 28.65, 31.35 - 28.65);
  // master bath | suite hall (double door) and bedroom 1 | living room
  wl(30.65, 28.65, 30.65, 33.75, { openings: [O(31.25 - 28.65, 1.5)], mA: plaster, mB: wallTile });
  ctx.door(30.65, 30.5, 0, 1, 0.75, 2.7, Y, { color: doorC, swing: 1, open: 0.9 }); ctx.door(30.65, 32.0, 0, -1, 0.75, 2.7, Y, { color: doorC, swing: -1, open: 0.9 }); // pair of leaves into the suite
  wl(30.65, 35.05, 30.65, 39.0);
  // herringbone + bath | bedroom 1
  wl(24.0, 33.75, 30.65, 33.75, { openings: [{ at: 26.2 - 24.0, w: 1.0, y0: 0, h: 3.0, glass: true }, D(29.95 - 24.0, 0.85, 1)] });
  glassLine(24.0, 33.75, 30.65, 33.75, 1.7, 2.7);
  // master bath partitions
  wl(28.2, 28.65, 28.2, 30.0, { t: 0.12, m: wallTile });
  wl(28.2, 32.4, 28.2, 33.75, { t: 0.12, m: wallTile });
  wl(29.3, 32.4, 30.65, 32.4, { t: 0.1, m: wallTile, h: 2.2 });
  // wardrobe island (L-shaped) between suite hall and living room
  wl(32.2, 33.7, 35.95, 33.7, { t: 0.12 });
  wl(35.9, 32.1, 35.9, 33.7, { t: 0.12 });
  // x = 37.75: master suite | bedroom three / bedroom 2, doors
  wl(37.75, 23.75, 37.75, 39.0, { openings: [D(25.0 - 23.75, 1.1, -1), O(36.41 - 23.75, 1.58)], mA: plaster, mB: plaster });
  ctx.door(37.75, 35.62, 0, 1, 0.79, 2.7, Y, { color: doorC, swing: 1, open: Math.PI / 2 }); ctx.door(37.75, 37.2, 0, -1, 0.79, 2.7, Y, { color: doorC, swing: -1, open: Math.PI / 2 }); // bedroom 2 pair
  // bedroom three hall | living / bedroom
  wl(37.75, 28.65, 46.95, 28.65, { openings: [O(40.15 - 37.75, 1.9)], m: pinkWall });
  ctx.door(41.1, 28.65, -1, 0, 1.0, 2.7, Y, { color: doorC, swing: -1, open: 0.8 });
  { const a = Math.atan2(29.9 - 28.88, 42.3 - 41.3), L0 = Math.hypot(1.0, 1.02); // long tan board (ironing board / mirror leaf)
    ctx.boxC(41.8, Y + 0.45, 29.39, L0, 0.9, 0.2, mat({ color: '#a8977a', rough: .7 }), -a);
    ctx.boxC(41.8, Y + 0.905, 29.39, L0 - 0.04, 0.01, 0.15, mat({ color: '#d8c79e', rough: .7 }), -a); }
  // bedroom three bath
  wl(42.56, 23.75, 42.56, 26.3, { openings: [D(25.65 - 23.75, 0.8, 1)], mA: pinkWall, mB: wallTile });
  wl(42.56, 26.3, 46.95, 26.3, { mA: pinkWall, mB: wallTile });
  wl(42.56, 24.9, 43.8, 24.9, { t: 0.1, m: wallTile, h: 2.2 });
  // living | bedroom (bedroom three)
  wl(42.56, 28.65, 42.56, 33.75, { openings: [D(31.25 - 28.65, 1.0, 1)], m: pinkWall });
  // bedroom three living | bedroom 2
  wl(37.75, 33.75, 42.5, 33.75);
  // bath two shower/WC partition
  wl(32.5, 27.56, 33.9, 27.56, { t: 0.1, m: wallTile, h: 2.2 });

  // ================================================================ ROOF, CEILINGS, LIGHTS
  ctx.box(23.75, CEIL, 23.5, 37.75, L.R, 39.25, roofM);
  ctx.box(37.75, CEIL, 23.5, 47.2, L.R, 34.0, roofM);
  ctx.box(37.75, CEIL, 34.0, 42.75, L.R, 39.25, roofM);
  ceiling(24.0, 23.75, 37.75, 39.0); ceiling(37.75, 23.75, 46.95, 33.75); ceiling(37.75, 33.75, 42.5, 39.0);
  cove(24.1, 23.85, 30.6, 28.6);          // bedroom two
  cove(24.1, 33.8, 30.6, 38.95);          // bedroom 1
  cove(30.7, 33.8, 37.7, 38.95);          // master living
  cove(37.8, 33.8, 42.45, 38.95);         // bedroom 2
  cove(42.6, 28.7, 46.9, 33.7, .45);      // B.room
  cove(37.8, 28.7, 42.5, 33.7, .45);      // bedroom three living
  lights(30.7, 29.4, 37.7, 32.0, 4, 2);   // suite hall
  lights(24.0, 28.65, 26.95, 33.75, 2, 3); // herringbone dressing
  lights(26.95, 28.65, 30.65, 33.75, 2, 3); // master bath
  lights(30.65, 26.05, 33.9, 28.65, 2, 2); lights(30.65, 23.75, 33.9, 26.05, 2, 1);
  lights(33.9, 23.75, 37.75, 28.65, 2, 3); // corridor
  lights(37.75, 23.75, 42.56, 28.65, 3, 3); lights(42.56, 26.3, 46.95, 28.65, 3, 1); lights(42.56, 23.75, 46.95, 26.3, 2, 2);
  // skirting
  [[24.0, 23.85, 30.65, 28.65], [24.0, 33.75, 30.65, 39.0], [30.65, 33.75, 37.75, 39.0], [37.75, 33.75, 42.5, 39.0], [42.56, 28.65, 46.95, 33.75], [37.75, 28.65, 42.56, 33.75], [24.0, 28.65, 26.95, 33.75]]
    .forEach((r) => skirt(...r));

  // ================================================================ FURNITURE
  // --- Bedroom two (6.6 x 4.8): sofa + 2 armchairs NW, bed on brown rug against south wall
  sofa(26.4, 24.35, 0, 2.2, .65);
  chair(24.6, 24.4, 0, .6); chair(24.65, 25.35, Math.PI / 2, .65);
  shagRug(26.25, 25.6, 29.25, 28.5);
  bed(27.7, 27.4, Math.PI, 1.8, 2.05);
  night(26.3, 28.15); night(29.1, 28.15);
  curtains(24.08, 24.25, false, 4.4);
  // passage wardrobes / dressing
  wardrobe(30.7, 23.85, 31.95, 24.46);                                  // hanging rail
  ctx.box(31.98, Y, 23.87, 32.7, Y + 0.9, 24.25, wardM, { collide: true });  // open shelf
  { const xM = mat({ color: '#ffffff', map: tex.custom('fs_xcab', (g, n) => { g.fillStyle = '#fbfbf9'; g.fillRect(0, 0, n, n); g.strokeStyle = '#8c8c8c'; g.lineWidth = 5; for (const o of [0, n / 2]) { g.strokeRect(o + 3, 3, n / 2 - 6, n - 6); g.beginPath(); g.moveTo(o + 6, 6); g.lineTo(o + n / 2 - 6, n - 6); g.moveTo(o + n / 2 - 6, 6); g.lineTo(o + 6, n - 6); g.stroke(); } }, 128), tile: 1.05, rough: .6 });
    ctx.box(32.75, Y, 23.85, 33.8, Y + 0.9, 24.4, wardM, { collide: true }); ctx.rect(32.75, 23.85, 33.8, 24.4, Y + 0.904, xM, { walk: false });
    ctx.box(32.4, Y, 24.47, 33.4, Y + 2.4, 24.51, mat({ color: '#ffffff', map: tex.wood(doorC, 2), tile: 1, rough: .5 })); }  // sliding door line
  // bath two: tan tub on west wall, WC + brown basin unit on east wall, shower SW, tan basin SE
  tubR(30.83, 26.17, 31.5, 27.54);
  wc(33.45, 26.42, -1, 0);
  basinCounter(33.17, 26.75, 33.75, 27.5, brownV, [[33.47, 27.12, .2, .24]], 'e');
  drain(31.08, 28.15); // open shower area in the lower half
  ctx.box(31.7, Y, 28.43, 32.5, Y + 2.0, 28.47, M.glass()); // screen line as drawn on the plan
  ctx.box(33.1, Y, 28.0, 33.75, Y + .45, 28.4, tanM, { collide: true }); // tan shower bench

  // --- Master dressing / sitting (herringbone): leave open, add a chaise + plant
  // (plan shows this room empty – a pair of slim mirror panels on the west wall for eye level)
  ctx.box(24.02, Y + .3, 29.6, 24.05, Y + 2.4, 30.6, mirrorM); ctx.box(24.02, Y + .3, 31.8, 24.05, Y + 2.4, 32.8, mirrorM);

  // --- Master bath: shower (NW), freestanding tub (N), double vanity (W, glass side), WC compartments (S)
  drain(27.7, 29.1); showerGlass(27.0, 29.98, 28.15, 30.02);
  ctx.cyl(27.23, Y, 29.54, .1, .45, tanM, 20); flat(elPts(27.23, 29.54, .1, .1, 20), .452, rimM); flat(elPts(27.23, 29.54, .08, .08, 20), .454, tanIn);
  tubR(28.67, 28.95, 30.37, 29.65); // freestanding rounded-rectangle tub
  ctx.box(29.3, Y, 28.73, 29.74, Y + .9, 28.9, tapM);
  basinCounter(27.04, 30.7, 27.62, 31.75, tanM, [[27.33, 31.22, .2, .3]], 'w');
  // WC compartments (south)
  ctx.cyl(27.23, Y, 32.88, .1, .45, tanM, 20); flat(elPts(27.23, 32.88, .1, .1, 20), .452, rimM); flat(elPts(27.23, 32.88, .08, .08, 20), .454, tanIn);
  drain(27.57, 33.33);
  basinCounter(29.87, 32.96, 30.55, 33.33, tanM, [[30.18, 33.14, .22, .14]]);
  ctx.box(28.6, Y, 33.23, 29.4, Y + 2.0, 33.27, M.glass());

  // --- Master suite hall: wardrobe runs (north wall + island)
  wardrobe(30.75, 28.72, 35.1, 29.35); wardrobe(35.1, 28.72, 35.85, 30.1);
  wardrobe(32.25, 33.05, 35.85, 33.64); wardrobe(35.25, 32.15, 35.84, 33.05);
  // TV on the south face of the island
  place(F.tvUnit({ len: 1.9, color: '#5b4632', tv: 1.4 }), 34.0, 34.0, 0);

  // --- Master living room 7x5: sofa on west, sofa + armchairs on south facing the TV
  ottoman(31.4, 35.4, .55);
  sofa(31.4, 36.95, Math.PI / 2, 2.1, .65);
  chair(31.4, 38.5, Math.PI, .58); chair(32.35, 38.5, Math.PI, .65);
  sofa(34.25, 38.5, Math.PI, 2.3, .65);
  chair(36.1, 38.5, Math.PI, .65); chair(37.2, 38.5, Math.PI, .58);
  curtains(31.65, 38.85, true, 3.85);

  // --- Bedroom 1 (6.5 x 5): bed on rug, head to south wall
  shagRug(26.05, 35.95, 29.0, 38.95);
  bed(27.55, 37.85, Math.PI, 1.85, 2.05);
  night(25.9, 38.6); night(29.2, 38.6);
  { const sc = mat({ color: '#2b2622', rough: .5, metal: .2, key: 'fs_lampdark' }); // dark arc floor lamp beside the bed (plan: dark silhouette)
    ctx.cyl(28.42, Y, 38.75, .17, .04, sc, 24); ctx.cyl(28.42, Y, 38.75, .025, 1.95, sc, 10);
    ctx.box(28.39, Y + 1.92, 37.25, 28.45, Y + 1.97, 38.77, sc);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(.17, 20, 10, 0, 6.2832, 0, Math.PI / 2), sc); sh.scale.set(1, .8, 1.3); sh.position.set(28.42, Y + 1.72, 37.3); ctx.add(sh); }
  curtains(24.08, 34.1, false, 4.8);

  // --- Bedroom 2 (5 x 4.7): bed head to east wall on rug
  shagRug(39.4, 35.0, 42.4, 38.0);
  bed(41.3, 36.45, -Math.PI / 2, 1.75, 2.0);
  night(42.05, 35.25); night(42.05, 37.9);
  curtains(37.95, 38.85, true, 4.45);

  // --- Bedroom three suite: wardrobes in the hall/dressing
  wardrobe(39.8, 23.9, 42.45, 24.48); wardrobe(41.8, 24.48, 42.45, 26.25);
  wardrobe(37.85, 25.65, 38.45, 28.5);
  wardrobe(43.75, 26.38, 46.85, 26.95);
  wardrobe(42.7, 28.02, 46.85, 28.58);
  // bath three: WC NW, shower NE, tan tub E, brown vanity with round basin S
  wc(42.98, 24.32, 1, 0);
  drain(46.53, 24.28); showerGlass(45.7, 23.85, 45.74, 24.85);
  tubR(46.12, 24.81, 46.72, 26.19); ctx.box(46.74, Y, 25.5, 46.87, Y + .8, 25.9, tapM);
  basinCounter(43.88, 25.78, 45.38, 26.22, brownV, [[44.81, 26.0, .21, .21]], 's');
  // living room 5 x 4.7: long sofa on west wall, sofa + 2 chairs on south, ottoman
  chair(38.4, 29.6, Math.PI / 2, .6);
  sofa(38.45, 31.3, Math.PI / 2, 2.4, .7);
  chair(38.45, 33.2, Math.PI, .58); sofa(39.85, 33.2, Math.PI, 1.8, .7); chair(41.3, 33.2, Math.PI, .58);
  // bedroom 5 x 4.2: bed head north on rug, nightstands
  shagRug(43.4, 29.3, 46.4, 31.8);
  bed(45.0, 29.85, 0, 1.8, 2.25);
  night(43.65, 29.05); night(46.35, 29.05);
  curtains(42.95, 33.6, true, 3.85);

  // --- terrace: a pair of loungers + side table
  place(F.lounger({ color: '#f3f1ec' }), 38.0, 39.95, Math.PI / 2);
  place(F.lounger({ color: '#f3f1ec' }), 40.6, 39.95, Math.PI / 2);
  place(F.sideTable({ s: .45, h: .45, top: '#d8d2c6' }), 39.3, 39.95);

  // plan screenshots: walls/tall items cast long sun shadows across the cutaway; the plan has none
  if (new URLSearchParams(location.search).get('shot') === 'top') {
    const bb = new THREE.Box3();
    ctx.group.traverse((o) => { if (o.isMesh) { bb.setFromObject(o); if (bb.max.y - bb.min.y > 1.0) o.castShadow = false; } });
  }
}
