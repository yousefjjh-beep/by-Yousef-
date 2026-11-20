/*
 * Villa geometry, traced from assets/plan.jpg (1280x1024 px).
 *
 * Every coordinate below is a PIXEL position on the original plan image, so any
 * line can be checked against the drawing. Each floor has its own `box`
 * (the plot outline on that drawing) which is mapped to the real plot
 * size `lot` (metres). The three drawings are not drawn at exactly the same
 * pixel scale, so each one is normalised to the plot outline separately.
 *
 * walls:   [x1, y1, x2, y2, type]   type: 'w' full wall, 'p' parapet/railing 1.1 m, 'f' boundary fence 2.4 m
 * doors:   [x, y, axis, width_m, kind, side]
 *          axis 'h' = in a horizontal wall, 'v' = in a vertical wall
 *          kind 'd' hinged door, 's' sliding glass door, 'o' plain opening (lift door / archway)
 *          side +1 = leaf swings toward +y (down the page) for 'h', toward +x (right) for 'v'
 * windows: [x, y, axis, width_m, sill_m, head_m]
 * rooms:   r = one rectangle [x0,y0,x1,y1], rs = several rectangles; k = floor finish
 */
window.PLAN = {
  name: 'another one by yousef',
  lot: { w: 12.0, d: 28.8 },      // plot size in metres (estimated, confirmed at step 1)
  ceiling: 3.2,                    // clear ceiling height
  floorToFloor: 3.5,               // ceiling + 0.3 slab
  wallT: 0.2,
  image: { w: 1280, h: 1024 },

  floors: [
    /* ───────────────────────── GROUND FLOOR ───────────────────────── */
    {
      id: 'g', n: ['الدور الأرضي', 'Ground floor'], elev: 0,
      box: [67.5, 144, 410, 967.5],
      crop: [58, 134, 362, 844],
      walls: [
        [67.5, 144, 195, 144, 'w'],          // kitchen back wall
        [195, 144, 410, 144, 'f'],           // service-yard back fence
        [67.5, 144, 67.5, 967.5, 'w'],       // left outer wall
        [410, 144, 410, 205, 'f'],
        [410, 205, 410, 385, 'w'],           // living room right wall
        [410, 385, 410, 967.5, 'f'],         // right boundary fence
        [67.5, 967.5, 125, 967.5, 'w'],      // driver room front wall
        [125, 967.5, 305, 967.5, 'f'],       // front fence (car gate open 305-410)
        [195, 144, 195, 205, 'w'],           // kitchen | yard
        [67.5, 205, 195, 205, 'w'],          // kitchen | open kitchen
        [195, 205, 410, 205, 'w'],           // living | yard
        [247, 385, 410, 385, 'w'],           // living | terrace
        [250, 385, 250, 685, 'w'],           // hall | terrace + garden strip (glazed)
        [67.5, 344, 200, 344, 'w'],          // open kitchen | storage + lift
        [145, 344, 145, 400, 'w'],           // storage | lift
        [200, 344, 200, 400, 'w'],           // lift right
        [67.5, 400, 200, 400, 'w'],          // storage + lift front
        [125, 400, 125, 410, 'w'],
        [125, 440, 125, 577, 'w'],           // WC + light well | stair
        [67.5, 469, 125, 469, 'w'],          // basin | WC
        [67.5, 526, 125, 526, 'w'],          // WC | light well
        [67.5, 577, 200, 577, 'w'],          // stair + light well | dining
        [200, 525, 200, 577, 'w'],           // stair right (lower part)
        [67.5, 687, 200, 687, 'w'],          // dining | majlis (partial)
        [247, 685, 300, 685, 'w'],           // entry | garden strip
        [248, 740, 248, 843, 'w'],           // majlis | WC
        [250, 740, 300, 740, 'w'],           // entry | WC
        [300, 685, 300, 843, 'w'],           // outer wall to porch/parking
        [67.5, 843, 300, 843, 'w'],          // majlis + WC | front
        [125, 843, 125, 967.5, 'w'],         // driver room | outdoor seating
        [67.5, 873, 125, 873, 'w'],          // driver WC
        [300, 740, 355, 740, 'w'],           // lift 2
        [355, 740, 355, 792, 'w'],
        [300, 792, 355, 792, 'w'],
        [250, 843, 250, 967.5, 'p'],         // seating | parking low wall
      ],
      doors: [
        [103.5, 205, 'h', 0.8, 'o'],          // kitchen → open kitchen
        [195, 180, 'v', 0.9, 'd', +1],        // kitchen → service yard
        [103, 344, 'h', 0.8, 'd', +1],        // storage
        [172, 400, 'h', 0.9, 'o'],            // lift 1
        [250, 418, 'v', 0.9, 'd', +1],        // hall → terrace
        [106, 469, 'h', 0.8, 'd', +1],        // WC
        [248, 808, 'v', 0.8, 'd', +1],        // majlis → WC
        [233, 843, 'h', 0.9, 'd', -1],        // majlis guest door (front)
        [300, 706, 'v', 1.1, 'd', -1],        // MAIN ENTRANCE from porch
        [328, 792, 'h', 0.9, 'o'],            // lift 2
        [100, 873, 'h', 0.7, 'd', -1],        // driver WC
        [82, 967.5, 'h', 0.8, 'd', -1],       // driver room street door
        [287, 967.5, 'h', 0.9, 'd', -1],      // pedestrian gate
      ],
      windows: [
        // (the symbol on the living room's right wall at y≈295 is a TV unit, not a window)
        [380, 205, 'h', 1.6, 0.9, 2.3],       // living → yard (guess; kept clear of the sofa wall)
        [131, 144, 'h', 1.2, 1.2, 2.2],       // kitchen
        [67.5, 632, 'v', 1.6, 0.9, 2.3],      // dining
        [67.5, 765, 'v', 2.0, 0.9, 2.3],      // majlis
        [250, 580, 'v', 5.5, 0.05, 2.7],      // hall glass wall to garden strip
      ],
      rooms: [
        { id: 'g-kitchen', n: ['مطبخ', 'Kitchen'], r: [67.5, 144, 197.5, 205], k: 'tile' },
        { id: 'g-okitchen', n: ['مطبخ مكشوف', 'Open kitchen'], r: [67.5, 205, 197.5, 344], k: 'oak' },
        { id: 'g-living', n: ['صالة معيشة', 'Living room'], r: [197.5, 205, 410, 385], k: 'oak' },
        { id: 'g-store', n: ['مستودع', 'Storage'], r: [67.5, 344, 145, 400], k: 'tile' },
        { id: 'g-lift1', r: [145, 344, 200, 400], k: 'lift' },
        { id: 'g-hall', n: ['الصالة الداخلية', 'Hall'], rs: [[197.5, 385, 250, 685], [125, 400, 197.5, 437], [67.5, 400, 125, 469]], k: 'oak', lp: [225, 520] },
        { id: 'g-stair', r: [125, 437, 200, 577], k: 'stair' },
        { id: 'g-wc1', n: ['دورة مياه', 'WC'], r: [67.5, 469, 125, 526], k: 'tile' },
        { id: 'g-well', n: ['منور', 'Light well'], r: [67.5, 526, 125, 577], k: 'grass', label: false },
        { id: 'g-dining', n: ['طعام', 'Dining'], r: [67.5, 577, 200, 687], k: 'oak' },
        { id: 'g-majlis', n: ['ضيوف (مجلس)', 'Majlis (guests)'], r: [67.5, 687, 248, 843], k: 'oak' },
        { id: 'g-entry', n: ['المدخل', 'Entry'], r: [248, 685, 300, 740], k: 'oak' },
        { id: 'g-wc2', n: ['دورة مياه', 'WC'], r: [250, 740, 300, 843], k: 'tile' },
        { id: 'g-porch', n: ['مظلة المدخل', 'Porch'], r: [300, 685, 355, 740], k: 'deck', label: false },
        { id: 'g-lift2', r: [300, 740, 355, 792], k: 'lift' },
        { id: 'g-driver', n: ['غرفة سائق', 'Driver room'], r: [67.5, 843, 125, 967.5], k: 'oak' },
        { id: 'g-seating', n: ['جلسة خارجية', 'Outdoor seating'], r: [125, 843, 250, 967.5], k: 'deck' },
        { id: 'g-terrace', n: ['التراس', 'Terrace'], r: [250, 385, 410, 475], k: 'deck' },
        { id: 'g-green', r: [252, 475, 300, 685], k: 'grass' },
        { id: 'g-deck', r: [300, 475, 410, 685], k: 'pave' },
        { id: 'g-pool', n: ['مسبح', 'Pool'], r: [337, 500, 405, 630], k: 'water' },
        { id: 'g-park', n: ['موقف', 'Parking'], rs: [[355, 685, 410, 967.5], [250, 843, 355, 967.5], [300, 792, 355, 843]], k: 'pave', lp: [370, 880] },
        { id: 'g-yard', n: ['فناء خدمة', 'Service yard'], r: [197.5, 144, 410, 205], k: 'pave' },
        { id: 'g-planter', r: [396, 640, 408, 960], k: 'grass' },
      ],
    },

    /* ───────────────────────── FIRST FLOOR ───────────────────────── */
    {
      id: 'f', n: ['الدور الأول', 'First floor'], elev: 3.5,
      box: [467.5, 145, 832.5, 960],
      crop: [458, 134, 384, 836],
      walls: [
        [467.5, 145, 605, 145, 'p'],         // back balcony railing
        [467.5, 145, 467.5, 203, 'p'],
        [605, 145, 605, 203, 'w'],
        [467.5, 203, 832.5, 203, 'w'],       // back wall
        [467.5, 203, 467.5, 863, 'w'],       // left outer wall
        [605, 203, 605, 327, 'w'],           // bed 3 | bath
        [467.5, 327, 477, 327, 'w'],
        [525, 327, 605, 327, 'w'],           // bed 3 | closet + lift
        [552, 327, 552, 388, 'w'],           // closet | lift
        [467.5, 388, 605, 388, 'w'],         // closet + lift | corridor
        [605, 288, 660, 288, 'w'],           // bath | side corridor
        [628, 288, 628, 380, 'w'],
        [628, 380, 660, 380, 'w'],           // side corridor door
        [660, 203, 660, 632, 'w'],           // bed 2 / bed 1 / void edge
        [660, 327, 832.5, 327, 'w'],         // bed 2 + bath | bed 1
        [775, 203, 775, 327, 'w'],           // bed 2 | bath
        [832.5, 203, 832.5, 450, 'w'],       // right outer wall
        [660, 450, 832.5, 450, 'w'],         // bed 1 | void over pool
        [467.5, 420, 525, 420, 'w'],         // corridor | WC
        [527, 415, 527, 570, 'w'],           // WC + light well | stair
        [467.5, 507, 527, 507, 'w'],         // WC | light well
        [467.5, 570, 605, 570, 'w'],         // stair | master bath
        [605, 440, 605, 542, 'p'],           // stair railing
        [605, 570, 605, 632, 'w'],
        [527, 632, 550, 632, 'w'],
        [577, 632, 660, 632, 'w'],           // master suite door wall
        [527, 632, 527, 680, 'w'],           // tub alcove
        [467.5, 680, 530, 680, 'w'],
        [585, 680, 605, 680, 'w'],
        [605, 680, 605, 735, 'w'],           // closet | lobby
        [660, 632, 660, 735, 'w'],           // lobby | balcony
        [660, 680, 772, 680, 'p'],           // side balcony railing
        [772, 680, 772, 735, 'p'],
        [467.5, 735, 605, 735, 'w'],         // closet | master bedroom
        [660, 735, 772, 735, 'w'],
        [715, 735, 715, 863, 'w'],           // master bedroom right
        [467.5, 863, 715, 863, 'w'],         // master bedroom front
        [772, 735, 772, 790, 'w'],           // lift 2
        [715, 790, 772, 790, 'w'],
      ],
      doors: [
        [536, 203, 'h', 3.6, 's'],            // bed 3 → balcony
        [511, 388, 'h', 0.9, 'd', -1],        // corridor → bed 3 (via closet)
        [578, 388, 'h', 0.9, 'o'],            // lift 1
        [642, 288, 'h', 0.8, 'd', -1],        // bath
        [644, 380, 'h', 0.9, 'd', -1],        // side corridor
        [660, 306, 'v', 0.9, 'd', +1],        // bed 2
        [660, 421, 'v', 0.9, 'd', +1],        // bed 1
        [793, 327, 'h', 0.8, 'd', -1],        // bed 1 → bath
        [507, 420, 'h', 0.8, 'd', +1],        // WC
        [640, 632, 'h', 0.9, 'd', +1],        // master suite
        [563, 632, 'h', 0.9, 'o'],            // lobby → master bath
        [557, 680, 'h', 1.6, 'o'],            // lobby → master closet
        [660, 696, 'v', 0.9, 's'],            // lobby → side balcony
        [743, 735, 'h', 0.9, 'o'],            // lift 2
      ],
      windows: [
        [467.5, 265, 'v', 1.6, 0.9, 2.3],     // bed 3 (symbol on plan)
        [718, 203, 'h', 1.8, 0.9, 2.3],       // bed 2
        [632, 203, 'h', 0.6, 1.6, 2.1],       // bath
        [804, 203, 'h', 0.6, 1.6, 2.1],       // bath
        [750, 450, 'h', 3.4, 0.9, 2.3],       // bed 1 → pool
        [660, 541, 'v', 4.5, 0.9, 2.3],       // corridor → void
        [467.5, 600, 'v', 0.6, 1.6, 2.1],     // master bath
        [467.5, 800, 'v', 2.0, 0.9, 2.3],     // master bedroom
        [631, 863, 'h', 1.8, 0.9, 2.3],       // master bedroom front
      ],
      rooms: [
        { id: 'f-balc1', n: ['بلكونة', 'Balcony'], r: [467.5, 145, 605, 203], k: 'deck' },
        { id: 'f-bed3', n: ['غرفة نوم 3', 'Bedroom 3'], r: [467.5, 203, 605, 327], k: 'oak' },
        { id: 'f-dress3', r: [467.5, 327, 552, 388], k: 'oak' },
        { id: 'f-lift1', r: [552, 327, 605, 388], k: 'lift' },
        { id: 'f-wc3', n: ['دورة مياه', 'Bath'], r: [605, 203, 660, 288], k: 'tile' },
        { id: 'f-bed2', n: ['غرفة نوم 2', 'Bedroom 2'], r: [660, 203, 775, 327], k: 'oak' },
        { id: 'f-wc2', n: ['دورة مياه', 'Bath'], r: [775, 203, 832.5, 327], k: 'tile' },
        { id: 'f-bed1', n: ['غرفة نوم 1', 'Bedroom 1'], r: [660, 327, 832.5, 450], k: 'oak' },
        { id: 'f-hall', n: ['الممر', 'Corridor'], rs: [[467.5, 388, 605, 420], [605, 288, 660, 632]], k: 'oak', lp: [632, 500] },
        { id: 'f-wcp', n: ['دورة مياه', 'WC'], r: [467.5, 420, 527, 507], k: 'tile' },
        { id: 'f-stair', r: [527, 415, 605, 570], k: 'stair' },
        { id: 'f-mbath', n: ['حمام رئيسي', 'Master bath'], rs: [[467.5, 570, 605, 632], [467.5, 632, 527, 680]], k: 'tile' },
        { id: 'f-lobby', rs: [[527, 632, 605, 680], [605, 632, 660, 735]], k: 'oak' },
        { id: 'f-dress', n: ['ملابس رئيسية', 'Master closet'], r: [467.5, 680, 605, 735], k: 'oak' },
        { id: 'f-master', n: ['غرفة نوم رئيسية', 'Master bedroom'], r: [467.5, 735, 715, 863], k: 'oak' },
        { id: 'f-balc2', n: ['بلكونة', 'Balcony'], r: [660, 680, 772, 735], k: 'deck' },
        { id: 'f-lift2', r: [715, 735, 772, 790], k: 'lift' },
      ],
    },

    /* ───────────────────────── UPPER ANNEX ───────────────────────── */
    {
      id: 'r', n: ['الملحق العلوي', 'Upper annex'], elev: 7.0,
      box: [905, 137.5, 1255, 935],
      crop: [896, 128, 368, 816],
      walls: [
        [905, 137.5, 1040, 137.5, 'p'],      // back balcony railing
        [905, 137.5, 905, 195, 'p'],
        [1040, 137.5, 1040, 370, 'w'],       // balcony / bed 4 / lift | roof
        [905, 195, 1040, 195, 'w'],          // bed 4 back wall
        [905, 195, 905, 717, 'w'],           // left outer wall
        [905, 317, 915, 317, 'w'],
        [970, 317, 1040, 317, 'w'],          // bed 4 | closet + lift
        [987, 317, 987, 370, 'w'],           // closet | lift
        [905, 370, 1097, 370, 'w'],          // closet + lift + roof | hall
        [1097, 370, 1097, 665, 'w'],         // hall + lounge right wall
        [905, 410, 962, 410, 'w'],           // basins | WC
        [962, 410, 962, 557, 'w'],           // WC + light well | stair
        [905, 495, 962, 495, 'w'],           // WC | light well
        [905, 557, 1040, 557, 'w'],          // stair | lounge
        [1040, 435, 1040, 525, 'p'],         // stair railing
        [1097, 665, 1197, 665, 'w'],
        [1197, 665, 1197, 767, 'w'],
        [905, 717, 1197, 717, 'w'],          // lounge front (glazed)
        [1142, 717, 1142, 767, 'w'],         // lift 2
        [1142, 767, 1197, 767, 'w'],
        [905, 717, 905, 840, 'p'],           // front roof terrace parapet
        [905, 840, 1142, 840, 'p'],
        [1142, 767, 1142, 840, 'p'],
        [1040, 195, 1255, 195, 'p'],         // back roof terrace parapet
        [1255, 195, 1255, 435, 'p'],
        [1097, 435, 1255, 435, 'p'],
      ],
      doors: [
        [972, 195, 'h', 3.4, 's'],            // bed 4 → balcony
        [948, 370, 'h', 0.9, 'd', -1],        // hall → bed 4 (via closet)
        [1012, 370, 'h', 0.9, 'o'],           // lift 1
        [1055, 370, 'h', 0.9, 'd', -1],       // hall → back roof terrace
        [940, 410, 'h', 0.8, 'd', +1],        // WC
        [1000, 717, 'h', 4.2, 's'],           // lounge → front roof terrace
        [1170, 717, 'h', 0.9, 'o'],           // lift 2
      ],
      windows: [
        [905, 253, 'v', 1.6, 0.9, 2.3],       // bed 4 (symbol on plan)
        [905, 640, 'v', 2.0, 0.9, 2.3],       // lounge
        [1097, 610, 'v', 2.0, 0.9, 2.3],      // lounge → pool
      ],
      rooms: [
        { id: 'r-balc', n: ['بلكونة', 'Balcony'], r: [905, 137.5, 1040, 195], k: 'deck' },
        { id: 'r-bed4', n: ['غرفة نوم 4', 'Bedroom 4'], r: [905, 195, 1040, 317], k: 'oak' },
        { id: 'r-dress', r: [905, 317, 987, 370], k: 'oak' },
        { id: 'r-lift1', r: [987, 317, 1040, 370], k: 'lift' },
        { id: 'r-hall', rs: [[905, 370, 1097, 410], [1040, 410, 1097, 557]], k: 'oak' },
        { id: 'r-wc', n: ['دورة مياه', 'WC'], r: [905, 410, 962, 495], k: 'tile' },
        { id: 'r-stair', r: [962, 410, 1040, 557], k: 'hole' },
        { id: 'r-living', n: ['صالة معيشة', 'Family lounge'], rs: [[905, 557, 1097, 717], [1097, 665, 1197, 717]], k: 'oak' },
        { id: 'r-lift2', r: [1142, 717, 1197, 767], k: 'lift' },
        { id: 'r-front', n: ['سطح - جلسة خارجية', 'Roof terrace (seating)'], r: [905, 717, 1142, 840], k: 'turf' },
        { id: 'r-roof', n: ['سطح', 'Roof terrace'], rs: [[1040, 195, 1255, 370], [1097, 370, 1255, 435]], k: 'roof', lp: [1170, 300] },
      ],
    },
  ],
};
