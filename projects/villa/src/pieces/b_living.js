// Piece: b_living — basement hall / living area, WC, storage, gaming, maid's room, stair B->G.
import { THREE, L, tex, mat, M, F } from '../lib.js';

const Y = L.B;            // basement finished floor
const H = 3.2;            // floor -> ceiling (-0.4)
const CEIL = -0.4;

export const rooms = [
  { name: 'Basement Living Area', level: 'B', x: 30.5, z: 11.5, yaw: Math.PI },
  { name: 'Gaming Room', level: 'B', x: 36.1, z: 20.6, yaw: 0 },
  { name: "Maid's Room", level: 'B', x: 42.5, z: 20.2, yaw: 0 },
  { name: 'Basement Stair', level: 'B', x: 40.9, z: 22.9, yaw: -Math.PI / 2 },
];
export const views = [
  { name: 'living seating from patio door', level: 'B', x: 28.2, z: 13.2, yaw: -150, pitch: -12, fov: 70 },
  { name: 'living hall looking north to billiards', level: 'B', x: 33.8, z: 23.0, yaw: 25, pitch: -8, fov: 70 },
  { name: "maid's room", level: 'B', x: 41.0, z: 20.6, yaw: -40, pitch: -10, fov: 70 },
  { name: 'gaming room', level: 'B', x: 36.1, z: 21.0, yaw: 0, pitch: -12, fov: 70 },
];

export function build(ctx) {
  // WORKAROUND (main.js): plan mode never hides the global 'far' ground plane at y=-0.06, which covers the whole
  // basement in a level-B top shot. Hide it only for a level-B top screenshot.
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get('shot') === 'top' && (qs.get('level') === 'B' || (!qs.get('level') && /^b_/.test(qs.get('piece') || '')))) { const far = ctx.reg.walk[0]; if (far && far.geometry?.parameters?.width >= 600) far.visible = false; }
  } catch (e) { /* not in a browser shot */ }
  // ---------------------------------------------------------------- materials
  const creamFloor = mat({ map: tex.custom('bl_creamwood', (g, n) => {
    let s = 7; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const b = n / 8; for (let i = 0; i < 8; i++) {
      const k = 0.955 + R() * 0.07; g.fillStyle = `rgb(${Math.min(255, 243 * k) | 0},${(227 * k) | 0},${(204 * k) | 0})`; g.fillRect(i * b, 0, b, n);
      g.globalAlpha = .18; g.strokeStyle = '#d8bf9c'; for (let q = 0; q < 6; q++) { g.lineWidth = .6; g.beginPath(); const x = i * b + R() * b; g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 4, n); g.stroke(); }
      g.globalAlpha = .8; g.fillStyle = '#d3bd9b'; g.fillRect(i * b, 0, 2, n); g.fillRect(i * b, R() * n, b, 1.2); g.globalAlpha = 1;
    }
  }), tile: 1.6, rough: .45 });
  const greyTile = mat({ map: tex.tiles('#e4e4e2', '#bdbdbb', 4, .02, 31), tile: 2.4, rough: .4 });
  const wcTile = mat({ map: tex.custom('bl_wctile', (g, n) => { g.fillStyle = '#a3a3a3'; g.fillRect(0, 0, n, n); const c = n / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#f4f4f3' : '#ebebea'; g.fillRect(i * c + 5, j * c + 5, c - 10, c - 10); } }, 256), tile: 1.0, rough: .3 });
  const wcWall = mat({ map: tex.tiles('#f3f1ec', '#cfcac2', 4, .02, 33), tile: 1.2, rough: .35 });
  const maidFloor = mat({ map: tex.custom('bl_maid', (g, n) => {
    g.fillStyle = '#c9a77b'; g.fillRect(0, 0, n, n); let s = 3; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 14000; i++) { const q = R(); g.fillStyle = q < .45 ? '#e8cb9f' : q < .85 ? '#a9845a' : '#8f6b45'; g.globalAlpha = .28; const r = 1 + R() * 2.2; g.beginPath(); g.arc(R() * n, R() * n, r, 0, 6.29); g.fill(); } g.globalAlpha = 1;
  }), tile: 2.6, rough: .9 });
  const landing = mat({ color: '#c9d4cc', map: tex.tiles('#cdd6cf', '#b3bdb5', 2, .02, 34), tile: 1.2, rough: .4 });
  const treadM = mat({ color: '#ffffff', map: tex.marble('#bfc4c0', '#a6aba7', 35), tile: 1.5, rough: .35 });
  const plaster = mat({ color: '#f1e9dc', map: tex.plaster('#efe6d7', 41), tile: 2, rough: .9 });
  const ext = M.extStone();
  const skirtM = mat({ color: '#cdbb9f', rough: .5 });
  const trimM = mat({ color: '#6b4a30', map: tex.wood('#6b4a30', 2, 42), tile: 1, rough: .45 });
  const darkWood = mat({ color: '#5b3a22', map: tex.wood('#4f321e', 3, 43), tile: 1, rough: .45 });
  const ceilM = M.ceiling();
  const beige = '#e7dcbc';

  // ------------------------------------------------------------- wall helper
  // W: ctx.wall + skirting + door casings. sk: 'A' (right face), 'B' (left face), 'AB'
  function W(x1, z1, x2, z2, o = {}) {
    const t = o.t ?? .12, off = o.off ?? 0, ops = o.openings || [];
    ctx.wall(x1, z1, x2, z2, { y0: Y, h: H, t, off, m: o.m || plaster, mA: o.mA || o.m || plaster, mB: o.mB || o.m || plaster, openings: ops });
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, nx = uz, nz = -ux, ang = Math.atan2(-dz, dx);
    const sk = o.sk ?? 'AB';
    // intervals without floor-level openings
    const cuts = ops.filter((p) => (p.y0 ?? 0) < .05).map((p) => [p.at - p.w / 2, p.at + p.w / 2]).sort((a, b) => a[0] - b[0]);
    const segs = []; let cur = 0; cuts.forEach(([a, b]) => { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); }); if (cur < len) segs.push([cur, len]);
    for (const side of sk) {
      const sgn = side === 'B' ? 1 : -1, d = off + sgn * (t / 2 + .008);
      segs.forEach(([a, b]) => { if (b - a < .05) return; const c = (a + b) / 2; ctx.boxC(x1 + ux * c + nx * d, Y + .05, z1 + uz * c + nz * d, b - a, .1, .016, skirtM, ang); });
    }
    // casings for doors (opening with no glass & sill 0)
    ops.filter((p) => !p.glass && (p.y0 ?? 0) < .05 && !p.noCase).forEach((p) => {
      const hh = p.h ?? 2.2, a = p.at - p.w / 2, b = p.at + p.w / 2;
      for (const sgn of [1, -1]) {
        const d = off + sgn * (t / 2 + .012);
        [a - .04, b + .04].forEach((s) => ctx.boxC(x1 + ux * s + nx * d, Y + hh / 2 + .02, z1 + uz * s + nz * d, .08, hh + .04, .024, trimM, ang));
        ctx.boxC(x1 + ux * p.at + nx * d, Y + hh + .06, z1 + uz * p.at + nz * d, p.w + .16, .08, .024, trimM, ang);
      }
      // reveal lining
      ctx.boxC(x1 + ux * p.at + nx * off, Y + hh + .005, z1 + uz * p.at + nz * off, p.w, .01, t, trimM, ang);
    });
  }
  const glassEdge = mat({ color: '#8fcbe2', rough: .3 });
  // glass curtain wall: panels of ~w along a line, with optional door gaps [{a,b}] (distances along)
  function glazing(x1, z1, x2, z2, { gaps = [], panel = 1.5, mA = plaster, mB = plaster, top = 2.75 } = {}) {
    const len = Math.hypot(x2 - x1, z2 - z1); const ops = []; let cur = .05;
    const spans = []; gaps.sort((p, q) => p.a - q.a).forEach((gp) => { spans.push([cur, gp.a]); cur = gp.b; }); spans.push([cur, len - .05]);
    spans.forEach(([a, b]) => { const n = Math.max(1, Math.round((b - a) / panel)), w = (b - a) / n; for (let i = 0; i < n; i++) ops.push({ at: a + w * (i + .5), w: w - .04, y0: 0, h: top, glass: true }); });
    gaps.forEach((gp) => ops.push({ at: (gp.a + gp.b) / 2, w: gp.b - gp.a, y0: 0, h: top, noCase: true }));
    W(x1, z1, x2, z2, { t: .25, mA, mB, openings: ops, sk: '' });
    // blue edge line at floor (reads like the plan's glazing line) + slid-open door panels
    const ux = (x2 - x1) / len, uz = (z2 - z1) / len, ang = Math.atan2(-(z2 - z1), x2 - x1);
    ctx.boxC((x1 + x2) / 2, Y + .02, (z1 + z2) / 2, len, .04, .15, glassEdge, ang); // plan's blue glazing line (sill)
    gaps.forEach((gp) => { const w = gp.b - gp.a, c = gp.b + w / 2 - .1; const nx = uz, nz = -ux; // slid panel parked beside the gap
      const gm = new THREE.Mesh(new THREE.BoxGeometry(w, top - .05, .02), M.glass()); gm.position.set(x1 + ux * c + nx * .08, Y + top / 2, z1 + uz * c + nz * .08); gm.rotation.y = ang; ctx.add(gm, { cast: false });
      const fr = M.frame(); [-1, 1].forEach((s) => ctx.boxC(x1 + ux * (c + s * w / 2) + nx * .08, Y + top / 2, z1 + uz * (c + s * w / 2) + nz * .08, .04, top - .05, .05, fr, ang));
      ctx.boxC(x1 + ux * c + nx * .08, Y + .02, z1 + uz * c + nz * .08, w, .04, .05, fr, ang);
    });
  }

  // plan-style door: leaf hinged at H, closed toward A, drawn open toward B (90°), with a filled swing arc on the floor
  const arcLight = mat({ color: '#f3e8d6', rough: .8 });
  const arcLine = mat({ color: '#6d6a66', rough: .8 });
  function swingDoor(hx, hz, ax, az, bx, bz, fill, dy = 0) {
    const w = Math.hypot(ax - hx, az - hz), tA = Math.atan2(-(az - hz), ax - hx), tB = Math.atan2(-(bz - hz), bx - hx);
    let d = tB - tA; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const t0 = d > 0 ? tA : tB;
    const sec = new THREE.Mesh(new THREE.CircleGeometry(w, 24, t0, Math.PI / 2), fill); sec.rotation.x = -Math.PI / 2; sec.position.set(hx, Y + .004 + dy, hz); ctx.add(sec, { cast: false });
    const arc = new THREE.Mesh(new THREE.RingGeometry(w - .025, w, 24, 1, t0, Math.PI / 2), arcLine); arc.rotation.x = -Math.PI / 2; arc.position.set(hx, Y + .005 + dy, hz); ctx.add(arc, { cast: false });
    const ux = (bx - hx) / w, uz = (bz - hz) / w;
    ctx.boxC(hx + ux * w / 2, Y + 1.1, hz + uz * w / 2, w - .04, 2.18, .045, mat({ color: '#6b4429', map: tex.wood('#6b4429', 2), tile: 1, rough: .5 }), Math.atan2(-uz, ux));
  }
  // brick deck east of the maid's room (continues b_wellness's herringbone court; same texture key/recipe)
  {
    const herr = tex.custom('bw_herr' + '#a97060' + 49, (g, n) => {
      let s = 49; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const c = new THREE.Color(); const u = n / 32;
      g.fillStyle = '#714335'; g.fillRect(0, 0, n, n);
      const brickAt = (x, y, w, h) => { const k = .86 + R() * .26; c.set('#a97060').multiplyScalar(k); g.fillStyle = '#' + c.getHexString(); g.fillRect(x * u + 1, y * u + 1, w * u - 2, h * u - 2);
        g.globalAlpha = .12; for (let i = 0; i < 6; i++) { g.fillStyle = R() < .5 ? '#fff' : '#000'; g.fillRect(x * u + 1 + R() * (w * u - 4), y * u + 1 + R() * (h * u - 4), 2, 2); } g.globalAlpha = 1; };
      for (let k = -36; k < 36; k++) for (let t = -12; t < 12; t++) { const x0 = k + 4 * t, y0 = k; if (x0 < -3 || x0 > 33 || y0 < -3 || y0 > 33) continue; brickAt(x0, y0, 2, 1); brickAt(x0, y0 + 1, 1, 2); }
    });
    const brick = mat({ color: '#ffffff', map: herr, tile: 4, rough: .85 });
    ctx.rect(47.03, 15.5, 49, 18.98, Y, brick);
    ctx.rect(48.8, 14.6, 49, 15.5, Y, brick);
  }

  // ------------------------------------------------------------- floors
  ctx.rect(27, 9.75, 34.5, 23.65, Y, creamFloor);       // main hall + living
  ctx.rect(29.5, 7.44, 32.6, 9.75, Y, creamFloor);      // north arm to gym
  ctx.rect(34.5, 17.1, 40.4, 23.65, Y, creamFloor);     // gaming + corridors
  ctx.rect(37.75, 14.75, 40.4, 17.1, Y, creamFloor);    // storage
  ctx.rect(27, 7.44, 29.5, 9.75, Y, mat({ color: '#ffffff', map: tex.tiles('#d9dadb', '#c9cacb', 4, .015, 31), tile: 2.4, rough: .4 })); // garage lobby / closet: light grey (plan)
  ctx.rect(34.5, 14.75, 37.75, 17.1, Y, wcTile);        // WC
  ctx.rect(40.4, 14.75, 46.9, 21.25, Y, maidFloor);     // maid room
  ctx.rect(44.8, 21.25, 49, 23.65, Y, maidFloor);       // maid room south bay
  ctx.rect(46.9, 19.1, 49, 21.25, Y, wcTile);           // maid WC
  ctx.rect(40.4, 21.25, 41.8, 23.65, Y, landing);       // stair landing
  // under the stair: grey treads drawn on the floor so the plan cut (which clips the upper flight) still reads as two flights
  const treadStripe = mat({ map: tex.custom('bl_treads2', (g, n) => { g.fillStyle = '#c3c8c4'; g.fillRect(0, 0, n, n); g.fillStyle = '#8a8f8b'; for (let i = 0; i < 10; i++) g.fillRect(i * n / 10, 0, 4, n); }, 256), tile: 2.15, rough: .4 });
  ctx.rect(41.8, 21.25, 44.8, 23.65, Y, treadStripe);
  // lift car floor (plan shows diagonal symbol)
  {
    const lm = mat({ map: tex.custom('bl_lift', (g, n) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, n, n); const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#d8c9b0'); gr.addColorStop(.5, '#8f7550'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(n, 0); g.lineTo(n, n); g.closePath(); g.fill(); }), rough: .4 });
    const pg = new THREE.PlaneGeometry(1.7, 2.05); const m = new THREE.Mesh(pg, lm); m.rotation.x = -Math.PI / 2; m.position.set(33.55, Y + .003, 9.275); ctx.add(m, { walk: true, cast: false });
    ctx.rect(32.6, 8.15, 34.5, 10.4, Y, mat({ color: '#3a3836', rough: .6 }));
  }

  // ------------------------------------------------------------- walls
  // shared half walls (t .1 toward my side)
  W(27, 7.44, 29.5, 7.44, { t: .1, off: -.05, sk: 'A' });
  W(29.5, 7.44, 32.6, 7.44, { t: .1, off: -.05, sk: 'A', openings: [{ at: 1.7, w: 1.2, h: 2.3 }] });
  swingDoor(31.8, 7.44, 30.6, 7.44, 31.8, 6.24, arcLight, .006); // single leaf swinging north into the gym (plan)
  W(32.6, 7.44, 32.6, 8.15, { t: .1, off: -.05, sk: 'A' });
  W(32.6, 8.15, 34.5, 8.15, { t: .1, off: -.05, sk: '' });
  W(27, 7.44, 27, 9.75, { t: .1, off: .05, sk: 'B', openings: [{ at: 1.15, w: 1.6, h: 2.3 }] });
  ctx.box(27.1, Y, 7.62, 27.14, Y + 2.25, 8.5, mat({ color: '#8a8a8a', rough: .5 })); // sliding leaf parked beside the opening
  W(27, 9.75, 27, 11.9, { t: .1, off: .05, sk: 'B' });
  // full-depth to meet b_men's half wall (z 23.8-23.9) so the plan reads one solid wall
  W(27, 23.65, 40.4, 23.65, { t: .25, off: -.025, sk: 'B', openings: [{ at: 12.2, w: 1.0, h: 2.3, noCase: true }] });
  // pilasters where b_men's walls meet the corridor wall
  [34.5, 37.75].forEach((x) => W(x, 23.25, x, 24.05, { t: .15, sk: '' })); // jamb stubs through the wall (plan)

  // garage lobby / fin / lift
  W(29.5, 7.44, 29.5, 9.75, { openings: [{ at: 1.69, w: 1.0, h: 2.3, noCase: true }] });
  ctx.box(29.36, Y, 8.55, 29.41, Y + 2.25, 9.65, mat({ color: '#8a8a8a', rough: .5 })); // sliding door panel along the east wall (plan)
  W(27, 9.75, 28.3, 9.75);
  W(29.5, 9.75, 29.5, 11.9, { t: .15 });
  const steel = M.steel();
  W(32.6, 8.15, 32.6, 10.4, { t: .2, sk: 'A', openings: [{ at: 1.175, w: 1.0, h: 2.2, noCase: true }] });
  W(32.6, 10.4, 34.5, 10.4, { t: .2, sk: 'B' });
  ctx.box(32.55, Y, 8.67, 32.62, Y + 2.2, 9.17, steel, { collide: true }); ctx.box(32.55, Y, 9.18, 32.62, Y + 2.2, 9.68, steel, { collide: true });
  ctx.box(32.48, Y, 8.6, 32.5, Y + 2.3, 9.75, M.frame());
  ctx.box(32.45, Y + 1.0, 9.85, 32.5, Y + 1.2, 9.95, steel); // call button
  W(34.5, 8.15, 34.5, 10.4, { t: .25, mB: ext, sk: '' });

  // east glazing to pool court (sliding door at the arrow z~12.4)
  glazing(34.5, 10.4, 34.5, 14.75, { gaps: [{ a: 1.25, b: 2.75 }], mB: ext, panel: 1.3 });
  // west glazing to sunken patio (sliding door at arrow z~13.5)
  glazing(27, 11.9, 27, 23.65, { gaps: [{ a: .9, b: 2.3 }], mA: ext, panel: 1.6 });

  // north exterior wall to pool court
  W(34.5, 14.75, 37.75, 14.75, { t: .25, mA: wcWall, mB: ext, sk: '' });
  W(37.75, 14.75, 46.9, 14.75, { t: .25, mA: plaster, mB: ext, sk: 'A' });
  glazing(46.9, 14.75, 46.9, 19.1, { mB: ext, panel: 1.45 });
  W(46.9, 19.1, 49, 19.1, { t: .25, mA: wcWall, mB: ext, sk: '' });
  W(49, 19.1, 49, 21.25, { t: .25, mA: ext, mB: wcWall, sk: '' });
  W(49, 21.25, 49, 23.65, { t: .25, mA: ext, sk: 'B' });
  W(40.4, 23.65, 49, 23.65, { t: .25, off: -.05, mA: ext, sk: 'B' });

  // WC block
  W(34.5, 14.75, 34.5, 17.1, { mB: wcWall, sk: 'A', openings: [{ at: .85, w: .85, h: 2.2, door: { color: '#6b4429', swing: 1, open: 1.25 } }] });
  // partial partition + diagonal glass screen (plan) instead of a full cubicle wall
  W(35.98, 14.75, 35.98, 15.55, { t: .1, m: wcWall, sk: '' });
  W(35.98, 16.5, 35.98, 17.1, { t: .1, m: wcWall, sk: '' });
  { const gl = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(.92, .85), 2.1, .02), M.glass()); gl.position.set(36.44, Y + 1.05, 15.98); gl.rotation.y = -Math.atan2(.85, .92); ctx.add(gl, { cast: false });
    ctx.boxC(36.44, Y + .02, 15.98, Math.hypot(.92, .85), .04, .06, mat({ color: '#b9b9b6', rough: .4 }), -Math.atan2(.85, .92)); }
  W(34.5, 17.1, 37.75, 17.1, { mB: wcWall, sk: 'A' });
  W(37.75, 14.75, 37.75, 17.1, { mA: wcWall, sk: 'B' });
  W(37.75, 17.1, 39.25, 17.1);
  W(39.2, 16.1, 39.2, 17.1, { t: .1 });
  // gaming room
  W(34.5, 17.1, 34.5, 21.8);
  W(37.75, 17.1, 37.75, 21.3);
  W(34.5, 21.3, 37.75, 21.3, { openings: [{ at: 1.65, w: 1.0, h: 2.2, noCase: true }] });
  ctx.box(35.65, Y, 21.24, 36.65, Y + .03, 21.36, mat({ color: '#dad0c1', rough: .5 })); // light threshold strip (plan)
  swingDoor(35.65, 21.3, 36.65, 21.3, 35.65, 20.3, arcLight);
  // maid room, stair, maid WC
  W(40.4, 14.75, 40.4, 22.6);
  W(40.4, 21.25, 44.8, 21.25, { openings: [{ at: .825, w: .95, h: 2.2 }] });
  swingDoor(41.7, 21.25, 40.75, 21.25, 41.7, 20.3, arcLight);   // into the maid's room (plan)
  W(44.8, 21.25, 44.8, 23.65);
  W(46.9, 19.1, 46.9, 21.25, { mB: wcWall, sk: 'A', openings: [{ at: 1.525, w: 1.0, h: 2.2 }] });
  swingDoor(46.9, 21.15, 46.9, 20.15, 47.9, 21.15, maidFloor); // maid W.C. door swings into the W.C.
  W(46.9, 21.25, 49, 21.25, { mB: wcWall, sk: 'A' });

  // ------------------------------------------------------------- slab + ceilings
  const slabPts = [[27, 7.44], [32.6, 7.44], [32.6, 8.15], [34.5, 8.15], [34.5, 14.75], [46.9, 14.75], [46.9, 19.1], [49, 19.1], [49, 23.65], [27, 23.65]];
  const hole = [[41.8, 21.3], [44.75, 21.3], [44.75, 23.6], [41.8, 23.6]];
  ctx.poly(slabPts, -0.02, mat({ color: '#9a9590', rough: .9 }), { thick: .36, walk: true, holes: [hole] });
  ctx.poly(slabPts, CEIL, ceilM, { up: false, walk: false, holes: [hole] });
  // cove/bulkhead frame over the living seating
  {
    const x0 = 27.4, x1 = 33.6, z0 = 15.6, z1 = 22.8, w = .55, yb = CEIL - .3;
    const bm = ceilM, cove = M.lightPanel();
    ctx.box(x0, yb, z0, x1, CEIL, z0 + w, bm); ctx.box(x0, yb, z1 - w, x1, CEIL, z1, bm);
    ctx.box(x0, yb, z0 + w, x0 + w, CEIL, z1 - w, bm); ctx.box(x1 - w, yb, z0 + w, x1, CEIL, z1 - w, bm);
    ctx.box(x0 + w, yb + .05, z0 + w, x1 - w, yb + .07, z0 + w + .03, cove); ctx.box(x0 + w, yb + .05, z1 - w - .03, x1 - w, yb + .07, z1 - w, cove);
    ctx.box(x0 + w, yb + .05, z0 + w, x0 + w + .03, yb + .07, z1 - w, cove); ctx.box(x1 - w - .03, yb + .05, z0 + w, x1 - w, yb + .07, z1 - w, cove);
    for (const [x, z] of [[x0 + .27, z0 + 1.5], [x0 + .27, (z0 + z1) / 2], [x0 + .27, z1 - 1.5], [x1 - .27, z0 + 1.5], [x1 - .27, (z0 + z1) / 2], [x1 - .27, z1 - 1.5]]) ctx.downlight(x, z, yb);
    // chandelier disc in the coffer
    ctx.cyl(30.5, CEIL - .45, 19.2, .45, .06, M.lightPanel(), 32); ctx.cyl(30.5, CEIL - .4, 19.2, .02, .4, M.steel(), 6);
  }
  // downlights
  const dl = (xs, zs) => xs.forEach((x) => zs.forEach((z) => ctx.downlight(x, z, CEIL)));
  dl([28.2, 31.1], [8.6]); dl([30.5, 31.9], [10.5]); dl([28.2, 30.5, 33.0], [12.0]); dl([28.2, 33.0], [14.6]);
  dl([35.5, 37.0, 38.5, 39.9], [22.5]); dl([39.1], [18.0, 20.0]); dl([35.2, 36.9], [15.9]); dl([35.4, 36.9], [18.3, 20.3]);
  dl([39.1], [15.9]); dl([42.0, 43.7, 45.4], [16.4, 18.6, 20.4]); dl([46.3, 47.9], [22.4]); dl([47.95], [20.2]); dl([41.1], [22.4]);

  // ------------------------------------------------------------- living area furniture
  {
    const rt = tex.custom('bl_shag', (g, n) => {
      let s = 11; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      g.clearRect(0, 0, n, n); const m = 34; g.fillStyle = '#736660'; g.fillRect(m, m, n - 2 * m, n - 2 * m);
      for (let i = 0; i < 30000; i++) { const x = m - 26 + R() * (n - 2 * m + 52), y = m - 26 + R() * (n - 2 * m + 52); const edge = Math.min(x - m, y - m, n - m - x, n - m - y); if (edge < 0 && R() > Math.exp(edge / 9)) continue;
        const q = R(); g.strokeStyle = q < .33 ? '#8a7d78' : q < .66 ? '#5e524d' : '#776a64'; g.globalAlpha = edge < 0 ? 1 : .6; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y); const a = R() * 6.28; g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); g.stroke(); }
      g.globalAlpha = 1;
    }, 1024);
    const rm = new THREE.MeshStandardMaterial({ map: rt, roughness: 1, transparent: false, alphaTest: .4 });
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 5.2), rm); rg.rotation.x = -Math.PI / 2; rg.position.set(29.95, Y + .012, 19.35); ctx.add(rg, { cast: false });
  }
  const sofa = (len, cx, cz, ry, arms = true) => ctx.place(F.sofa({ len, depth: .78, color: beige, cushions: Math.max(1, Math.round(len / .75)), arms, legs: '#8a6d4b' }), cx, Y, cz, ry, { collide: true });
  // top-right L
  sofa(2.2, 31.9, 16.38, 0); sofa(1.3, 32.62, 17.42, -Math.PI / 2, false);
  ctx.place(F.armchair({ color: beige, w: .74, d: .72 }), 32.58, Y, 18.66, -Math.PI / 2 + .08, { collide: true });
  ctx.place(F.ottoman({ w: .66, d: .66, color: '#e2d5b2' }), 32.6, Y, 19.62);
  // bottom-left L and bottom-right L (facing each other across the rug)
  sofa(1.4, 28.0, 21.08, Math.PI / 2, false); sofa(2.3, 28.75, 22.12, Math.PI);
  sofa(1.4, 32.6, 21.08, -Math.PI / 2, false); sofa(2.25, 31.88, 22.12, Math.PI);
  // tilted armchair + pouf
  ctx.place(F.armchair({ color: beige, w: .9, d: .85 }), 29.3, Y, 16.2, .45, { collide: true });
  ctx.place(F.ottoman({ w: .62, d: .62, color: '#e2d5b2' }), 28.65, Y, 17.05);
  // coffee tables (light, upholstered-look tops as drawn)
    // plain pale-beige upholstered coffee tables (plan): flat slab top, recessed plinth
  { const tm = mat({ color: '#e2d3b0', rough: .8 }), pm = mat({ color: '#b9a888', rough: .8 });
    [[30.6, 17.65, 1.4], [30.95, 20.95, 1.4]].forEach(([x, z, w]) => { ctx.box(x - w / 2 + .06, Y, z - .29, x + w / 2 - .06, Y + .08, z + .29, pm); ctx.box(x - w / 2, Y + .08, z - .35, x + w / 2, Y + .4, z + .35, tm, { collide: true }); }); }
  [[30.75, 16.38], [29.88, 22.1], [30.72, 22.1]].forEach(([x, z]) => ctx.place(F.sideTable({ s: .38, h: .5, top: '#cdb68c' }), x, Y, z, .5));
  [[30.75, 16.38], [29.88, 22.1], [30.72, 22.1]].forEach(([x, z]) => { ctx.cyl(x, Y + .5, z, .03, .3, M.steel(), 6); ctx.cyl(x, Y + .8, z, .13, .22, mat({ color: '#fff3dc', emissive: '#ffe2a8', emissiveIntensity: .5 }), 16); });

  // billiards table
  {
    const g = new THREE.Group(); const fr = mat({ color: '#7d7a72', rough: .5 }); const felt = mat({ color: '#ffffff', map: tex.carpet('#6f7a52', 52), tile: .5, rough: 1 });
    const add = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); };
    add(2.4, .2, 1.1, 0, .55, 0, fr); add(2.7, .12, 1.38, 0, .74, 0, fr); add(2.46, .02, 1.14, 0, .805, 0, felt);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(.16, .5, .16, a * 1.05, .25, b * .42, fr));
    const pm = M.black(); [[-1.23, -.57], [0, -.58], [1.23, -.57], [-1.23, .57], [0, .58], [1.23, .57]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .03, 12), pm); p.position.set(x, .81, z); g.add(p); });
    const bm = mat({ color: '#f2efe6', rough: .2 }); [[.6, .1], [-.7, -.2], [.2, -.3]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), bm); s.position.set(x, .845, z); g.add(s); });
    ctx.place(g, 30.57, Y, 13.62, 0, { collide: true });
    // pendant over the table
    ctx.box(29.6, CEIL - .7, 13.47, 31.55, CEIL - .58, 13.77, mat({ color: '#2b2b2b', rough: .4, metal: .5 }));
    ctx.box(29.65, CEIL - .71, 13.5, 31.5, CEIL - .7, 13.74, M.lightPanel());
    [29.8, 31.35].forEach((x) => ctx.box(x - .005, CEIL - .58, 13.615, x + .005, CEIL, 13.625, M.steel()));
    // cue rack on the fin wall
    ctx.box(29.58, Y + .9, 10.3, 29.62, Y + 2.1, 11.3, darkWood);
    for (let i = 0; i < 6; i++) ctx.box(29.62, Y + .3, 10.38 + i * .16, 29.64, Y + 1.75, 10.39 + i * .16, mat({ color: '#c49a62', rough: .4 }));
  }
  // plants and console in the hall
  // garage lobby: shoe cabinet along north wall
  ctx.box(27.5, Y, 7.5, 29.1, Y + .9, 7.9, mat({ color: '#f2efe8', rough: .5 }), { collide: true });

  // ------------------------------------------------------------- WC
  {
    const v1 = F.vanity({ len: 1.1, top: '#5d4433', cab: '#4e3828' }); ctx.place(v1, 35.2, Y, 16.8, Math.PI);
    const v2 = F.vanity({ len: 1.4, top: '#d6c9b0', cab: '#6b4c33' }); ctx.place(v2, 36.85, Y, 15.1, 0);
    ctx.place(F.toilet(), 36.45, Y, 16.72, Math.PI); ctx.place(F.toilet(), 37.25, Y, 16.72, Math.PI); // WC + bidet
  }

  // ------------------------------------------------------------- storage + dark wood cabinetry strip
  // single dark-wood clad strip running from the storage into the corridor (plan: x 37.9-38.55, z 14.8-20.7)
  const stripM = mat({ map: tex.wood('#5d4a40', 3, 44), tile: 1, rough: .5 });
  ctx.box(37.88, Y, 14.88, 38.55, Y + 2.35, 17.03, stripM, { collide: true });
  ctx.box(37.88, Y, 17.17, 38.55, Y + 2.35, 20.7, stripM, { collide: true });

  // ------------------------------------------------------------- gaming room
  ctx.box(35.5, Y, 17.17, 36.7, Y + .55, 17.45, mat({ color: '#b0a38c', rough: .5 }), { collide: true }); // TV console bar (plan)
  ctx.box(35.6, Y + .9, 17.17, 36.6, Y + 1.5, 17.21, M.black());
  ctx.place(F.armchair({ color: beige, w: .85, d: .85 }), 35.35, Y, 19.25, 2.73, { collide: true });
  ctx.place(F.armchair({ color: beige, w: .85, d: .85 }), 37.0, Y, 19.2, -2.68, { collide: true });

  // maid's room: plan shows it empty (no furniture)
  // maid WC
  ctx.place(F.toilet(), 48.55, Y, 19.75, -Math.PI / 2);
  ctx.place(F.vanity({ len: .7, top: '#e9e2d6', cab: '#6b4c33' }), 47.6, Y, 19.4, 0);

  // ------------------------------------------------------------- stair B -> G (dogleg, flights run east-west)
  {
    const r = 1.8 / 11, td = 2.15 / 10, x0 = 41.8, xl = x0 + 10 * td; // xl = landing start (43.95)
    const nose = mat({ color: '#8e938d', rough: .4 });
    const stringer = mat({ color: '#c9ceca', rough: .8 });
    const flight2M = mat({ color: '#aeb3af', rough: .8 }); // reads as the grey upper flight where the plan cut clips it
    // flight 1: south lane, rising east
    for (let i = 0; i < 10; i++) { const top = Y + (i + 1) * r; ctx.box(x0 + i * td, Y, 22.47, x0 + (i + 1) * td, top, 23.6, stringer, { walk: true }); ctx.box(x0 + i * td, top - .001, 22.47, x0 + (i + 1) * td, top + .02, 23.6, treadM, { walk: true }); ctx.box(x0 + i * td, top, 22.47, x0 + i * td + .03, top + .021, 23.6, nose); }
    // landing at -1.8
    ctx.box(xl, Y, 21.3, 44.75, Y + 11 * r, 23.6, stringer, { walk: true }); ctx.box(xl, Y + 11 * r - .001, 21.3, 44.75, Y + 11 * r + .02, 23.6, treadM, { walk: true });
    // flight 2: north lane, rising west, from landing (-1.8) to ground (0)
    const yl = Y + 11 * r;
    // built as tread slabs + riser plates (not solid blocks) so the plan cut drops the upper steps cleanly and the
    // striped floor beneath reads as the run of treads
    for (let j = 0; j < 10; j++) { const top = yl + (j + 1) * r, xa = xl - (j + 1) * td, xb = xl - j * td; ctx.box(xa, top - .05, 21.3, xb, top + .02, 22.37, treadM, { walk: true }); ctx.box(xb - .025, top - r, 21.3, xb, top - .049, 22.37, flight2M); ctx.box(xb - .03, top, 21.3, xb, top + .021, 22.37, nose); }
    // soffit under flight 2 (sloped), and the support wall between lanes up to flight-1 tread line
    const ang = Math.atan2(1.8, 2.15), Ls = Math.hypot(2.15, 1.8);
    ctx.box(x0, Y, 22.37, xl, yl - .1, 22.47, mat({ color: '#5c605d', rough: .6 }), { collide: true }); // thin divider wall: the plan's single dark bar
    // handrails: centre rail (both flights) + wall rails
    const rail = mat({ color: '#8d928e', rough: .3, metal: .5 });
    const sloped = (cx, cy, cz, dir) => { const m = new THREE.Mesh(new THREE.BoxGeometry(Ls, .05, .06), rail); m.position.set(cx, cy, cz); m.rotation.z = dir * ang; ctx.add(m); };
    sloped((x0 + xl) / 2, Y + .9 + .9, 22.42, 1);            // flight 1 centre rail
    sloped((x0 + xl) / 2, yl + .9 + .9, 22.42, -1);          // flight 2 centre rail
    sloped((x0 + xl) / 2, Y + .9 + .9, 23.52, 1);            // wall rail S
    sloped((x0 + xl) / 2, yl + .9 + .9, 21.38, -1);          // wall rail N
    for (let i = 0; i <= 10; i += 2) { const x = x0 + i * td + td / 2; const t1 = Y + Math.min(11, i + 1) * r; ctx.box(x - .015, t1, 22.40, x + .015, t1 + .9 + td / 2 * Math.tan(ang), 22.44, rail); }
    for (let j = 0; j <= 10; j += 2) { const x = xl - j * td - td / 2; const t2 = yl + Math.min(11, j + 1) * r; ctx.box(x - .015, t2, 22.40, x + .015, t2 + .9 + td / 2 * Math.tan(ang), 22.44, rail); }
    // landing rail around the open end at the top of flight 2 is g_service's; guard on hole edge at the ground level is theirs too.
  }
  // WORKAROUND (main.js): framePlan's Box3.setFromObject doesn't update parent matrices, so children of placed groups
  // would be measured at their local (un-placed) height and hidden in plan view. Update world matrices now.
  ctx.group.updateMatrixWorld(true);
}
