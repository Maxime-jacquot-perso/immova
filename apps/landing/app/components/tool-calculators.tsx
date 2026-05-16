'use client';

import { useState, type ChangeEvent } from 'react';
import type { ToolCalculatorKind } from '../content/tool-pages';
import styles from './marketing-ui.module.css';

type ToolCalculatorProps = {
  kind: ToolCalculatorKind;
};

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  step?: string;
  min?: number;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  options: Array<{
    value: string;
    label: string;
  }>;
};

type ResultCardProps = {
  label: string;
  value: string;
  help: string;
  tone?: 'neutral' | 'positive' | 'negative';
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNotaryRate(propertyType: string) {
  return propertyType === 'NEUF' ? 0.028 : 0.078;
}

function getEstimatedMonthlyPayment(
  financedAmount: number,
  annualRate: number,
  durationYears: number,
) {
  if (financedAmount <= 0) {
    return 0;
  }

  const totalMonths = Math.max(durationYears * 12, 1);
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return financedAmount / totalMonths;
  }

  return (
    (financedAmount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -totalMonths))
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  step = '100',
  min = 0,
}: NumberFieldProps) {
  return (
    <label className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.fieldInput}
        min={min}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(toNumber(event.target.value))
        }
        step={step}
        type="number"
        value={value}
      />
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  hint,
  options,
}: SelectFieldProps) {
  return (
    <label className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.fieldSelect}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

function ResultCard({
  label,
  value,
  help,
  tone = 'neutral',
}: ResultCardProps) {
  const valueClassName = [
    styles.resultValue,
    tone === 'positive'
      ? styles.resultValuePositive
      : tone === 'negative'
        ? styles.resultValueNegative
        : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={styles.resultCard}>
      <p className={styles.resultLabel}>{label}</p>
      <strong className={valueClassName}>{value}</strong>
      <p className={styles.resultHelp}>{help}</p>
    </article>
  );
}

function RentalYieldCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(185000);
  const [notaryFees, setNotaryFees] = useState(14500);
  const [worksBudget, setWorksBudget] = useState(18000);
  const [monthlyRent, setMonthlyRent] = useState(980);
  const [annualCharges, setAnnualCharges] = useState(2800);

  const totalInvestment = purchasePrice + notaryFees + worksBudget;
  const annualRent = monthlyRent * 12;
  const grossYield =
    totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  const netAnnualIncome = annualRent - annualCharges;
  const netYield =
    totalInvestment > 0 ? (netAnnualIncome / totalInvestment) * 100 : 0;

  return (
    <div className={styles.calculatorShell}>
      <div className={styles.fieldGrid}>
        <NumberField
          label="Prix d’achat"
          onChange={setPurchasePrice}
          value={purchasePrice}
        />
        <NumberField
          label="Frais de notaire estimés"
          onChange={setNotaryFees}
          value={notaryFees}
        />
        <NumberField
          label="Travaux"
          onChange={setWorksBudget}
          value={worksBudget}
        />
        <NumberField
          label="Loyer mensuel"
          onChange={setMonthlyRent}
          step="10"
          value={monthlyRent}
        />
        <NumberField
          label="Charges annuelles récurrentes"
          onChange={setAnnualCharges}
          value={annualCharges}
        />
      </div>
      <div className={styles.resultGrid}>
        <ResultCard
          help="Prix d’achat, frais et travaux inclus."
          label="Investissement total"
          value={formatCurrency(totalInvestment)}
        />
        <ResultCard
          help="Repère rapide avant lecture détaillée."
          label="Rentabilité brute"
          value={`${formatPercent(grossYield)} %`}
        />
        <ResultCard
          help="Charges annuelles récurrentes déduites."
          label="Rentabilité nette simplifiée"
          value={`${formatPercent(netYield)} %`}
        />
        <ResultCard
          help="Ce montant ne tient pas compte de la fiscalité."
          label="Revenu annuel net simplifié"
          value={formatCurrency(netAnnualIncome)}
        />
      </div>
      <p className={styles.disclaimer}>
        Ajustez les montants directement dans le formulaire une fois la page chargée.
        Le calcul reste indicatif et ne constitue ni un conseil financier ni une
        validation de projet.
      </p>
    </div>
  );
}

function NotaryFeesCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(240000);
  const [propertyType, setPropertyType] = useState('ANCIEN');
  const notaryRate = getNotaryRate(propertyType);
  const estimatedFees = purchasePrice * notaryRate;
  const totalCost = purchasePrice + estimatedFees;

  return (
    <div className={styles.calculatorShell}>
      <div className={styles.fieldGrid}>
        <NumberField
          label="Prix d’achat"
          onChange={setPurchasePrice}
          value={purchasePrice}
        />
        <SelectField
          hint="Taux indicatif simplifié."
          label="Type de bien"
          onChange={setPropertyType}
          options={[
            { value: 'ANCIEN', label: 'Ancien' },
            { value: 'NEUF', label: 'Neuf / VEFA' },
          ]}
          value={propertyType}
        />
      </div>
      <div className={styles.resultGrid}>
        <ResultCard
          help="Base simple pour relire le coût d’acquisition."
          label="Taux indicatif utilisé"
          value={`${formatPercent(notaryRate * 100)} %`}
        />
        <ResultCard
          help="Estimation indicative à relire avec votre notaire."
          label="Frais de notaire estimés"
          value={formatCurrency(estimatedFees)}
        />
        <ResultCard
          help="Prix + frais de notaire estimés."
          label="Coût d’acquisition estimé"
          value={formatCurrency(totalCost)}
        />
      </div>
      <p className={styles.disclaimer}>
        Ancien et neuf ne suivent pas les mêmes ordres de grandeur. Le résultat reste
        indicatif et ne remplace jamais une estimation notariale ou un acte préparé.
      </p>
    </div>
  );
}

function CashflowCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(1180);
  const [monthlyLoanPayment, setMonthlyLoanPayment] = useState(890);
  const [monthlyCharges, setMonthlyCharges] = useState(180);
  const monthlyCashflow = monthlyRent - monthlyLoanPayment - monthlyCharges;
  const annualCashflow = monthlyCashflow * 12;

  return (
    <div className={styles.calculatorShell}>
      <div className={styles.fieldGrid}>
        <NumberField
          label="Loyers mensuels"
          onChange={setMonthlyRent}
          step="10"
          value={monthlyRent}
        />
        <NumberField
          label="Mensualité de crédit"
          onChange={setMonthlyLoanPayment}
          step="10"
          value={monthlyLoanPayment}
        />
        <NumberField
          label="Charges récurrentes mensuelles"
          onChange={setMonthlyCharges}
          step="10"
          value={monthlyCharges}
        />
      </div>
      <div className={styles.resultGrid}>
        <ResultCard
          help="Loyers - mensualité - charges récurrentes."
          label="Cashflow mensuel simplifié"
          tone={monthlyCashflow >= 0 ? 'positive' : 'negative'}
          value={formatCurrency(monthlyCashflow)}
        />
        <ResultCard
          help="Projection sur 12 mois, hors vacance et fiscalité."
          label="Cashflow annuel simplifié"
          tone={annualCashflow >= 0 ? 'positive' : 'negative'}
          value={formatCurrency(annualCashflow)}
        />
      </div>
      <p className={styles.disclaimer}>
        Un cashflow positif ne valide jamais à lui seul une opération. Il faut aussi
        relire le coût d’entrée, le niveau de risque, le capital mobilisé et la solidité
        des hypothèses locatives.
      </p>
    </div>
  );
}

function RentalSimulationCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(210000);
  const [worksBudget, setWorksBudget] = useState(25000);
  const [propertyType, setPropertyType] = useState('ANCIEN');
  const [downPayment, setDownPayment] = useState(45000);
  const [annualRate, setAnnualRate] = useState(3.8);
  const [durationYears, setDurationYears] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(1150);
  const [monthlyCharges, setMonthlyCharges] = useState(190);

  const notaryFees = purchasePrice * getNotaryRate(propertyType);
  const totalProjectCost = purchasePrice + notaryFees + worksBudget;
  const financedAmount = Math.max(totalProjectCost - downPayment, 0);
  const monthlyPayment = getEstimatedMonthlyPayment(
    financedAmount,
    annualRate,
    durationYears,
  );
  const grossYield =
    totalProjectCost > 0 ? ((monthlyRent * 12) / totalProjectCost) * 100 : 0;
  const monthlyCashflow = monthlyRent - monthlyCharges - monthlyPayment;

  return (
    <div className={styles.calculatorShell}>
      <div className={styles.fieldGrid}>
        <NumberField
          label="Prix d’achat"
          onChange={setPurchasePrice}
          value={purchasePrice}
        />
        <SelectField
          label="Type de bien"
          onChange={setPropertyType}
          options={[
            { value: 'ANCIEN', label: 'Ancien' },
            { value: 'NEUF', label: 'Neuf / VEFA' },
          ]}
          value={propertyType}
        />
        <NumberField
          label="Travaux"
          onChange={setWorksBudget}
          value={worksBudget}
        />
        <NumberField
          label="Apport"
          onChange={setDownPayment}
          value={downPayment}
        />
        <NumberField
          hint="Taux nominal annuel indicatif."
          label="Taux d’emprunt"
          onChange={setAnnualRate}
          step="0.1"
          value={annualRate}
        />
        <NumberField
          hint="En années."
          label="Durée du prêt"
          onChange={setDurationYears}
          step="1"
          value={durationYears}
        />
        <NumberField
          label="Loyer mensuel"
          onChange={setMonthlyRent}
          step="10"
          value={monthlyRent}
        />
        <NumberField
          label="Charges mensuelles"
          onChange={setMonthlyCharges}
          step="10"
          value={monthlyCharges}
        />
      </div>
      <div className={styles.resultGrid}>
        <ResultCard
          help="Prix, frais de notaire estimés et travaux."
          label="Coût total estimé"
          value={formatCurrency(totalProjectCost)}
        />
        <ResultCard
          help="Sur la base du type de bien choisi."
          label="Frais de notaire estimés"
          value={formatCurrency(notaryFees)}
        />
        <ResultCard
          help="Montant financé après apport."
          label="Capital financé"
          value={formatCurrency(financedAmount)}
        />
        <ResultCard
          help="Mensualité indicative hors assurance et frais bancaires."
          label="Mensualité estimée"
          value={formatCurrency(monthlyPayment)}
        />
        <ResultCard
          help="Premier repère de rendement, hors fiscalité."
          label="Rentabilité brute"
          value={`${formatPercent(grossYield)} %`}
        />
        <ResultCard
          help="Loyers - charges - mensualité."
          label="Cashflow mensuel simplifié"
          tone={monthlyCashflow >= 0 ? 'positive' : 'negative'}
          value={formatCurrency(monthlyCashflow)}
        />
      </div>
      <p className={styles.disclaimer}>
        Cette simulation donne un ordre de grandeur. Elle n’intègre pas plusieurs
        scénarios, la fiscalité réelle, la vacance locative ni les particularités de votre
        situation personnelle.
      </p>
    </div>
  );
}

export function ToolCalculator({ kind }: ToolCalculatorProps) {
  switch (kind) {
    case 'rental-yield':
      return <RentalYieldCalculator />;
    case 'notary-fees':
      return <NotaryFeesCalculator />;
    case 'cashflow':
      return <CashflowCalculator />;
    case 'rental-simulation':
      return <RentalSimulationCalculator />;
    default:
      return null;
  }
}
