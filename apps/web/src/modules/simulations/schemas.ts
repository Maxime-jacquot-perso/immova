import { z } from 'zod';

export const folderFormSchema = z.object({
  name: z.string().trim().min(2, 'Le nom du dossier doit contenir au moins 2 caracteres.'),
  description: z.string().optional(),
});

export type FolderFormValues = z.infer<typeof folderFormSchema>;
export type FolderFormInput = z.input<typeof folderFormSchema>;

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

function requiredNonNegativeNumber(label: string) {
  return z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return Number.NaN;
      }

      const parsed = Number(value);
      return parsed;
    },
    z
      .number()
      .finite(`${label} invalide.`)
      .min(0, `${label} doit etre positif ou nul.`),
  );
}

function optionalPositiveInt(label: string) {
  return z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.round(parsed) : Number.NaN;
    },
    z
      .number()
      .int(`${label} doit etre un nombre entier.`)
      .positive(`${label} doit etre strictement positif.`)
      .optional(),
  );
}

export const simulationFormSchema = z.object({
  folderId: z.string().min(1, 'Le dossier est requis.'),
  name: z.string().trim().min(2, 'Le nom de la simulation doit contenir au moins 2 caracteres.'),
  address: z.string().optional(),
  strategy: z.enum(['FLIP', 'RENTAL']),
  propertyType: z.enum(['ANCIEN', 'NEUF_VEFA']),
  departmentCode: z
    .string()
    .trim()
    .min(2, 'Le code departement est requis.')
    .max(3, 'Le code departement est invalide.'),
  isFirstTimeBuyer: z.boolean().default(false),
  purchasePrice: requiredNonNegativeNumber("Le prix d'achat"),
  furnitureValue: optionalNonNegativeNumber('Le mobilier deduit'),
  estimatedDisbursements: optionalNonNegativeNumber('Les debours estimes'),
  worksBudget: requiredNonNegativeNumber('Le budget travaux'),
  financingMode: z.enum(['CASH', 'LOAN']),
  downPayment: optionalNonNegativeNumber("L'apport"),
  loanAmount: optionalNonNegativeNumber('Le montant du pret'),
  interestRate: optionalNonNegativeNumber('Le taux'),
  loanDurationMonths: optionalPositiveInt('La duree du pret'),
  estimatedProjectDurationMonths: optionalPositiveInt('La duree estimee du projet'),
  targetResalePrice: optionalNonNegativeNumber('Le prix de revente cible'),
  targetMonthlyRent: optionalNonNegativeNumber('Le loyer mensuel cible'),
  bufferAmount: optionalNonNegativeNumber('La reserve de securite'),
  notes: z.string().optional(),
});

export type SimulationFormValues = z.infer<typeof simulationFormSchema>;
export type SimulationFormInput = z.input<typeof simulationFormSchema>;
export type SimulationFormFields = {
  folderId: string;
  name: string;
  address: string;
  strategy: 'FLIP' | 'RENTAL';
  propertyType: 'ANCIEN' | 'NEUF_VEFA';
  departmentCode: string;
  isFirstTimeBuyer: boolean;
  purchasePrice: string;
  furnitureValue: string;
  estimatedDisbursements: string;
  worksBudget: string;
  financingMode: 'CASH' | 'LOAN';
  downPayment: string;
  loanAmount: string;
  interestRate: string;
  loanDurationMonths: string;
  estimatedProjectDurationMonths: string;
  targetResalePrice: string;
  targetMonthlyRent: string;
  bufferAmount: string;
  notes: string;
};

export const defaultSimulationFormFields: SimulationFormFields = {
  folderId: '',
  name: '',
  address: '',
  strategy: 'RENTAL',
  propertyType: 'ANCIEN',
  departmentCode: '',
  financingMode: 'LOAN',
  isFirstTimeBuyer: false,
  purchasePrice: '',
  furnitureValue: '',
  estimatedDisbursements: '1000',
  worksBudget: '',
  downPayment: '',
  loanAmount: '',
  interestRate: '',
  loanDurationMonths: '',
  estimatedProjectDurationMonths: '',
  targetResalePrice: '',
  targetMonthlyRent: '',
  bufferAmount: '',
  notes: '',
};

export const defaultSimulationFormValues: Partial<SimulationFormInput> =
  defaultSimulationFormFields;

export const simulationLotFormSchema = z.object({
  name: z.string().trim().min(2, 'Le nom du lot doit contenir au moins 2 caracteres.'),
  type: z.string().optional(),
  surface: optionalNonNegativeNumber('La surface'),
  estimatedRent: optionalNonNegativeNumber('Le loyer estime'),
  targetResaleValue: optionalNonNegativeNumber('La valeur de revente ciblee'),
  notes: z.string().optional(),
  position: optionalPositiveInt('La position'),
});

export type SimulationLotFormValues = z.infer<typeof simulationLotFormSchema>;
export type SimulationLotFormInput = z.input<typeof simulationLotFormSchema>;
