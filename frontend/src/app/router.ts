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

  reviews: '/reviews',

  users: '/users',

  settings: '/settings',

  demo: '/demo',
}