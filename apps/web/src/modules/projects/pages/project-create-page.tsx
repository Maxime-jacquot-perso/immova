import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { createProject } from '../api';
import { ProjectForm } from '../components/project-form';
import type { ProjectFormValues } from '../project-form-schema';
import { getErrorMessage } from '../../../shared/ui/error-utils';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const mutation = useMutation({
    mutationFn: (payload: ProjectFormValues) => createProject(session, payload),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${project.id}`, {
        state: {
          feedback: {
            type: 'success',
            title: 'Projet cree',
            message:
              'Le projet est pret. Vous pouvez maintenant ajouter des lots, des depenses et des documents.',
          },
        },
      });
    },
  });

  return (
    <ProjectForm
      title="Nouveau projet"
      subtitle="On capture seulement les donnees utiles au pilotage."
      submitLabel="Creer le projet"
      errorMessage={mutation.isError ? getErrorMessage(mutation.error) : undefined}
      isPending={mutation.isPending}
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}
