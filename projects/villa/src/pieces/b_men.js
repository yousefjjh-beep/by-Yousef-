// Piece: b_men — basement sunken patio (12x10) + pool terrace, men patio (10x6), men saloon (10x7) + WC/pantry strip,
// stair up to grade (lower entry). Basement level L.B = -3.6.
import { THREE, L, tex, mat, M, F } from '../lib.js';
import { PATIO_CELLS } from './b_men_patio.js';

export const rooms = [
  { name: 'Sunken Patio', level: 'B', x: 19.0, z: 21.5, yaw: -0.4 },
  { name: 'Men Patio', level: 'B', x: 25.2, z: 32.6, yaw: -0.2 },
  { name: 'Men Saloon', level: 'B', x: 31.2, z: 33.0, yaw: -0.8 },
];
export const views = [
  { name: 'sunken patio from pool terrace', level: 'B', x: 19.0, z: 25.2, yaw: -22, pitch: -6, fov: 70 },
  { name: 'men saloon from the hall opening', level: 'B', x: 35.8, z: 26.3, yaw: 180, pitch: -12, fov: 75 },
  { name: 'men patio from stair foot', level: 'B', x: 25.0, z: 33.0, yaw: -18, pitch: -8, fov: 70 },
  { name: 'pool terrace looking south', level: 'B', x: 23.4, z: 24.2, yaw: 160, pitch: -10, fov: 70 },
];

const B = L.B; // -3.6
const CEIL = -0.4;

export function build(ctx) {
  const { box, boxC, rect, wall, place, cyl, downlight } = ctx;

  // ---------------- materials ----------------
  const brick = mat({ color: '#ffffff', map: tex.custom('bmen_bw', (g, n) => drawBasket(g, n, 0, 0, n, n, n)), tile: 1, rough: .9 });
  const cream = mat({ color: '#e2e2e0', map: tex.tiles('#f2f1ec', '#9f9e98', 4, .03, 42), tile: 1, rough: .6 });
  const beige = mat({ color: '#d2d0cc', map: tex.tiles('#d9d1bd', '#8f8a80', 1, .02, 43), tile: 1, rough: .6 });
  const grass = mat({ color: '#ffffff', map: tex.grass(44), tile: 1.5, rough: .95 });
  const mosaic = mat({ color: '#d6d6d4', map: tex.tiles('#ebeae6', '#a5a5a0', 8, .03, 45), tile: 1, rough: .6 });
  const bigTile = mat({ color: '#d0d0ce', map: tex.tiles('#e2dfd8', '#9a9893', 2, .03, 46), tile: 1.2, rough: .6 });
  const coping = mat({ color: '#f4f3ef', map: tex.marble('#f2f0ea', null, 47), tile: 1, rough: .4 });
  const poolTile = mat({ color: '#ffffff', map: tex.mosaic(['#2f86c9', '#4a9fdc', '#2a74b4', '#6bb6e6'], 24, 48), tile: 1, rough: .3 });
  const stone = M.extStone();
  const plaster = mat({ color: '#f3ece0', map: tex.plaster('#f3ece0', 49), tile: 2, rough: .9 });
  const saloonFloor = mat({ color: '#ffffff', map: tex.custom('bmen_cream_wood', (g, n) => { const R = rngf(50); const w = n / 8; for (let i = 0; i < 8; i++) { g.fillStyle = R() < .5 ? '#f8ecdc' : '#f3e5d2'; g.fillRect(i * w, 0, w, n); g.fillStyle = '#e6d4bd'; g.fillRect(i * w, 0, 2, n); g.globalAlpha = .18; g.strokeStyle = '#d9c3a6'; for (let k = 0; k < 6; k++) { const x = i * w + R() * w; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 6, n); g.stroke(); } g.globalAlpha = 1; } }), tile: 1.6, rough: .45 }); // plain cream (plan: 250,235,217)
  const wcTile = mat({ color: '#ffffff', map: gridTex('wc', '#f6f6f4', '#8d9296', 4, 14), tile: 1, rough: .4 });
  const wcWall = mat({ color: '#ffffff', map: tex.tiles('#f0eee9', '#d0cdc6', 3, .02, 52), tile: 1, rough: .4 });
  const greyStone = mat({ color: '#ffffff', map: tex.tiles('#82807c', '#6a6864', 2, .03, 53), tile: 1, rough: .7 });
  const frameGrey = mat({ color: '#8e8c88', rough: .7 });
  const ceil = M.ceiling();
  const skirt = mat({ color: '#d9cdb8', rough: .5 });
  const steel = M.steel();

  const Y = (d) => B + d; // basement level + small offset

  // ======================================================================
  // 1. SUNKEN PATIO 12X10 (x 17–26.9, z 12–23.05)
  // ======================================================================
  // floor = one canvas painted cell by cell from the plan's paving map (brick / white mosaic / grey slab / turf)
  const SPAN = 11.1;
  const patioTex = tex.custom('bmen_patio_map', (g, n) => {
    const k = n / SPAN, c = .125 * k;
    drawBasket(g, n, 0, 0, n, n, k);                          // brick everywhere first (world-aligned 1 m repeat)
    const R = rngf(5), gap = .05 * k, t = .24 * k;
    for (const [x0, z0, x1, z1, kind] of PATIO_CELLS) {
      const X = (x0 - 16.9) * k + gap, Y = (z0 - 11.95) * k + gap, W = (x1 - x0) * k - 2 * gap, H = (z1 - z0) * k - 2 * gap;
      g.save(); g.beginPath(); g.rect(X, Y, W, H); g.clip();
      if (kind === 'm') { g.fillStyle = '#a7a7a2'; g.fillRect(X, Y, W, H);
        for (let x = X; x < X + W; x += t) for (let y = Y; y < Y + H; y += t) { g.fillStyle = R() < .5 ? '#f3f3f0' : '#e8e8e4'; g.fillRect(x + 2, y + 2, t - 4, t - 4); } }
      else if (kind === 's') { g.fillStyle = '#e4e1da'; g.fillRect(X, Y, W, H); g.fillStyle = '#cfc9bc'; g.fillRect(X + 6, Y + 6, W - 12, H - 12);
        for (let i = 0; i < W * H / 60; i++) { g.fillStyle = R() < .5 ? '#d9d4c8' : '#c4bdaf'; g.globalAlpha = .4; g.fillRect(X + R() * W, Y + R() * H, 3, 3); } g.globalAlpha = 1; }
      else { g.fillStyle = '#3f7d2a'; g.fillRect(X, Y, W, H); for (let i = 0; i < W * H / 12; i++) { g.strokeStyle = R() < .5 ? '#7fbf4e' : '#2a5c1d'; g.globalAlpha = .55; g.lineWidth = 2; const x = X + R() * W, y = Y + R() * H, a = R() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); } g.globalAlpha = 1; }
      g.restore();
    }
  }, 2048);
  { const geo = new THREE.PlaneGeometry(10.0, 11.1); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10 / SPAN, uv.getY(i));
    const fm = mat({ color: '#ffffff', map: patioTex, rough: .8, key: 'bmen_patio_floor' }); const mesh = new THREE.Mesh(geo, fm); mesh.rotation.x = -Math.PI / 2; mesh.position.set(21.9, B, 11.95 + 5.55); ctx.add(mesh, { walk: true, cast: false }); }

  // outdoor lounge platform (grey frame + beige deck) with white sofa set
  box(19.6, B, 15.75, 24.06, B + .03, 19.7, mat({ color: '#8a8884', rough: .8 }));
  box(19.75, B, 15.9, 23.91, B + .04, 19.55, mat({ color: '#ffffff', map: tex.tiles('#d6cfb4', '#c2b99e', 2, .02, 54), tile: 1.5, rough: .7 }));
  const outWhite = '#f3f2ee';
  const sofaN = F.sofa({ len: 2.1, depth: .75, color: outWhite, cushions: 3, legs: '#9a9890' });
  place(sofaN, 22.0, Y(.04), 16.1, 0);
  const sofaS = F.sofa({ len: 2.1, depth: .75, color: outWhite, cushions: 3, legs: '#9a9890' });
  place(sofaS, 22.0, Y(.04), 19.3, Math.PI);
  // west bench base with two armchairs facing east
  
  place(F.armchair({ color: outWhite, w: .85, d: .85 }), 20.35, Y(.04), 17.05, Math.PI / 2);
  place(F.armchair({ color: outWhite, w: .85, d: .85 }), 20.35, Y(.04), 18.35, Math.PI / 2);
  // coffee table
  box(21.3, Y(.04), 17.2, 22.9, Y(.36), 18.25, mat({ color: '#e9e7e1', rough: .5 }));
  box(21.25, Y(.36), 17.15, 22.95, Y(.4), 18.3, M.white());
  // corner side tables with round lantern tops
  [[20.55, 15.9], [23.45, 15.9], [20.55, 19.45], [23.45, 19.45]].forEach(([x, z]) => {
    box(x - .3, Y(.04), z - .28, x + .3, Y(.5), z + .28, M.white());
    cyl(x, Y(.5), z, .16, .02, mat({ color: '#9a9a96', rough: .4 }), 20);
    const lan = cyl(x, Y(.52), z, .1, .28, mat({ color: '#fff3d6', emissive: '#ffdca0', emissiveIntensity: .5 }), 16);
  });

  // outdoor kitchen / BBQ counter (x 19.2–20.0, z 20.2–22.1)
  box(19.2, B, 20.2, 20.0, Y(.9), 22.1, mat({ color: '#efeeea', rough: .5 }));
  box(19.17, Y(.9), 20.17, 20.03, Y(.94), 22.13, mat({ color: '#ffffff', map: tex.marble('#d8d6d0', '#9a9790', 55), tile: 1, rough: .25 }));
  box(19.35, Y(.92), 20.4, 19.85, Y(.95), 20.9, steel); // sink
  box(19.3, Y(.94), 21.3, 19.9, Y(.96), 21.9, mat({ color: '#c9c9c6', rough: .4 })); // drainer/hob
  cyl(19.35, Y(.94), 20.65, .02, .25, steel, 8);

  // ======================================================================
  // 2. POOL TERRACE (x 17–24, z 23.05–30.2)
  // ======================================================================
  // fine white mosaic deck (~0.1 m tiles) laid in larger panels separated by grey joint lines
  const deckA = mat({ color: '#ffffff', map: gridTex('deckA', '#e2e1dc', '#9a9893', 5, 12), tile: 1, rough: .6 });
  const deckB = mat({ color: '#ffffff', map: gridTex('deckB', '#d6d5d0', '#939089', 5, 12), tile: 1, rough: .6 });
  rect(16.9, 23.05, 26.9, 23.75, B, deckA);
  const bands = [23.75, 25.3, 27.0, 28.6, 30.2];
  for (let i = 0; i < 4; i++) {
    const z0 = bands[i], z1 = bands[i + 1], mA = i % 2 ? deckB : deckA, mB2 = i % 2 ? deckA : deckB;
    rect(18.25, z0, 20.95, z1, B, mA); rect(23.05, z0, 24.06, z1, B, mB2);
    if (z1 > 28.15) rect(20.95, Math.max(z0, 28.15), 23.05, z1, B, mB2);
  }
  rect(20.95, 23.75, 21.1, 28.15, B, deckA); rect(22.9, 23.75, 23.05, 28.15, B, deckA);
  const joint = mat({ color: '#8f8d88', rough: .7 });
  bands.slice(1, 4).forEach((z) => { box(18.25, B, z - .05, 20.95, B + .004, z + .05, joint); box(23.05, B, z - .05, 24.06, B + .004, z + .05, joint); });
  box(18.25, B, 28.58, 24.06, B + .004, 28.62, joint);
  // pool: raised white coping ring around water x 21.1–22.9, z 23.75–28.0 with an L-shaped step notch (x 22–22.9, z 26.6–27.3)
  const cp = .16, ct = .04, copeW = mat({ color: '#fbfaf7', rough: .4 });
  box(21.1 - cp, B, 23.75 - cp, 21.1, B + ct, 28.0 + cp, copeW);
  box(22.9, B, 23.75 - cp, 22.9 + cp, B + ct, 28.0 + cp, copeW);
  box(21.1, B, 28.0, 22.9, B + ct, 28.0 + cp, copeW);
  box(21.1, B, 23.75 - cp, 22.9, B + ct, 23.75, copeW);
  // step platform (L notch): white-edged block flush with the deck
  box(22.0, B - .5, 26.6, 22.9, B + ct, 27.3, copeW);
  box(22.12, B + ct, 26.72, 22.9, B + ct + .002, 27.18, deckB);
  const pb = B - 1.4;
  box(21.1, pb - .05, 23.75, 22.9, pb, 28.0, poolTile);
  box(21.05, pb, 23.75, 21.1, B, 28.0, poolTile);
  box(22.9, pb, 23.75, 22.95, B, 28.0, poolTile);
  box(21.1, pb, 28.0, 22.9, B, 28.05, poolTile);
  box(21.1, pb, 23.7, 22.9, B, 23.75, poolTile);
  box(22.0, pb, 26.6, 22.9, B - .5, 27.3, poolTile);
  // pale turquoise water with ripple caustics
  const ripple = tex.custom('bmen_ripple', (g, n) => {
    g.fillStyle = '#86c3e6'; g.fillRect(0, 0, n, n);
    const R = rngf(21); g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { g.strokeStyle = R() < .6 ? '#d4ecf8' : '#5fa6d6'; g.globalAlpha = .35 + R() * .35; g.lineWidth = 2 + R() * 4;
      g.beginPath(); let x = R() * n, y = R() * n; g.moveTo(x, y); for (let k = 0; k < 4; k++) { const x2 = x + (R() - .5) * 120, y2 = y + (R() - .5) * 120; g.quadraticCurveTo(x + (R() - .5) * 80, y + (R() - .5) * 80, x2, y2); x = x2; y = y2; } g.stroke(); }
    g.globalAlpha = 1;
  });
  const water = mat({ color: '#ffffff', map: ripple, tile: 1.6, rough: .7, metal: 0, key: 'bmen_water4' });
  rect(21.1, 23.75, 22.9, 26.6, B - .12, water, { walk: false });
  rect(21.1, 26.6, 22.0, 27.3, B - .12, water, { walk: false });
  rect(21.1, 27.3, 22.9, 28.0, B - .12, water, { walk: false });

  // planting strip along the west retaining wall
  box(16.9, B, 23.75, 18.25, B + .25, 30.2, mat({ color: '#a9a49a', rough: .8 }));
  { const hedgeM = mat({ color: '#ffffff', map: tex.custom('bmen_hedge', (g, n) => { g.fillStyle = '#3f8530'; g.fillRect(0, 0, n, n); const R = rngf(23);
      for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? '#7bbd55' : '#2a6420'; g.globalAlpha = .55; g.beginPath(); g.ellipse(R() * n, R() * n, 3 + R() * 5, 1.5 + R() * 2, R() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }), tile: 1, rough: .95 });
    box(17.0, B + .25, 23.85, 18.15, B + .85, 30.1, hedgeM); }
  // tree on the terrace (x≈20.9, z≈29.4)
  planTree(ctx, 20.8, B, 29.5, 1.2, 3.6);

  // ======================================================================
  // 3. MEN PATIO 10X6 (x 24.06–30.06, z 23.8–33.5)
  // ======================================================================
  rect(24.06, 23.8, 30.06, 33.5, B, brick);
  // square tiled table + 8 chairs (2 per side)
  const tc = [26.9, 25.85];
  const tableTop = mat({ color: '#ffffff', map: tex.tiles('#cbbe9f', '#8f7c5a', 4, .03, 57), tile: 1.7, rough: .5 });
  box(tc[0] - .85, Y(.72), tc[1] - .85, tc[0] + .85, Y(.77), tc[1] + .85, tableTop);
  box(tc[0] - .87, Y(.70), tc[1] - .87, tc[0] + .87, Y(.72), tc[1] + .87, mat({ color: '#5a4330', rough: .5 }));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(tc[0] + a * .75 - .04, B, tc[1] + b * .75 - .04, tc[0] + a * .75 + .04, Y(.7), tc[1] + b * .75 + .04, mat({ color: '#5a4330', rough: .5 })));
  const chairC = '#eadcb6';
  for (const o of [-.4, .4]) {
    place(F.chair({ color: chairC, frame: '#7a6448' }), tc[0] + o, B, tc[1] - 1.2, Math.PI * 0);
    place(F.chair({ color: chairC, frame: '#7a6448' }), tc[0] + o, B, tc[1] + 1.2, Math.PI);
    place(F.chair({ color: chairC, frame: '#7a6448' }), tc[0] - 1.2, B, tc[1] + o, Math.PI / 2);
    place(F.chair({ color: chairC, frame: '#7a6448' }), tc[0] + 1.2, B, tc[1] + o, -Math.PI / 2);
  }
  // fix chair orientation: F.chair faces +z; north row must face south (+z) => 0; south row faces north => PI. (done above)

  // ======================================================================
  // 4. MEN SALOON 10X7 (x 30.06–40.4, z 26.55–33.5) + WC/pantry strip (z 23.8–26.55)
  // ======================================================================
  rect(30.06, 26.55, 40.4, 33.5, B, saloonFloor);
  rect(32.25, 23.8, 40.4, 26.55, B, saloonFloor);
  rect(30.06, 23.8, 32.25, 26.55, B, wcTile);

  // shaggy taupe rug
  const shag = tex.custom('bmen_shag2', (g, n) => {
    g.fillStyle = '#8c7b69'; g.fillRect(0, 0, n, n);
    let s = 7; const R = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    // soft mottled clumps then curly strands: reads as a deep shaggy pile from above
    for (let i = 0; i < 900; i++) { g.fillStyle = R() < .5 ? '#a5927d' : '#6e5f50'; g.globalAlpha = .25; g.beginPath(); g.arc(R() * n, R() * n, 6 + R() * 16, 0, 7); g.fill(); }
    g.lineCap = 'round';
    for (let i = 0; i < 9000; i++) { const v = R(); g.strokeStyle = v < .3 ? '#c2b19c' : v < .65 ? '#5f5144' : '#9d8a75'; g.globalAlpha = .55; g.lineWidth = 1.5 + R() * 1.5;
      const x = R() * n, y = R() * n, a = R() * 6.28, l = 5 + R() * 9; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * .6, y + Math.sin(a + 1) * l * .6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    g.globalAlpha = 1;
  });
  const rugM = mat({ color: '#ffffff', map: shag, tile: 1.4, rough: 1 });
  box(31.5, B, 27.95, 38.8, Y(.03), 31.95, rugM);

  // perimeter seating (beige) — sofas + armchairs + ottomans + round side tables as drawn
  const sofaC = '#cdbfa6', ottoC = '#cbb99c';
  const seat = (x0, x1, z0, z1, face, cushions) => { // face: 'S','N','E','W' = direction the sitter faces
    const horiz = face === 'S' || face === 'N';
    const len = horiz ? x1 - x0 : z1 - z0, dep = horiz ? z1 - z0 : x1 - x0;
    const ry = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 }[face];
    place(F.sofa({ len, depth: dep, color: sofaC, cushions, legs: '#6b5038' }), (x0 + x1) / 2, B, (z0 + z1) / 2, ry, { collide: true });
  };
  const otto = (x0, x1, z0, z1) => place(F.ottoman({ w: x1 - x0, d: z1 - z0, h: .42, color: ottoC }), (x0 + x1) / 2, B, (z0 + z1) / 2);
  const rtable = (x, z) => { cyl(x, B, z, .26, .55, mat({ color: '#c8b48e', rough: .5 }), 24); cyl(x, Y(.55), z, .3, .03, mat({ color: '#d9c9a6', rough: .5 }), 24); cyl(x, Y(.58), z, .25, .005, mat({ color: '#a8977a', rough: .5 }), 24); };
  seat(36.8, 38.95, 26.7, 27.5, 'S', 3);
  seat(39.2, 40.05, 26.85, 27.55, 'S', 1);
  seat(39.3, 40.15, 27.7, 28.45, 'W', 1);
  seat(39.3, 40.15, 28.8, 30.95, 'W', 3);
  rtable(39.7, 31.25);
  seat(39.3, 40.15, 31.55, 32.3, 'W', 1);
  otto(30.5, 31.3, 32.5, 33.15);
  seat(31.7, 33.75, 32.4, 33.25, 'N', 3);
  otto(34.05, 34.95, 32.5, 33.15);
  seat(35.2, 36.6, 32.4, 33.25, 'N', 2);
  rtable(37.0, 32.85);
  seat(37.4, 38.95, 32.4, 33.25, 'N', 2);
  otto(39.2, 40.05, 32.5, 33.15);
  rtable(30.95, 29.55);
  seat(30.45, 31.35, 29.95, 31.45, 'E', 2);
  seat(30.45, 31.35, 31.55, 32.25, 'E', 1);

  // WC: vanity on west wall, WC + bidet against the south wall
  wcFixtures(ctx);
  // pantry / kitchenette counter
  place(F.kitchenRun({ len: 1.3, d: .55, cab: '#8a6a4c', top: '#e2ddd3', upper: true }), 33.4, B, 26.2, Math.PI);

  // ---------------- walls ----------------
  const HR = 3.6;            // retaining walls rise to grade (top at y=0)
  const HI = CEIL - B + .38; // interior walls up to slab (y -0.02)
  // west retaining wall of the courts
  wall(16.9, 11.9, 16.9, 30.2, { y0: B, h: HR, t: .3, off: -.15, m: stone });
  // north retaining wall (half toward garage)
  wall(16.75, 11.95, 26.9, 11.95, { y0: B, h: HR, t: .15, off: -.075, m: stone });
  // south retaining wall of the pool terrace
  wall(16.75, 30.2, 24.16, 30.2, { y0: B, h: HR, t: .25, off: -.125, m: stone });
  // wall between terrace and men patio, continuing as retaining wall + stair west wall
  wall(24.06, 23.75, 24.06, 40.7, { y0: B, h: HR, t: .2, m: stone });
  // north wall of men patio (terrace side), x 24.06–27
  wall(24.06, 23.8, 27.0, 23.8, { y0: B, h: HR, t: .2, m: stone });
  // shared wall with b_living (my half, south side), x 27–40.4, door into living at x 38.7–39.7
  wall(27.0, 23.85, 40.4, 23.85, { y0: B, h: HI, t: .1, mA: plaster, mB: plaster, openings: [{ at: 39.25 - 27, w: 1.0, h: 2.3, door: { color: '#6b4429', swing: -1, open: 1.3 } }] });
  // east exterior retaining wall
  wall(40.4, 23.75, 40.4, 33.65, { y0: B, h: HI, t: .3, off: .15, mA: plaster, mB: stone });
  // south exterior retaining wall of saloon + men patio
  wall(25.5, 33.5, 40.55, 33.5, { y0: B, h: HI, t: .25, off: -.125, mA: stone, mB: plaster });
  box(25.5, -0.02, 33.5, 27.0, 0, 33.75, stone);
  // WC west wall (men patio side stone / WC tile)
  wall(30.06, 23.9, 30.06, 26.55, { y0: B, h: HI, t: .2, mA: stone, mB: wcWall });
  // glazed wall men patio -> saloon (continuous glazing, one open slider bay) + dark timber screen panel on the patio side
  {
    wall(30.06, 26.55, 30.06, 33.4, { y0: B, h: HI, t: .12, mA: plaster, mB: plaster, openings: [
      { at: 1.9, w: 3.7, y0: 0, h: 2.9, glass: true }, { at: 4.7, w: 1.75, y0: 0, h: 2.9 }, { at: 6.18, w: 1.1, y0: 0, h: 2.9, glass: true }] });
    box(30.0, B, 26.6, 30.12, B + .015, 33.35, mat({ color: '#a9d6ea', rough: .3 }));   // pale-blue glazing line / track
    box(30.13, B, 28.6, 30.15, B + 2.9, 30.4, M.glass());                                 // slid-open leaf parked inside
    const scr = mat({ color: '#ffffff', map: tex.custom('bmen_screen', (g, n) => { g.fillStyle = '#6a4436'; g.fillRect(0, 0, n, n); g.fillStyle = '#4e2f25'; for (let x = 0; x < n; x += n / 16) g.fillRect(x, 0, 6, n); }), tile: 1, rough: .6 });
    box(29.86, B, 27.2, 29.98, B + 2.6, 29.3, scr, { collide: true });
  }
  // WC east wall with door (hinged at north)
  wall(32.25, 26.55, 32.25, 23.9, { y0: B, h: HI, t: .12, mA: plaster, mB: wcWall, openings: [{ at: 2.65 - .55 - .05, w: .95, h: 2.2, door: { color: '#7a5537', swing: -1, open: 1.2 } }] });
  // pantry east wall, hall wall
  wall(34.5, 25.0, 34.5, 26.55, { y0: B, h: HI, t: .12, m: plaster });
  wall(37.75, 25.0, 37.75, 26.55, { y0: B, h: HI, t: .12, m: plaster });
  // saloon north wall with wide opening x 34.8–36.8
  wall(30.06, 26.55, 34.8, 26.55, { y0: B, h: HI, t: .15, m: plaster });
  wall(36.8, 26.55, 40.4, 26.55, { y0: B, h: HI, t: .15, m: plaster });
  box(34.8, CEIL - .5, 26.47, 36.8, CEIL, 26.63, plaster); // bulkhead over opening

  // skirting in the saloon
  const sk = (x0, z0, x1, z1) => box(x0, B, z0, x1, B + .1, z1, skirt);
  sk(30.15, 26.63, 34.8, 26.66); sk(36.8, 26.63, 40.25, 26.66); sk(40.22, 26.63, 40.25, 33.37); sk(30.15, 33.34, 40.25, 33.37);

  // ---------------- slabs / ceilings ----------------
  // over men saloon + strip, and the covered east part of the men patio (ground rooms above)
  box(30.0, CEIL, 23.9, 40.55, -0.02, 33.6, ceil);
  box(27.0, CEIL, 23.9, 30.0, -0.02, 33.6, ceil);
  // over the north strip of the sunken patio (ground living area above, z 12–14.6)
  box(16.75, CEIL, 11.95, 26.9, -0.02, 14.6, ceil);
  // saloon cove ceiling + downlights
  const cove = mat({ color: '#f7f4ee', rough: .95 });
  box(30.15, CEIL - .3, 26.65, 40.3, CEIL, 27.25, cove);
  box(30.15, CEIL - .3, 32.8, 40.3, CEIL, 33.4, cove);
  box(30.15, CEIL - .3, 27.25, 30.75, CEIL, 32.8, cove);
  box(39.7, CEIL - .3, 27.25, 40.3, CEIL, 32.8, cove);
  const glow = mat({ color: '#fff4dc', emissive: '#ffe1a8', emissiveIntensity: 1.1, key: 'bmen_cove' });
  box(30.75, CEIL - .31, 27.25, 39.7, CEIL - .3, 27.3, glow); box(30.75, CEIL - .31, 32.75, 39.7, CEIL - .3, 32.8, glow);
  for (let x = 31.5; x < 39.5; x += 1.6) for (const z of [28.2, 31.8]) downlight(x, z, CEIL);
  for (let z = 27.6; z < 32.6; z += 1.6) { downlight(30.45, z, CEIL - .3); downlight(40.0, z, CEIL - .3); }
  [[31.15, 25.2], [33.4, 24.6], [36.1, 24.6], [39.1, 25.2], [28.5, 26], [28.5, 29], [28.5, 32]].forEach(([x, z]) => downlight(x, z, CEIL));
  for (let x = 18; x < 26.5; x += 2) downlight(x, 13.3, CEIL);

  // ======================================================================
  // 5. STAIR up to grade: flight 1 rises south (x 24.06–25.5, z 33.5–36.2), landing, flight 2 rises east to x 28.06
  // ======================================================================
  const r = 3.6 / 21, tr = .27;
  const nose = mat({ color: '#5f5c58', rough: .6 });
  const lightStep = mat({ color: '#d3d1cc', rough: .7 }); const tr2 = (28.06 - 25.5) / 9; const shadowM = mat({ color: '#8e8b86', rough: .7 });
  for (let k = 1; k <= 10; k++) { box(24.16, B, 33.5 + (k - 1) * tr, 25.5, B + k * r, 33.5 + k * tr, lightStep, { walk: true }); box(24.16, B + k * r, 33.5 + (k - 1) * tr, 25.5, B + k * r + .006, 33.5 + (k - 1) * tr + .06, shadowM); box(24.16, B + k * r, 33.5 + (k - 1) * tr, 25.5, B + k * r + .007, 33.5 + (k - 1) * tr + .02, nose); }
  const yl = B + 11 * r;
  box(24.16, B, 36.2, 25.5, yl, 40.6, lightStep, { walk: true });
  for (let k = 1; k <= 9; k++) { box(25.5 + (k - 1) * tr2, B, 39.1, 25.5 + k * tr2, yl + k * r, 40.6, lightStep, { walk: true }); box(25.5 + (k - 1) * tr2 - .001, B, 39.1, 25.5 + (k - 1) * tr2 + .06, yl + k * r + .006, 40.6, shadowM); box(25.5 + (k - 1) * tr2 - .002, B, 39.1, 25.5 + (k - 1) * tr2 + .02, yl + k * r + .007, 40.6, nose); }
  // dark stringers along both sides of flight 1 + landing (read as the stair edges in plan)
  box(24.16, B, 33.5, 24.24, yl + .25, 40.6, nose); box(25.42, B, 33.5, 25.5, yl + .25, 39.1, nose);
  wall(25.5, 33.5, 25.5, 39.1, { y0: B, h: HR, t: .15, off: .075, m: stone });
  wall(25.5, 39.1, 28.06, 39.1, { y0: yl - 1, h: -yl + 1, t: .15, off: .075, m: stone });
  wall(24.06, 40.6, 28.06, 40.6, { y0: B, h: HR, t: .2, off: -.1, m: stone });
  // brick landing at grade (lower entry)
  rect(28.06, 39.1, 31.6, 40.6, .004, brick);
  // handrails
  const rail = (x0, y0, z0, x1, y1, z1) => {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0); const m = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, len, 8), steel);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0).normalize()); ctx.add(m);
  };
  rail(25.4, B + .9, 33.5, 25.4, yl + .9 - r, 36.2);
  rail(25.5, yl + .9, 40.5, 28.06, .9, 40.5);

  // ======================================================================
  // 6. Guards at grade around the open courts: glass balustrade on stone coping
  // ======================================================================
  const guard = (x0, z0, x1, z1) => {
    const horiz = Math.abs(z1 - z0) < 1e-3;
    if (horiz) { box(x0, 0, z0 - .12, x1, .08, z0 + .12, coping); box(x0, .08, z0 - .01, x1, 1.05, z0 + .01, M.glass(), { collide: true, cast: false }); box(x0, 1.05, z0 - .03, x1, 1.1, z0 + .03, steel); }
    else { box(x0 - .12, 0, z0, x0 + .12, .08, z1, coping); box(x0 - .01, .08, z0, x0 + .01, 1.05, z1, M.glass(), { collide: true, cast: false }); box(x0 - .03, 1.05, z0, x0 + .03, 1.1, z1, steel); }
  };
  guard(16.9, 20.3, 16.9, 30.2);
  guard(16.9, 30.2, 24.06, 30.2);
  guard(24.06, 23.75, 24.06, 30.2);
  guard(24.06, 23.8, 27.0, 23.8);
  guard(24.06, 39.1, 24.06, 40.6);
  guard(24.06, 40.6, 28.06, 40.6);
  guard(25.5, 39.1, 28.06, 39.1);

  // court lighting: wall washers on the retaining walls (emissive only)
  const wash = mat({ color: '#fff6e0', emissive: '#ffe7b8', emissiveIntensity: .9, key: 'bmen_wash' });
  for (let z = 13; z < 30; z += 2.5) box(17.05, B + 2.2, z, 17.08, B + 2.3, z + .3, wash);

  planProxy(ctx, brick);

  // WORKAROUND (main.js framePlan): Box3.setFromObject only refreshes the mesh's own world matrix, so meshes inside
  // groups placed with ctx.place() would be measured at their local height and hidden in the basement cutaway.
  ctx.group.updateMatrixWorld(true);
}

// ======================================================================
// PLAN PROXY of the at-grade garden south of the sunken court (x 16.5–24, z 30.2–41) and the lower-entry landing.
// The basement plan draws the grade landscape around the sunken court, but the plan cutaway hides everything whose
// bottom is above L.B+2.4 (= -1.2), so the real at-grade paving/trees/palm built by `site` can never appear there.
// These are flat stand-ins buried at y ≈ -1.3 (under the grade fill, behind the retaining walls): they only ever
// show in the basement plan view, never at eye level. Colours sampled from the basement plan (grade shown desaturated).
// ======================================================================
function planProxy(ctx, brick) {
  const { rect, box } = ctx;
  const PY = -1.3, nw = { walk: false };
  const flat = (c) => mat({ color: c, rough: .9 });
  const greyBand = mat({ color: '#ffffff', map: tex.tiles('#b8b5ac', '#918e86', 4, .04, 71), tile: 1, rough: .8 });
  const greyPave = mat({ color: '#ffffff', map: tex.basket('#8e8e8e', 8, 72), tile: 3, rough: .8 });
  // grey paving base south of the brick terrace, brick terrace, grey tiled band (continuation of the court paving at grade)
  rect(16.5, 33.75, 22.6, 41.2, PY, greyPave, nw);
  rect(16.5, 31.9, 24.0, 33.75, PY + .002, brick, nw);
  rect(16.5, 33.75, 18.3, 35.2, PY + .002, brick, nw);
  rect(21.0, 33.75, 22.6, 35.8, PY + .002, brick, nw);
  rect(16.9, 30.2, 24.0, 31.9, PY + .002, greyBand, nw);
  box(16.55, PY, 30.2, 16.85, PY + .02, 33.7, flat('#8d8a85'));      // west edge wall line
  box(16.9, PY, 31.85, 24.0, PY + .015, 31.95, flat('#9c9890'));     // band / terrace joint
  rect(18.3, 33.75, 21.0, 35.6, PY + .002, brick, nw);   // free-standing palm sits on the brick
  // curved planter bands across the grey paving (desaturated on the plan)
  const band = (zA0, zA1, zB0, zB1, c, y) => { const pts = []; for (let i = 0; i <= 12; i++) { const x = 16.5 + 4.5 * i / 12, t = i / 12; pts.push([x, zA0 + (zA1 - zA0) * t * t]); }
    for (let i = 12; i >= 0; i--) { const x = 16.5 + 4.5 * i / 12, t = i / 12; pts.push([x, zB0 + (zB1 - zB0) * t * t]); } ctx.poly(pts, y, flat(c), { walk: false }); };
  band(35.2, 36.2, 35.55, 36.55, '#3e3e3e', PY + .004);
  band(35.55, 36.55, 38.25, 38.55, '#b3b3b3', PY + .004);
  band(38.25, 38.55, 38.6, 38.9, '#3e3e3e', PY + .004);
  // east L planter beside the stair (site's planter, x 22.6–24)
  box(22.6, PY, 33.5, 24.0, PY + .02, 41.2, flat('#5a5a5a'));
  rect(22.8, 33.7, 23.85, 41.0, PY + .021, flat('#7b7b7b'), nw);
  rect(23.35, 33.8, 23.95, 35.5, PY + .022, flat('#4f9a2f'), nw);
  // lower-entry landing at grade: brick, then grey paving, and the house's south wall line
  rect(28.06, 39.55, 32.1, 41.2, PY, brick, nw);
  rect(32.1, 39.55, 35.6, 41.2, PY, greyPave, nw);
  box(25.5, PY, 39.4, 35.65, PY + .02, 39.55, flat('#3c3a38'));
  box(35.5, PY, 39.4, 35.65, PY + .02, 41.2, flat('#3c3a38'));

  // plan symbols for trees / palm (alpha-cut canvas discs)
  const symbol = (key, draw) => { const m = mat({ color: '#ffffff', map: tex.custom(key, draw), rough: .9, transparent: true, key: 'bmen_' + key }); m.alphaTest = .5; m.transparent = false; m.depthWrite = true; return m; };
  const treeSym = (green) => (g, n) => {
    const c = n / 2, r = n / 2 - 6; const R = rngf(green ? 3 : 5);
    const gr = g.createRadialGradient(c * .8, c * .8, r * .1, c, c, r);
    if (green) { gr.addColorStop(0, '#e9f7c8'); gr.addColorStop(.45, '#8fcf45'); gr.addColorStop(1, '#3f8a24'); }
    else { gr.addColorStop(0, '#f2f2f2'); gr.addColorStop(.5, '#bdbdbd'); gr.addColorStop(1, '#6e6e6e'); }
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, 7); g.fill();
    for (let i = 0; i < 400; i++) { const a = R() * 6.28, d = R() * r * .95; g.fillStyle = green ? (R() < .5 ? '#5ea52f' : '#b8e070') : (R() < .5 ? '#8a8a8a' : '#dcdcdc'); g.globalAlpha = .35; g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, 4 + R() * 8, 0, 7); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = '#333'; g.lineWidth = 3;
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .3; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * r * .95, c + Math.sin(a) * r * .95); g.stroke(); }
    g.lineWidth = 7; g.strokeStyle = '#2f2f2f'; g.beginPath(); g.arc(c, c, r - 3, 0, 7); g.stroke();
  };
  const palmSym = (g, n) => {
    const c = n / 2, R = rngf(9);
    for (let i = 0; i < 13; i++) { const a = i / 13 * 6.28 + R() * .3, L2 = n * (.36 + R() * .12);
      for (let k = 0; k < 26; k++) { const t = k / 26, x = c + Math.cos(a) * L2 * t, y = c + Math.sin(a) * L2 * t, w = Math.sin(Math.PI * t) * 34 + 3;
        g.strokeStyle = t > .7 ? (R() < .5 ? '#c7d84a' : '#9fc23c') : (R() < .5 ? '#8c8c8c' : '#b5b5b5'); g.lineWidth = 3;
        for (const sgn of [-1, 1]) { const b = a + sgn * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * w, y + Math.sin(b) * w); g.stroke(); } }
      g.strokeStyle = '#6a6a6a'; g.lineWidth = 4; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * L2, c + Math.sin(a) * L2); g.stroke(); }
    g.fillStyle = '#5a5a5a'; g.beginPath(); g.arc(c, c, 14, 0, 7); g.fill();
  };
  const grey = symbol('tree_grey', treeSym(false)), green = symbol('tree_green', treeSym(true)), palmM = symbol('palm', palmSym);
  const disc = (x, z, r, m, y) => { const g = new THREE.PlaneGeometry(2 * r, 2 * r); const mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); ctx.add(mesh, { cast: false }); };
  disc(21.2, 31.1, .68, green, PY + .05);                 // second round tree on the grey band (plan: green)
  disc(19.5, 34.5, 1.6, palmM, PY + .08);               // palm in its planter
  [[22.95, 34.3, .78], [23.0, 36.5, .78], [23.0, 38.6, .78], [17.67, 37.6, .66], [19.65, 37.5, 1.1], [16.9, 40.6, .8]]
    .forEach(([x, z, r], i) => disc(x, z, r, grey, PY + .06 + i * .002));
}
function rngf(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Terrace tree: trunk + flattened canopy dome whose top carries the plan's two-tone (green / white-blossom) canopy,
// projected from above so the plan view reads like the reference symbol; foliage clumps below for eye level.
function planTree(ctx, x, y, z, r, h) {
  const t = tex.custom('bmen_tree2tone', (g, n) => {
    const c = n / 2, rr = n / 2 - 4; const R = rngf(31);
    g.fillStyle = '#6fb83a'; g.beginPath(); g.arc(c, c, rr, 0, 7); g.fill();
    const gr = g.createRadialGradient(c * .7, c * .7, 10, c, c, rr); gr.addColorStop(0, '#c9ec7a'); gr.addColorStop(1, '#3f8f22');
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, rr, 0, 7); g.fill();
    g.fillStyle = '#f1f4ec'; g.beginPath(); g.moveTo(c, c); g.arc(c, c, rr, -1.0, 1.25); g.closePath(); g.fill();
    for (let i = 0; i < 500; i++) { const a = R() * 6.28, d = R() * rr * .95, white = a > 5.28 || a < 1.25; g.fillStyle = white ? (R() < .5 ? '#d5dccb' : '#ffffff') : (R() < .5 ? '#5ea52f' : '#b8e070'); g.globalAlpha = .4; g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, 4 + R() * 9, 0, 7); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = '#2f5a22'; g.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + .2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * rr * .96, c + Math.sin(a) * rr * .96); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = '#3c5e30'; g.beginPath(); g.arc(c, c, rr - 2, 0, 7); g.stroke();
  });
  const m = mat({ color: '#ffffff', map: t, rough: .85, key: 'bmen_tree2tone' }); m.map.wrapS = m.map.wrapT = THREE.ClampToEdgeWrapping;
  let geo = new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  { const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * r), .5 + p.getZ(i) / (2 * r));
    // append one zero-area triangle at the trunk foot so the plan cutaway (which tests each mesh's bbox bottom) keeps the canopy
    const sy = .55, foot = -h / sy, P = Array.from(p.array), U = Array.from(uv.array), N = Array.from(geo.attributes.normal.array);
    for (let k = 0; k < 3; k++) { P.push(0, foot, 0); U.push(.5, .5); N.push(0, 1, 0); }
    geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); }
  const dome = new THREE.Mesh(geo, m); dome.scale.y = .55; dome.position.set(x, y + h, z); ctx.add(dome);
  const lm = [mat({ color: '#5c9a36', rough: .85 }), mat({ color: '#e9eee2', rough: .85 }), mat({ color: '#467f2a', rough: .85 })]; const R = rngf(77);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, d = r * (.45 + R() * .3); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.3 + R() * .12), 1), lm[(Math.cos(a) > .3) ? 1 : (i % 2 ? 0 : 2)]);
    c.position.set(x + Math.cos(a) * d, y + h - .15 - R() * .25, z + Math.sin(a) * d); c.scale.y = .7; ctx.add(c); }
  const under = new THREE.Mesh(new THREE.SphereGeometry(r * .97, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat({ color: '#4f8a2c', rough: .9 }));
  under.scale.y = .35; under.position.set(x, y + h, z); ctx.add(under);
  ctx.cyl(x, y, z, .1, h, mat({ color: '#6b4f36', rough: .9 }), 10, { collide: true });
}

// WC fixtures as drawn (beige vanity + oval basin top-left, WC and bidet against the south wall) and plan door swing arcs
function wcFixtures(ctx) {
  const { box, cyl } = ctx; const B = L.B;
  const beige = mat({ color: '#e0d2b2', rough: .35 }), dark = mat({ color: '#8b7a5c', rough: .5 });
  box(30.15, B, 24.0, 30.75, B + .82, 24.85, mat({ color: '#d9cbab', rough: .4 }));
  const basin = cyl(30.45, B + .82, 24.42, .2, .03, mat({ color: '#f4efe4', rough: .2 }), 24); basin.scale.z = 1.3;
  cyl(30.45, B + .845, 24.42, .14, .01, dark, 20).scale.z = 1.3;
  for (const x of [30.75, 31.6]) {
    box(x - .2, B, 26.27, x + .2, B + .75, 26.5, beige);             // cistern / back
    const bowl = cyl(x, B, 25.95, .19, .42, beige, 24); bowl.scale.z = 1.35;
    const rim = cyl(x, B + .42, 25.95, .13, .005, dark, 20); rim.scale.z = 1.35;
  }
  arc(ctx, 32.19, 23.95, .95, Math.PI, Math.PI * 1.5);           // WC door (east wall, swings into WC)
  arc(ctx, 39.75, 23.9, 1.0, Math.PI, Math.PI * 1.5);           // corridor door to the living area
}
function arc(ctx, cx, cz, r, a0, a1) {
  const g = new THREE.RingGeometry(r - .02, r + .02, 32, 1, a0, a1 - a0);
  const m = new THREE.Mesh(g, mat({ color: '#4a4744', rough: .6, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(cx, L.B + .012, cz); ctx.add(m, { cast: false });
}

function gridTex(key, base, grout, cells, gw) {
  return tex.custom('bmen_grid_' + key, (g, n) => { const R = rngf(cells * 7 + gw); g.fillStyle = grout; g.fillRect(0, 0, n, n); const c = n / cells;
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { const col = new THREE.Color(base).multiplyScalar(.97 + R() * .06); g.fillStyle = '#' + col.getHexString(); g.fillRect(i * c + gw / 2, j * c + gw / 2, c - gw, c - gw); } });
}

// basket-weave brick pavers (0.25 x 0.5 m pairs alternating direction) with grout; k = pixels per metre
function drawBasket(g, n, x0, y0, x1, y1, k) {
  const R = rngf(41), u = .25 * k, cols = ['#a5644f', '#b06e57', '#985a47', '#ad6a52', '#9f5f4b'];
  g.fillStyle = '#74483a'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const gw = Math.max(2, k * .01);
  for (let i = 0; i * u < x1; i++) for (let j = 0; j * u < y1; j++) {
    const X = i * u, Y = j * u, vert = (i + j) % 2 === 0;
    for (let p = 0; p < 2; p++) { g.fillStyle = cols[(R() * cols.length) | 0];
      if (vert) g.fillRect(X + p * u / 2 + gw / 2, Y + gw / 2, u / 2 - gw, u - gw); else g.fillRect(X + gw / 2, Y + p * u / 2 + gw / 2, u - gw, u / 2 - gw); }
  }
  for (let i = 0; i < 4000; i++) { g.fillStyle = R() < .5 ? '#d39a80' : '#7d4a3a'; g.globalAlpha = .18; g.fillRect(R() * x1, R() * y1, 2 + R() * 3, 2 + R() * 3); } g.globalAlpha = 1;
}
