import type { PropsWithChildren, ReactNode } from 'react';

type EmptyStateProps = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  withPanel?: boolean;
}>;

export function EmptyState({
  title,
  description,
  action,
  children,
  withPanel = true,
}: EmptyStateProps) {
  return (
    <div className={withPanel ? 'panel empty-state' : 'empty-state'}>
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      {description ? <div className="empty-state__description">{description}</div> : null}
      {children ? <div className="empty-state__content">{children}</div> : null}
      {action ? <div className="empty-state__actions">{action}</div> : null}
    </div>
  );
}
