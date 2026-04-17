const defaultSiteUrl = 'https://axelys.app';
const defaultAppUrl = 'https://app.axelys.app';
const defaultApiUrl = 'https://api.axelys.app/api';

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

export const siteName = 'Axelys';
export const publisherName = 'REGERA';
export const legalContactEmail =
  process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? 'contact@axelys.app';
export const siteUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl,
);
export const appUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl,
);
export const apiUrl = stripTrailingSlash(
  process.env.API_URL ??
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api'
      : defaultApiUrl),
);

export const defaultDescription =
  "Axelys aide les investisseurs immobiliers actifs et les marchands de biens à voir quels projets sont OK, à surveiller ou problématiques, avec des KPI calculés sur des données réelles.";

export const seoKeywords = [
  'pilotage opération immobilière',
  'outil investisseur immobilier actif',
  'logiciel marchand de biens',
  'KPI projet immobilier',
  'alertes projet immobilier',
  'statut décisionnel projet immobilier',
  'suivi dépenses documents lots immobilier',
  'outil pilotage multi-projets immobiliers',
];
