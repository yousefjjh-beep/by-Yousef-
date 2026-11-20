// owned by the 'tower' builder – windowed stone face of the tower (east face), in the mosque's one big-block stone
import * as THREE from 'three';

// camera reproducing the reference crop: portrait, slightly from below, seen a little from the right
export const views = { tower: { pos: [47.99, 1.6, -24.2], look: [13.56, 5.76, -13.65], fov: 19.6 } };

// ---- facts measured on the model (ray grid): the outer skin of the windowed face is at x = 13.547…13.557,
// z -16.37…-10.93, y up to 9.73; the glazing sits 0.75 m deeper at x = 12.80 ----
const FACE = { x: 13.56, z0: -16.375, z1: -10.94, y0: 0.45, y1: 9.73 };
const RET = { x0: 12.93, len: 0.69 };   // stone return at the free (z = -16.37) end of the face
const WIN_Z = [[-16.09, -15.49], [-14.87, -14.27], [-13.52, -12.92], [-12.24, -11.64]];
const WIN_Y = [[2.85, 3.65], [6.69, 7.49]];
const GLASS_X = 12.80;           // glazing plane of the model's windows
const LIGHT_Z = [-12.15, -15.35];  // the two ground uplights

// ---------- small procedural helpers ----------
const mkRng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const sm = (t) => t * t * (3 - 2 * t);
// tileable fractal value noise, N x N floats in 0..1
function fbm(N, cells, oct, seed, { ridged = false, sx = 1, sy = 1, gain = 0.5 } = {}) {
  const out = new Float32Array(N * N); const r = mkRng(seed); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const cx = Math.max(1, Math.round(cells * sx * 2 ** o)), cy = Math.max(1, Math.round(cells * sy * 2 ** o));
    const lat = new Float32Array(cx * cy); for (let i = 0; i < lat.length; i++) lat[i] = r();
    for (let y = 0; y < N; y++) { const fy = y / N * cy, iy = Math.floor(fy), ty = sm(fy - iy), y0 = (iy % cy) * cx, y1 = ((iy + 1) % cy) * cx;
      for (let x = 0; x < N; x++) { const fx = x / N * cx, ix = Math.floor(fx), tx = sm(fx - ix), x0 = ix % cx, x1 = (ix + 1) % cx;
        let v = (lat[y0 + x0] * (1 - tx) + lat[y0 + x1] * tx) * (1 - ty) + (lat[y1 + x0] * (1 - tx) + lat[y1 + x1] * tx) * ty;
        if (ridged) v = 1 - Math.abs(2 * v - 1);
        out[y * N + x] += v * amp; } }
    tot += amp; amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot; return out;
}
function texFromRGB(N, fn, { srgb = true, repeat = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); const im = g.createImageData(N, N); const px = [0, 0, 0];
  for (let i = 0; i < N * N; i++) { fn(i, px); im.data[i * 4] = px[0]; im.data[i * 4 + 1] = px[1]; im.data[i * 4 + 2] = px[2]; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function normalFromFloat(H, N, strength, repeat) {
  return texFromRGB(N, (i, px) => { const x = i % N, y = (i / N) | 0; const h = (xx, yy) => H[((yy + N) % N) * N + ((xx + N) % N)];
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1);
    px[0] = (-dx / l * .5 + .5) * 255; px[1] = (dy / l * .5 + .5) * 255; px[2] = (1 / l * .5 + .5) * 255; }, { srgb: false, repeat });
}
// fallback copy of the shared big-block stone (exterior.js `bigStone`): courses 0.32 m, blocks 0.6–1.5 m, tile 5.12 x 2.56 m
function bigStoneLocal(lib) {
  const r = lib.rng(23), W = 1024, TX = 5.12, TY = 2.56, ch = Math.round(W * 0.32 / TY), pxm = W / TX, n1 = fbm(W, 20, 5, 23), n2 = fbm(W, 40, 5, 28);
  const PAL = [[214, 186, 138], [224, 200, 156], [203, 171, 119], [229, 208, 168], [210, 180, 128], [197, 164, 112], [218, 192, 146]];
  const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#000'; hg.fillRect(0, 0, W, W);
  const mod = (g, fn) => { const im = g.getImageData(0, 0, W, W), d = im.data; for (let i = 0; i < W * W; i++) { const k = fn(i, d[i * 4]); if (k.length) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = k[0]; } else { d[i * 4] *= k; d[i * 4 + 1] *= k; d[i * 4 + 2] *= k; } } g.putImageData(im, 0, 0); };
  const map = lib.canvasTex(W, W, (g) => { g.fillStyle = 'rgb(138,116,86)'; g.fillRect(0, 0, W, W);
    for (let row = 0; row * ch < W; row++) { const y = row * ch; let x = -Math.round((0.15 + r() * 0.7) * pxm); const x0 = x;
      while (x < W + x0) { let cw = Math.round((0.6 + r() * 0.9) * pxm); if (W + x0 - x - cw < 0.6 * pxm) cw = W + x0 - x;
        const c = PAL[Math.floor(r() * PAL.length)], v = 0.95 + r() * 0.09, h0 = 120 + r() * 90, tilt = (r() - .5) * 60, vert = r() < .5;
        for (const ox of [0, W]) { const X = x + ox + 1, Y = y + 1, CW = cw - 1, CH = ch - 2; g.fillStyle = `rgb(${c[0] * v | 0},${c[1] * v | 0},${c[2] * v | 0})`; g.fillRect(X, Y, CW, CH);
          const gr = vert ? hg.createLinearGradient(0, Y, 0, Y + CH) : hg.createLinearGradient(X, 0, X + CW, 0); gr.addColorStop(0, `rgb(${h0 | 0},${h0 | 0},${h0 | 0})`); gr.addColorStop(1, `rgb(${h0 + tilt | 0},${h0 + tilt | 0},${h0 + tilt | 0})`);
          hg.fillStyle = gr; hg.fillRect(X + 1, Y + 2, CW - 2, CH - 4); }
        x += cw; } }
    mod(g, (i) => 0.80 + n1[i] * 0.40); }, { repeat: [1 / TX, 1 / TY] });
  mod(hg, (i, p) => [Math.max(0, Math.min(255, p * (0.30 + n2[i] * 1.4)))]);
  return { map, normalMap: lib.normalFromHeight(hc, 6, { repeat: [1 / TX, 1 / TY] }) };
}
function plasterTextures() {
  const N = 256; const a = fbm(N, 8, 5, 41), b = fbm(N, 64, 2, 42);
  const H = new Float32Array(N * N); for (let i = 0; i < H.length; i++) H[i] = a[i] * 0.5 + b[i] * 0.5;
  const map = texFromRGB(N, (i, px) => { const v = 232 + (a[i] - .5) * 26 + (b[i] - .5) * 10; px[0] = v + 3; px[1] = v; px[2] = v - 7; }, { repeat: 1 / 1.6 });
  return { map, normalMap: normalFromFloat(H, N, 1.2, 1 / 1.6) };
}
function gradTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }

// the windowed face reads as if in open shade at dusk: scale down the direct sun on these materials only
function openShade(mat, k, fill = [0.54, 0.43, 0.29], hemi = [0.5, 0.41, 0.29]) { const v3 = (a) => 'vec3(' + a.map((x) => x.toFixed(3)).join(',') + ')';
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>',
    THREE.ShaderChunk.lights_fragment_begin.split('getDirectionalLightInfo( directionalLight, directLight );').join('getDirectionalLightInfo( directionalLight, directLight ); directLight.color *= ' + k.toFixed(3) + ';')
      .split('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );').join('irradiance += dot( getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal ), vec3( 0.333 ) ) * ' + v3(hemi) + ';'))
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * ' + v3(fill) + ';'); };
  mat.customProgramCacheKey = () => 'openShade' + k + fill + hemi; return mat; }
// ---------- geometry accumulation (flat shaded, non-indexed) ----------
class Soup {
  constructor() { this.p = []; this.c = []; this.uv = []; }
  // tri with intended outward direction d (array); winding fixed automatically
  tri(a, b, c, d, ca, cb, cc, ua, ub, uc) {
    const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (nx * d[0] + ny * d[1] + nz * d[2] < 0) { [b, c] = [c, b]; [cb, cc] = [cc, cb]; [ub, uc] = [uc, ub]; }
    this.p.push(...a, ...b, ...c); this.c.push(...ca, ...cb, ...cc); this.uv.push(...ua, ...ub, ...uc);
  }
  quad(a, b, c, d4, dir, col, uvs) { const cs = Array.isArray(col[0]) ? col : [col, col, col, col]; uvs = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
    this.tri(a, b, c, dir, cs[0], cs[1], cs[2], uvs[0], uvs[1], uvs[2]); this.tri(a, c, d4, dir, cs[0], cs[2], cs[3], uvs[0], uvs[2], uvs[3]); }
  box(x0, y0, z0, x1, y1, z1, col = [1, 1, 1]) {
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], col, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], col, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], col, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], col, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], col, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.computeVertexNormals(); return g; }
  get tris() { return this.p.length / 9; }
}
const lin = (c) => [Math.pow(c[0] / 255, 2.2), Math.pow(c[1] / 255, 2.2), Math.pow(c[2] / 255, 2.2)];

export async function build(ctx) {
  const { scene, lib } = ctx; const grp = new THREE.Group(); grp.name = 'tower_builder'; scene.add(grp);
  const plaster = plasterTextures();

  // ---- restyle the model's tower zone ----
  const mPlaster = new THREE.MeshStandardMaterial({ map: plaster.map, roughness: 0.92, color: 0xf4f1ea, side: THREE.DoubleSide });
  const whiteShade = (m) => openShade(m, 0.12, [0.50, 0.49, 0.46], [0.42, 0.42, 0.41]);
  const mRoof = new THREE.MeshStandardMaterial({ color: 0xbdb6aa, roughness: 0.95, side: THREE.DoubleSide });
  const mDarkGlass = new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: 0.12, metalness: 0.4, side: THREE.DoubleSide });
  for (const m of ctx.zones.tower) {
    const n = m.userData.matName; let mat = mPlaster;
    if (/tower--group_(4[3-9]|5[01])/.test(m.name)) { m.visible = false; continue; }   // model windows: replaced below by deeper, lit ones at the same openings
    // client: every tower face except the windowed stone face is the mosque's off-white paint
    if (n === 'material_15') mat = mRoof; else if (/Glass/i.test(n)) mat = mDarkGlass;
    const mm = mat.clone(); mm.name = n; if (mat === mPlaster) { whiteShade(mm); m.receiveShadow = false; } m.material = mm;
    if (n === 'material_61_6') {   // the volume rising above the stone parapet is smooth white plaster
      const g = m.geometry; m.updateWorldMatrix(true, false); const idx = g.index ? g.index.array : Array.from({ length: g.attributes.position.count }, (_, i) => i), pos = g.attributes.position, lowI = [], hiI = [], v = new THREE.Vector3();
      for (let i = 0; i < idx.length; i += 3) { let y = -9; for (let k = 0; k < 3; k++) y = Math.max(y, v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m.matrixWorld).y); (y > 9.8 ? hiI : lowI).push(idx[i], idx[i + 1], idx[i + 2]); }
      g.setIndex(lowI.concat(hiI)); g.clearGroups(); g.addGroup(0, lowI.length, 0); g.addGroup(lowI.length, hiI.length, 1); const pl = whiteShade(mPlaster.clone()); pl.name = n; m.material = [mm, pl];
    }
  }

  // ---- THE stone: the same big-block material the exterior builder uses on the adjoining walls (courses 0.32 m from floor level,
  // blocks 0.6–1.5 m, world-space mapped). Its material is reused directly so tone and course lines are identical; a local copy
  // of the generator is only the fallback when the exterior module is not loaded.
  let mStone = null; scene.traverse((o) => { if (mStone || !o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.map && Math.abs(m.map.repeat.x - 1 / 2.56) < 1e-4 && Math.abs(m.map.repeat.y - 1 / 2.56) < 1e-4 && m.roughness === .78) { mStone = m; break; } });
  if (!mStone) { const t = lib.honedLimestone(); t.offset.y = -ctx.SPEC.floorY / 2.56;
    mStone = new THREE.MeshStandardMaterial({ color: 0xeceef2, map: t, roughness: .78, metalness: 0, side: THREE.DoubleSide }); }
  const PX = FACE.x + 0.02, PZ = FACE.z0 - 0.02;   // cladding planes just proud of the model's skin
  const holes = []; for (const [y0, y1] of WIN_Y) for (const [z0, z1] of WIN_Z) holes.push([[-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1]]);
  const front = new THREE.Mesh(lib.wallWithHoles([[-FACE.z1, FACE.y0], [-PZ, FACE.y0], [-PZ, FACE.y1], [-FACE.z1, FACE.y1]], holes), mStone);   // uv = (-z, y): same mapping as the exterior's walls
  front.rotation.y = Math.PI / 2; front.position.x = PX; front.receiveShadow = true; grp.add(front);
  // corner return and top edge in the same stone
  const cop = new Soup(), W = [1, 1, 1];
  cop.quad([RET.x0, FACE.y0, PZ], [PX, FACE.y0, PZ], [PX, FACE.y1, PZ], [RET.x0, FACE.y1, PZ], [0, 0, -1], W, [[-RET.x0, FACE.y0], [-PX, FACE.y0], [-PX, FACE.y1], [-RET.x0, FACE.y1]]);
  cop.quad([13.40, FACE.y1 + 0.004, PZ], [PX, FACE.y1 + 0.004, PZ], [PX, FACE.y1 + 0.004, FACE.z1], [13.40, FACE.y1 + 0.004, FACE.z1], [0, 1, 0], W, [[13.40, PZ], [PX, PZ], [PX, FACE.z1], [13.40, FACE.z1]]);
  const cg = cop.geo(); cg.deleteAttribute('color'); const coping = new THREE.Mesh(cg, mStone); coping.receiveShadow = true; grp.add(coping);

  // ---- windows: warm-lit deep reveals, bronze frames with a vertical mullion, glowing glass ----
  const L = new Soup(), F = new Soup(), G = new Soup(); const xo = FACE.x + 0.022, e = 0.004;
  for (const [y0, y1] of WIN_Y) for (const [z0, z1] of WIN_Z) {
    const a = z0 + e, b = z1 - e, lo = y0 + e, hi = y1 - e, W = [1, 1, 1], D = [.42, .42, .42], Sl = [.8, .8, .8];
    // reveal liner (u: 0 at the stone face → 1 at the glass)
    L.quad([xo, lo, b], [GLASS_X, lo, b], [GLASS_X, hi, b], [xo, hi, b], [0, 0, -1], W, [[0, 0], [1, 0], [1, 1], [0, 1]]);   // +z side reveal (seen from the view)
    L.quad([xo, lo, a], [GLASS_X, lo, a], [GLASS_X, hi, a], [xo, hi, a], [0, 0, 1], W, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    L.quad([xo, lo, a], [GLASS_X, lo, a], [GLASS_X, lo, b], [xo, lo, b], [0, 1, 0], Sl, [[0, 0], [1, 0], [1, 1], [0, 1]]);   // sill
    L.quad([xo, hi, a], [GLASS_X, hi, a], [GLASS_X, hi, b], [xo, hi, b], [0, -1, 0], D, [[0, 0], [1, 0], [1, 1], [0, 1]]);   // head
    G.quad([GLASS_X, lo, a], [GLASS_X, lo, b], [GLASS_X, hi, b], [GLASS_X, hi, a], [1, 0, 0], W, [[1, 0], [0, 0], [0, 1], [1, 1]]);
    const fx0 = GLASS_X - 0.01, fx1 = GLASS_X + 0.055, t = 0.034, mz = b - 0.06 - (b - a - 0.06) * 0.42;
    F.box(fx0, lo, a, fx1, lo + t, b); F.box(fx0, hi - t, a, fx1, hi, b); F.box(fx0, lo, a, fx1, hi, a + t); F.box(fx0, lo, b - 0.062, fx1, hi, b); F.box(fx0, lo, mz - 0.012, fx1 + 0.008, hi, mz + 0.012);
  }
  const revealTex = gradTex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#3a2410'); gr.addColorStop(.35, '#8c5e2a'); gr.addColorStop(.75, '#dca65c'); gr.addColorStop(1, '#ffe0a4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(60,30,5,.25)'); gv.addColorStop(.3, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(255,220,150,.15)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  const liner = new THREE.Mesh(L.geo(), new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x8a6a45, roughness: 0.85, emissive: 0xffffff, emissiveMap: revealTex, emissiveIntensity: 1.0, side: THREE.DoubleSide })); grp.add(liner);
  const glassTex = gradTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d98a2c'); gr.addColorStop(.45, '#f6b850'); gr.addColorStop(1, '#e89a34'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(w * .55, h * .55, 4, w * .5, h * .55, w * .9); rg.addColorStop(0, 'rgba(255,226,150,.7)'); rg.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,80,20,.16)'; g.fillRect(0, 0, w, h * .12); g.fillRect(w * .1, h * .7, w * .5, h * .3); });
  const glass = new THREE.Mesh(G.geo(), new THREE.MeshStandardMaterial({ color: 0x1c252c, roughness: .02, metalness: 1, envMapIntensity: 1.6, transparent: true, opacity: .78, depthWrite: false })   /* same dark glass as the mosque */); glass.renderOrder = 2; grp.add(glass);
  // warm room seen through the glass: a lit back wall with a pendant lamp, set just behind the glazing
  const roomTex = gradTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c08a4a'); gr.addColorStop(.3, '#f6cf8c'); gr.addColorStop(.7, '#eebc74'); gr.addColorStop(1, '#b07a3e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const lamp = g.createRadialGradient(w * .5, h * .36, 2, w * .5, h * .36, w * .34); lamp.addColorStop(0, 'rgba(255,246,214,1)'); lamp.addColorStop(.25, 'rgba(255,214,130,.85)'); lamp.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = lamp; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(110,64,26,.35)'; g.fillRect(0, h * .76, w, h * .24); g.fillRect(w * .12, h * .56, w * .16, h * .2); g.fillStyle = 'rgba(60,30,10,.8)'; g.fillRect(w * .495, 0, w * .012, h * .3); });
  const R = new Soup(); for (const [y0, y1] of WIN_Y) for (const [z0, z1] of WIN_Z) { const zc = (z0 + z1) / 2, yc = (y0 + y1) / 2, hw = 0.42, x = GLASS_X - 0.025;   // just behind the glazing (the model has interior faces further back on the upper floor)
    R.quad([x, yc - hw, zc - hw], [x, yc - hw, zc + hw], [x, yc + hw, zc + hw], [x, yc + hw, zc - hw], [1, 0, 0], [1, 1, 1], [[1, 0], [0, 0], [0, 1], [1, 1]]); }
  grp.add(new THREE.Mesh(R.geo(), new THREE.MeshBasicMaterial({ map: roomTex, color: new THREE.Color(0.9, 0.75, 0.5) })));
  const frames = new THREE.Mesh(F.geo(), new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.45, metalness: 0.75 })); grp.add(frames);

  // ---- ground in front of the face: find its level, planting strip, uplights, reflections ----
  const rc = new THREE.Raycaster(new THREE.Vector3(FACE.x + 0.7, 4, -13.6), new THREE.Vector3(0, -1, 0), 0, 8); let gy = 0.45;
  const gm = []; ctx.glb.traverse((o) => { if (o.isMesh && o.userData.zone !== 'tower') gm.push(o); }); ctx.glb.updateMatrixWorld(true);
  const hit = rc.intersectObjects(gm, false)[0]; if (hit) gy = hit.point.y;
  // low gravel bed with a limestone kerb along the wall
  const bedW = 0.5, B = new Soup(); B.box(FACE.x, gy - 0.02, FACE.z0, FACE.x + bedW, gy + 0.035, FACE.z1, lin([40, 35, 28]));
  B.box(FACE.x + bedW, gy - 0.02, FACE.z0, FACE.x + bedW + 0.07, gy + 0.06, FACE.z1, lin([120, 112, 98]));
  const bed = new THREE.Mesh(B.geo(), new THREE.MeshStandardMaterial({ vertexColors: true, map: plaster.map, roughness: 0.95 })); bed.receiveShadow = true; grp.add(bed);
  const glowTex = gradTex(128, 128, (g, w, h) => { const rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); rg.addColorStop(0, 'rgba(255,236,190,1)'); rg.addColorStop(.18, 'rgba(255,190,100,.75)'); rg.addColorStop(.5, 'rgba(255,150,60,.2)'); rg.addColorStop(1, 'rgba(255,140,50,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); });
  // u across, v: 1 = at the fitting, 0 = far end; soft cone
  const coneTex = (pw, fall) => gradTex(64, 256, (g, w, h) => { const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x / (w - 1) - .5) * 2, v = y / (h - 1); // v=0 top of canvas = far end
      const wd = 0.2 + 0.8 * (1 - v); const a = Math.exp(-u * u / (wd * wd) * 2.6) * Math.pow(v, pw) * Math.min(1, v * 3.2) * (1 - 0.3 * Math.pow(v, 6)) * Math.min(1, (1 - v) * fall); const i = (y * w + x) * 4; im.data[i] = 255; im.data[i + 1] = 176; im.data[i + 2] = 86; im.data[i + 3] = 255 * Math.min(1, a); } g.putImageData(im, 0, 0); });
  const washTex = coneTex(0.5, 30), reflTex = coneTex(1.2, 30);
  const add = (map, op) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const fit = new Soup(), streaks = [];
  for (const z of LIGHT_Z) {
    const lx = FACE.x + 0.3, ly = gy + 0.035;
    fit.box(lx - 0.05, ly, z - 0.05, lx + 0.05, ly + 0.09, z + 0.05, [0.02, 0.018, 0.015]);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.5) })); lens.rotation.x = -Math.PI / 2; lens.position.set(lx, ly + 0.092, z); grp.add(lens);
    // grazing spot at the fitting (raking light on the relief) + a second, higher one that carries the wash up to the sills
    const sp = new THREE.SpotLight(0xffa64e, 11, 7, 0.5, 1, 1.0); sp.position.set(FACE.x + 0.3, ly + 0.1, z); sp.target.position.set(FACE.x + 0.05, ly + 6, z); grp.add(sp, sp.target);
    const sp2 = new THREE.SpotLight(0xffa64e, 13, 6, 0.45, 1, 1.0); sp2.position.set(FACE.x + 0.5, ly + 0.2, z); sp2.target.position.set(FACE.x, ly + 4.5, z); grp.add(sp2, sp2.target);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), add(glowTex, 0.3)); glow.position.set(lx + 0.02, ly + 0.22, z); glow.rotation.y = Math.PI / 2; grp.add(glow);
    // soft cone of light in the air just off the stone, fading at the sills of the lower windows
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.4), add(washTex, 0.85)); wash.position.set(FACE.x + 0.05, ly + 1.7, z); wash.rotation.y = Math.PI / 2; grp.add(wash);
    // mirror image of the wash in the polished paving at the foot of the wall (drawn over the ground, only when seen from the front)
    const rf = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), add(reflTex, 0.85)); rf.material.depthTest = false; rf.material.side = THREE.FrontSide; rf.renderOrder = 5;
    rf.scale.y = -1; rf.position.set(FACE.x + bedW + 0.07, gy - 0.95, z); rf.rotation.y = Math.PI / 2; grp.add(rf); streaks.push(rf);
  }
  const fm = new THREE.Mesh(fit.geo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.6 })); grp.add(fm);
  ctx.onFrame(() => { const c = ctx.camera.position, on = c.x > FACE.x + 1.2 && c.y > gy + 0.3 && c.y < 6; for (const m of streaks) m.visible = on; });
  ctx.addCollider(FACE.x, FACE.z0, FACE.x + bedW + 0.07, FACE.z1);

}
