<template>
  <div class="login-bg d-flex justify-content-center align-items-center min-vh-100">
    <div class="card login-card p-4 shadow-lg animate__animated animate__fadeIn w-100" style="max-width: 400px;">
      <div class="text-center mb-3">
        <i class="fas fa-user-circle fa-3x text-primary mb-2"></i>
        <h2 class="fw-bold mb-0">Iniciar sesión</h2>
        <small class="text-muted">Accede a tu cuenta</small>
      </div>
      <div class="mb-3 input-group">
        <span class="input-group-text bg-light"><i class="fas fa-envelope"></i></span>
        <input v-model="loginEmail" class="form-control" placeholder="Email" autocomplete="username" />
      </div>
      <div class="mb-3 input-group">
        <span class="input-group-text bg-light"><i class="fas fa-lock"></i></span>
        <input v-model="loginPassword" type="password" class="form-control" placeholder="Contraseña" autocomplete="current-password" />
      </div>
      <button @click="login" class="btn btn-success w-100 mb-2" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Iniciar sesión
      </button>
      <transition name="fade">
        <p v-if="loginMessage" class="alert alert-danger py-2 mb-0 text-center animate__animated animate__fadeInDown">{{ loginMessage }}</p>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';

const loginEmail = ref('');
const loginPassword = ref('');
const loginMessage = ref('');
const loading = ref(false);

const user = ref(null);
const userProfile = ref({ nombre: '', apellido: '', telefono: '', rol: '', email: '' });
const router = useRouter();

const validateEmail = (email) => {
  // Validación simple de email
  return /.+@.+\..+/.test(email);
};

const validatePassword = (password) => {
  // Al menos 6 caracteres
  return password.length >= 6;
};

const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('nombre, apellido, telefono, rol, email')
    .eq('user_id', userId)
    .single();
  if (data) {
    userProfile.value = data;
  } else {
    userProfile.value = { nombre: '', apellido: '', telefono: '', rol: '', email: '' };
  }
};

const login = async () => {
  loginMessage.value = '';
  if (!validateEmail(loginEmail.value)) {
    loginMessage.value = 'Email inválido.';
    return;
  }
  if (!validatePassword(loginPassword.value)) {
    loginMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  loading.value = true;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value,
  });
  loading.value = false;
  if (error) {
    loginMessage.value = error.message;
    return;
  }
  if (data && data.user) {
    user.value = data.user;
    await fetchUserProfile(data.user.id);
    await Swal.fire({
      icon: 'success',
      title: 'Login exitoso',
      text: `Bienvenido, ${data.user.email}`
    });
    router.push({ name: 'dashboard' });
  }
};

const logout = async () => {
  await supabase.auth.signOut();
  user.value = null;
  userProfile.value = { nombre: '', apellido: '', telefono: '', rol: '', email: '' };
};

onMounted(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  user.value = currentUser;
  if (currentUser) {
    await fetchUserProfile(currentUser.id);
  }
  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user || null;
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    } else {
      userProfile.value = { nombre: '', apellido: '', telefono: '', rol: '', email: '' };
    }
  });
});

provide('user', user);
provide('userProfile', userProfile);
</script>

<style>

.login-card {
  border-radius: 1.5rem;
  background: var(--bs-card-bg, #fff);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  transition: box-shadow 0.3s;
}
.login-card:hover {
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.22);
}
body.dark .login-card {
  background: #23272f;
  color: #f1f1f1;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
