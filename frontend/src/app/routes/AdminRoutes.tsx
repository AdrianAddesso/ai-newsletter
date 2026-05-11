import { Route } from 'react-router'
import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AnalyticsPage } from '../../pages/AnalyticsPage'
import { ReviewsPage } from '../../pages/ReviewsPage'
import TemplatesPage from '../../pages/TemplatesPage'
import { UsersPage } from '../../pages/UsersPage'

export const adminRoutes = (
    <>
        <Route
            path="/templates"
            element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FUNCTIONAL']}>
                    <ProtectedLayout>
                        <TemplatesPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/analytics"
            element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FUNCTIONAL']}>
                    <ProtectedLayout>
                        <AnalyticsPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/reviews"
            element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FUNCTIONAL']}>
                    <ProtectedLayout>
                        <ReviewsPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/users"
            element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ProtectedLayout>
                        <UsersPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />
    </>
)