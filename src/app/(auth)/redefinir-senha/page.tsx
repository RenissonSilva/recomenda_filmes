import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCardSkeleton } from '@/features/auth/components/auth-card';
import { ResetPasswordView } from '@/features/auth/components/reset-password-view';

export const metadata: Metadata = {
  title: 'Redefinir senha',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordView />
    </Suspense>
  );
}
