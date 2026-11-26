/** Paths are relative so the build works under any sub-folder. */
const base = import.meta.env.BASE_URL;


export const logoUrl = `${base}smartic-logo.svg`;
export const posterUrl = `${base}img/controller-poster.webp`;
export const roomImg = (scene: 'morning' | 'friends' | 'movie', w: 1080 | 1920) => `${base}img/room/day-${scene}-${w}.webp`;
