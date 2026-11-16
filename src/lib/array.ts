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
