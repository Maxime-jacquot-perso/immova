const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return '—';
  }

  return `${currencyFormatter.format(value)} €`;
}

export function formatCount(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return '—';
  }

  return integerFormatter.format(value);
}

export function formatSurface(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return '—';
  }

  return `${decimalFormatter.format(value)} m²`;
}

export function formatPercent(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return '—';
  }

  return `${decimalFormatter.format(value)} %`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('fr-FR');
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
