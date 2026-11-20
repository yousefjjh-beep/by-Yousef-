// Plot, pool terrace, planting and the Wadi Safar escarpment around it.
import * as THREE from 'three';
import { B, BU, CY, mk, boxGeo, wall, doorLeaf, colliders, screen } from './house.js';
import { shrub } from './props.js';
import { datePalm as palm, flushPalms, tree, grasses } from './trees.js';
import { rnd, rr } from './tex.js';

function boulder(p, M, x, y, z, r) {
  const g = new THREE.IcosahedronGeometry(r, 2), pos = g.attributes.position, s = rnd() * 10;
  for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i), k = 1 + .22 * Math.sin(v.x * 3 / r + s) * Math.cos(v.z * 2.3 / r + s) + .12 * Math.sin(v.y * 5 / r + s); pos.setXYZ(i, v.x * k, v.y * k * .65, v.z * k); }
  g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r * 4, uv.getY(i) * r * 2);
  mk(p, g, M.rock, x, y - r * .18, z).rotation.y = rnd() * 6;
}
function lounger(p, M, x, z) {
  B(p, M.woodLight, x, .2, z - .35, 2.0, .06, .7); for (const [a, b] of [[.1, -.3], [1.8, -.3], [.1, .28], [1.8, .28]]) B(p, M.woodLight, x + a, -.1, z + b, .06, .3, .06);
  const c = mk(p, new THREE.BoxGeometry(1.3, .09, .64), M.linen, x + .68, .3, z); const bk = mk(p, new THREE.BoxGeometry(.75, .09, .64), M.linen, x + 1.62, .5, z); bk.rotation.z = .62;
  const t = CY(p, M.taupe, 0, 0, 0, .07, .5, 12); t.rotation.x = Math.PI / 2; t.position.set(x + .25, .42, z); colliders.ground.push([x, z - .4, x + 2, z + .4]);
}

export function buildSite(scene, M) {
  const p = new THREE.Group(); scene.add(p);
  M.cliffNear = M.cliff.clone(); M.cliffNear.map = M.cliff.map.clone(); M.cliffNear.map.repeat.set(.5, .5); M.cliffNear.normalMap = M.cliff.normalMap.clone(); M.cliffNear.normalMap.repeat.set(.5, .5);
  // ---- ground with the pool cut out ----
  const gs = new THREE.Shape(); gs.moveTo(-500, -500); gs.lineTo(500, -500); gs.lineTo(500, 500); gs.lineTo(-500, 500); gs.closePath();
  const hole = new THREE.Path(); hole.moveTo(21.5, -14); hole.lineTo(25.5, -14); hole.lineTo(25.5, -4); hole.lineTo(21.5, -4); hole.closePath(); gs.holes.push(hole);
  const gg = new THREE.ShapeGeometry(gs); gg.rotateX(-Math.PI / 2); const ground = mk(p, gg, M.sand, 0, -0.1, 0); ground.castShadow = false;
  // ---- paving ----
  const pave = (x, z, w, d) => B(p, M.paver, x, -.1, z, w, .05, d).castShadow = false;
  pave(-16, 9.2, 15.75, 2.6); pave(18.25, 2.5, 3.25, 13); pave(25.5, 2.5, 3.3, 13); pave(21.5, 2.5, 4, 1.5); pave(21.5, 14, 4, 1.5);
  pave(-1.6, 8.6, 1.35, 3.8);
  // ---- pool ----
  B(p, M.poolTile, 21.5, -1.6, 4, 4, .05, 10); B(p, M.poolTile, 21.45, -1.6, 4, .05, 1.52, 10); B(p, M.poolTile, 25.5, -1.6, 4, .05, 1.52, 10); B(p, M.poolTile, 21.5, -1.6, 3.95, 4, 1.52, .05); B(p, M.poolTile, 21.5, -1.6, 14, 4, 1.52, .05);
  for (let i = 0; i < 4; i++) B(p, M.poolTile, 21.5, -1.6, 14 - (i + 1) * .35, 1.6, 1.2 - i * .3, .35);
  for (const [x, z, w, d] of [[21.2, 3.7, 4.6, .32], [21.2, 13.98, 4.6, .32], [21.2, 4.02, .32, 9.96], [25.48, 4.02, .32, 9.96]]) B(p, M.stone, x, -.1, z, w, .08, d);
  const water = mk(p, new THREE.PlaneGeometry(4, 10, 1, 1), M.water, 23.5, -.16, 9); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  colliders.ground.push([21.5, 4, 25.5, 14]);
  for (const z of [5.4, 7.6, 9.8]) lounger(p, M, 26.2, z);
  { // umbrella
    CY(p, M.woodLight, 27.2, -.1, 12.3, .03, 2.6, 8); const u = mk(p, new THREE.ConeGeometry(1.7, .5, 10, 1, true), M.canvas, 27.2, 2.6, 12.3); u.receiveShadow = false; CY(p, M.stone, 27.2, -.1, 12.3, .3, .14, 16);
    for (let i = 0; i < 10; i++) { const r = CY(p, M.woodLight, 0, 0, 0, .008, 1.72, 4); r.position.set(27.2 + Math.cos(i * .628) * .8, 2.58, 12.3 + Math.sin(i * .628) * .8); r.rotation.set(0, -i * .628, Math.PI / 2 - .29, 'YXZ'); }
    B(p, M.woodLight, 26.6, .3, 12.9, .5, .04, .5); CY(p, M.wood, 26.85, -.1, 13.15, .03, .4, 8); mk(p, new THREE.CylinderGeometry(.04, .03, .12, 10), M.glass, 26.78, .4, 13.1);
  }
  // ---- pergola against the east wall ----
  {
    const x1 = 18.35, x2 = 21.1, z1 = 4.6, z2 = 13.4, h = 3.0;
    for (const z of [z1, 7.6, 10.4, z2]) { B(p, M.wood, x2 - .14, -.1, z - .07, .14, h + .1, .14); B(p, M.stone, x2 - .2, -.1, z - .13, .26, .25, .26); B(p, M.wood, x1 - .35, h, z - .06, x2 - x1 + .7, .16, .12); }
    B(p, M.wood, x2 - .16, h - .16, z1 - .3, .16, .16, z2 - z1 + .6);
    const n = 30, g = new THREE.CylinderGeometry(.03, .03, x2 - x1 + .6, 6); g.rotateZ(Math.PI / 2); const im = new THREE.InstancedMesh(g, M.beam, n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set((x1 + x2) / 2 - .1, h + .19, z1 + (z2 - z1) * (i + .5) / n); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.castShadow = true; p.add(im);
    const mat = mk(p, boxGeo(x2 - x1 + .2, .02, 3.6), M.mat, (x1 + x2) / 2 - .1, h + .24, 6.4); const mat2 = mk(p, boxGeo(x2 - x1 + .2, .02, 3.0), M.mat, (x1 + x2) / 2 - .1, h + .24, 11.7);
    // outdoor majlis under it (north bay)
    B(p, M.gypsum, 18.3, -.05, 4.7, .8, .35, 2.9); B(p, M.gypsum, 18.3, -.05, 4.7, 2.7, .35, .8);
    for (let i = 0; i < 3; i++) { mk(p, new THREE.BoxGeometry(.74, .12, .9), M.linenSand, 18.7, .36, 5.2 + i * .94 + .45); const c = mk(p, new THREE.BoxGeometry(.14, .4, .7), M.pillow[i % 3], 18.42, .62, 5.3 + i * .94 + .4); c.rotation.z = -.15; }
    for (let i = 0; i < 2; i++) { mk(p, new THREE.BoxGeometry(.9, .12, .74), M.linenSand, 19.6 + i * .94, .36, 5.1); const c = mk(p, new THREE.BoxGeometry(.7, .4, .14), M.pillow[(i + 1) % 3], 19.6 + i * .94, .62, 4.82); c.rotation.x = .15; }
    B(p, M.woodLight, 19.5, -.05, 6.0, 1.0, .32, .8); CY(p, M.brass, 20.0, .27, 6.4, .22, .015, 24); 
    colliders.ground.push([18.25, 4.7, 19.1, 7.6], [18.25, 4.7, 21.0, 5.5], [19.5, 6.0, 20.5, 6.8]);
    // breakfast table (south bay)
    CY(p, M.stone, 19.6, -.05, 11.9, .5, .03, 28).position.y = .68; CY(p, M.stone, 19.6, -.05, 11.9, .09, .7, 12); CY(p, M.stone, 19.6, -.05, 11.9, .28, .04, 20);
    for (const a of [0.4, 2.5, 4.6]) { const cx = 19.6 + Math.cos(a) * .85, cz = 11.9 + Math.sin(a) * .85; CY(p, M.woodLight, cx, -.05, cz, .2, .45, 14); mk(p, new THREE.CylinderGeometry(.2, .2, .05, 14), M.linenSand, cx, .43, cz); }
    colliders.ground.push([19.0, 11.3, 20.2, 12.5]);
    for (let i = 0; i < 9; i++) shrub(p, i % 3 ? M.blossom : M.leaf, 21.05 + rr(-.1, .1), .2 + i * .34, 13.4 + rr(-.12, .12), .26, 22);
    for (let i = 0; i < 9; i++) shrub(p, i % 3 ? M.blossom : M.leaf, 20.9 - i * .28, 3.25 + rr(-.05, .1), 13.3 + rr(-.2, .1), .3, 22, .6);
  }
  screen(p, M, true, 4.55, 18.3, 21.1, 3.0, -.1);
  // ---- perimeter wall and gate ----
  const PW = (x1, z1, x2, z2, h) => { const L = (z1 === z2) ? x2 - x1 : z2 - z1, ops = []; if (h > 2) for (let a = 3; a < L - 2; a += 6) ops.push({ at: a, y: 1.35, tri: 3, s: .16, gap: .27 }); wall(p, M, { x1, z1, x2, z2, t: .45, h, y0: -.1, mats: [M.mud] }, ops); (z1 === z2) ? B(p, M.stoneDark, x1, -.1, z1 - .25, L, .4, .5) : B(p, M.stoneDark, x1 - .25, -.1, z1, .5, .4, L); (z1 === z2) ? B(p, M.gypsum, x1, h, z1 - .26, x2 - x1, .08, .52) : B(p, M.gypsum, x1 - .26, h, z1, .52, .08, z2 - z1); };
  PW(-16, -8, -16, 8.7, 2.4); PW(-16, 12.3, -16, 26, 2.4); PW(-16, -8, 34, -8, 2.4); PW(-16, 26, 34, 26, 2.4); PW(34, -8, 34, 26, 1.0);
  for (const z of [8.7, 12.3]) { B(p, M.mud, -16.45, -.1, z - .45, .9, 3.5, .9); B(p, M.gypsum, -16.5, 3.4, z - .5, 1.0, .1, 1.0); mk(p, new THREE.ConeGeometry(.5, .5, 4), M.gypsum, -16, 3.75, z).rotation.y = .785; colliders.ground.push([-16.45, z - .45, -15.55, z + .45]); }
  B(p, M.wood, -16.15, 2.9, 9.1, .3, .25, 2.8);
  doorLeaf(p, M, -16, 9.15, 1.35, 2.7, Math.PI / 2, -1.4); doorLeaf(p, M, -16, 11.85, 1.35, 2.7, -Math.PI / 2, 1.4);
  colliders.ground.push([-40, 8, -30, 13]); // road end

  // ---- date palms: an avenue to the door, groves at the corners ----
  for (const x of [-12.5, -7.5, -2.8]) { palm(p, M, x, 7.3, rr(5.5, 8.5), rr(.2, .8), rnd() * 6); palm(p, M, x + .8, 13.8, rr(5.5, 8.5), rr(.2, .8), rnd() * 6); }
  for (const [x, z, h] of [[29.2, 3.2, 7.2], [29.6, 15.6, 8], [-12, -4.5, 7.6], [-10.6, -5.6, 6], [-10.5, 22, 6.8], [30.5, 22.5, 8], [24, -5, 6.6], [3, 22.5, 7.4], [-21, 5, 7], [38, 30, 7]]) palm(p, M, x, z, h, rr(.2, .9), rnd() * 6);
  flushPalms(p, M);
  // ---- olives in the garden, acacia and ghaf on the wadi floor ----
  for (const [x, z, s] of [[19.9, 16.6, 1.15], [27.6, 18.4, 1.3], [8.5, -4.6, 1.2], [-4.5, 4.6, 1.1], [-5.2, 17.2, 1.25], [14.5, 22.6, 1.2], [31.2, 9.5, 1.1]]) { tree(p, M, 'olive', x, -.1, z, s); mk(p, new THREE.CircleGeometry(1.1 * s, 20), M.gravel, x, -.085, z).rotation.x = -Math.PI / 2; }
  for (const [x, z, s] of [[-24, -2, 1.5], [-30, 22, 1.8], [44, 14, 1.7], [40, -10, 1.4], [6, 38, 1.8], [22, 40, 1.5], [-10, -22, 1.7], [28, -22, 1.5], [60, 30, 2], [-45, 8, 1.9], [55, -5, 1.6], [-20, 45, 1.8]]) tree(p, M, 'acacia', x, -.1, z, s, false);
  for (const [x, z, s] of [[-19.5, 14.5, 1.5], [31.5, 1.5, 1.4], [31.8, 17.5, 1.5], [-3, -12, 1.6], [48, 40, 1.8], [-38, -14, 1.8]]) tree(p, M, 'ghaf', x, -.1, z, s, false);
  { const gl = []; for (let i = 0; i < 46; i++) { const x = -15 + i * .33, s = i % 2 ? 1 : -1; gl.push([x, -.1, 10.5 + s * (1.7 + rnd() * .4), rr(.45, .8)]); }
    for (const [cx, cz, n, r] of [[19.9, 16.6, 9, 1.2], [27.6, 18.4, 9, 1.3], [8.5, -4.6, 8, 1.2], [-4.5, 4.6, 8, 1.1], [-5.2, 17.2, 9, 1.2], [14.5, 22.6, 8, 1.2], [31.2, 9.5, 7, 1.1]]) for (let i = 0; i < n; i++) { const a = rnd() * 6.28; gl.push([cx + Math.cos(a) * r * rr(.5, 1), -.1, cz + Math.sin(a) * r * rr(.5, 1), rr(.5, .9)]); }
    for (let i = 0; i < 22; i++) gl.push([29.6 + rnd() * .8, -.1, 2 + i * .65, rr(.5, .9)]);
    for (let i = 0; i < 160; i++) { const a = rnd() * 6.28, d = rr(36, 120); gl.push([9 + Math.cos(a) * d, -.1, 9 + Math.sin(a) * d, rr(.5, 1.2)]); }
    grasses(p, M, gl); }
  for (let i = 0; i < 9; i++) shrub(p, i % 2 ? M.blossom : M.leaf, -15.5 + rnd() * .5, .2 + i * .35, 12.9 + rnd() * 1.6, .3, 18);
  for (const [x, z, r] of [[-4, 5.5, .9], [-5.2, 6.1, .5], [-11, 16.5, 1.1], [-9.8, 17.3, .6], [7, 21.5, 1.0], [29, 18.5, 1.2], [30.2, 19.3, .6], [15, -4, .9], [-13, 1, .8], [22, 20, .7], [4.5, -3.5, .7]]) boulder(p, M, x, -.1, z, r);
  for (let i = 0; i < 60; i++) { const a = rnd() * 6.28, d = rr(45, 130); boulder(p, M, Math.cos(a) * d + 9, -.1, Math.sin(a) * d + 9, rr(.6, 3.2)); }
  // big clay jars and lanterns flanking the front door
  for (const s of [-1, 1]) { const j = mk(p, new THREE.LatheGeometry([[0, 0], [.2, 0], [.36, .3], [.4, .6], [.3, .95], [.2, 1.05], [.23, 1.12], [.18, 1.12]].map(q => new THREE.Vector2(q[0], q[1])), 44), M.clay, -.75, -.1, 10.5 + s * 1.5); grasses(p, M, [[-.75, .95, 10.5 + s * 1.5, .9], [-.7, .95, 10.45 + s * 1.5, .7]]); colliders.ground.push([-1.1, 10.5 + s * 1.5 - .35, -.4, 10.5 + s * 1.5 + .35]); }
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const x = -14 + i * 2.5, z = 10.5 + s * 1.42; BU(p, M.stone, x, -.1, z, .12, .5, .12); const gl = BU(p, M.glow, x - s * .0 , .22, z - s * .055, .07, .1, .02); gl.castShadow = false; }
  // fire circle south of the pool
  { const x = 23.5, z = 19.2; mk(p, new THREE.TorusGeometry(.7, .16, 8, 24), M.stone, x, -.02, z).rotation.x = Math.PI / 2; for (let i = 0; i < 8; i++) { const m = mk(p, new THREE.DodecahedronGeometry(rr(.07, .13), 0), i % 3 ? M.black : M.ember, x + rr(-.35, .35), .02, z + rr(-.35, .35)); m.rotation.set(rnd() * 3, rnd() * 3, 0); }
    for (let i = 0; i < 5; i++) { const a = i * 1.256 + .3; mk(p, new THREE.CylinderGeometry(.36, .38, .2, 16), M.taupe, x + Math.cos(a) * 1.7, .02, z + Math.sin(a) * 1.7); } colliders.ground.push([x - .85, z - .85, x + .85, z + .85]); }

  // ---- escarpment: stepped sandstone benches with scree, like the Tuwaiq edge at Wadi Safar ----
  {
    const tab = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => rnd()));
    const vn = (k, t, f) => { const u = ((t / 6.2832) % 1 + 1) % 1 * f, i = Math.floor(u), fr = u - i, a = tab[k][i % f % 64], b = tab[k][(i + 1) % f % 64], s = fr * fr * (3 - 2 * fr); return a + (b - a) * s; };
    const N = 420, prof = [[0, -.02], [9, .16], [16, .3], [16.6, .52], [22, .55], [22.6, .78], [29, .81], [29.6, 1.0], [60, 1.02], [420, 1.1]], pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N * Math.PI * 2, open = Math.max(0, Math.cos(t - .25)) ** 5;
      const R = 105 + 38 * vn(0, t, 7) + 22 * vn(1, t, 19) + open * 150, Hc = (20 + 16 * vn(2, t, 9) + 6 * vn(3, t, 31)) * (1 - open * .45);
      prof.forEach(([dr, hk], j) => { const rib = (j > 1 && j < 8) ? 3.2 * Math.abs(Math.sin(t * 46 + j * 1.7 + vn(1, t, 23) * 4)) + 2.5 * vn(3, t + j, 61) : 0; const r = R + dr - rib, y = hk * Hc * (j > 2 && j < 9 ? .93 + .14 * vn(0, t + j * .7, 43) : 1); pos.push(9 + Math.cos(t) * r, y, 9 + Math.sin(t) * r); uv.push(t * 110, y + dr * .12); });
    }
    const K = prof.length; for (let i = 0; i < N; i++) for (let j = 0; j < K - 1; j++) { const a = i * K + j, b = a + K; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = mk(p, g, M.cliff); m.castShadow = false;
  }
  return { water };
}
