import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { getProject, updateProject } from '../api';
import { ProjectForm } from '../components/project-form';
import type { ProjectFormInput, ProjectFormValues } from '../project-form-schema';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { getErrorMessage } from '../../../shared/ui/error-utils';

function toDefaultValues(project: Awaited<ReturnType<typeof getProject>>): Partial<ProjectFormInput> {
  return {
    name: project.name,
    reference: project.reference ?? '',
    addressLine1: project.addressLine1 ?? '',
    postalCode: project.postalCode ?? '',
    city: project.city ?? '',
    country: project.country,
    type: project.type as ProjectFormInput['type'],
    status: project.status as ProjectFormInput['status'],
    purchasePrice: project.purchasePrice ?? undefined,
    notaryFees: project.notaryFees ?? undefined,
    acquisitionFees: project.acquisitionFees ?? undefined,
    worksBudget: project.worksBudget ?? undefined,
    notes: project.notes ?? '',
  };
}

export function ProjectEditPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(session, projectId),
  });

  const mutation = useMutation({
    mutationFn: (payload: ProjectFormValues) => updateProject(session, projectId, payload),
  });

  const defaultValues = useMemo(
    () => (projectQuery.data ? toDefaultValues(projectQuery.data) : undefined),
    [projectQuery.data],
  );

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
        title="Impossible de charger le projet"
      />
    );
  }

  if (!projectQuery.data) {
    return <div className="panel">Projet introuvable.</div>;
  }

  return (
    <ProjectForm
      title="Editer le projet"
      subtitle="On corrige les donnees du projet sans ouvrir de sous-produit inutile."
      submitLabel="Enregistrer les modifications"
      defaultValues={defaultValues}
      errorMessage={mutation.isError ? getErrorMessage(mutation.error) : undefined}
      isPending={mutation.isPending}
      onSubmit={(values) =>
        mutation.mutate(values, {
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['projects'] }),
              queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
              queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] }),
            ]);
            navigate(`/projects/${projectId}`, {
              state: {
                feedback: {
                  type: 'success',
                  title: 'Projet mis a jour',
                  message: 'Les informations du projet ont ete enregistrees.',
                },
              },
            });
          },
        })
      }
    />
  );
}
