import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import {
  createWorkItem,
  createWorkItemOption,
  updateWorkItem,
  updateWorkItemOption,
  deleteWorkItem,
  deleteWorkItemOption,
  activateWorkItemOption,
  type SimulationWorkItem,
} from '../api';

type WorkItemsSectionProps = {
  simulationId: string;
  workItems: SimulationWorkItem[];
  worksBudget: number;
};

export function WorkItemsSection({
  simulationId,
  workItems,
  worksBudget,
}: WorkItemsSectionProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [creatingOptionForItemId, setCreatingOptionForItemId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  const createItemMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createWorkItem(session, simulationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setIsCreatingItem(false);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Record<string, unknown> }) =>
      updateWorkItem(session, simulationId, itemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setEditingItemId(null);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteWorkItem(session, simulationId, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Record<string, unknown> }) =>
      createWorkItemOption(session, simulationId, itemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setCreatingOptionForItemId(null);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({
      itemId,
      optionId,
      payload,
    }: {
      itemId: string;
      optionId: string;
      payload: Record<string, unknown>;
    }) => updateWorkItemOption(session, simulationId, itemId, optionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setEditingOptionId(null);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      deleteWorkItemOption(session, simulationId, itemId, optionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const activateOptionMutation = useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      activateWorkItemOption(session, simulationId, itemId, optionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const handleCreateItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createItemMutation.mutate({
      name: formData.get('name'),
      initialCost: Number(formData.get('initialCost')),
      estimatedDurationDays: formData.get('estimatedDurationDays')
        ? Number(formData.get('estimatedDurationDays'))
        : undefined,
    });
  };

  const handleUpdateItem = (event: React.FormEvent<HTMLFormElement>, itemId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateItemMutation.mutate({
      itemId,
      payload: {
        name: formData.get('name'),
        initialCost: Number(formData.get('initialCost')),
        estimatedDurationDays: formData.get('estimatedDurationDays')
          ? Number(formData.get('estimatedDurationDays'))
          : undefined,
      },
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce poste ?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleCreateOption = (event: React.FormEvent<HTMLFormElement>, itemId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createOptionMutation.mutate({
      itemId,
      payload: {
        providerName: formData.get('providerName'),
        cost: Number(formData.get('cost')),
        durationDays: formData.get('durationDays')
          ? Number(formData.get('durationDays'))
          : undefined,
        notes: formData.get('notes') || undefined,
      },
    });
  };

  const handleUpdateOption = (
    event: React.FormEvent<HTMLFormElement>,
    itemId: string,
    optionId: string,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateOptionMutation.mutate({
      itemId,
      optionId,
      payload: {
        providerName: formData.get('providerName'),
        cost: Number(formData.get('cost')),
        durationDays: formData.get('durationDays')
          ? Number(formData.get('durationDays'))
          : undefined,
        notes: formData.get('notes') || undefined,
      },
    });
  };

  const handleDeleteOption = (itemId: string, optionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      deleteOptionMutation.mutate({ itemId, optionId });
    }
  };

  const handleActivateOption = (itemId: string, optionId: string) => {
    activateOptionMutation.mutate({ itemId, optionId });
  };

  const totalInitialCost = workItems.reduce((sum, item) => sum + item.initialCost, 0);
  const totalActiveCost = workItems.reduce((sum, item) => {
    const activeOption = item.options.find((opt) => opt.status === 'ACTIVE');
    return sum + (activeOption ? activeOption.cost : item.initialCost);
  }, 0);
  const totalDelta = totalActiveCost - totalInitialCost;

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Décomposition Travaux</h2>
        {!isCreatingItem && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIsCreatingItem(true)}
          >
            + Ajouter un poste
          </button>
        )}
      </div>

      {workItems.length === 0 && !isCreatingItem && (
        <div className="panel stack">
          <p>
            <strong>Budget travaux global : {worksBudget.toLocaleString('fr-FR')} €</strong>
          </p>
          <p style={{ color: '#666' }}>
            💡 Créez des postes de travaux pour :
            <br />• Comparer plusieurs devis par corps de métier
            <br />• Voir l'impact de chaque choix sur la décision
          </p>
        </div>
      )}

      {isCreatingItem && (
        <form onSubmit={handleCreateItem} className="panel stack">
          <h3>Nouveau poste de travaux</h3>
          <div className="field">
            <label htmlFor="create-name">Nom du poste *</label>
            <input
              id="create-name"
              name="name"
              placeholder="Menuiserie, Plomberie, Électricité..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="create-initialCost">Estimation initiale (€) *</label>
            <input
              id="create-initialCost"
              name="initialCost"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="create-estimatedDurationDays">Durée estimée (jours)</label>
            <input
              id="create-estimatedDurationDays"
              name="estimatedDurationDays"
              type="number"
              min="0"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="button" disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? 'Création...' : 'Créer le poste'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsCreatingItem(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {workItems.map((item) => {
        const activeOption = item.options.find((opt) => opt.status === 'ACTIVE');
        const activeCost = activeOption ? activeOption.cost : item.initialCost;
        const delta = activeOption ? activeCost - item.initialCost : 0;

        return (
          <div key={item.id} className="panel stack">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{item.name}</h3>

                {/* Estimation initiale */}
                <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                  <strong>Estimation initiale :</strong>{' '}
                  {item.initialCost.toLocaleString('fr-FR')} €
                  {!activeOption && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓ ACTIF
                    </span>
                  )}
                </div>

                {/* Option active */}
                {activeOption && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                      ✓ Option active : {activeCost.toLocaleString('fr-FR')} € ({activeOption.providerName})
                    </div>
                    {delta !== 0 && (
                      <div style={{ fontSize: '0.875rem', color: delta > 0 ? '#d32f2f' : '#2e7d32', marginTop: '0.25rem' }}>
                        Écart : {delta > 0 ? '+' : ''}{delta.toLocaleString('fr-FR')} €
                        {delta > 0 && ' (surcoût)'}
                        {delta < 0 && ' (économie)'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => setEditingItemId(item.id)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={deleteItemMutation.isPending}
                >
                  Supprimer
                </button>
              </div>
            </div>

            {editingItemId === item.id && (
              <form onSubmit={(e) => handleUpdateItem(e, item.id)} className="stack">
                <div className="field">
                  <label>Nom du poste *</label>
                  <input name="name" defaultValue={item.name} required />
                </div>
                <div className="field">
                  <label>Estimation initiale (€) *</label>
                  <input
                    name="initialCost"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={item.initialCost}
                    required
                  />
                </div>
                <div className="field">
                  <label>Durée estimée (jours)</label>
                  <input
                    name="estimatedDurationDays"
                    type="number"
                    min="0"
                    defaultValue={item.estimatedDurationDays ?? ''}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="button" disabled={updateItemMutation.isPending}>
                    {updateItemMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setEditingItemId(null)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {item.options.length > 0 && (
              <div className="stack" style={{ marginTop: '1rem' }}>
                <h4 style={{ margin: 0 }}>Devis / Options</h4>
                {item.options.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: option.status === 'ACTIVE' ? '#f0fdf4' : 'white',
                    }}
                  >
                    {editingOptionId === option.id ? (
                      <form
                        onSubmit={(e) => handleUpdateOption(e, item.id, option.id)}
                        className="stack"
                      >
                        <div className="field">
                          <label>Artisan / Fournisseur *</label>
                          <input name="providerName" defaultValue={option.providerName} required />
                        </div>
                        <div className="field">
                          <label>Coût (€) *</label>
                          <input
                            name="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={option.cost}
                            required
                          />
                        </div>
                        <div className="field">
                          <label>Délai (jours)</label>
                          <input
                            name="durationDays"
                            type="number"
                            min="0"
                            defaultValue={option.durationDays ?? ''}
                          />
                        </div>
                        <div className="field">
                          <label>Notes</label>
                          <textarea name="notes" rows={2} defaultValue={option.notes ?? ''} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="submit"
                            className="button"
                            disabled={updateOptionMutation.isPending}
                          >
                            {updateOptionMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => setEditingOptionId(null)}
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            {option.status === 'ACTIVE' && (
                              <span
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  background: '#10b981',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  marginRight: '0.5rem',
                                }}
                              >
                                ✓ ACTIF
                              </span>
                            )}
                            {option.status === 'CANDIDATE' && (
                              <span
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  background: '#6b7280',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  marginRight: '0.5rem',
                                }}
                              >
                                ○ Alternative
                              </span>
                            )}
                            <strong>{option.providerName}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {option.status === 'CANDIDATE' && (
                              <button
                                type="button"
                                className="button"
                                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                onClick={() => handleActivateOption(item.id, option.id)}
                                disabled={activateOptionMutation.isPending}
                              >
                                Utiliser cette option
                              </button>
                            )}
                            <button
                              type="button"
                              className="button-secondary"
                              style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => setEditingOptionId(option.id)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => handleDeleteOption(item.id, option.id)}
                              disabled={deleteOptionMutation.isPending}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0' }}>
                          Coût : {option.cost.toLocaleString('fr-FR')} €
                          {option.durationDays && ` • Délai : ${option.durationDays} jours`}
                        </p>
                        {option.notes && (
                          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>{option.notes}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {creatingOptionForItemId === item.id ? (
              <form onSubmit={(e) => handleCreateOption(e, item.id)} className="stack">
                <h4>Nouveau devis</h4>
                <div className="field">
                  <label>Artisan / Fournisseur *</label>
                  <input name="providerName" placeholder="Ex: Menuiserie Dupont" required />
                </div>
                <div className="field">
                  <label>Coût (€) *</label>
                  <input name="cost" type="number" min="0" step="0.01" required />
                </div>
                <div className="field">
                  <label>Délai (jours)</label>
                  <input name="durationDays" type="number" min="0" />
                </div>
                <div className="field">
                  <label>Notes</label>
                  <textarea name="notes" rows={2} placeholder="Ex: Devis reçu le 15/03" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    className="button"
                    disabled={createOptionMutation.isPending}
                  >
                    {createOptionMutation.isPending ? 'Ajout...' : 'Ajouter ce devis'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setCreatingOptionForItemId(null)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="button-secondary"
                style={{ marginTop: '1rem' }}
                onClick={() => setCreatingOptionForItemId(item.id)}
              >
                + Ajouter un devis
              </button>
            )}
          </div>
        );
      })}

      {workItems.length > 0 && (
        <div className="panel" style={{ background: '#f5f5f5', borderLeft: '4px solid #4caf50' }}>
          <h3 style={{ marginTop: 0 }}>💰 Synthèse des travaux</h3>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Coût initial total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {totalInitialCost.toLocaleString('fr-FR')} €
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Coût actif total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                {totalActiveCost.toLocaleString('fr-FR')} €
              </div>
            </div>

            {totalDelta !== 0 && (
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Écart global</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: totalDelta > 0 ? '#d32f2f' : '#2e7d32',
                  }}
                >
                  {totalDelta > 0 ? '+' : ''}{totalDelta.toLocaleString('fr-FR')} €
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  {totalDelta > 0 && 'Surcoût'}
                  {totalDelta < 0 && 'Économie'}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
            <strong>Détail par poste :</strong>
            <div style={{ marginTop: '0.5rem' }}>
              {workItems.map((item) => {
                const activeOption = item.options.find((opt) => opt.status === 'ACTIVE');
                const cost = activeOption ? activeOption.cost : item.initialCost;
                const source = activeOption
                  ? activeOption.providerName
                  : 'estimation initiale';
                return (
                  <div key={item.id} style={{ color: '#666', marginBottom: '0.25rem' }}>
                    • {item.name} : {cost.toLocaleString('fr-FR')} € ({source})
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
