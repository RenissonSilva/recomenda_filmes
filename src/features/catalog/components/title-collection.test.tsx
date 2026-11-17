import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import { TitleCollection } from './title-collection';

const ANIMATION = 16;

const movie = (title: string, voteAverage: number, releaseYear = 2010) =>
  buildMedia({ title, voteAverage, releaseYear });
const series = (title: string, voteAverage: number) =>
  buildMedia({ mediaType: 'tv', title, voteAverage });
const anime = (title: string, voteAverage: number) =>
  buildMedia({
    mediaType: 'tv',
    title,
    voteAverage,
    genreIds: [ANIMATION],
    originalLanguage: 'ja',
  });

const visibleTitles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

describe('<TitleCollection />', () => {
  const items = [
    movie('Filme bom', 7.1, 2020),
    series('Série ótima', 8.9),
    movie('Filme ótimo', 8.5, 1999),
    anime('Anime', 8.0),
  ].map((media) => ({ media }));

  it('ordena por nota por padrão e filtra por seção', async () => {
    const user = userEvent.setup();
    render(<TitleCollection items={items} sorts={['rating', 'recent']} grouping="filter" />);

    expect(visibleTitles()).toEqual(['Série ótima', 'Filme ótimo', 'Anime', 'Filme bom']);
    expect(screen.getByRole('button', { name: 'Tudo (4)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Filmes (2)' }));
    expect(visibleTitles()).toEqual(['Filme ótimo', 'Filme bom']);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordenar por' }), 'recent');
    expect(visibleTitles()).toEqual(['Filme bom', 'Filme ótimo']);
  });

  it('esconde o filtro quando todos os títulos são da mesma seção', () => {
    render(
      <TitleCollection
        items={[movie('A', 7, 2000), movie('B', 8, 2001)].map((media) => ({ media }))}
        sorts={['rating']}
        grouping="filter"
      />,
    );

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(visibleTitles()).toEqual(['B', 'A']);
  });

  it('em abas, começa pela seção com mais títulos e mostra a linha de cada crédito', () => {
    render(
      <TitleCollection
        items={[
          { media: movie('Filme', 7), note: 'Joel' },
          { media: series('Série 1', 8), note: 'Direção' },
          { media: series('Série 2', 9), note: '12 episódios' },
        ]}
        sorts={['rating']}
        grouping="tabs"
      />,
    );

    // A ordem das abas é fixa; só a seleção inicial muda.
    const tabs = within(screen.getByRole('group', { name: 'Seção' })).getAllByRole('button');
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Filmes (1)', 'Séries (2)']);
    expect(tabs[1]).toHaveAttribute('aria-pressed', 'true');
    expect(visibleTitles()).toEqual(['Série 2', 'Série 1']);
    expect(screen.getByText('12 episódios')).toBeInTheDocument();
  });

  it('mostra mais títulos sob demanda', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 5 }, (_, index) => ({
      media: movie(`Filme ${index}`, 9 - index),
    }));
    render(<TitleCollection items={many} sorts={['rating']} grouping="filter" pageSize={2} />);

    expect(visibleTitles()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Mostrar mais (3)' }));
    expect(visibleTitles()).toHaveLength(4);
  });
});
