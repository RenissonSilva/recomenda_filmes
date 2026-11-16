import type { ImageLoaderProps } from 'next/image';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/** Larguras servidas pelo CDN de imagens do TMDB (válidas para pôsteres, fundos, logos e fotos). */
const TMDB_IMAGE_WIDTHS = [92, 154, 185, 300, 342, 500, 780, 1280] as const;

/**
 * Loader do `next/image` que usa os tamanhos prontos do CDN do TMDB em vez do
 * otimizador do Next.js. O `src` é o caminho devolvido pela API (ex.: `/abc.jpg`).
 */
export function tmdbImageLoader({ src, width }: ImageLoaderProps): string {
  const size = TMDB_IMAGE_WIDTHS.find((available) => available >= width);
  return `${TMDB_IMAGE_BASE_URL}/${size ? `w${size}` : 'original'}${src}`;
}
