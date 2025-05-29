<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="dashboard-container">
      <h1 class="dashboard-title">Dashboard <span class="text-gradient">de Infraestructura</span></h1>
      
      <!-- Resumen de estadísticas -->
      <div class="stats-container">
        <div class="stat-card" v-if="stats.loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else class="stat-card" :class="{ 'bg-dark text-white': darkMode }">
          <div class="stat-icon"><i class="fas fa-map-marker-alt"></i></div>
          <h3>{{ stats.pointsCount }}</h3>
          <p>Puntos de Infraestructura</p>
        </div>

        <div class="stat-card" v-if="stats.loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else class="stat-card" :class="{ 'bg-dark text-white': darkMode }">
          <div class="stat-icon"><i class="fas fa-sticky-note"></i></div>
          <h3>{{ stats.notesCount }}</h3>
          <p>Notas Totales</p>
        </div>

        <div class="stat-card" v-if="stats.loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-else class="stat-card" :class="{ 'bg-dark text-white': darkMode }">
          <div class="stat-icon"><i class="fas fa-user-edit"></i></div>
          <h3>{{ stats.myNotesCount }}</h3>
          <p>Mis Notas</p>
        </div>

        <div v-if="userRole === 'admin'" class="stat-card" :class="{ 'bg-dark text-white': darkMode }">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <h3>{{ stats.usersCount }}</h3>
          <p>Usuarios</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Actividad reciente -->
        <div class="recent-activity dashboard-card" :class="{ 'dark-mode': darkMode }">
          <h2><i class="fas fa-history me-2"></i>Actividad Reciente</h2>
          <div v-if="recentActivity.loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
          <div v-else-if="recentActivity.items.length === 0" class="no-activity">
            <p><i class="fas fa-info-circle me-2"></i>No hay actividad reciente para mostrar</p>
          </div>
          <div v-else class="activity-list">
            <div v-for="item in recentActivity.items" :key="item.id" class="activity-item" :class="{ 'dark-mode': darkMode }">
              <div class="activity-icon">
                <i :class="getActivityIcon(item.type)"></i>
              </div>
              <div class="activity-content">
                <h4>{{ item.title }}</h4>
                <p>{{ truncateText(item.description, 100) }}</p>
                <small>{{ formatRelativeTime(item.date) }} - {{ item.author }}</small>
              </div>
              <div class="activity-actions">
                <button @click="viewOnMap(item)" class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-map-marked-alt"></i> Ver en mapa
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mis notas recientes -->
        <div class="my-notes dashboard-card" :class="{ 'dark-mode': darkMode }">
          <h2><i class="fas fa-sticky-note me-2"></i>Mis Notas Recientes</h2>
          <div v-if="myNotes.loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
          <div v-else-if="myNotes.items.length === 0" class="no-notes">
            <p><i class="fas fa-info-circle me-2"></i>No has creado notas todavía</p>
            <button @click="goToMap" class="btn btn-primary mt-2">
              <i class="fas fa-map me-2"></i>Ir al mapa para añadir notas
            </button>
          </div>
          <div v-else class="notes-list">
            <div v-for="note in myNotes.items" :key="note.id" class="note-item" :class="{ 'dark-mode': darkMode }">
              <div class="note-content">
                <h4>{{ note.pointName || 'Punto sin nombre' }}</h4>
                <p>{{ truncateText(note.text, 150) }}</p>
                <small>{{ formatRelativeTime(note.date) }}</small>
              </div>
              <div class="note-actions">
                <button @click="viewNoteOnMap(note)" class="btn btn-sm btn-outline-primary">
                  <i class="fas fa-eye"></i> Ver
                </button>
                <button @click="editNote(note)" class="btn btn-sm btn-outline-secondary">
                  <i class="fas fa-edit"></i> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import MainMenu from './MainMenu.vue';
import { inject, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

const user = inject('user');
const userRole = inject('userRole');
const darkMode = inject('darkMode', ref(false));
const router = useRouter();

// Estado para estadísticas
const stats = ref({
  loading: true,
  pointsCount: 0,
  notesCount: 0,
  myNotesCount: 0,
  usersCount: 0
});

// Estado para actividad reciente
const recentActivity = ref({
  loading: true,
  items: []
});

// Estado para mis notas
const myNotes = ref({
  loading: true,
  items: []
});

// Cargar estadísticas al montar el componente
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentActivity(),
    loadMyNotes()
  ]);
});

// Cargar estadísticas básicas
async function loadStats() {
  try {
    stats.value.loading = true;
    
    // Cargar conteo de puntos
    const { count: pointsCount, error: pointsError } = await supabase
      .from('infrastructure_points')
      .select('*', { count: 'exact', head: true });
    
    if (pointsError) throw pointsError;
    stats.value.pointsCount = pointsCount || 0;
    
    // Cargar conteo de notas
    const { count: notesCount, error: notesError } = await supabase
      .from('point_notes')
      .select('*', { count: 'exact', head: true });
    
    if (notesError) throw notesError;
    stats.value.notesCount = notesCount || 0;
    
    // Cargar conteo de mis notas
    if (user.value) {
      const { count: myNotesCount, error: myNotesError } = await supabase
        .from('point_notes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.value.id);
      
      if (myNotesError) throw myNotesError;
      stats.value.myNotesCount = myNotesCount || 0;
    }
    
    // Cargar conteo de usuarios (solo para admins)
    if (userRole.value === 'admin') {
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      stats.value.usersCount = usersCount || 0;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  } finally {
    stats.value.loading = false;
  }
}

// Cargar actividad reciente
async function loadRecentActivity() {
  try {
    recentActivity.value.loading = true;
    
    // Cargar notas recientes de todos los usuarios (limitado a 5)
    const { data: notes, error: notesError } = await supabase
      .from('point_notes')
      .select(`
        id,
        text,
        date,
        point_id,
        profiles:created_by (
          email,
          full_name
        ),
        infrastructure_points!inner (
          name,
          type
        )
      `)
      .order('date', { ascending: false })
      .limit(5);
    
    if (notesError) throw notesError;
    
    // Transformar los datos para mostrarlos en la actividad reciente
    recentActivity.value.items = notes.map(note => ({
      id: note.id,
      type: 'note',
      title: `Nota en ${note.infrastructure_points.name || 'Punto sin nombre'}`,
      description: note.text,
      date: note.date,
      author: note.profiles?.full_name || note.profiles?.email || 'Usuario desconocido',
      pointId: note.point_id,
      pointType: note.infrastructure_points.type
    }));
  } catch (error) {
    console.error('Error al cargar actividad reciente:', error);
    recentActivity.value.items = [];
  } finally {
    recentActivity.value.loading = false;
  }
}

// Cargar mis notas recientes
async function loadMyNotes() {
  if (!user.value) {
    myNotes.value.loading = false;
    myNotes.value.items = [];
    return;
  }
  
  try {
    myNotes.value.loading = true;
    
    // Cargar mis notas recientes (limitado a 3)
    const { data: notes, error: notesError } = await supabase
      .from('point_notes')
      .select(`
        id,
        text,
        date,
        point_id,
        infrastructure_points!inner (
          name,
          type
        )
      `)
      .eq('created_by', user.value.id)
      .order('date', { ascending: false })
      .limit(3);
    
    if (notesError) throw notesError;
    
    // Transformar los datos para mostrarlos
    myNotes.value.items = notes.map(note => ({
      id: note.id,
      text: note.text,
      date: note.date,
      pointId: note.point_id,
      pointName: note.infrastructure_points.name,
      pointType: note.infrastructure_points.type
    }));
  } catch (error) {
    console.error('Error al cargar mis notas:', error);
    myNotes.value.items = [];
  } finally {
    myNotes.value.loading = false;
  }
}

// Obtener ícono según el tipo de actividad
function getActivityIcon(type) {
  switch (type) {
    case 'note': return 'fas fa-sticky-note';
    case 'point': return 'fas fa-map-marker-alt';
    default: return 'fas fa-bell';
  }
}

// Truncar texto
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Formatear tiempo relativo
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  
  // Para fechas más antiguas, usar formato de fecha
  return date.toLocaleDateString();
}

// Navegar al mapa y mostrar un punto específico
function viewOnMap(item) {
  router.push({
    name: 'map',
    query: { point: item.pointId }
  });
}

// Ver una nota específica en el mapa
function viewNoteOnMap(note) {
  router.push({
    name: 'map',
    query: { 
      point: note.pointId,
      showNotes: true
    }
  });
}

// Ir al mapa
function goToMap() {
  router.push({ name: 'map' });
}

// Editar una nota (redirige al mapa con la nota seleccionada)
function editNote(note) {
  router.push({
    name: 'map',
    query: { 
      point: note.pointId,
      showNotes: true,
      editNote: note.id
    }
  });
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 80px auto 0;
  padding: 2rem;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
  text-align: left;
  width: 100%;
}

.text-gradient {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 2px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.dashboard-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 1.5rem;
  transition: all 0.3s ease;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
  transform: translateY(-3px);
}

.dashboard-card h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2563eb;
  font-weight: 600;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 5px 5px 0 0;
  animation: gradientShift 3s infinite alternate;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

.stat-icon {
  height: 60px;
  width: 60px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.stat-card i {
  font-size: 24px;
  color: #2563eb;
}

.stat-card h3 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2563eb;
}

.stat-card p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.recent-activity, .my-notes {
  position: relative;
}

.activity-list, .notes-list {
  margin-top: 1rem;
  overflow-y: auto;
  flex-grow: 1;
  max-height: 450px;
}

.activity-item, .note-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.activity-item:hover, .note-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  background: rgba(59, 130, 246, 0.02);
}

.activity-icon {
  height: 40px;
  width: 40px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: 18px;
  color: #2563eb;
}

.activity-content, .note-content {
  flex-grow: 1;
}

.activity-content h4, .note-content h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #333;
}

.activity-content p, .note-content p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.activity-content small, .note-content small {
  color: #94a3b8;
  font-size: 0.8rem;
}

.activity-actions, .note-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
  align-self: flex-start;
}

.activity-actions .btn, .note-actions .btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

.activity-actions .btn i, .note-actions .btn i {
  margin-right: 0.25rem;
}

.no-activity, .no-notes {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  background: rgba(59, 130, 246, 0.02);
  border-radius: 8px;
}

/* Estilos para modo oscuro */
.dark-mode.dashboard-card {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.dark-mode.dashboard-card h2 {
  color: #93c5fd;
  border-bottom-color: rgba(148, 163, 184, 0.2);
}

.dark-mode .activity-item, 
.dark-mode .note-item {
  background: #1e293b;
  border-bottom-color: rgba(255,255,255,0.05);
}

.dark-mode .activity-item:hover, 
.dark-mode .note-item:hover {
  background: #334155;
}

.dark-mode .activity-content h4, 
.dark-mode .note-content h4 {
  color: #e2e8f0;
}

.dark-mode .activity-content p, 
.dark-mode .note-content p {
  color: #cbd5e1;
}

.dark-mode .no-activity, 
.dark-mode .no-notes {
  background: #334155;
  color: #cbd5e1;
}

@media (max-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .dashboard-title {
    font-size: 1.75rem;
  }
}
</style>
