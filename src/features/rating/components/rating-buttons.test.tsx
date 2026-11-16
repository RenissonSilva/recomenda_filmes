import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMediaKey } from '@/domain/media';
import { EMPTY_LIBRARY } from '@/domain/library';
import { useLibraryStore } from '@/features/library/store';
import { buildMedia } from '@test/fixtures/media';

import { RatingButtons } from './rating-buttons';

describe('<RatingButtons />', () => {
  const media = buildMedia({ title: 'Interestelar' });
  const key = getMediaKey(media);

  beforeEach(() => {
    useLibraryStore.setState(EMPTY_LIBRARY);
  });

  it('exibe a escala completa em um grupo acessível', () => {
    render(<RatingButtons media={media} />);

    const group = screen.getByRole('group', { name: 'Sua avaliação de Interestelar' });
    expect(group).toBeInTheDocument();
    for (const label of ['Odeio', 'Ruim', 'Bom', 'Ótimo']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('avalia ao clicar e desfaz ao clicar de novo na mesma nota', async () => {
    const user = userEvent.setup();
    const onRated = vi.fn();
    render(<RatingButtons media={media} onRated={onRated} />);

    await user.click(screen.getByRole('button', { name: 'Ótimo' }));
    expect(useLibraryStore.getState().ratings[key]?.value).toBe('love');
    expect(screen.getByRole('button', { name: 'Ótimo' })).toHaveAttribute('aria-pressed', 'true');
    expect(onRated).toHaveBeenLastCalledWith('love');

    await user.click(screen.getByRole('button', { name: 'Ótimo' }));
    expect(useLibraryStore.getState().ratings[key]).toBeUndefined();
    expect(onRated).toHaveBeenLastCalledWith(null);
  });

  it('troca a nota ao escolher outra opção', async () => {
    const user = userEvent.setup();
    render(<RatingButtons media={media} />);

    await user.click(screen.getByRole('button', { name: 'Bom' }));
    await user.click(screen.getByRole('button', { name: 'Odeio' }));

    expect(useLibraryStore.getState().ratings[key]?.value).toBe('hate');
    expect(screen.getByRole('button', { name: 'Bom' })).toHaveAttribute('aria-pressed', 'false');
  });
});
