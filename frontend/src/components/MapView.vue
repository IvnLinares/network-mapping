<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container-fluid mt-5 pt-4">      <div class="map-container">
        <div class="map-header">
          <h4><i class="fas fa-map-marked-alt"></i> Mapa de Infraestructura</h4>          
          <div class="map-controls">
            <div class="btn-group me-2">
              <button 
                v-for="mode in editModes" 
                :key="mode.id" 
                class="btn btn-sm" 
                :class="currentEditMode === mode.id ? 'btn-primary' : 'btn-outline-secondary'"
                @click="setEditMode(mode.id)"
                :title="mode.title"
              >
                <i class="fas" :class="mode.icon"></i>
              </button>
            </div>

            <div class="btn-group me-2" v-if="currentEditMode === 'addInfrastructure'">
              <button 
                v-for="type in infrastructureTypes" 
                :key="type.id" 
                class="btn btn-sm" 
                :class="selectedInfraType === type.id ? 'btn-success' : 'btn-outline-secondary'"
                @click="selectedInfraType = type.id"
                :title="type.name"
              >
                <i class="fas" :class="type.icon"></i>
              </button>
            </div>

            <select class="form-select form-select-sm me-2 location-selector" 
              @change="goToLocation($event.target.value)">
              <option value="">-- Ir a ubicación --</option>
              <optgroup label="Departamentos">
                <option v-for="location in locations" :key="location.id" :value="location.id">
                  {{ location.name }}
                </option>
              </optgroup>
            </select>

            <button class="btn btn-sm btn-primary" @click="toggleFullscreen">
              <i class="fas" :class="isFullscreen ? 'fa-compress' : 'fa-expand'"></i>
            </button>
          </div>
        </div>
        
        <div v-if="currentEditMode === 'addCable' && connectionInProgress && connectionInProgress.startPoint" 
             class="connection-active-alert">
          <i class="fas fa-info-circle"></i> 
          Punto de origen seleccionado: {{ getPointName(connectionInProgress.startPoint) }}. 
          Haz clic en otro punto para crear la conexión.
          <button @click="cancelConnection" class="btn btn-sm btn-light ms-2">Cancelar</button>
        </div>
          <l-map
          ref="mapRef"
          class="l-map"
          :zoom="zoom"
          :center="center"
          @click="onMapClick"
          @mousemove="onMouseMove"
        >
          <l-tile-layer :url="tileUrl" :attribution="attribution" />
          <l-control-scale position="bottomleft" :imperial="false" :metric="true" />
          
          <!-- Marcadores de infraestructura -->
          <l-marker 
            v-for="point in infrastructurePoints" 
            :key="point.id" 
            :lat-lng="[point.latitude, point.longitude]"
            :icon="getPointIcon(point)"
            @click="selectInfrastructurePoint(point)"
          >
            <l-popup>
              <div class="map-popup">
                <h5>{{ point.name || getTypeName(point.type_id) }}</h5>
                <p v-if="point.description">{{ point.description }}</p>
                <p class="text-muted small">ID: {{ point.id.substring(0, 8) }}</p>
                <div class="popup-actions">
                  <button class="btn btn-sm btn-primary" @click="startCableConnection(point)">
                    <i class="fas fa-plus"></i> Conectar
                  </button>
                  <button class="btn btn-sm btn-danger" @click="deleteInfrastructurePoint(point)">
                    <i class="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            </l-popup>
          </l-marker>          <!-- Líneas de conexión de cables -->
          <l-polyline 
            v-for="connection in cableConnections" 
            :key="connection.id" 
            :lat-lngs="getConnectionLatLngs(connection)" 
            :color="connection.color || '#3388ff'"
            :weight="4"
            @click="onCableClick(connection)"
          />
            <!-- Línea temporal para la conexión en progreso -->
          <l-polyline
            v-if="temporaryConnectionLine"
            :lat-lngs="[temporaryConnectionLine.startPoint, temporaryConnectionLine.startPoint]"
            :color="temporaryConnectionLine.color"
            :weight="4"
            :dash-array="'5, 10'"
            class="leaflet-temp-connection"
          />
          
          <!-- Zonas como polígonos -->
          <l-polygon
            v-for="zone in zones"
            :key="zone.id"
            :lat-lngs="zone.polygon"
            :color="zone.color || '#3388ff'"
            :fill="true"
            :fillOpacity="0.2"
          />
          
          <!-- Marcador temporal cuando se está añadiendo un elemento -->
          <l-marker v-if="tempMarker" :lat-lng="tempMarker">
            <l-popup>
              <div class="map-popup">
                <h5>Nuevo {{ getTypeName(selectedInfraType) }}</h5>
                <div class="form-group mb-2">
                  <label for="pointName" class="form-label">Nombre/Código:</label>
                  <input v-model="newPointName" type="text" class="form-control form-control-sm" id="pointName">
                </div>
                <div class="form-group mb-3">
                  <label for="pointDesc" class="form-label">Descripción:</label>
                  <textarea v-model="newPointDescription" class="form-control form-control-sm" id="pointDesc"></textarea>
                </div>
                <div class="d-flex justify-content-between">
                  <button class="btn btn-sm btn-danger" @click="cancelAddPoint">
                    <i class="fas fa-times"></i> Cancelar
                  </button>
                  <button class="btn btn-sm btn-success" @click="confirmAddPoint">
                    <i class="fas fa-check"></i> Guardar
                  </button>
                </div>
              </div>
            </l-popup>
          </l-marker>
        </l-map>
      </div>
      
      <!-- Modal para confirmar conexiones -->
      <div class="modal fade" id="connectionModal" tabindex="-1" aria-labelledby="connectionModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="connectionModalLabel">Nueva Conexión</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" v-if="connectionInProgress">
              <div class="form-group mb-3">
                <label for="cableType">Tipo de Cable:</label>
                <select id="cableType" v-model="newConnection.cableType" class="form-select">
                  <option value="fiber">Fibra Óptica</option>
                  <option value="coaxial">Coaxial</option>
                  <option value="twisted">Par Trenzado</option>
                </select>
              </div>
              <div class="form-group mb-3">
                <label for="cableColor">Color (para visualización):</label>
                <input type="color" id="cableColor" v-model="newConnection.color" class="form-control form-control-sm">
              </div>
              <p>
                <strong>Origen:</strong> {{ getPointName(connectionInProgress.startPoint) }}<br>
                <strong>Destino:</strong> {{ getPointName(connectionInProgress.endPoint) }}<br>
                <strong>Distancia:</strong> {{ calculateDistance(connectionInProgress.startPoint, connectionInProgress.endPoint).toFixed(2) }} metros
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="saveConnection">Guardar Conexión</button>
            </div>
          </div>
        </div>
      </div>
    </div>    <SetupHelp />
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LControlScale, LPolyline, LPolygon } from '@vue-leaflet/vue-leaflet';
import MainMenu from './MainMenu.vue';
import SetupHelp from './SetupHelp.vue';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid'; // Necesitarás instalar: npm install uuid
import '../assets/connection-alert.css';
import Swal from 'sweetalert2';

// Referencias y estado básico del mapa
const mapRef = ref(null);
const zoom = ref(9); // Nivel de zoom para El Salvador completo
const center = ref([ 13.794185, -88.89653 ]); // Centro de El Salvador
const isFullscreen = ref(false);
const tempMarker = ref(null);

// Definición de ubicaciones en El Salvador
const locations = ref([
  { id: 'san-salvador', name: 'San Salvador', coords: [13.6929, -89.2182], zoom: 13 },
  { id: 'santa-ana', name: 'Santa Ana', coords: [13.9946, -89.5598], zoom: 13 },
  { id: 'san-miguel', name: 'San Miguel', coords: [13.4808, -88.1780], zoom: 13 },
  { id: 'usulutan', name: 'Usulután', coords: [13.3428, -88.4372], zoom: 12 },
  { id: 'sonsonate', name: 'Sonsonate', coords: [13.7183, -89.7257], zoom: 13 },
  { id: 'la-libertad', name: 'La Libertad', coords: [13.4883, -89.3222], zoom: 12 },
  { id: 'ahuachapan', name: 'Ahuachapán', coords: [13.9214, -89.8450], zoom: 13 },
  { id: 'morazan', name: 'Morazán', coords: [13.7692, -88.1253], zoom: 11 },
  { id: 'chalatenango', name: 'Chalatenango', coords: [14.0370, -88.9372], zoom: 12 },
  { id: 'cuscatlan', name: 'Cuscatlán', coords: [13.7200, -88.9561], zoom: 12 },
  { id: 'la-paz', name: 'La Paz', coords: [13.5000, -88.9500], zoom: 12 },
  { id: 'cabanas', name: 'Cabañas', coords: [13.8342, -88.6464], zoom: 12 },
  { id: 'la-union', name: 'La Unión', coords: [13.3375, -87.8439], zoom: 13 },
  { id: 'san-vicente', name: 'San Vicente', coords: [13.6364, -88.8031], zoom: 13 }
]);

// Referencias a datos de usuario
const user = inject('user');
const userRole = inject('userRole');

// Estado para edición en el mapa
const currentEditMode = ref('view'); // 'view', 'addInfrastructure', 'addCable', 'addZone'
const selectedInfraType = ref(1); // Tipo de infraestructura seleccionado (ID)
const newPointName = ref('');
const newPointDescription = ref('');

// Estado para conexiones de cable
const connectionInProgress = ref(null);
const newConnection = ref({
  cableType: 'fiber',
  color: '#3388ff'
});

// Computed property para la línea temporal de conexión
const temporaryConnectionLine = computed(() => {
  if (connectionInProgress.value?.startPoint && currentEditMode.value === 'addCable') {
    return {
      startPoint: [
        connectionInProgress.value.startPoint.latitude,
        connectionInProgress.value.startPoint.longitude
      ],
      color: newConnection.value.color || '#3388ff'
    };
  }
  return null;
});

// Datos cargados desde la base de datos
const infrastructureTypes = ref([
  { id: 1, name: 'Poste', icon: 'fa-bolt' },
  { id: 2, name: 'Mufa', icon: 'fa-box' },
  { id: 3, name: 'Central', icon: 'fa-building' },
  { id: 4, name: 'Terminal', icon: 'fa-network-wired' }
]);
const infrastructurePoints = ref([]);
const cableConnections = ref([]);
const zones = ref([]);

// Configuración del mapa
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Modos de edición disponibles
const editModes = [
  { id: 'view', title: 'Ver mapa', icon: 'fa-eye' },
  { id: 'addInfrastructure', title: 'Añadir poste/mufa/etc', icon: 'fa-map-pin' },
  { id: 'addCable', title: 'Conectar puntos', icon: 'fa-project-diagram' },
  { id: 'addZone', title: 'Crear zona', icon: 'fa-draw-polygon' }
];

// Función para cambiar el modo de edición
function setEditMode(mode) {
  currentEditMode.value = mode;
  // Reiniciar estados temporales cuando cambia el modo
  tempMarker.value = null;
  connectionInProgress.value = null;
}

// Función para cancelar una conexión en progreso
function cancelConnection() {
  connectionInProgress.value = null;
  // Opcionalmente, cambiar al modo vista
  currentEditMode.value = 'view';
}

// Función para manejar clics en el mapa
function onMapClick(e) {
  if (currentEditMode.value === 'addInfrastructure') {
    // Colocar marcador temporal para añadir infraestructura
    tempMarker.value = e.latlng;
    
    // Reset form
    newPointName.value = '';
    newPointDescription.value = '';
    
    // Abre el popup automáticamente (necesita acceso al marcador)
    setTimeout(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      if (markers.length > 0) {
        markers[markers.length - 1].click();
      }
    }, 100);
  }
}

// Función para manejar el movimiento del mouse en el mapa
function onMouseMove(e) {
  // Si estamos en modo de conexión y tenemos un punto de origen
  if (currentEditMode.value === 'addCable' && connectionInProgress.value?.startPoint) {
    // Actualizar la posición final de la línea temporal con la posición del mouse
    if (temporaryConnectionLine.value) {
      // Asegurarnos de que la polyline tenga 2 puntos (origen y posición actual del mouse)
      const startPoint = [
        connectionInProgress.value.startPoint.latitude,
        connectionInProgress.value.startPoint.longitude
      ];
      const mousePoint = [e.latlng.lat, e.latlng.lng];
      
      // Actualizar la polyline
      const polyline = document.querySelector('.leaflet-temp-connection');
      if (polyline && polyline._latlngs) {
        polyline._latlngs = [startPoint, mousePoint];
        polyline.redraw();
      }
    }
  }
}

// Función para cancelar la adición de un punto
function cancelAddPoint() {
  tempMarker.value = null;
}

// Función para confirmar y guardar un nuevo punto de infraestructura
async function confirmAddPoint() {
  if (!tempMarker.value || !user.value) {
    Swal.fire({
      title: 'Error',
      text: 'No hay un marcador temporal o no hay usuario autenticado.',
      icon: 'error',
      confirmButtonColor: '#d33'
    });
    return;
  }
  
  try {
    const newPoint = {
      id: uuidv4(),
      type_id: selectedInfraType.value,
      latitude: tempMarker.value.lat,
      longitude: tempMarker.value.lng,
      name: newPointName.value || `${getTypeName(selectedInfraType.value)}-${Date.now().toString().slice(-6)}`,
      description: newPointDescription.value,
      created_at: new Date(),
      created_by: user.value.id,
      properties: {}
    };
    
    console.log('Intentando guardar punto:', newPoint);
    
    const { data, error } = await supabase
      .from('infrastructure_points')
      .insert([newPoint]);
      
    if (error) {
      console.error('Error detallado al insertar en BD:', error);
        // Verificar el tipo de error
      if (error.code === '42P01') { // Tabla no existe
        Swal.fire({
          title: 'Error en base de datos',
          text: 'La tabla infrastructure_points no existe en la base de datos. Por favor, ejecuta el script SQL para crear las tablas.',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      } else if (error.code === '23505') { // Violación de unicidad
        Swal.fire({
          title: 'Error de duplicado',
          text: 'Ya existe un punto con ese ID.',
          icon: 'warning',
          confirmButtonColor: '#d33'
        });
      } else if (error.code === '23503') { // Violación de clave foránea
        Swal.fire({
          title: 'Error de referencia',
          text: 'El tipo de infraestructura seleccionado no es válido.',
          icon: 'warning',
          confirmButtonColor: '#d33'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: `Error al guardar en la base de datos: ${error.message}`,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
      
      // A pesar del error, añadir al array local para demostración
      infrastructurePoints.value.push(newPoint);
      console.log('Punto añadido localmente (no en BD)');
    } else {
      // Si se guardó correctamente, añadir a la lista local
      infrastructurePoints.value.push(newPoint);
      console.log('Punto guardado correctamente en BD y añadido localmente');
      alert('Punto guardado correctamente en la base de datos.');
    }
    
    // Reset en cualquier caso
    tempMarker.value = null;
    newPointName.value = '';
    newPointDescription.value = '';
    
  } catch (error) {
    console.error('Error general al guardar el punto:', error);
    
    // Intentar crear un punto local para demostración
    try {
      const newPoint = {
        id: uuidv4(),
        type_id: selectedInfraType.value,
        latitude: tempMarker.value.lat,
        longitude: tempMarker.value.lng,
        name: newPointName.value || `${getTypeName(selectedInfraType.value)}-${Date.now().toString().slice(-6)}`,
        description: newPointDescription.value,
        created_at: new Date(),
        created_by: user.value?.id || 'local-user',
        properties: {}
      };
      
      infrastructurePoints.value.push(newPoint);
      console.log('Punto añadido solo localmente debido a error:', error);
      alert('El punto se muestra localmente, pero no se ha guardado en la base de datos.');
    } catch (localError) {
      console.error('No se pudo crear ni siquiera localmente:', localError);
      alert('Error crítico: No se pudo agregar el punto ni siquiera localmente.');
    }
    
    // Reset
    tempMarker.value = null;
    newPointName.value = '';
    newPointDescription.value = '';
  }
}

// Función para iniciar una conexión de cable
function startCableConnection(point) {
  // Cambiar al modo de conexión
  currentEditMode.value = 'addCable';
  
  // Iniciar la conexión con el punto seleccionado
  connectionInProgress.value = { startPoint: point };
  console.log('Conexión iniciada desde el popup, punto:', point.id);
  
  Swal.fire({
    title: '¡Punto de origen seleccionado!',
    text: 'Ahora selecciona el punto destino para crear la conexión.',
    icon: 'info',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#3085d6',
    timer: 3000,
    timerProgressBar: true
  });
}

// Función para guardar la conexión
async function saveConnection() {
  if (!connectionInProgress.value?.startPoint || !connectionInProgress.value?.endPoint) {
    alert('Error: No se han seleccionado los puntos de origen y destino.');
    return;
  }
  
  if (!user.value) {
    alert('Error: No hay un usuario autenticado.');
    return;
  }
  
  try {
    const newConn = {
      id: uuidv4(),
      start_point_id: connectionInProgress.value.startPoint.id,
      end_point_id: connectionInProgress.value.endPoint.id,
      cable_type: newConnection.value.cableType,
      color: newConnection.value.color,
      distance: calculateDistance(
        connectionInProgress.value.startPoint,
        connectionInProgress.value.endPoint
      ),
      created_at: new Date(),
      created_by: user.value.id,
      properties: {}
    };
    
    console.log('Intentando guardar conexión:', newConn);
    
    try {
      const { data, error } = await supabase
        .from('cable_connections')
        .insert(newConn);
        
      if (error) {
        console.warn('Error al insertar conexión en BD:', error);
        
        // Verificar el tipo de error
        if (error.code === '42P01') { // Tabla no existe
          alert('Error: La tabla cable_connections no existe en la base de datos. Por favor, ejecuta el script SQL para crear las tablas.');
        } else {
          alert(`Error al guardar en la base de datos: ${error.message}`);
        }
        
        // Añadir conexión solo a la lista local para demostración
        cableConnections.value.push(newConn);
        console.log('Conexión añadida localmente (no en BD)');
        alert('La conexión se muestra localmente, pero no se ha guardado en la base de datos.');
      } else {
        // Añadir conexión a la lista local si se guardó correctamente
        cableConnections.value.push(newConn);
        console.log('Conexión guardada correctamente en BD y añadida localmente');
        alert('Conexión guardada correctamente en la base de datos.');
      }
    } catch (dbError) {
      console.warn('Error de base de datos:', dbError);
      // Añadir conexión solo a la lista local para demostración
      cableConnections.value.push(newConn);
      alert('La conexión se muestra localmente, pero no se ha guardado en la base de datos.');
    }
    
    // Reset
    connectionInProgress.value = null;
    newConnection.value = { cableType: 'fiber', color: '#3388ff' };
    
    // Cambiar al modo de visualización
    currentEditMode.value = 'view';
    
    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('connectionModal'));
    if (modal) modal.hide();
    
  } catch (error) {
    console.error('Error al guardar la conexión:', error);
    alert('Error al guardar la conexión. Por favor, crea las tablas en Supabase primero.');
  }
}

// Obtener las coordenadas para una línea de conexión
function getConnectionLatLngs(connection) {
  const startPoint = infrastructurePoints.value.find(p => p.id === connection.start_point_id);
  const endPoint = infrastructurePoints.value.find(p => p.id === connection.end_point_id);
  
  if (startPoint && endPoint) {
    return [
      [startPoint.latitude, startPoint.longitude],
      [endPoint.latitude, endPoint.longitude]
    ];
  }
  
  return [];
}

// Función para calcular la distancia entre dos puntos (Haversine)
function calculateDistance(point1, point2) {
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distancia en metros
}

// Funciones de utilidad para nombres e íconos
function getTypeName(typeId) {
  const type = infrastructureTypes.value.find(t => t.id === typeId);
  return type ? type.name : 'Desconocido';
}

function getTypeIcon(typeId) {
  const type = infrastructureTypes.value.find(t => t.id === typeId);
  return type ? type.icon : 'fa-question';
}

function getPointIcon(point) {
  const icon = getTypeIcon(point.type_id);
  
  // Crear un icono personalizado con Font Awesome
  const iconHtml = `<i class="fas ${icon}" style="font-size: 18px; color: #2563eb;"></i>`;
  
  return window.L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

function getPointName(point) {
  return point.name || `${getTypeName(point.type_id)} ${point.id.substring(0, 6)}`;
}

// Eliminar un punto de infraestructura
async function deleteInfrastructurePoint(point) {
  if (!confirm(`¿Estás seguro de eliminar este punto? Se eliminarán también todas sus conexiones.`)) {
    return;
  }
  
  try {
    // Primero eliminar todas las conexiones asociadas a este punto
    const { error: connError } = await supabase
      .from('cable_connections')
      .delete()
      .or(`start_point_id.eq.${point.id},end_point_id.eq.${point.id}`);
    
    if (connError) throw connError;
    
    // Luego eliminar el punto
    const { error } = await supabase
      .from('infrastructure_points')
      .delete()
      .eq('id', point.id);
    
    if (error) throw error;
    
    // Actualizar listas locales
    infrastructurePoints.value = infrastructurePoints.value.filter(p => p.id !== point.id);
    cableConnections.value = cableConnections.value.filter(c => 
      c.start_point_id !== point.id && c.end_point_id !== point.id
    );
    
  } catch (error) {
    console.error('Error al eliminar el punto:', error);
    alert('Error al eliminar el punto. Intenta nuevamente.');
  }
}

// Manejar clic en cable
function onCableClick(connection) {
  // Implementar lógica para mostrar información del cable
  console.log('Cable seleccionado:', connection);
}

// Seleccionar un punto de infraestructura
function selectInfrastructurePoint(point) {
  // Si estamos en modo de conexión
  if (currentEditMode.value === 'addCable') {    // Si no hay conexión en progreso, iniciar una nueva
    if (!connectionInProgress.value) {
      connectionInProgress.value = { startPoint: point };
      console.log('Conexión iniciada desde punto:', point.id);
      
      Swal.fire({
        title: '¡Punto de origen seleccionado!',
        text: 'Ahora selecciona el punto destino para crear la conexión.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        timer: 3000,
        timerProgressBar: true
      });
    } 
    // Si ya hay un punto inicial y seleccionamos uno diferente como destino
    else if (connectionInProgress.value.startPoint.id !== point.id) {
      connectionInProgress.value.endPoint = point;
      console.log('Conexión completada con punto destino:', point.id);
      
      // Mostrar modal para confirmar conexión
      const modal = new bootstrap.Modal(document.getElementById('connectionModal'));
      modal.show();
    }
  }
}

// Función para alternar pantalla completa
function toggleFullscreen() {
  const mapContainer = document.querySelector('.map-container');
  
  if (!document.fullscreenElement) {
    if (mapContainer.requestFullscreen) {
      mapContainer.requestFullscreen();
      isFullscreen.value = true;
    } else if (mapContainer.mozRequestFullScreen) {
      mapContainer.mozRequestFullScreen();
      isFullscreen.value = true;
    } else if (mapContainer.webkitRequestFullscreen) {
      mapContainer.webkitRequestFullscreen();
      isFullscreen.value = true;
    } else if (mapContainer.msRequestFullscreen) {
      mapContainer.msRequestFullscreen();
      isFullscreen.value = true;
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullscreen.value = false;
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      isFullscreen.value = false;
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      isFullscreen.value = false;
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      isFullscreen.value = false;
    }
  }
}

// Listener para detectar cambios en el estado de pantalla completa
const handleFullscreenChange = () => {
  if (!document.fullscreenElement && isFullscreen.value) {
    isFullscreen.value = false;
  }
};

// Función para ir a una ubicación seleccionada
function goToLocation(locationId) {
  if (!locationId) return;
  
  const location = locations.value.find(loc => loc.id === locationId);
  if (location) {
    // Animar la transición a la nueva ubicación
    mapRef.value.leafletObject.flyTo(location.coords, location.zoom, {
      duration: 1.5, // Duración de la animación en segundos
      easeLinearity: 0.25
    });
  }
}

// Cargar datos al montar el componente
async function loadMapData() {
  try {
    // Verificar si existen las tablas necesarias
    try {
      // Cargar tipos de infraestructura
      const { data: typesData, error: typesError } = await supabase
        .from('infrastructure_types')
        .select('*');
      
      if (typesError) {
        console.warn('Tabla infrastructure_types no encontrada:', typesError);
      } else if (typesData) {
        infrastructureTypes.value = typesData;
      
        // Si la primera tabla existe, intentar cargar el resto
        // Cargar puntos de infraestructura
        const { data: pointsData, error: pointsError } = await supabase
          .from('infrastructure_points')
          .select('*');
        
        if (pointsError) console.warn('Error al cargar puntos:', pointsError);
        else if (pointsData) infrastructurePoints.value = pointsData;
        
        // Cargar conexiones de cables
        const { data: cablesData, error: cablesError } = await supabase
          .from('cable_connections')
          .select('*');
        
        if (cablesError) console.warn('Error al cargar conexiones:', cablesError);
        else if (cablesData) cableConnections.value = cablesData;
        
        // Cargar zonas
        const { data: zonesData, error: zonesError } = await supabase
          .from('zones')
          .select('*');
        
        if (zonesError) console.warn('Error al cargar zonas:', zonesError);
        else if (zonesData) zones.value = zonesData;
      }
    } catch (loadError) {
      console.warn('Error al verificar las tablas:', loadError);
      alert('Es necesario crear las tablas en Supabase. Por favor, sigue las instrucciones.');
    }
    
  } catch (error) {
    console.error('Error al cargar datos del mapa:', error);
    // No mostramos alerta para no molestar al usuario mientras configura
  }
}

onMounted(() => {
  // Cargar datos
  loadMapData();
  
  // Listeners de pantalla completa
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

onUnmounted(() => {
  // Remover listeners de pantalla completa
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});
</script>

<style scoped>
.map-container {
  height: calc(100vh - 100px);
  width: 100%;
  margin-top: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  z-index: 10;
}

.map-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
}

.map-header h4 i {
  font-size: 20px;
}

.map-controls {
  display: flex;
  gap: 8px;
}

.l-map {
  height: 100%;
  width: 100%;
  flex-grow: 1;
  z-index: 1;
}

.map-popup {
  padding: 12px;
  font-size: 14px;
  min-width: 200px;
}

.map-popup h5 {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.map-popup p {
  margin-bottom: 10px;
}

.popup-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: space-between;
}

.btn-group {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
}

.btn-group .btn {
  margin: 0;
  border-radius: 0;
  border-right: 1px solid rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
}

.btn-group .btn:last-child {
  border-right: none;
}

.btn-group .btn i {
  font-size: 14px;
}

.custom-div-icon {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-div-icon i {
  background-color: #fff;
  border-radius: 50%;
  padding: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}

.form-group {
  margin-bottom: 10px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 3px;
  display: block;
}

.location-selector {
  max-width: 200px;
  font-size: 14px;
  background-color: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.location-selector:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

:global(body.dark-mode) .location-selector {
  background-color: #1e293b;
  color: #f1f5f9;
  border-color: #334155;
}

:global(body.dark-mode) .location-selector:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25);
}

:global(body.dark-mode) .map-header {
  background: #1e293b;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

:global(body.dark-mode) .map-header h4 {
  color: #60a5fa;
}

:global(body.dark-mode) .l-map {
  box-shadow: 0 4px 12px rgba(255,255,255,0.05);
}

:global(body.dark-mode) .map-container {
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

:global(.leaflet-control-container .leaflet-control) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

:global(.fullscreen .map-container) {
  height: 100vh;
  border-radius: 0;
}

:global(body.dark-mode) .custom-div-icon i {
  background-color: #1e293b;
  color: #60a5fa !important;
  box-shadow: 0 2px 5px rgba(0,0,0,0.4);
}

:global(.leaflet-popup-content) {
  margin: 0;
  padding: 0;
  width: auto !important;
}

:global(.leaflet-popup-content-wrapper) {
  padding: 0;
}

:global(body.dark-mode .map-popup) {
  background-color: #1e293b;
  color: #f1f5f9;
}

:global(body.dark-mode .map-popup h5) {
  color: #60a5fa;
}
</style>
