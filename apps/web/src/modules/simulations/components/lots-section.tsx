import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth-context';
import {
  listSimulationLots,
  createSimulationLot,
  updateSimulationLot,
  deleteSimulationLot,
  getSimulation,
} from '../api';
import { formatCurrency } from '../../../shared/ui/formatters';

interface LotsSectionProps {
  simulationId: string;
}

type LotFormValues = {
  name: string;
  type: string;
  surface: string;
  estimatedRent: string;
  notes: string;
};

type LotFormErrors = Partial<Record<keyof LotFormValues, string>>;

interface CreateLotFormCardProps {
  isSubmitting: boolean;
  totalExistingRent: number;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}

function getLotTypeLabel(type: string | null | undefined): string {
  const labels: Record<string, string> = {
    APARTMENT: 'Appartement',
    GARAGE: 'Garage',
    CELLAR: 'Cave',
    OTHER: 'Autre',
  };
  return type ? labels[type] || type : '';
}

function parseOptionalNumber(value: string): number | undefined {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number.parseFloat(normalizedValue);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

function buildLotPayload(values: LotFormValues): Record<string, unknown> {
  return {
    name: values.name,
    type: values.type || undefined,
    surface: parseOptionalNumber(values.surface),
    estimatedRent: parseOptionalNumber(values.estimatedRent),
    notes: values.notes || undefined,
  };
}

function validateCreateLotForm(values: LotFormValues): LotFormErrors {
  const errors: LotFormErrors = {};
  const surfaceValue = parseOptionalNumber(values.surface);
  const rentValue = parseOptionalNumber(values.estimatedRent);

  if (!values.name.trim()) {
    errors.name = 'Le nom du lot est obligatoire.';
  }

  if (!values.estimatedRent.trim()) {
    errors.estimatedRent = 'Le loyer mensuel estimé est obligatoire.';
  } else if (rentValue === undefined || rentValue < 0) {
    errors.estimatedRent = 'Saisissez un loyer valide.';
  }

  if (values.surface.trim() && (surfaceValue === undefined || surfaceValue < 0)) {
    errors.surface = 'Saisissez une surface valide.';
  }

  return errors;
}

function CreateLotFormCard({
  isSubmitting,
  totalExistingRent,
  onCancel,
  onSubmit,
}: CreateLotFormCardProps) {
  const [values, setValues] = useState<LotFormValues>({
    name: '',
    type: '',
    surface: '',
    estimatedRent: '',
    notes: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof LotFormValues, boolean>>>({});
  const [focusedField, setFocusedField] = useState<keyof LotFormValues | null>(null);

  const errors = validateCreateLotForm(values);
  const isFormValid = Object.keys(errors).length === 0;
  const estimatedRentValue = parseOptionalNumber(values.estimatedRent) ?? 0;
  const liveRentTotal = totalExistingRent + estimatedRentValue;

  const handleChange =
    (field: keyof LotFormValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const nextValue = event.target.value;

      setValues((currentValues) => ({
        ...currentValues,
        [field]: nextValue,
      }));
    };

  const handleBlur = (field: keyof LotFormValues) => () => {
    setFocusedField(null);
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  };

  const getFieldError = (field: keyof LotFormValues) =>
    touched[field] ? errors[field] : undefined;

  const getInputStyle = (field: keyof LotFormValues, isTextarea = false) => {
    const hasError = Boolean(getFieldError(field));
    const isFocused = focusedField === field;

    return {
      width: '100%',
      minHeight: isTextarea ? 112 : 42,
      padding: isTextarea ? '12px 14px' : '10px 14px',
      borderRadius: 12,
      border: `1px solid ${
        hasError ? '#ef4444' : isFocused ? '#111827' : '#d1d5db'
      }`,
      background: '#ffffff',
      color: '#111827',
      outline: 'none',
      resize: isTextarea ? 'vertical' : undefined,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: isFocused
        ? '0 0 0 4px rgba(17, 24, 39, 0.08)'
        : hasError
          ? '0 0 0 4px rgba(239, 68, 68, 0.08)'
          : 'none',
    } as const;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      name: true,
      estimatedRent: true,
      surface: true,
      type: true,
      notes: true,
    });

    if (!isFormValid) {
      return;
    }

    onSubmit(buildLotPayload(values));
  };

  return (
    <section
      className="panel"
      style={{
        width: '100%',
        maxWidth: 680,
        padding: 28,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: 'none',
      }}
    >
      <div style={{ display: 'grid', gap: 6, marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Ajouter un lot</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
          Définissez les caractéristiques pour calculer les revenus locatifs.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: 28 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              paddingTop: 0,
              borderTop: 'none',
            }}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <div
                  style={{
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                  }}
                >
                  Informations
                </div>

                <div style={{ display: 'grid', gap: 18 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <label
                      htmlFor="new-simulation-lot-name"
                      style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111827' }}
                    >
                      Nom du lot
                    </label>
                    <input
                      id="new-simulation-lot-name"
                      name="name"
                      type="text"
                      value={values.name}
                      placeholder="Appartement T2, Garage..."
                      onChange={handleChange('name')}
                      onFocus={() => setFocusedField('name')}
                      onBlur={handleBlur('name')}
                      aria-invalid={Boolean(getFieldError('name'))}
                      style={getInputStyle('name')}
                    />
                    {getFieldError('name') && (
                      <span style={{ fontSize: '0.84rem', color: '#dc2626' }}>
                        {getFieldError('name')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <label
                      htmlFor="new-simulation-lot-type"
                      style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111827' }}
                    >
                      Type
                    </label>
                    <select
                      id="new-simulation-lot-type"
                      name="type"
                      value={values.type}
                      onChange={handleChange('type')}
                      onFocus={() => setFocusedField('type')}
                      onBlur={handleBlur('type')}
                      style={getInputStyle('type')}
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="APARTMENT">Appartement</option>
                      <option value="GARAGE">Garage</option>
                      <option value="CELLAR">Cave</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                style={{
                  paddingTop: 24,
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                  }}
                >
                  Données financières
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 18,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <label
                      htmlFor="new-simulation-lot-surface"
                      style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111827' }}
                    >
                      Surface (m²)
                    </label>
                    <input
                      id="new-simulation-lot-surface"
                      name="surface"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={values.surface}
                      placeholder="Ex: 45"
                      onChange={handleChange('surface')}
                      onFocus={() => setFocusedField('surface')}
                      onBlur={handleBlur('surface')}
                      aria-invalid={Boolean(getFieldError('surface'))}
                      style={getInputStyle('surface')}
                    />
                    {getFieldError('surface') && (
                      <span style={{ fontSize: '0.84rem', color: '#dc2626' }}>
                        {getFieldError('surface')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <label
                      htmlFor="new-simulation-lot-rent"
                      style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111827' }}
                    >
                      Loyer mensuel estimé (€)
                    </label>
                    <input
                      id="new-simulation-lot-rent"
                      name="estimatedRent"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={values.estimatedRent}
                      placeholder="Ex: 650"
                      onChange={handleChange('estimatedRent')}
                      onFocus={() => setFocusedField('estimatedRent')}
                      onBlur={handleBlur('estimatedRent')}
                      aria-invalid={Boolean(getFieldError('estimatedRent'))}
                      style={getInputStyle('estimatedRent')}
                    />
                    {getFieldError('estimatedRent') && (
                      <span style={{ fontSize: '0.84rem', color: '#dc2626' }}>
                        {getFieldError('estimatedRent')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  paddingTop: 24,
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                  }}
                >
                  Optionnel
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="new-simulation-lot-notes"
                    style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111827' }}
                  >
                    Notes
                  </label>
                  <textarea
                    id="new-simulation-lot-notes"
                    name="notes"
                    value={values.notes}
                    placeholder="Ajoutez un contexte utile pour ce lot si nécessaire."
                    onChange={handleChange('notes')}
                    onFocus={() => setFocusedField('notes')}
                    onBlur={handleBlur('notes')}
                    style={getInputStyle('notes', true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {values.estimatedRent.trim() && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Total des loyers estimés après ajout
            </span>
            <strong style={{ fontSize: '1rem', color: '#111827' }}>
              {formatCurrency(liveRentTotal)}/mois
            </strong>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              minWidth: 120,
              minHeight: 42,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              color: '#111827',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            style={{
              minWidth: 148,
              minHeight: 42,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #111827',
              background: '#111827',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter le lot'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function LotsSection({ simulationId }: LotsSectionProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);

  const lotsQuery = useQuery({
    queryKey: ['simulation-lots', simulationId],
    queryFn: () => listSimulationLots(session, simulationId),
  });

  const simulationQuery = useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: () => getSimulation(session, simulationId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createSimulationLot(session, simulationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation-lots', simulationId] });
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      alert(error.message || 'Erreur lors de la création du lot');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      lotId,
      payload,
    }: {
      lotId: string;
      payload: Record<string, unknown>;
    }) => updateSimulationLot(session, simulationId, lotId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation-lots', simulationId] });
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
      setEditingLotId(null);
    },
    onError: (error: Error) => {
      alert(error.message || 'Erreur lors de la mise à jour du lot');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (lotId: string) =>
      deleteSimulationLot(session, simulationId, lotId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulation-lots', simulationId] });
      void queryClient.invalidateQueries({ queryKey: ['simulation', simulationId] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Erreur lors de la suppression du lot');
    },
  });

  const lots = lotsQuery.data ?? [];
  const simulation = simulationQuery.data;

  // Calcul du loyer actif et de la source
  const lotsWithRent = lots.filter((lot) => (lot.estimatedRent ?? 0) > 0);
  const hasLotsWithRent = lotsWithRent.length > 0;
  const totalRentFromLots = hasLotsWithRent
    ? lots.reduce((sum, lot) => sum + (lot.estimatedRent ?? 0), 0)
    : 0;
  const manualRent = simulation?.targetMonthlyRent ?? 0;

  const activeRent = hasLotsWithRent ? totalRentFromLots : manualRent;
  const activeRentSource = hasLotsWithRent
    ? `LOTS (${lots.length} définis)`
    : 'INITIAL (loyer manuel)';

  const handleUpdateSubmit = (lotId: string) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {
      name: formData.get('name'),
      type: formData.get('type') || undefined,
      surface: formData.get('surface')
        ? parseFloat(formData.get('surface') as string)
        : undefined,
      estimatedRent: formData.get('estimatedRent')
        ? parseFloat(formData.get('estimatedRent') as string)
        : undefined,
      notes: formData.get('notes') || undefined,
    };

    updateMutation.mutate({ lotId, payload });
  };

  const handleDelete = (lotId: string) => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible.'
      )
    ) {
      deleteMutation.mutate(lotId);
    }
  };

  if (lotsQuery.isLoading || simulationQuery.isLoading) {
    return <div>Chargement...</div>;
  }

  if (lotsQuery.isError) {
    return <div>Erreur lors du chargement des lots.</div>;
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Lots Immobiliers</h2>
        {!isCreating && lots.length > 0 && (
          <button
            type="button"
            className="button"
            onClick={() => setIsCreating(true)}
          >
            + Ajouter un lot
          </button>
        )}
      </div>

      {lots.length === 0 && !isCreating && (
        <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🏢</div>
          </div>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Aucun lot défini pour cette simulation
          </div>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
            Définissez la structure de lots (appartements, garages, caves) pour calculer
            automatiquement le loyer total et anticiper la structure du projet réel.
          </p>
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              maxWidth: '400px',
              margin: '1.5rem auto',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              Loyer actif actuel : {formatCurrency(manualRent)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Source : Loyer manuel saisi dans le formulaire
            </div>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setIsCreating(true)}
          >
            + Ajouter un lot
          </button>
        </div>
      )}

      {isCreating && (
        <CreateLotFormCard
          isSubmitting={createMutation.isPending}
          totalExistingRent={totalRentFromLots}
          onCancel={() => setIsCreating(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      )}

      {lots.length > 0 && (
        <div
          className="panel"
          style={{ background: '#f5f5f5', borderLeft: '4px solid #4caf50' }}
        >
          <h3 style={{ marginTop: 0 }}>💰 Loyer total actif</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {formatCurrency(activeRent)}/mois
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
            Source : {activeRentSource}
          </div>

          {hasLotsWithRent && (
            <>
              <div style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                <strong>Détail par lot :</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {lots.map((lot) => {
                    const hasRent = (lot.estimatedRent ?? 0) > 0;
                    return (
                      <li key={lot.id}>
                        {lot.name} : {formatCurrency(lot.estimatedRent ?? 0)}/mois
                        {!hasRent && (
                          <span style={{ color: '#999', marginLeft: '0.5rem' }}>
                            (non renseigné)
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {lots.some((lot) => (lot.estimatedRent ?? 0) === 0) && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#e3f2fd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: '#1976d2',
                  }}
                >
                  ℹ️ {lotsWithRent.length} lot(s) contribuent au loyer actif,{' '}
                  {lots.length - lotsWithRent.length} lot(s) sans loyer renseigné
                </div>
              )}

              {manualRent > 0 && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#fff3cd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  ⚠️ Loyer manuel ({formatCurrency(manualRent)}) ignoré car des lots
                  sont définis
                </div>
              )}
            </>
          )}
        </div>
      )}

      {lots.map((lot) =>
        editingLotId === lot.id ? (
          <div key={lot.id} className="panel">
            <h3>Modifier le lot</h3>
            <form onSubmit={handleUpdateSubmit(lot.id)}>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor={`name-${lot.id}`}>
                    Nom <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id={`name-${lot.id}`}
                    name="name"
                    required
                    defaultValue={lot.name}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`type-${lot.id}`}>Type</label>
                  <select id={`type-${lot.id}`} name="type" defaultValue={lot.type ?? ''}>
                    <option value="">-- Sélectionner --</option>
                    <option value="APARTMENT">Appartement</option>
                    <option value="GARAGE">Garage</option>
                    <option value="CELLAR">Cave</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor={`surface-${lot.id}`}>Surface (m²)</label>
                  <input
                    type="number"
                    id={`surface-${lot.id}`}
                    name="surface"
                    step="0.01"
                    min="0"
                    defaultValue={lot.surface ?? ''}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`estimatedRent-${lot.id}`}>
                    Loyer estimé (€/mois)
                  </label>
                  <input
                    type="number"
                    id={`estimatedRent-${lot.id}`}
                    name="estimatedRent"
                    step="0.01"
                    min="0"
                    defaultValue={lot.estimatedRent ?? ''}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor={`notes-${lot.id}`}>Notes</label>
                <textarea
                  id={`notes-${lot.id}`}
                  name="notes"
                  rows={2}
                  defaultValue={lot.notes ?? ''}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="button"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditingLotId(null)}
                  disabled={updateMutation.isPending}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div key={lot.id} className="panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      background: '#4caf50',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓ ACTIF
                  </span>
                  <h3 style={{ margin: 0 }}>{lot.name}</h3>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    color: '#666',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {lot.type && <span>Type : {getLotTypeLabel(lot.type)}</span>}
                  {lot.surface && <span>{lot.surface} m²</span>}
                  {lot.estimatedRent && (
                    <span>Loyer estimé : {formatCurrency(lot.estimatedRent)}/mois</span>
                  )}
                </div>
                {lot.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    {lot.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditingLotId(lot.id)}
                  disabled={deleteMutation.isPending}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleDelete(lot.id)}
                  disabled={deleteMutation.isPending}
                  style={{ color: '#d32f2f' }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )
      )}

      
    </div>
  );
}
