import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { listFolders, createFolder } from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';

export function SimulationsFoldersPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  const foldersQuery = useQuery({
    queryKey: ['simulation-folders'],
    queryFn: () => listFolders(session),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createFolder(session, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation-folders'] });
      setShowCreateForm(false);
      setNewFolderName('');
      setNewFolderDescription('');
      alert('Dossier créé avec succès');
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (newFolderName.trim().length < 2) {
      alert('Le nom doit contenir au moins 2 caractères');
      return;
    }
    createMutation.mutate({
      name: newFolderName.trim(),
      description: newFolderDescription.trim() || undefined,
    });
  };

  if (foldersQuery.isLoading) {
    return <LoadingBlock />;
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

  const folders = foldersQuery.data ?? [];
  const activeFolders = folders.filter((f) => !f.archivedAt);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Simulations</h1>
          <div className="page-subtitle">
            Comparez vos opportunités immobilières avant achat
          </div>
        </div>
        <button
          className="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Annuler' : 'Nouveau dossier'}
        </button>
      </header>

      {showCreateForm && (
        <section className="panel">
          <form onSubmit={handleCreate} className="stack">
            <div className="field">
              <label htmlFor="folder-name">Nom du dossier *</label>
              <input
                id="folder-name"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Colmar, Mulhouse..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="folder-description">Description</label>
              <textarea
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Description optionnelle"
                rows={2}
              />
            </div>
            <button
              type="submit"
              className="button"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer le dossier'}
            </button>
          </form>
        </section>
      )}

      {activeFolders.length === 0 && (
        <EmptyState
          title="Aucun dossier"
          description="Créez votre premier dossier pour regrouper vos simulations d'opportunités."
        />
      )}

      {activeFolders.length > 0 && (
        <section className="panel">
          <div className="stack">
            {activeFolders.map((folder) => (
              <Link
                key={folder.id}
                to={`/simulations/folders/${folder.id}`}
                className="card-link"
              >
                <div className="card-content">
                  <div className="card-title">{folder.name}</div>
                  {folder.description && (
                    <div className="card-subtitle">{folder.description}</div>
                  )}
                  <div className="card-meta">
                    {folder.simulationsCount} simulation(s)
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
