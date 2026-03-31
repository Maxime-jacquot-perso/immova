import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/auth-context';
import {
  downloadDocument,
  listDocuments,
  listExpenses,
  uploadDocument,
} from '../../projects/api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { EmptyState } from '../../../shared/ui/empty-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import {
  getDocumentTypeLabel,
  getExpenseCategoryLabel,
} from '../../../shared/ui/business-labels';
import { formatCurrency, formatDate } from '../../../shared/ui/formatters';

const schema = z.object({
  title: z.string().trim().min(1, 'Le titre du document est requis.'),
  type: z.enum(['INVOICE', 'QUOTE', 'CONTRACT', 'DIAGNOSTIC', 'PHOTO', 'PLAN', 'INSURANCE', 'OTHER']),
  expenseId: z.string().optional(),
  file: z
    .instanceof(FileList)
    .refine((fileList) => fileList.length > 0, 'Le fichier est requis.'),
});

type FormValues = z.infer<typeof schema>;
type FeedbackState = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

function getExpenseLabel(expense: {
  invoiceNumber?: string | null;
  category: string;
  amountTtc: number;
  vendorName?: string | null;
}) {
  if (expense.invoiceNumber) {
    return expense.invoiceNumber;
  }

  return `${getExpenseCategoryLabel(expense.category)} - ${formatCurrency(expense.amountTtc)}`;
}

function getLinkedExpenseLabel(expense: {
  invoiceNumber?: string | null;
  category: string;
  vendorName?: string | null;
}) {
  if (expense.invoiceNumber) {
    return expense.invoiceNumber;
  }

  return `${getExpenseCategoryLabel(expense.category)} - ${expense.vendorName || 'sans prestataire'}`;
}

export function ProjectDocumentsPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expenseFilter, setExpenseFilter] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const documentsQuery = useQuery({
    queryKey: ['documents', projectId, search, typeFilter, expenseFilter],
    queryFn: () =>
      listDocuments(session, projectId, {
        search: search.trim() || undefined,
        type: typeFilter,
        expenseId: expenseFilter || undefined,
      }),
  });
  const expensesQuery = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => listExpenses(session, projectId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'INVOICE',
      expenseId: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormValues) =>
      uploadDocument(session, projectId, {
        title: payload.title,
        type: payload.type,
        expenseId: payload.expenseId || undefined,
        file: payload.file[0],
      }),
    onSuccess: async (document) => {
      reset({
        type: 'INVOICE',
        expenseId: '',
      });
      setFeedback({
        type: 'success',
        title: 'Document ajoute',
        message: `Le document "${document.title}" est maintenant disponible dans le projet.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Impossible d'ajouter le document",
        message: getErrorMessage(error),
      });
    },
  });

  const documents = documentsQuery.data ?? [];
  const selectedExpenseLabel = useMemo(() => {
    const expenseOptions = expensesQuery.data ?? [];

    if (!expenseFilter) {
      return null;
    }

    const expense = expenseOptions.find((item) => item.id === expenseFilter);
    if (!expense) {
      return null;
    }

    return getExpenseLabel(expense);
  }, [expenseFilter, expensesQuery.data]);

  if (documentsQuery.isLoading || expensesQuery.isLoading) {
    return <LoadingBlock label="Chargement des documents..." />;
  }

  if (documentsQuery.isError) {
    return (
      <ErrorState
        error={documentsQuery.error}
        onRetry={() => {
          void documentsQuery.refetch();
        }}
        title="Impossible de charger les documents"
      />
    );
  }

  if (expensesQuery.isError) {
    return (
      <ErrorState
        error={expensesQuery.error}
        onRetry={() => {
          void expensesQuery.refetch();
        }}
        title="Impossible de charger les depenses du projet"
      />
    );
  }

  const expenseOptions = expensesQuery.data ?? [];
  const hasFilters =
    search.trim() !== '' || typeFilter !== 'ALL' || expenseFilter !== '';

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
          <h2 className="section-title">Documents du projet</h2>
          <div className="section-subtitle">
            Centralisez vos pieces sans sortir du perimetre MVP.
          </div>
          <div className="filters-bar" style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="documents-search">Recherche</label>
              <input
                id="documents-search"
                placeholder="Titre ou nom de fichier"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="documents-type-filter">Type</label>
              <select
                id="documents-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">Tous</option>
                <option value="INVOICE">Facture</option>
                <option value="QUOTE">Devis</option>
                <option value="CONTRACT">Contrat</option>
                <option value="DIAGNOSTIC">Diagnostic</option>
                <option value="PHOTO">Photo</option>
                <option value="PLAN">Plan</option>
                <option value="INSURANCE">Assurance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="documents-expense-filter">Depense liee</label>
              <select
                id="documents-expense-filter"
                value={expenseFilter}
                onChange={(event) => setExpenseFilter(event.target.value)}
              >
                <option value="">Toutes</option>
                {expenseOptions.map((expense) => (
                  <option key={expense.id} value={expense.id}>
                    {getExpenseLabel(expense)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedExpenseLabel ? (
            <div className="meta" style={{ marginTop: 12 }}>
              Filtre depense actif : {selectedExpenseLabel}
            </div>
          ) : null}

          {documents.length === 0 ? (
            <div className="list-empty">
              <EmptyState
                action={
                  hasFilters ? (
                    <button
                      className="button button--secondary"
                      onClick={() => {
                        setSearch('');
                        setTypeFilter('ALL');
                        setExpenseFilter('');
                      }}
                      type="button"
                    >
                      Reinitialiser les filtres
                    </button>
                  ) : null
                }
                description={
                  hasFilters
                    ? 'Aucun document ne correspond aux filtres actifs.'
                    : 'Ajoutez vos factures, devis, diagnostics ou photos pour garder un dossier projet clair.'
                }
                title={
                  hasFilters
                    ? 'Aucun document visible'
                    : 'Aucun document enregistre pour ce projet'
                }
                withPanel={false}
              />
            </div>
          ) : (
            <div className="stack stack--sm" style={{ marginTop: 20 }}>
              {documents.map((document) => (
                <div className="card project-card" key={document.id}>
                  <div className="project-card__top">
                    <div>
                      <strong>{document.title}</strong>
                      <div className="meta">{document.originalFileName}</div>
                      <div className="meta">{formatDate(document.createdAt)}</div>
                      {document.expense ? (
                        <div className="meta">
                          Depense : {getLinkedExpenseLabel(document.expense)}
                        </div>
                      ) : null}
                    </div>
                    <span className="badge">{getDocumentTypeLabel(document.type)}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="button button--secondary"
                      onClick={async () => {
                        try {
                          await downloadDocument(
                            session,
                            projectId,
                            document.id,
                            document.originalFileName,
                          );
                          setFeedback({
                            type: 'success',
                            title: 'Telechargement lance',
                            message: `Le document "${document.originalFileName}" a ete telecharge.`,
                          });
                        } catch (error) {
                          setFeedback({
                            type: 'error',
                            title: 'Telechargement impossible',
                            message: getErrorMessage(error),
                          });
                        }
                      }}
                      type="button"
                    >
                      Telecharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">Ajouter un document</h2>
          <div className="section-subtitle">
            Le rattachement a une depense reste facultatif.
          </div>
          <form
            className="stack"
            onSubmit={handleSubmit((values) => {
              mutation.mutate(values);
            })}
          >
            <div className="field">
              <label htmlFor="document-title">Titre</label>
              <input id="document-title" {...register('title')} />
              {errors.title ? <div className="field__error">{errors.title.message}</div> : null}
            </div>
            <div className="field">
              <label htmlFor="document-type">Type</label>
              <select id="document-type" {...register('type')}>
                <option value="INVOICE">Facture</option>
                <option value="QUOTE">Devis</option>
                <option value="CONTRACT">Contrat</option>
                <option value="DIAGNOSTIC">Diagnostic</option>
                <option value="PHOTO">Photo</option>
                <option value="PLAN">Plan</option>
                <option value="INSURANCE">Assurance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="document-expense">Depense liee</label>
              <select id="document-expense" {...register('expenseId')}>
                <option value="">Aucune</option>
                {expenseOptions.map((expense) => (
                  <option key={expense.id} value={expense.id}>
                    {getExpenseLabel(expense)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="document-file">Fichier</label>
              <input id="document-file" type="file" {...register('file')} />
              {errors.file ? <div className="field__error">{errors.file.message}</div> : null}
            </div>
            <button className="button" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? 'Upload en cours...' : 'Uploader'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
