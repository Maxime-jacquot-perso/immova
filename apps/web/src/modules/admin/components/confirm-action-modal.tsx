import type { FormEvent, ReactNode } from 'react';

type ConfirmActionModalProps = {
  title: string;
  description: string;
  isOpen: boolean;
  confirmLabel: string;
  cancelLabel?: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
  extraContent?: ReactNode;
};

export function ConfirmActionModal({
  title,
  description,
  isOpen,
  confirmLabel,
  cancelLabel = 'Annuler',
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  isPending = false,
  extraContent,
}: ConfirmActionModalProps) {
  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div
        aria-modal="true"
        className="panel admin-modal"
        role="dialog"
      >
        <div className="stack">
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <div className="page-subtitle">{description}</div>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            {extraContent}
            <div className="field">
              <label htmlFor="admin-action-reason">Motif</label>
              <textarea
                id="admin-action-reason"
                minLength={5}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Expliquez pourquoi cette action est necessaire."
                required
                value={reason}
              />
            </div>

            <div className="row-actions">
              <button
                className="button button--secondary"
                onClick={onClose}
                type="button"
              >
                {cancelLabel}
              </button>
              <button className="button" disabled={isPending} type="submit">
                {isPending ? 'Traitement...' : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
