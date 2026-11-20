// owned by the 'exterior' builder: sky, light mood, shell finishes (hall/bar/site/minaret/wc), landscape, exterior light effects
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const views = { exterior: { pos: [27.6, 2.05, 17.4], look: [8.6, 3.5, 1.2], fov: 58 }, side_entrance: { pos: [18.7, 2.25, -8.5], look: [14.2, 3.0, -6.55], fov: 56 } };

// ------------------------------------------------------------------ small helpers
const hash2 = (x, y, s = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
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
const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;

export async function build(ctx) {
  const { scene, lib, zones, SPEC, renderer } = ctx;
  const q = new URLSearchParams(location.search);
  const R = lib.rng(4242); const T0 = performance.now(); const tick = (l) => { if (q.has('time')) console.log('TIME ' + l + ' ' + Math.round(performance.now() - T0)); };
  const rr = (a, b) => a + R() * (b - a);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const DS = THREE.DoubleSide;

  // ================================================================= SKY + light mood (graded dusk, sunset glow strongest to the west / -X)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
      float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
      void main(){ vec3 d=normalize(vDir); float h=max(d.y,0.);
        float w=.5-.5*d.x/max(length(d.xz),1e-4);                       // 1 = looking west (-X), where the sun has set
        vec3 zen=vec3(.30,.42,.60), mid=vec3(.56,.66,.76), low=vec3(.97,.82,.62), hor=vec3(1.0,.80,.52);
        low=mix(low, vec3(1.0,.72,.46), w*.8); hor=mix(hor, vec3(1.0,.66,.36), w*.85);
        vec3 c=mix(hor, low, smoothstep(0.,.07,h)); c=mix(c, mid, smoothstep(.05,.30+.12*w,h)); c=mix(c, zen, smoothstep(.22,.85,h));
        vec2 p=d.xz/(d.y+.22)*1.1;
        float n=fbm(p*vec2(.9,1.25)+vec2(3.1,1.7)); float n2=fbm(p*2.6+vec2(8.,2.)); float m=n*.74+n2*.26;
        float cl=smoothstep(.40,.62,m)*smoothstep(.02,.16,d.y);
        float lit=smoothstep(.44,.68,m);
        float lowk=1.-smoothstep(.05,.45,h);
        vec3 warm=mix(vec3(.98,.90,.84), vec3(1.0,.84,.64), lowk*(.4+.6*w));
        vec3 body=mix(vec3(.76,.76,.80), vec3(.80,.68,.62), lowk*(.4+.6*w));
        c=mix(c, mix(body, warm, lit), cl*.78);
        if(d.y<0.) c=mix(hor*.9, vec3(.36,.30,.27), smoothstep(0.,-.12,d.y));
        gl_FragColor=vec4(c,1.); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  ctx.onFrame(() => sky.position.copy(ctx.camera.position));
  scene.background = new THREE.Color(0xe8c49a);
  scene.fog = new THREE.FogExp2(0xdcc0a0, 0.0026);
  // small procedural environment of the dusk sky, used as envMap on MY materials only (scene.environment would light other builders' interiors)
  let env = null;
  try { const pm = new THREE.PMREMGenerator(renderer); const s2 = new THREE.Scene(); s2.add(new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), skyMat)); { const sm = new THREE.MeshBasicMaterial({ color: 0x2a2f24 }), r0 = lib.rng(5); for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283 + r0() * .2, d = 16 + r0() * 8, h = 5 + r0() * 6; const t = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, h, 5), sm); t.position.set(Math.cos(a) * d, h / 2 - 1.6, Math.sin(a) * d); s2.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(2.6, 7, 5), sm); c.scale.set(1, .45, 1); c.position.set(Math.cos(a) * d, h - 1.4, Math.sin(a) * d); s2.add(c); } } env = pm.fromScene(s2, 0.008, 0.1, 200).texture; pm.dispose(); } catch (e) { console.warn('env failed', e); }

  ctx.sun.color.set(0xffd4a6); ctx.sun.intensity = 2.9;
  ctx.hemi.color.set(0xb6c0d6); ctx.hemi.groundColor.set(0x8e857c); ctx.hemi.intensity = 0.82;
  ctx.exposureOut = 0.82;
  tick('sky');

  // ================================================================= TEXTURES
  const T = {};
  // --- plaster
  { const c = lib.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { const n = 128 + (fbm(u, v, 16, 4, 3) - .5) * 150 + (Math.random() - .5) * 40; p[0] = p[1] = p[2] = n; }); }, { srgb: false });
    T.plasterN = lib.normalFromHeight(c.image, 0.9, { repeat: [1 / 1.2, 1 / 1.2] });
    T.plaster = lib.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f3eee4'; g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { const n = 0.955 + fbm(u, v, 3, 4, 9) * 0.07; p[0] *= n; p[1] *= n; p[2] *= n * 0.995; }); }, { repeat: [1 / 5, 1 / 5] }); }
  // --- THE stone (identical generator and settings to hall_mihrab.js `bigStone`): large rough split-face blocks, courses 0.32 m, blocks 0.6-1.5 m, matte
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
  T.ledge = bigStone(23);
  // course lines sit at floor level + k * 0.32 m (as inside), on every wall, all round the building
  for (const t of [T.ledge.map, T.ledge.normalMap]) t.offset.y = -SPEC.floorY / 2.56;
  // --- minaret: smooth honed limestone of the same colour, large panels 1.28 x 0.64 m with fine tight joints
  T.honed = lib.canvasTex(512, 512, (g, w, h) => { const r = lib.rng(29); g.fillStyle = 'rgb(150,130,100)'; g.fillRect(0, 0, w, h); const ph = h / 4, pw = w / 2;
    for (let j = 0; j < 4; j++) for (let i = -1; i < 2; i++) { const v = 0.97 + r() * 0.06; g.fillStyle = `rgb(${214 * v | 0},${188 * v | 0},${142 * v | 0})`; g.fillRect(i * pw + (j % 2) * pw / 2 + 1, j * ph + 1, pw - 1.5, ph - 1.5); }
    modulate(g, w, h, (u, v, p) => { const n = 0.94 + fbm(u, v, 6, 4, 29) * 0.12 + (Math.random() - .5) * .025; p[0] *= n; p[1] *= n; p[2] *= n; }); }, { repeat: [1 / 2.56, 1 / 2.56] });
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
  { const hs = honed(29); T.honed = hs.map; T.honedN = hs.normalMap; for (const t of [T.honed, T.honedN]) t.offset.y = -SPEC.floorY / 2.56; }   // identical to the qibla-wall limestone inside (hall_mihrab.js)
  // --- slab paving generator (colour + roughness + normal)
  function slabs(seed, size, tile, rowM, lenM, base, varL, veins) {
    const r = lib.rng(seed), W = size, pxm = W / tile; const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#fff'; hg.fillRect(0, 0, W, W);
    const rc = document.createElement('canvas'); rc.width = rc.height = W; const rg = rc.getContext('2d');
    const rows = Math.round(tile / rowM), rh = W / rows;
    const map = lib.canvasTex(W, W, (g) => { g.fillStyle = '#3f3830'; g.fillRect(0, 0, W, W);
      for (let j = 0; j < rows; j++) { const y = Math.round(j * rh); let x = -Math.round(r() * lenM[1] * pxm); const x0 = x;
        while (x < W + x0) { let cw = Math.round((lenM[0] + r() * (lenM[1] - lenM[0])) * pxm); if (W + x0 - x - cw < lenM[0] * pxm) cw = W + x0 - x;
          const l = base[2] + (r() - .5) * varL, s = base[1] + (r() - .5) * 6, hh = base[0] + (r() - .5) * 8; const ro = Math.round(60 + r() * 90);
          for (const ox of [0, W]) { g.fillStyle = hsl(hh, s, l); g.fillRect(x + ox + 1, y + 1, cw - 2, Math.round(rh) - 2); rg.fillStyle = `rgb(${ro},${ro},${ro})`; rg.fillRect(x + ox, y, cw, Math.round(rh) + 1);
            hg.fillStyle = '#000'; hg.fillRect(x + ox, y, 1.5, rh); }
          x += cw; }
        hg.fillStyle = '#000'; hg.fillRect(0, y, W, 1.5); }
      modulate(g, W, W, (u, v, p) => { let n = 0.80 + fbm(u, v, 5, 5, seed) * 0.4; if (veins) { const vv = Math.abs(fbm(u, v, 3, 4, seed + 3) - .5); n *= 0.9 + Math.min(1, vv * 14) * 0.12; } n += (Math.random() - .5) * .05; p[0] *= n; p[1] *= n; p[2] *= n; }); }, { repeat: [1 / tile, 1 / tile] });
    modulate(rg, W, W, (u, v, p) => { const n = Math.max(25, Math.min(255, p[0] + (fbm(u, v, 8, 4, seed + 7) - .5) * 110)); p[0] = p[1] = p[2] = n; });
    const rough = new THREE.CanvasTexture(rc); rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.repeat.set(1 / tile, 1 / tile); rough.anisotropy = 8;
    return { map, roughnessMap: rough, normalMap: lib.normalFromHeight(hc, 1.6, { repeat: [1 / tile, 1 / tile] }) };
  }
  T.pave = slabs(5, 1024, 3.6, 0.3, [0.3, 0.62], [30, 20, 44], 17, true);            // forecourt: warm semi-gloss stone
  T.trav = slabs(8, 512, 2.4, 0.4, [0.4, 0.8], [38, 22, 68], 9, true);              // terrace / steps: honed cream travertine
  function noiseTex(size, tile, cols, base, oct, seed, speck = 0.06) {
    const a = [parseInt(cols[0].slice(1, 3), 16), parseInt(cols[0].slice(3, 5), 16), parseInt(cols[0].slice(5, 7), 16)], b = [parseInt(cols[1].slice(1, 3), 16), parseInt(cols[1].slice(3, 5), 16), parseInt(cols[1].slice(5, 7), 16)];
    return lib.canvasTex(size, size, (g, w, h) => { g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { let n = fbm(u, v, base, oct, seed); n = Math.min(1, Math.max(0, (n - .3) * 2.5)); const s = 1 + (Math.random() - .5) * 2 * speck; for (let k = 0; k < 3; k++) p[k] = (a[k] + (b[k] - a[k]) * n) * s; }); }, { repeat: [1 / tile, 1 / tile] }); }
  T.asphalt = noiseTex(512, 3, ['#2b2b2d', '#3d3c3b'], 6, 4, 31, 0.22);
  T.asphalt2 = noiseTex(512, 3, ['#333335', '#454443'], 6, 4, 37, 0.2);
  T.grass = noiseTex(512, 2.5, ['#3a5e26', '#6f9040'], 24, 4, 41, 0.3);
  T.bed = noiseTex(512, 2, ['#221c14', '#3a3324'], 20, 4, 43, 0.35);
  T.sand = noiseTex(512, 8, ['#a48e74', '#bba68a'], 6, 5, 47, 0.08);
  T.roof = noiseTex(256, 2, ['#cfc8ba', '#e2dccf'], 16, 3, 53, 0.12);
  T.rock = noiseTex(512, 1, ['#8d8474', '#c9bfac'], 4, 5, 59, 0.10);
  { const c = lib.canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { const a = fbm(u, v, 4, 5, 61), b = Math.abs(fbm(u, v, 6, 4, 67) - .5); const n = 60 + a * 150 - Math.max(0, .05 - b) * 1400 + (Math.random() - .5) * 26; p[0] = p[1] = p[2] = Math.max(0, Math.min(255, n)); }); }, { srgb: false });
    T.rockN = lib.normalFromHeight(c.image, 3.2, { repeat: [1, 1] }); }
  // --- foliage atlas: 3 leaf-cluster tiles (alpha) + 1 solid foliage tile
  T.leafAtlas = lib.canvasTex(1024, 1024, (g, w, h) => { g.clearRect(0, 0, w, h); const r = lib.rng(77); const pal = ['#6f8a58', '#819a66', '#627c4e', '#90a474', '#587246', '#78925e'];
    const leaf = (x, y, l, wd, a, colr) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = colr; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * .5, -wd, l, 0); g.quadraticCurveTo(l * .5, wd, 0, 0); g.fill(); g.strokeStyle = 'rgba(40,60,20,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(l, 0); g.stroke(); g.restore(); };
    for (let t = 0; t < 3; t++) { const cx = (t % 2) * 512 + 256, cy = Math.floor(t / 2) * 512 + 256; const n = 110 + t * 30;
      for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 190, l = (t === 1 ? 34 : 46) + r() * 28; leaf(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.min(l, 244 - d), (t === 2 ? 7 : 11) + r() * 6, a + (r() - .5) * 1.6, pal[Math.floor(r() * pal.length)]); } }
    g.fillStyle = '#44583a'; g.fillRect(512, 512, 512, 512); for (let i = 0; i < 700; i++) leaf(512 + r() * 512, 512 + r() * 512, 22 + r() * 30, 7 + r() * 6, r() * 6.283, r() < .5 ? '#364830' : '#5e7850'); g.clearRect(500, 500, 12, 524); g.clearRect(500, 500, 524, 12); });
  T.leafAtlas.wrapS = T.leafAtlas.wrapT = THREE.ClampToEdgeWrapping;
  // --- blossoms (white on alpha; instance colour tints them purple / lavender / white)
  T.blossom = lib.canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); const r = lib.rng(81);
    for (let i = 0; i < 30; i++) { const x = 22 + r() * (w - 44), y = 22 + r() * (h - 44), s = 8 + r() * 7; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + i; g.fillStyle = r() < .5 ? '#ffffff' : '#e6dcf2'; g.beginPath(); g.ellipse(x + Math.cos(a) * s * .55, y + Math.sin(a) * s * .55, s * .55, s * .36, a, 0, 6.283); g.fill(); } g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(x, y, s * .22, 0, 6.283); g.fill(); } });
  T.blossom.wrapS = T.blossom.wrapT = THREE.ClampToEdgeWrapping;
  // --- ornamental grass blades (alpha)
  T.blades = lib.canvasTex(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); const r = lib.rng(83); g.lineCap = 'round';
    for (let i = 0; i < 150; i++) { const x0 = 256 + (r() - .5) * 60, sp = (r() - .5) * 2, x1 = 256 + sp * 236, y1 = 16 + Math.abs(sp) * 180 + r() * 100; const v = r(); g.strokeStyle = v < .4 ? '#a3b282' : v < .75 ? '#7e9466' : '#c2c49c'; g.lineWidth = 2.2 + r() * 2.6; g.beginPath(); g.moveTo(x0, 512); g.quadraticCurveTo(x0 + sp * 50, 220, x1, y1); g.stroke(); } });
  T.blades.wrapS = T.blades.wrapT = THREE.ClampToEdgeWrapping;
  // --- lit interiors seen through the glazing: 2x2 atlas of rooms
  T.rooms = lib.canvasTex(512, 512, (g, w, h) => { const r = lib.rng(91);
    for (let t = 0; t < 4; t++) { const ox = (t % 2) * 256, oy = Math.floor(t / 2) * 256; g.save(); g.beginPath(); g.rect(ox, oy, 256, 256); g.clip();
      let gr = g.createLinearGradient(0, oy, 0, oy + 256); gr.addColorStop(0, '#3a2410'); gr.addColorStop(.2, '#6a4620'); gr.addColorStop(.22, '#f2c07a'); gr.addColorStop(.55, '#d49a4e'); gr.addColorStop(.8, '#96642c'); gr.addColorStop(.82, '#4a3016'); gr.addColorStop(1, '#24160a'); g.fillStyle = gr; g.fillRect(ox, oy, 256, 256);
      for (let i = 0; i < 5; i++) { const x = ox + 20 + i * 54 + r() * 12, y = oy + 30 + r() * 12; gr = g.createRadialGradient(x, y, 0, x, y, 30); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(.3, 'rgba(255,225,160,.75)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60);
        gr = g.createLinearGradient(0, oy + 52, 0, oy + 190); gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 6, oy + 52); g.lineTo(x + 6, oy + 52); g.lineTo(x + 30, oy + 190); g.lineTo(x - 30, oy + 190); g.fill(); }
      const nf = 1 + t; for (let i = 0; i < nf; i++) { const x = ox + 20 + r() * 200, wd = 12 + r() * 22; g.fillStyle = `rgba(70,38,10,${.35 + r() * .3})`; g.fillRect(x, oy + 56, wd, 152); }
      if (t % 2 === 0) { const x = ox + 60 + r() * 120; g.fillStyle = 'rgba(255,236,190,.6)'; g.fillRect(x, oy + 80, 46, 128); g.fillStyle = 'rgba(120,70,20,.5)'; g.fillRect(x + 21, oy + 80, 3, 128); }
      gr = g.createLinearGradient(0, oy + 210, 0, oy + 256); gr.addColorStop(0, 'rgba(255,210,140,.5)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(ox, oy + 210, 256, 46);
      g.restore(); } });
  T.rooms.wrapS = T.rooms.wrapT = THREE.ClampToEdgeWrapping;
  // --- dark timber (boards along v) for door surrounds, leaves and canopies
  const boards = (g, w, h, n, r) => { const bw = w / n; for (let i = 0; i < n; i++) { g.fillStyle = hsl(29 + r() * 4, 30 + r() * 6, 62 + r() * 9); g.fillRect(i * bw, 0, bw, h); g.fillStyle = 'rgba(40,24,10,.6)'; g.fillRect(i * bw, 0, 1.6, h); }
    for (let i = 0; i < n * 110; i++) { g.fillStyle = `rgba(${r() < .6 ? '70,45,22' : '255,236,205'},${.04 + r() * .07})`; g.fillRect(r() * w, r() * h, .8 + r() * .8, 14 + r() * 44); } };
  T.timber = lib.canvasTex(256, 256, (g, w, h) => boards(g, w, h, 8, lib.rng(97)), { repeat: [1 / 0.96, 1 / 0.96] });
  T.motif = lib.canvasTex(512, 400, (g, w, h) => { boards(g, w, h, 16, lib.rng(98));
    const star = (ox, oy, colr, lw) => { g.save(); g.translate(w / 2 + ox, h / 2 + oy); g.strokeStyle = colr; g.lineWidth = lw; g.lineJoin = 'miter'; for (let k = 0; k < 2; k++) { g.rotate(Math.PI / 4); g.strokeRect(-62, -62, 124, 124); } g.beginPath(); g.arc(0, 0, 100, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, 30, 0, 6.283); g.stroke(); g.restore(); };
    g.save(); g.translate(w / 2, h / 2); g.scale(1.3, 1.3); g.translate(-w / 2, -h / 2); star(1.5, 2.5, 'rgba(60,36,16,.9)', 6); star(-.5, -1, 'rgba(255,240,214,.8)', 2); g.restore(); });
  T.motif.wrapS = T.motif.wrapT = THREE.ClampToEdgeWrapping;
  T.leafDoor = lib.canvasTex(256, 512, (g, w, h) => { const r = lib.rng(99); g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = hsl(22 + r() * 5, 40 + r() * 8, 15 + r() * 6); g.fillRect(i * 32 + 1, 0, 30.5, h); }
    for (let i = 0; i < 380; i++) { g.strokeStyle = `rgba(${r() < .5 ? '15,8,3' : '140,90,46'},${.05 + r() * .1})`; g.lineWidth = .6 + r(); const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y + 60 + r() * 80); g.stroke(); }
    g.strokeStyle = 'rgba(12,6,2,.8)'; g.lineWidth = 3; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = 'rgba(170,112,60,.35)'; g.lineWidth = 1.5; g.strokeRect(18, 18, w - 36, h - 36);
    g.save(); g.translate(w / 2, h * .42); g.strokeStyle = 'rgba(150,100,52,.55)'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.strokeRect(-34, -34, 68, 68); g.beginPath(); g.moveTo(0, 34); g.lineTo(0, 62); g.stroke(); } g.beginPath(); g.arc(0, 0, 62, 0, 6.283); g.stroke(); g.restore();
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(10,5,2,.6)'; g.fillRect(24 + i * 23.5, h - 120, 3, 96); } });
  T.leafDoor.wrapS = T.leafDoor.wrapT = THREE.ClampToEdgeWrapping;
  { const c = lib.canvasTex(256, 256, (g, w, h) => { g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { const n = fbm(u, v, 3, 3, 71) * 255; p[0] = p[1] = p[2] = n; }); }, { srgb: false });
    T.glassN = lib.normalFromHeight(c.image, 2.2, { repeat: [1 / 2.3, 1 / 2.3] });
    T.glassE = lib.canvasTex(128, 128, (g, w, h) => { g.fillRect(0, 0, w, h); modulate(g, w, h, (u, v, p) => { const n = Math.min(1, .66 + Math.max(0, fbm(u, v, 3, 3, 73) - .3) * 1.0); p[0] = 255 * n; p[1] = 188 * n; p[2] = 108 * n; }); }, { repeat: [1 / 6.3, 1 / 4.7] }); }
  // --- light / shadow decal textures
  const gradTex = (w, h, fn) => { const t = lib.canvasTex(w, h, (g) => { const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = Math.max(0, Math.min(255, fn((x / (w - 1)) * 2 - 1, 1 - y / (h - 1)) * 255)); const i = (y * w + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = c; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }, { srgb: false }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  T.wash = gradTex(128, 256, (u, v) => (Math.exp(-v * 2.6) * 1.0 + Math.exp(-v * 16) * .4) * Math.exp(-Math.pow(u / (0.09 + 0.40 * v), 2) * 1.6) * Math.min(1, v * 40) * (1 - Math.pow(Math.abs(u), 6)) * (1 - Math.pow(v, 5)));
  T.pool = gradTex(64, 64, (u, v) => { const d = Math.hypot(u, v * 2 - 1); return Math.pow(Math.max(0, 1 - d), 1.8); });
  T.streak = gradTex(64, 256, (u, v) => Math.pow(v, 1.5) * Math.exp(-u * u * 3.5) * Math.min(1, (1 - v) * 25) * (1 - Math.pow(Math.abs(u), 4)));
  T.line = gradTex(64, 4, (u) => Math.pow(1 - Math.abs(u), 2));
  T.ao = gradTex(4, 64, (u, v) => Math.pow(1 - v, 2.2));            // v=0 dark edge -> fades
  T.vign = gradTex(64, 64, (u, v) => Math.min(1, Math.pow(v, 3) * .9 + Math.pow(Math.abs(u), 5) * .7 + Math.pow(1 - v, 6) * .4));
  tick('textures');

  // ================================================================= MATERIALS
  const E = (o) => Object.assign(o, env ? { envMap: env } : {});
  // world-space macro variation so big faces never read as a repeating tile
  const WUV = `#include <uv_vertex>
      { vec3 wp0 = (modelMatrix * vec4(position, 1.0)).xyz; vec3 wn0 = normalize(mat3(modelMatrix) * normal); vec2 wuv = abs(wn0.y) > 0.5 ? wp0.xz : vec2(wp0.x + wp0.z, wp0.y);
      #ifdef USE_MAP
        vMapUv = (mapTransform * vec3(wuv, 1.0)).xy;
      #endif
      #ifdef USE_NORMALMAP
        vNormalMapUv = (normalMapTransform * vec3(wuv, 1.0)).xy;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = (roughnessMapTransform * vec3(wuv, 1.0)).xy;
      #endif
      }`;
  const WUVW = WUV.replace('vec2(wp0.x + wp0.z, wp0.y)', 'vec2(dot(wp0.xz, normalize(vec2(wn0.z, -wn0.x) + vec2(1e-5, 0.0))), wp0.y)');
  function macro(mat, amp, s1 = 0.33, s2 = 1.3, worldUV = false) {
    mat.onBeforeCompile = (sh) => {
      if (worldUV) sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', worldUV === 'wall' ? WUVW : WUV);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPm;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPm = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWPm; float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float mn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x), mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x), f.y), mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x), mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x), f.y), f.z); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n{ float mac = mn(vWPm*${s1.toFixed(3)})*.6 + mn(vWPm*${s2.toFixed(3)}+7.3)*.4; diffuseColor.rgb *= ${(1 - amp).toFixed(3)} + ${(2 * amp).toFixed(3)}*mac; }`); };
    mat.customProgramCacheKey = () => 'macro' + amp + '_' + s1 + '_' + s2 + worldUV; return mat; }
  const V2 = (a) => new THREE.Vector2(a, a);
  const M = {
    plaster: lib.std({ color: 0xfbf9f4, map: T.plaster, normalMap: T.plasterN, normalScale: V2(.25), roughness: .95, side: DS }),
    plasterB: null,
    // client: all stone is the same smooth honed limestone as the minaret
    ledge: macro(lib.std(E({ color: 0xeceef2, map: T.honed, normalMap: T.honedN, normalScale: V2(.5), roughness: .78, metalness: 0, envMapIntensity: .12, side: DS })), .03, .3, 1.1, 'wall'),
    honed: macro(lib.std(E({ color: 0xeceef2, map: T.honed, normalMap: T.honedN, normalScale: V2(.5), roughness: .78, metalness: 0, envMapIntensity: .12, side: DS })), .03, .3, 1.1, 'wall'),
    ashlar: null,
    trav: macro(lib.std(E({ color: 0xf2e8d6, map: T.trav.map, roughnessMap: T.trav.roughnessMap, normalMap: T.trav.normalMap, normalScale: V2(.5), roughness: .5, envMapIntensity: .7, side: DS })), .08, .33, 1.3, true),
    travWall: lib.std({ color: 0xf4e9d6, map: T.trav.map, normalMap: T.trav.normalMap, normalScale: V2(.4), roughness: .8, side: DS }),
    pave: macro(lib.std(E({ color: 0xffffff, map: T.pave.map, roughnessMap: T.pave.roughnessMap, normalMap: T.pave.normalMap, normalScale: V2(.45), roughness: .48, envMapIntensity: .7, side: DS })), .12, .25, 1.1, true),
    wet: macro(lib.std(E({ color: 0x8f8072, map: T.pave.map, roughnessMap: T.pave.roughnessMap, normalMap: T.pave.normalMap, normalScale: V2(.35), roughness: .22, metalness: .05, envMapIntensity: 1.25, side: DS })), .12, .25, 1.1, true),
    asphalt: lib.std(E({ map: T.asphalt, roughness: .78, envMapIntensity: .35, side: DS })), asphalt2: lib.std(E({ map: T.asphalt2, roughness: .8, envMapIntensity: .3, side: DS })),
    grass: lib.std({ map: T.grass, roughness: 1, side: DS }), bed: lib.std({ map: T.bed, roughness: 1, side: DS }),
    sand: lib.std({ map: T.sand, roughness: 1, side: DS }), roof: lib.std({ map: T.roof, roughness: .95, side: DS }),
    bronze: lib.std(E({ color: 0x9a7444, metalness: .85, roughness: .42, envMapIntensity: 1.0, side: DS })),
    bronzeDk: lib.std(E({ color: 0x1c1612, metalness: .7, roughness: .45, envMapIntensity: .5, side: DS })),
    gold: lib.std(E({ color: 0xd9ab58, metalness: .9, roughness: .3, envMapIntensity: 1.1, emissive: 0x6b4310, emissiveIntensity: .5, side: DS })),
    letters: lib.std(E({ color: 0x7a5426, metalness: .8, roughness: .38, emissive: 0x5a3208, emissiveIntensity: .25, envMapIntensity: .7, side: DS })),
    glassHall: lib.std(E({ color: 0x1c252c, roughness: .02, metalness: 1, transparent: true, opacity: .78, envMapIntensity: 1.6, normalMap: T.glassN, normalScale: V2(.2), emissive: 0xffffff, emissiveMap: T.glassE, emissiveIntensity: .45, side: DS, depthWrite: false })),
    glassBar: lib.std(E({ color: 0x1c252c, roughness: .02, metalness: 1, transparent: true, opacity: .78, envMapIntensity: 1.6, normalMap: T.glassN, normalScale: V2(.2), emissive: 0xffffff, emissiveMap: T.glassE, emissiveIntensity: .45, side: DS, depthWrite: false })),
    exitDoor: lib.std({ color: 0x8c8274, roughness: .6, metalness: .1, side: DS }),
    timber: lib.std({ map: T.timber, color: 0x9c7a56, roughness: .72, side: DS }),
    lantern: lib.std({ color: 0x2a1a08, emissive: 0xffb264, emissiveIntensity: 1.1, roughness: .4, side: DS }),
    paintY: lib.std({ color: 0xd8cfa0, roughness: .8, side: DS, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    paintB: lib.std({ color: 0x3a5fae, roughness: .8, side: DS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    water: lib.std(E({ color: 0x1d3a3c, roughness: .04, metalness: .2, envMapIntensity: 1.6, side: DS })),
    metalLt: lib.std(E({ color: 0xb9b6ae, metalness: .6, roughness: .5, envMapIntensity: .6, side: DS })),
    metalDk: lib.std(E({ color: 0x55524d, metalness: .6, roughness: .5, envMapIntensity: .6, side: DS })),
    white: lib.std({ color: 0xeeeae2, roughness: .6, side: DS }),
    frost: lib.std(E({ color: 0x1c252c, roughness: .02, metalness: 1, envMapIntensity: 1.6, transparent: true, opacity: .78, side: DS })),   // one glass everywhere outside
  };

  M.ashlar = M.ledge;   // one stone everywhere
  M.plasterB = M.plaster;   // and one stucco: the model has coplanar duplicate wall faces, identical finish hides the z-fight smear
  M.domeBronze = lib.std(E({ color: 0x94703f, metalness: .55, roughness: .58, envMapIntensity: .3, side: DS }));

  // ================================================================= RESTYLE THE MODEL
  const table = {
    material_61_6: M.plaster, material: M.plasterB, material_44: M.plaster, Color_M01: M.plasterB, material_48: M.plasterB,
    material_30_1: M.ledge, Carpet_01_1K: M.ledge, Stone_Sandstone_Ashlar_Light: M.ashlar,
    material_11_3: M.ledge, material_43: M.ledge, Stone_Brushed_Khaki: M.trav,
    Carrera_Marble: M.trav, Groundcover_Rock_Crushed_2_inch: M.trav, material_28: M.trav, Basketweave: M.trav,
    Pavers_Stone_Walk: M.pave, Asphalt_New: M.asphalt, Asphalt_New_5: M.asphalt, material_29: M.asphalt2, material_7: M.sand,
    Color_E03: M.paintY, Color_I04: M.paintB, Grass_Dark_Green: M.grass, Vegetation_Blur_01: M.bed, Vegetation_Honey_Locust: M.bed, Water_Dark_Blue: M.water,
    material_15: M.roof, material_61: M.domeBronze, material_31: M.gold, material_35: M.letters, Sandstone: M.bronzeDk, Sandstone_0: M.bronze,
    Translucent_Glass_Tinted: M.frost, Color_M06: M.metalDk, material_4: M.metalDk,
    'IRender_-_Plastic2': M.bronzeDk, _0128_White: M.white, _0129_WhiteSmoke: M.white, _0132_LightGray: M.metalLt, _0134_DimGray: M.metalDk, _0135_DarkGray: M.metalDk,
    __Color_000_2: M.white, __Translucent_Glass_Gray_1: M.frost, __Translucent_Glass_Gray_2: M.frost,
    material_30: M.plaster, material_46_2: M.plaster, material_46: M.bronze, __auto_20: M.bronze,
  };
  scene.updateMatrixWorld(true);
  const glassMeshes = [];
  // side entrances get a timber door + canopy: the model's glazed door infill and its old canopies are replaced (hidden) there
  const HIDE = /^hall--(group_(6|8|10)|SketchUp_Instance_(178|179|180|181|182|183|26|24))__/, EXIT = /^hall--group_(2|4|5)__/;
  for (const z of ['hall', 'bar', 'site', 'minaret', 'wc']) for (const m of (zones[z] || [])) {
    const n = m.userData.matName; let mat = table[n];
    if (HIDE.test(m.name) || m.name === 'hall--loose__Sandstone') { m.visible = false; m.castShadow = false; continue; }
    if (EXIT.test(m.name) && /Glass/.test(n)) { m.material = M.exitDoor; continue; }
    if (/Translucent_Glass_Blue/.test(n)) { mat = z === 'hall' ? M.glassHall : z === 'minaret' ? M.lantern : M.glassBar; m.castShadow = z === 'minaret'; m.renderOrder = 2; if (z !== 'minaret') glassMeshes.push(m); }   // minaret lantern panes cast shadow so the shaft's shadow is solid (no louvre streaks on the parapet)
    if (z === 'site' && n === 'material') mat = M.trav;
    if (z === 'minaret' && n === 'Sandstone') mat = M.bronze;
    if (z === 'minaret' && /material_30_1|material_11_3/.test(n)) mat = M.honed;
    if (n === 'Color_E03' || n === 'Color_I04' || /Asphalt|material_29|material_7|Pavers|Grass|Vegetation|Water/.test(n)) m.castShadow = false;
    if (mat) m.material = mat;
  }
  // dark, wet polished paving in front of the stone tower face (x 13.4…24.2, z -19.6…-10.2): split those triangles off
  { const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
    for (const z of ['hall', 'bar', 'site']) for (const m of zones[z]) { const n = m.userData.matName; if (!/Carrera_Marble|material_28|Basketweave|Groundcover|Pavers_Stone_Walk|^material$/.test(n)) continue;
      let g = m.geometry; if (g.index) g = g.toNonIndexed(); const p = g.attributes.position; const sel = []; const tc = p.count / 3;
      for (let i = 0; i < tc; i++) { for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, i * 3 + k).applyMatrix4(m.matrixWorld); const cx = (v[0].x + v[1].x + v[2].x) / 3, cy = (v[0].y + v[1].y + v[2].y) / 3, cz = (v[0].z + v[1].z + v[2].z) / 3;
        e1.subVectors(v[1], v[0]); e2.subVectors(v[2], v[0]); e1.cross(e2).normalize();
        sel.push(cx > 13.4 && cx < 24.25 && cz > -19.7 && cz < -10.15 && cy < 1.3 && Math.abs(e1.y) > .9 ? 1 : 0); }
      const nb = sel.reduce((a, b) => a + b, 0); if (!nb) continue;
      const order = []; for (let i = 0; i < tc; i++) if (!sel[i]) order.push(i); for (let i = 0; i < tc; i++) if (sel[i]) order.push(i);
      for (const name of Object.keys(g.attributes)) { const at = g.attributes[name], it = at.itemSize, src = at.array, dst = new src.constructor(src.length); order.forEach((t, j) => { for (let k = 0; k < 3 * it; k++) dst[j * 3 * it + k] = src[t * 3 * it + k]; }); g.setAttribute(name, new THREE.BufferAttribute(dst, it, at.normalized)); }
      g.clearGroups(); g.addGroup(0, (tc - nb) * 3, 0); g.addGroup((tc - nb) * 3, nb * 3, 1); m.geometry = g; m.material = [m.material, M.wet]; } }
  tick('restyle');
  if (q.has('dbgmat')) return;

  // ================================================================= GLAZING: dark reflective glass + lit interior backdrops + reveal shadow
  const hallBack = [];
  { const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3();
    const bp = { hall: { pos: [], uv: [], col: [] }, bar: { pos: [], uv: [], col: [] } }, vg = { pos: [], uv: [] };
    const barA = new THREE.Vector2(-22.0, -13.3), barB = new THREE.Vector2(8.9, -23.5), ab = barB.clone().sub(barA), abl = ab.lengthSq();
    const quad = (o, c, t, hw, y0, y1, uv4, colr) => { const ax = c.x - t.x * hw, az = c.z - t.z * hw, bx = c.x + t.x * hw, bz = c.z + t.z * hw;
      o.pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az); o.uv.push(uv4[0], uv4[1], uv4[2], uv4[1], uv4[2], uv4[3], uv4[0], uv4[1], uv4[2], uv4[3], uv4[0], uv4[3]); if (o.col) for (let i = 0; i < 6; i++) o.col.push(colr, colr, colr); };
    for (const m of glassMeshes) { const g = m.geometry, p = g.attributes.position, idx = g.index, cnt = idx ? idx.count : p.count; const cl = {};
      for (let i = 0; i < cnt; i += 3) { for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, idx ? idx.getX(i + k) : i + k).applyMatrix4(m.matrixWorld);
        e1.subVectors(v[1], v[0]); e2.subVectors(v[2], v[0]); nn.crossVectors(e1, e2); const a = nn.length() / 2; if (a < 1e-5) continue; nn.normalize(); if (Math.abs(nn.y) > .3) continue; nn.y = 0; nn.normalize();
        if (nn.x < -1e-3 || (Math.abs(nn.x) < 1e-3 && nn.z < 0)) nn.negate(); const d = nn.x * v[0].x + nn.z * v[0].z; const key = Math.round(nn.x * 8) + '_' + Math.round(nn.z * 8) + '_' + Math.round(d * 3);
        const c = cl[key] || (cl[key] = { n: nn.clone(), d: 0, a: 0, t0: 1e9, t1: -1e9, y0: 1e9, y1: -1e9 }); c.d += d * a; c.a += a;
        for (const w of v) { const t = w.x * c.n.z - w.z * c.n.x; c.t0 = Math.min(c.t0, t); c.t1 = Math.max(c.t1, t); c.y0 = Math.min(c.y0, w.y); c.y1 = Math.max(c.y1, w.y); } }
      for (const c of Object.values(cl)) { const d = c.d / c.a, W = c.t1 - c.t0, H = c.y1 - c.y0; if (c.a < .12 || W < .25 || H < .3) continue; const tx = c.n.z, tz = -c.n.x, tm = (c.t0 + c.t1) / 2;
        const cen = new THREE.Vector3(c.n.x * d + tx * tm, (c.y0 + c.y1) / 2, c.n.z * d + tz * tm); const zone = m.userData.zone;
        let rx = 0, rz = -3.65; if (zone === 'bar') { const pt = new THREE.Vector2(cen.x, cen.z); const tt = Math.max(0, Math.min(1, pt.clone().sub(barA).dot(ab) / abl)); rx = barA.x + ab.x * tt; rz = barA.y + ab.y * tt; }
        else if (cen.z > 3.8 && cen.x > -7.2 && cen.x < 6.3) { rx = cen.x; rz = 4.8; }
        const s = Math.sign((cen.x - rx) * c.n.x + (cen.z - rz) * c.n.z) || 1; const out = new THREE.Vector3(c.n.x * s, 0, c.n.z * s), tv = new THREE.Vector3(tx, 0, tz);
        const depth = 1.3 + R() * 0.5, mg = 0.3; const bc = cen.clone().addScaledVector(out, -depth); const tile = Math.floor(R() * 4), u0 = (tile % 2) * .5 + .012, v0 = (tile < 2 ? .5 : 0) + .012;
        if (zone === 'hall' && c.y0 < 4.5) continue;
        const br = R() < .2 ? rr(.1, .2) : rr(.6, 1.15);
        const o = bp[zone === 'hall' ? 'hall' : 'bar'], hw = W / 2 + mg, ya = c.y0 - .25, yb = c.y1 + .3, U = .476;
        quad(o, bc, tv, hw, ya, yb, [u0, v0, u0 + U, v0 + U], br);
        // returns of the light box (side walls, ceiling, floor) so oblique views still look into a lit room
        const q4 = (p0, p1, p2, p3, uv4, k) => { for (const pp of [p0, p1, p2, p0, p2, p3]) o.pos.push(pp.x, pp.y, pp.z); o.uv.push(uv4[0], uv4[1], uv4[2], uv4[1], uv4[2], uv4[3], uv4[0], uv4[1], uv4[2], uv4[3], uv4[0], uv4[3]); for (let i = 0; i < 6; i++) o.col.push(k, k, k); };
        const fc = cen.clone().addScaledVector(out, -.03), P = (base, sgn, y) => new THREE.Vector3(base.x + tv.x * hw * sgn, y, base.z + tv.z * hw * sgn);
        for (const sg of [-1, 1]) q4(P(fc, sg, ya), P(bc, sg, ya), P(bc, sg, yb), P(fc, sg, yb), [u0 + U * .04, v0, u0 + U * .2, v0 + U], br * .8);
        q4(P(fc, -1, yb), P(fc, 1, yb), P(bc, 1, yb), P(bc, -1, yb), [u0, v0 + U * .82, u0 + U, v0 + U * .98], br * .9);
        q4(P(fc, -1, ya), P(fc, 1, ya), P(bc, 1, ya), P(bc, -1, ya), [u0, v0 + U * .02, u0 + U, v0 + U * .16], br * .8);
        if (c.a > W * H * .8) quad(vg, cen.clone().addScaledVector(out, .03), tv, W / 2, c.y0, c.y1, [0, 0, 1, 1]); } }
    for (const k of ['hall', 'bar']) { if (!bp[k].pos.length) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bp[k].pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(bp[k].uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(bp[k].col, 3));
      const me = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: T.rooms, vertexColors: true, side: DS, fog: false })); scene.add(me); if (k === 'hall') hallBack.push(me); }
    if (vg.pos.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vg.pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(vg.uv, 2));
      const me = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x0c0806, alphaMap: T.vign, transparent: true, opacity: .75, depthWrite: false, side: DS })); me.renderOrder = 3; scene.add(me); hallBack.push(me); } }
  // from inside the hall the shell glass is clear and the fake backdrops disappear
  ctx.onFrame(() => { const inside = ctx.inHall(ctx.camera.position); M.glassHall.opacity = inside ? .1 : .78; M.glassHall.envMapIntensity = inside ? .2 : 1.6; M.glassHall.emissiveIntensity = inside ? 0 : .45; for (const b of hallBack) b.visible = !inside; });
  if (q.has('noglass')) for (const m of glassMeshes) m.visible = false;
  if (q.has('time')) console.log('TIME backdrops ' + hallBack.length + ' glass ' + glassMeshes.length);
  tick('glazing');

  // ================================================================= GROUND QUERIES
  const groundMeshes = []; for (const z of ['site', 'hall', 'bar']) for (const m of zones[z]) if (/Pavers|Asphalt|Grass|Vegetation|Carrera|Groundcover|material_28|material_29|Ashlar|Water|material_7/.test(m.userData.matName) || (z === 'site' && m.userData.matName === 'material')) groundMeshes.push(m);
  const rc = new THREE.Raycaster(); const dn = new THREE.Vector3(0, -1, 0);
  const org = new THREE.Vector3(); const subsets = new Map();
  function ground(x, z, from = 3.2, mats = null) { rc.set(org.set(x, from, z), dn); rc.far = from + 1; let list = groundMeshes; if (mats) { list = subsets.get(mats); if (!list) { list = groundMeshes.filter(m => mats.test(m.userData.matName)); subsets.set(mats, list); } } const h = rc.intersectObjects(list, false); return h.length ? { y: h[0].point.y, mat: h[0].object.userData.matName } : { y: 0.3, mat: null }; }
  const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; };
  const toS = (P) => P.map(([x, z]) => [x, -z]);

  // ground to the horizon
  { const g = new THREE.Mesh(new THREE.RingGeometry(95, 700, 48, 1), M.sand); g.rotation.x = -Math.PI / 2; g.position.y = 0.12; scene.add(g); const uv = g.geometry.attributes.uv, p = g.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getY(i)); }

  // ================================================================= FORECOURT EXTENSION (warm paving laid over the nearest parking bays) + planter island
  const plaza = [[27.8, 4.3], [19.4, 23.0], [27.2, 26.5], [35.6, 7.8]]; const PY = 0.5;
  { const m = new THREE.Mesh(lib.wallWithHoles(toS(plaza), [], 0.22), M.pave); m.rotation.x = -Math.PI / 2; m.position.y = PY - 0.22; m.receiveShadow = true; scene.add(m); }
  const island = [[20.2, 15.3], [23.4, 14.5], [24.9, 15.6], [25.4, 17.6], [24.2, 19.8], [21.0, 19.0]]; const ISY = 0.66;
  const island2 = [[29.4, 6.2], [31.2, 7.0], [28.6, 12.6], [27.2, 13.4], [26.6, 12.4]];   // second bed, right of the main view
  for (const P of [island, island2]) { const cxi = P.reduce((a, p) => a + p[0], 0) / P.length, czi = P.reduce((a, p) => a + p[1], 0) / P.length; const inner = P.map(([x, z]) => [cxi + (x - cxi) * .92, czi + (z - czi) * .92]);
    const kerb = new THREE.Mesh(lib.wallWithHoles(toS(P), [toS(inner).reverse()], 0.5), M.ashlar); kerb.rotation.x = -Math.PI / 2; kerb.position.y = ISY + 0.04 - 0.5; kerb.castShadow = kerb.receiveShadow = true; scene.add(kerb);
    const soil = new THREE.Mesh(lib.wallWithHoles(toS(inner), [], 0), M.bed); soil.rotation.x = -Math.PI / 2; soil.position.y = ISY; soil.receiveShadow = true; scene.add(soil); }
  const bedY = (x, z) => inPoly(x, z, island) || inPoly(x, z, island2) ? ISY : null;

  // ================================================================= DOME: ribs, base ring, glazed drum
  { const cx = -0.05, cz = 0.1, y0 = SPEC.shell.roofY, Rr = 3.47, Hh = 3.32; const parts = [];
    for (let i = 0; i < 16; i++) { const t = new THREE.TorusGeometry(Rr, 0.085, 4, 10, Math.PI / 2 - 0.05); t.scale(1, Hh / Rr, 1); t.rotateY(i / 16 * Math.PI * 2 + 0.2); parts.push(t); }
    const ring = new THREE.TorusGeometry(Rr + 0.06, 0.09, 4, 32); ring.rotateX(Math.PI / 2); ring.translate(0, 0.62, 0); parts.push(ring);
    const ring2 = new THREE.TorusGeometry(Rr + 0.08, 0.11, 4, 32); ring2.rotateX(Math.PI / 2); ring2.translate(0, 0.04, 0); parts.push(ring2);
    for (let i = 0; i < 16; i++) { const b = new THREE.BoxGeometry(0.1, 0.6, 0.12); b.translate(Rr + 0.07, 0.32, 0); b.rotateY(i / 16 * Math.PI * 2 + 0.2); parts.push(b); }
    const ribs = new THREE.Mesh(mergeGeometries(parts), M.domeBronze); ribs.position.set(cx, y0, cz); ribs.castShadow = true; scene.add(ribs);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(Rr - 0.01, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.domeBronze); shell.scale.y = Hh / Rr; shell.position.set(cx, y0 + .01, cz); shell.castShadow = true; scene.add(shell);   // closed, opaque from inside too
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(Rr + 0.05, Rr + 0.05, 0.56, 32, 1, true), lib.std({ color: 0x2a1a08, emissive: 0xffb45e, emissiveIntensity: 1.3, roughness: .3 })); drum.position.set(cx, y0 + 0.33, cz); scene.add(drum); }

  // ================================================================= LIGHT DECALS + FAKE AO
  const WARM = 0xffb25c;
  const addMat = (tex, color, op) => new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: DS, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const washMat = addMat(T.wash, 0xffc080, .8), washMatS = addMat(T.wash, 0xffc888, .95), poolMat = addMat(T.pool, WARM, .3), streakMat = addMat(T.streak, 0xffc070, .3), lineGlowMat = addMat(T.line, 0xffc27a, .3);
  const fixGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.05, 10); const fixMat = lib.std({ color: 0x2a2018, emissive: 0xffd9a0, emissiveIntensity: 2.5, roughness: .4 });
  const fixtures = [];
  function wash(x, y, z, w, h, face, strong = false, fixture = true) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), strong ? washMatS : washMat); const o = 0.035; let nx = 0, nz = 0;
    if (face === '+x') { m.rotation.y = Math.PI / 2; nx = 1; } else if (face === '-x') { m.rotation.y = -Math.PI / 2; nx = -1; } else if (face === '-z') { m.rotation.y = Math.PI; nz = -1; } else nz = 1;
    m.position.set(x + nx * o, y + h / 2, z + nz * o); m.renderOrder = 4; scene.add(m);
    if (fixture) { fixtures.push([x + nx * 0.28, y + 0.02, z + nz * 0.28]);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), poolMat); p.rotation.x = -Math.PI / 2; p.position.set(x + nx * 0.5, y + 0.02, z + nz * 0.5); p.renderOrder = 4; scene.add(p); }
  }
  function streak(x, y, z, w, len, face) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), streakMat); m.rotation.x = -Math.PI / 2; let nx = 0, nz = 0;
    if (face === '+x') { m.rotation.z = -Math.PI / 2; nx = 1; } else if (face === '-x') { m.rotation.z = Math.PI / 2; nx = -1; } else if (face === '+z') { m.rotation.z = Math.PI; nz = 1; } else nz = -1;
    m.position.set(x + nx * len / 2, y + 0.015, z + nz * len / 2); m.renderOrder = 4; scene.add(m); }
  const lineMat = lib.std({ color: 0x33261a, emissive: 0xffd49a, emissiveIntensity: 2.0, roughness: .4 });
  function lightLine(ax, az, bx, bz, y) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, L), lineMat); s.position.set((ax + bx) / 2, y + 0.006, (az + bz) / 2); s.rotation.y = a; scene.add(s);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(1.1, L), lineGlowMat); g.rotation.set(-Math.PI / 2, 0, a); g.position.set((ax + bx) / 2, y + 0.012, (az + bz) / 2); g.renderOrder = 4; scene.add(g); }
  // --- fake ambient occlusion: merged dark gradient quads (uv.y = 0 at the dark edge)
  const ao = { pos: [], uv: [] };
  const aoQuad = (a, b, c, d) => { ao.pos.push(...a, ...b, ...c, ...a, ...c, ...d); ao.uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1); };   // a,b on the dark edge; d,c on the far edge
  // wall base from (ax,az) to (bx,bz); outward is on the right-hand side when walking a -> b
  function aoBase(ax, az, bx, bz, y, h = 0.9, gw = 1.1) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ox = -dz / L, oz = dx / L, e = 0.025;
    aoQuad([ax + ox * e, y, az + oz * e], [bx + ox * e, y, bz + oz * e], [bx + ox * e, y + h, bz + oz * e], [ax + ox * e, y + h, az + oz * e]);
    aoQuad([ax, y + 0.014, az], [bx, y + 0.014, bz], [bx + ox * gw, y + 0.014, bz + oz * gw], [ax + ox * gw, y + 0.014, az + oz * gw]); }
  function aoUnder(ax, az, bx, bz, yTop, h) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ox = -dz / L, oz = dx / L, e = 0.03;
    aoQuad([ax + ox * e, yTop, az + oz * e], [bx + ox * e, yTop, bz + oz * e], [bx + ox * e, yTop - h, bz + oz * e], [ax + ox * e, yTop - h, az + oz * e]); }
  aoBase(14.22, 3.7, 14.22, -10.9, 1.0); aoBase(13.62, -10.9, 13.62, -16.4, 0.6, .7, .9);
  aoBase(-14.2, 3.72, -7.6, 3.72, 0.5); aoBase(6.7, 3.72, 14.2, 3.72, 0.8); aoBase(-7.1, 6.02, 6.2, 6.02, 0.5); aoBase(6.22, 6.0, 6.22, 3.7, 0.8, .9, .8); aoBase(-7.12, 3.7, -7.12, 6.0, 0.5, .9, .8);
  aoBase(-11.4, 10.12, -7.9, 10.12, 0.55); aoBase(-7.88, 10.1, -7.88, 6.6, 0.55); aoBase(-7.9, 6.58, -11.4, 6.58, 0.55); aoBase(-11.42, 6.6, -11.42, 10.1, 0.55);
  aoBase(-14.32, -10.9, -14.32, 3.7, 0.6); aoBase(-11.6, 13.52, -3.5, 13.52, 0.5, .7, .9);
  aoUnder(14.22, 3.7, 14.22, -10.9, 9.7, .55); aoUnder(-14.2, 3.72, 14.2, 3.72, 9.7, .55); aoUnder(-7.1, 6.02, 6.2, 6.02, 4.9, .4); aoUnder(6.7, 3.72, 14.2, 3.72, 4.9, .35);
  for (const P of [island, island2]) for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; const cw = (P[1][0] - P[0][0]) * (P[2][1] - P[1][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[1][0]) > 0; const [s, e] = cw ? [b, a] : [a, b]; aoBase(s[0], s[1], e[0], e[1], PY, 0.18, 0.7); }

  // --- east (entrance) facade, terrace level 1.0: tall washes on every pier
  const XE = 14.2, YT = 1.02;
  for (const z of [3.3, 0.35, -2.8, -9.4]) wash(XE, YT, z, 1.9, 5.6, '+x', true);
  for (const z of [3.3, 0.35, -2.8, -9.4]) streak(XE + 0.3, YT, z, 1.0, 4.6, '+x');
  // --- south (qibla) facade: regular rhythm on stone and plaster
  for (const x of [-12.9, 8.0, 11.0]) wash(x, x < 0 ? 0.52 : 0.82, 3.7, 1.9, 5.6, '+z', true);
  for (const x of [-5.9, -0.2, 5.75]) wash(x, 0.52, 6.0, 1.8, 3.6, '+z', true);
  for (const x of [8.0, 11.0, -3.0, -5.9]) streak(x, 0.5, x > 6 ? 4.2 : 6.3, 1.2, 4.2, '+z');
  
  // --- minaret
  wash(-9.65, 0.55, 10.1, 3.2, 14, '+z', true); wash(-11.4, 0.55, 8.35, 3.2, 14, '-x', true); wash(-7.9, 0.55, 8.35, 3.2, 14, '+x', true); wash(-9.65, 0.55, 6.6, 3.0, 9, '-z', false, false);
  { const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 13), lib.std({ color: 0x2a1a08, emissive: 0xffb35a, emissiveIntensity: 1.4 })); slot.position.set(-9.7, 12.2, 9.93); scene.add(slot); }
  // --- west facade
  for (const z of [-9.6, -2.75, 3.3]) wash(-14.3, 0.6, z, 1.8, 5, '-x', true);
  // --- side building, north facade (rotated ~22 deg): find the wall by ray and lay the wash on it
  { const rc2 = new THREE.Raycaster(); const nrm = new THREE.Vector3(0.3714, 0, 0.9285); const walls = zones.bar.filter(m => /material_30_1|material_61_6/.test(m.userData.matName));
    for (const xt of [-20.6, -14.1, -11.0, -7.6, -1.9, 1.5, 9.0]) { const zf = -18.2 + (xt + 17.8) * -0.399; rc2.set(new THREE.Vector3(xt - nrm.x * 8, 1.7, zf - nrm.z * 8), nrm); rc2.far = 14; const h = rc2.intersectObjects(walls, false)[0]; if (!h) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 4.6), washMatS); m.position.set(h.point.x - nrm.x * 0.04, 0.55 + 2.3, h.point.z - nrm.z * 0.04); m.rotation.y = Math.atan2(-nrm.x, -nrm.z); m.renderOrder = 4; scene.add(m); fixtures.push([h.point.x - nrm.x * 0.3, 0.57, h.point.z - nrm.z * 0.3]); } }
  { const im = new THREE.InstancedMesh(fixGeo, fixMat, fixtures.length); const mx0 = new THREE.Matrix4(); fixtures.forEach((f, i) => { mx0.makeTranslation(f[0], f[1], f[2]); im.setMatrixAt(i, mx0); }); scene.add(im); }
  // light lines in the paving
  lightLine(24.0, 12.9, 27.0, 6.2, 0.5); lightLine(20.5, 19.6, 17.4, 26.0, 0.5); lightLine(26.2, 21.2, 31.8, 8.8, PY);
  lightLine(12.3, 15.35, 20.3, 15.35, 0.5); lightLine(14.3, 5.6, 23.9, 5.6, 0.5); lightLine(24.02, -9.6, 24.02, 4.6, 0.8);

  // real grazing uplights (no shadows): they rake the stone relief and glint on the glossy paving. 8 lights total.
  for (const [x, y, z, I, d] of [[14.7, 1.3, 3.3, 9, 10], [14.7, 1.3, 0.35, 9, 10], [14.7, 1.3, -2.8, 9, 10], [14.8, 1.35, -9.4, 10, 10], [8.0, 1.1, 4.2, 9, 10], [11.0, 1.1, 4.2, 9, 10], [15.0, 3.45, -6.7, 5, 6], [-9.65, 0.9, 10.7, 12, 14]]) { const l = new THREE.PointLight(0xffac5c, I, d, 2); l.position.set(x, y, z); scene.add(l); }
  // ================================================================= ENTRANCES (SPEC.entrances): two timber side doors + glazed back porch
  { const EN = SPEC.entrances; const only = q.get('only') ? q.get('only').split(',') : null; const standIn = !!only && !only.includes('hall_core');   // closed stand-in leaves only when the interior module (which owns the swinging leaves) is not loaded
    const leafMat2 = lib.std({ map: T.leafDoor, roughness: .9, color: 0xb0a8a0 }); const motifMat = lib.std({ map: T.motif, color: 0x9c7a56, roughness: .72 }); const LH = 2.38; const box = (w, h, d, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(lib.boxM(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };
    const glowMat = lib.std({ color: 0x3a2a18, emissive: 0xffc98a, emissiveIntensity: 2.2 });
    for (const [sx, xf] of [[1, 14.2], [-1, -14.3]]) { const e = sx > 0 ? EN.east : EN.west, zc = (e.z0 + e.z1) / 2, F = SPEC.floorY, top = 3.95;
      // timber surround: jambs + head, set in the wall thickness and standing 8 cm proud
      for (const z of [e.z0 + .045, e.z1 - .045]) box(0.3, top - F + .05, 0.09, M.timber, xf - sx * .12, (F + top + .05) / 2, z);
      box(0.3, 0.09, e.z1 - e.z0, M.timber, xf - sx * .12, top + .005, zc);
      box(0.3, 0.04, e.z1 - e.z0 - .18, M.trav, xf - sx * .12, F + .02, zc, false);   // stone threshold sill closing the gap under the leaves
      if (standIn) { for (const s2 of [-1, 1]) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.93, LH), leafMat2); lf.position.set(xf - sx * .14, F + LH / 2 + .01, zc + s2 * .47); lf.rotation.y = sx * Math.PI / 2; scene.add(lf);
          box(0.05, 0.42, 0.035, M.bronze, xf - sx * .10, F + 1.15, zc + s2 * .07, false); } box(0.02, LH, 0.012, M.bronzeDk, xf - sx * .135, F + LH / 2, zc, false); }
      // timber transom panel over the leaves (no blank infill), carrying one simple carved motif
      { const ph = top - (F + LH) - .0; const pn = new THREE.Mesh(new THREE.PlaneGeometry(e.z1 - e.z0 - .2, ph), motifMat); pn.position.set(xf - sx * .1, F + LH + ph / 2, zc); pn.rotation.y = sx * Math.PI / 2; pn.castShadow = pn.receiveShadow = true; scene.add(pn); box(0.06, 0.07, e.z1 - e.z0 - .2, M.timber, xf - sx * .09, F + LH + .01, zc, false); }
      // rough stone surround standing proud of the wall, with the door opening cut out
      { const z0 = e.z0 - 1.25, z1 = e.z1 + .16, y0 = 1.0, y1 = 4.78; const g = lib.wallWithHoles([[z0, y0], [z1, y0], [z1, y1], [z0, y1]], [[[e.z0 - .01, y0], [e.z0 - .01, top + .06], [e.z1 + .01, top + .06], [e.z1 + .01, y0]]], 0.07);
        const m = new THREE.Mesh(g, M.ledge); m.rotation.y = -Math.PI / 2; m.position.x = sx > 0 ? xf + 0.07 : xf; m.castShadow = m.receiveShadow = true; scene.add(m); }
      // flat projecting timber canopy: a thin plain slab 3.0 x 1.2 m, underside 2.9 m above the landing
      box(1.2, 0.05, 3.0, M.timber, xf + sx * (0.6 + .07), top + .2, zc);
      { const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), addMat(T.pool, 0xffc890, .45)); sp.rotation.x = Math.PI / 2; sp.position.set(xf + sx * .65, top + .172, zc); sp.renderOrder = 4; scene.add(sp); }   // soft light on the soffit
      aoUnder(xf + sx * .12, sx > 0 ? e.z1 + .5 : e.z0 - .5, xf + sx * .12, sx > 0 ? e.z0 - .5 : e.z1 + .5, top + .15, 1.1);
      // stone landing at floor level (the model's terrace steps lead down to the paving)
      box(2.3, 0.07, e.z1 - e.z0 + 1.7, M.trav, xf + sx * 1.15, F - .035, zc); if (sx < 0) box(2.3, 0.6, e.z1 - e.z0 + 1.7, M.ashlar, xf + sx * 1.15, F - .37, zc);
    }
    // back entrance: small glazed bronze-framed porch on a stone landing
    { const b = EN.back, xc = (b.x0 + b.x1) / 2, zf = b.z - .02, D = 1.65, Wd = b.x1 - b.x0 + .7, F = Math.max(SPEC.floorY, ground(xc, zf - 1, 3).y + .02), H = 2.95; const pg = M.glassBar;
      box(Wd + .5, 0.08, D + .15, M.trav, xc, F - .04, zf - (D + .15) / 2);
      for (const x of [xc - Wd / 2, xc + Wd / 2]) { box(0.07, H, 0.07, M.bronzeDk, x, F + H / 2, zf - D); box(0.07, H, 0.07, M.bronzeDk, x, F + H / 2, zf - .04); box(0.05, 0.07, D, M.bronzeDk, x, F + H, zf - D / 2); box(0.04, 0.05, D, M.bronzeDk, x, F + 1.0, zf - D / 2);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(D - .08, H - .1), pg); gl.rotation.y = Math.PI / 2; gl.position.set(x, F + H / 2, zf - D / 2); gl.renderOrder = 2; scene.add(gl); }
      box(Wd + .07, 0.07, 0.07, M.bronzeDk, xc, F + H, zf - D); box(Wd + .07, 0.07, 0.07, M.bronzeDk, xc, F + H, zf - .04); box(0.05, 0.06, D, M.bronzeDk, xc, F + H, zf - D / 2);
      { const rf = new THREE.Mesh(new THREE.PlaneGeometry(Wd + .3, D + .25), pg); rf.rotation.x = -Math.PI / 2; rf.position.set(xc, F + H + .045, zf - D / 2 - .1); rf.renderOrder = 2; scene.add(rf); }
      // bronze frame on the face around the door opening
      for (const x of [b.x0 - .04, b.x1 + .04]) box(0.09, H - .25, 0.12, M.bronzeDk, x, F + (H - .25) / 2, zf); box(b.x1 - b.x0 + .17, 0.09, 0.12, M.bronzeDk, xc, F + H - .25, zf);
      { const s2 = new THREE.Mesh(new THREE.PlaneGeometry(Wd - .4, 0.08), glowMat); s2.rotation.x = Math.PI / 2; s2.position.set(xc, F + H - .04, zf - .3); scene.add(s2); }
      streak(xc, F + .005, zf - .1, 2.2, 3.2, '-z'); }
  }
  tick('decals');

  // ================================================================= PLANTING (leaf-card clumps, grasses, blossom drifts, boulders)
  const mx = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), eu = new THREE.Euler(), col = new THREE.Color();
  function instanced(geo, mat, items, cast = true) { // items: [x,y,z, sx,sy,sz, rotY, color?, tiltX?, tiltZ?]
    if (!items.length) return null; const im = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, i) => { eu.set(it[8] || 0, it[6] || 0, it[9] || 0); qt.setFromEuler(eu); mx.compose(ps.set(it[0], it[1], it[2]), qt, sc.set(it[3], it[4], it[5])); im.setMatrixAt(i, mx); if (it[7] != null) im.setColorAt(i, col.set(it[7])); });
    im.castShadow = cast; im.receiveShadow = true; scene.add(im); return im; }
  const tileUV = (k) => { const x0 = (k % 2) * .5, y0 = Math.floor(k / 2) * .5; return [x0 + .004, 1 - (y0 + .5) + .004, x0 + .496, 1 - y0 - .004]; };   // [u0,v0,u1,v1]
  // clump of leaf cards over a dome, with spherical normals and darker interior/base
  function cardClump(N, seed, { size = .62, core = true, tiles = [0, 1, 2], lift = 1, flat = 1, tex = true } = {}) { const r = lib.rng(seed); const pos = [], nor = [], uv = [], colr = []; const d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), nn = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
    for (let i = 0; i < N; i++) { const th = r() * 6.283, cph = 1 - r() * 1.12, sph = Math.sqrt(Math.max(0, 1 - cph * cph)); d.set(Math.cos(th) * sph, cph, Math.sin(th) * sph); const rad = (0.74 + r() * 0.26) * lift; p.copy(d).multiplyScalar(rad); p.y *= flat;
      nn.copy(d).add(t1.set((r() - .5) * .9, (r() - .5) * .9, (r() - .5) * .9)).normalize(); a.crossVectors(Math.abs(nn.y) > .95 ? t2.set(1, 0, 0) : up, nn).normalize(); b.crossVectors(nn, a); const roll = r() * 6.283, cr = Math.cos(roll), sr = Math.sin(roll); t1.copy(a).multiplyScalar(cr).addScaledVector(b, sr); t2.copy(a).multiplyScalar(-sr).addScaledVector(b, cr);
      const s = size * (0.75 + r() * 0.5) / 2; const [u0, v0, u1, v1] = tex ? tileUV(tiles[Math.floor(r() * tiles.length)]) : [0, 0, 1, 1]; const sh = (0.42 + 0.58 * Math.max(0, Math.min(1, p.y / flat))) * (0.82 + r() * 0.3); const sn = t1.clone().copy(d).multiplyScalar(.75).add(up.clone().multiplyScalar(.45)).normalize();
      const cs = [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, -1, u0, v0], [1, 1, u1, v1], [-1, 1, u0, v1]];
      for (const c of cs) { pos.push(p.x + (t1.x * c[0] + t2.x * c[1]) * s, p.y + (t1.y * c[0] + t2.y * c[1]) * s, p.z + (t1.z * c[0] + t2.z * c[1]) * s); nor.push(sn.x, sn.y, sn.z); uv.push(c[2], c[3]); colr.push(sh, sh, sh); } }
    if (core) { const g = new THREE.IcosahedronGeometry(0.7 * lift, 0); const gp = g.attributes.position; const [u0, v0, u1, v1] = tileUV(3); for (let i = 0; i < gp.count; i++) { const y = Math.max(-.1, gp.getY(i)) * flat; pos.push(gp.getX(i), y, gp.getZ(i)); p.set(gp.getX(i), gp.getY(i) + .4, gp.getZ(i)).normalize(); nor.push(p.x, p.y, p.z); uv.push(u0 + (u1 - u0) * (.3 + .4 * ((i * 7) % 5) / 4), v0 + (v1 - v0) * (.3 + .4 * ((i * 3) % 4) / 3)); const sh = 0.3 + 0.3 * Math.max(0, y); colr.push(sh, sh, sh); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); return g; }
  const shrubHiG = cardClump(72, 3, { size: .46 }), shrubLoG = cardClump(26, 4, { size: .72 }), driftG = cardClump(17, 5, { size: .62, flat: .55 }), bloomG = cardClump(14, 6, { size: .5, core: false, lift: 1.1, flat: .6, tex: false }), bloomLoG = cardClump(8, 8, { size: .6, core: false, lift: 1.12, flat: .6, tex: false });
  // ornamental grass tuft: crossed blade cards leaning outward
  function tuft(n, seed) { const r = lib.rng(seed); const pos = [], nor = [], uv = [], colr = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI + r() * .3, ca = Math.cos(a), sa = Math.sin(a), lean = (r() - .5) * .3; const pts = [[-.5, 0, 0, 0], [.5, 0, 1, 0], [.5, 1, 1, 1], [-.5, 0, 0, 0], [.5, 1, 1, 1], [-.5, 1, 0, 1]];
      for (const c of pts) { pos.push(c[0] * ca - sa * lean * c[1], c[1], c[0] * sa + ca * lean * c[1]); nor.push(c[0] * ca * .5, .85, c[0] * sa * .5); uv.push(c[2], c[3]); const sh = .5 + .5 * c[1]; colr.push(sh, sh, sh); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); return g; }
  const tuftHiG = tuft(5, 2), tuftLoG = tuft(3, 3);
  const noFlip = (m) => { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0')); }; m.customProgramCacheKey = () => 'noflip'; return m; };
  const leafMat = noFlip(lib.std({ map: T.leafAtlas, alphaTest: .3, alphaToCoverage: true, side: DS, roughness: .9, vertexColors: true }));
  const bloomMat = noFlip(lib.std({ map: T.blossom, alphaTest: .3, alphaToCoverage: true, side: DS, roughness: .8, emissive: 0x6a5c8a, emissiveMap: T.blossom, emissiveIntensity: .18 }));
  const bladeMat = noFlip(lib.std({ map: T.blades, alphaTest: .3, alphaToCoverage: true, side: DS, roughness: .9, vertexColors: true }));
  // rounded boulder with a rock normal map
  function boulder(seed) { let g = new THREE.IcosahedronGeometry(1, 3); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-3); const p = g.attributes.position; const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.26 * (fbm(v.x * .22 + .5, v.y * .22 + .5 + v.z * .17, 3, 2, seed) - .5) * 2 + 0.05 * (fbm(v.x * .5 + .5 + v.y * .3, v.z * .5 + .5, 8, 2, seed + 3) - .5) * 2; v.multiplyScalar(n); if (v.y < -.42) v.y = -.42 - (v.y + .42) * .15; v.y += .42; p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g; }
  const rockG = boulder(9); T.rock.repeat.set(2, 1.5); T.rockN.repeat.set(2, 1.5);
  const rockMat = lib.std({ map: T.rock, normalMap: T.rockN, normalScale: V2(1.3), roughness: .92, color: 0xffffff });

  const S = { shrubHi: [], shrubLo: [], driftHi: [], driftLo: [], bloomHi: [], bloomLo: [], tuftHi: [], tuftLo: [], rock: [], shadow: [] };
  const greens = ['#e2e8d2', '#cfdac0', '#eeeedc', '#c2ceb4', '#d8dcc0', '#b8c6aa'], grassC = ['#d2d8b4', '#bccaa2', '#dcd6b6', '#aebc98'], blooms = ['#8f7cb6', '#a090c4', '#8672a4', '#b2a6cc', '#ded8ea'];
  // keep the stone tower face clear: nothing in front of it nor in the sight wedge of the `tower` view
  const towerWedge = [[50, -24.2], [13.5, -20.8], [13.5, -8.6]];
  const noPlant = (x, z) => (x > 13.4 && x < 22.6 && z > -18.6 && z < -9.4) || inPoly(x, z, towerWedge);
  function scatter(n, x0, z0, x1, z1, mats, fn, tries = 12) { let placed = 0; for (let i = 0; i < n * tries && placed < n; i++) { const x = rr(x0, x1), z = rr(z0, z1); if (noPlant(x, z)) continue; if (typeof mats === 'function') { const y = mats(x, z); if (y != null) { fn(x, y, z); placed++; } continue; } const g = ground(x, z, 3.2, mats); if (g.mat) { fn(x, g.y, z); placed++; } } }
  const addShrub = (x, y, z, s, hi) => { (hi ? S.shrubHi : S.shrubLo).push([x, y + s * .12, z, s * rr(.95, 1.25), s * rr(.8, 1.1), s * rr(.95, 1.25), R() * 6.28, pick(greens)]); S.shadow.push([x, y + .02, z, s * 2.9, 1, s * 2.9, 0]); };
  const addDrift = (x, y, z, s, hi, c) => { const ry = R() * 6.28, sx = s * rr(1.1, 1.6), sz = s * rr(1.0, 1.4); (hi ? S.driftHi : S.driftLo).push([x, y + s * .05, z, sx, s, sz, ry, pick(greens)]); (hi ? S.bloomHi : S.bloomLo).push([x, y + s * .07, z, sx, s, sz, ry + 1, c || pick(blooms)]); S.shadow.push([x, y + .02, z, sx * 2.5, 1, sz * 2.5, 0]); };
  const addTuft = (x, y, z, s, hi) => (hi ? S.tuftHi : S.tuftLo).push([x, y - .02, z, s * rr(.9, 1.3), s * rr(.8, 1.25), s * rr(.9, 1.3), R() * 6.28, new THREE.Color(pick(grassC)).multiplyScalar(1.15)]);
  function bed(x0, z0, x1, z1, mats, dens, o = {}) { const area = (x1 - x0) * (z1 - z0) * (o.fill || .5), hi = !!o.hi, k = o.scale || 1;
    scatter(Math.round(area * dens * 0.5), x0, z0, x1, z1, mats, (x, y, z) => addShrub(x, y, z, rr(.32, .62) * k, hi));
    scatter(Math.round(area * dens * 0.95), x0, z0, x1, z1, mats, (x, y, z) => addTuft(x, y, z, rr(.45, .9) * k, hi));
    scatter(Math.round(area * dens * 0.55), x0, z0, x1, z1, mats, (x, y, z) => addDrift(x, y, z, rr(.26, .46) * k, hi)); }
  const GR = /Grass_Dark_Green/, VG = /Vegetation/;
  // hero bed (foreground of the main view): layered by hand – tall shrubs at the back, grasses mid, flower drifts on the paving side
  { const cx0 = 22.7, cz0 = 17.2; scatter(26, 20.2, 14.5, 25.4, 19.8, bedY, (x, y, z) => { const d = Math.hypot(x - 21.8, z - 16.6); addShrub(x, y, z, d < 1.6 ? rr(.5, .72) : rr(.3, .46), true); });
    scatter(46, 20.2, 14.5, 25.4, 19.8, bedY, (x, y, z) => addTuft(x, y, z, rr(.45, .85), true));
    scatter(24, 20.2, 14.5, 25.4, 19.8, bedY, (x, y, z) => addDrift(x, y, z, rr(.24, .4), true)); }
  bed(26.6, 6.2, 31.2, 13.4, bedY, 2.6, { fill: .45, hi: true, scale: .9 });
  bed(11.9, 15.6, 20.6, 27.9, GR, 1.25);
  bed(-3.2, 15.4, 5.5, 24, GR, 0.8);
  bed(24.1, -17.3, 25.9, 1.7, VG, 1.9, { fill: 1, scale: .85 });
  bed(27.9, -19.5, 35.5, 5.5, VG, 0.45, { scale: 1.2 });
  bed(-25.2, -47.9, -1.9, -23.8, VG, 0.11, { scale: 1.8 });
  bed(-9.8, -13.3, -3.5, -11.1, GR, 1.1);
  scatter(26, -48, -54, 12, 15, GR, (x, y, z) => addShrub(x, y, z, rr(.5, .9), false));
  // planting against the walls (softens the wall / paving junction)
  for (const [x, z, s] of [[12.6, 4.5, .5], [10.0, 4.4, .42], [9.2, 4.6, .3], [7.2, 4.5, .45], [-12.6, 4.5, .5], [-11.2, 4.4, .36], [-13.4, 4.6, .4]]) { const g = ground(x, z); addShrub(x, g.y, z, s, true); addTuft(x + .5, g.y, z + .25, .6, true); addDrift(x - .45, g.y, z + .35, .28, true); }
  // boulders
  for (const [x, z, s] of [[24.25, 18.2, 0.52], [22.5, 15.5, 0.36], [21.2, 17.9, 0.3], [18.9, 17.6, 0.7], [15.2, 18.4, 0.5], [17.2, 22.5, 0.85], [2.5, 17.5, 0.7], [28.9, 9.4, 0.5], [25.0, -3.0, 0.4], [30.5, -8, .7]]) { if (noPlant(x, z)) continue; const y = bedY(x, z) ?? ground(x, z).y; S.rock.push([x, y - .06, z, s * 1.45, s * .95, s * 1.1, R() * 6.28, R() < .5 ? '#ffffff' : '#ece4d8']); S.shadow.push([x, y + .02, z, s * 3.6, 1, s * 3.2, 0]); }
  instanced(shrubHiG, leafMat, S.shrubHi); instanced(shrubLoG, leafMat, S.shrubLo); instanced(driftG, leafMat, S.driftHi); instanced(driftG, leafMat, S.driftLo);
  instanced(bloomG, bloomMat, S.bloomHi, false); instanced(bloomLoG, bloomMat, S.bloomLo, false); instanced(tuftHiG, bladeMat, S.tuftHi, false); instanced(tuftLoG, bladeMat, S.tuftLo, false); instanced(rockG, rockMat, S.rock);

  // small ornamental trees (thin trunk + airy crown of leaf cards)
  { const trunks = []; const crowns = []; const tg = new THREE.CylinderGeometry(0.03, 0.055, 1, 6); tg.translate(0, .5, 0); const crownG = cardClump(30, 12, { size: .55, core: false, tiles: [1, 2], lift: 1 });
    for (const [x, z, h] of [[25.0, -0.6, 2.6], [25.0, -7.6, 2.9], [16.4, 17.4, 2.8], [9.2, 5.0, 2.8], [-1.5, 17, 3.0], [30, -3, 3.2], [14.0, 19.5, 2.6], [21.6, 16.4, 2.7]]) { if (noPlant(x, z)) continue; const y0 = bedY(x, z) ?? ground(x, z).y; trunks.push([x, y0, z, 1, h * .72, 1, 0, '#6a5846', rr(-.05, .05), rr(-.05, .05)]);
      crowns.push([x, y0 + h * .62, z, .95, .8, .95, R() * 6.28, pick(['#b8cc8a', '#a6bc7c', '#c8d898'])]); }
    instanced(tg, lib.std({ color: 0xffffff, roughness: .9 }), trunks); instanced(crownG, leafMat, crowns); }
  tick('planting');

  // ================================================================= PATH LIGHTS
  { const post = new THREE.CylinderGeometry(0.022, 0.022, 0.34, 6); post.translate(0, .17, 0); const head = new THREE.CylinderGeometry(0.075, 0.06, 0.05, 10); head.translate(0, .36, 0);
    const lampG = mergeGeometries([post, head]); const glowG = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10); glowG.translate(0, .325, 0);
    const pts = [[24.7, 16.3], [23.1, 15.0], [22.0, 18.6], [19.9, 16.6], [18.6, 19.6], [17.3, 22.6], [16.0, 25.6], [14.6, 15.9], [12.6, 18.2], [24.3, 1.2], [24.3, -5.5], [5.0, 16.0], [-2.6, 16.0], [28.4, -4], [29.6, 8.0], [27.6, 12.2]];
    const a = []; const pm = addMat(T.pool, 0xffb45c, .4);
    for (const [x, z] of pts) { const y = bedY(x, z) ?? ground(x, z).y; a.push([x, y, z, 1, 1, 1, 0]); const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), pm); p.rotation.x = -Math.PI / 2; p.position.set(x, y + 0.035, z); p.renderOrder = 4; scene.add(p); }
    instanced(lampG, M.bronzeDk, a); instanced(glowG, lib.std({ color: 0x33261a, emissive: 0xffd39a, emissiveIntensity: 3 }), a, false); }

  // ================================================================= DATE PALMS (feathered fronds built from leaflet blades)
  { const ringDraw = (g, w, h, hgt) => { const r = lib.rng(9); g.fillStyle = hgt ? '#808080' : '#6e5d4b'; g.fillRect(0, 0, w, h); const n = 8, bh = h / n;
      for (let j = 0; j < n; j++) { const y = j * bh; if (hgt) { const gr = g.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(.7, '#707070'); gr.addColorStop(1, '#101010'); g.fillStyle = gr; g.fillRect(0, y, w, bh); }
        else { g.fillStyle = hsl(28 + r() * 8, 16 + r() * 8, 34 + r() * 10); g.fillRect(0, y, w, bh); g.fillStyle = 'rgba(30,22,14,.55)'; g.fillRect(0, y + bh - 3, w, 3); g.fillStyle = 'rgba(190,170,140,.25)'; g.fillRect(0, y, w, 2); }
        for (let i = 0; i < 60; i++) { const x = r() * w, l = bh * (.3 + r() * .6); g.fillStyle = hgt ? `rgba(${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},.12)` : `rgba(${r() < .5 ? '35,25,16' : '170,150,120'},${.12 + r() * .2})`; g.fillRect(x, y + r() * (bh - l), 1 + r() * 1.5, l); } } };
    const trunkTex = lib.canvasTex(128, 256, (g, w, h) => ringDraw(g, w, h, false), { repeat: [2, 7] });
    const trunkH = lib.canvasTex(128, 256, (g, w, h) => ringDraw(g, w, h, true), { srgb: false });
    const trunkMat = lib.std({ map: trunkTex, normalMap: lib.normalFromHeight(trunkH.image, 2.2, { repeat: [2, 7] }), roughness: 1 });
    function crown(seed) { const r = lib.rng(seed); const pos = [], colr = []; const N = 18, SEG = 6, K = 17; const P = new THREE.Vector3(), D = new THREE.Vector3(), Sd = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      const tri = (a, b, c, ca, cb, cc) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); colr.push(...ca, ...cb, ...cc); };
      const cRib = [.42, .42, .26], cBase = [.17, .25, .12], cTip = [.33, .41, .21];
      for (let f = 0; f < N; f++) { const az = f * 2.399 + r() * .4, el0 = 0.12 + Math.pow(f / (N - 1), 1.15) * 1.35, L = 3.3 + r() * 1.0, droop = 0.85 + r() * .7 + (f / N) * .7; const ca = Math.cos(az), sa = Math.sin(az); Sd.set(-sa, 0, ca);
        const pt = (t) => { let x = .12, y = 0; const n = 12; for (let i = 1; i <= n; i++) { const tt = t * i / n, th = el0 + droop * tt * tt; x += Math.sin(th) * L * t / n; y += Math.cos(th) * L * t / n; } return new THREE.Vector3(x * ca, y, x * sa); };
        let prev = pt(0); for (let s = 1; s <= SEG; s++) { const cur = pt(s / SEG); const w0 = .035 * (1 - (s - 1) / SEG) + .008, w1 = .035 * (1 - s / SEG) + .008; const a = prev.clone().addScaledVector(Sd, w0), b = prev.clone().addScaledVector(Sd, -w0), c = cur.clone().addScaledVector(Sd, -w1), d = cur.clone().addScaledVector(Sd, w1); tri(a, b, c, cRib, cRib, cRib); tri(a, c, d, cRib, cRib, cRib); prev = cur; }
        for (let k = 0; k < K; k++) { const t = 0.14 + 0.86 * (k + r() * .5) / K; P.copy(pt(t)); D.copy(pt(Math.min(1, t + .03))).sub(P).normalize(); const ll = 0.62 * Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * t)), .7) * (0.85 + r() * .3); const b0 = P.clone().addScaledVector(D, -.035), b1 = P.clone().addScaledVector(D, .035);
          for (const sg of [-1, 1]) { const tip = P.clone().addScaledVector(Sd, sg * ll * .78).addScaledVector(D, ll * .42).addScaledVector(up, -ll * (.28 + .3 * t) + ll * .12); tri(b0, b1, tip, cBase, cBase, cTip); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.computeVertexNormals(); return g; }
    const fg = crown(3); const tg = new THREE.CylinderGeometry(0.2, 0.3, 1, 8, 3); tg.translate(0, .5, 0); const crownG = new THREE.SphereGeometry(0.42, 6, 4); crownG.scale(1, 1.3, 1);
    const frondMat = lib.std({ vertexColors: true, side: DS, roughness: .7 });
    const palms = [[24.6, 8.9, 8.6], [18.2, 24.6, 9.0], [-16.5, 9.5, 9.5], [-19, 5.5, 7.5], [4.5, 25.5, 8], [30.5, -5, 8.5], [33.5, -9.5, 7], [27, -30, 8], [-16, 14, 6.5], [-30, -14, 8], [-24, -30, 9], [-8, -34, 8]];
    const tr = [], frs = [], cr = [], pits = [];
    for (const [x, z, h] of palms) { const g = ground(x, z); const ry = R() * 6.28, tx = rr(-.04, .04), tz = rr(-.04, .04); tr.push([x, g.y, z, 1, h, 1, ry, '#ffffff', tx, tz]); const s = rr(.9, 1.12); frs.push([x + tz * h, g.y + h, z - tx * h, s, s, s, ry, pick(['#ffffff', '#eef4dc', '#f6f0dc'])]); cr.push([x + tz * h, g.y + h - .2, z - tx * h, 1, 1, 1, 0]);
      if (g.mat && /Pavers|material_28|Asphalt/.test(g.mat)) pits.push([x, g.y, z]); ctx.addCollider(x - .3, z - .3, x + .3, z + .3); }
    instanced(tg, trunkMat, tr); instanced(fg, frondMat, frs); instanced(crownG, lib.std({ color: 0x6a5238, roughness: 1 }), cr);
    const pitG = new THREE.BoxGeometry(1.5, 0.06, 1.5), kerbG = new THREE.TorusGeometry(0.98, 0.06, 4, 4); kerbG.rotateX(Math.PI / 2); kerbG.rotateY(Math.PI / 4);
    instanced(pitG, M.bed, pits.map(p => [p[0], p[1] + 0.01, p[2], 1, 1, 1, 0]), false); instanced(kerbG, M.travWall, pits.map(p => [p[0], p[1] + 0.05, p[2], 1, 1, 1, 0]));
    const pt2 = []; for (const p of pits) for (let k = 0; k < 5; k++) { const s = rr(.4, .6); pt2.push([p[0] + rr(-.5, .5), p[1] + .04, p[2] + rr(-.5, .5), s, s, s, R() * 6.28, pick(grassC)]); } instanced(tuftLoG, bladeMat, pt2, false);
    for (const [x, z] of palms.slice(0, 5)) { const g = ground(x, z); const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), poolMat); p.rotation.x = -Math.PI / 2; p.position.set(x, g.y + 0.09, z); p.renderOrder = 4; scene.add(p); }
  }
  // contact shadows under plants / boulders, and the merged AO mesh
  { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); const m = new THREE.MeshBasicMaterial({ color: 0x0a0806, alphaMap: T.pool, transparent: true, opacity: .62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); const im = instanced(g, m, S.shadow, false); if (im) { im.receiveShadow = false; im.renderOrder = 3; }
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(ao.pos, 3)); ag.setAttribute('uv', new THREE.Float32BufferAttribute(ao.uv, 2));
    const am = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: 0x0b0806, alphaMap: T.ao, transparent: true, opacity: .6, depthWrite: false, side: DS, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); am.renderOrder = 3; scene.add(am); }
  tick('palms');

  // ================================================================= COLLIDERS (outer massing; the east door z -7.7…-5.7 stays open)
  { const sh = SPEC.shell, EN = SPEC.entrances;                 // shell open only at the three doorways
    ctx.addCollider(sh.x1 - .1, sh.z0, sh.x1 + .25, EN.east.z0); ctx.addCollider(sh.x1 - .1, EN.east.z1, sh.x1 + .25, sh.z1 + .1);
    ctx.addCollider(sh.x0 - .25, sh.z0, sh.x0 + .1, EN.west.z0); ctx.addCollider(sh.x0 - .25, EN.west.z1, sh.x0 + .1, sh.z1 + .1);
    ctx.addCollider(sh.x0, sh.z0 - .15, EN.back.x0, sh.z0 + .1); ctx.addCollider(EN.back.x1, sh.z0 - .15, sh.x1, sh.z0 + .1);
    ctx.addCollider(sh.x0, sh.z1 - .1, sh.x1, sh.z1 + .15); }
  ctx.addCollider(-7.6, 3.6, 6.7, 6.05);          // projecting south volume
  ctx.addCollider(-11.5, 6.5, -7.8, 10.2);        // minaret
  ctx.addCollider(-11.7, 8.5, -3.4, 13.6);        // wc kiosk
  if (q.has('time')) { let n = 0; scene.traverse(o => { if (!o.isMesh || o.userData.zone) return; const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3; n += t * (o.isInstancedMesh ? o.count : 1); }); console.log('TIME added_tris ' + Math.round(n)); }
  tick('end'); let fc = 0; ctx.onFrame(() => { if (fc++ < 4) tick('frame' + fc); });
  ctx.addCollider(0.3, -19.5, 13.7, -10.9);       // tower block footprint
}
