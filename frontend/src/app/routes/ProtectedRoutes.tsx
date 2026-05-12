import { Route } from 'react-router'

import { ProtectedLayout } from '../../components/ProtectedLayout'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { DashboardPage } from '../../pages/DashboardPage'
import CreateNewsletterPage from '../../pages/CreateNewsletterPage'
import EditNewsletterPage from '../../pages/EditNewsletterPage'
import { EditTemplatePage } from '../../pages/EditTemplatePage'
import { SettingsPage } from '../../pages/SettingsPage'
import { TemplateLibraryPage } from '../../pages/TemplateLibraryPage'

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
                <ProtectedRoute>
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

        <Route
            path="/templates/biblioteca"
            element={
                <ProtectedRoute>
                    <ProtectedLayout>
                        <TemplateLibraryPage />
                    </ProtectedLayout>
                </ProtectedRoute>
            }
        />
    </>
)