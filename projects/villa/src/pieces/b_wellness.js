// Piece: b_wellness — basement pool court, gym, wet + dry sauna, WC, shower, lift; grade slab + balustrade over the court.
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'Gym', level: 'B', x: 31.6, z: 4.6, yaw: -Math.PI / 2 },
  { name: 'Pool court', level: 'B', x: 35.6, z: 12.4, yaw: -Math.PI / 4 },
  { name: 'Wet sauna', level: 'B', x: 29.3, z: 3.3, yaw: Math.PI / 4 },
  { name: 'Dry sauna', level: 'B', x: 28.6, z: 5.3, yaw: Math.PI },
];
export const views = [
  { name: 'gym towards pool glazing', level: 'B', x: 30.75, z: 3.4, yaw: -125, pitch: -10, fov: 70 },
  { name: 'pool court from living-hall door', level: 'B', x: 35.4, z: 12.9, yaw: -55, pitch: -6, fov: 70 },
  { name: 'pool from NE deck corner', level: 'B', x: 48.0, z: 1.0, yaw: 140, pitch: -10, fov: 70 },
  { name: 'court seen from grade', level: 'G', x: 47.6, z: 13.8, yaw: 40, pitch: -32, fov: 70 },
];

const B = L.B, CEIL = -0.4, H = CEIL - B; // 3.2 m basement storey

export function build(ctx) {
  const { box, rect, poly, wall } = ctx;
  // ---------------- materials ----------------
  const gymMosaic = mat({ color: '#ffffff', map: tex.mosaic(['#6e93b6', '#8badc8', '#5d84ab', '#a6c0d6', '#789dbe', '#97b5cf', '#51799f'], 16, 41), tile: 2.6, rough: .5 });
  const whiteTile = mat({ color: '#ffffff', map: tex.tiles('#f6f6f4', '#7f8588', 5, .04, 42), tile: .6, rough: .3 });
  const wcTile = mat({ color: '#ffffff', map: tex.tiles('#e7edf1', '#b8c3cb', 6, .03, 43), tile: 2.4, rough: .3 });
  const gymWall = mat({ color: '#eef0ef', map: tex.plaster('#eceeed', 44), tile: 2, rough: .9 });
  const saunaWood = mat({ color: '#ffffff', map: tex.wood('#8a5a34', 8, 45), tile: 1.2, rough: .6 });
  const benchWood = mat({ color: '#ffffff', map: tex.wood('#a57a55', 5, 46), tile: .9, rough: .6 });
  const teak = mat({ color: '#ffffff', map: tex.wood('#9a6a3e', 6, 47), tile: .8, rough: .55 });
  const stone = M.extStone();
  const courtWall = mat({ color: '#ffffff', map: tex.plaster('#e3d6bf', 48), tile: 3, rough: .9 });
  // plan: small terracotta bricks (~0.25 x 0.125 m) laid in a 90° herringbone with dark grout
  const brick = mat({ color: '#ffffff', map: tex.basket('#a87561', 8, 49), tile: 4, rough: .85 });
  const greyPav = mat({ color: '#ffffff', map: tex.basket('#8f8f8f', 8, 50), tile: 2.2, rough: .85 });
  const pinkPav = mat({ color: '#ffffff', map: tex.basket('#c0a296', 8, 51), tile: 2.4, rough: .8 });
  const poolTile = mat({ color: '#ffffff', map: tex.tiles('#3f86c8', '#2c6aa3', 8, .07, 52), tile: 2, rough: .3 });
  const coping = mat({ color: '#ffffff', map: tex.marble('#cba67e', '#b99470', 53), tile: 1.5, rough: .5 });
  const whiteStone = mat({ color: '#f1efe8', rough: .8 });
  const steel = M.steel(), glass = M.glass(), frame = M.frame(), ceil = M.ceiling();
  const H2 = H; // wall height

  // ---------------- floors ----------------
  // gym / saunas / WC mosaic (one continuous sheet as on the plan)
  poly([[27.1, 0.2], [34.48, 0.2], [34.48, 8.15], [32.72, 8.15], [32.72, 7.4], [27.1, 7.4]], B, gymMosaic);
  // lift car floor (white with the plan's X)
  const liftTex = tex.custom('liftX', (g, n) => { g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, n, n); g.strokeStyle = '#555'; g.lineWidth = 6; g.strokeRect(8, 8, n - 16, n - 16); g.beginPath(); g.moveTo(8, 8); g.lineTo(n - 8, n - 8); g.moveTo(n - 8, 8); g.lineTo(8, n - 8); g.stroke(); }, 256);
  const liftM = mat({ color: '#ffffff', map: liftTex, tile: 1, rough: .5 });
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 2.1), liftM); m.rotation.x = -Math.PI / 2; m.position.set(27.63, B + .006, 3.8); ctx.add(m, { walk: true }); }
  // pool court brick-red deck with a hole for the pool
  const PO = [37.1, 1.85, 46.95, 12.55]; // pool outer (coping) rectangle
  poly([[34.62, 0.2], [48.8, 0.2], [48.8, 15.5], [47.0, 15.5], [47.0, 14.6], [34.62, 14.6]], B, brick,
    { holes: [[[PO[0], PO[1]], [PO[0], PO[3]], [PO[2], PO[3]], [PO[2], PO[1]]]] });

  // ---------------- walls (basement storey, B → -0.4) ----------------
  const W = (x1, z1, x2, z2, o) => wall(x1, z1, x2, z2, { y0: B, h: H2, ...o });
  // north exterior wall z 0..0.2
  W(27.0, 0.1, 30.35, 0.1, { t: .2, mA: whiteTile, mB: stone });
  W(30.35, 0.1, 32.95, 0.1, { t: .2, mA: gymWall, mB: stone });
  W(32.95, 0.1, 34.62, 0.1, { t: .2, mA: wcTile, mB: stone });
  // west wall (my half of the wall shared with the driver's room / garage)
  W(27.05, 0.2, 27.05, 2.7, { t: .1, m: whiteTile });
  W(27.05, 2.7, 27.05, 4.9, { t: .1, m: steel });
  W(27.05, 4.9, 27.05, 7.4, { t: .1, m: saunaWood });
  // wet sauna east wall with glass door opening at z 2.9..3.85
  W(30.35, 0.2, 30.35, 2.9, { t: .12, mA: whiteTile, mB: gymWall }); // stops at z 2.9: open doorway z 2.9..3.9 (plan)
  // lift shaft
  W(27.1, 2.72, 28.2, 2.72, { t: .1, mA: steel, mB: whiteTile });
  W(28.15, 2.72, 28.15, 4.9, { t: .1, mA: steel, mB: whiteTile, openings: [{ at: .62, w: .9, h: 2.1 }] });
  W(27.1, 4.88, 28.2, 4.88, { t: .1, mA: saunaWood, mB: steel });
  // wet / dry sauna divider
  W(28.2, 3.9, 30.41, 3.9, { t: .12, mA: saunaWood, mB: whiteTile });
  // dry sauna east wall starts at z 4.9 (plan): the gym runs on, open, past the lift door
  W(29.62, 4.88, 29.62, 7.4, { t: .12, mA: saunaWood, mB: gymWall });
  // dry sauna front: frameless glass on z 4.9 with a glass door (thin, near-invisible on the plan)
  box(28.2, B, 4.89, 28.6, CEIL - .05, 4.91, glass, { collide: true });
  box(29.5, B, 4.89, 29.56, CEIL - .05, 4.91, glass, { collide: true });
  box(28.2, B + 2.1, 4.89, 29.56, CEIL - .05, 4.91, glass);
  // south walls (my half, shared with b_living)
  W(27.1, 7.4, 29.62, 7.4, { t: .1, m: saunaWood });
  // door to the living hall x 30.62..31.78, leaf hinged west, swung open into the gym (plan swing arc)
  W(29.62, 7.4, 32.77, 7.4, { t: .1, m: gymWall, openings: [{ at: 1.58, w: 1.16, h: 2.3 }] });
  // open arched doorway to the living hall (plan: cream living floor arches up into the gym)

  // the hall's cream floor runs through the arch
  { const am = mat({ color: '#f3e4cf', rough: .6, side: THREE.DoubleSide });
    const sh = new THREE.Shape(); sh.moveTo(30.62, 7.42); sh.lineTo(30.62, 6.9); sh.absarc(31.2, 6.9, .58, Math.PI, 2 * Math.PI, false); sh.lineTo(31.78, 7.42); sh.lineTo(30.62, 7.42);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), am); m.rotation.x = Math.PI / 2; m.position.y = B + .004; ctx.add(m, { cast: false }); }
  W(32.72, 7.35, 32.72, 8.2, { t: .1, m: gymWall });
  W(32.67, 8.2, 34.48, 8.2, { t: .1, m: gymWall });
  // WC + shower block
  W(32.95, 0.2, 32.95, 3.92, { t: .12, mA: gymWall, mB: wcTile, openings: [{ at: 1.15, w: .85, h: 2.2, }, { at: 2.47, w: .85, h: 2.2 }] });
  W(33.0, 2.02, 34.48, 2.02, { t: .1, m: wcTile });
  W(32.9, 3.86, 34.48, 3.86, { t: .12, mA: gymWall, mB: wcTile });
  // gym east wall to the court: solid behind WC/shower, glazed z 3.92..8.2
  W(34.55, 0.2, 34.55, 8.25, { t: .14, mA: stone, mB: gymWall, openings: [{ at: 5.03, w: 2.2, h: H2, glass: true }, { at: 7.13, w: 2.0, h: H2, glass: true }] });
  // court face of the living-hall front: solid at the b_living box, then glazing with door at z≈12.35
  W(34.6, 8.25, 34.6, 10.4, { t: .1, m: stone });
  W(34.6, 10.4, 34.6, 14.6, { t: .12, m: stone, openings: [
    { at: .7, w: 1.3, h: H2, glass: true }, { at: 3.3, w: 2.5, h: H2, glass: true }] });
  // light-cyan glazing sills (plan shows the court glazing as a thin cyan strip)
  { const cy = mat({ color: '#86d0ea', rough: .2 });
    box(34.62, B, 0.2, 34.7, CEIL - .02, 4.13, mat({ color: '#9fd3ea', rough: .08, metal: .2 })); // blue spandrel glass outside WC/shower
    [[34.55, 4.13, 8.25], [34.6, 10.45, 11.75], [34.6, 12.45, 14.6]].forEach(([x, z0, z1]) => box(x - .1, B, z0, x + .1, B + .03, z1, cy)); }
  // sliding leaf parked in front of the fixed pane, door gap z 11.75..12.95
  box(34.68, B, 12.95, 34.70, CEIL - .05, 14.0, glass, { collide: true });
  box(34.66, B, 12.93, 34.72, CEIL - .05, 12.98, frame);
  // court retaining walls up to grade (top under the grade slab)
  const RW = (x1, z1, x2, z2, o) => wall(x1, z1, x2, z2, { y0: B, h: -0.02 - B, ...o });
  RW(34.62, 0.1, 49.0, 0.1, { t: .2, mA: courtWall, mB: stone });
  RW(48.9, 0.0, 48.9, 15.5, { t: .2, mA: stone, mB: courtWall });
  RW(34.55, 14.65, 47.0, 14.65, { t: .1, m: courtWall });
  // frameless glass leaves for saunas + shower (frameless glass doors)
  glassDoor(ctx, 28.6, 4.95, 0, .9, glass, steel); // dry sauna (closed, in the glass front)
  glassDoor(ctx, 32.89, 2.27, -Math.PI / 2 - 1.0, .8, glass, steel);  // shower

  // ---------------- wet sauna: white tiled U bench ----------------
  box(27.1, B, 0.2, 27.6, B + .45, 2.7, whiteTile, { collide: true });      // west run
  box(27.1, B, 0.2, 30.29, B + .45, 0.68, whiteTile, { collide: true });    // north run
  box(29.75, B, 0.68, 30.29, B + .45, 2.12, whiteTile, { collide: true });  // east run
  box(27.1, B + .45, 0.2, 30.29, B + .9, 0.45, whiteTile);                // upper back tier
  // steam outlet + light
  ctx.cyl(28.9, B + .46, 1.6, .06, .04, steel, 12);
  // ---------------- dry sauna ----------------
  box(27.1, B, 5.8, 28.1, B + .45, 7.35, benchWood, { collide: true });
  box(28.1, B, 6.85, 29.56, B + .45, 7.35, benchWood, { collide: true });
  box(29.06, B, 5.8, 29.56, B + .45, 6.85, benchWood, { collide: true });
  box(27.1, B + .45, 6.9, 29.56, B + .9, 7.35, benchWood); // upper tier along south wall
  // heater with stones
  box(27.18, B, 5.0, 27.92, B + .7, 5.58, mat({ color: '#9a9ea3', rough: .4, metal: .6 }), { collide: true });
  const stoneM = mat({ color: '#3b3a38', rough: .9 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 0), stoneM); s.position.set(27.33 + i * .22, B + .74, 5.17 + j * .24); ctx.add(s); }
  box(27.14, B + .7, 5.0, 27.18, B + 1.1, 5.58, benchWood); // guard rail behind heater (simplified)
  // sauna ceilings (kept above the plan cut)
  rect(27.1, 3.96, 29.56, 7.35, -1.0, saunaWood, { up: false });
  rect(27.1, 0.2, 30.29, 3.84, -1.0, whiteTile, { up: false });
  [[28.3, 6.2], [28.3, 4.6]].forEach(([x, z]) => ctx.downlight(x, z, -1.0, .05));
  [[28.0, 1.4], [29.4, 1.4], [29.2, 3.2]].forEach(([x, z]) => ctx.downlight(x, z, -1.0, .05));
  // lift car interior + doors (closed stainless steel)
  box(28.2, B, 2.86, 28.23, B + 2.1, 3.79, steel);
  box(28.23, B + 1.0, 3.88, 28.25, B + 1.12, 3.94, M.black());
  box(28.23, B + 2.1, 2.8, 28.27, B + 2.3, 3.85, steel); // header

  // ---------------- WC + shower ----------------
  { const wc = F.toilet(), beige = mat({ color: '#e3d6b6', rough: .35 }); wc.traverse((o) => { if (o.isMesh) o.material = beige; }); ctx.place(wc, 33.75, B, 0.5, 0); } // beige WC (plan)
  box(33.3, B, 2.2, 34.4, B + .06, 2.7, mat({ color: '#ffffff', map: tex.wood('#9a8e7c', 5, 57), tile: .8, rough: .6 }), { walk: true }); // timber shower tray (plan: tan slab)
  box(34.4, B + 1.0, 3.15, 34.47, B + 1.15, 3.3, steel); // mixer
  ctx.cyl(33.8, CEIL - .06, 3.1, .15, .03, steel, 20);  // rain head
  [[33.7, 1.0], [33.7, 3.0]].forEach(([x, z]) => ctx.downlight(x, z, CEIL, .06));

  // ---------------- gym ----------------
  box(30.55, B, 0.25, 32.85, B + .45, 0.75, benchWood, { collide: true }); // timber bench along north wall (plan)
  // wall mirror on the dry-sauna wall
  box(29.69, B + .3, 5.1, 29.71, B + 2.3, 7.2, mat({ color: '#cfdce3', rough: .02, metal: .9 }));
  [[31, 1.8], [32.3, 1.8], [31, 3.3], [32.3, 3.3], [30.6, 5.1], [31.9, 5.1], [33.3, 5.1], [30.6, 6.6], [31.9, 6.6], [33.3, 6.6], [33.6, 7.7]].forEach(([x, z]) => ctx.downlight(x, z, CEIL));
  // a linear cove light along the glazing
  box(34.3, CEIL - .03, 4.0, 34.42, CEIL - .01, 8.1, M.lightPanel());

  // ---------------- pool ----------------
  const WL = B - .06; // water surface
  const DEEP = B - 1.45, LEDGE = B - .32;
  // coping
  box(PO[0], B - .02, PO[1], PO[2], B + .04, 2.0, coping, { walk: true });
  box(PO[0], B - .02, 2.0, 37.25, B + .04, 10.25, coping, { walk: true });
  box(46.8, B - .02, 2.0, PO[2], B + .04, PO[3], coping, { walk: true });
  box(40.5, B - .02, 12.4, 46.8, B + .04, PO[3], coping, { walk: true });
  box(40.5, B - .02, 8.1, 40.65, B + .04, 12.4, coping, { walk: true });
  // basin liner walls + floor
  box(37.1, DEEP, 1.95, 46.95, B - .02, 2.0, poolTile);
  box(37.15, DEEP, 2.0, 37.25, B - .02, 10.25, poolTile);
  box(46.8, DEEP, 2.0, 46.9, B - .02, 12.4, poolTile);
  rect(37.25, 2.0, 46.8, 10.25, DEEP, poolTile);
  // shallow sun ledge (inner L part) as a solid block
  box(40.65, DEEP, 8.1, 46.8, LEDGE, 12.4, poolTile, { walk: true });
  // tan coping closing the top of the lounger basin (inverted L with the divider, as on the plan)
  box(40.5, B - .02, 8.1, 46.8, B + .04, 8.25, coping, { walk: true });
  // entry steps from the seating corner down northward
  [[9.71, 10.25, B - .25], [9.17, 9.71, B - .55], [8.63, 9.17, B - .85], [8.1, 8.63, B - 1.15]].forEach(([z0, z1, y]) => box(37.25, DEEP, z0, 38.4, y, z1, poolTile, { walk: true }));
  // overflow grating along the east edge
  box(46.62, WL - .02, 2.0, 46.8, B - .005, 11.3, mat({ color: '#9aa3a8', rough: .5, metal: .4 }));
  // water
  poly([[37.25, 2.0], [46.8, 2.0], [46.8, 12.4], [40.65, 12.4], [40.65, 10.25], [40.5, 10.25], [40.5, 8.1], [37.25, 8.1]], WL, waterMat(), { walk: false });
  // stepped shallow entry bay (plan: darker recessed area in front of the seating corner)
  poly([[37.25, 8.1], [40.5, 8.1], [40.5, 10.25], [37.25, 10.25]], WL, waterMat('#3c78b4', 'bw_water_step'), { walk: false });
  // entry steps seen through the water (plan: lighter tiled panel with tread lines)
  { const st = tex.custom('bw_steps', (g, n) => { g.clearRect(0, 0, n, n); g.fillStyle = 'rgba(210,232,250,.22)'; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(30,70,120,.18)'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * n / 4); g.lineTo(n, i * n / 4); g.stroke(); } g.strokeStyle = 'rgba(30,70,120,.12)'; g.lineWidth = 2; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * n / 8, 0); g.lineTo(i * n / 8, n); g.stroke(); } }, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(37.82, WL + .003, 9.17); m.renderOrder = 3; ctx.add(m, { cast: false }); }
  // darker vignette along the basin walls (plan rendering)
  { const em = edgeShade(), EW = .55;
    const strip = (cx, cz, len, rotY) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, EW), em); m.rotation.set(-Math.PI / 2, 0, rotY, 'YXZ'); m.position.set(cx, WL + .004, cz); m.renderOrder = 2; ctx.add(m, { cast: false }); };
    strip(42.025, 2.0 + EW / 2, 9.55, 0);                // north wall (wall at -z side)
    strip(37.25 + EW / 2, 5.05, 6.1, Math.PI / 2);      // west wall
    strip(46.8 - EW / 2, 7.2, 10.4, -Math.PI / 2);        // east wall
    strip(43.725, 12.4 - EW / 2, 6.15, Math.PI);         // south wall of the ledge
    strip(37.25 + EW / 2, 9.175, 2.15, Math.PI / 2);    // west wall of the step bay
  }
  box(40.42, B - .3, 8.1, 40.5, B - .02, 10.25, coping); // low kerb edging the bay (thin tan line on plan)
  // seating corner: white stone base, pink paver pad, white boulder seats
  box(37.1, DEEP, 10.25, 40.5, B - .01, PO[3], mat({ color: '#e9e6de', map: tex.tiles('#eceae3', '#c8c4ba', 4, .05, 54), tile: 1.6, rough: .8 }), { walk: true });
  rect(37.8, 10.3, 40.45, 11.9, B, pinkPav);
  // irregular white crazy-paving / pebble border (plan) on the L around the pink pad
  const crazy = mat({ color: '#ffffff', map: crazyPaving(55), tile: 2, rough: .85 });
  rect(37.12, 10.27, 37.8, 12.53, B + .005, crazy);   // thin west leg
  rect(37.8, 11.9, 40.48, 12.53, B + .005, crazy);     // thin south leg
  // three in-water loungers on the sun ledge
  [41.8, 43.62, 45.45].forEach((x) => ctx.place(waterLounger(), x, LEDGE, 10.28, 0));
  // pool lights (emissive dots in the walls)
  [[39.5], [42], [44.5]].forEach(([x]) => box(x - .1, B - .7, 2.0, x + .1, B - .6, 2.02, M.lightPanel()));

  // ---------------- grade: slab over gym + court ring, grey pavers, balustrade ----------------
  const hole = [[PO[0], PO[1]], [PO[0], PO[3]], [PO[2], PO[3]], [PO[2], PO[1]]];
  // slab over saunas / gym (ceiling at -0.4)
  poly([[27.0, 0.0], [34.62, 0.0], [34.62, 8.25], [32.67, 8.25], [32.67, 7.45], [27.0, 7.45]], -0.02, ceil, { thick: .38, walk: false });
  // court ring slab (underside = covered deck ceiling) with the open-to-sky pool opening
  poly([[34.62, 0.0], [49.0, 0.0], [49.0, 14.6], [34.62, 14.6]], -0.02, ceil, { thick: .38, holes: [hole], walk: true });
  poly([[34.62, 0.0], [49.0, 0.0], [49.0, 14.6], [34.62, 14.6]], L.G, greyPav, { holes: [hole] });
  // slab-edge fascia inside the opening
  const fas = stone;
  box(PO[0] - .01, -0.42, PO[1], PO[2] + .01, -0.02, PO[1] + .02, fas);
  box(PO[0] - .01, -0.42, PO[3] - .02, PO[2] + .01, -0.02, PO[3], fas);
  box(PO[0], -0.42, PO[1], PO[0] + .02, -0.02, PO[3], fas);
  box(PO[2] - .02, -0.42, PO[1], PO[2], -0.02, PO[3], fas);
  // court ceiling downlights
  for (let x = 35.6; x < 48.6; x += 1.8) { ctx.downlight(x, 0.9, CEIL); ctx.downlight(x, 13.6, CEIL); }
  for (let z = 3; z < 13; z += 2) { ctx.downlight(35.8, z, CEIL); ctx.downlight(47.9, z, CEIL); }
  // glass balustrade at grade around the opening
  balustrade(ctx, PO, glass, steel);
  // WORKAROUND (main.js plan cut): Box3.setFromObject on children of placed groups uses stale world matrices,
  // hiding furniture in top views — refresh world matrices now.
  ctx.group.updateMatrixWorld(true);

  // ---------------- small helpers ----------------
  function rnd(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
}

// pool water seen from above: saturated blue, faint 0.25 m tile grid, broad soft caustic light bands
function waterMat(base = '#4f95d6', key = 'bw_water') {
  const t = tex.custom(key, (g, n) => {
    let s = key.length * 97 + 11; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const c = new THREE.Color(), cells = 16, w = n / cells;
    g.fillStyle = '#' + c.set(base).multiplyScalar(.9).getHexString(); g.fillRect(0, 0, n, n); // faint grout
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { c.set(base).multiplyScalar(.96 + R() * .08); g.fillStyle = '#' + c.getHexString(); g.fillRect(i * w + 1.5, j * w + 1.5, w - 3, w - 3); }
    // broad deep/light drift
    for (let i = 0; i < 8; i++) { const x = R() * n, y = R() * n, r = 150 + R() * 200; for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); gr.addColorStop(0, i % 2 ? 'rgba(230,246,255,.22)' : 'rgba(20,60,120,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); } }
    // caustic bands: wide soft glow + brighter core along long wavy open curves (wrapped for tiling)
    g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineJoin = 'round';
    const curves = []; for (let i = 0; i < 26; i++) { const pts = []; let x = R() * n, y = R() * n, a = R() * 6.28; pts.push([x, y]); for (let k = 0; k < 8; k++) { a += (R() - .5) * 1.2; x += Math.cos(a) * 60; y += Math.sin(a) * 60; pts.push([x, y]); } curves.push([pts, R()]); }
    for (const [lw, al, blur] of [[38, .18, 12], [16, .26, 5], [5, .3, 1.5]]) {
      const oc = document.createElement('canvas'); oc.width = oc.height = n; const o = oc.getContext('2d');
      o.strokeStyle = '#ffffff'; o.lineCap = 'round'; o.lineJoin = 'round';
      for (const [pts, r] of curves) { o.globalAlpha = al * (.6 + r * .6); o.lineWidth = lw * (.7 + r * .6); for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { o.beginPath(); o.moveTo(pts[0][0] + ox, pts[0][1] + oy); for (let k = 1; k < pts.length - 1; k++) { const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; o.quadraticCurveTo(pts[k][0] + ox, pts[k][1] + oy, mx + ox, my + oy); } o.stroke(); } }
      g.filter = `blur(${blur}px)`; g.drawImage(oc, 0, 0); g.filter = 'none';
    }
    g.filter = 'none'; g.globalAlpha = 1;
  }, 1024);
  return mat({ color: '#ffffff', map: t, tile: 4, rough: .4, metal: 0, opacity: .95, key });
}

// darker band along the pool walls (alpha fades away from the wall); strip runs along local x, wall at v=1
function edgeShade() {
  const t = tex.custom('bw_edge', (g, n) => { const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 64);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshBasicMaterial({ color: '#163f70', map: t, transparent: true, opacity: .6, depthWrite: false });
}

// 90° herringbone of 2:1 bricks (u = n/32 px, so one repeat = 32 brick-widths); grout = darker joint colour
function herringBrick(base, grout, seed) {
  return tex.custom('bw_herr' + base + seed, (g, n) => {
    let s = seed; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const c = new THREE.Color(); const u = n / 32;
    g.fillStyle = grout; g.fillRect(0, 0, n, n);
    const brickAt = (x, y, w, h) => { const k = .86 + R() * .26; c.set(base).multiplyScalar(k); g.fillStyle = '#' + c.getHexString(); g.fillRect(x * u + 1, y * u + 1, w * u - 2, h * u - 2);
      g.globalAlpha = .12; for (let i = 0; i < 6; i++) { g.fillStyle = R() < .5 ? '#fff' : '#000'; g.fillRect(x * u + 1 + R() * (w * u - 4), y * u + 1 + R() * (h * u - 4), 2, 2); } g.globalAlpha = 1; };
    for (let k = -36; k < 36; k++) for (let t = -12; t < 12; t++) { const x0 = k + 4 * t, y0 = k; if (x0 < -3 || x0 > 33 || y0 < -3 || y0 > 33) continue; brickAt(x0, y0, 2, 1); brickAt(x0, y0 + 1, 1, 2); }
  });
}

// irregular white stone pieces with grey joints
function crazyPaving(seed) {
  return tex.custom('bw_crazy' + seed, (g, n) => {
    let s = seed; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#c9c9c7'; g.fillRect(0, 0, n, n);
    const cells = 4, w = n / cells;
    for (let i = -1; i <= cells; i++) for (let j = -1; j <= cells; j++) {
      const cx = (i + .5) * w + (R() - .5) * w * .3, cy = (j + .5) * w + (R() - .5) * w * .3, rot = R() * 6;
      const sh = 208 + Math.floor(R() * 22); g.fillStyle = `rgb(${sh},${sh},${sh - 3})`; g.beginPath();
      const m = 5 + Math.floor(R() * 2); for (let k = 0; k < m; k++) { const a = rot + k / m * Math.PI * 2, r = w * (.5 + R() * .12); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fill(); g.strokeStyle = '#767674'; g.lineWidth = 2; g.stroke();
    }
  });
}

// glass door leaf hinged at (hx,hz); ang = rotation.y of the leaf (leaf runs along local +x)
function glassDoor(ctx, hx, hz, ang, w, glass, steel) {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w, 2.05, .012), glass); leaf.position.set(w / 2, 1.04, 0); g.add(leaf);
  const h = new THREE.Mesh(new THREE.BoxGeometry(.02, .4, .05), steel); h.position.set(w - .08, 1.05, 0); g.add(h);
  ctx.place(g, hx, L.B, hz, ang);
}

function balustrade(ctx, PO, glass, steel) {
  const [x0, z0, x1, z1] = PO, y = L.G, hgt = 1.1, i = .12;
  const sides = [[x0 + i, z0 + i, x1 - i, z0 + i], [x1 - i, z0 + i, x1 - i, z1 - i], [x1 - i, z1 - i, x0 + i, z1 - i], [x0 + i, z1 - i, x0 + i, z0 + i]];
  sides.forEach(([a, b, c, d]) => {
    const len = Math.hypot(c - a, d - b), ang = Math.atan2(-(d - b), c - a), cx = (a + c) / 2, cz = (b + d) / 2;
    ctx.boxC(cx, y + .05, cz, len, .1, .1, steel, ang);                 // base shoe
    ctx.boxC(cx, y + .1 + (hgt - .15) / 2, cz, len, hgt - .15, .02, glass, ang, { collide: true });
    ctx.boxC(cx, y + hgt - .02, cz, len + .05, .05, .07, steel, ang);   // top rail
  });
}

function waterLounger() {
  const g = new THREE.Group(); const w = mat({ color: '#f6f6f3', rough: .5 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(.58, .3, 1.15), w); base.position.set(0, .15, .22); g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(.58, .08, .55), w); back.position.set(0, .4, -.48); back.rotation.x = .45; g.add(back);
  const sup = new THREE.Mesh(new THREE.BoxGeometry(.58, .3, .4), w); sup.position.set(0, .15, -.45); g.add(sup);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(.25, .08, .1), w); tab.position.set(0, .04, .84); g.add(tab);
  return g;
}
