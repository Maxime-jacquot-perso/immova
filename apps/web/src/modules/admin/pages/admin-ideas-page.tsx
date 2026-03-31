import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { listAdminIdeas, updateAdminIdeaStatus } from '../api';
import { AdminBadge } from '../components/admin-badge';
import { ConfirmActionModal } from '../components/confirm-action-modal';
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../permissions';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getFeatureRequestStatusLabel,
  getFeatureRequestStatusTone,
} from '../../../shared/ui/business-labels';
import { formatDate } from '../../../shared/ui/formatters';
import { getErrorMessage } from '../../../shared/ui/error-utils';

type ModalState = {
  featureRequestId: string;
  featureRequestTitle: string;
  status: string;
  reason: string;
};

export function AdminIdeasPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState<'top' | 'recent'>('recent');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  const ideasQuery = useQuery({
    queryKey: ['admin-ideas', status, sort],
    queryFn: () =>
      listAdminIdeas(session, {
        status: status === 'ALL' ? undefined : status,
        sort,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (currentModal: ModalState) =>
      updateAdminIdeaStatus(session, currentModal.featureRequestId, {
        status: currentModal.status,
        reason: currentModal.reason,
      }),
    onSuccess: async () => {
      setFeedback({
        type: 'success',
        title: 'Statut idee mis a jour',
        message: "L'etat de l'idee a ete audite et enregistre.",
      });
      setModal(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-ideas'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Mise a jour impossible',
        message: getErrorMessage(error),
      });
    },
  });

  if (ideasQuery.isLoading) {
    return <LoadingBlock label="Chargement des idees admin..." />;
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        error={ideasQuery.error}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
        title="Impossible de charger les idees"
      />
    );
  }

  const ideas = ideasQuery.data ?? [];

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
          <h1>Idees produit</h1>
          <div className="page-subtitle">
            Vue transverse par organisation pour suivre les signaux terrain sans
            perdre le controle produit.
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="idea-toolbar">
          <div className="field">
            <label htmlFor="admin-ideas-sort">Tri</label>
            <select
              id="admin-ideas-sort"
              onChange={(event) =>
                setSort(event.target.value as 'top' | 'recent')
              }
              value={sort}
            >
              <option value="recent">Plus recentes</option>
              <option value="top">Plus votees</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="admin-ideas-status">Statut</label>
            <select
              id="admin-ideas-status"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="ALL">Tous</option>
              <option value="OPEN">Ouvertes</option>
              <option value="PLANNED">Planifiees</option>
              <option value="IN_PROGRESS">En test beta</option>
              <option value="DONE">Livrees</option>
              <option value="REJECTED">Non retenues</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        {ideas.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">Aucune idee visible</p>
            <div className="empty-state__description">
              Les suggestions remontees par les organisations apparaitront ici.
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Idee</th>
                  <th>Organisation</th>
                  <th>Auteur</th>
                  <th>Votes</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => (
                  <tr key={idea.id}>
                    <td>
                      <div className="stack stack--sm">
                        <strong>{idea.title}</strong>
                        <div className="meta">{idea.description}</div>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--sm">
                        <strong>{idea.organization.name}</strong>
                        <div className="meta">{idea.organization.slug}</div>
                      </div>
                    </td>
                    <td>{idea.author.name}</td>
                    <td>{idea.votesCount}</td>
                    <td>
                      <div className="inline-actions">
                        <AdminBadge tone={getFeatureRequestStatusTone(idea.status)}>
                          {getFeatureRequestStatusLabel(idea.status)}
                        </AdminBadge>
                        {idea.isBeta ? <AdminBadge tone="info">Beta</AdminBadge> : null}
                      </div>
                    </td>
                    <td>{formatDate(idea.createdAt)}</td>
                    <td>
                      {hasAdminPermission(session, ADMIN_PERMISSIONS.ideasUpdate) ? (
                        <button
                          className="button button--secondary button--small"
                          onClick={() =>
                            setModal({
                              featureRequestId: idea.id,
                              featureRequestTitle: idea.title,
                              status: idea.status,
                              reason: '',
                            })
                          }
                          type="button"
                        >
                          Changer le statut
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmActionModal
        confirmLabel="Enregistrer le statut"
        description="Le statut pilote la boucle idee -> beta -> release et reste une decision interne."
        extraContent={
          modal ? (
            <div className="field">
              <label htmlFor="admin-idea-status">Statut</label>
              <select
                id="admin-idea-status"
                onChange={(event) =>
                  setModal((current) =>
                    current
                      ? {
                          ...current,
                          status: event.target.value,
                        }
                      : current
                  )
                }
                value={modal.status}
              >
                <option value="OPEN">Ouverte</option>
                <option value="PLANNED">Planifiee</option>
                <option value="IN_PROGRESS">En test beta</option>
                <option value="DONE">Livree</option>
                <option value="REJECTED">Non retenue</option>
              </select>
            </div>
          ) : null
        }
        isOpen={Boolean(modal)}
        isPending={updateMutation.isPending}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (modal) {
            void updateMutation.mutateAsync(modal);
          }
        }}
        onReasonChange={(value) =>
          setModal((current) =>
            current
              ? {
                  ...current,
                  reason: value,
                }
              : current
          )
        }
        reason={modal?.reason ?? ''}
        title={
          modal
            ? `Changer le statut · ${modal.featureRequestTitle}`
            : 'Changer le statut'
        }
      />
    </div>
  );
}
