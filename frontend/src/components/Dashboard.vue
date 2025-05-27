<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container mt-5">
      <h1>Bienvenido al Dashboard</h1>
      <p>Aquí irán las funciones principales del sistema.</p>
    </div>
  </div>
</template>

<script setup>
import MainMenu from './MainMenu.vue';
import { inject } from 'vue';
const user = inject('user');
const userRole = inject('userRole');
</script>

<style scoped>
.container {
  max-width: 800px;
}
</style>
