<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container user-management-container">
      <div class="card shadow-lg border-0 user-management-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 class="section-title mb-1">
              <i class="fas fa-users-cog me-2"></i> Gestión de Usuarios
            </h3>
            <p class="text-muted section-subtitle mb-0">Administra los usuarios del sistema</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary d-flex align-items-center gap-2 btn-sync" @click="forceSync">
              <i class="fas fa-sync-alt"></i> Sincronizar perfiles
            </button>
            <button class="btn btn-primary d-flex align-items-center gap-2 btn-add-user" @click="showModal = true">
              <i class="fas fa-user-plus"></i> Registrar usuario
            </button>
          </div>
        </div>
        
        <div class="row mb-4 search-filters">
          <div class="col-md-6 mb-2">
            <div class="input-group search-input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="fas fa-search text-primary"></i>
              </span>
              <input v-model="search" class="form-control border-start-0" placeholder="Buscar por email, nombre o apellido" />
            </div>
          </div>
          <div class="col-md-6 mb-2">
            <div class="input-group filter-input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="fas fa-filter text-primary"></i>
              </span>
              <select v-model="filterRole" class="form-select border-start-0">
                <option value="">Todos los roles</option>
                <option value="tecnico">Técnico</option>
                <option value="asistente">Asistente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="table-responsive rounded-3 mb-3">
          <table class="table table-hover align-middle user-table">
            <thead>
              <tr>
                <th><i class="fas fa-envelope"></i> Email</th>
                <th><i class="fas fa-user"></i> Nombre</th>
                <th><i class="fas fa-user"></i> Apellido</th>
                <th><i class="fas fa-phone"></i> Teléfono</th>
                <th><i class="fas fa-user-tag"></i> Rol</th>
                <th><i class="fas fa-check-circle"></i> Estado</th>
                <th><i class="fas fa-calendar"></i> Creado</th>
                <th><i class="fas fa-clock"></i> Último acceso</th>
                <th><i class="fas fa-cogs"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>              <tr v-if="isLoading">
                <td colspan="9" class="text-center py-5">
                  <div class="d-flex flex-column justify-content-center align-items-center loading-container">
                    <div class="spinner-pulse mb-3" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                    <span class="text-primary fw-medium loading-text">Cargando usuarios...</span>
                  </div>
                </td>
              </tr>              <tr v-else-if="filteredUsers.length === 0">
                <td colspan="9" class="text-center py-5">
                  <div class="empty-state">
                    <i class="fas fa-users-slash fa-4x mb-3 text-secondary empty-icon"></i>
                    <div class="fw-bold mb-2 empty-title">No hay usuarios que coincidan</div>
                    <p class="text-muted mb-3">Intenta con otra búsqueda o limpia los filtros</p>
                    <button class="btn btn-sm btn-outline-secondary px-4" @click="filterRole = ''; search = ''">
                      <i class="fas fa-filter-circle-xmark me-2"></i>Limpiar filtros
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="u in filteredUsers" :key="u.id" class="user-row">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="user-avatar me-2">
                      <span class="user-initial">{{ u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U' }}</span>
                    </div>
                    <div>
                      {{ u.email }}
                      <i v-if="u.emailVerificado" class="fas fa-check-circle text-success ms-1" title="Email verificado"></i>
                      <i v-else class="fas fa-exclamation-circle text-warning ms-1" title="Email no verificado"></i>
                    </div>
                  </div>
                </td>
                <td>{{ u.nombre }}</td>
                <td>{{ u.apellido }}</td>
                <td>{{ u.telefono || '—' }}</td>
                <td>
                  <span class="badge" :class="getRoleBadgeClass(u.role)">{{ u.role }}</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(u.estado)">{{ u.estado }}</span>
                </td>
                <td>{{ formatDate(u.fechaCreacion) }}</td>
                <td>{{ formatDate(u.ultimoLogin) }}</td>                <td class="action-cell">
                  <div class="dropdown action-dropdown">
                    <button class="btn btn-action" type="button" @click.stop.prevent="toggleActionMenu($event)" aria-label="Opciones">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end action-menu">
                      <button class="dropdown-item d-flex align-items-center" @click="openEditModal(u)">
                        <i class="fas fa-edit me-2 text-primary"></i> <span>Editar</span>
                      </button>
                      <button class="dropdown-item d-flex align-items-center" @click="viewUserDetails(u)">
                        <i class="fas fa-info-circle me-2 text-info"></i> <span>Ver detalles</span>
                      </button>
                      <div class="dropdown-divider"></div>
                      <button class="dropdown-item d-flex align-items-center" @click="deleteUser(u)">
                        <i class="fas fa-trash-alt me-2 text-danger"></i> <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-between align-items-center small text-muted">
          <div>
            <span v-if="filteredUsers.length > 0">Mostrando {{ filteredUsers.length }} de {{ users.length }} usuarios</span>
            <span v-else>No hay usuarios que coincidan con los criterios de búsqueda</span>
          </div>
          <div>
            <span>Última actualización: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </div>

      <!-- Modal de registro de usuario -->
      <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.3);" v-if="showModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Registrar nuevo usuario</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>            <div class="modal-body">
              <div class="form-floating mb-3">
                <input v-model="registerEmail" class="form-control" id="registerEmail" placeholder="Email" />
                <label for="registerEmail"><i class="fas fa-envelope me-2"></i>Email</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="registerPassword" type="password" class="form-control" id="registerPassword" placeholder="Contraseña" />
                <label for="registerPassword"><i class="fas fa-lock me-2"></i>Contraseña</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="registerNombre" class="form-control" id="registerNombre" placeholder="Nombre" />
                <label for="registerNombre"><i class="fas fa-user me-2"></i>Nombre</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="registerApellido" class="form-control" id="registerApellido" placeholder="Apellido" />
                <label for="registerApellido"><i class="fas fa-user me-2"></i>Apellido</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="registerTelefono" class="form-control" id="registerTelefono" placeholder="Teléfono (opcional)" />
                <label for="registerTelefono"><i class="fas fa-phone me-2"></i>Teléfono (opcional)</label>
              </div>
              <div class="form-floating mb-3">
                <select v-model="registerRole" class="form-select" id="registerRole">
                  <option value="tecnico">Técnico</option>
                  <option value="asistente">Asistente</option>
                  <option value="admin">Administrador</option>
                </select>
                <label for="registerRole"><i class="fas fa-user-tag me-2"></i>Rol</label>
              </div>
              <p v-if="registerMessage" class="text-danger alert alert-danger p-2 rounded">
                <i class="fas fa-exclamation-circle me-2"></i>{{ registerMessage }}
              </p>
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
            </div>            <div class="modal-body">
              <div class="form-floating mb-3">
                <input v-model="editUserData.nombre" class="form-control" id="editNombre" placeholder="Nombre" />
                <label for="editNombre"><i class="fas fa-user me-2"></i>Nombre</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="editUserData.apellido" class="form-control" id="editApellido" placeholder="Apellido" />
                <label for="editApellido"><i class="fas fa-user me-2"></i>Apellido</label>
              </div>
              <div class="form-floating mb-3">
                <input v-model="editUserData.telefono" class="form-control" id="editTelefono" placeholder="Teléfono (opcional)" />
                <label for="editTelefono"><i class="fas fa-phone me-2"></i>Teléfono (opcional)</label>
              </div>
              <div class="form-floating mb-3">
                <select v-model="editUserData.role" class="form-select" id="editRole">
                  <option value="tecnico">Técnico</option>
                  <option value="asistente">Asistente</option>
                  <option value="admin">Administrador</option>
                </select>
                <label for="editRole"><i class="fas fa-user-tag me-2"></i>Rol</label>
              </div>
              <p v-if="editMessage" class="text-danger alert alert-danger p-2 rounded">
                <i class="fas fa-exclamation-circle me-2"></i>{{ editMessage }}
              </p>
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
import { ref, inject, computed, onMounted, onUnmounted } from 'vue';
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
    // Mostrar indicador de carga
  const loadingSwal = Swal.fire({
    title: 'Registrando usuario...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Guardar el token actual antes de crear el usuario
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    const adminToken = adminSession?.access_token;
    
    if (!adminToken) {
      loadingSwal.close();
      throw new Error('No hay sesión activa de administrador');
    }
    
    let userId = null;
    
    // Usar el método signUp estándar ya que admin.createUser no está disponible en el cliente
    console.log('Usando método signUp estándar');
    const signUpResult = await supabase.auth.signUp({
      email: registerEmail.value,
      password: registerPassword.value,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nombre: registerNombre.value,
          apellido: registerApellido.value,
          rol: registerRole.value
        }
      }
    });
    
    if (signUpResult.error) {
      loadingSwal.close();
      throw new Error(signUpResult.error.message);
    }
    
    userId = signUpResult.data.user?.id;
    
    if (!userId) {
      loadingSwal.close();
      throw new Error('No se pudo crear el usuario correctamente.');
    }
      // No cerramos la sesión del administrador
    console.log('UUID del usuario creado:', userId);
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
      try {
      // Usar función Edge para crear perfil (bypass de políticas RLS)
      console.log('Llamando a la función Edge create-profile...');
      const { data: profileResult, error: profileError } = await supabase.functions.invoke('create-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: profileData
      });
      
      if (profileError) {
        console.error('Error al crear perfil con función Edge:', profileError);
        throw new Error('Error al crear perfil: ' + profileError.message);
      }
      
      console.log('Perfil creado exitosamente con función Edge:', profileResult);
    } catch (profileError) {
      loadingSwal.close();
      throw new Error('Usuario creado en autenticación, pero error al guardar perfil: ' + profileError.message);
    }
      
    loadingSwal.close();
    
    await Swal.fire({
      icon: 'success',
      title: 'Usuario registrado',
      html: `<b>Email:</b> ${registerEmail.value}<br><b>Nombre:</b> ${registerNombre.value} ${registerApellido.value}<br><b>Rol:</b> ${registerRole.value}`,
      confirmButtonText: 'Aceptar',
    });
    
    await fetchUsers();
    closeModal();
    
  } catch (error) {
    console.error('Error en el registro:', error);
    loadingSwal.close();
    
    await Swal.fire({
      icon: 'error',
      title: 'Error al registrar usuario',
      text: error.message || 'Ocurrió un error durante el registro. Intente nuevamente.',
      confirmButtonText: 'Aceptar',
    });
    
    registerMessage.value = error.message || 'Error al registrar usuario.';
  }
};

// Método para manejar el menú de acciones manualmente
// Función para mantener el seguimiento del menú actual abierto
let currentOpenMenu = null;

const toggleActionMenu = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Obtener el botón y el menú
  const button = event.target.closest('.btn-action');
  const dropdown = button.closest('.dropdown');
  const menu = dropdown.querySelector('.dropdown-menu');

  // Si el menú ya está abierto, ciérralo
  if (menu === currentOpenMenu && menu.classList.contains('show')) {
    menu.classList.remove('show');
    currentOpenMenu = null;
    document.removeEventListener('click', closeMenuOnClickOutside, true);
    return;
  }

  // Cierra cualquier otro menú abierto
  document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
    openMenu.classList.remove('show');
  });

  // Abre el menú actual
  menu.classList.add('show');
  currentOpenMenu = menu;

  // Handler para cerrar al hacer clic fuera
  function closeMenuOnClickOutside(e) {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove('show');
      currentOpenMenu = null;
      document.removeEventListener('click', closeMenuOnClickOutside, true);
    }
  }
  // Usa capture para asegurar que el evento se detecta antes que otros listeners
  setTimeout(() => {
    document.addEventListener('click', closeMenuOnClickOutside, true);
  }, 0);
};

// Sincronizar perfil al login si estaba pendiente y el email ya está verificado
const syncProfileOnLogin = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    
    // Buscar perfil existente
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error al buscar perfil:', error);
      return;
    }
    
    // Si no hay perfil, crearlo usando la función Edge para bypass de RLS
    if (!profile) {
      console.log('No se encontró perfil para el usuario, creando uno nuevo mediante Edge Function');
      const metadata = user.user_metadata || {};
      
      const newProfile = {
        user_id: user.id,
        nombre: metadata.nombre || '',
        apellido: metadata.apellido || '',
        telefono: metadata.telefono || '',
        email: user.email,
        rol: metadata.rol || 'tecnico', // Rol por defecto
        pendiente: false
      };
      
      try {
        // Obtener token actual para autorización
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No hay sesión activa para crear perfil');
          return;
        }
        
        // Usar función Edge para crear perfil (bypass de políticas RLS)
        const { data: profileResult, error: profileError } = await supabase.functions.invoke('create-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: newProfile
        });
        
        if (profileError) {
          console.error('Error al crear perfil con función Edge:', profileError);
        } else {
          console.log('Perfil creado exitosamente con función Edge:', profileResult);
        }
      } catch (e) {
        console.error('Error al crear perfil:', e);
      }
      return;
    }
    
    // Si el perfil está pendiente y el email ya está verificado, actualizar usando la función Edge
    if (profile.pendiente && (user.email_confirmed_at || user.confirmed_at)) {
      try {
        // Obtener token actual para autorización
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No hay sesión activa para actualizar perfil');
          return;
        }
        
        // Usar función Edge para actualizar perfil (bypass de políticas RLS)
        const { data: profileResult, error: profileError } = await supabase.functions.invoke('create-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            ...profile,
            pendiente: false,
            email: user.email
          }
        });
        
        if (profileError) {
          console.error('Error al actualizar perfil con función Edge:', profileError);
        } else {
          console.log('Perfil actualizado exitosamente con función Edge:', profileResult);
        }
      } catch (e) {
        console.error('Error al actualizar perfil:', e);
      }
    }
  } catch (e) {
    console.error('Error en syncProfileOnLogin:', e);
  }
};

onMounted(async () => {
  // Verificar la estructura de la tabla profiles
  await checkProfilesTable();
  
  // Primero sincronizar el perfil para asegurarnos de que exista
  await syncProfileOnLogin();
  
  // Luego cargar todos los usuarios
  await fetchUsers();
  
  // Configurar una recarga automática cada 30 segundos
  const interval = setInterval(async () => {
    console.log('Recargando usuarios automáticamente...');
    await fetchUsers();
  }, 30000);
  
  // Limpiar intervalo al desmontar
  onUnmounted(() => {
    clearInterval(interval);
  });
});

// Edición
const editUserData = ref({ id: '', nombre: '', apellido: '', telefono: '', role: '' });
const editMessage = ref('');

const openEditModal = (user) => {
  // Cerrar todos los menús desplegables
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
  
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
  
  // Mostrar indicador de carga
  const loadingSwal = Swal.fire({
    title: 'Actualizando...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
  
  // Actualizar datos en profiles
  const { error } = await supabase
    .from('profiles')
    .update({
      nombre: editUserData.value.nombre,
      apellido: editUserData.value.apellido,
      telefono: editUserData.value.telefono,
      rol: editUserData.value.role // La propiedad debe ser 'rol' para coincidir con el campo en la BD
    })
    .eq('user_id', editUserData.value.id);
    
  loadingSwal.close();
  
  if (error) {
    editMessage.value = 'Error al actualizar: ' + error.message;
    return;
  }
  
  await Swal.fire({
    icon: 'success',
    title: 'Usuario actualizado',
    text: 'Los datos del usuario se han actualizado correctamente',
    confirmButtonText: 'Aceptar',
  });
  
  await fetchUsers();
  closeEditModal();
};

// Eliminación
const deleteUser = async (user) => {
  // Cerrar todos los menús desplegables
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
  
  // Usar SweetAlert2 para confirmación
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    html: `¿Realmente deseas eliminar al usuario <b>${user.nombre} ${user.apellido}</b>?<br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  
  if (!result.isConfirmed) return;
  
  // Mostrar indicador de carga
  const loadingSwal = Swal.fire({
    title: 'Eliminando...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Primero eliminar de profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
      
    if (profileError) throw new Error('No se pudo eliminar el perfil: ' + profileError.message);
    
    // Luego intentar eliminar el usuario de auth
    try {
      // Nota: esto requiere permisos de admin y puede fallar
      await supabase.auth.admin.deleteUser(user.id);
    } catch (authError) {
      console.warn('No se pudo eliminar el usuario de autenticación. Puede requerir permisos de administrador:', authError);
      // Continuamos incluso si esto falla
    }
    
    loadingSwal.close();
    
    await Swal.fire({
      icon: 'success',
      title: 'Usuario eliminado',
      text: `El usuario ${user.nombre} ${user.apellido} ha sido eliminado correctamente`,
      confirmButtonText: 'Aceptar',
    });
    
    await fetchUsers();
    
  } catch (error) {
    loadingSwal.close();
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo eliminar el usuario',
      confirmButtonText: 'Aceptar',
    });
  }
};

// Listado y filtrado
const users = ref([]);
const search = ref('');
const filterRole = ref('');
const isLoading = ref(false);
const lastUpdateTime = ref(new Date().toLocaleString('es-ES'));

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    // Traer todos los perfiles de la tabla profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('nombre', { ascending: true });

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    // Ahora necesitamos obtener datos de autenticación usando la API admin
    // Nota: esto solo funciona si tienes permisos de administrador en Supabase
    let authUsers = [];
    try {
      // Obtener el token actual para pasarlo en la autorización
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;      if (!token) {
        console.warn('No hay sesión activa para obtener usuarios');
        throw new Error('No hay sesión activa');
      }
        const { data: adminData, error: adminError } = await supabase.functions.invoke('get-auth-users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!adminError && adminData) {
        console.log('Datos recibidos de auth:', adminData);
        // Asegurarse de que authUsers sea siempre un array
        authUsers = Array.isArray(adminData) ? adminData : [];
        console.log('Usuarios procesados:', authUsers.length, 'Primer usuario:', authUsers[0] || 'Ninguno');
      } else {
        console.warn('No se pudieron obtener los datos de autenticación:', adminError);
        // Intentar una segunda vez si falló
        try {          const { data: secondTry, error: secondError } = await supabase.functions.invoke('get-auth-users', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (!secondError && secondTry) {
            console.log('Datos recibidos en segundo intento:', secondTry);
            // Asegurarse de que authUsers sea siempre un array
            authUsers = Array.isArray(secondTry) ? secondTry : [];
            console.log('Usuarios procesados en segundo intento:', authUsers.length);
          } else {
            console.error('Segunda vez también falló:', secondError);
          }
        } catch (retryErr) {
          console.error('Error en segundo intento:', retryErr);
        }
      }    } catch (err) {
      console.warn('Error al obtener datos de autenticación:', err);
    }
    
    // Combinar datos de profiles con datos de auth
    if (profiles && profiles.length > 0) {
      console.log('Perfiles encontrados:', profiles.length);
      users.value = profiles.map(profile => {
        // Buscar el usuario correspondiente en authUsers
        const authUser = authUsers.find(u => u.id === profile.user_id) || {};
        console.log(`Perfil ${profile.user_id} tiene auth info:`, !!authUser.id);
        
        return {
          id: profile.user_id,
          email: profile.email || '',
          role: profile.rol || '',
          nombre: profile.nombre || '',
          apellido: profile.apellido || '',
          telefono: profile.telefono || '',
          // Datos adicionales de auth
          emailVerificado: authUser.email_confirmed_at ? true : false,
          ultimoLogin: authUser.last_sign_in_at || 'Nunca',
          fechaCreacion: authUser.created_at || profile.created_at || '',
          metodoLogin: authUser.app_metadata?.provider || 'email',
          estado: authUser.banned ? 'Bloqueado' : (authUser.confirmed_at ? 'Activo' : 'Pendiente')
        };
      });
    } else {
      console.log('No se encontraron perfiles en la base de datos');    // Si no hay perfiles pero sí hay usuarios de auth, crear objetos para ellos
    // y posiblemente intentar sincronizar los perfiles
    if (authUsers && authUsers.length > 0) {
      console.log('Intentando procesar usuarios de auth sin perfiles:', authUsers.length);
      const usersWithoutProfiles = [];
      
      // Crear objetos para usuarios sin perfil
      for (const authUser of authUsers) {
        const metadata = authUser.user_metadata || {};
        usersWithoutProfiles.push({
          id: authUser.id,
          email: authUser.email || '',
          role: metadata.rol || 'tecnico', // Rol por defecto
          nombre: metadata.nombre || '',
          apellido: metadata.apellido || '',
          telefono: metadata.telefono || '',
          emailVerificado: authUser.email_confirmed_at ? true : false,
          ultimoLogin: authUser.last_sign_in_at || 'Nunca',
          fechaCreacion: authUser.created_at || '',
          metodoLogin: authUser.app_metadata?.provider || 'email',
          estado: authUser.banned ? 'Bloqueado' : (authUser.confirmed_at ? 'Activo' : 'Pendiente')
        });
        
        // Intentar crear perfiles para estos usuarios
        try {
          const profileData = {
            user_id: authUser.id,
            email: authUser.email || '',
            nombre: metadata.nombre || '',
            apellido: metadata.apellido || '',
            telefono: metadata.telefono || '',
            rol: metadata.rol || 'tecnico',
            pendiente: false
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert([profileData], { onConflict: 'user_id' });
          
          if (insertError) {
            console.error(`Error al crear perfil para ${authUser.id}:`, insertError);
          } else {
            console.log(`Perfil creado/actualizado para ${authUser.id}`);
          }
        } catch (e) {
          console.error('Error en sincronización de perfil:', e);
        }
      }
      
      users.value = usersWithoutProfiles;
      console.log('Usuarios procesados desde auth:', users.value.length);
    } else {
      users.value = [];
      console.log('No hay usuarios disponibles');
    }
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    users.value = [];
    await Swal.fire({
      icon: 'error',
      title: 'Error al cargar usuarios',
      text: error.message || 'No se pudieron cargar los usuarios. Intenta nuevamente.',
      confirmButtonText: 'Aceptar',    });
  } finally {
    isLoading.value = false;
    lastUpdateTime.value = new Date().toLocaleString('es-ES');
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

// Funciones de utilidad para mostrar datos de usuario
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin': return 'bg-danger';
    case 'tecnico': return 'bg-primary';
    case 'asistente': return 'bg-success';
    default: return 'bg-secondary';
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Activo': return 'bg-success';
    case 'Pendiente': return 'bg-warning text-dark';
    case 'Bloqueado': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

// Ver detalles completos del usuario
const viewUserDetails = (user) => {
  // Cerrar todos los menús desplegables
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
  
  Swal.fire({
    title: `${user.nombre} ${user.apellido}`,
    html: `

      <div class="text-start">
        <p><strong>Email:</strong> ${user.email} ${user.emailVerificado ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</p>
        <p><strong>Rol:</strong> ${user.role}</p>
        <p><strong>Teléfono:</strong> ${user.telefono || 'No especificado'}</p>
        <p><strong>Estado:</strong> ${user.estado}</p>
        <p><strong>Último acceso:</strong> ${formatDate(user.ultimoLogin)}</p>
        <p><strong>Fecha de creación:</strong> ${formatDate(user.fechaCreacion)}</p>
        <p><strong>Método de login:</strong> ${user.metodoLogin}</p>
      </div>
    `,
    confirmButtonText: 'Cerrar',
    width: '600px'
  });
};

// Función para forzar la sincronización de perfiles
const forceSync = async () => {
  const loadingSwal = Swal.fire({
    title: 'Sincronizando perfiles...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Obtener datos de autenticación
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No hay sesión activa de administrador');
    }
    
    // Obtener usuarios de autenticación
    const { data: authUsers, error: authError } = await supabase.functions.invoke('get-auth-users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (authError || !authUsers) {
      throw new Error('No se pudieron obtener los usuarios de autenticación');
    }
    
    const users = Array.isArray(authUsers) ? authUsers : [];
    console.log(`Sincronizando ${users.length} usuarios`);
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    // Crear o actualizar perfiles para todos los usuarios
    for (const authUser of users) {
      const metadata = authUser.user_metadata || {};
      
      // Preparar datos del perfil
      const profileData = {
        user_id: authUser.id,
        email: authUser.email || '',
        nombre: metadata.nombre || '',
        apellido: metadata.apellido || '',
        telefono: metadata.telefono || '',
        rol: metadata.rol || 'tecnico',
        pendiente: false
      };
        try {
        // Usar función Edge para crear perfil (bypass de políticas RLS)
        console.log(`Llamando a la función Edge para ${authUser.email}...`);
        const { data: profileResult, error: profileError } = await supabase.functions.invoke('create-profile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: profileData
        });
        
        if (profileError) {
          console.error(`Error al crear perfil para ${authUser.email}:`, profileError);
          console.error('Detalles del error:', profileError.details || 'No hay detalles adicionales');
          errors++;
        } else if (profileResult?.error) {
          // Manejar errores que vienen en el resultado
          console.error(`Error en la función Edge para ${authUser.email}:`, profileResult.error);
          console.error('Código:', profileResult.code);
          console.error('Detalles:', profileResult.details);
          errors++;
        } else {
          if (profileResult?.created) {
            created++;
            console.log(`Perfil creado para ${authUser.email}:`, profileResult);
          } else {
            updated++;
            console.log(`Perfil actualizado para ${authUser.email}:`, profileResult);
          }
        }
      } catch (e) {
        console.error(`Error inesperado al procesar perfil para ${authUser.email}:`, e);
        errors++;
      }
    }
    
    loadingSwal.close();
    
    await Swal.fire({
      icon: 'success',
      title: 'Sincronización completada',
      html: `
        <div class="text-start">
          <p><b>Perfiles creados:</b> ${created}</p>
          <p><b>Perfiles actualizados:</b> ${updated}</p>
          <p><b>Errores:</b> ${errors}</p>
        </div>
      `,
      confirmButtonText: 'Aceptar',
    });
    
    // Recargar usuarios
    await fetchUsers();
    
  } catch (error) {
    loadingSwal.close();
    console.error('Error en sincronización forzada:', error);
    
    await Swal.fire({
      icon: 'error',
      title: 'Error en sincronización',
      text: error.message || 'Ocurrió un error durante la sincronización',
      confirmButtonText: 'Aceptar',
    });
  }
};

// Verificar estructura de la tabla profiles
const checkProfilesTable = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error al verificar tabla profiles:', error);
      console.log('Código:', error.code);
      console.log('Mensaje:', error.message);
      console.log('Detalles:', error.details);
    } else {
      console.log('Tabla profiles accesible. Estructura:', data && data.length > 0 ? Object.keys(data[0]) : 'No hay datos');
    }
  } catch (e) {
    console.error('Error al verificar tabla profiles:', e);
  }
};
</script>

<style scoped>
.user-management-container {
  margin-top: 80px;
  margin-bottom: 40px;
  max-width: 1400px;
}

.user-management-card {
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.section-title {
  font-size: 1.75rem;
  color: #2563eb;
  font-weight: 700;
  display: flex;
  align-items: center;
  position: relative;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #64748b;
}

.btn-add-user {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.15);
  background: linear-gradient(to right, #3b82f6, #2563eb);
  border: none;
  font-weight: 500;
}

.btn-add-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  background: linear-gradient(to right, #2563eb, #1d4ed8);
}

.btn-sync {
  border-radius: 8px;
  transition: all 0.3s ease;
  border-color: #d1d5db;
  font-weight: 500;
}

.btn-sync:hover {
  background-color: #f3f4f6;
  transform: translateY(-2px);
  border-color: #9ca3af;
}

.search-input-group, .filter-input-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.search-input-group:focus-within, .filter-input-group:focus-within {
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.15);
}

.search-input-group input, .filter-input-group select {
  border-color: #e5e7eb;
  padding: 0.6rem 1rem;
  height: auto;
  transition: all 0.2s ease;
}

.search-input-group .input-group-text, .filter-input-group .input-group-text {
  border-color: #e5e7eb;
  padding: 0.6rem 1rem;
}

.search-input-group input:focus, .filter-input-group select:focus {
  border-color: #2563eb;
  box-shadow: none;
}

.table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table th {
  background: rgba(59, 130, 246, 0.05);
  color: #1e40af;
  font-weight: 600;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
  padding: 0.75rem 1rem;
}

.table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}

.table tr:hover {
  background-color: rgba(59, 130, 246, 0.02);
}

/* Estilos para el modo oscuro */
:global(body.dark-mode) .user-management-card {
  background: #1e293b;
}

:global(body.dark-mode) .section-title {
  color: #60a5fa;
}

:global(body.dark-mode) .section-subtitle {
  color: #94a3b8;
}

:global(body.dark-mode) .search-input-group input, 
:global(body.dark-mode) .filter-input-group select, 
:global(body.dark-mode) .search-input-group .input-group-text, 
:global(body.dark-mode) .filter-input-group .input-group-text {
  background: #334155;
  border-color: #475569;
  color: #f1f5f9;
}

:global(body.dark-mode) .btn-sync {
  border-color: #475569;
  color: #f1f5f9;
}

:global(body.dark-mode) .btn-sync:hover {
  background-color: #334155;
  border-color: #64748b;
}

:global(body.dark-mode) .table th {
  background: rgba(96, 165, 250, 0.1);
  color: #93c5fd;
  border-bottom: 2px solid rgba(96, 165, 250, 0.2);
}

:global(body.dark-mode) .table tr:hover {
  background-color: rgba(96, 165, 250, 0.05);
}
</style>
