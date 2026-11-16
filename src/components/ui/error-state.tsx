'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { Button } from './button';
import { EmptyState } from './empty-state';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={<TriangleAlert aria-hidden />}
      title={title}
      description={<p role="alert">{message}</p>}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw aria-hidden />
            Tentar novamente
          </Button>
        )
      }
    />
  );
}
