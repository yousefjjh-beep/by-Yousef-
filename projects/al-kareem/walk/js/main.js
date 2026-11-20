import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { SPEC } from './spec.js';
import * as lib from './lib.js';

const q = new URLSearchParams(location.search);
const isShot = q.has('shot'); if (isShot) document.body.classList.add('shot');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: isShot, powerPreference: 'high-performance' });
renderer.setPixelRatio(isShot ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd9c7b4);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.08, 900);
window.__cam = camera;   // read by the page's moving project facts

// ---- base lighting (modules may tune intensities through ctx.lights) ----
const sunDir = new THREE.Vector3(...SPEC.sunDir).normalize();
const sun = new THREE.DirectionalLight(0xffd2a0, 4.2);
sun.position.copy(sunDir).multiplyScalar(90); sun.target.position.set(0, 0, -3);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 5, far: 220 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xcfdcf0, 0x8a7a66, 1.15); scene.add(hemi);

const zones = { hall: [], tower: [], bar: [], site: [], minaret: [], wc: [] };
const colliders = []; const frameFns = []; const views = {};
const ctx = { THREE, scene, camera, renderer, SPEC, lib, sun, hemi, zones, isShot, glb: null,
  // axis-aligned blocker in plan (metres). yMax optional.
  addCollider: (x0, z0, x1, z1) => colliders.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]),
  onFrame: (fn) => frameFns.push(fn),
  // true when a point is inside the prayer-hall box
  inHall: (p) => p.x > SPEC.shell.x0 && p.x < SPEC.shell.x1 && p.z > SPEC.shell.z0 && p.z < SPEC.hall.z1 + 1.6 && p.y < SPEC.floorY + SPEC.dome.top + .5,
};

// ---- default views (each module can add/override through `export const views`) ----
Object.assign(views, {
  exterior: { pos: [34, 2.4, 14], look: [8, 5.2, -6], fov: 50 },
  tower: { pos: [24, 3.0, -14.3], look: [12.8, 5.6, -14.3], fov: 40 },
  side_entrance: { pos: [22.5, 2.3, -9.5], look: [14, 2.6, -6.7], fov: 45 },
  hall_entrance: { pos: [-1.45, 2.55, 1.6], look: [-1.45, 3.6, -10.55], fov: 50 },
  hall_mihrab_a: { pos: [8.5, 2.6, -8.5], look: [-2.5, 3.2, 3.14], fov: 62 },
  hall_mihrab_b: { pos: [6.5, 2.3, -8.5], look: [4.5, 2.9, 3.14], fov: 62 },
  hall_windows: { pos: [11.2, 2.4, -9.4], look: [9.6, 3.0, 3.14], fov: 55 },
});

async function loadGLB() {
  // the model ships as plain text data (assets/model.js): vertices in millimetres + triangle indices per mesh
  const data = (await import('../assets/model.js')).default; const root = new THREE.Group(); root.name = 'mosque';
  for (const d of data.meshes) {
    const n3 = d.i.length, pos = new Float32Array(n3 * 3), uv = new Float32Array(n3 * 2);
    for (let k = 0; k < n3; k++) { const v = d.i[k] * 3; pos[k * 3] = d.p[v] / 1000; pos[k * 3 + 1] = d.p[v + 1] / 1000; pos[k * 3 + 2] = d.p[v + 2] / 1000; }
    let geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo = toCreasedNormals(geo, 0.6); const nor = geo.attributes.normal.array, P = geo.attributes.position.array;
    // box-projected UVs in metres
    for (let k = 0; k < n3; k++) { const ax = Math.abs(nor[k * 3]), ay = Math.abs(nor[k * 3 + 1]), az = Math.abs(nor[k * 3 + 2]);
      if (ax >= ay && ax >= az) { uv[k * 2] = P[k * 3 + 2]; uv[k * 2 + 1] = P[k * 3 + 1]; } else if (ay >= az) { uv[k * 2] = P[k * 3]; uv[k * 2 + 1] = P[k * 3 + 2]; } else { uv[k * 2] = P[k * 3]; uv[k * 2 + 1] = P[k * 3 + 1]; } }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: .9, side: THREE.DoubleSide }); m.name = d.m; m.userData = { hadTexture: !!d.t, alpha: d.a, baseColor: d.c };
    const o = new THREE.Mesh(geo, m); o.name = THREE.PropertyBinding.sanitizeNodeName(d.n); const z = d.n.split('--')[0]; (zones[z] || (zones[z] = [])).push(o);
    o.userData.zone = z; o.userData.matName = d.m; o.castShadow = true; o.receiveShadow = true;
    if (/Glass/i.test(d.m)) { m.color.set(0x6f8ea3); m.transparent = true; m.opacity = .35; m.roughness = .1; o.castShadow = false; }
    root.add(o);
  }
  scene.add(root); ctx.glb = root; console.log('zones', Object.entries(zones).map(([k, v]) => k + ':' + v.length).join(' '));
}

const MODULES = ['exterior', 'tower', 'hall_core', 'hall_mihrab', 'hall_windows'];
async function loadModules() {
  const only = q.get('only') ? q.get('only').split(',') : null;
  for (const name of MODULES) {
    if (only && !only.includes(name)) continue;
    try { const m = await import(`./${name}.js`); if (m.views) Object.assign(views, m.views); if (m.build) await m.build(ctx); }
    catch (e) { console.error(`MODULE ${name} FAILED:`, e && e.stack || e); }
  }
}

// ---- walking ----
const eye = 1.65; let yaw = 0, pitch = 0; const keys = {}; const pos = new THREE.Vector3(30, 0, 10);
function groundY(p) { const E = SPEC.entrances, near = (a, b, m) => a > b - m && a < b + m;
  const porch = (p.x > 14 && p.x < 16.4 && p.z > E.east.z0 - .8 && p.z < E.east.z1 + .8) || (p.x < -14.05 && p.x > -16.4 && p.z > E.west.z0 - .8 && p.z < E.west.z1 + .8) || (p.z < -10.9 && p.z > -12.6 && p.x > E.back.x0 - .6 && p.x < E.back.x1 + .6);
  if (porch || (p.x > SPEC.shell.x0 && p.x < SPEC.shell.x1 && p.z > SPEC.shell.z0 && p.z < SPEC.shell.z1)) return SPEC.floorY;
  return Math.abs(p.x) < 19 && p.z > -13.5 && p.z < 9.5 ? Math.min(SPEC.floorY, 0.45 + 0.6 * THREE.MathUtils.clamp(1 - (Math.max(Math.abs(p.x) - 14.2, p.z - 4.2, -10.9 - p.z, 0)) / 2.2, 0, 1)) : 0.3; }
// the two-storey building behind the mosque is exterior only: one solid rotated footprint, nobody walks into it
const BAR = { ax: -22.9, az: -16.3, ux: 0.9283, uz: -0.3719, len: 33.9, wid: 7.2 };
function inBar(x, z) { const dx = x - BAR.ax, dz = z - BAR.az, u = dx * BAR.ux + dz * BAR.uz, v = -dx * BAR.uz + dz * BAR.ux; return u > -0.5 && u < BAR.len && v > -0.5 && v < BAR.wid; }
function blocked(x, z) { const r = 0.28; if (inBar(x, z)) return true; for (const c of colliders) if (x > c[0] - r && x < c[2] + r && z > c[1] - r && z < c[3] + r) return true; return false; }
function setView(v) { pos.set(v.pos[0], 0, v.pos[2]); camera.position.set(...v.pos); camera.fov = v.fov || 60; camera.updateProjectionMatrix(); camera.lookAt(...v.look);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); yaw = e.y; pitch = e.x; camY = v.pos[1]; freeY = true; }
let camY = eye, freeY = false;
addEventListener('keydown', (e) => { keys[e.code] = true; }); addEventListener('keyup', (e) => { keys[e.code] = false; });
let drag = null; const el = renderer.domElement;
el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => { if (!drag || drag.id !== e.pointerId) return; yaw -= (e.clientX - drag.x) * 0.0032; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - drag.y) * 0.0032, -1.2, 1.2); drag.x = e.clientX; drag.y = e.clientY; });
el.addEventListener('pointerup', () => { drag = null; });
const stick = document.getElementById('stick'), knob = stick.firstElementChild; let sv = [0, 0];
stick.addEventListener('pointerdown', (e) => stick.setPointerCapture(e.pointerId));
stick.addEventListener('pointermove', (e) => { if (!e.buttons && e.pointerType === 'mouse') return; const r = stick.getBoundingClientRect(); let x = (e.clientX - r.left - 55) / 45, y = (e.clientY - r.top - 55) / 45; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } sv = [x, y]; knob.style.transform = `translate(${x * 35}px,${y * 35}px)`; });
const rel = () => { sv = [0, 0]; knob.style.transform = ''; }; stick.addEventListener('pointerup', rel); stick.addEventListener('pointercancel', rel);

function step(dt) {
  let f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - sv[1];
  let s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + sv[0];
  if (keys.ArrowLeft) yaw += dt * 1.6; if (keys.ArrowRight) yaw -= dt * 1.6;
  if (f || s) { freeY = false; const sp = (keys.ShiftLeft || keys.ShiftRight ? 7 : 3.2) * dt; const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * s) * sp, dz = (-Math.cos(yaw) * f - Math.sin(yaw) * s) * sp;
    if (!blocked(pos.x + dx, pos.z)) pos.x += dx; if (!blocked(pos.x, pos.z + dz)) pos.z += dz; }
  if (!freeY) camY += (groundY(pos) + eye - camY) * Math.min(1, dt * 8);
  camera.position.set(pos.x, camY, pos.z); camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
}

addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

(async () => {
  await loadGLB(); await loadModules();
  const hud = document.getElementById('hud');
  // only two jump buttons: outside and inside (the other named views stay available to ?view= for screenshots)
  views.interior = views.interior || { pos: [0, SPEC.floorY + 1.65, -4.4], look: [0, 4.7, 3.14], fov: 80 };   // just in front of the mezzanine
  for (const [k, label] of [['exterior', 'الخارج'], ['interior', 'الداخل']]) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => setView(views[k]); hud.appendChild(b); }
  setView(views[q.get('view')] || views.exterior);
  if (q.has('cam')) { const c = q.get('cam').split(',').map(Number), l = q.get('look').split(',').map(Number); setView({ pos: c, look: l, fov: +(q.get('fov') || 60) }); }
  const clock = new THREE.Clock(); let frames = 0; let expo = 1; let hemiOut = null;
  renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), .05); step(dt); for (const f of frameFns) f(dt, clock.elapsedTime);
    // simple eye adaptation: interiors are exposed brighter than the sunlit exterior
    const inside = ctx.inHall(camera.position);
    if (hemiOut === null) hemiOut = hemi.intensity;
    // the sky fill has no shadows, so indoors it is turned down (ctx.hemiIn) to let the room's own lights shape it
    hemi.intensity = inside ? (ctx.hemiIn ?? 0.45) : hemiOut;
    const target = inside ? (ctx.exposureIn ?? 1.25) : (ctx.exposureOut ?? 0.95); expo += (target - expo) * (isShot ? 1 : Math.min(1, dt * 2.5)); renderer.toneMappingExposure = expo;
    renderer.render(scene, camera); if (++frames === 3) { document.getElementById('load').style.opacity = 0; setTimeout(() => document.getElementById('load').remove(), 700); window.__ready = true; } });
})();
