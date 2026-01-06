const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/CreateSessionPage.vue'),
      },
      {
        path: '/sessions',
        name: 'sessions',
        component: () => import('pages/SessionsPage.vue'),
      },
      {
        path: '/creator/:id',
        name: 'creator',
        component: () => import('pages/CreatorSessionPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/helper',
    component: () => import('layouts/HelperLayout.vue'),
    children: [
      {
        path: ':id',
        name: 'helper',
        component: () => import('pages/HelperSessionPage.vue'),
        props: true,
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
