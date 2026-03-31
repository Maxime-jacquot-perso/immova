import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth-context';
import { getAdminDashboard } from '../api';
import { AdminAuditLogList } from '../components/admin-audit-log-list';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { getAdminRoleLabel } from '../../../shared/ui/business-labels';
import { formatCount } from '../../../shared/ui/formatters';

export function AdminDashboardPage() {
  const { session } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard(session),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingBlock label="Chargement du dashboard admin..." />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        error={dashboardQuery.error}
        onRetry={() => {
          void dashboardQuery.refetch();
        }}
        title="Impossible de charger le dashboard admin"
      />
    );
  }

  const dashboard = dashboardQuery.data;
  if (!dashboard) {
    return <ErrorState title="Dashboard admin indisponible" withPanel />;
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Back-office admin</h1>
          <div className="page-subtitle">
            Pilotage interne des comptes, des essais, des statuts d&apos;acc&egrave;s
            et des actions sensibles, avec audit complet.
          </div>
        </div>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-card__label">Utilisateurs</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.totalUsers)}
          </div>
          <div className="kpi-card__hint">Base totale</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Comptes actifs</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.activeUsers)}
          </div>
          <div className="kpi-card__hint">Hors comptes suspendus</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Essais en cours</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.trialUsers)}
          </div>
          <div className="kpi-card__hint">Trial encore actif</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Essais &agrave; surveiller</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.trialsExpiringSoon)}
          </div>
          <div className="kpi-card__hint">Expiration sous 7 jours</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Suspendus</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.suspendedUsers)}
          </div>
          <div className="kpi-card__hint">Acc&egrave;s coup&eacute;s</div>
        </div>
      </section>

      <div className="grid grid--2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Repartition des admins</h2>
              <div className="section-subtitle">
                Lecture des profils internes actuellement actifs dans le
                back-office.
              </div>
            </div>
          </div>

          <div className="admin-role-grid">
            {dashboard.adminRoleDistribution.map((role) => (
              <div className="admin-role-card" key={role.role}>
                <strong>{getAdminRoleLabel(role.role)}</strong>
                <div className="kpi-card__value">{formatCount(role.count)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Actions admin recentes</h2>
              <div className="section-subtitle">
                Toute action sensible doit laisser une trace lisible, motivee et
                exploitable.
              </div>
            </div>
          </div>

          <AdminAuditLogList logs={dashboard.recentActions} />
        </section>
      </div>
    </div>
  );
}
