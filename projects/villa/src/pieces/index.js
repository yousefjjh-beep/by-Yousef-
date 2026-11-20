// Piece registry. bbox = [x0, z0, x1, z1] in metres on the site grid (x east, z south, origin = NW site corner).
// level = which plan the piece is judged against: 'B' basement, 'G' ground, 'F' first.
export const PIECES = [
  { id: 'b_garage',   level: 'B', bbox: [0, 0, 28, 14.5],   title: 'Basement: garage, driver room, car ramp' },
  { id: 'b_wellness', level: 'B', bbox: [27, 0, 49, 15.5],  title: 'Basement: pool court, gym, saunas' },
  { id: 'b_living',   level: 'B', bbox: [26.5, 5.5, 49, 25], title: 'Basement: living area, gaming, maid room' },
  { id: 'b_men',      level: 'B', bbox: [16.5, 11.5, 41, 41], title: 'Basement: sunken patio, men patio, men saloon' },
  { id: 'g_front',    level: 'G', bbox: [6.5, 0, 35, 21],   title: 'Ground: entrance, woman saloon, living area, hallway, balcony' },
  { id: 'g_service',  level: 'G', bbox: [26.5, 14, 49, 24.5], title: 'Ground: family dining, office, laundry, kitchen' },
  { id: 'g_guest',    level: 'G', bbox: [23.5, 22.5, 48, 41.5], title: 'Ground: guest bedroom, private saloon, main saloon, guest dining' },
  { id: 'f_north',    level: 'F', bbox: [21.5, 1.5, 48, 24.5], title: 'First: stair hall, living room, family living, bedroom one' },
  { id: 'f_south',    level: 'F', bbox: [23.5, 22.5, 48, 41.5], title: 'First: master suite, bedrooms 1, 2, two, three' },
  { id: 'site',       level: 'G', bbox: [0, 0, 49, 47],     title: 'Site: driveway, gardens, trees, fountain pool, boundary walls' },
];
