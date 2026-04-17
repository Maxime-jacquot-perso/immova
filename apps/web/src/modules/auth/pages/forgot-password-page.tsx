import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { requestPasswordReset } from '../api';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';

const schema = z.object({
  email: z.string().email('Saisissez un email valide.'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
    },
  });

  const hasSubmitted = submittedEmail.length > 0;

  return (
    <div className="auth-screen">
      <img src="/logo-text-bleu.svg" alt="Axelys" className="auth-screen__logo" />
      <div className="panel auth-card stack">
        {hasSubmitted ? (
          <>
            <FeedbackMessage
              title="Vérifiez votre messagerie"
              message="Si un compte existe pour cet email, vous allez recevoir un lien de réinitialisation."
              type="info"
            />

            <div>
              <h1 style={{ margin: 0 }}>Demande envoyée</h1>
              <p className="page-subtitle">
                Consultez votre boîte de réception et vos spams pour poursuivre
                la réinitialisation.
              </p>
              <p className="meta">Adresse saisie : {submittedEmail}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="button"
                onClick={() => setSubmittedEmail('')}
                type="button"
              >
                Utiliser une autre adresse
              </button>
              <Link className="button button--secondary" to="/login">
                Retour à la connexion
              </Link>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 style={{ margin: 0 }}>Mot de passe oublié ?</h1>
              <p className="page-subtitle">
                Saisissez votre email pour recevoir un lien de réinitialisation
                sécurisé.
              </p>
            </div>

            <form
              className="stack"
              onSubmit={handleSubmit(async (values) => {
                try {
                  await forgotPasswordMutation.mutateAsync(values);
                } catch (error) {
                  setError('root', {
                    message: getErrorMessage(
                      error,
                      "L'envoi du lien de réinitialisation est impossible pour le moment.",
                    ),
                  });
                }
              })}
            >
              <div className="field">
                <label htmlFor="forgot-password-email">Email</label>
                <input
                  id="forgot-password-email"
                  type="email"
                  {...register('email')}
                />
                {errors.email ? (
                  <div className="field__error">{errors.email.message}</div>
                ) : null}
              </div>

              {errors.root ? (
                <div className="field__error">{errors.root.message}</div>
              ) : null}

              <button className="button" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Envoi...' : 'Recevoir un lien'}
              </button>
            </form>

            <Link className="button button--secondary" to="/login">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
