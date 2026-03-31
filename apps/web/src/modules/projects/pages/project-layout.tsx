import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { getProject, updateProject } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getProjectStatusLabel } from '../../../shared/ui/business-labels';
import { getErrorMessage } from '../../../shared/ui/error-utils';

export function ProjectLayout() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [localFeedback, setLocalFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);
  const routeFeedback =
    (
      location.state as
        | {
            feedback?: {
              type: 'success' | 'error' | 'info';
              title: string;
              message?: string;
            };
          }
        | null
    )?.feedback ?? null;
  const feedback = localFeedback ?? routeFeedback;
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(session, projectId),
  });
  const archiveMutation = useMutation({
    mutationFn: () =>
      updateProject(session, projectId, {
        status: 'ARCHIVED',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] }),
      ]);
      setLocalFeedback({
        type: 'success',
        title: 'Projet archive',
        message: 'Le projet reste consulteable et masque des listes par defaut.',
      });
    },
    onError: (error) => {
      setLocalFeedback({
        type: 'error',
        title: 'Archivage impossible',
        message: getErrorMessage(error),
      });
    },
  });

  if (projectQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (projectQuery.isError) {
    return (
      <ErrorState
        error={projectQuery.error}
        onRetry={() => {
          void projectQuery.refetch();
        }}
        title="Impossible de charger ce projet"
      />
    );
  }

  if (!projectQuery.data) {
    return <div className="panel">Projet introuvable.</div>;
  }

  const project = projectQuery.data;

  return (
    <div className="stack">
      {feedback ? (
        <FeedbackMessage
          message={feedback.message}
          onDismiss={() => {
            if (localFeedback) {
              setLocalFeedback(null);
              return;
            }

            navigate(`${location.pathname}${location.search}`, {
              replace: true,
              state: null,
            });
          }}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <header className="page-header">
        <div>
          <h1>{project.name}</h1>
          <div className="page-subtitle">
            {[project.city, project.postalCode, project.reference]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <div className="inline-actions">
          <span className="badge">{getProjectStatusLabel(project.status)}</span>
          <Link className="button button--secondary" to={`/projects/${projectId}/edit`}>
            Editer le projet
          </Link>
          {project.status !== 'ARCHIVED' ? (
            <button
              className="button button--danger"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (window.confirm('Archiver ce projet ?')) {
                  archiveMutation.mutate();
                }
              }}
              type="button"
            >
              {archiveMutation.isPending ? 'Archivage...' : 'Archiver'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="tabs">
        <NavLink
          end
          to={`/projects/${projectId}`}
          className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
        >
          Vue projet
        </NavLink>
        <NavLink
          to={`/projects/${projectId}/lots`}
          className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
        >
          Lots
        </NavLink>
        <NavLink
          to={`/projects/${projectId}/expenses`}
          className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
        >
          Depenses
        </NavLink>
        <NavLink
          to={`/projects/${projectId}/documents`}
          className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
        >
          Documents
        </NavLink>
        <NavLink
          to={`/projects/${projectId}/export`}
          className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
        >
          Export CSV
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
