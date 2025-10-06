import { createRouter, createWebHistory } from 'vue-router';
import Auth from './components/Auth.vue';
import Dashboard from './components/Dashboard.vue';
import UserManagement from './components/UserManagement.vue';
import api from './api';

const routes = [
  { path: '/', name: 'auth', component: Auth },
  { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['admin', 'tecnico', 'asistente'] } },
  { path: '/usuarios', name: 'users', component: UserManagement, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/mapa', name: 'mapa', component: () => import('./components/MapView.vue'), meta: { requiresAuth: true, roles: ['admin', 'tecnico', 'asistente'] } },
  // Puedes agregar más rutas y definir los roles permitidos en meta.roles
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const session = await api.getSession();
    const user = session?.user;
    if (!user) {
      return next({ name: 'auth' });
    }
    // Consultar el rol del usuario
    const profile = await api.getUserProfile(user.id);
    const userRole = profile?.data?.rol;
    if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      // Si el rol no está permitido, redirigir a inicio o mostrar error
      return next({ name: 'auth' });
    }
    return next();
  }
  return next();
});

export default router;
