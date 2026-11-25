// Bayt Safar · the drawing sheet that folds into the house.
// One sheet (site plan, section A-A, west elevation) is rendered from the 3D model, folds into a corner, and three red
// fronts leave the paper: the house only exists where all three have passed, first in ink, then in its materials.
// Everything on screen is a function of two numbers: T (seconds since ready: the opening) and p (scroll, 0 to 1).
// The idea and the order of the beats follow Sam Aing's Ferrow page (MIT); the code here is written for this model.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { makeMaterials, chediMaterials } from './tex.js';
import { buildHouse } from './house.js';
import { furnish } from './props.js';
import { buildSite } from './site.js';
import { planTrees, resetPalms } from './trees.js';
import { buildMustaqil, buildMustatil } from './houses.js';

const Q = new URLSearchParams(location.search), SHOT = Q.has('shot');
const TOUCH = !SHOT && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const dpr = Math.min(devicePixelRatio, Q.has('dpr') ? +Q.get('dpr') : SHOT ? 1 : TOUCH ? 1.25 : 1.5);
renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 600);
renderer.setClearColor(0x14100c, 1); renderer.localClippingEnabled = true;
const sunDir = new THREE.Vector3(-0.74, 0.56, 0.5).normalize();
{ const sky = new Sky(); sky.scale.setScalar(4000); sky.material.uniforms.turbidity.value = 7; sky.material.uniforms.rayleigh.value = 2.4; sky.material.uniforms.mieCoefficient.value = 0.008; sky.material.uniforms.mieDirectionalG.value = 0.85; sky.material.uniforms.sunPosition.value.copy(sunDir);
  const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene(); s.add(sky); const gnd = new THREE.Mesh(new THREE.CircleGeometry(3000, 24), new THREE.MeshBasicMaterial({ color: 0xb9a88c })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -2; s.add(gnd); scene.environment = pm.fromScene(s, 0.02).texture; scene.environmentIntensity = 0.6; }
const sun = new THREE.DirectionalLight(0xffd9ac, 4.6); sun.position.copy(sunDir).multiplyScalar(90).add(new THREE.Vector3(11, 0, 9)); sun.target.position.set(11, 0, 9);
sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 2048 : 4096, TOUCH ? 2048 : 4096); { const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 10; sc.far = 190; } sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035; sun.shadow.radius = 2.4;
scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight(0xd0dcff, 0xe2d4bc, 0.28));

// ---- the sheet: a tight corner round the house and its pool (metres) --------------------------------------------------
const X0 = -4, X1 = 27, Z0 = -4, Z1 = 22, HP = 10, YP = -0.42, W = X1 - X0, D = Z1 - Z0, TOPY = 7.2;
const SWD = new THREE.Vector2(0.82, -0.57).normalize(), SW0 = -8, SW1 = 36; // the material sweep, front-left to back-right
const SEC_Z = 9.4, PX = 64, PXD = 44, INK = '#1b1a18', RED = '#7a4a26';
// The model is a maquette: it only exists inside the sheet, and only where the three fronts have passed.
const PL = (x, y, z, c) => new THREE.Plane(new THREE.Vector3(x, y, z), c);
const bounds = [PL(1, 0, 0, -X0 - 0.02), PL(-1, 0, 0, X1 - 0.02), PL(0, 0, 1, -Z0 - 0.02), PL(0, 0, -1, Z1 - 0.02)];
const fronts = [PL(0, -1, 0, 99), PL(1, 0, 0, 99), PL(0, 0, -1, 99)], planes = [...bounds, ...fronts];

// ---- the house, exactly the walk's model -------------------------------------------------------------------------
const M = chediMaterials(makeMaterials());
// house tone: 0 = as first built; 1-3 are darker, browner versions (?tone=N previews them; TONE is the published choice)
const TONE = 2, TONES = [null, [[.80, .74, .66], [.86, .83, .78], [.80, .76, .72], .86], [[.66, .57, .47], [.78, .72, .64], [.70, .62, .55], .83], [[.52, .42, .33], [.68, .60, .52], [.56, .47, .40], .80], [[.40, .30, .22], [.58, .50, .42], [.45, .36, .30], .78]];
const tone = TONES[Q.has('tone') ? +Q.get('tone') : TONE];
if (tone) { const mul = (keys, c) => { for (const k of keys) if (M[k] && M[k].color) M[k].color.multiply(new THREE.Color(c[0], c[1], c[2])); };
  mul(['mud', 'mudDark', 'mudIn', 'ceilTop', 'ceil'], tone[0]); mul(['floor', 'trav', 'stone', 'paver'], tone[1]); mul(['oak', 'doorOak', 'flute', 'fluteDark', 'walnut', 'wood'], tone[2]); }
const uGrow = { value: 0 };
function dissolve(mat, u) { mat.onBeforeCompile = (sh) => { sh.uniforms.uDis = u; sh.fragmentShader = 'uniform float uDis;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) >= uDis) discard;'); }; mat.customProgramCacheKey = () => 'dis'; }
for (const k of ['frond', 'leaf', 'blossom', 'oliveLeaf', 'acaciaLeaf', 'ghafLeaf', 'grass']) dissolve(M[k], uGrow);
buildHouse(scene, M); furnish(scene, M); buildSite(scene, M);
scene.updateMatrixWorld(true);
const soft = [], trees = [], seen = new Set(), box = new THREE.Box3(), keepBox = new THREE.Box3(new THREE.Vector3(X0, -5, Z0), new THREE.Vector3(X1, 40, Z1));
scene.traverse((o) => {
  if (o.isPointLight) { o.visible = false; return; }
  if (!o.isMesh) return; o.matrixAutoUpdate = false; o.updateMatrix();
  const mats = Array.isArray(o.material) ? o.material : [o.material], m = mats[0];
  if (o.isInstancedMesh) { o.computeBoundingBox(); box.copy(o.boundingBox).applyMatrix4(o.matrixWorld); } else box.setFromObject(o);
  if (!box.intersectsBox(keepBox) || m === M.sand || m === M.cliff) { o.visible = false; o.userData.gone = true; return; }
  if (o.isInstancedMesh) { const mt = new THREE.Matrix4(), ps = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let ch = false; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mt); ps.setFromMatrixPosition(mt).applyMatrix4(o.matrixWorld); if (ps.x < X0 + .3 || ps.x > X1 - .3 || ps.z < Z0 + .3 || ps.z > Z1 - .3) { o.setMatrixAt(i, zero); ch = true; } } if (ch) o.instanceMatrix.needsUpdate = true; }
  for (const k of mats) if (!seen.has(k)) { seen.add(k); k.clippingPlanes = (k.alphaTest > 0 && k !== M.screen) ? fronts : planes; k.clipShadows = true; }
  if (m.alphaTest > 0 || m.transparent) soft.push(o);
  if (m === M.trunk || m === M.bark || m === M.dateStalk || m === M.dateFruit) trees.push(o);
});
const nTrees = planTrees.filter((t) => t.x > X0 && t.x < X1 && t.z > Z0 && t.z < Z1).length;

// ---- two more houses for the last beat, each on its own small sheet (local metres inside a group) ------------------------
const uGrow2 = { value: 0 }, uL = { value: 0 }; // uL: 0 = dark theme, 1 = light theme
const OPT = [
  { key: 'mustaqil', no: 'B', en: 'BAYT MUSTAQIL', ar: 'بيت المستقل', sub: '160 M² · TWO FLOORS AND A ROOF', build: buildMustaqil, o: [-27.5, 4.5], x0: -3, z0: -3, w: 19.5, d: 16, top: 12.5, from: [-8, 4.5], hp: 10, cut: 4.5 },
  { key: 'mustatil', no: 'C', en: 'BAYT MUSTATIL', ar: 'بيت المستطيل', sub: '140 M² · ONE LONG ROOM', build: buildMustatil, o: [1, 33], x0: -4.5, z0: -3.5, w: 29, d: 20, top: 11.5, from: [1, 8], hp: 6.6, cut: 3.6 },
];
{ resetPalms(); const nPT = planTrees.length;
  for (const h of OPT) {
    const M2 = {}; for (const k in M) M2[k] = M[k] && M[k].isMaterial ? M[k].clone() : M[k];
    for (const k of ['frond', 'leaf', 'blossom', 'oliveLeaf', 'acaciaLeaf', 'ghafLeaf', 'grass']) if (M2[k]) dissolve(M2[k], uGrow2);
    h.rise = PL(0, -1, 0, 99); h.grp = new THREE.Group(); h.grp.position.set(h.o[0], 0, h.o[1]); scene.add(h.grp); const n0 = planTrees.length; h.build(h.grp, M2); h.trees = planTrees.slice(n0); planTrees.length = nPT;
    h.grp.updateMatrixWorld(true); const done = new Set();
    h.grp.traverse((o) => { if (!o.isMesh) return; o.matrixAutoUpdate = false; o.updateMatrix(); const mats = Array.isArray(o.material) ? o.material : [o.material], m = mats[0];
      for (const k of mats) if (!done.has(k)) { done.add(k); k.clippingPlanes = [h.rise]; k.clipShadows = true; }
      if (m.alphaTest > 0 || m.transparent) soft.push(o); if (m === M2.trunk || m === M2.bark || m === M2.dateStalk || m === M2.dateFruit) trees.push(o); });
  } }

// the geometry pass: view normal, view depth, and whether we see the inside of a cut solid
const gMat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide, clipping: true, clippingPlanes: planes,
  vertexShader: `#include <common>\n#include <clipping_planes_pars_vertex>\nvarying vec3 vN; varying float vD;\nvoid main(){\n#include <beginnormal_vertex>\n#include <defaultnormal_vertex>\n#include <begin_vertex>\n#include <project_vertex>\n#include <clipping_planes_vertex>\nvN = normalize(transformedNormal); vD = -mvPosition.z; }`,
  fragmentShader: `#include <clipping_planes_pars_fragment>\nvarying vec3 vN; varying float vD;\nvoid main(){\n#include <clipping_planes_fragment>\nvec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.); gl_FragColor = vec4(n.xy * .5 + .5, vD, gl_FrontFacing ? 1. : .5); }`,
});
// The paper and the mat are on layer 1: in the ink pass they are drawn first as plain occluders.
const occMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }' });
function geometryPass(target, cam, noTrees, occlude) {
  for (const o of soft) o.visible = false; if (noTrees) for (const o of trees) o.visible = false;
  renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear();
  if (occlude) { cam.layers.set(1); scene.overrideMaterial = occMat; renderer.render(scene, cam); renderer.autoClear = false; }
  cam.layers.set(0); scene.overrideMaterial = gMat; renderer.render(scene, cam); renderer.autoClear = true; cam.layers.enableAll();
  scene.overrideMaterial = null; renderer.setClearColor(0x14100c, 1);
  for (const o of soft) o.visible = true; if (noTrees) for (const o of trees) o.visible = true;
}
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qScene.add(quad); quad.frustumCulled = false;
const VQ = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

// ---- the three drawings, rendered from the model ---------------------------------------------------------------------
const drawMat = new THREE.ShaderMaterial({ uniforms: { tG: { value: null }, uPx: { value: new THREE.Vector2() }, uZ: { value: 1 }, uTone: { value: 1 } }, vertexShader: VQ, fragmentShader: `
  uniform sampler2D tG; uniform vec2 uPx; uniform float uZ, uTone; varying vec2 vUv;
  void main(){ vec4 g = texture2D(tG, vUv); float e = 0.;
    for (int i = 0; i < 8; i++) { float a = float(i) * .7854; vec2 o = vec2(cos(a), sin(a)) * uPx * (i < 4 ? 1. : 2.); vec4 q = texture2D(tG, vUv + o);
      e = max(e, length(q.xy - g.xy) * 1.6); e = max(e, abs(q.z - g.z) * uZ); e = max(e, abs(q.a - g.a) * 3.); }
    float line = smoothstep(.22, .5, e); vec3 paper = vec3(.957, .945, .918), ink = vec3(.106, .102, .094);
    vec3 c = paper * (g.a > .75 ? uTone - clamp(g.z * .0012, 0., .05) : 1.); if (g.a > .01 && g.a < .75) c = mix(paper, ink, .82);
    gl_FragColor = vec4(pow(mix(c, ink, line * .92), vec3(2.2)), 1.); }` });
function drawing(wPx, hPx, cam, plane, zScale, tone = .985) {
  const g = new THREE.WebGLRenderTarget(wPx, hPx, { type: THREE.HalfFloatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
  const out = new THREE.WebGLRenderTarget(wPx, hPx, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 8 });
  cam.layers.set(0); renderer.clippingPlanes = [plane]; geometryPass(g, cam, true, false); renderer.clippingPlanes = [];
  drawMat.uniforms.tG.value = g.texture; drawMat.uniforms.uPx.value.set(1 / wPx, 1 / hPx); drawMat.uniforms.uZ.value = zScale; drawMat.uniforms.uTone.value = tone; quad.material = drawMat;
  renderer.setRenderTarget(out); renderer.render(qScene, qCam); renderer.setRenderTarget(null); g.dispose(); return out.texture;
}
// the same view again, in colour, then thinned to a watercolour wash that is multiplied onto the paper
const washMat = new THREE.ShaderMaterial({ uniforms: { tB: { value: null }, uPx: { value: new THREE.Vector2() } }, vertexShader: VQ, fragmentShader: `
  uniform sampler2D tB; uniform vec2 uPx; varying vec2 vUv;
  vec3 aces(vec3 x){ x *= 1.5; return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main(){ vec4 a = vec4(0.); float n = h(floor(vUv / uPx / 3.));
    for (int i = 0; i < 9; i++) { vec2 o = vec2(float(i - (i / 3) * 3) - 1., float(i / 3) - 1.) * uPx * (1.6 + n); vec4 q = texture2D(tB, vUv + o); a += vec4(pow(aces(q.rgb), vec3(1. / 2.2)) * q.a, q.a); }
    float al = a.a / 9.; vec3 c = a.rgb / max(a.a, .001); float l = dot(c, vec3(.3, .59, .11)); c = mix(vec3(l), c, 1.25); c = mix(c, vec3(1.), .16); c *= .95 + .1 * n;
    float edge = smoothstep(0., .5, al) * (1. - .25 * smoothstep(.6, 1., al) * 0.);
    gl_FragColor = vec4(pow(mix(vec3(1.), clamp(c, 0., 1.), edge * .92), vec3(2.2)), 1.); }` });
function colourWash(wPx, hPx, cam, plane) {
  const rt = new THREE.WebGLRenderTarget(wPx, hPx, { type: THREE.HalfFloatType, samples: 4 }), out = new THREE.WebGLRenderTarget(wPx, hPx, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 8 });
  uGrow.value = 1; cam.layers.set(0); renderer.clippingPlanes = [plane]; renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  renderer.clippingPlanes = []; renderer.setClearColor(0x14100c, 1); uGrow.value = 0;
  washMat.uniforms.tB.value = rt.texture; washMat.uniforms.uPx.value.set(1 / wPx, 1 / hPx); quad.material = washMat; renderer.setRenderTarget(out); renderer.render(qScene, qCam); renderer.setRenderTarget(null); rt.dispose(); return out.texture;
}
function ortho(l, r, t, b, pos, look, up, far) { const c = new THREE.OrthographicCamera(l, r, t, b, 0.1, far); c.position.copy(pos); c.up.copy(up); c.lookAt(look); c.updateMatrixWorld(true); return c; }
// labels: a transparent canvas per drawing, in ink
function labels(wM, hM, fn) { const c = document.createElement('canvas'); c.width = wM * PX; c.height = hM * PX; const g = c.getContext('2d'); g.scale(PX, PX); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; fn(g); const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; }
const F = (g, px, w = 400, fam = "'Barlow Condensed','Arial Narrow',sans-serif") => { g.font = `${w} ${px}px ${fam}`; };
const AR = "'Amiri','Noto Naskh Arabic','Geeza Pro','Segoe UI',serif";
function tag(g, no, title, sub, x, y) { g.save(); g.translate(x, y); g.scale(.62, .62); x = 0; y = 0; F(g, 1.5, 300); g.fillText(no, x, y); F(g, .78, 500); g.save(); g.translate(x + 2.1, y - .62); const sp = title.split(''); let cx = 0; for (const ch of sp) { g.fillText(ch, cx, 0); cx += g.measureText(ch).width + .12; } g.restore(); F(g, .5, 400); g.globalAlpha = .6; g.fillText(sub, x + 2.1, y + .1); g.globalAlpha = 1; g.lineWidth = .04; g.beginPath(); g.moveTo(x, y + .5); g.lineTo(x + 11, y + .5); g.stroke(); g.restore(); }
const ROOMS = [['Living room', 'المجلس', 5.4, 2.9], ['Entry hall', 'المدخل', 2.8, 8.2], ['Court', 'الفناء', 9.4, 11.6], ['Dining', 'الطعام', 15.2, 7.0], ['Kitchen', 'المطبخ', 15.2, 2.2], ['Bedroom', 'غرفة النوم', 4.2, 14.4], ['Bath', 'الحمّام', 13.9, 14.4], ['Pool', 'المسبح', 27.4, 9]];


// paper: lit, so the house throws its shadow on the plan and on both walls
const uRev = { value: 0 }, uSwP = { value: -99 }, uNoteN = { value: 0 }, uNoteE = { value: 0 }; let paperN = 0;
function paperMat(map, lab, tint, col, note, o, u, v, uN) {
  const m = new THREE.MeshStandardMaterial({ map, color: tint, roughness: 1, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.55 }), id = paperN++;
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, { uLab: { value: lab }, uCol: { value: col }, uNote: { value: note }, uRev, uSwP, uN, uO: { value: o }, uU: { value: u }, uV: { value: v }, uSd: { value: SWD } });
    sh.fragmentShader = 'uniform sampler2D uLab, uCol, uNote; uniform float uRev, uSwP, uN; uniform vec3 uO, uU, uV; uniform vec2 uSd;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  vec3 Pw = uO + uU * vMapUv.x + uV * vMapUv.y; float wn = fract(sin(dot(floor(vMapUv * vec2(180., 60.)), vec2(12.9898, 78.233))) * 43758.5453);
  float wr = dot(Pw.xz, uSd) - Pw.y * .35 + wn * 1.4 + sin(Pw.y * 2.1 + Pw.x * .7 + Pw.z) * .9; float wash = 1. - smoothstep(uSwP - 3.5, uSwP, wr);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * texture2D(uCol, vMapUv).rgb, wash);
  vec4 lb = texture2D(uLab, vMapUv); diffuseColor.rgb = mix(diffuseColor.rgb, lb.rgb, lb.a);
  vec4 nt = texture2D(uNote, vMapUv); diffuseColor.rgb = mix(diffuseColor.rgb, nt.rgb, nt.a * (1. - smoothstep(uN - .07, uN, vMapUv.x)));
  diffuseColor.rgb = mix(vec3(.905, .88, .835), diffuseColor.rgb, uRev);`); };
  m.customProgramCacheKey = () => 'paper' + id; return m;
}
// hand-written notes in red ink
const HAND = "'Caveat','Segoe Script','Bradley Hand','Comic Sans MS',cursive";
function note(g, text, x, y, tx, ty, ar) { g.font = ar ? `.78px ${AR}` : `.92px ${HAND}`; g.fillStyle = RED; g.strokeStyle = RED; g.lineWidth = .045; g.textAlign = 'left'; g.direction = ar ? 'rtl' : 'ltr'; if (ar) g.textAlign = 'right'; g.fillText(text, x, y); g.direction = 'ltr';
  if (tx === undefined) return; const w = g.measureText(text).width, sx = ar ? x - w / 2 : x + w / 2, sy = y + (ty > y ? .28 : -.8); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + tx) / 2 + .5, (sy + ty) / 2, tx, ty); g.stroke();
  const a = Math.atan2(ty - (sy + ty) / 2, tx - ((sx + tx) / 2 + .5)); g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - Math.cos(a - .45) * .32, ty - Math.sin(a - .45) * .32); g.moveTo(tx, ty); g.lineTo(tx - Math.cos(a + .45) * .32, ty - Math.sin(a + .45) * .32); g.stroke(); }
let desk, sheet, lines, wire; const P = {};
function buildSheet() {
  const up = new THREE.Vector3(0, 1, 0), cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  const cPlan = ortho(-W / 2, W / 2, D / 2, -D / 2, new THREE.Vector3(cx, 40, cz), new THREE.Vector3(cx, 0, cz), new THREE.Vector3(0, 0, -1), 80), cSec = ortho(-W / 2, W / 2, HP / 2, -HP / 2, new THREE.Vector3(cx, YP + HP / 2, 60), new THREE.Vector3(cx, YP + HP / 2, 0), up, 60 - Z0 + 1), cEl = ortho(-D / 2, D / 2, HP / 2, -HP / 2, new THREE.Vector3(-70, YP + HP / 2, cz), new THREE.Vector3(0, YP + HP / 2, cz), up, 70 + X1 + 1);
  const kPlan = PL(0, -1, 0, 1.2), kSec = PL(0, 0, -1, SEC_Z), kEl = PL(1, 0, 0, 3.6);
  const tPlan = drawing(W * PXD, D * PXD, cPlan, kPlan, 1.4), tSec = drawing(W * PXD, HP * PXD, cSec, kSec, .9, .93), tEl = drawing(D * PXD, HP * PXD, cEl, kEl, .9, .93);
  const wPlan = colourWash(W * PXD, D * PXD, cPlan, kPlan), wSec = colourWash(W * PXD, HP * PXD, cSec, kSec), wEl = colourWash(D * PXD, HP * PXD, cEl, kEl);
  const Y = (y) => HP + YP - y; // metres above the floor to canvas
  const nSec = labels(W, HP, (g) => {
    note(g, 'the hall bends', 1.8, Y(6.45), 6.9, Y(3.7)); note(g, 'court, open to the sky', 8.2, Y(6.7), 13.6, Y(4.9)); note(g, 'الفناء', 19.6, Y(6.72), undefined, undefined, true);
    note(g, 'ten at the table', 21.4, Y(6.7), 19.4, Y(2.7)); note(g, 'living room behind, +6.30', 9.0, Y(8.5), 15.6, Y(6.5)); note(g, 'sun at five', 24.4, Y(8.5));
    note(g, 'the pool', 26.4, Y(3.3), 27.5, Y(.25)); });
  const nEl = labels(D, HP, (g) => {
    note(g, 'vents let the heat out', .8, Y(6.7), 12.2, Y(4.0)); note(g, 'one oak door, 3 m', 9.9, Y(6.7), 14.6, Y(2.8)); note(g, 'palms either side', 17.4, Y(6.7));
    note(g, 'living room, 6.30 high', 9.0, Y(8.5), 6.6, Y(6.5)); note(g, 'باب من خشب البلوط', 25.0, Y(8.52), undefined, undefined, true);
    note(g, 'slot windows', 19.6, Y(5.2), 19.1, Y(2.3)); });
  const nNone = labels(1, 1, () => {});
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const lPlan = labels(W, D, (g) => {
    const x = (wx) => wx - X0, z = (wz) => wz - Z0; g.textAlign = 'center';
    for (const [en, ar, rx, rz] of ROOMS) { if (rx > X1 - 1) continue; g.fillStyle = 'rgba(244,241,234,.86)'; g.fillRect(x(rx) - 1.7, z(rz) - .56, 3.4, 1.12); g.fillStyle = INK; F(g, .44, 500); g.fillText(en.toUpperCase(), x(rx), z(rz) - .05); g.font = `.44px ${AR}`; g.fillText(ar, x(rx), z(rz) + .44); }
    g.lineWidth = .03; for (const t of planTrees) { if (t.x < X0 + 1 || t.x > X1 - 1 || t.z < Z0 + 1 || t.z > Z1 - 1) continue; const r = t.kind === 'palm' ? 1.9 : 1.5 * (t.s || 1); g.globalAlpha = .5; g.beginPath(); if (t.kind === 'palm') { for (let i = 0; i < 9; i++) { const a = i * .698 + t.x; g.moveTo(x(t.x), z(t.z)); g.lineTo(x(t.x) + Math.cos(a) * r, z(t.z) + Math.sin(a) * r); } } else { for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, rr = r * (.86 + .14 * Math.sin(a * 5 + t.x)); i ? g.lineTo(x(t.x) + Math.cos(a) * rr, z(t.z) + Math.sin(a) * rr) : g.moveTo(x(t.x) + Math.cos(a) * rr, z(t.z) + Math.sin(a) * rr); } } g.stroke(); g.globalAlpha = 1; }
    g.strokeStyle = RED; g.lineWidth = .045; g.setLineDash([.5, .25]); g.beginPath(); g.moveTo(x(X0 + .8), z(SEC_Z)); g.lineTo(x(X1 - .8), z(SEC_Z)); g.stroke(); g.setLineDash([]); g.fillStyle = RED; F(g, .6, 600); g.fillText('A', x(X0 + .8), z(SEC_Z) - .25); g.fillText('A', x(X1 - .8), z(SEC_Z) - .25); g.fillStyle = INK; g.strokeStyle = INK;
    g.lineWidth = .03; g.beginPath(); g.moveTo(x(0), z(19.4)); g.lineTo(x(18), z(19.4)); g.moveTo(x(0), z(19.1)); g.lineTo(x(0), z(19.7)); g.moveTo(x(18), z(19.1)); g.lineTo(x(18), z(19.7)); g.stroke(); F(g, .44); g.fillText('18.00', x(9), z(20.0));
    g.beginPath(); g.moveTo(x(25.6), z(-.6)); g.lineTo(x(25.6), z(-3.0)); g.lineTo(x(25.2), z(-2.3)); g.moveTo(x(25.6), z(-3.0)); g.lineTo(x(26), z(-2.3)); g.stroke(); F(g, .55, 500); g.fillText('N', x(25.6), z(-3.25));
    g.textAlign = 'left'; g.lineWidth = .045; g.beginPath(); g.moveTo(x(-3.2), z(20.9)); g.lineTo(x(6.8), z(20.9)); g.stroke(); for (const m of [0, 5, 10]) { g.beginPath(); g.moveTo(x(-3.2 + m), z(20.7)); g.lineTo(x(-3.2 + m), z(21.1)); g.stroke(); F(g, .38); g.fillText(m + (m === 10 ? ' m' : ''), x(-3.1 + m), z(21.65)); }
    tag(g, '03', 'GROUND FLOOR PLAN', 'CUT AT +1.20 · 1:100 · NORTH IS UP', x(-3.4), z(-2.5));
    // title block
    const bx = x(18.6), bz = z(19.0); g.lineWidth = .04; g.strokeRect(bx, bz, 8, 2.6); g.beginPath(); g.moveTo(bx, bz + 1.3); g.lineTo(bx + 8, bz + 1.3); g.moveTo(bx + 4.6, bz + 1.3); g.lineTo(bx + 4.6, bz + 2.6); g.stroke();
    F(g, .8, 500); g.fillText('BAYT SAFAR', bx + .25, bz + .95); g.font = `.7px ${AR}`; g.textAlign = 'right'; g.fillText('بيت صفار', bx + 7.75, bz + .92); g.textAlign = 'left'; F(g, .3); g.globalAlpha = .6; g.fillText('DRAWN BY', bx + .25, bz + 1.7); g.fillText('SHEET', bx + 4.85, bz + 1.7); g.globalAlpha = 1; F(g, .42, 500); g.fillText('Yousef · Riyadh · 2026', bx + .25, bz + 2.3); g.fillText('A-01 · 1:100', bx + 4.85, bz + 2.3);
  });
  const lSec = labels(W, HP, (g) => { tag(g, '01', 'SECTION A–A', 'THROUGH THE HALL, THE COURT, THE DINING ROOM AND THE POOL', .9, 1.5); g.lineWidth = .07; g.beginPath(); g.moveTo(0, HP + YP + .1); g.lineTo(W, HP + YP + .1); g.stroke(); g.strokeStyle = RED; g.fillStyle = RED; g.lineWidth = .03; for (const [y, t] of [[0, '±0.00'], [4.3, '+4.30'], [6.3, '+6.30']]) { const yy = HP + YP - y; g.beginPath(); g.moveTo(W - 3.6, yy); g.lineTo(W - 1.9, yy); g.stroke(); F(g, .36); g.fillText(t, W - 1.8, yy + .12); } });
  const lEl = labels(D, HP, (g) => { tag(g, '02', 'WEST ELEVATION', 'THE FRONT: OAK DOOR, TRIANGLE VENTS, SLOT WINDOWS', .9, 1.5); g.lineWidth = .07; g.beginPath(); g.moveTo(0, HP + YP + .1); g.lineTo(D, HP + YP + .1); g.stroke(); });
  sheet = new THREE.Group(); scene.add(sheet);
  { const g = new THREE.PlaneGeometry(W + 3, D + 3); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (W + 3) - 1.5 * 0) / W - 3 / W * (1 - 0), 1 - ((1 - uv.getY(i)) * (D + 3)) / D);
    // the plan panel runs 3 m past the west and south edges as plain margin; its drawing sits in the W x D part
    for (let i = 0; i < uv.count; i++) { const px = g.attributes.position.getX(i) + (W + 3) / 2, pz = g.attributes.position.getZ(i) + (D + 3) / 2; uv.setXY(i, (px - 3) / W, 1 - pz / D); }
    P.plan = new THREE.Mesh(g, paperMat(tPlan, lPlan, 0xa29e96, wPlan, nNone, V3(X0, YP, Z1), V3(W, 0, 0), V3(0, 0, -D), uNoteN)); P.plan.position.set(cx - 1.5, YP, cz + 1.5); P.plan.receiveShadow = true; sheet.add(P.plan); }
  { P.north = new THREE.Group(); P.north.position.set(X0, YP, Z0); const g = new THREE.PlaneGeometry(W, HP); g.translate(W / 2, HP / 2, 0); const m = new THREE.Mesh(g, paperMat(tSec, lSec, 0xb5b1a9, wSec, nSec, V3(X0, YP, Z0), V3(W, 0, 0), V3(0, HP, 0), uNoteN)); m.receiveShadow = true; m.castShadow = true; P.north.add(m); sheet.add(P.north); }
  { P.east = new THREE.Group(); P.east.position.set(X1, YP, Z0); const g = new THREE.PlaneGeometry(D, HP); g.translate(D / 2, HP / 2, 0); g.rotateY(-Math.PI / 2); const m = new THREE.Mesh(g, paperMat(tEl, lEl, 0xaeaaa2, wEl, nEl, V3(X1, YP, Z0), V3(0, 0, D), V3(0, HP, 0), uNoteE)); m.receiveShadow = true; m.castShadow = true; P.east.add(m); sheet.add(P.east); }
  // the two option sheets: each plan is drawn from its own model, and the sheet slides out from under the main one
  { const keep = bounds.map((b) => b.constant); bounds.forEach((b) => { b.constant = 999; }); uGrow2.value = 1;
    for (const h of OPT) { const mx = h.o[0] + h.x0 + h.w / 2, mz = h.o[1] + h.z0 + h.d / 2, cam = ortho(-h.w / 2, h.w / 2, h.d / 2, -h.d / 2, V3(mx, 40, mz), V3(mx, 0, mz), V3(0, 0, -1), 80);
      const t = drawing(h.w * PXD, h.d * PXD, cam, kPlan, 1.4), wsh = colourWash(h.w * PXD, h.d * PXD, cam, kPlan); t.wrapS = t.wrapT = wsh.wrapS = wsh.wrapT = THREE.ClampToEdgeWrapping;
      const lab = labels(h.w, h.d, (g) => { tag(g, h.no, h.en, h.sub, .8, 1.5); g.font = `1.0px ${AR}`; g.textAlign = 'right'; g.fillText(h.ar, h.w - .8, 1.5); g.textAlign = 'left';
        g.lineWidth = .045; g.beginPath(); g.moveTo(.8, h.d - 1.3); g.lineTo(10.8, h.d - 1.3); g.stroke(); for (const m of [0, 5, 10]) { g.beginPath(); g.moveTo(.8 + m, h.d - 1.5); g.lineTo(.8 + m, h.d - 1.1); g.stroke(); F(g, .38); g.fillText(m + (m === 10 ? ' m' : ''), .9 + m, h.d - .55); }
        g.lineWidth = .03; g.textAlign = 'center'; g.beginPath(); g.moveTo(h.w - 1.4, h.d - .8); g.lineTo(h.w - 1.4, h.d - 3.0); g.lineTo(h.w - 1.8, h.d - 2.3); g.moveTo(h.w - 1.4, h.d - 3.0); g.lineTo(h.w - 1.0, h.d - 2.3); g.stroke(); F(g, .55, 500); g.fillText('N', h.w - 1.4, h.d - 3.25); g.textAlign = 'left'; });
      const gm = new THREE.PlaneGeometry(h.w, h.d); gm.rotateX(-Math.PI / 2);
      h.sheet = new THREE.Mesh(gm, paperMat(t, lab, 0xa29e96, wsh, nNone, V3(mx - h.w / 2, YP, mz + h.d / 2), V3(h.w, 0, 0), V3(0, 0, -h.d), uNoteN)); h.sheet.receiveShadow = true; h.sheet.layers.set(1);
      // its two paper walls: a section looking north on the north edge, the west elevation on the east edge
      { const hp = h.hp, x0 = mx - h.w / 2, x1 = mx + h.w / 2, z0 = mz - h.d / 2, yc = YP + hp / 2, none = PL(0, -1, 0, 99);
        const cS = ortho(-h.w / 2, h.w / 2, hp / 2, -hp / 2, V3(mx, yc, mz + 40), V3(mx, yc, mz), up, 40 + h.d / 2 + 1), cE = ortho(-h.d / 2, h.d / 2, hp / 2, -hp / 2, V3(mx - 50, yc, mz), V3(mx, yc, mz), up, 50 + h.w / 2 + 1);
        const kS = PL(0, 0, -1, h.o[1] + h.cut), tS = drawing(h.w * PXD, hp * PXD, cS, kS, .9, .93), wS = colourWash(h.w * PXD, hp * PXD, cS, kS), tE = drawing(h.d * PXD, hp * PXD, cE, none, .9, .93), wE = colourWash(h.d * PXD, hp * PXD, cE, none);
        for (const q of [tS, wS, tE, wE]) q.wrapS = q.wrapT = THREE.ClampToEdgeWrapping;
        const base = (g, L) => { g.lineWidth = .07; g.beginPath(); g.moveTo(0, hp + YP + .1); g.lineTo(L, hp + YP + .1); g.stroke(); };
        const lS = labels(h.w, hp, (g) => { tag(g, h.no + '1', 'SECTION', h.en + ' · LOOKING NORTH', .8, 1.4); base(g, h.w); }), lE = labels(h.d, hp, (g) => { tag(g, h.no + '2', 'WEST ELEVATION', h.en, .8, 1.4); base(g, h.d); });
        const gN = new THREE.PlaneGeometry(h.w, hp); gN.translate(h.w / 2, hp / 2, 0); const mN = new THREE.Mesh(gN, paperMat(tS, lS, 0xb5b1a9, wS, nNone, V3(x0, YP, z0), V3(h.w, 0, 0), V3(0, hp, 0), uNoteN)); mN.position.set(x0, YP, z0);
        const gE = new THREE.PlaneGeometry(h.d, hp); gE.translate(h.d / 2, hp / 2, 0); gE.rotateY(-Math.PI / 2); const mE = new THREE.Mesh(gE, paperMat(tE, lE, 0xaeaaa2, wE, nNone, V3(x1, YP, z0), V3(0, 0, h.d), V3(0, hp, 0), uNoteN)); mE.position.set(x1, YP, z0);
        h.walls = [mN, mE]; for (const m of h.walls) { m.receiveShadow = m.castShadow = true; m.layers.set(1); m.visible = false; sheet.add(m); } }
      h.home = V3(mx, YP - 0.012, mz); h.away = V3(mx + h.from[0] - h.o[0], YP - 0.012, mz + h.from[1] - h.o[1]); h.sheet.position.copy(h.away); h.sheet.visible = false; sheet.add(h.sheet); }
    bounds.forEach((b, i) => { b.constant = keep[i]; }); uGrow2.value = 0; for (const h of OPT) h.rise.constant = YP - 0.2; }
  for (const t of [tPlan, tSec, tEl, wPlan, wSec, wEl]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  sheet.traverse((o) => { o.frustumCulled = false; });
}
// the cutting mat, falling off into the dark
{ desk = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uL },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uL; varying vec3 vW; float grid(vec2 p, float s, float w){ vec2 g = abs(fract(p / s - .5) - .5) * s; vec2 f = fwidth(p); return 1. - smoothstep(0., 1., min(g.x / f.x, g.y / f.y) / w); }
      void main(){ float d = length(vW.xz - vec2(4., 18.)); vec2 dg = vec2(vW.x + vW.z, vW.x - vW.z); float g1 = grid(vW.xz, 1., 1.), g5 = grid(vW.xz, 5., 1.3), gd = grid(dg, 40., 1.);
        vec3 c = vec3(.165, .125, .092); c = mix(c, vec3(.36, .29, .225), g1 * .28); c = mix(c, vec3(.5, .41, .32), g5 * .55); c = mix(c, vec3(.45, .365, .285), gd * .3);
        c *= 1. - .93 * smoothstep(34., 110., d); c = mix(c, vec3(.078, .062, .048), smoothstep(70., 140., d));
        vec3 l = vec3(.63, .595, .545); l = mix(l, vec3(.53, .49, .44), g1 * .3); l = mix(l, vec3(.45, .41, .36), g5 * .5); l = mix(l, vec3(.49, .45, .40), gd * .3);
        l = mix(l, vec3(.76, .735, .695), smoothstep(40., 150., d));
        gl_FragColor = vec4(mix(c, l, uL), 0.); }` }));
  desk.position.y = YP - 0.03; desk.frustumCulled = false; scene.add(desk); }
// projector lines on the paper, and the red box the three fronts span
lines = new THREE.Group(); scene.add(lines);
const redMat = new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: 'void main(){ gl_FragColor = vec4(.52, .30, .13, 0.); }' });
const L = {}; for (const k of ['yN', 'yE', 'xP', 'xN', 'zP', 'zE']) { L[k] = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), redMat); L[k].frustumCulled = false; lines.add(L[k]); }
wire = new THREE.Group(); const WB = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), redMat); m.frustumCulled = false; wire.add(m); WB.push(m); } scene.add(wire);
buildSheet();
desk.layers.set(1); sheet.traverse((o) => o.layers.set(1)); lines.traverse((o) => o.layers.set(1)); wire.traverse((o) => o.layers.set(1)); camera.layers.enableAll();

// ---- beauty + ink, composed -----------------------------------------------------------------------------------------
let rtB, rtG; function targets() { const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr); rtB?.dispose(); rtG?.dispose(); rtB = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: TOUCH ? 0 : 4 }); rtG = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter }); }
targets();
const comp = new THREE.ShaderMaterial({ uniforms: { tB: { value: null }, tG: { value: null }, uPx: { value: new THREE.Vector2() }, uInk: { value: 1 }, uCam: { value: new THREE.Matrix4() }, uTan: { value: 1 }, uAsp: { value: 1 }, uF: { value: new THREE.Vector3() }, uRed: { value: 0 }, uSw: { value: -99 }, uSd: { value: SWD }, uExp: { value: tone ? tone[3] : 0.9 }, uVeil: { value: 0 }, uL }, vertexShader: VQ, fragmentShader: `
  uniform sampler2D tB, tG; uniform vec2 uPx, uSd; uniform float uInk, uTan, uAsp, uRed, uSw, uExp, uVeil, uL; uniform mat4 uCam; uniform vec3 uF; varying vec2 vUv;
  vec3 aces(vec3 x){ x *= uExp / .6; return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main(){ vec4 b = texture2D(tB, vUv); vec3 col = b.a < .5 ? b.rgb : pow(aces(b.rgb), vec3(1. / 2.2));
    if (uInk > .5) { vec4 g = texture2D(tG, vUv);
      if (g.a > .01) { float e = 0.;
        for (int i = 0; i < 4; i++) { float a = float(i) * 1.5708 + .7854; vec4 q = texture2D(tG, vUv + vec2(cos(a), sin(a)) * uPx * 1.2); e = max(e, length(q.xy - g.xy) * 1.5); e = max(e, abs(q.z - g.z) / max(g.z, 1.) * 26.); e = max(e, abs(q.a - g.a) * 3.); }
        float line = smoothstep(.2, .5, e); vec2 nxy = g.xy * 2. - 1.; vec3 n = vec3(nxy, sqrt(max(0., 1. - dot(nxy, nxy))));
        vec3 paper = vec3(.972, .962, .94), ink = vec3(.106, .102, .094); vec3 c = paper * (.86 + .14 * max(dot(n, normalize(vec3(-.35, .7, .6))), 0.));
        if (g.a < .75) c = mix(c, ink, .72); c = mix(c, mix(ink, vec3(.52, .30, .13), uRed * .85), line * .92);
        vec2 ndc = vUv * 2. - 1.; vec3 P = (uCam * vec4(ndc.x * uTan * uAsp * g.z, ndc.y * uTan * g.z, -g.z, 1.)).xyz;
        float band = .03 + g.z * .0011; float rl = max(max(1. - smoothstep(0., band, abs(P.y - uF.x)), 1. - smoothstep(0., band, abs(P.x - uF.y))), 1. - smoothstep(0., band, abs(P.z - uF.z)));
        c = mix(c, vec3(.52, .30, .13), rl * uRed);
        float r = dot(P.xz, uSd) - P.y * .35; float m = 1. - smoothstep(uSw - 1.6, uSw, r); float rim = 1. - smoothstep(0., .3 + g.z * .003, abs(r - uSw));
        col = mix(c, col, m); col = mix(col, vec3(1., .97, .9), rim * .75);
      } }
    vec2 v = vUv - .5; col *= 1. - .22 * (1. - .7 * uL) * smoothstep(.35, .85, length(v * vec2(1.25, 1.)));
    gl_FragColor = vec4(mix(col, mix(vec3(.106, .102, .094), vec3(.93, .92, .89), uL), uVeil), 1.); }` });

// ---- the camera: it only ever circles the maquette --------------------------------------------------------------------
const C = new THREE.Vector3(11, 2.0, 8.6), RAD = Math.PI / 180;
const KEYS = [ // s, azimuth (0 = east, 90 = south, 180 = west), elevation, distance, lens, look offset x, z
  [0, 131, 31, 64, 30, 0, 0], [0.08, 132, 29, 58, 30, 0, 0], [0.22, 134, 28, 55, 30, 0, 0], [0.34, 136, 27, 52, 30, 0, 0], [0.42, 137, 26, 50, 30, 0, 0], [0.52, 139, 22, 48, 30, 0, 0],
  [0.64, 178, 13, 46, 30, 0, 0], [0.78, 97, 31, 50, 30, 0, 0], [0.90, 122, 37, 54, 30, 0, 0], [1.0, 128, 60, 76, 30, -9, 1]];
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }, lerp = (a, b, t) => a + (b - a) * t;
const eye = new THREE.Vector3(), look = new THREE.Vector3();
function setCamera(T, s, r = 0) {
  let i = 0; while (i < KEYS.length - 2 && s > KEYS[i + 1][0]) i++; const a = KEYS[i], b = KEYS[i + 1], t = ss(a[0], b[0], s), k = (j) => lerp(a[j], b[j], t);
  const e = ss(0, 0.72, r), o = 1 - ss(0.6, 3.6, T), az = (k(1) - 4 * o - 10 * e) * RAD, el = (k(2) + 3 * o - 24 * e) * RAD, R = k(3) + 7 * o + 58 * e;
  if (window.__cam) { const c = window.__cam; look.set(c[0], c[1], c[2]); const a2 = c[3] * RAD, e3 = c[4] * RAD; eye.set(look.x + c[5] * Math.cos(e3) * Math.cos(a2), look.y + c[5] * Math.sin(e3), look.z + c[5] * Math.cos(e3) * Math.sin(a2)); camera.fov = c[6] || 30; camera.aspect = innerWidth / innerHeight; camera.near = 1; camera.far = c[5] + 300; camera.updateProjectionMatrix(); camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(true); return; }
  look.set(C.x + k(5) - 16 * e, C.y, C.z + k(6) + 17 * e); eye.set(look.x + R * Math.cos(el) * Math.cos(az), look.y + R * Math.sin(el), look.z + R * Math.cos(el) * Math.sin(az));
  camera.fov = k(4); camera.aspect = innerWidth / innerHeight; camera.near = Math.max(0.5, R - 60); camera.far = R + 260; camera.updateProjectionMatrix();
  camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(true);
}

// ---- the whole scene as a function of T (seconds since ready) and s (scroll, 0 to 1) ---------------------------------------
const S = { fy: 0, fx: 0, fz: 0, sweep: 0, trees: 0, red: 0 };
function edge(m, x1, y1, z1, x2, y2, z2, th) { m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); m.scale.set(Math.abs(x2 - x1) + th, Math.abs(y2 - y1) + th, Math.abs(z2 - z1) + th); m.updateMatrix(); m.matrixWorldNeedsUpdate = true; }
function apply(T, s, r = 0) {
  // the opening draws the three views and starts the walls rising; the first scroll stands them up
  uRev.value = ss(0.5, 2.2, T);
  const fold = lerp(lerp(0.22, 0.66, ss(0.8, 3.4, T)), 1, ss(0.0, 0.075, s));
  P.north.rotation.x = -Math.PI / 2 * (1 - fold); P.east.rotation.z = -Math.PI / 2 * (1 - fold); sheet.updateMatrixWorld(true);
  // projection: three fronts leave the paper together; the house exists inside the red box they span
  const a = ss(0.085, 0.31, s), b = ss(0.10, 0.33, s), c = ss(0.115, 0.345, s), done = s >= 0.345;
  const fy = lerp(YP + 0.02, TOPY, a), fx = lerp(X1 - 0.02, X0, b), fz = lerp(Z0 + 0.02, Z1, c);
  fronts[0].constant = done ? 99 : fy; fronts[1].constant = done ? 99 : -fx; fronts[2].constant = done ? 99 : fz;
  const red = ss(0.08, 0.10, s) * (1 - ss(0.345, 0.395, s)); comp.uniforms.uRed.value = red; comp.uniforms.uF.value.set(fy, fx, fz);
  Object.assign(S, { fy: fy - YP, fx: X1 - fx, fz: fz - Z0, red });
  lines.visible = wire.visible = red > 0.01; const th = 0.045, tw = 0.09 * (0.4 + 0.6 * red);
  edge(L.yN, X0, fy, Z0 + .03, X1, fy, Z0 + .03, th); edge(L.yE, X1 - .03, fy, Z0, X1 - .03, fy, Z1, th);
  edge(L.xP, fx, YP + .03, Z0, fx, YP + .03, Z1, th); edge(L.xN, fx, YP, Z0 + .03, fx, YP + HP, Z0 + .03, th);
  edge(L.zP, X0, YP + .03, fz, X1, YP + .03, fz, th); edge(L.zE, X1 - .03, YP, fz, X1 - .03, YP + HP, fz, th);
  const x0 = fx, x1 = X1 - .02, y0 = YP + .03, y1 = fy, z0 = Z0 + .02, z1 = fz; let n = 0;   // the box: 12 edges
  for (const [y, z] of [[y0, z0], [y1, z0], [y0, z1], [y1, z1]]) edge(WB[n++], x0, y, z, x1, y, z, tw);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) edge(WB[n++], x, y0, z, x, y1, z, tw);
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) edge(WB[n++], x, y, z0, x, y, z1, tw);
  // material: one sweep across the model; the planting stands up behind it
  const sw = ss(0.40, 0.52, s); comp.uniforms.uSw.value = lerp(SW0 - 2, SW1 + 2, sw); comp.uniforms.uInk.value = s < 0.525 ? 1 : 0;
  uSwP.value = lerp(SW0 - 4, SW1 + 14, ss(0.41, 0.56, s)); uNoteE.value = ss(0.50, 0.63, s) * 1.1; uNoteN.value = ss(0.60, 0.76, s) * 1.1;
  uGrow.value = ss(0.43, 0.53, s); S.sweep = sw; S.trees = Math.round(nTrees * ss(0.43, 0.52, s));
  comp.uniforms.uVeil.value = 1 - ss(0.0, 1.1, T);
  // the last beat: two more sheets slide out from under this one, and their houses rise out of their plans
  OPT.forEach((h, i) => { const sl = ss(0.02 + i * 0.1, 0.3 + i * 0.1, r); h.sheet.visible = r > 0.001; h.sheet.position.lerpVectors(h.away, h.home, sl); h.sheet.updateMatrix(); h.sheet.matrixWorldNeedsUpdate = true;
    const wr = ss(0.2 + i * 0.1, 0.46 + i * 0.1, r); for (const m of h.walls) { m.visible = r > 0.19; m.position.y = lerp(YP - h.hp - 0.3, YP, wr); m.updateMatrix(); m.matrixWorldNeedsUpdate = true; }
    h.rise.constant = lerp(YP - 0.2, h.top, ss(0.3 + i * 0.12, 0.64 + i * 0.12, r)); h.grp.visible = r > 0.28; });
  uGrow2.value = ss(0.5, 0.86, r); S.r = r;
  if (window.__solo) { const k = window.__solo; if (k !== 'safar') { fronts[0].constant = -50; const keep = new Set([sheet, desk, sun, sun.target, ...OPT.map((h) => h.grp)]); for (const o of scene.children) if (!keep.has(o) && !o.isLight) o.visible = false; } P.plan.visible = P.north.visible = P.east.visible = k === 'safar'; for (const h of OPT) if (h.key !== k) { h.grp.visible = h.sheet.visible = false; for (const m of h.walls) m.visible = false; } }
  setCamera(T, s, r);
}
let lastKey = '';
function render() {
  const key = state.s < 0.35 ? state.s.toFixed(4) + P.north.rotation.x.toFixed(3) : state.r > 0 && state.r < 0.9 ? 'r' + state.r.toFixed(4) : state.r >= 0.9 ? 'end' : 'still'; renderer.shadowMap.needsUpdate = key !== lastKey; renderer.shadowMap.autoUpdate = false; lastKey = key;
  renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(scene, camera);
  if (comp.uniforms.uInk.value > 0.5) geometryPass(rtG, camera, false, true);
  comp.uniforms.tB.value = rtB.texture; comp.uniforms.tG.value = rtG.texture; comp.uniforms.uPx.value.set(1 / rtG.width, 1 / rtG.height);
  comp.uniforms.uCam.value.copy(camera.matrixWorld); comp.uniforms.uTan.value = Math.tan(camera.fov * Math.PI / 360); comp.uniforms.uAsp.value = camera.aspect;
  quad.material = comp; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
}

// ---- the page: scroll, captions, the sheet bar ---------------------------------------------------------------------------
const K = 0.8, state = { T: 0, s: 0, r: 0 }, $ = (q) => document.querySelector(q);
const STAGES = [['01 / 05', 'Drawings', 0, 0.08], ['02 / 05', 'Projection', 0.08, 0.395], ['03 / 05', 'Material', 0.395, 0.56], ['04 / 05', 'The house', 0.56, 1.01], ['05 / 05', 'Three houses', 2, 3]];
document.querySelectorAll('.cap:not([data-abs])').forEach((c) => { c.dataset.a = String(+c.dataset.a * K); c.dataset.b = String(+c.dataset.b * K); }); document.querySelectorAll('[data-go]').forEach((a) => { a.dataset.go = String(+a.dataset.go * K); }); document.querySelectorAll('#bTrack u').forEach((u) => { u.style.left = parseFloat(u.style.left) * K + '%'; });
const tt = (x) => (window.I18N ? window.I18N.t(x) : x);
function page(T, s, r = 0, tot = s) {
  const hero = $('#hero'); hero.style.opacity = String(ss(2.6, 3.8, T) * (1 - ss(0.004, 0.04, s))); hero.style.pointerEvents = s < 0.02 && T > 3 ? 'auto' : 'none';
  const ld = $('#loader'); ld.style.opacity = String(1 - ss(0.5, 1.3, T)); ld.style.display = T > 1.4 ? 'none' : 'flex';
  document.body.classList.toggle('story', s > 0.03);
  const st = r > 0.01 ? STAGES[4] : STAGES.find((q) => s >= q[2] && s < q[3]) || STAGES[3]; $('#bSheet').textContent = st[0]; $('#bDraw').textContent = tt(st[1]);
  $('#bFill').style.width = (tot * 100).toFixed(2) + '%'; $('#bPct').textContent = String(Math.round(tot * 100));
  const out = 1 - ss(0.8, 0.94, r); $('#bar').style.opacity = String(ss(0.03, 0.07, s) * out);
  const ro = $('#read'); let html = '';
  if (s > 0.085 && s < 0.39) html = `<b>${tt('PLAN')}</b> ${S.fy.toFixed(2)} ${tt('M UP')} &nbsp; <b>${tt('ELEVATION')}</b> ${S.fx.toFixed(2)} ${tt('M OUT')} &nbsp; <b>${tt('SECTION')}</b> ${S.fz.toFixed(2)} ${tt('M ACROSS')}`;
  else if (s >= 0.395 && s < 0.56) html = `<b>${tt('SWEEP')}</b> ${Math.round(S.sweep * 100)} % &nbsp; <b>${tt('TREES')}</b> ${S.trees} ${tt('OF')} ${nTrees}`;
  else if (r > 0.02) html = `<b>${tt('A')}</b> ${tt('BAYT SAFAR')} 230 ${tt('M²')} &nbsp; <b>${tt('B')}</b> ${tt('BAYT MUSTAQIL')} 160 ${tt('M²')} &nbsp; <b>${tt('C')}</b> ${tt('BAYT MUSTATIL')} 140 ${tt('M²')}`;
  else if (s >= 0.56) html = `<b>${tt('BAYT SAFAR')}</b> 230 ${tt('M²')} &nbsp; <b>${tt('COURT')}</b> 7 × 7 ${tt('M')}`;
  ro.innerHTML = html; ro.style.opacity = html ? String(ss(0.03, 0.07, s) * out) : '0';
  document.querySelectorAll('.cap').forEach((c) => { const a = +c.dataset.a, b = +c.dataset.b; c.style.opacity = String(ss(a, a + 0.016, tot) * (1 - ss(b - 0.016, b, tot))); });
  const end = $('#end'); end.style.opacity = String(ss(0.8, 0.95, r)); end.style.pointerEvents = r > 0.9 ? 'auto' : 'none';
}
function frame(T, tot) { uL.value = document.documentElement.classList.contains('light') ? 1 : 0; const s = Math.min(1, tot / K), r = Math.min(1, Math.max(0, (tot - K) / (1 - K))); state.T = T; state.s = s; state.r = r; apply(T, s, r); page(T, s, r, tot); render(); }
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); targets(); });
window.__frame = (T, s) => { lastKey = ''; frame(T, s); lastKey = ''; frame(T, s); };
window.__frame1 = (T, s) => { frame(T, s); return canvas.toDataURL('image/jpeg', 0.9); };
// WhatsApp: set the number once here (digits only, country code first). While it is empty the buttons say so instead of opening a chat.
const WA = '966505599896';
document.querySelectorAll('[data-wa]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); if (!WA) { b.textContent = tt('WhatsApp number coming soon'); return; } const ar = window.I18N && window.I18N.lang === 'ar'; window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(tt('Hello, I am interested in ') + (ar ? tt(b.dataset.wa) : b.dataset.wa) + '.'), '_blank', 'noopener'); }));
document.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); document.querySelector(b.dataset.to).scrollIntoView({ behavior: 'smooth' }); }));
window.__ready = true;
if (!SHOT) {
  let s = Q.has('p') ? +Q.get('p') : 0; const t0 = performance.now() - (Q.has('p') ? 1e5 : 0);
  if (window.gsap && window.ScrollTrigger && window.Lenis) {
    gsap.registerPlugin(ScrollTrigger); const lenis = new Lenis({ lerp: 0.09 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    ScrollTrigger.create({ trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 0.5, onUpdate: (q) => { s = q.progress; } });
    document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const el = $('#story'); lenis.scrollTo(el.offsetTop + (el.offsetHeight - innerHeight) * +a.dataset.go, { duration: 2.4 }); }));
    if (Q.has('p')) requestAnimationFrame(() => { const el = $('#story'); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * s); });
  } else addEventListener('scroll', () => { const el = $('#story'); s = Math.min(1, Math.max(0, (scrollY - el.offsetTop) / (el.offsetHeight - innerHeight))); });
  const loop = (now) => { frame((now - t0) / 1000, s); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
}
