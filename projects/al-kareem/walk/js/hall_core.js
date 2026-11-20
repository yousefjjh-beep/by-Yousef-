// owned by the 'hall_core' builder
// Prayer-hall core: carpet, ceiling + void, columns, chandelier, pendant bowls, entrance wall + glazed screen,
// vestibule, interior lighting and exposure.
import * as THREE from 'three';

// LAYOUT V2: qibla wall = +Z long wall, glazed back entrance on the -Z long wall, side entrances in both end walls.
export const views = { hall_entrance: { pos: [1.0, 2.55, 2.9], look: [-1.45, 4.5, -10.55], fov: 58 } };

export async function build(ctx) {
  const { scene, SPEC, lib } = ctx;
  const { canvasTex, grain, blotches, normalFromHeight, boxM, wallWithHoles, rng, std } = lib;
  const F = SPEC.floorY, H = SPEC.hall, CH = H.ceil, V = SPEC.void, VE = SPEC.vestibule;
  const YC = F + CH;                       // ceiling level (absolute)
  const root = new THREE.Group(); root.name = 'hall_core'; scene.add(root);
  let P = root;                            // current parent: wall assemblies are built in a local frame inside a rotated group
  const add = (m, cast = false, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; P.add(m); return m; };
  // box given by world extents; y values are heights above the hall floor
  const bx = (x0, x1, y0, y1, z0, z1, mat, cast = false, recv = true) => {
    const m = new THREE.Mesh(boxM(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
    m.position.set((x0 + x1) / 2, F + (y0 + y1) / 2, (z0 + z1) / 2); return add(m, cast, recv);
  };
  const rectPts = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

  // ------------------------------------------------------------------ textures
  // small equirect "room" environment so bronze / glass have something to reflect
  const env = canvasTex(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fffaf0'); gr.addColorStop(.42, '#ebe6da'); gr.addColorStop(.5, '#c9c4b6'); gr.addColorStop(.58, '#56788c'); gr.addColorStop(1, '#173449');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(112, 36, 30, 34); g.fillRect(20, 44, 8, 24); g.fillRect(52, 44, 8, 24); g.fillRect(200, 44, 8, 24); g.fillRect(232, 44, 8, 24);
  }, { aniso: 1 });
  env.mapping = THREE.EquirectangularReflectionMapping;

  const plasterT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, w, h); blotches(g, w, h, 70, .022, 11, [40, 160]); grain(g, w, h, .035, 5, 1); }, { repeat: [1 / 3, 1 / 3] });
  const plasterH = document.createElement('canvas'); plasterH.width = plasterH.height = 256;
  { const g = plasterH.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); blotches(g, 256, 256, 260, .10, 21, [3, 14]); grain(g, 256, 256, .12, 9, 1); }
  const plasterN = normalFromHeight(plasterH, 1.2, { repeat: [1 / 1.2, 1 / 1.2] });

  const limeDraw = (base, seed) => (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); blotches(g, w, h, 90, .035, seed, [20, 130]); grain(g, w, h, .05, seed + 1, 1); grain(g, w, h, .03, seed + 2, 2);
    const r = rng(seed + 3);
    for (let i = 0; i < 9; i++) { let x = r() * w, y = r() * h; g.strokeStyle = `rgba(${150 + r() * 30 | 0},${135 + r() * 25 | 0},${108 + r() * 20 | 0},${.07 + r() * .08})`; g.lineWidth = .6 + r() * 1.4; g.beginPath(); g.moveTo(x, y);
      const dir = r() * 6.28; for (let k = 0; k < 14; k++) { x += Math.cos(dir + (r() - .5) * 1.2) * 26; y += Math.sin(dir + (r() - .5) * 1.2) * 26; g.lineTo(x, y); } g.stroke(); }
  };
  const limeT = canvasTex(512, 512, limeDraw('#e9e3d5', 31), { repeat: [1 / 2, 1 / 2] });

  const oakDraw = (g, w, h) => {
    g.fillStyle = '#c7b499'; g.fillRect(0, 0, w, h); const r = rng(101);
    for (let i = 0; i < 16; i++) { const y = r() * h, hh = 20 + r() * 70; g.fillStyle = `rgba(${r() < .5 ? '120,95,65' : '225,205,175'},${.05 + r() * .06})`; g.fillRect(0, y, w, hh); }
    for (let i = 0; i < 1300; i++) { const y = r() * h, a = 1 + r() * 4, ph = r() * 6.28, k = 1 + (r() * 3 | 0); const dark = r() < .62;
      g.strokeStyle = dark ? `rgba(104,80,52,${.05 + r() * .17})` : `rgba(240,225,200,${.05 + r() * .14})`; g.lineWidth = .5 + r() * (i % 9 ? 1.4 : 3.2); g.beginPath();
      for (let x = 0; x <= w; x += 16) { const yy = y + Math.sin(x / w * 6.283 * k + ph) * a; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
    grain(g, w, h, .04, 8, 1);
  };
  const oakT = canvasTex(512, 512, oakDraw, { repeat: [1 / 1.8, 1 / 0.9] });
  const oakTV = canvasTex(512, 512, oakDraw, { repeat: [1 / 1.8, 1 / 0.9] }); oakTV.rotation = Math.PI / 2;

  // hammered bronze
  const bronzeH = document.createElement('canvas'); bronzeH.width = bronzeH.height = 256;
  { const g = bronzeH.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); blotches(g, 256, 256, 420, .35, 44, [5, 13]); }
  const bronzeN = normalFromHeight(bronzeH, 2.2, { repeat: [5, 2] });
  const bronzeT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#a07a48'; g.fillRect(0, 0, w, h); blotches(g, w, h, 160, .12, 45, [6, 30]); grain(g, w, h, .08, 46, 1); }, { repeat: [5, 2] });

  // client's carpet (refs/carpet_pattern.png): one unit 0.65 m (X) x 1.33 m (Z); canvas top = qibla side, violet rosette band at the far side
  const CP = SPEC.carpet, CWX = 512, CWZ = 1024, carpetC = document.createElement('canvas'), carpetHC = document.createElement('canvas'); carpetC.width = carpetHC.width = CWX; carpetC.height = carpetHC.height = CWZ;
  {
    const g = carpetC.getContext('2d'), w = CWX, h = CWZ, V = CP.violet, K = CP.black, W = '#f6eee2', P = 16, Y = (f) => Math.round(f * h);
    g.fillStyle = CP.cream; g.fillRect(0, 0, w, h);
    const line = (y, t, col) => { g.fillStyle = col; g.fillRect(0, y - t / 2, w, t); };
    const comb = (yc) => { const bh = 40; g.fillStyle = K; g.fillRect(0, yc - bh / 2, w, bh); line(yc, 5, V);                 // black band with violet/white comb
      for (let x = 0; x < w; x += P) { g.fillStyle = W; g.fillRect(x + 2, yc - 13, 4, 26); g.fillRect(x, yc - 13, 8, 3); g.fillRect(x, yc + 10, 8, 3); g.fillStyle = V; g.fillRect(x + 10, yc - 9, 3, 18); } };
    const zig = (yc) => { const bh = 40; line(yc - bh / 2, 3, V); line(yc + bh / 2, 3, V); line(yc, 2, V); g.strokeStyle = V; g.lineWidth = 2.4;               // violet zigzag lattice
      for (const [ya, yb] of [[yc - bh / 2 + 3, yc - 2], [yc + 2, yc + bh / 2 - 3]]) { g.beginPath(); for (let x = 0; x <= w; x += P / 2) g.lineTo(x, (x / (P / 2)) % 2 ? ya : yb); g.stroke(); } };
    const tri = (yc) => { const bh = 72; line(yc - bh / 2, 4, K); line(yc + bh / 2, 4, K);                                                                   // denser violet triangle band between black lines
      for (const y0 of [yc - bh / 2 + 6, yc + 8]) { g.fillStyle = V; g.fillRect(0, y0, w, 22); g.fillStyle = W; for (let r = 0; r < 3; r++) for (let x = (r % 2) * 4; x < w; x += 8) { g.beginPath(); g.moveTo(x, y0 + 3 + r * 6 + 5); g.lineTo(x + 3, y0 + 3 + r * 6); g.lineTo(x + 6, y0 + 3 + r * 6 + 5); g.fill(); } }
      line(yc, 4, K); g.fillStyle = W; for (let x = 0; x < w; x += 8) g.fillRect(x + 2, yc - 1, 3, 2); line(yc - 6, 1.5, K); line(yc + 6, 1.5, K); };
    line(Y(.022), 3, V); comb(Y(.117)); zig(Y(.204)); comb(Y(.288)); tri(Y(.395)); comb(Y(.5)); zig(Y(.585)); comb(Y(.672)); line(Y(.767), 3, V);
    const by = Math.round(h * (1 - CP.bandZ / CP.repeatZ)); g.fillStyle = V; g.fillRect(0, by, w, h - by);                                                  // 0.28 m violet band, three white rosettes per unit
    for (let i = 0; i < 3; i++) { const cx = w * (i + .5) / 3, cy = (by + h) / 2, R = 58; g.strokeStyle = W; g.fillStyle = W; g.lineWidth = 2;
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
      for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3; g.beginPath(); g.arc(cx + R * Math.cos(an), cy + R * Math.sin(an), R, 0, 6.2832); g.stroke(); g.beginPath(); g.arc(cx + R * .5 * Math.cos(an + .5236), cy + R * .5 * Math.sin(an + .5236), R * .5, 0, 6.2832); g.stroke(); }
      for (let a = 0; a < 12; a++) { const an = a * Math.PI / 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.cos(an), cy + R * Math.sin(an)); g.stroke(); }
      for (const rr of [.33, .66]) { g.beginPath(); for (let a = 0; a <= 6; a++) { const an = a * Math.PI / 3 + (rr > .5 ? .5236 : 0); g.lineTo(cx + R * rr * Math.cos(an), cy + R * rr * Math.sin(an)); } g.stroke(); }
      for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3, px = cx + R * .5 * Math.cos(an), py = cy + R * .5 * Math.sin(an); g.beginPath(); g.ellipse(px, py, R * .46, R * .13, an, 0, 6.2832); g.fill(); }
      g.restore(); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke(); }
    { const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; const tg = tmp.getContext('2d'); tg.filter = 'blur(1.1px)'; tg.drawImage(carpetC, 0, 0); g.globalAlpha = .6; g.drawImage(tmp, 0, 0); g.globalAlpha = 1; }   // take the edge off the finest bands so they hold together at distance
    grain(g, w, h, .04, 2024, 1); grain(g, w, h, .03, 2025, 2);                                                                                          // soft pile
    const gh = carpetHC.getContext('2d'); gh.fillStyle = '#808080'; gh.fillRect(0, 0, w, h); grain(gh, w, h, .5, 77, 2); grain(gh, w, h, .3, 78, 1);
  }
  const carpetT = new THREE.CanvasTexture(carpetC); carpetT.wrapS = carpetT.wrapT = THREE.RepeatWrapping; carpetT.repeat.set(1 / CP.tileX, 1 / CP.repeatZ); carpetT.colorSpace = THREE.SRGBColorSpace;
  { const mips = [carpetC]; let w = CWX, h = CWZ, lvl = 0;                                   // pre-filtered mips: each level is box-filtered then blurred a little more, so the fine comb/zigzag bands melt into soft stripes instead of aliasing
    while (w > 1 || h > 1) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); lvl++; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.filter = lvl < 2 ? 'none' : `blur(${Math.min(1.3, .3 * lvl)}px)`; const prev = mips[mips.length - 1];
      for (const [ox, oy] of [[0, 0], [-w, 0], [w, 0], [0, -h], [0, h]]) g.drawImage(prev, ox, oy, w, h);   // neighbours drawn too so the blur wraps cleanly at the tile edges
      mips.push(c); }
    carpetT.mipmaps = mips; carpetT.generateMipmaps = false; carpetT.minFilter = THREE.LinearMipmapLinearFilter; carpetT.magFilter = THREE.LinearFilter; carpetT.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy(); }
  const carpetN = normalFromHeight(carpetHC, 1.0, { repeat: [1 / CP.tileX, 1 / CP.repeatZ] });

  // palm frond drawing shared by the frosted door motif and the potted palms
  function drawFrond(g, x0, y0, x1, y1, cx, cy, maxL, color, lw, n = 30) {
    g.strokeStyle = color; g.fillStyle = color; g.lineCap = 'round'; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
    for (let i = 3; i <= n; i++) { const t = i / n, mt = 1 - t; const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1, py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
      let tx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * mt * (cy - y0) + 2 * t * (y1 - cy); const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const L = maxL * Math.pow(Math.sin(Math.PI * Math.min(1, t * .9 + .07)), .6) * (.5 + .5 * (1 - t));
      for (const s of [-1, 1]) { const ang = s * (1.05 - .55 * t); const dx = tx * Math.cos(ang) - ty * Math.sin(ang), dy = tx * Math.sin(ang) + ty * Math.cos(ang);
        const ex = px + dx * L + tx * L * .25, ey = py + dy * L + ty * L * .25, mx = px + dx * L * .5, my = py + dy * L * .5, wd = Math.max(lw * .8, L * .075);
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(mx - dy * wd, my + dx * wd, ex, ey); g.quadraticCurveTo(mx + dy * wd, my - dx * wd, px, py); g.fill(); } }
  }
  const motif = (mirror) => canvasTex(512, 1024, (g, w, h) => { g.clearRect(0, 0, w, h); if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    const col = 'rgba(255,255,255,.92)';
    drawFrond(g, 110, 1040, 330, 90, 120, 480, 300, col, 10, 20); drawFrond(g, 470, 1040, 110, 520, 430, 720, 210, col, 8, 15); }, { aniso: 4 });

  const radial = (rgb) => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.25, `rgba(${rgb},.55)`); gr.addColorStop(.6, `rgba(${rgb},.14)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { aniso: 1 });
  const glowT = radial('255,214,160'), aoR = radial('0,0,0'), poolT = radial('255,250,240');
  const aoT = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.3, 'rgba(0,0,0,.5)'); gr.addColorStop(.65, 'rgba(0,0,0,.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { aniso: 1 });
  const mAO = new THREE.MeshBasicMaterial({ map: aoT, transparent: true, opacity: .72, depthWrite: false, side: THREE.DoubleSide });
  const mAOR = new THREE.MeshBasicMaterial({ map: aoR, transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide });
  // fake contact shadow: quad whose a-b edge is dark, fading over the offset vector (absolute coordinates)
  const aoStrip = (ax, ay, az, bx2, by, bz, ox, oy, oz, mat = mAO) => { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([ax + ox, ay + oy, az + oz, bx2 + ox, by + oy, bz + oz, bx2, by, bz, ax, ay, az], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, mat); m.renderOrder = 1; P.add(m); return m; };
  const flatQ = (x, y, z, sx, sz, mat) => { const g = new THREE.PlaneGeometry(sx, sz); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.renderOrder = 1; P.add(m); return m; };
  const D = SPEC.dome, DR = 3.1, DSPRING = SPEC.shell.roofY - F + .02, DTOP = 10.05;   // opening radius; springing = model roof level; apex just under the model's dome shell (heights above floor)
  const domeY = (x, z) => DSPRING + (DTOP - DSPRING) * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (DR * DR)));

  // ------------------------------------------------------------------ materials
  const mPlaster = std({ map: plasterT, normalMap: plasterN, normalScale: new THREE.Vector2(.25, .25), roughness: .94, color: 0xf1ede6, emissive: 0xf6f1ea, emissiveIntensity: .17 });
  const ceilE = canvasTex(64, 64, (g, w, h) => { const im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = Math.abs(x / (w - 1) - .5) * 2, v = Math.abs(y / (h - 1) - .5) * 2;
      const val = 255 * (1 - .62 * Math.pow(Math.min(1, Math.hypot(u, v) / 1.25), 1.5)) * (1 - .25 * Math.pow(Math.max(u, v), 6)); const i = (y * w + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = val; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }, { aniso: 1 });
  ceilE.repeat.set(1 / (H.x1 - H.x0), 1 / (H.z1 - H.z0)); ceilE.offset.set(-H.x0 / (H.x1 - H.x0), -H.z0 / (H.z1 - H.z0));     // brightest mid-room, falling away toward the walls and darkest in the corners
  const mCeil = std({ color: 0xb9b7b2, roughness: 1, emissive: 0xf7f2eb, emissiveMap: ceilE, emissiveIntensity: .3 });
  const mVoid = std({ color: 0xb4b2ac, roughness: 1, emissive: 0xfff4e6, emissiveIntensity: .17 });
  const mLime = std({ map: limeT, roughness: .72, emissive: 0xfff4e4, emissiveIntensity: .05 });
  const mOak = std({ map: oakT, roughness: .62 });
  const mOakV = std({ map: oakTV, roughness: .62 });
  // client's replacement carpet (Al-Mira ASTP.26.11.17-1): the pattern unit 1.22 m (X) x 1.33 m (Z) cropped from his product sheet.
  // Image top = qibla side (green field), the 33 cm star-lattice band is on the side of each row away from the qibla.
  const carpetImg = await new THREE.TextureLoader().loadAsync(new URL('../assets/carpet.jpg', import.meta.url).href);
  carpetImg.wrapS = carpetImg.wrapT = THREE.RepeatWrapping; carpetImg.repeat.set(1 / 1.22, 1 / 1.33); carpetImg.colorSpace = THREE.SRGBColorSpace;
  carpetImg.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy(); carpetImg.minFilter = THREE.LinearMipmapLinearFilter;
  const mCarpet = new THREE.MeshLambertMaterial({ map: carpetImg, emissive: 0xffffff, emissiveMap: carpetImg, emissiveIntensity: .5 });   // small lift: the room light was tuned for a pale carpet
  const mBronze = std({ map: bronzeT, normalMap: bronzeN, normalScale: new THREE.Vector2(.8, .8), color: 0xd9b58a, metalness: .7, roughness: .45, envMap: env, envMapIntensity: 1.1, emissive: 0x4a341c, emissiveIntensity: .55, side: THREE.DoubleSide });
  const mDark = std({ color: 0x2a2520, metalness: .7, roughness: .45, envMap: env, envMapIntensity: .6 });
  const mRod = std({ color: 0x6b5236, metalness: .6, roughness: .5, envMap: env, envMapIntensity: .8, emissive: 0x2a1e10, emissiveIntensity: .5 });
  const mGlass = new THREE.MeshStandardMaterial({ color: 0xf2f7f8, transparent: true, opacity: .1, roughness: .04, metalness: 0, envMap: env, envMapIntensity: .5, side: THREE.DoubleSide, depthWrite: false });
  const mBrass = std({ map: bronzeT, color: 0xf6dcaa, normalMap: bronzeN, normalScale: new THREE.Vector2(1.1, 1.1), metalness: .8, roughness: .4, envMap: env, envMapIntensity: 1.0, emissive: 0x3c2a14, emissiveIntensity: .3, side: THREE.DoubleSide });

  const mTimber = std({ map: oakTV, color: 0x9c7a56, roughness: .6 });
  const mPool = new THREE.MeshBasicMaterial({ map: poolT, transparent: true, opacity: .09, depthWrite: false, blending: THREE.AdditiveBlending });
  const X0 = H.x0, X1 = H.x1, Z0 = H.z0, Z1 = H.z1, E = SPEC.entrances, ZB = Z0 + .45;   // ZB = finished face of the back wall

  // ------------------------------------------------------------------ 1. floor: carpet over the whole hall, row lines along X
  { const m = new THREE.Mesh(boxM(X1 - X0 + .4, .02, Z1 - Z0 + .5), mCarpet); m.position.set((X0 + X1) / 2, F + .002, (Z0 + Z1) / 2 - .15); add(m, false, true); }

  // ------------------------------------------------------------------ 2. ceiling + dome
  {
    const x0 = SPEC.shell.x0 + .02, x1 = SPEC.shell.x1 - .02, z0 = SPEC.shell.z0 + .02, z1 = SPEC.shell.z1 - .02;
    const circ = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; circ.push([D.x + DR * Math.cos(a), D.z + DR * Math.sin(a)]); }
    const geo = wallWithHoles(rectPts(x0, z0, x1, z1), [circ]); geo.rotateX(Math.PI / 2); const c = new THREE.Mesh(geo, mCeil); c.position.y = YC; add(c, false, true);
    // The model closes the bay with a flat disc at roof level that belongs to a much larger mesh (hall--loose__material_61_6).
    // Only that disc's triangles (horizontal, at roof level, inside the dome radius) are dropped from the index; the replacement is the drum + dome below.
    ctx.glb.updateMatrixWorld(true);
    ctx.glb.traverse((m) => { if (!m.isMesh || !/loose__material_61_6$/.test(m.name) || m.userData.zone !== 'hall') return; const gm = m.geometry, pos = gm.attributes.position, v = new THREE.Vector3();
      const idx = gm.index ? Array.from(gm.index.array) : Array.from({ length: pos.count }, (_, i) => i), keep = [];
      for (let i = 0; i < idx.length; i += 3) { let drop = true; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m.matrixWorld); if (Math.abs(v.y - SPEC.shell.roofY) > .03 || Math.hypot(v.x - D.x, v.z - D.z) > SPEC.dome.r + .15) { drop = false; break; } } if (!drop) keep.push(idx[i], idx[i + 1], idx[i + 2]); }
      if (keep.length < idx.length) gm.setIndex(keep); });
    const gradT = (stops, radialG) => canvasTex(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { aniso: 1 });
    const DRUM = DSPRING - CH;
    const mDrum = std({ color: 0xbdb8ae, roughness: 1, emissive: 0xffe9d0, emissiveMap: gradT([[0, '#cfcfcf'], [.3, '#8a8a8a'], [1, '#3a3a3a']]), emissiveIntensity: .32, side: THREE.BackSide });      // drum: cove-lit at the springing, falling to shade at the ceiling edge
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(DR + .015, DR + .015, DRUM, 72, 1, true), mDrum); drum.position.set(D.x, YC + DRUM / 2, D.z); add(drum, false, false);
    const mDome = std({ color: 0xc4bfb5, roughness: 1, emissive: 0xffe9d0, emissiveMap: gradT([[0, '#3e3e3e'], [.45, '#6a6a6a'], [.8, '#b4b4b4'], [1, '#ececec']]), emissiveIntensity: .34, side: THREE.BackSide });   // dome: bright at the springing, shading smoothly up to the crown
    const cap = new THREE.Mesh(new THREE.SphereGeometry(DR + .015, 72, 28, 0, Math.PI * 2, 0, Math.PI / 2), mDome); cap.scale.y = (DTOP - DSPRING) / (DR + .015); cap.position.set(D.x, F + DSPRING, D.z); add(cap, false, false);
    const cove = new THREE.Mesh(new THREE.CylinderGeometry(DR - .01, DR - .01, .07, 72, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, .86, .66), side: THREE.BackSide })); cove.position.set(D.x, F + DSPRING - .02, D.z); add(cove, false, false);
    const lip = new THREE.Mesh(new THREE.RingGeometry(DR - .16, DR + .02, 72), std({ color: 0xa9a59b, roughness: 1, emissive: 0xffe9d0, emissiveIntensity: .06 })); lip.rotation.x = Math.PI / 2; lip.position.set(D.x, F + DSPRING - .07, D.z); add(lip, false, false);
    const ring = new THREE.Mesh(new THREE.RingGeometry(DR, DR + .025, 72), new THREE.MeshBasicMaterial({ color: 0x8c857a })); ring.rotation.x = Math.PI / 2; ring.position.set(D.x, YC - .006, D.z); add(ring, false, false);

    // flat ceiling details (all a few mm below the ceiling plane)
    const flat = (xa, xb, za, zb, mat, dy) => { const g = new THREE.PlaneGeometry(Math.abs(xb - xa), Math.abs(zb - za)); g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.set((xa + xb) / 2, YC - dy, (za + zb) / 2); add(m, false, false); };
    const mGap = new THREE.MeshBasicMaterial({ color: 0x8c857a }), mBand = new THREE.MeshBasicMaterial({ color: 0xa39d92 }), mSlot = new THREE.MeshBasicMaterial({ color: 0x777065 }), mSlotBar = new THREE.MeshBasicMaterial({ color: 0xaaa499 });
    const band = (xa, xb, za, zb) => { const alongX = Math.abs(xb - xa) > Math.abs(zb - za); flat(xa, xb, za, zb, mBand, .004);
      if (alongX) { flat(xa, xb, za - .012, za + .012, mGap, .008); flat(xa, xb, zb - .012, zb + .012, mGap, .008); } else { flat(xa - .012, xa + .012, za, zb, mGap, .008); flat(xb - .012, xb + .012, za, zb, mGap, .008); } };
    const bi = 1.35, bw = .16;                                    // shadow-gap band round the room, 1.35 m in from the walls
    band(X0 + bi, X1 - bi, ZB + bi, ZB + bi + bw); band(X0 + bi, X0 + bi + bw, ZB + bi, Z1 - bi); band(X1 - bi - bw, X1 - bi, ZB + bi, Z1 - bi);
    band(X0 + bi, -4.1, Z1 - bi - bw, Z1 - bi); band(4.1, X1 - bi, Z1 - bi - bw, Z1 - bi);
    const slot = (xa, xb, z) => { flat(xa, xb, z - .05, z + .05, mSlot, .006); flat(xa, xb, z - .012, z + .012, mSlotBar, .010); };
    for (const z of [-5.4, .35]) for (const s of [-1, 1]) slot(s * 7.3, s * 10.6, z);
    flat(X0, X1, ZB, ZB + .05, mGap, .006);

    const GP = SPEC.columns[1].x, dl = []; for (let i = -3; i <= 3; i++) for (const z of [-2 * GP, -GP, 0]) { const x = i * GP;
      if (Math.hypot(x - D.x, z - D.z) < DR + 1.2) continue; if (SPEC.columns.some((c) => Math.abs(x - c.x) < .75 && Math.abs(z - c.z) < .75)) continue; dl.push([x, z]); }
    const mk = (geo, mat, dy) => { geo.rotateX(Math.PI / 2); const im = new THREE.InstancedMesh(geo, mat, dl.length); const o2 = new THREE.Object3D(); dl.forEach(([x, z], i) => { o2.position.set(x, YC - dy, z); o2.updateMatrix(); im.setMatrixAt(i, o2.matrix); }); add(im, false, false); };
    mk(new THREE.PlaneGeometry(.095, .095), new THREE.MeshBasicMaterial({ color: 0xcfc9be }), .005);   // 9.5 cm downlight with a slim pale trim
    mk(new THREE.PlaneGeometry(.075, .075), new THREE.MeshBasicMaterial({ color: 0x6a645b }), .009);
    mk(new THREE.CircleGeometry(.022, 12), new THREE.MeshBasicMaterial({ color: 0xfff4e2 }), .013);
  }

  // ------------------------------------------------------------------ 3. columns (two free ones carrying the mezzanine edge, two against the qibla wall)
  const MZ = SPEC.mezzanine, FZ0 = MZ.zFront, FZ1 = MZ.zFront + SPEC.columnSize;   // fascia beam sits on the column line: back at the slab edge, front flush with the column front faces
  const mCol = std({ map: limeT, color: 0xf7e9d2, roughness: .75, emissive: 0xffdcb4, emissiveIntensity: .13 }), mColGap = std({ color: 0x3b352d, roughness: 1 });   // emissive = warm bounce so shaded faces sit at mid tone
  // interior stone copied exactly from hall_mihrab.js (bigStone generator + material settings): 0.32 m courses from the floor, rough, matte
  const NT = new Float32Array(65536); { let s = 12345; for (let i = 0; i < 65536; i++) { s = (s * 1664525 + 1013904223) >>> 0; NT[i] = s / 4294967296; } }
  function vnoise(x, y, per, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % per) + per) % per, x1 = (x0 + 1) % per, y0 = ((yi % per) + per) % per, y1 = (y0 + 1) % per, o = (s * 7919) & 65535;
    const a = NT[(y0 * 257 + x0 + o) & 65535], b = NT[(y0 * 257 + x1 + o) & 65535], c = NT[(y1 * 257 + x0 + o) & 65535], d = NT[(y1 * 257 + x1 + o) & 65535];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(u, v, base = 4, oct = 4, s = 1) { let a = 0.5, t = 0, n = 0, f = base; for (let o = 0; o < oct; o++) { t += a * vnoise(u * f, v * f, f, s + o * 13); n += a; a *= 0.5; f *= 2; } return t / n; }
  function modulate(g, w, h, fn) { const im = g.getImageData(0, 0, w, h), d = im.data; const px = [0, 0, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; px[0] = d[i]; px[1] = d[i + 1]; px[2] = d[i + 2]; fn(x / w, y / h, px); d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; }
    g.putImageData(im, 0, 0); }
  const COURSE = 0.32;
  function bigStone(seed) {
    const r = lib.rng(seed), W = 1024, TX = 5.12, TY = 2.56, ch = Math.round(W * COURSE / TY), pxm = W / TX;
    const PAL = [[214, 186, 138], [224, 200, 156], [203, 171, 119], [229, 208, 168], [210, 180, 128], [197, 164, 112], [218, 192, 146]];
    const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#000'; hg.fillRect(0, 0, W, W);
    const map = lib.canvasTex(W, W, (g) => { g.fillStyle = 'rgb(138,116,86)'; g.fillRect(0, 0, W, W);
      for (let row = 0; row * ch < W; row++) { const y = row * ch; let x = -Math.round((0.15 + r() * 0.7) * pxm); const x0 = x;
        while (x < W + x0) { let cw = Math.round((0.6 + r() * 0.9) * pxm); if (W + x0 - x - cw < 0.6 * pxm) cw = W + x0 - x;
          const c = PAL[Math.floor(r() * PAL.length)], v = 0.95 + r() * 0.09, h0 = 120 + r() * 90, tilt = (r() - .5) * 60, vert = r() < .5;
          for (const ox of [0, W]) { const X = x + ox + 1, Y = y + 1, CW = cw - 1, CH = ch - 2; g.fillStyle = `rgb(${c[0] * v | 0},${c[1] * v | 0},${c[2] * v | 0})`; g.fillRect(X, Y, CW, CH);
            for (let k = 0; k < 9; k++) { g.fillStyle = `rgba(${r() < .5 ? '255,244,214' : '120,92,52'},${.03 + r() * .06})`; g.fillRect(X + r() * CW * .8, Y + r() * CH * .8, CW * (.1 + r() * .3), CH * (.08 + r() * .3)); }
            const gr = vert ? hg.createLinearGradient(0, Y, 0, Y + CH) : hg.createLinearGradient(X, 0, X + CW, 0); gr.addColorStop(0, `rgb(${h0 | 0},${h0 | 0},${h0 | 0})`); gr.addColorStop(1, `rgb(${h0 + tilt | 0},${h0 + tilt | 0},${h0 + tilt | 0})`);
            hg.fillStyle = gr; hg.fillRect(X + 1, Y + 2, CW - 2, CH - 4); }
          x += cw; } }
      modulate(g, W, W, (u, v, p) => { const n = 0.80 + fbm(u, v, 20, 5, seed) * 0.40 + (Math.random() - .5) * .09; p[0] *= n; p[1] *= n; p[2] *= n; }); }, { repeat: [1 / TX, 1 / TY] });
    modulate(hg, W, W, (u, v, p) => { const n = p[0] * (0.30 + fbm(u, v, 40, 5, seed + 5) * 1.4) + (Math.random() - .5) * 26; p[0] = p[1] = p[2] = Math.max(0, Math.min(255, n)); });
    return { map, normalMap: lib.normalFromHeight(hc, 6, { repeat: [1 / TX, 1 / TY] }) };
  }
  function macro(mat, amp, s1 = 0.33, s2 = 1.3) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPm;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPm = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWPm; float mh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
        float mn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x), mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x), f.y), mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x), mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x), f.y), f.z); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n{ float mac = mn(vWPm*${s1.toFixed(3)})*.6 + mn(vWPm*${s2.toFixed(3)}+7.3)*.4; diffuseColor.rgb *= ${(1 - amp).toFixed(3)} + ${(2 * amp).toFixed(3)}*mac; }`); };
    mat.customProgramCacheKey = () => 'macro' + amp + '_' + s1 + '_' + s2 + 'false'; return mat; }
  // the one limestone: generator and material copied verbatim from hall_mihrab.js so piers, door strips and qibla wall are the same stone
  function honed(seed) { const W = 1024, pw = W / 2, ph = W / 4, r = lib.rng(seed);
    const hc = document.createElement('canvas'); hc.width = hc.height = W; const hg = hc.getContext('2d'); hg.fillStyle = '#fff'; hg.fillRect(0, 0, W, W); hg.fillStyle = '#000';
    const map = lib.canvasTex(W, W, (g) => { g.fillStyle = 'rgb(226,212,186)'; g.fillRect(0, 0, W, W);
      for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) { const v = 0.97 + r() * 0.06, w2 = (r() - .5) * 3; g.fillStyle = `rgb(${226 * v + w2 | 0},${212 * v | 0},${186 * v - w2 | 0})`; g.fillRect(i * pw + (j % 2) * pw / 2, j * ph, pw, ph); }
      g.filter = 'blur(5px)'; for (let k = 0; k < 26; k++) { const x = r() * W, y = r() * W, a = (r() - .5) * 0.7; g.strokeStyle = r() < .5 ? `rgba(255,250,238,${0.04 + r() * 0.04})` : `rgba(150,128,96,${0.03 + r() * 0.035})`; g.lineWidth = 5 + r() * 16;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 120 * Math.cos(a), y + 120 * Math.sin(a) + (r() - .5) * 60, x + 240 * Math.cos(a), y + 240 * Math.sin(a) + (r() - .5) * 60, x + 380 * Math.cos(a), y + 380 * Math.sin(a)); g.stroke(); } g.filter = 'none';
      modulate(g, W, W, (u, v, p) => { const n = 0.972 + fbm(u, v, 3, 4, seed) * 0.056 + (Math.random() - .5) * .012; p[0] *= n; p[1] *= n; p[2] *= n; });
      g.fillStyle = 'rgba(120,104,80,0.55)';
      for (let j = 0; j < 4; j++) { g.fillRect(0, j * ph, W, 1.6); hg.fillRect(0, j * ph - 1, W, 3); for (let i = -1; i < 3; i++) { const x = i * pw + (j % 2) * pw / 2; g.fillRect(x, j * ph, 1.6, ph); hg.fillRect(x - 1, j * ph, 3, ph); } }
    }, { repeat: [1 / 2.56, 1 / 2.56] });
    return { map, normalMap: lib.normalFromHeight(hc, 1.4, { repeat: [1 / 2.56, 1 / 2.56] }) }; }
  const stoneT = honed(29);
  const stoneMat = macro(lib.std({ color: 0xffffff, map: stoneT.map, normalMap: stoneT.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: .62, metalness: 0, side: THREE.DoubleSide }), .03, .3, 1.1);
  const PH2 = SPEC.columnSize / 2 + .04, PIERX = Math.abs(SPEC.columns[1].x);   // stone pier half-size: column + 4 cm cladding
  for (const c of SPEC.columns) { const s = SPEC.columnSize / 2;
    if (c.z < 0) {            // the two piers carrying the mezzanine: stone from floor to ceiling, passing through fascia and screen
      const h = PH2, w = 2 * h; ctx.addCollider(c.x - h, c.z - h, c.x + h, c.z + h);
      [[0, 0, 1], [1, 1, 0], [2, 0, -1], [3, -1, 0]].forEach(([k, nx, nz]) => { const g = new THREE.PlaneGeometry(w, CH), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w + k * w + c.x, uv.getY(i) * CH);   // UVs in metres, v = height above the floor so courses line up with the qibla wall; u runs on round the corners
        g.rotateY(Math.atan2(nx, nz)); const m = new THREE.Mesh(g, stoneMat); m.position.set(c.x + nx * h, F + CH / 2, c.z + nz * h); add(m, true, true);
        const e = h + .004, ax = c.x + nx * e - nz * h, az = c.z + nz * e + nx * h, bx2 = c.x + nx * e + nz * h, bz = c.z + nz * e - nx * h;
        aoStrip(ax, YC, az, bx2, YC, bz, 0, -.7, 0); aoStrip(ax, F + .012, az, bx2, F + .012, bz, 0, .4, 0); if (nz >= 0) aoStrip(ax, F + .022, az, bx2, F + .022, bz, nx * .45, 0, nz * .45); });
      flatQ(c.x, F + .017, c.z, 3.4, 3.4, mAOR); flatQ(c.x, F + .019, c.z + .5, 2.2, 1.6, mAOR); { const q = flatQ(c.x, YC - .016, c.z + .5, 2.2, 1.5, mAOR.clone()); q.material.opacity = .4; }
      continue; }
    bx(c.x - s, c.x + s, 0, CH - .08, c.z - s, c.z + s, mCol, true, true); ctx.addCollider(c.x - s - .03, c.z - s - .03, c.x + s + .03, c.z + s + .03);
    bx(c.x - s - .03, c.x + s + .03, 0, .12, c.z - s - .03, c.z + s + .03, mCol, true, true); bx(c.x - s + .03, c.x + s - .03, CH - .08, CH, c.z - s + .03, c.z + s - .03, mColGap, false, false);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const e = s + .005, ax = c.x + nx * e - nz * s, az = c.z + nz * e + nx * s, bx2 = c.x + nx * e + nz * s, bz = c.z + nz * e - nx * s;
      aoStrip(ax, YC, az, bx2, YC, bz, 0, -1.1, 0); aoStrip(ax, F + .012, az, bx2, F + .012, bz, 0, .6, 0); }
    flatQ(c.x, F + .017, c.z, 3.6, 3.6, mAOR); flatQ(c.x, YC - .016, c.z, 2.6, 2.6, mAOR); }

  // ------------------------------------------------------------------ 4. chandelier
  {
    const r = rng(777), N = 1500, cx = D.x, cz = D.z;
    const gs = () => (r() + r() + r() - 1.5) / 1.5;               // ~gaussian in -1..1
    const lg = new THREE.PlaneGeometry(.085, .05, 4, 1); { const p = lg.attributes.position, R = .1; for (let i = 0; i < p.count; i++) { const a = p.getX(i) / R; p.setXYZ(i, R * Math.sin(a), p.getY(i), R * (1 - Math.cos(a))); } lg.computeVertexNormals(); }
    const mLeaf = std({ color: 0xffffff, metalness: .1, roughness: .85, emissive: 0x9a8c74, emissiveIntensity: .5, side: THREE.DoubleSide });
    const leaves = new THREE.InstancedMesh(lg, mLeaf, N);
    const wg = new THREE.CylinderGeometry(.003, .003, 1, 3, 1, true); wg.translate(0, .5, 0);
    const wires = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ color: 0xcfc4b0, transparent: true, opacity: .1, depthWrite: false }), N);
    const o = new THREE.Object3D(), col = new THREE.Color(), cA = new THREE.Color(0xb5aa98), cB = new THREE.Color(0x8c8170), cC = new THREE.Color(0xd4cab8);
    for (let i = 0; i < N; i++) {
      let x, y, z;
      {                                                          // short, full cloud ~2.4 m wide under the dome, bottom 5.2 m above the floor so it clears the mihrab surround (5.6 m) seen from the back of the hall
        const tier = (r() * 15) | 0, t = (tier + .5) / 15, th = r() * 6.2832, shell = r() < .8 ? 1 : .35 + .5 * r(), rho = .68 * Math.pow(Math.sin(Math.PI * (.06 + .88 * t)), .75) * shell;   // 15 level tiers, leaves on the surface of a spindle (a few inside for depth)
        y = 4.5 + 1.38 * t + gs() * .025; x = Math.cos(th) * rho + gs() * .03; z = Math.sin(th) * rho + gs() * .03;
        const lim = .8; x = THREE.MathUtils.clamp(x, -lim, lim); z = THREE.MathUtils.clamp(z, -lim, lim);
      }
      const top = F + domeY(x, z);
      const sc = .8 + r() * .35; o.position.set(cx + x, F + y, cz + z); o.rotation.set((r() - .5) * .5, r() * 6.283, (r() - .5) * .5); o.scale.set(sc, sc * (.8 + r() * .5), sc); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
      const k = r(); col.copy(cA).lerp(k < .5 ? cB : cC, Math.abs(k - .5) * 1.6); leaves.setColorAt(i, col);
      o.rotation.set(0, 0, 0); o.scale.set(i % 6 ? 0 : 1, top - (F + y) - .03, i % 6 ? 0 : 1); o.position.y += .05; o.updateMatrix(); wires.setMatrixAt(i, o.matrix);   // one wire in six is drawn, so the wires stay a fine veil and the cluster keeps its outline
    }
    leaves.instanceColor.needsUpdate = true; add(leaves, false, false); wires.renderOrder = 3; add(wires, false, false);
  }

  // ------------------------------------------------------------------ 5. pendant bowls
  {
    const spots = [];
    for (const [x, W] of [[X1 - 1.15, SPEC.endWindows.east.lower], [X0 + 1.15, SPEC.endWindows.west.lower]]) spots.push([x, (W[0].z1 + W[1].z0) / 2]);   // one large bowl per end wall, on the plain pier between the first two windows (no glass behind or above it, clear of the screen)
    const RB = .6, BD = .26, rimY = F + 3.5 + BD;   // 1.2 m across, bottom 3.5 m above the floor
    const pts = []; for (let i = 0; i <= 12; i++) { const rr = RB * i / 12; pts.push(new THREE.Vector2(rr, BD * (rr / RB) ** 2.2 - BD)); } pts.push(new THREE.Vector2(RB + .012, .004)); pts.push(new THREE.Vector2(RB + .012, .014)); pts.push(new THREE.Vector2(RB - .01, .012));
    const bowlG = new THREE.LatheGeometry(pts, 40);
    const rodG = new THREE.CylinderGeometry(.004, .004, 1, 5), canG = new THREE.CylinderGeometry(.04, .04, .025, 14);
    const mWire = std({ color: 0xb9a57c, metalness: .5, roughness: .5, emissive: 0x5a4a30, emissiveIntensity: .6 });
    const bowls = new THREE.InstancedMesh(bowlG, mBrass, spots.length), rods = new THREE.InstancedMesh(rodG, mWire, spots.length * 3), cans = new THREE.InstancedMesh(canG, mBrass, spots.length);
    const innerG = new THREE.CircleGeometry(RB * .8, 24); innerG.rotateX(-Math.PI / 2);
    const inner = new THREE.InstancedMesh(innerG, new THREE.MeshBasicMaterial({ map: glowT, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending }), spots.length);
    const o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(); let ri = 0;
    const rod = (ax, ay, az, bx2, by, bz) => { a.set(ax, ay, az); b.set(bx2, by, bz); d.subVectors(b, a); const L = d.length(); o.position.copy(a).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(up, d.normalize()); o.scale.set(1, L, 1); o.updateMatrix(); rods.setMatrixAt(ri++, o.matrix); };
    spots.forEach(([x, z], i) => {
      o.position.set(x, rimY, z); o.rotation.set(0, i * 1.3, 0); o.scale.set(1, 1, 1); o.updateMatrix(); bowls.setMatrixAt(i, o.matrix);
      o.position.y = rimY - .03; o.updateMatrix(); inner.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 3; k++) { const an = k * 2.0944 + i; rod(x + Math.cos(an) * (RB - .015), rimY, z + Math.sin(an) * (RB - .015), x, YC - .02, z); }
      o.quaternion.identity(); o.scale.set(1, 1, 1); o.position.set(x, YC - .0125, z); o.updateMatrix(); cans.setMatrixAt(i, o.matrix);
      flatQ(x, YC - .018, z, .5, .5, mAOR);
    });
    add(bowls, true, false); add(rods); add(cans); inner.renderOrder = 2; add(inner, false, false);
  }

  // ------------------------------------------------------------------ 6. back wall (z = -10.55) with the glazed portal
  // Built in a local frame (wall face at local x = XW looking toward -X, lateral axis = local z) inside a group turned 90°,
  // so local z = world x and local x = -world z.
  const gBack = new THREE.Group(); gBack.rotation.y = Math.PI / 2; root.add(gBack); P = gBack;
  // The model's back wall has piers and a beam reaching 0.36 m into the room (to z = -10.19), so this wall is furred out to z = ZB = -10.10 to bury them.
  const XW = -ZB, WT = .33, ZC = (E.back.x0 + E.back.x1) / 2, L0 = X0, L1 = X1;       // door pair centred on the shell opening (x = -1.45)
  const DADO = 1.28;                                                    // dado datum shared with the limestone dado on the qibla wall
  const PW = 4.04, PH = SPEC.mezzanine.soffit;                                         // oak portal half-width / height
  const GA = 3.35, GH = 2.51;                                       // glazed opening half-width / height
  const HOLE = GA + .14, HOLEH = GH + .14;
  const nicheSides = [{ a: ZC - PW - 3.2, b: ZC - PW - .07, zs: L0, ze: ZC - PW }, { a: ZC + PW + .07, b: ZC + PW + 3.5, zs: ZC + PW, ze: L1 }];   // oak wainscot runs on to the corners
  {
    const outline = [[L0 - .2, 0], [ZC - HOLE, 0], [ZC - HOLE, HOLEH], [ZC + HOLE, HOLEH], [ZC + HOLE, 0], [L1 + .2, 0], [L1 + .2, CH], [L0 - .2, CH]];
    const geo = wallWithHoles(outline, nicheSides.map((n) => rectPts(n.a, .14, n.b, .9)), WT); geo.rotateY(-Math.PI / 2);
    const w = new THREE.Mesh(geo, mPlaster); w.position.set(XW + WT, F, 0); add(w, true, true);
    ctx.addCollider(X0 - .4, Z0 - .5, ZC - .9, ZB + .12); ctx.addCollider(ZC + .9, Z0 - .5, X1 + .4, ZB + .12);                 // world coords; 1.8 m doorway left open

    // oak portal: outer band + inner step
    { let acc = 0; const tones = [0xffffff, 0xe9e4dc, 0xfaf6ee];                                  // three steps, each set further back
      [[.22, .2], [.18, .15], [.15, .1]].forEach(([w, pr], k) => { const mv = mOakV.clone(), mh = mOak.clone(); mv.color.set(tones[k]); mh.color.set(tones[k]);
        for (const s of [-1, 1]) bx(XW - pr, XW + .02, 0, PH - acc, ZC + s * (PW - acc - w), ZC + s * (PW - acc), mv);
        bx(XW - pr, XW + .02, PH - acc - w, PH - acc, ZC - (PW - acc - w), ZC + (PW - acc - w), mh);
        if (k) { const y = F + PH - acc, x = XW - pr - .003, zz = PW - acc; aoStrip(x, y, ZC - zz, x, y, ZC + zz, 0, -.1, 0); for (const s of [-1, 1]) aoStrip(x, F, ZC + s * zz, x, y, ZC + s * zz, 0, 0, -s * .1); }
        acc += w; }); }
    // stepped limestone reveal
    for (const s of [-1, 1]) { bx(XW - .07, XW + WT, 0, HOLEH, ZC + s * (GA + .07), ZC + s * HOLE, mLime); bx(XW - .03, XW + WT, 0, GH + .07, ZC + s * GA, ZC + s * (GA + .07), mLime); }
    bx(XW - .07, XW + WT, GH + .07, HOLEH, ZC - GA - .07, ZC + GA + .07, mLime); bx(XW - .03, XW + WT, GH, GH + .07, ZC - GA, ZC + GA, mLime);

    // passage through the furred-out wall to the shell opening
    for (const s of [-1, 1]) bx(XW + WT, -Z0 + .36, 0, 2.7, ZC + s * 1.25, ZC + s * 1.37, mPlaster); bx(XW + WT, -Z0 + .36, 2.58, 2.7, ZC - 1.25, ZC + 1.25, mPlaster);
    // glazed screen just behind the wall face
    const fr = .05, XG = XW + .06, dp = .03, TR = GH - fr, DW = .9, DH = 2.4, PO = .14;   // no transom: the door head runs straight into the frame head under the soffit
    const frame = (y0, y1, z0, z1) => bx(XG - dp, XG + dp, y0, y1, z0, z1, mDark, true, false);
    frame(GH - fr, GH, ZC - GA, ZC + GA); frame(TR, TR + fr, ZC - GA, ZC + GA);
    for (const s of [-1, 1]) { frame(0, GH, ZC + s * (GA - fr), ZC + s * GA); frame(0, .05, ZC + s * (DW + PO), ZC + s * (GA - fr));
      frame(0, TR, ZC + s * (DW + PO), ZC + s * (DW + PO + .035));
      bx(XG - .06, XG + .06, 0, TR, ZC + s * DW, ZC + s * (DW + PO), mOakV, true, false); }       // door surround posts
    bx(XG - .06, XG + .06, DH, TR, ZC - DW, ZC + DW, mOak, true, false);                           // door head
    const veils = [], veilMat = (c, o, k) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false }); m.color.multiplyScalar(k); m.userData.o = o; veils.push(m); return m; };
    // painted courtyard seen through the glass: bright sky, pale sunlit walls either side, dark cypresses
    const bdT = canvasTex(1024, 512, (g, w, h) => { const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#c9b7a6'); sky.addColorStop(.45, '#e6c3a0'); sky.addColorStop(.8, '#f2cf9f'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const r = rng(4), cyp = (x, base, ht, wd, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - wd * .35, base); g.bezierCurveTo(x - wd, base - ht * .35, x - wd * .5, base - ht * .85, x, base - ht); g.bezierCurveTo(x + wd * .5, base - ht * .85, x + wd, base - ht * .35, x + wd * .35, base); g.fill(); };
      for (let i = 0; i < 9; i++) cyp(300 + i * 52 + r() * 30, 430, 190 + r() * 110, 15 + r() * 8, '#8d8a74');           // far, hazy
      g.fillStyle = '#a9a184'; g.beginPath(); g.ellipse(520, 400, 300, 46, 0, 0, 6.283); g.fill();
      for (const [x, ht, wd] of [[360, 330, 26], [455, 395, 30], [540, 350, 27], [640, 410, 31], [705, 300, 24]]) cyp(x, 440, ht, wd, '#4f5d4c');
      const wall = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); };
      wall([[0, 40], [250, 150], [250, 450], [0, 512]], '#d9c4a6'); wall([[250, 150], [300, 170], [300, 440], [250, 450]], '#b09a7e');
      wall([[1024, 60], [790, 160], [790, 450], [1024, 512]], '#e6cfae'); wall([[790, 160], [745, 178], [745, 440], [790, 450]], '#bba486');
      g.strokeStyle = 'rgba(120,100,78,.35)'; g.lineWidth = 1; for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(0, 40 + k * 52); g.lineTo(250, 150 + k * 33); g.moveTo(1024, 60 + k * 50); g.lineTo(790, 160 + k * 32); g.stroke(); }      // stone coursing
      g.strokeStyle = 'rgba(95,78,60,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 40); g.lineTo(250, 150); g.lineTo(300, 170); g.moveTo(1024, 60); g.lineTo(790, 160); g.lineTo(745, 178); g.stroke();                                    // parapet edge
      for (const [x, y, ww, hh] of [[60, 190, 34, 120], [150, 205, 30, 105], [860, 205, 30, 105], [950, 190, 34, 120]]) { g.fillStyle = '#6f6253'; g.fillRect(x, y, ww, hh); g.fillStyle = '#8f8676'; g.fillRect(x + 4, y + 5, ww - 8, hh - 10); g.fillStyle = '#6f6253'; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * .4, ww, 2); g.fillStyle = '#c9b494'; g.fillRect(x - 4, y + hh, ww + 8, 5); }
      const gr = g.createLinearGradient(0, 430, 0, h); gr.addColorStop(0, '#c2ab8c'); gr.addColorStop(1, '#dcc6a4'); g.fillStyle = gr; g.fillRect(0, 436, w, h - 436); }, { aniso: 4 });
    const mapUV = (g, za, zb, ya, yb) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (za + uv.getX(i) * (zb - za) - (ZC - GA)) / (2 * GA), (ya + uv.getY(i) * (yb - ya)) / GH); return g; };
    const mVeil = veilMat(0xffffff, 1, .95), mVeilDoor = veilMat(0xffffff, .96, .82); mVeil.map = mVeilDoor.map = bdT; mVeil.transparent = false; mVeil.depthWrite = true; veils.length = 0; veils.push(mVeilDoor);          // daylight haze seen from the hall side only (front faces look toward -X)
    const pane = (y0, y1, z0, z1) => { const g = new THREE.PlaneGeometry(Math.abs(z1 - z0), y1 - y0); g.rotateY(-Math.PI / 2); const m = new THREE.Mesh(g, mGlass); m.position.set(XG, F + (y0 + y1) / 2, (z0 + z1) / 2); m.renderOrder = 1; add(m, false, false);
      const v = new THREE.Mesh(mapUV(g.clone(), Math.min(z0, z1), Math.max(z0, z1), y0, y1), mVeil); v.position.copy(m.position); v.position.x += .012; v.renderOrder = 0; add(v, false, false); };
    for (const s of [-1, 1]) pane(.05, TR, ZC + s * (DW + PO + .035), ZC + s * (GA - fr));

    // door leaves (swing outward when the visitor comes close)
    const leaves = [];
    for (const s of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(XG, F, ZC + s * DW); P.add(piv); const dir = -s;       // leaf extends from the hinge toward the centre
      const lb = (y0, y1, za, zb, mat, hx = .02) => { const m = new THREE.Mesh(boxM(hx * 2, y1 - y0, Math.abs(zb - za)), mat); m.position.set(0, (y0 + y1) / 2, dir * (za + zb) / 2); m.castShadow = true; piv.add(m); return m; };
      lb(0, DH, 0, .045, mDark); lb(0, DH, DW - .045, DW - .004, mDark); lb(DH - .045, DH, .045, DW - .045, mDark); lb(0, .07, .045, DW - .045, mDark);
      const gg = new THREE.PlaneGeometry(DW - .09, DH - .115); gg.rotateY(-Math.PI / 2);
      const gl = new THREE.Mesh(gg, mGlass); gl.position.set(0, .07 + (DH - .115) / 2, dir * DW / 2); gl.renderOrder = 1; piv.add(gl); { const zc = ZC + s * DW / 2, hw = (DW - .09) / 2; const v = new THREE.Mesh(mapUV(gg.clone(), zc - hw, zc + hw, .07, DH - .045), mVeilDoor); v.position.copy(gl.position); v.position.x = .012; v.renderOrder = 0; piv.add(v); }
      const mt = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: motif(s > 0), color: new THREE.Color(1.5, 1.5, 1.5), transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false })); mt.position.copy(gl.position); mt.position.x = -.004; mt.renderOrder = 2; piv.add(mt);
      for (const hx of [-.055, .055]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.25, 8), mDark); h.position.set(hx, 1.2, dir * (DW - .1)); piv.add(h);
        for (const hy of [.65, 1.65]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .05, 6), mDark); st.rotation.z = Math.PI / 2; st.position.set(hx / 2, hy, dir * (DW - .1)); piv.add(st); } }
      leaves.push({ piv, s });
    }
    let open = 0; ctx.onFrame((dt) => { const c = ctx.camera.position, lx = -c.z, lz = c.x; const near = Math.hypot(lx - XG, lz - ZC) < 3.3 && c.y < YC ? 1 : 0; open += (near - open) * Math.min(1, dt * 3.2); const e = open * open * (3 - 2 * open);
      for (const l of leaves) l.piv.rotation.y = -l.s * e * 1.48;
      const k = THREE.MathUtils.clamp((XG - lx - 2.2) / 4, 0, 1); for (const m of veils) m.opacity = m.userData.o * k; });

    // plain recessed plaster panel from the portal head to the ceiling, same width as the portal, so the wall reads as one composition
    // plain closed door at mezzanine level (the mezzanine is entered from behind)
    { const y0 = MZ.floor, dw = .5, dh = 2.2, xf = XW - .035; bx(xf, XW, y0, y0 + dh, ZC - dw, ZC + dw, mTimber); for (const s of [-1, 1]) bx(xf - .015, XW, y0, y0 + dh + .07, ZC + s * dw, ZC + s * (dw + .07), mOakV); bx(xf - .015, XW, y0 + dh, y0 + dh + .07, ZC - dw, ZC + dw, mOak);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .32, 8), mDark); h.position.set(xf - .04, F + y0 + 1.05, ZC + dw - .1); add(h); }
    // wall sconces
    const mLamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.12, .92, .66) });
    const mGlow = new THREE.MeshBasicMaterial({ map: glowT, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const s of [-1, 1]) { const z = ZC + s * (PW + .62), xa = XW - .15;
      const SY = 2.2;                                                                               // ~0.45 m fitting centred 2.2 m above the floor
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .018, 18), mDark); plate.rotation.z = Math.PI / 2; plate.position.set(XW - .009, F + SY - .2, z); add(plate);
      bx(xa - .01, XW, SY - .21, SY - .19, z - .01, z + .01, mDark); bx(xa - .01, xa + .01, SY - .23, SY - .08, z - .01, z + .01, mDark);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(.075, .06, .05, 18), mDark); cup.position.set(xa, F + SY - .06, z); add(cup);
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.085, .075, .3, 18), mLamp); lamp.position.set(xa, F + SY + .1, z); add(lamp, false, false);
      const gq = new THREE.PlaneGeometry(1.7, 1.9); gq.rotateY(-Math.PI / 2); const gm = new THREE.Mesh(gq, mGlow); gm.position.set(XW - .009, F + SY, z); gm.renderOrder = 2; add(gm, false, false); }

    // low oak band with back-lit shelf niches
    const nicheBack = canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5e4630'); gr.addColorStop(.1, '#c9a67a'); gr.addColorStop(.35, '#a3835c'); gr.addColorStop(1, '#644b33'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { aniso: 1 });
    const mBack = new THREE.MeshBasicMaterial({ map: nicheBack }), mLed = new THREE.MeshBasicMaterial({ color: 0xffcf8e });
    const mNicheOak = std({ map: oakT, roughness: .6, emissive: 0xffc890, emissiveIntensity: .06 });
    const bookCols = [0x2f4a3a, 0x5a2a26, 0x23303f, 0x3b3128, 0x6a5a3a, 0x1f1d1c]; const r = rng(55);
    nicheSides.forEach((n, si) => {
      const fg = wallWithHoles(rectPts(n.zs, 0, n.ze, DADO), [rectPts(n.a, .14, n.b, .9)], .04); fg.rotateY(-Math.PI / 2);
      const fm = new THREE.Mesh(fg, mOak); fm.position.set(XW, F, 0); add(fm, false, true);
      bx(XW - .045, XW, DADO - .012, DADO, n.zs, n.ze, mOak);
      const xb = XW + .32;
      const bp = new THREE.Mesh(new THREE.PlaneGeometry(n.b - n.a, .76).rotateY(-Math.PI / 2), mBack); bp.position.set(xb, F + .52, (n.a + n.b) / 2); add(bp, false, false);
      bx(xb, xb + .03, .1, .94, n.a - .03, n.b + .03, mOak); bx(XW, xb + .03, .9, .94, n.a - .03, n.b + .03, mNicheOak); bx(XW, xb + .03, .1, .14, n.a - .03, n.b + .03, mNicheOak);
      bx(XW, xb, .14, .9, n.a - .03, n.a, mNicheOak); bx(XW, xb, .14, .9, n.b, n.b + .03, mNicheOak);
      bx(xb - .03, xb - .005, .875, .9, n.a, n.b, mLed, false, false);
      const span = n.b - n.a, cuts = si ? [.27, .78, .9] : [.1, .22, .73]; const edges = [0, ...cuts, 1];
      for (const c of cuts) bx(XW - .04, xb, .14, .9, n.a + span * c - .02, n.a + span * c + .02, mNicheOak);
      // contents: Qur'an stands (rehal) and stacked books
      for (let b = 0; b < edges.length - 1; b++) { const z0 = n.a + span * edges[b] + .05, z1 = n.a + span * edges[b + 1] - .05, wdt = z1 - z0; if (wdt < .25) { if (wdt > .12) { let y = .14; for (let k = 0; k < 3; k++) { const hh = .03 + r() * .02; bx(XW + .06, XW + .25, y, y + hh, z0 + .01, z1 - .01, std({ color: bookCols[(r() * 6) | 0], roughness: .7 })); y += hh; } } continue; }
        const items = Math.max(1, Math.round(wdt / .55)); for (let k = 0; k < items; k++) { const zc = z0 + wdt * (k + .5) / items + (r() - .5) * .08;
          if (r() < .45) { for (const t of [-1, 1]) { const m = new THREE.Mesh(boxM(.2, .34, .012), std({ color: 0x4a3524, roughness: .55 })); m.position.set(XW + .15, F + .14 + .15, zc); m.rotation.x = t * .55; add(m); }
            const bk = new THREE.Mesh(boxM(.17, .02, .2), std({ color: 0xe9e2cf, roughness: .8 })); bk.position.set(XW + .15, F + .43, zc); add(bk); }
          else { let y = .14; const cnt = 2 + (r() * 4 | 0); for (let q = 0; q < cnt; q++) { const hh = .028 + r() * .025, bw = .2 + r() * .06; const m = bx(XW + .05, XW + .05 + .16 + r() * .03, y, y + hh, zc - bw / 2, zc + bw / 2, std({ color: bookCols[(r() * 6) | 0], roughness: .7 })); m.rotation.y = (r() - .5) * .12; y += hh; } } } }
    });
    // contact shadows and the daylight pool in front of the doors
    { const xw = XW - .006, yf = F + .017;
      for (const s of [-1, 1]) { const ze = s > 0 ? L1 : L0;
        aoStrip(XW - .04, yf, ZC + s * PW, XW - .04, yf, ze, -.7, 0, 0); aoStrip(XW - .22, yf, ZC + s * (GA + .1), XW - .22, yf, ZC + s * PW, -.45, 0, 0);
        aoStrip(xw, F, ze, xw, YC, ze, 0, 0, -s * .8); aoStrip(xw, F + DADO, ZC + s * PW, xw, F + PH, ZC + s * PW, 0, 0, s * .3); aoStrip(xw, F + DADO + .002, ZC + s * PW, xw, F + DADO + .002, ze, 0, .18, 0); }
      aoStrip(xw, YC, L0, xw, YC, L1, 0, -.9, 0); aoStrip(xw, F + MZ.soffit, L0, xw, F + MZ.soffit, L1, 0, -.5, 0); aoStrip(xw, F + MZ.floor, L0, xw, F + MZ.floor, L1, 0, .3, 0);
      const pool = flatQ(XW - 2.9, F + .021, ZC, 7.5, 8.5, mPool); pool.renderOrder = 2; }
  }
  P = root;

  // ------------------------------------------------------------------ 7. side entrances in the two end walls (z -7.7…-5.7) + my strip of each end wall (z -10.55…-4.6)
  // Local frame again: wall face at local x = XW looking -X. East wall: identity. West wall: group turned 180° (local z = -world z).
  const sideDoors = [], mPlasterEnd = std({ map: plasterT, normalMap: plasterN, normalScale: new THREE.Vector2(.3, .3), color: 0xf1ede6, roughness: .93, emissive: 0xf6f1ea, emissiveIntensity: .3 }), stoneEnd = stoneMat.clone();   // lifted: this strip sits in the mezzanine's shadow and read as a grey patch
  stoneEnd.emissive = new THREE.Color(0xffffff); stoneEnd.emissiveMap = stoneMat.map; stoneEnd.emissiveIntensity = .3;
  const sideWall = (g, XW, la, lb, lc, toLocal) => {
    P = g; const WT = .25, HW = (E.east.z1 - E.east.z0) / 2, FW = .1, DH = 2.38, xw = XW - .006, yf = F + .017;
    const HT = SPEC.mezzanine.soffit; const outline = [[la, 0], [lc - HW - FW, 0], [lc - HW - FW, HT], [lc + HW + FW, HT], [lc + HW + FW, 0], [lb, 0], [lb, CH], [la, CH]];
    const geo = wallWithHoles(outline, [], WT); geo.rotateY(-Math.PI / 2); const w = new THREE.Mesh(geo, mPlasterEnd); w.position.set(XW + WT, F, 0); add(w, true, true);
    { const zj = Math.abs(lb) < Math.abs(la) ? lb : la; bx(XW - .02, XW + .004, 0, CH, zj - .008, zj + .008, std({ color: 0x4a443b, roughness: 1 })); }
    for (const [za, zb] of [[la, lc - HW - FW], [lc + HW + FW, lb]]) { { const g = new THREE.PlaneGeometry(zb - za, 1.28), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (zb - za) + za, uv.getY(i) * 1.28); g.rotateY(-Math.PI / 2);   // honed limestone dado to the 1.28 m datum, UVs in metres from the floor
        const m = new THREE.Mesh(g, stoneEnd); m.position.set(XW - .02, F + .64, (za + zb) / 2); add(m, false, true); bx(XW - .02, XW, 1.265, 1.28, za, zb, stoneEnd, false, true); }
      aoStrip(xw - .035, yf, za, xw - .035, yf, zb, -.6, 0, 0); aoStrip(xw, F + 1.284, za, xw, F + 1.284, zb, 0, .16, 0); }
    for (const s of [-1, 1]) { bx(XW - .07, XW + WT, 0, HT, lc + s * HW, lc + s * (HW + FW), mOakV); aoStrip(xw, F, lc + s * (HW + FW), xw, F + HT, lc + s * (HW + FW), 0, 0, s * .12); }
    bx(XW - .07, XW + WT, DH, DH + FW, lc - HW, lc + HW, mOak); bx(XW - .07, XW + WT, HT - FW, HT, lc - HW, lc + HW, mOak); bx(XW + .08, XW + .14, DH + FW, HT - FW, lc - HW, lc + HW, mTimber); aoStrip(xw, F + HT, lc - HW - FW, xw, F + HT, lc + HW + FW, 0, .12, 0);
    aoStrip(xw, YC, la, xw, YC, lb, 0, -.9, 0); aoStrip(xw, F + SPEC.mezzanine.soffit, la, xw, F + SPEC.mezzanine.soffit, lb, 0, -.5, 0);
    const leaves = [];
    for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(XW + .12, F, lc + s * HW); P.add(piv); const dir = -s;
      const leaf = new THREE.Mesh(boxM(.05, DH - .02, HW - .006), mTimber); leaf.position.set(0, (DH - .02) / 2 + .01, dir * HW / 2); leaf.castShadow = true; piv.add(leaf);
      for (let k = 1; k < 5; k++) { const gr = new THREE.Mesh(boxM(.052, DH - .02, .008), std({ color: 0x4a3622, roughness: .8 })); gr.position.set(0, (DH - .02) / 2 + .01, dir * HW * k / 5); piv.add(gr); }
      for (const hx of [-.06, .06]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .7, 8), mDark); h.position.set(hx, 1.15, dir * (HW - .12)); piv.add(h);
        for (const hy of [.88, 1.42]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .06, 6), mDark); st.rotation.z = Math.PI / 2; st.position.set(hx / 2, hy, dir * (HW - .12)); piv.add(st); } }
      leaves.push({ piv, s }); }
    sideDoors.push({ leaves, XW, lc, toLocal, open: 0 }); P = root;
  };
  const gW = new THREE.Group(); gW.rotation.y = Math.PI; root.add(gW);
  sideWall(root, X1, Z0, SPEC.endWallSplitZ, (E.east.z0 + E.east.z1) / 2, (c) => [c.x, c.z]);
  sideWall(gW, -X0, -SPEC.endWallSplitZ, -Z0, -(E.west.z0 + E.west.z1) / 2, (c) => [-c.x, -c.z]);
  ctx.onFrame((dt) => { const c = ctx.camera.position; for (const d of sideDoors) { const [lx, lz] = d.toLocal(c); const near = Math.hypot(lx - d.XW, lz - d.lc) < 3.0 && c.y < YC ? 1 : 0; d.open += (near - d.open) * Math.min(1, dt * 3.2);
    const e = d.open * d.open * (3 - 2 * d.open); for (const l of d.leaves) l.piv.rotation.y = l.s * e * 1.45; } });
  // colliders: the visitor can only pass through the three doorways
  ctx.addCollider(X1 - .1, Z0 - .5, X1 + .5, E.east.z0); ctx.addCollider(X1 - .1, E.east.z1, X1 + .5, Z1 + .5);
  ctx.addCollider(X0 - .5, Z0 - .5, X0 + .1, E.west.z0); ctx.addCollider(X0 - .5, E.west.z1, X0 + .1, Z1 + .5);
  ctx.addCollider(X0 - .5, Z1, -SPEC.mihrab.width / 2, Z1 + .4); ctx.addCollider(SPEC.mihrab.width / 2, Z1, X1 + .5, Z1 + .4); ctx.addCollider(-SPEC.mihrab.width / 2 - .3, Z1 + SPEC.mihrab.depth, SPEC.mihrab.width / 2 + .3, Z1 + SPEC.mihrab.depth + .3);
  ctx.addCollider(-SPEC.mihrab.width / 2 - .3, Z1, -SPEC.mihrab.width / 2, Z1 + SPEC.mihrab.depth + .3); ctx.addCollider(SPEC.mihrab.width / 2, Z1, SPEC.mihrab.width / 2 + .3, Z1 + SPEC.mihrab.depth + .3);

  // ------------------------------------------------------------------ 7a. mezzanine over the back third (no stair; entered from behind at its own level)
  {
    const ySof = F + MZ.soffit, mSoffit = std({ color: 0xcfcbc3, roughness: 1, emissive: 0xfaf2e8, emissiveIntensity: .12 }), mFascia = std({ map: plasterT, normalMap: plasterN, normalScale: new THREE.Vector2(.2, .2), color: 0xf2eee7, roughness: .93, emissive: 0xf8f3ec, emissiveIntensity: .5 });
    bx(X0, X1, MZ.soffit + .02, MZ.floor - .02, ZB, FZ0, mSoffit, true, false);                                         // structural slab (hidden between soffit and carpet)
    { const sg = new THREE.PlaneGeometry(X1 - X0, FZ1 - .02 - ZB); sg.rotateX(Math.PI / 2); const sm = new THREE.Mesh(sg, mSoffit); sm.position.set((X0 + X1) / 2, ySof, (ZB + FZ1 - .02) / 2); add(sm, false, false); }   // flat soffit, running under the fascia to its face
    { const m = new THREE.Mesh(boxM(X1 - X0, .02, FZ0 - ZB), mCarpet); m.position.set((X0 + X1) / 2, F + MZ.floor - .01, (ZB + FZ0) / 2); add(m, false, true); }                                                   // same client carpet on the mezzanine floor
    const JG = .1, SEG = [[X0, -PIERX - PH2 - JG], [-PIERX + PH2 + JG, PIERX - PH2 - JG], [PIERX + PH2 + JG, X1]], mGapF = std({ color: 0x4a443b, roughness: 1 });   // three bays: end wall – pier – pier – end wall
    for (const [a, b] of SEG) { bx(a, b, MZ.soffit + .03, MZ.parapetTop - .04, FZ0, FZ1, mFascia, true, true); bx(a, b, MZ.soffit, MZ.soffit + .03, FZ0, FZ1 - .025, mGapF, false, false); bx(a, b, MZ.parapetTop - .04, MZ.parapetTop, FZ0 - .02, FZ1 + .02, mOak, false, true);
      const zf = FZ1 + .004, y0 = F + MZ.soffit + .03, y1 = F + MZ.parapetTop - .04, mFG = mAO.clone(); mFG.opacity = .16;               // fascia shading: fine shadow line under the capping, gentle gradient up from the bottom edge
      aoStrip(a, y1, zf, b, y1, zf, 0, -.07, 0); aoStrip(a, y0, zf, b, y0, zf, 0, y1 - y0, 0, mFG); }
    { const mJ = std({ color: 0x8f8a80, roughness: 1 }); for (const s of [-1, 1]) for (const t of [-1, 1]) { const xa = s * PIERX + t * PH2, xb = xa + t * JG; bx(Math.min(xa, xb), Math.max(xa, xb), MZ.soffit, MZ.parapetTop, FZ1 - .32, FZ1 - .3, mJ, false, true); } }   // back of the recessed joint beside each pier                                    // one tall plain white band, flush with the column front faces


    // recessed downlights in the soffit, on the same 3.25 m grid
    const GP = Math.abs(SPEC.columns[1].x), sd = []; for (let i = -3; i <= 3; i++) for (const z of [-8.4]) sd.push([i * GP, z]);
    const mk = (geo, mat, dy) => { geo.rotateX(Math.PI / 2); const im = new THREE.InstancedMesh(geo, mat, sd.length), o = new THREE.Object3D(); sd.forEach(([x, z], i) => { o.position.set(x, ySof - dy, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); add(im, false, false); };
    mk(new THREE.PlaneGeometry(.095, .095), new THREE.MeshBasicMaterial({ color: 0xcfc9be }), .004); mk(new THREE.PlaneGeometry(.075, .075), new THREE.MeshBasicMaterial({ color: 0x6a645b }), .007); mk(new THREE.CircleGeometry(.022, 12), new THREE.MeshBasicMaterial({ color: 0xffe6bf }), .010);
    for (const [x, z] of sd) flatQ(x, F + .0205, z, 2.6, 2.6, mPool);                                                    // their soft pools on the carpet
    // contact shadows: soffit against the walls, and the dimmer zone on the carpet under the mezzanine
    const ys = ySof - .012, mSofAO = mAO.clone(); mSofAO.opacity = .38; aoStrip(X0, ys, ZB, X1, ys, ZB, 0, 0, .9, mSofAO); aoStrip(X0, ys, ZB, X0, ys, FZ1, .7, 0, 0, mSofAO); aoStrip(X1, ys, ZB, X1, ys, FZ1, -.7, 0, 0, mSofAO);
    const mShade = new THREE.MeshBasicMaterial({ color: 0x1a120a, transparent: true, opacity: .2, depthWrite: false }), mShadeG = mAO.clone(); mShadeG.opacity = .2; mShadeG.color.set(0x1a120a);
    flatQ((X0 + X1) / 2, F + .0162, (ZB + FZ1) / 2, X1 - X0, FZ1 - ZB, mShade); aoStrip(X0, F + .0162, FZ1, X1, F + .0162, FZ1, 0, 0, 1.8, mShadeG);
  }

  // ------------------------------------------------------------------ 7c. rawashin screen: a light flush walnut screen ONLY in the open gap above the white fascia (parapet top to ceiling), in three bays between end walls and stone piers
  {
    const WAL = '#93684a', r = rng(4141);                                                                                    // mid walnut, matte
    const wal = (g, x, y, w, h) => { g.fillStyle = WAL; g.fillRect(x, y, w, h); for (let i = 0; i < w * .9; i++) { const xx = x + r() * w; g.strokeStyle = r() < .6 ? `rgba(24,12,6,${.1 + r() * .22})` : `rgba(150,105,70,${.06 + r() * .12})`; g.lineWidth = .6 + r(); g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + (r() - .5) * 3, y + h); g.stroke(); } };
    const lattice = (g, x, y, w, h, p, t) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = WAL; g.lineWidth = t; for (let k = -h; k < w + h; k += p) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k + h, y + h); g.moveTo(x + k + h, y); g.lineTo(x + k, y + h); g.stroke(); } g.restore(); };
    const wm = (o) => std({ roughness: .86, metalness: 0, emissive: 0x3a2412, emissiveIntensity: .8, ...(o.alphaTest ? { alphaToCoverage: true } : {}), ...o });
    const mWal = wm({ map: canvasTex(256, 256, (g, w, h) => wal(g, 0, 0, w, h), { repeat: [1 / .6, 1 / .6] }) });
    const latM = (p, t) => wm({ map: canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); lattice(g, 0, 0, w, h, p, t); }, { aniso: 8 }), alphaTest: .5, side: THREE.DoubleSide }), mLat = latM(21.33, 5.5), mLatOpen = latM(32, 4.2);
    const mArch = wm({ map: canvasTex(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = WAL; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(26, h - 4); g.lineTo(26, 92); g.quadraticCurveTo(28, 30, w / 2, 14); g.quadraticCurveTo(w - 28, 30, w - 26, 92); g.lineTo(w - 26, h - 4); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(26, 92); g.lineTo(w - 26, 92); g.moveTo(w / 2, 92); g.lineTo(w / 2, h - 4); g.stroke(); }, { aniso: 8 }), alphaTest: .4, side: THREE.DoubleSide });
    const mGlowA = new THREE.MeshBasicMaterial({ color: 0xffb468, transparent: true, opacity: .13, depthWrite: false, blending: THREE.AdditiveBlending });
    const quad = (x0, x1, y0, y1, z, mat, ru = 1, rv = 1) => { const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv); const m = new THREE.Mesh(g, mat); m.position.set((x0 + x1) / 2, F + (y0 + y1) / 2, z); return add(m, false, true); };
    const P = .06, zc = FZ1 - P / 2, yP = MZ.parapetTop, yB = yP + .05, yL = yP + 1.03, yT = CH - .05;                         // 6 cm posts, front face in the fascia plane; lattice only in the lower ~40 %
    // full modules in every bay: 8 between each end wall and its pier, 5 between the piers (the middle one on the hall axis); mirrored about x = 0
    const JG = .1, bays = [[X0, -PIERX - PH2 - JG, 8, (j) => (7 - j) % 3 === 1], [-PIERX + PH2 + JG, PIERX - PH2 - JG, 5, (j) => j === 2], [PIERX + PH2 + JG, X1, 8, (j) => j % 3 === 1]];
    for (const [a0, b0, n, strongAt] of bays) { const mw = (b0 - a0) / n;
      bx(a0, b0, yP, yB, zc - P / 2, zc + P / 2, mWal); bx(a0, b0, yT, CH, zc - P / 2, zc + P / 2, mWal); bx(a0, b0, yL, yL + .03, zc - .02, zc + .02, mWal);     // thin bottom rail on the parapet, thin top rail under the ceiling, hairline rail over the lattice
      for (let j = 0; j <= n; j++) { const x = a0 + j * mw; bx(Math.max(a0, x - P / 2), Math.min(b0, x + P / 2), yB, yT, zc - P / 2, zc + P / 2, mWal, true, true); }
      for (let j = 0; j < n; j++) { const a = a0 + j * mw + P / 2, b = a0 + (j + 1) * mw - P / 2, strong = strongAt(j);                                        // every third module and the one on the axis: fuller lattice, flush
        quad(a, b, yB, yL, zc, strong ? mLat : mLatOpen, (b - a) / .4, (yL - yB) / .4);
        if (strong) { quad(a, b, yT - .34, yT, zc, mLat, (b - a) / .4, .34 / .4); bx(a, b, yT - .365, yT - .34, zc - .015, zc + .015, mWal); }
        quad(a + .12, b - .12, yL + .1, yT - (strong ? .42 : .1), zc, mArch); }                                                                             // slender arched window outline in thin timber lines, not filled
      quad(a0, b0, yB, yL, zc - .05, mGlowA); }                                                                                                              // soft warm light behind the lattice band
  }

  // ------------------------------------------------------------------ 7b. fake ambient occlusion at the room's junctions
  {
    const yf = F + .017, yc = YC - .016;
    for (const [y, w] of [[yc, 1.3], [yf, .7]]) { aoStrip(X0, y, ZB, X1, y, ZB, 0, 0, w); aoStrip(X0, y, ZB, X0, y, Z1, w, 0, 0); aoStrip(X1, y, ZB, X1, y, Z1, -w, 0, 0);
      aoStrip(X0, y, Z1, X1, y, Z1, 0, 0, -w); }
  }

  // ------------------------------------------------------------------ 8. lighting (5 lights, none casting shadows) and tone
  {
    const pl = (c, i, dist, x, y, z, decay = 1) => { const l = new THREE.PointLight(c, i, dist, decay); l.position.set(x, F + y, z); l.castShadow = false; root.add(l); return l; };
    pl(0xfff0e0, 6.4, 30, X1 - 1.2, 3.1, -1.2); pl(0xf7f1e8, 4.6, 26, X0 + 1.2, 3.1, -1.2);                                                // daylight key (east windows) / fill (west windows): warm white, low saturation, close enough in strength that the wall tone holds from view to view
    pl(0xffeedd, 2.3, 15, 0, 2.2, -8.2);                                                                // under the mezzanine: a little dimmer, slightly warmer, not black
    pl(0xfff4e8, 1.5, 8, D.x, CH - .6, D.z);                                                  // dome / chandelier glow
    pl(0xfff0e0, 1.0, 8, (E.back.x0 + E.back.x1) / 2, 1.8, ZB + 1.6);                     // daylight at the glazed doors
    for (const [x, z] of [[-8.4, -1.6], [0, -2.4], [8.4, -1.6]]) { const sp = new THREE.SpotLight(0xfff4ea, 5.0, 13, .9, 1, 1); sp.position.set(x, F + CH - .3, z); sp.target.position.set(x, F, z); sp.castShadow = false; root.add(sp, sp.target); }   // soft downlight wash so the cream carpet reads
    ctx.exposureIn = 1.0; ctx.hemiIn = .34;
  }
}
