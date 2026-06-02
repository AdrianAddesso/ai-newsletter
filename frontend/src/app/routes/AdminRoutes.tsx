import { Route } from 'react-router'
import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AnalyticsPage } from '../../pages/AnalyticsPage'
import { ReviewsPage } from '../../pages/ReviewsPage'
import { ReviewNewsletterRoute } from '../../pages/ReviewNewsletterRoute'
import TemplatesPage from '../../pages/TemplatesPage'
import { EditTemplatePage } from '../../pages/EditTemplatePage'
import { UsersPage } from '../../pages/UsersPage'
import { CreateTemplate } from '../../pages/templates/CreateTemplate'
import { BackofficePage } from "../../pages/admin/AdminPanelPage";
import { BrandkitPage } from "../../pages/admin/BrandkitPage";

export const adminRoutes = (
  <>
    <Route
      path="/templates"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <TemplatesPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <AnalyticsPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/reviews"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <ReviewsPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/reviewNewsletter/:id"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <ReviewNewsletterRoute />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/templates/create"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <CreateTemplate />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/templates/edit/:id"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <EditTemplatePage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/users"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <ProtectedLayout>
            <UsersPage />
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <ProtectedLayout>
            < BackofficePage/>
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/brandkit"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <ProtectedLayout>
            < BrandkitPage/>
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
  </>
);
