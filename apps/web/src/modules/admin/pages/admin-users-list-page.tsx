import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { listAdminUsers } from '../api';
import { AdminBadge } from '../components/admin-badge';
import { AdminFiltersToolbar } from '../components/admin-filters-toolbar';
import { AdminPagination } from '../components/admin-pagination';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getAccessStatusLabel,
  getAccessStatusTone,
  getAdminRoleLabel,
  getSubscriptionPlanLabel,
  getSubscriptionStatusLabel,
  getSubscriptionStatusTone,
} from '../../../shared/ui/business-labels';
import { formatCount, formatDate, formatDateTime } from '../../../shared/ui/formatters';

export function AdminUsersListPage() {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [accessStatus, setAccessStatus] = useState('');

  const usersQuery = useQuery({
    queryKey: [
      'admin-users',
      page,
      search,
      adminRole,
      subscriptionStatus,
      subscriptionPlan,
      accessStatus,
    ],
    queryFn: () =>
      listAdminUsers(session, {
        page,
        pageSize: 10,
        search,
        adminRole: adminRole || undefined,
        subscriptionStatus: subscriptionStatus || undefined,
        subscriptionPlan: subscriptionPlan || undefined,
        accessStatus: accessStatus as 'ACTIVE' | 'SUSPENDED' | undefined,
      }),
  });

  function resetFilters() {
    setPage(1);
    setSearch('');
    setAdminRole('');
    setSubscriptionStatus('');
    setSubscriptionPlan('');
    setAccessStatus('');
  }

  if (usersQuery.isLoading) {
    return <LoadingBlock label="Chargement des utilisateurs..." />;
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        error={usersQuery.error}
        onRetry={() => {
          void usersQuery.refetch();
        }}
        title="Impossible de charger les utilisateurs admin"
      />
    );
  }

  const response = usersQuery.data;
  if (!response) {
    return <ErrorState title="Liste utilisateurs indisponible" withPanel />;
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <div className="page-subtitle">
            Recherche, filtres et lecture d&apos;exploitation pour piloter les
            comptes sans intervention BDD.
          </div>
        </div>
      </header>

      <AdminFiltersToolbar>
        <div className="field">
          <label htmlFor="admin-users-search">Recherche</label>
          <input
            id="admin-users-search"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Email, nom, organisation"
            value={search}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-users-role">Role admin</label>
          <select
            id="admin-users-role"
            onChange={(event) => {
              setPage(1);
              setAdminRole(event.target.value);
            }}
            value={adminRole}
          >
            <option value="">Tous</option>
            <option value="USER">Utilisateur</option>
            <option value="READONLY_ADMIN">Admin lecture</option>
            <option value="SALES_ADMIN">Admin sales</option>
            <option value="SUPPORT_ADMIN">Admin support</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="admin-users-access">Acces</label>
          <select
            id="admin-users-access"
            onChange={(event) => {
              setPage(1);
              setAccessStatus(event.target.value);
            }}
            value={accessStatus}
          >
            <option value="">Tous</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="admin-users-plan">Plan</label>
          <select
            id="admin-users-plan"
            onChange={(event) => {
              setPage(1);
              setSubscriptionPlan(event.target.value);
            }}
            value={subscriptionPlan}
          >
            <option value="">Tous</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="admin-users-status">Abonnement</label>
          <select
            id="admin-users-status"
            onChange={(event) => {
              setPage(1);
              setSubscriptionStatus(event.target.value);
            }}
            value={subscriptionStatus}
          >
            <option value="">Tous</option>
            <option value="NONE">Aucun</option>
            <option value="TRIAL">Essai</option>
            <option value="ACTIVE">Actif</option>
            <option value="PAST_DUE">Impay&eacute;</option>
            <option value="CANCELED">Annule</option>
          </select>
        </div>
        <div className="row-actions admin-filters__actions">
          <button
            className="button button--secondary"
            onClick={resetFilters}
            type="button"
          >
            Reinitialiser
          </button>
        </div>
      </AdminFiltersToolbar>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Comptes</h2>
            <div className="section-subtitle">
              {formatCount(response.total)} compte(s) correspondant aux filtres.
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Acces</th>
                <th>Role admin</th>
                <th>Abonnement</th>
                <th>Essai</th>
                <th>Organisations</th>
                <th>Derniere connexion</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {response.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{user.fullName}</strong>
                      <div className="meta">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone={getAccessStatusTone(user.accessStatus)}>
                      {getAccessStatusLabel(user.accessStatus)}
                    </AdminBadge>
                  </td>
                  <td>{getAdminRoleLabel(user.adminRole)}</td>
                  <td>
                    <div className="stack stack--sm">
                      <AdminBadge tone={getSubscriptionStatusTone(user.subscriptionStatus)}>
                        {getSubscriptionStatusLabel(user.subscriptionStatus)}
                      </AdminBadge>
                      <div className="meta">
                        Plan {getSubscriptionPlanLabel(user.subscriptionPlan)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{formatDate(user.trialEndsAt)}</strong>
                      <div className="meta">
                        {formatCount(user.trialExtensionsCount)} prolongation(s)
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stack stack--sm">
                      <strong>{formatCount(user.organizationsCount)}</strong>
                      <div className="meta">
                        {formatCount(user.totalProjectsCount)} projet(s)
                      </div>
                    </div>
                  </td>
                  <td>{formatDateTime(user.lastLoginAt)}</td>
                  <td>
                    <Link
                      className="button button--secondary button--small"
                      to={`/admin/users/${user.id}`}
                    >
                      Voir
                    </Link>
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
    </div>
  );
}
