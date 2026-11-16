'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { authConfig } from '@/config/auth';
import { routes } from '@/lib/routes';

import { authClient } from '../auth-client';
import { getAuthErrorMessage } from '../auth-errors';
import { resetPasswordSchema } from '../schemas';
import { useAuthForm } from '../use-auth-form';
import { AuthCard } from './auth-card';
import { SubmitButton } from './submit-button';

/**
 * Tela "Redefinir senha", aberta pelo link do e-mail. O Better Auth valida o link antes
 * e chega aqui com `?token=` (válido) ou `?error=INVALID_TOKEN` (inválido ou expirado).
 */
export function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('error') ? null : searchParams.get('token');

  const { fieldErrors, formError, pending, onSubmit } = useAuthForm(
    resetPasswordSchema,
    async ({ password }) => {
      if (!token) return { error: getAuthErrorMessage({ code: 'INVALID_TOKEN' }) };

      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) return { error: getAuthErrorMessage(error) };

      toast.success('Senha alterada. Entre com a nova senha.');
      router.replace(routes.signIn);
    },
  );

  if (!token) {
    return (
      <AuthCard
        title="Link inválido"
        description="Este link para redefinir a senha é inválido ou já expirou."
      >
        <ButtonLink href={routes.forgotPassword} size="lg" className="w-full">
          Pedir um novo link
        </ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar nova senha"
      description="Por segurança, você vai sair da conta em todos os dispositivos e precisará entrar de novo."
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Nova senha"
          error={fieldErrors.password}
          hint={`Mínimo de ${authConfig.password.minLength} caracteres.`}
        >
          {(control) => <PasswordInput {...control} name="password" autoComplete="new-password" />}
        </Field>
        <Field label="Repita a nova senha" error={fieldErrors.confirmPassword}>
          {(control) => (
            <PasswordInput {...control} name="confirmPassword" autoComplete="new-password" />
          )}
        </Field>

        {formError && <Alert tone="error">{formError}</Alert>}
        <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
      </form>
    </AuthCard>
  );
}
