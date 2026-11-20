// Shared building library. Coordinates: x = metres east from the site's NW corner,
// z = metres south from the NW corner (matches the plan images: right = +x, down = +z), y = up.
import * as THREE from '../vendor/three.module.js';
export { THREE };

// Level heights (finished floor levels, metres)
export const L = { B: -3.6, G: 0.0, F: 4.2, R: 8.0, GRADE: 0.0 };
export const SITE = { w: 49.0, d: 47.0 };

// ---------------------------------------------------------------------------
// Procedural textures (canvas). Each material gets userData.tile = metres per texture repeat.
// Geometry helpers below write UVs in metres / tile, so textures stay to scale.
// ---------------------------------------------------------------------------
const texCache = new Map();
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(key, size, draw, { srgb = true } = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t); return t;
}
const hex = (c) => '#' + new THREE.Color(c).getHexString();
function shade(c, k) { const col = new THREE.Color(c); col.multiplyScalar(k); return hex(col); }
function noise(g, n, a, colA, colB, r, seed = 1) { const R = rng(seed); for (let i = 0; i < a; i++) { g.fillStyle = R() < .5 ? colA : colB; g.globalAlpha = 0.04 + R() * 0.08; g.fillRect(R() * n, R() * n, r * R() + 1, r * R() + 1); } g.globalAlpha = 1; }

export const tex = {
  // polished marble / stone; vein = vein colour or null
  marble(base = '#efe3cc', vein = '#cdb894', seed = 1) {
    return canvasTex(`marble${base}${vein}${seed}`, 512, (g, n) => {
      g.fillStyle = base; g.fillRect(0, 0, n, n); noise(g, n, 3000, shade(base, 1.05), shade(base, .93), 6, seed);
      if (vein) { const R = rng(seed + 7); g.strokeStyle = vein; for (let i = 0; i < 9; i++) { g.globalAlpha = .15 + R() * .35; g.lineWidth = .5 + R() * 1.6; g.beginPath(); let x = R() * n, y = 0; g.moveTo(x, y); while (y < n) { x += (R() - .5) * 40; y += 10 + R() * 25; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }
    });
  },
  // square tiles with grout. cells = tiles per texture
  tiles(base = '#ddd', grout = '#999', cells = 4, jitter = 0.04, seed = 2) {
    return canvasTex(`tiles${base}${grout}${cells}${jitter}${seed}`, 512, (g, n) => {
      const R = rng(seed); g.fillStyle = grout; g.fillRect(0, 0, n, n); const s = n / cells;
      for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { g.fillStyle = shade(base, 1 + (R() - .5) * 2 * jitter); g.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3); }
      noise(g, n, 1500, '#fff', '#000', 4, seed);
    });
  },
  // pool / bathroom mosaic: random mix of colours
  mosaic(colors = ['#3d8fd1', '#5aa7e0', '#2f74b5', '#7fc0ea'], cells = 16, seed = 3) {
    return canvasTex(`mosaic${colors.join()}${cells}${seed}`, 512, (g, n) => {
      const R = rng(seed); g.fillStyle = '#dfe9ee'; g.fillRect(0, 0, n, n); const s = n / cells;
      for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { g.fillStyle = colors[(R() * colors.length) | 0]; g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); }
    });
  },
  // wood planks; vertical boards, `boards` per texture
  wood(base = '#7a4a2a', boards = 6, seed = 4) {
    return canvasTex(`wood${base}${boards}${seed}`, 512, (g, n) => {
      const R = rng(seed); const w = n / boards;
      for (let i = 0; i < boards; i++) { const c = shade(base, .85 + R() * .3); g.fillStyle = c; g.fillRect(i * w, 0, w, n);
        g.strokeStyle = shade(base, .7); g.globalAlpha = .25; for (let k = 0; k < 14; k++) { g.lineWidth = .5 + R(); g.beginPath(); const x = i * w + R() * w; g.moveTo(x, 0); g.bezierCurveTo(x + (R() - .5) * 8, n * .3, x + (R() - .5) * 8, n * .6, x + (R() - .5) * 6, n); g.stroke(); } g.globalAlpha = 1;
        const cut = R() * n; g.fillStyle = shade(base, .55); g.fillRect(i * w, cut, w, 2); g.fillRect(i * w, 0, 1.5, n); }
    });
  },
  // herringbone parquet
  herringbone(base = '#a8743f', seed = 5) {
    return canvasTex(`herring${base}${seed}`, 512, (g, n) => {
      const R = rng(seed); g.fillStyle = shade(base, .6); g.fillRect(0, 0, n, n); const u = n / 8;
      for (let i = -2; i < 10; i++) for (let j = -2; j < 18; j++) { g.save(); const x = i * u * 2 + (j % 2) * u, y = j * u; g.translate(x, y); g.rotate(j % 2 ? Math.PI / 4 : -Math.PI / 4); g.fillStyle = shade(base, .85 + R() * .3); g.fillRect(0, 0, u * 1.9, u * .62); g.restore(); }
    });
  },
  // brick-pattern pavers (exterior hardscape); colours like '#9c4a32'
  pavers(base = '#9c4a32', rows = 8, seed = 6) {
    return canvasTex(`pavers${base}${rows}${seed}`, 512, (g, n) => {
      const R = rng(seed); g.fillStyle = shade(base, .6); g.fillRect(0, 0, n, n); const h = n / rows, w = h * 2;
      for (let r = 0; r < rows; r++) for (let c = -1; c < n / w + 1; c++) { g.fillStyle = shade(base, .8 + R() * .4); g.fillRect(c * w + (r % 2) * w / 2 + 1, r * h + 1, w - 2, h - 2); }
      noise(g, n, 2000, '#fff', '#000', 3, seed);
    });
  },
  // basket-weave pavers like the grey driveway/terrace on the plans
  basket(base = '#8e8e8e', cells = 8, seed = 7) {
    return canvasTex(`basket${base}${cells}${seed}`, 512, (g, n) => {
      const R = rng(seed); g.fillStyle = shade(base, .55); g.fillRect(0, 0, n, n); const s = n / cells;
      for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) { const v = (i + j) % 2; for (let k = 0; k < 2; k++) { g.fillStyle = shade(base, .82 + R() * .35); if (v) g.fillRect(i * s + 1, j * s + k * s / 2 + 1, s - 2, s / 2 - 2); else g.fillRect(i * s + k * s / 2 + 1, j * s + 1, s / 2 - 2, s - 2); } }
    });
  },
  carpet(base = '#8c7a62', seed = 8) {
    return canvasTex(`carpet${base}${seed}`, 256, (g, n) => { g.fillStyle = base; g.fillRect(0, 0, n, n); noise(g, n, 9000, shade(base, 1.25), shade(base, .75), 2, seed); });
  },
  grass(seed = 9) {
    return canvasTex(`grass${seed}`, 512, (g, n) => { g.fillStyle = '#4f8a2e'; g.fillRect(0, 0, n, n); const R = rng(seed); for (let i = 0; i < 26000; i++) { g.fillStyle = R() < .5 ? '#69a83c' : '#3b6e22'; g.globalAlpha = .35; g.fillRect(R() * n, R() * n, 1, 3 + R() * 3); } g.globalAlpha = 1; });
  },
  water(seed = 10) {
    return canvasTex(`water${seed}`, 512, (g, n) => { g.fillStyle = '#4aa6dc'; g.fillRect(0, 0, n, n); const R = rng(seed); g.strokeStyle = '#bfe6fb'; for (let i = 0; i < 70; i++) { g.globalAlpha = .15 + R() * .3; g.lineWidth = .5 + R() * 2; g.beginPath(); let x = R() * n, y = R() * n; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 60; y += (R() - .5) * 60; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; });
  },
  plaster(base = '#efe7da', seed = 11) {
    return canvasTex(`plaster${base}${seed}`, 256, (g, n) => { g.fillStyle = base; g.fillRect(0, 0, n, n); noise(g, n, 2500, shade(base, 1.03), shade(base, .96), 10, seed); });
  },
  // custom: pass your own draw(g, n) to make any texture you need
  custom(key, draw, size = 512) { return canvasTex('custom:' + key, size, draw); },
};

// Material factory. tile = metres covered by one texture repeat.
const matCache = new Map();
export function mat(opts = {}) {
  const { color = '#ffffff', map = null, tile = 1, rough = 0.7, metal = 0, emissive = null, emissiveIntensity = 1, opacity = 1, transparent = false, side = THREE.FrontSide, key = null } = opts;
  const k = key || JSON.stringify([color, map && map.uuid, tile, rough, metal, emissive, emissiveIntensity, opacity, transparent, side]);
  if (matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshStandardMaterial({ color, map, roughness: rough, metalness: metal, transparent: transparent || opacity < 1, opacity, side });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
  m.userData.tile = tile; matCache.set(k, m); return m;
}
// handy presets
export const M = {
  plaster: () => mat({ color: '#f1ebe0', map: tex.plaster(), tile: 2, rough: .9 }),
  ceiling: () => mat({ color: '#f7f4ee', rough: .95 }),
  extStone: () => mat({ color: '#e8dcc6', map: tex.plaster('#e6d8bf', 21), tile: 3, rough: .9 }),
  glass: () => mat({ color: '#9fc6d6', rough: .05, metal: .1, opacity: .28, key: 'glass' }),
  frame: () => mat({ color: '#3a3a3c', rough: .4, metal: .6 }),
  steel: () => mat({ color: '#b8bcc0', rough: .3, metal: .9 }),
  white: () => mat({ color: '#f5f5f2', rough: .5 }),
  black: () => mat({ color: '#1d1d1f', rough: .5 }),
  water: () => mat({ color: '#ffffff', map: tex.water(), tile: 3, rough: .05, metal: .1, opacity: .85, key: 'water' }),
  lightPanel: () => mat({ color: '#fff8e8', emissive: '#fff3d6', emissiveIntensity: 1.2, key: 'lightpanel' }),
};

// ---------------------------------------------------------------------------
// Geometry helpers – UVs are written in metres / material.userData.tile
// ---------------------------------------------------------------------------
function scaleUV(geo, m) {
  const t = (Array.isArray(m) ? m[0] : m)?.userData?.tile || 1; const uv = geo.attributes.uv;
  if (t !== 1) { for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t); uv.needsUpdate = true; }
  return geo;
}
function boxGeoMetric(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [U, V] = ax > .5 ? [d, h] : ay > .5 ? [w, d] : [w, h]; uv.setXY(i, uv.getX(i) * U, uv.getY(i) * V);
  }
  return g;
}

const WALLTOP = new THREE.MeshStandardMaterial({ color: '#45423f', roughness: .9 });
// The context a piece builds into. Create via makeCtx(group, registry).
export function makeCtx(group, reg) {
  const ctx = {
    THREE, L, SITE, tex, mat, M, group, reg,
    // add any Object3D. opts: {walk:true} = player can stand on it; {collide:true} = blocks the player
    add(obj, opts = {}) {
      obj.traverse?.((o) => { if (o.isMesh) { o.castShadow = opts.cast ?? true; o.receiveShadow = true; } });
      group.add(obj); if (opts.walk) reg.walk.push(obj); if (opts.collide) reg.collide.push(obj); return obj;
    },
    // Axis-aligned box from corner (x0,y0,z0) to (x1,y1,z1)
    box(x0, y0, z0, x1, y1, z1, m, opts = {}) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      const g = scaleUV(boxGeoMetric(w, h, d), m); const mesh = new THREE.Mesh(g, m);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return ctx.add(mesh, opts);
    },
    // Box centred at (cx,cy,cz) size (w,h,d) rotated by ry (radians) around Y
    boxC(cx, cy, cz, w, h, d, m, ry = 0, opts = {}) {
      const g = scaleUV(boxGeoMetric(w, h, d), m); const mesh = new THREE.Mesh(g, m);
      mesh.position.set(cx, cy, cz); mesh.rotation.y = ry; return ctx.add(mesh, opts);
    },
    cyl(cx, y0, cz, r, h, m, seg = 24, opts = {}) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); mesh.position.set(cx, y0 + h / 2, cz); return ctx.add(mesh, opts);
    },
    // Flat horizontal rectangle (floor finish / rug / ceiling). up=false faces down (ceilings)
    rect(x0, z0, x1, z1, y, m, { up = true, walk = up } = {}) {
      const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0); const g = new THREE.PlaneGeometry(w, d);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d); scaleUV(g, m);
      const mesh = new THREE.Mesh(g, m); mesh.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      return ctx.add(mesh, { walk, cast: false });
    },
    // Horizontal polygon (pts = [[x,z],...]) at height y, optionally extruded down by `thick`.
    poly(pts, y, m, { thick = 0, up = true, walk = up, holes = [] } = {}) {
      const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      holes.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z)))));
      let g = thick > 0 ? new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false }) : new THREE.ShapeGeometry(s, 24);
      scaleUV(g, m); const mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = thick > 0 ? y - thick : y; if (!up && !(thick > 0)) mesh.scale.z = -1;
      return ctx.add(mesh, { walk, cast: thick > 0 });
    },
    // Wall from (x1,z1) to (x2,z2). Centreline offset by `off` (+ = to the LEFT of travel direction as seen on the plan, z down).
    // opts: y0 (base level), h (height), t (thickness), m (material both faces) or mA = face on the RIGHT of travel, mB = face on the LEFT,
    // openings: [{at: metres from start to opening centre, w, y0: sill above base (0 for doors), h, glass: true, door: {color, swing:1|-1, open:rad}}]
    wall(x1, z1, x2, z2, o = {}) {
      const { y0 = 0, h = 3.2, t = 0.2, m = M.plaster(), mA = m, mB = m, openings = [], off = 0, collide = true } = o;
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz); if (len < 1e-3) return;
      const ux = dx / len, uz = dz / len, nx = uz, nz = -ux; // left normal (in x/z with z down)
      const ang = Math.atan2(-dz, dx);
      const seg = (a, b, ya, yb) => { // piece of wall from distance a..b along, height ya..yb (relative to y0)
        if (b - a < 1e-3 || yb - ya < 1e-3) return;
        const w = b - a, hh = yb - ya, g = boxGeoMetric(w, hh, t);
        const mats = [mA, mA, WALLTOP, mA, mA, mB]; // +x,-x,+y(top: dark, reads as the cut wall in plan view),-y,+z (= right of travel), -z (= left of travel)
        scaleUV(g, mA);
        const mesh = new THREE.Mesh(g, mats); const c = (a + b) / 2;
        mesh.position.set(x1 + ux * c + nx * off, y0 + (ya + yb) / 2, z1 + uz * c + nz * off); mesh.rotation.y = ang;
        ctx.add(mesh, { collide: collide && ya < 1.6 });
      };
      const ops = [...openings].sort((p, q) => p.at - q.at); let cur = 0;
      for (const op of ops) {
        const a = op.at - op.w / 2, b = op.at + op.w / 2, sill = op.y0 ?? 0, top = Math.min(h, sill + (op.h ?? 2.2));
        seg(cur, a, 0, h); seg(a, b, 0, sill); seg(a, b, top, h);
        if (op.glass) { const gm = new THREE.Mesh(new THREE.BoxGeometry(op.w, top - sill, 0.02), M.glass()); const c = op.at; gm.position.set(x1 + ux * c + nx * off, y0 + (sill + top) / 2, z1 + uz * c + nz * off); gm.rotation.y = ang; ctx.add(gm, { collide: true, cast: false });
          const fr = M.frame(); const fw = 0.05; [[a, a + fw], [b - fw, b]].forEach(([p, q]) => { const fm = new THREE.Mesh(new THREE.BoxGeometry(q - p, top - sill, t * 0.6), fr); const cc = (p + q) / 2; fm.position.set(x1 + ux * cc + nx * off, y0 + (sill + top) / 2, z1 + uz * cc + nz * off); fm.rotation.y = ang; ctx.add(fm); }); }
        if (op.door) ctx.door(x1 + ux * a + nx * off, z1 + uz * a + nz * off, ux, uz, op.w, top - sill, y0 + sill, op.door);
        cur = b;
      }
      seg(cur, len, 0, h);
    },
    // simple door leaf (open at ~70°) hinged at (hx,hz) running along (ux,uz). door: {color, swing: 1|-1, open: radians}
    door(hx, hz, ux, uz, w, h, y0, d = {}) {
      const color = d.color || '#6b4429', swing = d.swing ?? 1, open = d.open ?? 1.2;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - .05, h - .02, .045), mat({ color, map: tex.wood(color, 2), tile: 1, rough: .5 }));
      const piv = new THREE.Group(); piv.position.set(hx, y0, hz); piv.rotation.y = Math.atan2(-uz, ux) + swing * open; leaf.position.set((w - .05) / 2, h / 2, 0); piv.add(leaf); ctx.add(piv);
    },
    // Thin emissive ceiling light disc / downlight at (x,z) under ceiling height y
    downlight(x, z, y, r = 0.08) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 16), M.lightPanel()); m.position.set(x, y - 0.012, z); return ctx.add(m, { cast: false }); },
    // Load a mesh group built in local coords and place it at (x,y,z) with rotation ry
    place(obj, x, y, z, ry = 0, opts = {}) { obj.position.set(x, y, z); obj.rotation.y = ry; return ctx.add(obj, opts); },
  };
  return ctx;
}

// ---------------------------------------------------------------------------
// Furniture kit: each returns a THREE.Group in local coords, origin at floor centre, facing +z
// (i.e. a sofa's seat faces +z; rotate with ctx.place(obj,x,y,z,ry)).
// ---------------------------------------------------------------------------
function G() { return new THREE.Group(); }
function bx(g, w, h, d, x, y, z, m, ry = 0) { const mesh = new THREE.Mesh(scaleUV(boxGeoMetric(w, h, d), m), m); mesh.position.set(x, y, z); mesh.rotation.y = ry; g.add(mesh); return mesh; }
function rbx(g, w, h, d, r, x, y, z, m) { // rounded box
  const s = new THREE.Shape(); const hw = w / 2 - r, hh = h / 2 - r;
  s.absarc(hw, hh, r, 0, Math.PI / 2); s.absarc(-hw, hh, r, Math.PI / 2, Math.PI); s.absarc(-hw, -hh, r, Math.PI, 1.5 * Math.PI); s.absarc(hw, -hh, r, 1.5 * Math.PI, 2 * Math.PI);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * Math.min(r, d / 3), bevelEnabled: true, bevelSize: Math.min(r, d / 3), bevelThickness: Math.min(r, d / 3), bevelSegments: 3, curveSegments: 6 });
  geo.center(); const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); g.add(mesh); return mesh;
}
export const F = {
  bx, rbx,
  fabric: (c) => mat({ color: c, map: tex.carpet(c, 21), tile: .6, rough: .95 }),
  sofa({ len = 2.2, depth = 0.9, color = '#d8c6a5', cushions = 3, arms = true, legs = '#5a3d27', back = true } = {}) {
    const g = G(), f = F.fabric(color), fc = F.fabric(shade(color, 1.06)); const aw = arms ? .18 : 0;
    bx(g, len, .25, depth, 0, .22, 0, f); if (back) rbx(g, len, .45, .2, .06, 0, .62, -depth / 2 + .1, f);
    if (arms) { rbx(g, aw, .4, depth, .05, -len / 2 + aw / 2, .5, 0, f); rbx(g, aw, .4, depth, .05, len / 2 - aw / 2, .5, 0, f); }
    const cw = (len - 2 * aw) / cushions; for (let i = 0; i < cushions; i++) rbx(g, cw - .02, .14, depth - .25, .05, -len / 2 + aw + cw * (i + .5), .42, .08, fc);
    if (back) for (let i = 0; i < cushions; i++) rbx(g, cw - .06, .38, .14, .06, -len / 2 + aw + cw * (i + .5), .66, -depth / 2 + .24, fc);
    bx(g, len - .1, .1, depth - .1, 0, .05, 0, mat({ color: legs, rough: .5 })); return g;
  },
  armchair({ color = '#d8c6a5', w = 0.85, d = 0.85 } = {}) { return F.sofa({ len: w, depth: d, color, cushions: 1 }); },
  // L-shaped / U-shaped run: pass segments [{len, ry, x, z}] – or just place several sofas.
  ottoman({ w = .6, d = .6, h = .42, color = '#c9b48f' } = {}) { const g = G(); rbx(g, w, h, d, .05, 0, h / 2, 0, F.fabric(color)); return g; },
  coffeeTable({ w = 1.2, d = .7, h = .4, top = '#5b3a22', glass = false } = {}) { const g = G(); const tm = glass ? M.glass() : mat({ color: top, map: tex.wood(top, 3), tile: 1, rough: .4 }); bx(g, w, .05, d, 0, h, 0, tm); bx(g, w - .1, .06, d - .1, 0, .04, 0, mat({ color: shade(top, .8), rough: .5 })); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(g, .05, h, .05, a * (w / 2 - .06), h / 2, b * (d / 2 - .06), M.frame())); return g; },
  sideTable({ s = .5, h = .55, top = '#5b3a22' } = {}) { return F.coffeeTable({ w: s, d: s, h, top }); },
  rug({ w = 3, d = 2, color = '#8c7a62', border = null } = {}) { const g = G(); bx(g, w, .015, d, 0, .008, 0, mat({ color, map: tex.carpet(color, 31), tile: .5, rough: 1 })); if (border) { const bm = mat({ color: border, rough: 1 }); bx(g, w, .017, .12, 0, .009, d / 2 - .06, bm); bx(g, w, .017, .12, 0, .009, -d / 2 + .06, bm); bx(g, .12, .017, d, w / 2 - .06, .009, 0, bm); bx(g, .12, .017, d, -w / 2 + .06, .009, 0, bm); } g.traverse((o) => { o.castShadow = false; }); return g; },
  diningTable({ len = 2.4, w = 1.0, h = .76, top = '#5a3720', seats = 8, chair = '#e8dcc5', ends = true } = {}) {
    const g = G(); const tm = mat({ color: top, map: tex.wood(top, 4), tile: 1.2, rough: .35 }); bx(g, len, .05, w, 0, h, 0, tm);
    bx(g, len - .3, .7, .12, 0, .38, 0, tm);
    const side = Math.floor((seats - (ends ? 2 : 0)) / 2); for (let i = 0; i < side; i++) { const x = -len / 2 + len / side * (i + .5);
      const c1 = F.chair({ color: chair }); c1.position.set(x, 0, w / 2 + .3); c1.rotation.y = Math.PI; g.add(c1); const c2 = F.chair({ color: chair }); c2.position.set(x, 0, -w / 2 - .3); g.add(c2); }
    if (ends) { const a = F.chair({ color: chair }); a.position.set(-len / 2 - .35, 0, 0); a.rotation.y = Math.PI / 2; g.add(a); const b = F.chair({ color: chair }); b.position.set(len / 2 + .35, 0, 0); b.rotation.y = -Math.PI / 2; g.add(b); }
    return g;
  },
  // chair faces +z by default? No – seat back is at -z, sitter faces +z.
  chair({ color = '#e8dcc5', frame = '#4a2f1d' } = {}) { const g = G(); const f = F.fabric(color), w = mat({ color: frame, rough: .5 }); rbx(g, .48, .1, .48, .03, 0, .47, 0, f); rbx(g, .46, .55, .08, .03, 0, .8, -.21, f); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bx(g, .04, .45, .04, a * .2, .22, b * .2, w)); return g; },
  bed({ w = 1.9, l = 2.1, color = '#e9dfcc', throwC = '#8a6f4e', head = '#6b4c33', headH = 1.25 } = {}) {
    const g = G(); bx(g, w + .1, .3, l, 0, .17, 0, mat({ color: head, rough: .6 })); rbx(g, w, .25, l - .1, .05, 0, .42, .03, F.fabric(color));
    rbx(g, w + .02, .06, l * .35, .03, 0, .57, l * .25, F.fabric(throwC)); rbx(g, w + .3, headH, .12, .04, 0, headH / 2, -l / 2 - .02, F.fabric(head));
    for (let i = 0; i < 2; i++) rbx(g, w / 2 - .1, .16, .4, .07, (i - .5) * w / 2, .62, -l / 2 + .35, F.fabric('#f4efe6')); return g;
  },
  nightstand({ color = '#5a3d27' } = {}) { const g = G(); bx(g, .5, .5, .42, 0, .25, 0, mat({ color, map: tex.wood(color, 2), tile: .6, rough: .4 })); const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .25, 16), mat({ color: '#fff4dc', emissive: '#ffe2a8', emissiveIntensity: .6 })); lamp.position.set(0, .82, 0); g.add(lamp); bx(g, .03, .25, .03, 0, .62, 0, M.steel()); return g; },
  wardrobe({ len = 2.4, d = .6, h = 2.5, color = '#efe6d6' } = {}) { const g = G(); const m = mat({ color, rough: .5 }); bx(g, len, h, d, 0, h / 2, 0, m); const n = Math.max(1, Math.round(len / .6)); for (let i = 1; i < n; i++) bx(g, .01, h - .1, .01, -len / 2 + len / n * i, h / 2, d / 2 + .005, mat({ color: shade(color, .7) })); return g; },
  tvUnit({ len = 2.4, color = '#3b2a1e', tv = 1.4 } = {}) { const g = G(); bx(g, len, .45, .45, 0, .225, 0, mat({ color, map: tex.wood(color, 4), tile: 1, rough: .4 })); bx(g, tv, tv * .57, .05, 0, 1.25, -.15, M.black()); return g; },
  plant({ h = 1.4, pot = '#e7e1d6', r = .4 } = {}) { const g = G(); const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .17, .45, 16), mat({ color: pot, rough: .6 })); p.position.y = .225; g.add(p); const leaf = mat({ color: '#3f6e2c', rough: .8 }); const R = rng(Math.round(h * 100)); for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.6 + R() * .5), 0), leaf); s.position.set((R() - .5) * r, .45 + h * (.35 + R() * .5), (R() - .5) * r); g.add(s); } return g; },
  tree({ h = 5, r = 2, leaf = '#5d9a33', trunk = '#6b4d32' } = {}) { const g = G(); const t = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, h * .55, 8), mat({ color: trunk, rough: .9 })); t.position.y = h * .275; g.add(t); const lm = mat({ color: leaf, rough: .85 }); const R = rng(Math.round(h * 37 + r * 11)); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.5 + R() * .3), 1), lm); s.position.set((R() - .5) * r, h * .6 + R() * h * .3, (R() - .5) * r); g.add(s); } return g; },
  palm({ h = 6, fronds = 10, leaf = '#5f9b2e' } = {}) { const g = G(); const t = new THREE.Mesh(new THREE.CylinderGeometry(.16, .25, h, 10), mat({ color: '#8a6d4b', rough: .95 })); t.position.y = h / 2; g.add(t); const lm = mat({ color: leaf, rough: .8, side: THREE.DoubleSide }); for (let i = 0; i < fronds; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.5, 2.6, 1, 4), lm); const pos = f.geometry.attributes.position; for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) + 1.3; pos.setZ(k, -0.12 * y * y); } f.geometry.computeVertexNormals(); const piv = new THREE.Group(); piv.position.y = h; piv.rotation.y = i / fronds * Math.PI * 2; f.rotation.x = -Math.PI / 2 + .5; f.position.z = 1.2; piv.add(f); g.add(piv); } return g; },
  car({ color = '#c7ad86', len = 4.8, w = 1.9 } = {}) { const g = G(); const b = mat({ color, rough: .25, metal: .6 }); rbx(g, w, .7, len, .25, 0, .55, 0, b); rbx(g, w - .2, .55, len * .5, .2, 0, 1.05, -.1, mat({ color: '#2b3540', rough: .1, metal: .5 })); const tm = M.black(); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .25, 18), tm); wh.rotation.z = Math.PI / 2; wh.position.set(a * (w / 2 - .1), .34, c * (len / 2 - .8)); g.add(wh); }); return g; },
  toilet() { const g = G(); const m = M.white(); rbx(g, .38, .38, .55, .1, 0, .2, .05, m); bx(g, .4, .35, .18, 0, .55, -.22, m); return g; },
  vanity({ len = 1.2, top = '#e9e2d6', cab = '#6b4c33' } = {}) { const g = G(); bx(g, len, .5, .5, 0, .35, 0, mat({ color: cab, map: tex.wood(cab, 3), tile: .8, rough: .5 })); bx(g, len, .04, .52, 0, .62, 0, mat({ color: top, map: tex.marble(top), tile: 1, rough: .2 })); const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .16, .12, 20), M.white()); b.position.set(0, .7, 0); g.add(b); bx(g, len * .8, .8, .02, 0, 1.4, -.25, mat({ color: '#cfdce3', rough: .02, metal: .9 })); return g; },
  bathtub({ l = 1.7, w = .8 } = {}) { const g = G(); rbx(g, w, .55, l, .12, 0, .28, 0, M.white()); bx(g, w - .14, .02, l - .14, 0, .5, 0, M.water()); return g; },
  shower({ w = 1, d = 1, h = 2.1 } = {}) { const g = G(); bx(g, w, .05, d, 0, .025, 0, M.white()); bx(g, .01, h, d, w / 2, h / 2, 0, M.glass()); return g; },
  kitchenRun({ len = 3, d = .62, cab = '#f0ebe2', top = '#3b3b3b', upper = true } = {}) { const g = G(); bx(g, len, .86, d, 0, .43, 0, mat({ color: cab, rough: .4 })); bx(g, len, .04, d + .02, 0, .88, 0, mat({ color: top, map: tex.marble(top, '#777'), tile: 1, rough: .2 })); if (upper) bx(g, len, .7, .35, 0, 1.85, -d / 2 + .175, mat({ color: cab, rough: .4 })); return g; },
  desk({ w = 1.8, d = .8, color = '#5a3d27' } = {}) { const g = G(); const m = mat({ color, map: tex.wood(color, 3), tile: 1, rough: .4 }); bx(g, w, .05, d, 0, .74, 0, m); bx(g, .05, .72, d, -w / 2 + .03, .36, 0, m); bx(g, .45, .72, d, w / 2 - .23, .36, 0, m); return g; },
  officeChair({ color = '#2f3d4a' } = {}) { const g = G(); const m = F.fabric(color); rbx(g, .5, .1, .5, .04, 0, .48, 0, m); rbx(g, .48, .6, .08, .04, 0, .85, -.22, m); bx(g, .05, .45, .05, 0, .22, 0, M.steel()); return g; },
  shelf({ len = 2, h = 2, d = .35, color = '#5a3d27' } = {}) { const g = G(); const m = mat({ color, rough: .5 }); for (let i = 0; i <= 4; i++) bx(g, len, .03, d, 0, i * h / 4 + .015, 0, m); bx(g, .03, h, d, -len / 2, h / 2, 0, m); bx(g, .03, h, d, len / 2, h / 2, 0, m); return g; },
  lounger({ color = '#f2f2f2' } = {}) { const g = G(); const m = F.fabric(color); bx(g, .7, .08, 1.9, 0, .3, 0, m); const b = bx(g, .7, .08, .7, 0, .5, -.75, m); b.rotation.x = .7; bx(g, .66, .25, 1.8, 0, .13, 0, M.white()); return g; },
  // floor-level Arabic majlis seating cushion run (long, low, with back bolsters)
  majlis({ len = 3, color = '#d8c6a5', back = '#c4ad86' } = {}) { const g = G(); rbx(g, len, .2, .8, .04, 0, .1, 0, F.fabric(color)); rbx(g, len, .5, .18, .06, 0, .4, -.32, F.fabric(back)); return g; },
};
