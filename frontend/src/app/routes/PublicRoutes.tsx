import { Route } from 'react-router'

import { LoginPage } from '../../pages/LoginPage'
import { AuthCallbackPage } from '../../pages/AuthCallbackPage'

export const publicRoutes = (
  <>
    <Route
      path="/login"
      element={<LoginPage />}
    />

    <Route
      path="/auth/callback"
      element={<AuthCallbackPage />}
    />

    <Route
      path="/"
      element={<LoginPage />}
    />
  </>
)