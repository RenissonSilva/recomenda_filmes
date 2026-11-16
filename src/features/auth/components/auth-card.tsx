import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links para as outras telas (ex.: "Ainda não tem conta? Criar conta"). */
  footer?: ReactNode;
}

/** Moldura das telas de autenticação. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <header className="mb-6 flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
        {description && <p className="text-sm text-pretty text-fg-muted">{description}</p>}
      </header>
      {children}
      {footer && <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div>}
    </div>
  );
}

/** Separador "ou" entre o login com Google e o formulário. */
export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-fg-subtle uppercase">
      <span className="h-px flex-1 bg-line" />
      ou
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Esqueleto exibido enquanto a tela de autenticação carrega. */
export function AuthCardSkeleton() {
  return (
    <div
      aria-hidden
      className="h-[28rem] animate-pulse rounded-2xl border border-line bg-surface"
    />
  );
}
