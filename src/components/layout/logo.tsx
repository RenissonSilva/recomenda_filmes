import { Popcorn } from 'lucide-react';
import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home}
      className={cn(
        'flex items-center gap-2 rounded-lg font-bold tracking-tight focus-ring',
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-fg">
        <Popcorn aria-hidden className="size-5" />
      </span>
      <span className="text-lg">{siteConfig.name}</span>
    </Link>
  );
}
