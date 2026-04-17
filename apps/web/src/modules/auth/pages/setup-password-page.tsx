import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { LegalLinksInline } from '../../legal/legal-links';
import { acceptInvitation, verifyInvitationToken } from '../api';
import { passwordWithConfirmationSchema } from '../password-schema';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { formatDateTime } from '../../../shared/ui/formatters';
import { getErrorMessage } from '../../../shared/ui/error-utils';

type FormValues = z.infer<typeof passwordWithConfirmationSchema>;

export function SetupPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [acceptedLegalDocuments, setAcceptedLegalDocuments] = useState(false);
  const [legalError, setLegalError] = useState('');
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

  const invitationQuery = useQuery({
    enabled: token.length > 0,
    queryKey: ['invitation-verify', token],
    queryFn: () => verifyInvitationToken(token),
  });

  const acceptMutation = useMutation({
    mutationFn: (payload: { password?: string }) =>
      acceptInvitation({
        token,
        acceptLegalDocuments: true,
        ...payload,
      }),
    onSuccess: (response) => {
      const loginParams = new URLSearchParams({
        invitation: 'accepted',
        email: response.email,
        organizationSlug: response.organization.slug,
      });

      navigate(`/login?${loginParams.toString()}`, { replace: true });
    },
  });

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <h1 style={{ margin: 0 }}>Lien invalide</h1>
          <p className="page-subtitle">
            Le lien d&apos;invitation est incomplet. Demandez a un administrateur
            de renvoyer votre acces.
          </p>
        </div>
      </div>
    );
  }

  if (invitationQuery.isLoading) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <h1 style={{ margin: 0 }}>Verification de l&apos;invitation</h1>
          <p className="page-subtitle">
            Nous verifions la validite de votre lien securise.
          </p>
        </div>
      </div>
    );
  }

  if (invitationQuery.isError || !invitationQuery.data) {
    return (
      <div className="auth-screen">
        <div className="panel auth-card stack">
          <FeedbackMessage
            title="Invitation indisponible"
            message={getErrorMessage(
              invitationQuery.error,
              "Ce lien d'invitation n'est plus exploitable.",
            )}
            type="error"
          />
          <div>
            <h1 style={{ margin: 0 }}>Invitation invalide</h1>
            <p className="page-subtitle">
              Demandez a un administrateur de generer un nouveau lien.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const invitation = invitationQuery.data;
  const canSubmitWithoutPassword = !invitation.requiresPasswordSetup;
  const requiredDocuments = ['CGU', 'CGV', 'PRIVACY_POLICY'] as const;

  return (
    <div className="auth-screen">
      <div className="panel auth-card stack">
        <div>
          <h1 style={{ margin: 0 }}>
            {invitation.requiresPasswordSetup
              ? 'Definir votre mot de passe'
              : 'Finaliser votre acces'}
          </h1>
          <p className="page-subtitle">
            {invitation.email} · {invitation.organization.name} · role{' '}
            {invitation.membershipRole}
          </p>
          <p className="meta">
            Lien valable jusqu&apos;au {formatDateTime(invitation.expiresAt)}.
          </p>
        </div>

        {canSubmitWithoutPassword ? (
          <>
            <p className="page-subtitle" style={{ marginTop: 0 }}>
              Votre compte existe deja. Confirmez simplement cet acces pour vous
              connecter ensuite avec votre mot de passe habituel.
            </p>
            <label className="checkbox-field legal-acceptance__checkbox">
              <input
                checked={acceptedLegalDocuments}
                onChange={(event) => {
                  setAcceptedLegalDocuments(event.target.checked);
                  if (event.target.checked) {
                    setLegalError('');
                  }
                }}
                type="checkbox"
              />
              <span>
                Je reconnais avoir lu et j’accepte les{' '}
                <LegalLinksInline
                  className="legal-links"
                  documents={requiredDocuments}
                  linkClassName="legal-links__anchor"
                />
                .
              </span>
            </label>
            {legalError ? <div className="field__error">{legalError}</div> : null}
            {acceptMutation.isError ? (
              <FeedbackMessage
                title="Activation impossible"
                message={getErrorMessage(acceptMutation.error)}
                type="error"
              />
            ) : null}
            <button
              className="button"
              disabled={acceptMutation.isPending}
              onClick={() => {
                if (!acceptedLegalDocuments) {
                  setLegalError(
                    'Vous devez accepter les documents juridiques en vigueur pour finaliser votre accès.',
                  );
                  return;
                }

                void acceptMutation.mutateAsync({});
              }}
              type="button"
            >
              {acceptMutation.isPending
                ? 'Activation...'
                : 'Finaliser mon acces'}
            </button>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={handleSubmit(async (values) => {
              try {
                if (!acceptedLegalDocuments) {
                  setLegalError(
                    'Vous devez accepter les documents juridiques en vigueur pour finaliser votre accès.',
                  );
                  return;
                }

                await acceptMutation.mutateAsync({ password: values.password });
              } catch (error) {
                setError('root', {
                  message: getErrorMessage(error),
                });
              }
            })}
          >
            <div className="field">
              <label htmlFor="setup-password">Mot de passe</label>
              <input
                id="setup-password"
                type="password"
                {...register('password')}
              />
              {errors.password ? (
                <div className="field__error">{errors.password.message}</div>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="setup-password-confirm">
                Confirmer le mot de passe
              </label>
              <input
                id="setup-password-confirm"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <div className="field__error">
                  {errors.confirmPassword.message}
                </div>
              ) : null}
            </div>

            <label className="checkbox-field legal-acceptance__checkbox">
              <input
                checked={acceptedLegalDocuments}
                onChange={(event) => {
                  setAcceptedLegalDocuments(event.target.checked);
                  if (event.target.checked) {
                    setLegalError('');
                  }
                }}
                type="checkbox"
              />
              <span>
                Je reconnais avoir lu et j’accepte les{' '}
                <LegalLinksInline
                  className="legal-links"
                  documents={requiredDocuments}
                  linkClassName="legal-links__anchor"
                />
                .
              </span>
            </label>

            {legalError ? <div className="field__error">{legalError}</div> : null}

            {errors.root ? (
              <div className="field__error">{errors.root.message}</div>
            ) : null}

            <button
              className="button"
              disabled={isSubmitting || acceptMutation.isPending}
              type="submit"
            >
              {isSubmitting || acceptMutation.isPending
                ? 'Activation...'
                : 'Activer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
