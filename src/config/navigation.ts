import { Bookmark, ListChecks, Sparkles, Star, type LucideIcon } from 'lucide-react';

import { routes } from '@/lib/routes';

export interface NavItem {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior no celular. */
  shortLabel: string;
  icon: LucideIcon;
  /** Contador exibido ao lado do item. */
  counter?: 'ratings' | 'watchlist';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: routes.rate, label: 'Avaliar', shortLabel: 'Avaliar', icon: Star },
  {
    href: routes.recommendations,
    label: 'Recomendações',
    shortLabel: 'Para você',
    icon: Sparkles,
  },
  {
    href: routes.ratings,
    label: 'Minhas avaliações',
    shortLabel: 'Avaliações',
    icon: ListChecks,
    counter: 'ratings',
  },
  {
    href: routes.watchlist,
    label: 'Quero ver',
    shortLabel: 'Quero ver',
    icon: Bookmark,
    counter: 'watchlist',
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
