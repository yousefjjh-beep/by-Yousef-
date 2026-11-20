// Plan sheet for the SketchUp-driven model: labels, dimensions, title block.
import * as THREE from 'three';
import { floorLabel, linesFrom } from './sheetkit.js';
import { W2, DU, DV, HALL, DOOR, PORCH, FLOOR } from './skpmodel.js';

const FONT_AR = '"Naskh", "Amiri", serif', FONT_MONO = '"Plex Mono", monospace', FONT_SERIF = '"Cormorant", serif';

export function buildSheetK({ frame }) {
  const group = new THREE.Group();
  const labelMats = [];
  const makeMat = (tex) => { const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }); labelMats.push(m); return m; };
  const ar = (t, px = 15) => ({ t, font: FONT_AR, px, rtl: true, weight: 500 });
  const en = (t, px = 6.5, sp = 1.6) => ({ t, font: FONT_MONO, px, spacing: sp, weight: 500 });
  const dim = (t, px = 6) => ({ t, font: FONT_MONO, px, weight: 400 });
  const y0 = FLOOR + 0.05;
  const L = (lines, u, v, h, y = y0, ang = 0) => group.add(floorLabel({ lines }, W2(u, v), h * 1.3, y, makeMat, ang));
  const wid = HALL.u1 - HALL.u0, dep = HALL.v1 - HALL.v0;
  L([ar('قاعة الصلاة', 26), en('PRAYER HALL', 9, 2.4), dim(`${wid.toFixed(2)} × ${dep.toFixed(2)} m  ·  ${(wid * dep).toFixed(0)} m²`, 7.5)], 37.5, 30.5, 3.0);
  L([ar('القبة فوق', 11), dim('DOME ABOVE  Ø 6.00', 5.5)], HALL.dome.u, HALL.dome.v + 4.0, 1.3);
  L([ar('المحراب', 12), en('MIHRAB', 5.5)], 34.5, 15.6, 1.4);
  L([ar('المدخل', 12), en('ENTRANCE PORCH', 5.5)], 13.0, 31.6, 1.4);
  L([ar('المئذنة', 12), en('MINARET', 5.5), dim('H 21.00', 5)], 20.6, 4.2, 1.5);
  L([ar('الرواق', 12), en('STONE ARCADE', 5.5)], 15.0, 11.5, 1.3);
  L([ar('ملحق الخدمات', 12), en('SERVICE BLOCK', 5.5)], 27.5, 8.4, 1.3);
  L([ar('الملحق', 15), en('ANNEX', 7), dim('36.80 × 6.90  ·  H 10.80', 5)], 28.5, 45.0, 2.2);
  L([ar('مدخل شمالي', 11), en('NORTH ENTRANCE', 5)], 57.5, 31.5, 1.2);
  L([ar('الساحة', 16), en('FORECOURT', 7)], 9.0, 27.0, 1.8);

  // dimension strings in building axes
  const dimLines = [];
  const dimString = (a, b, nrm, off, text) => {
    const A = a.clone().addScaledVector(nrm, off), B = b.clone().addScaledVector(nrm, off), dir = B.clone().sub(A).normalize();
    dimLines.push(A.x, y0, A.y, B.x, y0, B.y);
    for (const [p, q] of [[a, A], [b, B]]) {
      const s = p.clone().addScaledVector(nrm, 0.6), e = q.clone().addScaledVector(nrm, 0.5); dimLines.push(s.x, y0, s.y, e.x, y0, e.y);
      const t1 = q.clone().addScaledVector(dir, 0.32).addScaledVector(nrm, 0.32), t2 = q.clone().addScaledVector(dir, -0.32).addScaledVector(nrm, -0.32);
      dimLines.push(t1.x, y0, t1.y, t2.x, y0, t2.y);
    }
    let ang = -Math.atan2(dir.y, dir.x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    const mid = A.clone().add(B).multiplyScalar(0.5).addScaledVector(nrm, 0.6);
    group.add(floorLabel({ lines: [dim(text, 7)] }, mid, 0.85, y0, makeMat, ang));
  };
  dimString(W2(HALL.u0, HALL.v1), W2(HALL.u1, HALL.v1), DV, 9.5, (HALL.u1 - HALL.u0).toFixed(2));
  dimString(W2(HALL.u1, HALL.v0), W2(HALL.u1, HALL.v1), DU, 7.5, (HALL.v1 - HALL.v0).toFixed(2));
  dimString(W2(PORCH.u0, PORCH.v1), W2(PORCH.u0, PORCH.v0), DU.clone().negate(), 4.5, (PORCH.v1 - PORCH.v0).toFixed(2));
  dimString(W2(DOOR.u, DOOR.v0), W2(DOOR.u, DOOR.v1), DU.clone().negate(), 7.5, (DOOR.v1 - DOOR.v0).toFixed(2));

  // door swing, dome outline (dashed), carpet rows, qibla arrow
  const sw = [];
  const arc = (c, r, a0, a1) => { const n = 18; for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n; sw.push(c.x + Math.cos(t0) * r, y0, c.y + Math.sin(t0) * r, c.x + Math.cos(t1) * r, y0, c.y + Math.sin(t1) * r); } };
  {
    const r = (DOOR.v1 - DOOR.v0) / 2, aV = Math.atan2(DV.y, DV.x), aU = Math.atan2(DU.y, DU.x);
    const h0 = W2(DOOR.u, DOOR.v0), h1 = W2(DOOR.u, DOOR.v1);
    const sh = (d) => Math.atan2(Math.sin(d), Math.cos(d));
    arc(h0, r, aU, aU + sh(aV - aU)); arc(h1, r, aU, aU + sh(aV + Math.PI - aU));
    for (const h of [h0, h1]) { const e = h.clone().addScaledVector(DU, r); sw.push(h.x, y0, h.y, e.x, y0, e.y); }
  }
  const dash = [];
  for (let i = 0; i < 96; i += 2) { const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2; const c = HALL.domeC; dash.push(c.x + Math.cos(a0) * HALL.dome.r, y0, c.y + Math.sin(a0) * HALL.dome.r, c.x + Math.cos(a1) * HALL.dome.r, y0, c.y + Math.sin(a1) * HALL.dome.r); }
  const rows = [];
  for (let v = HALL.v0 + 0.8 + 1.33; v < HALL.v1 - 0.8; v += 1.33) { const a = W2(HALL.u0 + 0.8, v), b = W2(HALL.u1 - 0.8, v); rows.push(a.x, FLOOR + 0.03, a.y, b.x, FLOOR + 0.03, b.y); }
  const q = [];
  {
    const a = W2(HALL.mihrab.u, HALL.v0 - 4.6), b = W2(HALL.mihrab.u, HALL.v0 - 8.6);
    const h1 = b.clone().addScaledVector(DV, 0.9).addScaledVector(DU, 0.45), h2 = b.clone().addScaledVector(DV, 0.9).addScaledVector(DU, -0.45);
    q.push(a.x, y0, a.y, b.x, y0, b.y, b.x, y0, b.y, h1.x, y0, h1.y, b.x, y0, b.y, h2.x, y0, h2.y);
    L([ar('القبلة', 11), en('QIBLA', 5)], HALL.mihrab.u + 1.6, HALL.v0 - 9.6, 1.1);
  }
  // frame, title block, scale bar
  const fr = []; const { c, w, h } = frame, fy = 0.6;
  const rect = (x0, z0, x1, z1) => fr.push(x0, fy, z0, x1, fy, z0, x1, fy, z0, x1, fy, z1, x1, fy, z1, x0, fy, z1, x0, fy, z1, x0, fy, z0);
  rect(c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2);
  rect(c.x - w / 2 + 0.8, c.y - h / 2 + 0.8, c.x + w / 2 - 0.8, c.y + h / 2 - 0.8);
  const tbW = w * 0.25, tbH = h * 0.2, tbx0 = c.x + w / 2 - 0.8 - tbW, tbz0 = c.y + h / 2 - 0.8 - tbH;
  rect(tbx0, tbz0, c.x + w / 2 - 0.8, c.y + h / 2 - 0.8);
  fr.push(tbx0, fy, tbz0 + tbH * 0.52, c.x + w / 2 - 0.8, fy, tbz0 + tbH * 0.52, tbx0 + tbW * 0.5, fy, tbz0 + tbH * 0.52, tbx0 + tbW * 0.5, fy, c.y + h / 2 - 0.8);
  group.add(floorLabel({ lines: [{ t: 'جامع الكريم', font: '"Amiri", serif', px: 30, rtl: true, weight: 700 }, { t: 'AL-KAREEM MOSQUE · JEDDAH', font: FONT_SERIF, px: 12, spacing: 3, weight: 500 }] },
    new THREE.Vector2(tbx0 + tbW / 2, tbz0 + tbH * 0.26), tbH * 0.42, fy + 0.01, makeMat, 0, tbW * 0.9));
  group.add(floorLabel({ lines: [en('GROUND FLOOR PLAN', 6, 1.4), dim('CUT AT +1.20 m', 5.5)], align: 'left' }, new THREE.Vector2(tbx0 + tbW * 0.25, tbz0 + tbH * 0.76), tbH * 0.3, fy + 0.01, makeMat, 0, tbW * 0.45));
  group.add(floorLabel({ lines: [en('SHEET A-101', 6, 1.4), dim('FROM KAREEN.SKP', 5.5)], align: 'left' }, new THREE.Vector2(tbx0 + tbW * 0.75, tbz0 + tbH * 0.76), tbH * 0.3, fy + 0.01, makeMat, 0, tbW * 0.45));
  { const x0 = c.x - w / 2 + 3.5, z0 = c.y + h / 2 - 3.2; for (let i = 0; i <= 10; i++) fr.push(x0 + i, fy, z0, x0 + i, fy, z0 - (i % 5 === 0 ? 0.8 : 0.4)); fr.push(x0, fy, z0, x0 + 10, fy, z0);
    group.add(floorLabel({ lines: [dim('0        5       10 m', 6)] }, new THREE.Vector2(x0 + 5, z0 + 0.8), 0.9, fy, makeMat)); }
  const annoLines = [linesFrom(dimLines), linesFrom(sw), linesFrom(dash), linesFrom(fr), linesFrom(q)];
  annoLines.forEach((l) => group.add(l));
  const rowsLine = linesFrom(rows, { fade: 0.35 }); group.add(rowsLine);
  return { group, labelMats, annoLines };
}
