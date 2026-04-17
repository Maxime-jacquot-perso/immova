function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizePilotApplicationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function buildPilotApplicantDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  const displayName = [input.firstName, input.lastName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ')
    .trim();

  return displayName || input.email;
}

export function buildPilotOrganizationName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  organizationName?: string | null;
}) {
  const explicitName = input.organizationName?.trim();

  if (explicitName) {
    return explicitName;
  }

  const displayName = buildPilotApplicantDisplayName(input);
  return `Portefeuille de ${displayName}`;
}

export function buildPilotOrganizationSlug(
  name: string,
  applicationId: string,
) {
  const normalizedName = stripDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const base = normalizedName || 'pilot-organization';
  const suffix = applicationId.slice(-6).toLowerCase();

  return `${base}-${suffix}`;
}
