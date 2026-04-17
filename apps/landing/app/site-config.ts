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
  'Axelys est un outil de décision et de pilotage immobilier qui aide à arbitrer avant achat puis à suivre les écarts entre hypothèse et réalité après acquisition.';

export const seoKeywords = [
  'outil de décision immobilier',
  'pilotage opération immobilière',
  'analyse rentabilité immobilière',
  'analyse projet immobilier',
  'logiciel marchand de biens',
  'suivi projet immobilier',
  'programme client pilote Axelys',
];
