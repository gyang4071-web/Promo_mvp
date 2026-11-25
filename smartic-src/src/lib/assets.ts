/** Paths are relative so the build works under any sub-folder. */
const base = import.meta.env.BASE_URL;

export const scene = (name: 'living' | 'heating' | 'windows' | 'central' | 'security') => ({
  src: `${base}img/scenes/${name}-1920.webp`,
  srcSet: `${base}img/scenes/${name}-1080.webp 1080w, ${base}img/scenes/${name}-1920.webp 1920w`,
  lqip: `${base}img/scenes/${name}-lqip.webp`,
});

export const productImg = (slug: string) => `${base}img/products/${slug}.webp`;
export const logoUrl = `${base}smartic-logo.svg`;
export const posterUrl = `${base}img/controller-poster.webp`;
