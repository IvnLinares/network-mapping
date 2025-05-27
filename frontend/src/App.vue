<script setup>
import { ref, provide, onMounted } from 'vue';
import { supabase } from './supabase';

const user = ref(null);
const userRole = ref('');

const isDark = ref(false);

const fetchUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('rol')
    .eq('user_id', userId)
    .single();
  if (data && data.rol) {
    userRole.value = data.rol;
  } else {
    userRole.value = '';
  }
};

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('darkMode', isDark.value ? '1' : '0');
};

onMounted(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  user.value = currentUser;
  if (currentUser) {
    await fetchUserRole(currentUser.id);
  }
  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user || null;
    if (session?.user) {
      await fetchUserRole(session.user.id);
    } else {
      userRole.value = '';
    }
  });
  // Dark mode persistencia
  if (localStorage.getItem('darkMode') === '1') {
    isDark.value = true;
    document.body.classList.add('dark-mode');
  }
});

provide('user', user);
provide('userRole', userRole);
</script>

<template>
  <router-view />
  <button 
    class="btn btn-dark rounded-circle position-fixed d-flex align-items-center justify-content-center"
    style="width: 56px; height: 56px; bottom: 32px; right: 32px; z-index: 2000; box-shadow: 0 2px 8px rgba(0,0,0,0.18); font-size: 1.5rem;"
    @click="toggleDarkMode"
    aria-label="Alternar modo oscuro"
  >
    <i v-if="!isDark" class="fas fa-moon"></i>
    <i v-else class="fas fa-sun"></i>
  </button>
</template>

<style scoped>
/* ...existing code... */
</style>
