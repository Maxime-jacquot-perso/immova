import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/auth-context';
import {
  createExpense,
  listExpenses,
  listLots,
  uploadDocument,
  updateExpense,
  type Expense,
} from '../../projects/api';
import { LoadingBlock } from '../../../shared/ui/loading-block';
import { ErrorState } from '../../../shared/ui/error-state';
import { EmptyState } from '../../../shared/ui/empty-state';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { getErrorMessage } from '../../../shared/ui/error-utils';
import { getExpenseCategoryLabel } from '../../../shared/ui/business-labels';
import { formatCurrency, formatDate } from '../../../shared/ui/formatters';

function requiredNonNegativeNumber(label: string) {
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
      .min(0, `${label} doit etre positif ou nul.`),
  );
}

const schema = z
  .object({
    lotId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    issueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date de facture est requise.'),
    amountHt: requiredNonNegativeNumber('Le montant HT'),
    vatAmount: requiredNonNegativeNumber('La TVA'),
    amountTtc: requiredNonNegativeNumber('Le montant TTC'),
    category: z.enum([
      'ACQUISITION',
      'WORKS',
      'TAX',
      'INSURANCE',
      'UTILITIES',
      'MANAGEMENT',
      'LEGAL',
      'MAINTENANCE',
      'OTHER',
    ]),
    paymentStatus: z.enum(['PENDING', 'PAID', 'CANCELLED']),
    vendorName: z.string().optional(),
    comment: z.string().optional(),
    documentFile: z.any().optional(),
  })
  .superRefine((values, context) => {
    const expectedTtc = values.amountHt + values.vatAmount;
    if (Math.abs(expectedTtc - values.amountTtc) > 0.05) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le montant TTC doit correspondre a HT + TVA.',
        path: ['amountTtc'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FeedbackState = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

function toFormValues(expense?: Expense | null): Partial<FormInput> {
  if (!expense) {
    return {
      issueDate: new Date().toISOString().slice(0, 10),
      category: 'WORKS',
      paymentStatus: 'PENDING',
      lotId: '',
      invoiceNumber: '',
      vendorName: '',
      comment: '',
      documentFile: undefined,
    };
  }

  return {
    lotId: expense.lotId ?? '',
    invoiceNumber: expense.invoiceNumber ?? '',
    issueDate: expense.issueDate.slice(0, 10),
    amountHt: expense.amountHt,
    vatAmount: expense.vatAmount,
    amountTtc: expense.amountTtc,
    category: expense.category as FormInput['category'],
    paymentStatus: expense.paymentStatus as FormInput['paymentStatus'],
    vendorName: expense.vendorName ?? '',
    comment: expense.comment ?? '',
    documentFile: undefined,
  };
}

export function ProjectExpensesPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const expensesQuery = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => listExpenses(session, projectId),
  });
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
    reset(toFormValues(editingExpense));
  }, [editingExpense, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: FormValues) => {
      const { documentFile, ...expensePayload } = payload;
      const attachedFile =
        documentFile instanceof FileList && documentFile.length > 0
          ? documentFile[0]
          : null;
      const isEdition = Boolean(editingExpense);
      const expense = editingExpense
        ? await updateExpense(session, projectId, editingExpense.id, {
            ...expensePayload,
            lotId: expensePayload.lotId || undefined,
          })
        : await createExpense(session, projectId, {
            ...expensePayload,
            lotId: expensePayload.lotId || undefined,
          });

      if (attachedFile) {
        await uploadDocument(session, projectId, {
          title:
            expense.invoiceNumber ||
            `${expense.category} - ${expense.vendorName || 'justificatif'}`,
          type: 'INVOICE',
          expenseId: expense.id,
          file: attachedFile,
        });
      }

      return {
        expense,
        attachedFileName: attachedFile?.name,
        isEdition,
      };
    },
    onSuccess: async (result) => {
      setEditingExpense(null);
      reset(toFormValues());
      setFeedback({
        type: 'success',
        title: result.isEdition ? 'Depense mise a jour' : 'Depense ajoutee',
        message: result.attachedFileName
          ? `La depense et le justificatif "${result.attachedFileName}" ont ete enregistres.`
          : 'La depense a ete enregistree avec succes.',
      });
      await queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: "Impossible d'enregistrer la depense",
        message: getErrorMessage(error),
      });
    },
  });

  const filteredExpenses = useMemo(() => {
    const expenses = expensesQuery.data ?? [];

    return expenses.filter((expense) => {
      const matchesSearch =
        search.trim() === '' ||
        [expense.invoiceNumber, expense.vendorName, expense.comment]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || expense.category === categoryFilter;
      const matchesPayment =
        paymentFilter === 'ALL' || expense.paymentStatus === paymentFilter;

      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [categoryFilter, expensesQuery.data, paymentFilter, search]);

  if (expensesQuery.isLoading || lotsQuery.isLoading) {
    return <LoadingBlock label="Chargement des depenses..." />;
  }

  if (expensesQuery.isError) {
    return (
      <ErrorState
        error={expensesQuery.error}
        onRetry={() => {
          void expensesQuery.refetch();
        }}
        title="Impossible de charger les depenses"
      />
    );
  }

  if (lotsQuery.isError) {
    return (
      <ErrorState
        error={lotsQuery.error}
        onRetry={() => {
          void lotsQuery.refetch();
        }}
        title="Impossible de charger les lots du projet"
      />
    );
  }

  const lots = lotsQuery.data ?? [];
  const allExpenses = expensesQuery.data ?? [];
  const hasExpenses = allExpenses.length > 0;
  const hasActiveFilters =
    search.trim() !== '' || categoryFilter !== 'ALL' || paymentFilter !== 'ALL';

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
          <h2 className="section-title">Depenses du projet</h2>
          <div className="section-subtitle">
            Suivez les factures et les paiements sans sortir du cadre MVP.
          </div>
          <div className="filters-bar" style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="expenses-search">Recherche</label>
              <input
                id="expenses-search"
                placeholder="Facture, prestataire, commentaire"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="expenses-category-filter">Categorie</label>
              <select
                id="expenses-category-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="ALL">Toutes</option>
                <option value="ACQUISITION">Acquisition</option>
                <option value="WORKS">Travaux</option>
                <option value="TAX">Taxe</option>
                <option value="INSURANCE">Assurance</option>
                <option value="UTILITIES">Charges</option>
                <option value="MANAGEMENT">Gestion</option>
                <option value="LEGAL">Juridique</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="expenses-payment-filter">Paiement</label>
              <select
                id="expenses-payment-filter"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                <option value="ALL">Tous</option>
                <option value="PENDING">En attente</option>
                <option value="PAID">Payee</option>
                <option value="CANCELLED">Annulee</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="table-empty">
              <EmptyState
                action={
                  hasExpenses && hasActiveFilters ? (
                    <button
                      className="button button--secondary"
                      onClick={() => {
                        setSearch('');
                        setCategoryFilter('ALL');
                        setPaymentFilter('ALL');
                      }}
                      type="button"
                    >
                      Reinitialiser les filtres
                    </button>
                  ) : null
                }
                description={
                  hasExpenses
                    ? "Aucune depense ne correspond aux filtres en cours. Modifiez vos criteres pour retrouver une facture."
                    : "Ajoutez une premiere depense pour alimenter le pilotage financier, les KPI et l'export CSV."
                }
                title={
                  hasExpenses
                    ? 'Aucune depense visible'
                    : 'Aucune depense enregistree pour ce projet'
                }
                withPanel={false}
              />
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Facture</th>
                    <th>Categorie</th>
                    <th>Lot</th>
                    <th>Prestataire</th>
                    <th>TTC</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.issueDate)}</td>
                      <td>{expense.invoiceNumber || '—'}</td>
                      <td>{getExpenseCategoryLabel(expense.category)}</td>
                      <td>{lots.find((lot) => lot.id === expense.lotId)?.name || 'Projet'}</td>
                      <td>{expense.vendorName || '—'}</td>
                      <td>{formatCurrency(expense.amountTtc)}</td>
                      <td>
                        <button
                          className="button button--secondary"
                          onClick={() => setEditingExpense(expense)}
                          type="button"
                        >
                          Editer
                        </button>
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
              {editingExpense ? 'Editer la depense' : 'Ajouter une depense'}
            </h2>
            {editingExpense ? (
              <button
                className="button button--secondary"
                onClick={() => {
                  setEditingExpense(null);
                  reset(toFormValues());
                }}
                type="button"
              >
                Annuler
              </button>
            ) : null}
          </div>
          <div className="section-subtitle">
            Chaque depense peut rester au niveau projet ou etre rattachee a un lot.
          </div>
          <form
            className="stack"
            onSubmit={handleSubmit((values) => {
              mutation.mutate(values);
            })}
          >
            <div className="field">
              <label htmlFor="expense-lot">Lot</label>
              <select id="expense-lot" {...register('lotId')}>
                <option value="">Projet</option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="expense-invoice">Numero facture</label>
              <input id="expense-invoice" {...register('invoiceNumber')} />
            </div>
            <div className="field">
              <label htmlFor="expense-date">Date</label>
              <input id="expense-date" type="date" {...register('issueDate')} />
              {errors.issueDate ? (
                <div className="field__error">{errors.issueDate.message}</div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="expense-category">Categorie</label>
              <select id="expense-category" {...register('category')}>
                <option value="ACQUISITION">Acquisition</option>
                <option value="WORKS">Travaux</option>
                <option value="TAX">Taxe</option>
                <option value="INSURANCE">Assurance</option>
                <option value="UTILITIES">Charges</option>
                <option value="MANAGEMENT">Gestion</option>
                <option value="LEGAL">Juridique</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="expense-vendor">Prestataire</label>
              <input id="expense-vendor" {...register('vendorName')} />
            </div>
            <div className="field">
              <label htmlFor="expense-status">Paiement</label>
              <select id="expense-status" {...register('paymentStatus')}>
                <option value="PENDING">En attente</option>
                <option value="PAID">Payee</option>
                <option value="CANCELLED">Annulee</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="expense-ht">Montant HT</label>
                <input id="expense-ht" type="number" step="0.01" {...register('amountHt')} />
                {errors.amountHt ? (
                  <div className="field__error">{errors.amountHt.message}</div>
                ) : null}
              </div>
              <div className="field">
                <label htmlFor="expense-vat">TVA</label>
                <input id="expense-vat" type="number" step="0.01" {...register('vatAmount')} />
                {errors.vatAmount ? (
                  <div className="field__error">{errors.vatAmount.message}</div>
                ) : null}
              </div>
            </div>
            <div className="field">
              <label htmlFor="expense-ttc">Montant TTC</label>
              <input id="expense-ttc" type="number" step="0.01" {...register('amountTtc')} />
              {errors.amountTtc ? (
                <div className="field__error">{errors.amountTtc.message}</div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="expense-comment">Commentaire</label>
              <textarea id="expense-comment" {...register('comment')} />
            </div>
            <div className="field">
              <label htmlFor="expense-document-file">Justificatif</label>
              <input id="expense-document-file" type="file" {...register('documentFile')} />
              <div className="meta">
                Fichier facultatif. Il sera rattache a la depense creee ou modifiee.
              </div>
            </div>
            <button className="button" disabled={mutation.isPending} type="submit">
              {mutation.isPending
                ? 'Enregistrement...'
                : editingExpense
                  ? 'Enregistrer'
                  : 'Ajouter'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
