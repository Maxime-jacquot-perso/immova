import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout/app-shell';
import { LoginPage } from '../modules/auth/pages/login-page';
import { SetupPasswordPage } from '../modules/auth/pages/setup-password-page';
import { DashboardPage } from '../modules/dashboard/pages/dashboard-page';
import { IdeasPage } from '../modules/ideas/pages/ideas-page';
import { ProjectsListPage } from '../modules/projects/pages/projects-list-page';
import { ProjectCreatePage } from '../modules/projects/pages/project-create-page';
import { ProjectEditPage } from '../modules/projects/pages/project-edit-page';
import { ProjectLayout } from '../modules/projects/pages/project-layout';
import { ProjectOverviewPage } from '../modules/projects/pages/project-overview-page';
import { ProjectLotsPage } from '../modules/lots/pages/project-lots-page';
import { ProjectExpensesPage } from '../modules/expenses/pages/project-expenses-page';
import { ProjectDocumentsPage } from '../modules/documents/pages/project-documents-page';
import { ProjectExportPage } from '../modules/projects/pages/project-export-page';
import { SettingsPage } from '../modules/settings/pages/settings-page';
import { AdminAdminsPage } from '../modules/admin/pages/admin-admins-page';
import { AdminAuditLogsPage } from '../modules/admin/pages/admin-audit-logs-page';
import { AdminDashboardPage } from '../modules/admin/pages/admin-dashboard-page';
import { AdminIdeasPage } from '../modules/admin/pages/admin-ideas-page';
import { AdminShell } from '../modules/admin/pages/admin-shell';
import { AdminUserDetailPage } from '../modules/admin/pages/admin-user-detail-page';
import { AdminUsersListPage } from '../modules/admin/pages/admin-users-list-page';
import { RouteErrorBoundary } from './route-error-boundary';
import { RequireAdminAccess } from './require-admin-access';
import { RequireAuth } from './require-auth';
import { RequireProductAccess } from './require-product-access';
import { SessionHomeRedirect } from './session-home-redirect';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/setup-password',
    element: <SetupPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <SessionHomeRedirect />,
      },
      {
        element: <RequireProductAccess />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                path: 'dashboard',
                element: <DashboardPage />,
              },
              {
                path: 'projects',
                element: <ProjectsListPage />,
              },
              {
                path: 'ideas',
                element: <IdeasPage />,
              },
              {
                path: 'projects/new',
                element: <ProjectCreatePage />,
              },
              {
                path: 'projects/:projectId/edit',
                element: <ProjectEditPage />,
              },
              {
                path: 'projects/:projectId',
                element: <ProjectLayout />,
                children: [
                  {
                    index: true,
                    element: <ProjectOverviewPage />,
                  },
                  {
                    path: 'lots',
                    element: <ProjectLotsPage />,
                  },
                  {
                    path: 'expenses',
                    element: <ProjectExpensesPage />,
                  },
                  {
                    path: 'documents',
                    element: <ProjectDocumentsPage />,
                  },
                  {
                    path: 'export',
                    element: <ProjectExportPage />,
                  },
                ],
              },
              {
                path: 'settings',
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'admin',
        element: <RequireAdminAccess />,
        children: [
          {
            element: <AdminShell />,
            children: [
              {
                index: true,
                element: <AdminDashboardPage />,
              },
              {
                path: 'users',
                element: <AdminUsersListPage />,
              },
              {
                path: 'users/:userId',
                element: <AdminUserDetailPage />,
              },
              {
                path: 'admins',
                element: <AdminAdminsPage />,
              },
              {
                path: 'audit-logs',
                element: <AdminAuditLogsPage />,
              },
              {
                path: 'ideas',
                element: <AdminIdeasPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
