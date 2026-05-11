import { Route } from 'react-router'
import { UnderConstructionPage } from '../../pages/UnderConstructionPage'
import { ThemeDemoPage } from '../../pages/ThemeDemoPage'

export const devRoutes= (
    <>
      <Route
        path="/demo"
        element={<ThemeDemoPage />}
      />

      <Route
        path="/newsletters/edit/:id"
        element={
          <UnderConstructionPage
            title="newsletters"
          />
        }
      />

      <Route
        path="/reviews/:id"
        element={
          <UnderConstructionPage
            title="reviews"
          />
        }
      />

      <Route
        path="/admin/templates/create"
        element={
          <UnderConstructionPage
            title="crear template"
          />
        }
      />

      <Route
        path="/admin/templates/edit/:id"
        element={
          <UnderConstructionPage
            title="editar template"
          />
        }
      />

      <Route
        path="/newsletters/preview/:id"
        element={
          <UnderConstructionPage
            title="preview newsletter"
          />
        }
      />

      <Route
        path="/logs"
        element={
          <UnderConstructionPage
            title="logs"
          />
        }
      />

      <Route
        path="/backoffice"
        element={
          <UnderConstructionPage
            title="backoffice"
          />
        }
      />

      <Route
        path="/branding"
        element={
          <UnderConstructionPage
            title="branding"
          />
        }
      />
    </>
  )
