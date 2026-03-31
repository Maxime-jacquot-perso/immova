import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { listAuditLogs } from '../api';
import { AdminAuditLogList } from '../components/admin-audit-log-list';
import { AdminFiltersToolbar } from '../components/admin-filters-toolbar';
import { AdminPagination } from '../components/admin-pagination';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingBlock } from '../../../shared/ui/loading-block';

export function AdminAuditLogsPage() {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const auditQuery = useQuery({
    queryKey: ['admin-audit-logs', page, search, action],
    queryFn: () =>
      listAuditLogs(session, {
        page,
        pageSize: 20,
        search,
        action: action || undefined,
      }),
  });

  if (auditQuery.isLoading) {
    return <LoadingBlock label="Chargement de l'audit log..." />;
  }

  if (auditQuery.isError) {
    return (
      <ErrorState
        error={auditQuery.error}
        onRetry={() => {
          void auditQuery.refetch();
        }}
        title="Impossible de charger l'audit log"
      />
    );
  }

  const response = auditQuery.data;
  if (!response) {
    return <ErrorState title="Audit log indisponible" withPanel />;
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Audit log admin</h1>
          <div className="page-subtitle">
            Historique immutable des actions sensibles, motivees et attribuees.
          </div>
        </div>
      </header>

      <AdminFiltersToolbar>
        <div className="field">
          <label htmlFor="audit-search">Recherche</label>
          <input
            id="audit-search"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Motif, acteur, cible"
            value={search}
          />
        </div>
        <div className="field">
          <label htmlFor="audit-action">Action</label>
          <select
            id="audit-action"
            onChange={(event) => {
              setPage(1);
              setAction(event.target.value);
            }}
            value={action}
          >
            <option value="">Toutes</option>
            <option value="TRIAL_GRANTED">Essai accorde</option>
            <option value="TRIAL_EXTENDED">Essai prolonge</option>
            <option value="USER_SUSPENDED">Compte suspendu</option>
            <option value="USER_REACTIVATED">Compte reactive</option>
            <option value="SUBSCRIPTION_UPDATED">Abonnement modifie</option>
            <option value="ADMIN_CREATED">Admin cree</option>
            <option value="ADMIN_ROLE_CHANGED">Role admin modifie</option>
          </select>
        </div>
      </AdminFiltersToolbar>

      <section className="panel">
        <AdminAuditLogList logs={response.items} />
        <AdminPagination
          onPageChange={setPage}
          page={response.page}
          totalPages={response.totalPages}
        />
      </section>
    </div>
  );
}
