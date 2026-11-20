// Furniture and small objects, room by room.
import * as THREE from 'three';
import { B, BU, CY, mk, boxGeo, colliders, H, HM, ROOF } from './house.js';
import { rnd, rr } from './tex.js';
import { tree, grasses } from './trees.js';

const dbl = new Map();
const FR = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d'); for (let y = 0; y < 256; y += 4) { g.fillStyle = '#e6dcc4'; g.fillRect(0, y, 8, 2); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, roughness: 1 }); })();
function lathe(p, mat, pts, x, y, z, seg = 24) {
  if (!dbl.has(mat)) { const c = mat.clone(); c.side = THREE.DoubleSide; dbl.set(mat, c); }
  return mk(p, new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), seg), dbl.get(mat), x, y, z);
}
function softGeo(w, h, d, r = 0.05) {
  r = Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001);
  const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2 + r); s.lineTo(w / 2 - r, -h / 2 + r); s.lineTo(w / 2 - r, h / 2 - r); s.lineTo(-w / 2 + r, h / 2 - r); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4 }); g.translate(0, 0, -(d - 2 * r) / 2); return g;
}
// soft cushion: centre x/z, sitting on y
const S = (p, mat, x, y, z, w, h, d, r) => mk(p, softGeo(w, h, d, r), mat, x, y + h / 2, z);
const G = (p, x = 0, y = 0, z = 0, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };
const block = (x1, z1, x2, z2, lvl = 'ground') => colliders[lvl].push([x1, z1, x2, z2]);

// ---------- small objects ----------
function dallah(p, M, x, y, z, s = 1, ry = 0) { // Arabic coffee pot
  const g = G(p, x, y, z, ry); g.scale.setScalar(s);
  lathe(g, M.brass, [[0, 0], [.07, 0], [.085, .02], [.06, .1], [.04, .16], [.05, .2], [.062, .22], [.045, .26], [.02, .3], [.008, .34], [0, .36]], 0, 0, 0);
  const sp = mk(g, new THREE.ConeGeometry(.022, .16, 8), M.brass, .085, .2, 0); sp.rotation.z = -1.0;
  const hd = mk(g, new THREE.TorusGeometry(.055, .008, 6, 14, Math.PI), M.brass, -.07, .15, 0); hd.rotation.z = Math.PI / 2;
  return g;
}
function cups(p, M, x, y, z, n = 4) { for (let i = 0; i < n; i++) lathe(p, M.ceramic, [[0, 0], [.018, 0], [.027, .045], [.024, .045], [.016, .006], [0, .006]], x + (i % 2) * .07 - .03, y, z + (i >> 1) * .07 - .03, 12); }
function bowl(p, mat, x, y, z, r = .14, h = .07) { return lathe(p, mat, [[0, 0], [r * .45, 0], [r, h], [r * .96, h], [r * .42, .012], [0, .012]], x, y, z); }
function dates(p, M, x, y, z, r = .11) { bowl(p, M.brass, x, y, z, r + .03, .05); for (let i = 0; i < 16; i++) { const a = rnd() * 7, d = Math.sqrt(rnd()) * r * .8; const m = mk(p, new THREE.SphereGeometry(.018, 7, 5), M.date, x + Math.cos(a) * d, y + .035 + rnd() * .03, z + Math.sin(a) * d); m.scale.set(1, .8, 1.7); m.rotation.y = rnd() * 3; } }
function fruit(p, M, x, y, z, r, cols) { bowl(p, M.clayDark, x, y, z, r + .04, .08); for (let i = 0; i < 9; i++) { const a = i * 2.4, d = i < 6 ? r * .6 : r * .2; mk(p, new THREE.SphereGeometry(.042, 12, 8), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: .5 }), x + Math.cos(a) * d, y + (i < 6 ? .075 : .13), z + Math.sin(a) * d); } }
function tray(p, M, x, y, z, r = .26) { lathe(p, M.brass, [[0, 0], [r, 0], [r + .012, .02], [r, .022], [r - .01, .008], [0, .008]], x, y, z, 32); }
function mabkhara(p, M, x, y, z, s = 1) { const g = G(p, x, y, z); g.scale.setScalar(s); mk(g, new THREE.CylinderGeometry(.045, .075, .12, 4), M.wood, 0, .06, 0).rotation.y = .78; mk(g, new THREE.CylinderGeometry(.085, .04, .12, 4, 1, true), M.brass, 0, .18, 0).rotation.y = .78; mk(g, new THREE.SphereGeometry(.025, 8, 6), M.ember, 0, .17, 0); }
function lantern(p, M, x, y, z, s = 1, light = 0, hang = 0) {
  const g = G(p, x, y, z); g.scale.setScalar(s);
  BU(g, M.iron, 0, 0, 0, .2, .02, .2); BU(g, M.iron, 0, .34, 0, .2, .02, .2);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) BU(g, M.iron, a * .09, 0, b * .09, .014, .36, .014);
  const gl = BU(g, M.glow, 0, .03, 0, .15, .3, .15); gl.castShadow = false;
  mk(g, new THREE.ConeGeometry(.15, .1, 4), M.iron, 0, .41, 0).rotation.y = .78; mk(g, new THREE.TorusGeometry(.03, .005, 6, 12), M.iron, 0, .49, 0);
  if (hang) CY(g, M.iron, 0, .5, 0, .004, hang / s, 4);
  if (light) { const l = new THREE.PointLight(0xffb469, light, 9, 1.8); l.position.set(0, .2, 0); g.add(l); }
  return g;
}
function vase(p, mat, x, y, z, s = 1) { const g = lathe(p, mat, [[0, 0], [.09, 0], [.16, .12], [.17, .24], [.11, .4], [.06, .47], [.075, .52], [.06, .52], [.045, .47], [0, .47]], x, y, z); g.scale.setScalar(s); return g; }
function jar(p, mat, x, y, z, s = 1) { const g = lathe(p, mat, [[0, 0], [.14, 0], [.26, .2], [.3, .45], [.24, .7], [.14, .82], [.16, .88], [.13, .88], [.11, .8], [0, .8]], x, y, z); g.scale.setScalar(s); return g; }
function pot(p, M, x, y, z, s = 1, mat) { const g = lathe(p, mat || M.clay, [[0, 0], [.16, 0], [.24, .32], [.26, .34], [.22, .34], [.15, .03], [0, .03]], x, y, z); g.scale.setScalar(s); return g; }
export function shrub(p, mat, x, y, z, r = .4, n = 26, squash = 1) {
  if (mat.alphaTest && !mat.userData.frond && mat.map.image.width === 256 && mat.map.image.height === 256) n = Math.round(n * 2.2);
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, n), o = new THREE.Object3D(), small = n > 40 || mat.map.image.height === 256;
  for (let i = 0; i < n; i++) { const a = rnd() * 7, b = Math.acos(rr(-0.3, 1)), d = r * rr(.25, .8); o.position.set(x + Math.cos(a) * Math.sin(b) * d, y + Math.cos(b) * d * squash + r * .5, z + Math.sin(a) * Math.sin(b) * d); o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); o.scale.setScalar(mat.map.image.height === 256 ? Math.min(.42, r * rr(.55, .85)) * (r > 2 ? 3 : 1) : r * rr(.9, 1.5)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = im.receiveShadow = true; p.add(im); return im;
}
function plant(p, M, x, y, z, s = 1, mat) { pot(p, M, x, y, z, s, mat); shrub(p, M.leaf, x, y + .3 * s, z, .42 * s, 22); }
function books(p, M, x, y, z, n, alongX = true, lean = false) { let o = 0; for (let i = 0; i < n; i++) { const t = rr(.022, .05), h = rr(.19, .27), d = rr(.13, .17); const m = alongX ? BU(p, M.book[(rnd() * 7) | 0], x + o + t / 2, y, z, t, h, d) : BU(p, M.book[(rnd() * 7) | 0], x, y, z + o + t / 2, d, h, t); if (lean && i === n - 1) m.rotation[alongX ? 'z' : 'x'] = .25; o += t + .002; } }
function bookStack(p, M, x, y, z, n = 3) { for (let i = 0; i < n; i++) { const m = BU(p, M.book[(rnd() * 7) | 0], x, y + i * .034, z, .2, .032, .27); m.rotation.y = rr(-.3, .3); } }
function rug(p, mat, x, z, w, d, ry = 0, y = .006) { const m = mk(p, new THREE.BoxGeometry(w, .014, d), mat, x, y + .007, z); m.rotation.y = ry; m.castShadow = false;
  for (const e of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.07, d, 1, 1), FR); f.rotation.x = -Math.PI / 2; f.position.set(e * (w / 2 + .035), .001, 0); m.add(f); }
  return m; }
function curtain(p, mat, x, y, z, w, h, alongX, folds = 7) {
  const M_ = curtain.M; y = Math.min(y, .02); h = 3.25 - y;
  const g = new THREE.PlaneGeometry(w, h, folds * 8, 6), pos = g.attributes.position, ph = rnd() * 6;
  for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) / w, v = pos.getY(i) / h + .5; pos.setZ(i, (Math.sin(u * folds * 6.28 + ph) * .035 + Math.sin(u * folds * 2.7 * 6.28 + ph * 2) * .012) * (1.15 - .5 * v)); pos.setX(i, pos.getX(i) * (1 - .12 * v * Math.abs(Math.sin(ph)))); }
  g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 2, uv.getY(i) * h);
  const m = mk(p, g, M_.curtain, x, y + h / 2, z); if (!alongX) m.rotation.y = Math.PI / 2;
  const r = CY(p, M_.brass, 0, 0, 0, .012, w + .16, 8); r.position.set(x, y + h + .02, z); alongX ? r.rotation.z = Math.PI / 2 : r.rotation.x = Math.PI / 2; return m;
}
function lowTable(p, M, x, z, w, d, h = .3, top = M.wood) { B(p, top, x - w / 2, h - .045, z - d / 2, w, .045, d); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(p, M.wood, x + a * (w / 2 - .07) - .03, 0, z + b * (d / 2 - .07) - .03, .06, h - .045, .06); B(p, M.wood, x - w / 2 + .05, h - .1, z - d / 2 + .05, w - .1, .04, d - .1); }
// Najdi floor seating run against a wall. (x,z) = centre of the run, len along the wall, face = direction the seat faces
function floorSeat(p, M, x, z, len, face, seatMat, backMat) {
  const g = G(p, x, 0, z, { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 }[face]); // local: wall at -z, seat faces +z
  const n = Math.max(1, Math.round(len / 1.05)), w = len / n;
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + (i + .5) * w;
    S(g, seatMat, cx, 0.02, .38, w - .02, .2, .76, .05);
    const bk = S(g, backMat, cx, .22, .1, w - .04, .44, .17, .06); bk.rotation.x = -.14;
    if (i % 2 === 0 && n > 1) { const a = mk(g, softGeo(.2, .2, .48, .07), M.sadu2, cx - w / 2 + .02, .34, .42); a.rotation.z = .02; }
  }
  for (const s of [-1, 1]) mk(g, softGeo(.22, .22, .5, .08), M.sadu2, s * (len / 2 - .12), .34, .42);
  B(g, M.wood, -len / 2, 0, 0, len, .03, .78);
}
function chair(p, M, x, z, ry, cushion) {
  const g = G(p, x, 0, z, ry);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(g, M.wood, a * .2 - .02, 0, b * .2 - .02, .04, b < 0 ? .92 : .44, .04);
  B(g, M.wood, -.23, .42, -.23, .46, .035, .46); S(g, cushion, 0, .455, .01, .42, .05, .42, .02);
  B(g, M.wood, -.2, .86, -.22, .4, .07, .03); for (let i = 0; i < 4; i++) B(g, M.wood, -.15 + i * .1 - .012, .46, -.215, .024, .4, .02);
  return g;
}
function stool(p, M, x, z, h = .46) { CY(p, M.woodLight, x, h - .04, z, .17, .04, 20); for (let i = 0; i < 3; i++) { const a = i * 2.094, m = CY(p, M.wood, x + Math.cos(a) * .11, 0, z + Math.sin(a) * .11, .018, h - .04, 8); m.rotation.set(Math.sin(a) * .1, 0, -Math.cos(a) * .1); } }
function tableLamp(p, M, x, y, z, light = 0) { lathe(p, M.clayDark, [[0, 0], [.07, 0], [.09, .08], [.05, .2], [.02, .26], [0, .26]], x, y, z); CY(p, M.brass, x, y + .26, z, .006, .1, 6); const sh = mk(p, new THREE.CylinderGeometry(.1, .14, .17, 20, 1, true), M.glow, x, y + .4, z); sh.castShadow = false; if (light) { const l = new THREE.PointLight(0xffb878, light, 7, 1.8); l.position.set(x, y + .42, z); p.add(l); } }
function pendant(p, M, x, y, z, drop, r = .2, light = 0) { CY(p, M.iron, x, y - drop, z, .005, drop, 5); lathe(p, M.brass, [[.02, .16], [.06, .14], [r * .8, .04], [r, 0], [r * .98, 0], [r * .77, .035], [.05, .13], [.02, .15]], x, y - drop - .16, z); const b = mk(p, new THREE.SphereGeometry(.04, 10, 8), M.glow, x, y - drop - .11, z); b.castShadow = false; if (light) { const l = new THREE.PointLight(0xffb878, light, 9, 1.8); l.position.set(x, y - drop - .25, z); p.add(l); } }
function chest(p, M, x, z, ry = 0, w = 1.1) { const g = G(p, x, 0, z, ry); B(g, M.wood, -w / 2, .06, -.25, w, .46, .5); B(g, M.wood, -w / 2 - .01, .52, -.26, w + .02, .05, .52); for (const s of [-1, 1]) B(g, M.wood, s * (w / 2 - .06) - .04, 0, -.24, .08, .06, .48); B(g, M.brass, -w / 2, .3, .25, w, .03, .004); B(g, M.brass, -w / 2, .12, .25, w, .03, .004); const im = new THREE.InstancedMesh(new THREE.SphereGeometry(.012, 6, 5), M.brass, 54), o = new THREE.Object3D(); let k = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 18; i++) { o.position.set(-w / 2 + w * (i + .5) / 18, .19 + j * .11 + (j === 2 ? .04 : 0), .252); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); } g.add(im); B(g, M.brass, -.04, .4, .25, .08, .1, .012); }
function wallHanging(p, mat, x, y, z, w, h, alongX) { const m = mk(p, new THREE.PlaneGeometry(w, h), mat.clone(), x, y + h / 2, z); m.material.side = THREE.DoubleSide; if (mat.map.wrapS === THREE.RepeatWrapping) { m.material.map = mat.map.clone(); m.material.map.repeat.set(w / .9, h / .9); m.material.normalMap = null; } if (!alongX) m.rotation.y = Math.PI / 2; m.castShadow = false; const r = CY(p, M_w.wood, 0, 0, 0, .014, w + .12, 8); r.position.set(x, y + h + .01, z); alongX ? r.rotation.z = Math.PI / 2 : r.rotation.x = Math.PI / 2; }
let M_w;
function mirror(p, M, x, y, z, w, h, alongX, round = false) {
  if (round) { const m = mk(p, new THREE.CylinderGeometry(w / 2, w / 2, .012, 40), M.mirror, x, y, z); m.rotation[alongX ? 'x' : 'z'] = Math.PI / 2; const f = mk(p, new THREE.TorusGeometry(w / 2, .018, 8, 48), M.brass, x, y, z); if (!alongX) f.rotation.y = Math.PI / 2; return; }
  alongX ? (B(p, M.brass, x - w / 2 - .02, y - .02, z - .012, w + .04, h + .04, .024), B(p, M.mirror, x - w / 2, y, z - .014, w, h, .028)) : (B(p, M.brass, x - .012, y - .02, z - w / 2 - .02, .024, h + .04, w + .04), B(p, M.mirror, x - .014, y, z - w / 2, .028, h, w));
}
// shelf wall with pointed niches (Najdi "kamar" coffee wall)
function nicheWall(p, M, x, z, w, h, alongX, face, cols, rows, fill) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h); s.lineTo(0, h); s.closePath();
  const cw = w / cols, y0 = .75, rh = (h - y0 - .35) / rows, spots = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = i * cw + .09, b = (i + 1) * cw - .09, yb = y0 + j * rh + .06, yt = yb + rh - .16, q = new THREE.Path(); q.moveTo(a, yb); q.lineTo(b, yb); q.lineTo(b, yt - .12); q.lineTo((a + b) / 2, yt); q.lineTo(a, yt - .12); q.closePath(); s.holes.push(q); spots.push([(a + b) / 2, yb]); }
  const g = G(p, x, 0, z, alongX ? (face > 0 ? 0 : Math.PI) : (face > 0 ? Math.PI / 2 : -Math.PI / 2)); // local: panel in xy, front = +z
  const m = mk(g, new THREE.ExtrudeGeometry(s, { depth: .24, bevelEnabled: false }), M.gypsumIn, -w / 2, 0, .02);
  B(g, M.mudDark, -w / 2, 0, 0, w, h, .03); B(g, M.carve, -w / 2, h - .3, .262, w, .26, .012); B(g, M.gypsumIn, -w / 2 - .02, .68, .02, w + .04, .06, .3);
  spots.forEach(([sx, sy], i) => fill(g, sx - w / 2, sy, .15, i));
  return g;
}

// =====================================================================

// ================= modern pieces (Chedi interiors) =================
function pillow(g, mat, x, y, z, ry = 0, tilt = -.35, s = .46) { const m = mk(g, softGeo(s, s, .15, .065), mat, x, y + s / 2, z); m.rotation.set(tilt, ry, 0, 'YXZ'); return m; }
// sofa: origin at the centre of its back edge, facing +z (local)
function sofa(p, M, x, z, len, ry, pillows = [], fabric, y = 0) {
  const g = G(p, x, y, z, ry), n = Math.max(1, Math.round(len / 1.05)), w = (len - .44) / n; fabric = fabric || M.boucle;
  B(g, M.walnut, -len / 2 + .03, 0, .04, len - .06, .13, .9);
  for (let i = 0; i < n; i++) { const cx = -len / 2 + .22 + (i + .5) * w; S(g, fabric, cx, .13, .54, w - .015, .27, .84, .11); const b = S(g, fabric, cx, .42, .2, w - .03, .42, .22, .105); b.rotation.x = -.13; }
  for (const s of [-1, 1]) S(g, fabric, s * (len / 2 - .11), .13, .48, .22, .5, .96, .1);
  S(g, fabric, 0, .13, .08, len - .44, .62, .16, .06);
  for (const [f, k, r] of pillows) pillow(g, M.pillow[k], f * (len / 2 - .45), .42, .4, r || 0, -.32);
  return g;
}
function armchair(p, M, x, z, ry) { // timber frame, loose cushions
  const g = G(p, x, 0, z, ry);
  for (const s of [-1, 1]) { const f = B(g, M.walnut, s * .36 - .025, 0, .26, .05, .6, .05); f.rotation.x = .1; const b = B(g, M.walnut, s * .36 - .025, 0, -.36, .05, .82, .05); b.rotation.x = -.22; B(g, M.walnut, s * .36 - .03, .57, -.34, .06, .04, .7); B(g, M.walnut, s * .36 - .02, .22, -.3, .04, .05, .6); }
  B(g, M.walnut, -.36, .22, .27, .72, .05, .04); B(g, M.walnut, -.36, .22, -.32, .72, .05, .04);
  const sl = B(g, M.leather, -.33, .25, -.3, .66, .02, .6); S(g, M.boucle, 0, .27, 0, .64, .17, .62, .07);
  const bk = S(g, M.boucle, 0, .4, -.3, .64, .52, .17, .07); bk.rotation.x = -.24; const sb = B(g, M.leather, -.33, .36, -.42, .66, .5, .02); sb.rotation.x = -.24;
  return g;
}
function daybed(p, M, x, z, len, ry) {
  const g = G(p, x, 0, z, ry); B(g, M.walnut, -len / 2, 0, -.42, len, .16, .84); S(g, M.taupe, 0, .16, 0, len - .04, .2, .8, .07);
  const bo = mk(g, new THREE.CylinderGeometry(.11, .11, .74, 16), M.taupe, len / 2 - .2, .47, 0); bo.rotation.x = Math.PI / 2; pillow(g, M.pillow[1], -len / 2 + .35, .34, -.08, .3, -.5); pillow(g, M.pillow[2], -len / 2 + .7, .34, .05, -.2, -.5, .4); return g;
}
function coffeeCluster(p, M, x, z) {
  const g = G(p, x, 0, z, .04);
  B(g, M.walnut, -.75, .3, -.42, 1.3, .06, .8); for (const xx of [-.62, .3]) B(g, M.walnut, xx, 0, -.34, .12, .3, .64);
  B(g, M.oak, .1, .2, .1, 1.05, .05, .7); for (const xx of [.2, .95]) B(g, M.oak, xx, 0, .18, .1, .2, .54);
  B(g, M.stone, -.55, 0, .3, .5, .42, .5);
  bookStack(g, M, -.2, .36, -.05, 2); lathe(g, M.ceramic, [[0, 0], [.05, 0], [.09, .08], [.07, .16], [.03, .2], [.04, .23], [.025, .23], [.02, .2], [0, .2]], -.5, .36, -.15, 18);
  lathe(g, M.clay, [[0, 0], [.06, 0], [.1, .06], [.08, .12], [.05, .13], [0, .13]], .25, .36, -.2, 18); bowl(g, M.clayDark, .7, .25, .45, .15, .06);
  const bk = B(g, M.paper, -.48, .42, .42, .34, .012, .24); bk.rotation.y = .3; B(g, M.oak, .35, .25, .3, .3, .02, .2);
  block(x - .8, z - .45, x + 1.2, z + .85); return g;
}
function sideTable(p, M, x, z, h = .5, mat) { CY(p, mat || M.walnut, x, 0, z, .2, .03, 24); CY(p, mat || M.walnut, x, .03, z, .04, h - .06, 10); CY(p, mat || M.walnut, x, h - .03, z, .24, .03, 28); }
function floorLamp(p, M, x, z, light = 0) { CY(p, M.bronze, x, 0, z, .15, .02, 20); CY(p, M.bronze, x, .02, z, .012, 1.45, 8); const sh = mk(p, new THREE.CylinderGeometry(.17, .21, .3, 24, 1, true), M.glow, x, 1.6, z); sh.castShadow = false; if (light) { const l = new THREE.PointLight(0xffc48a, light, 8, 1.8); l.position.set(x, 1.55, z); p.add(l); } }
function consoleTable(p, M, x, z, len, ry, mat, h = .78, d = .42) { const g = G(p, x, 0, z, ry); mat = mat || M.oak; B(g, mat, -len / 2, h - .05, 0, len, .05, d); for (const s of [-1, 1]) B(g, mat, s * (len / 2 - .08) - .04, 0, .02, .08, h - .05, d - .04); B(g, mat, -len / 2 + .08, .2, .04, len - .16, .03, d - .08); return g; }
// fluted timber cladding; c = wall face coordinate, sign = which way the room is
function panel(p, M, alongX, c, sign, a, b, y0, y1, mat) { const t = .035, cc = sign > 0 ? c : c - t; mat = mat || M.flute; alongX ? B(p, mat, a, y0, cc, b - a, y1 - y0, t) : B(p, mat, cc, y0, a, t, y1 - y0, b - a); const e = .012; alongX ? B(p, M.walnut, a, y1, cc - e / 2, b - a, .03, t + e) : B(p, M.walnut, cc - e / 2, y1, a, t + e, .03, b - a); }
function framed(p, mat, M, alongX, c, sign, at, y, w, h) { const t = .04, cc = sign > 0 ? c : c - t; alongX ? (B(p, M.walnut, at - w / 2 - .03, y - .03, cc, w + .06, h + .06, t * .8), BU(p, [M.walnut, M.walnut, M.walnut, M.walnut, mat, mat], at, y, cc + t / 2 + sign * .012, w, h, t)) : (B(p, M.walnut, cc, y - .03, at - w / 2 - .03, t * .8, h + .06, w + .06), BU(p, [mat, mat, M.walnut, M.walnut, M.walnut, M.walnut], cc + t / 2 + sign * .012, y, at, t, h, w)); }
function drape(p, M, x, z, w, alongX, sheer = false, top = 3.25) {
  const folds = Math.max(2, Math.round(w / .16)), h = top - .015, g = new THREE.PlaneGeometry(w, h, folds * 8, 5), pos = g.attributes.position, ph = rnd() * 6, amp = sheer ? .03 : .065;
  for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) / w, v = pos.getY(i) / h + .5; pos.setZ(i, (Math.sin(u * folds * 6.28 + ph) * amp + Math.sin(u * folds * 2.3 * 6.28 + ph * 2) * amp * .3) * (1.1 - .3 * v)); }
  g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 2, uv.getY(i) * h);
  const m = mk(p, g, sheer ? M.sheer : M.curtain, x, .015 + h / 2, z); if (!alongX) m.rotation.y = Math.PI / 2; if (sheer) m.castShadow = false; return m;
}
function track(p, M, alongX, c, a, b, y = 3.24) { alongX ? B(p, M.ceilTop, a, y, c - .07, b - a, .12, .14) : B(p, M.ceilTop, c - .07, y, a, .14, .12, b - a); }
function planter(p, M, x, z, r = .32, h = .6, kind = 'grass', y = 0) {
  lathe(p, M.stone, [[0, 0], [r * .8, 0], [r, h * .5], [r * .95, h], [r * .85, h], [r * .85, h - .06], [0, h - .06]], x, y, z, 28);
  if (kind === 'grass') { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, .5, 0); const im = new THREE.InstancedMesh(g, M.grass, 5), o = new THREE.Object3D(); for (let i = 0; i < 5; i++) { o.position.set(x + rr(-.08, .08), y + h - .08, z + rr(-.08, .08)); o.rotation.y = i * 1.25; o.scale.set(r * 3.6, r * 3.2, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.castShadow = true; p.add(im); }
  else if (kind === 'olive') tree(p, M, 'olive', x, y + h - .1, z, r * 1.25, false);
  else shrub(p, M.leaf, x, y + h - .1, z, r * 1.2, 24);
  block(x - r, z - r, x + r, z + r, y > 2 ? 'roof' : 'ground');
}
function dchair(p, M, x, z, ry) { // upholstered dining chair on oak legs
  const g = G(p, x, 0, z, ry); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = CY(g, M.oak, a * .19, 0, b * .19, .018, .44, 8); l.rotation.set(-b * .06, 0, a * .06); }
  S(g, M.boucle, 0, .43, .01, .48, .09, .48, .04); const bk = S(g, M.boucle, 0, .5, -.21, .46, .38, .08, .04); bk.rotation.x = -.14; return g;
}

// =====================================================================
export function furnish(scene, M) {
  const p = new THREE.Group(); scene.add(p); curtain.M = M; M_w = M;

  // ---------------- LIVING ROOM (x .5..12.4, z .5..5.1, 5.2 m high) ----------------
  panel(p, M, false, 12.4, -1, .5, 5.1, 0, 4.94); panel(p, M, false, .5, 1, .5, 5.1, 0, 4.94);
  // zone A: facing the glazed wall to the court
  rug(p, M.jute, 9.0, 2.85, 5.0, 3.5);
  sofa(p, M, 9.0, .74, 3.1, 0, [[-1, 0, .2], [-.55, 1, -.1], [.6, 3, .15], [1, 0, -.25]]); block(7.4, .5, 10.6, 1.6);
  for (const x of [7.05, 10.95]) { sideTable(p, M, x, .95, .52); tableLamp(p, M, x, .52, .95, x < 9 ? 5 : 0); block(x - .25, .7, x + .25, 1.2); }
  coffeeCluster(p, M, 8.85, 2.6);
  armchair(p, M, 7.25, 4.1, Math.PI + .25); armchair(p, M, 10.75, 4.1, Math.PI - .25); block(6.9, 3.75, 7.6, 4.45); block(10.4, 3.75, 11.1, 4.45);
  // tv wall with a low console
  framed(p, M.tv, M, false, 12.365, -1, 2.8, 1.35, 1.7, .96);
  consoleTable(p, M, 12.36, 2.8, 2.6, -Math.PI / 2, M.walnut, .46, .44); block(11.9, 1.5, 12.4, 4.1);
  vase(p, M.ceramic, 12.12, .46, 1.9, .5); bookStack(p, M, 12.12, .46, 3.6, 3); bowl(p, M.clayDark, 12.12, .46, 3.1, .12, .05);
  // drapes and sheers at the glazing
  track(p, M, true, 5.0, 6.2, 11.8); drape(p, M, 6.42, 5.0, .5, true); drape(p, M, 11.58, 5.0, .5, true); drape(p, M, 7.15, 4.94, .8, true, true); drape(p, M, 10.85, 4.94, .8, true, true);
  for (const x of [3, 6.3, 9.6]) { track(p, M, true, .62, x - .75, x + .75, 3.5); drape(p, M, x - .6, .64, .45, true, false, 3.5); drape(p, M, x + .6, .64, .45, true, false, 3.5); }
  // daybed between the two zones
  daybed(p, M, 6.0, 2.6, 2.1, Math.PI / 2); block(5.58, 1.55, 6.42, 3.65);
  // zone B: a modern majlis, low and deep, round the west end
  rug(p, M.jute, 2.9, 2.75, 3.9, 3.0);
  sofa(p, M, 2.75, .74, 3.5, 0, [[-1, 1, .2], [-.4, 0, 0], [.3, 2, .1], [1, 3, -.2]], M.taupe); sofa(p, M, .62, 3.25, 2.6, Math.PI / 2, [[-.9, 0, .1], [.9, 1, -.1]], M.taupe); block(.5, .5, 4.5, 1.6); block(.5, 1.6, 1.6, 4.55);
  { const g = G(p, 2.9, 0, 2.9); CY(g, M.stone, 0, 0, 0, .34, .26, 32); CY(g, M.stone, 0, .26, 0, .55, .06, 40); tray(g, M, .1, .32, .05, .2); dallah(g, M, .1, .33, .05, .9, .7); cups(g, M, .2, .33, .16, 3); bowl(g, M.clay, -.25, .32, -.12, .12, .05); block(2.35, 2.35, 3.45, 3.45); }
  framed(p, M.art, M, false, .535, 1, 3.25, 1.5, 1.3, 1.85);
  consoleTable(p, M, 5.0, 5.08, 2.0, Math.PI, M.oak, .8, .4); block(4.0, 4.65, 6.0, 5.1); tableLamp(p, M, 5.6, .8, 4.87, 4); vase(p, M.clayDark, 4.4, .8, 4.87, .6); shrub(p, M.oliveLeaf, 4.4, 1.15, 4.87, .3, 14, 1.2); books(p, M, 4.75, .8, 4.87, 6, true, true); bowl(p, M.ceramic, 5.2, .8, 4.87, .1, .05);
  floorLamp(p, M, 4.75, .95, 4); planter(p, M, 11.8, .95, .3, .55, 'olive');
  lantern(p, M, 1.0, 0, 4.72, .9, 0);
  { const l = new THREE.PointLight(0xfff1de, 2.2, 12, 1.6); l.position.set(9, 2.6, 2.8); p.add(l); const l2 = new THREE.PointLight(0xfff1de, 1.8, 10, 1.6); l2.position.set(3, 2.6, 2.8); p.add(l2); }

  // ---------------- ENTRY HALL (x .5..5.1, z 5.5..12.5) ----------------
  panel(p, M, true, 12.5, -1, .5, 5.1, 0, 3.4);
  { const m = rug(p, M.jute, 2.9, 9.0, 4.4, 2.1, Math.PI / 2); }
  B(p, M.stone, 1.7, 0, 12.0, 2.2, .82, .44); B(p, M.walnut, 1.72, .3, 11.985, 2.16, .02, .02); block(1.65, 11.95, 3.95, 12.5);
  framed(p, M.mirror, M, true, 12.465, -1, 2.8, 1.15, 1.1, 1.6);
  vase(p, M.clayDark, 2.1, .82, 12.22, .85); shrub(p, M.oliveLeaf, 2.1, 1.2, 12.22, .28, 14, 1.3); tableLamp(p, M, 3.5, .82, 12.22, 4); bowl(p, M.ceramic, 2.85, .82, 12.2, .15, .05); bookStack(p, M, 3.1, .82, 12.25, 2);
  { const g = G(p, 5.08, 0, 9.2, -Math.PI / 2); B(g, M.walnut, -1.0, 0, 0, 2.0, .2, .5); S(g, M.boucle, 0, .2, .26, 1.96, .22, .48, .07); pillow(g, M.pillow[0], -.6, .4, .12, .15, -.45); pillow(g, M.pillow[1], .55, .4, .12, -.1, -.45); block(4.55, 8.15, 5.1, 10.25); }
  framed(p, M.art, M, false, 5.1, -1, 9.2, 1.45, 1.0, 1.4);
  planter(p, M, 1.05, 6.3, .34, .6, 'olive'); planter(p, M, 4.6, 11.6, .28, .7, 'grass');
  lantern(p, M, .95, 0, 9.0, .9, 0); lantern(p, M, .95, 0, 11.95, .7, 0);
  { const sh = mk(p, new THREE.SphereGeometry(.3, 24, 16), M.glow, 2.8, 2.95, 9.0); sh.scale.y = .75; sh.castShadow = false; CY(p, M.bronze, 2.8, 3.15, 9.0, .004, .6, 4); const l = new THREE.PointLight(0xffe2bd, 2.2, 9, 1.8); l.position.set(2.8, 2.5, 9.0); p.add(l); }
  B(p, M.taupe, .8, .002, 10.0, .7, .015, 1.1);

  // ---------------- COURT (x 5.5..12.5, z 5.5..12.5) ----------------
  { // still reflecting pool with a low travertine rim
    const x = 10.4, z = 9.3, w = 2.4, r = .26;
    for (const [a, b, c, d] of [[x - w / 2, z - w / 2, w, r], [x - w / 2, z + w / 2 - r, w, r], [x - w / 2, z - w / 2 + r, r, w - 2 * r], [x + w / 2 - r, z - w / 2 + r, r, w - 2 * r]]) B(p, M.stone, a, 0, b, c, .3, d);
    B(p, M.stoneDark, x - w / 2 + r, .01, z - w / 2 + r, w - 2 * r, .02, w - 2 * r);
    const wt = mk(p, new THREE.PlaneGeometry(w - 2 * r, w - 2 * r), M.pond, x, .25, z); wt.rotation.x = -Math.PI / 2; wt.castShadow = false; block(x - w / 2, z - w / 2, x + w / 2, z + w / 2);
  }
  { // olive in a gravel bed beside the stair, with grasses and two stones
    const x1 = 6.95, x2 = 8.5, z1 = 7.3, z2 = 10.4, c = .16;
    for (const [a, b, w, d] of [[x1, z1, x2 - x1, c], [x1, z2 - c, x2 - x1, c], [x1, z1 + c, c, z2 - z1 - 2 * c], [x2 - c, z1 + c, c, z2 - z1 - 2 * c]]) B(p, M.stone, a, 0, b, w, .2, d);
    B(p, M.gravel, x1 + c, 0, z1 + c, x2 - x1 - 2 * c, .14, z2 - z1 - 2 * c); tree(p, M, 'olive', 7.75, .12, 8.75, 1.3, false);
    for (const [a, b, r] of [[7.5, 9.85, .3], [8.05, 7.75, .22]]) { const m = mk(p, new THREE.SphereGeometry(r, 14, 10), M.rock, a, .2, b); m.scale.set(1.2, .6, 1); m.rotation.y = rnd() * 3; }
    grasses(p, M, [[7.3, .14, 7.7, .7], [8.1, .14, 9.6, .8], [7.35, .14, 9.3, .6], [8.15, .14, 8.3, .55], [7.6, .14, 10.05, .7], [7.9, .14, 7.6, .5]]);
    const up = BU(p, M.glow, 7.3, .14, 8.4, .08, .04, .08); up.castShadow = false; block(x1, z1, x2, z2);
  }
  B(p, M.mud, 11.85, 0, 10.75, .62, .38, 1.6); S(p, M.taupe, 12.16, .38, 11.55, .58, .12, 1.56, .05); pillow(p, M.pillow[0], 12.3, .5, 11.15, Math.PI / 2, .35); pillow(p, M.pillow[2], 12.3, .5, 11.9, Math.PI / 2, .35); block(11.85, 10.75, 12.5, 12.35);
  sideTable(p, M, 11.45, 11.6, .4, M.stone); lathe(p, M.ceramic, [[0, 0], [.04, 0], [.06, .08], [.03, .14], [0, .14]], 11.45, .4, 11.6, 14);
  planter(p, M, 12.05, 6.05, .34, .7, 'grass'); planter(p, M, 9.9, 12.1, .3, .6, 'grass');
  lantern(p, M, 7.3, 0, 12.15, 1.0, 0); lantern(p, M, 7.7, 0, 12.2, .7, 0); lantern(p, M, 12.15, 0, 7.0, .8, 0);
  { const l = new THREE.PointLight(0xffc890, 2, 8, 1.8); l.position.set(9.4, 2.6, 9.3); p.add(l); }

  // ---------------- DINING (x 12.9..17.5, z 5.5..12.5) ----------------
  {
    const x = 15.2, z = 9.0; rug(p, M.jute, x, z, 5.0, 3.3, Math.PI / 2);
    B(p, M.oak, x - .56, .7, z - 1.65, 1.12, .07, 3.3); for (const zz of [-1.05, 1.05]) B(p, M.stone, x - .32, 0, z + zz - .16, .64, .7, .32);
    for (let i = 0; i < 4; i++) { dchair(p, M, x - .9, z - 1.2 + i * .8, Math.PI / 2); dchair(p, M, x + .9, z - 1.2 + i * .8, -Math.PI / 2); }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const px = x + s * .36, pz = z - 1.2 + i * .8; lathe(p, M.ceramic, [[0, 0], [.07, 0], [.125, .016], [.12, .02], [.065, .008], [0, .008]], px, .77, pz); lathe(p, M.glass, [[0, 0], [.03, 0], [.035, .1], [.033, .1], [.028, .005], [0, .005]], px - s * .02, .77, pz + .2, 12); B(p, M.taupe, px - .05, .786, pz - .1, .1, .008, .2); }
    lathe(p, M.clay, [[0, 0], [.1, 0], [.2, .1], [.16, .2], [.1, .24], [.12, .27], [.09, .27], [.08, .24], [0, .24]], x, .77, z - .5, 20); shrub(p, M.oliveLeaf, x, 1.15, z - .5, .34, 14, 1.3); bowl(p, M.clayDark, x, .77, z + .5, .2, .07);
    // linear pendant
    B(p, M.bronze, x - .035, 2.25, z - 1.3, .07, .05, 2.6); const gl = B(p, M.glow, x - .025, 2.238, z - 1.28, .05, .012, 2.56); gl.castShadow = false; for (const zz of [-1.1, 1.1]) CY(p, M.bronze, x, 2.3, z + zz, .004, H - 2.5, 4); { const l = new THREE.PointLight(0xffe2bd, 3.5, 9, 1.8); l.position.set(x, 1.9, z); p.add(l); }
    block(x - .6, z - 1.7, x + .6, z + 1.7);
    B(p, M.walnut, 13.6, .14, 12.0, 2.6, .66, .48); B(p, M.fluteDark, 13.62, .16, 11.97, 2.56, .62, .03); B(p, M.stone, 13.57, .8, 11.96, 2.66, .04, .54); for (const xx of [13.65, 16.1]) B(p, M.bronze, xx, 0, 12.05, .05, .14, .38);
    vase(p, M.ceramic, 14.0, .84, 12.24, .7); tableLamp(p, M, 15.9, .84, 12.22, 3); bowl(p, M.clay, 15.2, .84, 12.22, .2, .07); bookStack(p, M, 14.6, .84, 12.2, 2);
    framed(p, M.art, M, true, 12.5, -1, 14.9, 1.4, 1.2, 1.6); block(13.55, 11.95, 16.25, 12.5);
    planter(p, M, 13.35, 6.0, .32, .6, 'olive');
    track(p, M, false, 17.4, 5.6, 12.4); drape(p, M, 17.4, 7.05, .55, false); drape(p, M, 17.4, 10.95, .55, false); drape(p, M, 17.36, 7.85, .8, false, true); drape(p, M, 17.36, 10.15, .8, false, true);
  }

  // ---------------- KITCHEN (x 12.8..17.5, z .5..5.1) ----------------
  {
    const front = (x, z, w, d, alongX, n) => { for (let i = 0; i < n; i++) { const a = (alongX ? w : d) / n; alongX ? (B(p, M.woodLight, x + i * a + .01, .12, z, a - .02, .74, .02), CY(p, M.brass, x + i * a + a / 2, .74, z - .012 + (d > 0 ? .03 : 0), .01, .02, 6).rotation.x = Math.PI / 2) : (B(p, M.woodLight, x, .12, z + i * a + .01, .02, .74, a - .02), CY(p, M.brass, x - .01, .74, z + i * a + a / 2, .01, .02, 6).rotation.z = Math.PI / 2); } };
    // north run and east run
    B(p, M.wood, 12.82, .1, .5, 4.68, .78, .62); B(p, M.stoneDark, 12.8, .88, .5, 4.7, .05, .66); front(12.82, 1.12, 4.0, 0, true, 7); B(p, M.black, 12.82, 0, .56, 4.68, .1, .52);
    B(p, M.wood, 16.88, .1, 1.12, .62, .78, 3.2); B(p, M.stoneDark, 16.84, .88, 1.12, .66, .05, 3.24); front(16.86, 1.14, 0, 3.16, false, 5); B(p, M.black, 16.94, 0, 1.12, .56, .1, 3.2);
    block(12.8, .5, 17.5, 1.18); block(16.84, 1.1, 17.5, 4.4);
    // tiled splashback
    B(p, M.trav, 12.8, .93, .5, 4.7, .62, .015); B(p, M.trav, 17.485, .93, .5, .015, .62, 3.9);
    // sink under the window with brass tap
    B(p, M.ceramic, 14.85, .86, .62, .7, .08, .42); B(p, M.black, 14.9, .935, .66, .6, .002, .34); CY(p, M.brass, 15.2, .93, .58, .012, .28, 8); const tp = CY(p, M.brass, 15.2, 1.2, .66, .01, .18, 8); tp.rotation.x = Math.PI / 2; tp.position.set(15.2, 1.2, .66);
    // range + copper hood
    B(p, M.black, 13.3, .1, .52, .9, .84, .62); B(p, M.black, 13.3, .94, .52, .9, .012, .62); for (let i = 0; i < 4; i++) { mk(p, new THREE.TorusGeometry(.085, .01, 6, 18), M.iron, 13.53 + (i % 2) * .44, .96, .7 + (i >> 1) * .28).rotation.x = Math.PI / 2; CY(p, M.brass, 13.42 + i * .22, .78, 1.14, .02, .03, 10).rotation.x = Math.PI / 2; }
    B(p, M.mudIn, 13.25, 1.95, .5, 1.0, 2.05, .62); B(p, M.bronze, 13.25, 1.93, .5, 1.0, .02, .62);
    lathe(p, M.copper, [[0, 0], [.13, 0], [.15, .13], [.14, .13], [.12, .01], [0, .01]], 13.53, .97, .7); lathe(p, M.steel, [[0, 0], [.1, 0], [.11, .2], [.1, .2], [.09, .01], [0, .01]], 13.97, .97, .98);
    // open shelves with jars, hanging copper pans
    for (const y of [1.75, 2.2]) { B(p, M.woodLight, 15.9, y, .52, 1.5, .04, .28); for (let i = 0; i < 6; i++) { const r = rr(.045, .07), hh = rr(.12, .22); CY(p, i % 3 ? M.ceramic : M.clay, 16.02 + i * .25, y + .04, .66, r, hh, 14); CY(p, M.woodLight, 16.02 + i * .25, y + .04 + hh, .66, r * .8, .02, 10); } }
    B(p, M.wood, 14.42, .93, .62, .1, .22, .16).rotation.x = -.25; for (let i = 0; i < 4; i++) B(p, M.black, 14.435 + (i % 2) * .04, 1.13, .6 + (i >> 1) * .05, .02, .09, .02);
    B(p, M.taupe, 15.6, .5, 1.145, .3, .42, .012); lathe(p, M.clayDark, [[0, 0], [.03, 0], [.03, .13], [.012, .16], [.012, .19], [0, .19]], 14.72, .935, .6, 12); lathe(p, M.steel, [[0, 0], [.08, 0], [.09, .1], [.05, .16], [.02, .17], [0, .17]], 16.75, .935, .8, 18); for (let i = 0; i < 4; i++) bowl(p, [M.clay, M.ceramicBlue, M.ceramic, M.clayDark][i], 15.75 + i * .16, .935, .75 + (i % 2) * .12, .06, .035);
    // utensil crock, boards, bottles, bread
    CY(p, M.clay, 16.4, .93, .75, .07, .16, 14); for (let i = 0; i < 5; i++) { const u = CY(p, M.woodLight, 16.4 + rr(-.03, .03), 1.02, .75 + rr(-.03, .03), .008, .26, 6); u.rotation.set(rr(-.2, .2), 0, rr(-.2, .2)); }
    B(p, M.woodLight, 13.0, .93, .62, .02, .36, .28).rotation.x = -.15; for (let i = 0; i < 4; i++) { CY(p, i % 2 ? M.glass : M.clayDark, 17.2, .93, 1.4 + i * .13, .032, .24, 10); }
    fruit(p, M, 17.15, .93, 2.3, .14, [0xe0a52a, 0xd9761c, 0x7a9a2a]); dallah(p, M, 17.15, .93, 3.0, 1.2, 3); cups(p, M, 17.1, .93, 3.3); B(p, M.woodLight, 17.0, .93, 3.6, .3, .025, .44); for (let i = 0; i < 2; i++) { const br = mk(p, new THREE.SphereGeometry(.11, 14, 8), new THREE.MeshStandardMaterial({ color: 0xc89858, roughness: .9 }), 17.15, .975, 3.72 + i * .2); br.scale.set(1, .35, 1); }
    // island with stools
    B(p, M.wood, 14.1, .1, 2.6, 1.9, .8, .85); B(p, M.stone, 14.02, .9, 2.52, 2.06, .06, 1.01); for (let i = 0; i < 3; i++) stool(p, M, 14.45 + i * .6, 3.85, .62);
    bowl(p, M.ceramicBlue, 14.5, .96, 3.0, .2, .09); for (let i = 0; i < 7; i++) mk(p, new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xa12c22 : 0xd9761c, roughness: .5 }), 14.5 + Math.cos(i) * .09, 1.03 + (i > 4 ? .05 : 0), 3.0 + Math.sin(i) * .09);
    B(p, M.woodLight, 15.3, .96, 2.8, .5, .03, .34); mk(p, new THREE.SphereGeometry(.07, 10, 8), M.green, 15.4, 1.03, 2.95).scale.set(1.6, .8, 1); B(p, M.steel, 15.55, .992, 2.85, .02, .004, .22); pot(p, M, 15.75, .96, 3.25, .45); shrub(p, M.leaf, 15.75, 1.08, 3.25, .2, 14);
    block(14.0, 2.5, 16.1, 3.55);
    pendant(p, M, 14.55, H - .25, 3.02, 1.3, .16, 6); pendant(p, M, 15.55, H - .25, 3.02, 1.3, .16, 0);
    // tall larder
    B(p, M.wood, 12.82, 0, 3.7, .6, 2.6, 1.35); for (let i = 0; i < 2; i++) { B(p, M.flute, 13.42, .1, 3.74 + i * .66, .03, 2.42, .62); CY(p, M.brass, 13.45, 1.2, 4.3 + i * .12, .01, .2, 6); } block(12.8, 3.7, 13.45, 5.1);
    for (let i = 0; i < 3; i++) { vase(p, [M.clay, M.ceramic, M.clayDark][i], 13.05, 2.6, 3.95 + i * .42, .5); }
  }


  // ---------------- BEDROOM (x .5..10.05, z 12.9..17.5) ----------------
  {
    const x = 4.6, z = 16.3;
    panel(p, M, true, 17.5, -1, 3.12, 6.08, 0, 3.4);
    B(p, M.walnut, x - 1.12, 0, z - 1.15, 2.24, .22, 2.32); S(p, M.boucle, x, .22, z - .03, 2.0, .26, 2.1, .08);
    S(p, M.taupe, x, .3, z + 1.08, 2.5, 1.0, .14, .06);
    S(p, M.boucle, x, .44, z - .42, 2.12, .12, 1.45, .06); S(p, M.taupe, x, .52, z + .22, 2.14, .08, .34, .04); S(p, M.taupe, x, .54, z - .95, 2.16, .04, .5, .02);
    for (const s of [-1, 1]) { const a = S(p, M.boucle, x + s * .5, .52, z + .8, .8, .2, .5, .09); a.rotation.x = -.5; const b = S(p, M.taupe, x + s * .5, .52, z + .55, .68, .18, .42, .08); b.rotation.x = -.6; }
    pillow(p, M.pillow[0], x - .25, .52, z + .36, .1, -.55, .42); pillow(p, M.pillow[1], x + .22, .52, z + .34, -.12, -.55, .42);
    block(x - 1.2, z - 1.2, x + 1.2, 17.5);
    for (const s of [-1, 1]) { const bx = x + s * 1.72; B(p, M.oak, bx - .28, 0, z + .62, .56, .5, .46); B(p, M.walnut, bx - .29, .22, z + .61, .58, .02, .02); tableLamp(p, M, bx + s * .06, .5, z + .9, s > 0 ? 5 : 3); if (s > 0) bookStack(p, M, bx - .1, .5, z + .78, 2); else lathe(p, M.glass, [[0, 0], [.03, 0], [.035, .1], [.033, .1], [.028, .005], [0, .005]], bx + .1, .5, z + .72, 12); block(bx - .3, z + .55, bx + .3, 17.5); }
    rug(p, M.jute, x, z - .8, 4.6, 3.1);
    B(p, M.walnut, x - .8, 0, z - 1.86, 1.6, .2, .44); S(p, M.boucle, x, .2, z - 1.64, 1.56, .2, .42, .06); block(x - .8, z - 1.86, x + .8, z - 1.42);
    for (const [za, zb] of [[12.92, 14.95], [16.25, 17.5]]) { B(p, M.walnut, 9.44, 0, za, .61, 2.8, zb - za); B(p, M.flute, 9.41, .06, za + .02, .03, 2.7, zb - za - .04); block(9.4, za, 10.05, zb); }
    consoleTable(p, M, 5.3, 12.93, 2.2, 0, M.oak, .78, .42); block(4.2, 12.9, 6.4, 13.4); framed(p, M.art, M, true, 12.9, 1, 5.3, 1.25, 1.0, 1.4); vase(p, M.ceramic, 4.6, .78, 13.14, .6); tableLamp(p, M, 6.05, .78, 13.14, 0); bookStack(p, M, 5.3, .78, 13.14, 3);
    armchair(p, M, 1.5, 13.9, .9); sideTable(p, M, 2.3, 13.5, .48); bookStack(p, M, 2.3, .48, 13.5, 2); floorLamp(p, M, .95, 13.3, 4); block(1.1, 13.5, 1.9, 14.3);
    { const g = G(p, .9, 0, 16.9, 1.0); B(g, M.oak, -.34, .06, -.02, .68, 1.8, .04); B(g, M.mirror, -.3, .1, .02, .6, 1.72, .006); g.rotation.x = -.07; }
    planter(p, M, 8.9, 17.0, .3, .6, 'olive');
    track(p, M, true, 17.38, .6, 9.4); for (const xx of [2.6]) for (const s of [-1, 1]) drape(p, M, xx + s * .68, 17.38, .4, true); drape(p, M, 7.3, 17.38, .45, true); drape(p, M, 2.6, 17.42, .9, true, true); drape(p, M, 6.6, 17.42, .9, true, true);
    track(p, M, false, .62, 14.2, 16.0); drape(p, M, .62, 14.45, .4, false); drape(p, M, .62, 15.75, .4, false); drape(p, M, .58, 15.1, .9, false, true);
    for (const s of [0, 1]) { const m = S(p, M.taupe, 6.05 + s * .13, 0, 15.6, .1, .04, .26, .02); m.rotation.y = .15; }
    { const l = new THREE.PointLight(0xfff1de, 1.8, 9, 1.7); l.position.set(4.6, 2.5, 14.8); p.add(l); }
  }

  // ---------------- BATH (x 10.35..17.5, z 12.9..17.5) ----------------
  {
    // tub under the high south window
    const tub = lathe(p, M.ceramic, [[0, .06], [.3, .06], [.42, .12], [.5, .58], [.47, .58], [.39, .15], [.28, .1], [0, .1]], 14.0, 0, 16.5, 40); tub.scale.set(1.9, 1, 1); CY(p, M.stone, 14.0, 0, 16.5, .3, .07, 24).scale.set(1.9, 1, 1);
    const w = mk(p, new THREE.CircleGeometry(.44, 32), M.bathWater, 14.0, .5, 16.5); w.rotation.x = -Math.PI / 2; w.scale.set(1.9, 1, 1); w.castShadow = false;
    CY(p, M.brass, 15.1, 0, 16.5, .02, .95, 8); const sp = CY(p, M.brass, 0, 0, 0, .015, .3, 8); sp.rotation.z = Math.PI / 2; sp.position.set(14.96, .93, 16.5); block(13.0, 15.95, 15.2, 17.05);
    stool(p, M, 12.75, 16.6, .44); B(p, M.linen, 12.62, .44, 16.5, .26, .07, .2); B(p, M.woodLight, 13.55, .6, 16.42, .9, .025, .16); mk(p, new THREE.CylinderGeometry(.035, .035, .08, 12), M.ceramic, 13.8, .665, 16.5); mk(p, new THREE.SphereGeometry(.012, 6, 5), M.glow, 13.8, .715, 16.5);
    B(p, M.taupe, 13.2, .002, 15.2, 1.6, .02, .6);
    // vanity on the north wall: stone slab, two basins, round mirrors
    B(p, M.wood, 11.0, .3, 12.92, 2.8, .45, .55); B(p, M.stone, 10.95, .75, 12.9, 2.9, .08, .6); block(10.95, 12.9, 13.9, 13.5);
    for (const x of [11.7, 13.1]) { bowl(p, M.ceramic, x, .83, 13.2, .22, .12); CY(p, M.brass, x, .83, 12.98, .012, .26, 8); const t = CY(p, M.brass, 0, 0, 0, .01, .14, 8); t.rotation.x = Math.PI / 2; t.position.set(x, 1.08, 13.05); mirror(p, M, x, 1.75, 12.915, .78, .78, true, true); }
    for (let i = 0; i < 3; i++) { const t = CY(p, M.linen, 0, 0, 0, .07, .4, 14); t.rotation.z = Math.PI / 2; t.position.set(11.4 + i * .16 - (i == 2 ? .24 : 0), .4 + (i == 2 ? .13 : 0) + .02, 13.2); }
    vase(p, M.clayDark, 12.4, .83, 13.1, .45); shrub(p, M.leaf, 12.4, 1.0, 13.1, .2, 12); lathe(p, M.glass, [[0, 0], [.03, 0], [.03, .12], [.012, .15], [.012, .18], [0, .18]], 13.55, .83, 13.1, 12); lathe(p, M.clay, [[0, 0], [.035, 0], [.035, .1], [0, .1]], 13.7, .83, 13.25, 12);
    pendant(p, M, 12.4, H - .25, 13.25, 1.3, .14, 5);
    // walk-in shower in the east end: tiled walls, glass screen
    B(p, M.trav, 16.0, 0, 12.9, 1.5, H, .02); B(p, M.trav, 17.48, 0, 12.9, .02, H, 1.6); B(p, M.stoneDark, 16.0, 0, 12.9, 1.5, .03, 2.2);
    const gl = B(p, M.glass, 15.98, .03, 12.9, .015, 2.3, 1.5); gl.castShadow = false; B(p, M.brass, 15.97, 2.33, 12.9, .03, .02, 1.5);
    CY(p, M.brass, 16.75, 1.0, 12.95, .012, 1.35, 8); const arm = CY(p, M.brass, 0, 0, 0, .012, .4, 8); arm.rotation.x = Math.PI / 2; arm.position.set(16.75, 2.35, 13.15); CY(p, M.brass, 16.75, 2.3, 13.35, .11, .02, 20);
    B(p, M.gypsumIn, 17.2, 1.0, 14.0, .28, .04, .5); for (let i = 0; i < 3; i++) CY(p, i % 2 ? M.clay : M.ceramic, 17.33, 1.04, 14.1 + i * .14, .03, .15, 10); block(15.95, 12.9, 16.02, 14.4);
    // towel ladder, plant, lantern
    for (const s of [0, .5]) { const l = CY(p, M.woodLight, 10.6, 0, 16.6 + s, .02, 1.9, 8); l.rotation.z = -.12; l.position.x = 10.55; } for (let i = 0; i < 4; i++) { const r = CY(p, M.woodLight, 0, 0, 0, .014, .5, 6); r.rotation.x = Math.PI / 2; r.position.set(10.48 + i * .045, .4 + i * .42, 16.85); }
    B(p, M.taupe, 10.56, .75, 16.65, .04, .9, .4); B(p, M.boucle, 10.52, 1.2, 16.65, .04, .8, .4);
    planter(p, M, 16.2, 17.0, .3, .55, 'grass'); lantern(p, M, 15.6, 0, 17.1, 1.0, 2);
    B(p, M.trav, 10.36, 0, 12.905, 5.6, 1.2, .012); B(p, M.trav, 10.36, 0, 17.49, 7.1, 1.2, .012); B(p, M.trav, 10.352, 0, 12.9, .012, 1.2, 2.2); B(p, M.trav, 10.352, 0, 16.15, .012, 1.2, 1.35); B(p, M.trav, 17.488, 0, 14.5, .012, 1.2, 3.0);
    for (const [x, z, w, d] of [[10.36, 12.917, 5.6, .03], [10.36, 17.46, 7.1, .03], [17.458, 14.5, .03, 3.0]]) B(p, M.stone, x, 1.2, z, w, .05, d);
    // wc behind a low wall, towel rail, bottles, drain
    B(p, M.gypsumIn, 16.3, 0, 15.25, 1.2, 1.3, .12); B(p, M.stone, 16.28, 1.3, 15.23, 1.24, .04, .16); { const g = G(p, 17.1, 0, 16.0, -Math.PI / 2); const b = lathe(g, M.ceramic, [[0, 0], [.14, 0], [.2, .3], [.21, .4], [.17, .4], [.12, .1], [0, .1]], 0, 0, .1, 24); b.scale.set(1, 1, 1.35); B(g, M.ceramic, -.2, .4, -.3, .4, .03, .56); B(g, M.ceramic, -.2, .2, -.36, .4, .62, .16); CY(g, M.steel, 0, .84, -.28, .03, .012, 12); }
    block(16.3, 15.2, 17.5, 15.4); block(16.75, 15.6, 17.5, 16.4);
    B(p, M.brass, 13.0, 1.55, 17.42, 1.6, .02, .02); for (let i = 0; i < 2; i++) { B(p, i ? M.linenSand : M.linen, 13.15 + i * .75, .95, 17.4, .55, .62, .03); }
    mk(p, new THREE.CircleGeometry(.06, 12), M.steel, 16.75, .032, 13.9).rotation.x = -Math.PI / 2; for (let i = 0; i < 3; i++) lathe(p, [M.clayDark, M.ceramic, M.glass][i], [[0, 0], [.028, 0], [.028, .12], [.012, .15], [.012, .18], [0, .18]], 11.25 + i * .09, .83, 13.05, 10);
  }


  // ---------------- ROOF TERRACE (y 4.3) ----------------
  {
    const y = ROOF, g = G(p, 0, y, 0); rug(p, M.jute, 11.0, 15.2, 4.4, 3.0, 0, y + .004);
    sofa(g, M, 11.0, 17.38, 3.6, Math.PI, [[-1, 0, .2], [0, 1, 0], [1, 2, -.2]], M.taupe); sofa(g, M, 13.6, 15.1, 2.4, -Math.PI / 2, [[-.8, 1, 0], [.8, 0, 0]], M.taupe);
    B(g, M.stone, 10.45, 0, 14.8, 1.1, .3, .75); bowl(g, M.clay, 11.0, .3, 15.15, .16, .06); bookStack(g, M, 10.75, .3, 15.2, 2); lathe(g, M.ceramic, [[0, 0], [.04, 0], [.06, .08], [.03, .14], [0, .14]], 11.3, .3, 15.0, 14);
    lantern(g, M, 8.7, 0, 16.9, .9, 0); lantern(g, M, 9.0, 0, 13.4, .7, 0); lantern(g, M, 13.2, 0, 13.4, .9, 0);
    planter(g, M, 8.0, 17.0, .34, .65, 'grass'); planter(g, M, 1.1, 17.0, .36, .7, 'olive'); planter(g, M, 16.9, 1.1, .34, .65, 'grass'); planter(g, M, 16.9, 16.9, .3, .6, 'shrub'); planter(g, M, 1.1, 6.3, .3, .6, 'grass');
    block(9.2, 16.4, 12.8, 17.5, 'roof'); block(12.6, 13.9, 13.7, 16.3, 'roof'); block(10.4, 14.75, 11.6, 15.6, 'roof');
    daybed(g, M, 2.6, 9.5, 2.1, Math.PI / 2); block(2.1, 8.4, 3.1, 10.6, 'roof'); sideTable(g, M, 3.5, 9.5, .36, M.stone);
  }
  return p;
}
