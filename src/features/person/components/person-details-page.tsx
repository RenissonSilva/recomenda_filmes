import { io } from 'next/cache';

import { Container } from '@/components/layout/container';
import { getTodayIsoDate } from '@/lib/format';

import { loadPerson } from '../load-person';
import { PersonFilmography } from './person-filmography';
import { PersonHeader } from './person-header';

/** Página `/pessoa/[id]`: informações pessoais e filmografia (grade ou linha do tempo). */
export async function PersonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await loadPerson(params);
  // A idade depende do dia de hoje: `io()` deixa esse cálculo fora do prerender.
  await io();
  const today = getTodayIsoDate();

  return (
    <Container className="flex flex-col gap-12">
      <PersonHeader person={person} today={today} />
      <PersonFilmography personName={person.name} credits={person.credits} />
    </Container>
  );
}
