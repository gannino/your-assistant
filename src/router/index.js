import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/settings',
    redirect: '/settings/content',
  },
  {
    path: '/settings/content',
    name: 'settings-content',
    component: () => import('../views/settings/ContentSettings.vue'),
  },
  {
    path: '/settings/speech',
    name: 'settings-speech',
    component: () => import('../views/settings/SpeechSettings.vue'),
  },
  {
    path: '/settings/ai',
    name: 'settings-ai',
    component: () => import('../views/settings/AISettings.vue'),
  },
  {
    path: '/settings/electron',
    name: 'settings-electron',
    component: () => import('../views/settings/ElectronSettings.vue'),
  },
  // Legacy route redirect
  {
    path: '/setting',
    redirect: '/settings/content',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
