// The site around the walk: loader, room tags, room files, the scale ruler, the rooms index.
// It reads the camera from main.js through window.__house and the 'house:frame' event.
import * as THREE from 'three';

// Seven rooms on the walk. p = where the walk reaches the room (timeline 0–2.8), range = while it is "the current room".
export const ROOMS = [
  { no: '01', key: 'arrival', name: 'Arrival', p: 0.43, range: [0.36, 0.56], at: [10.75, 0.6, 21.6],
    meta: 'Yousef The First · arrival · A-101',
    text: 'The house is entered across water. Four travertine steps float over a still pool to a recessed porch, and the door is a single oak leaf that turns on a pivot instead of swinging on hinges.',
    facts: [['Reflecting pool', '4.20 × 3.50 m'], ['Steps', '4 × travertine, 1.60 × 0.60 m'], ['Door', 'Oak pivot, 1.80 × 3.60 m'], ['Porch canopy', '+3.85 m']] },
  { no: '02', key: 'gallery', name: 'Entry gallery', p: 0.62, range: [0.56, 0.72], at: [10.75, 1.4, 12.4],
    meta: 'Yousef The First · entry gallery · A-101',
    text: 'A long room for one painting and one sculpture. The west wall is solid; the east wall is glass onto a narrow light court planted with two small olives, so the gallery is lit from the side all afternoon.',
    facts: [['Size', '3.50 × 9.00 m'], ['Ceiling', '4.20 m'], ['Floor', 'Honed travertine, 0.80 × 1.60 m'], ['Light court', '2.50 × 6.00 m']] },
  { no: '03', key: 'living', name: 'Living room', p: 0.84, range: [0.72, 1.06], at: [12.5, 1.4, 4.5],
    meta: 'Yousef The First · living · A-101',
    text: 'The tallest room in the house, six metres to the ceiling. Two walls are glass, to the north garden and the inner garden. The west wall is a travertine mass with a long basalt fireplace and a clerestory above it that catches the last sun.',
    facts: [['Size', '9.00 × 7.00 m'], ['Ceiling', '6.00 m'], ['Floor', 'Oak planks, 240 mm wide'], ['Fireplace', '2.60 m, basalt surround']] },
  { no: '04', key: 'dining', name: 'Dining & kitchen', p: 1.2, range: [1.06, 1.42], at: [19, 1.4, 13.4],
    meta: 'Yousef The First · dining and kitchen · A-101',
    text: 'One open room fourteen and a half metres long. Ten seats sit under a single bronze line of light, and the kitchen gathers around a four metre island in travertine that falls to the floor at both ends.',
    facts: [['Dining', '8.00 × 6.50 m'], ['Kitchen', '8.00 × 4.50 m'], ['Ceiling', '4.20 m'], ['Island', '4.00 m, travertine waterfall']] },
  { no: '05', key: 'terrace', name: 'Terrace & pool', p: 1.52, range: [1.42, 1.70], at: [33, 0.6, 14.25],
    meta: 'Yousef The First · terrace and pool · A-101',
    text: 'The east glass of the kitchen slides away onto a covered terrace. From there a fourteen metre pool runs east to the pool house, with loungers along its sunny side and limestone all around.',
    facts: [['Terrace', '4.50 × 11.00 m, roof at 3.80 m'], ['Pool', '14.00 × 4.50 m'], ['Deck', 'Limestone, 1.20 × 0.60 m'], ['Pool house', '2.50 × 9.00 m']] },
  { no: '06', key: 'master', name: 'Master suite', p: 1.86, range: [1.70, 2.03], at: [33, 1.4, 3.6],
    meta: 'Yousef The First · master suite · A-101',
    text: 'A quiet room at the end of the wing. A six metre wall of walnut stands behind the bed, lit from a slot in the ceiling, and the south glass slides open straight toward the water.',
    facts: [['Size', '8.00 × 6.00 m'], ['Ceiling', '3.80 m'], ['Floor', 'Oak planks'], ['Slider', '2.80 m to the pool deck']] },
  { no: '07', key: 'bath', name: 'Bath & spa', p: 2.2, range: [2.03, 2.42], at: [40.6, 1.2, 4.0],
    meta: 'Yousef The First · bath and spa · A-101',
    text: 'A stone bath stands under a skylight, with a basalt rain shower in the corner and a walnut vanity on a travertine wall. The glass slides onto a walled terrace with a sunken spa and a low parapet over the garden.',
    facts: [['Bath', '4.50 × 6.00 m'], ['Skylight', '1.00 × 2.30 m'], ['Tub', 'Travertine, 1.80 m'], ['Spa', '2.20 × 2.20 m, basalt']] },
];

const $ = id => document.getElementById(id);
const H = () => window.__house;
const mq = matchMedia('(max-width: 760px)');

// ---------------- loader ----------------
const loader = $('loader'), fill = $('loadFill'), pct = $('loadPct');
addEventListener('house:loading', e => {
  const f = e.detail.f;
  fill.style.transform = `scaleX(${f})`;
  pct.textContent = Math.round(f * 100) + '%';
  if (f >= 1) { setTimeout(() => loader.classList.add('done'), 450); requestAnimationFrame(() => { const h = H(); if (h) placeTags(h.p); }); }
});
// No WebGL 2: say so instead of leaving a blank sheet.
(() => {
  let ok = false;
  try { ok = !!document.createElement('canvas').getContext('webgl2'); } catch { ok = false; }
  if (!ok) { $('nogl').hidden = false; loader.classList.add('done'); }
})();
const failWatch = setInterval(() => {
  if (document.body.dataset.error) { clearInterval(failWatch); loader.querySelector('.loader__note').textContent = 'The house could not be drawn on this device. ' + document.body.dataset.error; }
  if (document.body.classList.contains('ready')) clearInterval(failWatch);
}, 500);

// ---------------- room tags ----------------
const spots = $('spots');
const v = new THREE.Vector3();
for (const r of ROOMS) {
  const b = document.createElement('button');
  b.className = 'tag'; b.type = 'button'; b.dataset.key = r.key;
  b.innerHTML = `<i>${r.no}</i><span>${r.name}</span>`;
  b.setAttribute('aria-label', `Room ${r.no}, ${r.name}: open the room file`);
  b.addEventListener('click', () => openFile(r));
  spots.appendChild(b);
  r.tag = b;
}
function currentRoom(p) { return ROOMS.findIndex(r => p >= r.range[0] && p < r.range[1]); }

function placeTags(p) {
  const h = H(); if (!h?.camera) return;
  const onSheet = p < 0.085 || p > 2.68;
  const W = innerWidth, Hh = innerHeight;
  const hero = p < 0.085 ? document.querySelector('.sheet .hero')?.getBoundingClientRect() : null;
  for (const [i, r] of ROOMS.entries()) {
    const show = onSheet;
    v.set(...r.at).project(h.camera);
    const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * Hh;
    const underHero = hero && sx > hero.left - 14 && sx < hero.right + 14 && sy > hero.top - 14 && sy < hero.bottom + 14;
    const visible = show && !underHero && v.z < 1 && Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.94;
    r.tag.classList.toggle('on', visible);
    r.tag.classList.toggle('tag--sheet', onSheet);
    r.tag.tabIndex = visible ? 0 : -1;
    if (visible) r.tag.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
  }
}

// captions along the walk carry a button to the room's file
document.querySelectorAll('.cap__file').forEach(b => b.addEventListener('click', () => openFile(ROOMS.find(r => r.key === b.dataset.room))));

// ---------------- room file ----------------
const file = $('file');
let fileOpen = false, lastFocus = null, fileRoom = null;
function openFile(r) {
  fileRoom = r;
  $('fileNo').textContent = `Room ${r.no} of 07`;
  $('fileTitle').textContent = r.name;
  $('fileMeta').textContent = r.meta;
  $('fileText').textContent = r.text;
  $('fileFacts').innerHTML = r.facts.map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join('');
  $('fileWalk').textContent = `Walk to the ${r.name.toLowerCase()} →`;
  closeIndex();
  if (!fileOpen) lastFocus = document.activeElement;
  fileOpen = true;
  file.classList.add('open'); file.setAttribute('aria-hidden', 'false'); file.inert = false;
  $('fileClose').focus({ preventScroll: true });
}
function closeFile() {
  if (!fileOpen) return;
  fileOpen = false;
  file.classList.remove('open'); file.setAttribute('aria-hidden', 'true'); file.inert = true;
  lastFocus?.focus?.({ preventScroll: true });
}
file.inert = true;
$('fileClose').addEventListener('click', closeFile);
$('fileWalk').addEventListener('click', () => { const r = fileRoom; closeFile(); if (r) H()?.walkTo?.(r.p); });

// ---------------- rooms index ----------------
const index = $('index');
const list = $('indexList');
list.innerHTML = ROOMS.map(r => `<li><button type="button" data-walk="${r.key}"><i>${r.no}</i><b>${r.name}</b><span>${r.facts[0][1]}</span></button><button type="button" class="read" data-read="${r.key}" aria-label="Read about the ${r.name.toLowerCase()}">File</button></li>`).join('');
list.addEventListener('click', e => {
  const w = e.target.closest('[data-walk]'), rd = e.target.closest('[data-read]');
  if (w) { closeIndex(); H()?.walkTo?.(ROOMS.find(r => r.key === w.dataset.walk).p); }
  if (rd) openFile(ROOMS.find(r => r.key === rd.dataset.read));
});
function openIndex() { closeFile(); index.classList.add('open'); index.inert = false; $('roomsBtn').setAttribute('aria-expanded', 'true'); list.querySelector('button')?.focus({ preventScroll: true }); }
function closeIndex() { if (!index.classList.contains('open')) return; index.classList.remove('open'); index.inert = true; $('roomsBtn').setAttribute('aria-expanded', 'false'); }
index.inert = true;
$('roomsBtn').addEventListener('click', () => index.classList.contains('open') ? closeIndex() : openIndex());
$('indexClose').addEventListener('click', closeIndex);
$('roomsBtn2')?.addEventListener('click', () => openFile(ROOMS[0]));
addEventListener('keydown', e => { if (e.key === 'Escape') { closeFile(); closeIndex(); } });

// ---------------- scale ruler and room count ----------------
const ruler = $('ruler'), now = $('rulerNow'), count = $('count');
const P_MAX = 2.8;
for (let i = 0; i <= 56; i++) {
  const t = document.createElement('i');
  t.className = 'tick' + (i % 5 === 0 ? ' tick--big' : '');
  t.style.top = (i / 56 * 100) + '%';
  ruler.appendChild(t);
}
for (const r of ROOMS) {
  const m = document.createElement('button');
  m.type = 'button'; m.className = 'rmark'; m.style.top = (r.p / P_MAX * 100) + '%';
  m.innerHTML = `<span>${r.no}</span><em>${r.name}</em>`;
  m.setAttribute('aria-label', `Walk to room ${r.no}, ${r.name}`);
  m.addEventListener('click', () => H()?.walkTo?.(r.p));
  ruler.appendChild(m); r.mark = m;
}

// ---------------- hint ----------------
const hint = $('hint'), hintFill = $('hintFill');

// ---------------- topbar links ----------------
document.querySelectorAll('[data-walk-to]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const to = a.dataset.walkTo;
  if (to === 'start') H()?.walkTo?.(0, { instant: true });
  else if (to === 'house') H()?.lenis?.scrollTo('#house', { duration: 1.4, force: true });
  else H()?.walkTo?.(+to);
}));

// ---------------- every frame ----------------
let lastCur = -2;
addEventListener('house:frame', e => {
  const p = e.detail.p;
  placeTags(p);
  now.style.top = (Math.min(1, p / P_MAX) * 100) + '%';
  const cur = currentRoom(p);
  const reached = p >= 2.42 ? 7 : cur >= 0 ? cur + 1 : ROOMS.filter(r => p >= r.range[1]).length;
  if (cur !== lastCur) {
    count.innerHTML = `<b>${String(reached).padStart(2, '0')}</b> / 07 rooms`;
    ROOMS.forEach((r, i) => r.mark.classList.toggle('here', i === cur));
    lastCur = cur;
  }
  const k = Math.min(1, p / 0.36);
  hintFill.style.transform = `scaleX(${k})`;
  hint.classList.toggle('gone', p > 0.34);
  document.body.classList.toggle('walking', p > 0.12 && p < 2.62);
});
addEventListener('resize', () => { const h = H(); if (h) placeTags(h.p); });
// hide the ruler, count and tags once the page reaches the section about the house
new IntersectionObserver(([en]) => document.body.classList.toggle('in-house', en.isIntersecting), { rootMargin: '0px 0px -35% 0px' }).observe($('house'));
mq.addEventListener?.('change', () => { const h = H(); if (h) placeTags(h.p); });
