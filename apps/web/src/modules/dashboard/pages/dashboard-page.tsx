import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import {
  getDashboard,
  getDashboardDrifts,
  type DashboardDriftIssue,
} from '../api';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import {
  getAlertSeverityLabel,
  getAlertSeverityTone,
  getDashboardActivityTypeLabel,
  getDashboardAlertLabel,
  getDecisionStatusTone,
  getProjectStatusLabel,
} from '../../../shared/ui/business-labels';
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from '../../../shared/ui/formatters';

function renderEstimatedYield(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return (
      <div>
        <strong>Non calculable</strong>
        <div className="meta">Donnees insuffisantes</div>
      </div>
    );
  }

  return (
    <div>
      <strong>{formatPercent(value)}</strong>
      <div className="meta">Estimation brute</div>
    </div>
  );
}

function getDriftStatusTone(status: DashboardDriftIssue['status']) {
  return status === 'drift' ? 'critical' : 'warning';
}

function getDriftStatusLabel(status: DashboardDriftIssue['status']) {
  return status === 'drift' ? 'En derive' : 'A surveiller';
}

function getDriftIssueUnit(metricKey: string) {
  if (metricKey === 'grossYield') {
    return 'percent';
  }

  if (metricKey === 'lotsCount') {
    return 'count';
  }

  return 'currency';
}

function formatSignedValue(
  metricKey: string,
  value: number | null | undefined,
) {
  if (typeof value !== 'number') {
    return 'Non disponible';
  }

  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  const absoluteValue = Math.abs(value);
  const unit = getDriftIssueUnit(metricKey);

  if (unit === 'percent') {
    return `${prefix}${formatPercent(absoluteValue)}`;
  }

  if (unit === 'count') {
    return `${prefix}${formatCount(absoluteValue)}`;
  }

  return `${prefix}${formatCurrency(absoluteValue)}`;
}

function formatDriftIssue(issue: DashboardDriftIssue) {
  const signedValue = formatSignedValue(issue.metricKey, issue.deltaValue);

  if (typeof issue.deltaPercent !== 'number') {
    return `${issue.label} : ${signedValue}`;
  }

  const percentPrefix =
    issue.deltaPercent > 0 ? '+' : issue.deltaPercent < 0 ? '-' : '';

  return `${issue.label} : ${signedValue} (${percentPrefix}${formatPercent(
    Math.abs(issue.deltaPercent),
  )})`;
}

export function DashboardPage() {
  const { session } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard(session),
  });
  const driftsQuery = useQuery({
    queryKey: ['dashboard', 'drifts'],
    queryFn: () => getDashboardDrifts(session),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingBlock label="Chargement du dashboard..." />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        error={dashboardQuery.error}
        onRetry={() => {
          void dashboardQuery.refetch();
        }}
        title="Impossible de charger le dashboard"
      />
    );
  }

  const dashboard = dashboardQuery.data;
  if (!dashboard) {
    return <div className="panel">Dashboard indisponible.</div>;
  }

  const hasPortfolio = dashboard.summary.activeProjectsCount > 0;
  const criticalProjects = dashboard.watchlist.filter(
    (project) => project.decisionStatus.level === 'critical',
  );
  const comparisonWithYield = dashboard.comparison.filter(
    (project) => typeof project.grossYieldEstimated === 'number',
  );
  const bestYieldProjectId =
    dashboard.comparison.length > 1 && comparisonWithYield.length > 0
      ? comparisonWithYield.reduce((bestProject, project) =>
          (project.grossYieldEstimated ?? 0) > (bestProject.grossYieldEstimated ?? 0)
            ? project
            : bestProject,
        ).id
      : null;
  const worstCompletenessProjectId =
    dashboard.comparison.length > 1
      ? [...dashboard.comparison].sort(
          (left, right) => left.completeness.score - right.completeness.score,
        )[0]?.id ?? null
      : null;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="page-subtitle">
            Une vue portefeuille utile pour comparer vos projets, voir ce qui est
            fiable et identifier les actions a lancer en priorite.
          </div>
        </div>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-card__label">Projets actifs</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.activeProjectsCount)}
          </div>
          <div className="kpi-card__hint">Hors projets archives</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Lots</div>
          <div className="kpi-card__value">
            {formatCount(dashboard.summary.nonArchivedLotsCount)}
          </div>
          <div className="kpi-card__hint">Lots non archives</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Depenses enregistrees</div>
          <div className="kpi-card__value">
            {formatCurrency(dashboard.summary.totalExpensesAmount)}
          </div>
          <div className="kpi-card__hint">Montants saisis dans les projets actifs</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-card__label">Loyers mensuels estimes</div>
          <div className="kpi-card__value">
            {formatCurrency(dashboard.summary.estimatedMonthlyRentTotal)}
          </div>
          <div className="kpi-card__hint">Somme des loyers estimes renseignes</div>
        </div>
      </section>

      {!hasPortfolio ? (
        <EmptyState
          action={
            <Link className="button" to="/projects/new">
              Creer mon premier projet
            </Link>
          }
          description="Ajoutez un premier projet pour commencer a suivre vos lots, vos depenses, vos documents et les indicateurs fiables."
          title="Aucun projet actif a piloter"
          withPanel
        />
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Derives portefeuille</h2>
                <div className="section-subtitle">
                  Une lecture immediate pour savoir quels projets convertis
                  demandent votre attention maintenant.
                </div>
              </div>
            </div>

            {driftsQuery.isLoading ? (
              <LoadingBlock label="Chargement des derives portefeuille..." />
            ) : driftsQuery.isError ? (
              <ErrorState
                error={driftsQuery.error}
                onRetry={() => {
                  void driftsQuery.refetch();
                }}
                title="Impossible de charger les derives portefeuille"
                withPanel={false}
              />
            ) : driftsQuery.data ? (
              <div className="stack">
                <section className="kpi-grid">
                  <div className="card kpi-card">
                    <div className="kpi-card__label">Projets lus</div>
                    <div className="kpi-card__value">
                      {formatCount(driftsQuery.data.totalProjects)}
                    </div>
                    <div className="kpi-card__hint">Projets actifs du portefeuille</div>
                  </div>
                  <div className="card kpi-card">
                    <div className="kpi-card__label">En derive</div>
                    <div className="kpi-card__value">
                      {formatCount(driftsQuery.data.projectsWithDrift)}
                    </div>
                    <div className="kpi-card__hint">Au moins un ecart critique</div>
                  </div>
                  <div className="card kpi-card">
                    <div className="kpi-card__label">A surveiller</div>
                    <div className="kpi-card__value">
                      {formatCount(driftsQuery.data.projectsWithWatch)}
                    </div>
                    <div className="kpi-card__hint">Ecarts moderes sans derive critique</div>
                  </div>
                  <div className="card kpi-card">
                    <div className="kpi-card__label">Sans reference</div>
                    <div className="kpi-card__value">
                      {formatCount(driftsQuery.data.projectsWithoutForecastReference)}
                    </div>
                    <div className="kpi-card__hint">
                      Projets sans snapshot previsionnel exploitable
                    </div>
                  </div>
                </section>

                {driftsQuery.data.criticalProjects.length === 0 ? (
                  <EmptyState
                    description={
                      driftsQuery.data.projectsWithoutForecastReference > 0
                        ? `${formatCount(driftsQuery.data.projectsWithoutForecastReference)} projet(s) restent encore sans reference previsionnelle, mais aucune derive active n'est detectee sur les autres.`
                        : "Aucune derive active n'est detectee sur les projets convertis actuellement comparables."
                    }
                    title="Rien a prioriser"
                    withPanel={false}
                  />
                ) : (
                  <div className="dashboard-alert-list">
                    {driftsQuery.data.criticalProjects.map((project) => (
                      <div
                        className={`dashboard-alert dashboard-alert--${getDriftStatusTone(
                          project.status,
                        )}`}
                        key={project.projectId}
                      >
                        <div className="dashboard-alert__content">
                          <div className="dashboard-alert__meta">
                            <span
                              className={`tone-pill tone-pill--${getDriftStatusTone(
                                project.status,
                              )}`}
                            >
                              {getDriftStatusLabel(project.status)}
                            </span>
                            <span className="meta">Lecture portefeuille</span>
                          </div>
                          <strong>{project.name}</strong>
                          <div className="stack stack--sm">
                            {project.mainIssues.map((issue) => (
                              <div className="meta" key={`${project.projectId}-${issue.metricKey}`}>
                                {formatDriftIssue(issue)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Link
                          className="button button--secondary button--small"
                          to={`/projects/${project.projectId}`}
                        >
                          Ouvrir
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="meta">Derives portefeuille indisponibles.</div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Comparaison projets</h2>
                <div className="section-subtitle">
                  Une lecture rapide des projets actifs, triee par criticite,
                  completude puis rendement brut estime quand il est calculable.
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Projet</th>
                    <th>Statut decisionnel</th>
                    <th>Cout total a date</th>
                    <th>Loyer estime mensuel</th>
                    <th>Rendement brut estime</th>
                    <th>Completude</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.comparison.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div className="stack stack--sm">
                          <strong>{project.name}</strong>
                          <div className="meta">
                            {getProjectStatusLabel(project.status)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="stack stack--sm">
                          <span
                            className={`tone-pill tone-pill--${getDecisionStatusTone(
                              project.decisionStatus.level,
                            )}`}
                          >
                            {project.decisionStatus.label}
                          </span>
                          <div className="meta">{project.completeness.label}</div>
                        </div>
                      </td>
                      <td>{formatCurrency(project.totalCostToDate)}</td>
                      <td>{formatCurrency(project.estimatedRentTotal)}</td>
                      <td>
                        <div className="stack stack--sm">
                          {renderEstimatedYield(project.grossYieldEstimated)}
                          {bestYieldProjectId === project.id ? (
                            <div className="meta comparison-flag comparison-flag--good">
                              Meilleur rendement visible
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="stack stack--sm">
                          <strong>{formatCount(project.completeness.score)} %</strong>
                          {worstCompletenessProjectId === project.id ? (
                            <div className="meta comparison-flag comparison-flag--warning">
                              Completude la plus faible
                            </div>
                          ) : (
                            <div className="meta">{project.completeness.label}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link className="button button--secondary button--small" to={project.href}>
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="split dashboard-panels">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="section-title">Projets a surveiller</h2>
                  <div className="section-subtitle">
                    Les projets qui demandent une verification rapide ou une mise a
                    jour des donnees utiles.
                  </div>
                </div>
              </div>

              {dashboard.watchlist.length === 0 ? (
                <EmptyState
                  description="Les projets actifs apparaitront ici avec leur niveau de fiabilite et leurs points d'attention."
                  title="Aucun projet a afficher"
                  withPanel={false}
                />
              ) : (
                <div className="dashboard-alert-list">
                  {dashboard.watchlist.map((project) => (
                    <div className="dashboard-alert" key={project.id}>
                      <div className="dashboard-alert__content">
                        <div className="dashboard-alert__meta">
                          <span
                            className={`tone-pill tone-pill--${getDecisionStatusTone(
                              project.decisionStatus.level,
                            )}`}
                          >
                            {project.decisionStatus.label}
                          </span>
                          <span className="meta">
                            {getProjectStatusLabel(project.status)}
                          </span>
                          <span className="meta">Mise a jour {formatDate(project.updatedAt)}</span>
                        </div>
                        <strong>{project.name}</strong>
                        {project.alerts.length === 0 ? (
                          <div className="meta">
                            Aucun point de vigilance majeur detecte sur ce projet.
                          </div>
                        ) : (
                          <div className="stack stack--sm">
                            <div>
                              <strong>{project.alerts[0]?.message}</strong>
                              {project.alerts.length > 1 ? (
                                <div className="meta">
                                  +{project.alerts.length - 1} autre(s) point(s) a surveiller
                                </div>
                              ) : null}
                            </div>
                            {project.suggestions.length > 0 ? (
                              <div className="stack stack--sm">
                                {project.suggestions.slice(0, 2).map((suggestion) => (
                                  <div className="meta" key={`${project.id}-${suggestion.code}`}>
                                    Action : {suggestion.message}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                        <div className="dashboard-watchlist-metrics">
                          <span>Cout : {formatCurrency(project.totalCostToDate)}</span>
                          <span>
                            Loyers estimes : {formatCurrency(project.estimatedRentTotal)}
                          </span>
                          <span>
                            Rendement :{' '}
                            {typeof project.grossYieldEstimated === 'number'
                              ? formatPercent(project.grossYieldEstimated)
                              : 'Non calculable'}
                          </span>
                          <span>Completude : {formatCount(project.completeness.score)} %</span>
                        </div>
                      </div>
                      <Link className="button button--secondary button--small" to={project.href}>
                        Voir
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="section-title">Actions prioritaires</h2>
                  <div className="section-subtitle">
                    Quelques actions concretes pour debloquer les projets les plus
                    problematiques.
                  </div>
                </div>
              </div>

              {criticalProjects.length === 0 ? (
                <EmptyState
                  description="Aucun projet critique n'est detecte pour le moment."
                  title="Pas d'action urgente"
                  withPanel={false}
                />
              ) : (
                <div className="dashboard-alert-list">
                  {criticalProjects.slice(0, 3).map((project) => (
                    <div
                      className="dashboard-alert dashboard-alert--critical"
                      key={`${project.id}-suggestions`}
                    >
                      <div className="dashboard-alert__content">
                        <div className="dashboard-alert__meta">
                          <span className="tone-pill tone-pill--critical">
                            {project.decisionStatus.label}
                          </span>
                          <span className="meta">{project.name}</span>
                        </div>
                        <strong>
                          {project.alerts[0]?.message ||
                            'Ce projet demande une verification rapide.'}
                        </strong>
                        <div className="stack stack--sm">
                          {project.suggestions.slice(0, 3).map((suggestion) => (
                            <div key={`${project.id}-${suggestion.code}`}>
                              {suggestion.message}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link className="button button--secondary button--small" to={project.href}>
                        Ouvrir
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <div className="split dashboard-panels">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Alertes utiles</h2>
              <div className="section-subtitle">
                Les signaux metier les plus utiles pour prioriser le portefeuille.
              </div>
            </div>
          </div>

          {dashboard.alerts.length === 0 ? (
            <EmptyState
              description="Aucune alerte n'a ete detectee sur les projets actifs. Les donnees utiles paraissent suffisamment renseignees."
              title="Aucune alerte ouverte"
              withPanel={false}
            />
          ) : (
            <div className="dashboard-alert-list">
              {dashboard.alerts.map((alert) => (
                <div
                  className={`dashboard-alert dashboard-alert--${getAlertSeverityTone(alert.severity)}`}
                  key={`${alert.project.id}-${alert.type}`}
                >
                  <div className="dashboard-alert__content">
                    <div className="dashboard-alert__meta">
                      <span
                        className={`tone-pill tone-pill--${getAlertSeverityTone(alert.severity)}`}
                      >
                        {getAlertSeverityLabel(alert.severity)}
                      </span>
                      <span className="meta">{getDashboardAlertLabel(alert.type)}</span>
                    </div>
                    <strong>{alert.message}</strong>
                    <div className="meta">Projet : {alert.project.name}</div>
                  </div>
                  <Link className="button button--secondary button--small" to={alert.href}>
                    Ouvrir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Activite recente</h2>
              <div className="section-subtitle">
                Les derniers changements qui meritent une verification rapide.
              </div>
            </div>
          </div>

          {dashboard.recentActivity.length === 0 ? (
            <EmptyState
              description="L'activite apparaitra ici quand vous commencerez a creer ou mettre a jour des projets, des depenses ou des documents."
              title="Aucune activite recente"
              withPanel={false}
            />
          ) : (
            <div className="dashboard-activity-list">
              {dashboard.recentActivity.map((item, index) => (
                <div
                  className="dashboard-activity-item"
                  key={`${item.type}-${item.href}-${index}`}
                >
                  <div className="dashboard-activity-item__content">
                    <div className="dashboard-activity-item__meta">
                      <span className="tone-pill tone-pill--neutral">
                        {getDashboardActivityTypeLabel(item.type)}
                      </span>
                      <span className="meta">{formatDateTime(item.date)}</span>
                    </div>
                    <strong>{item.label}</strong>
                    <div className="meta">
                      {item.project ? `Projet : ${item.project.name}` : 'Sans projet'}
                    </div>
                  </div>
                  <Link className="button button--secondary button--small" to={item.href}>
                    Voir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
