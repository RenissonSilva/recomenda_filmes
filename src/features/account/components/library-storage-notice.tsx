'use client';

import { ButtonLink } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks';
import { withReturnTo } from '@/features/auth/return-to';
import { routes } from '@/lib/routes';

/** Onde as avaliações ficam guardadas — com convite para criar conta quando ainda não há login. */
export function LibraryStorageNotice() {
  const { user, status } = useCurrentUser();

  if (user) {
    return (
      <p className="max-w-2xl text-sm text-fg-muted">
        Suas avaliações ficam salvas na sua conta (
        <span className="font-medium text-fg">{user.email}</span>) e sincronizadas entre os seus
        dispositivos. Se quiser, exporte também um backup.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-fg-muted">
        Suas avaliações ficam salvas apenas neste navegador. Crie uma conta para guardá-las com
        segurança e acessá-las em qualquer dispositivo — ou exporte um backup.
      </p>
      {status !== 'loading' && (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={withReturnTo(routes.signUp, routes.ratings)} size="sm">
            Criar conta
          </ButtonLink>
          <ButtonLink
            href={withReturnTo(routes.signIn, routes.ratings)}
            variant="outline"
            size="sm"
          >
            Já tenho conta
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
