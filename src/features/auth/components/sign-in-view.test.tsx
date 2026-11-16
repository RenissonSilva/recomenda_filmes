import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignInView } from './sign-in-view';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInEmail: vi.fn(),
  searchParams: new URLSearchParams('voltar=/avaliar'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('../auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false, error: null }),
    signIn: { email: mocks.signInEmail, social: vi.fn() },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('<SignInView />', () => {
  beforeEach(() => {
    mocks.searchParams = new URLSearchParams('voltar=/avaliar');
  });

  it('valida os campos antes de enviar', async () => {
    const user = userEvent.setup();
    render(<SignInView googleEnabled={false} />);

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Informe seu e-mail.');
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Informe sua senha.');
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });

  it('mostra o erro do servidor em português', async () => {
    const user = userEvent.setup();
    mocks.signInEmail.mockResolvedValue({
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 },
    });
    render(<SignInView googleEnabled={false} />);

    await user.type(screen.getByLabelText('E-mail'), 'Ana@Exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(mocks.signInEmail).toHaveBeenCalledWith({
      email: 'ana@exemplo.com',
      password: 'senha-errada',
      rememberMe: true,
    });
  });

  it('volta para a página de origem depois de entrar', async () => {
    const user = userEvent.setup();
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    render(<SignInView googleEnabled={false} />);

    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-certa');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(mocks.replace).toHaveBeenCalledWith('/avaliar');
  });

  it('mostra o login com Google só quando ele está configurado', () => {
    const { rerender } = render(<SignInView googleEnabled={false} />);
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument();

    rerender(<SignInView googleEnabled />);
    expect(screen.getByRole('button', { name: /Continuar com Google/ })).toBeInTheDocument();
  });

  it('explica o erro quando o login com Google falha', () => {
    mocks.searchParams = new URLSearchParams('error=account_not_linked');
    render(<SignInView googleEnabled />);

    expect(screen.getByRole('alert')).toHaveTextContent(/criada com senha/);
  });
});
