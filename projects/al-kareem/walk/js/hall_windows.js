// owned by the 'hall_windows' builder
// The window parts (z = SPEC.endWallSplitZ … hall.z1) of the two END walls of the prayer hall: painted wall over a 1.28 m honed-limestone dado,
// with openings cut exactly at the SketchUp model's own windows (three lower rectangles + two upper pointed arches per wall).
// Nothing is invented here: outlines and depths are read from the model's window meshes; its frames, glass and the real
// outside are what is seen through the openings, and ctx.sun shines through them for real.
import * as THREE from 'three';

export const views = {
  hall_windows: { pos: [9.2, 2.6, -10.0], look: [12.8, 4.4, 3.14], fov: 58 },
};

const WAINZ = 0.02;     // dado stands this far proud of the painted wall (as on hall_core's door strips)
const DADO = 1.28;      // dado datum shared with the qibla wall and the door strips
const INSET = 0.003;    // openings are this much tighter than the model's, so the reveals never z-fight the shell's own jambs
// model window instances, in the order of SPEC.endWindows (lower 1..3, upper 1..2)
const INST = { east: { lower: [20, 19, 12], upper: [126, 125] }, west: { lower: [25, 23, 21], upper: [128, 127] } };

// ---------------------------------------------------------------- small geometry builder
class Geo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; }
  quad(a, b, c, d, { uvs, cols, col } = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = new THREE.Vector3(...c), Dv = new THREE.Vector3(...d);
    const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(Dv, A));
    if (n.lengthSq() < 1e-12) n.subVectors(C, B).cross(new THREE.Vector3().subVectors(A, B));
    n.normalize();
    const k = this.p.length / 3; const pts = [a, b, c, d];
    for (let j = 0; j < 4; j++) {
      this.p.push(...pts[j]); this.n.push(n.x, n.y, n.z);
      const u = uvs ? uvs[j] : [0, 0]; this.uv.push(u[0], u[1]);
      const cc = cols ? cols[j] : (col || [1, 1, 1]); this.c.push(cc[0], cc[1], cc[2]);
    }
    this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i); return g;
  }
}

// ---------------------------------------------------------------- honed limestone, copied verbatim from hall_mihrab.js (honed + ledgeMat)
const NT = new Float32Array(65536); { let s = 12345; for (let i = 0; i < 65536; i++) { s = (s * 1664525 + 1013904223) >>> 0; NT[i] = s / 4294967296; } }
function vnoise(x, y, per, s) { // tileable value noise, lattice period `per` (table based)
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % per) + per) % per, x1 = (x0 + 1) % per, y0 = ((yi % per) + per) % per, y1 = (y0 + 1) % per, o = (s * 7919) & 65535;
  const a = NT[(y0 * 257 + x0 + o) & 65535], b = NT[(y0 * 257 + x1 + o) & 65535], c = NT[(y1 * 257 + x0 + o) & 65535], d = NT[(y1 * 257 + x1 + o) & 65535];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(u, v, base = 4, oct = 4, s = 1) { let a = 0.5, t = 0, n = 0, f = base; for (let o = 0; o < oct; o++) { t += a * vnoise(u * f, v * f, f, s + o * 13); n += a; a *= 0.5; f *= 2; } return t / n; }
// modulate an existing canvas per pixel: fn(u,v,[r,g,b]) -> multiplies/sets
function modulate(g, w, h, fn) { const im = g.getImageData(0, 0, w, h), d = im.data; const px = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; px[0] = d[i]; px[1] = d[i + 1]; px[2] = d[i + 2]; fn(x / w, y / h, px); d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; }
  g.putImageData(im, 0, 0); }
function makeStone(lib) {
  function macro(mat, amp, s1 = 0.33, s2 = 1.3, worldUV = false) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPm;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPm = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWPm; float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float mn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x), mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x), f.y), mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x), mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x), f.y), f.z); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n{ float mac = mn(vWPm*${s1.toFixed(3)})*.6 + mn(vWPm*${s2.toFixed(3)}+7.3)*.4; diffuseColor.rgb *= ${(1 - amp).toFixed(3)} + ${(2 * amp).toFixed(3)}*mac; }`); };
    mat.customProgramCacheKey = () => 'macro' + amp + '_' + s1 + '_' + s2 + worldUV; return mat; }
  function honed(seed) { const W = 1024, pw = W / 2, ph = W / 4, r = lib.rng(seed);
    const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#fff'; hg.fillRect(0, 0, W, W); hg.fillStyle = '#000';
    const map = lib.canvasTex(W, W, (g) => { g.fillStyle = 'rgb(226,212,186)'; g.fillRect(0, 0, W, W);
      for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) { const v = 0.97 + r() * 0.06, w2 = (r() - .5) * 3; g.fillStyle = `rgb(${226 * v + w2 | 0},${212 * v | 0},${186 * v - w2 | 0})`; g.fillRect(i * pw + (j % 2) * pw / 2, j * ph, pw, ph); }
      g.filter = 'blur(5px)'; for (let k = 0; k < 26; k++) { const x = r() * W, y = r() * W, a = (r() - .5) * 0.7; g.strokeStyle = r() < .5 ? `rgba(255,250,238,${0.04 + r() * 0.04})` : `rgba(150,128,96,${0.03 + r() * 0.035})`; g.lineWidth = 5 + r() * 16;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 120 * Math.cos(a), y + 120 * Math.sin(a) + (r() - .5) * 60, x + 240 * Math.cos(a), y + 240 * Math.sin(a) + (r() - .5) * 60, x + 380 * Math.cos(a), y + 380 * Math.sin(a)); g.stroke(); } g.filter = 'none';
      modulate(g, W, W, (u, v, p) => { const n = 0.972 + fbm(u, v, 3, 4, seed) * 0.056 + (Math.random() - .5) * .012; p[0] *= n; p[1] *= n; p[2] *= n; });
      g.fillStyle = 'rgba(120,104,80,0.55)';
      for (let j = 0; j < 4; j++) { g.fillRect(0, j * ph, W, 1.6); hg.fillRect(0, j * ph - 1, W, 3); for (let i = -1; i < 3; i++) { const x = i * pw + (j % 2) * pw / 2; g.fillRect(x, j * ph, 1.6, ph); hg.fillRect(x - 1, j * ph, 3, ph); } }
    }, { repeat: [1 / 2.56, 1 / 2.56] });
    return { map, normalMap: lib.normalFromHeight(hc, 1.4, { repeat: [1 / 2.56, 1 / 2.56] }) }; }
  const ledgeT = honed(29);
  return macro(lib.std({ color: 0xffffff, map: ledgeT.map, normalMap: ledgeT.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: .62, metalness: 0, side: THREE.DoubleSide }), .03, .3, 1.1);
}

// ---------------------------------------------------------------- reading the model
function hull2(pts) {
  const P = [...new Map(pts.map((p) => [Math.round(p[0] * 1000) + '_' + Math.round(p[1] * 1000), p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-9) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 1e-9) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));   // counter-clockwise
}
// world-space vertices of the model's window instance `id`; frameOnly = only its stone frame mesh (whose hull is the arch)
function instVerts(ctx, id, frameOnly) {
  const re = new RegExp('Instance_' + id + '__' + (frameOnly ? 'Sandstone$' : '')); const out = []; const v = new THREE.Vector3();
  for (const m of ctx.zones.hall || []) { if (!re.test(m.name)) continue; m.updateWorldMatrix(true, false); const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); out.push([v.x, v.y, v.z]); } }
  return out;
}
// one opening: outline [[z, yAboveFloor] …] counter-clockwise in world z, and the x of the model frame's room-side face
function readOpening(ctx, id, spec, arched, side, xSpec) {
  const F = ctx.SPEC.floorY; let V = instVerts(ctx, id, arched); if (arched && V.length < 8) V = instVerts(ctx, id, false);
  let pts, xFace = xSpec, fromModel = V.length >= 4;
  if (fromModel) { pts = hull2(V.map((p) => [p[2], p[1] - F])); const xs = instVerts(ctx, id, false).map((p) => p[0]); xFace = side > 0 ? Math.min(...xs) : Math.max(...xs); }
  else { pts = [[spec.z0, spec.y0 - F], [spec.z1, spec.y0 - F], [spec.z1, spec.y1 - F], [spec.z0, spec.y1 - F]]; console.warn('hall_windows: model window ' + id + ' not found, using SPEC.endWindows'); }
  // tighten by INSET towards the centroid, clamp to the floor
  const cz = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  pts = pts.map(([z, y]) => [z + Math.sign(cz - z) * INSET, Math.max(0, y + Math.sign(cy - y) * INSET)]);
  const zs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { pts, z0: Math.min(...zs), z1: Math.max(...zs), y0: Math.min(...ys), y1: Math.max(...ys), xFace, arched, fromModel };
}

// ---------------------------------------------------------------- one end wall
// Local frame: x = u along the wall, y = v up from the floor, +z = into the room, -z = outwards (towards the model wall).
function buildWall(ctx, o) {
  const { lib, SPEC } = ctx; const H = SPEC.hall.ceil, WH = DADO; const { ua, ub, opens, toU, xLining, side, stoneMat } = o;
  const grp = new THREE.Group();
  // openings in local coordinates
  const L = opens.map((w) => { const pts = w.pts.map(([z, y]) => [toU(z), y]); const us = pts.map((p) => p[0]);
    return { pts, u0: Math.min(...us), u1: Math.max(...us), v0: w.y0, v1: w.y1, depth: Math.abs(w.xFace - xLining) - 0.004, arched: w.arched }; }).sort((a, b) => a.u0 - b.u0);
  const toFloor = L.filter((w) => w.v0 < 0.02), holes = L.filter((w) => w.v0 >= 0.02);

  // --- plaster, floor to ceiling, warm grey-white, slightly darker towards the ceiling
  const outline = [[ua, 0]]; for (const w of toFloor) outline.push([w.u0, 0], [w.u0, w.v1], [w.u1, w.v1], [w.u1, 0]); outline.push([ub, 0], [ub, H], [ua, H]);
  const pgeo = lib.wallWithHoles(outline, holes.map((w) => w.pts));
  // calm warm off-white paint = the qibla wall's paint (hall_mihrab): soft vertical gradient over the height (UV v = metres above the floor).
  // The albedo is a touch cool so the low orange sun does not turn the wall orange; the warm emissive floor keeps the tone off-white.
  const paintTex = lib.canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ece8e0'); gr.addColorStop(0.25, '#f8f5ee'); gr.addColorStop(0.75, '#f8f5ee'); gr.addColorStop(1, '#eeeae2'); g.fillStyle = gr; g.fillRect(0, 0, w, h); lib.grain(g, w, h, 0.012, 9, 1); }, { repeat: [1 / 3, 1 / H] });
  const mPlaster = lib.std({ map: paintTex, roughness: 0.94, color: 0xe6e3de, emissive: 0xf6f1ea, emissiveIntensity: 0.13, side: THREE.DoubleSide });
  const mReveal = lib.std({ roughness: 0.94, color: 0xe2dfda, emissive: 0xf6f1ea, emissiveIntensity: 0.13, side: THREE.DoubleSide });
  const plaster = new THREE.Mesh(pgeo, mPlaster); plaster.receiveShadow = true; grp.add(plaster);

  // --- honed limestone dado to 1.28 m (UVs in metres from the floor, so the 0.64 m courses line up with the qibla wall and the door strips):
  // stops at the opening that runs to the floor, runs low under the other lower windows
  const wg = new Geo(), sg = new Geo(), cg = new Geo(); const cuts = L.filter((w) => w.v0 < WH).map((w) => ({ a: w.u0, b: w.u1, v: Math.min(w.v0, WH) }));
  const piece = (a, b, top, cap) => { if (b - a < 0.01 || top < 0.01) return;
    wg.quad([a, 0, WAINZ], [b, 0, WAINZ], [b, top, WAINZ], [a, top, WAINZ], { uvs: [[a, 0], [b, 0], [b, top], [a, top]] });
    const CS = Math.min(0.3, top); cg.quad([a, 0, WAINZ + .008], [b, 0, WAINZ + .008], [b, CS, WAINZ + .008], [a, CS, WAINZ + .008], { uvs: [[0, 0], [1, 0], [1, CS / 0.3], [0, CS / 0.3]] });
    if (!cap) return;
    wg.quad([a, top, WAINZ], [b, top, WAINZ], [b, top, 0], [a, top, 0], { uvs: [[a, top - WAINZ], [b, top - WAINZ], [b, top], [a, top]] });
    sg.quad([a, top, .002], [b, top, .002], [b, top + .05, .002], [a, top + .05, .002], { uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] }); };
  let u = ua; for (const c of cuts) { piece(u, c.a, WH, true); piece(c.a, c.b, c.v, false);
    for (const e of [c.a, c.b]) if (c.v < WH) wg.quad([e, c.v, WAINZ], [e, WH, WAINZ], [e, WH, 0], [e, c.v, 0], { uvs: [[e, c.v], [e, WH], [e + .02, WH], [e + .02, c.v]] });   // dado edge at the window jamb
    u = c.b; } piece(u, ub, WH, true);
  const wains = new THREE.Mesh(wg.build(), stoneMat);
  wains.receiveShadow = true; grp.add(wains);
  const grad = (stops, flip) => { const t = lib.canvasTex(4, 64, (g, w, h) => { const gr = flip ? g.createLinearGradient(0, 0, 0, h) : g.createLinearGradient(0, h, 0, 0); for (const [p, c] of stops) gr.addColorStop(p, c); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); t.wrapT = THREE.ClampToEdgeWrapping; return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }); };
  grp.add(new THREE.Mesh(sg.build(), grad([[0, 'rgba(40,34,28,.30)'], [1, 'rgba(40,34,28,0)']])));                                             // shadow line above the capping
  const cm = new THREE.Mesh(cg.build(), grad([[0, 'rgba(18,16,16,.5)'], [.35, 'rgba(18,16,16,.18)'], [1, 'rgba(18,16,16,0)']])); cm.renderOrder = 1; grp.add(cm);   // contact shadow at the floor
  const ag = new Geo(), AO = 0.9; ag.quad([ua, H - AO, .004], [ub, H - AO, .004], [ub, H, .004], [ua, H, .004], { uvs: [[0, 0], [1, 0], [1, 1], [0, 1]] });
  grp.add(new THREE.Mesh(ag.build(), grad([[0, 'rgba(30,28,30,.30)'], [.3, 'rgba(30,28,30,.10)'], [1, 'rgba(30,28,30,0)']], true)));           // ambient occlusion at the ceiling

  // --- plain plastered reveals between the lining and the model wall, with a simple stone sill
  const rg = new Geo(), stone = new Geo();
  for (const w of L) { const n = w.pts.length, d = w.depth;
    for (let i = 0; i < n; i++) { let a = w.pts[i], b = w.pts[(i + 1) % n]; if (a[1] < 0.02 && b[1] < 0.02) continue;   // no reveal face along the floor
      const put = (a, b, st) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-4) return;
        if (st) wg.quad([a[0], a[1], WAINZ], [b[0], b[1], WAINZ], [b[0], b[1], -d], [a[0], a[1], -d], { uvs: [[a[0], a[1]], [b[0], b[1]], [b[0] + d, b[1]], [a[0] + d, a[1]]] });   // the dado returns into the reveal
        else rg.quad([a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], -d], [a[0], a[1], -d], { uvs: [[0, 0], [len, 0], [len, d], [0, d]] }); };
      const lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]);
      if (w.arched || lo >= WH) put(a, b, false); else if (hi <= WH) put(a, b, true);
      else { const t = (WH - a[1]) / (b[1] - a[1]), m = [a[0] + (b[0] - a[0]) * t, WH]; put(a, m, a[1] < WH); put(m, b, b[1] < WH); } }
    if (w.v0 >= 0.02) { const t = 0.045, p = 0.035, e = 0.04, y = w.v0;   // sill slab: top just above the opening's bottom edge, small nosing into the room
      stone.quad([w.u0 - e, y + .004, p], [w.u1 + e, y + .004, p], [w.u1 + e, y + .004, -d], [w.u0 - e, y + .004, -d], { uvs: [[0, 0], [1, 0], [1, .3], [0, .3]] });
      stone.quad([w.u0 - e, y + .004 - t, p], [w.u1 + e, y + .004 - t, p], [w.u1 + e, y + .004, p], [w.u0 - e, y + .004, p], { uvs: [[0, 0], [1, 0], [1, .05], [0, .05]] });
      stone.quad([w.u0 - e, y + .004 - t, 0], [w.u0 - e, y + .004 - t, p], [w.u0 - e, y + .004, p], [w.u0 - e, y + .004, 0]); stone.quad([w.u1 + e, y + .004 - t, 0], [w.u1 + e, y + .004 - t, p], [w.u1 + e, y + .004, p], [w.u1 + e, y + .004, 0]);
      stone.quad([w.u0 - e, y + .004 - t, 0], [w.u1 + e, y + .004 - t, 0], [w.u1 + e, y + .004 - t, p], [w.u0 - e, y + .004 - t, p]); }
    else stone.quad([w.u0, .003, 0], [w.u1, .003, 0], [w.u1, .003, -d], [w.u0, .003, -d], { uvs: [[0, 0], [1, 0], [1, .3], [0, .3]] });   // stone threshold of the opening that reaches the floor
  }
  const rev = new THREE.Mesh(rg.build(), mReveal); rev.receiveShadow = true; grp.add(rev);
  const sill = new THREE.Mesh(stone.build(), stoneMat); sill.receiveShadow = true; grp.add(sill);
  // nothing here casts shadows: the lining stands inside the shell and must not interfere with the sun coming through the model's windows
  return grp;
}

// ---------------------------------------------------------------- build
export async function build(ctx) {
  const { SPEC, scene } = ctx; const h = SPEC.hall; const stoneMat = makeStone(ctx.lib);
  const za = SPEC.endWallSplitZ ?? -5.55, zb = h.z1; const EW = SPEC.endWindows;
  const read = (key, side) => [...EW[key].lower.map((s, i) => readOpening(ctx, INST[key].lower[i], s, false, side, EW[key].x)), ...EW[key].upperArched.map((s, i) => readOpening(ctx, INST[key].upper[i], s, true, side, EW[key].x))];
  // EAST (x = 13.75, faces -X): local u = world z
  const east = buildWall(ctx, { ua: za, ub: zb, opens: read('east', 1), toU: (z) => z, xLining: h.x1, side: 1, stoneMat });
  east.position.set(h.x1, SPEC.floorY, 0); east.rotation.y = -Math.PI / 2; scene.add(east);
  // WEST (x = -13.8, faces +X): local u = -world z
  const west = buildWall(ctx, { ua: -zb, ub: -za, opens: read('west', -1), toU: (z) => -z, xLining: h.x0, side: -1, stoneMat });
  west.position.set(h.x0, SPEC.floorY, 0); west.rotation.y = Math.PI / 2; scene.add(west);

  ctx.addCollider(h.x1 - 0.03, za, h.x1 + 0.5, zb);
  ctx.addCollider(h.x0 - 0.5, za, h.x0 + 0.03, zb);
}
