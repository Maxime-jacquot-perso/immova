import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { SimulationFolder } from '../api';
import { buildSimulationFormFields } from '../form-utils';
import {
  simulationFormSchema,
  type SimulationFormFields,
  type SimulationFormInput,
  type SimulationFormValues,
} from '../schemas';
import { FeedbackMessage } from '../../../shared/ui/feedback-message';
import { formatCurrency } from '../../../shared/ui/formatters';

type SimulationFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  folderOptions: SimulationFolder[];
  defaultValues?: Partial<SimulationFormFields>;
  errorMessage?: string | null;
  folderLocked?: boolean;
  isPending?: boolean;
  onSubmit: (values: SimulationFormValues) => void | Promise<unknown>;
};

type SimulationFieldLabelProps = {
  htmlFor: string;
  label: string;
  helpText?: string;
};

function parseNumberField(value: string) {
  if (value.trim() === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toFinancingModeField(value: unknown): 'CASH' | 'LOAN' {
  return value === 'CASH' ? 'CASH' : 'LOAN';
}

function toStrategyField(value: unknown): 'FLIP' | 'RENTAL' {
  return value === 'FLIP' ? 'FLIP' : 'RENTAL';
}

function computeAcquisitionEstimate(values: {
  purchasePrice: string;
  estimatedDisbursements: string;
  worksBudget: string;
}) {
  return (
    parseNumberField(values.purchasePrice) +
    parseNumberField(values.estimatedDisbursements) +
    parseNumberField(values.worksBudget)
  );
}

function computeAutoLoanAmount(values: {
  financingMode: 'CASH' | 'LOAN';
  purchasePrice: string;
  estimatedDisbursements: string;
  worksBudget: string;
  downPayment: string;
}) {
  if (values.financingMode !== 'LOAN') {
    return 0;
  }

  return Math.max(
    computeAcquisitionEstimate(values) - parseNumberField(values.downPayment),
    0,
  );
}

function inferLoanAmountMode(values: SimulationFormFields) {
  if (values.financingMode !== 'LOAN') {
    return 'auto' as const;
  }

  const currentLoanAmount = values.loanAmount.trim();
  if (currentLoanAmount === '') {
    return 'auto' as const;
  }

  const autoLoanAmount = computeAutoLoanAmount(values);
  return Math.abs(parseNumberField(currentLoanAmount) - autoLoanAmount) < 0.01
    ? ('auto' as const)
    : ('manual' as const);
}

function SimulationFieldLabel({
  htmlFor,
  label,
  helpText,
}: SimulationFieldLabelProps) {
  const tooltipId = useId();

  return (
    <div className="simulation-form__label">
      <label htmlFor={htmlFor}>{label}</label>
      {helpText ? (
        <span className="simulation-form__help">
          <button
            aria-describedby={tooltipId}
            aria-label={`Aide: ${label}`}
            className="simulation-form__help-button"
            type="button"
          >
            ?
          </button>
          <span
            className="simulation-form__help-bubble"
            id={tooltipId}
            role="tooltip"
          >
            {helpText}
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function SimulationForm({
  title,
  subtitle,
  submitLabel,
  folderOptions,
  defaultValues,
  errorMessage,
  folderLocked,
  isPending,
  onSubmit,
}: SimulationFormProps) {
  const mergedDefaults = buildSimulationFormFields(defaultValues);
  const currentFolder =
    folderOptions.find((folder) => folder.id === mergedDefaults.folderId) ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SimulationFormInput, unknown, SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: mergedDefaults as SimulationFormInput,
  });

  const [hasManualLoanOverride, setHasManualLoanOverride] = useState(
    () => inferLoanAmountMode(mergedDefaults) === 'manual',
  );

  const [
    watchedStrategy,
    watchedFinancingMode,
    watchedPurchasePrice,
    watchedEstimatedDisbursements,
    watchedWorksBudget,
    watchedDownPayment,
    watchedLoanAmount,
  ] = useWatch({
    control,
    name: [
      'strategy',
      'financingMode',
      'purchasePrice',
      'estimatedDisbursements',
      'worksBudget',
      'downPayment',
      'loanAmount',
    ],
  });

  const strategy = toStrategyField(watchedStrategy);
  const financingMode = toFinancingModeField(watchedFinancingMode);
  const purchasePrice = toStringField(watchedPurchasePrice);
  const estimatedDisbursements = toStringField(watchedEstimatedDisbursements);
  const worksBudget = toStringField(watchedWorksBudget);
  const downPayment = toStringField(watchedDownPayment);
  const rawLoanAmount = toStringField(watchedLoanAmount);

  const acquisitionEstimate = computeAcquisitionEstimate({
    purchasePrice,
    estimatedDisbursements,
    worksBudget,
  });
  const loanAmountMode =
    financingMode === 'LOAN' && hasManualLoanOverride ? 'manual' : 'auto';
  const autoLoanAmount = computeAutoLoanAmount({
    financingMode,
    purchasePrice,
    estimatedDisbursements,
    worksBudget,
    downPayment,
  });
  const effectiveLoanAmount =
    financingMode === 'LOAN'
      ? loanAmountMode === 'manual'
        ? parseNumberField(rawLoanAmount)
        : autoLoanAmount
      : 0;
  const financingTotal =
    financingMode === 'LOAN'
      ? parseNumberField(downPayment) + effectiveLoanAmount
      : acquisitionEstimate;

  const loanAmountDisplayValue =
    financingMode === 'LOAN' && loanAmountMode === 'auto'
      ? String(autoLoanAmount)
      : rawLoanAmount;

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <div className="page-subtitle">{subtitle}</div>
        </div>
      </header>

      <form
        className="simulation-form"
        onSubmit={handleSubmit((values) => {
          void onSubmit({
            ...values,
            loanAmount:
              values.financingMode === 'LOAN' && loanAmountMode === 'auto'
                ? autoLoanAmount
                : values.loanAmount,
          });
        })}
      >
        {errorMessage ? (
          <FeedbackMessage
            message="Verifiez les champs saisis puis reessayez."
            title={errorMessage}
            type="error"
          />
        ) : null}

        <section className="panel stack simulation-form__section">
          <div className="simulation-form__section-header">
            <div>
              <h2 className="section-title">Bien &amp; contexte</h2>
              <div className="section-subtitle">
                Les informations utiles pour identifier l&apos;opportunite en un
                coup d&apos;oeil.
              </div>
            </div>
          </div>

          <div className="simulation-form__grid simulation-form__grid--context">
            {folderLocked ? (
              <div className="field">
                <SimulationFieldLabel htmlFor="folderId" label="Dossier" />
                <input type="hidden" {...register('folderId')} />
                <div className="simulation-form__readonly-field">
                  {currentFolder?.name || 'Dossier actuel'}
                </div>
              </div>
            ) : (
              <div className="field">
                <SimulationFieldLabel htmlFor="folderId" label="Dossier" />
                <select id="folderId" {...register('folderId')}>
                  <option value="">Selectionnez un dossier</option>
                  {folderOptions.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                {errors.folderId ? (
                  <div className="field__error">{errors.folderId.message}</div>
                ) : null}
              </div>
            )}

            <div className="field">
              <SimulationFieldLabel htmlFor="name" label="Nom" />
              <input
                id="name"
                placeholder="Ex. Immeuble rue des Vosges"
                {...register('name')}
              />
              {errors.name ? (
                <div className="field__error">{errors.name.message}</div>
              ) : null}
            </div>

            <div className="field simulation-form__field--wide">
              <SimulationFieldLabel htmlFor="address" label="Adresse" />
              <input
                id="address"
                placeholder="Adresse ou repere utile"
                {...register('address')}
              />
            </div>

            <div className="field">
              <SimulationFieldLabel htmlFor="propertyType" label="Type de bien" />
              <select id="propertyType" {...register('propertyType')}>
                <option value="ANCIEN">Ancien</option>
                <option value="NEUF_VEFA">Neuf / VEFA</option>
              </select>
            </div>

            <div className="field">
              <SimulationFieldLabel htmlFor="strategy" label="Strategie" />
              <select id="strategy" {...register('strategy')}>
                <option value="RENTAL">Locatif</option>
                <option value="FLIP">Revente</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel stack simulation-form__section">
          <div className="simulation-form__section-header">
            <div>
              <h2 className="section-title">Acquisition</h2>
              <div className="section-subtitle">
                Ce qui pese tout de suite dans le cout du projet.
              </div>
            </div>

            <div aria-live="polite" className="simulation-form__summary">
              <div className="simulation-form__summary-label">
                Cout total estime
              </div>
              <strong>{formatCurrency(acquisitionEstimate)}</strong>
              <div className="meta">
                Indicatif, hors frais de notaire detailles calcules au backend.
              </div>
            </div>
          </div>

          <div className="simulation-form__grid">
            <div className="field">
              <SimulationFieldLabel htmlFor="purchasePrice" label="Prix d'achat" />
              <input
                id="purchasePrice"
                min="0"
                type="number"
                {...register('purchasePrice')}
              />
              {errors.purchasePrice ? (
                <div className="field__error">{errors.purchasePrice.message}</div>
              ) : null}
            </div>

            <div className="field">
              <SimulationFieldLabel
                helpText="Utilise uniquement pour estimer les frais d'acquisition."
                htmlFor="departmentCode"
                label="Departement"
              />
              <input
                id="departmentCode"
                maxLength={3}
                placeholder="67 ou 2A"
                {...register('departmentCode')}
              />
              {errors.departmentCode ? (
                <div className="field__error">{errors.departmentCode.message}</div>
              ) : null}
            </div>

            <div className="field">
              <SimulationFieldLabel
                helpText="Montant du mobilier inclus dans le prix et deduit de la base des frais."
                htmlFor="furnitureValue"
                label="Mobilier deduit"
              />
              <input
                id="furnitureValue"
                min="0"
                type="number"
                {...register('furnitureValue')}
              />
              {errors.furnitureValue ? (
                <div className="field__error">{errors.furnitureValue.message}</div>
              ) : null}
            </div>

            <div className="field">
              <SimulationFieldLabel
                helpText="Petits frais annexes estimes : formalites, copies, cadastre."
                htmlFor="estimatedDisbursements"
                label="Debours estimes"
              />
              <input
                id="estimatedDisbursements"
                min="0"
                type="number"
                {...register('estimatedDisbursements')}
              />
              {errors.estimatedDisbursements ? (
                <div className="field__error">
                  {errors.estimatedDisbursements.message}
                </div>
              ) : null}
            </div>

            <div className="field">
              <SimulationFieldLabel htmlFor="worksBudget" label="Budget travaux" />
              <input
                id="worksBudget"
                min="0"
                type="number"
                {...register('worksBudget')}
              />
              {errors.worksBudget ? (
                <div className="field__error">{errors.worksBudget.message}</div>
              ) : null}
            </div>

            <div className="field simulation-form__field--full">
              <label
                className="checkbox-field simulation-form__checkbox"
                htmlFor="isFirstTimeBuyer"
              >
                <input id="isFirstTimeBuyer" type="checkbox" {...register('isFirstTimeBuyer')} />
                <span>
                  Statut primo-accedant
                  <div className="meta">
                    Memorise pour la logique reglementaire, sans changer le calcul
                    detaille a ce stade.
                  </div>
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="panel stack simulation-form__section">
          <div className="simulation-form__section-header">
            <div>
              <h2 className="section-title">Financement</h2>
              <div className="section-subtitle">
                La structure de financement reste lisible et editable sans
                ressaisie.
              </div>
            </div>

            <div aria-live="polite" className="simulation-form__summary">
              <div className="simulation-form__summary-label">Financement total</div>
              <strong>{formatCurrency(financingTotal)}</strong>
              <div className="meta">
                {financingMode === 'LOAN'
                  ? `Montant finance estime : ${formatCurrency(
                      effectiveLoanAmount,
                    )}`
                  : 'Aucun pret : couverture en cash.'}
              </div>
            </div>
          </div>

          <div className="simulation-form__grid">
            <div className="field">
              <SimulationFieldLabel
                htmlFor="financingMode"
                label="Mode de financement"
              />
              <select
                id="financingMode"
                {...register('financingMode', {
                  onChange: (event) => {
                    if (event.target.value !== 'LOAN') {
                      setHasManualLoanOverride(false);
                    }
                  },
                })}
              >
                <option value="LOAN">Credit</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {financingMode === 'LOAN' ? (
              <>
                <div className="field">
                  <SimulationFieldLabel htmlFor="downPayment" label="Apport" />
                  <input
                    id="downPayment"
                    min="0"
                    type="number"
                    {...register('downPayment')}
                  />
                  {errors.downPayment ? (
                    <div className="field__error">{errors.downPayment.message}</div>
                  ) : null}
                </div>

                <div className="field">
                  <SimulationFieldLabel htmlFor="loanAmount" label="Montant du pret" />
                  <Controller
                    control={control}
                    name="loanAmount"
                    render={({ field }) => (
                      <input
                        id="loanAmount"
                        min="0"
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          if (!hasManualLoanOverride) {
                            setHasManualLoanOverride(true);
                          }
                          field.onChange(event.target.value);
                        }}
                        ref={field.ref}
                        type="number"
                        value={loanAmountDisplayValue}
                      />
                    )}
                  />
                  <div className="simulation-form__loan-meta">
                    <span
                      className={`simulation-form__mode-badge ${
                        loanAmountMode === 'manual'
                          ? 'simulation-form__mode-badge--manual'
                          : 'simulation-form__mode-badge--auto'
                      }`}
                    >
                      {loanAmountMode === 'manual' ? 'Manuel' : 'Auto'}
                    </span>
                    <span className="meta">
                      {loanAmountMode === 'manual'
                        ? 'Valeur saisie par vous.'
                        : 'Basee sur cout acquisition - apport.'}
                    </span>
                    {loanAmountMode === 'manual' ? (
                      <button
                        className="button button--secondary button--small"
                        onClick={() => {
                          setHasManualLoanOverride(false);
                          setValue('loanAmount', String(autoLoanAmount), {
                            shouldDirty: true,
                            shouldValidate: false,
                          });
                        }}
                        type="button"
                      >
                        Recalculer
                      </button>
                    ) : null}
                  </div>
                  {errors.loanAmount ? (
                    <div className="field__error">{errors.loanAmount.message}</div>
                  ) : null}
                </div>

                <div className="field">
                  <SimulationFieldLabel htmlFor="interestRate" label="Taux (%)" />
                  <input
                    id="interestRate"
                    min="0"
                    step="0.01"
                    type="number"
                    {...register('interestRate')}
                  />
                  {errors.interestRate ? (
                    <div className="field__error">{errors.interestRate.message}</div>
                  ) : null}
                </div>

                <div className="field">
                  <SimulationFieldLabel
                    htmlFor="loanDurationMonths"
                    label="Duree du pret (mois)"
                  />
                  <input
                    id="loanDurationMonths"
                    min="1"
                    type="number"
                    {...register('loanDurationMonths')}
                  />
                  {errors.loanDurationMonths ? (
                    <div className="field__error">
                      {errors.loanDurationMonths.message}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="simulation-form__empty-note">
                Le projet est considere comme finance en cash. Vous pourrez
                toujours revenir sur ce choix plus tard.
              </div>
            )}
          </div>
        </section>

        <section className="panel stack simulation-form__section">
          <div className="simulation-form__section-header">
            <div>
              <h2 className="section-title">Exploitation &amp; securite</h2>
              <div className="section-subtitle">
                Les hypotheses qui aident a verifier si le projet tient dans le
                temps.
              </div>
            </div>
          </div>

          <div className="simulation-form__grid">
            {strategy === 'FLIP' ? (
              <div className="field">
                <SimulationFieldLabel
                  htmlFor="targetResalePrice"
                  label="Prix de revente cible"
                />
                <input
                  id="targetResalePrice"
                  min="0"
                  type="number"
                  {...register('targetResalePrice')}
                />
                {errors.targetResalePrice ? (
                  <div className="field__error">
                    {errors.targetResalePrice.message}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="field">
                <SimulationFieldLabel
                  htmlFor="targetMonthlyRent"
                  label="Loyer mensuel cible"
                />
                <input
                  id="targetMonthlyRent"
                  min="0"
                  type="number"
                  {...register('targetMonthlyRent')}
                />
                {errors.targetMonthlyRent ? (
                  <div className="field__error">
                    {errors.targetMonthlyRent.message}
                  </div>
                ) : null}
              </div>
            )}

            <div className="field">
              <SimulationFieldLabel
                htmlFor="estimatedProjectDurationMonths"
                label="Duree projet estimee (mois)"
              />
              <input
                id="estimatedProjectDurationMonths"
                min="1"
                type="number"
                {...register('estimatedProjectDurationMonths')}
              />
              {errors.estimatedProjectDurationMonths ? (
                <div className="field__error">
                  {errors.estimatedProjectDurationMonths.message}
                </div>
              ) : null}
            </div>

            <div className="field">
              <SimulationFieldLabel
                helpText="Petite marge de securite pour absorber un imprevu sans casser l'equilibre du projet."
                htmlFor="bufferAmount"
                label="Reserve de securite"
              />
              <input
                id="bufferAmount"
                min="0"
                type="number"
                {...register('bufferAmount')}
              />
              {errors.bufferAmount ? (
                <div className="field__error">{errors.bufferAmount.message}</div>
              ) : null}
            </div>

            <div className="field simulation-form__field--full">
              <SimulationFieldLabel htmlFor="notes" label="Notes" />
              <textarea
                id="notes"
                placeholder="Visite, point de vigilance, intuition terrain..."
                rows={4}
                {...register('notes')}
              />
            </div>
          </div>
        </section>

        <div className="simulation-form__actions">
          <div className="meta">
            Les resultats detailles et frais de notaire restent recalcules cote
            backend apres enregistrement.
          </div>
          <button className="button" disabled={isSubmitting || isPending} type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
