import 'server-only';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { PersonDetails } from '@/domain/person';
import { parseRouteId } from '@/lib/routes';
import { getPersonDetails } from '@/server/tmdb/catalog';

/**
 * Carrega a pessoa da rota `/pessoa/[id]`, respondendo 404 quando não existe.
 * Compartilhado pela página e pelo `generateMetadata` (o resultado vem do cache).
 */
export async function loadPerson(params: Promise<{ id: string }>): Promise<PersonDetails> {
  const id = parseRouteId((await params).id);
  if (id === null) notFound();

  const person = await getPersonDetails(id);
  if (!person) notFound();

  return person;
}

export async function buildPersonMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const person = await loadPerson(params);
  return {
    title: person.name,
    description: `Filmes, séries e animes com ${person.name}.`,
  };
}
