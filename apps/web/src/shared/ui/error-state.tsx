import { getErrorMessage } from './error-utils';
import { EmptyState } from './empty-state';

type ErrorStateProps = {
  title?: string;
  description?: string;
  error?: unknown;
  retryLabel?: string;
  onRetry?: () => void;
  withPanel?: boolean;
};

export function ErrorState({
  title = 'Impossible de charger cet ecran',
  description,
  error,
  retryLabel = 'Reessayer',
  onRetry,
  withPanel = true,
}: ErrorStateProps) {
  return (
    <EmptyState
      action={
        onRetry ? (
          <button className="button button--secondary" onClick={onRetry} type="button">
            {retryLabel}
          </button>
        ) : null
      }
      description={description ?? getErrorMessage(error)}
      title={title}
      withPanel={withPanel}
    />
  );
}
