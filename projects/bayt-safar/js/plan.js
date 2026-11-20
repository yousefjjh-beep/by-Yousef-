// Hand-sketched master plan: a top view drawn from the same wall and furniture data the walk uses.
let s = 11;
const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, j = (a) => (rnd() - .5) * 2 * a;
const INK = '#1b1a18', PAPER = '#f4f1ea';

export function drawPlan(cv, { colliders, rooms, stair, trees }) {
  s = 11;
  const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,70,40,${rnd() * .05})`; g.fillRect(rnd() * W, rnd() * H, rnd() * 2.2, rnd() * 2.2); }
  const k = Math.min(W / 62, H / 47), ox = W / 2 - 9 * k, oy = H / 2 - 9.5 * k, X = (x) => ox + x * k, Y = (z) => oy + z * k, wob = Math.max(.6, k * .07);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (x1, y1, x2, y2, w = 1, a = .9, passes = 2) => { for (let p = 0; p < passes; p++) { g.strokeStyle = `rgba(27,26,24,${a * (p ? .55 : 1)})`; g.lineWidth = w * (p ? .7 : 1); const o = 2.5 * (rnd() - .2); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; g.beginPath(); g.moveTo(x1 - ux * o + j(wob), y1 - uy * o + j(wob)); g.quadraticCurveTo((x1 + x2) / 2 + j(wob * 1.8), (y1 + y2) / 2 + j(wob * 1.8), x2 + ux * o + j(wob), y2 + uy * o + j(wob)); g.stroke(); } };
  const rect = (x1, z1, x2, z2, w, a, p) => { const a1 = X(x1), b1 = Y(z1), a2 = X(x2), b2 = Y(z2); line(a1, b1, a2, b1, w, a, p); line(a2, b1, a2, b2, w, a, p); line(a2, b2, a1, b2, w, a, p); line(a1, b2, a1, b1, w, a, p); };
  const hatch = (x1, z1, x2, z2, gap = 3.2, a = .75) => { const a1 = X(x1), b1 = Y(z1), a2 = X(x2), b2 = Y(z2); g.save(); g.beginPath(); g.rect(a1, b1, a2 - a1, b2 - b1); g.clip(); for (let t = a1 - (b2 - b1); t < a2; t += gap) line(t + j(.6), b2, t + (b2 - b1) + j(.6), b1, .9, a, 1); g.restore(); };
  const waves = (x1, z1, x2, z2) => { for (let z = z1 + .45; z < z2; z += .7) { g.strokeStyle = 'rgba(27,26,24,.45)'; g.lineWidth = .8; g.beginPath(); for (let x = x1 + .3; x <= x2 - .3; x += .25) { const yy = Y(z) + Math.sin(x * 3.2 + z) * k * .09 + j(.4); x === x1 + .3 ? g.moveTo(X(x), yy) : g.lineTo(X(x), yy); } g.stroke(); } };
  const scribble = (x, z, r, a = .7) => { g.strokeStyle = `rgba(27,26,24,${a})`; g.lineWidth = .9; g.beginPath(); const n = 26, turns = 2.2; for (let i = 0; i <= n * turns; i++) { const t = i / n * 6.283, rr = r * k * (.82 + .2 * Math.sin(t * 5 + x) + j(.07)); const px = X(x) + Math.cos(t) * rr, py = Y(z) + Math.sin(t) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(X(x), Y(z), 1.4, 0, 7); g.fill(); };
  const palm = (x, z, r) => { for (let i = 0; i < 9; i++) { const t = i * .698 + x, e = r * k * (.85 + j(.15)); const px = X(x) + Math.cos(t) * e, py = Y(z) + Math.sin(t) * e; g.strokeStyle = 'rgba(27,26,24,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(x), Y(z)); g.quadraticCurveTo(X(x) + Math.cos(t + .5) * e * .55, Y(z) + Math.sin(t + .5) * e * .55, px, py); g.stroke(); } g.fillStyle = INK; g.beginPath(); g.arc(X(x), Y(z), 2, 0, 7); g.fill(); };
  const text = (t, x, z, size, opt = {}) => { g.save(); g.fillStyle = `rgba(27,26,24,${opt.a || .92})`; g.font = `${opt.it === false ? '' : 'italic '}${size}px ${opt.ar ? "'Amiri','Noto Naskh Arabic','Geeza Pro','Segoe UI',serif" : "Georgia,'Times New Roman',serif"}`; g.textAlign = opt.align || 'center'; g.textBaseline = 'middle'; if (opt.ar) g.direction = 'rtl'; g.translate(X(x), Y(z)); g.rotate(j(.012)); g.fillText(t, 0, 0); g.restore(); };

  // site: plot wall, path, terrace, pool, pergola
  rect(-16, -8, 34, 26, 1.6, .9); rect(-15.6, -7.6, 33.6, 25.6, .7, .5, 1);
  for (let x = -15.5; x < -.5; x += 1.3) line(X(x), Y(9.25), X(x), Y(11.75), .6, .3, 1); line(X(-16), Y(9.2), X(-.3), Y(9.2), .8, .6, 1); line(X(-16), Y(11.8), X(-.3), Y(11.8), .8, .6, 1);
  rect(18.25, 2.5, 28.8, 15.5, .8, .55, 1); rect(21.5, 4, 25.5, 14, 1.4, .9); waves(21.5, 4, 25.5, 14);
  g.setLineDash([5, 4]); rect(18.35, 4.6, 21.1, 13.4, .8, .6, 1); g.setLineDash([]);
  // trees
  for (const t of trees) t.kind === 'palm' ? palm(t.x, t.z, 2.1) : scribble(t.x, t.z, (t.kind === 'acacia' ? 2.6 : t.kind === 'ghaf' ? 2.2 : 1.7) * (t.s || 1), .6);
  // house: walls hatched, glazing as a fine line, furniture in pencil
  rect(0, 0, 18, 18, 2.2, .95, 3);
  for (const c of colliders.ground) {
    const w = c[2] - c[0], d = c[3] - c[1], thin = Math.min(w, d), long = Math.max(w, d), inHouse = c[0] > -.3 && c[2] < 18.3 && c[1] > -.3 && c[3] < 18.3;
    if (inHouse && thin < .2 && long > .6) { line(X(c[0] + (w < d ? w / 2 : 0)), Y(c[1] + (w < d ? 0 : d / 2)), X(c[2] - (w < d ? w / 2 : 0)), Y(c[3] - (w < d ? 0 : d / 2)), .8, .8, 2); continue; }
    if (inHouse && thin <= .52 && thin >= .28 && long >= .6 && (Math.abs(thin - .5) < .03 || Math.abs(thin - .4) < .03 || Math.abs(thin - .3) < .03)) { rect(c[0], c[1], c[2], c[3], 1.5, .95); hatch(c[0], c[1], c[2], c[3]); continue; }
    if (c[0] < -16.6 || c[2] > 34.6 || c[1] < -8.6 || c[3] > 26.6) continue;
    if (thin > .45 && long < 6 && !(c[0] === 21.5 && c[1] === 4)) rect(c[0], c[1], c[2], c[3], .7, inHouse ? .5 : .4, 1);
  }
  // stair, pond, olive bed
  for (let z = stair.z1; z < stair.z2; z += .48) line(X(stair.x1), Y(z), X(stair.x2), Y(z), .7, .6, 1);
  line(X(6.07), Y(7.5), X(6.07), Y(12.2), .9, .8, 1); line(X(6.07), Y(12.2), X(5.85), Y(11.8), .9, .8, 1); line(X(6.07), Y(12.2), X(6.3), Y(11.8), .9, .8, 1);
  waves(9.46, 8.36, 11.34, 10.24); scribble(7.75, 8.75, 1.5, .7);
  // dimensions
  const dim = (x1, z1, x2, z2, label, lx, lz) => { line(X(x1), Y(z1), X(x2), Y(z2), .7, .7, 1); for (const [a, b] of [[x1, z1], [x2, z2]]) line(X(a) - 4, Y(b) + 4, X(a) + 4, Y(b) - 4, .9, .8, 1); text(label, lx, lz, Math.max(10, k * .62), { it: true }); };
  dim(0, -2.2, 18, -2.2, '18.00 m', 9, -3.1);
  // labels, English and Arabic
  const AR = { 'Living room': 'المجلس', 'Entry hall': 'المدخل', 'Court': 'الفناء', 'Dining': 'غرفة الطعام', 'Kitchen': 'المطبخ', 'Bedroom': 'غرفة النوم', 'Bath': 'الحمّام', 'Pool terrace': 'المسبح' };
  const fs = Math.max(10, k * .78);
  for (const r of rooms) { let cx = (r[1] + r[3]) / 2, cz = (r[2] + r[4]) / 2; if (r[0] === 'Court') { cx = 9.2; cz = 11.5; } if (r[0] === 'Pool terrace') { cx = 27.3; cz = 3.4; } if (r[0] === 'Living room') cx = 5.2; if (r[0] === 'Entry hall') cz = 7.4;
    g.fillStyle = 'rgba(244,241,234,.82)'; g.fillRect(X(cx) - fs * 3.4, Y(cz) - fs * 1.15, fs * 6.8, fs * 2.5);
    text(r[0], cx, cz - .05, fs); text(AR[r[0]] || '', cx, cz + fs * 1.05 / k, fs, { ar: true, it: false }); }
  text('gate', -17.6, 10.5, fs * .85); text('date palms', -8, 5.6, fs * .85, { a: .7 }); text('olive', 7.75, 10.9, fs * .8, { a: .8 }); text('pergola', 19.7, 14.1, fs * .8, { a: .7 });
  // north arrow, scale bar, title block
  const nx = X(37.2), ny = Y(-3.5); line(nx, ny + 26, nx, ny - 26, 1.3, .9); line(nx, ny - 26, nx - 8, ny - 8, 1.3, .9); line(nx, ny - 26, nx + 8, ny - 8, 1.3, .9); g.fillStyle = INK; g.font = 'italic 15px Georgia,serif'; g.textAlign = 'center'; g.fillText('N', nx, ny - 34);
  const sx = X(-16), sy = Y(29.2); line(sx, sy, sx + 10 * k, sy, 1.3, .9); for (const m of [0, 5, 10]) { line(sx + m * k, sy - 5, sx + m * k, sy + 5, 1.1, .9, 1); g.font = `${Math.max(9, k * .55)}px Georgia,serif`; g.fillText(m + (m === 10 ? ' m' : ''), sx + m * k, sy + 18); }
  hatch(-16, 29.05, -11, 29.35, 2.5, .6);
  g.textAlign = 'right'; g.fillStyle = INK; const tx = X(34), ty = Y(28.6), big = Math.max(16, k * 1.5);
  g.font = `${big}px Georgia,serif`; g.fillText('Bayt Safar · master plan', tx, ty); g.save(); g.direction = 'rtl'; g.font = `${big}px 'Amiri','Noto Naskh Arabic','Geeza Pro','Segoe UI',serif`; g.textAlign = 'left'; g.fillText('بيت صفار · المخطط العام', X(34) - g.measureText('بيت صفار · المخطط العام').width, ty + big * 1.25); g.restore();
  g.font = `italic ${Math.max(10, k * .7)}px Georgia,serif`; g.fillText('ground floor, cut at 1.2 m · by Yousef', tx, ty + big * 2.3);
  line(X(18), ty + big * 2.9, tx, ty + big * 2.9, 1, .7, 1);
}
