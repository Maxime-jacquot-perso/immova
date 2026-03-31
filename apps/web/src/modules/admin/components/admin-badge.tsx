import type { ReactNode } from 'react';

type AdminBadgeProps = {
  tone?: string;
  children: ReactNode;
};

export function AdminBadge({
  tone = 'neutral',
  children,
}: AdminBadgeProps) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}
