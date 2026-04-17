import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import {
  approvePilotApplication,
  getAdminPilotApplication,
  listAdminPilotApplications,
  rejectPilotApplication,
  resendPilotCheckoutLink,
  type AdminPilotApplicationDetail,
  type AdminPilotApplicationStatus,
} from '../api';
import { AdminBadge } from '../components/admin-badge';
import { AdminFiltersToolbar } from '../components/admin-filters-toolbar';
import { AdminPagination } from '../components/admin-pagination';
import { ConfirmActionModal } from '../components/confirm-action-modal';
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../permissions';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getInvitationStatusLabel,
  getInvitationStatusTone,
  getPilotApplicationEventLabel,
  getPilotApplicationStatusLabel,
  getPilotApplicationStatusTone,
  getPilotProvisioningStatusLabel,
  getPilotProvisioningStatusTone,
  getSubscriptionStatusLabel,
  getSubscriptionStatusTone,
} from '../../../shared/ui/business-labels';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { formatDateTime } from '../../../shared/ui/formatters';

export function AdminPilotApplicationsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasAdminPermission(
    session,
    ADMIN_PERMISSIONS.pilotApplicationsUpdate,
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | AdminPilotApplicationStatus>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);
  const [modalMode, setModalMode] = useState<'approve' | 'reject' | 'send' | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [sendCheckoutLink, setSendCheckoutLink] = useState(true);
  const [sendRejectionEmail, setSendRejectionEmail] = useState(true);

  const listQuery = useQuery({
    queryKey: ['admin-pilot-applications', page, search, status],
    queryFn: () =>
      listAdminPilotApplications(session, {
        page,
        pageSize: 12,
        search,
        status: status || undefined,
      }),
  });

  const selectedApplicationId = useMemo(() => {
    if (!listQuery.data) {
      return selectedId;
    }

    if (selectedId && listQuery.data.items.some((item) => item.id === selectedId)) {
      return selectedId;
    }

    return listQuery.data.items[0]?.id ?? null;
  }, [listQuery.data, selectedId]);

  const detailQuery = useQuery({
    enabled: Boolean(selectedApplicationId),
    queryKey: ['admin-pilot-application', selectedApplicationId],
    queryFn: () =>
      getAdminPilotApplication(session, selectedApplicationId as string),
  });

  const activeApplication = detailQuery.data;
  const approveMutation = useMutation({
    mutationFn: () =>
      approvePilotApplication(session, selectedApplicationId as string, {
        reason,
        note: note || undefined,
        organizationName: organizationName || undefined,
        sendCheckoutLink,
      }),
    onSuccess: async (response) => {
      closeModal();
      setFeedback({
        type: 'success',
        title: 'Candidature approuvee',
        message:
          response.delivery.mode === 'skipped'
            ? 'La candidature est approuvee. Le lien de souscription pourra etre envoye ensuite.'
            : 'Le parcours de souscription pilote est pret et le lien a ete envoye.',
      });
      await refreshPilotQueries(response.application.id);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Approbation impossible',
        message: getErrorMessage(error),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectPilotApplication(session, selectedApplicationId as string, {
        reason,
        note: note || undefined,
        sendRejectionEmail,
      }),
    onSuccess: async (response) => {
      closeModal();
      setFeedback({
        type: 'success',
        title: 'Candidature rejetee',
        message:
          response.delivery.mode === 'skipped'
            ? 'Le refus a ete enregistre sans email automatique.'
            : 'Le refus a ete enregistre et un email a ete envoye.',
      });
      await refreshPilotQueries(response.application.id);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Refus impossible',
        message: getErrorMessage(error),
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      resendPilotCheckoutLink(session, selectedApplicationId as string, {
        reason,
        note: note || undefined,
      }),
    onSuccess: async (response) => {
      closeModal();
      setFeedback({
        type: 'success',
        title: 'Lien renvoye',
        message:
          response.delivery.error ||
          'Le lien securise de souscription a ete renvoye au candidat.',
      });
      await refreshPilotQueries(response.application.id);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Renvoi impossible',
        message: getErrorMessage(error),
      });
    },
  });

  const actionPending =
    approveMutation.isPending || rejectMutation.isPending || resendMutation.isPending;

  const canApprove =
    canUpdate &&
    activeApplication &&
    ['PENDING', 'REJECTED', 'CANCELLED'].includes(activeApplication.status);
  const canReject =
    canUpdate &&
    activeApplication &&
    !['ACTIVE', 'REJECTED', 'CANCELLED'].includes(activeApplication.status);
  const canResend =
    canUpdate &&
    activeApplication &&
    ['APPROVED', 'PAYMENT_PENDING', 'EXPIRED'].includes(activeApplication.status);

  const modalTitle =
    modalMode === 'approve'
      ? 'Approuver la candidature'
      : modalMode === 'reject'
        ? 'Rejeter la candidature'
        : 'Renvoyer le lien de souscription';
  const modalDescription =
    modalMode === 'approve'
      ? 'La candidature sera approuvee, une organisation pourra etre preparee et le lien Stripe sera envoye si vous laissez l option active. Aucun acces produit ne sera ouvert avant webhook Stripe confirme.'
      : modalMode === 'reject'
        ? 'Le refus sera historise cote admin. Vous pouvez envoyer un email simple de refus si besoin.'
        : 'Un nouveau lien securise sera genere pour relancer le parcours Stripe Checkout.';

  const modalExtraContent = useMemo(() => {
    if (modalMode === 'approve') {
      return (
        <>
          <div className="field">
            <label htmlFor="pilot-organization-name">Nom d&apos;organisation</label>
            <input
              id="pilot-organization-name"
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Portefeuille de ..."
              value={organizationName}
            />
            <div className="field__hint">
              Si vide, un nom sera genere a partir du candidat.
            </div>
          </div>
          <div className="field">
            <label htmlFor="pilot-internal-note">Note interne</label>
            <textarea
              id="pilot-internal-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Contexte commercial, priorite, points de vigilance..."
              value={note}
            />
          </div>
          <label className="checkbox-field" htmlFor="pilot-send-checkout-link">
            <input
              checked={sendCheckoutLink}
              id="pilot-send-checkout-link"
              onChange={(event) => setSendCheckoutLink(event.target.checked)}
              type="checkbox"
            />
            Envoyer tout de suite le lien de souscription Stripe
          </label>
        </>
      );
    }

    if (modalMode === 'reject') {
      return (
        <>
          <div className="field">
            <label htmlFor="pilot-reject-note">Note interne</label>
            <textarea
              id="pilot-reject-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Pourquoi cette candidature est refusee..."
              value={note}
            />
          </div>
          <label className="checkbox-field" htmlFor="pilot-send-rejection-email">
            <input
              checked={sendRejectionEmail}
              id="pilot-send-rejection-email"
              onChange={(event) => setSendRejectionEmail(event.target.checked)}
              type="checkbox"
            />
            Envoyer un email de refus au candidat
          </label>
        </>
      );
    }

    return (
      <div className="field">
        <label htmlFor="pilot-send-note">Note interne</label>
        <textarea
          id="pilot-send-note"
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contexte du renvoi ou relance manuelle..."
          value={note}
        />
      </div>
    );
  }, [modalMode, note, organizationName, sendCheckoutLink, sendRejectionEmail]);

  function openModal(mode: 'approve' | 'reject' | 'send') {
    setModalMode(mode);
    setReason('');
    setSendCheckoutLink(true);
    setSendRejectionEmail(true);
    setNote(activeApplication?.internalNote || '');
    setOrganizationName(activeApplication?.organizationName || '');
  }

  function closeModal() {
    setModalMode(null);
    setReason('');
    setNote('');
    setOrganizationName('');
    setSendCheckoutLink(true);
    setSendRejectionEmail(true);
  }

  async function refreshPilotQueries(applicationId: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-pilot-applications'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-pilot-application'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
    ]);
    setSelectedId(applicationId);
  }

  function handleConfirm() {
    if (reason.trim().length < 5) {
      setFeedback({
        type: 'error',
        title: 'Motif requis',
        message: 'Merci de renseigner un motif d au moins 5 caracteres.',
      });
      return;
    }

    if (modalMode === 'approve') {
      approveMutation.mutate();
      return;
    }

    if (modalMode === 'reject') {
      rejectMutation.mutate();
      return;
    }

    resendMutation.mutate();
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setFeedback({
        type: 'info',
        title: 'Email copie',
        message: `${email} a ete copie dans le presse-papiers.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Copie impossible',
        message: 'Le navigateur n a pas autorise la copie automatique.',
      });
    }
  }

  if (listQuery.isLoading) {
    return <LoadingBlock label="Chargement des candidatures pilotes..." />;
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        error={listQuery.error}
        onRetry={() => {
          void listQuery.refetch();
        }}
        title="Impossible de charger les candidatures pilotes"
      />
    );
  }

  const response = listQuery.data;
  if (!response) {
    return <ErrorState title="Liste pilotes indisponible" withPanel />;
  }

  return (
    <div className="stack">
      {feedback ? (
        <FeedbackMessage
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <header className="page-header">
        <div>
          <h1>Candidatures pilotes</h1>
          <div className="page-subtitle">
            Validation admin, relance Stripe et suivi du provisioning sans
            intervention technique manuelle.
          </div>
        </div>
      </header>

      <AdminFiltersToolbar>
        <div className="field">
          <label htmlFor="pilot-search">Recherche</label>
          <input
            id="pilot-search"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Email, nom, profil"
            value={search}
          />
        </div>
        <div className="field">
          <label htmlFor="pilot-status">Statut</label>
          <select
            id="pilot-status"
            onChange={(event) => {
              setPage(1);
              setStatus(
                (event.target.value as '' | AdminPilotApplicationStatus) || '',
              );
            }}
            value={status}
          >
            <option value="">Tous</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAYMENT_PENDING">Payment pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="row-actions admin-filters__actions">
          <button
            className="button button--secondary"
            onClick={() => {
              setPage(1);
              setSearch('');
              setStatus('');
            }}
            type="button"
          >
            Reinitialiser
          </button>
        </div>
      </AdminFiltersToolbar>

      <div className="pilot-admin-layout">
        <section className="panel stack">
          <div className="panel-header">
            <div>
              <h2 style={{ margin: 0 }}>Liste</h2>
              <div className="page-subtitle">{response.total} candidature(s)</div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Email</th>
                  <th>Profil</th>
                  <th>Projets</th>
                  <th>Probleme</th>
                  <th>Creee le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {response.items.map((item) => (
                  <tr
                    className={
                      item.id === selectedApplicationId
                        ? 'pilot-admin-table__row--selected'
                        : undefined
                    }
                    key={item.id}
                  >
                    <td>
                      <button
                        className="button button--ghost"
                        onClick={() => setSelectedId(item.id)}
                        type="button"
                      >
                        {item.fullName}
                      </button>
                    </td>
                    <td>{item.email}</td>
                    <td>{item.profileType}</td>
                    <td>{item.projectCount}</td>
                    <td>{item.problemDescription}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <div className="stack stack--sm">
                        <AdminBadge tone={getPilotApplicationStatusTone(item.status)}>
                          {getPilotApplicationStatusLabel(item.status)}
                        </AdminBadge>
                        <AdminBadge
                          tone={getPilotProvisioningStatusTone(item.provisioningStatus)}
                        >
                          {getPilotProvisioningStatusLabel(item.provisioningStatus)}
                        </AdminBadge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            onPageChange={setPage}
            page={response.page}
            totalPages={response.totalPages}
          />
        </section>

        <section className="panel stack">
          {selectedApplicationId && detailQuery.isLoading ? (
            <LoadingBlock label="Chargement du detail candidature..." />
          ) : detailQuery.isError ? (
            <ErrorState
              error={detailQuery.error}
              onRetry={() => {
                void detailQuery.refetch();
              }}
              title="Impossible de charger le detail"
              withPanel={false}
            />
          ) : !activeApplication ? (
            <div className="empty-state">
              <p className="empty-state__title">Selectionnez une candidature</p>
              <div className="empty-state__description">
                Les informations detaillees et les actions admin apparaitront ici.
              </div>
            </div>
          ) : (
            <PilotApplicationDetailPanel
              application={activeApplication}
              canApprove={Boolean(canApprove)}
              canReject={Boolean(canReject)}
              canResend={Boolean(canResend)}
              onApprove={() => openModal('approve')}
              onReject={() => openModal('reject')}
              onResend={() => openModal('send')}
              onCopyEmail={copyEmail}
            />
          )}
        </section>
      </div>

      <ConfirmActionModal
        cancelLabel="Annuler"
        confirmLabel={
          modalMode === 'approve'
            ? 'Approuver'
            : modalMode === 'reject'
              ? 'Rejeter'
              : 'Renvoyer le lien'
        }
        description={modalDescription}
        extraContent={modalExtraContent}
        isOpen={modalMode !== null}
        isPending={actionPending}
        onClose={closeModal}
        onConfirm={handleConfirm}
        onReasonChange={setReason}
        reason={reason}
        title={modalTitle}
      />
    </div>
  );
}

type PilotApplicationDetailPanelProps = {
  application: AdminPilotApplicationDetail;
  canApprove: boolean;
  canReject: boolean;
  canResend: boolean;
  onApprove: () => void;
  onReject: () => void;
  onResend: () => void;
  onCopyEmail: (email: string) => void;
};

function PilotApplicationDetailPanel({
  application,
  canApprove,
  canReject,
  canResend,
  onApprove,
  onReject,
  onResend,
  onCopyEmail,
}: PilotApplicationDetailPanelProps) {
  return (
    <div className="stack pilot-admin-detail">
      <div className="panel-header">
        <div>
          <h2 style={{ margin: 0 }}>{application.fullName}</h2>
          <div className="page-subtitle">{application.email}</div>
        </div>
        <div className="row-actions">
          <button
            className="button button--secondary"
            onClick={() => onCopyEmail(application.email)}
            type="button"
          >
            Copier l&apos;email
          </button>
          {canResend ? (
            <button
              className="button button--secondary"
              onClick={onResend}
              type="button"
            >
              Renvoyer le lien
            </button>
          ) : null}
          {canReject ? (
            <button
              className="button button--secondary"
              onClick={onReject}
              type="button"
            >
              Rejeter
            </button>
          ) : null}
          {canApprove ? (
            <button className="button" onClick={onApprove} type="button">
              Approuver
            </button>
          ) : null}
        </div>
      </div>

      <div className="pilot-admin-meta-grid">
        <div>
          <strong>Statut</strong>
          <div style={{ marginTop: 6 }}>
            <AdminBadge tone={getPilotApplicationStatusTone(application.status)}>
              {getPilotApplicationStatusLabel(application.status)}
            </AdminBadge>
          </div>
        </div>
        <div>
          <strong>Provisioning</strong>
          <div style={{ marginTop: 6 }}>
            <AdminBadge
              tone={getPilotProvisioningStatusTone(application.provisioningStatus)}
            >
              {getPilotProvisioningStatusLabel(application.provisioningStatus)}
            </AdminBadge>
          </div>
        </div>
        <div>
          <strong>Profil</strong>
          <div className="meta">{application.profileType}</div>
        </div>
        <div>
          <strong>Projets</strong>
          <div className="meta">{application.projectCount}</div>
        </div>
        <div>
          <strong>Creee le</strong>
          <div className="meta">{formatDateTime(application.createdAt)}</div>
        </div>
        <div>
          <strong>Reviewee le</strong>
          <div className="meta">{formatDateTime(application.reviewedAt)}</div>
        </div>
      </div>

      <section className="pilot-admin-detail__section">
        <strong>Probleme remonte</strong>
        <div className="meta" style={{ marginTop: 8 }}>
          {application.problemDescription}
        </div>
      </section>

      <section className="pilot-admin-detail__section">
        <strong>Onboarding & provisioning</strong>
        <div className="pilot-admin-meta-grid" style={{ marginTop: 12 }}>
          <div>
            <span className="meta">Organisation</span>
            <div>
              {application.organization?.name ||
                application.organizationName ||
                'Non creee'}
            </div>
          </div>
          <div>
            <span className="meta">Abonnement</span>
            <div>
              {application.organization ? (
                <AdminBadge
                  tone={getSubscriptionStatusTone(
                    application.organization.billingStatus,
                  )}
                >
                  {getSubscriptionStatusLabel(application.organization.billingStatus)}
                </AdminBadge>
              ) : (
                'Non demarre'
              )}
            </div>
          </div>
          <div>
            <span className="meta">Invitation</span>
            <div>
              {application.invitation ? (
                <AdminBadge tone={getInvitationStatusTone(application.invitation.status)}>
                  {getInvitationStatusLabel(application.invitation.status)}
                </AdminBadge>
              ) : (
                'Aucune'
              )}
            </div>
          </div>
          <div>
            <span className="meta">Utilisateur</span>
            <div>{application.user?.email || 'Non cree'}</div>
          </div>
          <div>
            <span className="meta">Lien envoye le</span>
            <div>{formatDateTime(application.checkoutLinkSentAt)}</div>
          </div>
          <div>
            <span className="meta">Activation</span>
            <div>{formatDateTime(application.activatedAt)}</div>
          </div>
        </div>
        {application.provisioningErrorMessage ? (
          <div className="info-note" style={{ marginTop: 12 }}>
            <strong>Erreur de provisioning</strong>
            <div className="meta" style={{ marginTop: 6 }}>
              {application.provisioningErrorMessage}
            </div>
          </div>
        ) : null}
      </section>

      <section className="pilot-admin-detail__section">
        <strong>Stripe</strong>
        <div className="pilot-admin-meta-grid" style={{ marginTop: 12 }}>
          <div>
            <span className="meta">Customer</span>
            <div>
              {application.stripe.customerId ||
                application.organization?.stripeCustomerId ||
                '—'}
            </div>
          </div>
          <div>
            <span className="meta">Checkout session</span>
            <div>{application.stripe.checkoutSessionId || '—'}</div>
          </div>
          <div>
            <span className="meta">Subscription</span>
            <div>
              {application.stripe.subscriptionId ||
                application.organization?.stripeSubscriptionId ||
                '—'}
            </div>
          </div>
          <div>
            <span className="meta">Price</span>
            <div>{application.stripe.priceId || '—'}</div>
          </div>
        </div>
      </section>

      <section className="pilot-admin-detail__section">
        <strong>Historique</strong>
        <div className="pilot-admin-event-list" style={{ marginTop: 12 }}>
          {application.events.length === 0 ? (
            <div className="meta">Aucun evenement.</div>
          ) : (
            application.events.map((event) => (
              <article className="pilot-admin-event" key={event.id}>
                <div
                  className="row-actions"
                  style={{ justifyContent: 'space-between' }}
                >
                  <AdminBadge tone="neutral">
                    {getPilotApplicationEventLabel(event.type)}
                  </AdminBadge>
                  <div className="meta">{formatDateTime(event.createdAt)}</div>
                </div>
                <div>{event.message || 'Evenement systeme'}</div>
                {event.actor ? (
                  <div className="meta">
                    {event.actor.firstName || event.actor.lastName
                      ? [event.actor.firstName, event.actor.lastName]
                          .filter(Boolean)
                          .join(' ')
                      : event.actor.email}
                  </div>
                ) : null}
                {event.metadata ? (
                  <pre className="pilot-admin-event__metadata">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
