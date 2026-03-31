import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { listProjects } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import {
  getDecisionStatusTone,
  getProjectStatusLabel,
  getProjectTypeLabel,
} from '../../../shared/ui/business-labels';
import { formatCurrency } from '../../../shared/ui/formatters';

export function ProjectsListPage() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hideArchived, setHideArchived] = useState(true);
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(session),
  });
  const filteredProjects = useMemo(() => {
    const projects = projectsQuery.data ?? [];

    return projects.filter((project) => {
      const matchesSearch =
        search.trim() === '' ||
        [project.name, project.reference, project.city]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || project.status === statusFilter;
      const matchesArchiveVisibility =
        statusFilter === 'ARCHIVED' || !hideArchived || project.status !== 'ARCHIVED';

      return matchesSearch && matchesStatus && matchesArchiveVisibility;
    });
  }, [hideArchived, projectsQuery.data, search, statusFilter]);

  if (projectsQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        error={projectsQuery.error}
        onRetry={() => {
          void projectsQuery.refetch();
        }}
        title="Impossible de charger les projets"
      />
    );
  }

  const hasProjects = (projectsQuery.data ?? []).length > 0;
  const hasActiveFilters =
    search.trim() !== '' || statusFilter !== 'ALL' || hideArchived;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Projets</h1>
          <div className="page-subtitle">
            Centralisez chaque operation avec ses couts, ses lots et ses documents.
          </div>
        </div>
        <Link className="button" to="/projects/new">
          Nouveau projet
        </Link>
      </header>

      <section className="panel filters-bar">
        <div className="field">
          <label htmlFor="projects-search">Recherche</label>
          <input
            id="projects-search"
            placeholder="Nom du projet, reference, ville"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="projects-status">Statut</label>
          <select
            id="projects-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Tous</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ACQUISITION">Acquisition</option>
            <option value="WORKS">Travaux</option>
            <option value="READY">Pret</option>
            <option value="ACTIVE">Actif</option>
            <option value="SOLD">Vendu</option>
            <option value="ARCHIVED">Archive</option>
          </select>
        </div>
        <label className="checkbox-field" htmlFor="projects-hide-archived">
          <input
            id="projects-hide-archived"
            type="checkbox"
            checked={hideArchived}
            onChange={(event) => setHideArchived(event.target.checked)}
          />
          <span>Masquer les archives</span>
        </label>
      </section>

      {filteredProjects.length === 0 ? (
        <EmptyState
          action={
            hasProjects && hasActiveFilters ? (
              <button
                className="button button--secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setHideArchived(true);
                }}
                type="button"
              >
                Reinitialiser les filtres
              </button>
            ) : (
              <Link className="button" to="/projects/new">
                Creer mon premier projet
              </Link>
            )
          }
          description={
            hasProjects
              ? "Aucun projet ne correspond aux filtres actuels. Elargissez la recherche pour retrouver une operation."
              : 'Creez votre premier projet pour suivre les lots, les depenses, les documents et les KPI fiables au meme endroit.'
          }
          title={
            hasProjects
              ? 'Aucun projet visible'
              : 'Aucun projet suivi pour le moment'
          }
        />
      ) : (
        <div className="project-list">
          {filteredProjects.map((project) => (
            <Link
              className="card project-card"
              key={project.id}
              to={`/projects/${project.id}`}
            >
              <div className="project-card__top">
                <div>
                  <h2 style={{ margin: 0 }}>{project.name}</h2>
                  <div className="meta">
                    {[project.reference, project.city, project.postalCode]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <div className="project-card__badges">
                  {project.decisionStatus ? (
                    <span
                      className={`tone-pill tone-pill--${getDecisionStatusTone(
                        project.decisionStatus.level,
                      )}`}
                    >
                      {project.decisionStatus.label}
                    </span>
                  ) : null}
                  <span className="badge">{getProjectStatusLabel(project.status)}</span>
                </div>
              </div>

              <div className="grid grid--3" style={{ marginTop: 18 }}>
                <div>
                  <div className="meta">Prix d'achat</div>
                  <strong>{formatCurrency(project.purchasePrice)}</strong>
                </div>
                <div>
                  <div className="meta">Budget travaux</div>
                  <strong>{formatCurrency(project.worksBudget)}</strong>
                </div>
                <div>
                  <div className="meta">Type</div>
                  <strong>{getProjectTypeLabel(project.type)}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
