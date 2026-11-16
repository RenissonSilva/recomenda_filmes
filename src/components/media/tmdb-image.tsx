'use client';

import Image, { type ImageProps } from 'next/image';

import { tmdbImageLoader } from '@/lib/tmdb-image';

type TmdbImageProps = Omit<ImageProps, 'src' | 'loader'> & {
  /** Caminho da imagem devolvido pelo TMDB, ex.: `/abc123.jpg`. */
  path: string;
};

/**
 * `next/image` servido direto pelo CDN do TMDB, no tamanho mais adequado.
 * É um Client Component porque o `loader` (uma função) não pode sair do servidor.
 */
export function TmdbImage({ path, alt, ...props }: TmdbImageProps) {
  return <Image loader={tmdbImageLoader} src={path} alt={alt} {...props} />;
}
