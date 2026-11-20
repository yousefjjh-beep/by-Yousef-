import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeMaterials, chediMaterials } from './tex.js';
import { buildHouse, colliders, stair, ROOF } from './house.js';
import { furnish } from './props.js';
import { buildSite } from './site.js';
import { drawPlan } from './plan.js';
import { planTrees } from './trees.js';

const Q = new URLSearchParams(location.search), SHOT = Q.has('shot');
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const TOUCH = !SHOT && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
let dpr = Math.min(devicePixelRatio, SHOT ? 1 : TOUCH ? 1.25 : 1.5);
renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xd8b88e, 0.0016);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.06, 1500);

// ---- sun, sky, image-based light ----
const sunDir = new THREE.Vector3(-0.74, 0.56, 0.5).normalize(); // late afternoon, west-south-west
const sky = new Sky(); sky.scale.setScalar(4000); scene.add(sky);
Object.assign(sky.material.uniforms.turbidity, { value: 7 }); sky.material.uniforms.rayleigh.value = 2.4; sky.material.uniforms.mieCoefficient.value = 0.008; sky.material.uniforms.mieDirectionalG.value = 0.85;
sky.material.uniforms.sunPosition.value.copy(sunDir);
{ const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene(); const k = new Sky(); k.scale.setScalar(4000); k.material.uniforms = sky.material.uniforms; s.add(k); const gnd = new THREE.Mesh(new THREE.CircleGeometry(3000, 24), new THREE.MeshBasicMaterial({ color: 0xb9a88c })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -2; s.add(gnd); scene.environment = pm.fromScene(s, 0.02).texture; scene.environmentIntensity = 0.6; }
const sun = new THREE.DirectionalLight(0xffd29c, 5.4); sun.position.copy(sunDir).multiplyScalar(90).add(new THREE.Vector3(9, 0, 9)); sun.target.position.set(9, 0, 9);
sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 2048 : 4096, TOUCH ? 2048 : 4096); const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 30; sc.bottom = -30; sc.near = 10; sc.far = 190; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035; sun.shadow.radius = 2.2;
scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight(0xd0dcff, 0xe2d4bc, 0.2));

// ---- build ----
const status = document.getElementById('status');
const M = chediMaterials(makeMaterials());
buildHouse(scene, M); furnish(scene, M); const site = buildSite(scene, M);
scene.traverse(o => { if (o.isMesh) { o.matrixAutoUpdate = false; o.updateMatrix(); } });
scene.updateMatrixWorld(true);

// ---- post ----
const rt = new THREE.WebGLRenderTarget(innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight); gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.2, thickness: 1.2, scale: 1.7, samples: 12 }); gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 8, rings: 2, samples: 12 });
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.6, 1.0);
let useAO = Q.get('q') !== 'low' && !TOUCH; if (useAO) composer.addPass(gtao); if (!TOUCH) composer.addPass(bloom); composer.addPass(new OutputPass());
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });

// ---- player ----
const P = { x: -22, z: 10.5, y: 0, yaw: -Math.PI / 2, pitch: 0.04, level: 'ground' }, EYE = 1.66, RAD = 0.3, keys = {};
function hit(x, z, list) { for (const c of list) if (x > c[0] - RAD && x < c[2] + RAD && z > c[1] - RAD && z < c[3] + RAD) return true; return false; }
function onStair(x, z) { return x > stair.x1 && x < stair.x2 && z > stair.z1 && z < stair.z2; }
function move(dx, dz) {
  const list = (P.level === 'roof' || P.y > 2) ? colliders.roof : colliders.ground;
  const bound = (x, z) => P.level === 'roof' && !onStair(x, z) && (x < .5 || x > 17.5 || z < .5 || z > 17.5);
  const free = (x, z) => !hit(x, z, list) && !bound(x, z), x0 = P.x, z0 = P.z;
  if (!free(P.x, P.z)) { // already inside something (e.g. after a jump): push out to the nearest free spot
    for (let r = .15; r < 2.5; r += .15) { let done = false; for (let a = 0; a < 6.28; a += .52) { const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; if (free(x, z)) { P.x = x; P.z = z; done = true; break; } } if (done) break; }
  }
  if (free(P.x + dx, P.z)) P.x += dx;
  if (free(P.x, P.z + dz)) P.z += dz;
  if (P.x === x0 && P.z === z0 && (dx || dz)) { // blocked head-on: try to slip round the obstacle
    const L = Math.hypot(dx, dz); for (const t of [.6, -.6, 1.2, -1.2, 1.57, -1.57]) { const c = Math.cos(t), s = Math.sin(t), nx = (dx * c - dz * s), nz = (dx * s + dz * c); if (free(P.x + nx, P.z + nz)) { P.x += nx * .8; P.z += nz * .8; break; } }
  }
  if (onStair(P.x, P.z)) { P.y = (P.z - stair.z1) / (stair.z2 - stair.z1) * stair.h; P.level = P.y > 2 ? 'roof' : 'ground'; }
  else if (P.level === 'roof') { P.y = ROOF; if (P.z < stair.z1 + .1 && P.x < stair.x2) { P.level = 'ground'; } }
  else P.y = 0;
  P.x = Math.max(-150, Math.min(170, P.x)); P.z = Math.max(-130, Math.min(150, P.z));
  return Math.hypot(P.x - x0, P.z - z0);
}
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyT') startTour(); });
addEventListener('keyup', e => keys[e.code] = false);
const veil = document.getElementById('veil'), dot = document.getElementById('dot');
document.addEventListener('mousemove', e => { if (document.pointerLockElement === canvas) { P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - e.movementY * 0.0022)); } });
document.addEventListener('pointerlockchange', () => { const on = document.pointerLockElement === canvas; dot.style.display = on ? 'block' : 'none'; if (!on && !tour.on) veil.classList.remove('off'); });
const lock = () => { try { const r = canvas.requestPointerLock?.(); if (r && r.catch) r.catch(() => {}); } catch (e) {} };
document.getElementById('walk').onclick = () => { tour.on = false; veil.classList.add('off'); if (!TOUCH) lock(); };
document.getElementById('tour').onclick = () => startTour();
const planEl = document.getElementById('plan'), planCv = document.getElementById('planCv');
const showPlan = () => { planEl.style.display = 'block'; drawPlan(planCv, { colliders, rooms, stair, trees: planTrees.filter(t => t.x > -17 && t.x < 35 && t.z > -9 && t.z < 27) }); };
document.getElementById('planBtn').onclick = showPlan; document.getElementById('planBack').onclick = () => { planEl.style.display = 'none'; };
addEventListener('resize', () => { if (planEl.style.display === 'block') showPlan(); });
const hashPlan = () => { if (location.hash === '#plan') showPlan(); else planEl.style.display = 'none'; }; addEventListener('hashchange', hashPlan);
let drag = null, moved = 0;
canvas.addEventListener('mousedown', e => { drag = [e.clientX, e.clientY]; moved = 0; });
addEventListener('mouseup', () => { if (drag && moved < 4 && !tour.on && !TOUCH) lock(); drag = null; });
addEventListener('mousemove', e => { if (drag && document.pointerLockElement !== canvas) { const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.004; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - dy * 0.004)); drag = [e.clientX, e.clientY]; } });
// ---- touch: left thumb stick to walk, drag anywhere else to look, tap the floor to walk there ----
const joy = { id: null, x: 0, y: 0, cx: 0, cy: 0 }, look = { id: null, x: 0, y: 0, sx: 0, sy: 0, t: 0, moved: 0 }; let goTo = null;
const stickEl = document.getElementById('stick'), knob = document.getElementById('knob');
function setKnob() { knob.style.transform = `translate(${joy.x * 38}px, ${joy.y * 38}px)`; }
stickEl.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0], r = stickEl.getBoundingClientRect(); joy.id = t.identifier; joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; tour.on = false; goTo = null; stickMove(t); }, { passive: false });
function stickMove(t) { let x = (t.clientX - joy.cx) / 46, y = (t.clientY - joy.cy) / 46; const L = Math.hypot(x, y); if (L > 1) { x /= L; y /= L; } joy.x = x; joy.y = y; setKnob(); }
addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) stickMove(t); else if (t.identifier === look.id) { const dx = t.clientX - look.x, dy = t.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.0052; P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch - dy * 0.0042)); look.x = t.clientX; look.y = t.clientY; } } }, { passive: true });
const endTouch = e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; setKnob(); } else if (t.identifier === look.id) { look.id = null; if (look.moved < 12 && performance.now() - look.t < 500) tapWalk(t.clientX, t.clientY); } } };
addEventListener('touchend', endTouch); addEventListener('touchcancel', endTouch);
canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; if (look.id === null) { look.id = t.identifier; look.x = look.sx = t.clientX; look.y = look.sy = t.clientY; look.t = performance.now(); look.moved = 0; } if (tour.on) { tour.on = false; takeOver(); } }, { passive: true });
let lastTap = 0; canvas.addEventListener('click', e => { if (TOUCH && !tour.on && performance.now() - lastTap > 500) tapWalk(e.clientX, e.clientY); });
const ray = new THREE.Raycaster(), marker = new THREE.Mesh(new THREE.RingGeometry(.16, .24, 28), new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: .9, depthTest: false })); marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 9; scene.add(marker);
function tapWalk(cx, cy) { // walk to the tapped point on the floor
  lastTap = performance.now();
  ray.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), camera); const d = ray.ray.direction, o = ray.ray.origin, fy = P.level === 'roof' ? ROOF : 0;
  let t = d.y < -0.02 ? (fy - o.y) / d.y : 9; t = Math.min(t, 14); goTo = { x: o.x + d.x * t, z: o.z + d.z * t, stuck: 0 }; marker.position.set(goTo.x, fy + .03, goTo.z); marker.visible = true;
}
function takeOver() { const d = new THREE.Vector3(); camera.getWorldDirection(d); P.yaw = Math.atan2(-d.x, -d.z); P.pitch = Math.asin(d.y); const q = camera.position; P.level = q.y > 4 ? 'roof' : 'ground'; P.y = P.level === 'roof' ? ROOF : 0; P.x = q.x; P.z = q.z; move(0, 0); }
// ---- jump straight to a room ----
const PLACES = [['Gate', -20, 10.5, -1.57], ['Hall', 2.6, 10.5, -1.57], ['Living', 5.2, 3.5, -1.57], ['Court', 9.0, 6.6, 3.14], ['Dining', 13.7, 9.0, -1.57], ['Kitchen', 15.4, 4.4, 0], ['Bedroom', 8.0, 14.0, 2.1], ['Bath', 11.6, 15.3, -1.57], ['Roof', 9.2, 14.4, -1.57, 1], ['Pool', 20.0, 9.0, -1.57]];
const placesEl = document.getElementById('places');
for (const [name, x, z, yaw, roof] of PLACES) { const b = document.createElement('button'); b.textContent = name; b.onclick = (e) => { e.stopPropagation(); tour.on = false; goTo = null; marker.visible = false; P.x = x; P.z = z; P.yaw = yaw; P.pitch = 0; P.level = roof ? 'roof' : 'ground'; P.y = roof ? ROOF : 0; move(0, 0); veil.classList.add('off'); }; placesEl.appendChild(b); }
document.getElementById('menuBtn').onclick = () => { try { document.exitPointerLock?.(); } catch (e) {} tour.on = false; veil.classList.remove('off'); };
if (TOUCH) document.body.classList.add('touch');
// ---- tour: eye-height walk through every room ----
const stops = [ // x, y(eye), z, look-at x,y,z
  [-34, 3.2, 14, 9, 3, 9], [-22, 1.7, 10.5, 0, 2.2, 10.5], [-8, 1.7, 10.5, 0, 1.9, 10.5], [-.6, 1.66, 10.6, 3, 1.6, 10.6], [2.6, 1.66, 10.6, 3.0, 1.4, 12.5], [3.2, 1.66, 8.6, 5.3, 1.5, 6.3], [3.9, 1.66, 6.5, 6, 1.5, 6.3],
  [6.4, 1.66, 6.4, 9.4, 1.2, 9.3], [8.8, 1.66, 6.7, 9, 1.5, 3], [9.0, 1.66, 4.7, 9, 1.2, 1], [7.9, 1.66, 4.3, 3, 1.4, 2.6], [6.0, 1.66, 4.25, 1, 1.6, 2.8], [4.6, 1.66, 3.6, 1.5, 1.4, 2.2], [5.0, 1.66, 3.9, 12, 1.5, 2.8], [7.6, 1.66, 4.3, 12.2, 1.5, 2.8],
  [9.0, 1.66, 4.9, 10, 1.4, 9], [9.4, 1.66, 6.6, 12.7, 1.5, 9], [12.0, 1.66, 7.7, 15.2, 1.3, 9], [12.4, 1.66, 9.0, 15.2, 1.3, 9], [13.8, 1.66, 9.0, 15.2, 1.2, 5.5], [15.3, 1.66, 6.4, 15, 1.2, 2.5], [15.6, 1.66, 4.3, 13.5, 1.4, 1],
  [15.4, 1.66, 6.4, 17.7, 1.5, 9], [16.75, 1.66, 7.4, 20, 1.3, 9], [16.9, 1.66, 9.0, 23, 1, 9], [19.8, 1.66, 9.0, 23.5, .2, 9], [20.6, 1.66, 13.6, 24, .4, 8], [20.2, 1.66, 9.2, 14, 1.6, 9], [13.4, 1.66, 9.0, 9.4, 1, 9.6], [12.1, 1.66, 9.0, 8, 1.6, 8.5], [12.0, 1.66, 7.6, 8, 1.6, 8.5],
  [8.9, 1.66, 6.9, 7.7, 2.2, 8.8], [8.85, 1.66, 9.4, 8.2, 1.5, 12.7], [8.75, 1.66, 10.9, 8.2, 1.5, 12.7], [8.3, 1.66, 11.9, 6, 1.2, 15.8], [8.0, 1.66, 14.0, 4.6, 1.0, 16.5], [8.6, 1.66, 15.6, 13, 1.2, 15.5], [11.6, 1.66, 15.3, 14.2, .9, 16.4], [12.6, 1.66, 14.8, 12.4, 1.5, 13],
  [9.2, 1.66, 15.5, 8.2, 1.5, 12], [8.3, 1.66, 11.9, 8.8, 1.6, 7], [8.75, 1.66, 10.6, 8.8, 1.6, 7], [8.8, 1.66, 6.9, 6.1, 1.5, 7], [6.1, 1.66, 6.7, 6.1, 1.8, 9.5], [6.1, 3.3, 9.9, 6.1, 4.6, 13], [6.1, 5.96, 12.9, 9, 5.6, 15], [9.2, 5.96, 14.4, 12, 4.8, 15.6], [12.5, 5.96, 14.4, 30, 5, 9], [15.6, 5.96, 10, -20, 6, 4], [15.6, 9, 14, 2, 3, 6], [30, 16, 34, 9, 1, 9]];
const cp = new THREE.CatmullRomCurve3(stops.map(s => new THREE.Vector3(s[0], s[1], s[2])), false, 'centripetal'), cl = new THREE.CatmullRomCurve3(stops.map(s => new THREE.Vector3(s[3], s[4], s[5])), false, 'centripetal');
const tour = { on: false, t: 0, len: 75 };
function startTour() { tour.on = true; tour.t = 0; veil.classList.add('off'); try { document.exitPointerLock?.(); } catch (e) {} }
function tourCam(u) { u = Math.max(0, Math.min(1, u)); camera.position.copy(cp.getPoint(u)); camera.lookAt(cl.getPoint(u)); }

const rooms = [['Living room', .5, .5, 12.4, 5.1], ['Entry hall', .5, 5.5, 5.1, 12.5], ['Court', 5.5, 5.5, 12.5, 12.5], ['Dining', 12.9, 5.5, 17.5, 12.5], ['Kitchen', 12.8, .5, 17.5, 5.1], ['Bedroom', .5, 12.9, 10.05, 17.5], ['Bath', 10.35, 12.9, 17.5, 17.5], ['Pool terrace', 18, 2, 29, 16]];
const hud = document.getElementById('hud'), fpsEl = document.getElementById('fps');
function label(x, y, z) { if (y > 5) return 'Roof terrace'; for (const r of rooms) if (x > r[1] && x < r[3] && z > r[2] && z < r[4]) return r[0]; return x < -16 ? 'Arrival' : 'Garden'; }

// ---- loop ----
let last = performance.now(), frames = 0, acc = 0, slow = 0, shadowFrames = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (tour.on) { tour.t += dt / tour.len; if (tour.t >= 1) { tour.on = false; veil.classList.remove('off'); } if (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.id !== null) { tour.on = false; takeOver(); } tourCam(tour.t); }
  else if (!SHOT) {
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 5.2 : 2.6) * dt, f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    if (f || s) { goTo = null; marker.visible = false; const n = Math.hypot(f, s); move((-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) / n * sp, (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) / n * sp); }
    else if (joy.id !== null && (Math.abs(joy.x) > .08 || Math.abs(joy.y) > .08)) { const jf = -joy.y, js = joy.x, v = 3.4 * dt; move((-Math.sin(P.yaw) * jf + Math.cos(P.yaw) * js) * v, (-Math.cos(P.yaw) * jf - Math.sin(P.yaw) * js) * v); }
    else if (goTo) { const dx = goTo.x - P.x, dz = goTo.z - P.z, L = Math.hypot(dx, dz), v = Math.min(L, 3.2 * dt); if (L < .25) { goTo = null; marker.visible = false; } else { const moved = move(dx / L * v, dz / L * v); goTo.stuck = moved < v * .2 ? goTo.stuck + dt : 0; if (goTo.stuck > .6) { goTo = null; marker.visible = false; } } }
    camera.position.set(P.x, P.y + EYE + (f || s ? Math.sin(now * 0.011) * 0.012 : 0), P.z); camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  }
  M.water.normalMap.offset.set(now * 0.00002, now * 0.000013);
  if (shadowFrames++ === 3) renderer.shadowMap.autoUpdate = false;
  composer.render();
  if (!SHOT) { hud.textContent = label(camera.position.x, camera.position.y, camera.position.z); frames++; acc += dt; if (acc > 1) { const fps = frames / acc; fpsEl.textContent = fps.toFixed(0) + ' fps'; frames = 0; acc = 0; if (fps < 24 && ++slow === 3 && useAO) { composer.removePass(gtao); useAO = false; } } requestAnimationFrame(frame); }
}
// screenshot hooks
window.__view = (x, y, z, tx, ty, tz, fov = 66) => { camera.fov = fov; camera.updateProjectionMatrix(); camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); renderer.shadowMap.needsUpdate = true; composer.render(); composer.render(); };
window.__tap = tapWalk;
window.__pos = () => ({ x: +P.x.toFixed(2), z: +P.z.toFixed(2), yaw: +P.yaw.toFixed(2), level: P.level });
window.__tour = (u) => { tourCam(u); composer.render(); };
window.__info = () => { let tris = 0, meshes = 0; scene.traverse(o => { if (o.isMesh) { meshes++; const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); } }); return { meshes, tris: Math.round(tris), geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; };
window.__tourCheck = () => { const bad = []; for (let i = 0; i <= 3000; i++) { const u = i / 3000, q = cp.getPoint(u); if (q.y > 7) continue; const list = q.y > 3.6 ? colliders.roof : colliders.ground; for (const c of list) if (q.x > c[0] - .12 && q.x < c[2] + .12 && q.z > c[1] - .12 && q.z < c[3] + .12) { bad.push([+(u * (stops.length - 1)).toFixed(2), +q.x.toFixed(1), +q.y.toFixed(1), +q.z.toFixed(1)]); break; } } return bad.filter((b, i) => i === 0 || Math.abs(b[0] - bad[i - 1][0]) > .06 || i % 12 === 0); };
status.textContent = 'A court house in the Wadi Safar manner · by Yousef'; document.getElementById('statusAr').style.display = 'block'; veil.classList.remove('loading'); document.getElementById('go').style.display = 'block';
hashPlan();
if (SHOT) { veil.style.display = 'none'; hud.style.display = 'none'; composer.render(); composer.render(); window.__ready = true; } else { camera.position.set(P.x, EYE, P.z); requestAnimationFrame(frame); window.__ready = true; }
