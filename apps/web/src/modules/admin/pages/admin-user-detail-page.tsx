import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import {
  changeAdminUserRole,
  extendAdminUserTrial,
  getAdminUser,
  grantAdminUserTrial,
  reactivateAdminUser,
  resendAdminUserInvitation,
  suspendAdminUser,
  updateAdminUserSubscription,
} from '../api';
import { AdminAuditLogList } from '../components/admin-audit-log-list';
import { AdminBadge } from '../components/admin-badge';
import { ConfirmActionModal } from '../components/confirm-action-modal';
import { ADMIN_PERMISSIONS, getAssignableAdminRoles, hasAdminPermission } from '../permissions';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getAccessStatusLabel,
  getAccessStatusTone,
  getAdminRoleLabel,
  getInvitationStatusLabel,
  getInvitationStatusTone,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  getSubscriptionStatusTone,
} from '../../../shared/ui/business-labels';
import {
  formatCount,
  formatDate,
  formatDateTime,
} from '../../../shared/ui/formatters';
import { getErrorMessage } from '../../../shared/ui/error-utils';

type ActionKind =
  | 'suspend'
  | 'reactivate'
  | 'grantTrial'
  | 'extendTrial'
  | 'subscription'
  | 'changeRole'
  | 'resendInvitation';

type ModalState = {
  kind: ActionKind;
  reason: string;
  durationDays: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  adminRole: string;
  invitationId?: string;
  invitationLabel?: string;
};

function getActionTitle(kind: ActionKind) {
  switch (kind) {
    case 'suspend':
      return 'Suspendre le compte';
    case 'reactivate':
      return 'Reactiver le compte';
    case 'grantTrial':
      return 'Accorder un essai';
    case 'extendTrial':
      return "Prolonger l'essai";
    case 'subscription':
      return "Modifier l'abonnement";
    case 'changeRole':
      return 'Changer le role admin';
    case 'resendInvitation':
      return "Renvoyer l'invitation";
    default:
      return 'Action admin';
  }
}

export function AdminUserDetailPage() {
  const { userId } = useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  const userQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUser(session, userId!),
  });

  const actionMutation = useMutation({
    mutationFn: async (currentAction: ModalState) => {
      if (!userId) {
        throw new Error('Action admin invalide');
      }

      switch (currentAction.kind) {
        case 'suspend':
          return suspendAdminUser(session, userId, { reason: currentAction.reason });
        case 'reactivate':
          return reactivateAdminUser(session, userId, {
            reason: currentAction.reason,
          });
        case 'grantTrial':
          return grantAdminUserTrial(session, userId, {
            reason: currentAction.reason,
            durationDays: Number(currentAction.durationDays),
          });
        case 'extendTrial':
          return extendAdminUserTrial(session, userId, {
            reason: currentAction.reason,
            durationDays: Number(currentAction.durationDays),
          });
        case 'subscription':
          return updateAdminUserSubscription(session, userId, {
            reason: currentAction.reason,
            subscriptionPlan: currentAction.subscriptionPlan,
            subscriptionStatus: currentAction.subscriptionStatus,
          });
        case 'changeRole':
          return changeAdminUserRole(session, userId, {
            reason: currentAction.reason,
            adminRole: currentAction.adminRole,
          });
        case 'resendInvitation':
          if (!currentAction.invitationId) {
            throw new Error('Invitation admin invalide');
          }

          return resendAdminUserInvitation(session, currentAction.invitationId, {
            reason: currentAction.reason,
          });
        default:
          throw new Error('Action admin non geree');
      }
    },
    onSuccess: async (_, variables) => {
      setFeedback({
        type: 'success',
        title:
          variables.kind === 'resendInvitation'
            ? 'Invitation renvoyee'
            : 'Action admin enregistree',
        message:
          variables.kind === 'resendInvitation'
            ? "Un nouveau lien d'acces a ete genere et journalise."
            : `L'action ${variables.kind} a ete appliquee avec audit.`,
      });
      setModal(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-user', userId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-admins'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Action admin refusee',
        message: getErrorMessage(error),
      });
    },
  });

  const user = userQuery.data;
  const trialPolicy = session?.admin?.trialPolicy;
  const baseAssignableRoles = getAssignableAdminRoles(session);
  const assignableRoles =
    user?.adminRole && user.adminRole !== 'USER'
      ? Array.from(new Set([...baseAssignableRoles, 'USER']))
      : baseAssignableRoles;

  if (userQuery.isLoading) {
    return <LoadingBlock label="Chargement du detail utilisateur..." />;
  }

  if (userQuery.isError) {
    return (
      <ErrorState
        error={userQuery.error}
        onRetry={() => {
          void userQuery.refetch();
        }}
        title="Impossible de charger ce compte"
      />
    );
  }

  if (!user) {
    return <ErrorState title="Compte introuvable" withPanel />;
  }

  function openAction(kind: ActionKind) {
    setModal({
      kind,
      reason: '',
      durationDays:
        kind === 'grantTrial'
          ? String(trialPolicy?.maxGrantDays ?? 14)
          : kind === 'extendTrial'
            ? String(trialPolicy?.maxExtensionDays ?? 7)
            : '',
      subscriptionPlan: user!.subscriptionPlan,
      subscriptionStatus:
        user!.subscriptionStatus === 'TRIAL'
          ? 'ACTIVE'
          : user!.subscriptionStatus,
      adminRole:
        user!.adminRole === 'USER'
          ? assignableRoles[0] ?? 'READONLY_ADMIN'
          : user!.adminRole,
      invitationId: undefined,
      invitationLabel: undefined,
    });
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
          <h1>{user.fullName}</h1>
          <div className="page-subtitle">
            {user.email} · cree le {formatDate(user.createdAt)} · derniere
            connexion {formatDateTime(user.lastLoginAt)}
          </div>
        </div>
        <Link className="button button--secondary" to="/admin/users">
          Retour a la liste
        </Link>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-card__label">Acces</div>
          <div className="kpi-card__value">
            <AdminBadge tone={getAccessStatusTone(user.accessStatus)}>
              {getAccessStatusLabel(user.accessStatus)}
            </AdminBadge>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Role admin</div>
          <div className="kpi-card__value">{getAdminRoleLabel(user.adminRole)}</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Abonnement</div>
          <div className="kpi-card__value">
            <AdminBadge tone={getSubscriptionStatusTone(user.subscriptionStatus)}>
              {getSubscriptionStatusLabel(user.subscriptionStatus)}
            </AdminBadge>
          </div>
          <div className="kpi-card__hint">
            Plan {getSubscriptionPlanLabel(user.subscriptionPlan)}
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Essai</div>
          <div className="kpi-card__value">{formatDate(user.trialEndsAt)}</div>
          <div className="kpi-card__hint">
            {formatCount(user.trialExtensionsCount)} prolongation(s)
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Portefeuille</div>
          <div className="kpi-card__value">
            {formatCount(user.totalProjectsCount)} projet(s)
          </div>
          <div className="kpi-card__hint">
            {formatCount(user.organizationsCount)} organisation(s)
          </div>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Actions d'exploitation</h2>
              <div className="section-subtitle">
                Toute action sensible demande un motif et produit un audit log.
              </div>
            </div>
          </div>

          <div className="inline-actions">
            {hasAdminPermission(session, ADMIN_PERMISSIONS.usersSuspend) &&
            !user.isSuspended ? (
              <button
                className="button button--danger"
                onClick={() => openAction('suspend')}
                type="button"
              >
                Suspendre
              </button>
            ) : null}

            {hasAdminPermission(session, ADMIN_PERMISSIONS.usersReactivate) &&
            user.isSuspended ? (
              <button className="button" onClick={() => openAction('reactivate')} type="button">
                Reactiver
              </button>
            ) : null}

            {hasAdminPermission(session, ADMIN_PERMISSIONS.trialGrant) ? (
              <button
                className="button button--secondary"
                onClick={() => openAction('grantTrial')}
                type="button"
              >
                Accorder un essai
              </button>
            ) : null}

            {hasAdminPermission(session, ADMIN_PERMISSIONS.trialExtend) ? (
              <button
                className="button button--secondary"
                onClick={() => openAction('extendTrial')}
                type="button"
              >
                Prolonger l&apos;essai
              </button>
            ) : null}

            {hasAdminPermission(session, ADMIN_PERMISSIONS.subscriptionOverride) ? (
              <button
                className="button button--secondary"
                onClick={() => openAction('subscription')}
                type="button"
              >
                Modifier l&apos;abonnement
              </button>
            ) : null}

            {hasAdminPermission(session, ADMIN_PERMISSIONS.adminRolesManage) &&
            assignableRoles.length > 0 ? (
              <button
                className="button button--secondary"
                onClick={() => openAction('changeRole')}
                type="button"
              >
                Changer le role admin
              </button>
            ) : null}
          </div>

          {trialPolicy ? (
            <div className="meta" style={{ marginTop: 16 }}>
              Politique courante: grant max {trialPolicy.maxGrantDays} jours, extension max{' '}
              {trialPolicy.maxExtensionDays} jours, nombre max de prolongations{' '}
              {trialPolicy.maxExtensionCount ?? 'illimite'}.
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Organisations rattachees</h2>
              <div className="section-subtitle">
                Contexte utile au support et a la lecture des projets.
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Role</th>
                  <th>Projets</th>
                </tr>
              </thead>
              <tbody>
                {user.memberships.map((membership) => (
                  <tr key={membership.id}>
                    <td>
                      <div className="stack stack--sm">
                        <strong>{membership.organization.name}</strong>
                        <div className="meta">{membership.organization.slug}</div>
                      </div>
                    </td>
                    <td>{membership.role}</td>
                    <td>{formatCount(membership.organization.projectsCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Invitations</h2>
            <div className="section-subtitle">
              Suivi des liens envoyes depuis le back-office pour activer ou
              re-activer un acces.
            </div>
          </div>
        </div>

        {user.invitations.length === 0 ? (
          <div className="meta">
            Aucune invitation recente pour ce compte.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Role</th>
                  <th>Statut</th>
                  <th>Envoi</th>
                  <th>Expiration</th>
                  <th>Activation</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {user.invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>
                      <div className="stack stack--sm">
                        <strong>{invitation.organization.name}</strong>
                        <div className="meta">{invitation.organization.slug}</div>
                      </div>
                    </td>
                    <td>{invitation.membershipRole}</td>
                    <td>
                      <AdminBadge tone={getInvitationStatusTone(invitation.status)}>
                        {getInvitationStatusLabel(invitation.status)}
                      </AdminBadge>
                    </td>
                    <td>{formatDateTime(invitation.createdAt)}</td>
                    <td>{formatDateTime(invitation.expiresAt)}</td>
                    <td>
                      {invitation.requiresPasswordSetup
                        ? 'Mot de passe a definir'
                        : 'Compte existant'}
                    </td>
                    <td>
                      {hasAdminPermission(session, ADMIN_PERMISSIONS.usersUpdate) &&
                      ['PENDING', 'EXPIRED'].includes(invitation.status) ? (
                        <button
                          className="button button--secondary button--small"
                          onClick={() =>
                            setModal({
                              kind: 'resendInvitation',
                              reason: '',
                              durationDays: '',
                              subscriptionPlan: user.subscriptionPlan,
                              subscriptionStatus: user.subscriptionStatus,
                              adminRole: user.adminRole,
                              invitationId: invitation.id,
                              invitationLabel: `${invitation.organization.name} · ${invitation.membershipRole}`,
                            })
                          }
                          type="button"
                        >
                          Renvoyer
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Historique admin recent</h2>
            <div className="section-subtitle">
              Vue recentree sur ce compte pour reconstruire les decisions
              d&apos;exploitation.
            </div>
          </div>
        </div>

        <AdminAuditLogList logs={user.recentAuditLogs} />
      </section>

      <ConfirmActionModal
        confirmLabel={getActionTitle(modal?.kind ?? 'suspend')}
        description="Confirmez l'action et renseignez un motif explicite. Ce motif sera journalise dans l'audit log admin."
        extraContent={
          modal?.kind === 'grantTrial' || modal?.kind === 'extendTrial' ? (
            <div className="field">
              <label htmlFor="admin-duration-days">Duree (jours)</label>
              <input
                id="admin-duration-days"
                min={1}
                onChange={(event) =>
                  setModal((current) =>
                    current
                      ? {
                          ...current,
                          durationDays: event.target.value,
                        }
                      : current,
                  )
                }
                type="number"
                value={modal?.durationDays ?? ''}
              />
            </div>
          ) : modal?.kind === 'subscription' ? (
            <div className="form-grid">
              <div className="field">
                <label htmlFor="admin-subscription-plan">Plan</label>
                <select
                  id="admin-subscription-plan"
                  onChange={(event) =>
                    setModal((current) =>
                      current
                        ? {
                            ...current,
                            subscriptionPlan: event.target.value,
                          }
                        : current,
                    )
                  }
                  value={modal.subscriptionPlan}
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="admin-subscription-status">Statut</label>
                <select
                  id="admin-subscription-status"
                  onChange={(event) =>
                    setModal((current) =>
                      current
                        ? {
                            ...current,
                            subscriptionStatus: event.target.value,
                          }
                        : current,
                    )
                  }
                  value={modal.subscriptionStatus}
                >
                  <option value="NONE">Aucun</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="PAST_DUE">Impay&eacute;</option>
                  <option value="CANCELED">Annule</option>
                </select>
              </div>
            </div>
          ) : modal?.kind === 'changeRole' ? (
            <div className="field">
              <label htmlFor="admin-role-target">Role admin</label>
              <select
                id="admin-role-target"
                onChange={(event) =>
                  setModal((current) =>
                    current
                      ? {
                          ...current,
                          adminRole: event.target.value,
                        }
                      : current,
                  )
                }
                value={modal.adminRole}
              >
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {getAdminRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
        isOpen={Boolean(modal)}
        isPending={actionMutation.isPending}
        onClose={() => setModal(null)}
        onConfirm={() => {
          void actionMutation.mutateAsync(modal!);
        }}
        onReasonChange={(value) =>
          setModal((current) =>
            current
              ? {
                  ...current,
                  reason: value,
                }
              : current,
          )
        }
        reason={modal?.reason ?? ''}
        title={
          modal?.kind === 'resendInvitation' && modal.invitationLabel
            ? `${getActionTitle(modal.kind)} · ${modal.invitationLabel}`
            : getActionTitle(modal?.kind ?? 'suspend')
        }
      />
    </div>
  );
}
