// Piece: g_service — Ground floor: family dining (double height, L-shaped void above), office, WC + washbasin alcove,
// laundry, main kitchen, service corridor / lobby, stair hall (G -> F flights), back vestibule, storage.
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'Family Dining', level: 'G', x: 31, z: 22.4, yaw: 0 },
  { name: 'Office', level: 'G', x: 35, z: 20.4, yaw: 0 },
  { name: 'Main Kitchen', level: 'G', x: 43.5, z: 19.5, yaw: 0 },
  { name: 'Laundry', level: 'G', x: 39.7, z: 18.6, yaw: 0 },
  { name: 'Stair hall (G)', level: 'G', x: 41.1, z: 23, yaw: -Math.PI / 2 },
];
export const views = [
  { name: 'family dining from lobby', level: 'G', x: 33.2, z: 23.0, yaw: 35, pitch: -6, fov: 70 },
  { name: 'main kitchen from door', level: 'G', x: 41.2, z: 20.7, yaw: -35, pitch: -12, fov: 70 },
  { name: 'office', level: 'G', x: 34.6, z: 20.8, yaw: -30, pitch: -12, fov: 70 },
  { name: 'stair hall', level: 'G', x: 40.9, z: 23.2, yaw: -75, pitch: 10, fov: 70 },
];

const H = 3.8; // ground ceiling
function G() { return new THREE.Group(); }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bx(g, w, h, d, x, y, z, m, ry = 0) { return F.bx(g, w, h, d, x, y, z, m, ry); }

export function build(ctx) {
  const y0 = L.G;
  // ---------------- materials ----------------
  // pale desaturated marble, 1.2 m slabs with faint seams (texture = 2x2 slabs)
  const marbleTex = tex.custom('gs_marble2', (g, n) => {
    const r = mulberry(41); g.fillStyle = '#e2cfb4'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 260; i++) { g.globalAlpha = .03 + r() * .05; g.fillStyle = r() < .5 ? '#ebe2d0' : '#c4b69c'; const R0 = 10 + r() * 60; g.beginPath(); g.arc(r() * n, r() * n, R0, 0, 7); g.fill(); }
    g.globalAlpha = .22; g.strokeStyle = '#a8987c'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * n, y = r() * n; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - .3) * 70; y += (r() - .5) * 50; g.lineTo(x, y); } g.stroke(); }
    g.globalAlpha = .45; g.fillStyle = '#ad9f86'; [0, n / 2].forEach((p) => { g.fillRect(p, 0, 1.5, n); g.fillRect(0, p, n, 1.5); }); g.globalAlpha = 1;
  });
  const cream = mat({ color: '#ffffff', map: marbleTex, tile: 2.4, rough: .6 });
  // white ceramic ~0.3 m tiles, visible mid-grey grout, slight per-tile tone variation
  const tileTex = (key, cells) => tex.custom(key, (g, n) => {
    const r = mulberry(cells * 7); g.fillStyle = '#8f9092'; g.fillRect(0, 0, n, n); const c = n / cells, gw = Math.max(3, c * .09);
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { const v = 222 + Math.round((r() - .5) * 18); g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(i * c + gw / 2, j * c + gw / 2, c - gw, c - gw);
      g.globalAlpha = .08; g.fillStyle = '#bfc2c6'; g.beginPath(); g.arc(i * c + r() * c, j * c + r() * c, c * .3, 0, 7); g.fill(); g.globalAlpha = 1; }
  });
  const whiteTile = mat({ color: '#ffffff', map: tileTex('gs_tile8', 8), tile: 2.0, rough: .4 });
  const smallTile = mat({ color: '#ffffff', map: tileTex('gs_tile10', 10), tile: 2.5, rough: .4 });
  // speckled gold/brown granite for the kitchen counters
  const graniteTex = tex.custom('gs_granite', (g, n) => {
    const r = mulberry(53); g.fillStyle = '#c29a4a'; g.fillRect(0, 0, n, n);
    const cols = ['#7a5a2a', '#4a3820', '#e8d29a', '#a67c38', '#d8b062', '#f4e6c0', '#e0bc6a'];
    for (let i = 0; i < 9000; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.globalAlpha = .25 + r() * .4; const s = 2 + r() * 4; g.fillRect(r() * n, r() * n, s, s); } g.globalAlpha = 1;
  });
  const granite = mat({ color: '#ffffff', map: graniteTex, tile: 3, rough: .6 });
  const graniteEdge = mat({ color: '#5a4228', rough: .6 });
  const greyStone = mat({ color: '#c3c5c2', map: tex.marble('#c3c5c2', '#aeb2ae', 44), tile: 2, rough: .3 });
  const whiteStone = mat({ color: '#f6f6f4', map: tex.marble('#f7f7f5', '#e2e2e0', 45), tile: 2, rough: .3 });
  const plaster = M.plaster();
  const whiteWall = mat({ color: '#f6f4ef', map: tex.plaster('#f5f3ee', 46), tile: 2, rough: .85 });
  const ceil = M.ceiling();
  const ext = M.extStone();
  const darkWood = mat({ color: '#ffffff', map: tex.wood('#6a4434', 6, 47), tile: 1.4, rough: .85 });
  const redWood = mat({ color: '#66302a', rough: .85 });
  const oak = mat({ color: '#a3804f', rough: .6 });
  const lightBrown = mat({ color: '#7c6355', rough: .5 });
  const steelBlue = mat({ color: '#687e91', rough: .45, metal: .1 });
  const steel = M.steel();
  const blackGlass = mat({ color: '#151618', rough: .1, metal: .3 });
  const frame = M.frame();
  const sill = mat({ color: '#2f9ad4', rough: .4, metal: .2 });
  const facadeDark = mat({ color: '#3a3a3a', rough: .7 });
  const paleGlass = mat({ color: '#e8eef0', rough: .05, opacity: .18, transparent: true, side: THREE.DoubleSide, key: 'gs_paleglass' });
  const skirt = mat({ color: '#b9a888', rough: .5 });
  const greyRail = mat({ color: '#e4e6e8', rough: .4 });
  const paving = mat({ color: '#ffffff', map: tex.basket('#8f8f8f', 8, 51), tile: 2.4, rough: .9 });

  const DOOR = '#5e3434';
  const doorM = mat({ color: '#5c3838', rough: .9 });
  const W = (x1, z1, x2, z2, o = {}) => ctx.wall(x1, z1, x2, z2, { y0, h: H, t: 0.24, m: plaster, ...o });

  // ---------------- floors ----------------
  ctx.rect(27.06, 14.75, 33.9, 23.75, y0, cream);           // family dining
  ctx.rect(33.9, 14.78, 35.8, 17.2, y0, cream);             // washbasin alcove
  ctx.rect(33.9, 17.2, 37.8, 21.25, y0, cream);             // office
  ctx.rect(37.8, 17.85, 40.44, 21.25, y0, cream);           // corridor
  ctx.rect(33.9, 21.25, 40.44, 23.75, y0, cream);           // lobby
  ctx.rect(35.8, 14.78, 37.8, 17.2, y0, smallTile);         // WC
  ctx.rect(37.8, 14.78, 40.44, 17.85, y0, whiteTile);       // laundry
  ctx.rect(40.44, 14.78, 47.06, 21.28, y0, whiteTile);      // kitchen
  ctx.rect(46.9, 18.8, 48.85, 21.28, y0 + 0.008, whiteTile);   // east bay of the kitchen L (raised 8 mm over site paving)
  ctx.rect(40.44, 21.28, 41.8, 23.75, y0, greyStone);      // stair hall west landing
  ctx.rect(44.85, 21.28, 46.5, 23.72, y0, whiteStone);      // back vestibule
  ctx.rect(46.5, 21.28, 48.85, 25.9, y0, whiteTile);        // storage
  // outdoor grey service paving (north + east of kitchen)
  ctx.rect(34.62, 14.0, 49.0, 14.58, y0 + 0.004, paving);
  ctx.rect(47.15, 14.58, 49.0, 18.7, y0 + 0.004, paving);

  // ---------------- exterior walls ----------------
  const ew = (x1, z1, x2, z2, o = {}) => ctx.wall(x1, z1, x2, z2, { y0, h: 4.18, t: 0.24, ...o });
  ew(33.83, 14.66, 47.15, 14.66, { mA: whiteWall, mB: ext });            // north (A = south/interior)
  ew(47.06, 14.66, 47.06, 18.8, { mA: whiteWall, mB: ext });             // kitchen east (travel +z: right = west = interior)
  ew(47.06, 18.8, 48.95, 18.8, { mA: whiteWall, mB: ext });
  ew(48.85, 18.8, 48.85, 25.98, { mA: whiteWall, mB: ext });
  ew(46.45, 25.9, 48.97, 25.9, { mA: ext, mB: whiteWall });

  // ---------------- dining: double-height glazing at x = 27 ----------------
  const gz0 = 14.75, gz1 = 23.75, gTop = 4.18;
  ctx.box(26.97, 0.07, gz0, 27.01, gTop - .08, gz1, paleGlass, { collide: true, cast: false });
  ctx.box(26.92, y0, gz0, 27.06, 0.07, gz1, facadeDark);                // dark sill / frame line
  [gz0 + .08, 16.3, 17.6, 18.9, 20.2, 21.5, 22.8, gz1 - .08].forEach((z) => ctx.box(26.88, y0, z - .1, 27.08, gTop, z + .1, facadeDark));   // square posts
  ctx.box(26.93, gTop - .08, gz0, 27.07, gTop, gz1, frame);
  // sheer curtains gathered at the glazing ends
  const sheer = mat({ color: '#f4efe4', rough: 1, opacity: .85, transparent: true, side: THREE.DoubleSide, key: 'gs_sheer' });
  ctx.box(27.1, 3.72, 14.8, 27.32, 3.76, 23.7, frame);
  // double-height south wall of the void (my half) and the dining's south wall
  W(27.06, 23.75, 44.85, 23.75, { t: 0.1, off: 0.05, mB: plaster, mA: plaster, openings: [
    { at: 37.05 - 27.06, w: 1.0, h: 2.65 }, { at: 39.6 - 27.06, w: 1.2, h: 2.65 } ] });
  ctx.wall(27.06, 23.7, 33.95, 23.7, { y0: H, h: gTop - H, t: 0.1, m: plaster });
  // north edge towards the hallway (g_front): two black columns + wood-clad wall returns
  ctx.wall(28.6, 14.5, 29.1, 14.5, { y0, h: H, t: 0.5, m: plaster });
  ctx.wall(32.1, 14.5, 32.6, 14.5, { y0, h: H, t: 0.5, m: plaster });
  ctx.box(27.06, y0, 14.55, 28.6, H, 14.72, oak, { collide: true });
  ctx.box(32.6, y0, 14.58, 33.9, H, 15.0, oak, { collide: true });

  // ---------------- interior walls ----------------
  // washbasin alcove west stubs
  W(33.88, 14.78, 33.88, 15.33, {}); W(33.88, 16.33, 33.88, 17.2, {});
  // alcove + WC south wall / office north
  W(33.81, 17.18, 37.84, 17.18, {});
  // WC west wall with door
  W(35.8, 14.78, 35.8, 17.18, { mA: plaster, mB: whiteWall, openings: [{ at: 1.05, w: 0.9, h: 2.65, door: { swing: 1, open: 1.1, color: DOOR } }] });
  // WC / laundry and office / corridor wall
  W(37.79, 14.78, 37.79, 21.3, { m: whiteWall });
  // laundry south wall (doorway, no leaf)
  W(37.79, 17.86, 40.44, 17.86, { m: whiteWall, openings: [{ at: 1.98, w: 0.82, h: 2.65 }] });
  // laundry/kitchen west wall + stair hall west wall
  W(40.44, 14.78, 40.44, 23.75, { m: whiteWall, openings: [
    { at: 20.75 - 14.78, w: 0.95, h: 2.65, door: { swing: 1, open: 1.0, color: DOOR } },
    { at: 23.0 - 14.78, w: 1.05, h: 2.65, door: { swing: 1, open: 1.0, color: DOOR } }] });
  // office glazing (west) to dining
  ctx.wall(33.88, 17.18, 33.88, 21.3, { y0, h: H, t: 0.12, m: plaster, openings: [
    { at: 1.17, w: 2.2, y0: 0.06, h: 2.7, glass: true }, { at: 3.22, w: 1.8, y0: 0.06, h: 2.7, glass: true }] });
  ctx.box(33.8, y0, 17.25, 33.97, 0.07, 21.25, sill);
  // office south wall with door
  W(33.81, 21.25, 37.84, 21.25, { openings: [{ at: 34.83 - 33.81, w: 0.95, h: 2.65, door: { swing: 1, open: 1.1, color: DOOR } }] });
  // kitchen south wall with door to vestibule
  W(40.44, 21.28, 48.85, 21.28, { m: whiteWall, openings: [{ at: 45.5 - 40.44, w: 1.0, h: 2.65, door: { swing: 1, open: 1.1, color: DOOR } }] });
  // stair hall east wall / vestibule
  W(44.85, 21.28, 44.85, 23.75, {});
  // vestibule south wall with door
  W(44.85, 23.72, 46.5, 23.72, { openings: [{ at: 45.8 - 44.85, w: 0.85, h: 2.65, door: { swing: 1, open: 1.0, color: DOOR } }] });
  // storage west wall with door
  W(46.5, 21.28, 46.5, 25.95, { openings: [{ at: 0.6, w: 0.85, h: 2.65, door: { swing: 1, open: 1.0, color: DOOR } }] });

  // maroon door slabs in the openings (the plan draws each doorway as a maroon slab + swing line)
  [[35.68, 15.38, 35.92, 16.28], [34.355, 21.13, 35.305, 21.37], [40.32, 20.275, 40.56, 21.225], [40.32, 22.475, 40.56, 23.525],
   [45.0, 21.16, 46.0, 21.4], [45.375, 23.6, 46.225, 23.84], [46.38, 21.455, 46.62, 22.305],
   [36.55, 23.7, 37.55, 23.8], [39.0, 23.7, 40.2, 23.8]].forEach(([a, b, c, d]) => ctx.box(a, y0, b, c, .035, d, doorM));

  // soft contact shadow along dining / lobby walls (gradient decal, dark at the wall)
  { const aoTex = tex.custom('gs_ao', (g, n) => { const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, 'rgba(70,55,40,0.32)'); gr.addColorStop(1, 'rgba(70,55,40,0)'); g.clearRect(0, 0, n, n); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 64);
    const aoM = (rot) => mat({ color: '#ffffff', map: aoTex, tile: 1, transparent: true, rough: 1, key: 'gs_ao' + rot });
    const strip = (cx, cz, w, d, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), aoM(rot)); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(cx, y0 + .003, cz); m.renderOrder = 1; m.material.depthWrite = false; ctx.add(m, { cast: false }); };
    const D = .45;
    strip(30.45, 23.70 - D / 2, 6.7, D, Math.PI);          // dining south wall, fades north
    strip(37.0, 23.70 - D / 2, 6.6, D, Math.PI);           // lobby south wall
    strip(33.82 - D / 2, 19.25, 4.0, D, -Math.PI / 2);     // office glazing / alcove, fades west
    strip(33.82 - D / 2, 15.9, 2.2, D, -Math.PI / 2);
    strip(27.07 + D / 2, 19.25, 8.9, D, Math.PI / 2);      // facade, fades east
    strip(36.0, 21.37 + D / 2, 4.0, D, 0);                 // office south wall, fades south
  }
  // skirting in dining / lobby
  [[27.1, 23.62, 33.9, 23.68], [33.9, 23.62, 36.5, 23.68], [37.6, 23.62, 39.0, 23.68]].forEach(([a, z0, b, z1]) => ctx.box(a, y0, z0, b, .1, z1, skirt));

  // ---------------- dining furniture ----------------
  // custom dining set: walnut plank top (grain lengthwise = along z), crisp white chairs with grey back bars, contact shadow
  { const walnutTex = tex.custom('gs_walnut', (g, n) => {
      const r = mulberry(61); g.fillStyle = '#4a2a1a'; g.fillRect(0, 0, n, n);
      const planks = 5, pw = n / planks;
      for (let p = 0; p < planks; p++) { const base = [74 + r() * 26, 42 + r() * 16, 26 + r() * 10]; g.fillStyle = `rgb(${base.map(Math.round)})`; g.fillRect(p * pw, 0, pw, n);
        for (let k = 0; k < 40; k++) { const x = p * pw + r() * pw, w = .6 + r() * 3; g.globalAlpha = .2 + r() * .35; g.fillStyle = r() < .55 ? '#b07a4c' : '#26140a'; g.fillRect(x, 0, w, n); }
        g.globalAlpha = .6; g.fillStyle = '#21120a'; g.fillRect(p * pw, 0, 1.5, n); g.globalAlpha = 1; }
    });
    const walnut = mat({ color: '#ffffff', map: walnutTex, tile: 1.3, rough: .55 });
    const chairW = mat({ color: '#ffffff', rough: .8 }), chairE = mat({ color: '#6c6c6c', rough: .7 }), legM = mat({ color: '#3a2618', rough: .6 });
    const tx = 31.06, tz = 19.0, tw = 1.25, tl = 2.5;
    // contact shadow under the whole set
    const shTex = tex.custom('gs_shadow', (g, n) => { g.clearRect(0, 0, n, n); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(60,40,25,0.42)'; g.fillRect(n * .14, n * .14, n * .72, n * .72); g.filter = 'none'; }, 128);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(tw + 1.9, tl + 1.9), mat({ color: '#ffffff', map: shTex, tile: 1, transparent: true, rough: 1, key: 'gs_shadowM' }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(tx, y0 + .004, tz); sh.material.depthWrite = false; ctx.add(sh, { cast: false });
    ctx.box(tx - tw / 2, .72, tz - tl / 2, tx + tw / 2, .77, tz + tl / 2, walnut, { collide: true });
    ctx.box(tx - tw / 2 + .02, .70, tz - tl / 2 + .02, tx + tw / 2 - .02, .72, tz + tl / 2 - .02, legM);
    ctx.box(tx - .08, y0, tz - tl / 2 + .2, tx + .08, .7, tz + tl / 2 - .2, walnut);          // plinth base
    ctx.box(tx - .3, y0, tz - tl / 2 + .2, tx + .3, .04, tz + tl / 2 - .2, walnut);
    // chair facing direction (dx,dz) = towards table; back on the opposite side
    const chair = (cx, cz, dx, dz) => { const g = G();
      bx(g, .46, .08, .46, 0, .47, 0, chairW);                            // seat
      bx(g, .5, .02, .5, 0, .42, 0, chairE);                              // dark rim under seat (reads as an edge)
      bx(g, .46, .5, .07, 0, .75, -.2, chairW); bx(g, .5, .07, .11, 0, 1.0, -.21, chairE);   // back + grey top bar
      [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]].forEach(([a, c]) => bx(g, .04, .43, .04, a, .215, c, legM));
      ctx.place(g, cx, y0, cz, Math.atan2(dx, dz), { collide: true }); };
    for (let i = 0; i < 4; i++) { const z = tz - tl / 2 + tl / 4 * (i + .5); chair(tx - tw / 2 - .25, z, 1, 0); chair(tx + tw / 2 + .25, z, -1, 0); }
    chair(tx, tz - tl / 2 - .3, 0, 1); chair(tx, tz + tl / 2 + .3, 0, -1);
  }
  // dark wood sideboard on the south wall
  { const g = G(); bx(g, 3.5, .78, .55, 0, .43, 0, darkWood); bx(g, 3.4, .06, .5, 0, .03, 0, M.black());
    for (let i = 0; i < 4; i++) bx(g, .01, .6, .01, -1.75 + .875 * (i + .5) + .43, .45, .28, mat({ color: '#2a1a10' }));
    bx(g, .5, .06, .02, .9, .45, .28, mat({ color: '#b8a77c', metal: .8, rough: .3 }));
    const v = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, .4, 16), mat({ color: '#e9e4d8', rough: .3 })); v.position.set(-1.0, 1.02, 0); g.add(v);
    ctx.place(g, 30.81, y0, 23.36, Math.PI, { collide: true }); }
  // linear pendant over the table (bottom above 2.6 m so it disappears in plan view)
  ctx.box(31.0, 2.7, 17.9, 31.12, 2.76, 20.1, M.lightPanel());
  ctx.box(31.03, 2.76, 17.95, 31.09, 2.8, 20.05, frame);
  [18.2, 19.8].forEach((z) => ctx.box(31.055, 2.8, z, 31.065, H, z + .01, steel));

  // ---------------- washbasin alcove + WC ----------------
  // plan: dark-wood vanities with round grey-white basins, grey WC fixtures
  const basinM = mat({ color: '#b9bec4', rough: .2 }), drainM = mat({ color: '#6f767d', rough: .3, metal: .5 });
  const fixM = mat({ color: '#f4f4f2', rough: .45 }); const bowlM = mat({ color: '#a9b0b6', rough: .3 });
  const mirror = mat({ color: '#cfdce3', rough: .02, metal: .9 });
  const vanity = (x0, z0, x1, z1, bx_, bz_, wallZ) => {
    ctx.box(x0, y0, z0, x1, .86, z1, lightBrown, { collide: true });
    ctx.box(x0, .86, z0, x1, .9, z1, lightBrown);
    if (bx_ != null) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.21, .16, .14, 24), basinM); b.position.set(bx_, .97, bz_); ctx.add(b);
      const d = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .01, 20), mat({ color: '#9aa1a8', rough: .2 })); d.position.set(bx_, 1.035, bz_); ctx.add(d);
      const dr = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .012, 12), drainM); dr.position.set(bx_, 1.04, bz_); ctx.add(dr);
      ctx.box(bx_ - .02, .9, wallZ < bz_ ? wallZ + .02 : wallZ - .1, bx_ + .02, 1.15, wallZ < bz_ ? wallZ + .1 : wallZ - .02, steel);
      ctx.box(x0 + .1, 1.2, wallZ < bz_ ? wallZ : wallZ - .02, x1 - .1, 2.2, wallZ < bz_ ? wallZ + .02 : wallZ, mirror);
    }
  };
  vanity(34.0, 14.8, 35.7, 15.32, 34.6, 15.06, 14.8);       // alcove, north wall, one basin
  vanity(33.95, 16.45, 35.73, 17.11, null);                   // alcove, south counter (plain)
  vanity(36.0, 16.5, 37.7, 17.11, 36.6, 16.78, 17.11);        // WC vanity on the south wall
  const bowl = (x, z, l, cistern) => { const g = G();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .16, .4, 28), fixM); b.scale.set(.95, 1, l / .4); b.position.set(0, .2, .06); g.add(b);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 8, 28), bowlM); rim.rotation.x = Math.PI / 2; rim.scale.set(.95, l / .4, 1); rim.position.set(0, .405, .06); g.add(rim);
    const inn = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .01, 24), bowlM); inn.scale.set(.95, 1, l / .4); inn.position.set(0, .4, .07); g.add(inn);
    if (cistern) { F.rbx(g, .42, .36, .18, .05, 0, .6, -.2, fixM); bx(g, .42, .01, .18, 0, .785, -.2, bowlM); }
    ctx.place(g, x, y0, z, 0, { collide: true }); };
  bowl(36.45, 15.12, .5, true); bowl(37.05, 15.12, .44, false);
  // WC wall tiles (lower part)
  ctx.box(35.88, y0, 14.79, 37.71, 1.3, 14.81, whiteTile);

  // ---------------- office ----------------
  ctx.box(34.0, y0, 17.26, 37.55, .78, 17.88, redWood, { collide: true });
  ctx.box(34.0, .78, 17.26, 37.55, .8, 17.88, mat({ color: '#66302a', rough: .85 }));
  for (let i = 0; i < 5; i++) ctx.box(34.05 + i * .71, .05, 17.885, 34.06 + i * .71, .75, 17.89, mat({ color: '#4a1d0f' }));
  // books on credenza
  [['#2d4a6a', 34.3], ['#a33b2b', 34.42], ['#d8cfb8', 34.52], ['#2f2f2f', 36.9], ['#7a6040', 37.0]].forEach(([c, x]) => ctx.box(x, .8, 17.4, x + .08, 1.08, 17.65, mat({ color: c, rough: .7 })));
  // L desk
  const deskTop = mat({ color: '#ffffff', map: tex.custom('gs_desk', (g, n) => { const r = mulberry(71); g.fillStyle = '#7e3820'; g.fillRect(0, 0, n, n); for (let k = 0; k < 160; k++) { g.globalAlpha = .15 + r() * .3; g.fillStyle = r() < .5 ? '#b0603a' : '#4a1c0e'; g.fillRect(0, r() * n, n, .6 + r() * 3); } g.globalAlpha = 1; }), tile: 1.2, rough: .55 });
  ctx.box(35.6, .72, 18.4, 36.4, .77, 20.6, deskTop, { collide: true });
  ctx.box(36.4, .72, 20.05, 37.45, .77, 20.6, deskTop, { collide: true });
  ctx.box(35.62, y0, 18.42, 35.68, .72, 20.58, deskTop); ctx.box(36.4, y0, 20.1, 37.43, .72, 20.58, deskTop);
  ctx.box(35.6, y0, 18.4, 36.4, .72, 18.46, deskTop);
    ctx.box(35.85, .775, 19.15, 36.15, .99, 19.17, M.black());                                // monitor
  ctx.box(35.68, .77, 19.45, 36.2, .79, 19.85, mat({ color: '#2d2f33', rough: .4 }));        // closed laptop
  ctx.box(35.72, .77, 18.6, 36.02, .775, 19.0, mat({ color: '#f2efe6', rough: .9 }));         // papers
  ctx.box(36.6, .77, 20.2, 36.95, .775, 20.45, mat({ color: '#f2efe6', rough: .9 }));
  { const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .1, 18), mat({ color: '#c9b27a', rough: .3, metal: .6 })); lamp.position.set(37.2, .82, 20.33); ctx.add(lamp);
    const sh2 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .16, 18), mat({ color: '#f1e6cc', rough: .8 })); sh2.position.set(37.2, 1.25, 20.33); ctx.add(sh2);
    ctx.box(37.19, .87, 20.32, 37.21, 1.17, 20.34, M.steel()); }
  ctx.place(F.officeChair({ color: '#9aa8b5' }), 36.95, y0, 19.47, -Math.PI / 2, { collide: true });
  ctx.place(F.armchair({ color: '#c8b0a2', w: .85, d: .85 }), 34.72, y0, 18.6, 1.25, { collide: true });

  // ---------------- laundry ---------------- (plan shows an empty tiled room; appliances omitted)

  // ---------------- main kitchen ----------------
  const ctop = mat({ color: '#efeee9', map: tex.marble('#efeee9', '#cfcfcf', 53), tile: 1.2, rough: .2 });
  const run = (x0, z0, x1, z1, body, top, h = .9) => { ctx.box(x0, y0, z0, x1, h - .04, z1, body, { collide: true }); if (top === oak) { ctx.box(x0, h - .04, z0, x1, h, z1, graniteEdge); ctx.box(x0 + .025, h, z0 + .025, x1 - .025, h + .004, z1 - .025, granite); } else ctx.box(x0, h - .04, z0, x1, h, z1, top); };
  // north run (z 14.8 .. 15.58)
  run(40.56, 14.8, 42.94, 15.58, oak, oak);
  run(42.94, 14.8, 44.9, 15.58, steelBlue, mat({ color: '#6e8497', rough: .3 }));
  ctx.box(43.38, .9, 14.92, 44.08, .905, 15.46, blackGlass);
  [[43.55, 15.06], [43.9, 15.06], [43.55, 15.32], [43.9, 15.32]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.RingGeometry(.06, .1, 20), mat({ color: '#9aa0a6', rough: .4 })); r.rotation.x = -Math.PI / 2; r.position.set(x, .908, z); ctx.add(r); });
  ctx.box(44.15, .9, 14.95, 44.45, .91, 15.45, steel);
  run(44.9, 14.8, 45.7, 15.58, oak, oak);
  // tall fridge / freezer pair
  ctx.box(45.72, y0, 14.8, 46.3, 2.2, 15.55, steelBlue, { collide: true });
  ctx.box(46.32, y0, 14.8, 46.94, 2.2, 15.55, steelBlue, { collide: true });
  [46.25, 46.37].forEach((x) => ctx.box(x, .9, 15.55, x + .02, 1.6, 15.58, steel));
  // range hood above the hob (bottom above 2.6 so the plan stays clean)
  ctx.box(43.2, 2.62, 14.8, 44.25, 2.75, 15.4, steel); ctx.box(43.5, 2.75, 14.8, 43.95, H, 15.1, steel);
  // backsplash
  ctx.box(40.56, .9, 14.79, 45.7, 1.55, 14.81, mat({ color: '#e8e4dc', map: tex.tiles('#ecebe6', '#c8c6c0', 6, .02, 54), tile: .9, rough: .2 }));
  // west run (x 40.56 .. 41.38)
  run(40.56, 15.58, 41.38, 17.2, steelBlue, mat({ color: '#6e8497', rough: .3 }));
  { const sinkM = mat({ color: '#8d949a', rough: .45 }), sinkIn = mat({ color: '#5d646a', rough: .4 }), tapM = mat({ color: '#3c4146', rough: .3, metal: .6 });
    ctx.box(40.74, .9, 16.1, 41.22, .915, 16.58, sinkM);
    ctx.box(40.8, .915, 16.16, 41.16, .918, 16.52, sinkIn);
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .01, 12), sinkM); dr.position.set(40.98, .922, 16.34); ctx.add(dr);
    ctx.box(40.6, .9, 16.31, 40.67, 1.22, 16.37, tapM); ctx.box(40.6, 1.18, 16.31, 40.86, 1.22, 16.37, tapM); }
  run(40.56, 17.2, 41.38, 18.6, oak, oak);
  ctx.box(40.56, y0, 18.6, 41.38, 2.2, 19.2, steelBlue, { collide: true });     // tall oven tower
  ctx.box(41.38, .8, 18.68, 41.39, 1.4, 19.12, blackGlass);
  // small counter in the kitchen's east bay
  run(47.5, 18.92, 48.15, 19.5, oak, oak); run(48.15, 18.92, 48.73, 19.5, steelBlue, mat({ color: '#6e8497', rough: .3 }));

  // ---------------- storage ----------------
  const shelfM = mat({ color: '#7a3a3e', map: tex.wood('#7a3a3e', 4, 55), tile: 1, rough: .5 });
  const shelving = (x0, z0, x1, z1) => { ctx.box(x0, y0, z0, x1, 2.4, z1, shelfM, { collide: true }); };
  shelving(48.1, 21.35, 48.8, 25.85); shelving(46.58, 25.0, 48.1, 25.85);

  // ---------------- stair hall: G -> F switchback ----------------
  // Lanes follow b_living's B->G stair (it arrives at ground in the NORTH lane going west):
  // G->F lower flight in the SOUTH lane rising east, half landing at the east end (2.1), upper flight in the NORTH lane rising west to F.
  const sx0 = 41.8, sx1 = 43.95, zN0 = 21.35, zMid = 22.46, zS1 = 23.68, n = 8, rise = 2.1 / n, run_ = (sx1 - sx0) / (n - 1);
  const tread = mat({ color: '#c4c9c6', map: tex.marble('#c9cecb', '#a9afab', 56), tile: 1.5, rough: .3 });
  const nose = mat({ color: '#7d837f', rough: .4 });
  for (let i = 1; i <= n - 1; i++) {               // south lane, rising east from 0 to 2.1
    const top = i * rise, xa = sx0 + (i - 1) * run_, xb = xa + run_;
    ctx.box(xa, Math.max(0, top - .45), zMid + .04, xb, top, zS1, tread, { walk: true });
    ctx.box(xa, top, zMid + .04, xa + .03, top + .004, zS1, nose);
  }
  ctx.box(sx1, 1.9, zN0, 44.79, 2.1, zS1, tread, { walk: true });   // half landing
  for (let i = 1; i <= n - 1; i++) {               // north lane, rising west from 2.1 to 4.2 (mass reaches below 2.6 so it shows in plan)
    const top = 2.1 + i * rise, xb = sx1 - (i - 1) * run_, xa = xb - run_;
    ctx.box(xa, Math.min(top - .45, 2.55), zN0, xb, top, zMid - .04, tread, { walk: true });
    ctx.box(xb - .03, Math.min(top - .45, 2.55), zN0, xb, top + .004, zMid - .04, nose);
  }
  // spine wall between the lanes (light top reads as the plan's rail) + balustrade following the upper flight
  ctx.box(sx0 - .05, y0, zMid - .04, sx1, 1.0, zMid + .04, greyRail, { collide: true });
  for (let i = 0; i < n - 1; i++) {
    const xb = sx1 - i * run_, xa = xb - run_, top = 2.1 + (i + 1) * rise;
    ctx.box(xa, 1.0, zMid - .03, xb, top + .9, zMid + .03, greyRail);
  }
  // wall handrails
  const rail = (x0, y0r, x1, y1r, z) => { const len = Math.hypot(x1 - x0, y1r - y0r); const m = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, len, 10), steel); m.position.set((x0 + x1) / 2, (y0r + y1r) / 2, z); m.rotation.z = Math.atan2(y1r - y0r, x1 - x0) - Math.PI / 2; ctx.add(m); };
  rail(sx0, .9, sx1, 2.1 + .9, zS1 - .06); rail(sx1, 2.1 + .9, sx0, 4.2 + .9, zN0 + .06);

  // ---------------- slabs (3.8 .. 4.18) with dining void + stair opening ----------------
  const slab = (x0, z0, x1, z1) => ctx.box(x0, H, z0, x1, 4.18, z1, ceil);
  slab(28.9, 14.75, 33.95, 21.5);        // over dining (non-void part)
  slab(33.95, 14.54, 40.44, 23.75);      // alcove, WC, laundry, office, corridor, lobby
  slab(40.44, 14.54, 47.18, 21.28);      // kitchen
  slab(47.18, 18.68, 48.97, 21.28);
  slab(40.44, 21.28, 41.8, 23.8);        // stair west landing (F arrival)
  slab(44.85, 21.28, 48.97, 26.02);      // vestibule + storage
  // parapets around the single-storey roof (kitchen east bay, back vestibule, storage)
  const par = (x0, z0, x1, z1) => ctx.box(x0, 4.18, z0, x1, 4.7, z1, ext);
  par(47.06, 18.68, 48.97, 18.92); par(48.73, 18.68, 48.97, 26.02); par(46.4, 25.78, 48.97, 26.02); par(45.25, 23.6, 46.5, 23.84);
  // void soffit edges / cove light
  ctx.box(28.85, 3.45, 15.0, 28.9, 3.8, 21.5, M.lightPanel());

  // ---------------- downlights ----------------
  const dl = (x0, z0, x1, z1, nx, nz, y = H) => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ctx.downlight(x0 + (x1 - x0) * (i + .5) / nx, z0 + (z1 - z0) * (j + .5) / nz, y); };
  dl(29.2, 15, 33.6, 21.4, 3, 4);
  dl(34.0, 17.3, 37.7, 21.2, 2, 2);
  dl(34.0, 14.8, 35.8, 17.1, 1, 2); dl(35.8, 14.8, 37.8, 17.1, 1, 1); dl(37.8, 14.8, 40.4, 17.8, 2, 2);
  dl(37.8, 17.9, 40.4, 23.6, 1, 4); dl(34, 21.3, 37.8, 23.6, 3, 1);
  dl(41.5, 15.6, 47, 21.2, 4, 3); dl(44.9, 21.3, 46.5, 23.7, 1, 2); dl(46.6, 21.3, 48.8, 25.8, 1, 3);
  ctx.downlight(41.05, 22.5, H);
}
