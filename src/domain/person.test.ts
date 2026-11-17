import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import { describeCredit, getWorksByRoles, hasLatinScript, type PersonCredit } from './person';

const credit = (overrides: Partial<PersonCredit>): PersonCredit => ({
  media: buildMedia(),
  roles: ['cast'],
  characters: [],
  episodeCount: null,
  ...overrides,
});

describe('describeCredit', () => {
  it('mostra personagem e episódios', () => {
    expect(describeCredit(credit({ characters: ['Joel Miller'], episodeCount: 12 }))).toBe(
      'Joel Miller · 12 episódios',
    );
    expect(describeCredit(credit({ characters: ['Joel'], episodeCount: 1 }))).toBe(
      'Joel · 1 episódio',
    );
  });

  it('mostra as funções autorais antes do personagem', () => {
    expect(
      describeCredit(credit({ roles: ['cast', 'direction'], characters: ['William Munny'] })),
    ).toBe('Direção · William Munny');
    expect(describeCredit(credit({ roles: ['original-work'] }))).toBe('Obra original');
  });
});

describe('getWorksByRoles', () => {
  it('filtra pelos papéis e ordena dos mais aos menos votados', () => {
    const directed = buildMedia({ voteCount: 100 });
    const created = buildMedia({ mediaType: 'tv', voteCount: 500 });
    const acted = buildMedia({ voteCount: 9000 });

    const works = getWorksByRoles(
      [
        credit({ media: directed, roles: ['direction'] }),
        credit({ media: created, roles: ['creation'] }),
        credit({ media: acted, roles: ['cast'] }),
      ],
      ['direction', 'creation'],
    );

    expect(works).toEqual([created, directed]);
  });
});

describe('hasLatinScript', () => {
  it('distingue nomes em alfabeto latino', () => {
    expect(hasLatinScript('Hajime Isayama')).toBe(true);
    expect(hasLatinScript('Zoë Kravitz')).toBe(true);
    expect(hasLatinScript('諫山創')).toBe(false);
  });
});
