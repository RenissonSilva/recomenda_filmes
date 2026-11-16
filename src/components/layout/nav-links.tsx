'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import { isNavItemActive, NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/cn';

import { NavCounter } from './nav-counter';

type NavVariant = 'desktop' | 'mobile';

const VARIANT_STYLES: Record<
  NavVariant,
  { list: string; link: string; active: string; idle: string }
> = {
  desktop: {
    list: 'flex items-center gap-1',
    link: 'flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium',
    active: 'bg-surface-2 text-fg',
    idle: 'text-fg-muted hover:text-fg',
  },
  mobile: {
    list: 'grid h-16 grid-cols-4',
    link: 'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
    active: 'text-fg',
    idle: 'text-fg-subtle',
  },
};

interface NavLinksProps {
  variant: NavVariant;
  /** Caminho atual (`null` enquanto ainda não é conhecido). */
  pathname: string | null;
}

function NavLinks({ variant, pathname }: NavLinksProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <ul className={styles.list}>
      {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon, counter }) => {
        const active = pathname !== null && isNavItemActive(pathname, href);

        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'focus-ring transition-colors',
                styles.link,
                active ? styles.active : styles.idle,
              )}
            >
              {variant === 'mobile' && (
                <Icon aria-hidden className={cn('size-5', active && 'text-brand')} />
              )}
              {variant === 'desktop' ? label : shortLabel}
              {counter && (
                <NavCounter
                  counter={counter}
                  className={variant === 'mobile' ? 'absolute top-1.5 left-1/2 ml-2' : undefined}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavLinksWithPathname({ variant }: { variant: NavVariant }) {
  return <NavLinks variant={variant} pathname={usePathname()} />;
}

/**
 * Links principais com destaque da página atual.
 * Em rotas dinâmicas (ex.: /filme/123) o caminho só é conhecido na requisição;
 * enquanto isso, o `Suspense` exibe os mesmos links sem destaque.
 */
export function MainNavLinks({ variant }: { variant: NavVariant }) {
  return (
    <Suspense fallback={<NavLinks variant={variant} pathname={null} />}>
      <NavLinksWithPathname variant={variant} />
    </Suspense>
  );
}
