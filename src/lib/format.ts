const LOCALE = 'pt-BR';
/** Fuso usado para saber que dia é "hoje" (ex.: idade de uma pessoa). */
const TIME_ZONE = 'America/Sao_Paulo';

const listFormatter = new Intl.ListFormat(LOCALE, { style: 'long', type: 'conjunction' });
// As datas do TMDB não têm horário: formatar em UTC evita voltar um dia no fuso do Brasil.
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeZone: 'UTC' });
// O locale canadense formata a data como "2026-11-17", o mesmo formato das datas do TMDB.
const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 169 → "2h 49min"; 45 → "45min". */
export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

/** 8.456 → "8,5". */
export function formatVoteAverage(value: number): string {
  return decimalFormatter.format(value);
}

/** "1975-04-02" → "2 de abril de 1975"; data inválida → `null`. */
export function formatDate(isoDate: string): string | null {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

/** Data de hoje no fuso do Brasil, no formato das datas do TMDB: "2026-11-17". */
export function getTodayIsoDate(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

/** ["A", "B", "C"] → "A, B e C". */
export function formatList(items: readonly string[]): string {
  return listFormatter.format(items);
}

/** `formatList` em partes (nomes e separadores), para montar a lista com links. */
export function formatListToParts(items: readonly string[]) {
  return listFormatter.formatToParts(items);
}

/** pluralize(1, 'título', 'títulos') → "1 título"; pluralize(1180, …) → "1.180 títulos". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${integerFormatter.format(count)} ${count === 1 ? singular : plural}`;
}

/** Iniciais para avatares: "Ana Maria Souza" → "AS"; "ana" → "A". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase(LOCALE);
}
