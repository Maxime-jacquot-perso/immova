import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLegalDocumentDefinition } from '../../../../../../packages/legal/src';
import { useAuth } from '../../auth/auth-context';
import { canAccessAdmin } from '../../admin/permissions';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { acceptCurrentLegalDocuments } from '../api';
import { LegalLinksInline } from '../legal-links';

function getRequiredDocuments(hasOrganizationContext: boolean) {
  return hasOrganizationContext
    ? (['CGU', 'CGV', 'PRIVACY_POLICY'] as const)
    : (['CGU', 'PRIVACY_POLICY'] as const);
}

export function LegalAcceptancePage() {
  const navigate = useNavigate();
  const { session, markAccountLegalAcceptanceCompleted, logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [localError, setLocalError] = useState('');

  const requiredDocuments = getRequiredDocuments(Boolean(session?.organization));

  const mutation = useMutation({
    mutationFn: () =>
      acceptCurrentLegalDocuments(session, {
        scope: 'ACCOUNT',
        accepted: true,
      }),
    onSuccess: () => {
      markAccountLegalAcceptanceCompleted();

      if (session?.organization) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (canAccessAdmin(session)) {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    },
  });

  if (!session) {
    return null;
  }

  return (
    <div className="auth-screen">
      <img src="/logo-text-bleu.svg" alt="Axelys" className="auth-screen__logo" />
      <div className="panel auth-card stack legal-acceptance">
        <div>
          <h1 style={{ margin: 0 }}>Validation des documents juridiques</h1>
          <p className="page-subtitle">
            Avant de continuer, vous devez confirmer la lecture des documents
            juridiques en vigueur pour votre compte.
          </p>
          {session.organization ? (
            <p className="meta">
              Organisation concernée : {session.organization.name}
            </p>
          ) : null}
        </div>

        <div className="legal-acceptance__documents">
          {requiredDocuments.map((documentType) => {
            const document = getLegalDocumentDefinition(documentType);

            return (
              <div className="legal-acceptance__document" key={documentType}>
                <strong>{document.title}</strong>
                <div className="meta">Version {document.version}</div>
              </div>
            );
          })}
        </div>

        <label className="checkbox-field legal-acceptance__checkbox">
          <input
            checked={accepted}
            onChange={(event) => {
              setAccepted(event.target.checked);
              if (event.target.checked) {
                setLocalError('');
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

        {localError ? <div className="field__error">{localError}</div> : null}

        {mutation.isError ? (
          <FeedbackMessage
            title="Validation impossible"
            message={getErrorMessage(mutation.error)}
            type="error"
          />
        ) : null}

        <div className="inline-actions">
          <button
            className="button"
            disabled={mutation.isPending}
            onClick={() => {
              if (!accepted) {
                setLocalError(
                  'Vous devez accepter les documents en vigueur pour continuer.',
                );
                return;
              }

              void mutation.mutateAsync();
            }}
            type="button"
          >
            {mutation.isPending ? 'Validation...' : 'Continuer'}
          </button>

          <button
            className="button button--secondary"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            type="button"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
