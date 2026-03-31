import { z } from 'zod';

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

export const projectFormSchema = z.object({
  name: z.string().trim().min(2, 'Le nom du projet doit contenir au moins 2 caracteres.'),
  reference: z.string().optional(),
  addressLine1: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('FR'),
  type: z.enum(['APARTMENT_BUILDING', 'HOUSE', 'MIXED', 'COMMERCIAL', 'OTHER']),
  status: z.enum(['DRAFT', 'ACQUISITION', 'WORKS', 'READY', 'ACTIVE', 'SOLD', 'ARCHIVED']),
  purchasePrice: optionalNonNegativeNumber("Le prix d'achat"),
  notaryFees: optionalNonNegativeNumber('Les frais de notaire'),
  acquisitionFees: optionalNonNegativeNumber('Les frais annexes'),
  worksBudget: optionalNonNegativeNumber('Le budget travaux'),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type ProjectFormInput = z.input<typeof projectFormSchema>;

export const defaultProjectFormValues: Partial<ProjectFormInput> = {
  country: 'FR',
  type: 'APARTMENT_BUILDING',
  status: 'DRAFT',
};
