import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const alertVariants = cva(
  'flex gap-3 rounded-xl border px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4',
  {
    variants: {
      tone: {
        error: 'border-red-500/30 bg-red-500/10 text-red-200',
        success: 'border-green-500/30 bg-green-500/10 text-green-200',
        info: 'border-line bg-surface-2 text-fg-muted',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

const ICONS = { error: CircleAlert, success: CircleCheck, info: Info } as const;

interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  className?: string;
}

/** Mensagem em destaque. Erros são anunciados imediatamente por leitores de tela. */
export function Alert({ tone = 'info', children, className }: AlertProps) {
  const Icon = ICONS[tone ?? 'info'];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ tone }), className)}
    >
      <Icon aria-hidden className="shrink-0" />
      <div className="text-pretty">{children}</div>
    </div>
  );
}
