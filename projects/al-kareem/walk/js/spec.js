// Shared constants. Units: metres. Y up.  REVISED 17 Nov from the architect's ground-floor plan (PDF).
// +Z = QIBLA wall (long wall, mihrab in its middle).  -Z = back long wall (glazed back entrance).
// +X = east end wall, -X = west end wall: each has one side entrance near the back corner.
export const SPEC = {
  floorY: 1.05,                 // finished floor level of the prayer hall
  hall: { x0: -13.8, x1: 13.75, z0: -10.55, z1: 3.14, ceil: 7.2 },  // interior clear box (lining faces); ceil = height ABOVE floorY
  shell: { x0: -14.05, x1: 14.0, z0: -10.9, z1: 3.6, roofY: 8.73 }, // outer shell of the hall in the SketchUp model
  // MIHRAB exactly as on the architect's plan (refs/mihrab_plan.png, 141 px = 1 m): semicircular apse, two-step rebated jambs
  mihrab: { x: 0, apseCentreZ: 4.34, apseInnerR: 0.75, apseWall: 0.22, faceOpening: 2.1, innerOpening: 1.5, jambStepZ: 3.6, minbar: { xc: -2.3, width: 1.0 }, imamArch: { xc: 2.3, width: 1.1 } },  // facing the qibla: minbar niche on the RIGHT (-X), small arched doorway on the LEFT (+X); NO door
  dome: { x: 0, z: 0, r: 3.45, top: 8.6 },                           // dome over the bay in front of the mihrab; top = height above floorY
  // four 0.8 m square columns carrying the dome; the +Z pair stands against the qibla wall (reads as pilasters either side of the mihrab)
  columns: [ { x: -3.25, z: -5.59 }, { x: 3.25, z: -5.59 }, { x: -3.25, z: 3.25 }, { x: 3.25, z: 3.25 } ], columnSize: 0.8,
  // MEZZANINE over the back third of the hall (client, 17 Nov; refs/mezzanine_site.jpg): no stair, entered from behind at its own level.
  // heights are metres ABOVE the hall floor. The two free columns moved back to carry its front edge (column front face flush with the fascia).
  mezzanine: { zBack: -10.55, zFront: -5.99, soffit: 3.2, floor: 3.55, parapetTop: 4.65 },
  wainscotH: 1.0,
  entrances: {                  // the ONLY ways in. Door openings in the shell, measured from the model / plan.
    east: { x: 14.0, z0: -7.7, z1: -5.7 },      // side entrance, timber double door + timber canopy outside
    west: { x: -14.05, z0: -7.7, z1: -5.7 },    // side entrance, same
    back: { z: -10.9, x0: -2.7, x1: -0.2 },     // glazed back entrance (the photo's portal with palm-frond glass doors)
  },
  exitDoors: [],   // no doors in the qibla wall
  // END-WALL WINDOWS: exactly the openings of the SketchUp model (absolute y). No other windows on the end walls.
  endWindows: {
    east: { x: 14.0, lower: [ { z0: -5.40, z1: -3.40, y0: 1.05, y1: 3.99 }, { z0: -2.19, z1: -0.19, y0: 1.41, y1: 3.99 }, { z0: 0.92, z1: 2.92, y0: 1.41, y1: 3.99 } ],
            upperArched: [ { z0: -2.19, z1: -0.19, y0: 4.89, y1: 7.70 }, { z0: 0.92, z1: 2.92, y0: 4.89, y1: 7.70 } ] },
    west: { x: -14.05, lower: [ { z0: -5.47, z1: -3.47, y0: 1.05, y1: 3.93 }, { z0: -2.25, z1: -0.25, y0: 1.41, y1: 3.99 }, { z0: 0.85, z1: 2.85, y0: 1.41, y1: 3.99 } ],
            upperArched: [ { z0: -2.25, z1: -0.24, y0: 4.89, y1: 7.70 }, { z0: 0.85, z1: 2.86, y0: 4.89, y1: 7.70 } ] },
  },
  endWallSplitZ: -5.55,         // end walls: hall_core owns z0…-5.55 (door strip), hall_windows owns -5.55…z1
  carpet: { repeatZ: 1.33, tileX: 1.22, bandZ: 0.33, cream: '#efe2d0', violet: '#6f3f96', black: '#111111' }, // now Al-Mira ASTP.26.11.17-1 (green field, beige star band): texture assets/carpet.jpg; colour keys kept only for old code
  // legacy keys kept so old code does not crash – do not use
  vestibule: { x0: 13.75, x1: 13.75 }, void: { x0: -3.3, x1: 3.3, z0: -3.3, z1: 3.3, top: 7.2 }, shellDoor: { x: 14.0, z0: -7.7, z1: -5.7 },
  towerFace: { x: 12.8, z0: -17.6, z1: -11.1, top: 9.73 },
  sunDir: [0.50, 0.34, 0.80],   // direction TO the sun (late afternoon, low)
  palette: { carpet: '#1f4a63', carpetLine: '#e9e6dc', plaster: '#eeece6', limestone: '#e3dccb', oak: '#b79a74', bronze: '#a98654', stone: '#c9a36b' },
};
