/**
 * Equivalente a `Promise.all(items.map(mapper))`, mas com no máximo `concurrency`
 * operações simultâneas — evita estourar o limite de requisições de APIs externas.
 * A ordem do resultado corresponde à ordem de `items`.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index] as T, index);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
