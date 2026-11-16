import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCardSkeleton } from '@/features/auth/components/auth-card';
import { SignInView } from '@/features/auth/components/sign-in-view';
import { getAuthProviders } from '@/server/auth/providers';

export const metadata: Metadata = {
  title: 'Entrar',
};

async function SignInContent() {
  const providers = await getAuthProviders();
  return <SignInView googleEnabled={providers.google} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <SignInContent />
    </Suspense>
  );
}
