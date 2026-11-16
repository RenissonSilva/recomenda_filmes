'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { TextLink } from '@/components/ui/text-link';
import { routes } from '@/lib/routes';

import { authClient } from '../auth-client';
import { getAuthErrorMessage, getOAuthErrorMessage } from '../auth-errors';
import { useRedirectWhenSignedIn, useReturnTo } from '../hooks';
import { withReturnTo } from '../return-to';
import { signInSchema } from '../schemas';
import { useAuthForm } from '../use-auth-form';
import { AuthCard, AuthDivider } from './auth-card';
import { GoogleSignInButton } from './google-sign-in-button';
import { SubmitButton } from './submit-button';

/** Tela "Entrar": Google (se configurado) ou e-mail e senha. */
export function SignInView({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const returnTo = useReturnTo();
  const oauthError = getOAuthErrorMessage(useSearchParams().get('error'));
  useRedirectWhenSignedIn(returnTo);

  const { fieldErrors, formError, pending, onSubmit } = useAuthForm(
    signInSchema,
    async ({ email, password }) => {
      const { error } = await authClient.signIn.email({ email, password, rememberMe: true });
      if (error) return { error: getAuthErrorMessage(error) };

      toast.success('Você entrou na sua conta.');
      router.replace(returnTo);
    },
  );

  return (
    <AuthCard
      title="Entrar"
      description="Suas avaliações salvas na conta, em qualquer dispositivo."
      footer={
        <>
          Ainda não tem conta?{' '}
          <TextLink href={withReturnTo(routes.signUp, returnTo)}>Criar conta</TextLink>
        </>
      }
    >
      {oauthError && (
        <Alert tone="error" className="mb-6">
          {oauthError}
        </Alert>
      )}

      {googleEnabled && (
        <>
          <GoogleSignInButton returnTo={returnTo} />
          <AuthDivider />
        </>
      )}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="E-mail" error={fieldErrors.email}>
          {(control) => (
            <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>
        <Field
          label="Senha"
          error={fieldErrors.password}
          labelAside={
            <TextLink href={routes.forgotPassword} className="text-xs">
              Esqueci minha senha
            </TextLink>
          }
        >
          {(control) => (
            <PasswordInput {...control} name="password" autoComplete="current-password" />
          )}
        </Field>

        {formError && <Alert tone="error">{formError}</Alert>}
        <SubmitButton pending={pending}>Entrar</SubmitButton>
      </form>
    </AuthCard>
  );
}
