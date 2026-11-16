'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { TextLink } from '@/components/ui/text-link';
import { authConfig } from '@/config/auth';
import { routes } from '@/lib/routes';

import { authClient } from '../auth-client';
import { getAuthErrorMessage } from '../auth-errors';
import { useRedirectWhenSignedIn, useReturnTo } from '../hooks';
import { withReturnTo } from '../return-to';
import { signUpSchema } from '../schemas';
import { useAuthForm } from '../use-auth-form';
import { AuthCard, AuthDivider } from './auth-card';
import { GoogleSignInButton } from './google-sign-in-button';
import { SubmitButton } from './submit-button';

interface SignUpViewProps {
  googleEnabled: boolean;
  /** Aviso opcional acima do formulário (ex.: avaliações deste navegador que irão para a conta). */
  notice?: ReactNode;
}

/** Tela "Criar conta": Google (se configurado) ou nome, e-mail e senha. */
export function SignUpView({ googleEnabled, notice }: SignUpViewProps) {
  const router = useRouter();
  const returnTo = useReturnTo();
  useRedirectWhenSignedIn(returnTo);

  const { fieldErrors, formError, pending, onSubmit } = useAuthForm(
    signUpSchema,
    async ({ name, email, password }) => {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) return { error: getAuthErrorMessage(error) };

      toast.success('Conta criada. Boas-vindas!');
      router.replace(returnTo);
    },
  );

  return (
    <AuthCard
      title="Criar conta"
      description="Guarde suas avaliações e acesse de qualquer dispositivo. É grátis."
      footer={
        <>
          Já tem conta? <TextLink href={withReturnTo(routes.signIn, returnTo)}>Entrar</TextLink>
        </>
      }
    >
      {notice}

      {googleEnabled && (
        <>
          <GoogleSignInButton returnTo={returnTo} />
          <AuthDivider />
        </>
      )}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome" error={fieldErrors.name}>
          {(control) => <Input {...control} name="name" autoComplete="name" maxLength={80} />}
        </Field>
        <Field label="E-mail" error={fieldErrors.email}>
          {(control) => (
            <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>
        <Field
          label="Senha"
          error={fieldErrors.password}
          hint={`Mínimo de ${authConfig.password.minLength} caracteres.`}
        >
          {(control) => <PasswordInput {...control} name="password" autoComplete="new-password" />}
        </Field>

        {formError && <Alert tone="error">{formError}</Alert>}
        <SubmitButton pending={pending}>Criar conta</SubmitButton>
      </form>
    </AuthCard>
  );
}
