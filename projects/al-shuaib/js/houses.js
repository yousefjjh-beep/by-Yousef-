// Two more houses in the Bayt Safar language, built as maquettes for the sales page.
// Each is built in its own local metres inside a group; the landing places the group on its own sheet.
import * as THREE from 'three';
import { B, CY, wall, doorLeaf, screen } from './house.js';
import { datePalm, flushPalms, resetPalms, tree } from './trees.js';

function glass(g, M, alongX, c, a, b, y, h) { // one bronze-framed pane between a and b
  const w = b - a, s = .05, put = (x, yy, ww, hh, mat, th) => (alongX ? B(g, mat, x, yy, c - th / 2, ww, hh, th) : B(g, mat, c - th / 2, yy, x, th, hh, ww));
  put(a, y, s, h, M.bronze, .06); put(b - s, y, s, h, M.bronze, .06); put(a, y + h - s, w, s, M.bronze, .06); put(a, y, w, s, M.bronze, .06); put(a + s, y + s, w - 2 * s, h - 2 * s, M.glass, .014).castShadow = false;
}
function cope(g, M, x1, z1, x2, z2, y, t = .5) { B(g, M.mud, x1 - t / 2 - .03, y, z1 - t / 2 - .03, x2 - x1 + t + .06, .07, z2 - z1 + t + .06); }
function pergola(g, M, x1, z1, x2, z2, y, alongX) {
  for (const [x, z] of [[x1, z1], [x2 - .1, z1], [x1, z2 - .1], [x2 - .1, z2 - .1]]) B(g, M.bronze, x, -.02, z, .1, y, .1);
  if (alongX) { B(g, M.oak, x1, y, z1, x2 - x1, .16, .1); B(g, M.oak, x1, y, z2 - .1, x2 - x1, .16, .1); for (let x = x1 + .15; x < x2 - .1; x += .42) B(g, M.oak, x, y + .16, z1 - .15, .07, .14, z2 - z1 + .3); }
  else { B(g, M.oak, x1, y, z1, .1, .16, z2 - z1); B(g, M.oak, x2 - .1, y, z1, .1, .16, z2 - z1); for (let z = z1 + .15; z < z2 - .1; z += .42) B(g, M.oak, x1 - .15, y + .16, z, x2 - x1 + .3, .14, .07); }
}
function pool(g, M, x, z, w, d) { for (const [ax, az, aw, ad] of [[x - .35, z - .35, w + .7, .35], [x - .35, z + d, w + .7, .35], [x - .35, z, .35, d], [x + w, z, .35, d]]) B(g, M.trav, ax, -.4, az, aw, .4, ad); B(g, M.poolTile || M.stone, x, -.398, z, w, .22, d); const m = B(g, M.water, x, -.1, z, w, .04, d); m.castShadow = false; }
function sofa(g, M, x, z, w, d, back) { B(g, M.oak, x, .08, z, w, .1, d); B(g, M.boucle, x + .04, .18, z + .04, w - .08, .28, d - .08); if (back === 'n') B(g, M.boucle, x + .04, .46, z + .04, w - .08, .34, .22); if (back === 'w') B(g, M.boucle, x + .04, .46, z + .04, .22, .34, d - .08); if (back === 's') B(g, M.boucle, x + .04, .46, z + d - .26, w - .08, .34, .22); if (back === 'e') B(g, M.boucle, x + w - .26, .46, z + .04, .22, .34, d - .08); }
function table(g, M, x, z, w, d, n) { B(g, M.oak, x, .7, z, w, .06, d); B(g, M.bronze, x + .2, 0, z + d / 2 - .04, .08, .7, .08); B(g, M.bronze, x + w - .28, 0, z + d / 2 - .04, .08, .7, .08);
  for (let i = 0; i < n; i++) { const cx = x + (i + .5) * w / n - .23; for (const cz of [z - .5, z + d + .04]) { B(g, M.boucle, cx, .0, cz, .46, .46, .46); } } }
function bed(g, M, x, z) { B(g, M.oak, x, 0, z, 2.1, .28, 2.3); B(g, M.linenSand || M.boucle, x + .05, .28, z + .35, 2.0, .2, 1.9); B(g, M.oak, x, 0, z, 2.1, 1.05, .1); B(g, M.pillow || M.boucle, x + .2, .48, z + .2, .7, .14, .42); B(g, M.pillow || M.boucle, x + 1.2, .48, z + .2, .7, .14, .42); }
function lounger(g, M, x, z, alongX) { alongX ? (B(g, M.oak, x, 0, z, 1.9, .22, .7), B(g, M.boucle, x + .04, .22, z + .04, 1.82, .1, .62)) : (B(g, M.oak, x, 0, z, .7, .22, 1.9), B(g, M.boucle, x + .04, .22, z + .04, .62, .1, 1.82)); }
function pot(g, M, x, z, r = .32) { CY(g, M.clay, x, -.02, z, r * .7, r * 2.1, 18, r); }

// Bayt Mustaqil. 9 x 9 m, two floors and a roof terrace; plunge pool and terrace to the east.
export function buildMustaqil(g, M) {
  const W = (w, ops) => wall(g, M, w, ops);
  B(g, M.stone, -.25, -.4, -.25, 9.5, .3, 9.5); B(g, M.floor, 0, -.4, 0, 9, .4, 9);
  const slot = (at, y = .9, h = 2.0) => ({ at, w: .7, y, h });
  W({ x1: 0, z1: .225, x2: 9, z2: .225, t: .45, h: 7.9, out: 'n' }, [slot(2.2), slot(6.8), slot(2.2, 4.3), slot(4.5, 4.3), slot(6.8, 4.3), { at: 4.5, y: 6.95, tri: 3 }]);
  W({ x1: 0, z1: 8.775, x2: 9, z2: 8.775, t: .45, h: 7.9, out: 's' }, [{ at: 4.5, w: 1.5, h: 2.8 }, slot(1.6), slot(7.4), { at: 4.5, w: 3.4, y: 4.0, h: 2.3 }, { at: 1.6, y: 6.95, tri: 3 }, { at: 7.4, y: 6.95, tri: 3 }]);
  W({ x1: .225, z1: .45, x2: .225, z2: 8.55, t: .45, h: 7.9, out: 'w' }, [slot(2.0), slot(4.05), slot(6.1), slot(2.0, 4.3), slot(6.1, 4.3), { at: 4.05, y: 6.95, tri: 3 }]);
  W({ x1: 8.775, z1: .45, x2: 8.775, z2: 8.55, t: .45, h: 7.9, out: 'e' }, [{ at: 4.05, w: 3.8, h: 2.8 }, slot(1.4, 4.3), slot(4.05, 4.3), slot(6.7, 4.3), { at: 4.05, y: 6.95, tri: 3 }]);
  cope(g, M, 0, .225, 9, .225, 7.9, .45); cope(g, M, 0, 8.775, 9, 8.775, 7.9, .45); cope(g, M, .225, .45, .225, 8.55, 7.9, .45); cope(g, M, 8.775, .45, 8.775, 8.55, 7.9, .45);
  B(g, M.ceilTop || M.mudIn, .45, 3.3, .45, 8.1, .3, 8.1); B(g, M.paver || M.trav, .45, 6.6, .45, 8.1, .3, 8.1);        // upper floor, roof terrace
  for (const [a, y, h] of [[2.2, .9, 2], [6.8, .9, 2], [2.2, 4.3, 2], [4.5, 4.3, 2], [6.8, 4.3, 2]]) glass(g, M, true, .2, a - .35, a + .35, y, h);
  for (const [a, y, h] of [[1.6, .9, 2], [7.4, .9, 2]]) glass(g, M, true, 8.8, a - .35, a + .35, y, h); glass(g, M, true, 8.8, 2.8, 4.5, 4.0, 2.3); glass(g, M, true, 8.8, 4.5, 6.2, 4.0, 2.3);
  for (const [a, y] of [[2.45, .9], [4.5, .9], [6.55, .9], [2.45, 4.3], [6.55, 4.3]]) glass(g, M, false, .2, a - .35, a + .35, y, 2);
  for (const a of [1.85, 4.5, 7.15]) glass(g, M, false, 8.8, a - .35, a + .35, 4.3, 2); glass(g, M, false, 8.8, 2.6, 4.5, 0, 2.8); glass(g, M, false, 8.86, 4.5, 6.4, 0, 2.8);
  doorLeaf(g, M, 3.75, 8.775, 1.5, 2.78, 0, .95);
  // inside, ground floor: one room, a stair along the west wall, kitchen to the north
  for (let i = 0; i < 12; i++) B(g, M.trav, .5, 0, 7.6 - i * .5, 1.1, (i + 1) * .275, .5);
  B(g, M.walnut || M.oak, 2.6, 0, .5, 4.6, .9, .65); B(g, M.trav, 2.55, .9, .48, 4.7, .04, .7); B(g, M.walnut || M.oak, 3.4, 0, 2.3, 2.6, .9, .9); B(g, M.trav, 3.35, .9, 2.25, 2.7, .04, 1.0);
  sofa(g, M, 2.4, 4.6, 2.8, 1.0, 'w'); sofa(g, M, 2.6, 6.6, 2.6, .95, 's'); B(g, M.oak, 3.6, 0, 5.75, 1.2, .3, .7); B(g, M.carpetSand || M.boucle, 2.2, .005, 4.3, 4.6, .012, 3.6); table(g, M, 5.9, 1.9, 1.9, .9, 2);
  // roof terrace
  const roof = new THREE.Group(); roof.position.y = 6.9; g.add(roof);
  pergola(roof, M, .8, .8, 5.2, 4.6, 2.4, true); sofa(roof, M, 1.3, 1.2, 2.8, 1.0, 'n'); sofa(roof, M, 1.2, 2.6, 1.0, 1.8, 'w'); B(roof, M.oak, 2.7, 0, 2.7, 1.2, .3, .7); pot(roof, M, 7.5, 1.5, .36); tree(roof, M, 'olive', 7.5, .6, 1.5, .55, false);
  lounger(roof, M, 6.2, 5.4, false); lounger(roof, M, 7.2, 5.4, false);
  // outside: east terrace and plunge pool, front path, planting
  B(g, M.trav, 9, -.4, 1.2, 3.4, .39, 6.6); pool(g, M, 13.0, 2.2, 2.2, 4.6); lounger(g, M, 10.1, 1.7, false); lounger(g, M, 11.0, 1.7, false);
  for (let i = 0; i < 4; i++) B(g, M.paver || M.trav, 3.6, -.4, 9.3 + i * .95, 1.8, .39, .8);
  pot(g, M, 3.1, 9.5); pot(g, M, 5.9, 9.5); B(g, M.rock || M.stone, -1.6, -.4, 5.2, 1.1, .7, .8);
  datePalm(g, M, -1.5, 10.6, 8.2, .5, 2.4); datePalm(g, M, 11.2, -1.2, 9.0, .4, .6); datePalm(g, M, 7.6, 11.2, 6.6, .5, 1.2); flushPalms(g, M); resetPalms();
  tree(g, M, 'ghaf', -1.4, -.3, -.6, 1.0, false); tree(g, M, 'olive', 14.2, -.3, 8.6, 1.0, false);
}

// Bayt Mustatil. One room 20 x 7 m, open along its whole south side to a pergola, a pool and palms.
export function buildMustatil(g, M) {
  const W = (w, ops) => wall(g, M, w, ops), H = 4.2;
  B(g, M.stone, -.25, -.4, -.25, 20.5, .3, 7.5); B(g, M.floor, 0, -.4, 0, 20, .4, 7);
  const slot = (at) => ({ at, w: .7, y: .9, h: 2.2 }), tri = (at) => ({ at, y: 3.35, tri: 2 });
  const ns = [2.4, 5.6, 9.2, 12.8, 16.4, 18.4];
  W({ x1: 0, z1: .25, x2: 20, z2: .25, t: .5, h: H, out: 'n' }, [...ns.map(slot), ...[4, 11, 17.4].map(tri)]);
  W({ x1: .25, z1: .5, x2: .25, z2: 6.75, t: .5, h: H, out: 'w' }, [{ at: 3.0, w: 1.5, h: 2.8 }, { at: 3.0, y: 3.3, tri: 2 }]);
  W({ x1: 19.75, z1: .5, x2: 19.75, z2: 6.75, t: .5, h: H, out: 'e' }, [slot(1.8), slot(4.4)]);
  for (const a of ns) glass(g, M, true, .22, a - .35, a + .35, .9, 2.2); for (const a of [2.3, 4.9]) glass(g, M, false, 19.78, a - .35, a + .35, .9, 2.2);
  doorLeaf(g, M, .25, 2.75, 1.5, 2.78, Math.PI / 2, -.95);
  // the open south side: piers every four metres, a deep beam, glass between
  const piers = [0, 4, 8, 12, 16, 19.5]; for (const x of piers) B(g, M.mud, x, 0, 6.5, .5, H, .5); B(g, M.mud, 0, 3.3, 6.5, 20, H - 3.3, .5);
  for (let i = 0; i < 5; i++) { const a = piers[i] + .5, b = piers[i + 1], m = (a + b) / 2; if (i === 2) { glass(g, M, true, 6.7, a, a + 1.0, 0, 3.3); glass(g, M, true, 6.7, b - 1.0, b, 0, 3.3); } else { glass(g, M, true, 6.72, a, m, 0, 3.3); glass(g, M, true, 6.78, m, b, 0, 3.3); } }
  // partitions: bedroom west, bath, living in the middle, dining and kitchen east
  W({ x1: 6.2, z1: .5, x2: 6.2, z2: 6.5, t: .2, h: H }, [{ at: 4.6, w: 1.1, h: 2.6 }]); W({ x1: 6.3, z1: 3.0, x2: 8.3, z2: 3.0, t: .2, h: H }, [{ at: 1.0, w: .9, h: 2.4 }]); W({ x1: 8.3, z1: .5, x2: 8.3, z2: 3.1, t: .2, h: H }, []);
  B(g, M.mud, -.35, H, -.35, 20.7, .28, 7.7); cope(g, M, 0, 0, 20, 7, H + .28, .7);
  bed(g, M, 2.4, .6); B(g, M.oak, 1.6, 0, .6, .6, .5, .5); B(g, M.oak, 4.7, 0, .6, .6, .5, .5); sofa(g, M, 1.2, 4.6, 2.2, .9, 'w'); B(g, M.carpetSand || M.boucle, 1.6, .005, .5, 4.0, .012, 3.4);
  B(g, M.trav, 6.5, 0, .6, 1.6, .55, .8); B(g, M.walnut || M.oak, 6.5, 0, 2.2, .5, .85, .7);
  sofa(g, M, 9.4, 1.0, 3.6, 1.05, 'n'); sofa(g, M, 9.0, 2.6, 1.0, 2.4, 'w'); sofa(g, M, 13.4, 2.8, .95, .95); B(g, M.oak, 10.6, 0, 3.0, 1.8, .3, 1.0); B(g, M.carpetSand || M.boucle, 9.0, .005, .9, 5.6, .012, 4.6);
  table(g, M, 15.4, 4.0, 3.0, 1.0, 4); B(g, M.walnut || M.oak, 15.2, 0, .55, 4.2, .9, .65); B(g, M.trav, 15.15, .9, .52, 4.3, .04, .72);
  // outside: terrace under a pergola, the pool, the garden
  B(g, M.trav, -.5, -.4, 7.25, 21, .39, 3.4); pergola(g, M, 4.2, 7.1, 16, 10.4, 3.2, false);
  sofa(g, M, 6.0, 8.2, 2.6, .95, 'w'); sofa(g, M, 11.6, 8.2, 2.6, .95, 'e'); B(g, M.oak, 9.4, 0, 8.3, 1.4, .3, .8);
  pool(g, M, 2.2, 11.4, 15.6, 3.0); for (const x of [18.6, 19.6]) lounger(g, M, x, 11.6, false);
  B(g, M.paver || M.trav, -3.2, -.4, 2.6, 2.9, .39, 1.8); pot(g, M, -.5, 1.6); pot(g, M, -.5, 4.6);
  datePalm(g, M, -2.4, 9.2, 8.6, .5, 2.6); datePalm(g, M, -2.0, 13.2, 7.0, .4, 1.9); datePalm(g, M, 22.0, 8.2, 9.2, .5, .4); datePalm(g, M, 21.6, 13.4, 7.4, .5, 1.0); datePalm(g, M, 8.6, -1.3, 7.8, .3, 4.4); flushPalms(g, M); resetPalms();
  tree(g, M, 'olive', 22.2, -.3, 2.0, 1.1, false); tree(g, M, 'acacia', -2.6, -.3, -.6, .9, false); tree(g, M, 'ghaf', 15.6, -.3, -1.2, .8, false);
}
