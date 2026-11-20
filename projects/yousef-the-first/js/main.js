import * as THREE from 'three';
import { U, clipPlane, revealize, setRooms } from './materials.js';
import { textureSet, paintingTexture, leafTexture, waterNormal, setTextureScale } from './textures.js';
import { buildHouse, ROOMS } from './house.js';
import { buildAnnotations } from './plan.js';

const RECORD = new URLSearchParams(location.search).has('record');
const P_MAX = 2.8;          // timeline: 0–1 sheet to living room · 1–2 dining to master suite · 2–2.8 bath, spa, back to the sheet
const MOBILE = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (MOBILE) setTextureScale(0.5);
const canvas = document.getElementById('scene');

// ---------------- renderer ----------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(RECORD ? 1 : Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(new THREE.Color().setRGB(0.957, 0.945, 0.918, THREE.LinearSRGBColorSpace), 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(1.2, 1, 100, 3000);
camera.rotation.order = 'YXZ';

// ---------------- sky (fades in from paper) ----------------
const SUN = U.uSunDir.value;
const skyUniforms = { uSky: { value: 0 }, uSun: { value: SUN }, uPaper: U.uPaper };
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
  uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform float uSky; uniform vec3 uSun; uniform vec3 uPaper; varying vec3 vDir;
    void main(){
      vec3 d = normalize(vDir); float e = clamp(d.y, -0.1, 1.0);
      vec3 hor = vec3(0.96, 0.82, 0.66), mid = vec3(0.80, 0.80, 0.80), zen = vec3(0.52, 0.64, 0.79);
      vec3 col = mix(hor, mid, smoothstep(0.0, 0.18, e)); col = mix(col, zen, smoothstep(0.15, 0.7, e));
      float s = max(dot(d, normalize(uSun)), 0.0);
      col += vec3(1.0, 0.72, 0.42) * (pow(s, 12.0) * 0.35 + pow(s, 900.0) * 3.0);
      col = mix(col, vec3(0.86, 0.80, 0.72), smoothstep(0.0, -0.08, d.y));
      gl_FragColor = vec4(mix(uPaper, col, uSky), 1.0);
    }`,
}));
sky.frustumCulled = false; sky.renderOrder = -1;
scene.add(sky);

// environment light: a small warm sky, prefiltered
function makeEnv() {
  const s = new THREE.Scene();
  const m = sky.material.clone(); m.uniforms = { uSky: { value: 1 }, uSun: { value: SUN }, uPaper: U.uPaper };
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), m));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0x8f7f69 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; s.add(ground);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02); pm.dispose();
  return rt.texture;
}
scene.environment = makeEnv();
scene.environmentIntensity = 0.55;

// ---------------- lights ----------------
const sun = new THREE.DirectionalLight(0xffc995, 3.4);
sun.position.copy(SUN).multiplyScalar(90).add(new THREE.Vector3(22, 0, 10));
sun.target.position.set(22, 0, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 2048 : 4096, MOBILE ? 2048 : 4096);
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 30, bottom: -30, near: 20, far: 180 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(0xbfcde0, 0x9c8668, 0.45));
for (const z of [11.2, 13.6]) {
  const sp = new THREE.SpotLight(0xffd6a8, 26, 9, 0.55, 0.9, 2);
  sp.position.set(10.9, 4.1, z); sp.target.position.set(9.14, 1.9, z); scene.add(sp, sp.target);
}
for (const z of [9.5, 15.5]) { const pl = new THREE.PointLight(0xffdcb4, 2.2, 7, 2); pl.position.set(10.75, 3.9, z); scene.add(pl); }
const fire = new THREE.PointLight(0xff8a3d, 5, 6, 2); fire.position.set(8.8, 0.8, 4.5); scene.add(fire);
const pend = new THREE.PointLight(0xffd8a8, 3, 6, 2); pend.position.set(12.3, 2.7, 4.45); scene.add(pend);
const warm = (x, y, z, i, d) => { const l = new THREE.PointLight(0xffd2a0, i, d, 2); l.position.set(x, y, z); scene.add(l); };
warm(19, 1.95, 11.2, 5, 7);                          // dining pendant
for (const x of [17.9, 20.1]) warm(x, 1.55, 16.3, 2.2, 4.5);   // island pendants
warm(19, 0.5, 18.0, 1.2, 3);                         // toe-kick
for (const x of [31.15, 34.85]) warm(x, 1.0, 1.6, 1.6, 4);    // bedside lamps
warm(25.2, 3.4, 13.5, 2.5, 7);                       // terrace soffit
warm(39.1, 3.2, 2.85, 2.2, 6);                       // bath, under the skylight
warm(40.65, 1.15, 1.5, 1.4, 3);                      // behind the mirror
const spaGlow = new THREE.PointLight(0x8fd8d2, 1.6, 4.5, 2); spaGlow.position.set(43.45, 0.3, 3.15); scene.add(spaGlow);

// ---------------- loading progress (read by ui.js) ----------------
const tick = () => new Promise(r => setTimeout(r, 0));
function loading(f, what) { dispatchEvent(new CustomEvent('house:loading', { detail: { f, what } })); }

// ---------------- materials ----------------
async function makeMaterials() {
  const list = [['travertine', 1.6], ['plaster', 3], ['oak', 2.4], ['walnut', 1.2], ['linen', 0.6], ['wool', 1.2],
    ['limestone', 2.4], ['gravel', 1.5], ['lawn', 3], ['basalt', 1.2]];
  const sets = [];
  for (const [i, [name, tile]] of list.entries()) {
    await tick();
    sets.push(await textureSet(name, tile, renderer));
    loading(0.08 + 0.62 * (i + 1) / list.length, name);
  }
  const [trav, plas, oak, wal, lin, wool, lime, grav, lawn, bas] = sets;
  await tick();
  const maps = set => { const o = {}; for (const k of ['map', 'roughnessMap', 'bumpMap', 'normalMap']) if (set && set[k]) o[k] = set[k]; return o; };
  const std = (set, o = {}, opt) => revealize(new THREE.MeshStandardMaterial({ ...maps(set), roughness: 1, ...o }), opt);
  const fireTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, '#ffb15a'); gr.addColorStop(0.35, '#e0561c'); gr.addColorStop(1, '#1a0d08');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,${150 + Math.random() * 80},60,${0.25 * Math.random()})`; const x = Math.random() * 256; g.beginPath(); g.ellipse(x, 52, 4 + Math.random() * 8, 10 + Math.random() * 22, 0, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const M = {
    plaster: std(plas, { bumpScale: 0.8 }),
    travertine: std(trav, { bumpScale: 1.4 }),
    oak: std(oak, { bumpScale: 1.0 }),
    walnut: std(wal, { bumpScale: 0.8 }),
    linen: std(lin, { bumpScale: 1.2 }),
    wool: std(wool, { bumpScale: 2.0 }),
    limestone: std(lime, { bumpScale: 1.2 }),
    gravel: std(grav, { bumpScale: 2.5 }),
    lawn: std(lawn, { bumpScale: 2.0 }),
    basalt: std(bas, { bumpScale: 0.8 }),
    leather: std(lin, { color: 0x7a4a2c, roughness: 0.55, bumpScale: 0.3 }),
    bronze: std(null, { color: 0x7a5d3c, metalness: 1, roughness: 0.32 }),
    steel: std(null, { color: 0x2c2a27, metalness: 0.5, roughness: 0.55 }),
    leaf: std(null, { color: 0xffffff, map: leafTexture(), alphaTest: 0.45, vertexColors: true, roughness: 0.75 }, { clip: false, poche: 'none', ao: false }),
    bark: std(wal, { color: 0x9a8a7a, bumpScale: 1.5 }, { clip: false, poche: false }),
    roof: std(plas, { bumpScale: 0.8 }, { poche: false }),
    roofSteel: std(null, { color: 0x2c2a27, metalness: 0.5, roughness: 0.55 }, { poche: false }),
    spaWater: std(null, { color: 0x1b4250, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.6, emissive: 0x2a6a78, emissiveIntensity: 0.42, normalMap: waterNormal(), normalScale: new THREE.Vector2(0.3, 0.3) }, { ao: false }),
    mirror: std(null, { color: 0xffffff, metalness: 1, roughness: 0.04, envMapIntensity: 1.1 }, { ao: false }),
    water: std(null, { color: 0x173230, roughness: 0.06, metalness: 0.15, envMapIntensity: 1.8, normalMap: waterNormal(), normalScale: new THREE.Vector2(0.35, 0.35) }, { ao: false }),
    glow: std(null, { color: 0x000000, emissive: 0xffe0b8, emissiveIntensity: 3 }, { ao: false }),
    fire: std(null, { color: 0x000000, emissive: 0xffffff, emissiveMap: fireTex, emissiveIntensity: 2.5 }),
    art: std(null, { map: paintingTexture(), roughness: 0.92 }),
    glass: revealize(new THREE.MeshStandardMaterial({ color: 0xdbe6e8, transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.1, envMapIntensity: 1.4, depthWrite: false }), { glass: true, ao: false }),
  };
  M.doorForce = { value: 0 };
  M.oakDoor = std(oak, { bumpScale: 1.0 }, { force: M.doorForce });
  return { M };
}

// ---------------- camera path ----------------
// Each key: progress, target xyz, yaw (deg, 0 = facing north/up the sheet), pitch (deg), distance, fov.
const PLAN_W = 64, PLAN_H = 34, PLAN_C = [20.5, 0, 9.8];
const frameDist = (width, fov, aspect) => Math.max(width / aspect, width * 0.55) / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
const D2R = THREE.MathUtils.degToRad;
// interior keys are easier to write as "stand here, look there"
const eye = (p, x, y, z, yaw, pitch, fov, d = 0.6) => {
  const f = [Math.sin(D2R(yaw)) * Math.cos(D2R(pitch)), Math.sin(D2R(pitch)), -Math.cos(D2R(yaw)) * Math.cos(D2R(pitch))];
  return [p, x + f[0] * d, y + f[1] * d, z + f[2] * d, yaw, pitch, d, fov, 0];
};
function cameraKeys(aspect) {
  const portrait = aspect < 1;                 // on a phone the sheet turns 90 degrees to fill the screen
  const w = portrait ? PLAN_H : PLAN_W, h = portrait ? PLAN_W : PLAN_H;
  const planD = Math.max(h, w / aspect) / 2 / Math.tan(D2R(0.6)) * 1.04;
  const roll = portrait ? 90 : 0;
  // opening sheet: on wide screens the plan sits right of a headline column
  const wide = aspect > 1.25;
  const viewW = wide ? PLAN_W / 0.53 : w, shiftX = wide ? -0.145 * viewW : 0;
  const heroD = Math.max(h * 1.12, viewW / aspect) / 2 / Math.tan(D2R(0.6)) * 1.02;
  const HERO_C = [PLAN_C[0] + shiftX, 0, PLAN_C[2] + (wide ? 1.2 : 0)];
  let sheetD = wide ? heroD : planD;
  if (portrait) {
    // on a tall screen the headline takes the top of the sheet: draw the plan smaller and lower
    sheetD = planD * 1.4;
    const up = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(D2R(-90), 0, D2R(roll), 'YXZ'));
    const visH = 2 * sheetD * Math.tan(D2R(0.6));
    HERO_C[0] += up.x * visH * 0.155; HERO_C[2] += up.z * visH * 0.155;
  }
  return [
    [0.00, ...HERO_C, 0, -90, sheetD, 1.2, roll],
    [0.08, ...HERO_C, 0, -90, sheetD, 1.2, roll],
    [0.20, 19, 0, 12, 0, -80, frameDist(52, 9, aspect), 9, 0],
    [0.30, 14, 0, 14, 6, -56, frameDist(36, 30, aspect), 30, 0],
    [0.40, 10.75, 1.0, 17.8, 2, -24, 13, 42, 0],
    eye(0.47, 10.75, 1.6, 24.2, 0, -3, 50),
    eye(0.53, 10.85, 1.6, 20.0, 0, -1, 52),
    eye(0.585, 10.98, 1.6, 15.6, 0, 0, 54),
    eye(0.66, 11.0, 1.6, 11.6, -4, 0, 54),
    eye(0.745, 10.9, 1.6, 8.3, -22, 2, 56),
    eye(0.86, 13.0, 1.6, 6.6, -75, 7, 60),
    eye(1.00, 12.6, 1.6, 7.4, 40, 1, 56),
    // ---- checkpoint 2: through the cased opening into dining, kitchen, out to the pool, into the master suite
    eye(1.07, 15.3, 1.6, 6.5, 140, 0, 58),
    eye(1.14, 16.0, 1.6, 8.7, 150, -2, 60),
    eye(1.24, 16.4, 1.6, 9.95, 105, -3, 58),
    eye(1.34, 17.0, 1.6, 13.7, 122, -4, 58),
    eye(1.44, 22.3, 1.6, 12.8, 92, -1, 56),
    eye(1.54, 25.6, 1.6, 11.3, 100, -2, 58),
    eye(1.64, 30.6, 1.6, 10.4, 100, -3, 56),
    eye(1.72, 34.4, 1.6, 9.7, 20, 0, 56),
    eye(1.80, 33.7, 1.6, 7.5, -8, 0, 58),
    eye(1.90, 34.6, 1.6, 5.5, -42, -4, 58),
    eye(2.00, 35.8, 1.6, 3.1, -150, -1, 56),
    // ---- checkpoint 3: bath, spa terrace, then up and back to the sheet, now built
    eye(2.06, 36.3, 1.6, 5.85, -262, 0, 58),
    eye(2.13, 37.9, 1.6, 5.4, -312, 9, 60),
    eye(2.20, 39.7, 1.6, 4.95, -282, -2, 58),
    eye(2.27, 41.1, 1.6, 5.25, -272, -4, 58),
    eye(2.31, 41.95, 1.6, 5.6, -300, -15, 60),
    eye(2.365, 42.3, 1.65, 6.15, -322, -18, 60),
    eye(2.42, 42.5, 7.4, 6.4, -336, -66, 52),
    [2.50, 30, 0, 10, -345, -52, 40, 38, 0],
    [2.59, ...PLAN_C, -360, -80, frameDist(56, 9, aspect), 9, 0],
    [2.69, ...PLAN_C, -360, -90, planD, 1.2, roll],
    [2.80, ...PLAN_C, -360, -90, planD, 1.2, roll],
  ];
}
// monotone cubic interpolation (no overshoot through holds)
function track(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
let CAM;
function buildCameraTracks() {
  const keys = cameraKeys(camera.aspect), xs = keys.map(k => k[0]);
  const ch = i => track(xs, keys.map(k => i === 6 ? Math.log(k[i]) : k[i]));
  CAM = { tx: ch(1), ty: ch(2), tz: ch(3), yaw: ch(4), pitch: ch(5), ld: ch(6), fov: ch(7), roll: ch(8) };
}
const tmp = new THREE.Vector3();
function placeCamera(p) {
  const yaw = THREE.MathUtils.degToRad(CAM.yaw(p)), pitch = THREE.MathUtils.degToRad(Math.max(-89.999, CAM.pitch(p)));
  const dist = Math.exp(CAM.ld(p));
  tmp.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  camera.position.set(CAM.tx(p) - tmp.x * dist, CAM.ty(p) - tmp.y * dist, CAM.tz(p) - tmp.z * dist);
  camera.rotation.set(pitch, -yaw, D2R(CAM.roll(p)));
  let fov = CAM.fov(p);
  if (camera.aspect < 1 && fov > 20) {
    const hor = 2 * Math.atan(Math.tan(D2R(fov / 2)) * 16 / 9);           // what a 16:9 screen would see across
    const want = 2 * Math.atan(Math.tan(hor * 0.31) / camera.aspect) * 180 / Math.PI;
    fov += (Math.min(82, Math.max(fov, want)) - fov) * ss(20, 40, fov);
  }
  camera.fov = fov;
  camera.near = Math.max(0.05, dist - 70);
  camera.far = Math.max(dist + 400, 1200);
  camera.updateProjectionMatrix();
  sky.position.copy(camera.position);
}

// ---------------- timeline ----------------
const clamp01 = x => Math.min(1, Math.max(0, x));
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const SWEEPS = [
  // origin x,z | box minx,minz,maxx,maxz | start,end progress | final radius, feather
  { o: [10.75, 19.6], b: [-200, 16.84, 23.0, 200], t: [0.355, 0.47], R: 60, f: 3.0 },     // arrival: facade, water, site
  { o: [10.75, 17.0], b: [8.85, 7.9, 12.65, 16.84], t: [0.50, 0.63], R: 12, f: 2.2 },    // entry gallery
  { o: [10.75, 17.0], b: [12.5, 7.9, 15.2, 14.1], t: [0.52, 0.65], R: 12, f: 2.2 },      // light court seen through the glass
  { o: [10.75, 8.0], b: [7.6, 0.6, 17.2, 7.95], t: [0.67, 0.80], R: 15, f: 2.5 },        // living room
  { o: [10.75, 8.0], b: [16.95, 0.6, 23.2, 7.95], t: [0.70, 0.83], R: 16, f: 2.5 },      // inner garden beyond the glass
  { o: [10.75, 8.0], b: [-200, -200, 200, 0.83], t: [0.72, 0.85], R: 40, f: 3.0 },       // north garden beyond the living glass
  { o: [10.75, 8.0], b: [-200, 0.6, 7.66, 8.6], t: [0.70, 0.83], R: 30, f: 3.0 },         // west garden beyond the new windows
  { o: [16.0, 8.0], b: [14.85, 7.95, 23.05, 19.3], t: [1.04, 1.21], R: 14, f: 2.5 },       // dining and kitchen
  { o: [16.0, 8.0], b: [12.45, 13.9, 15.05, 19.1], t: [1.10, 1.24], R: 14, f: 2.5 },       // pantry, seen through its door
  { o: [23.0, 12.8], b: [23.0, 7.36, 200, 200], t: [1.36, 1.57], R: 34, f: 3.5 },          // terrace, pool, east garden
  { o: [33.7, 7.0], b: [25.3, 0.6, 37.1, 7.36], t: [1.70, 1.86], R: 14, f: 2.5 },          // master bedroom and dressing
  { o: [37.0, 5.9], b: [37.1, 0.6, 41.6, 7.36], t: [2.035, 2.13], R: 9.5, f: 2.6 },           // bath, from its door
  { o: [41.5, 5.3], b: [41.6, 0.6, 48.5, 7.36], t: [2.19, 2.29], R: 11, f: 2.6 },           // spa terrace, from the slider
  { o: [24.0, 10.0], b: [-300, -300, 300, 300], t: [2.40, 2.62], R: 95, f: 8.0 },          // whatever is left, on the way up
];
const captions = [...document.querySelectorAll('[data-from]')];
const EXPOSURE = track([0, 0.53, 0.64, 0.82, 1.0, 1.14, 1.4, 1.5, 1.68, 1.82, 2.0, 2.13, 2.3, 2.42, 2.6, 2.8], [1.0, 1.0, 1.35, 1.17, 1.17, 1.32, 1.3, 1.05, 1.0, 1.18, 1.15, 1.32, 1.25, 1.1, 1.0, 1.0]);
let doorForce, door, trees, annotations, overlay, lastClip = -1, lastDoor = -1, lastGrow = -1;

function applyProgress(p) {
  placeCamera(p);
  // walls rise: the cut plane lifts from 1.20 m to the eaves, then releases as we come down
  let clip = 1.2 + 2.45 * ss(0.09, 0.25, p);
  if (p > 0.40) clip = 3.65 + 4.35 * ss(0.40, 0.45, p);
  if (p > 2.5) clip = 8.0 - 6.8 * ss(2.52, 2.65, p);
  const released = clip > 7.95;
  clipPlane.constant = released ? 1e4 : clip;
  U.uPoche.value = released ? 0 : 1;
  U.uDrawShade.value = ss(0.09, 0.22, p);
  U.uLineA.value = 0.85;
  U.uLineForce.value = 0.55 * ss(2.58, 2.68, p);
  overlay.material.opacity = ss(2.63, 2.71, p);
  overlay.visible = overlay.material.opacity > 0.001;
  annotations.material.opacity = 1 - ss(0.085, 0.17, p);
  annotations.visible = annotations.material.opacity > 0.001;
  skyUniforms.uSky.value = ss(0.17, 0.34, p);
  doorForce.value = ss(0.44, 0.47, p);
  SWEEPS.forEach((s, i) => {
    const k = ss(s.t[0], s.t[1], p);
    U.uSweepO.value[i].set(s.o[0], s.o[1], k > 0 ? k * s.R : -1, s.f);
    U.uSweepB.value[i].set(...s.b);
  });
  const grow = ss(0.11, 0.30, p);
  for (const t of trees) t.scale.setScalar(Math.max(1e-3, grow));
  if (grow !== lastGrow) { renderer.shadowMap.needsUpdate = true; lastGrow = grow; }
  const ang = 1.48 * ss(0.465, 0.54, p);
  door.rotation.y = ang;
  renderer.toneMappingExposure = EXPOSURE(p);
  if (Math.abs(clip - lastClip) > 1e-4 || Math.abs(ang - lastDoor) > 1e-4) { renderer.shadowMap.needsUpdate = true; lastClip = clip; lastDoor = ang; }
  for (const el of captions) {
    const a = +el.dataset.from, b = +el.dataset.to;
    const o = ss(a, a + 0.03, p) * (1 - ss(b - 0.03, b, p));
    el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.002 ? 'visible' : 'hidden';
  }
  document.documentElement.style.setProperty('--p', (p / P_MAX).toFixed(4));
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; buildCameraTracks();
}

// ---------------- boot ----------------
let current = 0, target = 0;
async function boot() {
  loading(0.03, 'fonts');
  await document.fonts.load('400 40px Plex');
  const { M } = await makeMaterials(); doorForce = M.doorForce;
  const ground = new THREE.Mesh(new THREE.BoxGeometry(260, 0.3, 220), M.lawn);
  ground.position.set(23, -0.19, 10);
  { const g = ground.geometry; g.translate(23, -0.19, 10); ground.position.set(0, 0, 0);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), Math.abs(n.getY(i)) > 0.5 ? p.getZ(i) : p.getY(i)); }
  ground.receiveShadow = true; scene.add(ground);
  loading(0.74, 'walls'); await tick();
  setRooms(ROOMS);
  const H = buildHouse(M); scene.add(H.root); door = H.door; trees = H.trees;
  annotations = buildAnnotations(); scene.add(annotations);
  overlay = buildAnnotations({ overlay: true }); scene.add(overlay);
  window.__house = Object.assign(window.__house || {}, {
    P_MAX, camera, get p() { return current; },
    set(p) { current = target = p; applyProgress(p); render(); },
  });
  loading(0.86, 'lines'); await tick();
  resize(); addEventListener('resize', () => { resize(); applyProgress(current); render(); });
  applyProgress(0);
  renderer.compile(scene, camera);
  loading(0.97, 'light'); await tick();
  render();
  loading(1, 'done');
  document.body.classList.add('ready');

  if (RECORD) return;

  const lenis = new Lenis(REDUCED ? { smoothWheel: false } : { lerp: 0.085, wheelMultiplier: 0.9 });
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const st = ScrollTrigger.create({ trigger: '#scroll', start: 'top top', end: 'bottom bottom', onUpdate: s => { target = s.progress * P_MAX; } });
  // walk to a point on the timeline: scroll there, at a pace that still reads as walking
  window.__house.lenis = lenis;
  window.__house.walkTo = (p, { instant = false } = {}) => {
    const y = st.start + (st.end - st.start) * Math.min(1, Math.max(0, p / P_MAX));
    const dist = Math.abs(p - current);
    lenis.scrollTo(y, instant ? { immediate: true, force: true } : { duration: Math.min(7, 1.6 + dist * 2.6), easing: t => 1 - Math.pow(1 - t, 3), force: true });
  };
  window.__house.trackEnd = () => st.end;
  gsap.ticker.add(() => {
    if (Math.abs(target - current) < 1e-5) return;
    current += (target - current) * (REDUCED ? 1 : 0.18);
    applyProgress(current); render();
  });
  document.querySelectorAll('[data-again]').forEach(el => el.addEventListener('click', () => {
    document.body.classList.add('rewind');                   // fade to paper, jump to the start, fade back
    setTimeout(() => { lenis.scrollTo(0, { immediate: true, force: true }); window.__house.set(0); document.body.classList.remove('rewind'); }, 700);
  }));
}
function render() { renderer.render(scene, camera); dispatchEvent(new CustomEvent('house:frame', { detail: { p: current } })); }
boot().catch(e => { console.error(e); document.body.dataset.error = String(e); });
