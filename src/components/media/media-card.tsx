import Link from 'next/link';
import type { ReactNode } from 'react';

import type { MediaSummary } from '@/domain/media';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

import { MediaMeta } from './media-meta';
import { GRID_POSTER_SIZES, MediaPoster } from './media-poster';

interface MediaCardProps {
  media: MediaSummary;
  /** Elemento no canto superior esquerdo do pôster (ex.: % de compatibilidade). */
  badge?: ReactNode;
  /** Elemento no canto superior direito do pôster (ex.: botão "Quero ver"). */
  action?: ReactNode;
  /** Camada sobre o pôster inteiro (ex.: estado "Nunca vi"). */
  overlay?: ReactNode;
  /** Esmaece o pôster, indicando um título "desativado". */
  dimmed?: boolean;
  /** Conteúdo abaixo do título: botões de avaliação, explicações etc. */
  children?: ReactNode;
  className?: string;
}

/**
 * Card base de um título. As variações (avaliar, recomendação, lista) são
 * composições deste componente, preenchendo os "slots" acima.
 */
export function MediaCard({
  media,
  badge,
  action,
  overlay,
  dimmed = false,
  children,
  className,
}: MediaCardProps) {
  const href = routes.title(media);
  const originalTitleHint =
    media.originalTitle !== media.title ? `Título original: ${media.originalTitle}` : undefined;

  return (
    <article className={cn('group flex h-full flex-col gap-3', className)}>
      <div className="relative">
        {/* O link do pôster duplica o do título: fica fora da ordem de tabulação e do leitor de tela. */}
        <Link href={href} tabIndex={-1} aria-hidden className="block">
          <MediaPoster
            media={media}
            sizes={GRID_POSTER_SIZES}
            className={cn(
              'transition duration-300 group-hover:ring-white/20',
              dimmed && 'opacity-35 grayscale',
            )}
          />
        </Link>
        {overlay}
        {badge && <div className="absolute top-2 left-2">{badge}</div>}
        {action && <div className="absolute top-2 right-2">{action}</div>}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div>
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
            <Link
              href={href}
              title={originalTitleHint}
              className="rounded focus-ring hover:underline"
            >
              {media.title}
            </Link>
          </h3>
          <MediaMeta media={media} className="mt-0.5" />
        </div>
        {children}
      </div>
    </article>
  );
}
