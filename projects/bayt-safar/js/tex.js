// Procedural textures and materials. Everything is drawn in code: no image files.
import * as THREE from 'three';

let seed = 7;
export function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
export const rr = (a, b) => a + rnd() * (b - a);

function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Tileable-ish fractal noise drawn by scaling small random canvases.
function noise(size, oct = 5, contrast = 1) {
  const out = cv(size), g = out.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
  let alpha = 0.5;
  for (let o = 0; o < oct; o++) {
    const s = Math.max(2, size >> (oct - o + 1));
    const c = cv(s), cg = c.getContext('2d'), id = cg.createImageData(s, s);
    for (let i = 0; i < s * s; i++) { const v = rnd() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    cg.putImageData(id, 0, 0);
    g.globalAlpha = alpha * contrast; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(c, 0, 0, size, size);
    alpha *= 0.62;
  }
  g.globalAlpha = 1;
  return out;
}

function tint(g, size, color, noiseCanvas, amount) {
  g.fillStyle = color; g.fillRect(0, 0, size, size);
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount; g.drawImage(noiseCanvas, 0, 0, size, size);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}

function normalFrom(height, strength = 2) {
  const w = height.width, h = height.height;
  const src = height.getContext('2d').getImageData(0, 0, w, h).data;
  const out = cv(w, h), g = out.getContext('2d'), id = g.createImageData(w, h);
  const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) / 255 * strength, dy = (at(x, y + 1) - at(x, y - 1)) / 255 * strength;
    const l = 1 / Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    id.data[i] = (-dx * l * 0.5 + 0.5) * 255; id.data[i + 1] = (dy * l * 0.5 + 0.5) * 255; id.data[i + 2] = l * 255; id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return out;
}

function T(canvas, rep = 1, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// metres: how many metres one texture tile covers (geometry UVs are in metres)
function pbr({ map, height, metres = 2, rough = 0.9, metal = 0, nStrength = 2, color = 0xffffff, env = 1, nScale = 1 }) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, envMapIntensity: env });
  if (map) m.map = T(map, 1 / metres);
  if (height) { m.normalMap = T(normalFrom(height, nStrength), 1 / metres, false); m.normalScale.set(nScale, nScale); }
  return m;
}

// ---------- individual surfaces ----------
function mudPlaster(base, straw = true) {
  const S = 1024, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  tint(g, S, base, noise(S, 4, 1.2), 0.3);
  hg.drawImage(noise(S, 4, 1.4), 0, 0);
  // trowel sweeps
  for (let i = 0; i < 70; i++) {
    const y = rnd() * S, x = rnd() * S, w = rr(120, 420);
    g.strokeStyle = `rgba(${rnd() < .5 ? '70,45,20' : '255,235,200'},${rr(.012, .035)})`; g.lineWidth = rr(6, 26);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y + rr(-18, 18), x + w, y + rr(-8, 8)); g.stroke();
    hg.strokeStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},.12)`; hg.lineWidth = g.lineWidth; hg.stroke(new Path2D());
  }
  if (straw) for (let i = 0; i < 4200; i++) {
    const x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI, l = rr(2, 8);
    g.strokeStyle = `rgba(${rr(215, 245) | 0},${rr(190, 215) | 0},${rr(130, 160) | 0},${rr(.25, .6)})`; g.lineWidth = rr(.5, 1.1);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    hg.strokeStyle = 'rgba(255,255,255,.5)'; hg.lineWidth = 1.2;
    hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); hg.stroke();
  }
  return { map: c, height: h };
}

function pavers(base, cols, joint, vary = 22, S = 1024) {
  const c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  const n = noise(S, 7, 1.2), cell = S / cols;
  hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
  g.fillStyle = joint; g.fillRect(0, 0, S, S);
  const col = new THREE.Color(base);
  for (let j = 0; j < cols; j++) for (let i = 0; i < cols; i++) {
    const v = rr(-vary, vary) / 255, k = col.clone().offsetHSL(rr(-.01, .01), 0, v * 0.6);
    g.fillStyle = '#' + k.getHexString();
    const off = (j % 2) * cell * 0.5, x = (i * cell + off) % S, p = Math.max(1.5, cell * .012);
    for (const xx of [x, x - S]) { g.fillRect(xx + p, j * cell + p, cell - 2 * p, cell - 2 * p); hg.fillStyle = `rgb(${200 + rr(-20, 20) | 0},0,0)`; hg.fillStyle = '#ddd'; hg.fillRect(xx + p * 1.6, j * cell + p * 1.6, cell - 3.2 * p, cell - 3.2 * p); }
  }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; g.drawImage(n, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // veins and pits
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(90,70,50,${rr(.05, .2)})`; g.beginPath(); g.arc(rnd() * S, rnd() * S, rr(.5, 2.5), 0, 7); g.fill(); }
  hg.globalAlpha = .25; hg.globalCompositeOperation = 'overlay'; hg.drawImage(n, 0, 0); hg.globalAlpha = 1;
  return { map: c, height: h };
}

function wood(base, dark, S = 1024, planks = 6) {
  const c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, S, S); hg.fillStyle = '#999'; hg.fillRect(0, 0, S, S);
  const pw = S / planks;
  for (let p = 0; p < planks; p++) {
    const sh = rr(-.06, .06); g.fillStyle = `rgba(${sh > 0 ? '255,220,170' : '30,15,5'},${Math.abs(sh) * 3})`; g.fillRect(p * pw, 0, pw, S);
    for (let i = 0; i < 70; i++) {
      const x = p * pw + rnd() * pw; g.strokeStyle = `rgba(${dark},${rr(.05, .3)})`; g.lineWidth = rr(.5, 2.4);
      g.beginPath(); g.moveTo(x, 0); let xx = x;
      for (let y = 0; y <= S; y += 64) { xx += rr(-3, 3); g.lineTo(Math.min(Math.max(xx, p * pw + 1), (p + 1) * pw - 1), y); }
      g.stroke(); hg.strokeStyle = 'rgba(0,0,0,.18)'; hg.lineWidth = g.lineWidth; hg.stroke();
    }
    if (rnd() < .6) { const kx = p * pw + pw * rr(.3, .7), ky = rnd() * S; for (let r = 14; r > 1; r -= 2.5) { g.strokeStyle = `rgba(${dark},.35)`; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, r * .6, r, 0, 0, 7); g.stroke(); } }
    g.fillStyle = 'rgba(15,8,3,.85)'; g.fillRect(p * pw - 1.5, 0, 3, S); hg.fillStyle = '#000'; hg.fillRect(p * pw - 2.5, 0, 5, S);
  }
  return { map: c, height: h };
}

// Najdi painted door: planks with incised and painted geometric bands
function najdiDoor() {
  const W = 512, H = 1024, c = cv(W, H), g = c.getContext('2d');
  const w = wood('#6b4426', '25,12,4', 1024, 5); g.drawImage(w.map, 0, 0, W, H);
  const cols = ['#b8322a', '#e2b33c', '#2f6a5a', '#1f3f6e', '#efe6d0', '#1c1512'];
  const band = (y, hgt, fn) => { g.save(); g.beginPath(); g.rect(22, y, W - 44, hgt); g.clip(); fn(y, hgt); g.restore(); g.strokeStyle = '#1c1512'; g.lineWidth = 3; g.strokeRect(22, y, W - 44, hgt); };
  const tri = (y, hgt) => { const n = 9, tw = (W - 44) / n; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(22 + i * tw, y + hgt); g.lineTo(22 + i * tw + tw / 2, y); g.lineTo(22 + (i + 1) * tw, y + hgt); g.fill(); g.fillStyle = cols[4]; g.beginPath(); g.arc(22 + i * tw + tw / 2, y + hgt * .68, 4, 0, 7); g.fill(); } };
  const ros = (y, hgt) => { g.fillStyle = '#3a2413'; g.fillRect(0, y, W, hgt); const n = 4, tw = (W - 44) / n; for (let i = 0; i < n; i++) { const cx = 22 + tw * (i + .5), cy = y + hgt / 2, R = Math.min(tw, hgt) * .42; for (let k = 0; k < 12; k++) { g.fillStyle = cols[k % 4]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, k * Math.PI / 6, (k + .55) * Math.PI / 6); g.fill(); } g.fillStyle = cols[4]; g.beginPath(); g.arc(cx, cy, R * .28, 0, 7); g.fill(); g.fillStyle = cols[0]; g.beginPath(); g.arc(cx, cy, R * .14, 0, 7); g.fill(); g.strokeStyle = cols[1]; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * 1.06, 0, 7); g.stroke(); } };
  const zig = (y, hgt) => { g.fillStyle = cols[5]; g.fillRect(0, y, W, hgt); for (let r = 0; r < 3; r++) { g.strokeStyle = cols[[1, 0, 4][r]]; g.lineWidth = 5; g.beginPath(); for (let x = 22; x <= W - 22; x += 20) g.lineTo(x, y + 8 + r * (hgt - 16) / 3 + ((x / 20 | 0) % 2 ? 0 : (hgt - 16) / 3.4)); g.stroke(); } };
  band(40, 60, tri); band(110, 120, ros); band(240, 44, zig); band(H - 300, 44, zig); band(H - 246, 120, ros); band(H - 116, 60, tri);
  // centre panel: diamonds
  band(310, H - 640, (y, hgt) => { for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) { const cx = 22 + (W - 44) * (i + .5) / 4, cy = y + hgt * (j + .5) / 5, r = 30; g.strokeStyle = cols[(i + j) % 4]; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r * .7, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * .7, cy); g.closePath(); g.stroke(); g.fillStyle = cols[(i + j + 2) % 4]; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); } });
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = .35; g.drawImage(noise(512, 6, 1.4), 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return c;
}

// Sadu weave: striped Bedouin textile
function sadu(palette) {
  const S = 512, c = cv(S), g = c.getContext('2d'); let y = 0, k = 0;
  while (y < S) {
    const hgt = [10, 22, 6, 40, 6, 22, 10, 14][k % 8]; g.fillStyle = palette[k % palette.length]; g.fillRect(0, y, S, hgt);
    if (hgt === 40) { for (let x = 0; x < S; x += 32) { g.fillStyle = palette[(k + 2) % palette.length]; g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x + 16, y + 3); g.lineTo(x + 32, y + 20); g.lineTo(x + 16, y + 37); g.fill(); g.fillStyle = palette[(k + 3) % palette.length]; g.fillRect(x + 13, y + 17, 6, 6); } }
    if (hgt === 22) for (let x = 0; x < S; x += 16) { g.fillStyle = palette[(k + 1) % palette.length]; g.beginPath(); g.moveTo(x, y + hgt); g.lineTo(x + 8, y + 2); g.lineTo(x + 16, y + hgt); g.fill(); }
    y += hgt; k++;
  }
  const h = cv(S), hg = h.getContext('2d'); hg.fillStyle = '#777'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 3) { hg.fillStyle = 'rgba(255,255,255,.35)'; hg.fillRect(i, 0, 1.2, S); hg.fillStyle = 'rgba(0,0,0,.25)'; hg.fillRect(0, i, S, 1); }
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = .25; g.drawImage(h, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { map: c, height: h };
}

function carpet(field, border, accent) {
  const W = 1024, H = 640, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = border; g.fillRect(0, 0, W, H);
  g.fillStyle = accent; g.fillRect(18, 18, W - 36, H - 36); g.fillStyle = border; g.fillRect(30, 30, W - 60, H - 60);
  for (let x = 44; x < W - 50; x += 34) for (const y of [38, H - 66]) { g.fillStyle = (x / 34 | 0) % 2 ? accent : '#e9dcc0'; g.beginPath(); g.moveTo(x, y + 28); g.lineTo(x + 14, y); g.lineTo(x + 28, y + 28); g.fill(); }
  for (let y = 44; y < H - 50; y += 34) for (const x of [38, W - 66]) { g.fillStyle = (y / 34 | 0) % 2 ? accent : '#e9dcc0'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 28, y + 14); g.lineTo(x, y + 28); g.fill(); }
  g.fillStyle = field; g.fillRect(80, 80, W - 160, H - 160);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 9; i++) {
    const cx = 80 + (W - 160) * (i + .5) / 9, cy = 80 + (H - 160) * (j + .5) / 5, r = 34;
    g.fillStyle = (i + j) % 2 ? border : accent; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.fill();
    g.fillStyle = '#e9dcc0'; g.beginPath(); g.moveTo(cx, cy - r * .5); g.lineTo(cx + r * .5, cy); g.lineTo(cx, cy + r * .5); g.lineTo(cx - r * .5, cy); g.fill();
    g.fillStyle = field; g.fillRect(cx - 4, cy - 4, 8, 8);
  }
  const n = noise(512, 7, 1.5); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .45; g.drawImage(n, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { map: c, height: n };
}

function weave(base) {
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  tint(g, S, base, noise(S, 6, 1), .3); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 4) { hg.fillStyle = 'rgba(255,255,255,.3)'; hg.fillRect(i, 0, 2, S); hg.fillStyle = 'rgba(0,0,0,.3)'; hg.fillRect(0, i, S, 2); }
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = .12; g.drawImage(h, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { map: c, height: h };
}

function palmMat() {
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  g.fillStyle = '#8a6a3c'; g.fillRect(0, 0, S, S); hg.fillStyle = '#555'; hg.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 16) for (let x = 0; x < S; x += 16) {
    const d = ((x + y) / 16) % 2 === 0; const k = rr(-18, 18);
    g.fillStyle = `rgb(${168 + k | 0},${134 + k | 0},${80 + k | 0})`; g.save(); g.translate(x + 8, y + 8); g.rotate(d ? .78 : -.78); g.fillRect(-10, -4, 20, 8); g.restore();
    hg.fillStyle = '#ccc'; hg.save(); hg.translate(x + 8, y + 8); hg.rotate(d ? .78 : -.78); hg.fillRect(-10, -3, 20, 6); hg.restore();
  }
  return { map: c, height: h };
}

function sand() {
  const S = 1024, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  tint(g, S, '#c9a878', noise(S, 3, 1.2), .22); hg.drawImage(noise(S, 3, 1.6), 0, 0);
  for (let i = 0; i < 5000; i++) { const x = rnd() * S, y = rnd() * S, r = rr(.6, 3.2), v = rr(110, 220) | 0; g.fillStyle = `rgba(${v},${v * .86 | 0},${v * .68 | 0},.8)`; g.beginPath(); g.ellipse(x, y, r, r * rr(.6, 1), rnd() * 3, 0, 7); g.fill(); hg.fillStyle = 'rgba(255,255,255,.7)'; hg.beginPath(); hg.arc(x, y, r, 0, 7); hg.fill(); }
  return { map: c, height: h };
}

function strata() {
  const S = 1024, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  g.fillStyle = '#c4a073'; g.fillRect(0, 0, S, S); hg.fillStyle = '#777'; hg.fillRect(0, 0, S, S);
  let y = 0; while (y < S) { const t = rr(8, 60), k = rr(-30, 26); g.fillStyle = `rgb(${196 + k | 0},${160 + k | 0},${115 + k * .9 | 0})`; g.fillRect(0, y, S, t); hg.fillStyle = `rgb(${rr(60, 200) | 0},0,0)`; const v = rr(60, 200) | 0; hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(0, y, S, t); y += t; }
  for (let i = 0; i < 160; i++) { const x = rnd() * S; g.strokeStyle = `rgba(70,45,25,${rr(.1, .4)})`; g.lineWidth = rr(1, 5); g.beginPath(); g.moveTo(x, rnd() * S); g.lineTo(x + rr(-20, 20), rnd() * S); g.stroke(); hg.strokeStyle = 'rgba(0,0,0,.6)'; hg.lineWidth = g.lineWidth; hg.stroke(); }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = .6; g.drawImage(noise(S, 7, 1.5), 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { map: c, height: h };
}

function palmTrunk() {
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  g.fillStyle = '#5b4630'; g.fillRect(0, 0, S, S); hg.fillStyle = '#222'; hg.fillRect(0, 0, S, S);
  const n = 8, w = S / n, hh = S / 8;
  for (let j = -1; j < 9; j++) for (let i = 0; i < n; i++) {
    const x = i * w + (j % 2 ? w / 2 : 0), y = j * hh, k = rr(-20, 20);
    for (const xx of [x, x - S]) {
      g.fillStyle = `rgb(${130 + k | 0},${102 + k | 0},${70 + k | 0})`; g.beginPath(); g.moveTo(xx + w / 2, y + hh * 1.5); g.lineTo(xx + w * .95, y + hh * .3); g.lineTo(xx + w / 2, y); g.lineTo(xx + w * .05, y + hh * .3); g.fill();
      g.strokeStyle = 'rgba(40,25,12,.7)'; g.lineWidth = 2; g.stroke();
      hg.fillStyle = '#ddd'; hg.beginPath(); hg.moveTo(xx + w / 2, y + hh * 1.4); hg.lineTo(xx + w * .9, y + hh * .3); hg.lineTo(xx + w / 2, y + 4); hg.lineTo(xx + w * .1, y + hh * .3); hg.fill();
    }
  }
  return { map: c, height: h };
}

function frond() { // one palm frond, alpha cut-out; rachis along +y
  const W = 256, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.strokeStyle = '#8a8a4e'; g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H); g.lineTo(W / 2, 6); g.stroke();
  for (let y = H - 90; y > 10; y -= 9) {
    const t = 1 - y / H, len = (W / 2 - 6) * Math.sin(Math.min(1, t * 2.2 + .25) * Math.PI * .5) * (1 - t * .55);
    for (const s of [-1, 1]) {
      const k = rr(-16, 16); g.strokeStyle = `rgb(${118 + k | 0},${130 + k | 0},${86 + k * .6 | 0})`; g.lineWidth = rr(2.4, 3.6);
      g.beginPath(); g.moveTo(W / 2, y); g.lineTo(W / 2 + s * len, y - 38 - len * .25 + rr(-5, 5)); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function leafCard(blossom) {
  const S = 256, c = cv(S), g = c.getContext('2d');
  for (let i = 0; i < 46; i++) { const a = rnd() * 7, r = Math.sqrt(rnd()) * 112, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, k = rr(-28, 28), p = blossom && rnd() < .6;
    g.fillStyle = p ? `rgb(${200 + k | 0},${44 + k * .4 | 0},${112 + k | 0})` : `rgb(${58 + k | 0},${100 + k | 0},${46 + k * .4 | 0})`;
    g.save(); g.translate(x, y); g.rotate(rnd() * 7); g.beginPath(); g.moveTo(-13, 0); g.quadraticCurveTo(0, p ? -11 : -7, 13, 0); g.quadraticCurveTo(0, p ? 11 : 7, -13, 0); g.fill();
    if (!p) { g.strokeStyle = 'rgba(20,40,15,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.stroke(); } g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const leafy = () => leafCard(false), blossom = () => leafCard(true);

function tiles(a, b, n = 8) { // zellige-like pool / bath tile
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d'), s = S / n;
  hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S); g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, S, S);
  const A = new THREE.Color(a), B = new THREE.Color(b);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = A.clone().lerp(B, rnd()); g.fillStyle = '#' + k.getHexString(); g.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3); hg.fillStyle = `rgb(${rr(190, 255) | 0},${rr(190, 255) | 0},255)`; const v = rr(190, 255) | 0; hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
  return { map: c, height: h };
}

function gypsumCarve() { // carved gypsum frieze (Najdi juss): repeating triangles + discs, 1 m tile
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  tint(g, S, '#ece2d0', noise(S, 6, 1), .25); hg.fillStyle = '#bbb'; hg.fillRect(0, 0, S, S);
  const cut = (fn) => { g.fillStyle = 'rgba(120,96,70,.55)'; fn(g); hg.fillStyle = '#111'; fn(hg); };
  for (let i = 0; i < 4; i++) {
    const x = i * 128;
    cut(q => { q.beginPath(); q.moveTo(x + 14, 120); q.lineTo(x + 64, 30); q.lineTo(x + 114, 120); q.fill(); });
    cut(q => { q.beginPath(); q.arc(x + 64, 190, 34, 0, 7); q.fill(); });
    g.fillStyle = '#ece2d0'; hg.fillStyle = '#bbb'; for (const q of [g, hg]) { for (let k = 0; k < 8; k++) { q.beginPath(); q.moveTo(x + 64, 190); q.arc(x + 64, 190, 30, k * Math.PI / 4, k * Math.PI / 4 + .42); q.fill(); } }
    cut(q => { q.beginPath(); q.moveTo(x + 14, 260); q.lineTo(x + 64, 350); q.lineTo(x + 114, 260); q.fill(); });
    for (let k = 0; k < 4; k++) cut(q => { q.beginPath(); q.moveTo(x + k * 32 + 4, 440); q.lineTo(x + k * 32 + 16, 400); q.lineTo(x + k * 32 + 28, 440); q.fill(); });
  }
  cut(q => { q.fillRect(0, 8, S, 8); q.fillRect(0, 372, S, 8); q.fillRect(0, 470, S, 10); });
  return { map: c, height: h };
}

function waterNormal() { const n = noise(512, 6, 1.6); return T(normalFrom(n, 5), 1 / 3, false); }

export function makeMaterials() {
  const M = {};
  const mud = mudPlaster('#c39b6e');
  M.mud = pbr({ ...mud, metres: 3, rough: .96, nStrength: 2.6 });
  M.mudIn = pbr({ ...mudPlaster('#d6ba92', false), metres: 3, rough: .93, nStrength: 1.6, env: .3 });
  M.mudDark = pbr({ ...mud, metres: 3, rough: .97, color: 0xb8a48c });
  const gy = mudPlaster('#efe6d6', false);
  M.gypsum = pbr({ ...gy, metres: 2.5, rough: .85, nStrength: 1.2 });
  M.gypsumIn = pbr({ ...gy, metres: 2.5, rough: .85, nStrength: 1.2, env: .32 });
  M.carve = pbr({ ...gypsumCarve(), metres: 1, rough: .85, nStrength: 5, env: .35 });
  M.paver = pbr({ ...pavers('#c2ad8a', 4, '#8d7556', 16), metres: 2.4, rough: .9, nStrength: 3 });
  M.floor = pbr({ ...pavers('#cbb994', 4, '#a8946f', 9), metres: 2.8, rough: .6, nStrength: .8, env: .38 });
  M.stone = pbr({ ...pavers('#bfae93', 1, '#bfae93', 6), metres: 1.6, rough: .6, nStrength: 1 });
  M.stoneDark = pbr({ ...pavers('#5d554c', 1, '#5d554c', 6), metres: 1.4, rough: .45, nStrength: 1, env: .7 });
  const wd = wood('#5a3a22', '20,10,4');
  M.wood = pbr({ ...wd, metres: 1.2, rough: .62, nStrength: 1.5, env: .6 });
  M.woodLight = pbr({ ...wood('#a47a4e', '70,40,15'), metres: 1.2, rough: .55, nStrength: 1.2, env: .6 });
  M.beam = pbr({ ...wood('#4a3120', '15,8,3', 512, 2), metres: .6, rough: .8, nStrength: 2, env: .25 });
  M.door = new THREE.MeshStandardMaterial({ map: (() => { const t = T(najdiDoor()); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; })(), roughness: .7, envMapIntensity: .6 });
  M.sadu = pbr({ ...sadu(['#8f1d1b', '#1a1412', '#e8dcc2', '#c9661f', '#8f1d1b', '#1a1412']), metres: .9, rough: .95, nStrength: 1.5, env: .4 });
  M.sadu2 = pbr({ ...sadu(['#243a5a', '#e8dcc2', '#8f1d1b', '#1a1412', '#c79a3a']), metres: .7, rough: .95, nStrength: 1.5, env: .4 });
  const mk = (cp) => { const m = pbr({ ...cp, metres: 1, rough: .97, nStrength: 2.2, env: .3, color: 0xd9cec2 }); m.map.wrapS = m.map.wrapT = THREE.ClampToEdgeWrapping; m.map.repeat.set(1, 1); m.normalMap.repeat.set(4, 3); return m; };
  M.carpetRed = mk(carpet('#7c1f1c', '#231816', '#c08a2e'));
  M.carpetBlue = mk(carpet('#2a3f5c', '#1b1a1c', '#b9793a'));
  M.carpetSand = mk(carpet('#b79a72', '#5b3a26', '#8f2d22'));
  M.linen = pbr({ ...weave('#eee6d6'), metres: .5, rough: .95, env: .5 });
  M.linenSand = pbr({ ...weave('#cdb894'), metres: .5, rough: .95, env: .5 });
  M.linenRust = pbr({ ...weave('#a4512f'), metres: .5, rough: .95, env: .5 });
  M.linenOlive = pbr({ ...weave('#6d7350'), metres: .5, rough: .95, env: .5 });
  M.linenInk = pbr({ ...weave('#2d3540'), metres: .5, rough: .95, env: .5 });
  M.mat = pbr({ ...palmMat(), metres: .8, rough: .95, nStrength: 2.5, env: .22 });
  M.sand = pbr({ ...sand(), metres: 6, rough: 1, nStrength: 2.2 });
  M.cliff = pbr({ ...strata(), metres: 30, rough: 1, nStrength: 3, color: 0xe0c29c });
  M.rock = pbr({ ...mudPlaster('#b89b74', false), metres: 2, rough: 1, nStrength: 4 });
  M.canvas = new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: .95, side: THREE.DoubleSide });
  M.curtain = pbr({ ...weave('#e4d8c0'), metres: .5, rough: .95, env: .45 }); M.curtain.side = THREE.DoubleSide; M.curtain.emissive = new THREE.Color(0x4a3a22); M.curtain.emissiveIntensity = .35;
  M.bathWater = new THREE.MeshPhysicalMaterial({ color: 0xcfe6e2, roughness: .05, transparent: true, opacity: .32, envMapIntensity: 1 });
  M.trunk = pbr({ ...palmTrunk(), metres: .55, rough: .95, nStrength: 4 });
  M.frond = new THREE.MeshStandardMaterial({ map: frond(), alphaTest: .4, side: THREE.DoubleSide, roughness: .7 });
  M.leaf = new THREE.MeshStandardMaterial({ map: leafy(), alphaTest: .35, side: THREE.DoubleSide, roughness: .8 });
  M.blossom = new THREE.MeshStandardMaterial({ map: blossom(), alphaTest: .35, side: THREE.DoubleSide, roughness: .8 });
  M.poolTile = pbr({ ...tiles('#2d7f86', '#4fb0a8'), metres: 1, rough: .25, nStrength: 1.5 });
  M.bathTile = pbr({ ...tiles('#d9cfbb', '#efe8d8', 6), metres: .9, rough: .3, nStrength: 1.5, env: .6 });
  M.greenTile = pbr({ ...tiles('#2f5d4f', '#4f8a72', 10), metres: .8, rough: .22, nStrength: 1.5, env: .8 });
  M.water = new THREE.MeshPhysicalMaterial({ color: 0x5fb9b4, roughness: .06, metalness: 0, transparent: true, opacity: .72, normalMap: waterNormal(), normalScale: new THREE.Vector2(.35, .35), envMapIntensity: 1.6 });
  M.brass = new THREE.MeshStandardMaterial({ color: 0xc9973a, metalness: 1, roughness: .28 });
  M.copper = new THREE.MeshStandardMaterial({ color: 0xb86a3c, metalness: 1, roughness: .35 });
  M.iron = new THREE.MeshStandardMaterial({ color: 0x1d1b1a, metalness: .8, roughness: .55 });
  M.steel = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 1, roughness: .3 });
  M.clay = new THREE.MeshStandardMaterial({ color: 0xa8603a, roughness: .85 });
  M.clayDark = new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: .7 });
  M.ceramic = new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: .25, envMapIntensity: .8 });
  M.ceramicBlue = new THREE.MeshStandardMaterial({ color: 0x2f5878, roughness: .25 });
  M.date = new THREE.MeshStandardMaterial({ color: 0x4a2412, roughness: .45 });
  M.green = new THREE.MeshStandardMaterial({ color: 0x4f7a3c, roughness: .8 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: 0, transparent: true, opacity: .1, envMapIntensity: 1.2 });
  M.mirror = new THREE.MeshStandardMaterial({ color: 0x9aa09c, metalness: 1, roughness: .06, envMapIntensity: .45 });
  M.glow = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb45a, emissiveIntensity: 3.2, roughness: .5 });
  M.ember = new THREE.MeshStandardMaterial({ color: 0x331108, emissive: 0xff5a14, emissiveIntensity: 2.5 });
  { const c = cv(64, 256), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(70,45,25,.55)'); gr.addColorStop(1, 'rgba(70,45,25,0)'); g.fillStyle = gr; for (let i = 0; i < 9; i++) { const x = 32 + rr(-16, 16), w = rr(5, 16); g.globalAlpha = rr(.3, .7); g.fillRect(x - w / 2, 0, w, rr(120, 256)); } const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; M.stain = new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: true, color: 0x9a7a58 }); }
  M.black = new THREE.MeshStandardMaterial({ color: 0x141312, roughness: .6 });
  M.paper = new THREE.MeshStandardMaterial({ color: 0xe8dfcc, roughness: .9 });
  M.book = [0x6b2a22, 0x23405a, 0x3f5a3a, 0xb08a4a, 0x2a2624, 0x8a5a3a, 0xd8cdb8].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .8 }));
  return M;
}

// ---------- Chedi-style finishes ----------
function fluted(base, dark) { // vertical reeded timber panelling, 8 reeds per tile
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d'), w = wood(base, dark, S, 8);
  g.drawImage(w.map, 0, 0);
  for (let i = 0; i < 8; i++) { const x = i * 64, gr = hg.createLinearGradient(x, 0, x + 64, 0); gr.addColorStop(0, '#000'); gr.addColorStop(.12, '#777'); gr.addColorStop(.5, '#fff'); gr.addColorStop(.88, '#777'); gr.addColorStop(1, '#000'); hg.fillStyle = gr; hg.fillRect(x, 0, 64, S);
    const sh = g.createLinearGradient(x, 0, x + 64, 0); sh.addColorStop(0, 'rgba(20,10,4,.75)'); sh.addColorStop(.14, 'rgba(20,10,4,.12)'); sh.addColorStop(.5, 'rgba(255,230,190,.10)'); sh.addColorStop(.86, 'rgba(20,10,4,.12)'); sh.addColorStop(1, 'rgba(20,10,4,.75)'); g.fillStyle = sh; g.fillRect(x, 0, 64, S); }
  return { map: c, height: h };
}
function slatDoor() { // door face: vertical oak slats with shadow gaps, kick plate
  const W = 512, H = 1024, c = cv(W, H), g = c.getContext('2d'), w = wood('#a8845f', '90,60,34', 1024, 9); g.drawImage(w.map, 0, 0, W, H);
  for (let i = 0; i <= 9; i++) { g.fillStyle = 'rgba(18,10,5,.9)'; g.fillRect(i * W / 9 - 3, 0, 6, H); g.fillStyle = 'rgba(255,225,180,.12)'; g.fillRect(i * W / 9 + 4, 0, 5, H); }
  g.fillStyle = '#3a2e24'; g.fillRect(0, H - 36, W, 36);
  return c;
}
function travertine() {
  const S = 1024, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d');
  tint(g, S, '#dccfb6', noise(S, 4, 1.1), .22); hg.fillStyle = '#c8c8c8'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { const y = rnd() * S, x = rnd() * S, w = rr(60, 420), k = rnd() < .5; g.strokeStyle = k ? `rgba(150,120,85,${rr(.05, .16)})` : `rgba(255,248,235,${rr(.06, .2)})`; g.lineWidth = rr(1, 7); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + w * .3, y + rr(-5, 5), x + w * .6, y + rr(-5, 5), x + w, y + rr(-3, 3)); g.stroke(); }
  for (let i = 0; i < 380; i++) { const x = rnd() * S, y = rnd() * S, w = rr(2, 9), hh = rr(.8, 2); g.fillStyle = `rgba(120,95,65,${rr(.08, .26)})`; g.beginPath(); g.ellipse(x, y, w, hh, 0, 0, 7); g.fill(); hg.fillStyle = 'rgba(0,0,0,.55)'; hg.beginPath(); hg.ellipse(x, y, w, hh, 0, 0, 7); hg.fill(); }
  for (const q of [g, hg]) { q.strokeStyle = q === g ? 'rgba(120,100,75,.55)' : '#000'; q.lineWidth = 2; q.strokeRect(1, 1, S - 2, S / 2 - 1); q.strokeRect(1, S / 2, S - 2, S / 2 - 1); }
  return { map: c, height: h };
}
function jute() { // chunky woven rug with a darker border; fits the whole rug
  const W = 1024, H = 704, c = cv(W, H), g = c.getContext('2d'), h = cv(W, H), hg = h.getContext('2d');
  g.fillStyle = '#5a4332'; g.fillRect(0, 0, W, H); g.fillStyle = '#8a7256'; g.fillRect(56, 56, W - 112, H - 112);
  for (let y = 0; y < H; y += 3) for (let x = (y / 3 % 2) * 3; x < W; x += 6) { const inb = x > 56 && x < W - 60 && y > 56 && y < H - 58, k = rr(-16, 16); g.fillStyle = inb ? `rgb(${150 + k | 0},${124 + k | 0},${92 + k | 0})` : `rgb(${86 + k | 0},${64 + k | 0},${46 + k | 0})`; g.fillRect(x, y, 5.4, 2.4); const v = rr(150, 255) | 0; hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, 5.4, 2.4); }
  for (const [a, b, col] of [[400, 300, '#2b3c5a'], [560, 330, '#b7652a'], [470, 380, '#2b3c5a'], [620, 290, '#b7652a']]) { g.fillStyle = col; g.globalAlpha = .55; g.beginPath(); g.moveTo(a, b - 26); g.lineTo(a + 26, b); g.lineTo(a, b + 26); g.lineTo(a - 26, b); g.fill(); g.globalAlpha = 1; }
  return { map: c, height: h };
}
function pillowTex(kind) {
  const S = 256, c = cv(S), g = c.getContext('2d');
  if (kind === 0) { g.fillStyle = '#efe6d6'; g.fillRect(0, 0, S, S); g.fillStyle = '#a8382a'; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const x = i * 32 + (j % 2) * 16, y = j * 32; g.beginPath(); g.moveTo(x, y + 28); g.lineTo(x + 14, y + 4); g.lineTo(x + 28, y + 28); g.fill(); } }
  else if (kind === 1) { g.fillStyle = '#efe6d6'; g.fillRect(0, 0, S, S); for (const [x, w, col] of [[0, 46, '#b4562a'], [46, 10, '#1b1816'], [200, 10, '#1b1816'], [210, 46, '#b4562a']]) { g.fillStyle = col; g.fillRect(x, 0, w, S); } g.fillStyle = '#1b1816'; for (let j = 0; j < 4; j++) { const y = 20 + j * 60; g.beginPath(); g.moveTo(128, y); g.lineTo(168, y + 40); g.lineTo(88, y + 40); g.fill(); g.fillStyle = j % 2 ? '#1b1816' : '#b4562a'; } }
  else { g.fillStyle = kind === 2 ? '#b9ad94' : '#8d8468'; g.fillRect(0, 0, S, S); for (let i = 0; i < S; i += 8) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(i, 0, 3, S); g.fillStyle = 'rgba(40,30,20,.14)'; g.fillRect(0, i, S, 3); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: .95, envMapIntensity: .4 });
}
function screenTex() { // lattice of triangles, cut through
  const S = 256, c = cv(S), g = c.getContext('2d'); g.fillStyle = '#e9dfcc'; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'destination-out';
  const n = 4, s = S / n; for (let j = 0; j < n * 2; j++) for (let i = 0; i < n; i++) { const x = i * s + (j % 2 ? s / 2 : 0), y = j * s / 2, up = (i + j) % 3 !== 0; for (const xx of [x, x - S]) { g.beginPath(); if (up) { g.moveTo(xx + 7, y + s / 2 - 5); g.lineTo(xx + s / 2, y + 5); g.lineTo(xx + s - 7, y + s / 2 - 5); } else { g.rect(xx + 7, y + s / 4 - 2, s - 14, 5); } g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function artTex() { // woven wall piece: linen ground, dark woven block, stitched dots
  const W = 512, H = 720, c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#b7a98c'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '60,45,30'},.07)`; g.fillRect(0, y, W, 2); }
  g.fillStyle = '#2b2a2c'; g.fillRect(110, 400, 300, 200); g.fillStyle = '#e8dfcc'; for (let y = 90; y < 600; y += 14) for (let x = 130; x < 400; x += 22) { if (y > 395 && y < 605) g.fillStyle = '#8f8a82'; else g.fillStyle = '#efe7d6'; g.fillRect(x, y, 5, 8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function smallLeaf(col, n = 70, len = 15, wd = 4) { // olive / acacia leaf card
  const S = 256, c = cv(S), g = c.getContext('2d');
  for (let i = 0; i < 7; i++) { g.strokeStyle = 'rgba(70,58,44,.9)'; g.lineWidth = 2; g.beginPath(); const a = rnd() * 7; g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(a) * 110, S / 2 + Math.sin(a) * 110); g.stroke(); }
  for (let i = 0; i < n; i++) { const a = rnd() * 7, r = Math.sqrt(rnd()) * 116, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, k = rr(-22, 22); g.fillStyle = `rgb(${col[0] + k | 0},${col[1] + k | 0},${col[2] + k * .6 | 0})`; g.save(); g.translate(x, y); g.rotate(rnd() * 7); g.beginPath(); g.ellipse(0, 0, len, wd, 0, 0, 7); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, alphaTest: .4, side: THREE.DoubleSide, roughness: .75 });
}
function grassTex() {
  const S = 256, c = cv(S), g = c.getContext('2d');
  for (let i = 0; i < 90; i++) { const x = S / 2 + rr(-40, 40), k = rr(-25, 25), top = rr(10, 120), lean = rr(-90, 90); g.strokeStyle = `rgb(${150 + k | 0},${150 + k | 0},${92 + k * .5 | 0})`; g.lineWidth = rr(1.2, 2.6); g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x + lean * .2, S / 2, x + lean, top); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, alphaTest: .35, side: THREE.DoubleSide, roughness: .9 });
}
function gravel() {
  const S = 512, c = cv(S), g = c.getContext('2d'), h = cv(S), hg = h.getContext('2d'); g.fillStyle = '#b9b0a0'; g.fillRect(0, 0, S, S); hg.fillStyle = '#333'; hg.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) { const x = rnd() * S, y = rnd() * S, r = rr(2, 6), v = rr(150, 235) | 0; g.fillStyle = `rgb(${v},${v * .96 | 0},${v * .9 | 0})`; g.beginPath(); g.ellipse(x, y, r, r * rr(.6, 1), rnd() * 3, 0, 7); g.fill(); hg.fillStyle = '#eee'; hg.beginPath(); hg.arc(x, y, r * .8, 0, 7); hg.fill(); }
  return { map: c, height: h };
}
export function chediMaterials(M) {
  const cream = mudPlaster('#e3d8c4', false);
  M.mudIn = pbr({ ...cream, metres: 3, rough: .92, nStrength: .7, env: .32 });
  M.gypsumIn = M.mudIn; M.ceil = pbr({ ...cream, metres: 3, rough: .95, nStrength: .4, env: .35, color: 0xffffff }); M.ceil.emissive = new THREE.Color(0x3a3630); M.ceil.emissiveIntensity = .5;
  M.ceilTop = M.ceil.clone(); M.ceilTop.emissive = new THREE.Color(0xe6dccb); M.ceilTop.emissiveIntensity = .62; M.ceilTop.normalMap = null;
  M.pond = new THREE.MeshPhysicalMaterial({ color: 0x2c4744, roughness: .04, transparent: true, opacity: .86, normalMap: M.water.normalMap, normalScale: new THREE.Vector2(.18, .18), envMapIntensity: 1.8 });
  M.mud = pbr({ ...mudPlaster('#cdae86', false), metres: 3, rough: .95, nStrength: 1.5 });
  M.mudDark = pbr({ ...mudPlaster('#bfa27c', false), metres: 3, rough: .97, nStrength: 1.5 }); M.gypsum = M.mud;
  M.floor = pbr({ ...pavers('#dcd0b9', 2, '#cdc1a8', 5), metres: 2.4, rough: .5, nStrength: .6, env: .45 });
  M.trav = pbr({ ...travertine(), metres: 2.4, rough: .62, nStrength: 1.6, env: .5 });
  M.stone = pbr({ ...travertine(), metres: 1.8, rough: .7, nStrength: 1.4, color: 0xe9dfcf });
  M.paver = pbr({ ...pavers('#d2c4a6', 3, '#a8977a', 9), metres: 2.7, rough: .85, nStrength: 2 });
  M.flute = pbr({ ...fluted('#b08f6e', '95,66,38'), metres: .26, rough: .6, nStrength: 6, env: .5 });
  M.fluteDark = pbr({ ...fluted('#5f4028', '25,12,5'), metres: .34, rough: .6, nStrength: 6, env: .5 });
  M.oak = pbr({ ...wood('#ab8a66', '95,66,38', 1024, 4), metres: 1.4, rough: .55, nStrength: 1, env: .55 });
  M.walnut = pbr({ ...wood('#6f4f35', '35,20,9', 1024, 4), metres: 1.4, rough: .5, nStrength: 1, env: .6 });
  M.wood = M.walnut; M.woodLight = M.oak;
  M.doorOak = new THREE.MeshStandardMaterial({ map: (() => { const t = new THREE.CanvasTexture(slatDoor()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })(), roughness: .6, envMapIntensity: .55 });
  M.bronze = new THREE.MeshStandardMaterial({ color: 0x3b2f26, metalness: .85, roughness: .42 });
  M.boucle = pbr({ ...weave('#ece5d8'), metres: .22, rough: 1, nStrength: 3, env: .45 });
  M.taupe = pbr({ ...weave('#b8a98f'), metres: .3, rough: 1, nStrength: 2, env: .45 });
  M.leather = new THREE.MeshStandardMaterial({ color: 0x9a6a48, roughness: .55, envMapIntensity: .6 });
  { const j = jute(), m = pbr({ ...j, metres: 1, rough: 1, nStrength: 4, env: .3 }); for (const t of [m.map, m.normalMap]) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); } M.jute = m; }
  M.pillow = [0, 1, 2, 3].map(pillowTex);
  M.screen = new THREE.MeshStandardMaterial({ map: screenTex(), alphaTest: .5, side: THREE.DoubleSide, roughness: .8, color: 0xf2e9d8 });
  M.art = new THREE.MeshStandardMaterial({ map: artTex(), roughness: 1, envMapIntensity: .3 });
  M.cove = new THREE.MeshStandardMaterial({ color: 0xffe6c0, emissive: 0xffc98a, emissiveIntensity: 2.4, roughness: 1 });
  M.tv = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: .12, metalness: .2, envMapIntensity: .9 });
  M.sheer = new THREE.MeshStandardMaterial({ color: 0xfbf6ea, transparent: true, opacity: .42, side: THREE.DoubleSide, roughness: 1, emissive: 0x6a5a40, emissiveIntensity: .4, depthWrite: false });
  M.curtain = pbr({ ...weave('#bfb199'), metres: .5, rough: .95, env: .45 }); M.curtain.side = THREE.DoubleSide;
  M.oliveLeaf = smallLeaf([130, 136, 92], 150, 12, 3.6); M.acaciaLeaf = smallLeaf([118, 128, 74], 170, 6, 3); M.ghafLeaf = smallLeaf([142, 150, 112], 170, 7, 2.4);
  M.bark = pbr({ ...wood('#6e6257', '40,32,26', 512, 3), metres: .5, rough: 1, nStrength: 3 });
  M.grass = grassTex(); M.gravel = pbr({ ...gravel(), metres: 1.2, rough: 1, nStrength: 3 });
  M.dateFruit = new THREE.MeshStandardMaterial({ color: 0xc98a22, roughness: .5 }); M.dateStalk = new THREE.MeshStandardMaterial({ color: 0xd9962e, roughness: .7 });
  M.clay = new THREE.MeshStandardMaterial({ color: 0xb9a58a, roughness: .9 }); M.clayDark = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: .8 });
  M.linenSand = M.taupe; M.linen = M.boucle;
  M.glow = new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffc078, emissiveIntensity: 2.2, roughness: .6 });
  M.frond.color = new THREE.Color(0xe6e4cc); M.trunk.color = new THREE.Color(0xb9a892); M.trunk.normalScale.set(.6, .6); M.mirror.color = new THREE.Color(0x6f6a62); M.mirror.envMapIntensity = .3;
  return M;
}
