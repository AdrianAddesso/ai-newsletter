import { Route } from 'react-router'

import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { DashboardPage } from '../../pages/DashboardPage'
import CreateNewsletterPage from '../../pages/CreateNewsletterPage'
import EditNewsletterPage from '../../pages/EditNewsletterPage'
import { TemplateLibraryPage } from '../../pages/TemplateLibraryPage'
import { ApprovedNewsletterRoute } from '../../pages/newsletter/approved/ApprovedNewsletterRoute'

export const protectedRoutes = (
  <>
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/newsletters/create"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <CreateNewsletterPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/newsletters/create/:templateId"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <CreateNewsletterPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/templates/library"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "USER"]}>
          <ProtectedLayout>
            <TemplateLibraryPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/newsletters/edit/:id"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <EditNewsletterPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/newsletters/export/:id"
      element={
        <ProtectedRoute>
          <ProtectedLayout>
            <ApprovedNewsletterRoute />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
  </>
);
