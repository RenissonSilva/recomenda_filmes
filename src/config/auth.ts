/** Regras de autenticação compartilhadas entre o servidor (Better Auth) e os formulários. */
export const authConfig = {
  password: {
    minLength: 8,
    maxLength: 128,
  },
  /** Validade do link de recuperação de senha. */
  passwordResetExpiresInMinutes: 60,
  /** Duração da sessão; ela é renovada automaticamente enquanto o usuário usa o app. */
  sessionExpiresInDays: 30,
} as const;
