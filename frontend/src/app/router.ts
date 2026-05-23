export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  newsletters: {
    create: '/crearNewsletter',
    edit: (id: string) =>
      `/editarNewsletter/${id}`,
  },

  templates: '/templates',
  analytics: '/analytics',
  reviews: {
    list: '/reviews',
    detail: (id: string) => `/reviews/${id}`,
  },

  users: '/users',
  settings: '/settings',
  backoffice: '/backoffice',
  brandkit: '/backoffice/brandkit',
  demo: '/demo',
}