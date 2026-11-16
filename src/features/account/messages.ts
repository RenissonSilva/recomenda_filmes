import { pluralize } from '@/lib/format';

/** "1 título deste navegador foi salvo na sua conta." */
export function importedTitlesMessage(count: number): string {
  return count === 1
    ? '1 título deste navegador foi salvo na sua conta.'
    : `${pluralize(count, 'título', 'títulos')} deste navegador foram salvos na sua conta.`;
}
