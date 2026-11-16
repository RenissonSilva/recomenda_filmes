import 'server-only';

import { notFound } from 'next/navigation';

import type { MediaDetails, MediaType } from '@/domain/media';
import { getTitleDetails } from '@/server/tmdb/catalog';

/** Converte o segmento `[id]` da URL em número, ou `null` se for inválido. */
export function parseTitleId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Carrega o título da rota `/filme/[id]` ou `/serie/[id]`, respondendo 404 quando não existe.
 * Compartilhado pela página e pelo `generateMetadata` (o resultado vem do cache).
 */
export async function loadTitle(
  mediaType: MediaType,
  params: Promise<{ id: string }>,
): Promise<MediaDetails> {
  const id = parseTitleId((await params).id);
  if (id === null) notFound();

  const details = await getTitleDetails(mediaType, id);
  if (!details) notFound();

  return details;
}

export async function buildTitleMetadata(mediaType: MediaType, params: Promise<{ id: string }>) {
  const details = await loadTitle(mediaType, params);
  const title = details.releaseYear ? `${details.title} (${details.releaseYear})` : details.title;
  return {
    title,
    description: details.overview || undefined,
  };
}
