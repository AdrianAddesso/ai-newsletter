import { Route } from 'react-router'

import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { DashboardPage } from '../../pages/DashboardPage'
import CreateNewsletterPage from '../../pages/CreateNewsletterPage'
import EditNewsletterPage from '../../pages/EditNewsletterPage'
import { EditTemplatePage } from '../../pages/EditTemplatePage'
import { SettingsPage } from '../../pages/SettingsPage'

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
            path="/crearNewsletter"
            element={
                <ProtectedRoute allowedRoles={['ADMIN', 'USER']}>
                    <ProtectedLayout>
                        <CreateNewsletterPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/editarNewsletter/:id"
            element={
                <ProtectedRoute>
                    <ProtectedLayout>
                        <EditNewsletterPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/editarTemplate/:id"
            element={
                <ProtectedRoute>
                    <ProtectedLayout>
                        <EditTemplatePage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />

        <Route
            path="/settings"
            element={
                <ProtectedRoute>
                    <ProtectedLayout>
                        <SettingsPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />
    </>
)