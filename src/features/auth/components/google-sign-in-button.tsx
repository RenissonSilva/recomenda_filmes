'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { routes } from '@/lib/routes';

import { authClient } from '../auth-client';
import { getAuthErrorMessage } from '../auth-errors';
import { withReturnTo } from '../return-to';
import { GoogleIcon } from './google-icon';

interface GoogleSignInButtonProps {
  /** Página para onde voltar depois do login. */
  returnTo: string;
}

/** Entrar (ou criar a conta) com o Google. Erros voltam para /entrar com `?error=`. */
export function GoogleSignInButton({ returnTo }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: returnTo,
      errorCallbackURL: withReturnTo(routes.signIn, returnTo),
    });
    // Em caso de sucesso, o navegador já está indo para o Google.
    if (error) {
      setPending(false);
      toast.error(getAuthErrorMessage(error));
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={() => void handleClick()}
    >
      {pending ? <Spinner label="Abrindo o Google" /> : <GoogleIcon className="size-5" />}
      Continuar com Google
    </Button>
  );
}
