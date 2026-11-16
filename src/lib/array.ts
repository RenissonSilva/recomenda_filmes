/** Remove itens repetidos mantendo a primeira ocorrência. */
export function uniqueBy<T, K>(items: readonly T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Intercala listas: [a1, b1, a2, b2, ...]. Itens que sobram vão para o final. */
export function interleave<T>(...lists: ReadonlyArray<readonly T[]>): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));

  for (let index = 0; index < longest; index++) {
    for (const list of lists) {
      if (index < list.length) result.push(list[index] as T);
    }
  }

  return result;
}

/** Divide a lista em partes de até `size` itens: chunk([1, 2, 3], 2) → [[1, 2], [3]]. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new RangeError('O tamanho das partes deve ser pelo menos 1.');
  const parts: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    parts.push(items.slice(index, index + size));
  }
  return parts;
}
