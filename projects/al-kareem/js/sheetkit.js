// The plan sheet: ink edges generated from the model, the CAD site linework,
// room names, dimension strings, door swings, the title block.
import * as THREE from 'three';
import { inkLines, INK } from './materials.js';
import { HALL, DOOR, GATE, P } from './kit.js';
import { SITE_LINES } from './sitelines.js';

const FONT_AR = '"Naskh", "Amiri", serif';
const FONT_MONO = '"Plex Mono", monospace';
const FONT_SERIF = '"Cormorant", serif';

// ---------------------------------------------------------------- edges from geometry
export function buildEdges(root, { clip, threshold = 28 } = {}) {
  root.updateMatrixWorld(true);
  const arrs = { auto: [], ext: [] };
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.edges === false) return;
    if (o.parent && o.parent.userData && o.parent.userData.side) return; // door leaves
    const eg = new THREE.EdgesGeometry(o.geometry, o.userData.edgeAngle || threshold);
    const p = eg.attributes.position;
    const zoneExt = o.material && o.material.userData.reveal && o.material.userData.reveal.uZone.value === 2;
    const arr = zoneExt ? arrs.ext : arrs.auto;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); arr.push(v.x, v.y, v.z); }
    eg.dispose();
  });
  const out = [];
  for (const [k, arr] of Object.entries(arrs)) {
    if (!arr.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const m = inkLines({ zone: k === 'ext' ? 'ext' : undefined });
    if (clip) m.clippingPlanes = clip;
    const l = new THREE.LineSegments(g, m); l.frustumCulled = false; l.renderOrder = 3;
    out.push(l);
  }
  return out;
}

export function linesFrom(arr, opts = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  const m = inkLines(opts);
  if (opts.clip) m.clippingPlanes = opts.clip;
  const l = new THREE.LineSegments(g, m); l.frustumCulled = false; l.renderOrder = 3;
  return l;
}

// ---------------------------------------------------------------- text
export function textPlane(spec, { mat }) {
  // spec: { lines:[{t, font, px, color, dir}], align, pad }
  const S = 4; // px per mm-ish supersampling factor
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const lines = spec.lines;
  let W = 0, H = 0;
  for (const l of lines) { ctx.font = `${l.weight || 500} ${l.px * S}px ${l.font}`; ctx.letterSpacing = `${(l.spacing || 0) * S}px`; const m = ctx.measureText(l.t); W = Math.max(W, m.width); H += l.px * S * (l.lh || 1.25); }
  ctx.letterSpacing = '0px';
  const pad = 6 * S;
  c.width = Math.ceil(W + pad * 2); c.height = Math.ceil(H + pad * 2);
  let y = pad;
  for (const l of lines) {
    ctx.font = `${l.weight || 500} ${l.px * S}px ${l.font}`;
    ctx.fillStyle = l.color || '#141416';
    ctx.textBaseline = 'top';
    ctx.direction = l.rtl ? 'rtl' : 'ltr';
    if (l.spacing) ctx.letterSpacing = `${l.spacing * S}px`;
    const m = ctx.measureText(l.t);
    const x = spec.align === 'left' ? pad + (l.rtl ? m.width : 0) : (c.width + (l.rtl ? m.width : -m.width)) / 2;
    ctx.fillText(l.t, x, y);
    ctx.letterSpacing = '0px';
    y += l.px * S * (l.lh || 1.25);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = mat(tex);
  return { tex, aspect: c.width / c.height, mat: m };
}

// a label lying on the floor at p (Vector2), height h metres of text block, rotated by ang
export function floorLabel(spec, p, hMetres, y, makeMat, ang = 0, maxW = Infinity) {
  const { aspect, mat } = textPlane(spec, { mat: makeMat });
  if (hMetres * aspect > maxW) hMetres = maxW / aspect;
  const g = new THREE.PlaneGeometry(hMetres * aspect, hMetres);
  g.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(p.x, y, p.y); mesh.rotation.y = ang;
  mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- sheet
export function buildSheet({ frame, street }) {
  const group = new THREE.Group();
  const labelMats = [];
  const makeMat = (tex) => { const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 }); labelMats.push(m); return m; };
  const { d1, d2 } = HALL;
  const L = (lines, p, h, y = 0.06, ang = 0) => group.add(floorLabel({ lines }, p, h * 1.3, y, makeMat, ang));
  const ar = (t, px = 15) => ({ t, font: FONT_AR, px, rtl: true, weight: 500 });
  const en = (t, px = 6.5, sp = 1.6) => ({ t, font: FONT_MONO, px, spacing: sp, weight: 500 });
  const dim = (t, px = 6) => ({ t, font: FONT_MONO, px, weight: 400 });

  const area = (HALL.len - 2 * HALL.t) * (HALL.wid - 2 * HALL.t);
  const fl = HALL.floor + 0.03;
  // rooms
  L([ar('قاعة الصلاة', 24), en('PRAYER HALL', 9, 2.4), dim(`${(HALL.len).toFixed(2)} × ${(HALL.wid).toFixed(2)} m  ·  ${area.toFixed(0)} m²`, 7.5)],
    HALL.center.clone().addScaledVector(d1, 5.2).addScaledVector(d2, -1.2), 3.2, fl);
  L([ar('المحراب', 13), en('MIHRAB', 6)], HALL.mihrab.clone().addScaledVector(d2, -2.3).addScaledVector(d1, 1.9), 1.6, fl);
  L([ar('القبة فوق', 11), dim('DOME ABOVE  Ø 6.50', 5.5)], HALL.dome.clone().addScaledVector(d1, -1.2), 1.3, fl);

  const nb = P(860, 450);
  L([ar('الميضأة ودورات المياه', 13), en('ABLUTION · WC', 6)], nb, 1.8);
  L([ar('مصعد', 10), en('LIFT', 5)], P(760, 640), 1.0, 0.06);
  L([ar('الملحق', 16), en('ANNEX', 7), dim('8 ROOMS · 31.40 × 6.00', 5)], P(260, 950), 2.6, 0.2);
  L([ar('مطبخ', 10), en('KITCHEN', 5)], P(250, 1110), 1.0, 0.2);
  L([ar('فناء', 12), en('GARDEN COURT', 5.5)], P(600, 1290), 1.5, 0.12);
  L([ar('الإمام', 10), en('IMAM', 5)], P(1760, 1100), 1.0, 0.06);
  L([ar('التحكم', 10), en('CONTROL', 5)], P(1500, 1560), 1.0, 0.06);
  L([ar('برج حجري', 11), en('STONE TOWER', 5)], P(1525, 1857), 1.3, 0.06);
  L([ar('المئذنة', 12), en('MINARET', 5.5), dim('H 21.50', 5)], P(560, 1830), 1.5, 0.06);
  L([ar('الكهرباء', 9), en('ELEC.', 5)], P(1705, 1980), 0.9, 0.06);
  // approach
  const ent = DOOR.pos.clone().addScaledVector(d1, 4.9).addScaledVector(d2, -3.6);
  L([ar('المدخل الرئيسي', 14), en('MAIN ENTRANCE', 6)], ent, 1.8);
  L([ar('القوس الحجري', 11), en('STONE ARCH', 5.5)], GATE.pos.clone().addScaledVector(d1, 2.2), 1.25);
  L([ar('الساحة', 16), en('FORECOURT', 7)], DOOR.pos.clone().addScaledVector(d1, 15).addScaledVector(d2, 10), 2.0);
  L([ar('مواقف السيارات', 16), en('PARKING', 7)], new THREE.Vector2(44, -26), 2.4);
  // street name along the street
  {
    const c = street.S(28, 10);
    const ang = -Math.atan2(street.sDir.y, street.sDir.x);
    L([ar('الشارع الجنوبي — عرض ٢٠٫٠٠ م', 18), en('SOUTH STREET · 20.00 m', 7)], c, 2.6, 0.06, ang);
  }

  // qibla arrow
  {
    const a = HALL.mihrab.clone().addScaledVector(d2, 3.2), b = HALL.mihrab.clone().addScaledVector(d2, 7.5);
    const h1 = b.clone().addScaledVector(d2, -0.9).addScaledVector(d1, 0.45), h2 = b.clone().addScaledVector(d2, -0.9).addScaledVector(d1, -0.45);
    group.userData.qibla = [a.x, 0.06, a.y, b.x, 0.06, b.y, b.x, 0.06, b.y, h1.x, 0.06, h1.y, b.x, 0.06, b.y, h2.x, 0.06, h2.y];
    L([ar('القبلة', 11), en('QIBLA', 5)], b.clone().addScaledVector(d2, 1.6), 1.2, 0.06, -Math.atan2(d2.y, d2.x) + Math.PI / 2 - Math.PI / 2);
  }

  // dimension strings
  const dimLines = [];
  const dimString = (a, b, off, nrm, text, y = 0.06) => {
    const A = a.clone().addScaledVector(nrm, off), B = b.clone().addScaledVector(nrm, off);
    const dir = B.clone().sub(A).normalize();
    dimLines.push(A.x, y, A.y, B.x, y, B.y);
    for (const [p, q] of [[a, A], [b, B]]) {
      const s = p.clone().addScaledVector(nrm, 0.6), e = q.clone().addScaledVector(nrm, 0.5);
      dimLines.push(s.x, y, s.y, e.x, y, e.y);
      const t1 = q.clone().addScaledVector(dir, 0.32).addScaledVector(nrm, 0.32), t2 = q.clone().addScaledVector(dir, -0.32).addScaledVector(nrm, -0.32);
      dimLines.push(t1.x, y, t1.y, t2.x, y, t2.y);
    }
    let ang = -Math.atan2(dir.y, dir.x);
    if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    const mid = A.clone().add(B).multiplyScalar(0.5).addScaledVector(nrm, 0.55);
    group.add(floorLabel({ lines: [dim(text, 7)] }, mid, 0.8, y, makeMat, ang));
  };
  const { A, B, C, D } = HALL;
  dimString(C, B, 4.6, d2, `${HALL.len.toFixed(2)}`);
  dimString(D, C, 21.5, d1, `${HALL.wid.toFixed(2)}`);
  dimString(D, DOOR.pos.clone().addScaledVector(d2, -DOOR.w / 2), 19.8, d1, `${(DOOR.s - DOOR.w / 2).toFixed(2)}`);
  dimString(DOOR.pos.clone().addScaledVector(d2, -DOOR.w / 2), DOOR.pos.clone().addScaledVector(d2, DOOR.w / 2), 19.8, d1, `${DOOR.w.toFixed(2)}`);
  {
    const TL = P(246, 99), BL = P(56, 1848);
    const dir = TL.clone().sub(BL).normalize();
    const n = new THREE.Vector2(dir.y, -dir.x);
    dimString(BL, TL, 3.0, n, `${TL.distanceTo(BL).toFixed(2)}`);
  }

  // door swings (plan convention)
  const sw = [];
  const arc = (c, r, a0, a1, y) => { const n = 18; for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n; sw.push(c.x + Math.cos(t0) * r, y, c.y + Math.sin(t0) * r, c.x + Math.cos(t1) * r, y, c.y + Math.sin(t1) * r); } };
  {
    const base = Math.atan2(d2.y, d2.x), inward = Math.atan2(-d1.y, -d1.x);
    const hL = DOOR.pos.clone().addScaledVector(d2, -DOOR.w / 2).addScaledVector(d1, -HALL.t * 0.5);
    const hR = DOOR.pos.clone().addScaledVector(d2, DOOR.w / 2).addScaledVector(d1, -HALL.t * 0.5);
    const r = DOOR.w / 2;
    arc(hL, r, base, base - Math.PI / 2, fl);
    arc(hR, r, base + Math.PI, base + Math.PI + Math.PI / 2, fl);
    for (const [h, s] of [[hL, 1], [hR, -1]]) { const e = h.clone().addScaledVector(d1, -r); sw.push(h.x, fl, h.y, e.x, fl, e.y); }
  }
  // dome outline (dashed), carpet rows
  const dash = [];
  for (let i = 0; i < 96; i += 2) {
    const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2;
    dash.push(HALL.dome.x + Math.cos(a0) * HALL.domeR, fl, HALL.dome.y + Math.sin(a0) * HALL.domeR, HALL.dome.x + Math.cos(a1) * HALL.domeR, fl, HALL.dome.y + Math.sin(a1) * HALL.domeR);
  }
  const rows = [];
  {
    const inW = HALL.wid - 2 * (HALL.t + 0.55), inL = HALL.len - 2 * (HALL.t + 0.55);
    const o = HALL.A.clone().addScaledVector(d2, HALL.t + 0.55).addScaledVector(d1, HALL.t + 0.55);
    // rows parallel to the qibla wall (along d1), counted back from it
    for (let k = 1; k * 1.33 < inW; k++) {
      const s = inW - k * 1.33;
      const a = o.clone().addScaledVector(d2, s), b = a.clone().addScaledVector(d1, inL);
      rows.push(a.x, HALL.floor + 0.02, a.y, b.x, HALL.floor + 0.02, b.y);
    }
  }

  // sheet frame + title block
  const fr = [];
  const { c, w, h, y = 0.04 } = frame;
  const rect = (x0, z0, x1, z1) => fr.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  rect(c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2);
  rect(c.x - w / 2 + 0.9, c.y - h / 2 + 0.9, c.x + w / 2 - 0.9, c.y + h / 2 - 0.9);
  const tbW = w * 0.24, tbH = h * 0.2;
  const tbx0 = c.x + w / 2 - 0.9 - tbW, tbz0 = c.y + h / 2 - 0.9 - tbH;
  rect(tbx0, tbz0, c.x + w / 2 - 0.9, c.y + h / 2 - 0.9);
  fr.push(tbx0, y, tbz0 + tbH * 0.52, c.x + w / 2 - 0.9, y, tbz0 + tbH * 0.52);
  fr.push(tbx0 + tbW * 0.5, y, tbz0 + tbH * 0.52, tbx0 + tbW * 0.5, y, c.y + h / 2 - 0.9);
  // title block text
  {
    const tx = tbx0 + tbW / 2, tz = tbz0 + tbH * 0.26;
    group.add(floorLabel({ lines: [
      { t: 'جامع الكريم', font: '"Amiri", serif', px: 30, rtl: true, weight: 700 },
      { t: 'AL-KAREEM MOSQUE · JEDDAH', font: FONT_SERIF, px: 12, spacing: 3, weight: 500 },
    ] }, new THREE.Vector2(tx, tz), tbH * 0.42, y + 0.01, makeMat, 0, tbW * 0.9));
    group.add(floorLabel({ lines: [
      en('GROUND FLOOR PLAN', 6, 1.4), dim('CUT AT +1.20 m', 5.5),
    ], align: 'left' }, new THREE.Vector2(tbx0 + tbW * 0.25, tbz0 + tbH * 0.76), tbH * 0.3, y + 0.01, makeMat, 0, tbW * 0.45));
    group.add(floorLabel({ lines: [
      en('SHEET A-101', 6, 1.4), dim('NOV 2026  ·  1:200', 5.5),
    ], align: 'left' }, new THREE.Vector2(tbx0 + tbW * 0.75, tbz0 + tbH * 0.76), tbH * 0.3, y + 0.01, makeMat, 0, tbW * 0.45));
  }
  // scale bar 0–10 m
  {
    const x0 = c.x - w / 2 + 3.5, z0 = c.y + h / 2 - 3.2;
    for (let i = 0; i <= 10; i += 1) fr.push(x0 + i, y, z0, x0 + i, y, z0 - (i % 5 === 0 ? 0.8 : 0.4));
    fr.push(x0, y, z0, x0 + 10, y, z0);
    group.add(floorLabel({ lines: [dim('0        5       10 m', 6)] }, new THREE.Vector2(x0 + 5, z0 + 0.8), 0.9, y, makeMat));
  }

  const lines = [];
  lines.push(linesFrom(dimLines, { fade: 1 }));
  lines.push(linesFrom(sw, { fade: 1 }));
  lines.push(linesFrom(dash, { fade: 1 }));
  lines.push(linesFrom(fr, { fade: 1 }));
  lines.push(linesFrom(group.userData.qibla, { fade: 1 }));
  const rowsLine = linesFrom(rows, { fade: 0.35 });
  lines.forEach((l) => group.add(l));
  group.add(rowsLine);
  return { group, labelMats, annoLines: lines, rowsLine };
}

// CAD site linework on the ground
export function buildSiteLines() {
  const out = new THREE.Group();
  const style = { edge: 1, prop: 0.45, plant: 0.6, hatch: 0.28, park: 0.4, red: 0.22 };
  for (const [k, a] of Object.entries(SITE_LINES)) {
    const arr = new Float32Array((a.length / 2) * 3);
    for (let i = 0, j = 0; i < a.length; i += 2, j += 3) { arr[j] = a[i]; arr[j + 1] = 0.03; arr[j + 2] = a[i + 1]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = inkLines({ zone: 'ext', fade: style[k] ?? 0.5 });
    const l = new THREE.LineSegments(g, m); l.frustumCulled = false; l.renderOrder = 3;
    out.add(l);
  }
  return out;
}
