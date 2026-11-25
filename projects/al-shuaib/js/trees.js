// Trees of the Najd: date palm (Phoenix dactylifera), olive, umbrella acacia (talh), ghaf, and dry grasses.
import * as THREE from 'three';
import { mk, CY, colliders } from './house.js';
import { rnd, rr } from './tex.js';

const stiff = [], droop = [], fruits = [], stubs = [];
export const planTrees = [];
export function datePalm(p, M, x, z, h, lean = 0, dir = 0, y0 = -0.1, solid = true) {
  planTrees.push({ kind: 'palm', x: x + Math.cos(dir) * lean, z: z + Math.sin(dir) * lean });
  const top = new THREE.Vector3(x + Math.cos(dir) * lean, y0 + h, z + Math.sin(dir) * lean);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y0, z), new THREE.Vector3(x, y0 + h * .55, z), top);
  const g = new THREE.TubeGeometry(curve, 16, .23, 12), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * 1.3, uv.getX(i) * h * .55);
  mk(p, g, M.trunk); mk(p, new THREE.CylinderGeometry(.24, .34, .35, 12), M.trunk, x, y0 + .17, z);
  // swollen crown shaft with the cut bases of old fronds
  const sh = mk(p, new THREE.CylinderGeometry(.36, .25, 1.1, 14), M.trunk, top.x, top.y - .5, top.z);
  for (let i = 0; i < 46; i++) { const a = i * 2.399, t = i / 46; stubs.push([top.x + Math.cos(a) * (.27 + t * .1), top.y - 1.0 + t * 1.0, top.z + Math.sin(a) * (.27 + t * .1), a, .5 + t * .4]); }
  const n = 46; for (let i = 0; i < n; i++) { const t = i / n, a = i * 2.399 + rr(-.15, .15), s = rr(.92, 1.15) * (h > 7 ? 1.08 : 1); (t < .42 ? stiff : droop).push([top.x, top.y + .05, top.z, a, t < .42 ? .1 + t * 1.5 : .55 + (t - .42) * 2.1 + rr(-.08, .08), s]); }
  // fruit: orange stalks arching out of the crown, hung with khalal dates
  for (let i = 0; i < 5; i++) {
    const a = i * 1.257 + x, c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(top.x, top.y - .1, top.z), new THREE.Vector3(top.x + Math.cos(a) * .55, top.y + .1, top.z + Math.sin(a) * .55), new THREE.Vector3(top.x + Math.cos(a) * .75, top.y - .75, top.z + Math.sin(a) * .75));
    mk(p, new THREE.TubeGeometry(c, 8, .018, 5), M.dateStalk);
    for (let k = 0; k < 20; k++) { const q = c.getPoint(.6 + rnd() * .4); fruits.push([q.x + rr(-.09, .09), q.y - rnd() * .28, q.z + rr(-.09, .09)]); }
  }
  if (solid) colliders.ground.push([x - .28, z - .28, x + .28, z + .28]);
}
export function resetPalms() { stiff.length = droop.length = fruits.length = stubs.length = 0; }
export function flushPalms(p, M) {
  const o = new THREE.Object3D(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  for (const [list, bend] of [[stiff, .5], [droop, 1.2]]) {
    const L = 3.9, g = new THREE.PlaneGeometry(1.05, L, 2, 10); g.translate(0, L / 2, 0);
    const pos = g.attributes.position, R = L / bend;
    for (let i = 0; i < pos.count; i++) { const a = pos.getY(i) / L * bend, xx = pos.getX(i); pos.setXYZ(i, xx, R * Math.sin(a), R * (1 - Math.cos(a)) - Math.abs(xx) * .42); }
    g.computeVertexNormals();
    const im = new THREE.InstancedMesh(g, M.frond, list.length);
    list.forEach(([x, y, z, az, tilt, s], i) => { o.position.set(x, y, z); q1.setFromAxisAngle(Y, az); q2.setFromAxisAngle(X, tilt); o.quaternion.copy(q1).multiply(q2); o.scale.setScalar(s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = im.receiveShadow = true; im.frustumCulled = false; p.add(im);
  }
  const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 5, 4), M.dateFruit, fruits.length);
  fruits.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.quaternion.identity(); o.scale.set(1, 1.5, 1); o.updateMatrix(); fm.setMatrixAt(i, o.matrix); }); fm.castShadow = true; fm.frustumCulled = false; p.add(fm);
  const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(.09, .26, .05), M.trunk, stubs.length);
  stubs.forEach(([x, y, z, a, t], i) => { o.position.set(x, y, z); o.scale.setScalar(1); o.rotation.set(0, 0, 0); o.quaternion.setFromAxisAngle(Y, -a + Math.PI / 2).multiply(q2.setFromAxisAngle(X, t)); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.castShadow = true; sm.frustumCulled = false; p.add(sm);
}

const KIND = {
  olive: { h: 1.15, r: .2, levels: 4, spread: .62, shrink: .74, up: .35, leaf: 'oliveLeaf', card: .44, per: 14, lr: .5, flat: 1, gnarl: .35 },
  acacia: { h: 2.3, r: .15, levels: 4, spread: .95, shrink: .78, up: .05, leaf: 'acaciaLeaf', card: .8, per: 7, lr: .7, flat: .28, gnarl: .25 },
  ghaf: { h: 2.8, r: .22, levels: 4, spread: .6, shrink: .78, up: .2, leaf: 'ghafLeaf', card: .55, per: 5, lr: .45, flat: .8, gnarl: .2 },
};
export function tree(p, M, kind, x, y, z, scale = 1, solid = true) {
  if (y < 1 && scale > .8) planTrees.push({ kind, x, z, s: scale });
  const K = KIND[kind], pts = [], grp = new THREE.Group(); grp.position.set(x, y, z); grp.scale.setScalar(scale); grp.rotation.y = rnd() * 6; p.add(grp);
  const grow = (pos, dir, len, rad, lvl) => {
    const end = pos.clone().addScaledVector(dir, len), mid = pos.clone().lerp(end, .5).add(new THREE.Vector3(rr(-1, 1), rr(-.3, .6), rr(-1, 1)).multiplyScalar(len * K.gnarl));
    const c = new THREE.QuadraticBezierCurve3(pos, mid, end), g = new THREE.TubeGeometry(c, lvl ? 6 : 10, rad, lvl > 1 ? 6 : 12), uv = g.attributes.uv, ps = g.attributes.position, cc = new THREE.Vector3();
    for (let i = 0; i < uv.count; i++) { const u = Math.min(1, Math.max(0, uv.getX(i))), k = (1 - .38 * u) * (1 + .1 * Math.sin(u * 9 + i)); c.getPointAt(u, cc); ps.setXYZ(i, cc.x + (ps.getX(i) - cc.x) * k, cc.y + (ps.getY(i) - cc.y) * k, cc.z + (ps.getZ(i) - cc.z) * k); uv.setXY(i, uv.getY(i) * 1.5, uv.getX(i) * len * 2); }
    g.computeVertexNormals();
    mk(grp, g, M.bark);
    if (lvl >= K.levels - 1) { pts.push(end.clone()); pts.push(c.getPoint(.6)); if (kind === 'ghaf') for (let d = 1; d <= 3; d++) pts.push(end.clone().add(new THREE.Vector3(rr(-.2, .2), -d * .42, rr(-.2, .2)))); }
    if (lvl < K.levels) { const n = lvl === 0 ? 3 : 2 + (rnd() < .45 ? 1 : 0); for (let i = 0; i < n; i++) { const a = i / n * 6.28 + rnd() * 1.4, t = K.spread * rr(.7, 1.25), d = new THREE.Vector3(Math.cos(a) * Math.sin(t), Math.cos(t), Math.sin(a) * Math.sin(t)); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); d.applyQuaternion(q); d.y = d.y * (lvl > 1 ? K.flat : 1) + K.up * .4; d.normalize(); grow(end, d, len * K.shrink * rr(.85, 1.1), rad * .62, lvl + 1); } }
  };
  mk(grp, new THREE.CylinderGeometry(K.r * 1.05, K.r * 1.7, .3, 9), M.bark, 0, .13, 0);
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(rr(-.12, .12), 1, rr(-.12, .12)).normalize(), K.h, K.r, 0);
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), M[K.leaf], pts.length * K.per), o = new THREE.Object3D(); let k = 0;
  for (const q of pts) for (let i = 0; i < K.per; i++) { o.position.set(q.x + rr(-1, 1) * K.lr, q.y + rr(-.5, .8) * K.lr * K.flat, q.z + rr(-1, 1) * K.lr); o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); o.scale.setScalar(K.card * rr(.8, 1.25)); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
  im.castShadow = im.receiveShadow = true; grp.add(im);
  if (solid) colliders.ground.push([x - .25, z - .25, x + .25, z + .25]);
  return grp;
}
// dry desert grass (thumam / pennisetum) in tufts
export function grasses(p, M, list) { // [x, y, z, size]
  const g = new THREE.PlaneGeometry(1, 1); g.translate(0, .5, 0);
  const im = new THREE.InstancedMesh(g, M.grass, list.length * 3), o = new THREE.Object3D(); let k = 0;
  for (const [x, y, z, s] of list) { const a = rnd() * 3; for (let i = 0; i < 3; i++) { o.position.set(x, y, z); o.rotation.set(0, a + i * 1.047, 0); o.scale.set(s * 1.1, s * .8, 1); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); } }
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; p.add(im);
}
