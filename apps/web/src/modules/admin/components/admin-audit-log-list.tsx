import { Link } from 'react-router-dom';
import type { AdminAuditLog } from '../api';
import {
  getAdminAuditActionLabel,
  getAdminAuditActionTone,
  getAdminRoleLabel,
} from '../../../shared/ui/business-labels';
import { formatDateTime } from '../../../shared/ui/formatters';
import { AdminBadge } from './admin-badge';

type AdminAuditLogListProps = {
  logs: AdminAuditLog[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function AdminAuditLogList({
  logs,
  emptyTitle = 'Aucune action admin',
  emptyDescription = "Les actions sensibles apparaitront ici avec leur motif et leur auteur.",
}: AdminAuditLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">{emptyTitle}</p>
        <div className="empty-state__description">{emptyDescription}</div>
      </div>
    );
  }

  return (
    <div className="admin-audit-list">
      {logs.map((log) => (
        <article className="admin-audit-item" key={log.id}>
          <div className="admin-audit-item__top">
            <AdminBadge tone={getAdminAuditActionTone(log.action)}>
              {getAdminAuditActionLabel(log.action)}
            </AdminBadge>
            <div className="meta">{formatDateTime(log.createdAt)}</div>
          </div>

          <div className="stack stack--sm">
            <div>
              <strong>
                {[log.actor.firstName, log.actor.lastName].filter(Boolean).join(' ') ||
                  log.actor.email}
              </strong>{' '}
              <span className="meta">({getAdminRoleLabel(log.actor.adminRole)})</span>
            </div>

            <div className="meta">{log.reason}</div>

            {log.targetUser ? (
              <div className="meta">
                Cible :{' '}
                <Link to={`/admin/users/${log.targetUser.id}`}>
                  {[log.targetUser.firstName, log.targetUser.lastName]
                    .filter(Boolean)
                    .join(' ') || log.targetUser.email}
                </Link>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
