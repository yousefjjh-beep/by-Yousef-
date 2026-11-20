/*
 * Furniture and lighting per room.
 *
 * at:  [x, y] in plan-image pixels of that floor (same system as plan.js) = centre of the piece
 * rot: degrees about the vertical axis; 0 = the piece's front faces down the page (+z),
 *      90 = faces right (+x), -90 = faces left (-x), 180 = faces up the page.
 *      Beds: the "front" is the foot end, so the headboard is on the opposite side.
 * y:   height of the piece's base above the floor (metres), for things standing on tables
 * src: 'ph:<name>'   CC0 model from Poly Haven (see models.js)
 *      'prim:<kind>' built from simple shapes in index.html
 *
 * lights (optional): extra lights for the room. Every furnished indoor room also gets a
 * ceiling light automatically (index.html), unless it lists its own 'down' lights.
 *   down = ceiling downlight, lamp = table/floor lamp, tv = screen glow, strip = LED strip
 *
 * Positions follow the furniture symbols drawn on the plan wherever the plan shows them.
 */
(function () {
  // helper: a row of identical items
  const row = (src, pts, extra) => pts.map((at, i) => Object.assign({ id: src + '-' + i, src, at }, extra));
  const chair = (at, rot) => ({ src: 'ph:dining_chair_02', at, rot });

  window.FURNITURE = {
    /* ═════════════════ GROUND FLOOR ═════════════════ */
    'g-living': {
      floor: 'g',
      items: [
        { id: 'sofa-back',   src: 'ph:sofa_02',                  at: [317.5, 221], rot: 0 },
        { id: 'sofa-side',   src: 'ph:sofa_02',                  at: [272, 273],   rot: 90 },
        { id: 'lounge',      src: 'ph:mid_century_lounge_chair', at: [366, 252],   rot: -65 },
        { id: 'armchair',    src: 'ph:ArmChair_01',              at: [275, 319],   rot: 90 },
        { id: 'coffee',      src: 'ph:modern_coffee_table_01',   at: [317, 272],   rot: 0 },
        { id: 'side-table',  src: 'ph:side_table_01',            at: [268, 226],   rot: 0 },
        { id: 'plant',       src: 'ph:potted_plant_01',          at: [358, 224],   rot: 0 },
        { id: 'console',     src: 'ph:modern_wooden_cabinet',    at: [399.7, 293.5], rot: -90 },
        { id: 'art-1',       src: 'prim:art', at: [306, 207.5], rot: 0, y: 1.2, size: [0.7, 0.95], seed: 3 },
        { id: 'art-2',       src: 'prim:art', at: [329, 207.5], rot: 0, y: 1.2, size: [0.7, 0.95], seed: 7 },
        { id: 'vase',        src: 'ph:ceramic_vase_02',          at: [326, 272],   rot: 0, y: 0.39 },
        { id: 'books',       src: 'ph:book_encyclopedia_set_01', at: [400, 279],   rot: -90, y: 0.68 },
        { id: 'succulent',   src: 'ph:potted_plant_04',          at: [400, 309],   rot: 0, y: 0.68 },
        { id: 'rug',         src: 'prim:rug',       at: [321, 275], size: [3.0, 2.4] },
        { id: 'tv',          src: 'prim:tv',        at: [407, 293.5], rot: -90, y: 0.95 },
        { id: 'floor-lamp',  src: 'prim:floorLamp', at: [256, 334] },
        { id: 'curtain',     src: 'prim:curtain',   at: [380, 207], width: 2.2 },
      ],
      focus: [317, 272],
      lights: [
        { type: 'down', at: [255, 250], h: 3.15 },
        { type: 'down', at: [360, 250], h: 3.15, shadow: true },
        { type: 'down', at: [255, 345], h: 3.15 },
        { type: 'down', at: [360, 345], h: 3.15 },
        { type: 'lamp', at: [256, 334], h: 1.55 },
        { type: 'tv',   at: [395, 293.5], h: 1.3 },
        { type: 'strip', at: [392, 293.5], h: 0.03, len: 2.3, axis: 'v' },
      ],
    },
    'g-kitchen': {
      floor: 'g',
      items: [
        { id: 'fridge',  src: 'prim:fridge',  at: [82, 157], rot: 0 },
        { id: 'counter', src: 'prim:counter', at: [143, 154], rot: 0, len: 3.0, upper: true, sink: true },
      ],
    },
    'g-okitchen': {
      floor: 'g',
      items: [
        { id: 'wall-run', src: 'prim:counter', at: [79, 262], rot: 90, len: 3.4, upper: true },          // along the left wall
        { id: 'island',   src: 'prim:island',  at: [183, 284], rot: 90, len: 2.9, depth: 0.95, cooktop: true }, // L-island with the hob
        { id: 'arm',      src: 'prim:counter', at: [139, 318], rot: 180, len: 2.2, sink: true },        // short arm of the L
        ...row('ph:bar_chair_round_01', [[210, 262], [210, 284], [210, 306]], { rot: -90 }),
      ],
      focus: [183, 284],
    },
    'g-store': {
      floor: 'g',
      items: [
        { id: 'shelf-1', src: 'ph:steel_frame_shelves_01', at: [115, 352], rot: 0 },
        { id: 'shelf-2', src: 'ph:steel_frame_shelves_02', at: [78, 385], rot: 90 },
      ],
    },
    'g-hall': {
      floor: 'g',
      items: [
        { id: 'basin', src: 'prim:vanity', at: [96, 409], rot: 0, len: 1.2 },      // hand-basin alcove
        { id: 'plant', src: 'ph:potted_plant_02', at: [238, 660], rot: 0 },
      ],
      focus: [225, 520],
    },
    'g-entry': {
      floor: 'g',
      items: [
        { id: 'console', src: 'prim:console', at: [274, 693], rot: 0, len: 1.2, depth: 0.35, h: 0.8 },
        { id: 'art',     src: 'prim:art', at: [274, 688.3], rot: 0, y: 1.2, size: [0.9, 0.6], seed: 5 },
      ],
    },
    'g-wc1': { floor: 'g', items: [{ id: 'wc', src: 'prim:toilet', at: [80, 505], rot: 90 }] },
    'g-well': { floor: 'g', items: [{ id: 'tree', src: 'prim:tree', at: [96, 551], scale: 0.7 }], noLight: true },
    'g-dining': {
      floor: 'g',
      items: [
        { id: 'table', src: 'prim:diningTable', at: [143.5, 632], len: 3.0, width: 1.0 },
        chair([120, 608], 0), chair([143.5, 608], 0), chair([167, 608], 0),
        chair([120, 656], 180), chair([143.5, 656], 180), chair([167, 656], 180),
        chair([91, 632], 90), chair([196, 632], -90),
        { id: 'vase', src: 'ph:ceramic_vase_02', at: [143.5, 632], y: 0.765 },
      ],
      focus: [143.5, 632],
    },
    'g-majlis': {
      floor: 'g',
      items: [
        { id: 'sofa-top',    src: 'ph:sofa_02', at: [129.5, 710], rot: 0 },
        { id: 'sofa-bottom', src: 'ph:sofa_02', at: [129.5, 820], rot: 180 },
        { id: 'sofa-left',   src: 'ph:sofa_02', at: [86, 765],    rot: 90 },
        ...row('ph:ArmChair_01', [[175, 712], [200, 712]], { rot: 0 }),
        ...row('ph:ArmChair_01', [[175, 818], [200, 818]], { rot: 180 }),
        { id: 'coffee', src: 'ph:CoffeeTable_01', at: [140, 765], rot: 90 },
        ...row('ph:side_table_01', [[80, 704], [80, 826]], { rot: 0 }),
        { id: 'plant', src: 'ph:potted_plant_01', at: [234, 702] },
        { id: 'rug', src: 'prim:rug', at: [145, 765], size: [3.8, 3.0] },
        { id: 'art', src: 'prim:art', at: [245, 765], rot: -90, y: 1.3, size: [1.2, 0.8], seed: 11 },   // right wall (left wall has the window)
      ],
      focus: [140, 765],
    },
    'g-wc2': {
      floor: 'g',
      items: [
        { id: 'basin', src: 'prim:vanity', at: [293, 766], rot: -90, len: 1.0 },
        { id: 'wc',    src: 'prim:toilet', at: [291, 822], rot: -90 },
      ],
    },
    'g-driver': {
      floor: 'g',
      items: [
        { id: 'bed',      src: 'prim:bed', at: [109, 915], rot: 0, w: 0.9, l: 2.0, seed: 2 },
        { id: 'wardrobe', src: 'prim:wardrobe', at: [76, 912], rot: 90, len: 1.2, depth: 0.55 },
        { id: 'wc',       src: 'prim:toilet', at: [115, 858], rot: -90 },
      ],
    },
    'g-seating': {
      floor: 'g',
      items: [
        { id: 'sofa',    src: 'prim:outdoorSofa',  at: [184, 950], rot: 180, len: 1.9 },
        { id: 'chair-l', src: 'prim:outdoorSofa',  at: [146, 914], rot: 90, len: 0.8 },
        { id: 'chair-r', src: 'prim:outdoorSofa',  at: [224, 914], rot: -90, len: 0.8 },
        { id: 'table',   src: 'prim:lowTable',     at: [185, 914], size: [1.0, 0.6] },
      ],
      noLight: true,
    },
    'g-terrace': {
      floor: 'g',
      items: [
        { id: 'chair-l', src: 'ph:gallinera_chair', at: [341, 417], rot: 46 },
        { id: 'chair-r', src: 'ph:gallinera_chair', at: [380, 417], rot: -45 },
        { id: 'table',   src: 'prim:roundTable', at: [361, 437] },
      ],
      noLight: true,
    },
    'g-green': {
      floor: 'g',
      items: [
        { id: 'tree-1', src: 'prim:tree', at: [276, 495] },
        { id: 'tree-2', src: 'prim:tree', at: [276, 663] },
      ],
      noLight: true,
    },
    'g-planter': {
      floor: 'g',
      items: row('prim:shrub', Array.from({ length: 10 }, (_, i) => [402, 660 + i * 31])),
      noLight: true,
    },
    'g-yard': {
      floor: 'g',
      items: row('prim:shrub', Array.from({ length: 8 }, (_, i) => [215 + i * 26, 152])),
      noLight: true,
    },
    'g-park': {
      floor: 'g',
      items: [
        { id: 'car', src: 'prim:car', at: [351, 887], rot: 0 },
        ...row('prim:shrub', [[262, 848], [275, 848], [288, 848]], { r: 0.25 }),
      ],
      noLight: true,
    },

    /* ═════════════════ FIRST FLOOR ═════════════════ */
    'f-balc1': {
      floor: 'f',
      items: [
        { id: 'chair-l', src: 'ph:gallinera_chair', at: [507, 166], rot: 67 },
        { id: 'chair-r', src: 'ph:gallinera_chair', at: [559, 166], rot: -62 },
        { id: 'table',   src: 'prim:roundTable', at: [536, 180] },
      ],
      noLight: true,
    },
    'f-bed3': {
      floor: 'f',
      items: [
        { id: 'bed', src: 'prim:bed', at: [572, 267.5], rot: -90, w: 1.6, l: 2.0, seed: 1 },
        ...row('ph:side_table_01', [[595, 232], [595, 303]], { rot: -90 }),
        { id: 'lamp', src: 'prim:tableLamp', at: [595, 232], y: 0.55 },
        { id: 'desk',  src: 'prim:desk', at: [479, 245], rot: 90, len: 1.2 },
        { id: 'chair', src: 'ph:modern_arm_chair_01', at: [500, 245], rot: -90 },
        { id: 'rug',   src: 'prim:rug', at: [565, 268], size: [2.6, 2.2] },
      ],
      focus: [572, 267.5],
      lights: [{ type: 'lamp', at: [595, 232], h: 0.85 }],
    },
    'f-dress3': { floor: 'f', items: [{ id: 'wardrobe', src: 'prim:wardrobe', at: [540, 357], rot: -90, len: 1.7 }], noLight: true },
    'f-wc3': {
      floor: 'f',
      items: [
        { id: 'shower', src: 'prim:shower', at: [632, 220], size: [1.6, 0.9] },
        { id: 'wc',     src: 'prim:toilet', at: [618, 252], rot: 90 },
        { id: 'basin',  src: 'prim:vanity', at: [615, 276], rot: 90, len: 0.8 },
      ],
    },
    'f-bed2': {
      floor: 'f',
      items: [
        { id: 'bed', src: 'prim:bed', at: [742, 267.5], rot: -90, w: 1.6, l: 2.0, seed: 4 },
        ...row('ph:side_table_01', [[765, 232], [765, 303]], { rot: -90 }),
        { id: 'lamp', src: 'prim:tableLamp', at: [765, 232], y: 0.55 },
        { id: 'wardrobe', src: 'prim:wardrobe', at: [672, 265], rot: 90, len: 2.4 },
        { id: 'desk',  src: 'prim:desk', at: [718, 214.5], rot: 0, len: 1.2 },
        { id: 'chair', src: 'ph:modern_arm_chair_01', at: [718, 233], rot: 180 },
      ],
      focus: [742, 267.5],
      lights: [{ type: 'lamp', at: [765, 232], h: 0.85 }],
    },
    'f-wc2': {
      floor: 'f',
      items: [
        { id: 'shower', src: 'prim:shower', at: [804, 222], size: [1.5, 0.9] },
        { id: 'wc',     src: 'prim:toilet', at: [822, 262], rot: -90 },
        { id: 'basin',  src: 'prim:vanity', at: [822, 300], rot: -90, len: 0.8 },
      ],
    },
    'f-bed1': {
      floor: 'f',
      items: [
        { id: 'bed', src: 'prim:bed', at: [726, 358], rot: 0, w: 1.8, l: 2.05, seed: 6 },
        ...row('ph:side_table_01', [[690, 341], [762, 341]], { rot: 0 }),
        { id: 'lamp', src: 'prim:tableLamp', at: [690, 341], y: 0.55 },
        { id: 'wardrobe', src: 'prim:wardrobe', at: [820, 390], rot: -90, len: 3.0 },
        { id: 'chair', src: 'ph:ArmChair_01', at: [786, 422], rot: -133 },
        { id: 'table', src: 'prim:roundTable', at: [768, 438], d: 0.5 },
        { id: 'rug',   src: 'prim:rug', at: [726, 372], size: [2.8, 2.4] },
      ],
      focus: [726, 358],
      lights: [{ type: 'lamp', at: [690, 341], h: 0.85 }],
    },
    'f-hall': { floor: 'f', items: [{ id: 'plant', src: 'ph:potted_plant_02', at: [648, 600] }], focus: [632, 500] },
    'f-wcp': {
      floor: 'f',
      items: [
        { id: 'basin',  src: 'prim:vanity', at: [476, 432], rot: 90, len: 0.7 },
        { id: 'wc',     src: 'prim:toilet', at: [478, 458], rot: 90 },
        { id: 'shower', src: 'prim:shower', at: [497, 493], size: [1.8, 0.75], rot: 180 },
      ],
    },
    'f-mbath': {
      floor: 'f',
      items: [
        { id: 'shower', src: 'prim:shower', at: [496, 588], size: [1.6, 1.0] },
        { id: 'wc',     src: 'prim:toilet', at: [545, 583], rot: 0 },
        { id: 'basin',  src: 'prim:vanity', at: [594, 601], rot: -90, len: 1.4, double: true },
        { id: 'tub',    src: 'prim:bathtub', at: [496, 656], rot: 0, len: 1.7, width: 0.75 },
      ],
      focus: [545, 610],
    },
    'f-dress': { floor: 'f', items: [{ id: 'wardrobe', src: 'prim:wardrobe', at: [536, 723.5], rot: 180, len: 3.9 }] },
    'f-master': {
      floor: 'f',
      items: [
        { id: 'bed', src: 'prim:bed', at: [503, 800], rot: 90, w: 1.9, l: 2.1, seed: 9 },
        ...row('ph:side_table_01', [[478, 757], [478, 843]], { rot: 90 }),
        { id: 'lamp', src: 'prim:tableLamp', at: [478, 757], y: 0.55 },
        { id: 'sofa', src: 'ph:Sofa_01', at: [562, 800], rot: 90 },
        { id: 'tv-unit', src: 'prim:console', at: [706, 800], rot: -90, len: 3.0, depth: 0.4, h: 0.45 },
        { id: 'tv',  src: 'prim:tv', at: [711.3, 800], rot: -90, y: 1.0 },
        { id: 'rug', src: 'prim:rug', at: [548, 800], size: [3.0, 2.6] },
      ],
      focus: [503, 800],
      lights: [
        { type: 'lamp', at: [478, 757], h: 0.85 },
        { type: 'tv', at: [700, 800], h: 1.3 },
      ],
    },
    'f-balc2': {
      floor: 'f',
      items: [
        { id: 'chair-l', src: 'ph:gallinera_chair', at: [685, 711], rot: 106 },
        { id: 'chair-r', src: 'ph:gallinera_chair', at: [744, 711], rot: -112 },
        { id: 'table',   src: 'prim:roundTable', at: [716, 701] },
      ],
      noLight: true,
    },

    /* ═════════════════ UPPER ANNEX ═════════════════ */
    'r-balc': {
      floor: 'r',
      items: [
        { id: 'chair-l', src: 'ph:gallinera_chair', at: [946, 156], rot: 67 },
        { id: 'chair-r', src: 'ph:gallinera_chair', at: [997, 156], rot: -62 },
        { id: 'table',   src: 'prim:roundTable', at: [971, 170] },
      ],
      noLight: true,
    },
    'r-bed4': {
      floor: 'r',
      items: [
        { id: 'bed', src: 'prim:bed', at: [1008, 257.5], rot: -90, w: 1.6, l: 2.0, seed: 8 },
        ...row('ph:side_table_01', [[1030, 222], [1030, 293]], { rot: -90 }),
        { id: 'lamp', src: 'prim:tableLamp', at: [1030, 222], y: 0.55 },
        { id: 'desk',  src: 'prim:desk', at: [916.5, 240], rot: 90, len: 1.2 },
        { id: 'chair', src: 'ph:modern_arm_chair_01', at: [936, 240], rot: -90 },
        { id: 'rug',   src: 'prim:rug', at: [985, 258], size: [2.6, 2.2] },
      ],
      focus: [1008, 257.5],
      lights: [{ type: 'lamp', at: [1030, 222], h: 0.85 }],
    },
    'r-dress': { floor: 'r', items: [{ id: 'wardrobe', src: 'prim:wardrobe', at: [976, 344], rot: -90, len: 1.5 }], noLight: true },
    'r-hall':  { floor: 'r', items: [{ id: 'basin', src: 'prim:vanity', at: [912, 390], rot: 90, len: 0.9 }], noLight: true },
    'r-wc': {
      floor: 'r',
      items: [
        { id: 'wc',     src: 'prim:toilet', at: [915, 450], rot: 90 },
        { id: 'shower', src: 'prim:shower', at: [933, 482], size: [1.6, 0.7], rot: 180 },
      ],
    },
    'r-living': {
      floor: 'r',
      items: [
        { id: 'sofa-top',  src: 'ph:sofa_02', at: [978.5, 573], rot: 0 },
        { id: 'sofa-left', src: 'ph:sofa_02', at: [921, 622], rot: 90 },
        { id: 'armchair',  src: 'ph:ArmChair_01', at: [924, 672], rot: 90 },
        { id: 'lounge',    src: 'ph:mid_century_lounge_chair', at: [1030, 602], rot: -66 },
        { id: 'coffee',    src: 'ph:modern_coffee_table_02', at: [979, 622] },
        { id: 'side',      src: 'ph:side_table_01', at: [926, 576] },
        { id: 'plant',     src: 'ph:potted_plant_01', at: [1025, 570] },
        { id: 'rug',       src: 'prim:rug', at: [980, 622], size: [3.0, 2.6] },
        { id: 'lamp',      src: 'prim:floorLamp', at: [915, 700] },
        { id: 'art',       src: 'prim:art', at: [907.9, 590], rot: 90, y: 1.3, size: [0.8, 0.6], seed: 13 },   // clear of the window at y≈640
      ],
      focus: [979, 622],
      lights: [{ type: 'lamp', at: [915, 700], h: 1.55 }],
    },
    'r-front': {
      floor: 'r',
      items: [
        { id: 'sofa',    src: 'prim:outdoorSofa', at: [929, 781], rot: 90, len: 2.0 },
        { id: 'table',   src: 'prim:lowTable', at: [962, 781], size: [0.6, 1.4] },
        { id: 'chair-t', src: 'prim:outdoorSofa', at: [962, 742], rot: 0, len: 0.8 },
        { id: 'chair-b', src: 'prim:outdoorSofa', at: [962, 822], rot: 180, len: 0.8 },
      ],
      noLight: true,
    },
  };
})();
