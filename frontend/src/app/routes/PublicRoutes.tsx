import { Route } from 'react-router'

import { LoginPage } from '../../pages/LoginPage'

export const publicRoutes = (
  <>
    <Route
      path="/login"
      element={<LoginPage />}
    />

    <Route
      path="/"
      element={<LoginPage />}
    />
  </>
)