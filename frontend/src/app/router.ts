export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  newsletters: {
    create: '/newsletters/create',
    edit: (id: string) =>
      `/newsletters/edit/${id}`,
    export: (id: string) =>
      `/newsletters/export/${id}`,
  },

  templates: '/templates',
  templateLibrary: '/templates/library',
  analytics: '/analytics',
  reviews: {
    list: '/reviews',
    detail: (id: string) => `/reviews/${id}`,
  },

  users: '/admin/users',
  backoffice: '/admin',
  brandkit: '/admin/brandkit',
}
