import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/auth-context';
import { createLot, listLots, updateLot, type Lot } from '../../projects/api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { EmptyState } from '../../../shared/ui/empty-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import {
  getLotStatusLabel,
  getLotTypeLabel,
} from '../../../shared/ui/business-labels';
import { formatCurrency, formatSurface } from '../../../shared/ui/formatters';

function optionalNonNegativeNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    },
    z
      .number()
      .finite(`${label} invalide.`)
      .min(0, `${label} doit etre positif ou nul.`)
      .optional(),
  );
}

const schema = z.object({
  name: z.string().trim().min(1, 'Le nom du lot est requis.'),
  reference: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'GARAGE', 'CELLAR', 'OFFICE', 'SHOP', 'OTHER']),
  status: z.enum(['DRAFT', 'AVAILABLE', 'RENTED', 'SOLD', 'ARCHIVED']),
  surface: optionalNonNegativeNumber('La surface'),
  estimatedRent: optionalNonNegativeNumber('Le loyer estime'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FeedbackState = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

function toFormValues(lot?: Lot | null): Partial<FormInput> {
  if (!lot) {
    return {
      type: 'APARTMENT',
      status: 'DRAFT',
      reference: '',
      notes: '',
    };
  }

  return {
    name: lot.name,
    reference: lot.reference ?? '',
    type: lot.type as FormInput['type'],
    status: lot.status as FormInput['status'],
    surface: lot.surface ?? undefined,
    estimatedRent: lot.estimatedRent ?? undefined,
    notes: lot.notes ?? '',
  };
}

export function ProjectLotsPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hideArchived, setHideArchived] = useState(true);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const lotsQuery = useQuery({
    queryKey: ['lots', projectId],
    queryFn: () => listLots(session, projectId),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  });

  useEffect(() => {
    reset(toFormValues(editingLot));
  }, [editingLot, reset]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => {
      if (editingLot) {
        return updateLot(session, projectId, editingLot.id, payload);
      }

      return createLot(session, projectId, payload);
    },
    onSuccess: async (_, values) => {
      const isEdition = Boolean(editingLot);
      setEditingLot(null);
      reset(toFormValues());
      setFeedback({
        type: 'success',
        title: isEdition ? 'Lot mis a jour' : 'Lot ajoute',
        message: isEdition
          ? `Les informations du lot "${values.name}" ont ete enregistrees.`
          : `Le lot "${values.name}" est maintenant suivi dans le projet.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['lots', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Impossible d'enregistrer le lot",
        message: getErrorMessage(error),
      });
    },
  });
  const archiveMutation = useMutation({
    mutationFn: (lot: Lot) =>
      updateLot(session, projectId, lot.id, {
        status: 'ARCHIVED',
      }),
    onSuccess: async (_, lot) => {
      setEditingLot(null);
      reset(toFormValues());
      setFeedback({
        type: 'success',
        title: 'Lot archive',
        message: `Le lot "${lot.name}" reste disponible dans les archives du projet.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['lots', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'Archivage impossible',
        message: getErrorMessage(error),
      });
    },
  });

  const filteredLots = useMemo(() => {
    const lots = lotsQuery.data ?? [];

    return lots.filter((lot) => {
      const matchesSearch =
        search.trim() === '' ||
        [lot.name, lot.reference, lot.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
      const matchesArchiveVisibility =
        statusFilter === 'ARCHIVED' || !hideArchived || lot.status !== 'ARCHIVED';

      return matchesSearch && matchesStatus && matchesArchiveVisibility;
    });
  }, [hideArchived, lotsQuery.data, search, statusFilter]);

  if (lotsQuery.isLoading) {
    return <LoadingBlock label="Chargement des lots..." />;
  }

  if (lotsQuery.isError) {
    return (
      <ErrorState
        error={lotsQuery.error}
        onRetry={() => {
          void lotsQuery.refetch();
        }}
        title="Impossible de charger les lots"
      />
    );
  }

  const allLots = lotsQuery.data ?? [];
  const hasLots = allLots.length > 0;
  const hasActiveFilters =
    search.trim() !== '' || statusFilter !== 'ALL' || hideArchived;

  return (
    <div className="stack">
      {feedback ? (
        <FeedbackMessage
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          title={feedback.title}
          type={feedback.type}
        />
      ) : null}

      <div className="grid grid--2">
        <section className="panel">
          <h2 className="section-title">Lots du projet</h2>
          <div className="section-subtitle">
            Suivez les surfaces, statuts et loyers estimes lot par lot.
          </div>
          <div className="filters-bar" style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="lots-search">Recherche</label>
              <input
                id="lots-search"
                placeholder="Nom, reference, type"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lots-status-filter">Statut</label>
              <select
                id="lots-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">Tous</option>
                <option value="DRAFT">Brouillon</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Loue</option>
                <option value="SOLD">Vendu</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>
            <label className="checkbox-field" htmlFor="lots-hide-archived">
              <input
                id="lots-hide-archived"
                type="checkbox"
                checked={hideArchived}
                onChange={(event) => setHideArchived(event.target.checked)}
              />
              <span>Masquer les archives</span>
            </label>
          </div>

          {filteredLots.length === 0 ? (
            <div className="table-empty">
              <EmptyState
                action={
                  hasLots && hasActiveFilters ? (
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
                  ) : null
                }
                description={
                  hasLots
                    ? "Aucun lot ne correspond aux filtres actuels. Modifiez la recherche pour retrouver le bon lot."
                    : 'Ajoutez vos premiers lots pour suivre la surface, le statut de commercialisation et le loyer estime.'
                }
                title={
                  hasLots ? 'Aucun lot visible' : 'Aucun lot enregistre pour ce projet'
                }
                withPanel={false}
              />
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Surface</th>
                    <th>Loyer estime</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.name}</td>
                      <td>{getLotTypeLabel(lot.type)}</td>
                      <td>{getLotStatusLabel(lot.status)}</td>
                      <td>{formatSurface(lot.surface)}</td>
                      <td>{formatCurrency(lot.estimatedRent)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="button button--secondary"
                            onClick={() => setEditingLot(lot)}
                            type="button"
                          >
                            Editer
                          </button>
                          {lot.status !== 'ARCHIVED' ? (
                            <button
                              className="button button--danger"
                              disabled={archiveMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Archiver le lot "${lot.name}" ?`)) {
                                  archiveMutation.mutate(lot);
                                }
                              }}
                              type="button"
                            >
                              {archiveMutation.isPending ? 'Archivage...' : 'Archiver'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="section-title">
              {editingLot ? 'Editer le lot' : 'Ajouter un lot'}
            </h2>
            {editingLot ? (
              <button
                className="button button--secondary"
                onClick={() => {
                  setEditingLot(null);
                  reset(toFormValues());
                }}
                type="button"
              >
                Annuler
              </button>
            ) : null}
          </div>
          <div className="section-subtitle">
            Conservez une fiche simple par lot, sans surcharger le projet.
          </div>
          <form
            className="stack"
            onSubmit={handleSubmit((values) => {
              mutation.mutate(values);
            })}
          >
            <div className="field">
              <label htmlFor="lot-name">Nom</label>
              <input id="lot-name" {...register('name')} />
              {errors.name ? <div className="field__error">{errors.name.message}</div> : null}
            </div>
            <div className="field">
              <label htmlFor="lot-reference">Reference</label>
              <input id="lot-reference" {...register('reference')} />
            </div>
            <div className="field">
              <label htmlFor="lot-type">Type</label>
              <select id="lot-type" {...register('type')}>
                <option value="APARTMENT">Appartement</option>
                <option value="HOUSE">Maison</option>
                <option value="GARAGE">Garage</option>
                <option value="CELLAR">Cave</option>
                <option value="OFFICE">Bureau</option>
                <option value="SHOP">Local commercial</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="lot-status">Statut</label>
              <select id="lot-status" {...register('status')}>
                <option value="DRAFT">Brouillon</option>
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Loue</option>
                <option value="SOLD">Vendu</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="lot-surface">Surface</label>
              <input id="lot-surface" type="number" step="0.01" {...register('surface')} />
              {errors.surface ? (
                <div className="field__error">{errors.surface.message}</div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="lot-rent">Loyer estime</label>
              <input id="lot-rent" type="number" step="0.01" {...register('estimatedRent')} />
              {errors.estimatedRent ? (
                <div className="field__error">{errors.estimatedRent.message}</div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="lot-notes">Notes</label>
              <textarea id="lot-notes" {...register('notes')} />
            </div>
            <button className="button" disabled={mutation.isPending} type="submit">
              {mutation.isPending
                ? 'Enregistrement...'
                : editingLot
                  ? 'Enregistrer'
                  : 'Ajouter'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
