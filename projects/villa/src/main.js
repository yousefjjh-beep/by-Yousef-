import * as THREE from '../vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';
import { makeCtx, L, SITE } from './lib.js';
import { PIECES } from './pieces/index.js';

const qs = new URLSearchParams(location.search);
const SHOT = qs.get('shot');            // 'top' | 'eye' | 'cam' (headless screenshot modes)
const ONLY = qs.get('only');            // comma list of piece ids to build (default: all)
const status = (t) => { const el = document.getElementById('status'); if (el) el.textContent = t; };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!SHOT });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#bcd6ea');
scene.fog = new THREE.Fog('#cfe0ec', 80, 260);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

// lighting: sun + sky + interior fill
const hemi = new THREE.HemisphereLight('#eaf3ff', '#8a7a62', 0.75); scene.add(hemi);
const amb = new THREE.AmbientLight('#fff6ea', 0.25); scene.add(amb);
const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
sun.position.set(SITE.w / 2 - 30, 60, SITE.d / 2 - 25); sun.target.position.set(SITE.w / 2, 0, SITE.d / 2);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// ground plane far beyond the site (street / sand)
// (a ring around the site: inside the site the 'site' piece builds its own ground, leaving sunken courts and ramps open)
const farShape = new THREE.Shape([new THREE.Vector2(-300, -300), new THREE.Vector2(300, -300), new THREE.Vector2(300, 300), new THREE.Vector2(-300, 300)]);
farShape.holes.push(new THREE.Path([new THREE.Vector2(-SITE.w / 2, -SITE.d / 2), new THREE.Vector2(-SITE.w / 2, SITE.d / 2), new THREE.Vector2(SITE.w / 2, SITE.d / 2), new THREE.Vector2(SITE.w / 2, -SITE.d / 2)]));
const far = new THREE.Mesh(new THREE.ShapeGeometry(farShape), new THREE.MeshStandardMaterial({ color: '#d9cdb5', roughness: 1 }));
far.rotation.x = -Math.PI / 2; far.position.set(SITE.w / 2, -0.06, SITE.d / 2); far.receiveShadow = true; scene.add(far);
far.userData.isFarPlane = true; far.userData.siteHole = true;

const reg = { walk: [far], collide: [], rooms: [], views: {} };
const groups = {};

async function buildAll() {
  const list = ONLY ? PIECES.filter((p) => ONLY.split(',').includes(p.id)) : PIECES;
  for (const p of list) {
    const g = new THREE.Group(); g.name = p.id; scene.add(g); groups[p.id] = g;
    try {
      const mod = await import(`./pieces/${p.id}.js?v=${Date.now()}`);
      const ctx = makeCtx(g, reg); ctx.piece = p;
      await mod.build(ctx);
      (mod.rooms || []).forEach((r) => reg.rooms.push({ ...r, piece: p.id }));
      reg.views[p.id] = mod.views || [];
    } catch (e) { console.error(`[piece ${p.id}]`, e && (e.stack || e.message || e)); }
  }
  scene.traverse((o) => { if (o.isMesh && o.material) [].concat(o.material).forEach((m) => { if ('envMapIntensity' in m) m.envMapIntensity = 0.5; }); });
}

// ---------------------------------------------------------------------------
// Walk controls: WASD / arrows, drag to look (or click for pointer lock), Shift to run.
// ---------------------------------------------------------------------------
const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 600);
const player = { pos: new THREE.Vector3(-2, L.GRADE, 13.6), yaw: -Math.PI / 2, pitch: 0, vy: 0, eye: 1.62 };
const keys = {}; let dragging = false, lx = 0, ly = 0;
addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'KeyP') togglePlan(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
renderer.domElement.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
addEventListener('mouseup', () => { dragging = false; });
renderer.domElement.addEventListener('dblclick', () => renderer.domElement.requestPointerLock?.());
addEventListener('mousemove', (e) => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (!dragging && !locked) return;
  const dx = locked ? e.movementX : e.clientX - lx, dy = locked ? e.movementY : e.clientY - ly; lx = e.clientX; ly = e.clientY;
  player.yaw -= dx * 0.0035; player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - dy * 0.0035));
});
// touch: left half = move joystick, right half = look
const touch = { move: null, look: null };
renderer.domElement.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) { const s = { id: t.identifier, x: t.clientX, y: t.clientY, cx: t.clientX, cy: t.clientY }; if (t.clientX < innerWidth / 2) touch.move = s; else touch.look = s; } e.preventDefault(); }, { passive: false });
renderer.domElement.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (touch.move?.id === t.identifier) { touch.move.cx = t.clientX; touch.move.cy = t.clientY; } if (touch.look?.id === t.identifier) { player.yaw -= (t.clientX - touch.look.cx) * 0.005; player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch - (t.clientY - touch.look.cy) * 0.005)); touch.look.cx = t.clientX; touch.look.cy = t.clientY; } } e.preventDefault(); }, { passive: false });
renderer.domElement.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (touch.move?.id === t.identifier) touch.move = null; if (touch.look?.id === t.identifier) touch.look = null; } });

let boxes = [];
function prepCollision() {
  boxes = reg.collide.map((o) => new THREE.Box3().setFromObject(o)).filter((b) => isFinite(b.min.x));
}
const down = new THREE.Raycaster(); const DOWN = new THREE.Vector3(0, -1, 0);
function groundAt(x, z, footY) {
  down.set(new THREE.Vector3(x, footY + 0.55, z), DOWN); down.far = 30;
  const hits = down.intersectObjects(reg.walk, true); return hits.length ? hits[0].point.y : null;
}
function blocked(x, z, footY) {
  const r = 0.22;
  for (const b of boxes) {
    if (b.max.y < footY + 0.45 || b.min.y > footY + 1.75) continue;
    if (x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z) return true;
  }
  return false;
}
function step(dt) {
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 4.2 : 1.9) * dt;
  let f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  let s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
  if (touch.move) { f -= (touch.move.cy - touch.move.y) / 60; s += (touch.move.cx - touch.move.x) / 60; f = Math.max(-1, Math.min(1, f)); s = Math.max(-1, Math.min(1, s)); }
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = -fz, rz = fx;
  const dx = (fx * f + rx * s) * sp, dz = (fz * f + rz * s) * sp; const p = player.pos;
  if (!blocked(p.x + dx, p.z, p.y)) p.x += dx; if (!blocked(p.x, p.z + dz, p.y)) p.z += dz;
  const g = groundAt(p.x, p.z, p.y);
  if (g !== null && g <= p.y + 0.55 && g >= p.y - 0.05) { p.y = g; player.vy = 0; }
  else { player.vy -= 9.8 * dt; p.y += player.vy * dt; if (g !== null && p.y < g) { p.y = g; player.vy = 0; } }
  if (p.y < -20) Object.assign(p, { x: -2, y: L.GRADE, z: 13.6 });
}

// ---------------------------------------------------------------------------
// Plan (top-down cutaway) mode, used by the UI and by screenshots
// ---------------------------------------------------------------------------
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
let planMode = false; let planLevel = 'G';
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
function framePlan(bbox, level, w = innerWidth, h = innerHeight) {
  const [x0, z0, x1, z1] = bbox; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  let hw = (x1 - x0) / 2, hh = (z1 - z0) / 2; const a = w / h; if (hw / hh > a) hh = hw / a; else hw = hh * a;
  Object.assign(ortho, { left: -hw, right: hw, top: hh, bottom: -hh }); ortho.updateProjectionMatrix();
  ortho.position.set(cx, 200, cz); ortho.up.set(0, 0, -1); ortho.lookAt(cx, 0, cz);
  const cut = { B: L.B + 2.4, G: L.G + 2.6, F: L.F + 2.6 }[level];
  // hide everything that starts above the cut height (ceilings, upper floors, roofs); walls keep their dark tops
  const bb = new THREE.Box3(); scene.updateMatrixWorld(true);
  const below = { B: -99, G: L.G - 0.6, F: L.F - 0.6 }[level];
  scene.traverse((o) => {
    if (!o.isMesh || o === far) return;
    bb.setFromObject(o); o.visible = !(bb.min.y > cut);
    // first-floor plan: roofs/parapets of lower pieces are see-through (architect shows the floor below, faded)
    if (level === 'F' && !/^f_/.test(pieceOf(o)) && bb.min.y > L.G + 3.0) o.visible = false;
    // like the architect's render: floors below the cut level are drawn as greyed context
    setGrey(o, bb.max.y < below ? (level === 'F' ? 0.55 : 0.3) : 0);
  });
  scene.fog = null;
  planLighting(true, cx, cz);
}
function pieceOf(o) { while (o && !(o.parent && o.parent.isScene)) o = o.parent; return o ? o.name : ''; }
// greyed-context materials (cached per source material + strength)
const greyCache = new Map();
function setGrey(o, k) {
  if (!o.userData.mat0) { if (!k) return; o.userData.mat0 = o.material; }
  if (!k) { o.material = o.userData.mat0; return; }
  const src = o.userData.mat0, conv = (m) => {
    const key = m.uuid + k; if (greyCache.has(key)) return greyCache.get(key);
    const g = m.clone(); g.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
      `#include <dithering_fragment>\n float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)); gl_FragColor.rgb = mix(vec3(lum), vec3(1.0), ${k.toFixed(2)});`); };
    g.customProgramCacheKey = () => 'grey' + k; greyCache.set(key, g); return g; };
  o.material = Array.isArray(src) ? src.map(conv) : conv(src);
}
// plan views read like the architect's render: near-overhead soft sun (short contact shadows only), even fill, white paper
function planLighting(on, cx = SITE.w / 2, cz = SITE.d / 2) {
  if (on) {
    sun.position.set(cx + 3, 90, cz + 4); sun.target.position.set(cx, 0, cz); sun.intensity = 0.55;
    hemi.intensity = 0.4; hemi.groundColor.set('#d8cfc0'); amb.intensity = 0.1;
    sun.shadow.radius = 3; renderer.toneMapping = THREE.NoToneMapping;
    scene.background = new THREE.Color('#ffffff'); far.material.color.set('#ffffff');
  } else {
    sun.position.set(SITE.w / 2 - 30, 60, SITE.d / 2 - 25); sun.target.position.set(SITE.w / 2, 0, SITE.d / 2); sun.intensity = 2.6;
    hemi.intensity = 0.75; hemi.groundColor.set('#8a7a62'); amb.intensity = 0.25;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    scene.background = new THREE.Color('#bcd6ea'); far.material.color.set('#d9cdb5');
  }
  sun.target.updateMatrixWorld();
}
function togglePlan(level) {
  planMode = level ? true : !planMode; if (level) planLevel = level;
  if (planMode) framePlan([0, 0, SITE.w, SITE.d], planLevel); else { planLighting(false); scene.traverse((o) => { if (o.isMesh) { o.visible = true; setGrey(o, 0); } }); scene.fog = new THREE.Fog('#cfe0ec', 80, 260); }
  document.querySelectorAll('[data-plan]').forEach((b) => b.classList.toggle('on', planMode && b.dataset.plan === planLevel));
}

// ---------------------------------------------------------------------------
function updateCam() {
  cam.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  cam.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
}
function resize() { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); if (planMode) framePlan([0, 0, SITE.w, SITE.d], planLevel); }
addEventListener('resize', resize);

function buildUI() {
  const ui = document.getElementById('rooms'); if (!ui) return;
  const byLevel = { B: [], G: [], F: [] }; reg.rooms.forEach((r) => (byLevel[r.level] || (byLevel[r.level] = [])).push(r));
  const names = { B: 'Basement', G: 'Ground', F: 'First' };
  ui.innerHTML = '';
  for (const lv of ['G', 'F', 'B']) {
    const sec = document.createElement('div'); sec.className = 'lv';
    sec.innerHTML = `<div class="lvh"><span>${names[lv]} floor</span><button data-plan="${lv}" title="Top-down plan view">plan</button></div>`;
    byLevel[lv].sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => {
      const b = document.createElement('button'); b.textContent = r.name; b.className = 'room';
      b.onclick = () => { if (planMode) togglePlan(); player.pos.set(r.x, L[lv] + (r.dy || 0), r.z); player.yaw = r.yaw ?? player.yaw; player.pitch = 0; player.vy = 0; };
      sec.appendChild(b);
    });
    ui.appendChild(sec);
  }
  ui.querySelectorAll('[data-plan]').forEach((b) => (b.onclick = () => { if (planMode && planLevel === b.dataset.plan) togglePlan(); else togglePlan(b.dataset.plan); }));
  const start = document.createElement('button'); start.className = 'room'; start.textContent = 'Front gate (start)';
  start.onclick = () => { if (planMode) togglePlan(); Object.assign(player, { yaw: -Math.PI / 2, pitch: 0, vy: 0 }); player.pos.set(-2, 0, 13.6); };
  ui.prepend(start);
}

async function main() {
  status('Building the house…');
  await buildAll(); prepCollision();
  if (SHOT) return shotMode();
  mergeStatic();
  buildUI(); status('');
  document.getElementById('help')?.classList.add('show');
  let last = performance.now();
  renderer.setAnimationLoop((t) => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!planMode) { step(dt); updateCam(); renderer.render(scene, cam); } else renderer.render(scene, ortho);
    const hud = document.getElementById('pos'); if (hud) hud.textContent = `x ${player.pos.x.toFixed(1)}  z ${player.pos.z.toFixed(1)}  y ${player.pos.y.toFixed(1)}`;
  });
  window.__ready = true;
}

// Merge static meshes that share a material (and the same plan-view behaviour) to cut draw calls.
// Originals are detached; walk surfaces stay referenced in reg.walk for the ground raycast (matrices are static).
function mergeStatic() {
  scene.updateMatrixWorld(true);
  const bb = new THREE.Box3(), buckets = new Map(), cut = { B: L.B + 2.4, G: L.G + 2.6, F: L.F + 2.6 }, below = { G: L.G - 0.6, F: L.F - 0.6 };
  for (const [id, g] of Object.entries(groups)) {
    g.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.visible || o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender || o.userData.noMerge) return;
      bb.setFromObject(o); if (!isFinite(bb.min.y)) return;
      const sig = ['B', 'G', 'F'].map((lv) => (bb.min.y > cut[lv] ? 0 : 1) + (below[lv] !== undefined && bb.max.y < below[lv] ? 2 : 0) + (lv === 'F' && !/^f_/.test(id) && bb.min.y > L.G + 3.0 ? 4 : 0)).join('');
      const attrs = Object.keys(o.geometry.attributes).sort().join(',');
      const key = [id, o.material.uuid, sig, attrs, o.castShadow, o.receiveShadow, o.renderOrder].join('|');
      (buckets.get(key) || buckets.set(key, []).get(key)).push(o);
    });
  }
  let before = 0, after = 0;
  for (const list of buckets.values()) {
    before += list.length; if (list.length < 2) { after++; continue; }
    const geos = list.map((o) => { let gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); gg.applyMatrix4(o.matrixWorld); for (const k of Object.keys(gg.morphAttributes)) delete gg.morphAttributes[k]; return gg; });
    const merged = mergeGeometries(geos, false); geos.forEach((gg) => gg.dispose());
    if (!merged) { after += list.length; continue; }
    const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder;
    const grp = groups[list[0] && Object.keys(groups).find((k) => { let p = list[0]; while (p && p.parent !== scene) p = p.parent; return p === groups[k]; })];
    list.forEach((o) => o.parent && o.parent.remove(o)); grp.add(m); after++;
  }
  scene.updateMatrixWorld(true);
  console.log(`[merge] ${before} meshes -> ${after}`);
}

// Screenshot modes (used by tools/shot.mjs):
//   ?shot=top&piece=ID            orthographic cutaway of the piece's bbox at its level
//   ?shot=eye&piece=ID&v=N        the piece's views[N]  ({name, x, z, level, yaw(deg), pitch(deg), fov, y?})
//   ?shot=cam&cam=x,y,z,tx,ty,tz&fov=60   any perspective camera
//   add &only=id1,id2 to build only some pieces (faster)
function shotMode() {
  document.querySelectorAll('.ui').forEach((e) => e.remove());
  const p = PIECES.find((q) => q.id === qs.get('piece'));
  if (SHOT === 'top') { framePlan(p.bbox, qs.get('level') || p.level); renderer.render(scene, ortho); }
  else {
    let c;
    if (SHOT === 'eye') {
      const v = (reg.views[p.id] || [])[+qs.get('v') || 0];
      if (!v) { console.error('no such view'); window.__ready = true; return; }
      c = new THREE.PerspectiveCamera(v.fov || 65, innerWidth / innerHeight, 0.05, 600);
      c.position.set(v.x, (v.y ?? (L[v.level || p.level] + 1.6)), v.z); c.rotation.set((v.pitch || 0) * Math.PI / 180, (v.yaw || 0) * Math.PI / 180, 0, 'YXZ');
    } else {
      const a = qs.get('cam').split(',').map(Number); c = new THREE.PerspectiveCamera(+(qs.get('fov') || 60), innerWidth / innerHeight, 0.05, 600);
      c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]);
    }
    renderer.render(scene, c);
  }
  window.__ready = true;
}
window.__house = { scene, reg, PIECES, player, step, keys, renderer, renderOnce: () => { updateCam(); renderer.render(scene, cam); }, cam };
main().catch((e) => { console.error(e); status('Error: ' + e.message); window.__ready = true; });
