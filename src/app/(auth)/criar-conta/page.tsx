import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LocalLibraryNotice } from '@/features/account/components/local-library-notice';
import { AuthCardSkeleton } from '@/features/auth/components/auth-card';
import { SignUpView } from '@/features/auth/components/sign-up-view';
import { getAuthProviders } from '@/server/auth/providers';

export const metadata: Metadata = {
  title: 'Criar conta',
};

async function SignUpContent() {
  const providers = await getAuthProviders();
  return <SignUpView googleEnabled={providers.google} notice={<LocalLibraryNotice />} />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <SignUpContent />
    </Suspense>
  );
}
