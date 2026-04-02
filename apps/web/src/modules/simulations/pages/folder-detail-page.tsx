import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { getFolder, listSimulationsByFolder, compareSimulations } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { formatCurrency } from '../../../shared/ui/formatters';

export function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { session } = useAuth();

  const folderQuery = useQuery({
    queryKey: ['simulation-folder', folderId],
    queryFn: () => getFolder(session, folderId!),
    enabled: !!folderId,
  });

  const simulationsQuery = useQuery({
    queryKey: ['simulations', folderId],
    queryFn: () => listSimulationsByFolder(session, folderId!),
    enabled: !!folderId,
  });

  const comparisonQuery = useQuery({
    queryKey: ['simulations-comparison', folderId],
    queryFn: () => compareSimulations(session, folderId!),
    enabled: !!folderId,
  });

  if (folderQuery.isLoading || simulationsQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (folderQuery.isError) {
    return <ErrorState error={folderQuery.error} title="Dossier introuvable" />;
  }

  const folder = folderQuery.data!;
  const simulations = simulationsQuery.data ?? [];
  const activeSimulations = simulations.filter((s) => !s.archivedAt);
  const comparison = comparisonQuery.data ?? [];

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>{folder.name}</h1>
          {folder.description && (
            <div className="page-subtitle">{folder.description}</div>
          )}
        </div>
        <Link
          className="button"
          to={`/simulations/new?folderId=${folderId}`}
        >
          Nouvelle simulation
        </Link>
      </header>

      {activeSimulations.length === 0 && (
        <section className="panel">
          <p>Aucune simulation dans ce dossier.</p>
        </section>
      )}

      {activeSimulations.length > 0 && (
        <>
          <section className="panel">
            <h2>Simulations</h2>
            <div className="stack">
              {activeSimulations.map((sim) => (
                <Link
                  key={sim.id}
                  to={`/simulations/${sim.id}`}
                  className="card-link"
                >
                  <div className="card-content">
                    <div className="card-title">{sim.name}</div>
                    <div className="card-meta">
                      {sim.strategy === 'FLIP' ? 'Revente' : 'Locatif'} •{' '}
                      {sim.financingMode === 'CASH' ? 'Cash' : 'Crédit'} •{' '}
                      Score: {sim.decisionScore ?? 'N/A'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {comparison.length > 0 && (
            <section className="panel">
              <h2>Comparaison</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Stratégie</th>
                      <th>Coût total</th>
                      <th>Fonds propres</th>
                      <th>Marge / Rendement</th>
                      <th>Score</th>
                      <th>Recommandation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((sim) => (
                      <tr key={sim.id}>
                        <td>
                          <Link to={`/simulations/${sim.id}`}>{sim.name}</Link>
                        </td>
                        <td>{sim.strategy === 'FLIP' ? 'Revente' : 'Locatif'}</td>
                        <td>{formatCurrency(sim.totalProjectCost)}</td>
                        <td>{formatCurrency(sim.equityRequired)}</td>
                        <td>
                          {sim.strategy === 'FLIP' && sim.grossMargin !== null
                            ? formatCurrency(sim.grossMargin)
                            : sim.grossYield !== null && sim.grossYield !== undefined
                              ? `${sim.grossYield.toFixed(2)}%`
                              : 'N/A'}
                        </td>
                        <td>{sim.decisionScore ?? 'N/A'}</td>
                        <td>{sim.recommendation ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
