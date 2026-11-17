import Link from 'next/link';
import { Fragment } from 'react';

import type { Person } from '@/domain/media';
import { formatListToParts } from '@/lib/format';
import { routes } from '@/lib/routes';

interface PersonLinkListProps {
  people: readonly Pick<Person, 'id' | 'name'>[];
}

/** "Joel Coen e Ethan Coen", com cada nome levando à página da pessoa. */
export function PersonLinkList({ people }: PersonLinkListProps) {
  const parts = formatListToParts(people.map((person) => person.name));
  // As partes "element" vêm na mesma ordem das pessoas.
  let personIndex = 0;

  return parts.map((part, index) => {
    const person = part.type === 'element' ? people[personIndex++] : undefined;
    if (!person) return <Fragment key={index}>{part.value}</Fragment>;

    return (
      <Link
        key={index}
        href={routes.person(person)}
        className="rounded underline decoration-fg-subtle underline-offset-4 focus-ring hover:decoration-fg"
      >
        {part.value}
      </Link>
    );
  });
}
