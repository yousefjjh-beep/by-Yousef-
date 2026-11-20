// Al-Kareem Mosque — the building is the SketchUp model (KAreen.skp → COLLADA →
// tools/build_model.py). This module loads it, gives it the page's materials and
// adds the details taken from the renders: pointed arch heads with bronze frames
// on the front windows, the bronze dome, walnut door leaves, the name in bronze,
// the furnished prayer hall and the landscape.
import * as THREE from 'three';
import { mergeGeometries } from '../lib/addons/BufferGeometryUtils.js';
import { archPoints, obox, slab, makePalmFactory, makeOliveFactory } from './kit.js';

// building axes (SketchUp xy rotated 61°) → three.js world (x, height, -y)
const A = THREE.MathUtils.degToRad(61);
const Ux = Math.cos(A), Uy = Math.sin(A), Vx = -Math.sin(A), Vy = Math.cos(A);
export const FLOOR = 0.61;
export const EYE = FLOOR + 1.65;
export const W2 = (u, v) => new THREE.Vector2(u * Ux + v * Vx, -(u * Uy + v * Vy));
export const W3 = (u, v, h = 0) => { const p = W2(u, v); return new THREE.Vector3(p.x, h, p.y); };
export const DU = W2(1, 0).sub(W2(0, 0)).normalize();   // +u in world xz
export const DV = W2(0, 1).sub(W2(0, 0)).normalize();   // +v in world xz

export const HALL = {
  u0: 19.23, u1: 51.1, v0: 18.7, v1: 35.8, roof: 10.21, ceil: 9.86,
  dome: { u: 34.45, v: 22.55, r: 3.0, top: 14.54 },
  mihrab: { u: 34.5, v: 18.7 },
};
HALL.center = W2((HALL.u0 + HALL.u1) / 2, (HALL.v0 + HALL.v1) / 2);
HALL.half = new THREE.Vector2((HALL.u1 - HALL.u0) / 2, (HALL.v1 - HALL.v0) / 2);
HALL.domeC = W2(HALL.dome.u, HALL.dome.v);
export const DOOR = { u: 18.85, v0: 28.55, v1: 31.55, h: 4.0 };
DOOR.vc = (DOOR.v0 + DOOR.v1) / 2;
export const PORCH = { u0: 15.74, u1: 19.05, v0: 27.15, v1: 35.93, top: 5.49 };

const CLASS_MAT = {
  plaster: 'plaster', plaster_in: 'plasterIn', stone: 'stone', stone_in: 'plasterIn', roof: 'plaster', roof_in: 'ceiling',
  glass: 'glass', wood: 'walnutTwo', screen: 'bronzeTwo', dome: 'bronze', paving: 'paving',
};

export async function loadModel(M) {
  const [meta, bin, glazing] = await Promise.all([
    fetch('model/kareem.json').then((r) => r.json()),
    fetch('model/kareem-geo.json').then((r) => r.json()).then((j) => Uint8Array.from(atob(j.b64), (c) => c.charCodeAt(0)).buffer),
    fetch('model/glazing.json').then((r) => r.json()),
  ]);
  const root = new THREE.Group(), building = new THREE.Group(), site = new THREE.Group();
  root.add(building, site);
  const anim = {};
  for (const [c, { offset, count }] of Object.entries(meta.classes)) {
    const f = new Float32Array(bin, offset, count * 8);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(f.slice(0, count * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(f.slice(count * 3, count * 6), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(f.slice(count * 6, count * 8), 2));
    const m = new THREE.Mesh(g, M[CLASS_MAT[c]] || M.plaster);
    m.castShadow = c !== 'glass' && c !== 'paving'; m.receiveShadow = true;
    m.userData.edges = c !== 'glass';
    m.userData.edgeAngle = c === 'dome' ? 40 : 24;
    m.name = 'skp-' + c;
    (c === 'paving' ? site : building).add(m);
    if (c === 'dome') anim.dome = m;
  }
  const add = (o, g = building) => { g.add(o); return o; };

  // ---------------- pointed arch heads on the two tall front windows (renders)
  for (const gz of glazing.filter((g) => g.axis === 'u' && Math.abs(g.at - 19.0) < 0.05 && g.z1 - g.z0 > 7 && g.a1 - g.a0 < 2.5)) {
    const x0 = gz.a0, x1 = gz.a1, top = gz.z1, w = x1 - x0, mid = (x0 + x1) / 2;
    const pts = archPoints(x0, x1, gz.z0, top);
    const spring = top - Math.sqrt((w * 0.9) ** 2 - (w * 0.9 - w / 2) ** 2);
    const arc = pts.filter(([, y]) => y >= spring - 1e-3);
    const half = arc.slice(0, Math.ceil(arc.length / 2));          // left half up to the apex
    const toW = (a, y, d) => { const p = W2(gz.at - d, a); return new THREE.Vector3(p.x, y, p.y); };
    const spandrel = (side) => {
      const s = side < 0 ? half : half.map(([x, y]) => [2 * mid - x, y]);
      const poly = [[side < 0 ? x0 : x1, top + 0.01], ...s];
      const sh = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false, curveSegments: 4 });
      // local (along v, height, into the wall) → world; right-handed so faces stay front-facing
      const X = W3(0, 1).sub(W3(0, 0)).normalize(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3().crossVectors(X, Y);
      const o = toW(0, 0, 0.12);   // 12 cm proud of the glass, 8 cm deep
      g.applyMatrix4(new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(o.x, 0, o.z));
      const m = new THREE.Mesh(g, M.plaster); m.castShadow = m.receiveShadow = true; add(m);
    };
    spandrel(-1); spandrel(1);
    // bronze frame: arch ring, mullion, transoms
    const ring = new THREE.CatmullRomCurve3(arc.map(([a, y]) => toW(a, y, 0.1)));
    add(new THREE.Mesh(new THREE.TubeGeometry(ring, 48, 0.045, 6, false), M.bronze)).userData.edges = false;
    const bar = (a0, y0, a1, y1, r = 0.035) => {
      const c = new THREE.LineCurve3(toW(a0, y0, 0.1), toW(a1, y1, 0.1));
      add(new THREE.Mesh(new THREE.TubeGeometry(c, 1, r, 5, false), M.bronze)).userData.edges = false;
    };
    bar(x0 + 0.04, gz.z0, x0 + 0.04, spring); bar(x1 - 0.04, gz.z0, x1 - 0.04, spring);
    bar(mid, gz.z0, mid, top - 0.05, 0.028);
    for (let y = gz.z0 + 1.7; y < spring - 0.3; y += 1.7) bar(x0, y, x1, y, 0.026);
  }

  // ---------------- walnut door leaves in the limestone porch, hinged at the jambs
  {
    anim.leaves = [];
    const leafW = (DOOR.v1 - DOOR.v0) / 2 - 0.02, leafH = DOOR.h - 0.04;
    const rotBase = -Math.atan2(DV.y, DV.x);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      const hinge = W2(DOOR.u, side < 0 ? DOOR.v0 : DOOR.v1);
      pivot.position.set(hinge.x, FLOOR, hinge.y); pivot.rotation.y = rotBase;
      const lg = new THREE.BoxGeometry(leafW, leafH, 0.1);
      { const uv = lg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * leafW * 0.35, uv.getY(i) * leafH * 0.12); }
      const leaf = new THREE.Mesh(lg, M.walnutDoor);
      leaf.position.set(-side * leafW / 2, leafH / 2, 0); leaf.castShadow = true; leaf.userData.edges = false;
      pivot.add(leaf);
      for (let k = 0; k < 7; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.82, 0.025, 0.02), M.brass);
        b.position.set(-side * leafW / 2, 0.45 + k * 0.5, 0.06); pivot.add(b);
      }
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 8), M.brass);
      med.rotation.x = Math.PI / 2; med.position.set(-side * (leafW - 0.06), 1.9, 0.065); pivot.add(med);
      pivot.userData.side = side; pivot.userData.base = rotBase;
      add(pivot); anim.leaves.push(pivot);
    }
  }
  anim.plaque = { pos: W2(PORCH.u0 - 0.02, (PORCH.v0 + PORCH.v1) / 2), y: 4.55, rotY: Math.atan2(-DU.x, -DU.y) };

  // ---------------- prayer hall interior: carpet, timber ceiling, cove light, chandelier, mihrab frame
  {
    const inset = 0.3 + 0.5;
    const cu0 = HALL.u0 + inset, cu1 = HALL.u1 - inset, cv0 = HALL.v0 + inset, cv1 = HALL.v1 - inset;
    const poly = [W2(cu0, cv0), W2(cu1, cv0), W2(cu1, cv1), W2(cu0, cv1)];
    const s = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR + 0.015, 0);
    const pos = g.attributes.position, uv = g.attributes.uv, o = W2(0, cv0);
    // rows parallel to the qibla wall (−v side), the prayer band toward it
    for (let i = 0; i < pos.count; i++) {
      const p = new THREE.Vector2(pos.getX(i), pos.getZ(i));
      uv.setXY(i, p.dot(DU), -(p.clone().sub(o)).dot(DV));
    }
    const m = new THREE.Mesh(g, M.carpet); m.receiveShadow = true; m.userData.edges = false; add(m);
    anim.carpetRect = { cu0, cu1, cv0, cv1 };
    // walnut battens across the hall, opening round the dome
    const bats = [];
    for (let u = HALL.u0 + 0.6; u < HALL.u1 - 0.4; u += 0.6) {
      const du = u - HALL.dome.u, R = HALL.dome.r + 0.3;
      const segs = Math.abs(du) < R ? [[HALL.v0 + 0.3, HALL.dome.v - Math.sqrt(R * R - du * du)], [HALL.dome.v + Math.sqrt(R * R - du * du), HALL.v1 - 0.3]] : [[HALL.v0 + 0.3, HALL.v1 - 0.3]];
      for (const [a, b] of segs) {
        if (b - a < 0.2) continue;
        const c = W2(u, (a + b) / 2);
        const bg = new THREE.BoxGeometry(b - a, 0.22, 0.08);
        bg.rotateY(-Math.atan2(DV.y, DV.x)); bg.translate(c.x, HALL.ceil - 0.11, c.y); bats.push(bg);
      }
    }
    const bm = new THREE.Mesh(mergeGeometries(bats), M.walnut); bm.userData.edges = false; add(bm);
    for (const [a, b] of [[W2(HALL.u0 + 0.35, HALL.v0 + 0.4), W2(HALL.u1 - 0.35, HALL.v0 + 0.4)], [W2(HALL.u0 + 0.35, HALL.v1 - 0.4), W2(HALL.u1 - 0.35, HALL.v1 - 0.4)]]) {
      const d = b.clone().sub(a); const c = a.clone().add(b).multiplyScalar(0.5);
      const cv = obox(c, d.clone().normalize(), [d.length(), 0.04, 0.05], HALL.ceil - 0.36, M.ledIn, { edges: false }); cv.castShadow = false; add(cv);
    }
    // chandelier under the dome
    const ch = new THREE.Group(); const y = 5.6;
    [[2.4, y, 44], [1.55, y + 0.6, 30], [0.8, y + 1.15, 16]].forEach(([r, yy, n]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 96), M.brass); ring.rotation.x = Math.PI / 2; ring.position.y = yy; ch.add(ring);
      const bl = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const b = new THREE.SphereGeometry(0.06, 8, 6); b.translate(Math.cos(a) * r, yy + 0.09, Math.sin(a) * r); bl.push(b); }
      ch.add(new THREE.Mesh(mergeGeometries(bl), M.bulb));
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, top = new THREE.Vector3(Math.cos(a) * 0.4, 12.6, Math.sin(a) * 0.4), bot = new THREE.Vector3(Math.cos(a) * 2.4, y, Math.sin(a) * 2.4);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, top.distanceTo(bot), 4), M.brass);
      c.position.copy(top).add(bot).multiplyScalar(0.5); c.lookAt(top); c.rotateX(Math.PI / 2); ch.add(c);
    }
    ch.traverse((x) => { if (x.isMesh) x.userData.edges = false; });
    ch.position.set(HALL.domeC.x, 0, HALL.domeC.y); add(ch); anim.chandelier = ch;
    // inner shell of the dome, gilded, seen from the hall through the opening in the ceiling
    const prof = [[2.95, 0], [2.97, 0.6], [2.85, 1.5], [2.45, 2.4], [1.85, 3.1], [1.1, 3.6], [0.45, 3.9], [0, 3.98]];
    const pts = new THREE.SplineCurve(prof.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(32);
    const dg = new THREE.LatheGeometry(pts, 96); dg.translate(HALL.domeC.x, 10.42, HALL.domeC.y);
    const dm = new THREE.Mesh(dg, M.domeIn); dm.userData.edges = false; add(dm);
    // drum ring at the ceiling line
    const ring = new THREE.Mesh(new THREE.TorusGeometry(HALL.dome.r - 0.02, 0.06, 8, 96), M.gold); ring.rotation.x = Math.PI / 2;
    ring.position.set(HALL.domeC.x, HALL.ceil - 0.25, HALL.domeC.y); ring.userData.edges = false; add(ring);
    const shaft = new THREE.CylinderGeometry(HALL.dome.r, HALL.dome.r, 10.45 - (HALL.ceil - 0.25), 64, 1, true);
    const sm = new THREE.Mesh(shaft, M.domeIn); sm.position.set(HALL.domeC.x, (10.45 + HALL.ceil - 0.25) / 2, HALL.domeC.y); sm.userData.edges = false; add(sm);
    // gilded frame round the mihrab arch on the hall side of the qibla wall
    const gm = glazing.find((g) => g.axis === 'v' && Math.abs(g.at - 17.6) < 0.1 && g.z1 > 4.4);
    const a0 = 33.24, a1 = 35.8;
    const ap = archPoints(a0 - 0.12, a1 + 0.12, FLOOR, 4.62);
    const curve = new THREE.CatmullRomCurve3(ap.map(([a, yy]) => { const p = W2(a, HALL.v0 + 0.32); return new THREE.Vector3(p.x, yy, p.y); }));
    const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.07, 6, false), M.gold); tm.userData.edges = false; add(tm);
    anim.mihrabTop = 4.62;
    // brass lanterns along the long walls
    for (let u = HALL.u0 + 3.5; u < HALL.u1 - 2; u += 4.2) for (const v of [HALL.v1 - 0.5]) {
      const c = W2(u, v); add(obox(c, DU, [0.28, 0.6, 0.28], 3.4, M.lantern)); add(obox(c, DU, [0.36, 0.05, 0.36], 4.0, M.brass, { edges: false }));
    }
  }
  return { root, building, site, anim, glazing };
}

// ---------------- site: plate edges, streets, planting, palms, lights
export function buildSite(M, model) {
  const site = model.site;
  // ground beyond the site plate (street level a touch below the plaza)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.paving);
  { const uv = ground.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 900, uv.getY(i) * 900); }
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.56; ground.receiveShadow = true; ground.userData.edges = false;
  site.add(ground);
  // the plate is axis-aligned in SketchUp: x -38.79..16.21, y 20.04..97.04 → streets south and west of it
  const plate = { x0: -38.79, x1: 16.21, z0: -97.04, z1: -20.04 };
  const road = (x0, z0, x1, z1) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0), uv.getY(i) * (z1 - z0));
    const m = new THREE.Mesh(g, M.asphalt); m.position.set((x0 + x1) / 2, 0.57, (z0 + z1) / 2); m.receiveShadow = true; m.userData.edges = false; site.add(m);
  };
  road(-200, plate.z1 + 3.5, 200, plate.z1 + 17.5);               // south street, 14 m carriageway
  road(plate.x0 - 17.5, -300, plate.x0 - 3.5, plate.z1 + 3.5);     // west street
  for (const z of [plate.z1 + 3.4, plate.z1 + 17.6]) { const k = new THREE.Mesh(new THREE.BoxGeometry(400, 0.15, 0.22), M.kerb); k.position.set(0, 0.6, z); k.userData.edges = false; site.add(k); }
  for (const x of [plate.x0 - 3.4, plate.x0 - 17.6]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 400), M.kerb); k.position.set(x, 0.6, -100); k.userData.edges = false; site.add(k); }
  for (let x = -190; x < 190; x += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.15), M.kerb); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.58, plate.z1 + 10.5); d.userData.edges = false; site.add(d); }
  // neighbours: simple white massing across the streets
  const R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let x = -120; x < 120; x += 23) { const w = 15 + R() * 5, d = 14 + R() * 6, h = 7 + Math.floor(R() * 3) * 3.4; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.neighbour); m.position.set(x, 0.56 + h / 2, plate.z1 + 22 + d / 2); m.castShadow = m.receiveShadow = true; site.add(m); }
  for (let z = -200; z < -20; z += 23) { const w = 14 + R() * 5, d = 15 + R() * 5, h = 7 + Math.floor(R() * 3) * 3.4; const m = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), M.neighbour); m.position.set(plate.x0 - 22 - d / 2, 0.56 + h / 2, z); m.castShadow = m.receiveShadow = true; site.add(m); }

  // planting beds on the plaza (as in the renders: lavender, rosemary, olives, palms)
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (((a.y > p.y) !== (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) c = !c; } return c; };
  const bedUV = [
    [[7.0, 34.0], [13.6, 34.0], [13.6, 41.0], [5.0, 41.0]],     // in front of the porch, north of the door axis
    [[8.0, 21.0], [13.8, 21.0], [13.8, 26.5], [9.6, 26.5]],     // in front of the arched windows
    [[34.0, 4.5], [44.0, 6.0], [44.0, 12.0], [34.0, 12.0]],     // beyond the service block
    [[52.5, 14.0], [60.0, 14.0], [60.0, 24.0], [52.5, 24.0]],
    [[56.0, 34.0], [64.0, 34.0], [64.0, 44.0], [56.0, 44.0]],
  ];
  const beds = bedUV.map((b) => b.map(([u, v]) => W2(u, v)));
  for (const b of beds) {
    const sh = new THREE.Shape(b.map((p) => new THREE.Vector2(p.x, -p.y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, FLOOR, 0);
    const m = new THREE.Mesh(g, M.soil); m.receiveShadow = true; site.add(m);
  }
  const shrubGeo = mergeGeometries([0, 1, 2, 3].map((k) => {
    const g = new THREE.IcosahedronGeometry(0.32 + (k % 2) * 0.08, 2); const pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i); const n = 0.78 + 0.22 * Math.sin(x * 17.1 + z * 11.7 + k) * Math.cos(y * 13.3 + x * 5.1); pp.setXYZ(i, x * n, y * n * 0.85, z * n); }
    const a = k * 1.9; g.translate(Math.cos(a) * 0.28 * (k ? 1 : 0), 0.05 * k, Math.sin(a) * 0.28 * (k ? 1 : 0)); g.deleteAttribute('uv'); return g;
  }));
  shrubGeo.computeVertexNormals();
  const types = [[M.leaf, 0.5], [M.olive, 0.15], [M.flowerPurple, 0.22], [M.flowerWhite, 0.05], [M.flowerYellow, 0.08]];
  const buckets = types.map(() => []); const rr = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (const b of beds) {
    const xs = b.map((p) => p.x), zs = b.map((p) => p.y); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const n = Math.min(900, (x1 - x0) * (z1 - z0) * 3.2);
    for (let i = 0; i < n; i++) { const p = new THREE.Vector2(x0 + rr() * (x1 - x0), z0 + rr() * (z1 - z0)); if (!inPoly(p, b)) continue; let k = 0, r = rr(); while (k < types.length - 1 && r > types[k][1]) { r -= types[k][1]; k++; } const s = (k >= 2 ? 0.45 : 0.7) + rr() * (k >= 2 ? 0.35 : 0.8); buckets[k].push([p.x, FLOOR + 0.25 + s * 0.2, p.y, s, rr() * 6.28]); }
  }
  const dummy = new THREE.Object3D();
  buckets.forEach((list, k) => { if (!list.length) return; const im = new THREE.InstancedMesh(shrubGeo, types[k][0], list.length); list.forEach(([x, y, z, s, r], i) => { dummy.position.set(x, y, z); dummy.scale.setScalar(s); dummy.rotation.set(0, r, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.castShadow = im.receiveShadow = true; im.userData.edges = false; site.add(im); });
  const palm = makePalmFactory(M);
  [[6.5, 37.5], [10.5, 39.5], [12.0, 23.0], [39.0, 8.5], [56.0, 18.0], [59.5, 39.0], [3.0, 45.0], [-2.0, 30.0]].forEach(([u, v], i) => { const p = W2(u, v); const pm = palm(8 + (i * 37 % 5) * 0.8, i); pm.position.set(p.x, FLOOR, p.y); pm.rotation.y = i * 1.7; site.add(pm); });
  const olive = makeOliveFactory(M);
  [[9.5, 24.5], [8.6, 36.0], [42.0, 10.0], [61.0, 42.0]].forEach(([u, v], i) => { const p = W2(u, v); const o = olive(i); o.position.set(p.x, FLOOR, p.y); site.add(o); });
  // path lights along the façade and the door axis
  const led = (a, b) => { const d = b.clone().sub(a), c = a.clone().add(b).multiplyScalar(0.5); const m = new THREE.Mesh(new THREE.BoxGeometry(d.length(), 0.02, 0.045), M.led); m.position.set(c.x, FLOOR + 0.012, c.y); m.rotation.y = -Math.atan2(d.y, d.x); m.userData.edges = false; site.add(m); };
  led(W2(14.6, 14), W2(14.6, 34)); led(W2(6.0, 28.2), W2(15.6, 28.2)); led(W2(6.0, 31.9), W2(15.6, 31.9));
  const bol = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 10);
  for (let v = 15; v <= 26; v += 2.75) { const p = W2(14.0, v); const b = new THREE.Mesh(bol, M.bronze); b.position.set(p.x, FLOOR + 0.35, p.y); b.castShadow = true; b.userData.edges = false; site.add(b); }
  // low limestone name wall in front of the porch
  const sw = W2(8.4, 33.0); const s = obox(sw, DV, [5.2, 1.3, 0.5], FLOOR, M.stone); site.add(s);
  return { plate, signPos: W2(8.15, 33.0) };
}
