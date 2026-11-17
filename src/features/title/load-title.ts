import 'server-only';

import { notFound } from 'next/navigation';

import type { MediaDetails, MediaType } from '@/domain/media';
import { parseRouteId } from '@/lib/routes';
import { getTitleDetails } from '@/server/tmdb/catalog';

/**
 * Carrega o título da rota `/filme/[id]` ou `/serie/[id]`, respondendo 404 quando não existe.
 * Compartilhado pela página e pelo `generateMetadata` (o resultado vem do cache).
 */
export async function loadTitle(
  mediaType: MediaType,
  params: Promise<{ id: string }>,
): Promise<MediaDetails> {
  const id = parseRouteId((await params).id);
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
