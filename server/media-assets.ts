/** Compatibility for withdrawn, provenance-unverified images from the supplied archive.
 * Only these fixed local URLs redirect; uploads and custom images are untouched.
 */
export function legacyImageReplacement(path: string): string | undefined {
  const images: Record<string, string> = {
    "hero.svg": "original-terrace.png",
    "product-1.svg": "original-balcony.png",
    "product-2.svg": "original-terrace.png",
    "product-3.svg": "original-balcony.png",
    "product-4.svg": "original-terrace.png",
    "product-5.svg": "original-pergola.png",
    "product-6.svg": "original-pergola.png",
    "product-7.svg": "original-terrace.png",
    "product-8.svg": "original-terrace.png",
    "product-9.svg": "original-balcony.png",
    "product-10.svg": "aluminium-facade.svg",
    "project-1.svg": "original-terrace.png",
    "project-2.svg": "original-balcony.png",
    "project-3.svg": "original-pergola.png",
    "project-4.svg": "original-terrace.png",
    "project-5.svg": "original-pergola.png",
    "project-6.svg": "aluminium-facade.svg",
    "article-1.svg": "original-balcony.png",
    "article-2.svg": "original-terrace.png",
    "article-3.svg": "original-pergola.png",
    "article-4.svg": "original-balcony.png",
  };
  const filename = path.startsWith("/images/") ? path.slice(8) : "";
  const replacement = Object.prototype.hasOwnProperty.call(images, filename)
    ? images[filename]
    : undefined;
  return replacement ? "/images/" + replacement : undefined;
}
