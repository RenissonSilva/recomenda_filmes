'use client';

import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TextLink } from '@/components/ui/text-link';
import { authConfig } from '@/config/auth';
import { routes } from '@/lib/routes';

import { authClient } from '../auth-client';
import { getAuthErrorMessage } from '../auth-errors';
import { forgotPasswordSchema } from '../schemas';
import { useAuthForm } from '../use-auth-form';
import { AuthCard } from './auth-card';
import { SubmitButton } from './submit-button';

/** Tela "Esqueci minha senha": envia por e-mail o link para criar uma nova senha. */
export function ForgotPasswordView() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { fieldErrors, formError, pending, onSubmit } = useAuthForm(
    forgotPasswordSchema,
    async ({ email }) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: routes.resetPassword,
      });
      if (error) return { error: getAuthErrorMessage(error) };
      setSentTo(email);
    },
  );

  const backToSignIn = (
    <>
      Lembrou a senha? <TextLink href={routes.signIn}>Entrar</TextLink>
    </>
  );

  if (sentTo) {
    return (
      <AuthCard title="Confira seu e-mail" footer={backToSignIn}>
        <Alert tone="success">
          Se existir uma conta com <strong className="font-semibold">{sentTo}</strong>, você vai
          receber um link para criar uma nova senha. Ele vale por{' '}
          {authConfig.passwordResetExpiresInMinutes} minutos.
        </Alert>
        <p className="mt-4 text-sm text-fg-muted">
          Não chegou? Confira a caixa de spam ou tente de novo em alguns minutos.
        </p>
        <ButtonLink href={routes.signIn} variant="outline" size="lg" className="mt-6 w-full">
          Voltar para o login
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha."
      footer={backToSignIn}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="E-mail" error={fieldErrors.email}>
          {(control) => (
            <Input {...control} name="email" type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>

        {formError && <Alert tone="error">{formError}</Alert>}
        <SubmitButton pending={pending}>Enviar link</SubmitButton>
      </form>
    </AuthCard>
  );
}
