import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

import type { MediaSummary } from '@/domain/media';
import { RATING_VALUES } from '@/domain/rating';

import { user } from './auth';

const instant = (name: string) => timestamp(name, { withTimezone: true });

/**
 * Biblioteca sincronizada de cada usuário: uma linha por título, com a sua situação
 * em todas as listas (ver `LibraryItem` em `src/domain/library-items.ts`).
 */
export const libraryItem = pgTable(
  'library_item',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** Identificador do título no app, ex.: `movie:157336`. */
    mediaKey: text('media_key').notNull(),
    /** Resumo do título (para exibir os cards sem consultar o TMDB). */
    media: jsonb('media').$type<MediaSummary>().notNull(),
    rating: text('rating', { enum: RATING_VALUES }),
    ratedAt: instant('rated_at'),
    unseenAt: instant('unseen_at'),
    watchlistAt: instant('watchlist_at'),
    dismissedAt: instant('dismissed_at'),
    updatedAt: instant('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mediaKey] }),
    check('library_item_rating_check', sql`(${table.rating} is null) = (${table.ratedAt} is null)`),
  ],
);

export type LibraryItemRow = typeof libraryItem.$inferSelect;
export type NewLibraryItemRow = typeof libraryItem.$inferInsert;
