<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container-fluid mt-5 pt-4">
      <div class="row">
        <div class="col-12 col-lg-9">
          <div class="map-container">
            <div class="map-header">
              <h4><i class="fas fa-map-marked-alt"></i> Mapa de Infraestructura</h4>              <div class="map-controls">
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
                </div>                <select class="form-select form-select-sm me-2 location-selector" 
                  @change="goToLocation($event.target.value)">
                  <option value="">-- Ir a ubicación --</option>
                  <optgroup label="Departamentos">
                    <option v-for="location in locations" :key="location.id" :value="location.id">
                      {{ location.name }}
                    </option>
                  </optgroup>
                </select>

                <button class="btn btn-sm me-2" :class="showZones ? 'btn-info' : 'btn-outline-info'" @click="toggleZones" title="Mostrar/Ocultar zonas">
                  <i class="fas fa-draw-polygon"></i>
                </button>

                <button class="btn btn-sm me-2" :class="isDarkMode ? 'btn-warning' : 'btn-outline-secondary'" @click="toggleDarkMode" title="Alternar modo oscuro del mapa">
                  <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
                </button>

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
            </div>              <l-map
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
              </l-marker>              <!-- Líneas de conexión de cables -->
              <l-polyline 
                v-for="connection in cableConnections" 
                :key="connection.id" 
                :lat-lngs="getConnectionLatLngs(connection)" 
                :color="connection.color || '#3388ff'"
                :weight="4"
                @click="onCableClick(connection)"
              >
                <l-tooltip :permanent="true" :interactive="true" :direction="'center'" :className="'connection-distance-label'">
                  <span>{{ formatDistance(connection.distance) }}</span>
                </l-tooltip>
              </l-polyline>              <!-- Línea temporal para la conexión en progreso -->
              <l-polyline
                v-if="temporaryConnectionLine"
                :lat-lngs="temporaryConnectionLine.points"
                :color="temporaryConnectionLine.color"
                :weight="4"
                :dash-array="'5, 10'"
                class="leaflet-temp-connection"
              >
                <l-tooltip v-if="temporaryConnectionDistance" :permanent="true" :interactive="true" :direction="'center'" :className="'connection-distance-label connection-temp-label'">
                  <span>{{ temporaryConnectionDistance }}</span>
                </l-tooltip>
              </l-polyline>
                <!-- Zonas como polígonos -->
              <l-polygon
                v-if="showZones"
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

              <div v-if="currentEditMode === 'addZone'">
  <div class="alert alert-info d-flex align-items-center mt-2">
    <i class="fas fa-draw-polygon me-2"></i>
    Haz clic en el mapa para agregar vértices de la zona. <span class="ms-2">Cierra la zona haciendo clic cerca del primer punto.</span>
    <button v-if="zoneInProgress && zoneInProgress.polygon.length >= 3" class="btn btn-sm btn-success ms-3" @click="finishZone">Finalizar zona</button>
    <button v-if="zoneInProgress && zoneInProgress.polygon.length > 0" class="btn btn-sm btn-warning ms-2" @click="undoZoneVertex"><i class="fas fa-undo"></i> Deshacer</button>
    <button v-if="zoneInProgress" class="btn btn-sm btn-danger ms-2" @click="cancelZone">Cancelar</button>
  </div>
</div>

<l-polygon
  v-if="temporaryZonePolygon"
  :lat-lngs="temporaryZonePolygon"
  color="#3388ff"
  :fill="true"
  :fillOpacity="0.2"
  dash-array="5, 10"
/>
<!-- Marcadores de vértices de zona -->
<l-marker v-for="(vertex, idx) in zoneVertices" :key="'zone-vertex-' + idx" :lat-lng="vertex" :icon="smallVertexIcon">
  <l-popup v-if="idx === 0">Primer punto (haz clic cerca para cerrar zona)</l-popup>
</l-marker>
            </l-map>
          </div>
        </div>
        <div class="col-12 col-lg-3">
          <div class="sidebar-list bg-white p-3 rounded shadow-sm mt-3 mt-lg-0">
            <h5 class="mb-3"><i class="fas fa-list"></i> Infraestructura</h5>
            <div class="mb-2">
              <label for="zoneFilter" class="form-label">Filtrar por zona:</label>
              <select id="zoneFilter" v-model="selectedZoneId" class="form-select form-select-sm">
                <option value="">Todas las zonas</option>
                <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name || ('Zona ' + zone.id.substring(0,6)) }}</option>
              </select>
            </div>
            <div v-for="type in infrastructureTypes" :key="type.id" class="mb-3">
              <h6 class="text-primary"><i :class="'fas ' + type.icon"></i> {{ type.name }}</h6>
              <ul class="list-group list-group-flush">
                <li v-for="point in filteredPointsByType(type.id)" :key="point.id" class="list-group-item d-flex justify-content-between align-items-center">
                  <span>{{ point.name || (type.name + ' ' + point.id.substring(0,6)) }}</span>
                  <button class="btn btn-sm btn-outline-primary" @click="flyToPoint(point)"><i class="fas fa-location-arrow"></i></button>
                </li>
                <li v-if="filteredPointsByType(type.id).length === 0" class="list-group-item text-muted small">Sin elementos</li>
              </ul>
            </div>
          </div>
        </div>
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
              </div>              <p>
                <strong>Origen:</strong> {{ getPointName(connectionInProgress.startPoint) }}<br>
                <strong>Destino:</strong> {{ getPointName(connectionInProgress.endPoint) }}<br>
                <strong>Distancia:</strong> {{ formatDistance(calculateDistance(connectionInProgress.startPoint, connectionInProgress.endPoint)) }}
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
import { LMap, LTileLayer, LMarker, LPopup, LControlScale, LPolyline, LPolygon, LTooltip } from '@vue-leaflet/vue-leaflet';
import MainMenu from './MainMenu.vue';
import SetupHelp from './SetupHelp.vue';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid'; // Necesitarás instalar: npm install uuid
import '../assets/connection-alert.css';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

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

// Estado para la visibilidad de las zonas
const showZones = ref(true); // Por defecto, las zonas están visibles

// Estado para el modo oscuro del mapa
const isDarkMode = ref(false);
const darkTileUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
const lightTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileUrl = computed(() => isDarkMode.value ? darkTileUrl : lightTileUrl);

// Estado para la posición del mouse en modo conexión
const mouseLatLng = ref(null);

// Propiedad computada para la distancia de la conexión temporal
const temporaryConnectionDistance = computed(() => {
  if (connectionInProgress.value?.startPoint && mouseLatLng.value) {
    // Crear un objeto con la estructura necesaria para calculateDistance
    const tempPoint = {
      latitude: mouseLatLng.value.lat,
      longitude: mouseLatLng.value.lng
    };
    
    // Calcular la distancia
    const distance = calculateDistance(connectionInProgress.value.startPoint, tempPoint);
    
    // Formatear la distancia
    return formatDistance(distance);
  }
  return null;
});

// Computed property para la línea temporal de conexión
const temporaryConnectionLine = computed(() => {
  if (connectionInProgress.value?.startPoint && currentEditMode.value === 'addCable' && mouseLatLng.value) {
    return {
      points: [
        [connectionInProgress.value.startPoint.latitude, connectionInProgress.value.startPoint.longitude],
        [mouseLatLng.value.lat, mouseLatLng.value.lng]
      ],
      color: newConnection.value.color || '#3388ff'
    };
  }
  return null;
});

// Estado para creación de zonas
const zoneInProgress = ref(null); // { polygon: [[lat, lng], ...] }
const newZoneName = ref("");
const ZONE_CLOSE_DISTANCE = 0.0005; // ~50m, ajustable

// Computed para el polígono temporal
const temporaryZonePolygon = computed(() => {
  if (currentEditMode.value === 'addZone' && zoneInProgress.value && zoneInProgress.value.polygon.length > 1) {
    // Para visualizar un polígono cerrado, añadimos el primer punto también al final
    const vertices = [...zoneInProgress.value.polygon];
    // Si hay suficientes puntos (más de 2), cerramos el polígono para visualización
    if (vertices.length > 2) {
      return [...vertices, vertices[0]]; // Añadimos el primer punto al final
    }
    return vertices;
  }
  return null;
});

const zoneVertices = computed(() => zoneInProgress.value ? zoneInProgress.value.polygon : []);

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
  zoneInProgress.value = null;
}

// Función para cancelar una conexión en progreso
function cancelConnection() {
  connectionInProgress.value = null;
  mouseLatLng.value = null;
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
  } else if (currentEditMode.value === 'addCable') {
    mouseLatLng.value = e.latlng;
  } else if (currentEditMode.value === 'addZone') {
    if (!zoneInProgress.value) {
      // Iniciar la zona con el primer vértice
      zoneInProgress.value = { polygon: [ [e.latlng.lat, e.latlng.lng] ] };
    } else {
      const polygon = zoneInProgress.value.polygon;
      // Si hay al menos 3 vértices y el clic es cerca del primero, cerrar zona
      const first = polygon[0];
      const distToFirst = Math.sqrt(Math.pow(e.latlng.lat - first[0], 2) + Math.pow(e.latlng.lng - first[1], 2));
      if (polygon.length >= 3 && distToFirst < ZONE_CLOSE_DISTANCE) {
        finishZone();
        return;
      }
      // Evitar puntos muy cercanos al anterior
      const last = polygon[polygon.length - 1];
      const distToLast = Math.sqrt(Math.pow(e.latlng.lat - last[0], 2) + Math.pow(e.latlng.lng - last[1], 2));
      if (distToLast < ZONE_CLOSE_DISTANCE / 2) return;
      // Agregar nuevo vértice
      polygon.push([e.latlng.lat, e.latlng.lng]);
    }
  }
}

function undoZoneVertex() {
  if (zoneInProgress.value && zoneInProgress.value.polygon.length > 0) {
    zoneInProgress.value.polygon.pop();
    if (zoneInProgress.value.polygon.length === 0) zoneInProgress.value = null;
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
      Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Punto guardado correctamente en la base de datos.', confirmButtonColor: '#3085d6', timer: 2000, timerProgressBar: true });
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
      Swal.fire({ icon: 'warning', title: 'Solo local', text: 'El punto se muestra localmente, pero no se ha guardado en la base de datos.', confirmButtonColor: '#f59e42', timer: 2500, timerProgressBar: true });
    } catch (localError) {
      console.error('No se pudo crear ni siquiera localmente:', localError);
      Swal.fire({ icon: 'error', title: 'Error crítico', text: 'No se pudo agregar el punto ni siquiera localmente.', confirmButtonColor: '#d33' });
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
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se han seleccionado los puntos de origen y destino.', confirmButtonColor: '#d33' });
    return;
  }
  if (!user.value) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'No hay un usuario autenticado.', confirmButtonColor: '#d33' });
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
    // Validar que los puntos no sean el mismo
    // Mostrar loading
    Swal.fire({
      title: 'Guardando conexión...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });
    const { data, error } = await supabase
      .from('cable_connections')
      .insert(newConn);
    Swal.close();
    if (error) {
      console.warn('Error al insertar conexión en BD:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar en Supabase',
        text: error.message || JSON.stringify(error),
        confirmButtonColor: '#d33'
      });
      cableConnections.value.push(newConn);
      return;
    }
    cableConnections.value.push(newConn);
    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Conexión guardada correctamente en la base de datos.',
      confirmButtonColor: '#3085d6',
      timer: 2000,
      timerProgressBar: true
    });
    // Reset
    connectionInProgress.value = null;
    newConnection.value = { cableType: 'fiber', color: '#3388ff' };
    mouseLatLng.value = null;
    currentEditMode.value = 'view';
    const modal = bootstrap.Modal.getInstance(document.getElementById('connectionModal'));
    if (modal) modal.hide();
  } catch (error) {
    Swal.close();
    console.error('Error al guardar la conexión:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al guardar la conexión. Por favor, revisa la consola.', confirmButtonColor: '#d33' });
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
  if (!point1 || !point2 || point1.latitude == null || point1.longitude == null || point2.latitude == null || point2.longitude == null) {
    return 0;
  }
  const R = 6371000; // Radio de la Tierra en metros
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));  return R * c; // Distancia en metros
}

// Función para formatear la distancia en un formato legible
function formatDistance(distance) {
  if (distance === undefined || distance === null) {
    return 'N/A';
  }
  
  // Si la distancia es menor a 1000 metros, mostrar en metros
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  } 
  // Si es mayor o igual a 1000 metros, mostrar en kilómetros con 2 decimales
  else {
    return `${(distance / 1000).toFixed(2)} km`;
  }
}

// Función para eliminar una conexión
async function deleteConnection(connection) {
  try {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Eliminar de la base de datos
        const { error } = await supabase
          .from('cable_connections')
          .delete()
          .eq('id', connection.id);
        
        if (error) {
          throw error;
        }
        
        // Eliminar del estado local
        cableConnections.value = cableConnections.value.filter(c => c.id !== connection.id);
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La conexión ha sido eliminada.',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  } catch (error) {
    console.error('Error al eliminar la conexión:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar la conexión. Inténtalo de nuevo.',
      confirmButtonColor: '#d33'
    });
  }
}

// Función para obtener el nombre legible del tipo de cable
function getCableTypeName(cableType) {
  const types = {
    'fiber': 'Fibra Óptica',
    'coaxial': 'Coaxial',
    'twisted': 'Par Trenzado'
  };
  
  return types[cableType] || cableType || 'Desconocido';
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
  if (!point) return 'Punto desconocido';
  return point.name || `${getTypeName(point.type_id)} ${point.id ? point.id.substring(0, 6) : ''}`;
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
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al eliminar el punto. Intenta nuevamente.',
      confirmButtonColor: '#d33'
    });
  }
}

// Manejar clic en cable
function onCableClick(connection) {
  console.log('Cable seleccionado:', connection);
  // Obtener los puntos de inicio y fin
  const startPoint = infrastructurePoints.value.find(p => p.id === connection.start_point_id);
  const endPoint = infrastructurePoints.value.find(p => p.id === connection.end_point_id);
  
  if (!startPoint || !endPoint) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron encontrar los puntos de esta conexión',
      confirmButtonColor: '#d33'
    });
    return;
  }
  
  // Mostrar información detallada
  Swal.fire({
    title: 'Detalles de la conexión',
    html: `
      <div class="connection-details">
        <p><strong>Tipo de cable:</strong> ${getCableTypeName(connection.cable_type)}</p>
        <p><strong>Origen:</strong> ${getPointName(startPoint)}</p>
        <p><strong>Destino:</strong> ${getPointName(endPoint)}</p>
        <p><strong>Distancia:</strong> ${formatDistance(connection.distance)}</p>
        <p><strong>ID:</strong> <span class="text-muted small">${connection.id.substring(0, 8)}</span></p>
      </div>
    `,
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#3085d6',
    showCancelButton: true,
    cancelButtonText: 'Eliminar',
    cancelButtonColor: '#d33'
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.cancel) {
      // Si el usuario hizo clic en "Eliminar"
      deleteConnection(connection);
    }
  });
}

// Seleccionar un punto de infraestructura
function selectInfrastructurePoint(point) {
  // Si estamos en modo de conexión
  if (currentEditMode.value === 'addCable') {    // Si no hay conexión en progreso, iniciar una nueva
    if (!connectionInProgress.value) {
      connectionInProgress.value = { startPoint: point };
      mouseLatLng.value = null;
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
      mouseLatLng.value = null;
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
      Swal.fire({
        icon: 'warning',
        title: 'Tablas no encontradas',
        text: 'Es necesario crear las tablas en Supabase. Por favor, sigue las instrucciones.',
        confirmButtonColor: '#d33'
      });
    }
    
  } catch (error) {
    console.error('Error al cargar datos del mapa:', error);
    // No mostramos alerta para no molestar al usuario mientras configura
  }
}

const selectedZoneId = ref("");

function filteredPointsByType(typeId) {
  return infrastructurePoints.value.filter(p => {
    const matchesType = p.type_id === typeId;
    if (!selectedZoneId.value) return matchesType;
    // Buscar si el punto está dentro de la zona seleccionada (por id de zona en el punto o por polígono)
    // Si los puntos tienen zona_id:
    if (p.zone_id) return matchesType && p.zone_id === selectedZoneId.value;
    // Si no, buscar si está dentro del polígono de la zona
    const zone = zones.value.find(z => z.id === selectedZoneId.value);
    if (!zone || !zone.polygon) return false;
    // Simple point-in-polygon (solo si hay polígono)
    return matchesType && isPointInPolygon([p.latitude, p.longitude], zone.polygon);
  });
}

function isPointInPolygon(point, polygon) {
  // Ray-casting algorithm for point-in-polygon
  let x = point[1], y = point[0];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][1], yi = polygon[i][0];
    let xj = polygon[j][1], yj = polygon[j][0];
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function flyToPoint(point) {
  if (mapRef.value && mapRef.value.leafletObject) {
    mapRef.value.leafletObject.flyTo([point.latitude, point.longitude], 17, { duration: 1 });
  }
}

// Función para finalizar y guardar la zona
async function finishZone() {
  if (!zoneInProgress.value || zoneInProgress.value.polygon.length < 3) {
    Swal.fire({ icon: 'warning', title: 'Zona incompleta', text: 'Debes seleccionar al menos 3 puntos.', confirmButtonColor: '#d33' });
    return;
  }
  // Mostrar modal para nombre
  Swal.fire({
    title: 'Nombre de la zona',
    input: 'text',
    inputLabel: 'Nombre',
    inputValue: '',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: (value) => {
      if (!value) {
        Swal.showValidationMessage('El nombre es obligatorio');
      }
      return value;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const zone = {
        id: uuidv4(),
        name: result.value,
        polygon: zoneInProgress.value.polygon,
        color: '#3388ff',
        created_at: new Date()
        // Eliminamos properties ya que no existe en la tabla
      };
      // Guardar en Supabase
      const { error } = await supabase.from('zones').insert([zone]);
      if (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, confirmButtonColor: '#d33' });
      } else {
        zones.value.push(zone);
        Swal.fire({ icon: 'success', title: 'Zona guardada', text: 'Zona creada correctamente.', confirmButtonColor: '#3085d6', timer: 2000, timerProgressBar: true });
      }
      zoneInProgress.value = null;
    }
  });
}

// Función para cancelar la creación de zona
function cancelZone() {
  zoneInProgress.value = null;
}

// Crear el observer para el modo oscuro
const darkModeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      isDarkMode.value = document.body.classList.contains('dark-mode');
    }
  });
});

// Cargar datos al montar el componente
onMounted(() => {
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Detectar si el modo oscuro está activado al iniciar
  isDarkMode.value = document.body.classList.contains('dark-mode');
  console.log('Modo oscuro al iniciar:', isDarkMode.value);
  
  // Escuchar cambios en el modo oscuro
  darkModeObserver.observe(document.body, { attributes: true });
  
  // Cargar datos del mapa
  loadMapData();
});

// Limpiar listeners cuando se desmonte el componente
onUnmounted(() => {
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  darkModeObserver.disconnect();
});

// Función para alternar la visibilidad de las zonas
function toggleZones() {
  showZones.value = !showZones.value;
}

// Función para alternar modo oscuro directamente desde el mapa
function toggleDarkMode() {
  // Invertir el estado actual
  isDarkMode.value = !isDarkMode.value;
  
  // Emitir evento para cambiar el estado global del modo oscuro
  const event = new CustomEvent('toggle-dark-mode');
  document.dispatchEvent(event);
  
  console.log('Modo oscuro cambiado desde mapa a:', isDarkMode.value);
}

const smallVertexIcon = computed(() => {
  return window.L ? window.L.divIcon({
    html: `<div style="
      width: 10px; 
      height: 10px; 
      background-color: ${isDarkMode.value ? '#60a5fa' : '#3b82f6'}; 
      border: 2px solid ${isDarkMode.value ? '#0f172a' : 'white'};
      border-radius: 50%;"></div>`,
    className: 'vertex-marker',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  }) : null;
});


// Manejador para el movimiento del mouse en el mapa
function onMouseMove(e) {
  if (currentEditMode.value === 'addCable' && connectionInProgress.value?.startPoint) {
    mouseLatLng.value = e.latlng;
  }
}

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
  transition: background-color 0.3s, border-color 0.3s;
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
  transition: background-color 0.3s, color 0.3s;
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

.sidebar-list {
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

:deep(.leaflet-container) {
  transition: filter 0.5s ease;
}

/* Estilos específicos para el componente MapView */
.map-header {
  transition: background-color 0.3s, border-color 0.3s;
}

:deep(.map-popup) {
  transition: background-color 0.3s, color 0.3s;
}

:deep(body.dark-mode .leaflet-marker-icon) {
  filter: brightness(1.2) contrast(1.2);
}

:deep(body.dark-mode .connection-distance-label) {
  background-color: rgba(15, 23, 42, 0.75) !important;
  color: #f8fafc !important;
  border: 1px solid #334155 !important;
}

:deep(body.dark-mode .connection-temp-label) {
  background-color: rgba(37, 99, 235, 0.5) !important;
  border: 1px solid #60a5fa !important;
}

:deep(body.dark-mode .sidebar-list) {
  background-color: #1e293b !important;
  color: #f8fafc !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

:deep(body.dark-mode .list-group-item) {
  background-color: #1e293b !important;
  color: #f8fafc !important;
  border-color: #334155 !important;
}

:deep(body.dark-mode .location-selector) {
  background-color: #334155 !important;
  color: #f8fafc !important;
  border-color: #475569 !important;
}

/* Transición suave entre modos */
:deep(.l-map), .map-container, .sidebar-list, .list-group-item {
  transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

/* Botones de control con mejor contraste en modo oscuro */
:deep(body.dark-mode .btn-outline-secondary) {
  color: #cbd5e1 !important;
  border-color: #475569 !important;
}

:deep(body.dark-mode .btn-outline-secondary:hover) {
  background-color: #334155 !important;
  color: #f8fafc !important;
}

:deep(body.dark-mode .connection-active-alert) {
  background-color: #1e3a8a !important;
  color: #bfdbfe !important;
  border-color: #3b82f6 !important;
}
</style>
