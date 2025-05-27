<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container mt-5">
      <div class="card p-4 shadow w-100 mb-4" style="max-width: 900px; margin:auto;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Listado de usuarios</h3>
          <button class="btn btn-primary d-flex align-items-center gap-2" @click="showModal = true">
            <i class="fas fa-user-plus"></i> Registrar usuario
          </button>
        </div>
        <div class="row mb-3">
          <div class="col-md-6 mb-2">
            <input v-model="search" class="form-control" placeholder="Buscar por email, nombre o apellido" />
          </div>
          <div class="col-md-6 mb-2">
            <select v-model="filterRole" class="form-select">
              <option value="">Todos los roles</option>
              <option value="tecnico">Técnico</option>
              <option value="asistente">Asistente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle user-table">
            <thead>
              <tr>
                <th><i class="fas fa-envelope"></i> Email</th>
                <th><i class="fas fa-user"></i> Nombre</th>
                <th><i class="fas fa-user"></i> Apellido</th>
                <th><i class="fas fa-phone"></i> Teléfono</th>
                <th><i class="fas fa-user-tag"></i> Rol</th>
                <th><i class="fas fa-cogs"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id">
                <td>{{ u.email }}</td>
                <td>{{ u.nombre }}</td>
                <td>{{ u.apellido }}</td>
                <td>{{ u.telefono }}</td>
                <td>{{ u.role }}</td>
                <td>
                  <button class="btn btn-sm btn-warning me-1" @click="openEditModal(u)"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-sm btn-danger" @click="deleteUser(u)"><i class="fas fa-trash-alt"></i></button>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="text-center py-4">
                  <i class="fas fa-users-slash fa-2x mb-2 text-secondary"></i>
                  <div class="fw-bold">No hay usuarios que coincidan.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de registro de usuario -->
      <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.3);" v-if="showModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar nuevo usuario</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <input v-model="registerEmail" class="form-control mb-2" placeholder="Email" />
              <input v-model="registerPassword" type="password" class="form-control mb-2" placeholder="Contraseña" />
              <input v-model="registerNombre" class="form-control mb-2" placeholder="Nombre" />
              <input v-model="registerApellido" class="form-control mb-2" placeholder="Apellido" />
              <input v-model="registerTelefono" class="form-control mb-2" placeholder="Teléfono (opcional)" />
              <select v-model="registerRole" class="form-select mb-2">
                <option value="tecnico">Técnico</option>
                <option value="asistente">Asistente</option>
                <option value="admin">Administrador</option>
              </select>
              <p v-if="registerMessage" class="text-danger">{{ registerMessage }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="register">Registrar</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showModal" class="modal-backdrop fade show"></div>

      <!-- Modal de edición de usuario -->
      <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.3);" v-if="showEditModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar usuario</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body">
              <input v-model="editUserData.nombre" class="form-control mb-2" placeholder="Nombre" />
              <input v-model="editUserData.apellido" class="form-control mb-2" placeholder="Apellido" />
              <input v-model="editUserData.telefono" class="form-control mb-2" placeholder="Teléfono (opcional)" />
              <select v-model="editUserData.role" class="form-select mb-2">
                <option value="tecnico">Técnico</option>
                <option value="asistente">Asistente</option>
                <option value="admin">Administrador</option>
              </select>
              <p v-if="editMessage" class="text-danger">{{ editMessage }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="updateUser">Guardar cambios</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showEditModal" class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script setup>
import MainMenu from './MainMenu.vue';
import { ref, inject, computed, onMounted } from 'vue';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';

const user = inject('user');
const userRole = inject('userRole');

// Modal
const showModal = ref(false);
const showEditModal = ref(false);
const closeModal = () => {
  showModal.value = false;
  registerEmail.value = '';
  registerPassword.value = '';
  registerNombre.value = '';
  registerApellido.value = '';
  registerTelefono.value = '';
  registerRole.value = 'tecnico';
  registerMessage.value = '';
};
// (Eliminado duplicado de closeEditModal)

// Registro
const registerEmail = ref('');
const registerPassword = ref('');
const registerRole = ref('tecnico');
const registerNombre = ref('');
const registerApellido = ref('');
const registerTelefono = ref('');
const registerMessage = ref('');

const validateEmail = (email) => /.+@.+\..+/.test(email);
const validatePassword = (password) => password.length >= 6;

const register = async () => {
  registerMessage.value = '';
  if (!validateEmail(registerEmail.value)) {
    registerMessage.value = 'Email inválido.';
    return;
  }
  if (!validatePassword(registerPassword.value)) {
    registerMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  if (!registerNombre.value || !registerApellido.value) {
    registerMessage.value = 'Nombre y apellido son obligatorios.';
    return;
  }
  // Crear usuario en auth
  const { data, error } = await supabase.auth.signUp({
    email: registerEmail.value,
    password: registerPassword.value,
  });
  if (error) {
    registerMessage.value = error.message;
    return;
  }
  // Tomar el uuid del usuario creado
  const userId = data.user?.id;
  console.log('UUID del usuario creado:', userId);
  if (userId) {
    // Insertar en profiles con el uuid y toda la información
    const profileData = {
      user_id: userId,
      nombre: registerNombre.value,
      apellido: registerApellido.value,
      telefono: registerTelefono.value,
      email: registerEmail.value,
      rol: registerRole.value,
      pendiente: false
    };
    console.log('Insertando en profiles:', profileData);
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);
    if (profileError) {
      console.error('Error al insertar en profiles:', profileError);
      registerMessage.value = 'Usuario creado, pero error guardando datos: ' + profileError.message;
      return;
    }
    await Swal.fire({
      icon: 'success',
      title: 'Usuario registrado',
      html: `<b>Email:</b> ${registerEmail.value}<br><b>Nombre:</b> ${registerNombre.value} ${registerApellido.value}<br><b>Rol:</b> ${registerRole.value}`,
      confirmButtonText: 'Aceptar',
    });
    await fetchUsers();
    closeModal();
  } else {
    registerMessage.value = 'Usuario creado, pero no se pudo guardar el perfil (userId no disponible).';
  }
};

// Sincronizar perfil al login si estaba pendiente y el email ya está verificado
const syncProfileOnLogin = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  // Buscar perfil pendiente
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('pendiente', true);
  if (error || !profiles || profiles.length === 0) return;
  // Si el email está verificado, actualizar pendiente a false
  if (user.email_confirmed_at || user.confirmed_at) {
    await supabase
      .from('profiles')
      .update({ pendiente: false, email: user.email })
      .eq('user_id', user.id);
    // Puedes agregar aquí lógica para sincronizar otros datos si es necesario
  }
};

onMounted(async () => {
  await fetchUsers();
  await syncProfileOnLogin();
});

// Edición
const editUserData = ref({ id: '', nombre: '', apellido: '', telefono: '', role: '' });
const editMessage = ref('');

const openEditModal = (user) => {
  editUserData.value = { ...user };
  editMessage.value = '';
  showEditModal.value = true;
};
const closeEditModal = () => {
  showEditModal.value = false;
  editUserData.value = { id: '', nombre: '', apellido: '', telefono: '', role: '' };
  editMessage.value = '';
};

const updateUser = async () => {
  editMessage.value = '';
  if (!editUserData.value.nombre || !editUserData.value.apellido) {
    editMessage.value = 'Nombre y apellido son obligatorios.';
    return;
  }
  // Actualizar datos en profiles
  const { error } = await supabase
    .from('profiles')
    .update({
      nombre: editUserData.value.nombre,
      apellido: editUserData.value.apellido,
      telefono: editUserData.value.telefono,
      rol: editUserData.value.role
    })
    .eq('user_id', editUserData.value.id);
  if (error) {
    editMessage.value = 'Error al actualizar: ' + error.message;
    return;
  }
  await fetchUsers();
  closeEditModal();
};

// Eliminación
const deleteUser = async (user) => {
  if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
  // Eliminar de user_roles
  await supabase.from('user_roles').delete().eq('user_id', user.id);
  // Eliminar de auth (requiere privilegios de admin)
  try {
    await supabase.auth.admin.deleteUser(user.id);
  } catch (e) {
    // Puede fallar si no hay permisos suficientes
  }
  await fetchUsers();
};

// Listado y filtrado
const users = ref([]);
const search = ref('');
const filterRole = ref('');

const fetchUsers = async () => {
  try {
    const response = await fetch('/api/profiles'); // Ahora usa el proxy de Vite
    if (!response.ok) throw new Error('Error al obtener usuarios');
    const profiles = await response.json();
    users.value = profiles.map(p => ({
      id: p.user_id,
      email: p.email || '',
      role: p.rol || '',
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      telefono: p.telefono || '',
    }));
  } catch (e) {
    users.value = [];
  }
};

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesRole = filterRole.value ? u.role === filterRole.value : true;
    const matchesSearch = search.value
      ? (
        (u.email && u.email.toLowerCase().includes(search.value.toLowerCase())) ||
        (u.nombre && u.nombre.toLowerCase().includes(search.value.toLowerCase())) ||
        (u.apellido && u.apellido.toLowerCase().includes(search.value.toLowerCase()))
      )
      : true;
    return matchesRole && matchesSearch;
  });
});

onMounted(fetchUsers);
</script>

<style scoped>
.container {
  max-width: 1100px;
}
.table {
  background: #fff;
}
.modal {
  display: block;
}
.modal-backdrop {
  z-index: 1040;
}
.user-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.user-table th {
  background: #f4f6fa;
  color: #2563eb;
  font-weight: 700;
  border-bottom: 2px solid #e5e7eb;
}
.user-table td {
  background: #fff;
  color: #222;
  vertical-align: middle;
}
.user-table tr {
  transition: background 0.2s;
}
.user-table tr:hover {
  background: #f1f5fd;
}
body.dark-mode .user-table th {
  background: #181a20;
  color: #a5b4fc;
}
body.dark-mode .user-table td {
  background: #23272f;
  color: #e5e7eb;
}
body.dark-mode .user-table tr:hover {
  background: #232b3b;
}
</style>
