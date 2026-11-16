const LOCALE = 'pt-BR';

const listFormatter = new Intl.ListFormat(LOCALE, { style: 'long', type: 'conjunction' });
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

/** ["A", "B", "C"] → "A, B e C". */
export function formatList(items: readonly string[]): string {
  return listFormatter.format(items);
}

/** pluralize(1, 'título', 'títulos') → "1 título". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Iniciais para avatares: "Ana Maria Souza" → "AS"; "ana" → "A". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase(LOCALE);
}
