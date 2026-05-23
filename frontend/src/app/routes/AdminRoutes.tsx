import { Route } from 'react-router'
import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AnalyticsPage } from '../../pages/AnalyticsPage'
import { ReviewsPage } from '../../pages/ReviewsPage'
import { ReviewDetailPage } from '../../pages/ReviewDetailPage'
import TemplatesPage from '../../pages/TemplatesPage'
import { UsersPage } from '../../pages/UsersPage'
import { CreateTemplate } from '../../pages/templates/CreateTemplate'
import {  } from '../../pages/backoffice/BackofficePage'
import {  } from "../../pages/backoffice/BrandkitPage";

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
      path="/reviews/:id"
      element={
        <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
          <ProtectedLayout>
            <ReviewDetailPage />
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
      path="/backoffice"
      element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <ProtectedLayout>
            < BackofficePage/>
          </ProtectedLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/backoffice/brandkit"
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