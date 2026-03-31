import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import {
  defaultProjectFormValues,
  projectFormSchema,
  type ProjectFormInput,
  type ProjectFormValues,
} from '../project-form-schema';

type ProjectFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  defaultValues?: Partial<ProjectFormInput>;
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: ProjectFormValues) => void | Promise<unknown>;
};

export function ProjectForm({
  title,
  subtitle,
  submitLabel,
  defaultValues,
  isPending,
  errorMessage,
  onSubmit,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...defaultProjectFormValues,
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      ...defaultProjectFormValues,
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <div className="page-subtitle">{subtitle}</div>
        </div>
      </header>

      <form
        className="panel stack"
        onSubmit={handleSubmit((values) => {
          void onSubmit(values);
        })}
      >
        {errorMessage ? (
          <FeedbackMessage
            message="Verifiez les champs saisis puis reessayez."
            title={errorMessage}
            type="error"
          />
        ) : null}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Nom</label>
            <input id="name" {...register('name')} />
            {errors.name ? <div className="field__error">{errors.name.message}</div> : null}
          </div>

          <div className="field">
            <label htmlFor="reference">Reference</label>
            <input id="reference" {...register('reference')} />
          </div>

          <div className="field">
            <label htmlFor="addressLine1">Adresse</label>
            <input id="addressLine1" {...register('addressLine1')} />
          </div>

          <div className="field">
            <label htmlFor="city">Ville</label>
            <input id="city" {...register('city')} />
          </div>

          <div className="field">
            <label htmlFor="postalCode">Code postal</label>
            <input id="postalCode" {...register('postalCode')} />
          </div>

          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" {...register('type')}>
              <option value="APARTMENT_BUILDING">Immeuble</option>
              <option value="HOUSE">Maison</option>
              <option value="MIXED">Mixte</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="status">Statut</label>
            <select id="status" {...register('status')}>
              <option value="DRAFT">Brouillon</option>
              <option value="ACQUISITION">Acquisition</option>
              <option value="WORKS">Travaux</option>
              <option value="READY">Pret</option>
              <option value="ACTIVE">Actif</option>
              <option value="SOLD">Vendu</option>
              <option value="ARCHIVED">Archive</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="purchasePrice">Prix achat</label>
            <input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} />
            {errors.purchasePrice ? (
              <div className="field__error">{errors.purchasePrice.message}</div>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="notaryFees">Frais notaire</label>
            <input id="notaryFees" type="number" step="0.01" {...register('notaryFees')} />
            {errors.notaryFees ? (
              <div className="field__error">{errors.notaryFees.message}</div>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="acquisitionFees">Frais annexes</label>
            <input id="acquisitionFees" type="number" step="0.01" {...register('acquisitionFees')} />
            {errors.acquisitionFees ? (
              <div className="field__error">{errors.acquisitionFees.message}</div>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="worksBudget">Budget travaux</label>
            <input id="worksBudget" type="number" step="0.01" {...register('worksBudget')} />
            {errors.worksBudget ? (
              <div className="field__error">{errors.worksBudget.message}</div>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" {...register('notes')} />
        </div>

        <button className="button" disabled={isSubmitting || isPending} type="submit">
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
