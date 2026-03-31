function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatEmailLocalPart(email: string) {
  const localPart = email.split('@')[0] ?? '';
  const normalized = localPart
    .replace(/\+.*/, '')
    .replace(/[._-]+/g, ' ')
    .trim();

  return normalized ? toTitleCase(normalized) : email;
}

export function buildPersonalOrganizationSlug(userId: string) {
  return `personal-${userId.toLowerCase()}`;
}

export function buildPersonalOrganizationName(input: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    formatEmailLocalPart(input.email);

  return `Espace personnel de ${displayName}`;
}
