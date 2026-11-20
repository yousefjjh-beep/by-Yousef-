// Al-Kareem Mosque — 3D model traced from the AutoCAD site plan
// (22-2026 alyaqoot masjed 08-Model.pdf). Plan px at 240 dpi → metres.
// World: x east-ish (drawing right), z drawing down, y up. 1 unit = 1 m.
import * as THREE from 'three';
import { mergeGeometries } from '../lib/addons/BufferGeometryUtils.js';

export const PXM = 56;
export const P = (x, y) => new THREE.Vector2((x - 1000) / PXM, (y - 1100) / PXM);
const v3 = (p, y = 0) => new THREE.Vector3(p.x, y, p.y);

// ---------------------------------------------------------------- key geometry
export const HALL = {
  A: P(1221, 274), B: P(1900, 628), C: P(1210, 1944), D: P(531, 1590),
  t: 0.35, h: 8.2, floor: 0.45, ceil: 7.55, roofTop: 7.95,
};
HALL.d2 = HALL.B.clone().sub(HALL.A).normalize();       // along entrance wall, toward qibla wall
HALL.d1 = HALL.D.clone().sub(HALL.A).normalize();       // long axis, toward entrance (outward of DC)
HALL.len = HALL.A.distanceTo(HALL.D);                    // ~26.5
HALL.wid = HALL.A.distanceTo(HALL.B);                    // ~13.7
HALL.center = HALL.A.clone().add(HALL.C).multiplyScalar(0.5);
HALL.dome = P(1383, 1193); HALL.domeR = 3.25;
HALL.mihrab = null; // set below
// point at distance s along D→C (entrance wall) and offset o outward (+d1)
const onDC = (s, o = 0) => HALL.D.clone().addScaledVector(HALL.d2, s).addScaledVector(HALL.d1, o);
export const DOOR = { s: 10.4, w: 2.3, h: 3.9 };
DOOR.pos = onDC(DOOR.s);                                  // outer face of the wall, door centre
export const GATE = { pos: onDC(18.5, 2.6) };   // freestanding limestone arch, right of the portal (renders)
export const PORTAL = { s0: 8.65, s1: 13.7, win: 12.55 };

function lineIntersect(p, u, q, v) {
  const den = u.x * v.y - u.y * v.x;
  const t = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / den;
  return p.clone().addScaledVector(u, t);
}

// ---------------------------------------------------------------- builders
function archPath(path, x0, x1, sill, apex, reverse = false) {
  // pointed (two-centred) arch: radius 0.9 w gives a lancet profile
  const w = x1 - x0, r = w * 0.9, mid = x0 + w / 2;
  const rise = Math.sqrt(r * r - (r - w / 2) * (r - w / 2));
  const spring = apex - rise;
  const cxL = x0 + r;
  const angApex = Math.acos((mid - cxL) / r);
  const N = 18;
  const left = [[x0, sill], [x0, spring]];
  for (let i = 1; i <= N; i++) { const a = Math.PI - (Math.PI - angApex) * (i / N); left.push([cxL + r * Math.cos(a), spring + r * Math.sin(a)]); }
  const right = left.slice().reverse().map(([x, y]) => [2 * mid - x, y]);
  const all = left.concat(right.slice(1));
  const seq = reverse ? all.slice().reverse() : all;
  path.moveTo(seq[0][0], seq[0][1]);
  for (let i = 1; i < seq.length; i++) path.lineTo(seq[i][0], seq[i][1]);
  path.closePath();
  return all;
}
export function archPoints(x0, x1, sill, apex) {
  const p = new THREE.Path();
  return archPath(p, x0, x1, sill, apex);
}

function rectPath(path, x0, x1, y0, y1) {
  path.moveTo(x0, y0); path.lineTo(x1, y0); path.lineTo(x1, y1); path.lineTo(x0, y1); path.closePath();
}

// A wall from a to b (outer face on the line), extruded toward `inside`.
function wall({ a, b, h, t, base = 0, inside, openings = [], mat, i0 = 0, i1 = 0, name }) {
  const L = a.distanceTo(b);
  const s = new THREE.Shape();
  rectPath(s, i0, L - i1, 0, h);
  for (const o of openings) {
    const hp = new THREE.Path();
    const x0 = o.c - o.w / 2, x1 = o.c + o.w / 2;
    if (o.type === 'arch') archPath(hp, x0, x1, o.sill, o.top);
    else rectPath(hp, x0, x1, o.sill, o.top);
    s.holes.push(hp);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 18 });
  const dir = b.clone().sub(a).normalize();
  const n = new THREE.Vector2(-dir.y, dir.x); // Z axis in xz = (-dz, dx)
  const sign = inside.clone().sub(a).dot(n) >= 0 ? 1 : -1;
  if (sign < 0) g.translate(0, 0, -t);
  const m = new THREE.Mesh(g, mat);
  const X = new THREE.Vector3(dir.x, 0, dir.y), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3().crossVectors(X, Y);
  m.matrix.makeBasis(X, Y, Z).setPosition(a.x, base, a.y);
  m.matrixAutoUpdate = false;
  m.updateMatrixWorld(true);
  m.userData = { kind: 'wall', name, a, b, dir, n: n.clone().multiplyScalar(sign), t, L, base, edges: true };
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Wall-local frame helper: returns a Matrix4 that maps (u along, y, w into wall) to world.
function wallFrame(w) {
  const { a, dir, n } = w.userData;
  const X = new THREE.Vector3(dir.x, 0, dir.y), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(n.x, 0, n.y);
  return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(a.x, w.userData.base, a.y);
}

// glass + bronze frame filling an opening of a wall
function glaze(w, o, M, group, depth = 0.5) {
  const F = wallFrame(w);
  const x0 = o.c - o.w / 2, x1 = o.c + o.w / 2;
  const s = new THREE.Shape();
  if (o.type === 'arch') archPath(s, x0, x1, o.sill, o.top); else rectPath(s, x0, x1, o.sill, o.top);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 18 });
  g.translate(0, 0, w.userData.t * depth);
  const det = F.determinant();
  const glass = new THREE.Mesh(g, M.glass);
  glass.applyMatrix4(F);
  glass.renderOrder = 2;
  group.add(glass);
  // frame: verticals and transoms
  const fr = [];
  const ft = 0.06, fd = 0.09;
  const z = w.userData.t * depth - 0.03;
  const box = (cx, cy, sx, sy) => { const b = new THREE.BoxGeometry(sx, sy, fd); b.translate(cx, cy, z + 0.015); fr.push(b); };
  const spring = o.type === 'arch' ? o.top - Math.sqrt((o.w * 0.9) ** 2 - (o.w * 0.9 - o.w / 2) ** 2) : o.top;
  box(x0 + ft / 2, (o.sill + spring) / 2, ft, spring - o.sill);
  box(x1 - ft / 2, (o.sill + spring) / 2, ft, spring - o.sill);
  box((x0 + x1) / 2, o.sill + ft / 2, o.w, ft);
  if (o.mullion !== false && o.w > 0.9) box((x0 + x1) / 2, (o.sill + o.top) / 2 - 0.05, ft * 0.7, o.top - o.sill - 0.1);
  if (o.mullions) for (let x = x0 + o.mullions; x < x1 - 0.1; x += o.mullions) box(x, (o.sill + o.top) / 2, ft * 0.8, o.top - o.sill);
  const tr = o.transom ?? 1.6;
  for (let y = o.sill + tr; y < spring - 0.3; y += tr) box((x0 + x1) / 2, y, o.w - ft, ft * 0.7);
  if (o.type !== 'arch') box((x0 + x1) / 2, o.top - ft / 2, o.w, ft);
  if (fr.length) {
    const fg = mergeGeometries(fr);
    const fm = new THREE.Mesh(fg, M.bronze);
    fm.applyMatrix4(F); fm.castShadow = true;
    group.add(fm);
  }
  if (o.type === 'arch') {
    // arch frame ring as a thin extruded outline
    const pts = archPoints(x0, x1, o.sill, o.top).filter(([, y]) => y >= spring - 0.01);
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, z + 0.015)));
    const tg = new THREE.TubeGeometry(curve, 48, 0.035, 5, false);
    const tm = new THREE.Mesh(tg, M.bronze); tm.applyMatrix4(F); group.add(tm);
  }
  return glass;
}

// closed slab from polygon (xz) between y0 and y1, optional holes (array of Vector2[] or {circle})
function slab(poly, y0, y1, mat, holes = [], opts = {}) {
  const s = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.y)));
  for (const h of holes) {
    const hp = new THREE.Path();
    if (h.r) hp.absarc(h.c.x, -h.c.y, h.r, 0, Math.PI * 2, true);
    else hp.setFromPoints(h.map((p) => new THREE.Vector2(p.x, -p.y)));
    s.holes.push(hp);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 48 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = opts.cast ?? true; m.receiveShadow = true;
  m.userData.edges = opts.edges ?? true;
  return m;
}

// oriented box: centre (xz), axes u (Vector2), size [along u, height, along v], base y
function obox(c, u, size, base, mat, opts = {}) {
  const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const m = new THREE.Mesh(g, mat);
  m.position.set(c.x, base + size[1] / 2, c.y);
  m.rotation.y = -Math.atan2(u.y, u.x);
  m.castShadow = m.receiveShadow = true;
  m.userData.edges = opts.edges ?? true;
  return m;
}

// closed ring of walls around a polygon (skipping edges in `skip`)
function walls(poly, h, t, mat, { base = 0, skip = [], openings = {}, name } = {}) {
  const c = poly.reduce((s, p) => s.add(p), new THREE.Vector2()).multiplyScalar(1 / poly.length);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    if (skip.includes(i)) continue;
    const a = poly[i], b = poly[(i + 1) % poly.length];
    out.push(wall({ a, b, h, t, base, inside: c, openings: openings[i] || [], mat: (openings.mat && openings.mat[i]) || mat,
      i0: i % 2 ? t : 0, i1: i % 2 ? t : 0, name: `${name}-${i}` }));
  }
  return out;
}

// inset a convex polygon by d
function inset(poly, d) {
  const n = poly.length, lines = [];
  const c = poly.reduce((s, p) => s.add(p), new THREE.Vector2()).multiplyScalar(1 / n);
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const dir = b.clone().sub(a).normalize();
    let nn = new THREE.Vector2(-dir.y, dir.x);
    if (c.clone().sub(a).dot(nn) < 0) nn.negate();
    lines.push([a.clone().addScaledVector(nn, d), dir]);
  }
  return lines.map((l, i) => { const k = lines[(i + n - 1) % n]; return lineIntersect(k[0], k[1], l[0], l[1]); });
}

// ---------------------------------------------------------------- the model
export function buildModel(M) {
  const root = new THREE.Group();
  const building = new THREE.Group(); root.add(building);
  const site = new THREE.Group(); root.add(site);
  const anim = {};
  const { A, B, C, D, d1, d2, t } = HALL;
  const inside = HALL.center;
  const add = (o, g = building) => { (Array.isArray(o) ? o : [o]).forEach((x) => g.add(x)); return o; };

  // ---------------- prayer hall walls
  const blockP1 = P(840, 168);
  const blockP2 = lineIntersect(blockP1, d2, A, d1);
  const blockDepth = 10.9;
  const blockOnDA = A.distanceTo(blockP2) + blockDepth;        // metres of DA (from A) covered by north block
  const daFree = HALL.len - blockOnDA;                          // from D

  // entrance wall D→C
  // entrance elevation, left to right as in the renders:
  // ribbon window | two tall pointed arches | limestone portal (door + tall arch)
  const dcOpen = [
    { c: 3.6, w: 1.9, sill: 5.75, top: 7.15, type: 'rect', transom: 9, mullion: false, mullions: 0.48 },
    { c: 5.55, w: 1.55, sill: 0.9, top: 7.15, type: 'arch' },
    { c: 7.6, w: 1.55, sill: 0.9, top: 7.15, type: 'arch' },
    { c: DOOR.s, w: DOOR.w, sill: HALL.floor, top: HALL.floor + DOOR.h, type: 'rect', door: true },
    { c: PORTAL.win, w: 1.15, sill: 0.9, top: 7.4, type: 'arch' },
  ];
  const wDC = add(wall({ a: D, b: C, h: HALL.h, t, inside, openings: dcOpen, mat: M.plaster, name: 'DC' }));
  dcOpen.filter((o) => !o.door).forEach((o) => glaze(wDC, o, M, building));

  // north wall A→B (door to the ablution side)
  const abOpen = [
    { c: 3.2, w: 2.0, sill: HALL.floor, top: HALL.floor + 3.4, type: 'rect' },
    { c: 8.6, w: 7.2, sill: 5.6, top: 6.9, type: 'rect', transom: 9, mullion: false },
  ];
  const wAB = add(wall({ a: A, b: B, h: HALL.h, t, inside, openings: abOpen, mat: M.plaster, name: 'AB' }));
  glaze(wAB, abOpen[1], M, building);

  // qibla wall B→C, mihrab niche + clerestory
  const BC = C.clone().sub(B); const bcLen = BC.length(); BC.normalize();
  const mihS = (1291 - 628) / (1944 - 628) * bcLen;
  HALL.mihrab = B.clone().addScaledVector(BC, mihS);
  const bcOpen = [
    { c: mihS, w: 1.7, sill: HALL.floor, top: HALL.floor + 3.9, type: 'arch' },
    { c: 9.4, w: 1.0, sill: HALL.floor, top: HALL.floor + 2.4, type: 'rect' },  // imam room door
  ];
  for (let s = 2.2; s < bcLen - 2; s += 3.1) if (Math.abs(s - mihS) > 3) bcOpen.push({ c: s, w: 1.1, sill: 5.7, top: 7.0, type: 'arch', mullion: false });
  const wBC = add(wall({ a: B, b: C, h: HALL.h, t, inside, openings: bcOpen, mat: M.plaster, i0: t, i1: t, name: 'BC' }));
  bcOpen.slice(2).forEach((o) => glaze(wBC, o, M, building));

  // west wall D→A: tall arches to the garden court, clerestory over the north block
  const daOpen = [];
  for (let s = 2.4; s < daFree - 1.2; s += 3.3) daOpen.push({ c: s, w: 1.45, sill: 0.95, top: 6.8, type: 'arch' });
  daOpen.push({ c: (daFree + HALL.len) / 2, w: blockOnDA - 2, sill: 5.6, top: 6.9, type: 'rect', transom: 9, mullion: false });
  const wDA = add(wall({ a: D, b: A, h: HALL.h, t, inside, openings: daOpen, mat: M.plaster, i0: t, i1: t, name: 'DA' }));
  daOpen.forEach((o) => glaze(wDA, o, M, building));

  // hall floor, carpet, roof
  const inner = inset([A, B, C, D], t);
  add(slab(inner, 0, HALL.floor, M.marble, [], { cast: false }));
  const carpetPoly = inset([A, B, C, D], t + 0.55);
  {
    const s = new THREE.Shape(carpetPoly.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, HALL.floor + 0.012, 0);
    const pos = g.attributes.position, uv = g.attributes.uv;
    const o = HALL.mihrab.clone().addScaledVector(d2, -(t + 0.55));
    for (let i = 0; i < pos.count; i++) {
      const p = new THREE.Vector2(pos.getX(i), pos.getZ(i)).sub(o);
      uv.setXY(i, p.dot(d1), p.dot(d2));
    }
    const m = new THREE.Mesh(g, M.carpet); m.receiveShadow = true; m.userData.edges = false;
    add(m); anim.carpet = m;
  }
  add(slab(inner, HALL.ceil, HALL.roofTop, M.ceiling, [{ c: HALL.dome, r: HALL.domeR }]));

  // interior columns
  for (const c of [P(1311, 975), P(1148, 1265)]) {
    add(obox(c, d2, [0.8, HALL.ceil - HALL.floor, 0.8], HALL.floor, M.marble));
    add(obox(c, d2, [1.0, 0.5, 1.0], HALL.floor, M.marble));
    add(obox(c, d2, [0.95, 0.12, 0.95], HALL.ceil - 0.5, M.brass, { edges: false }));
  }

  // drum + ribbed bronze dome
  {
    const s = new THREE.Shape(); s.absarc(0, 0, 3.55, 0, Math.PI * 2, false);
    const h = new THREE.Path(); h.absarc(0, 0, HALL.domeR, 0, Math.PI * 2, true); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false, curveSegments: 64 });
    g.rotateX(-Math.PI / 2); g.translate(HALL.dome.x, HALL.roofTop - 0.4, HALL.dome.y);
    const drum = new THREE.Mesh(g, M.plaster); drum.castShadow = drum.receiveShadow = true; add(drum);
    // drum windows: 16 glowing slots
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const wg = new THREE.BoxGeometry(0.55, 0.75, 0.05);
      const wm = new THREE.Mesh(wg, M.glass);
      wm.position.set(HALL.dome.x + Math.cos(a) * 3.56, HALL.roofTop + 0.4, HALL.dome.y + Math.sin(a) * 3.56);
      wm.rotation.y = -a + Math.PI / 2; wm.userData.edges = true; add(wm);
    }
    const prof = [[3.62, 0], [3.66, 0.5], [3.58, 1.25], [3.28, 2.1], [2.75, 2.95], [2.0, 3.7], [1.2, 4.25], [0.55, 4.6], [0.12, 4.82], [0, 4.86]];
    const curve = new THREE.SplineCurve(prof.map(([r, y]) => new THREE.Vector2(r, y)));
    const pts = curve.getPoints(40);
    const lg = new THREE.LatheGeometry(pts, 160);
    const pos = lg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      const a = Math.atan2(z, x);
      const rib = 1 - 0.045 * Math.pow(Math.abs(Math.sin(a * 8)), 0.6);
      pos.setX(i, x * rib); pos.setZ(i, z * rib);
    }
    lg.computeVertexNormals();
    const base = HALL.roofTop + 1.1;
    lg.translate(HALL.dome.x, base, HALL.dome.y);
    const dome = new THREE.Mesh(lg, M.bronze); dome.castShadow = true; dome.userData.edges = false;
    add(dome); anim.dome = dome;
    // dome ribs as ink lines for the drawing
    const rl = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      for (let j = 0; j < pts.length - 1; j++) {
        const p0 = pts[j], p1 = pts[j + 1];
        rl.push(HALL.dome.x + Math.cos(a) * p0.x, base + p0.y, HALL.dome.y + Math.sin(a) * p0.x,
          HALL.dome.x + Math.cos(a) * p1.x, base + p1.y, HALL.dome.y + Math.sin(a) * p1.x);
      }
    }
    for (const yy of [0, 1.25, 2.95]) {
      const r = curve.getPoint(prof.findIndex(([, y]) => y >= yy) / (prof.length - 1)).x;
      for (let k = 0; k < 64; k++) {
        const a0 = (k / 64) * Math.PI * 2, a1 = ((k + 1) / 64) * Math.PI * 2;
        rl.push(HALL.dome.x + Math.cos(a0) * r, base + yy, HALL.dome.y + Math.sin(a0) * r, HALL.dome.x + Math.cos(a1) * r, base + yy, HALL.dome.y + Math.sin(a1) * r);
      }
    }
    anim.domeLines = rl;
    // inner shell (seen from the hall)
    const ig = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x * 0.88, p.y * 0.93)), 96);
    ig.translate(HALL.dome.x, base, HALL.dome.y);
    const inn = new THREE.Mesh(ig, M.domeIn); inn.userData.edges = false; add(inn);
    // finial
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 1.4, 8), M.brass);
    fin.position.set(HALL.dome.x, base + 4.86 + 0.6, HALL.dome.y); fin.userData.edges = false; add(fin);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), M.brass);
    ball.position.set(HALL.dome.x, base + 5.1, HALL.dome.y); ball.userData.edges = false; add(ball);
  }

  // mihrab niche (U-shaped in plan, as drawn)
  {
    const u = BC.clone(), n = d2.clone(); // n = outward from qibla wall
    const o = HALL.mihrab;
    const W = 2.8, Dp = 1.5, R = 0.85;
    const L = (a, b) => o.clone().addScaledVector(u, a).addScaledVector(n, b);
    const arc = [];
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI; arc.push(L(-Math.cos(a) * R, Math.sin(a) * R)); }
    const poly = [L(-W / 2, 0), ...arc, L(W / 2, 0), L(W / 2, Dp), L(-W / 2, Dp)];
    const sh = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 4.9, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, M.marble); m.castShadow = m.receiveShadow = true; add(m);
    // niche hood (closes the top of the half-cylinder)
    add(slab([L(-W / 2, 0), L(W / 2, 0), L(W / 2, Dp), L(-W / 2, Dp)], 4.35, 4.9, M.plaster));
    // gilded arch frame on the hall side
    const ap = archPoints(-1.05, 1.05, HALL.floor, HALL.floor + 4.2);
    const curve = new THREE.CatmullRomCurve3(ap.map(([x, y]) => { const q = L(x, -HALL.t - 0.02); return new THREE.Vector3(q.x, y, q.y); }));
    const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.07, 6, false), M.gold); tm.userData.edges = false; add(tm);
  }

  // chandelier under the dome
  {
    const g = new THREE.Group();
    const y = 4.6;
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.05, 8, 96), M.brass); ring1.rotation.x = Math.PI / 2; ring1.position.y = y;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.045, 8, 96), M.brass); ring2.rotation.x = Math.PI / 2; ring2.position.y = y + 0.55;
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 8, 64), M.brass); ring3.rotation.x = Math.PI / 2; ring3.position.y = y + 1.05;
    g.add(ring1, ring2, ring3);
    const bulbs = [];
    [[2.25, y, 40], [1.45, y + 0.55, 26], [0.75, y + 1.05, 14]].forEach(([r, yy, n]) => {
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const b = new THREE.SphereGeometry(0.06, 8, 6); b.translate(Math.cos(a) * r, yy + 0.09, Math.sin(a) * r); bulbs.push(b); }
    });
    g.add(new THREE.Mesh(mergeGeometries(bulbs), M.bulb));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const top = new THREE.Vector3(Math.cos(a) * 0.4, 9.5, Math.sin(a) * 0.4), bot = new THREE.Vector3(Math.cos(a) * 2.25, y, Math.sin(a) * 2.25);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, top.distanceTo(bot), 4), M.brass);
      chain.position.copy(top).add(bot).multiplyScalar(0.5); chain.lookAt(top); chain.rotateX(Math.PI / 2);
      g.add(chain);
    }
    g.traverse((o) => { if (o.isMesh) o.userData.edges = false; });
    g.position.set(HALL.dome.x, 0, HALL.dome.y);
    add(g); anim.chandelier = g;
  }

  // Quran cabinets under the garden-side arches
  {
    const a = D.clone().addScaledVector(d2, t + 0.25);
    for (let s = 0.9; s < daFree - 1.0; s += 3.3) {
      const c = a.clone().addScaledVector(d1, -(s + 1.5));
      add(obox(c, d1, [2.6, 0.85, 0.45], HALL.floor, M.walnut));
    }
  }

  // entrance terrace, steps, portal
  {
    const edgeO = 2.4, s0 = DOOR.s - 3.2, s1 = DOOR.s + 3.2;
    add(slab([onDC(-0.2, 0), onDC(HALL.wid + 0.4, 0), onDC(HALL.wid + 0.4, edgeO), onDC(-0.2, edgeO)], 0, HALL.floor, M.paving));
    add(slab([onDC(s0, edgeO), onDC(s1, edgeO), onDC(s1, edgeO + 0.4), onDC(s0, edgeO + 0.4)], 0, 0.3, M.paving));
    add(slab([onDC(s0, edgeO + 0.4), onDC(s1, edgeO + 0.4), onDC(s1, edgeO + 0.8), onDC(s0, edgeO + 0.8)], 0, 0.15, M.paving));
    const led = new THREE.Mesh(new THREE.BoxGeometry(HALL.wid + 0.6, 0.03, 0.05), M.led);
    const lc = onDC(HALL.wid / 2 + 0.1, edgeO + 0.02);
    led.position.set(lc.x, HALL.floor - 0.06, lc.y); led.rotation.y = -Math.atan2(d2.y, d2.x); led.userData.edges = false; add(led);
    // split-face limestone portal block, proud of the wall and above the parapet
    const pa = onDC(PORTAL.s0, 0.8), pb = onDC(PORTAL.s1 + 0.25, 0.8);
    const pOpen = [
      { c: DOOR.s - PORTAL.s0, w: 3.0, sill: HALL.floor, top: HALL.floor + 4.6, type: 'rect' },
      { c: PORTAL.win - PORTAL.s0, w: 1.15, sill: 0.9, top: 7.4, type: 'arch' },
    ];
    add(wall({ a: pa, b: pb, h: 9.9, t: 0.8, inside, openings: pOpen, mat: M.stone, name: 'portal' }));
    // portal return on the corner (wraps C)
    add(wall({ a: onDC(PORTAL.s1 + 0.25, 0.8), b: onDC(PORTAL.s1 + 0.25, -2.2), h: 9.9, t: 0.55, inside, mat: M.stone, name: 'portalR' }));
    // smooth limestone surround to the recessed door
    const fr = (cs, cw, y0, h, o) => add(obox(onDC(cs, o), d2, [cw, h, 0.5], y0, M.limeSmooth));
    fr(DOOR.s - DOOR.w / 2 - 0.22, 0.44, HALL.floor, DOOR.h + 0.44, 0.25);
    fr(DOOR.s + DOOR.w / 2 + 0.22, 0.44, HALL.floor, DOOR.h + 0.44, 0.25);
    fr(DOOR.s, DOOR.w + 0.88, HALL.floor + DOOR.h, 0.44, 0.25);
    // slim bronze canopy
    add(obox(onDC(DOOR.s, 1.25), d2, [3.4, 0.12, 1.7], HALL.floor + 4.7, M.bronze));
    anim.plaquePos = onDC((PORTAL.s0 + PORTAL.s1) / 2, 0.81);
    anim.plaqueY = 8.75;
    // roof cubes (as in the renders)
    add(obox(onDC(11.6, -3.6), d2, [3.6, 2.8, 3.6], HALL.roofTop, M.plaster));
  }

  // door leaves (walnut, bronze medallion), hinged at the jambs, open inward
  {
    const leafW = DOOR.w / 2 - 0.02, leafH = DOOR.h - 0.02;
    anim.leaves = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      const hinge = onDC(DOOR.s + side * DOOR.w / 2, -t * 0.5);
      pivot.position.set(hinge.x, HALL.floor, hinge.y);
      pivot.rotation.y = -Math.atan2(d2.y, d2.x);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, 0.09), M.walnutDoor);
      leaf.position.set(-side * leafW / 2, leafH / 2, 0); leaf.castShadow = true;
      leaf.userData.edges = false;
      pivot.add(leaf);
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 8), M.brass);
      med.rotation.x = Math.PI / 2; med.position.set(-side * (leafW - 0.05), 2.0, 0.055); pivot.add(med);
      const med2 = med.clone(); med2.position.z = -0.055; pivot.add(med2);
      for (let k = 0; k < 6; k++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.8, 0.025, 0.02), M.brass);
        bar.position.set(-side * leafW / 2, 0.5 + k * 0.6, 0.055); pivot.add(bar);
      }
      pivot.userData.side = side;
      add(pivot); anim.leaves.push(pivot);
    }
  }

  // ---------------- north service block (ablution, WCs, stair, lift)
  {
    const p1 = blockP1, p2 = blockP2, p3 = p2.clone().addScaledVector(d1, blockDepth), p4 = p1.clone().addScaledVector(d1, blockDepth);
    const poly = [p1, p2, p3, p4];
    const op = {
      0: [{ c: 3, w: 3.6, sill: 2.0, top: 2.9, type: 'rect' }],
      2: [{ c: 2.6, w: 1.6, sill: 0, top: 2.6, type: 'rect' }],
      3: [{ c: 3.5, w: 0.9, sill: 1.8, top: 3.2, type: 'rect' }, { c: 6.8, w: 0.9, sill: 1.8, top: 3.2, type: 'rect' }],
    };
    walls(poly, 5.2, 0.3, M.plaster, { skip: [1], openings: op, name: 'north' }).forEach((w) => add(w));
    add(slab(inset(poly, 0.15), 4.6, 4.95, M.plaster));
    // lift & stair core rising above the roof
    const core = p1.clone().addScaledVector(d2, 2.4).addScaledVector(d1, 7.8);
    add(obox(core, d2, [4.4, 10.8, 4.4], 0, M.plaster));
    add(obox(p1.clone().addScaledVector(d2, 1.0).addScaledVector(d1, 9.6), d2, [2.2, 6.4, 2.6], 0, M.stone));
    anim.northCore = core;
  }

  // ---------------- west wing (8 rooms on a corridor)
  {
    const TL = P(246, 99), TR = P(582, 132), BR = P(398, 1882), BL = P(56, 1848);
    const poly = [TL, TR, BR, BL];
    const wl = BL.distanceTo(TL);
    const parts = [280, 493, 711, 1014, 1210, 1406, 1702].map((y) => (y - 99) / (1848 - 99));
    const westOps = [];
    const bounds = [0, ...parts, 1];
    for (let i = 0; i < bounds.length - 1; i++) {
      const c = wl * (1 - (bounds[i] + bounds[i + 1]) / 2);
      westOps.push({ c, w: 1.4, sill: 1.0, top: 2.7, type: 'rect' });
    }
    const eastL = TR.distanceTo(BR);
    const eastOps = [];
    for (let s = 3; s < eastL - 4; s += 5.2) eastOps.push({ c: s, w: 1.3, sill: 1.0, top: 2.8, type: 'rect' });
    eastOps.push({ c: eastL - 2.2, w: 1.4, sill: 0, top: 2.6, type: 'rect' });
    const southOps = [{ c: 1.4, w: 0.5, sill: 0.9, top: 4.0, type: 'rect' }, { c: 4.6, w: 0.5, sill: 0.9, top: 4.0, type: 'rect' }];
    const ops = { 0: [{ c: 3, w: 1.2, sill: 1, top: 2.6, type: 'rect' }], 1: eastOps, 2: southOps, 3: westOps, mat: { 2: M.stone } };
    const ws = walls(poly, 5.4, 0.3, M.plaster, { openings: ops, name: 'wing' });
    ws.forEach((w) => { add(w); });
    ws.forEach((w, i) => ops[i].forEach((o) => { if (o.sill > 0) glaze(w, o, M, building, 0.4); }));
    add(slab(inset(poly, 0.15), 4.6, 5.0, M.plaster));
    add(slab(inset(poly, 0.15), 0, 0.15, M.marble, [], { cast: false }));
    // partitions + corridor wall
    const at = (fy, fx) => { const l = TL.clone().lerp(BL, fy), r = TR.clone().lerp(BR, fy); return l.lerp(r, fx); };
    for (const f of parts) add(wall({ a: at(f, 0.03), b: at(f, 0.63), h: 4.6, t: 0.15, inside: at(f + 0.01, 0.3), mat: M.plaster, name: 'part' }));
    for (let i = 0; i < bounds.length - 1; i++) {
      const f0 = bounds[i] + 0.004, f1 = bounds[i + 1] - 0.004;
      const gap = f0 + (f1 - f0) * 0.18;
      add(wall({ a: at(gap + 0.03, 0.63), b: at(f1, 0.63), h: 4.6, t: 0.15, inside: at((f0 + f1) / 2, 0.3), mat: M.plaster, name: 'corr' }));
      if (i > 0) add(wall({ a: at(f0, 0.63), b: at(gap, 0.63), h: 4.6, t: 0.15, inside: at((f0 + f1) / 2, 0.3), mat: M.plaster, name: 'corr' }));
    }
    // stone corner tower at the south end (as in the renders)
    anim.wing = { TL, TR, BR, BL };
  }

  // ---------------- rooms behind the qibla wall
  const alongBC = (s, o) => B.clone().addScaledVector(BC, s).addScaledVector(d2, o);
  {
    const imam = [alongBC(7.4, 0), alongBC(11.5, 0), alongBC(11.5, 2.3), alongBC(7.4, 2.3)];
    walls(imam, 4.4, 0.25, M.plaster, { skip: [0], openings: { 2: [{ c: 2, w: 1.2, sill: 1.1, top: 2.5, type: 'rect' }] }, name: 'imam' }).forEach((w) => add(w));
    add(slab(imam, 3.9, 4.3, M.plaster));
    const ctrl = [alongBC(15.2, 0), alongBC(23.4, 0), alongBC(23.4, 2.5), alongBC(15.2, 2.5)];
    const endWin = [{ c: 1.3, w: 1.1, sill: 2.3, top: 3.1, type: 'rect', mullion: false }, { c: 1.3, w: 1.1, sill: 4.4, top: 5.2, type: 'rect', mullion: false }];
    const cw = walls(ctrl, 7.0, 0.25, M.plaster, { skip: [0], openings: { 1: endWin, 2: [{ c: 3.6, w: 1.0, sill: 0, top: 2.4, type: 'rect' }] }, name: 'ctrl' });
    cw.forEach((w) => add(w));
    endWin.forEach((o) => glaze(cw[0], o, M, building, 0.5));
    add(wall({ a: alongBC(18.6, 0), b: alongBC(18.6, 2.3), h: 3.9, t: 0.15, inside: alongBC(20, 1), mat: M.plaster, name: 'ctrlp' }));
    add(slab(ctrl, 6.5, 6.9, M.plaster));
  }

  // ---------------- minaret: white shaft with a glowing slot and a lower
  // limestone pier, at the front corner of the hall (renders)
  {
    // front-left corner of the prayer hall, just proud of the entrance elevation
    const us = d2.clone(), up = d1.clone().negate();
    // back face on the entrance-façade line, left edge just clear of the annex
    const c = onDC(-0.2, 1.3);
    const a = 1.3, b = 1.3, H = 21.5;
    const L = (x, y) => c.clone().addScaledVector(us, x).addScaledVector(up, y);
    const poly = [L(-a, -b), L(a, -b), L(a, b), L(-a, b)];
    const slot = { c: 0.75, w: 0.36, sill: 2.4, top: H - 2.4, type: 'rect', transom: 40, mullion: false };
    const ws = walls(poly, H, 0.3, M.plaster, { openings: { 0: [slot], 2: [{ ...slot, c: 2 * a - 0.75 }] }, name: 'minaret' });
    ws.forEach((w) => add(w));
    glaze(ws[0], slot, M, building, 0.5); glaze(ws[2], { ...slot, c: 2 * a - 0.75 }, M, building, 0.5);
    add(slab(poly, H - 0.4, H, M.plaster));
    // limestone pier, proud on the right (hall side), two-thirds of the height
    add(obox(L(a + 0.6, -0.4), us, [1.2, 14.5, 2.9], 0, M.stone));
    anim.minaret = c;
  }

  // limestone tower on the CAD square by the qibla corner (renders, right side)
  {
    const c = P(1525, 1857), sz = 3.8;
    const L = (x, y) => c.clone().addScaledVector(d2, x).addScaledVector(d1, y);
    const poly = [L(-sz / 2, -sz / 2), L(sz / 2, -sz / 2), L(sz / 2, sz / 2), L(-sz / 2, sz / 2)];
    const wins = [{ c: 1.2, w: 0.55, sill: 4.6, top: 6.0, type: 'rect', mullion: false }, { c: 1.2, w: 0.55, sill: 6.9, top: 8.1, type: 'rect', mullion: false }];
    const ws = walls(poly, 9.6, 0.35, M.stone, { openings: { 2: wins }, name: 'tower' });
    ws.forEach((w) => add(w)); wins.forEach((o) => glaze(ws[2], o, M, building, 0.5));
    add(slab(poly, 9.2, 9.6, M.plaster));
    anim.tower = c;
  }

  // electrical room (limestone box by the tower)
  {
    const poly = [P(1638, 1646), P(1792, 1662), P(1772, 2250), P(1615, 2236)];
    walls(poly, 4.0, 0.25, M.stone, { openings: { 3: [{ c: 3, w: 1.4, sill: 0, top: 2.5, type: 'rect' }] }, name: 'elec' }).forEach((w) => add(w));
    add(slab(poly, 3.6, 4.0, M.plaster));
  }

  // the big freestanding limestone arch, right of the portal (renders)
  {
    const g = GATE.pos;
    const a = g.clone().addScaledVector(d2, -3.9), b = g.clone().addScaledVector(d2, 3.9);
    const w = wall({ a, b, h: 9.8, t: 0.95, inside: g.clone().addScaledVector(d1, -5), mat: M.stone,
      openings: [{ c: 3.9, w: 4.6, sill: 0, top: 8.3, type: 'arch' }], name: 'gate' });
    add(w);
    anim.gate = w;
  }

  // name wall (low stone wall with lettering, beside the approach)
  {
    const c = onDC(17.6, 9.0);
    add(obox(c, d2, [5.5, 1.4, 0.5], 0, M.stone));
    anim.signPos = c;
  }

  // ---------------- interior finishes of the prayer hall
  {
    const inA = inner; // inner corners A', B', C', D'
    const panel = (a, b, y0, y1, depth, mat, gaps = []) => {
      // thin panel along the inner face from a to b (Vector2), broken by gaps [[s0,s1],...]
      const L = a.distanceTo(b), dir = b.clone().sub(a).normalize();
      let n = new THREE.Vector2(-dir.y, dir.x); if (HALL.center.clone().sub(a).dot(n) < 0) n.negate();
      const cuts = [[0, 0], ...gaps.slice().sort((x, y) => x[0] - y[0]), [L, L]];
      for (let i = 0; i < cuts.length - 1; i++) {
        const s0 = cuts[i][1], s1 = cuts[i + 1][0];
        if (s1 - s0 < 0.05) continue;
        const c = a.clone().addScaledVector(dir, (s0 + s1) / 2).addScaledVector(n, depth / 2);
        add(obox(c, dir, [s1 - s0, y1 - y0, depth], y0, mat, { edges: true }));
      }
    };
    const [iA, iB, iC, iD] = inA;
    const fy = HALL.floor;
    // marble dado (0.95 m) around the hall, broken at openings
    const dcG = [[DOOR.s - DOOR.w / 2 - 0.2 - t, DOOR.s + DOOR.w / 2 + 0.2 - t]];
    panel(iD, iC, fy, fy + 0.95, 0.04, M.marble, dcG);
    panel(iA, iB, fy, fy + 0.95, 0.04, M.marble, [[3.2 - 1.2 - t, 3.2 + 1.2 - t]]);
    panel(iD, iA, fy, fy + 0.95, 0.04, M.marble);
    // qibla wall: marble to 5.4 m with a gilded band, broken at the mihrab and the imam door
    panel(iB, iC, fy, 5.4, 0.05, M.marble, [[mihS - 1.45 - t, mihS + 1.45 - t], [9.4 - 0.7 - t, 9.4 + 0.7 - t]]);
    panel(iB, iC, 5.4, 5.55, 0.08, M.gold, [[mihS - 1.45 - t, mihS + 1.45 - t]]);
    // timber ceiling: walnut battens across the hall, opening around the dome
    const bat = [];
    const wIn = HALL.wid - 2 * t, lIn = HALL.len - 2 * t;
    for (let k = 0.3; k < lIn; k += 0.55) {
      const a = iA.clone().addScaledVector(d1, k);
      // split around the dome hole
      const rel = a.clone().sub(HALL.dome);
      const along = -rel.dot(d2), perp = rel.dot(d1);
      const R = HALL.domeR + 0.25;
      const segs = [];
      if (Math.abs(perp) < R) { const hw = Math.sqrt(R * R - perp * perp); segs.push([0, along - hw], [along + hw, wIn]); } else segs.push([0, wIn]);
      for (const [s0, s1] of segs) {
        if (s1 - s0 < 0.1) continue;
        const g = new THREE.BoxGeometry(s1 - s0, 0.2, 0.075);
        const c = a.clone().addScaledVector(d2, (s0 + s1) / 2);
        g.rotateY(-Math.atan2(d2.y, d2.x)); g.translate(c.x, HALL.ceil - 0.1, c.y);
        bat.push(g);
      }
    }
    const bm = new THREE.Mesh(mergeGeometries(bat), M.walnut); bm.userData.edges = false; bm.castShadow = false; add(bm);
    // cove light under the ceiling all round
    for (const [a, b] of [[iA, iB], [iB, iC], [iC, iD], [iD, iA]]) {
      const L = a.distanceTo(b), dir = b.clone().sub(a).normalize();
      let n = new THREE.Vector2(-dir.y, dir.x); if (HALL.center.clone().sub(a).dot(n) < 0) n.negate();
      const c = a.clone().lerp(b, 0.5).addScaledVector(n, 0.08);
      const m = obox(c, dir, [L - 0.3, 0.04, 0.04], HALL.ceil - 0.32, M.ledIn, { edges: false }); m.castShadow = false; add(m);
    }
    // brass lanterns between the garden-side arches
    for (let s = 2.4 + 1.65; s < daFree - 1.5; s += 3.3) {
      const c = D.clone().addScaledVector(d1, -s).addScaledVector(d2, t + 0.18);
      add(obox(c, d1, [0.26, 0.55, 0.26], 3.2, M.lantern, { edges: true }));
      add(obox(c, d1, [0.34, 0.05, 0.34], 3.75, M.brass, { edges: false }));
    }
  }

  return { root, building, site, anim, blockOnDA, onDC, alongBC };
}

// ---------------------------------------------------------------- site & landscape
export function buildSite(M, model) {
  const site = model.site;
  const { d1, d2 } = HALL;
  // south street: near (plot) edge, from the CAD linework
  const sA = new THREE.Vector2(-4.4, 33.75), sB = new THREE.Vector2(36.9, 5.6);
  const sDir = sB.clone().sub(sA).normalize();
  const sN = new THREE.Vector2(-sDir.y, sDir.x); if (sN.dot(new THREE.Vector2(0, 1)) < 0) sN.negate();
  const S = (t, o) => sA.clone().addScaledVector(sDir, t).addScaledVector(sN, o);
  // ground: paving plaza (everything), street on top
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.paving);
  ground.position.y = -0.04;
  { const uv = ground.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 900, uv.getY(i) * 900); }
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData.edges = false;
  site.add(ground);
  const strip = (o0, o1, y, mat, t0 = -140, t1 = 140) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    const pts = [S(t0, o0), S(t1, o0), S(t1, o1), S(t0, o1)];
    const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.y)));
    const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); geo.translate(0, y, 0);
    // planar uvs in metres
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    g.geometry = geo; g.receiveShadow = true; g.userData.edges = false;
    site.add(g); return g;
  };
  strip(3.2, 16.8, 0.01, M.asphalt);
  // kerbs
  for (const o of [3.0, 16.8]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(280, 0.16, 0.22), M.kerb);
    const c = S(0, o + 0.1); k.position.set(c.x, 0.08, c.y); k.rotation.y = -Math.atan2(sDir.y, sDir.x);
    k.receiveShadow = true; k.userData.edges = false; site.add(k);
  }
  // lane markings
  for (let t = -130; t < 130; t += 6) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.15), M.led);
    const c = S(t, 10); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(-sDir.y, sDir.x) * -1;
    m.position.set(c.x, 0.02, c.y); m.rotation.set(-Math.PI / 2, 0, -Math.atan2(sDir.y, sDir.x)); m.userData.edges = false;
    m.material = M.kerb; site.add(m);
  }

  // neighbours across the south street and around (simple white massing)
  const nb = [];
  const R = (() => { let s = 5; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let t = -110; t < 130; t += 24) {
    const w = 15 + R() * 5, dpt = 13 + R() * 6, h = 7 + Math.floor(R() * 3) * 3.4;
    const c = S(t, 20 + 4 + dpt / 2);
    nb.push(obox(c, sDir, [w, h, dpt], 0, M.neighbour));
    if (R() > 0.5) nb.push(obox(S(t + 3, 20 + 4 + dpt * 0.3), sDir, [5, h + 3.4, 5], 0, M.neighbour));
  }
  // north-west & north-east context
  for (const [x, z, w, d, h, a] of [[-60, -40, 22, 16, 10, 0.6], [-75, -5, 18, 18, 7, 0.6], [-55, 40, 20, 16, 10, 0.6], [-90, 30, 18, 14, 7, 0.6],
    [10, -75, 20, 18, 7, 0.6], [45, -60, 18, 16, 10, 0.6], [80, 30, 20, 18, 7, 0.6], [95, -10, 16, 14, 10, 0.6], [-30, -78, 22, 16, 10, 0.6]]) {
    nb.push(obox(new THREE.Vector2(x, z), sDir, [w, h, d], 0, M.neighbour));
  }
  nb.forEach((m) => { m.userData.neighbour = true; site.add(m); });

  // planting beds (outlines follow the drawing)
  const beds = [
    [[-3.6, 32.6], [3.75, 25.3], [3.1, 30.4]],
    [[15.6, 16.9], [23.1, 4.4], [28.75, 8.1]],
    [[25.6, -3.75], [36.9, 3.1], [29.4, -8.75]],
    [[-47.5, -8.1], [-38, -14.4], [-43, -1.25]],
  ].map((b) => b.map(([x, z]) => new THREE.Vector2(x, z)));
  // strips
  const stripBed = (a, b, w) => { const d = b.clone().sub(a).normalize(); const n = new THREE.Vector2(-d.y, d.x).multiplyScalar(w / 2); return [a.clone().add(n), b.clone().add(n), b.clone().sub(n), a.clone().sub(n)]; };
  beds.push(stripBed(new THREE.Vector2(-12.5, -35), new THREE.Vector2(20, -19.4), 2.2));
  beds.push(stripBed(new THREE.Vector2(-19.1, -18.5), new THREE.Vector2(-20.2, 10.5), 1.8));
  // forecourt beds flanking the approach (renders)
  const onDC = model.onDC;
  beds.push([onDC(4.2, 3.0), onDC(7.8, 3.0), onDC(7.8, 6.4), onDC(4.2, 7.2)]);
  beds.push([onDC(13.4, 3.4), onDC(17.6, 3.4), onDC(17.6, 7.0), onDC(13.4, 6.0)]);
  beds.push([onDC(23.0, 3.4), onDC(28.0, 3.4), onDC(28.0, 8.0), onDC(23.0, 7.0)]);
  // garden court between wing and hall (pebbles + olive)
  const court = [P(491, 1000), P(840, 1000), P(536, 1580), P(428, 1580)];

  const plants = [];
  const soilMeshes = [];
  for (const b of beds) {
    const kerb = new THREE.Shape(b.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ExtrudeGeometry(kerb, { depth: 0.22, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, M.soil); m.receiveShadow = true; m.userData.edges = true; site.add(m); soilMeshes.push(m);
  }
  {
    const s = new THREE.Shape(court.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, M.rock); m.receiveShadow = true; m.userData.edges = false; site.add(m);
  }

  // shrubs: instanced blobs scattered inside beds
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (((a.y > p.y) !== (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) c = !c; } return c; };
  const shrubGeo = mergeGeometries([0, 1, 2, 3].map((k) => {
    const g = new THREE.IcosahedronGeometry(0.32 + (k % 2) * 0.08, 2);
    const pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      const n = 0.78 + 0.22 * Math.sin(x * 17.1 + z * 11.7 + k) * Math.cos(y * 13.3 + x * 5.1);
      pp.setXYZ(i, x * n, y * n * 0.85, z * n);
    }
    const a = k * 1.9; g.translate(Math.cos(a) * 0.28 * (k ? 1 : 0), 0.05 * k, Math.sin(a) * 0.28 * (k ? 1 : 0));
    return g.toNonIndexed();
  }));
  shrubGeo.computeVertexNormals();
  const types = [[M.leaf, 0.55], [M.olive, 0.15], [M.flowerPurple, 0.18], [M.flowerWhite, 0.06], [M.flowerYellow, 0.06]];
  const buckets = types.map(() => []);
  const rr = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (const b of [...beds, court]) {
    const xs = b.map((p) => p.x), zs = b.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const area = (x1 - x0) * (z1 - z0);
    const n = Math.min(900, area * (b === court ? 0.6 : 3.2));
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector2(x0 + rr() * (x1 - x0), z0 + rr() * (z1 - z0));
      if (!inPoly(p, b)) continue;
      let k = 0, r = rr(); while (k < types.length - 1 && r > types[k][1]) { r -= types[k][1]; k++; }
      const s = (k >= 2 ? 0.45 : 0.7) + rr() * (k >= 2 ? 0.35 : 0.8);
      buckets[k].push([p.x, 0.2 + s * 0.22, p.y, s, rr() * 6.28]);
    }
  }
  const dummy = new THREE.Object3D();
  buckets.forEach((list, k) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(shrubGeo, types[k][0], list.length);
    list.forEach(([x, y, z, s, r], i) => { dummy.position.set(x, y, z); dummy.scale.set(s, s, s); dummy.rotation.set(0, r, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    im.castShadow = true; im.receiveShadow = true; im.userData.edges = false;
    site.add(im); plants.push(im);
  });

  // palms
  const palm = makePalmFactory(M);
  const palmSpots = [[-9.4, -34.4], [-1.25, -29.75], [5.6, -26.25], [16.25, -20.6], [-18.1, -16.25], [-19, -5.6], [-20, 5.6],
    [-43.75, -6.25], [29.4, -2.75], [23.1, 8.1], [1.25, 28.0]].map(([x, z]) => new THREE.Vector2(x, z));
  palmSpots.push(onDC(5.0, 5.6), onDC(7.0, 4.2), onDC(16.4, 5.0), onDC(25.4, 5.6), onDC(1.6, 14.5), onDC(19.5, 13.5), onDC(-6.5, 15.5));
  palmSpots.forEach((p, i) => { const pm = palm(8 + (i * 37 % 5) * 0.7, i); pm.position.set(p.x, 0, p.y); pm.rotation.y = i * 1.7; site.add(pm); });

  // olive trees
  const olive = makeOliveFactory(M);
  [onDC(6.6, 6.2), onDC(14.8, 5.0), onDC(-3.6, 19.5), onDC(15.5, 17.5), P(640, 1300), onDC(-8, 13)].forEach((p, i) => { const o = olive(i); o.position.set(p.x, 0, p.y); site.add(o); });

  // boulders
  const rockGeo = new THREE.DodecahedronGeometry(1, 1);
  {
    const pp = rockGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const k = 0.8 + ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.35; pp.setXYZ(i, pp.getX(i) * k, pp.getY(i) * k * 0.6, pp.getZ(i) * k); }
    rockGeo.computeVertexNormals();
  }
  [[onDC(4.9, 3.9), 1.0], [onDC(16.9, 4.2), 0.8], [onDC(13.9, 6.2), 0.6], [onDC(7.0, 6.0), 0.7]].forEach(([p, s]) => {
    const r = new THREE.Mesh(rockGeo, M.rock); r.position.set(p.x, 0.3 * s, p.y); r.scale.setScalar(s); r.rotation.y = s * 5;
    r.castShadow = r.receiveShadow = true; r.userData.edges = true; site.add(r);
  });

  // linear lights along the approach and bollards
  const ledLine = (a, b) => {
    const len = a.distanceTo(b), d = b.clone().sub(a);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.04), M.led);
    const c = a.clone().add(b).multiplyScalar(0.5); m.position.set(c.x, 0.012, c.y); m.rotation.y = -Math.atan2(d.y, d.x);
    m.userData.edges = false; site.add(m);
  };
  ledLine(onDC(DOOR.s - 1.7, 3.2), onDC(DOOR.s - 1.7, 25)); ledLine(onDC(DOOR.s + 1.7, 3.2), onDC(DOOR.s + 1.7, 25));
  const approachStart = onDC(DOOR.s, 23.5);
  const bollard = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 10);
  for (let o = 4.4; o <= 24; o += 2.8) for (const s of [DOOR.s - 2.4, DOOR.s + 2.4]) {
    const p = onDC(s, o); const b = new THREE.Mesh(bollard, M.bronze); b.position.set(p.x, 0.35, p.y); b.castShadow = true; b.userData.edges = false; site.add(b);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.06, 10), M.led); l.position.set(p.x, 0.6, p.y); l.userData.edges = false; site.add(l);
  }

  return { street: { sA, sB, sDir, sN, S }, approachStart, plants, beds, court };
}

function makePalmFactory(M) {
  const cache = {};
  return (height, seed) => {
    const key = Math.round(height * 2) + ':' + (seed % 3);
    if (!cache[key]) {
      const R = (() => { let s = seed * 97 + 13; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
      const lean = new THREE.Vector3((R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.5);
      const trunkPts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; trunkPts.push(new THREE.Vector3(lean.x * t * t * height * 0.15, t * height, lean.z * t * t * height * 0.15)); }
      const curve = new THREE.CatmullRomCurve3(trunkPts);
      const tg = new THREE.TubeGeometry(curve, 20, 0.24, 10, false);
      // taper + uv tiling
      const p = tg.attributes.position;
      const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * height * 1.6);
      const top = trunkPts[10];
      const fronds = [];
      const N = 22;
      for (let i = 0; i < N; i++) {
        const len = 3.0 + R() * 1.0, wid = 1.25;
        const g = new THREE.PlaneGeometry(len, wid, 10, 2);
        g.translate(len / 2, 0, 0);
        const pp = g.attributes.position;
        const droop = 0.25 + R() * 0.6 + (i % 3 === 0 ? 0.6 : 0);
        for (let k = 0; k < pp.count; k++) {
          const x = pp.getX(k), y = pp.getY(k);
          const t = x / len;
          pp.setXYZ(k, x, -droop * t * t * len * 0.55 + Math.abs(y) * 0.25, y * (1 - t * 0.6));
        }
        const rise = (i % 3 === 0 ? -0.1 : 0.35) + R() * 0.3;
        g.rotateZ(rise);
        g.rotateY((i / N) * Math.PI * 2 + R() * 0.3);
        g.translate(top.x, top.y, top.z);
        g.computeVertexNormals();
        fronds.push(g);
      }
      const crown = new THREE.SphereGeometry(0.42, 10, 8); crown.translate(top.x, top.y - 0.1, top.z);
      cache[key] = { trunk: tg, fronds: mergeGeometries(fronds), crown };
    }
    const g = new THREE.Group();
    const t = new THREE.Mesh(cache[key].trunk, M.trunk); t.castShadow = true; t.receiveShadow = true;
    const f = new THREE.Mesh(cache[key].fronds, M.frond); f.castShadow = true; f.receiveShadow = true;
    const c = new THREE.Mesh(cache[key].crown, M.trunk);
    [t, f, c].forEach((m) => (m.userData.edges = false));
    g.add(t, f, c);
    return g;
  };
}

function makeOliveFactory(M) {
  return (seed) => {
    const R = (() => { let s = seed * 31 + 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 7), M.trunk);
    trunk.position.y = 0.9; trunk.rotation.z = (R() - 0.5) * 0.3; trunk.castShadow = true; trunk.userData.edges = false;
    g.add(trunk);
    const blobs = [];
    for (let i = 0; i < 46; i++) {
      const b = new THREE.IcosahedronGeometry(0.22 + R() * 0.26, 1);
      const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 1.45;
      b.scale(1, 0.7, 1);
      b.translate(Math.cos(a) * r, 2.15 + R() * 1.1 - r * 0.25, Math.sin(a) * r);
      b.deleteAttribute('uv');
      blobs.push(b);
    }
    for (let i = 0; i < 4; i++) {
      const br = new THREE.CylinderGeometry(0.04, 0.08, 1.4, 5);
      br.rotateZ(0.7); br.rotateY(i * 1.6 + R()); br.translate(0, 1.95, 0); br.deleteAttribute("uv"); blobs.push(br.toNonIndexed());
    }
    const c = new THREE.Mesh(mergeGeometries(blobs), M.olive); c.castShadow = true; c.userData.edges = false;
    g.add(c);
    return g;
  };
}

// ---- exported building blocks reused by the SketchUp-driven model
export { archPath, rectPath, wall, glaze, slab, obox, walls, inset, makePalmFactory, makeOliveFactory, lineIntersect };
