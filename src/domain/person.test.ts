import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import {
  buildCreditTimeline,
  describeCastCredit,
  describeCredit,
  getAgeOn,
  getPersonAge,
  getWorksByRoles,
  hasLatinScript,
  type PersonCredit,
} from './person';

const credit = (overrides: Partial<PersonCredit>): PersonCredit => ({
  media: buildMedia(),
  roles: ['cast'],
  date: null,
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

describe('describeCastCredit', () => {
  it('mostra os personagens com "como" e os episódios', () => {
    expect(describeCastCredit(credit({ characters: ['Joel Miller'], episodeCount: 12 }))).toBe(
      'como Joel Miller · 12 episódios',
    );
    expect(describeCastCredit(credit({ characters: ['Mando', 'Din Djarin'] }))).toBe(
      'como Mando / Din Djarin',
    );
    expect(describeCastCredit(credit({ episodeCount: 1 }))).toBe('1 episódio');
    expect(describeCastCredit(credit({}))).toBe('');
  });
});

describe('buildCreditTimeline', () => {
  const titled = (title: string) => buildMedia({ title });

  it('agrupa por papel e por ano, dos mais recentes aos mais antigos, com os sem data primeiro', () => {
    const timeline = buildCreditTimeline([
      credit({ media: titled('Antigo'), date: '2001-05-01' }),
      credit({ media: titled('Anunciado'), date: null }),
      credit({ media: titled('Recente B'), date: '2024-03-10' }),
      credit({ media: titled('Recente A'), date: '2024-11-01' }),
      credit({ media: titled('Empate Z'), date: '2010-01-01' }),
      credit({ media: titled('Empate A'), date: '2010-01-01' }),
    ]);

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ role: 'cast', label: 'Atuação', count: 6 });
    expect(
      timeline[0]?.years.map(({ year, credits }) => [year, credits.map((c) => c.media.title)]),
    ).toEqual([
      [null, ['Anunciado']],
      [2024, ['Recente A', 'Recente B']],
      [2010, ['Empate A', 'Empate Z']],
      [2001, ['Antigo']],
    ]);
  });

  it('cria um bloco por papel, na ordem Atuação · Direção · Criação · Obra original', () => {
    const timeline = buildCreditTimeline([
      credit({ roles: ['original-work'], date: '2013-04-07' }),
      credit({ roles: ['cast', 'direction'], date: '1992-08-07' }),
      credit({ roles: ['cast'], date: '2008-01-01' }),
    ]);

    expect(timeline.map(({ role, count }) => [role, count])).toEqual([
      ['cast', 2],
      ['direction', 1],
      ['original-work', 1],
    ]);
  });
});

describe('getAgeOn / getPersonAge', () => {
  it('conta só os aniversários já completados', () => {
    expect(getAgeOn('1975-04-02', '2026-04-01')).toBe(50);
    expect(getAgeOn('1975-04-02', '2026-04-02')).toBe(51);
    expect(getAgeOn('2000-02-29', '2026-03-01')).toBe(26);
    expect(getAgeOn('data inválida', '2026-04-02')).toBeNull();
    expect(getAgeOn('2030-01-01', '2026-04-02')).toBeNull();
  });

  it('usa a data do falecimento quando houver', () => {
    expect(getPersonAge({ birthday: '1975-04-02', deathday: null }, '2026-11-17')).toBe(51);
    expect(getPersonAge({ birthday: '1930-05-31', deathday: '2020-01-15' }, '2026-11-17')).toBe(89);
    expect(getPersonAge({ birthday: null, deathday: null }, '2026-11-17')).toBeNull();
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
