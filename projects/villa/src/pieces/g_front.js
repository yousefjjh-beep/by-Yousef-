// Piece: g_front — ground floor: woman saloon + WC + court, entrance, living area, hallway + mini kitchen,
// main stair (G -> F), balcony; roof over the single-storey part, slab/ceiling under the first floor.
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'Entrance', level: 'G', x: 8.4, z: 19.2, yaw: -Math.PI / 2 },
  { name: 'Woman saloon', level: 'G', x: 13.2, z: 12.2, yaw: Math.PI / 4 },
  { name: 'Living area', level: 'G', x: 16.2, z: 13.6, yaw: -Math.PI / 5 },
  { name: 'Hallway / mini kitchen', level: 'G', x: 31, z: 13.4, yaw: Math.PI / 8 },
  { name: 'Balcony', level: 'G', x: 33.3, z: 3.2, yaw: Math.PI * 0.75 },
];
export const views = [
  { name: 'living area from entrance', level: 'G', x: 15.8, z: 14.2, yaw: -38, pitch: -9, fov: 70 },
  { name: 'woman saloon from corridor', level: 'G', x: 13.4, z: 12.6, yaw: 42, pitch: -12, fov: 72 },
  { name: 'hallway, mini kitchen and stair', level: 'G', x: 30.6, z: 13.9, yaw: 12, pitch: -4, fov: 72 },
  { name: 'entrance from front door', level: 'G', x: 8.7, z: 19.9, yaw: -62, pitch: -6, fov: 72 },
];

// ---------------------------------------------------------------- textures / materials
const rngf = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
function shagTex(base, hiC, loC, seed) {
  return tex.custom(`gf_shag2${base}${seed}`, (g, n) => {
    const R = rngf(seed); g.fillStyle = base; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 2600; i++) { // pile tufts (coarse enough to read in plan view)
      const x = R() * n, y = R() * n, r = 4 + R() * 10; g.fillStyle = R() < .5 ? hiC : loC; g.globalAlpha = .18 + R() * .3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    for (let i = 0; i < 9000; i++) {
      const x = R() * n, y = R() * n, a = R() * Math.PI * 2, l = 8 + R() * 22;
      g.strokeStyle = R() < .5 ? hiC : loC; g.globalAlpha = .25 + R() * .45; g.lineWidth = 2 + R() * 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.globalAlpha = 1;
  });
}
function mottleTex(base, dark, light, seed) { // warm marble: soft blotches + faint veins
  return tex.custom(`gf_mottle${base}${seed}`, (g, n) => {
    const R = rngf(seed); g.fillStyle = base; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 90; i++) { const x = R() * n, y = R() * n, r = 20 + R() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = R() < .5 ? dark : light;
      gr.addColorStop(0, c); gr.addColorStop(1, c + '00'); g.globalAlpha = .25 + R() * .3; g.fillStyle = gr;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { g.save(); g.translate(ox, oy); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); } }
    g.strokeStyle = dark; for (let i = 0; i < 14; i++) { g.globalAlpha = .12 + R() * .15; g.lineWidth = .6 + R(); let x = R() * n, y = R() * n; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (R() - .3) * 60; y += (R() - .5) * 40; g.lineTo(x, y); } g.stroke(); }
    g.globalAlpha = 1;
  });
}
function darkWoodTex(base, seed) { // strongly streaked dark wood (tables/consoles on the plan)
  return tex.custom(`dwood${base}${seed}`, (g, n) => {
    const R = rngf(seed); g.fillStyle = base; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 260; i++) {
      const x = R() * n; g.strokeStyle = R() < .5 ? '#7a4f30' : '#1f120a'; g.globalAlpha = .15 + R() * .4; g.lineWidth = .6 + R() * 2.5;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (R() - .5) * 14, n * .33, x + (R() - .5) * 14, n * .66, x + (R() - .5) * 10, n); g.stroke();
    }
    g.globalAlpha = 1;
  });
}

function mergeBoxes(list) { // concat indexed geometries (no three addons available)
  const pos = [], nor = [], uv = [], idx = []; let off = 0;
  for (const g of list) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(g.attributes.normal.getX(i), g.attributes.normal.getY(i), g.attributes.normal.getZ(i)); uv.push(g.attributes.uv.getX(i), g.attributes.uv.getY(i)); }
    for (const v of g.index.array) idx.push(v + off); off += p.count; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.setIndex(idx); return m;
}
let mm; // materials, created in build()
function makeMats() {
  return {
    flSaloon: mat({ color: '#ffffff', map: mottleTex('#a6997f', '#8f826a', '#b5a993', 31), tile: 4, rough: .25 }),
    flLiving: mat({ color: '#ffffff', map: mottleTex('#a5987e', '#8e8169', '#b4a892', 32), tile: 4.5, rough: .25 }),
    flEntr: mat({ color: '#ffffff', map: mottleTex('#a4987f', '#8d816a', '#b3a893', 33), tile: 4, rough: .25 }),
    flWC: mat({ color: '#ffffff', map: tex.tiles('#b0b0b1', '#7c8084', 4, .03, 34), tile: 1.2, rough: .3 }),
    flKitchen: mat({ color: '#ffffff', map: tex.tiles('#c6c6c6', '#6e7276', 4, .06, 35), tile: 1.0, rough: .3 }),
    flBalc: mat({ color: '#ffffff', map: tex.tiles('#cbc4b3', '#ada590', 4, .03, 36), tile: 2.4, rough: .6 }),
    grass: mat({ color: '#ffffff', map: tex.grass(37), tile: 2, rough: .9 }),
    wall: mat({ color: '#f3ebdd', map: tex.plaster('#f1e8d8', 38), tile: 2, rough: .9 }),
    wallWC: mat({ color: '#ffffff', map: tex.tiles('#efeeea', '#c9c9c4', 2, .02, 39), tile: 1.2, rough: .3 }),
    ext: M.extStone(),
    roof: mat({ color: '#d9d3c7', map: tex.tiles('#d6d0c3', '#b9b1a3', 2, .03, 40), tile: 2, rough: .9 }),
    ceiling: M.ceiling(),
    shagSaloon: mat({ color: '#ffffff', map: shagTex('#98856b', '#c8b698', '#665640', 41), tile: 1.1, rough: 1 }),
    shagLiving: mat({ color: '#ffffff', map: shagTex('#9c8f7a', '#cbbfa8', '#6c604f', 42), tile: 1.1, rough: 1 }),
    darkWood: mat({ color: '#ffffff', map: darkWoodTex('#5a3a28', 43), tile: 1.6, rough: .9 }),
    darkWoodLow: mat({ color: '#ffffff', map: darkWoodTex('#53321d', 44), tile: 1.2, rough: .9 }),
    treads: mat({ color: '#ffffff', map: darkWoodTex('#4b2c18', 45), tile: 1.5, rough: .85 }),
    lightWood: mat({ color: '#ffffff', map: tex.wood('#b48a55', 4, 46), tile: 1, rough: .5 }),
    black: mat({ color: '#1c1c1e', rough: .95 }),
    blueLine: mat({ color: '#2f9fd8', rough: .3 }),
    steel: M.steel(),
    glass: M.glass(),
    frame: M.frame(),
    white: M.white(),
    skirting: mat({ color: '#6b4a32', rough: .5 }),
    cove: mat({ color: '#f7f4ee', rough: .95 }),
    glow: M.lightPanel(),
  };
}

// ---------------------------------------------------------------- furniture builders
function grp() { return new THREE.Group(); }
function bxg(g, w, h, d, x, y, z, m, ry = 0) { return F.bx(g, w, h, d, x, y, z, m, ry); }
// sofa with throw pillows (faces +z)
function sofaP(o) {
  const g = F.sofa(o); const pm = F.fabric(o.pillow || '#efe6d3'); const n = o.pillows ?? 2;
  if (n > 0 && o.back !== false) {
    const aw = .18; const xs = n === 1 ? [0] : [-o.len / 2 + aw + .28, o.len / 2 - aw - .28];
    xs.forEach((x, i) => { const p = F.rbx(g, .42, .36, .12, .05, x, .68, -(o.depth ?? .9) / 2 + .36, pm); p.rotation.z = (i ? -1 : 1) * .35; });
  }
  return g;
}
function shadeHex(c, k) { const v = new THREE.Color(c); v.multiplyScalar(k); return '#' + v.getHexString(); }
function tubChair(color) { // round-backed dining tub chair, faces +z
  const g = grp(); const f = mat({ color, rough: .65 });
  const back = new THREE.Mesh(new THREE.CylinderGeometry(.33, .31, .42, 20, 1, true, Math.PI * .5, Math.PI), mat({ color: shadeHex(color, .8), rough: .65, side: THREE.DoubleSide }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 8, 20, Math.PI), mat({ color: shadeHex(color, .8), rough: .65 })); rim.rotation.x = -Math.PI / 2; rim.rotation.z = Math.PI; rim.position.y = .87; g.add(rim);
  back.position.y = .66; back.rotation.y = Math.PI; g.add(back); // open side towards +z
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(.3, .28, .2, 20), f); seat.position.y = .45; g.add(seat);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.05, .18, .35, 12), M.frame()); base.position.y = .175; g.add(base);
  return g;
}
// soft upholstered sofa (faces +z): white-tinted fabric map so the colour is not squared like F.fabric
const fab = (c) => mat({ color: '#ffffff', map: tex.carpet(c, 21), tile: .6, rough: .95 });
function softSofa({ len = 2, depth = .88, body = '#887a69', seat = '#9a8d7c', pillow = '#c2b6a2', cushions = 2, pillows = 2 } = {}) {
  const g = grp(), b = fab(body), c = fab(seat), p = fab(pillow), aw = .2;
  F.rbx(g, len, .3, depth, .04, 0, .2, 0, b);
  F.rbx(g, len, .5, .24, .11, 0, .62, -depth / 2 + .12, b);
  F.rbx(g, aw, .32, depth, .09, -len / 2 + aw / 2, .52, 0, b); F.rbx(g, aw, .32, depth, .09, len / 2 - aw / 2, .52, 0, b);
  const cw = (len - 2 * aw) / cushions;
  for (let i = 0; i < cushions; i++) { const x = -len / 2 + aw + cw * (i + .5); F.rbx(g, cw - .03, .16, depth - .3, .07, x, .43, .09, c); F.rbx(g, cw - .06, .36, .16, .08, x, .7, -depth / 2 + .3, c); }
  const xs = pillows === 1 ? [0] : [-len / 2 + aw + .25, len / 2 - aw - .25];
  if (pillows) xs.forEach((x, i) => { const q = F.rbx(g, .4, .34, .13, .06, x, .7, -depth / 2 + .44, p); q.rotation.z = (i ? -1 : 1) * .3; });
  return g;
}
function lounge(color, w = .8, d = .8) { return sofaP({ len: w, depth: d, color, cushions: 1, pillows: 1 }); }
function sideBox(w, d, h, m) { const g = grp(); F.rbx(g, w, h, d, .04, 0, h / 2, 0, m); return g; }

// ---------------------------------------------------------------- build
export function build(ctx) {
  mm = makeMats();
  const H = 3.8; // ground ceiling height
  const wall = (x1, z1, x2, z2, o = {}) => ctx.wall(x1, z1, x2, z2, { h: H, t: .18, m: mm.wall, ...o });
  const place = (obj, x, z, ry = 0, opts = {}) => ctx.place(obj, x, L.G, z, ry, opts);
  const solid = { collide: true };
  // blue glazing line on the floor (reads as the plan's blue glass lines in top view)
  const blue = (x0, z0, x1, z1) => ctx.box(x0, 0, z0, x1, .04, z1, mm.blueLine);
  // glass panel between two points, full height with frame posts
  const glassRun = (x1, z1, x2, z2, panels, o = {}) => {
    const len = Math.hypot(x2 - x1, z2 - z1), pw = len / panels; const ops = [];
    for (let i = 0; i < panels; i++) ops.push({ at: pw * (i + .5), w: pw - .08, y0: 0, h: o.gh ?? 3.3, glass: true });
    wall(x1, z1, x2, z2, { t: .14, mA: o.mA ?? mm.ext, mB: o.mB ?? mm.wall, h: o.h ?? H, openings: ops });
    for (let i = 0; i <= panels; i++) { const k = i / panels; const x = x1 + (x2 - x1) * k, z = z1 + (z2 - z1) * k; ctx.box(x - .07, 0, z - .07, x + .07, o.gh ?? 3.3, z + .07, mm.frame); }
    const nx = (z2 - z1) / len * .03, nz = -(x2 - x1) / len * .03;
    blue(Math.min(x1, x2) - Math.abs(nx), Math.min(z1, z2) - Math.abs(nz), Math.max(x1, x2) + Math.abs(nx), Math.max(z1, z2) + Math.abs(nz));
  };
  const skirt = (x0, z0, x1, z1) => ctx.box(x0, 0, z0, x1, .1, z1, mm.skirting);
  const leaf = (hx, hz, dx, dz, w, h, m) => { // door leaf hinged at (hx,hz), pointing along (dx,dz)
    const l = Math.hypot(dx, dz); dx /= l; dz /= l; const piv = new THREE.Group(); piv.position.set(hx, 0, hz); piv.rotation.y = Math.atan2(-dz, dx);
    const lf = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), m); lf.position.set(w / 2, h / 2, 0); piv.add(lf); ctx.add(piv); return piv;
  };

  // ============================================================ FLOORS
  // woman saloon + corridor to entrance
  ctx.rect(7.43, 5.83, 14.37, 12.63, L.G, mm.flSaloon);
  ctx.rect(12.17, 12.63, 14.37, 14.74, L.G, mm.flSaloon);
  for (const z of [13.95, 14.22, 14.5]) ctx.box(12.17, 0, z - .015, 14.37, .004, z + .015, mat({ color: '#cdb58d', rough: .4 })); // step nosings
  // entrance
  ctx.rect(7.43, 16.18, 9.3, 20.53, L.G, mm.flEntr);
  ctx.rect(9.3, 17.76, 16.79, 20.53, L.G, mm.flEntr);
  ctx.rect(10.0, 14.74, 16.79, 17.76, L.G, mm.flEntr);
  ctx.rect(14.37, 14.58, 16.79, 14.74, L.G, mm.flEntr);
  // living + stair landing
  const livingFloor = ctx.rect(14.55, 3.95, 26.9, 14.58, L.G, mm.flLiving);
  ctx.rect(22.19, 2.25, 23.76, 3.95, L.G, mm.flLiving);
  // hallway (light well left open)
  ctx.rect(26.9, 4.02, 32.6, 14.8, L.G, mm.flLiving);
  ctx.rect(32.6, 4.02, 34.5, 8.05, L.G, mm.flLiving);
  ctx.rect(32.6, 10.25, 34.5, 14.8, L.G, mm.flLiving);
  // wet / outdoor
  ctx.rect(9.38, 12.78, 12.03, 14.62, L.G + .002, mm.flWC);
  ctx.rect(27.55, 8.2, 29.05, 10.4, L.G + .003, mm.flKitchen);
  ctx.rect(29.97, 0, 34.5, 3.8, L.G, mm.flBalc);
  ctx.rect(7.48, 12.84, 9.21, 16.02, L.G, mm.grass);
  // slab on grade where nothing is below (entrance/WC/court) – basement ceilings cover the rest
  ctx.box(7.25, -.4, 12.0, 16.95, -.02, 20.72, mm.ext);

  // ============================================================ WALLS
  // --- woman saloon
  wall(7.35, 5.7, 7.35, 12.78, { t: .25, mA: mm.ext, mB: mm.wall, h: 4.2, openings: [
    { at: 1.6, w: 1.0, y0: .45, h: 2.4, glass: true }, { at: 2.95, w: .7, y0: .45, h: 2.4, glass: true },
    { at: 3.95, w: .7, y0: .45, h: 2.4, glass: true }, { at: 5.25, w: 1.3, y0: .45, h: 2.4, glass: true }] });
  for (const [a, b] of [[6.8, 7.8], [8.3, 9.0], [9.3, 10.0], [10.3, 11.6]]) blue(7.2, a, 7.5, b);
  wall(7.22, 5.75, 14.55, 5.75, { t: .25, mA: mm.wall, mB: mm.ext, h: 4.2 });
  wall(14.45, 3.85, 14.45, 5.75, { t: .2, mA: mm.ext, mB: mm.wall, h: 4.2 });
  wall(14.45, 5.75, 14.45, 14.75, { t: .2 });
  wall(7.35, 12.7, 12.18, 12.7, { t: .15 });
  // --- WC + court + coat cabinet
  wall(12.1, 12.7, 12.1, 14.78, { t: .15, mA: mm.wallWC, mB: mm.wall });
  wall(9.3, 14.7, 12.18, 14.7, { t: .15, mA: mm.wall, mB: mm.wallWC, openings: [{ at: 1.7, w: .8, h: 2.3 }] });
  leaf(11.42, 14.64, -.72, -.69, .76, 2.25, mat({ color: '#ffffff', map: tex.wood('#6b4429', 2, 52), tile: 1, rough: .5 }));
  wall(9.3, 12.7, 9.3, 14.7, { t: .18, mA: mm.ext, mB: mm.wallWC, openings: [{ at: 1.05, w: .6, y0: 1.0, h: 1.2, glass: true }] });
  blue(9.2, 13.45, 9.4, 14.05);
  wall(9.3, 14.7, 9.3, 17.76, { t: .18, mA: mm.ext, mB: mm.wall });
  wall(7.35, 12.78, 7.35, 16.2, { t: .25, mA: mm.ext, mB: mm.ext, h: 4.2 });
  wall(7.25, 16.12, 9.38, 16.12, { t: .18, mA: mm.wall, mB: mm.ext });
  wall(9.22, 17.68, 12.18, 17.68, { t: .16 });
  wall(12.1, 17.0, 12.1, 17.76, { t: .16 });
  // --- entrance shell
  wall(7.35, 16.2, 7.35, 20.72, { t: .25, mA: mm.ext, mB: mm.wall, h: 4.2, openings: [{ at: 3.0, w: 1.5, h: 2.9 }] });
  wall(7.22, 20.6, 16.92, 20.6, { t: .25, mA: mm.ext, mB: mm.wall, h: 4.2, openings: [{ at: 1.6, w: 2.3, y0: 0, h: 3.2, glass: true }] });
  blue(7.6, 20.5, 9.9, 20.7);
  glassRun(16.85, 20.5, 16.85, 14.72, 4, { mA: mm.ext, mB: mm.wall });
  // front double door (dark wood, opened inwards)
  const doorM = mat({ color: '#ffffff', map: darkWoodTex('#3f2414', 53), tile: 1.2, rough: .4 });
  leaf(7.45, 18.45, .93, .37, .74, 2.85, doorM); leaf(7.45, 19.95, .93, -.37, .74, 2.85, doorM);
  ctx.box(7.2, 2.9, 18.4, 7.5, 3.05, 20.0, mm.black); ctx.box(7.2, 0, 18.36, 7.5, 2.95, 18.45, mm.black); ctx.box(7.2, 0, 19.95, 7.5, 2.95, 20.04, mm.black);
  // --- living
  glassRun(16.85, 14.65, 26.95, 14.65, 6, { mA: mm.ext, mB: mm.wall });
  wall(14.35, 3.85, 22.19, 3.85, { t: .22, mA: mm.wall, mB: mm.ext, h: 4.2 });
  // --- stair enclosure
  wall(22.12, 3.95, 22.12, 2.12, { t: .22, mA: mm.wall, mB: mm.ext, h: 4.2 });
  wall(22.0, 2.18, 29.97, 2.18, { t: .22, mA: mm.wall, mB: mm.ext, h: 4.2 });
  // --- hallway
  wall(29.86, 0, 29.86, 2.2, { t: .22, m: mm.ext, h: 3.5 });
  wall(29.86, 2.2, 29.86, 3.85, { t: .22, mA: mm.wall, mB: mm.ext, h: 3.5 });
  wall(26.9, 3.92, 29.86, 3.92, { t: .2 });
  wall(29.86, 3.92, 34.62, 3.92, { t: .2, mA: mm.wall, mB: mm.ext, openings: [{ at: 3.55, w: 1.0, h: 2.6, glass: true }] });
  blue(32.9, 3.82, 33.9, 4.02);
  wall(34.6, 3.82, 34.6, 14.8, { t: .25, mA: mm.wall, mB: mm.ext, h: 4.18 });
  wall(26.97, 6.6, 26.97, 12.0, { t: .15 });
  wall(26.97, 3.95, 26.97, 4.75, { t: .15 });
  wall(26.97, 13.9, 26.97, 14.72, { t: .15 });
  // light well: glass + walls, two-tone triangle shaft as on the plan
  const lwM = mat({ color: '#f8f8f6', rough: .6 });
  wall(32.6, 8.0, 32.6, 10.3, { t: .14, mA: lwM, mB: mm.wall, openings: [{ at: 1.3, w: 1.25, y0: 0, h: 3.0, glass: true }] });
  blue(32.48, 8.7, 32.72, 9.95);
  wall(32.55, 8.05, 34.5, 8.05, { t: .12, mA: lwM, mB: mm.wall });
  wall(32.55, 10.25, 34.5, 10.25, { t: .12, mA: mm.wall, mB: lwM });
  ctx.poly([[32.7, 8.1], [32.7, 10.2], [34.45, 10.2]], .006, mat({ color: '#fbfbfa', rough: .4 }), { walk: false });
  ctx.poly([[32.7, 8.1], [34.45, 8.1], [34.45, 10.2]], .006, mat({ color: '#ffffff', map: tex.custom('lwgrad', (g, n) => { const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#5e4630'); gr.addColorStop(1, '#e8dccb'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128), tile: 2.2, rough: .5 }), { walk: false });
  // black columns (hallway, carry the first floor)
  for (const [x0, x1] of [[28.55, 29.07], [32.08, 32.65]]) for (const [z0, z1] of [[3.8, 4.32], [6.98, 7.55], [11.02, 11.6], [14.25, 14.8]]) ctx.box(x0, 0, z0, x1, H, z1, mm.black, solid);

  // ============================================================ STAIR (G -> F), 24 risers x 0.175, treads 0.25
  const sx0 = 23.75, run = .25, rise = .175, N = 24;
  { const tg = [], ng = [];
    for (let i = 0; i < N; i++) {
      const h = (i + 1) * rise, a = new THREE.BoxGeometry(run, h, 1.46); a.translate(sx0 + (i + .5) * run, h / 2, 3.02); tg.push(a);
      const b = new THREE.BoxGeometry(.032, .014, 1.46); b.translate(sx0 + i * run + .014, h - .005, 3.02); ng.push(b);
    }
    ctx.add(new THREE.Mesh(mergeBoxes(tg), mm.treads), { walk: true });
    ctx.add(new THREE.Mesh(mergeBoxes(ng), mat({ color: '#2a170c', rough: .8 }))); }
  const slope = rise / run, ang = Math.atan(slope);
  const yAt = (x) => rise + (x - sx0) * slope;
  { // glass balustrade along the living-side of the flight (x 23.75 – 26.95)
    const xa = sx0, xb = 26.95, s = new THREE.Shape([new THREE.Vector2(xa, yAt(xa)), new THREE.Vector2(xb, yAt(xb)), new THREE.Vector2(xb, yAt(xb) + 1.0), new THREE.Vector2(xa, yAt(xa) + 1.0)]);
    const gm = new THREE.Mesh(new THREE.ShapeGeometry(s), mat({ color: '#9fc6d6', rough: .05, opacity: .3, side: THREE.DoubleSide, key: 'g_front_glassDS' })); gm.position.z = 3.73; ctx.add(gm, { cast: false });
    const lenR = (xb - xa) / Math.cos(ang);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(lenR, .05, .06), mm.steel); rail.position.set((xa + xb) / 2, (yAt(xa) + yAt(xb)) / 2 + 1.02, 3.73); rail.rotation.z = ang; ctx.add(rail);
    const lenW = (29.7 - xa) / Math.cos(ang);
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, lenW, 10), mm.steel); wr.rotation.z = ang - Math.PI / 2; wr.position.set((xa + 29.7) / 2, (yAt(xa) + yAt(29.7)) / 2 + .9, 2.36); ctx.add(wr);
    ctx.box(xa - .04, 0, 3.7, xa + .04, yAt(xa) + 1.05, 3.76, mm.steel);
  }
  // under-stair: closed with a wall where it passes the hallway
  // ("UP" landing marker strip)

  // ============================================================ ROOF / SLABS / CEILINGS
  const roofPts = [[7.22, 5.62], [14.33, 5.62], [14.33, 3.74], [26.9, 3.74], [26.9, 14.75], [16.92, 14.75], [16.92, 20.73], [7.22, 20.73], [7.22, 16.2], [9.39, 16.2], [9.39, 12.78], [7.22, 12.78]];
  const roofMesh = ctx.poly(roofPts, 4.2, mm.roof, { thick: .4 });
  // ---- west stair (owned by b_garage, rises from the basement): the ground plan draws it as two flights of grey treads.
  // In the G plan cutaway the real treads are far below and greyed out, so show a flat plan-only rendering of them at grade.
  // It is visible only to orthographic plan cameras while the G cut is active (roof hidden, ground floors shown).
  { const tT = tex.custom('gf_treads', (g, n) => { const gr = g.createLinearGradient(0, 0, n, 0); gr.addColorStop(0, '#3c3a37'); gr.addColorStop(.1, '#4d4a46'); gr.addColorStop(.14, '#9a968f'); gr.addColorStop(1, '#6f6b66'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 64);
    const tM = mat({ color: '#ffffff', map: tT, tile: .28, rough: 1 }), lM = mat({ color: '#8c887f', rough: 1 }), eM = mat({ color: '#3c3a37', rough: 1 });
    const ov = [];
    ov.push(ctx.box(8.25, 0, 3.98, 10.77, .012, 5.55, tM, { cast: false }), ctx.box(11.75, 0, 3.98, 14.27, .012, 5.55, tM, { cast: false }));
    ov.push(ctx.box(7.45, 0, 3.98, 8.25, .01, 5.55, lM, { cast: false }), ctx.box(10.77, 0, 3.98, 11.75, .01, 5.55, lM, { cast: false }), ctx.box(14.27, 0, 3.98, 14.35, .01, 5.55, lM, { cast: false }));
    ov.push(ctx.box(7.45, .012, 4.72, 14.3, .02, 4.76, eM, { cast: false })); // central divider / handrail line
    for (const x of [10.77, 11.75]) ov.push(ctx.box(x - .02, .012, 3.98, x + .02, .02, 5.55, eM, { cast: false }));
    ov.forEach((m) => { m.visible = false; });
    const hook = (r, sc, cam) => { const on = !!cam.isOrthographicCamera && !roofMesh.visible && livingFloor.visible; ov.forEach((m) => { m.visible = on; }); };
    // attach to the scene once the group is in it (scene.onBeforeRender runs before visibility culling)
    const attach = () => { let o = ctx.group; while (o.parent) o = o.parent; if (!o.isScene) return false; const prev = o.onBeforeRender; o.onBeforeRender = function (r, sc, cam, ...rest) { if (prev) prev.call(this, r, sc, cam, ...rest); hook(r, sc, cam); }; return true; };
    if (!attach()) { let tries = 0; const t = setInterval(() => { if (attach() || ++tries > 200) clearInterval(t); }, 25); } }
  // parapets (not along x=26.9, where the first-floor stair hall abuts)
  const para = (x0, z0, x1, z1) => ctx.box(x0, 4.2, z0, x1, 5.0, z1, mm.ext);
  para(7.22, 5.62, 14.45, 5.87); para(14.33, 3.74, 14.58, 5.87); para(14.33, 3.74, 22.0, 3.99); para(22.0, 3.74, 26.9, 3.92);
  para(7.22, 5.62, 7.47, 12.9); para(7.22, 12.66, 9.51, 12.9); para(9.15, 12.66, 9.39, 16.32); para(7.22, 16.08, 9.39, 16.32);
  para(7.22, 16.08, 7.47, 20.73); para(7.22, 20.48, 16.92, 20.73); para(16.67, 14.75, 16.92, 20.73); para(16.67, 14.5, 26.9, 14.75);
  // slabs under the first floor (3.8 – 4.18), voids over the hallway left open
  const slab = (x0, z0, x1, z1) => { ctx.box(x0, 3.8, z0, x1, 4.18, z1, mm.ext); ctx.rect(x0, z0, x1, z1, 3.795, mm.ceiling, { up: false }); };
  slab(26.9, 3.82, 29.05, 14.75); slab(32.05, 3.82, 34.72, 8.0); slab(32.05, 10.3, 34.72, 14.75); slab(32.05, 8.0, 32.55, 10.3);
  slab(29.05, 3.82, 32.05, 4.06); slab(29.05, 7.1, 32.05, 11.25); slab(29.05, 14.6, 32.05, 14.75);
  slab(22.0, 2.07, 23.75, 3.74); slab(29.75, 2.07, 34.72, 3.82);
  // ceilings under the roof, with a perimeter bulkhead + cove light
  const cove = (x0, z0, x1, z1, w = .5) => {
    ctx.rect(x0, z0, x1, z1, 3.795, mm.ceiling, { up: false });
    const yb = 3.45; ctx.box(x0, yb, z0, x1, 3.8, z0 + w, mm.cove); ctx.box(x0, yb, z1 - w, x1, 3.8, z1, mm.cove);
    ctx.box(x0, yb, z0 + w, x0 + w, 3.8, z1 - w, mm.cove); ctx.box(x1 - w, yb, z0 + w, x1, 3.8, z1 - w, mm.cove);
    const e = .04; ctx.box(x0 + w, yb, z0 + w, x1 - w, yb + .03, z0 + w + e, mm.glow); ctx.box(x0 + w, yb, z1 - w - e, x1 - w, yb + .03, z1 - w, mm.glow);
    ctx.box(x0 + w, yb, z0 + w, x0 + w + e, yb + .03, z1 - w, mm.glow); ctx.box(x1 - w - e, yb, z0 + w, x1 - w, yb + .03, z1 - w, mm.glow);
  };
  const lights = (x0, z0, x1, z1, nx, nz, y = 3.8) => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ctx.downlight(x0 + (x1 - x0) * (i + .5) / nx, z0 + (z1 - z0) * (j + .5) / nz, y, .07); };
  cove(7.47, 5.88, 14.35, 12.62); lights(8.2, 6.6, 13.6, 11.9, 4, 4, 3.45);
  ctx.rect(12.17, 12.62, 14.35, 14.74, 3.795, mm.ceiling, { up: false }); lights(12.2, 12.7, 14.3, 14.7, 1, 2);
  cove(14.56, 3.97, 26.9, 14.58, .6); lights(15.4, 4.8, 26.1, 13.8, 6, 5, 3.45);
  ctx.rect(7.47, 16.2, 9.3, 20.5, 3.795, mm.ceiling, { up: false }); ctx.rect(9.3, 14.74, 16.8, 20.5, 3.795, mm.ceiling, { up: false });
  ctx.rect(9.38, 12.78, 12.03, 14.62, 3.795, mm.ceiling, { up: false }); lights(9.4, 12.8, 12.0, 14.6, 2, 1);
  lights(7.6, 16.4, 9.2, 20.3, 1, 3); lights(10.2, 15.2, 16.4, 20.2, 4, 3);
  lights(26.95, 4.2, 29.0, 14.6, 1, 6); lights(32.1, 4.2, 34.4, 7.9, 1, 2); lights(32.1, 10.4, 34.4, 14.6, 1, 3); lights(29.2, 7.3, 31.9, 11.1, 2, 2);
  ctx.rect(22.19, 2.25, 23.75, 3.74, 3.795, mm.ceiling, { up: false });
  // ============================================================ SKIRTING (dark wood)
  skirt(7.47, 5.88, 14.35, 5.9); skirt(7.47, 5.9, 7.49, 12.62); skirt(14.33, 5.9, 14.35, 12.62);
  skirt(14.56, 3.97, 22.0, 3.99); skirt(14.56, 3.99, 14.58, 14.58); skirt(34.46, 4.04, 34.48, 14.8);
  skirt(7.48, 16.21, 7.5, 18.4); skirt(7.48, 20.0, 7.5, 20.47); skirt(9.4, 17.77, 12.03, 17.79);

  // ============================================================ WOMAN SALOON furniture (beige)
  const beige = '#d5c6a8', beigeL = '#dcd0b8';
  const ws = []; const CR = { body: '#bfb6a4', seat: '#cbc3b2', pillow: '#d8d1c2' };
  ws.push([sideBox(.85, .6, .42, fab('#c9c1b0')), 8.05, 6.42, 0]);
  ws.push([softSofa({ len: .8, depth: .72, cushions: 1, pillows: 1, ...CR }), 9.1, 6.42, 0]);
  ws.push([softSofa({ len: 2.15, depth: .78, cushions: 3, ...CR }), 10.87, 6.43, 0]);
  ws.push([softSofa({ len: .8, depth: .72, cushions: 1, pillows: 1, ...CR }), 12.6, 6.42, 0]);
  ws.push([sideBox(.85, .6, .42, fab('#c9c1b0')), 13.62, 6.42, 0]);
  ws.push([softSofa({ len: 1.45, depth: .82, cushions: 2, ...CR }), 8.02, 7.6, Math.PI / 2]);
  ws.push([sideBox(.62, .72, .42, fab('#c9c1b0')), 8.02, 8.82, 0]);
  ws.push([softSofa({ len: 2.05, depth: .82, cushions: 2, ...CR }), 8.02, 10.42, Math.PI / 2]);
  ws.push([softSofa({ len: 2.0, depth: .8, cushions: 2, ...CR }), 13.68, 7.9, -Math.PI / 2]);
  ws.push([sideBox(.62, .72, .42, fab('#c9c1b0')), 13.68, 9.42, 0]);
  ws.push([softSofa({ len: 1.45, depth: .8, cushions: 2, ...CR }), 13.68, 10.72, -Math.PI / 2]);
  ws.push([softSofa({ len: .72, depth: .72, cushions: 1, pillows: 1, ...CR }), 8.95, 12.02, Math.PI]);
  ws.push([sideBox(.7, .65, .42, fab('#c9c1b0')), 9.9, 12.04, 0]);
  ws.push([softSofa({ len: 1.5, depth: .78, cushions: 2, ...CR }), 11.15, 12.04, Math.PI]);
  ws.forEach(([o, x, z, r]) => place(o, x, z, r, solid));
  ctx.cyl(8.1, 0, 12.02, .34, .5, mat({ color: '#e9dcc4', rough: .5 }), 28, solid);
  ctx.box(11.07 - 1.875, 0, 9.4 - 2, 11.07 + 1.875, .03, 9.4 + 2, mm.shagSaloon);

  // ============================================================ LIVING furniture (taupe)
  const taupe = '#9e9384', taupeD = '#b3a998';
  ctx.box(19.9 - 1.85, 0, 9.1 - 2, 19.9 + 1.85, .035, 9.1 + 2, mm.shagLiving);
  place(softSofa({ len: 1.85, depth: .85, cushions: 2, pillows: 1 }), 18.15, 6.37, 0, solid);
  place(softSofa({ len: 1.85, depth: .85, cushions: 2, pillows: 1 }), 21.0, 6.37, 0, solid);
  place(softSofa({ len: 3.0, depth: .86, cushions: 3 }), 22.37, 9.25, -Math.PI / 2, solid);
  place(softSofa({ len: 2.5, depth: .9, cushions: 3 }), 20.55, 12.08, Math.PI, solid);
  place(softSofa({ len: 1.95, depth: .88, cushions: 2, pillows: 1 }), 17.6, 11.55, Math.PI * .75, solid);
  place(sideBox(.62, .45, .42, F.fabric(taupeD)), 19.55, 7.06, 0, solid);
  place(sideBox(.5, .55, .45, F.fabric(taupeD)), 22.35, 7.0, .5, solid);
  place(sideBox(.42, .72, .42, F.fabric(taupeD)), 18.87, 12.12, 0, solid);
  place(sideBox(.5, .55, .45, F.fabric(taupeD)), 22.35, 11.6, -.5, solid);
  // long dark-wood table with three tub chairs
  { const g = grp(); bxg(g, 1.45, .06, 3.6, 0, .74, 0, mm.darkWood); bxg(g, .9, .7, .12, 0, .37, -1.4, mm.darkWoodLow); bxg(g, .9, .7, .12, 0, .37, 1.4, mm.darkWoodLow); place(g, 24.83, 9.25, 0, solid); }
  for (const z of [8.12, 9.2, 10.3]) place(tubChair('#8a5f40'), 23.62, z, Math.PI / 2, solid);
  place(lounge('#6f87a3', .8, .8), 26.3, 8.5, -0.93, solid);
  // dark-wood console against the saloon wall (living side)
  { const g = grp(); bxg(g, .65, .8, 3.65, 0, .4, 0, mm.darkWood); place(g, 14.9, 9.12, 0, solid);
    ctx.box(14.58, 1.2, 7.9, 14.62, 2.6, 10.35, mat({ color: '#d7dee1', rough: .05, metal: .9 })); }
  // sheer curtains at the ends of the courtyard glazing
  const curt = mat({ color: '#f1eadc', map: tex.carpet('#efe7d8', 54), tile: .6, rough: 1, opacity: .92 });
  for (const x of [17.0, 26.25]) ctx.box(x, .02, 14.4, x + .65, 3.4, 14.52, curt);
  ctx.box(16.95, 3.38, 14.38, 26.9, 3.43, 14.42, mm.steel);

  // ============================================================ ENTRANCE furniture
  { const g = grp(); bxg(g, 1.7, .82, .5, 0, .41, 0, mm.darkWood); place(g, 10.75, 18.05, 0, solid);
    ctx.box(10.0, 1.2, 17.76, 11.5, 2.5, 17.79, mat({ color: '#d7dee1', rough: .05, metal: .9 }));
  }
  place(softSofa({ len: .78, depth: .78, body: '#b9ae98', seat: '#c6bca8', pillow: '#d2c9b8', cushions: 1, pillows: 1 }), 9.25, 18.42, Math.PI / 4, solid);
  place(softSofa({ len: .78, depth: .78, body: '#b9ae98', seat: '#c6bca8', pillow: '#d2c9b8', cushions: 1, pillows: 1 }), 12.15, 18.38, -Math.PI / 4, solid);
  { const dM = mat({ color: '#3a332e', rough: .9 }), iM = mat({ color: '#ffffff', map: tex.wood('#a08452', 4, 61), tile: 1, rough: .8 });
    ctx.box(9.38, 0, 14.82, 9.74, 1.0, 17.6, dM, solid); ctx.box(9.47, 1.0, 14.9, 9.65, 1.01, 17.4, iM);
    ctx.box(9.74, 0, 17.3, 12.03, 1.0, 17.6, dM, solid); ctx.box(9.65, 1.0, 17.4, 11.95, 1.01, 17.5, iM); }
  // entrance runner rug + plant

  // ============================================================ WC + court
  place(F.vanity({ len: .9, top: '#efe9df', cab: '#5a3d27' }), 9.7, 13.95, Math.PI / 2, solid);
  place(F.toilet(), 11.68, 13.98, -Math.PI / 2, solid);
  ctx.rect(11.05, 12.85, 12.0, 13.9, L.G + .006, mat({ color: '#ffffff', map: tex.tiles('#d2d3d4', '#55595e', 6, .05, 55), tile: 1, rough: .3 }), { walk: false });
  ctx.box(11.0, 0, 12.85, 11.05, 2.1, 13.9, mm.glass); ctx.box(11.5, .02, 13.3, 11.6, .03, 13.4, mm.steel);
  { const t = F.tree({ h: 3.2, r: .9, leaf: '#6aa83a' }); place(t, 8.33, 14.4); ctx.cyl(8.33, 0, 14.4, .85, .06, mat({ color: '#8a7a5a', rough: .9 }), 32); ctx.cyl(8.33, 0, 14.4, .78, .07, mm.grass, 32); }

  // ============================================================ HALLWAY + MINI KITCHEN
  const kcab = mm.darkWood;
  ctx.box(27.05, 0, 7.5, 28.25, .9, 8.2, kcab, solid);             // north run
  ctx.box(27.05, 0, 8.2, 27.55, .9, 10.4, kcab, solid);            // west run
  ctx.box(27.05, 0, 10.4, 29.05, .9, 11.05, kcab, solid);          // south run
  ctx.box(28.25, 0, 7.5, 29.05, 2.0, 8.2, mat({ color: '#6e5866', rough: .8 }), solid); // fridge (mauve)
  ctx.box(27.05, .9, 7.5, 28.25, .93, 8.2, mat({ color: '#3a2618', rough: .85 }));
  ctx.box(27.3, .93, 9.0, 27.5, .96, 9.6, M.steel()); // sink
  ctx.box(28.3, .9, 10.5, 28.9, .92, 10.95, M.black()); // hob
  // benches and consoles
  ctx.box(27.06, 0, 7.0, 28.55, .45, 7.3, mm.darkWoodLow, solid); ctx.box(27.06, 0, 11.2, 28.55, .45, 11.55, mm.darkWoodLow, solid);
  ctx.box(27.06, 0, 4.03, 28.53, .8, 4.32, mm.darkWoodLow, solid); ctx.box(29.08, 0, 4.03, 32.06, .8, 4.32, mm.darkWoodLow, solid);
  ctx.box(27.06, 0, 14.45, 28.53, .45, 14.8, mm.darkWoodLow, solid); ctx.box(32.67, 0, 14.5, 33.9, .45, 14.8, mm.darkWoodLow, solid);
  // armchairs + round table
  const mauve = '#c0a49c';
  place(lounge(mauve, .85, .8), 29.45, 4.9, Math.PI / 4, solid);
  place(lounge(mauve, .85, .8), 31.8, 4.9, -Math.PI / 4, solid);
  { const g = grp(); const top = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .03, 24), mat({ color: '#9aa0a3', rough: .2, metal: .4 })); top.position.y = .55; g.add(top); bxg(g, .04, .55, .04, 0, .275, 0, M.frame()); place(g, 30.65, 4.8); }
  // planters with bushy plants beside the light well
  { const leafM = mat({ color: '#4a5444', rough: .85 }), potM = mat({ color: '#3b3330', rough: .7 }); const R = rngf(77);
    for (const z of [7.3, 11.15]) {
      ctx.cyl(33.6, 0, z, .3, .45, potM, 20, solid);
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = i ? .3 + R() * .12 : 0; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.26 + R() * .1, 0), leafM); b.position.set(33.6 + Math.cos(a) * rr, .75 + R() * .45, z + Math.sin(a) * rr); b.rotation.set(R() * 3, R() * 3, 0); ctx.add(b); }
    } }

  // ============================================================ BALCONY
  const cream = '#efebe2';
  place(sofaP({ len: 2.6, depth: .62, color: cream, cushions: 3, pillow: '#d8cfbf' }), 30.35, 1.55, Math.PI / 2, solid);
  place(sofaP({ len: 2.3, depth: .62, color: cream, cushions: 3, pillow: '#d8cfbf' }), 31.8, .4, 0, solid);
  place(sideBox(.7, .6, .4, F.fabric(cream)), 30.4, .45, 0, solid);
  place(sideBox(.65, .8, .4, F.fabric(cream)), 30.85, 2.85, 0, solid);
  place(F.coffeeTable({ w: 1.7, d: .5, h: .35, top: '#f2f0ea' }), 32.05, 1.65, 0, solid);
  place(lounge(cream, .75, .72), 34.0, 1.42, -Math.PI / 2, solid);
  place(lounge(cream, .75, .72), 34.0, 2.65, -Math.PI / 2, solid);
  ctx.cyl(33.95, 0, .45, .24, .5, M.white(), 24, solid);
  // glass balustrade (north + east), top rail
  const bal = (x1, z1, x2, z2) => { ctx.wall(x1, z1, x2, z2, { h: 1.1, t: .03, m: mm.glass, collide: true }); };
  bal(29.97, .06, 34.62, .06); bal(34.58, 0, 34.58, 3.82);
  ctx.box(29.97, 1.08, .02, 34.62, 1.13, .1, mm.steel); ctx.box(34.54, 1.08, 0, 34.62, 1.13, 3.82, mm.steel);
  blue(29.97, 0, 34.62, .1); blue(34.52, 0, 34.66, 3.82);
}
