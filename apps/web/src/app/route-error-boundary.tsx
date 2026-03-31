import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { getErrorMessage } from '../shared/ui/error-utils';

function getRouteErrorMessage(error: unknown) {
  if (!isRouteErrorResponse(error)) {
    return getErrorMessage(error, "Une erreur inattendue s'est produite dans l'application.");
  }

  if (typeof error.data === 'string' && error.data.trim() !== '') {
    return error.data;
  }

  if (
    error.data &&
    typeof error.data === 'object' &&
    'message' in error.data &&
    typeof error.data.message === 'string'
  ) {
    return error.data.message;
  }

  return error.statusText || 'Une erreur de navigation est survenue.';
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `Erreur ${error.status}`
    : 'Erreur application';
  const message = getRouteErrorMessage(error);

  return (
    <div className="auth-screen">
      <div className="panel auth-card stack">
        <div className="stack stack--sm">
          <h1 style={{ margin: 0 }}>{title}</h1>
          <div className="page-subtitle">
            L’application a rencontré un problème. L’erreur est capturée proprement
            pour éviter l’écran technique par défaut.
          </div>
        </div>

        <div className="panel" style={{ padding: 16 }}>
          <strong>Message</strong>
          <div className="meta" style={{ marginTop: 8 }}>
            {message}
          </div>
        </div>

        <div className="inline-actions">
          <Link className="button" to="/dashboard">
            Retour au dashboard
          </Link>
          <Link className="button button--secondary" to="/login">
            Retour au login
          </Link>
          <button
            className="button button--secondary"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recharger
          </button>
        </div>
      </div>
    </div>
  );
}
