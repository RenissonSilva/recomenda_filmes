'use client';

import { useEffect, useRef } from 'react';

import { Button } from './button';
import { Spinner } from './spinner';

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  /** Deve ser uma função estável (ex.: `fetchNextPage` do TanStack Query). */
  onLoadMore: () => unknown;
}

/**
 * Rolagem infinita: carrega a próxima página quando o fim da lista se aproxima.
 * O botão "Carregar mais" continua disponível para teclado e leitores de tela.
 */
export function LoadMore({ hasMore, loading, onLoadMore }: LoadMoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={containerRef} className="flex justify-center py-8">
      {loading ? (
        <Spinner label="Carregando mais títulos" />
      ) : (
        <Button variant="secondary" onClick={() => onLoadMore()}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
