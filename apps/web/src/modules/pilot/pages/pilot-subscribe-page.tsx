import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AdminBadge } from '../../admin/components/admin-badge';
import { createPilotCheckoutSession, getPilotCheckoutContext } from '../api';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getPilotApplicationStatusLabel,
  getPilotApplicationStatusTone,
} from '../../../shared/ui/business-labels';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { formatDateTime } from '../../../shared/ui/formatters';

export function PilotSubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const contextQuery = useQuery({
    enabled: token.length > 0,
    queryKey: ['pilot-checkout-context', token],
    queryFn: () => getPilotCheckoutContext(token),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => createPilotCheckoutSession(token),
    onSuccess: (response) => {
      window.location.assign(response.url);
    },
  });

  if (!token) {
    return (
      <div className="pilot-public-screen">
        <section className="panel pilot-public-card stack">
          <h1>Lien de souscription incomplet</h1>
          <div className="page-subtitle">
            Le token de souscription est manquant. Reouvrez l&apos;email Axelys
            ou demandez un nouveau lien depuis l&apos;admin.
          </div>
        </section>
      </div>
    );
  }

  if (contextQuery.isLoading) {
    return <LoadingBlock label="Preparation de votre parcours pilote..." />;
  }

  if (contextQuery.isError) {
    return (
      <div className="pilot-public-screen">
        <section className="pilot-public-card panel">
          <ErrorState
            error={contextQuery.error}
            onRetry={() => {
              void contextQuery.refetch();
            }}
            title="Impossible de charger ce lien de souscription"
            withPanel={false}
          />
        </section>
      </div>
    );
  }

  const context = contextQuery.data;

  if (!context) {
    return (
      <div className="pilot-public-screen">
        <section className="pilot-public-card panel">
          <ErrorState
            title="Contexte de souscription indisponible"
            withPanel={false}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="pilot-public-screen">
      <section className="panel pilot-public-card stack">
        <div className="stack stack--sm">
          <div className="meta">Programme pilote Axelys</div>
          <h1 style={{ margin: 0 }}>Finaliser votre abonnement</h1>
          <div className="page-subtitle">
            Le paiement passe par Stripe Checkout. Votre acces produit ne sera
            active qu&apos;apres confirmation Stripe via webhook, jamais sur la
            simple redirection de retour.
          </div>
        </div>

        {checkoutMutation.isError ? (
          <FeedbackMessage
            title="Redirection Stripe impossible"
            message={getErrorMessage(checkoutMutation.error)}
            onDismiss={() => checkoutMutation.reset()}
            type="error"
          />
        ) : null}

        <div className="pilot-public-card__meta-grid">
          <div>
            <strong>Candidat</strong>
            <div className="meta">
              {[context.firstName, context.lastName].filter(Boolean).join(' ') ||
                context.email}
            </div>
          </div>
          <div>
            <strong>Email</strong>
            <div className="meta">{context.email}</div>
          </div>
          <div>
            <strong>Organisation preparee</strong>
            <div className="meta">
              {context.organizationName || 'En preparation'}
            </div>
          </div>
          <div>
            <strong>Statut</strong>
            <div style={{ marginTop: 6 }}>
              <AdminBadge tone={getPilotApplicationStatusTone(context.status)}>
                {getPilotApplicationStatusLabel(context.status)}
              </AdminBadge>
            </div>
          </div>
          <div>
            <strong>Lien valable jusqu&apos;au</strong>
            <div className="meta">
              {formatDateTime(context.checkoutTokenExpiresAt || null)}
            </div>
          </div>
        </div>

        <div className="info-note">
          <strong>Etat du workflow</strong>
          <div className="meta" style={{ marginTop: 6 }}>
            {context.message}
          </div>
        </div>

        <div className="pilot-public-card__actions">
          <button
            className="button"
            disabled={!context.canStartCheckout || checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate()}
            type="button"
          >
            {checkoutMutation.isPending
              ? 'Redirection...'
              : 'Demarrer Stripe Checkout'}
          </button>
        </div>
      </section>
    </div>
  );
}
