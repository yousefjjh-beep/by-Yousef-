import * as THREE from 'three';
import { makeSky } from './sky.js';
import { buildMaterials, REVEAL, PAPER, revealMesh } from './materials.js';
import { loadModel, buildSite, HALL, DOOR, PORCH, FLOOR, EYE, W2, W3, DU, DV } from './skpmodel.js';
import { buildEdges } from './sheetkit.js';
import { buildSheetK } from './sheetK.js';

const RECORD = new URLSearchParams(location.search).has('record');
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: RECORD, powerPreference: 'high-performance' });
renderer.setPixelRatio(RECORD ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.74;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.localClippingEnabled = true;
renderer.setClearColor(PAPER, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(1.2, innerWidth / innerHeight, 1, 10000);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (p, y = 0) => new THREE.Vector3(p.x, y, p.y);

async function init() {
  await Promise.all([
    document.fonts.load('500 40px "Naskh"', 'قاعة'), document.fonts.load('700 40px "Amiri"', 'جامع'),
    document.fonts.load('500 40px "Plex Mono"'), document.fonts.load('400 40px "Plex Mono"'), document.fonts.load('500 40px "Cormorant"'),
  ]);
  const M = await buildMaterials();
  const model = await loadModel(M);
  const site = buildSite(M, model);
  scene.add(model.root);

  // reveal zones: the prayer hall is its own room
  REVEAL.uHallC.value.copy(HALL.center);
  REVEAL.uHallU.value.copy(DU);
  REVEAL.uHallHalf.value.copy(HALL.half);
  REVEAL.uHallTop.value = HALL.roof - 0.25;
  REVEAL.uDomeC.value.copy(HALL.domeC); REVEAL.uDomeR.value = HALL.dome.r; REVEAL.uDomeTop.value = 15.5;

  // the section plane
  const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), FLOOR + 1.2);
  Object.values(M).forEach((m) => { m.clippingPlanes = [cut]; m.clipShadows = false; });
  for (const k of ['ceiling', 'plaster', 'walnut']) M[k].userData.reveal.uDomeHole.value = 1;

  // name in bronze: on the porch and on the low sign wall
  const nameMat = (() => {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 300;
    const ctx = c.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 210px "Amiri"'; ctx.fillStyle = '#fff'; ctx.fillText('جامع الكريم', 700, 150);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.MeshStandardMaterial({ color: 0xc9a05a, metalness: 0.95, roughness: 0.3, alphaMap: tex, transparent: true, emissive: 0x2e1d06, emissiveIntensity: 0.5 });
    revealMesh(m, { zone: 'ext', poche: false }); m.clippingPlanes = [cut]; return m;
  })();
  {
    const p = model.anim.plaque;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.0), nameMat); m.position.set(p.pos.x, p.y, p.pos.y); m.rotation.y = p.rotY; m.userData.edges = false; scene.add(m);
    const s = site.signPos; const m2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), nameMat); m2.position.set(s.x, FLOOR + 0.72, s.y); m2.rotation.y = p.rotY; scene.add(m2);
  }

  // ink
  buildEdges(model.root, { clip: [cut] }).forEach((l) => scene.add(l));

  // framing of the sheet: building centre, straight down
  const T0 = W2(34, 28);
  const REQ = { w: 96, h: 60 };
  const aspect = innerWidth / innerHeight;
  const Hvis = Math.max(REQ.w / aspect, REQ.h);
  const frame = { c: T0, w: Hvis * aspect * 0.965, h: Hvis * 0.94 };
  const sheet = buildSheetK({ frame });
  scene.add(sheet.group);

  // late afternoon from the west-south-west (bearing 250°, 13° up): raking across the front
  const bearing = THREE.MathUtils.degToRad(250);
  const sunDir = new THREE.Vector3(Math.sin(bearing), Math.tan(THREE.MathUtils.degToRad(13)), -Math.cos(bearing)).normalize();
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.76, 0.54), 6.2);
  sun.position.copy(V3(HALL.center)).addScaledVector(sunDir, 170); sun.target.position.copy(V3(HALL.center));
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -68, right: 68, top: 68, bottom: -68, near: 40, far: 340 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xc4d0e2, 0xc49a6c, 0.32); scene.add(hemi);
  const lamp = new THREE.PointLight(0xffc27a, 0, 0, 2); lamp.position.set(HALL.domeC.x, 6.0, HALL.domeC.y); scene.add(lamp);
  const fills = [0.22, 0.78].map((f) => { const l = new THREE.PointLight(0xffc68a, 0, 0, 2); const q = W2(lerp(HALL.u0, HALL.u1, f), (HALL.v0 + HALL.v1) / 2); l.position.set(q.x, 8.2, q.y); scene.add(l); return l; });

  // mihrab: a spot on the niche and the basmala in gilded letters above it
  const mihSpot = new THREE.SpotLight(0xffd29a, 0, 15, 0.42, 0.7, 2);
  {
    const sp = W2(HALL.mihrab.u, HALL.v0 + 3.4), tg = W2(HALL.mihrab.u, HALL.v0 - 0.8);
    mihSpot.position.set(sp.x, 8.6, sp.y); mihSpot.target.position.set(tg.x, 2.2, tg.y); scene.add(mihSpot, mihSpot.target);
    const c = document.createElement('canvas'); c.width = 1600; c.height = 260;
    const ctx = c.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 170px "Amiri"'; ctx.fillStyle = '#fff'; ctx.fillText('بسم الله الرحمن الرحيم', 800, 135);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd6ad62, metalness: 0.95, roughness: 0.3, alphaMap: new THREE.CanvasTexture(c), transparent: true, emissive: 0x3a2508, emissiveIntensity: 0.6 });
    revealMesh(mat, { poche: false }); mat.clippingPlanes = [cut];
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.59), mat);
    const q = W2(HALL.mihrab.u, HALL.v0 + 0.33); pl.position.set(q.x, 5.6, q.y); pl.rotation.y = Math.atan2(DV.x, DV.y); scene.add(pl);
  }
  // dusk: warm uplights grazing the front, the porch, the minaret and the arcade
  const upl = [];
  for (const [fu, fv, tu, tv, th] of [[17.4, 20.9, 19.0, 20.9, 8.5], [17.4, 23.5, 19.0, 23.5, 8.5], [14.6, 28.4, 15.74, 28.4, 5], [14.6, 34.6, 15.74, 34.6, 5],
    [21.0, 9.6, 23.5, 11.5, 20], [27.6, 13.4, 25.8, 13.6, 16], [17.4, 16.0, 19.0, 16.5, 9], [17.4, 34.0, 19.0, 34.5, 9]]) {
    const l = new THREE.SpotLight(0xffb66e, 0, th + 8, 0.38, 0.75, 1.6);
    const a = W2(fu, fv), b = W2(tu, tv); l.position.set(a.x, FLOOR + 0.15, a.y); l.target.position.set(b.x, th, b.y);
    scene.add(l, l.target); upl.push(l);
  }
  const sunBase = { dir: sunDir.clone(), col: sun.color.clone() };

  const sky = makeSky(sunDir); const su = sky.material.uniforms;
  { const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene(); es.add(sky); su.uMix.value = 1; su.uLinear.value = 1;
    scene.environment = pm.fromScene(es, 0, 0.1, 6000).texture; scene.environmentIntensity = 0.4; su.uMix.value = 0; su.uLinear.value = 0; es.remove(sky); }
  scene.add(sky);

  // ---------------- camera path B: the street corner, the arcade and the minaret, along the front, into the porch
  const tanH = (deg) => Math.tan(THREE.MathUtils.degToRad(deg) / 2);
  const P3 = (u, v, h) => W3(u, v, h);
  const K = [
    { p: 0.24, pos: V3(T0, Hvis / (2 * tanH(30))), tgt: V3(T0, 0), fov: 30 },
    { p: 0.33, pos: P3(-22, -24, 56), tgt: P3(30, 26, 4), fov: 38 },
    { p: 0.41, pos: P3(-2, -4, 10), tgt: P3(21, 22, 7), fov: 52 },
    { p: 0.47, pos: P3(5.5, 5.0, EYE), tgt: P3(21, 21, 6.4), fov: 62 },
    { p: 0.55, pos: P3(10.5, 11.0, EYE), tgt: P3(19.5, 19.5, 5.2), fov: 60 },
    { p: 0.62, pos: P3(15.6, 18.0, EYE), tgt: P3(17.4, 30.0, 4.0), fov: 58 },
    { p: 0.69, pos: P3(17.3, 24.4, EYE), tgt: P3(17.6, 32.0, 2.8), fov: 58 },
    { p: 0.755, pos: P3(17.2, 29.2, EYE), tgt: P3(19.6, 30.05, 2.6), fov: 60 },
    { p: 0.81, pos: P3(19.4, 30.05, EYE), tgt: P3(26, 29.6, 2.9), fov: 60 },
    { p: 0.87, pos: P3(20.6, 30.0, EYE), tgt: P3(31, 26.5, 3.6), fov: 60 },
    { p: 0.94, pos: P3(23.4, 28.8, EYE), tgt: P3(34.5, 20.5, 4.2), fov: 62 },
    { p: 1.0, pos: P3(25.6, 27.8, EYE), tgt: P3(34.5, 18.9, 3.8), fov: 62 },
  ];
  const posC = new THREE.CatmullRomCurve3(K.map((k) => k.pos), false, 'centripetal');
  const tgtC = new THREE.CatmullRomCurve3(K.map((k) => k.tgt), false, 'centripetal');
  function placeCamera(p) {
    let fov; const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
    if (p <= K[0].p) {
      const e = ease(seg(p, 0.05, K[0].p));
      const t = Math.exp(lerp(Math.log(tanH(1.2)), Math.log(tanH(30)), e));
      fov = THREE.MathUtils.radToDeg(2 * Math.atan(t)); pos.copy(V3(T0, Hvis / (2 * t))); tgt.copy(V3(T0, 0));
    } else {
      let i = 0; while (i < K.length - 2 && p > K[i + 1].p) i++;
      const t = clamp01((p - K[i].p) / (K[i + 1].p - K[i].p));
      const u = (i + (i === 0 ? ease(t) : t)) / (K.length - 1);
      posC.getPoint(u, pos); tgtC.getPoint(u, tgt); fov = lerp(K[i].fov, K[i + 1].fov, ease(t));
    }
    camera.fov = fov; camera.position.copy(pos);
    const dir = tgt.clone().sub(pos).normalize();
    const k = THREE.MathUtils.smoothstep(dir.y, -0.995, -0.75);
    camera.up.set(0, 0, -1).lerp(new THREE.Vector3(0, 1, 0), k).normalize();
    camera.lookAt(tgt);
    const h = Math.max(0, pos.y);
    camera.near = Math.max(0.05, (h - 40) * 0.85); camera.far = Math.max(700, h + 400);
    camera.updateProjectionMatrix();
  }

  // ---------------- checkpoint 2: under the dome, the mihrab, then the dusk pull-out
  const KB = [
    { p: 0.0, pos: K[K.length - 1].pos, tgt: K[K.length - 1].tgt, fov: 62 },
    { p: 0.16, pos: P3(32.6, 25.8, 2.0), tgt: P3(34.4, 22.6, 7.6), fov: 62 },
    { p: 0.3, pos: P3(34.0, 25.0, 1.8), tgt: P3(34.45, 22.6, 13.5), fov: 68 },
    { p: 0.44, pos: P3(34.5, 24.4, EYE), tgt: P3(34.5, 17.8, 3.2), fov: 56 },
    { p: 0.54, pos: P3(34.5, 22.9, EYE), tgt: P3(34.5, 17.8, 3.3), fov: 52 },
    { p: 0.65, pos: P3(34.5, 29.0, 6.0), tgt: P3(34.5, 19.6, 2.4), fov: 58 },
    { p: 0.77, pos: P3(36.5, 38.0, 30), tgt: P3(34.0, 25.0, 1.0), fov: 50 },
    { p: 0.89, pos: P3(-4, -8, 30), tgt: P3(30, 24, 6), fov: 46 },
    { p: 1.0, pos: P3(-16, -17, 20), tgt: P3(30, 25, 9), fov: 44 },
  ];
  const posB = new THREE.CatmullRomCurve3(KB.map((k) => k.pos), false, 'centripetal');
  const tgtB = new THREE.CatmullRomCurve3(KB.map((k) => k.tgt), false, 'centripetal');
  function placeCameraB(p) {
    let i = 0; while (i < KB.length - 2 && p > KB[i + 1].p) i++;
    const t = clamp01((p - KB[i].p) / (KB[i + 1].p - KB[i].p));
    const u = (i + ease(t) * 0.35 + t * 0.65) / (KB.length - 1);
    const pos = posB.getPoint(u), tgt = tgtB.getPoint(u);
    camera.fov = lerp(KB[i].fov, KB[i + 1].fov, ease(t));
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(tgt);
    camera.near = 0.05; camera.far = 2000; camera.updateProjectionMatrix();
  }
  const SPLIT = 0.62;

  // ---------------- timeline
  const extO = P3(5.5, 5.0, 0), extD = P3(21, 21, 0).sub(extO).setY(0).normalize();
  REVEAL.uExtOrigin.value.copy(extO); REVEAL.uExtDir.value.copy(extD);
  REVEAL.uHallOrigin.value.copy(P3(DOOR.u - 0.2, DOOR.vc, 0)); REVEAL.uHallDir.value.set(DU.x, 0, DU.y);
  const captions = [...document.querySelectorAll('.caption')].map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const bar = document.querySelector('.progress span');
  let lastDoor = -1;
  // swing the leaves into the hall whichever way the frame is handed
  const swing = (() => {
    const lf = model.anim.leaves[0]; lf.rotation.y = lf.userData.base + 0.6; lf.updateMatrixWorld(true);
    const tip = new THREE.Vector3(-lf.userData.side * 1.4, 1, 0).applyMatrix4(lf.matrixWorld);
    const h = new THREE.Vector3().setFromMatrixPosition(lf.matrixWorld);
    lf.rotation.y = lf.userData.base;
    return ((tip.x - h.x) * DU.x + (tip.z - h.z) * DU.y) > 0 ? 1 : -1;   // sign that sends side −1 inward
  })();
  function applyA(p) {
    const r = ease(seg(p, 0.07, 0.31));
    cut.constant = FLOOR + 1.2 + r * r * 60;
    const lab = 1 - seg(p, 0.06, 0.12);
    sheet.labelMats.forEach((m) => (m.opacity = lab));
    sheet.annoLines.forEach((l) => (l.material.userData.reveal.uFade.value = lab));
    placeCamera(p);
    REVEAL.uExtFront.value = p < 0.445 ? -1e4 : lerp(-8, 130, ease(seg(p, 0.445, 0.64))) + (p > 0.9 ? 600 : 0);
    su.uMix.value = ease(seg(p, 0.45, 0.58));
    const da = ease(seg(p, 0.73, 0.8)) * THREE.MathUtils.degToRad(84);
    for (const lf of model.anim.leaves) lf.rotation.y = lf.userData.base - lf.userData.side * da * swing;
    if (Math.abs(da - lastDoor) > 1e-4) { renderer.shadowMap.needsUpdate = true; lastDoor = da; }
    REVEAL.uHallFront.value = p < 0.79 ? -1e4 : lerp(-1, 40, ease(seg(p, 0.79, 0.96)));
    lamp.intensity = 90 * ease(seg(p, 0.8, 0.95));
    fills.forEach((l) => (l.intensity = 40 * ease(seg(p, 0.8, 0.95))));
  }
  let lastDusk = -1;
  function apply(P) {
    const pa = clamp01(P / SPLIT), pb = clamp01((P - SPLIT) / (1 - SPLIT));
    applyA(pa);
    REVEAL.uPocheOn.value = cut.constant < 30 ? 1 : 0;
    if (P > SPLIT) {
      placeCameraB(pb);
      // the section cut comes down below the roof to let the camera rise out of the hall
      const down = ease(seg(pb, 0.55, 0.64)), up = ease(seg(pb, 0.84, 0.95));
      cut.constant = lerp(FLOOR + 61.2, 8.2, down * (1 - up));
    }
    const u = ease(seg(pb, 0.55, 0.95));
    if (Math.abs(u - lastDusk) > 1e-4) {
      lastDusk = u;
      const el = THREE.MathUtils.degToRad(lerp(13, 1.2, u));
      const dir = sunBase.dir.clone(); dir.y = 0; dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.25 * u);
      dir.y = Math.tan(el); dir.normalize();
      sun.position.copy(V3(HALL.center)).addScaledVector(dir, 170);
      sun.intensity = lerp(6.2, 1.4, u);
      sun.color.copy(sunBase.col).lerp(new THREE.Color(1.0, 0.45, 0.25), u);
      su.uSun.value.copy(dir); su.uDusk.value = u;
      hemi.intensity = lerp(0.32, 0.2, u); hemi.color.set(0xc4d0e2).lerp(new THREE.Color(0x6d7aa8), u);
      scene.environmentIntensity = lerp(0.4, 0.2, u);
      renderer.toneMappingExposure = lerp(0.74, 1.3, u);
      M.glass.emissiveIntensity = lerp(0.16, 2.6, u);
      M.lantern.emissiveIntensity = lerp(2.2, 3.2, u);
      upl.forEach((l) => (l.intensity = 260 * u));
      renderer.shadowMap.needsUpdate = true;
    }
    mihSpot.intensity = 55 * ease(seg(pa, 0.86, 1.0));
    for (const c of captions) {
      const o = Math.min(seg(P, c.a, c.a + 0.012), 1 - seg(P, c.b - 0.012, c.b));
      c.el.style.opacity = o.toFixed(3); c.el.style.transform = `translateY(${(1 - o) * 12}px)`;
      c.el.classList.toggle('paper', P < 0.47 * SPLIT);
    }
    bar.style.height = `${(P * 100).toFixed(2)}%`;
  }
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; });

  renderer.shadowMap.needsUpdate = true;
  apply(0); renderer.compile(scene, camera); renderer.render(scene, camera);
  document.getElementById('loading').classList.add('done');
  if (RECORD) {
    window.__seek = (p) => { apply(p); renderer.render(scene, camera); return true; };
    window.__dbg = { renderer, scene, camera, THREE };
    window.__ready = true; return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  const state = { p: 0 };
  gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { trigger: '#track', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
  let last = -1;
  gsap.ticker.add(() => { if (Math.abs(state.p - last) < 1e-5) return; last = state.p; apply(state.p); renderer.render(scene, camera); });
}
init().catch((e) => { console.error(e); const l = document.getElementById('loading'); l.textContent = 'Error: ' + e.message; });
