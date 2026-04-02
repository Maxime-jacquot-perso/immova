import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { createSimulation, listFolders } from '../api';
import { SimulationForm } from '../components/simulation-form';
import { mapSimulationFormValuesToPayload } from '../form-utils';
import { ErrorState } from '../../../shared/ui/error-state';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { LoadingBlock } from '../../../shared/ui/loading-block';

export function SimulationFormPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultFolderId = searchParams.get('folderId') ?? '';

  const foldersQuery = useQuery({
    queryKey: ['simulation-folders'],
    queryFn: () => listFolders(session),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createSimulation(session, payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['simulations'] });
      navigate(`/simulations/${data.id}`);
    },
  });

  if (foldersQuery.isLoading) {
    return (
      <LoadingBlock
        hint="On recupere les dossiers actifs pour rattacher correctement l'opportunite."
        label="Chargement du formulaire..."
      />
    );
  }

  if (foldersQuery.isError) {
    return (
      <ErrorState
        error={foldersQuery.error}
        onRetry={() => {
          void foldersQuery.refetch();
        }}
        title="Impossible de charger les dossiers"
      />
    );
  }

  const folderOptions = (foldersQuery.data ?? []).filter(
    (folder) => !folder.archivedAt || folder.id === defaultFolderId,
  );

  return (
    <SimulationForm
      defaultValues={{ folderId: defaultFolderId }}
      errorMessage={
        createMutation.isError
          ? getErrorMessage(createMutation.error, 'Impossible de creer la simulation.')
          : null
      }
      folderOptions={folderOptions}
      isPending={createMutation.isPending}
      key={defaultFolderId || 'new-simulation'}
      onSubmit={(values) => {
        createMutation.mutate(mapSimulationFormValuesToPayload(values));
      }}
      submitLabel={createMutation.isPending ? 'Creation...' : 'Creer la simulation'}
      subtitle="Une saisie rapide, structuree par blocs, pour comprendre l'opportunite sans surcharge."
      title="Nouvelle simulation"
    />
  );
}
