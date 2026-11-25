// Architecture: walls with real openings, roofs, parapets, doors, windows, stair.
import * as THREE from 'three';

export const colliders = { ground: [], roof: [] };   // [minx, minz, maxx, maxz]
export const H = 4.0, ROOF = 4.3, HM = 5.2, ROOFM = 5.5;

// ---------- small geometry helpers (shared with props/site) ----------
export function boxGeo(w, h, d) { // UVs in metres
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, s = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * s[f][0], uv.getY(k) * s[f][1]); }
  return g;
}
export function mk(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
// box given by min corner + size; metre UVs
export const B = (p, mat, x, y, z, w, h, d) => mk(p, boxGeo(w, h, d), mat, x + w / 2, y + h / 2, z + d / 2);
// box centred in x/z, sitting on y; unit UVs (for textures that must fit the face)
export const BU = (p, mat, x, y, z, w, h, d) => mk(p, new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
export const CY = (p, mat, x, y, z, r, h, seg = 20, r2 = r) => mk(p, new THREE.CylinderGeometry(r2, r, h, seg), mat, x, y + h / 2, z);
export function lathe(p, mat, pts, x, y, z, seg = 28) {
  const m = mk(p, new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), seg), mat, x, y, z);
  if (mat.side !== THREE.DoubleSide) { m.material = mat.clone(); m.material.side = THREE.DoubleSide; } return m;
}

// ---------- walls ----------
function triCluster(shape, u, y, rows, s = 0.2, gap = 0.33) {
  for (let r = 0; r < rows; r++) for (let i = 0; i < rows - r; i++) {
    const cx = u + (i - (rows - r - 1) / 2) * gap, cy = y + r * gap * 0.9, p = new THREE.Path();
    p.moveTo(cx - s / 2, cy); p.lineTo(cx + s / 2, cy); p.lineTo(cx, cy + s * 0.95); p.closePath(); shape.holes.push(p);
  }
}
function wallShape(L, y0, h, ops) {
  const s = new THREE.Shape(); s.moveTo(0, y0); s.lineTo(L, y0); s.lineTo(L, h); s.lineTo(0, h); s.closePath();
  for (const o of ops) {
    if (o.tri) { triCluster(s, o.at, o.y, o.tri, o.s, o.gap); continue; }
    const p = new THREE.Path(), a = o.at - o.w / 2, b = o.at + o.w / 2, y1 = Math.max((o.y || 0), y0 + (o.y ? 0 : -0.001)), y2 = (o.y || 0) + o.h;
    if (!o.y) { // door: cut from the bottom edge by reshaping the outline instead of a hole
      s.holes.push(p); p.moveTo(a, y0 + 0.0005); p.lineTo(b, y0 + 0.0005); p.lineTo(b, y2); p.lineTo(a, y2); p.closePath();
    } else { p.moveTo(a, y1); p.lineTo(b, y1); p.lineTo(b, y2); p.lineTo(a, y2); p.closePath(); s.holes.push(p); }
  }
  return s;
}
/* wall({x1,z1,x2,z2,t,h,y0,out,mats:[outer,inner]}, ops)
   axis-aligned; `out` = side that faces outdoors ('n','s','e','w') or null for an interior partition */
export function wall(parent, M, w, ops = [], level = 'ground') {
  const alongX = Math.abs(w.z1 - w.z2) < 1e-6, L = alongX ? w.x2 - w.x1 : w.z2 - w.z1, t = w.t, y0 = w.y0 || 0;
  const shape = wallShape(L, y0, w.h, ops);
  const mats = w.mats || (w.out ? [M.mud, M.mudIn] : [M.mudIn, M.mudIn]);
  const layers = w.out ? [[0, 0.55, mats[0]], [0.55, 1, mats[1]]] : [[0, 1, mats[0]]];
  for (const [a, b, mat] of layers) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: (b - a) * t, bevelEnabled: false, curveSegments: 1 });
    const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true;
    if (alongX) {
      const c = w.z1, zmin = c - t / 2; // outer layer sits on the `out` side
      const za = w.out === 's' ? c + t / 2 - b * t : zmin + a * t;
      m.position.set(w.x1, 0, za);
    } else {
      const c = w.x1, xmax = w.out === 'w' ? c - t / 2 + b * t : c + t / 2 - a * t;
      m.rotation.y = -Math.PI / 2; m.position.set(xmax, 0, w.z1);
    }
    parent.add(m);
  }
  if (y0 < 2) { // collision: solid runs between door openings
    const doors = ops.filter(o => !o.tri && !o.y).sort((p, q) => p.at - q.at); let s = 0;
    const push = (a, b) => { if (b - a > 0.01) colliders[level].push(alongX ? [w.x1 + a, w.z1 - t / 2, w.x1 + b, w.z1 + t / 2] : [w.x1 - t / 2, w.z1 + a, w.x1 + t / 2, w.z1 + b]); };
    for (const d of doors) { push(s, d.at - d.w / 2); s = d.at + d.w / 2; } push(s, L);
  } else if (level === 'ground') {
    colliders.roof.push(alongX ? [w.x1, w.z1 - t / 2, w.x2, w.z1 + t / 2] : [w.x1 - t / 2, w.z1, w.x1 + t / 2, w.z2]);
  }
}

function coping(parent, M, x1, z1, x2, z2, y, t) { // clean rounded coping instead of merlons
  const alongX = Math.abs(z1 - z2) < 1e-6, L = alongX ? x2 - x1 : z2 - z1;
  const g = new THREE.CylinderGeometry(t / 2 + .03, t / 2 + .03, L, 14, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); g.scale(1, .28, 1);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .6, uv.getY(i) * L);
  const m = mk(parent, g, M.mud, alongX ? (x1 + x2) / 2 : x1, y, alongX ? z1 : (z1 + z2) / 2); if (!alongX) m.rotation.y = Math.PI / 2;
}
// floating plaster soffit with a warm light gap, all round a room
function cove(parent, M, x1, z1, x2, z2, y, w = .55) {
  const d = .13, gap = .1, yb = y - gap - d;
  for (const [x, z, ww, dd] of [[x1, z1, x2 - x1, w], [x1, z2 - w, x2 - x1, w], [x1, z1 + w, w, z2 - z1 - 2 * w], [x2 - w, z1 + w, w, z2 - z1 - 2 * w]]) B(parent, M.ceilTop, x, yb, z, ww, d, dd);
  const s = .16; for (const [x, z, ww, dd] of [[x1 + s, z1 + w - s, x2 - x1 - 2 * s, .03], [x1 + s, z2 - w + s - .03, x2 - x1 - 2 * s, .03], [x1 + w - s, z1 + s, .03, z2 - z1 - 2 * s], [x2 - w + s - .03, z1 + s, .03, z2 - z1 - 2 * s]]) { const m = B(parent, M.cove, x, y - gap, z, ww, gap, dd); m.castShadow = false; }
}
// modern slatted oak leaf with a long bronze pull; hinged at (hx,hz), dir = closed direction, open = swing
export function doorLeaf(parent, M, hx, hz, w, h, dir, open) {
  const pivot = new THREE.Group(); pivot.position.set(hx, 0, hz); pivot.rotation.y = -(dir + open); parent.add(pivot);
  const leaf = BU(pivot, [M.oak, M.oak, M.oak, M.oak, M.doorOak, M.doorOak], w / 2, 0.015, 0, w, h, 0.07);
  for (const s of [-1, 1]) { CY(pivot, M.bronze, w - .16, .75, s * .075, .013, 1.1, 10); for (const yy of [.85, 1.75]) { const k = CY(pivot, M.bronze, 0, 0, 0, .008, .05, 6); k.rotation.x = Math.PI / 2; k.position.set(w - .16, yy, s * .05); } }
  return leaf;
}
function frame(parent, M, alongX, c, at, w, y, h, t, mat, f = .05) { // slim lining of an opening
  const d = t + 0.02;
  const put = (a, yy, ww, hh) => alongX ? B(parent, mat, at + a, yy, c - d / 2, ww, hh, d) : B(parent, mat, c - d / 2, yy, at + a, d, hh, ww);
  put(-w / 2, y, f, h); put(w / 2 - f, y, f, h); put(-w / 2, y + h - f, w, f); if (y > 0) put(-w / 2, y, w, f);
}
function windowFit(parent, M, alongX, c, at, w, y, h, t) { // bronze-lined slot window with a single pane
  frame(parent, M, alongX, c, at, w, y, h, t, M.bronze, .035);
  const g = alongX ? B(parent, M.glass, at - w / 2, y, c - .008, w, h, .016) : B(parent, M.glass, c - .008, y, at - w / 2, .016, h, w); g.castShadow = false;
}
// one glass panel between a and b (world coordinate along the wall), offset across the wall
function pane(parent, M, alongX, c, a, b, h, off = 0) {
  const w = b - a, s = .045, put = (x, yy, ww, hh, mat, th = .04) => { const m = alongX ? B(parent, mat, x, yy, c + off - th / 2, ww, hh, th) : B(parent, mat, c + off - th / 2, yy, x, th, hh, ww); return m; };
  put(a, 0, s, h, M.bronze); put(b - s, 0, s, h, M.bronze); put(a, h - s, w, s, M.bronze); put(a, 0, w, .03, M.bronze); put(a + s, .03, w - 2 * s, h - s - .03, M.glass, .012).castShadow = false;
}
// sliding triangle-pattern screen
export function screen(parent, M, alongX, c, a, b, h, y = 0) {
  const w = b - a, g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / .6, uv.getY(i) * h / .6);
  const m = mk(parent, g, M.screen, alongX ? (a + b) / 2 : c, y + h / 2, alongX ? c : (a + b) / 2); if (!alongX) m.rotation.y = Math.PI / 2;
  const put = (x, yy, ww, hh) => alongX ? B(parent, M.bronze, x, yy, c - .02, ww, hh, .04) : B(parent, M.bronze, c - .02, yy, x, .04, hh, ww);
  put(a, y, .04, h); put(b - .04, y, .04, h); put(a, y + h - .04, w, .04); put(a, y, w, .04);
}

export function buildHouse(scene, M) {
  const g = new THREE.Group(); scene.add(g);
  const W = (w, ops, lvl) => wall(g, M, w, ops, lvl);
  // ---- floors ----
  B(g, M.floor, 0, -0.4, 0, 18, 0.4, 18);
  B(g, M.trav, 5.5, 0, 5.5, 7, 0.012, 7);
  B(g, M.stone, -0.25, -0.4, -0.25, 18.5, 0.3, 18.5);

  // ---- exterior walls (t .5) ----
  W({ x1: 0, z1: .25, x2: 12.6, z2: .25, t: .5, h: 6.3, out: 'n' }, [
    { at: 3, w: .7, y: .9, h: 2.4 }, { at: 6.3, w: .7, y: .9, h: 2.4 }, { at: 9.6, w: .7, y: .9, h: 2.4 },
    { at: 3, y: 3.9, tri: 3 }, { at: 6.3, y: 3.9, tri: 3 }, { at: 9.6, y: 3.9, tri: 3 }]);
  W({ x1: 12.6, z1: .25, x2: 18, z2: .25, t: .5, h: 4.9, out: 'n' }, [{ at: 2.6, w: 1.6, y: 1.1, h: 1.3 }]);
  W({ x1: 0, z1: 17.75, x2: 18, z2: 17.75, t: .5, h: 4.9, out: 's' }, [
    { at: 2.6, w: .9, y: .5, h: 2.6 }, { at: 6.6, w: .9, y: .5, h: 2.6 }, { at: 14, w: 1.8, y: 2.2, h: .7 }]);
  W({ x1: .25, z1: .5, x2: .25, z2: 5.5, t: .5, h: 6.3, out: 'w' }, [{ at: 2.35, y: 3.5, tri: 5, s: .21, gap: .36 }]);
  W({ x1: .25, z1: 5.5, x2: .25, z2: 17.5, t: .5, h: 4.9, out: 'w' }, [
    { at: 5.0, w: 1.7, h: 3.0 }, { at: 1.9, w: .7, y: .5, h: 2.6 }, { at: 9.6, w: .9, y: .5, h: 2.6 }, { at: 3.2, y: 3.3, tri: 3 }, { at: 6.8, y: 3.3, tri: 3 }]);
  W({ x1: 17.75, z1: .5, x2: 17.75, z2: 17.5, t: .5, h: 4.9, out: 'e' }, [
    { at: 2.3, w: 1.0, y: 1.1, h: 1.3 }, { at: 8.5, w: 3.2, h: 3.0 }, { at: 5.6, w: .8, y: .5, h: 2.6 }, { at: 11.4, w: .8, y: .5, h: 2.6 }, { at: 14.6, w: .8, y: 1.6, h: 1.2 }]);
  // ---- court ring (t .4) ----
  W({ x1: .5, z1: 5.3, x2: 5.5, z2: 5.3, t: .4, h: ROOF }, [{ at: 2.4, w: 1.2, h: 2.7 }]);
  W({ x1: 5.5, z1: 5.3, x2: 12.5, z2: 5.3, t: .4, h: ROOF, out: 's' }, [{ at: 3.5, w: 4.6, h: 3.0 }]);
  W({ x1: 12.5, z1: 5.3, x2: 17.5, z2: 5.3, t: .4, h: ROOF }, [{ at: 2.7, w: 3.0, h: 3.0 }]);
  W({ x1: .5, z1: 5.3, x2: 12.8, z2: 5.3, t: .4, y0: ROOF, h: 6.3, out: 's' }, [3.4, 9.0].flatMap(a => [{ at: a, y: 4.75, tri: 3 }]));
  W({ x1: 12.6, z1: .5, x2: 12.6, z2: 5.1, t: .4, h: ROOF });
  W({ x1: 12.6, z1: .5, x2: 12.6, z2: 5.5, t: .4, y0: ROOF, h: 6.3, out: 'e' });
  W({ x1: .5, z1: 12.7, x2: 5.5, z2: 12.7, t: .4, h: ROOF });
  W({ x1: 5.5, z1: 12.7, x2: 12.5, z2: 12.7, t: .4, h: ROOF, out: 'n' }, [{ at: 2.7, w: 1.4, h: 2.7 }, { at: 5.3, w: .9, y: .5, h: 2.6 }]);
  W({ x1: 12.5, z1: 12.7, x2: 17.5, z2: 12.7, t: .4, h: ROOF });
  W({ x1: 5.3, z1: 5.5, x2: 5.3, z2: 12.5, t: .4, h: ROOF, out: 'e' }, [{ at: .8, w: 1.3, h: 2.7 }]);
  W({ x1: 12.7, z1: 5.5, x2: 12.7, z2: 12.5, t: .4, h: ROOF, out: 'w' }, [{ at: 3.5, w: 3.2, h: 3.0 }, { at: 6.1, w: .8, y: .5, h: 2.6 }]);
  W({ x1: 10.2, z1: 12.9, x2: 10.2, z2: 17.5, t: .3, h: ROOF }, [{ at: 2.7, w: 1.0, h: 2.5 }]);
  // court-side roof parapets
  W({ x1: 5.3, z1: 5.5, x2: 5.3, z2: 12.9, t: .4, y0: ROOF, h: 4.9, out: 'e' });
  W({ x1: 6.75, z1: 12.7, x2: 12.9, z2: 12.7, t: .4, y0: ROOF, h: 4.9, out: 'n' });
  W({ x1: 12.7, z1: 5.5, x2: 12.7, z2: 12.5, t: .4, y0: ROOF, h: 4.9, out: 'w' });
  colliders.roof.push([0, 0, 18, .5], [0, 17.5, 18, 18], [0, 0, .5, 18], [17.5, 0, 18, 18]);

  // ---- roofs: render above, smooth plaster below, light coves ----
  const slab = (x, z, w, d, y) => mk(g, boxGeo(w, .306, d), [M.mud, M.mud, M.mudDark, M.ceilTop, M.mud, M.mud], x + w / 2, y + .153, z + d / 2);
  slab(.4, 5.4, 5.0, 12.2, H); slab(5.4, 12.6, 12.2, 5.0, H); slab(12.6, .4, 5.0, 12.2, H); slab(.4, .4, 12.3, 5.0, HM);
  cove(g, M, .5, .5, 12.4, 5.1, HM, .7); cove(g, M, .5, 5.5, 5.1, 12.5, H); cove(g, M, .5, 12.9, 10.05, 17.5, H); cove(g, M, 10.35, 12.9, 17.5, 17.5, H); cove(g, M, 12.9, 5.5, 17.5, 12.5, H); cove(g, M, 12.8, .5, 17.5, 5.1, H);
  // corner piers so wall ends never show their layers
  for (const [x, z, hh] of [[-.03, -.03, 6.3], [-.03, 17.47, 4.9], [17.47, -.03, 4.9], [17.47, 17.47, 4.9]]) B(g, M.mud, x, -.1, z, .56, hh + .1, .56);

  // ---- parapets ----
  coping(g, M, 0, .25, 12.6, .25, 6.3, .5); coping(g, M, .25, .5, .25, 5.5, 6.3, .5); coping(g, M, .5, 5.3, 12.8, 5.3, 6.3, .4); coping(g, M, 12.6, .5, 12.6, 5.1, 6.3, .4);
  coping(g, M, 12.85, .25, 18, .25, 4.9, .5); coping(g, M, 17.75, .5, 17.75, 17.5, 4.9, .5); coping(g, M, 0, 17.75, 18, 17.75, 4.9, .5); coping(g, M, .25, 5.75, .25, 17.5, 4.9, .5);
  coping(g, M, 5.3, 5.6, 5.3, 12.9, 4.9, .4); coping(g, M, 6.75, 12.7, 12.9, 12.7, 4.9, .4); coping(g, M, 12.7, 5.6, 12.7, 12.5, 4.9, .4);

  // ---- doors: slatted oak ----
  frame(g, M, false, .25, 10.5, 1.7, 0, 3.0, .5, M.oak, .06);
  doorLeaf(g, M, .5, 9.72, 1.56, 2.92, Math.PI / 2, -1.32);
  B(g, M.stone, -1.6, -.1, 9.2, 1.6, .1, 2.6);
  frame(g, M, false, 5.3, 6.3, 1.3, 0, 2.7, .4, M.oak); doorLeaf(g, M, 5.1, 5.7, 1.2, 2.64, Math.PI / 2, 1.45);
  frame(g, M, true, 5.3, 2.9, 1.2, 0, 2.7, .4, M.oak); doorLeaf(g, M, 2.35, 5.5, 1.1, 2.64, 0, 1.45);
  frame(g, M, true, 12.7, 8.2, 1.4, 0, 2.7, .4, M.oak); doorLeaf(g, M, 7.55, 12.5, 1.3, 2.64, 0, -1.45);
  frame(g, M, false, 10.2, 15.6, 1.0, 0, 2.5, .3, M.oak); doorLeaf(g, M, 10.05, 15.15, .9, 2.44, Math.PI / 2, 1.3);
  frame(g, M, true, 5.3, 15.2, 3.0, 0, 3.0, .4, M.oak);
  // ---- big glazing: living room to court, dining to court and to the pool ----
  frame(g, M, true, 5.3, 9.0, 4.6, 0, 3.0, .4, M.bronze, .04);
  pane(g, M, true, 5.3, 6.74, 7.87, 2.96, -.05); pane(g, M, true, 5.3, 6.78, 7.91, 2.96, .01); pane(g, M, true, 5.3, 10.13, 11.26, 2.96, -.05); pane(g, M, true, 5.3, 10.09, 11.22, 2.96, .01);
  colliders.ground.push([6.7, 5.22, 7.9, 5.36], [10.1, 5.22, 11.3, 5.36]);
  screen(g, M, true, 5.56, 5.62, 6.72, 3.0); screen(g, M, true, 5.56, 11.28, 12.38, 3.0);
  frame(g, M, false, 12.7, 9, 3.2, 0, 3.0, .4, M.bronze, .04); pane(g, M, false, 12.7, 7.44, 8.3, 2.96, -.03); pane(g, M, false, 12.7, 9.7, 10.56, 2.96, -.03); colliders.ground.push([12.62, 7.4, 12.76, 8.3], [12.62, 9.7, 12.76, 10.6]);
  frame(g, M, false, 17.75, 9, 3.2, 0, 3.0, .5, M.bronze, .04); pane(g, M, false, 17.75, 7.44, 8.3, 2.96, -.03); pane(g, M, false, 17.75, 7.48, 8.34, 2.96, .03); pane(g, M, false, 17.75, 9.7, 10.56, 2.96, -.03); pane(g, M, false, 17.75, 9.66, 10.52, 2.96, .03); colliders.ground.push([17.66, 7.4, 17.84, 8.34], [17.66, 9.66, 17.84, 10.6]);
  screen(g, M, false, 18.07, 5.5, 7.36, 3.2); screen(g, M, false, 18.07, 10.64, 12.5, 3.2);
  screen(g, M, false, -.07, 6.7, 8.2, 3.3); // screen over the hall window, west façade

  // ---- slot windows ----
  for (const x of [3, 6.3, 9.6]) windowFit(g, M, true, .25, x, .7, .9, 2.4, .5);
  windowFit(g, M, true, .25, 15.2, 1.6, 1.1, 1.3, .5);
  for (const x of [2.6, 6.6]) windowFit(g, M, true, 17.75, x, .9, .5, 2.6, .5);
  windowFit(g, M, true, 17.75, 14, 1.8, 2.2, .7, .5);
  windowFit(g, M, false, .25, 7.4, .7, .5, 2.6, .5); windowFit(g, M, false, .25, 15.1, .9, .5, 2.6, .5);
  windowFit(g, M, false, 17.75, 2.8, 1.0, 1.1, 1.3, .5); for (const z of [6.1, 11.9]) windowFit(g, M, false, 17.75, z, .8, .5, 2.6, .5);
  windowFit(g, M, false, 17.75, 15.1, .8, 1.6, 1.2, .5);
  windowFit(g, M, true, 12.7, 10.8, .9, .5, 2.6, .4); windowFit(g, M, false, 12.7, 11.6, .8, .5, 2.6, .4);

  // ---- court stair: travertine treads, solid rendered balustrade with a light line ----
  const n = 22, rise = ROOF / n, tread = 5.3 / n;
  for (let i = 0; i < n; i++) { B(g, M.stone, 5.5, 0, 7.2 + i * tread, 1.15, (i + 1) * rise - .05, tread + .002); B(g, M.trav, 5.5, (i + 1) * rise - .05, 7.2 + i * tread - .025, 1.16, .05, tread + .025); }
  const ang = -Math.atan2(ROOF, 5.3);
  const rail = B(g, M.stone, 6.65, 0, 0, .24, 1.0, 6.8); rail.position.set(6.77, ROOF / 2 + .5, 7.2 + 2.65); rail.rotation.x = ang;
  const cap = mk(g, new THREE.CylinderGeometry(.13, .13, 6.82, 12), M.stone, 6.77, ROOF / 2 + 1.0, 7.2 + 2.65); cap.rotation.x = Math.PI / 2 + ang;
  const led = B(g, M.cove, 0, 0, 0, .014, .04, 6.6); led.position.set(6.642, ROOF / 2 + .8, 7.2 + 2.65); led.rotation.x = ang; led.castShadow = false;
  colliders.ground.push([6.65, 7.2, 6.89, 12.5], [5.5, 12.3, 6.65, 12.5]);
  colliders.roof.push([6.65, 7.2, 6.89, 12.5], [5.5, 5.5, 6.89, 7.0], [6.89, 5.5, 12.5, 12.5]);
  return g;
}

// Ramp: the stair is a strip where the eye height follows the steps.
export const stair = { x1: 5.5, x2: 6.65, z1: 7.2, z2: 12.5, h: ROOF };
