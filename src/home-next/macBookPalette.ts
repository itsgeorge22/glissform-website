// Hardware and studio colours are artwork inputs, not interface theme colours.
// Keep them separate so changing the site's primary accent does not recolour metal.
export const macBookPalette = {
  body: '#cbd0d5',
  edge: '#d4d9de',
  underside: '#b7bec5',
  trackpad: '#c5cbd1',
  seam: '#747c84',
  keycap: '#101318',
  touchSensor: '#090a0c',
  rubber: '#1c2025',
  bezel: '#000000',
  lidMark: '#808a94',
  keyLegend: '#dce1e7',
  capsIndicator: '#78818a',
  tactileMark: '#68727b',
  light: { key: '#ffffff', fill: '#dce9ff' },
  groundShadow: '#20242a',
} as const;

// The compact vector fallback has its own baked lighting and screen artwork.
export const compactMacBookPalette = {
  metal: ['#e2e6eb', '#b5bdc8', '#8993a1'],
  screen: ['#155bba', '#13294d', 'var(--scene-background)'],
  shadow: '#193149',
  bezel: '#10141a',
  stars: '#c5dfff',
  edge: '#e5e9ef',
  recess: '#a0a9b5',
} as const;
