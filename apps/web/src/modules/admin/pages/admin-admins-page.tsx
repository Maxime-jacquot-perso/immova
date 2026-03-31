import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { changeAdminRole, createAdmin, listAdmins } from '../api';
import { AdminBadge } from '../components/admin-badge';
import { AdminFiltersToolbar } from '../components/admin-filters-toolbar';
import { AdminPagination } from '../components/admin-pagination';
import { ConfirmActionModal } from '../components/confirm-action-modal';
import { getAssignableAdminRoles, hasAdminPermission, ADMIN_PERMISSIONS } from '../permissions';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { getAdminRoleLabel } from '../../../shared/ui/business-labels';
import { formatDateTime } from '../../../shared/ui/formatters';
import { getErrorMessage } from '../../../shared/ui/error-utils';

type RoleModalState = {
  userId: string;
  email: string;
  adminRole: string;
  reason: string;
};

export function AdminAdminsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const assignableRoles = useMemo(
    () => getAssignableAdminRoles(session),
    [session],
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [roleModal, setRoleModal] = useState<RoleModalState | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    adminRole: assignableRoles[0] ?? 'READONLY_ADMIN',
    reason: '',
  });
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  const adminsQuery = useQuery({
    queryKey: ['admin-admins', page, search, adminRole],
    queryFn: () =>
      listAdmins(session, {
        page,
        pageSize: 10,
        search,
        adminRole: adminRole || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () => createAdmin(session, createForm),
    onSuccess: async () => {
      setFeedback({
        type: 'success',
        title: 'Admin cree',
        message:
          "Le compte admin a ete cree et journalise dans l'audit log.",
      });
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        adminRole: assignableRoles[0] ?? 'READONLY_ADMIN',
        reason: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-admins'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Creation admin impossible",
        message: getErrorMessage(error),
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: (payload: RoleModalState) =>
      changeAdminRole(session, payload.userId, {
        adminRole: payload.adminRole,
        reason: payload.reason,
      }),
    onSuccess: async () => {
      setFeedback({
        type: 'success',
        title: 'Role admin mis a jour',
      });
      setRoleModal(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-admins'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Role admin refuse',
        message: getErrorMessage(error),
      });
    },
  });

  if (adminsQuery.isLoading) {
    return <LoadingBlock label="Chargement des administrateurs..." />;
  }

  if (adminsQuery.isError) {
    return (
      <ErrorState
        error={adminsQuery.error}
        onRetry={() => {
          void adminsQuery.refetch();
        }}
        title="Impossible de charger les administrateurs"
      />
    );
  }

  const response = adminsQuery.data;
  if (!response) {
    return <ErrorState title="Liste admins indisponible" withPanel />;
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
          <h1>Administrateurs</h1>
          <div className="page-subtitle">
            Gestion des comptes internes avec creation, attribution de role et
            garde-fous d&apos;elevation.
          </div>
        </div>
      </header>

      <div className="grid grid--2">
        <AdminFiltersToolbar>
          <div className="field">
            <label htmlFor="admins-search">Recherche</label>
            <input
              id="admins-search"
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Email ou nom"
              value={search}
            />
          </div>
          <div className="field">
            <label htmlFor="admins-role-filter">Role</label>
            <select
              id="admins-role-filter"
              onChange={(event) => {
                setPage(1);
                setAdminRole(event.target.value);
              }}
              value={adminRole}
            >
              <option value="">Tous</option>
              <option value="READONLY_ADMIN">Admin lecture</option>
              <option value="SALES_ADMIN">Admin sales</option>
              <option value="SUPPORT_ADMIN">Admin support</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </select>
          </div>
        </AdminFiltersToolbar>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Creer un admin</h2>
              <div className="section-subtitle">
                Ce flux cree un nouveau compte interne. Pour promouvoir un
                utilisateur existant, passez par sa fiche utilisateur.
              </div>
            </div>
          </div>

          {hasAdminPermission(session, ADMIN_PERMISSIONS.adminsCreate) &&
          hasAdminPermission(session, ADMIN_PERMISSIONS.adminRolesManage) ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                void createMutation.mutateAsync();
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="create-admin-first-name">Prenom</label>
                  <input
                    id="create-admin-first-name"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    value={createForm.firstName}
                  />
                </div>
                <div className="field">
                  <label htmlFor="create-admin-last-name">Nom</label>
                  <input
                    id="create-admin-last-name"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    value={createForm.lastName}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="create-admin-email">Email</label>
                <input
                  id="create-admin-email"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                  type="email"
                  value={createForm.email}
                />
              </div>
              <div className="field">
                <label htmlFor="create-admin-password">Mot de passe</label>
                <input
                  id="create-admin-password"
                  minLength={6}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={createForm.password}
                />
              </div>
              <div className="field">
                <label htmlFor="create-admin-role">Role admin</label>
                <select
                  id="create-admin-role"
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      adminRole: event.target.value,
                    }))
                  }
                  value={createForm.adminRole}
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getAdminRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="create-admin-reason">Motif</label>
                <textarea
                  id="create-admin-reason"
                  minLength={5}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  required
                  value={createForm.reason}
                />
              </div>
              <button className="button" disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? 'Creation...' : 'Creer l admin'}
              </button>
            </form>
          ) : (
            <div className="meta">
              Votre role ne permet pas de creer d&apos;autres admins.
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Derniere connexion</th>
                <th>Cree par</th>
                <th>Mis a jour par</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {response.items.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{admin.fullName}</strong>
                      <div className="meta">{admin.email}</div>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone="info">
                      {getAdminRoleLabel(admin.adminRole)}
                    </AdminBadge>
                  </td>
                  <td>{formatDateTime(admin.lastLoginAt)}</td>
                  <td>
                    {admin.createdBy ? (
                      <div className="stack stack--sm">
                        <div>{admin.createdBy.email}</div>
                        <div className="meta">{formatDateTime(admin.createdBy.createdAt)}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {admin.updatedBy ? (
                      <div className="stack stack--sm">
                        <div>{admin.updatedBy.email}</div>
                        <div className="meta">{formatDateTime(admin.updatedBy.createdAt)}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="button button--secondary button--small"
                        onClick={() =>
                          setRoleModal({
                            userId: admin.id,
                            email: admin.email,
                            adminRole: admin.adminRole,
                            reason: '',
                          })
                        }
                        type="button"
                      >
                        Changer role
                      </button>
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

      <ConfirmActionModal
        confirmLabel="Mettre a jour le role"
        description="Le changement de role est audite et reste soumis aux garde-fous de niveau."
        extraContent={
          roleModal ? (
            <div className="field">
              <label htmlFor="change-admin-role">Role admin</label>
              <select
                id="change-admin-role"
                onChange={(event) =>
                  setRoleModal((current) =>
                    current
                      ? {
                          ...current,
                          adminRole: event.target.value,
                        }
                      : current,
                  )
                }
                value={roleModal.adminRole}
              >
                {Array.from(new Set([...assignableRoles, 'USER'])).map((role) => (
                  <option key={role} value={role}>
                    {getAdminRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
        isOpen={Boolean(roleModal)}
        isPending={roleMutation.isPending}
        onClose={() => setRoleModal(null)}
        onConfirm={() => {
          if (roleModal) {
            void roleMutation.mutateAsync(roleModal);
          }
        }}
        onReasonChange={(value) =>
          setRoleModal((current) =>
            current
              ? {
                  ...current,
                  reason: value,
                }
              : current,
          )
        }
        reason={roleModal?.reason ?? ''}
        title={
          roleModal ? `Changer le role admin de ${roleModal.email}` : 'Changer le role admin'
        }
      />
    </div>
  );
}
