import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { PersonCredit } from '@/domain/person';
import { buildMedia } from '@test/fixtures/media';

import { PersonFilmography } from './person-filmography';

const credit = (overrides: Partial<PersonCredit> & { title: string }): PersonCredit => {
  const { title, ...rest } = overrides;
  return {
    media: buildMedia({ title }),
    roles: ['cast'],
    date: null,
    characters: [],
    episodeCount: null,
    ...rest,
  };
};

const credits: PersonCredit[] = [
  credit({ title: 'Gladiador II', date: '2024-11-14', characters: ['Marcus Acacius'] }),
  credit({ title: 'Mulher-Maravilha 1984', date: '2020-12-16', characters: ['Max Lord'] }),
  credit({ title: 'Kingsman: O Círculo Dourado', date: '2017-09-20' }),
  credit({ title: 'Filme dirigido', date: '2019-01-01', roles: ['direction'] }),
  {
    ...credit({ title: 'The Last of Us', date: '2023-01-15', characters: ['Joel Miller'] }),
    media: buildMedia({ title: 'The Last of Us', mediaType: 'tv' }),
    episodeCount: 12,
  },
];

const switchToTimeline = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Linha do tempo' }));

describe('<PersonFilmography />', () => {
  it('começa na grade e alterna para a linha do tempo mantendo a seção aberta', async () => {
    const user = userEvent.setup();
    render(<PersonFilmography personName="Pedro Pascal" credits={credits} />);

    expect(screen.getByRole('button', { name: 'Grade' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Séries (1)' }));
    await switchToTimeline(user);

    expect(screen.getByRole('button', { name: 'Séries (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', { name: 'The Last of Us' })).toBeInTheDocument();
    expect(screen.getByText('como Joel Miller · 12 episódios')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gladiador II' })).not.toBeInTheDocument();
  });

  it('lista as atuações por ano, da mais recente à mais antiga, com a direção em outro bloco', async () => {
    const user = userEvent.setup();
    render(<PersonFilmography personName="Pedro Pascal" credits={credits} />);
    await switchToTimeline(user);

    const acting = screen.getByRole('region', { name: /Atuação/ });
    expect(
      within(acting)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Gladiador II', 'Mulher-Maravilha 1984', 'Kingsman: O Círculo Dourado']);
    expect(within(acting).getByText('2024')).toBeInTheDocument();
    expect(within(acting).getByText('como Max Lord')).toBeInTheDocument();

    const directing = screen.getByRole('region', { name: /Direção/ });
    expect(within(directing).getByRole('link', { name: 'Filme dirigido' })).toBeInTheDocument();
  });

  it('avisa quando a pessoa não tem títulos', () => {
    render(<PersonFilmography personName="Fulano" credits={[]} />);

    expect(screen.getByText('Nenhum título encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Linha do tempo' })).not.toBeInTheDocument();
  });
});
