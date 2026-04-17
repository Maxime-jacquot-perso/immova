export const LEGAL_DOCUMENT_VERSION = 'v2026.04.17';
export const LEGAL_DOCUMENT_UPDATED_AT = '2026-04-17';

export type LegalDocumentType =
  | 'MENTIONS_LEGALES'
  | 'CGU'
  | 'CGV'
  | 'PRIVACY_POLICY';

export type LegalAcceptanceScope = 'ACCOUNT' | 'CHECKOUT';

export type LegalDocumentDefinition = {
  type: LegalDocumentType;
  slug: 'mentions-legales' | 'cgu' | 'cgv' | 'politique-de-confidentialite';
  title: string;
  shortTitle: string;
  version: string;
  updatedAt: string;
  acceptanceRequired: boolean;
};

export const legalDocumentDefinitions = [
  {
    type: 'MENTIONS_LEGALES',
    slug: 'mentions-legales',
    title: 'Mentions légales',
    shortTitle: 'Mentions légales',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    acceptanceRequired: false,
  },
  {
    type: 'CGU',
    slug: 'cgu',
    title: 'Conditions Générales d’Utilisation',
    shortTitle: 'CGU',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    acceptanceRequired: true,
  },
  {
    type: 'CGV',
    slug: 'cgv',
    title: 'Conditions Générales de Vente',
    shortTitle: 'CGV',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    acceptanceRequired: true,
  },
  {
    type: 'PRIVACY_POLICY',
    slug: 'politique-de-confidentialite',
    title: 'Politique de confidentialité',
    shortTitle: 'Politique de confidentialité',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    acceptanceRequired: true,
  },
] as const satisfies readonly LegalDocumentDefinition[];

export function getLegalDocumentDefinition(type: LegalDocumentType) {
  return legalDocumentDefinitions.find((document) => document.type === type)!;
}

export function listLegalDocumentDefinitions() {
  return [...legalDocumentDefinitions];
}

export function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

export function getLegalDocumentUrl(baseUrl: string, type: LegalDocumentType) {
  const document = getLegalDocumentDefinition(type);
  return `${normalizeBaseUrl(baseUrl)}/${document.slug}`;
}

export function getAccountAcceptanceDocumentTypes(hasOrganizationContext: boolean) {
  return hasOrganizationContext
    ? (['CGU', 'CGV', 'PRIVACY_POLICY'] as const)
    : (['CGU', 'PRIVACY_POLICY'] as const);
}

export const checkoutAcceptanceDocumentTypes = [
  'CGV',
  'PRIVACY_POLICY',
] as const;

export function getRequiredDocumentTypesForScope(
  scope: LegalAcceptanceScope,
  options?: { hasOrganizationContext?: boolean },
) {
  if (scope === 'CHECKOUT') {
    return checkoutAcceptanceDocumentTypes;
  }

  return getAccountAcceptanceDocumentTypes(
    options?.hasOrganizationContext ?? true,
  );
}
