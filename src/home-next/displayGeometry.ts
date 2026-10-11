import details from './macbook-details.json' with { type: 'json' };

// Fixed native model units. The opening camera crops the surrounding case;
// neither the bezel nor the notch is resized during the pullback.
export const macBookDimensions = {
  drawingWidth: 900, width: 821.739, depth: 547.826,
  // The aluminium case remains rounded to mate with the base when closed;
  // the illuminated display alone has square lower corners.
  radius: 22, lidBottomRadius: 22, lidThickness: 6, hingeDrop: details.hingeDrop, lidRecess: details.lidRecess,
} as const;
// A small optical correction keeps the top visually aligned with the sides
// while the wide opening view scales into the laptop's native proportions.
export const displayDimensions = { side: 14.4, top: 16.65, bottom: 32 } as const;

/** Map the unchanged HTML screen (16px inside its wrapper) into the actual
 * display aperture. The metal and black bezel extend beyond that wrapper. */
export function displayMapping(width: number, height: number) {
  const scaleX = (macBookDimensions.width - displayDimensions.side * 2) / (width - 32);
  const scaleY = (macBookDimensions.depth - displayDimensions.top - displayDimensions.bottom) / (height - 32);
  return { scaleX, scaleY, x: displayDimensions.side - 16 * scaleX, y: displayDimensions.top - 16 * scaleY };
}
