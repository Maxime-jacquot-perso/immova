import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth-context';
import { ADMIN_PERMISSIONS, hasAdminPermission } from '../permissions';

export function AdminShell() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">Immova Admin</div>
        <div className="meta">
          Back-office interne, audit&eacute; et s&eacute;par&eacute; de l&apos;app utilisateur.
        </div>

        <nav className="admin-sidebar__nav">
          <NavLink
            end
            to="/admin"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Dashboard admin
          </NavLink>
          {hasAdminPermission(session, ADMIN_PERMISSIONS.usersRead) ? (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              Utilisateurs
            </NavLink>
          ) : null}
          {hasAdminPermission(session, ADMIN_PERMISSIONS.adminsRead) ? (
            <NavLink
              to="/admin/admins"
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              Administrateurs
            </NavLink>
          ) : null}
          {hasAdminPermission(session, ADMIN_PERMISSIONS.auditRead) ? (
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              Audit log
            </NavLink>
          ) : null}
        </nav>

        <div className="stack stack--sm" style={{ marginTop: 24 }}>
          {session?.organization ? (
            <button
              className="button button--secondary"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              Retour &agrave; l&apos;app produit
            </button>
          ) : null}
          <div className="meta">
            {[session?.user.firstName, session?.user.lastName]
              .filter(Boolean)
              .join(' ') || session?.user.email}
          </div>
          <div className="meta">{session?.admin?.role}</div>
          <button
            className="button button--secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            type="button"
          >
            Se deconnecter
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
