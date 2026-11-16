import { z } from 'zod';

import { mediaKeySchema } from '@/domain/schemas';
import type { MediaKey } from '@/domain/media';

/** De quem são os dados deste navegador e o que ainda falta enviar para a conta. */
export interface LibrarySyncState {
  /** Usuário dono dos dados; `null` = dados locais, feitos sem login. */
  ownerId: string | null;
  /** Títulos alterados neste navegador que ainda não foram salvos na conta. */
  pendingKeys: MediaKey[];
}

export const LOCAL_SYNC_STATE: LibrarySyncState = { ownerId: null, pendingKeys: [] };

const syncStateSchema = z.object({
  ownerId: z.string().min(1).nullable(),
  pendingKeys: z
    .array(z.unknown())
    .transform((keys) =>
      keys.filter((key): key is MediaKey => mediaKeySchema.safeParse(key).success),
    ),
}) satisfies z.ZodType<LibrarySyncState, unknown>;

/** Lê o estado de sincronização salvo no `localStorage` (ausente ou inválido = modo local). */
export function sanitizeSyncState(value: unknown): LibrarySyncState {
  const parsed = syncStateSchema.safeParse(value);
  return parsed.success ? parsed.data : LOCAL_SYNC_STATE;
}
