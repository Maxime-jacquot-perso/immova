import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { getSimulation, listFolders, updateSimulation } from '../api';
import { SimulationForm } from '../components/simulation-form';
import {
  mapSimulationFormValuesToUpdatePayload,
  mapSimulationToFormFields,
} from '../form-utils';
import { ErrorState } from '../../../shared/ui/error-state';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { LoadingBlock } from '../../../shared/ui/loading-block';

export function SimulationEditPage() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const simulationQuery = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: () => getSimulation(session, simulationId!),
    enabled: !!simulationId,
  });

  const foldersQuery = useQuery({
    queryKey: ['simulation-folders'],
    queryFn: () => listFolders(session),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateSimulation(session, simulationId!, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['simulation', simulationId],
        }),
        queryClient.invalidateQueries({ queryKey: ['simulations'] }),
      ]);
      navigate(`/simulations/${simulationId}`);
    },
  });

  if (simulationQuery.isLoading || foldersQuery.isLoading) {
    return (
      <LoadingBlock
        hint="On recharge la simulation et son contexte avant edition."
        label="Chargement de la simulation..."
      />
    );
  }

  if (simulationQuery.isError) {
    return (
      <ErrorState
        error={simulationQuery.error}
        onRetry={() => {
          void simulationQuery.refetch();
        }}
        title="Simulation introuvable"
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

  const simulation = simulationQuery.data!;
  const folderOptions = (foldersQuery.data ?? []).filter(
    (folder) => !folder.archivedAt || folder.id === simulation.folderId,
  );

  return (
    <SimulationForm
      defaultValues={mapSimulationToFormFields(simulation)}
      errorMessage={
        updateMutation.isError
          ? getErrorMessage(
              updateMutation.error,
              "Impossible d'enregistrer la simulation.",
            )
          : null
      }
      folderLocked
      folderOptions={folderOptions}
      isPending={updateMutation.isPending}
      key={simulation.id}
      onSubmit={(values) => {
        updateMutation.mutate(mapSimulationFormValuesToUpdatePayload(values));
      }}
      submitLabel={updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
      subtitle="Retouchez l'hypothese sans perdre le fil entre acquisition, financement et exploitation."
      title="Editer la simulation"
    />
  );
}
