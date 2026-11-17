import { getPersonAge, PERSON_GENDER_LABELS, type PersonDetails } from '@/domain/person';
import { formatDate, pluralize } from '@/lib/format';

interface PersonFact {
  label: string;
  value: string;
}

/** "2 de abril de 1975 (51 anos)"; sem a idade, só a data. */
function formatDateWithAge(isoDate: string, age: number | null): string | null {
  const date = formatDate(isoDate);
  if (!date) return null;
  return age === null ? date : `${date} (${pluralize(age, 'ano', 'anos')})`;
}

/**
 * Informações pessoais no estilo do TMDB. A idade aparece junto do nascimento ou, se a pessoa
 * já faleceu, junto do falecimento (idade que tinha). Campos que o TMDB não informa ficam de fora.
 */
export function buildPersonFacts(person: PersonDetails, today: string): PersonFact[] {
  const age = getPersonAge(person, today);
  const facts: Array<{ label: string; value: string | null }> = [
    { label: 'Gênero', value: person.gender && PERSON_GENDER_LABELS[person.gender] },
    {
      label: 'Nascimento',
      value: person.birthday && formatDateWithAge(person.birthday, person.deathday ? null : age),
    },
    { label: 'Falecimento', value: person.deathday && formatDateWithAge(person.deathday, age) },
    { label: 'Local de nascimento', value: person.placeOfBirth },
    { label: 'Nome original', value: person.originalName },
  ];

  return facts.filter((fact): fact is PersonFact => Boolean(fact.value));
}

interface PersonFactsProps {
  person: PersonDetails;
  /** Data de hoje ("2026-11-17"), usada para calcular a idade. */
  today: string;
}

export function PersonFacts({ person, today }: PersonFactsProps) {
  const facts = buildPersonFacts(person, today);
  if (facts.length === 0) return null;

  return (
    <dl className="grid max-w-3xl grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-fg-muted">{fact.label}</dt>
          <dd className="font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
