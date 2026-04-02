import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import {
  listOpportunityEvents,
  createOpportunityEvent,
  updateOpportunityEvent,
  deleteOpportunityEvent,
  createOptionGroup,
  createOption,
  getOptionGroups,
  type SimulationOptionGroupType,
  type OpportunityEvent,
} from '../api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';

type OpportunityJournalProps = {
  simulationId: string;
};

type OptionCreationState = {
  event: OpportunityEvent | null;
  type: SimulationOptionGroupType | null;
  allowTypeSelection: boolean;
};

type OptionDraftValues = {
  price: number | null;
  cost: number | null;
  rate: number | null;
  durationMonths: number | null;
  loanAmount: number | null;
};

const EVENT_TYPES = [
  { value: 'NEGOTIATION_PRICE', label: 'Négociation prix' },
  { value: 'BANK_FINANCING_QUOTE', label: 'Devis financement banque' },
  { value: 'VISIT_NOTE', label: 'Note de visite' },
  { value: 'RISK_ALERT', label: 'Alerte risque' },
  { value: 'ASSUMPTION_CHANGE', label: 'Changement hypothèse' },
  { value: 'OTHER', label: 'Autre' },
] as const;

const OPTION_TYPE_LABELS: Record<SimulationOptionGroupType, string> = {
  PURCHASE_PRICE: "Prix d'achat",
  WORK_BUDGET: 'Travaux',
  FINANCING: 'Financement',
};

const OPTION_TYPE_SHORT_LABELS: Record<SimulationOptionGroupType, string> = {
  PURCHASE_PRICE: 'Prix',
  WORK_BUDGET: 'Travaux',
  FINANCING: 'Financement',
};

const AUTO_OPTION_TYPE_BY_EVENT: Partial<
  Record<OpportunityEvent['type'], SimulationOptionGroupType>
> = {
  NEGOTIATION_PRICE: 'PURCHASE_PRICE',
  BANK_FINANCING_QUOTE: 'FINANCING',
};

const EMPTY_OPTION_DRAFT_VALUES: OptionDraftValues = {
  price: null,
  cost: null,
  rate: null,
  durationMonths: null,
  loanAmount: null,
};

function parseLocalizedNumber(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  let normalizedValue = rawValue
    .trim()
    .toLowerCase()
    .replace(/€/g, '')
    .replace(/euros?/g, '')
    .replace(/\s+/g, '');

  if (!normalizedValue) {
    return null;
  }

  let multiplier = 1;

  if (normalizedValue.endsWith('k')) {
    multiplier = 1_000;
    normalizedValue = normalizedValue.slice(0, -1);
  } else if (normalizedValue.endsWith('m')) {
    multiplier = 1_000_000;
    normalizedValue = normalizedValue.slice(0, -1);
  }

  if (normalizedValue.includes(',') && normalizedValue.includes('.')) {
    if (normalizedValue.lastIndexOf(',') > normalizedValue.lastIndexOf('.')) {
      normalizedValue = normalizedValue.replace(/\./g, '').replace(',', '.');
    } else {
      normalizedValue = normalizedValue.replace(/,/g, '');
    }
  } else if (normalizedValue.includes(',')) {
    const lastCommaIndex = normalizedValue.lastIndexOf(',');
    const decimalDigits = normalizedValue.length - lastCommaIndex - 1;
    normalizedValue =
      decimalDigits === 3
        ? normalizedValue.replace(/,/g, '')
        : normalizedValue.replace(',', '.');
  } else if (normalizedValue.includes('.')) {
    const lastDotIndex = normalizedValue.lastIndexOf('.');
    const decimalDigits = normalizedValue.length - lastDotIndex - 1;
    if (decimalDigits === 3) {
      normalizedValue = normalizedValue.replace(/\./g, '');
    }
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue * multiplier;
}

function extractAmountFromText(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const amount = parseLocalizedNumber(
      `${match[1] ?? ''}${match[2] ?? ''}`,
    );
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

function extractPercentFromText(text: string) {
  const patterns = [
    /(?:taux|rate)[^\d]{0,10}(\d[\d.,]*)\s*%/i,
    /(\d[\d.,]*)\s*%/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const rate = parseLocalizedNumber(match?.[1]);
    if (rate !== null) {
      return rate;
    }
  }

  return null;
}

function extractDurationMonthsFromText(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    const unit = match[2]?.toLowerCase() ?? '';
    if (unit.startsWith('mois')) {
      return value;
    }

    return value * 12;
  }

  return null;
}

function getDraftValuesFromDescription(
  type: SimulationOptionGroupType,
  description?: string | null,
): OptionDraftValues {
  if (!description?.trim()) {
    return EMPTY_OPTION_DRAFT_VALUES;
  }

  const text = description.trim();

  if (type === 'PURCHASE_PRICE') {
    return {
      ...EMPTY_OPTION_DRAFT_VALUES,
      price: extractAmountFromText(text, [
        /(?:prix|offre|achat|proposition|contre[- ]offre|n[ée]gociation|n[ée]go)[^\d]{0,20}(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)?/i,
        /(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)\b/i,
      ]),
    };
  }

  if (type === 'WORK_BUDGET') {
    return {
      ...EMPTY_OPTION_DRAFT_VALUES,
      cost: extractAmountFromText(text, [
        /(?:travaux|devis|budget|co[uû]t|artisan|montant)[^\d]{0,20}(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)?/i,
        /(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)\b/i,
      ]),
      durationMonths: extractDurationMonthsFromText(text, [
        /(?:dur[eé]e|chantier|travaux)[^\d]{0,12}(\d{1,3})\s*(ans?|ann[ée]es?|mois)\b/i,
        /(\d{1,3})\s*(ans?|ann[ée]es?|mois)\b/i,
      ]),
    };
  }

  return {
    ...EMPTY_OPTION_DRAFT_VALUES,
    rate: extractPercentFromText(text),
    durationMonths: extractDurationMonthsFromText(text, [
      /(?:dur[eé]e|sur|cr[eé]dit|pr[eê]t)[^\d]{0,12}(\d{1,3})\s*(ans?|ann[ée]es?|mois)\b/i,
      /(\d{1,3})\s*(ans?|ann[ée]es?|mois)\b/i,
    ]),
    loanAmount: extractAmountFromText(text, [
      /(?:montant|emprunt|pr[eê]t|financement|capital)[^\d]{0,20}(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)?/i,
      /(\d[\d\s.,]*)(k|m)?\s*(?:€|euros?|eur)\b/i,
    ]),
  };
}

function buildOptionValueJson(
  type: SimulationOptionGroupType,
  formData: FormData,
) {
  const getNumber = (fieldName: string) =>
    parseLocalizedNumber(formData.get(fieldName)?.toString());

  if (type === 'PURCHASE_PRICE') {
    const price = getNumber('price');

    return {
      hasValue: price !== null,
      valueJson: price !== null ? { price } : {},
    };
  }

  if (type === 'WORK_BUDGET') {
    const cost = getNumber('cost');
    const durationMonths = getNumber('durationMonths');
    const valueJson: Record<string, unknown> = {};

    if (cost !== null) {
      valueJson.cost = cost;
    }

    if (durationMonths !== null) {
      valueJson.durationMonths = durationMonths;
    }

    return {
      hasValue: cost !== null || durationMonths !== null,
      valueJson,
    };
  }

  const rate = getNumber('rate');
  const durationMonths = getNumber('durationMonths');
  const loanAmount = getNumber('loanAmount');
  const valueJson: Record<string, unknown> = {};

  if (rate !== null) {
    valueJson.rate = rate;
  }

  if (durationMonths !== null) {
    valueJson.durationMonths = durationMonths;
  }

  if (loanAmount !== null) {
    valueJson.loanAmount = loanAmount;
  }

  if (rate !== null || durationMonths !== null || loanAmount !== null) {
    valueJson.mode = 'LOAN';
  }

  return {
    hasValue: rate !== null || durationMonths !== null || loanAmount !== null,
    valueJson,
  };
}

export function OpportunityJournal({ simulationId }: OpportunityJournalProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [optionCreationState, setOptionCreationState] = useState<OptionCreationState | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['opportunity-events', simulationId],
    queryFn: () => listOpportunityEvents(session, simulationId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createOpportunityEvent(session, simulationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['opportunity-events', simulationId],
      });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: Record<string, unknown>;
    }) => updateOpportunityEvent(session, simulationId, eventId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['opportunity-events', simulationId],
      });
      setEditingEventId(null);
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      deleteOpportunityEvent(session, simulationId, eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['opportunity-events', simulationId],
      });
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: async (payload: {
      type: SimulationOptionGroupType;
      label?: string;
      valueJson: Record<string, unknown>;
      sourceEventId?: string;
    }) => {
      // Récupérer ou créer le groupe
      const groups = await getOptionGroups(session, simulationId);
      let group = groups.find((g) => g.type === payload.type);

      if (!group) {
        group = await createOptionGroup(session, simulationId, {
          type: payload.type,
          label: OPTION_TYPE_LABELS[payload.type],
        });
      }

      const resolvedLabel =
        payload.label?.trim() ||
        `${OPTION_TYPE_LABELS[payload.type]} ${group.options.length + 1}`;

      // Créer l'option
      return createOption(session, simulationId, {
        groupId: group.id,
        label: resolvedLabel,
        valueJson: payload.valueJson,
        source: payload.sourceEventId ? 'FROM_EVENT' : 'MANUAL',
        sourceEventId: payload.sourceEventId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['option-groups', simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['option-group-comparison', simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['simulation', simulationId],
      });
      setOptionCreationState(null);
      alert('Option créée avec succès');
    },
    onError: (error: Error) => {
      alert(error.message || 'Une erreur est survenue');
    },
  });

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createMutation.mutate({
      type: formData.get('type'),
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      eventDate: formData.get('eventDate'),
      impact: formData.get('impact') || undefined,
    });
  };

  const handleUpdateSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    eventId: string,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateMutation.mutate({
      eventId,
      payload: {
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        eventDate: formData.get('eventDate'),
        impact: formData.get('impact') || undefined,
      },
    });
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteMutation.mutate(eventId);
    }
  };

  const openOptionCreationFromEvent = (event: OpportunityEvent) => {
    const inferredType = AUTO_OPTION_TYPE_BY_EVENT[event.type] ?? null;

    setOptionCreationState({
      event,
      type: inferredType,
      allowTypeSelection: inferredType === null,
    });
  };

  const openManualOptionCreation = (type: SimulationOptionGroupType) => {
    setOptionCreationState({
      event: null,
      type,
      allowTypeSelection: false,
    });
  };

  if (eventsQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (eventsQuery.isError) {
    return <ErrorState error={eventsQuery.error} title="Erreur de chargement" />;
  }

  const events = eventsQuery.data ?? [];
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  const selectedOptionType = optionCreationState?.type ?? null;
  const draftValues =
    selectedOptionType !== null
      ? getDraftValuesFromDescription(
          selectedOptionType,
          optionCreationState?.event?.description,
        )
      : EMPTY_OPTION_DRAFT_VALUES;
  const optionFormKey = optionCreationState
    ? `${optionCreationState.event?.id ?? 'manual'}-${optionCreationState.type ?? 'choose'}`
    : 'closed';

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Journal d'opportunité</h2>
        {!isCreating && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIsCreating(true)}
          >
            + Ajouter un événement
          </button>
        )}
      </div>

      <div
        style={{
          padding: '1rem',
          background: '#e3f2fd',
          borderLeft: '4px solid #2196f3',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          ℹ️ Rôle du journal
        </div>
        <p style={{ margin: 0, color: '#555', lineHeight: '1.5' }}>
          Les événements du journal documentent chronologiquement le contexte de l'opportunité
          (visites, négociations, échanges) mais <strong>ne modifient pas</strong> les hypothèses
          actives utilisées dans le calcul décisionnel. Pour changer les valeurs qui alimentent
          le score et les métriques, utilisez les onglets <strong>Lots</strong> et{' '}
          <strong>Travaux</strong>.
        </p>
      </div>

      <div
        className="panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 600 }}>Créer une option rapide :</div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => openManualOptionCreation('PURCHASE_PRICE')}
        >
          Prix
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => openManualOptionCreation('WORK_BUDGET')}
        >
          Travaux
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => openManualOptionCreation('FINANCING')}
        >
          Financement
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="panel stack">
          <h3>Nouvel événement</h3>
          <div className="field">
            <label htmlFor="create-type">Type *</label>
            <select id="create-type" name="type" required>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="create-title">Titre *</label>
            <input id="create-title" name="title" maxLength={200} required />
          </div>
          <div className="field">
            <label htmlFor="create-eventDate">Date *</label>
            <input
              id="create-eventDate"
              name="eventDate"
              type="date"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="create-description">Description</label>
            <textarea id="create-description" name="description" rows={3} />
          </div>
          <div className="field">
            <label htmlFor="create-impact">Impact</label>
            <input
              id="create-impact"
              name="impact"
              maxLength={500}
              placeholder="Ex: Prix réduit de 10k€"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              className="button"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsCreating(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Modal création option depuis événement */}
      {optionCreationState && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setOptionCreationState(null)}
        >
          <div
            className="panel stack"
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {selectedOptionType
                ? `Créer une option ${OPTION_TYPE_SHORT_LABELS[selectedOptionType].toLowerCase()}`
                : 'Choisir le type d’option'}
            </h3>

            {optionCreationState.event && (
              <div
                style={{
                  padding: '0.75rem',
                  background: '#f6f8fa',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <strong>{optionCreationState.event.title}</strong>
                <div style={{ color: '#666', marginTop: '0.25rem' }}>
                  {EVENT_TYPES.find((eventType) => eventType.value === optionCreationState.event?.type)
                    ?.label ?? optionCreationState.event.type}
                  {' • '}
                  {new Date(optionCreationState.event.eventDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {selectedOptionType === null ? (
              <div className="stack" style={{ gap: '0.75rem' }}>
                <p style={{ margin: 0, color: '#666' }}>
                  Choisissez simplement la donnée à transformer en option.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() =>
                      setOptionCreationState((current) =>
                        current
                          ? {
                              ...current,
                              type: 'PURCHASE_PRICE',
                            }
                          : current,
                      )
                    }
                  >
                    Prix
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() =>
                      setOptionCreationState((current) =>
                        current
                          ? {
                              ...current,
                              type: 'WORK_BUDGET',
                            }
                          : current,
                      )
                    }
                  >
                    Travaux
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() =>
                      setOptionCreationState((current) =>
                        current
                          ? {
                              ...current,
                              type: 'FINANCING',
                            }
                          : current,
                      )
                    }
                  >
                    Financement
                  </button>
                </div>
              </div>
            ) : (
              <form
                key={optionFormKey}
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const { hasValue, valueJson } = buildOptionValueJson(
                    selectedOptionType,
                    formData,
                  );

                  if (!hasValue) {
                    alert('Renseignez au moins une valeur avant de créer cette option.');
                    return;
                  }

                  createOptionMutation.mutate({
                    type: selectedOptionType,
                    label: optionCreationState.event?.title,
                    valueJson,
                    sourceEventId: optionCreationState.event?.id,
                  });
                }}
              >
                {optionCreationState.allowTypeSelection && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={
                        selectedOptionType === 'PURCHASE_PRICE'
                          ? 'button'
                          : 'button-secondary'
                      }
                      onClick={() =>
                        setOptionCreationState((current) =>
                          current
                            ? {
                                ...current,
                                type: 'PURCHASE_PRICE',
                              }
                            : current,
                        )
                      }
                    >
                      Prix
                    </button>
                    <button
                      type="button"
                      className={
                        selectedOptionType === 'WORK_BUDGET'
                          ? 'button'
                          : 'button-secondary'
                      }
                      onClick={() =>
                        setOptionCreationState((current) =>
                          current
                            ? {
                                ...current,
                                type: 'WORK_BUDGET',
                              }
                            : current,
                        )
                      }
                    >
                      Travaux
                    </button>
                    <button
                      type="button"
                      className={
                        selectedOptionType === 'FINANCING'
                          ? 'button'
                          : 'button-secondary'
                      }
                      onClick={() =>
                        setOptionCreationState((current) =>
                          current
                            ? {
                                ...current,
                                type: 'FINANCING',
                              }
                            : current,
                        )
                      }
                    >
                      Financement
                    </button>
                  </div>
                )}

                {selectedOptionType === 'PURCHASE_PRICE' && (
                  <div className="field">
                    <label htmlFor="option-price">Prix (€)</label>
                    <input
                      id="option-price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={draftValues.price ?? ''}
                      placeholder="Ex: 240000"
                      autoFocus
                    />
                  </div>
                )}

                {selectedOptionType === 'WORK_BUDGET' && (
                  <>
                    <div className="field">
                      <label htmlFor="option-cost">Coût (€)</label>
                      <input
                        id="option-cost"
                        name="cost"
                        type="number"
                        step="0.01"
                        defaultValue={draftValues.cost ?? ''}
                        placeholder="Ex: 45000"
                        autoFocus
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="option-work-duration">Durée (mois)</label>
                      <input
                        id="option-work-duration"
                        name="durationMonths"
                        type="number"
                        defaultValue={draftValues.durationMonths ?? ''}
                        placeholder="Ex: 6"
                      />
                    </div>
                  </>
                )}

                {selectedOptionType === 'FINANCING' && (
                  <>
                    <div className="field">
                      <label htmlFor="option-rate">Taux (%)</label>
                      <input
                        id="option-rate"
                        name="rate"
                        type="number"
                        step="0.01"
                        defaultValue={draftValues.rate ?? ''}
                        placeholder="Ex: 2.8"
                        autoFocus
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="option-duration">Durée (mois)</label>
                      <input
                        id="option-duration"
                        name="durationMonths"
                        type="number"
                        defaultValue={draftValues.durationMonths ?? ''}
                        placeholder="Ex: 240"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="option-loanAmount">Montant (€)</label>
                      <input
                        id="option-loanAmount"
                        name="loanAmount"
                        type="number"
                        step="0.01"
                        defaultValue={draftValues.loanAmount ?? ''}
                        placeholder="Ex: 200000"
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    className="button"
                    disabled={createOptionMutation.isPending}
                  >
                    {createOptionMutation.isPending ? 'Création...' : 'Créer l\'option'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setOptionCreationState(null)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {sortedEvents.length === 0 && !isCreating && (
        <p style={{ color: '#666' }}>Aucun événement enregistré.</p>
      )}

      {sortedEvents.map((evt) => (
        <div key={evt.id}>
          {editingEventId === evt.id ? (
            <form
              onSubmit={(e) => handleUpdateSubmit(e, evt.id)}
              className="panel stack"
            >
              <h3>Modifier l'événement</h3>
              <div className="field">
                <label htmlFor={`edit-type-${evt.id}`}>Type *</label>
                <select
                  id={`edit-type-${evt.id}`}
                  name="type"
                  defaultValue={evt.type}
                  required
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`edit-title-${evt.id}`}>Titre *</label>
                <input
                  id={`edit-title-${evt.id}`}
                  name="title"
                  defaultValue={evt.title}
                  maxLength={200}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`edit-eventDate-${evt.id}`}>Date *</label>
                <input
                  id={`edit-eventDate-${evt.id}`}
                  name="eventDate"
                  type="date"
                  defaultValue={evt.eventDate.split('T')[0]}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor={`edit-description-${evt.id}`}>
                  Description
                </label>
                <textarea
                  id={`edit-description-${evt.id}`}
                  name="description"
                  defaultValue={evt.description ?? ''}
                  rows={3}
                />
              </div>
              <div className="field">
                <label htmlFor={`edit-impact-${evt.id}`}>Impact</label>
                <input
                  id={`edit-impact-${evt.id}`}
                  name="impact"
                  defaultValue={evt.impact ?? ''}
                  maxLength={500}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  className="button"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditingEventId(null)}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {EVENT_TYPES.find((t) => t.value === evt.type)?.label ??
                      evt.type}{' '}
                    • {new Date(evt.eventDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => openOptionCreationFromEvent(evt)}
                  >
                    {AUTO_OPTION_TYPE_BY_EVENT[evt.type]
                      ? `➕ Option ${OPTION_TYPE_SHORT_LABELS[AUTO_OPTION_TYPE_BY_EVENT[evt.type]!].toLowerCase()}`
                      : '➕ Créer option'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => setEditingEventId(evt.id)}
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => handleDelete(evt.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              {evt.description && (
                <p style={{ margin: '0.5rem 0' }}>{evt.description}</p>
              )}
              {evt.impact && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Impact :</strong> {evt.impact}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
