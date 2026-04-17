import { z } from 'zod';

export const passwordFieldSchema = z
  .string()
  .min(6, 'Le mot de passe doit contenir au moins 6 caractères.');

export const passwordWithConfirmationSchema = z
  .object({
    password: passwordFieldSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe doivent correspondre.',
  });
