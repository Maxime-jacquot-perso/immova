import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { canAccessBetaFeatures } from '../../modules/auth/beta-access';
import { useAuth } from '../../modules/auth/auth-context';
import { canAccessAdmin } from '../../modules/admin/permissions';

export function AppShell() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">Axelys</div>
        <div className="meta">{session?.organization?.name}</div>
        <nav className="sidebar__nav" style={{ marginTop: 24 }}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/simulations"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Simulations
          </NavLink>
          <NavLink
            to="/ideas"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Idees produit
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            Settings
          </NavLink>
          {canAccessAdmin(session) ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              Administration
            </NavLink>
          ) : null}
        </nav>

        <div style={{ marginTop: 32 }} className="stack stack--sm">
          <div className="meta">
            {session?.user.firstName || session?.user.email}
          </div>
          {session?.user.isPilotUser ? (
            <div className="inline-actions">
              <span className="badge">Pilote</span>
              {canAccessBetaFeatures(session.user) ? (
                <span className="badge">Acces beta</span>
              ) : null}
            </div>
          ) : null}
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
