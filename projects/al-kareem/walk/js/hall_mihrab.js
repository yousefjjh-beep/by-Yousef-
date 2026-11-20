// owned by the 'hall_mihrab' builder – qibla wall, mihrab niche, light well, side soffits, lecterns, imam's rug
import * as THREE from 'three';

// ---- copied verbatim from exterior.js so the bay stone is the same golden split-face ledgestone as the outside of the mosque
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

export const views = {
  hall_mihrab_a: { pos: [0.4, 2.45, -4.6], look: [0, 3.5, 3.14], fov: 62 },
  hall_mihrab_b: { pos: [3.6, 2.5, -1.8], look: [-1.0, 3.0, 3.6], fov: 64 },
};

export async function build(ctx) {
  const { scene, SPEC, lib } = ctx;
  // LAYOUT V2: the qibla wall is the +Z long wall. Everything is built in a local frame (wall at local x = X facing +x, running along local z)
  // and the root group is turned a quarter: local +x -> world -Z, local z -> world x.
  const F = SPEC.floorY, H = SPEC.hall.ceil, X = -SPEC.hall.z1, Z0 = SPEC.hall.x0, Z1 = SPEC.hall.x1;
  const ZC = SPEC.mihrab.x;
  const col = (xa, za, xb, zb) => ctx.addCollider(za, -xa, zb, -xb);
  const P = SPEC.palette;
  const root = new THREE.Group(); root.name = 'hall_mihrab'; root.rotation.y = Math.PI / 2; scene.add(root);
  const add = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = !!o.cast; m.receiveShadow = o.recv !== false; if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
    if (o.order) m.renderOrder = o.order; (o.parent || root).add(m); return m; };
  // plane facing +X spanning z0..z1, y0..y1 (y above floor)
  const faceX = (mat, x, z0, z1, y0, y1, o = {}) => add(new THREE.PlaneGeometry(Math.abs(z1 - z0), y1 - y0), mat, x, F + (y0 + y1) / 2, (z0 + z1) / 2, { ry: Math.PI / 2, ...o });
  const glow = (hex, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) }); return m; };
  const additive = (map, hex, k = 1) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(hex).multiplyScalar(k), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide });

  // ------------------------------------------------------------------ textures
  const WUV = '#include <uv_vertex>';
  // ONE interior stone for everything this module owns (bay face, returns, reveals, dado): large rough split-face blocks as in the client's photos.
  // Regular courses 0.32 m high (course lines at 0, 0.32, 0.64, 0.96, 1.28 … from the floor), blocks 0.6-1.5 m long with staggered joints, thin tight joints,
  // warm golden-beige with block-to-block variation, strongly pitted, fully matte. Tile 5.12 x 2.56 m (8 courses), UVs are world metres everywhere.
  const COURSE = 0.32;
  function bigStone(seed) {
    const r = lib.rng(seed), W = 1024, TX = 5.12, TY = 2.56, ch = Math.round(W * COURSE / TY), pxm = W / TX;
    const PAL = [[214, 186, 138], [224, 200, 156], [203, 171, 119], [229, 208, 168], [210, 180, 128], [197, 164, 112], [218, 192, 146]];
    const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#000'; hg.fillRect(0, 0, W, W);
    const map = lib.canvasTex(W, W, (g) => { g.fillStyle = 'rgb(138,116,86)'; g.fillRect(0, 0, W, W);
      for (let row = 0; row * ch < W; row++) { const y = row * ch; let x = -Math.round((0.15 + r() * 0.7) * pxm); const x0 = x;
        while (x < W + x0) { let cw = Math.round((0.6 + r() * 0.9) * pxm); if (W + x0 - x - cw < 0.6 * pxm) cw = W + x0 - x;
          const c = PAL[Math.floor(r() * PAL.length)], v = 0.95 + r() * 0.09, h0 = 120 + r() * 90, tilt = (r() - .5) * 60, vert = r() < .5;
          for (const ox of [0, W]) { const X = x + ox + 1, Y = y + 1, CW = cw - 1, CH = ch - 2; g.fillStyle = `rgb(${c[0] * v | 0},${c[1] * v | 0},${c[2] * v | 0})`; g.fillRect(X, Y, CW, CH);
            for (let k = 0; k < 9; k++) { g.fillStyle = `rgba(${r() < .5 ? '255,244,214' : '120,92,52'},${.03 + r() * .06})`; g.fillRect(X + r() * CW * .8, Y + r() * CH * .8, CW * (.1 + r() * .3), CH * (.08 + r() * .3)); }
            const gr = vert ? hg.createLinearGradient(0, Y, 0, Y + CH) : hg.createLinearGradient(X, 0, X + CW, 0); gr.addColorStop(0, `rgb(${h0 | 0},${h0 | 0},${h0 | 0})`); gr.addColorStop(1, `rgb(${h0 + tilt | 0},${h0 + tilt | 0},${h0 + tilt | 0})`);
            hg.fillStyle = gr; hg.fillRect(X + 1, Y + 2, CW - 2, CH - 4); }
          x += cw; } }
      modulate(g, W, W, (u, v, p) => { const n = 0.80 + fbm(u, v, 20, 5, seed) * 0.40 + (Math.random() - .5) * .09; p[0] *= n; p[1] *= n; p[2] *= n; }); }, { repeat: [1 / TX, 1 / TY] });
    modulate(hg, W, W, (u, v, p) => { const n = p[0] * (0.30 + fbm(u, v, 40, 5, seed + 5) * 1.4) + (Math.random() - .5) * 26; p[0] = p[1] = p[2] = Math.max(0, Math.min(255, n)); });
    return { map, normalMap: lib.normalFromHeight(hc, 6, { repeat: [1 / TX, 1 / TY] }) };
  }
  function macro(mat, amp, s1 = 0.33, s2 = 1.3, worldUV = false) {
    mat.onBeforeCompile = (sh) => {
      if (worldUV) sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', WUV);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPm;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPm = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWPm; float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float mn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x), mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x), f.y), mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x), mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x), f.y), f.z); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n{ float mac = mn(vWPm*${s1.toFixed(3)})*.6 + mn(vWPm*${s2.toFixed(3)}+7.3)*.4; diffuseColor.rgb *= ${(1 - amp).toFixed(3)} + ${(2 * amp).toFixed(3)}*mac; }`); };
    mat.customProgramCacheKey = () => 'macro' + amp + '_' + s1 + '_' + s2 + worldUV; return mat; }
  // smooth honed limestone, same panel layout as lib.honedLimestone (1.28 x 0.64 m, half-bond, 2.56 m tile) with stone life added:
  // +-3 % panel-to-panel value, soft cloudy veining, fine recessed joints (normal relief at the joints only)
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
  const ledgeMat = macro(lib.std({ color: 0xffffff, map: ledgeT.map, normalMap: ledgeT.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: .62, metalness: 0, side: THREE.DoubleSide }), .03, .3, 1.1);
  function oakTex(seed, vertical) {
    const t = lib.canvasTex(512, 256, (g, w, h) => { const r = lib.rng(seed);
      g.fillStyle = '#b8a588'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${r() < .5 ? 120 : 215},${r() < .5 ? 92 : 185},${60 + r() * 60},0.10)`; const y = r() * h; g.fillRect(0, y, w, 8 + r() * 30); }
      for (let i = 0; i < 260; i++) { const y = r() * h, a = 0.03 + r() * 0.08; g.strokeStyle = r() < .7 ? `rgba(96,70,42,${a})` : `rgba(232,208,170,${a})`; g.lineWidth = 0.6 + r() * 1.4;
        g.beginPath(); g.moveTo(0, y); const k = (r() - .5) * 7; g.bezierCurveTo(w * .3, y + k, w * .6, y - k, w, y); g.stroke(); }
      lib.grain(g, w, h, 0.04, seed, 1); }, { repeat: [1 / 2.2, 1 / 0.9] });
    if (vertical) { t.rotation = Math.PI / 2; }
    return t;
  }
  const oakMat = lib.std({ map: oakTex(11, false), roughness: 0.55, color: 0xe4ddd0 });
  const oakMatV = lib.std({ map: oakTex(12, true), roughness: 0.55, color: 0xf6ead6 });
  // fine trowelled plaster: warm base, soft tonal drift, short curved trowel sweeps
  const plasterTex = lib.canvasTex(512, 512, (g, w, h) => { const r = lib.rng(61); g.fillStyle = '#f1eadc'; g.fillRect(0, 0, w, h); lib.blotches(g, w, h, 60, 0.04, 5, [30, 150]);
    for (let i = 0; i < 520; i++) { const x = r() * w, y = r() * h, R = 30 + r() * 90, a0 = r() * 6.28, v = r() < 0.5 ? 255 : 110; g.strokeStyle = `rgba(${v},${v - 6},${v - 18},${0.012 + r() * 0.02})`; g.lineWidth = 3 + r() * 8; g.beginPath(); g.arc(x, y, R, a0, a0 + 0.5 + r() * 0.9); g.stroke(); }
    lib.grain(g, w, h, 0.04, 9, 1); }, { repeat: [0.6, 0.6] });
  // soft vertical shading for niche interiors (v = 0 floor … 1 head): darker at the foot, slightly darker again under the head
  const nicheAO = lib.canvasTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#4f4f4f'); gr.addColorStop(0.3, '#c8c8c8'); gr.addColorStop(0.7, '#ffffff'); gr.addColorStop(1, '#b4b4b4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { srgb: false });
  nicheAO.wrapS = nicheAO.wrapT = THREE.ClampToEdgeWrapping;
  const plaster = lib.std({ map: plasterTex, roughness: 0.92, color: 0xd6d2c8 });
  const white = lib.std({ color: 0xf4f2ec, roughness: 0.95 });
  const bronze = lib.std({ color: 0x8a6a3c, roughness: 0.38, metalness: 0.75, emissive: 0x2a1c0a, emissiveIntensity: 0.6 });
  const black = lib.std({ color: 0x141414, roughness: 0.5, metalness: 0.4 });

  // ------------------------------------------------------------------ qibla wall
  // MIHRAB PLAN, measured off refs/mihrab_plan.png (141 px = 1 m, frame set by the two dome columns: 0.81 m squares 6.52 m apart):
  //   rebate 2.45 m clear from the wall face back to z 3.65; there it steps in to 1.64 m clear; straight jambs to z 4.16;
  //   semicircular apse, inner radius 0.82 m (centre z 4.16, inner apex z 4.98); wall about 0.20-0.25 m thick.
  const MP = { faceHalf: 1.225, innerHalf: 0.82, stepZ: 3.65, apseZ: 4.16, headY: 3.8 };
  const pierOut = MP.faceHalf;
  const SU = { half: 1.42, top: 5.6, d: 0.2 };   // plain recessed arched surround of the mihrab (kept clear of the minbar and arch openings at |x| 1.53-1.58)
  SU.spring = SU.top - SU.half;
  const zA0 = Z0, zA1 = -SU.half, zB0 = SU.half, zB1 = Z1;
  const wains = 4 * COURSE;   // dado top raised from 1.0 m to the course line at 1.28 m, so a full strip of stone stands above the glowing ledge
  // MINBAR niche and imam's-room arch either side of the mihrab. Measured off the plan: between the mihrab's wall stub (|x| 1.44) and each dome
  // column face (|x| 2.86) there is 1.36-1.46 m; the minbar's double arc has an outer chord of 1.36 m, an inner chord of about 1.0 m and a rise of 0.32 m.
  const MB = { x: -2.08, w: 1.05, y0: 1.0, floor: 0.9, spring: 2.475, depth: 1.4 }, AR = { x: 2.08, w: 1.05, spring: 2.475, depth: 1.5 };   // both small heads top out at 3.0 m
  const yS = wains - 0.05, COLIN = 2.85, BAY = SPEC.columns[3].x + SPEC.columnSize / 2, SIDE = SPEC.columns[3].x + SPEC.columnSize / 2;   // bay between the dome-column faces; painted stretches start at the columns' outer faces
  const zW = SPEC.hall.z1, inWorld = (geo, mat, x, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, F + y, zW); m.receiveShadow = true; scene.add(m); return m; };
  // ONE flush stone face from x -3.69 to +3.69 on the plane of the column cladding (4 cm in front of the engaged columns), floor to ceiling
  const zP = SPEC.columns[3].z - SPEC.columnSize / 2 - 0.04, XB = BAY + 0.04, zSb = zP + 0.05;   // zSb: back of the 5 cm arched surround recess
  // the bay between the two dome columns, floor to ceiling: the exterior's ledgestone, cut round the surround, the minbar opening and the imam's arch
  { const sh = new THREE.Shape(), rA = AR.w / 2, rM = MB.w / 2; sh.moveTo(-XB, 0); sh.lineTo(-SU.half, 0); sh.lineTo(-SU.half, SU.spring); sh.absarc(0, SU.spring, SU.half, Math.PI, 0, true); sh.lineTo(SU.half, 0);
    sh.lineTo(AR.x - rA, 0); sh.lineTo(AR.x - rA, AR.spring); sh.absarc(AR.x, AR.spring, rA, Math.PI, 0, true); sh.lineTo(AR.x + rA, 0); sh.lineTo(XB, 0); sh.lineTo(XB, H); sh.lineTo(-XB, H); sh.closePath();
    const h = new THREE.Path(); h.moveTo(MB.x - rM, MB.y0); h.lineTo(MB.x + rM, MB.y0); h.lineTo(MB.x + rM, MB.spring); h.absarc(MB.x, MB.spring, rM, 0, Math.PI, false); h.lineTo(MB.x - rM, MB.y0); sh.holes.push(h);
    inWorld(new THREE.ShapeGeometry(sh, 24), ledgeMat, 0, 0).position.z = zP; }
  // outside the columns: plain smooth painted plaster (the finish of the mihrab interior), each stretch with one opening for its shelf unit
  // calm warm off-white paint (hall_core's wall tone), soft vertical gradient over the 7.2 m height (UV v = metres above the floor)
  const paintTex = lib.canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ece8e0'); gr.addColorStop(0.25, '#f8f5ee'); gr.addColorStop(0.75, '#f8f5ee'); gr.addColorStop(1, '#eeeae2'); g.fillStyle = gr; g.fillRect(0, 0, w, h); lib.grain(g, w, h, 0.012, 9, 1); }, { repeat: [1 / 3, 1 / H] });
  const paint = lib.std({ map: paintTex, roughness: 0.94, color: 0xf1ede6, emissive: 0xf6f1ea, emissiveIntensity: 0.17, side: THREE.DoubleSide });
  for (const [a, b] of [[Z0, -BAY], [BAY, Z1]]) { const sh = new THREE.Shape(); sh.moveTo(a, wains); sh.lineTo(b, wains); sh.lineTo(b, H); sh.lineTo(a, H); sh.closePath(); inWorld(new THREE.ShapeGeometry(sh), paint, 0, 0); }
  // oak wainscot / bench band with concealed LED line on its top
  const wd = 0.11;
  const ledMat = glow(0xfff0dc, 1.9);
  const grad = lib.canvasTex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(0.1, '#8a8a8a'); gr.addColorStop(0.35, '#2a2a2a'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { srgb: true });
  grad.wrapS = grad.wrapT = THREE.ClampToEdgeWrapping;
  const washMat = additive(grad, 0xfff0e0, 0.2);
  // stone dado (same ledgestone, world-metre UVs so its courses run on from the bay), flush with the wall plane, with a slim cap hiding the light line.
  // In each dado ONE recessed book slot, 5.0 m long, centred on its stretch; nothing projects in front of the wall plane.
  const SLOT = { cx: 8.75, half: 2.5, d: 0.25, ledge: 0.04 };
  SLOT.y0 = 2 * COURSE; SLOT.y1 = 3 * COURSE;   // the slot is exactly the third course (0.64-0.96 m): two courses of stone below it, the ledge strip directly above
  for (const [a, b, sgn] of [[Z0, -XB, -1], [XB, Z1, 1]]) { const sh = new THREE.Shape(); sh.moveTo(a, 0); sh.lineTo(b, 0); sh.lineTo(b, wains); sh.lineTo(a, wains); sh.closePath();
    const x0 = sgn * SLOT.cx - SLOT.half, x1 = sgn * SLOT.cx + SLOT.half, yt = SLOT.y1 + SLOT.ledge, h = new THREE.Path(); h.moveTo(x0, SLOT.y0); h.lineTo(x1, SLOT.y0); h.lineTo(x1, yt); h.lineTo(x0, yt); h.lineTo(x0, SLOT.y0); sh.holes.push(h);
    inWorld(new THREE.ShapeGeometry(sh), ledgeMat, 0, 0);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(b - a, 0.03, 0.035), lib.std({ color: 0xb59a6c, roughness: 0.9 })); cap.position.set((a + b) / 2, F + wains - 0.015, zW - 0.0175); scene.add(cap); }
  // concealed light line at the dado top: kept, except along the slots where it would fight the glowing ledge
  for (const [a, b] of [[Z0, -SLOT.cx - SLOT.half], [-SLOT.cx + SLOT.half, -XB], [XB, SLOT.cx - SLOT.half], [SLOT.cx + SLOT.half, Z1]]) {
    add(new THREE.BoxGeometry(0.016, 0.01, b - a), ledMat, X + 0.012, F + wains + 0.004, (a + b) / 2, { recv: false });
    faceX(washMat, X + 0.006, a, b, wains, wains + 0.55, { recv: false, order: 2 });
  }

  // ------------------------------------------------------------------ the two book slots: dark lining, upright Qur'an copies packed edge to edge, glowing ledge strip above
  { const dark = lib.std({ color: 0x17100b, roughness: 0.9, side: THREE.DoubleSide }), ledgeGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2dc8c).multiplyScalar(0.8) });
    const bx = (x0, x1, y0, y1, z0, z1, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, F + (y0 + y1) / 2, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); return m; };
    const y0 = SLOT.y0, y1 = SLOT.y1, zb = zW + SLOT.d, NBAY = 4, dv = 0.02, bayW = 2 * SLOT.half / NBAY, bh = y1 - y0 - 0.02;
    const books = [], bands = [], rb = lib.rng(91), dummy = new THREE.Object3D(), layout = [];
    for (let b = 0; b < NBAY; b++) { const u0 = b * bayW + (b ? dv / 2 : 0), u1 = (b + 1) * bayW - (b < NBAY - 1 ? dv / 2 : 0); let u = u0; const row = [];
      while (u1 - u > 0.05) { const th = 0.03 + rb() * 0.015; row.push([u, th, bh - rb() * 0.012]); u += th; }
      row.push([u, u1 - u, bh - rb() * 0.012]); layout.push(row); }
    for (const sgn of [-1, 1]) { const xa = sgn * SLOT.cx - SLOT.half, xb = xa + 2 * SLOT.half, xm = (u) => sgn > 0 ? xa + u : xb - u;
      bx(xa, xb, y0 - 0.004, y0, zW, zb, dark); bx(xa, xb, y1, y1 + 0.004, zW + 0.02, zb, dark); bx(xa, xb, y0, y1, zb, zb + 0.004, dark);   // floor, head, back of the slot
      bx(xa - 0.004, xa, y0, y1, zW, zb, dark); bx(xb, xb + 0.004, y0, y1, zW, zb, dark);
      for (let b = 1; b < NBAY; b++) { const xd = xa + b * bayW; bx(xd - dv / 2, xd + dv / 2, y0, y1, zW + 0.012, zb, dark); }               // thin dark divider every 1.25 m
      bx(xa, xb, y1, y1 + SLOT.ledge, zW, zW + 0.02, ledgeGlow);                                                                       // pale cream-yellow ledge strip, flush with the stone face
      for (const row of layout) for (const [u, th, hh] of row) { const xc = xm(u + th / 2); books.push([xc, y0 + hh / 2, zW + 0.02 + 0.09, th - 0.0025, hh, 0.18]); bands.push([xc, y0 + hh * 0.82, zW + 0.0195, (th - 0.0025) * 0.9, 0.006, 0.002]); } }
    const mkInst = (list, mat, vary) => { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length); const c = new THREE.Color();
      list.forEach((q, i) => { dummy.position.set(q[0], F + q[1], q[2]); dummy.scale.set(q[3], q[4], q[5]); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); if (vary) im.setColorAt(i, c.set(0x553820).multiplyScalar(0.85 + ((i * 37) % 11) / 36)); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; scene.add(im); };
    mkInst(books, lib.std({ roughness: 0.75 }), true);
    mkInst(bands, lib.std({ color: 0x9c7a3c, roughness: 0.5, metalness: 0.5, emissive: 0x3a2a0c, emissiveIntensity: 0.4 }), false);
    for (const sgn of [-1, 1]) { const l = new THREE.PointLight(0xffe2a8, 0.35, 4.0, 1.2); l.position.set(sgn * SLOT.cx, F + y1 - 0.03, zW - 0.9); scene.add(l); }   // faint glow of the ledge on the spines and stone
  }

  // ------------------------------------------------------------------ mihrab as drawn on the plan (world coordinates). Elevation is not on the plan: kept plain.
  { const mg = new THREE.Group(); scene.add(mg); const zf = SPEC.hall.z1, R = MP.innerHalf, fh = MP.faceHalf, sz = MP.stepZ, az = MP.apseZ, hy = MP.headY, spring = hy - R;
    const pl = lib.std({ map: plasterTex, roughness: 0.94, color: 0xd6cdbc, aoMap: nicheAO, aoMapIntensity: 1, side: THREE.DoubleSide });
    const m = (geo, x, y, z) => { const o = new THREE.Mesh(geo, pl); o.position.set(x, F + y, z); o.receiveShadow = true; mg.add(o); return o; };
    // surround: reveals, arched soffit and plaster back plane with the mihrab opening cut out of it
    const zs = zf + SU.d;
    // recess shadow hugging the edge of the surround (two soft bands) and a soft wash of light above the niche head
    for (const [bw, op] of [[0.1, 0.22], [0.26, 0.16]]) { const o = new THREE.Shape(); o.moveTo(-SU.half, 0); o.lineTo(-SU.half, SU.spring); o.absarc(0, SU.spring, SU.half, Math.PI, 0, true); o.lineTo(SU.half, 0);
      o.lineTo(SU.half - bw, 0); o.lineTo(SU.half - bw, SU.spring); o.absarc(0, SU.spring, SU.half - bw, 0, Math.PI, false); o.lineTo(-SU.half + bw, 0); o.closePath();
      const sm = new THREE.Mesh(new THREE.ShapeGeometry(o, 40), new THREE.MeshBasicMaterial({ color: 0x1a140c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide })); sm.position.set(0, F, zSb - 0.004); sm.renderOrder = 4; mg.add(sm); }
    { const wl = new THREE.PointLight(0xfff0e0, 1.1, 4.5, 1.4); wl.position.set(0, F + hy + 1.15, zSb - 0.55); mg.add(wl); }   // soft graded warm-white glow in the arched recess, no visible source
    const uvM = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
    const ms = (geo, x, y, z) => { const o = m(geo, x, y, z); o.material = ledgeMat; return o; };   // the surround is kept as a shallow recess in the bay stone
    for (const s of [-1, 1]) ms(uvM(new THREE.PlaneGeometry(0.05, SU.spring), 0.05, SU.spring), s * SU.half, SU.spring / 2, zP + 0.025).rotation.y = Math.PI / 2;
    ms(uvM(new THREE.CylinderGeometry(SU.half, SU.half, 0.05, 40, 1, true, Math.PI / 2, Math.PI), Math.PI * SU.half, 0.05).rotateX(Math.PI / 2), 0, SU.spring, zP + 0.025);
    { const b = new THREE.Shape(); b.moveTo(-SU.half, 0); b.lineTo(-fh, 0); b.lineTo(-fh, spring); b.absarc(0, spring, fh, Math.PI, 0, true); b.lineTo(fh, 0); b.lineTo(SU.half, 0); b.lineTo(SU.half, SU.spring); b.absarc(0, SU.spring, SU.half, 0, Math.PI, false); b.closePath(); ms(new THREE.ShapeGeometry(b, 32), 0, 0, zSb); }
    // stone returns: into the mihrab opening (to the existing plaster rebate), into the minbar opening and the arch (to their plaster), and on the two outer sides of the stone face
    const side = (x, y0, y1, z0, z1) => { const sg = uvM(new THREE.PlaneGeometry(z1 - z0, y1 - y0), z1 - z0, y1 - y0); for (let i = 0; i < sg.attributes.uv.count; i++) sg.attributes.uv.setY(i, sg.attributes.uv.getY(i) + y0); ms(sg, x, (y0 + y1) / 2, (z0 + z1) / 2).rotation.y = Math.PI / 2; };
    const flat = (x0, x1, y, z0, z1) => { ms(uvM(new THREE.PlaneGeometry(x1 - x0, z1 - z0), x1 - x0, z1 - z0), (x0 + x1) / 2, y, (z0 + z1) / 2).rotation.x = Math.PI / 2; };
    const archRev = (cx, w, y0, spring) => { const r = w / 2; side(cx - r, y0, spring, zP, zf); side(cx + r, y0, spring, zP, zf);
      ms(uvM(new THREE.CylinderGeometry(r, r, zf - zP, 24, 1, true, Math.PI / 2, Math.PI), Math.PI * r, zf - zP).rotateX(Math.PI / 2), cx, spring, (zP + zf) / 2); };
    // the mihrab opening is round-headed, concentric with the niche arch: no rectangular frame, only a stepped reveal (its width is fixed by the plan)
    side(-fh, 0, spring, zSb, zs); side(fh, 0, spring, zSb, zs); ms(uvM(new THREE.CylinderGeometry(fh, fh, zs - zSb, 32, 1, true, Math.PI / 2, Math.PI), Math.PI * fh, zs - zSb).rotateX(Math.PI / 2), 0, spring, (zSb + zs) / 2);
    archRev(MB.x, MB.w, MB.y0, MB.spring); flat(MB.x - MB.w / 2, MB.x + MB.w / 2, MB.y0, zP, zf);
    archRev(AR.x, AR.w, 0, AR.spring);
    side(-XB, 0, H, zP, zf); side(XB, 0, H, zP, zf);
    for (const s of [-1, 1]) { m(new THREE.PlaneGeometry(sz - zs, spring), s * fh, spring / 2, (zs + sz) / 2).rotation.y = Math.PI / 2;          // rebate returns
      m(new THREE.PlaneGeometry(az - sz, spring), s * R, spring / 2, (sz + az) / 2).rotation.y = Math.PI / 2; }                          // inner jambs
    m(new THREE.CylinderGeometry(fh, fh, sz - zs, 32, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), 0, spring, (zs + sz) / 2);                                         // rebate head
    const sh = new THREE.Shape(); sh.moveTo(-fh, 0); sh.lineTo(-R, 0); sh.lineTo(-R, spring); sh.absarc(0, spring, R, Math.PI, 0, true); sh.lineTo(R, 0); sh.lineTo(fh, 0); sh.lineTo(fh, spring); sh.absarc(0, spring, fh, 0, Math.PI, false); sh.closePath();
    { // above 3.84 m the model's own wall stands at z 3.49: the top of the arched reveal is closed 2 cm in front of it
      const yc = hy + 0.02, zc = 3.47, a0 = Math.asin((yc - spring) / fh), c = fh * Math.cos(a0), cs = new THREE.Shape(); cs.moveTo(-c, yc); cs.lineTo(c, yc); cs.absarc(0, spring, fh, a0, Math.PI - a0, false); cs.closePath();
      m(new THREE.ShapeGeometry(cs, 24), 0, 0, zc); m(new THREE.PlaneGeometry(2 * c, sz - zc), 0, yc, (zc + sz) / 2).rotation.x = Math.PI / 2; }
    m(new THREE.ShapeGeometry(sh, 24), 0, 0, sz);                                                                                       // step face with the arched opening
    m(new THREE.CylinderGeometry(R, R, az - sz, 24, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), 0, spring, (sz + az) / 2);    // barrel over the straight jambs
    m(new THREE.CylinderGeometry(R, R, spring, 32, 1, true, -Math.PI / 2, Math.PI), 0, spring / 2, az);                                 // apse
    m(new THREE.SphereGeometry(R, 32, 14, 0, Math.PI, 0, Math.PI / 2), 0, spring, az);                                                  // plain semi-dome
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * fh, az + R - zf + 0.1), lib.std({ color: 0xa39d92, roughness: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, F + 0.0128, (zf + az + R + 0.1) / 2 - 0.05); fl.receiveShadow = true; mg.add(fl);
    const l = new THREE.PointLight(0xfff0e0, 1.8, 5, 1.6); l.position.set(0, F + hy - 0.25, zs + 0.14); mg.add(l);                      // one small concealed warm light behind the head of the opening
    // round-headed plaster recess going back from the lining (used for the minbar niche and the arch to the imam's room)
    const recessOf = (cx, w, y0, spring, depth, mat, backMat) => { const r = w / 2, mm = (geo, x, y, z, mt = mat) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, F + y, z); o.receiveShadow = true; mg.add(o); return o; };
      for (const s of [-1, 1]) mm(new THREE.PlaneGeometry(depth, spring - y0), cx + s * r, (y0 + spring) / 2, zf + depth / 2).rotation.y = Math.PI / 2;
      mm(new THREE.CylinderGeometry(r, r, depth, 20, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), cx, spring, zf + depth / 2);
      const bs = new THREE.Shape(); bs.moveTo(-r, y0); bs.lineTo(r, y0); bs.lineTo(r, spring); bs.absarc(0, spring, r, 0, Math.PI, false); bs.closePath(); mm(new THREE.ShapeGeometry(bs, 16), cx, 0, zf + depth, backMat);
      return mm; };
    // minbar: raised floor behind a solid parapet (the wainscot runs on across it), steps coming up from the room behind
    { const mm = recessOf(MB.x, MB.w, 0, MB.spring, MB.depth, pl, pl), land = 0.56, n = 3, sd2 = (MB.depth - land) / n;
      mm(new THREE.BoxGeometry(MB.w, MB.floor, land), MB.x, MB.floor / 2, zf + land / 2);
      for (let i = 0; i < n; i++) { const hgt = MB.floor * (n - i) / (n + 1); mm(new THREE.BoxGeometry(MB.w, hgt, sd2), MB.x, hgt / 2, zf + land + sd2 * (i + 0.5)); }
      mm(new THREE.BoxGeometry(MB.w, MB.y0 - MB.floor, 0.04), MB.x, (MB.y0 + MB.floor) / 2, zf + 0.02); }
    // arch to the imam's room: short plain dim passage
    { const dim = lib.std({ map: plasterTex, roughness: 0.95, color: 0xc2b9a8, aoMap: nicheAO, aoMapIntensity: 1, side: THREE.DoubleSide }), dark = lib.std({ map: plasterTex, color: 0x9a958b, roughness: 1, side: THREE.DoubleSide });
      const mm = recessOf(AR.x, AR.w, 0, AR.spring, AR.depth, dim, dark);
      const pf = mm(new THREE.PlaneGeometry(AR.w, AR.depth), AR.x, 0.0128, zf + AR.depth / 2, lib.std({ color: 0x7d776c, roughness: 0.9 })); pf.rotation.x = -Math.PI / 2;
      const pl2 = new THREE.PointLight(0xffe8cc, 1.6, 3.2, 1.6); pl2.position.set(AR.x, F + 2.35, zf + 0.75); mg.add(pl2); }
    ctx.addCollider(-XB, zP, -fh, zf); ctx.addCollider(fh, zP, XB, zf);   // the stone block either side of the mihrab opening
    ctx.addCollider(SPEC.hall.x0 - 1, zf - wd, -fh, zf + 3); ctx.addCollider(fh, zf - wd, SPEC.hall.x1 + 1, zf + 3);
    ctx.addCollider(-fh, sz, -R, zf + 3); ctx.addCollider(R, sz, fh, zf + 3); ctx.addCollider(-R, az + 0.5, R, zf + 3);
  }
  // fake contact shadows
  const shTex = lib.canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.filter = 'blur(12px)'; g.fillStyle = '#000'; g.fillRect(20, 20, w - 40, h - 40); g.filter = 'none'; }); shTex.wrapS = shTex.wrapT = THREE.ClampToEdgeWrapping;
  const shEdge = lib.canvasTex(8, 64, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); shEdge.wrapS = shEdge.wrapT = THREE.ClampToEdgeWrapping;
  const shMat = (map, o) => new THREE.MeshBasicMaterial({ map, color: 0x000000, transparent: true, opacity: o, depthWrite: false });
  const blob = (x, z, sxm, szm, o, y = 0.0175) => add(new THREE.PlaneGeometry(sxm, szm), shMat(shTex, o), x, F + y, z, { rx: -Math.PI / 2, recv: false, order: 5 });
  // wall base: strip on the floor fading away from the wainscot foot (plane top edge = far from wall)
  for (const [a, b] of [[Z0, -SIDE], [SIDE, Z1]]) { const m = add(new THREE.PlaneGeometry(b - a, 0.7), shMat(shEdge, 0.92), X + 0.35, F + 0.0135, (a + b) / 2, { recv: false, order: 5 }); m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); }

  for (const [a, b] of [[-COLIN, MB.x + MB.w / 2 + 0.05], [SU.half, AR.x - AR.w / 2], [AR.x + AR.w / 2, COLIN]]) { const m = add(new THREE.PlaneGeometry(b - a, 0.6), shMat(shEdge, 0.9), X + 0.63, F + 0.0135, (a + b) / 2, { recv: false, order: 5 }); m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); }

  // contact shadows inside the niches (local frame: first argument = -world z, second = world x)
  blob(-4.2, 0, 2.2, 2.9, 0.8, 0.0135); blob(-3.95, AR.x, 2.0, 1.5, 0.8, 0.0135);
  { const m = add(new THREE.PlaneGeometry(2 * SU.half, 0.45), shMat(shEdge, 0.7), X + 0.53, F + 0.0172, 0, { recv: false, order: 5 }); m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); }

  // ------------------------------------------------------------------ imam's place: the hall carpet runs right up to the mihrab;
  // only the imam's own spot is picked out, in the carpet's light golden tone (sampled from the product sheet: 197,178,147)
  const spotW = 1.0, spotD = 1.45;
  const spotTex = lib.canvasTex(256, 384, (g, w, h) => { g.fillStyle = '#c5b293'; g.fillRect(0, 0, w, h); lib.blotches(g, w, h, 30, 0.05, 8, [20, 80]); lib.grain(g, w, h, 0.07, 2, 2); });
  spotTex.wrapS = spotTex.wrapT = THREE.ClampToEdgeWrapping;
  const spot = add(new THREE.PlaneGeometry(spotW, spotD), new THREE.MeshLambertMaterial({ map: spotTex, emissive: 0xffffff, emissiveMap: spotTex, emissiveIntensity: .5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), X + 0.38 + spotD / 2, F + 0.012, ZC, {});
  spot.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);

  // ------------------------------------------------------------------ warm accent lights (no shadows, short range)


}
