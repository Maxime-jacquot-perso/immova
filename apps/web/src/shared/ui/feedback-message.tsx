import type { ReactNode } from 'react';

type FeedbackMessageProps = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  action?: ReactNode;
  onDismiss?: () => void;
};

export function FeedbackMessage({
  type,
  title,
  message,
  action,
  onDismiss,
}: FeedbackMessageProps) {
  return (
    <div
      aria-live="polite"
      className={`feedback-message feedback-message--${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div className="feedback-message__body">
        <strong>{title}</strong>
        {message ? <div className="meta">{message}</div> : null}
      </div>
      <div className="feedback-message__actions">
        {action}
        {onDismiss ? (
          <button
            className="button button--secondary"
            onClick={onDismiss}
            type="button"
          >
            Fermer
          </button>
        ) : null}
      </div>
    </div>
  );
}
