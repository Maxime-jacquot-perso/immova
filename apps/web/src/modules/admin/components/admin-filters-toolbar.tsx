import type { PropsWithChildren } from 'react';

export function AdminFiltersToolbar({ children }: PropsWithChildren) {
  return <section className="panel admin-filters">{children}</section>;
}
