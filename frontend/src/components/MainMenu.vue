<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4 fixed-top shadow">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center gap-2" href="#">
        <i class="fas fa-map-marked-alt"></i>
        MAPEO
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
  border-radius: 8px;
  z-index: 1050;
}
body {
  padding-top: 70px;
}
@media (max-width: 767px) {
  .navbar-text {
    display: none !important;
  }
}
</style>
