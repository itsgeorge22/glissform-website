/** Match CSS's --design-unit without coupling layout to display pixel density. */
export const designReferenceWidth = 1920;
export const designScale = (width: number) => width / designReferenceWidth;

/** Shared artwork also appears in older studies, where scaling stays at 1. */
export function elementDesignScale(element: Element) {
  const page = element.closest('.home-next');
  return page ? designScale(page.clientWidth) : 1;
}
