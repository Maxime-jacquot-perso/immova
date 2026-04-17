import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout/app-shell';
import { RequireAdminAccess } from './require-admin-access';
import { RequireAuth } from './require-auth';
import { RequireProductAccess } from './require-product-access';
import { RouteErrorBoundary } from './route-error-boundary';
import { SessionHomeRedirect } from './session-home-redirect';
import { AdminAdminsPage } from '../modules/admin/pages/admin-admins-page';
import { AdminAuditLogsPage } from '../modules/admin/pages/admin-audit-logs-page';
import { AdminDashboardPage } from '../modules/admin/pages/admin-dashboard-page';
import { AdminIdeasPage } from '../modules/admin/pages/admin-ideas-page';
import { AdminPilotApplicationsPage } from '../modules/admin/pages/admin-pilot-applications-page';
import { AdminShell } from '../modules/admin/pages/admin-shell';
import { AdminUserDetailPage } from '../modules/admin/pages/admin-user-detail-page';
import { AdminUsersListPage } from '../modules/admin/pages/admin-users-list-page';
import { ForgotPasswordPage } from '../modules/auth/pages/forgot-password-page';
import { LoginPage } from '../modules/auth/pages/login-page';
import { ResetPasswordPage } from '../modules/auth/pages/reset-password-page';
import { SetupPasswordPage } from '../modules/auth/pages/setup-password-page';
import { DashboardPage } from '../modules/dashboard/pages/dashboard-page';
import { ProjectDocumentsPage } from '../modules/documents/pages/project-documents-page';
import { ProjectExpensesPage } from '../modules/expenses/pages/project-expenses-page';
import { IdeasPage } from '../modules/ideas/pages/ideas-page';
import { LegalAcceptancePage } from '../modules/legal/pages/legal-acceptance-page';
import { ProjectLotsPage } from '../modules/lots/pages/project-lots-page';
import { PilotSubscribePage } from '../modules/pilot/pages/pilot-subscribe-page';
import { PilotSubscribeStatusPage } from '../modules/pilot/pages/pilot-subscribe-status-page';
import { ProjectCreatePage } from '../modules/projects/pages/project-create-page';
import { ProjectEditPage } from '../modules/projects/pages/project-edit-page';
import { ProjectExportPage } from '../modules/projects/pages/project-export-page';
import { ProjectLayout } from '../modules/projects/pages/project-layout';
import { ProjectOverviewPage } from '../modules/projects/pages/project-overview-page';
import { ProjectsListPage } from '../modules/projects/pages/projects-list-page';
import { SettingsPage } from '../modules/settings/pages/settings-page';
import { FolderDetailPage } from '../modules/simulations/pages/folder-detail-page';
import { SimulationDetailPage } from '../modules/simulations/pages/simulation-detail-page';
import { SimulationEditPage } from '../modules/simulations/pages/simulation-edit-page';
import { SimulationFormPage } from '../modules/simulations/pages/simulation-form-page';
import { SimulationsFoldersPage } from '../modules/simulations/pages/simulations-folders-page';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/setup-password',
    element: <SetupPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/pilot/subscribe',
    element: <PilotSubscribePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/pilot/subscribe/success',
    element: <PilotSubscribeStatusPage mode="success" />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/pilot/subscribe/cancel',
    element: <PilotSubscribeStatusPage mode="cancel" />,
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
        path: 'legal/acceptance',
        element: <LegalAcceptancePage />,
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
                path: 'simulations',
                element: <SimulationsFoldersPage />,
              },
              {
                path: 'simulations/folders/:folderId',
                element: <FolderDetailPage />,
              },
              {
                path: 'simulations/new',
                element: <SimulationFormPage />,
              },
              {
                path: 'simulations/:simulationId',
                element: <SimulationDetailPage />,
              },
              {
                path: 'simulations/:simulationId/edit',
                element: <SimulationEditPage />,
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
                path: 'pilot-applications',
                element: <AdminPilotApplicationsPage />,
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
