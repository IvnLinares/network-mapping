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
  
  // Disparar evento para notificar a los componentes sobre el cambio de modo
  document.dispatchEvent(new CustomEvent('dark-mode-changed', { detail: { isDark: isDark.value } }));
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
  
  // Escuchar el evento toggle-dark-mode desde los componentes
  document.addEventListener('toggle-dark-mode', () => {
    toggleDarkMode();
  });
});

provide('user', user);
provide('userRole', userRole);
</script>

<template>
  <router-view />
  <button 
    class="btn theme-toggle-btn rounded-circle position-fixed d-flex align-items-center justify-content-center"
    @click="toggleDarkMode"
    aria-label="Alternar modo oscuro"
  >
    <i v-if="!isDark" class="fas fa-moon"></i>
    <i v-else class="fas fa-sun"></i>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  width: 56px;
  height: 56px;
  bottom: 32px;
  right: 32px;
  z-index: 2000;
  box-shadow: 0 3px 15px rgba(0,0,0,0.25);
  font-size: 1.5rem;
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  color: white;
  transition: all 0.3s ease;
  border: none;
}

.theme-toggle-btn:hover {
  transform: scale(1.1) translateY(-2px);
  background: linear-gradient(145deg, #2563eb, #1d4ed8);
  box-shadow: 0 5px 20px rgba(37, 99, 235, 0.5);
}

:global(body.dark-mode) .theme-toggle-btn {
  background: linear-gradient(145deg, #f59e0b, #d97706);
  color: #0f172a;
  box-shadow: 0 3px 15px rgba(0,0,0,0.3);
}

:global(body.dark-mode) .theme-toggle-btn:hover {
  background: linear-gradient(145deg, #fbbf24, #f59e0b);
  box-shadow: 0 5px 20px rgba(245, 158, 11, 0.3);
}
</style>
