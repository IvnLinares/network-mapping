<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 fixed-top shadow-sm">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center gap-2" href="#">
        <i class="fas fa-map-marked-alt logo-icon"></i>
        <span class="brand-text">Network-Mapping<span class="brand-highlight">.maps</span></span>
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
        
        <span class="navbar-text me-3 d-none d-md-inline user-info">
          <i class="fas fa-user-circle me-1"></i>
          {{ userEmail }} <span class="user-role">({{ userRole }})</span>
        </span>
        <button class="btn btn-danger btn-sm d-flex align-items-center gap-2 logout-btn" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Cerrar sesión
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const props = defineProps({
  userEmail: String,
  userRole: String,
});

const darkMode = inject('darkMode', false);
const router = useRouter();

const logout = async () => {
  await api.logout();
  router.push({ name: 'auth' });
};
</script>

<style scoped>
.navbar {
  border-radius: 0 0 12px 12px;
  z-index: 1050;
  transition: all 0.3s ease;
  padding: 12px 20px;
  background: linear-gradient(to right, #ffffff, #f8f9fa) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: -0.5px;
}

.brand-text {
  background: linear-gradient(120deg, #2563eb, #4338ca);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.brand-highlight {
  opacity: 0.85;
}

.logo-icon {
  color: #2563eb;
  font-size: 1.5rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
  animation: pulse 5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 2px;
  position: relative;
}

.nav-link i {
  font-size: 1.1rem;
  opacity: 0.75;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.nav-link:hover i {
  opacity: 1;
  transform: scale(1.1);
}

.nav-link.router-link-active {
  background-color: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-weight: 600;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 8px;
  right: 8px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, #2563eb, #4338ca);
}

.logout-btn {
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(244, 63, 94, 0.15);
  background: linear-gradient(to right, #f43f5e, #e11d48);
  border: none;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(244, 63, 94, 0.25);
  background: linear-gradient(to right, #e11d48, #be123c);
}

.user-info {
  background: rgba(59, 130, 246, 0.08);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  display: flex;
  align-items: center;
}

.user-role {
  color: #2563eb;
  font-weight: 600;
  font-size: 0.85rem;
}

body {
  padding-top: 70px;
}

.navbar-toggler {
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.08);
}

.navbar-toggler:hover {
  background-color: rgba(59, 130, 246, 0.12);
}

@media (max-width: 767px) {
  .navbar {
    border-radius: 0;
    padding: 10px 16px;
  }
  
  .navbar-brand {
    font-size: 1.2rem;
  }
  
  .logo-icon {
    font-size: 1.3rem;
  }
}

/* Estilos para modo oscuro */
:global(body.dark-mode) .navbar {
  background: linear-gradient(to right, #0f172a, #1e293b) !important;
  border-bottom: 1px solid #334155;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:global(body.dark-mode) .navbar-brand,
:global(body.dark-mode) .navbar-text {
  color: #f8fafc;
}

:global(body.dark-mode) .brand-text {
  background: linear-gradient(120deg, #60a5fa, #93c5fd);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

:global(body.dark-mode) .brand-highlight {
  opacity: 0.9;
}

:global(body.dark-mode) .logo-icon {
  color: #60a5fa;
  filter: drop-shadow(0 1px 3px rgba(147, 197, 253, 0.3));
}

:global(body.dark-mode) .nav-link {
  color: #e2e8f0;
}

:global(body.dark-mode) .nav-link.router-link-active {
  background-color: rgba(96, 165, 250, 0.15);
  color: #93c5fd;
}

:global(body.dark-mode) .nav-link:hover {
  background-color: rgba(96, 165, 250, 0.1);
  color: #f1f5f9;
}

:global(body.dark-mode) .nav-link.router-link-active::after {
  background: linear-gradient(90deg, #60a5fa, #93c5fd);
}

:global(body.dark-mode) .user-info {
  background: rgba(96, 165, 250, 0.15);
  color: #e2e8f0;
}

:global(body.dark-mode) .user-role {
  color: #93c5fd;
}

:global(body.dark-mode) .logout-btn {
  background: linear-gradient(to right, #f87171, #ef4444);
}

:global(body.dark-mode) .logout-btn:hover {
  background: linear-gradient(to right, #ef4444, #dc2626);
}
</style>
