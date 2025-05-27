<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 fixed-top shadow-sm">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center gap-2" href="#">
        <i class="fas fa-map-marked-alt"></i>
        TELENETWORK.maps
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenuNavbar" aria-controls="mainMenuNavbar" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainMenuNavbar">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link class="nav-link" to="/dashboard">
              <i class="fas fa-tachometer-alt"></i> Dashboard
            </router-link>
          </li>
          <li v-if="userRole === 'admin'" class="nav-item">
            <router-link class="nav-link" to="/usuarios">
              <i class="fas fa-users-cog"></i> Administración de Usuarios
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/mapa">
              <i class="fas fa-map"></i> Mapa
            </router-link>
          </li>
        </ul>
        <span class="navbar-text me-3 d-none d-md-inline">
          {{ userEmail }} ({{ userRole }})
        </span>
        <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Cerrar sesión
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
const props = defineProps({
  userEmail: String,
  userRole: String,
});
const router = useRouter();
const logout = async () => {
  await supabase.auth.signOut();
  router.push({ name: 'auth' });
};
</script>

<style scoped>
.navbar {
  border-radius: 0 0 8px 8px;
  z-index: 1050;
  transition: all 0.3s ease;
  padding: 10px 16px;
}

.navbar-brand {
  font-weight: bold;
  font-size: 1.3rem;
}

.navbar-brand i {
  color: #2563eb;
  font-size: 1.4rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: #2563eb;
  transform: translateY(-2px);
}

.btn-outline-danger {
  border-width: 2px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-outline-danger:hover {
  transform: translateY(-2px);
}

.navbar-text {
  font-size: 0.9rem;
  opacity: 0.8;
}

body {
  padding-top: 70px;
}

@media (max-width: 767px) {
  .navbar-text {
    display: none !important;
  }
}

:global(body.dark-mode) .navbar {
  background-color: #1e293b !important;
  background-image: linear-gradient(to right, #1e293b, #0f172a) !important;
  color: #f8fafc !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border-bottom: 1px solid #334155;
}

:global(body.dark-mode) .navbar-brand,
:global(body.dark-mode) .nav-link,
:global(body.dark-mode) .navbar-text {
  color: #f8fafc !important;
}

:global(body.dark-mode) .navbar-brand {
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

:global(body.dark-mode) .navbar-brand i {
  color: #3b82f6;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

:global(body.dark-mode) .nav-link {
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  padding-left: 10px !important;
  padding-right: 10px !important;
  transition: all 0.2s ease;
}

:global(body.dark-mode) .nav-link:hover {
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

:global(body.dark-mode) .nav-link.active {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6 !important;
  font-weight: 600;
}

:global(body.dark-mode) .navbar-toggler {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

:global(body.dark-mode) .navbar-toggler-icon {
  filter: invert(1) brightness(0.9);
}

:global(body.dark-mode) .btn-outline-danger {
  border: 2px solid #f87171;
  color: #f87171;
  background: transparent;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

:global(body.dark-mode) .btn-outline-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}
</style>
