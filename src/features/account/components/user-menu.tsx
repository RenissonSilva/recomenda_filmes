'use client';

import { CloudCheck, CloudUpload, LogIn, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Suspense, useCallback, useId, useRef, useState } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser, type CurrentUser } from '@/features/auth/hooks';
import { withReturnTo } from '@/features/auth/return-to';
import { useLibraryStore } from '@/features/library/store';
import { useDismiss } from '@/hooks/use-dismiss';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';
import { routes } from '@/lib/routes';

import { useSignOut } from '../use-sign-out';

function SignInLink({ returnTo }: { returnTo: string | null }) {
  return (
    <ButtonLink href={withReturnTo(routes.signIn, returnTo)} variant="outline" size="sm">
      <LogIn aria-hidden />
      Entrar
    </ButtonLink>
  );
}

function SignInLinkWithReturn() {
  return <SignInLink returnTo={usePathname()} />;
}

/** Situação da sincronização, exibida no menu da conta. */
function SyncStatus() {
  const saving = useLibraryStore((state) => state.sync.pendingKeys.length > 0);
  const Icon = saving ? CloudUpload : CloudCheck;

  return (
    <p className="flex items-center gap-2 px-3 py-2 text-xs text-fg-subtle">
      <Icon aria-hidden className="size-4" />
      {saving ? 'Salvando alterações na conta…' : 'Avaliações salvas na conta'}
    </p>
  );
}

const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted focus-ring hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4';

function AccountMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { signOut, pending } = useSignOut();

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close, triggerRef);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Conta de ${user.name}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex size-9 cursor-pointer items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-fg ring-1 ring-brand/40 focus-ring transition-colors hover:bg-brand/30',
          open && 'bg-brand/30',
        )}
      >
        <span aria-hidden>{getInitials(user.name) || '?'}</span>
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-black/40"
        >
          <div className="px-3 pt-2 pb-1">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-fg-muted">{user.email}</p>
          </div>
          <SyncStatus />
          <div className="my-1 h-px bg-line" />
          <button type="button" className={MENU_ITEM} disabled={pending} onClick={signOut}>
            {pending ? <Spinner label="Saindo" className="size-4" /> : <LogOut aria-hidden />}
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

/** Canto do cabeçalho: botão "Entrar" ou o menu da conta. */
export function UserMenu() {
  const { user, status } = useCurrentUser();

  if (status === 'loading') return <Skeleton className="size-9 rounded-full" />;
  if (user) return <AccountMenu user={user} />;

  // O caminho atual só é conhecido na requisição em rotas dinâmicas (ver `MainNavLinks`).
  return (
    <Suspense fallback={<SignInLink returnTo={null} />}>
      <SignInLinkWithReturn />
    </Suspense>
  );
}
