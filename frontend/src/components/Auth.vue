<template>
  <div class="login-bg d-flex justify-content-center align-items-center min-vh-100">
    <!-- Efecto de malla en perspectiva -->
    <div class="perspective-grid"></div>
    
    <!-- Efecto de luz sutil -->
    <div class="light-effect"></div>
    
    <!-- Partículas flotantes pequeñas -->
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    
    <!-- Elementos decorativos flotantes -->
    <div class="floating-element" style="width: 150px; height: 150px; top: 15%; left: 20%; opacity: 0.3; animation: float-slow 8s infinite ease-in-out;"></div>
    <div class="floating-element" style="width: 100px; height: 100px; top: 55%; left: 15%; opacity: 0.2; animation: float-medium 10s infinite ease-in-out;"></div>
    <div class="floating-element" style="width: 80px; height: 80px; bottom: 25%; right: 18%; opacity: 0.15; animation: float-fast 7s infinite ease-in-out;"></div>
    <div class="floating-element" style="width: 120px; height: 120px; top: 20%; right: 22%; opacity: 0.25; animation: float-medium 12s infinite ease-in-out;"></div>
    <div class="floating-element" style="width: 60px; height: 60px; bottom: 15%; left: 30%; opacity: 0.1; animation: float-fast 9s infinite ease-in-out;"></div>
    <div class="card login-card shadow-lg animate__animated animate__fadeIn w-100" style="max-width: 450px;">
      <div class="login-header p-4 text-center">
        <div class="login-avatar mb-3">
          <i class="fas fa-map-marked-alt"></i>
        </div>
        <h2 class="fw-bold">Bienvenido</h2>
        <p class="text-muted mb-0">Ingresa tus credenciales para acceder</p>
      </div>
      
      <div class="login-body p-4 pt-2">
        <div class="mb-4 form-floating">
          <input 
            v-model="loginEmail" 
            class="form-control login-input" 
            id="floatingEmail"
            placeholder="Email" 
            autocomplete="username" 
            @keyup.enter="login"
          />
          <label for="floatingEmail"><i class="fas fa-envelope me-2"></i>Email</label>
        </div>
        
        <div class="mb-4 form-floating">
          <input 
            v-model="loginPassword" 
            type="password" 
            class="form-control login-input" 
            id="floatingPassword"
            placeholder="Contraseña" 
            autocomplete="current-password" 
            @keyup.enter="login"
          />
          <label for="floatingPassword"><i class="fas fa-lock me-2"></i>Contraseña</label>
        </div>
        
        <button @click="login" class="btn btn-primary w-100 py-3 mb-3 login-btn" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <span v-else><i class="fas fa-sign-in-alt me-2"></i></span>
          Iniciar sesión
        </button>
        
        <transition name="fade">
          <div v-if="loginMessage" class="alert alert-danger py-2 mb-0 text-center animate__animated animate__fadeInDown">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ loginMessage }}
          </div>
        </transition>
      </div>
        <div class="login-footer p-3 text-center">
        <small class="text-muted">Sistema de Mapeo de Infraestructura &copy; {{ currentYear }}</small>
        <div class="mt-1">
          <small class="text-muted developer-info">Desarrollado por <span class="company-name">Alfa Corporation S.A. de C.V.</span></small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import Swal from 'sweetalert2';

const loginEmail = ref('');
const loginPassword = ref('');
const loginMessage = ref('');
const loading = ref(false);
const currentYear = computed(() => new Date().getFullYear());

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
  const result = await api.getUserProfile(userId);
  if (result && result.data) {
    userProfile.value = result.data;
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
  const result = await api.login({
    email: loginEmail.value,
    password: loginPassword.value
  });
  loading.value = false;
  if (result.error) {
    loginMessage.value = result.error;
    return;
  }
  if (result.data && result.data.user) {
    user.value = result.data.user;
    await fetchUserProfile(result.data.user.id);
    await Swal.fire({
      icon: 'success',
      title: 'Login exitoso',
      text: `Bienvenido, ${result.data.user.email}`,
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false
    });
    router.push({ name: 'dashboard' });
  }
};

const logout = async () => {
  await api.logout();
  user.value = null;
  userProfile.value = { nombre: '', apellido: '', telefono: '', rol: '', email: '' };
};

onMounted(async () => {
  const session = await api.getSession();
  user.value = session?.user || null;
  if (session?.user) {
    await fetchUserProfile(session.user.id);
  } else {
    userProfile.value = { nombre: '', apellido: '', telefono: '', rol: '', email: '' };
  }
});

provide('user', user);
provide('userProfile', userProfile);
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
}

.login-bg::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><rect x="25" y="25" width="50" height="50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
  background-size: 100px 100px;
  opacity: 0.4;
  z-index: 0;
  transform: rotate(15deg);
  animation: backgroundFloat 30s infinite linear;
}

.login-bg::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(62, 152, 255, 0.2) 0%, transparent 25%),
    radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 35%),
    radial-gradient(circle at 40% 80%, rgba(30, 64, 175, 0.2) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(29, 78, 216, 0.15) 0%, transparent 25%);
  z-index: 0;
}

.perspective-grid {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: rotateX(60deg) rotateZ(45deg);
  transform-style: preserve-3d;
  perspective: 1000px;
  z-index: 0;
  animation: grid-float 20s infinite linear;
}

@keyframes grid-float {
  0% {
    transform: rotateX(60deg) rotateZ(45deg) translateZ(0);
  }
  50% {
    transform: rotateX(60deg) rotateZ(45deg) translateZ(20px);
  }
  100% {
    transform: rotateX(60deg) rotateZ(45deg) translateZ(0);
  }
}

/* Elementos flotantes decorativos */
.login-bg .floating-element {
  position: absolute;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

@keyframes backgroundFloat {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

/* Animaciones para partículas flotantes */
@keyframes float-slow {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}

@keyframes float-medium {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-30px) translateX(-15px); }
}

@keyframes float-fast {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-15px) translateX(20px); }
}

.login-card {
  border-radius: 1.5rem;
  background: var(--bs-card-bg, #fff);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border: none;
  overflow: hidden;
  position: relative;
  z-index: 1;
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.22);
}

.login-header {
  position: relative;
  overflow: hidden;
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(135deg, transparent 49%, rgba(59, 130, 246, 0.1) 50%, transparent 51%);
  background-size: 20px 20px;
  z-index: 0;
}

.login-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
  border: 5px solid rgba(255, 255, 255, 0.8);
  position: relative;
  transition: transform 0.3s;
}

.login-avatar:hover {
  transform: rotate(5deg) scale(1.05);
}

.login-avatar i {
  font-size: 30px;
  color: white;
}

.login-input {
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(59, 130, 246, 0.1);
  background-color: rgba(59, 130, 246, 0.02);
  transition: all 0.3s;
}

.login-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.25);
  background-color: white;
}

.form-floating label {
  padding-left: 1rem;
}

.login-btn {
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.login-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1e3a8a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.login-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(45deg);
  z-index: 0;
  transition: all 0.6s;
  opacity: 0;
}

.login-btn:hover::after {
  opacity: 1;
  transform: rotate(45deg) translate(10%, 10%);
}

.login-btn:disabled {
  background: #94a3b8;
  transform: none;
  box-shadow: none;
}

.alert {
  border-radius: 0.75rem;
  position: relative;
  overflow: hidden;
}

.alert::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #ef4444;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.login-footer {
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

/* Modo oscuro */
:global(body.dark-mode) .login-card {
  background: #1e293b;
  color: #f1f5f9;
}

:global(body.dark-mode) .login-input {
  background-color: rgba(30, 41, 59, 0.8);
  border-color: #334155;
  color: #f1f5f9;
}

:global(body.dark-mode) .login-input:focus {
  background-color: #0f172a;
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.25);
}

:global(body.dark-mode) .text-muted {
  color: #94a3b8 !important;
}

:global(body.dark-mode) .form-floating label {
  color: #94a3b8;
}

:global(body.dark-mode) .login-footer {
  border-top-color: #334155;
}

.developer-info {
  font-size: 0.85rem;
  opacity: 0.9;
}

.company-name {
  font-weight: 600;
  color: #3b82f6;
  letter-spacing: -0.2px;
}

:global(body.dark-mode) .company-name {
  color: #60a5fa;
}

/* Estilos globales para eliminar márgenes y bordes blancos */
:global(body),
:global(html) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

:global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}
</style>
