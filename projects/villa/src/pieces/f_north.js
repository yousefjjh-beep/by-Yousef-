// Piece: f_north — first floor: stair arrival + gallery with double-height voids, sitting nook,
// LIVING ROOM 6.4x4.2, bar, FAMILY LIVING gallery, powder room, BEDROOM ONE 6x6 + W.C + wardrobes,
// service-stair landing, ceilings and roof (7.6–8.0, parapet to 9.0).
import { THREE, L, tex, mat, M, F } from '../lib.js';

export const rooms = [
  { name: 'First floor stair landing', level: 'F', x: 33.3, z: 3.3, yaw: Math.PI },
  { name: 'First floor living room', level: 'F', x: 35.0, z: 13.6, yaw: -Math.PI / 4 },
  { name: 'Family living', level: 'F', x: 31.5, z: 18.5, yaw: -Math.PI / 2 },
  { name: 'Bedroom one', level: 'F', x: 39.3, z: 20.3, yaw: -Math.PI / 3 },
];
export const views = [
  { name: 'living room from bar', level: 'F', x: 35.2, z: 16.7, yaw: -22, pitch: -8, fov: 68 },
  { name: 'gallery and nook over the voids', level: 'F', x: 33.9, z: 3.0, yaw: 128, pitch: -12, fov: 70 },
  { name: 'bedroom one from passage', level: 'F', x: 39.2, z: 20.6, yaw: -50, pitch: -8, fov: 68 },
  { name: 'family living towards bar', level: 'F', x: 30.2, z: 20.6, yaw: -40, pitch: -8, fov: 70 },
];

const Y = L.F;            // 4.2
const CEIL = 7.6;
const WH = CEIL - Y;      // 3.4 wall height

export function build(ctx) {
  const { box, boxC, rect, wall, poly } = ctx;

  // ------------------------------------------------------------------ materials
  const mCream = mat({ color: '#ffffff', map: tex.tiles('#e9e1d5', '#dcd2c4', 4, 0.02, 31), tile: 3.2, rough: .55 });
  const mWood = mat({ color: '#ffffff', map: weatheredWood(), tile: 2.8, rough: .5 });
  const mBarWood = mat({ color: '#ffffff', map: tex.wood('#3e2a1d', 3, 42), tile: 1.2, rough: .4 });
  const mCarpet = mat({ color: '#ffffff', map: tex.carpet('#e4d2b2', 43), tile: 1.2, rough: 1 });
  const mWhiteTile = mat({ color: '#ffffff', map: bathTiles(), tile: 1.24, rough: .3 });
  const mLanding = mat({ color: '#ffffff', map: tex.marble('#d3ddd7', '#b5c4bc', 45), tile: 2, rough: .3 });
  const mLandingT = mat({ color: '#bccbc3', map: tex.marble('#d3ddd7', '#b5c4bc', 45), tile: 2, rough: .3 });
  const mWallP = M.plaster();
  const mExt = M.extStone();
  const mBlack = mat({ color: '#1c1b1b', rough: .5 });
  const mGold = mat({ color: '#b89a68', rough: .35, metal: .6 });
  const mGoldDark = mat({ color: '#7c6440', rough: .4, metal: .5 });
  const mInlay = mat({ color: '#d6bf96', rough: .5 });
  const mSkirt = mat({ color: '#3a2a20', rough: .5 });
  const mCurtain = mat({ color: '#efe6d6', map: tex.carpet('#efe6d6', 46), tile: .8, rough: 1 });
  const mCeil = M.ceiling();
  const mTint = mat({ color: '#74b2d2', rough: .6, key: 'fnorth_tint4' });
  const mRail = M.steel();

  // ------------------------------------------------------------------ helpers
  const ry = (x1, z1, x2, z2) => Math.atan2(-(z2 - z1), x2 - x1);
  // exterior wall: travel clockwise on the plan so the exterior is on the LEFT (mB)
  const ext = (x1, z1, x2, z2, openings = []) => {
    wall(x1, z1, x2, z2, { y0: Y, h: WH, t: 0.25, mA: mWallP, mB: mExt, openings });
    if (openings.tint) { // blue-tinted transom band over the glazing (reads as the plan's blue glass line from above)
      const [a, b] = openings.tint, len = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / len, uz = (z2 - z1) / len, c = (a + b) / 2;
      boxC(x1 + ux * c, Y + 2.55 + (WH - 2.55) / 2, z1 + uz * c, b - a, WH - 2.55, 0.17, mTint, ry(x1, z1, x2, z2));
      boxC(x1 + ux * c, Y + 2.55, z1 + uz * c, b - a, 0.05, 0.14, M.frame(), ry(x1, z1, x2, z2));
    }
  };
  const intw = (x1, z1, x2, z2, openings = [], t = 0.12) => wall(x1, z1, x2, z2, { y0: Y, h: WH, t, m: mWallP, openings });
  // run of full-height glazing between distances a..b along a wall, split into panels ≤ 1.9 m
  const glazing = (a, b, sill = 0.05, hh = 3.1) => {
    const n = Math.max(1, Math.ceil((b - a) / 1.9)); const pw = (b - a) / n; const out = [];
    for (let i = 0; i < n; i++) out.push({ at: a + pw * (i + .5), w: pw - 0.06, y0: sill, h: WH, glass: true });
    out.tint = [a, b];
    return out;
  };
  // glass balustrade with steel top rail
  const rail = (x1, z1, x2, z2, h = 1.05) => {
    const len = Math.hypot(x2 - x1, z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, r = ry(x1, z1, x2, z2);
    boxC(cx, Y + 0.05 + h / 2, cz, len, h - 0.05, 0.02, M.glass(), r, { collide: true, cast: false });
    boxC(cx, Y + h + 0.02, cz, len, 0.04, 0.06, mRail, r);
    boxC(cx, Y + 0.04, cz, len, 0.08, 0.1, mRail, r);
  };
  const skirt = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1); boxC((x1 + x2) / 2, Y + 0.05, (z1 + z2) / 2, len, 0.1, 0.02, mSkirt, ry(x1, z1, x2, z2)); };
  const curtain = (x, z, w, alongX) => { // gathered curtain stack, full height
    if (alongX) box(x - w / 2, Y + 0.02, z - 0.06, x + w / 2, CEIL - 0.08, z + 0.06, mCurtain);
    else box(x - 0.06, Y + 0.02, z - w / 2, x + 0.06, CEIL - 0.08, z + w / 2, mCurtain);
  };
  const downlights = (x0, z0, x1, z1, step = 1.6) => {
    const nx = Math.max(1, Math.round((x1 - x0) / step)), nz = Math.max(1, Math.round((z1 - z0) / step));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) ctx.downlight(x0 + (x1 - x0) * (i + .5) / nx, z0 + (z1 - z0) * (j + .5) / nz, CEIL, 0.07);
  };
  // gypsum bulkhead (perimeter drop) with LED cove at its inner edge
  const coffer = (x0, z0, x1, z1, b = 0.45) => {
    const yb = CEIL - 0.3, m = mCeil;
    box(x0, yb, z0, x1, CEIL, z0 + b, m); box(x0, yb, z1 - b, x1, CEIL, z1, m);
    box(x0, yb, z0 + b, x0 + b, CEIL, z1 - b, m); box(x1 - b, yb, z0 + b, x1, CEIL, z1 - b, m);
    const led = M.lightPanel();
    box(x0 + b, yb, z0 + b - 0.02, x1 - b, yb + 0.02, z0 + b, led); box(x0 + b, yb, z1 - b, x1 - b, yb + 0.02, z1 - b + 0.02, led);
    box(x0 + b - 0.02, yb, z0 + b, x0 + b, yb + 0.02, z1 - b, led); box(x1 - b, yb, z0 + b, x1 - b + 0.02, yb + 0.02, z1 - b, led);
  };
  const put = (obj, x, z, r = 0, collide = true) => ctx.place(obj, x, Y, z, r, { collide });
  const S = 0, N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2; // facing directions for kit furniture

  // ------------------------------------------------------------------ floors (at exactly L.F)
  // gallery / stair landing (cream), leaving holes for the stair and the two X voids
  rect(26.9, 3.95, 29.06, 14.75, Y, mCream);
  rect(29.06, 7.06, 32.1, 11.7, Y, mCream);
  rect(32.1, 7.06, 32.56, 14.75, Y, mCream);
  rect(32.2, 2.3, 34.5, 7.06, Y, mCream);
  rect(32.1, 3.95, 32.2, 7.06, Y, mCream);
  // family living (cream)
  rect(28.9, 14.75, 33.25, 21.5, Y, mCream);
  rect(33.25, 17.25, 37.7, 21.5, Y, mCream);
  rect(33.95, 21.5, 37.7, 23.65, Y, mCream);
  rect(37.7, 21.3, 40.56, 23.65, Y, mCream);
  // living room + bar (dark planks)
  rect(32.56, 10.4, 40.56, 14.75, Y, mWood);
  rect(33.25, 14.75, 37.7, 17.25, Y, mWood);
  // g_front's ground wall (x 34.6, z 3.8–14.8) tops out at exactly 4.2 and z-fights through the living floor: cover it 3 mm up
  rect(34.3, 10.45, 34.9, 14.75, Y + 0.003, mWood);
  // powder room, W.C (white tiles)
  rect(37.7, 14.75, 40.56, 17.25, Y, mWhiteTile);
  rect(42.5, 18.9, 46.95, 21.3, Y, mWhiteTile);
  // bedroom one (carpet) incl. wardrobe passage
  rect(40.56, 14.75, 46.95, 18.9, Y, mCarpet);
  rect(37.7, 17.25, 40.56, 21.3, Y, mCarpet);
  rect(40.56, 18.9, 42.5, 21.3, Y, mCarpet);
  // north stair arrival: g_front's 24-riser flight tops out at x 29.75 (= L.F); the plan's wood treads continue to the column at x 32.2
  rect(29.75, 2.3, 32.2, 3.95, Y, mat({ color: '#ffffff', map: stairWoodTex(), tile: 1.0, rough: .8 }));
  box(29.75, Y - 0.35, 2.3, 32.2, Y - 0.02, 3.95, mExt); // landing slab
  // service stair landing (flight x 42–45.25 by g_service)
  rect(40.56, 21.3, 42.0, 23.65, Y, mLandingT); // pale teal-grey glass-look landing (plan)
  // lift / shaft block floors
  rect(32.56, 7.12, 34.44, 8.2, Y, mat({ color: '#ffffff', map: tex.custom('fnorth_bronze', (g, n) => { const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#b3a285'); gr.addColorStop(1, '#6f5c45'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128), tile: 1.9, rough: .5, metal: .2 }));
  rect(32.56, 8.3, 34.44, 10.35, Y, M.white());
  poly([[32.62, 8.42], [34.38, 8.42], [34.38, 10.28]], Y + 0.005, mGoldDark, { walk: false });
  // nook floor inlay frame (x 26.94–32.5, z 7.48–11.31)
  { const y = Y + 0.003, b = 0.1; box(26.94, Y, 7.48, 32.1, y, 7.48 + b, mInlay); box(26.94, Y, 11.31 - b, 32.1, y, 11.31, mInlay);
    box(26.94, Y, 7.48, 26.94 + b, y, 11.31, mInlay); }

  // ------------------------------------------------------------------ exterior walls (clockwise, exterior on the left)
  ext(22.0, 3.95, 22.0, 2.25);
  ext(22.0, 2.25, 34.5, 2.25);
  ext(34.5, 2.25, 34.5, 10.4, glazing(0.2, 5.85));
  ext(34.5, 10.4, 40.6, 10.4, glazing(0.6, 6.0));
  ext(40.6, 10.4, 40.6, 14.75, glazing(0.1, 3.7));
  ext(40.6, 14.75, 46.95, 14.75, glazing(0.15, 6.2));
  ext(46.95, 14.75, 46.95, 21.3);
  ext(46.95, 21.3, 45.25, 21.3);
  ext(45.25, 21.3, 45.25, 23.7);
  ext(26.9, 23.7, 26.9, 14.75, glazing(0.15, 8.8));

  // ------------------------------------------------------------------ interior walls
  // lift / shaft block east of the gallery
  intw(32.5, 7.06, 32.5, 10.4, [{ at: 2.3, w: 1.1, y0: 0, h: 2.4, glass: true }]);
  intw(32.5, 7.06, 34.5, 7.06);
  intw(32.5, 8.25, 34.5, 8.25, [], 0.1);
  intw(32.5, 10.4, 34.5, 10.4);
  // living room west wall
  intw(32.56, 10.4, 32.56, 14.75, [], 0.14);
  // living room south: glass partition + opening to bar + solid, then powder room north wall
  intw(32.56, 14.75, 40.56, 14.75, [
    { at: 0.9, w: 1.7, y0: 0, h: 2.6, glass: true },
    { at: 2.65, w: 1.75, y0: 0, h: 2.8 },
  ]);
  // powder room
  intw(37.7, 14.75, 37.7, 17.25, [{ at: 1.15, w: 0.85, h: 2.65, door: { color: '#5a3a26', swing: -1, open: 1.1 } }]);
  intw(40.56, 14.75, 40.56, 19.0);
  intw(33.9, 17.25, 40.56, 17.25);
  // wardrobe passage west wall + bedroom south wall (door x 38.56–39.7)
  intw(37.7, 17.25, 37.7, 21.3);
  intw(37.7, 21.3, 45.25, 21.3, [{ at: 1.43, w: 1.0, h: 2.65, door: { color: '#5a3a26', swing: 1, open: 1.25 } }]);
  // bedroom W.C
  intw(42.5, 18.9, 46.95, 18.9);
  intw(42.5, 18.9, 42.5, 21.3, [{ at: 0.72, w: 0.85, h: 2.65, door: { color: '#5a3a26', swing: 1, open: 1.1 } }]);
  intw(42.5, 20.2, 43.8, 20.2, [], 0.06); // shower partition stub
  // service-stair hall west wall with door
  intw(40.56, 21.3, 40.56, 23.65, [{ at: 1.7, w: 1.0, h: 2.65, door: { color: '#5a3a26', swing: -1, open: 1.2 } }]);
  // my half of the wall shared with f_south (centre z 23.7)
  wall(37.7, 23.65, 45.25, 23.65, { y0: Y, h: WH, t: 0.1, m: mWallP }); // plan shows no wall west of x 37.7
  // low solid parapet along the stair flight edge
  wall(26.9, 3.95, 32.2, 3.95, { y0: Y, h: 1.1, t: 0.16, m: mat({ color: '#ffffff', map: tex.wood('#3e2a1d', 3, 47), tile: 1.2, rough: .4 }) });

  // ------------------------------------------------------------------ columns
  for (const x of [28.81, 32.35]) for (const z of [4.19, 7.31, 11.44, 14.62]) box(x - .25, Y, z - .25, x + .25, CEIL, z + .25, mBlack, { collide: true });

  // ------------------------------------------------------------------ glass balustrades around voids
  rail(26.95, 4.05, 26.95, 14.75);              // gallery over double-height living area (g_front)
  rail(29.06, 4.44, 29.06, 7.06); rail(29.06, 7.06, 32.1, 7.06); rail(32.1, 4.44, 32.1, 7.06);   // void 1
  rail(29.06, 11.7, 29.06, 14.37); rail(29.06, 11.7, 32.1, 11.7); rail(32.1, 11.7, 32.1, 14.37);  // void 2
  rail(29.06, 14.75, 32.1, 14.75);
  rail(27.05, 14.75, 28.9, 14.75); rail(28.9, 14.75, 28.9, 21.5); rail(28.9, 21.5, 33.95, 21.5); rail(33.95, 21.5, 33.95, 23.6); // family void
  // service stair: guard over the lower run (assumed north half), arrival on south half at x 42
  rail(42.0, 21.4, 42.0, 22.5); rail(42.0, 22.5, 44.1, 22.5);

  // ------------------------------------------------------------------ plan-drawing X over the double-height voids
  // (the architect's "open to below" cross; drawn only in the orthographic plan view, invisible at eye level)
  { const mX = mat({ color: '#8d8780', rough: .9 });
    const xl = (x1, z1, x2, z2) => { const len = Math.hypot(x2 - x1, z2 - z1);
      const m = boxC((x1 + x2) / 2, Y + 0.02, (z1 + z2) / 2, len, 0.004, 0.03, mX, ry(x1, z1, x2, z2), { cast: false });
      m.receiveShadow = false; m.onBeforeRender = (r, s, cam) => { if (!cam.isOrthographicCamera) m.matrixWorld.makeScale(0, 0, 0); }; };
    const X = (x0, z0, x1, z1) => { xl(x0, z0, x1, z1); xl(x0, z1, x1, z0); };
    X(29.06, 4.44, 32.1, 7.06); X(29.06, 11.7, 32.1, 14.37);
    X(26.98, 14.8, 28.85, 21.45); X(26.98, 21.55, 33.9, 23.6);
  }

  // plan-drawing door swing (quarter circle) for the bedroom door from the family hall: hinge x 38.63, z 21.3, leaf swings north
  { const r = 0.98, g = new THREE.RingGeometry(r - 0.02, r, 24, 1, 0, Math.PI / 2); const m = new THREE.Mesh(g, mat({ color: '#8d8780', rough: .9, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(38.63, Y + 0.02, 21.3); ctx.add(m, { cast: false });
    m.onBeforeRender = (rr, sc, cam) => { if (!cam.isOrthographicCamera) m.matrixWorld.makeScale(0, 0, 0); }; }

  // ------------------------------------------------------------------ sitting nook
  put(F.armchair({ color: '#efe3c4', w: 0.8, d: 0.8 }), 28.15, 8.25, 0.6 + Math.PI / 2 * 0.3);
  put(F.armchair({ color: '#efe3c4', w: 0.8, d: 0.8 }), 28.15, 10.6, Math.PI - 0.9);
  box(27.35, Y, 8.55, 27.72, Y + 0.75, 10.2, mat({ color: '#ffffff', map: tex.wood('#7b5a42', 2, 48), tile: 1, rough: .4 }), { collide: true });

  // ------------------------------------------------------------------ living room
  { const cream = '#eee2c3';
    put(F.sofa({ len: 4.0, depth: 0.72, color: cream, cushions: 4, arms: false }), 40.06, 12.56, W);
    put(F.sofa({ len: 1.4, depth: 0.7, color: cream, cushions: 2, arms: false }), 39.0, 10.92, S);
    put(F.sofa({ len: 1.4, depth: 0.7, color: cream, cushions: 2, arms: false }), 39.0, 14.22, N);
    const fab = F.fabric(cream);
    box(38.3, Y, 10.57, 38.48, Y + 0.62, 11.27, fab); box(38.3, Y, 13.87, 38.48, Y + 0.62, 14.57, fab);
    rbxCushion(ctx, 39.98, 12.75, '#d9c7a0');
    put(F.armchair({ color: cream, w: 0.66, d: 0.72 }), 36.78, 11.0, S);
    put(F.armchair({ color: cream, w: 0.66, d: 0.72 }), 36.78, 14.2, N);
    put(F.ottoman({ w: .62, d: .62, color: '#e6d7b5' }), 37.75, 10.95);
    put(F.ottoman({ w: .62, d: .62, color: '#e6d7b5' }), 37.75, 14.25);
    // angled TV console in the NW corner, facing the sofa
    const a = ry(33.62, 10.81, 33.0, 11.56);
    boxC(33.31, Y + 0.25, 11.19, 1.0, 0.5, 0.22, mat({ color: '#efe6d3', rough: .4 }), a, { collide: true });
    const tv = boxC(33.27, Y + 1.25, 11.15, 1.3, 0.75, 0.05, M.black(), a);
    coffer(32.63, 10.53, 40.47, 14.68);
  }
  // curtains at living-room glazing
  curtain(35.45, 10.6, 0.45, true); curtain(39.9, 10.6, 0.3, true); curtain(40.4, 10.9, 0.5, false); curtain(40.4, 13.95, 0.3, false);

  // ------------------------------------------------------------------ bar + family seating
  const brown = '#9c7c58';
  put(F.armchair({ color: brown, w: .66, d: .66 }), 32.78, 15.35, E);
  put(F.armchair({ color: brown, w: .66, d: .66 }), 32.78, 16.55, E);
  const taupe = '#c2b49a', tbl = '#5c4636';
  put(F.armchair({ color: taupe, w: .66, d: .66 }), 35.08, 17.75, S);
  put(F.armchair({ color: taupe, w: .66, d: .66 }), 36.5, 17.75, S);
  put(F.sideTable({ s: .42, h: .5, top: tbl }), 35.8, 17.65);
  put(F.sideTable({ s: .42, h: .5, top: tbl }), 37.2, 17.65);
  put(F.sofa({ len: 1.4, depth: .66, color: taupe, cushions: 2 }), 37.25, 18.8, W);
  put(F.sideTable({ s: .42, h: .5, top: tbl }), 37.2, 19.85);

  // ------------------------------------------------------------------ powder room
  put(F.toilet(), 38.7, 16.9, N);
  { const b = F.toilet(); b.children[1].visible = false; put(b, 39.3, 16.9, N); }
  put(F.vanity({ len: 1.1, top: '#efe6d8', cab: '#4a3324' }), 40.2, 15.55, W);

  // ------------------------------------------------------------------ bedroom one
  // shaggy taupe rug (plan: x 43.4–46.35, z 15.5–18.5), pale beige bed with pillows to the south, one dark nightstand
  { const sh = mat({ color: '#ffffff', map: shagTex(), tile: .8, rough: 1 }); box(43.3, Y, 15.4, 46.45, Y + 0.02, 18.6, sh); }
  put(F.bed({ w: 1.95, l: 2.15, color: '#d3c4a6', throwC: '#d3c4a6', head: '#cbbb9c', headH: 1.0 }), 44.88, 17.65, N);
  box(46.0, Y, 18.22, 46.56, Y + 0.55, 18.78, mat({ color: '#ffffff', map: tex.wood('#4a3528', 2, 49), tile: .6, rough: .4 }), { collide: true });
  put(F.wardrobe({ len: 3.3, d: .62, color: '#efe8dc' }), 38.07, 19.55, E);
  put(F.wardrobe({ len: 2.6, d: .55, color: '#efe8dc' }), 39.1, 17.6, S);
  { const hm = mat({ color: '#ffffff', map: hatchTex(), tile: .62, rough: .6 });
    box(37.76, Y + 2.5, 17.9, 38.38, Y + 2.515, 21.2, hm); box(37.8, Y + 2.5, 17.33, 40.4, Y + 2.515, 17.88, hm); }
  curtain(40.95, 14.95, 0.5, true); curtain(46.55, 14.95, 0.5, true);
  coffer(40.68, 14.88, 46.82, 18.82, 0.4);

  // ------------------------------------------------------------------ bedroom W.C
  put(F.vanity({ len: 1.5, top: '#6e5546', cab: '#6b4c33' }), 44.65, 19.27, S);
  put(F.bathtub({ l: 1.5, w: .72 }), 46.3, 20.0, 0);
  box(42.6, Y, 20.25, 43.75, Y + 0.05, 21.22, M.white());
  box(43.75, Y, 20.25, 43.77, Y + 2.1, 21.22, M.glass(), { collide: true });
  put(F.toilet(), 42.85, 19.7, E);

  // ------------------------------------------------------------------ skirting (main rooms)
  [[32.63, 10.53, 35.1, 10.53], [32.63, 10.53, 32.63, 14.68], [36.1, 14.68, 37.7, 14.68],
   [46.82, 14.88, 46.82, 18.82], [33.9, 17.18, 36.3, 17.18], [27.0, 3.9, 26.0, 3.9]].slice(0, 5).forEach((s) => skirt(...s));

  // ------------------------------------------------------------------ ceilings (7.6) + downlights
  const ceil = (x0, z0, x1, z1) => rect(x0, z0, x1, z1, CEIL - 0.005, mCeil, { up: false });
  ceil(22.0, 2.25, 34.5, 3.95); ceil(26.9, 3.95, 32.5, 14.75); ceil(32.5, 3.95, 34.5, 7.06);
  ceil(32.56, 10.4, 40.6, 14.75); ceil(26.9, 14.75, 40.56, 23.7); ceil(40.56, 14.75, 46.95, 21.3); ceil(40.56, 21.3, 45.25, 23.7);
  ceil(32.5, 7.06, 34.5, 10.4);
  downlights(33.2, 11.0, 39.9, 14.2, 1.7);
  downlights(41.2, 15.4, 46.3, 18.3, 1.7);
  downlights(27.2, 4.2, 28.6, 14.5, 1.6); downlights(29.3, 7.5, 31.9, 11.3, 1.3);
  downlights(29.2, 15.0, 37.5, 21.3, 1.8); downlights(34.2, 21.6, 40.3, 23.4, 1.6);
  downlights(37.9, 15.0, 40.3, 17.0, 1.2); downlights(42.8, 19.2, 46.7, 21.0, 1.3);
  downlights(38.6, 17.9, 42.3, 21.0, 1.4); downlights(40.7, 21.5, 41.9, 23.4, 1.2);
  downlights(22.5, 2.6, 34.2, 3.6, 1.8);

  // ------------------------------------------------------------------ roof slab 7.6–8.0 + parapet to 9.0
  const roof = (x0, z0, x1, z1) => box(x0, CEIL, z0, x1, L.R, z1, mExt);
  roof(21.87, 2.12, 34.63, 3.95); roof(26.8, 3.95, 34.63, 10.4); roof(26.8, 10.4, 40.73, 14.75);
  roof(26.77, 14.75, 47.08, 21.3); roof(26.77, 21.3, 45.38, 23.7);
  const par = (x1, z1, x2, z2) => wall(x1, z1, x2, z2, { y0: L.R, h: 1.0, t: 0.25, m: mExt });
  par(22.0, 3.95, 22.0, 2.25); par(22.0, 2.25, 34.5, 2.25); par(34.5, 2.25, 34.5, 10.4); par(34.5, 10.4, 40.6, 10.4);
  par(40.6, 10.4, 40.6, 14.75); par(40.6, 14.75, 46.95, 14.75); par(46.95, 14.75, 46.95, 21.3); par(46.95, 21.3, 45.25, 21.3);
  par(45.25, 21.3, 45.25, 23.7); par(26.9, 23.7, 26.9, 14.75);
}

// a loose scatter cushion on the long sofa
function rbxCushion(ctx, x, z, color) {
  const g = new THREE.Group(); F.rbx(g, .14, .36, .4, .05, 0, .66, 0, F.fabric(color)); g.rotation.y = 0.3;
  ctx.place(g, x, L.F, z, 0.3);
}

// dark weathered planks with grey streaks, boards along z (like the plan's living-room floor)
function weatheredWood() {
  return tex.custom('fnorth_wood', (g, n) => {
    let seed = 77; const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const boards = 8, w = n / boards, cols = ['#7a5644', '#6c4a39', '#84604c', '#73513f', '#664535'];
    for (let i = 0; i < boards; i++) {
      g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(i * w, 0, w, n);
      for (let k = 0; k < 30; k++) { g.strokeStyle = R() < .5 ? '#a8968a' : '#3e2a1f'; g.globalAlpha = .12 + R() * .25; g.lineWidth = .5 + R() * 1.5;
        const x = i * w + R() * w, y = R() * n; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 3, y + 30 + R() * 140); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = '#3a2619'; g.fillRect(i * w, 0, 2, n); g.fillRect(i * w, R() * n, w, 2);
    }
  });
}

// bathroom floor: white 30 cm tiles with clearly visible grey grout (4 tiles per texture)
function bathTiles() {
  return tex.custom('fnorth_bath', (g, n) => {
    const s = n / 4; g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#e4e4e1' : '#dededb'; g.fillRect(i * s + 7, j * s + 7, s - 14, s - 14); }
  });
}
// shaggy taupe pile
function shagTex() {
  return tex.custom('fnorth_shag', (g, n) => {
    let seed = 9; const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#8a765c'; g.fillRect(0, 0, n, n);
    for (let k = 0; k < 9000; k++) { g.fillStyle = R() < .5 ? '#665440' : '#a8957a'; g.globalAlpha = .5; const x = R() * n, y = R() * n; g.fillRect(x, y, 1.5 + R() * 2, 4 + R() * 6); }
    g.globalAlpha = 1;
  });
}
// wardrobe run seen from above, like the plan: white bays with a grey outline and a zigzag hatch
function hatchTex() {
  return tex.custom('fnorth_hatch', (g, n) => {
    g.fillStyle = '#f7f6f3'; g.fillRect(0, 0, n, n);
    g.strokeStyle = '#5e5a56'; g.lineWidth = 10; g.strokeRect(5, 5, n - 10, n - 10);
    g.lineWidth = 6; g.beginPath(); g.moveTo(20, 20); g.lineTo(n / 2, n - 20); g.lineTo(n - 20, 20); g.stroke();
  });
}

// dark wood stair treads seen from above (matches g_front's flight): 0.25 m treads with dark nosing lines
function stairWoodTex() {
  return tex.custom('fnorth_stairwood', (g, n) => {
    let seed = 53; const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#4b2c18'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 260; i++) { const y = R() * n; g.strokeStyle = R() < .5 ? '#7a4f30' : '#1f120a'; g.globalAlpha = .15 + R() * .4; g.lineWidth = .6 + R() * 2.5; g.beginPath(); g.moveTo(0, y); g.lineTo(n, y + (R() - .5) * 10); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = '#2a170c'; for (let i = 0; i < 4; i++) g.fillRect(i * n / 4, 0, 4, n);
  });
}
