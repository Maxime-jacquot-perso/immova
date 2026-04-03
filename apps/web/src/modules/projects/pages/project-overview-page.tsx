import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { getProjectOverview } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { EmptyState } from '../../../shared/ui/empty-state';
import {
  getAlertSeverityLabel,
  getAlertSeverityTone,
  getDashboardAlertLabel,
  getDecisionStatusTone,
  getDocumentTypeLabel,
  getExpenseCategoryLabel,
  getProjectStatusLabel,
} from '../../../shared/ui/business-labels';
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatPercent,
} from '../../../shared/ui/formatters';
import type {
  ForecastMetric,
  ProjectCompleteness,
  ProjectForecastComparison,
} from '../api';

function renderEstimatedYield(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return (
      <div>
        <div className="kpi-card__value">Non calculable</div>
        <div className="kpi-card__hint">
          Le calcul reste masque tant que cout et loyers estimes ne sont pas
          suffisamment fiables.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="kpi-card__value">{formatPercent(value)}</div>
      <div className="kpi-card__hint">Estimation brute basee sur les donnees saisies</div>
    </div>
  );
}

function renderCompleteness(completeness: ProjectCompleteness) {
  return (
    <div className="stack stack--sm">
      <div className="inline-actions">
        <span className={`tone-pill tone-pill--${getAlertSeverityTone(completeness.level)}`}>
          {completeness.label}
        </span>
        <strong>{formatCount(completeness.score)} %</strong>
      </div>
      <div className="meta">
        {formatCount(completeness.completedCriteriaCount)} /{' '}
        {formatCount(completeness.totalCriteriaCount)} criteres utiles renseignes
      </div>
    </div>
  );
}

function getForecastMetricTone(status: ForecastMetric['status']) {
  if (status === 'drift') {
    return 'critical';
  }

  if (status === 'watch') {
    return 'warning';
  }

  if (status === 'neutral') {
    return 'ok';
  }

  return 'info';
}

function getForecastMetricLabel(status: ForecastMetric['status']) {
  if (status === 'drift') {
    return 'En derive';
  }

  if (status === 'watch') {
    return 'A surveiller';
  }

  if (status === 'neutral') {
    return 'Neutre';
  }

  return 'Non disponible';
}

function formatForecastMetricValue(metric: ForecastMetric, value: number | null | undefined) {
  if (metric.unit === 'currency') {
    return formatCurrency(value);
  }

  if (metric.unit === 'percent') {
    return formatPercent(value);
  }

  return formatCount(value);
}

function formatSignedMetricValue(metric: ForecastMetric, value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'Non disponible';
  }

  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  const absoluteValue = Math.abs(value);

  if (metric.unit === 'currency') {
    return `${prefix}${formatCurrency(absoluteValue)}`;
  }

  if (metric.unit === 'percent') {
    return `${prefix}${formatPercent(absoluteValue)}`;
  }

  return `${prefix}${formatCount(absoluteValue)}`;
}

function renderForecastDelta(metric: ForecastMetric) {
  if (typeof metric.deltaValue !== 'number') {
    return 'Non disponible';
  }

  const deltaLabel = formatSignedMetricValue(metric, metric.deltaValue);
  if (typeof metric.deltaPercent !== 'number') {
    return deltaLabel;
  }

  const percentPrefix =
    metric.deltaPercent > 0 ? '+' : metric.deltaPercent < 0 ? '-' : '';

  return `${deltaLabel} (${percentPrefix}${formatPercent(
    Math.abs(metric.deltaPercent),
  )})`;
}

function ForecastComparisonSection({
  comparison,
}: {
  comparison: ProjectForecastComparison;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Previsionnel vs reel</h2>
          <div className="section-subtitle">
            Lecture simple de l'ecart entre le snapshot fige a la conversion et
            les donnees aujourd'hui saisies dans le projet.
          </div>
        </div>
      </div>

      {!comparison.available ? (
        <EmptyState
          description={comparison.reason}
          title="Comparaison indisponible"
          withPanel={false}
        />
      ) : (
        <div className="stack">
          {comparison.reference ? (
            <div className="grid grid--3">
              <div className="summary-strip__item">
                <div className="meta">Simulation source</div>
                <strong>{comparison.reference.simulationName}</strong>
              </div>
              <div className="summary-strip__item">
                <div className="meta">Conversion</div>
                <strong>{formatDate(comparison.reference.conversionDate)}</strong>
              </div>
              <div className="summary-strip__item">
                <div className="meta">Recommendation initiale</div>
                <strong>{comparison.reference.recommendation ?? '—'}</strong>
              </div>
            </div>
          ) : null}

          <section className="kpi-grid">
            {comparison.metrics.map((metric) => (
              <div className="card kpi-card" key={metric.key}>
                <div className="inline-actions">
                  <div className="kpi-card__label">{metric.label}</div>
                  <span
                    className={`tone-pill tone-pill--${getForecastMetricTone(
                      metric.status,
                    )}`}
                  >
                    {getForecastMetricLabel(metric.status)}
                  </span>
                </div>
                <div className="meta">Previsionnel</div>
                <div className="kpi-card__value">
                  {formatForecastMetricValue(metric, metric.forecastValue)}
                </div>
                <div className="meta">{metric.actualLabel}</div>
                <div className="kpi-card__hint">
                  {formatForecastMetricValue(metric, metric.actualValue)}
                </div>
                <div className="meta">Ecart</div>
                <strong>{renderForecastDelta(metric)}</strong>
                {metric.note ? (
                  <div className="kpi-card__hint">{metric.note}</div>
                ) : null}
              </div>
            ))}
          </section>

          <div className="split dashboard-panels">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3 className="section-title">Alertes de derive</h3>
                  <div className="section-subtitle">
                    Seulement les ecarts simples et expliquables avec les
                    donnees actuellement disponibles.
                  </div>
                </div>
              </div>

              {comparison.alerts.length === 0 ? (
                <EmptyState
                  description="Aucune derive significative n'est detectee pour le moment."
                  title="Rien a signaler"
                  withPanel={false}
                />
              ) : (
                <div className="dashboard-alert-list">
                  {comparison.alerts.map((alert) => (
                    <div
                      className={`dashboard-alert dashboard-alert--${getAlertSeverityTone(
                        alert.severity,
                      )}`}
                      key={alert.type}
                    >
                      <div className="dashboard-alert__content">
                        <div className="dashboard-alert__meta">
                          <span
                            className={`tone-pill tone-pill--${getAlertSeverityTone(
                              alert.severity,
                            )}`}
                          >
                            {getAlertSeverityLabel(alert.severity)}
                          </span>
                        </div>
                        <strong>{alert.message}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3 className="section-title">Indicateurs encore hors scope</h3>
                  <div className="section-subtitle">
                    Axelys n'invente rien : ces ecarts resteront masques tant
                    que le modele ne les calcule pas proprement.
                  </div>
                </div>
              </div>

              {comparison.unavailableMetrics.length === 0 ? (
                <EmptyState
                  description="Tous les indicateurs retenus dans cette V1 sont actuellement calculables."
                  title="Aucune limite active"
                  withPanel={false}
                />
              ) : (
                <div className="stack stack--sm">
                  {comparison.unavailableMetrics.map((metric) => (
                    <div className="dashboard-activity-item" key={metric.key}>
                      <div className="dashboard-activity-item__content">
                        <strong>{metric.label}</strong>
                        <div className="meta">{metric.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </section>
  );
}

export function ProjectOverviewPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ['project-overview', projectId],
    queryFn: () => getProjectOverview(session, projectId),
  });

  if (overviewQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        error={overviewQuery.error}
        onRetry={() => {
          void overviewQuery.refetch();
        }}
        title="Impossible de charger le tableau de bord du projet"
      />
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return <div className="panel">Vue projet indisponible.</div>;
  }

  const isProjectStillEmpty =
    overview.kpis.lotsCount === 0 &&
    overview.recentExpenses.length === 0 &&
    overview.recentDocuments.length === 0;

  return (
    <div className="stack">
      {isProjectStillEmpty ? (
        <EmptyState
          description="Ajoutez d'abord vos lots, vos depenses et vos documents pour fiabiliser le pilotage du projet."
          title="Le projet est encore vide"
          withPanel
        />
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Resume de pilotage</h2>
            <div className="section-subtitle">
              Une lecture rapide pour savoir si le projet est sous controle, si
              les KPI affiches sont reellement exploitables et quelle action lancer
              en premier.
            </div>
          </div>
          <span
            className={`tone-pill tone-pill--${getDecisionStatusTone(
              overview.decisionStatus.level,
            )}`}
          >
            {overview.decisionStatus.label}
          </span>
        </div>

        <div className="grid grid--3">
          <div className="summary-strip__item">
            <div className="meta">Projet</div>
            <strong>{overview.project.name}</strong>
          </div>
          <div className="summary-strip__item">
            <div className="meta">Statut</div>
            <strong>{getProjectStatusLabel(overview.project.status)}</strong>
          </div>
          <div className="summary-strip__item">
            <div className="meta">Statut decisionnel</div>
            <div className="stack stack--sm">
              <span
                className={`tone-pill tone-pill--${getDecisionStatusTone(
                  overview.decisionStatus.level,
                )}`}
              >
                {overview.decisionStatus.label}
              </span>
              <div className="meta">{overview.completeness.label}</div>
            </div>
          </div>
          <div className="summary-strip__item">
            <div className="meta">Fiabilite</div>
            {renderCompleteness(overview.completeness)}
          </div>
          <div className="summary-strip__item">
            <div className="meta">Cout total a date</div>
            <strong>{formatCurrency(overview.kpis.totalCostToDate)}</strong>
          </div>
          <div className="summary-strip__item">
            <div className="meta">Loyer mensuel estime</div>
            <strong>{formatCurrency(overview.kpis.estimatedRentTotal)}</strong>
          </div>
          <div className="summary-strip__item">
            <div className="meta">Rendement brut estime</div>
            <strong>
              {typeof overview.kpis.grossYieldEstimated === 'number'
                ? formatPercent(overview.kpis.grossYieldEstimated)
                : 'Non calculable'}
            </strong>
          </div>
        </div>
      </section>

      <ForecastComparisonSection comparison={overview.forecastComparison} />

      <div className="split dashboard-panels">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">A surveiller</h2>
              <div className="section-subtitle">
                Les alertes les plus utiles pour savoir si le projet reste
                pilotable.
              </div>
            </div>
          </div>

          {overview.alerts.length === 0 ? (
            <EmptyState
              description="Aucune alerte prioritaire n'est detectee. Le projet parait actuellement sous controle."
              title="Rien a signaler"
              withPanel={false}
            />
          ) : (
            <div className="dashboard-alert-list">
              {overview.alerts.map((alert) => (
                <div
                  className={`dashboard-alert dashboard-alert--${getAlertSeverityTone(alert.severity)}`}
                  key={alert.type}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Actions recommandees</h2>
              <div className="section-subtitle">
                Les actions les plus concretes pour fiabiliser le projet et
                reprendre la main rapidement.
              </div>
            </div>
          </div>

          {overview.suggestions.length === 0 ? (
            <EmptyState
              description="Aucune action prioritaire n'est proposee pour le moment."
              title="Pas d'action immediate"
              withPanel={false}
            />
          ) : (
            <div className="stack stack--sm">
              {overview.suggestions.map((suggestion) => (
                <div
                  className="dashboard-activity-item dashboard-activity-item--action"
                  key={suggestion.code}
                >
                  <div className="dashboard-activity-item__content">
                    <div className="dashboard-activity-item__meta">
                      <span
                        className={`tone-pill tone-pill--${getAlertSeverityTone(
                          suggestion.severity,
                        )}`}
                      >
                        Action recommandee
                      </span>
                    </div>
                    <strong>{suggestion.message}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Donnees manquantes / fiabilite</h2>
            <div className="section-subtitle">
              Ce qui limite encore une lecture fiable des couts, loyers et
              estimations du projet.
            </div>
          </div>
        </div>

        {overview.completeness.missingItems.length === 0 ? (
          <EmptyState
            description="Les donnees les plus utiles pour lire le projet semblent deja renseignees."
            title="Donnees suffisantes"
            withPanel={false}
          />
        ) : (
          <div className="stack stack--sm">
            {overview.completeness.missingItems.map((item) => (
              <div className="dashboard-activity-item" key={item}>
                <div className="dashboard-activity-item__content">
                  <strong>{item}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">KPI fiables du projet</h2>
            <div className="section-subtitle">
              Les indicateurs utiles du projet, avec un libelle explicite quand une
              estimation reste non calculable.
            </div>
          </div>
        </div>

        <section className="kpi-grid">
          <div className="card kpi-card">
            <div className="kpi-card__label">Cout d'acquisition</div>
            <div className="kpi-card__value">
              {formatCurrency(overview.kpis.acquisitionCost)}
            </div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-card__label">Depenses enregistrees</div>
            <div className="kpi-card__value">
              {formatCurrency(overview.kpis.totalExpenses)}
            </div>
            <div className="kpi-card__hint">Montants saisis a ce jour</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-card__label">Lots actifs</div>
            <div className="kpi-card__value">
              {formatCount(overview.kpis.lotsCount)}
            </div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-card__label">Budget travaux</div>
            <div className="kpi-card__value">
              {formatCurrency(overview.kpis.worksBudget)}
            </div>
            <div className="kpi-card__hint">
              {overview.kpis.worksBudget === null
                ? 'Non renseigne'
                : 'Budget previsionnel saisi'}
            </div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-card__label">Ecart budget travaux</div>
            <div className="kpi-card__value">
              {formatCurrency(overview.kpis.worksBudgetDelta)}
            </div>
            <div className="kpi-card__hint">
              {overview.kpis.worksBudgetDelta === null
                ? 'Impossible a calculer sans budget travaux'
                : 'Budget restant ou depassement'}
            </div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-card__label">Rendement brut estime</div>
            {renderEstimatedYield(overview.kpis.grossYieldEstimated)}
          </div>
        </section>
      </section>

      <div className="split">
        <section className="panel">
          <h2 className="section-title">Dernieres depenses</h2>
          <div className="section-subtitle">
            Les mouvements les plus recents pour verifier les couts deja saisis.
          </div>
          {overview.recentExpenses.length === 0 ? (
            <div className="table-empty">
              <EmptyState
                description="Saisissez une premiere depense pour alimenter le suivi financier et l'export comptable."
                title="Aucune depense enregistree"
                withPanel={false}
              />
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Categorie</th>
                    <th>Prestataire</th>
                    <th>Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.issueDate)}</td>
                      <td>{getExpenseCategoryLabel(expense.category)}</td>
                      <td>{expense.vendorName || '—'}</td>
                      <td>{formatCurrency(expense.amountTtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">Derniers documents</h2>
          <div className="section-subtitle">
            Les pieces justificatives les plus recentes pour verifier le dossier du
            projet.
          </div>
          {overview.recentDocuments.length === 0 ? (
            <div className="list-empty">
              <EmptyState
                description="Ajoutez vos factures, devis ou diagnostics pour centraliser les pieces du projet."
                title="Aucun document disponible"
                withPanel={false}
              />
            </div>
          ) : (
            <div className="stack stack--sm" style={{ marginTop: 20 }}>
              {overview.recentDocuments.map((document) => (
                <div key={document.id}>
                  <strong>{document.title}</strong>
                  <div className="meta">{getDocumentTypeLabel(document.type)}</div>
                  <div className="meta">{formatDate(document.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
