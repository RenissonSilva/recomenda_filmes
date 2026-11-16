import { z } from 'zod';

import { authConfig } from '@/config/auth';

/** Validação dos formulários de autenticação (as mesmas regras são aplicadas pelo servidor). */

const { minLength, maxLength } = authConfig.password;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'))
  .transform((email) => email.toLowerCase());

const newPasswordSchema = z
  .string()
  .min(minLength, `A senha precisa ter pelo menos ${minLength} caracteres.`)
  .max(maxLength, `A senha pode ter no máximo ${maxLength} caracteres.`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(80, 'Use no máximo 80 caracteres.'),
  email: emailSchema,
  password: newPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Repita a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais.',
  });
