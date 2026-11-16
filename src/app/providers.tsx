'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { LibraryHydrator } from '@/features/library/components/library-hydrator';

let browserQueryClient: QueryClient | undefined;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/** No servidor, um cliente novo por renderização; no navegador, o mesmo cliente sempre. */
function getQueryClient() {
  if (typeof window === 'undefined') return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <LibraryHydrator />
      {children}
      <Toaster
        theme="dark"
        position="bottom-center"
        mobileOffset={{ bottom: 88 }}
        toastOptions={{ duration: 5000 }}
      />
    </QueryClientProvider>
  );
}
