export function getAppWebUrl() {
  return (process.env.APP_WEB_URL?.trim() || 'http://localhost:5173').replace(
    /\/$/,
    '',
  );
}

export function buildAppWebUrl(path: string, searchParams?: URLSearchParams) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = searchParams?.toString();

  return `${getAppWebUrl()}${normalizedPath}${queryString ? `?${queryString}` : ''}`;
}
