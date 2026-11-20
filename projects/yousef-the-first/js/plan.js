// Annotation layer of the sheet: room names, dimension strings, door swings, tree symbols,
// hatching, section marks, north arrow and scale bar. It lies on the ground plane of the model,
// so every label sits exactly on the room it names.
import * as THREE from 'three';
import { ROOMS, TREES } from './house.js';

const X0 = -6, Z0 = -6, W = 60, H = 34, S = 64; // metres, px per metre

export function buildAnnotations({ overlay = false } = {}) {
  const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
  const g = c.getContext('2d');
  const X = x => (x - X0) * S, Y = z => (z - Z0) * S;
  const ink = '#1b1a18', grey = 'rgba(27,26,24,0.35)', faint = 'rgba(27,26,24,0.16)';
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const line = (x0, z0, x1, z1, w = 1.2, col = ink, dash = null) => {
    g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); g.moveTo(X(x0), Y(z0)); g.lineTo(X(x1), Y(z1)); g.stroke(); g.setLineDash([]);
  };
  const text = (s, x, z, { size = 0.42, weight = 400, align = 'center', col = ink, rot = 0, track = 0.12 } = {}) => {
    g.save(); g.translate(X(x), Y(z)); g.rotate(rot); g.fillStyle = col;
    g.font = `${weight} ${size * S}px Plex, monospace`; g.textAlign = align; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = `${track * size * S}px`;
    g.fillText(s, 0, 0); g.restore();
  };
  const inside = (x, z, rects, pad = 0) => rects.some(([a, b, c2, d]) => x > a - pad && x < c2 + pad && z > b - pad && z < d + pad);

  // ---- hard surfaces, used to keep stipple off them
  const built = [[5.6, 0.6, 17.4, 19.7], [12.3, 7.8, 23.3, 19.5], [22.7, 0.6, 46.3, 7.4], [22.9, 7.3, 27.7, 19.5], [27.4, 7.9, 45.6, 19.7],
    [43.3, 9.6, 46.3, 19.4], [-2.2, 8.5, 6.1, 26.2], [8.3, 19.5, 13.2, 26.2], [17, 1, 23, 8], [12.5, 8, 15, 14], [-0.3, 9, 6, 19.8]];

  if (!overlay) {
  // ---- lawn stipple
  for (let i = 0; i < 26000; i++) {
    const x = -2 + r() * 50, z = -3 + r() * 29;
    if (inside(x, z, built, 0.15)) continue;
    g.fillStyle = faint; g.fillRect(X(x), Y(z), 2.2, 2.2);
  }
  // gravel stipple, denser and finer
  for (const [a, b, c2, d] of [[12.5, 8, 15, 14], [17, 1, 23, 8], [-2, 8.6, 6, 26]]) {
    for (let i = 0; i < (c2 - a) * (d - b) * 90; i++) {
      const x = a + r() * (c2 - a), z = b + r() * (d - b);
      if (a === 17 && x > 18.5 && x < 22 && z > 3.6 && z < 5.2) continue;
      g.fillStyle = grey; g.beginPath(); g.arc(X(x), Y(z), 1.6, 0, 7); g.fill();
    }
  }
  // ---- floor joints (light)
  const grid = (a, b, c2, d, du, dz, col = faint, w = 1) => {
    for (let x = a + du; x < c2 - 1e-3; x += du) line(x, b, x, d, w, col);
    for (let z = b + dz; z < d - 1e-3; z += dz) line(a, z, c2, z, w, col);
  };
  grid(9.1, 8.1, 12.4, 16.8, 0.8, 1.6);
  grid(9.1, 17.2, 12.4, 19.6, 0.8, 1.6);
  grid(15.1, 8.1, 22.9, 18.8, 0.8, 1.6);
  grid(27.5, 8, 45.5, 12, 1.2, 0.6); grid(27.5, 16.5, 45.5, 19.6, 1.2, 0.6); grid(23.1, 8.1, 27.5, 19, 1.2, 0.6);
  for (let x = 8.42; x < 16.85; x += 0.24) line(x, 1.18, x, 7.9, 0.8, 'rgba(27,26,24,0.09)');
  // ---- water
  const water = (a, b, c2, d) => {
    g.save(); g.beginPath(); g.rect(X(a), Y(b), (c2 - a) * S, (d - b) * S); g.clip();
    g.strokeStyle = 'rgba(27,26,24,0.28)'; g.lineWidth = 1.1;
    for (let z = b + 0.35; z < d; z += 0.55) for (let x = a + (r() * 0.8); x < c2; x += 1.6 + r()) {
      g.beginPath(); g.moveTo(X(x), Y(z)); g.quadraticCurveTo(X(x + 0.25), Y(z - 0.12), X(x + 0.5), Y(z)); g.quadraticCurveTo(X(x + 0.75), Y(z + 0.12), X(x + 1.0), Y(z)); g.stroke();
    }
    g.restore();
  };
  water(29, 12, 43, 16.5); water(8.65, 19.85, 12.85, 23.35);

  // ---- trees (plan symbol: loose crown outline + trunk dot)
  for (const [x, z, s] of TREES) {
    const R = 2.2 * s;
    g.strokeStyle = 'rgba(27,26,24,0.55)'; g.lineWidth = 1.3; g.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * Math.PI * 2, rr = R * (0.92 + 0.08 * Math.sin(a * 9 + s * 5) + 0.03 * Math.sin(a * 23));
      const px = X(x + Math.cos(a) * rr), pz = Y(z + Math.sin(a) * rr);
      i ? g.lineTo(px, pz) : g.moveTo(px, pz);
    }
    g.stroke();
    g.strokeStyle = 'rgba(27,26,24,0.2)';
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + s; g.beginPath(); g.moveTo(X(x), Y(z)); g.lineTo(X(x + Math.cos(a) * R * 0.7), Y(z + Math.sin(a) * R * 0.7)); g.stroke(); }
  }

  }
  // ---- door swings
  const swing = (px, pz, rr, a0, a1, w = 1.1) => {
    g.strokeStyle = ink; g.lineWidth = w; g.setLineDash([6, 5]); g.beginPath(); g.arc(X(px), Y(pz), rr * S, a0, a1, a1 < a0); g.stroke(); g.setLineDash([]);
    line(px, pz, px + Math.cos(a1) * rr, pz + Math.sin(a1) * rr, 1.6);
  };
  swing(10.3, 17.0, 1.35, 0, -Math.PI / 2 + 0.05);
  swing(29.0, 6.4, 1.0, -Math.PI / 2, -Math.PI);
  swing(37.0, 6.4, 1.0, -Math.PI / 2, -Math.PI);
  swing(15.0, 18.2, 1.0, -Math.PI / 2, 0);

  // ---- room names, sizes, ceiling heights
  for (const rm of ROOMS) {
    const [a, b, c2, d] = rm.r, [lx, lz] = rm.lp;
    const rot = rm.vertical ? -Math.PI / 2 : 0;
    const s = rm.small ? 0.3 : 0.42;
    const dims = `${(c2 - a).toFixed(2)} × ${(d - b).toFixed(2)}`;
    const off = (dz) => rm.vertical ? [lx + dz, lz] : [lx, lz + dz];
    text(rm.name, ...off(0), { size: s, weight: 400, rot, track: 0.16 });
    text(dims, ...off(s * 1.25), { size: s * 0.72, col: 'rgba(27,26,24,0.75)', rot, track: 0.05 });
    if (rm.h) text(`H ${rm.h.toFixed(2)}`, ...off(s * 2.2), { size: s * 0.62, col: 'rgba(27,26,24,0.55)', rot, track: 0.05 });
  }
  text('ENTRY', 10.75, 25.1, { size: 0.36, track: 0.3 });
  g.fillStyle = ink; g.beginPath(); g.moveTo(X(10.75), Y(23.9)); g.lineTo(X(10.5), Y(24.4)); g.lineTo(X(11.0), Y(24.4)); g.fill();
  text('±0.00', 11.95, 18.9, { size: 0.24, align: 'left', col: 'rgba(27,26,24,0.7)' });
  text('−0.06', 13.0, 21.6, { size: 0.24, align: 'left', col: 'rgba(27,26,24,0.7)' });

  // ---- dimension strings
  const dimX = (xs, z, off = 0.45) => {
    line(xs[0], z, xs[xs.length - 1], z, 1.1);
    for (let i = 0; i < xs.length; i++) {
      line(xs[i], z - 0.25, xs[i], z + 0.25, 1.1);
      g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(xs[i] - 0.15), Y(z + 0.15)); g.lineTo(X(xs[i] + 0.15), Y(z - 0.15)); g.stroke();
      if (i) text((xs[i] - xs[i - 1]).toFixed(2), (xs[i] + xs[i - 1]) / 2, z - off, { size: 0.3, track: 0.04 });
    }
  };
  const dimZ = (zs, x, off = 0.45) => {
    line(x, zs[0], x, zs[zs.length - 1], 1.1);
    for (let i = 0; i < zs.length; i++) {
      line(x - 0.25, zs[i], x + 0.25, zs[i], 1.1);
      g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(x - 0.15), Y(zs[i] + 0.15)); g.lineTo(X(x + 0.15), Y(zs[i] - 0.15)); g.stroke();
      if (i) text((zs[i] - zs[i - 1]).toFixed(2), x - off, (zs[i] + zs[i - 1]) / 2, { size: 0.3, rot: -Math.PI / 2, track: 0.04 });
    }
  };
  dimX([6, 8, 17, 23, 25.5, 29, 37, 41.5, 45], -4.2);
  dimX([6, 45], -5.4); text('', 0, 0);
  dimZ([1, 8, 17, 19], -4.0);
  dimZ([1, 19], -5.2);
  dimX([9, 12.5], 26.6);
  dimZ([12, 16.5], 46.9, -0.45);
  dimX([29, 43], 20.4);

  // ---- section marks
  const sect = (x0, z0, x1, z1, label, dir) => {
    line(x0, z0, x1, z1, 1.3, 'rgba(27,26,24,0.6)', [26, 7, 4, 7]);
    for (const [x, z, k] of [[x0, z0, ''], [x1, z1, "'"]]) {
      g.fillStyle = '#f4f1ea'; g.strokeStyle = ink; g.lineWidth = 1.6;
      g.beginPath(); g.arc(X(x), Y(z), 0.42 * S, 0, 7); g.fill(); g.stroke();
      g.fillStyle = ink; g.beginPath();
      const [dx, dz] = dir; const tx = x + dx * 0.42, tz = z + dz * 0.42;
      g.moveTo(X(tx + dx * 0.45), Y(tz + dz * 0.45)); g.lineTo(X(tx - dz * 0.3), Y(tz + dx * 0.3)); g.lineTo(X(tx + dz * 0.3), Y(tz - dx * 0.3)); g.fill();
      text(label + k, x, z, { size: 0.36, weight: 400 });
    }
  };
  sect(10.75, -2.2, 10.75, 26.0, 'A', [-1, 0]);
  sect(-1.2, 4.6, 47.0, 4.6, 'B', [0, 1]);

  // ---- property line
  g.strokeStyle = 'rgba(27,26,24,0.75)'; g.lineWidth = 1.4; g.setLineDash([30, 8, 6, 8]);
  g.strokeRect(X(-2.15), Y(-3.15), 50.3 * S, 29.3 * S); g.setLineDash([]);

  // ---- north arrow and scale bar
  const nx = 51.5, nz = 1.5;
  g.strokeStyle = ink; g.lineWidth = 1.4; g.beginPath(); g.arc(X(nx), Y(nz), 1.3 * S, 0, 7); g.stroke();
  g.fillStyle = ink; g.beginPath(); g.moveTo(X(nx), Y(nz - 1.15)); g.lineTo(X(nx + 0.38), Y(nz + 0.7)); g.lineTo(X(nx), Y(nz + 0.35)); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(X(nx), Y(nz - 1.15)); g.lineTo(X(nx - 0.38), Y(nz + 0.7)); g.lineTo(X(nx), Y(nz + 0.35)); g.closePath(); g.stroke();
  text('N', nx, nz - 1.9, { size: 0.45 });
  const sx = -1.0, sz = 26.9, marks = [0, 1, 2, 3, 4, 5];
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f4f1ea' : ink; g.fillRect(X(sx + marks[i]), Y(sz), S, 0.22 * S); }
  g.strokeStyle = ink; g.lineWidth = 1.2; g.strokeRect(X(sx), Y(sz), 5 * S, 0.22 * S);
  for (const m of [0, 1, 2, 5]) text(String(m), sx + m, sz - 0.42, { size: 0.28 });
  text('m', sx + 5.6, sz + 0.11, { size: 0.28, align: 'left' });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: !overlay, toneMapped: false, opacity: overlay ? 0 : 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(X0 + W / 2, 0.06, Z0 + H / 2); mesh.renderOrder = overlay ? 10 : 1;
  return mesh;
}
