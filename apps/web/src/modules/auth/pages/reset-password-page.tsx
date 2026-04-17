import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { resetPassword, verifyPasswordResetToken } from '../api';
import { passwordWithConfirmationSchema } from '../password-schema';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { formatDateTime } from '../../../shared/ui/formatters';

type FormValues = z.infer<typeof passwordWithConfirmationSchema>;

function isResetTokenUnavailableMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('lien de réinitialisation') ||
    normalizedMessage.includes('lien de reinitialisation')
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string | null>(
    null,
  );
  const [resetSucceeded, setResetSucceeded] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(passwordWithConfirmationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const verificationQuery = useQuery({
    enabled: token.length > 0 && !tokenErrorMessage && !resetSucceeded,
    queryKey: ['password-reset-verify', token],
    queryFn: () => verifyPasswordResetToken(token),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      resetPassword({
        token,
        password,
      }),
    onSuccess: () => {
      setResetSucceeded(true);
    },
  });

  useEffect(() => {
    if (!resetSucceeded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/login?passwordReset=success', { replace: true });
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, resetSucceeded]);

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <h1 style={{ margin: 0 }}>Lien invalide</h1>
          <p className="page-subtitle">
            Le lien de réinitialisation est incomplet. Demandez un nouveau lien
            depuis la page de connexion.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="button" to="/forgot-password">
              Demander un nouveau lien
            </Link>
            <Link className="button button--secondary" to="/login">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (resetSucceeded) {
    return (
      <div className="auth-screen">
        <img src="/logo-text-bleu.svg" alt="Axelys" className="auth-screen__logo" />
        <div className="panel auth-card stack">
          <FeedbackMessage
            title="Mot de passe mis à jour"
            message="Votre mot de passe a bien été réinitialisé. Redirection vers la connexion..."
            type="success"
          />
          <Link className="button button--secondary" to="/login">
            Se connecter maintenant
          </Link>
        </div>
      </div>
    );
  }

  if (verificationQuery.isLoading) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <h1 style={{ margin: 0 }}>Vérification du lien</h1>
          <p className="page-subtitle">
            Nous vérifions la validité de votre lien sécurisé.
          </p>
        </div>
      </div>
    );
  }

  const unavailableMessage =
    tokenErrorMessage ||
    (verificationQuery.isError
      ? getErrorMessage(
          verificationQuery.error,
          "Ce lien de réinitialisation n'est plus exploitable.",
        )
      : null);

  if (unavailableMessage || !verificationQuery.data) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <FeedbackMessage
            title="Lien indisponible"
            message={unavailableMessage ?? "Ce lien n'est plus utilisable."}
            type="error"
          />
          <div>
            <h1 style={{ margin: 0 }}>Demander un nouveau lien</h1>
            <p className="page-subtitle">
              Ce lien a peut-être expiré ou déjà été utilisé.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="button" to="/forgot-password">
              Recevoir un nouveau lien
            </Link>
            <Link className="button button--secondary" to="/login">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <img src="/logo-text-bleu.svg" alt="Axelys" className="auth-screen__logo" />
      <div className="panel auth-card stack">
        <div>
          <h1 style={{ margin: 0 }}>Définir un nouveau mot de passe</h1>
          <p className="page-subtitle">
            Choisissez un nouveau mot de passe pour retrouver l’accès à votre
            compte.
          </p>
          <p className="meta">
            Lien valable jusqu&apos;au{' '}
            {formatDateTime(verificationQuery.data.expiresAt)}.
          </p>
        </div>

        <form
          className="stack"
          onSubmit={handleSubmit(async (values) => {
            try {
              await resetPasswordMutation.mutateAsync(values.password);
            } catch (error) {
              const message = getErrorMessage(error);

              if (isResetTokenUnavailableMessage(message)) {
                setTokenErrorMessage(message);
                return;
              }

              setError('root', {
                message,
              });
            }
          })}
        >
          <div className="field">
            <label htmlFor="reset-password">Nouveau mot de passe</label>
            <input id="reset-password" type="password" {...register('password')} />
            {errors.password ? (
              <div className="field__error">{errors.password.message}</div>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="reset-password-confirm">
              Confirmer le mot de passe
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <div className="field__error">
                {errors.confirmPassword.message}
              </div>
            ) : null}
          </div>

          {errors.root ? (
            <div className="field__error">{errors.root.message}</div>
          ) : null}

          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? 'Mise à jour...'
              : 'Mettre à jour mon mot de passe'}
          </button>
        </form>

        <Link className="button button--secondary" to="/login">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
