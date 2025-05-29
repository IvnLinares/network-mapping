<template>
  <div>
    <MainMenu :userEmail="user?.email" :userRole="userRole" />
    <div class="container-fluid mt-5 pt-4">
      <div class="row">
        <div class="col-12 col-lg-9">          <div class="map-container">
            <div class="map-header">
              <h4><i class="fas fa-map-marked-alt me-2"></i> Mapa de Infraestructura</h4>
              <div class="map-controls">
                <div class="btn-group me-2 control-group">
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
                <button class="btn btn-sm btn-outline-success me-2" @click="goToUserLocation" title="Ir a mi ubicación">
                  <i class="fas fa-location-arrow"></i>
                </button>
                <button class="btn btn-sm" :class="measuringMode ? 'btn-warning' : 'btn-outline-warning'" @click="toggleMeasuringMode" title="Medir distancias/rutas">
                  <i class="fas fa-ruler-combined"></i>
                </button>
              </div>            </div>
            
            <div v-if="currentEditMode === 'addCable' && connectionInProgress && connectionInProgress.startPoint" 
                 class="connection-active-alert">
              <i class="fas fa-info-circle"></i> 
              Punto de origen seleccionado: {{ getPointName(connectionInProgress.startPoint) }}. 
              Haz clic en otro punto para crear la conexión.
              <button @click="cancelConnection" class="btn btn-sm btn-light ms-2">Cancelar</button>
            </div>
            
            <div v-if="currentEditMode === 'addZone' && zoneInProgress" class="zone-creation-overlay">
              <div class="zone-creation-alert alert d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <i class="fas fa-draw-polygon me-2"></i>
                  <span>Haz clic en el mapa para agregar vértices de la zona. <span class="ms-2">Cierra la zona haciendo clic cerca del primer punto.</span></span>
                </div>
                <div class="zone-actions d-flex align-items-center">
                  <button v-if="zoneInProgress && zoneInProgress.polygon.length >= 3" class="btn btn-sm btn-success ms-3" @click="finishZone">Finalizar zona</button>
                  <button v-if="zoneInProgress && zoneInProgress.polygon.length > 0" class="btn btn-sm btn-warning ms-2" @click="undoZoneVertex"><i class="fas fa-undo"></i> Deshacer</button>
                  <button v-if="zoneInProgress" class="btn btn-sm btn-danger ms-2" @click="cancelZone">Cancelar</button>
                </div>
              </div>
            </div>
            
            <l-map
              ref="mapRef"
              class="l-map"
              :zoom="zoom"
              :center="center"
              @click="onMapClick"
              @mousemove="onMouseMove"
            >
              <l-tile-layer :url="tileUrl" :attribution="mapAttribution" />
              <l-control-scale position="bottomleft" :imperial="false" :metric="true" />
                <!-- Marcadores de infraestructura -->
              <l-marker 
                v-for="point in displayPoints" 
                :key="point.id" 
                :lat-lng="[point.latitude, point.longitude]"
                :icon="getPointIcon(point)"
                @click="measuringMode ? addMeasuringPoint(point) : selectInfrastructurePoint(point)"              >
                <l-popup>
                  <div class="map-popup">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h5 class="popup-title mb-0">{{ point.name || (getTypeName(point.type_id) + ' ' + point.id.substring(0,6)) }}</h5>
                      <button 
                        class="btn btn-xs btn-outline-info ms-2 notes-button" 
                        @click.stop="openNotesModal(point)"
                      >
                        <i class="fas fa-comment-dots"></i>
                        <span v-if="notes[point.id] && notes[point.id].length > 0" class="note-count">
                          {{ notes[point.id].length }}
                        </span>
                      </button>
                    </div>
                    <p v-if="point.description" class="description">{{ point.description }}</p>
                    <p class="text-muted small id-text">ID: {{ point.id.substring(0, 8) }}</p>
                    <div class="popup-actions">
                      <button class="btn btn-sm btn-primary connect-btn" @click="startCableConnection(point)">
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
                </l-popup>              </l-marker>

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

<!-- Puntos de medición -->
<l-marker v-for="(mp, idx) in measuringPoints" :key="'measure-' + idx" :lat-lng="[mp.latitude, mp.longitude]" :icon="window.L.divIcon({html: '<i class=\'fas fa-dot-circle\' style=\'color:#f59e42;font-size:14px;\'></i>', className: 'custom-div-icon', iconSize: [18,18], iconAnchor: [9,9]})">
  <l-tooltip :permanent="true">{{ idx === 0 ? 'Inicio' : formatDistance(calculateDistance(measuringPoints[idx-1], mp)) }}</l-tooltip>
</l-marker>
<l-polyline v-if="measuringPoints.length > 1" :lat-lngs="measuringPoints.map(p => [p.latitude, p.longitude])" color="#f59e42" :weight="5" dash-array="6,8" />
<l-tooltip v-if="measuringPoints.length > 1" :lat-lng="[measuringPoints[measuringPoints.length-1].latitude, measuringPoints[measuringPoints.length-1].longitude]" :permanent="true" :className="'connection-distance-label'">
  <span>Distancia total: {{ formatDistance(measuringDistance) }}</span>
</l-tooltip>
<!-- Botón para limpiar medición -->
<button v-if="measuringMode && measuringPoints.length" class="btn btn-sm btn-danger position-absolute" style="top: 90px; right: 40px; z-index: 1200;" @click="clearMeasuring">
  <i class="fas fa-eraser"></i> Limpiar medición
</button>
            </l-map>
          </div>
        </div>
        <div class="col-12 col-lg-3">
          <div class="sidebar-list bg-white p-4 rounded shadow-lg mt-3 mt-lg-0">
            <h5 class="sidebar-title mb-3 d-flex align-items-center">
              <i class="fas fa-list me-2 text-primary"></i> 
              <span>Infraestructura</span>
              <span class="badge bg-primary ms-2 rounded-pill">{{ infrastructurePoints.length }}</span>
            </h5>            <div class="search-container mb-4 position-relative">
              <label for="pointSearch" class="form-label d-flex justify-content-between align-items-center search-label">
                <span><i class="fas fa-search me-2 text-primary"></i> Buscar infraestructura</span>
                <button class="btn btn-sm btn-link p-0 text-decoration-none advanced-search-toggle" data-bs-toggle="collapse" data-bs-target="#advancedSearch">
                  Avanzado <i class="fas fa-caret-down fs-6"></i>
                </button>
              </label>
              
              <div class="input-group search-input-group">
                <input type="text" class="form-control form-control-sm search-input" 
                  id="pointSearch" 
                  placeholder="Nombre, descripción..." 
                  v-model="searchQuery" 
                  @input="filterPoints"
                  :class="{'search-filters-active': searchQuery.trim() || searchFilters.typeId || searchFilters.zoneId}">
                <button v-if="searchQuery.trim()" 
                  class="btn btn-sm btn-outline-secondary clear-search-btn" 
                  @click="searchQuery = ''; filterPoints()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              
              <!-- Contador de resultados y botón para limpiar búsqueda -->              
              <div v-if="searchQuery.trim() || searchFilters.typeId || searchFilters.zoneId" class="search-results-summary d-flex justify-content-between align-items-center mb-3 px-2 py-2 bg-light rounded">
                <span class="search-results-counter">
                  <i class="fas fa-info-circle text-primary me-1"></i>
                  <strong>{{ filteredPoints.length }}</strong> resultado{{ filteredPoints.length !== 1 ? 's' : '' }}
                </span>
                <button class="btn btn-sm btn-outline-secondary btn-clear-search" @click="clearSearch">
                  <i class="fas fa-times"></i> Limpiar
                </button>
              </div>
              
              <div id="advancedSearch" class="collapse mt-3">
                <div class="advanced-search-panel card card-body py-3 px-3 bg-light border-0">
                  <h6 class="mb-2 text-primary fw-bold"><i class="fas fa-filter me-2"></i> Filtros avanzados</h6>                    <div class="mb-2">
                    <label class="form-label small mb-1 fw-medium">Tipo de infraestructura</label>
                    <select class="form-select form-select-sm" v-model="searchFilters.typeId" @change="filterPoints">
                      <option value="">Todos los tipos</option>
                      <option v-for="type in infrastructureTypes" :key="type.id" :value="type.id">
                        {{ getTypeIcon(type.id) === 'fa-bolt' ? '⚡' : 
                           getTypeIcon(type.id) === 'fa-box' ? '📦' : 
                           getTypeIcon(type.id) === 'fa-building' ? '🏢' : 
                           getTypeIcon(type.id) === 'fa-network-wired' ? '🔌' : '▪️' }} {{ type.name }}
                      </option>
                    </select>
                  </div>
                  <div class="mb-2">
                    <label class="form-label small mb-1 fw-medium">Zona</label>
                    <select class="form-select form-select-sm" v-model="searchFilters.zoneId" @change="filterPoints">
                      <option value="">Todas las zonas</option>
                      <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name || ('Zona ' + zone.id.substring(0,6)) }}</option>
                    </select>
                  </div>
                  <button class="btn btn-sm btn-primary w-100 mt-2" @click="clearSearch" v-if="searchFilters.typeId || searchFilters.zoneId">
                    <i class="fas fa-times"></i> Limpiar filtros
                  </button>
                </div>
              </div>
            </div><div class="zones-section mb-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label for="zoneFilter" class="form-label mb-0">
                  <i class="fas fa-map-marked-alt text-primary me-1"></i> Filtrar por zona:
                </label>
                <span class="badge bg-info rounded-pill">{{ zones.length }}</span>
              </div>
              <select id="zoneFilter" v-model="selectedZoneId" class="form-select form-select-sm mb-3">
                <option value="">Todas las zonas</option>
                <option v-for="zone in zones" :key="zone.id" :value="zone.id">
                  {{ zone.name || ('Zona ' + zone.id.substring(0,6)) }}
                </option>
              </select>              <!-- Lista de zonas compacta (colapsable) -->
              <div class="zones-list">
                <div class="section-header d-flex justify-content-between align-items-center mb-2" 
                     @click="toggleSection('zones')" role="button">
                  <h6 class="text-primary small fw-bold mb-0">
                    <i class="fas" :class="sectionCollapsed.zones ? 'fa-caret-right' : 'fa-caret-down'"></i>
                    <i class="fas fa-map-marked-alt ms-1 me-1"></i> Zonas disponibles
                  </h6>
                  <div>
                    <span class="badge bg-info rounded-pill me-1">{{ zones.length }}</span>
                    <button v-if="zones.length > 0" type="button" class="btn btn-xs btn-outline-primary" 
                            title="Añadir nueva zona" @click.stop="setEditMode('addZone')">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                <div v-show="!sectionCollapsed.zones" class="zones-compact" :class="{'section-collapsed': sectionCollapsed.zones}">
                  <div v-for="zone in zones" :key="zone.id" 
                       class="zone-item d-flex align-items-center mb-1 p-1 rounded"
                       :class="{'active': selectedZoneId === zone.id}"
                       @click="selectedZoneId = zone.id === selectedZoneId ? '' : zone.id">
                    <div class="zone-color-indicator" :style="{'background-color': zone.color || '#3b82f6'}"></div>
                    <div class="zone-content flex-grow-1 px-2">
                      <div class="zone-name-compact">{{ zone.name || ('Zona ' + zone.id.substring(0,6)) }}</div>
                    </div>
                    <div class="zone-actions-compact">
                      <button type="button" class="btn btn-icon" @click.stop="flyToZone(zone)" title="Ir a zona">
                        <i class="fas fa-location-arrow"></i>
                      </button>
                      <button type="button" class="btn btn-icon" @click.stop="editZone(zone)" title="Editar zona">
                        <i class="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="zones.length === 0" class="text-muted small p-2 text-center bg-light rounded">
                    <i class="fas fa-info-circle me-1"></i> No hay zonas definidas
                    <button class="btn btn-sm btn-outline-primary d-block w-100 mt-1" @click="setEditMode('addZone')">
                      <i class="fas fa-plus-circle me-1"></i> Crear zona
                    </button>
                  </div>
                </div>
              </div>
            </div>            <div v-for="type in infrastructureTypes" :key="type.id" class="mb-4 infrastructure-type-section">
              <div class="section-header d-flex justify-content-between align-items-center mb-2"
                   @click="toggleSection('type-' + type.id)" role="button">
                <h6 class="text-primary mb-0 d-flex align-items-center">
                  <i class="fas" :class="sectionCollapsed['type-' + type.id] ? 'fa-caret-right' : 'fa-caret-down'"></i>
                  <i :class="'fas ' + type.icon + ' ms-1 me-1'"></i> 
                  {{ type.name }}
                </h6>
                <span class="badge bg-secondary rounded-pill type-badge">
                  {{ filteredPointsByType(type.id).length }}
                </span>
              </div>
              <ul class="list-group list-group-flush shadow-sm" v-show="!sectionCollapsed['type-' + type.id]">
                <li v-for="point in filteredPointsByType(type.id)" :key="point.id" 
                    class="list-group-item d-flex justify-content-between align-items-center py-2"
                    :class="{'search-result': searchQuery.trim() && filteredPoints.includes(point)}">
                  <div class="d-flex align-items-center point-name-container">
                    <i :class="'fas ' + getTypeIcon(point.type_id)" class="text-primary me-2 point-icon"></i>
                    <span class="point-name">{{ point.name || (type.name + ' ' + point.id.substring(0,6)) }}</span>
                    <span v-if="notes[point.id] && notes[point.id].length > 0" 
                          class="note-indicator-inline ms-2" 
                          :title="`${notes[point.id].length} nota(s)`"></span>
                  </div>
                  <div class="point-actions">
                    <button class="btn btn-xs btn-outline-primary" @click="flyToPoint(point)" title="Ir a ubicación">
                      <i class="fas fa-location-arrow"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-info ms-1" @click="openNotesModal(point)" title="Ver notas">
                      <i class="fas fa-comment-dots"></i>
                      <span v-if="notes[point.id] && notes[point.id].length > 0" class="notes-badge">
                        {{ notes[point.id].length }}
                      </span>
                    </button>
                  </div>
                </li>
                <li v-if="filteredPointsByType(type.id).length === 0" class="list-group-item text-muted small py-2 text-center empty-type-message">
                  <i class="fas fa-info-circle me-1"></i> No hay elementos
                </li>
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
      <!-- Modal para editar conexión -->
      <div class="modal fade" id="editConnectionModal" tabindex="-1" aria-labelledby="editConnectionModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editConnectionModalLabel">Editar Conexión</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" v-if="editingConnection">
              <div class="form-group mb-3">
                <label for="editCableType">Tipo de Cable:</label>
                <select id="editCableType" v-model="editConnectionData.cableType" class="form-select">
                  <option value="fiber">Fibra Óptica</option>
                  <option value="coaxial">Coaxial</option>
                  <option value="twisted">Par Trenzado</option>
                </select>
              </div>
              <div class="form-group mb-3">
                <label for="editCableColor">Color (para visualización):</label>
                <input type="color" id="editCableColor" v-model="editConnectionData.color" class="form-control form-control-sm">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="updateConnection">Guardar Cambios</button>
            </div>
          </div>
        </div>
      </div>      <!-- Modal para notas/comentarios -->      
      <div class="modal fade" id="notesModal" tabindex="-1" aria-labelledby="notesModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content notes-modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="notesModalLabel">
                <i class="fas fa-comment-dots me-2 text-primary"></i> Notas y Comentarios
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="async (e) => { 
                const canClose = await confirmCloseNotesModal();
                if (!canClose) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }"></button>
            </div>
            <div class="modal-body notes-modal-body">
              <div v-if="isLoadingNotes" class="text-center py-3">
                <div class="spinner-border text-primary spinner-border-sm" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <span class="ms-2">Cargando notas...</span>
              </div>              
              <div v-else>                
                <div v-if="notes[notePointId] && notes[notePointId].length" class="notes-container">
                  <div v-for="note in notes[notePointId]" :key="note.id" class="note-item">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="note-author">
                        <i class="fas fa-user-circle me-1"></i>
                        {{ note.author }}
                        <span class="note-date" :title="new Date(note.date).toLocaleString()">
                          {{ formatRelativeTime(note.date) }}
                        </span>
                      </div>
                      <div class="note-actions">
                        <button 
                          v-if="user && (note.created_by === user.id || userRole === 'admin')" 
                          class="btn btn-icon text-primary" 
                          @click="editNote(note)" 
                          title="Editar nota"
                        >
                          <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button 
                          v-if="user && (note.created_by === user.id || userRole === 'admin')" 
                          class="btn btn-icon text-danger" 
                          @click="deleteNote(note)" 
                          title="Eliminar nota"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    <div class="note-text">{{ note.text }}</div>
                  </div>
                </div>
                <div v-else class="empty-notes-message">
                  <i class="fas fa-info-circle me-1"></i> Sin notas aún.
                </div>
                <div class="note-form">
                  <textarea v-model="newNoteText" class="form-control note-textarea" rows="3" placeholder="Escribe una nota..."></textarea>
                  <button class="btn btn-primary w-100 mt-2 add-note-btn" @click="addNote" :disabled="!newNoteText.trim()">
                    <i class="fas fa-paper-plane me-1"></i> Agregar Nota
                  </button>
                </div>
              </div>
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
import '../assets/search-results.css';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

// Referencias and estado básico del mapa
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
const darkTileUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const lightTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileUrl = computed(() => isDarkMode.value ? darkTileUrl : lightTileUrl);
const mapAttribution = computed(() => isDarkMode.value 
  ? '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
);

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

// Computed para determinar qué puntos mostrar en el mapa
const displayPoints = computed(() => {
  // Si hay filtros o búsqueda activa, mostrar solo los puntos filtrados
  if (searchQuery.value.trim() || searchFilters.value.typeId || searchFilters.value.zoneId) {
    return filteredPoints.value;
  }
  
  // Si no hay filtros activos pero hay una zona seleccionada, filtrar por zona
  if (selectedZoneId.value) {
    return infrastructurePoints.value.filter(p => {
      // Si el punto tiene zona_id asignada, verificar si coincide
      if (p.zone_id) return p.zone_id === selectedZoneId.value;
      
      // Si no, verificar si está dentro del polígono de la zona
      const zone = zones.value.find(z => z.id === selectedZoneId.value);
      if (!zone || !zone.polygon) return false;
      return isPointInPolygon([p.latitude, p.longitude], zone.polygon);
    });
  }
  
  // Por defecto, mostrar todos los puntos
  return infrastructurePoints.value;
});

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
const notes = ref({});  // Asegurarnos de que notes está inicializado

// Estado para seguir el punto seleccionado
const selectedPoint = ref(null);

// Estado para manejar secciones colapsables
const sectionCollapsed = ref({
  zones: false
});

// Función para alternar el estado de colapso de una sección
function toggleSection(sectionId) {
  if (sectionCollapsed.value[sectionId] === undefined) {
    sectionCollapsed.value[sectionId] = false;
  }
  sectionCollapsed.value[sectionId] = !sectionCollapsed.value[sectionId];
}

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
  if (measuringMode.value) {
    measuringPoints.value.push({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    return;
  }
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
      .insert([newConn]);
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

// Estado para edición de conexión
const editingConnection = ref(null);
const editConnectionData = ref({ cableType: '', color: '' });

function editConnection(connection) {
  editingConnection.value = connection;
  editConnectionData.value = {
    cableType: connection.cable_type,
    color: connection.color || '#3388ff'
  };
  const modal = new bootstrap.Modal(document.getElementById('editConnectionModal'));
  modal.show();
}

async function updateConnection() {
  if (!editingConnection.value) return;
  const updated = {
    cable_type: editConnectionData.value.cableType,
    color: editConnectionData.value.color
  };
  const { error } = await supabase
    .from('cable_connections')
    .update(updated)
    .eq('id', editingConnection.value.id);
  if (error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message, confirmButtonColor: '#d33' });
    return;
  }
  // Actualizar local
  const idx = cableConnections.value.findIndex(c => c.id === editingConnection.value.id);
  if (idx !== -1) {
    cableConnections.value[idx] = {
      ...cableConnections.value[idx],
      ...updated
    };
  }
  Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'Conexión actualizada correctamente.', confirmButtonColor: '#3085d6', timer: 1800, timerProgressBar: true });
  editingConnection.value = null;
  const modal = bootstrap.Modal.getInstance(document.getElementById('editConnectionModal'));
  if (modal) modal.hide();
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
  
  // Detectar si estamos en modo oscuro
  const isDark = document.body.classList.contains('dark-mode');
  
  // Determinar si el punto es parte de los resultados de búsqueda
  const isSearchResult = searchQuery.value.trim() || searchFilters.value.typeId || searchFilters.value.zoneId;
  
  // Color según modo oscuro/claro y si es un resultado de búsqueda
  let iconColor = isDark ? '#60a5fa' : '#2563eb';
  
  // Si hay búsqueda activa, destacar los puntos filtrados
  if (isSearchResult && filteredPoints.value.some(p => p.id === point.id)) {
    iconColor = isDark ? '#34d399' : '#10b981'; // Verde para resultados de búsqueda
  }
  
  // Verificar si el punto tiene notas
  const hasNotes = notes.value[point.id] && notes.value[point.id].length > 0;
  
  // Si el punto está seleccionado, agregar un halo de selección
  const isSelected = selectedPoint.value && selectedPoint.value.id === point.id;
    // Crear un icono personalizado con Font Awesome
  // Si tiene notas, agregar un indicador visual
  const iconHtml = hasNotes 
    ? `<div class="marker-container ${isSelected ? 'marker-selected' : ''}">
         <div class="marker-icon-wrapper">
           <i class="fas ${icon}" style="color: ${iconColor};"></i>
         </div>
         <span class="note-indicator" title="${notes.value[point.id].length} nota(s)"></span>
       </div>`
    : `<div class="marker-container ${isSelected ? 'marker-selected' : ''}">
         <div class="marker-icon-wrapper">
           <i class="fas ${icon}" style="color: ${iconColor};"></i>
         </div>
       </div>`;
  
  // Verificar que window.L esté disponible
  if (typeof window.L === 'undefined' || !window.L.divIcon) {
    console.error('Leaflet no está disponible o no se ha inicializado correctamente');
    // Crear un objeto de reemplazo para evitar errores
    return { options: { iconSize: [36, 36], iconAnchor: [18, 18] } };
  }
  
  return window.L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
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

// Modificar onCableClick para agregar botón de editar
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
    showDenyButton: true,
    denyButtonText: 'Editar',
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#3085d6',
    showCancelButton: true,
    cancelButtonText: 'Eliminar',
    cancelButtonColor: '#d33'
  }).then((result) => {
    if (result.isDenied) {
      editConnection(connection);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
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

// Estado para ubicación actual
const userLocation = ref(null);
const showUserLocation = ref(false);

function goToUserLocation() {
  if (!navigator.geolocation) {
    Swal.fire({ icon: 'warning', title: 'No soportado', text: 'El navegador no soporta geolocalización.' });
    return;
  }
  Swal.fire({ title: 'Buscando ubicación...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = [pos.coords.latitude, pos.coords.longitude];
      showUserLocation.value = true;
      if (mapRef.value && mapRef.value.leafletObject) {
        mapRef.value.leafletObject.flyTo(userLocation.value, 17, { duration: 1 });
      }
      Swal.close();
    },
    (err) => {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener la ubicación.' });
    },
    { enableHighAccuracy: true }
  );
}

// Estado y métodos para notas/comentarios
const newNoteText = ref('');
const notePointId = ref(null);
const isLoadingNotes = ref(false);

// Función para actualizar los íconos del mapa cuando se añaden o eliminan notas
function updateMapIcons() {
  // Forzar una actualización de los marcadores para mostrar indicadores de notas
  if (mapRef.value && mapRef.value.leafletObject) {
    // El timeout es necesario para asegurar que Vue actualice los datos reactivos primero
    setTimeout(() => {
      mapRef.value.leafletObject.invalidateSize({ pan: false });
    }, 100);
  }
}

// Función para cargar todas las notas al iniciar
async function loadAllNotes() {
  try {
    console.log('Cargando todas las notas...');
    
    const { data, error } = await supabase
      .from('point_notes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      // Manejar diferentes tipos de errores
      if (error.code === '42P01') {
        console.warn('La tabla point_notes no existe aún:', error);
        // No mostrar error al usuario, porque puede ser parte de la configuración inicial
      } else {
        console.error('Error al cargar notas:', error);
        
        // Solo mostrar alerta en errores críticos (no de tabla inexistente)
        if (error.code !== '42P01') {
          Swal.fire({
            icon: 'warning',
            title: 'Notas no disponibles',
            text: 'No se pudieron cargar las notas desde la base de datos.',
            timer: 3000,
            timerProgressBar: true
          });
        }
      }
      return;
    }
    
    if (data && data.length > 0) {
      // Organizar las notas por point_id
      const notesByPointId = {};
      data.forEach(note => {
        if (!notesByPointId[note.point_id]) {
          notesByPointId[note.point_id] = [];
        }
        notesByPointId[note.point_id].push(note);
      });
      
      notes.value = notesByPointId;
      console.log('Notas cargadas correctamente:', Object.keys(notesByPointId).length, 'puntos con notas');
      
      // Actualizar íconos del mapa después de cargar las notas
      updateMapIcons();
    } else {
      console.log('No se encontraron notas en la base de datos');
    }
  } catch (error) {
    console.error('Error inesperado al cargar las notas:', error);
    
    // No mostrar error al usuario en la carga inicial para mejor UX
    // a menos que sea un error crítico
    if (error.message && !error.message.includes('does not exist')) {
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar notas',
        text: 'Ocurrió un problema al cargar las notas. Algunas funcionalidades pueden no estar disponibles.',
        timer: 3000,
        timerProgressBar: true
      });
    }
  }
}

async function openNotesModal(point) {
  notePointId.value = point.id;
  newNoteText.value = '';
  
  // Mostrar modal inmediatamente
  const modalElement = document.getElementById('notesModal');
  const modal = new bootstrap.Modal(modalElement);
  
  // Añadir evento para confirmar cierre si hay texto sin guardar
  modalElement.addEventListener('hide.bs.modal', async function (event) {
    if (newNoteText.value.trim()) {
      const canClose = await confirmCloseNotesModal();
      if (!canClose) {
        event.preventDefault();
      }
    }
  }, { once: true }); // usar once: true para que se ejecute una sola vez
  
  modal.show();
  
  // Cargar notas específicas para este punto
  isLoadingNotes.value = true;
  try {
    console.log(`Cargando notas para el punto ${point.id}...`);
    
    const { data, error } = await supabase
      .from('point_notes')
      .select('*')
      .eq('point_id', point.id)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error al cargar notas del punto:', error);
      
      // Determinar el tipo de error
      if (error.code === '42P01') {
        console.warn('La tabla point_notes no existe aún:', error);
        // Inicializar con array vacío
        notes.value[point.id] = [];
        
        // Sugerencia para crear la tabla si el usuario es administrador
        if (userRole.value === 'admin') {
          setTimeout(() => {
            Swal.fire({
              icon: 'info',
              title: 'Tabla de notas no existe',
              text: 'La tabla para guardar notas no existe aún. Ejecuta el script SQL proporcionado para crearla.',
              confirmButtonText: 'Entendido'
            });
          }, 500);
        }
      } else {
        // Mostrar mensaje de error para otros tipos de error
        setTimeout(() => {
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar notas',
            text: 'No se pudieron cargar las notas para este punto.',
            timer: 3000,
            timerProgressBar: true
          });
        }, 500);
        
        // Inicializar con array vacío si no existía
        if (!notes.value[point.id]) {
          notes.value[point.id] = [];
        }
      }
      return;
    }
    
    // Actualizar las notas solo para este punto
    if (data) {
      notes.value[point.id] = data;
      console.log(`${data.length} notas cargadas para el punto ${point.id}`);
    } else {
      // Si no hay notas, inicializar con un array vacío
      notes.value[point.id] = [];
      console.log(`No hay notas para el punto ${point.id}`);
    }
  } catch (error) {
    console.error('Error inesperado al cargar notas del punto:', error);
    
    // Mostrar mensaje de error genérico
    setTimeout(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un problema al cargar las notas. Por favor, intenta nuevamente.',
        timer: 3000,
        timerProgressBar: true
      });
    }, 500);
    
    // Inicializar con array vacío si no existía
    if (!notes.value[point.id]) {
      notes.value[point.id] = [];
    }
  } finally {
    isLoadingNotes.value = false;
  }
}

async function addNote() {
  if (!notePointId.value || !newNoteText.value.trim()) {
    // Mostrar mensaje de error si el texto está vacío
    if (!newNoteText.value.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto vacío',
        text: 'Por favor, escribe algún contenido para la nota.',
        timer: 2000,
        timerProgressBar: true
      });
    }
    return;
  }
  
  if (!user.value) {
    Swal.fire({
      icon: 'error',
      title: 'No autenticado',
      text: 'Debes iniciar sesión para agregar notas.',
      timer: 3000,
      timerProgressBar: true
    });
    return;
  }
  
  // Mostrar indicador de carga
  Swal.fire({
    title: 'Guardando nota...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
  
  try {
    // Crear objeto de nota para guardar en Supabase
    const newNote = {
      id: uuidv4(),
      point_id: notePointId.value,
      text: newNoteText.value.trim(),
      author: user.value.email || 'Anónimo',
      date: new Date().toISOString(),
      created_by: user.value.id,
      created_at: new Date().toISOString()
    };
    
    // Guardar en Supabase
    const { data, error } = await supabase
      .from('point_notes')
      .insert([newNote]);
    
    if (error) {
      console.error('Error al guardar nota en Supabase:', error);
      
      // Cerrar indicador de carga
      Swal.close();
      
      // Determinar el tipo de error
      let errorMessage = 'No se pudo guardar la nota en la base de datos.';
      
      if (error.code === '23503') {
        errorMessage = 'El punto de infraestructura ya no existe en la base de datos.';
      } else if (error.code === '23505') {
        errorMessage = 'Ya existe una nota con este identificador.';
      } else if (error.code === '42P01') {
        errorMessage = 'La tabla de notas no existe. Por favor, ejecuta el script SQL para crearla.';
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'No tienes permisos suficientes para agregar notas.';
      }
      
      // Mostrar mensaje de error específico
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: errorMessage,
        confirmButtonColor: '#d33'
      });
      
      return;
    }
    
    // Actualizar la vista local
    if (!notes.value[notePointId.value]) notes.value[notePointId.value] = [];
    notes.value[notePointId.value].unshift(newNote);
    
    // Cerrar indicador de carga y mostrar confirmación
    Swal.fire({
      icon: 'success',
      title: '¡Nota guardada!',
      text: 'La nota se ha guardado correctamente en la base de datos.',
      timer: 2000,
      timerProgressBar: true
    });
    
    console.log('Nota guardada correctamente en Supabase');
    
    // Limpiar el campo de texto
    newNoteText.value = '';
    
    // Actualizar íconos del mapa
    updateMapIcons();
  } catch (error) {
    console.error('Error general al guardar nota:', error);
    
    // Cerrar indicador de carga
    Swal.close();
    
    Swal.fire({
      icon: 'error',
      title: 'Error inesperado',
      text: 'Ocurrió un problema al guardar la nota. Por favor, intenta nuevamente.',
      confirmButtonColor: '#d33'
    });
  }
}

async function deleteNote(note) {
  try {
    // Confirmar eliminación
    const result = await Swal.fire({
      title: '¿Eliminar nota?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    // Eliminar de Supabase
    const { error } = await supabase
      .from('point_notes')
      .delete()
      .eq('id', note.id);
    
    if (error) {
      console.error('Error al eliminar nota de Supabase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la nota de la base de datos.',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
    
    // Actualizar vista local
    if (notes.value[notePointId.value]) {
      notes.value[notePointId.value] = notes.value[notePointId.value].filter(n => n.id !== note.id);
    }
    
    console.log('Nota eliminada correctamente');
    
    // Actualizar íconos del mapa
    updateMapIcons();
  } catch (error) {
    console.error('Error general al eliminar nota:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un problema al intentar eliminar la nota.',
     
      timer: 3000,
      timerProgressBar: true
    });
  }
}

// Función para editar una nota existente
// La función editNote ha sido consolidada y ahora existe solo en la declaración más abajo en el código
// Se eliminó esta versión duplicada para resolver el error "Identifier 'editNote' has already been declared"

// Estado para edición de notas
const editingNoteId = ref(null);
const editNoteText = ref('');

async function editNote(note) {
  // Establecer el modo de edición
  editingNoteId.value = note.id;
  editNoteText.value = note.text;
  
  // Mostrar SweetAlert para editar
  const { value: newText, isConfirmed } = await Swal.fire({
    title: 'Editar nota',
    input: 'textarea',
    inputLabel: 'Texto de la nota',
    inputValue: note.text,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'El texto de la nota no puede estar vacío';
     
      }
    }
  });
  // Si el usuario cancela la edición, salir
  if (!isConfirmed || !newText) {
    editingNoteId.value = null;
    editNoteText.value = '';
    return;
  }
  
  // Verificar permisos (solo el creador o admin pueden editar)
  if (note.created_by !== user.value.id && userRole.value !== 'admin') {
    Swal.fire({
      icon: 'error',
      title: 'Permiso denegado',
      text: 'Solo puedes editar tus propias notas.',
      timer: 3000,
      timerProgressBar: true
    });
    editingNoteId.value = null;
    editNoteText.value = '';
    return;
  }
  
  try {
    // Actualizar en Supabase
    const { error } = await supabase
      .from('point_notes')
      .update({ text: newText.trim() })
      .eq('id', note.id);
    
    if (error) {
      console.error('Error al actualizar nota en Supabase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la nota en la base de datos.',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }
    
    // Actualizar en la vista local
    if (notes.value[notePointId.value]) {
      const noteIndex = notes.value[notePointId.value].findIndex(n => n.id === note.id);
      if (noteIndex !== -1) {
        notes.value[notePointId.value][noteIndex].text = newText.trim();
      }
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Nota actualizada',
      text: 'La nota se ha actualizado correctamente.',
      timer: 2000,
      timerProgressBar: true
    });
  } catch (error) {
    console.error('Error general al editar nota:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un problema al intentar editar la nota.',
      timer: 3000,
      timerProgressBar: true
    });
  } finally {
    // Limpiar estado de edición
    editingNoteId.value = null;
    editNoteText.value = '';
  }
}

// Estado y métodos para medición de distancias/rutas
const measuringMode = ref(false);
const measuringPoints = ref([]);



const measuringDistance = computed(() => {
  if (measuringPoints.value.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < measuringPoints.value.length; i++) {
    total += calculateDistance(measuringPoints.value[i-1], measuringPoints.value[i]);
  }
  return total;
});

function toggleMeasuringMode() {
  measuringMode.value = !measuringMode.value;
  measuringPoints.value = [];
  if (measuringMode.value) {
    currentEditMode.value = 'view'; // Forzar modo 'view' para que la medición funcione
  }
}

function addMeasuringPoint(point) {
  if (measuringMode.value) {
    measuringPoints.value.push(point);
  }
}

function clearMeasuring() {
  measuringPoints.value = [];
}

// Cargar datos al montar el componente
async function loadMapData() {
  console.log('Iniciando carga de datos del mapa...');
  
  try {
    // Inicializar variables con valores por defecto en caso de error
    notes.value = {};
    
    // Verificar si existen las tablas necesarias
    try {
      // Cargar tipos de infraestructura
      const { data: typesData, error: typesError } = await supabase
        .from('infrastructure_types')
        .select('*');
      
      if (typesError) {
        console.warn('Tabla infrastructure_types no encontrada:', typesError);
        // Asegurar que se usen valores por defecto
        console.log('Usando tipos de infraestructura predefinidos');
      } else if (typesData && typesData.length > 0) {
        infrastructureTypes.value = typesData;
        console.log('Tipos de infraestructura cargados:', typesData.length);
      } else {
        console.log('No se encontraron tipos de infraestructura, usando predefinidos');
      }
    
      // Si la primera tabla existe, intentar cargar el resto
      // Cargar puntos de infraestructura
      const { data: pointsData, error: pointsError } = await supabase
        .from('infrastructure_points')
        .select('*');
      
      if (pointsError) {
        console.warn('Error al cargar puntos:', pointsError);
      } else if (pointsData) {
        infrastructurePoints.value = pointsData;
        console.log('Puntos de infraestructura cargados:', pointsData.length);
        
        // Si no hay puntos, agregar algunos de ejemplo para pruebas
        if (pointsData.length === 0) {
          console.log('No hay puntos en la base de datos, creando ejemplos para pruebas');
          createSamplePoints();
        }
      }
        
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
      
      // Cargar notas de los puntos
      await loadAllNotes();
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
  // Si hay una búsqueda activa, filtramos los puntos ya filtrados por tipo
  if (searchQuery.value.trim() || searchFilters.value.typeId || searchFilters.value.zoneId) {
    return filteredPoints.value.filter(p => p.type_id === typeId);
  }
  
  // Si hay un filtro de zona pero no hay búsqueda
  if (selectedZoneId.value) {
    return infrastructurePoints.value.filter(p => {
      const matchesType = p.type_id === typeId;
      // Si los puntos tienen zona_id:
      if (p.zone_id) return matchesType && p.zone_id === selectedZoneId.value;
      // Si no tiene ID de zona, verificamos si está dentro del polígono de la zona
      const zone = zones.value.find(z => z.id === selectedZoneId.value);
      if (!zone || !zone.polygon) return false;
      // Simple point-in-polygon (solo si hay polígono)
      return matchesType && isPointInPolygon([p.latitude, p.longitude], zone.polygon);
    });
  }
  
  // Si no hay filtros activos, devolver todos los puntos del tipo indicado
  return infrastructurePoints.value.filter(p => p.type_id === typeId);
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

// Función para centrar el mapa en una zona
function flyToZone(zone) {
  if (!zone || !zone.polygon || zone.polygon.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Zona sin coordenadas',
      text: 'Esta zona no tiene coordenadas definidas.',
      timer: 2000,
      timerProgressBar: true
    });
    return;
  }

  // Calcular el centro aproximado de la zona
  let sumLat = 0;
  let sumLng = 0;
  for (const point of zone.polygon) {
    sumLat += point[0];
    sumLng += point[1];
  }
  const centerLat = sumLat / zone.polygon.length;
  const centerLng = sumLng / zone.polygon.length;

  // Encontrar los límites de la zona para determinar el zoom
  let minLat = Number.MAX_VALUE;
  let maxLat = -Number.MAX_VALUE;
  let minLng = Number.MAX_VALUE;
  let maxLng = -Number.MAX_VALUE;

  for (const point of zone.polygon) {
    minLat = Math.min(minLat, point[0]);
    maxLat = Math.max(maxLat, point[0]);
    minLng = Math.min(minLng, point[1]);
    maxLng = Math.max(maxLng, point[1]);
  }

  // Crear un objeto LatLngBounds para determinar el zoom adecuado
  if (mapRef.value && mapRef.value.leafletObject) {
    const bounds = window.L.latLngBounds([
      [minLat, minLng],
      [maxLat, maxLng]
    ]);
    
    // Animar el vuelo a la zona con padding para que toda la zona sea visible
    mapRef.value.leafletObject.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.5,
      easeLinearity: 0.25
    });
    
    // Mostrar notificación
    Swal.fire({
      icon: 'info',
      title: 'Navegando a zona',
      text: `Mostrando: ${zone.name || 'Zona sin nombre'}`,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false
    });
  }
}

// Función para finalizar y guardar la zona
async function finishZone() {
  if (!zoneInProgress.value || zoneInProgress.value.polygon.length < 3) {
    Swal.fire({ icon: 'warning', title: 'Zona incompleta', text: 'Debes seleccionar al menos 3 puntos.', confirmButtonColor: '#d33' });
    return;
  }
  // Mostrar modal para nombre y color
  const { value: formValues } = await Swal.fire({
    title: 'Configurar zona',
    html:
      '<input id="swal-zone-name" class="swal2-input" placeholder="Nombre de la zona">' +
      '<label style="display:block;text-align:left;margin:8px 0 2px 2px;font-size:13px;">Color de la zona:</label>' +
      '<input id="swal-zone-color" type="color" class="swal2-input" value="#3388ff" style="width:60px;height:34px;padding:0;border:none;">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const name = document.getElementById('swal-zone-name').value;
      const color = document.getElementById('swal-zone-color').value;
      if (!name) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      return { name, color };
    }
  });
  if (formValues) {
    const zone = {
      id: uuidv4(),
      name: formValues.name,
      polygon: zoneInProgress.value.polygon,
      color: formValues.color || '#3388ff',
      created_at: new Date()
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
}

// Función para cancelar la creación de zona
function cancelZone() {
  zoneInProgress.value = null;
}

// --- Agregar función para editar zona ---
async function editZone(zone) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar zona',
    html:
      `<input id="swal-edit-zone-name" class="swal2-input" placeholder="Nombre de la zona" value="${zone.name || ''}">` +
      '<label style="display:block;text-align:left;margin:8px 0 2px 2px;font-size:13px;">Color de la zona:</label>' +
      `<input id="swal-edit-zone-color" type="color" class="swal2-input" value="${zone.color || '#3388ff'}" style="width:60px;height:34px;padding:0;border:none;">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const name = document.getElementById('swal-edit-zone-name').value;
      const color = document.getElementById('swal-edit-zone-color').value;
      if (!name) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      return { name, color };
    }
  });
  if (formValues) {
    // Actualizar en Supabase
    const { error } = await supabase.from('zones').update({ name: formValues.name, color: formValues.color }).eq('id', zone.id);
    if (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, confirmButtonColor: '#d33' });
    } else {
      // Actualizar en el estado local
      const idx = zones.value.findIndex(z => z.id === zone.id);
      if (idx !== -1) {
        zones.value[idx].name = formValues.name;
        zones.value[idx].color = formValues.color;
      }
      Swal.fire({ icon: 'success', title: 'Zona actualizada', text: 'Los cambios se guardaron correctamente.', confirmButtonColor: '#3085d6', timer: 1800, timerProgressBar: true });
    }
  }
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
  
  // Inicializar estado de secciones colapsables para tipos de infraestructura
  infrastructureTypes.value.forEach(type => {
    sectionCollapsed.value['type-' + type.id] = false;
  });
  
  // Cargar datos del mapa
  loadMapData().then(() => {
    // Inicializar los filteredPoints con todos los puntos cuando cargue
    filteredPoints.value = [...infrastructurePoints.value];
  });
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
  // Invertir el estado current
  isDarkMode.value = !isDarkMode.value;
  
  // Emitir evento para cambiar el estado global del modo oscuro
  const event = new CustomEvent('toggle-dark-mode');
  document.dispatchEvent(event);
  
  console.log('Modo oscuro cambiado desde mapa a:', isDarkMode.value);
  
  // Forzar actualización del mapa para aplicar los cambios de estilo
  setTimeout(() => {
    if (mapRef.value && mapRef.value.leafletObject) {
      mapRef.value.leafletObject.invalidateSize();
      // Actualizar contraste del mapa para mejor visualización en modo oscuro
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer) {
        if (isDarkMode.value) {
          mapContainer.style.filter = 'contrast(1.1) brightness(1.05)';
        } else {
          mapContainer.style.filter = '';
        }
      }
    }
  }, 100);
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

// Estado para búsqueda de puntos
const searchQuery = ref('');
const searchFilters = ref({
  typeId: '',
  zoneId: ''
});
const filteredPoints = ref([]);

// Función para filtrar puntos según búsqueda
function filterPoints() {
  const query = searchQuery.value.toLowerCase().trim();
  const { typeId, zoneId } = searchFilters.value;
  
  // Si no hay criterios de búsqueda, mostrar todos los puntos
  if (!query && !typeId && !zoneId) {
    filteredPoints.value = [...infrastructurePoints.value];
    return;
  }
  
  // Filtrar puntos según los criterios
  filteredPoints.value = infrastructurePoints.value.filter(point => {
    // Filtrado básico por nombre o descripción
    const matchesQuery = !query || 
      point.name?.toLowerCase().includes(query) || 
      point.description?.toLowerCase().includes(query);
    
    // Filtrado por tipo de infraestructura
    const matchesType = !typeId || point.type_id === typeId;
    
    // Filtrado por zona - primero verificamos si el punto tiene un ID de zona asignado
    let matchesZone = !zoneId;
    
    if (zoneId && !matchesZone) {
      // Si el punto tiene un ID de zona, comprobamos si coincide
      if (point.zone_id) {
        matchesZone = point.zone_id === zoneId;
      } else {
        // Si no tiene ID de zona, verificamos si está dentro del polígono de la zona
        const zone = zones.value.find(z => z.id === zoneId);
        if (zone && zone.polygon && zone.polygon.length > 2) {
          matchesZone = isPointInPolygon([point.latitude, point.longitude], zone.polygon);
        }
      }
    }
    
    return matchesQuery && matchesType && matchesZone;
  });
  
  // Si hay resultados y es una búsqueda específica, centrar el mapa en el primer resultado
  if (filteredPoints.value.length > 0 && (query || typeId || zoneId)) {
    const firstPoint = filteredPoints.value[0];
    if (mapRef.value && mapRef.value.leafletObject) {
      mapRef.value.leafletObject.setView([firstPoint.latitude, firstPoint.longitude], 15);
    }
  }
}

// Función para limpiar la búsqueda y filtros
function clearSearch() {
  searchQuery.value = '';
  searchFilters.value = {
    typeId: '',
    zoneId: ''
  };
  filterPoints();
}

// Función para formatear fechas en formato relativo (ej: "hace 2 días")
function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 60) {
    return 'hace un momento';
  } else if (diffMin < 60) {
    return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  } else if (diffHour < 24) {
    return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
  } else if (diffDay < 30) {
    return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
  } else if (diffMonth < 12) {
    return `hace ${diffMonth} mes${diffMonth !== 1 ? 'es' : ''}`;
  } else {
    return `hace ${diffYear} año${diffYear !== 1 ? 's' : ''}`;
  }
}

// Función para confirmar cierre del modal de notas si hay texto sin guardar
function confirmCloseNotesModal() {
  // Si hay texto sin guardar, mostrar confirmación
  if (newNoteText.value.trim()) {
    return Swal.fire({
      title: '¿Cerrar sin guardar?',
      text: 'Tienes texto sin guardar. ¿Estás seguro de que quieres cerrar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Cerrar sin guardar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        newNoteText.value = '';
        return true;
      }
      return false;
    });
  }
  return Promise.resolve(true); // Si no hay texto, cerrar directamente
}

// Función para crear puntos de ejemplo para pruebas
function createSamplePoints() {
  console.log('Creando puntos de ejemplo para pruebas');
  
  // Centrado en El Salvador
  const centerLat = 13.794185;
  const centerLng = -88.89653;
  
  // Crear algunos puntos de prueba
  const samplePoints = [
    {
      id: '1111-1111-1111-1111',
      type_id: 1, // Poste
      latitude: centerLat + 0.01,
      longitude: centerLng + 0.01,
      name: 'Poste de Prueba 1',
      description: 'Punto de prueba para visualización',
      created_at: new Date(),
      created_by: 'system',
      properties: {}
    },
    {
      id: '2222-2222-2222-2222',
      type_id: 2, // Mufa
      latitude: centerLat - 0.01,
      longitude: centerLng - 0.01,
      name: 'Mufa de Prueba 1',
      description: 'Punto de prueba para visualización',
      created_at: new Date(),
      created_by: 'system',
      properties: {}
    },
    {
      id: '3333-3333-3333-3333',
      type_id: 3, // Central
      latitude: centerLat + 0.02,
      longitude: centerLng - 0.02,
      name: 'Central de Prueba',
      description: 'Punto de prueba para visualización',
      created_at: new Date(),
      created_by: 'system',
      properties: {}
    },
    {
      id: '4444-4444-4444-4444',
      type_id: 4, // Terminal
      latitude: centerLat - 0.02,
      longitude: centerLng + 0.02,
      name: 'Terminal de Prueba',
      description: 'Punto de prueba para visualización',
      created_at: new Date(),
      created_by: 'system',
      properties: {}
    }
  ];
  
  // Agregar los puntos de prueba al array local
  infrastructurePoints.value.push(...samplePoints);
  
  // Crear una conexión de prueba
  const sampleConnection = {
    id: '5555-5555-5555-5555',
    start_point_id: '1111-1111-1111-1111',
    end_point_id: '2222-2222-2222-2222',
    cable_type: 'fiber',
    color: '#3388ff',
    distance: 2.5,
    created_at: new Date(),
    created_by: 'system'
  };
  
  cableConnections.value.push(sampleConnection);
  
  console.log('Se han creado puntos y conexiones de ejemplo para pruebas');
  
  // Añadir algunas notas de ejemplo
  notes.value = {
    '1111-1111-1111-1111': [
      {
        id: 'note-1',
        text: 'Este es un poste de prueba para verificar la visualización en el mapa',
        author: 'Sistema',
        date: new Date(),
        created_by: 'system'
      }
    ]
  };
  
  console.log('Se han creado notas de ejemplo');
}
</script>

<style scoped>
.map-container {
  height: calc(90vh - 100px);
  width: 100%;
  margin-top: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to right, #ffffff, #f0f7ff);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
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
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
  padding: 16px;
  font-size: 14px;
  min-width: 220px;
  transition: all 0.3s ease;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.map-popup h5 {
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #2563eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-popup h5::before {
  content: '';
  display: block;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #2563eb, #60a5fa);
  border-radius: 2px;
}

.map-popup p {
  margin-bottom: 10px;
  line-height: 1.4;
}

.popup-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: space-between;
}

/* Enhance popup buttons */
.popup-actions .btn {
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.popup-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

.btn-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.btn-group .btn {
  margin: 0;
  border-right: 1px solid rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  transition: all 0.2s ease;
}

.btn-group .btn:last-child {
  border-right: none;
}

.btn-group .btn i {
  font-size: 15px;
  transition: transform 0.2s ease;
}

.btn-group .btn:hover i {
  transform: scale(1.15);
}

.btn-sm {
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
}

.btn-sm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

.btn-sm:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

:global(.leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
  overflow: hidden;
}

:global(.leaflet-popup-tip) {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

:global(body.dark-mode .leaflet-popup-content-wrapper),
:global(body.dark-mode .leaflet-popup-tip) {
  background-color: #1e293b;
  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
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
  transform: scale(1);
}

.custom-div-icon i:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
}

.marker-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.marker-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
  transition: all 0.2s ease;
  transform-origin: center;
}

.marker-icon-wrapper i {
  font-size: 16px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

.marker-container:hover .marker-icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.marker-selected .marker-icon-wrapper {
  border-color: #f59e42;
  box-shadow: 0 0 0 4px rgba(245, 158, 66, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3);
  animation: pulse-border 1.5s infinite ease-in-out;
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 4px rgba(245, 158, 66, 0.3), 0 3px 8px rgba(0, 0, 0, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(245, 158, 66, 0.2), 0 3px 8px rgba(0, 0, 0, 0.3); }
}

.note-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background-color: #f59e42;
  border-radius: 50%;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  animation: pulse-note 2s infinite ease-in-out;
}

@keyframes pulse-note {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

:global(body.dark-mode) .marker-icon-wrapper {
  background-color: #1e293b;
  border-color: #334155;
}

:global(body.dark-mode) .note-indicator {
  background-color: #f87171;
  border-color: #334155;
}

:global(body.dark-mode) .marker-selected .marker-icon-wrapper {
  border-color: #f87171;
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.3), 0 3px 8px rgba(0, 0, 0, 0.4);
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
  color: #f8fafc;
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
  filter: drop-shadow(0 0 2px rgba(96, 165, 250, 0.5));
  border: 1px solid rgba(96, 165, 250, 0.3);
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
  background-color: rgba(30, 41, 59, 0.95);
  color: #f8fafc;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

:global(body.dark-mode .map-popup h5) {
  color: #60a5fa;
}

:global(body.dark-mode .map-popup h5::before) {
  background: linear-gradient(to bottom, #60a5fa, #93c5fd);
}

:global(body.dark-mode .map-popup .description) {
  color: #cbd5e1;
}

:global(body.dark-mode .map-popup .id-text) {
  color: #64748b;
}

.sidebar-list {
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.sidebar-list h5 {
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.sidebar-list .list-group-item {
  transition: all 0.2s ease;
  border-radius: 6px !important;
  margin-bottom: 3px;
  border-left: 3px solid transparent;
}

.sidebar-list .list-group-item:hover {
  border-left-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
  transform: translateX(3px);
}

.search-container {
  position: relative;
}

.search-input-group {
  position: relative;
  display: flex;
  margin-bottom: 10px;
}

.search-input {
  border-radius: 6px !important;
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding-right: 30px;
}

.search-input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
}

.clear-search-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: #64748b;
  z-index: 5;
  padding: 0 8px;
  font-size: 14px;
  border-radius: 0 6px 6px 0;
}

.clear-search-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.search-label {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.search-label span {
  display: flex;
  align-items: center;
}

.advanced-search-toggle {
  color: #3b82f6 !important;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.advanced-search-toggle:hover {
  color: #2563eb !important;
  transform: translateY(-1px);
}

.advanced-search-toggle i {
  transition: transform 0.2s ease;
}

.advanced-search-toggle[aria-expanded="true"] i {
  transform: rotate(180deg);
}

.search-filters-active {
  border-color: #3b82f6 !important;
  background-color: #f0f7ff !important;
}

.search-results-summary {
  background: linear-gradient(to right, #f0f7ff, #f8fafc);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notes-modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.notes-modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.notes-container {
  margin-bottom: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.note-item {
  background: linear-gradient(to right, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9));
  border-radius: 10px;
  padding: 12px 15px;
  margin-bottom: 10px;
  border-left: 3px solid #3b82f6;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  animation: fadeIn 0.3s ease;
}

.note-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.note-author {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.note-date {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-left: 5px;
}

.note-text {
  font-size: 0.95rem;
  color: #1e293b;
  line-height: 1.5;
  white-space: pre-line;
}

.note-actions {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.empty-notes-message {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-style: italic;
  background-color: rgba(241, 245, 249, 0.5);
  border-radius: 8px;
  margin-bottom: 15px;
}

.note-form {
  background-color: rgba(248, 250, 252, 0.7);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.notes-container {
  margin-bottom: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.note-item {
  background: linear-gradient(to right, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9));
  border-radius: 10px;
  padding: 12px 15px;
  margin-bottom: 10px;
  border-left: 3px solid #3b82f6;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  animation: fadeIn 0.3s ease;
}

.note-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.note-author {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.note-date {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-left: 5px;
}

.note-text {
  font-size: 0.95rem;
  color: #1e293b;
  line-height: 1.5;
  white-space: pre-line;
}

.note-actions {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.empty-notes-message {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-style: italic;
  background-color: rgba(241, 245, 249, 0.5);
  border-radius: 8px;
  margin-bottom: 15px;
}

.note-form {
  background-color: rgba(248, 250, 252, 0.7);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.note-textarea {
  border-radius: 8px;
  resize: vertical;
  transition: all 0.2s ease;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.note-textarea:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.add-note-btn {
  border-radius: 8px;
  padding: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-note-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(body.dark-mode) .notes-modal-content {
  background-color: #0f172a;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

:global(body.dark-mode) .note-item {
  background: linear-gradient(to right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border-left-color: #60a5fa;
}

:global(body.dark-mode) .note-author {
  color: #cbd5e1;
}

:global(body.dark-mode) .note-date {
  color: #94a3b8;
}

:global(body.dark-mode) .note-text {
  color: #f8fafc;
}

:global(body.dark-mode) .empty-notes-message {
  color: #94a3b8;
  background-color: rgba(30, 41, 59, 0.5);
}

:global(body.dark-mode) .note-form {
  background-color: rgba(30, 41, 59, 0.7);
  border-color: rgba(96, 165, 250, 0.2);
}

:global(body.dark-mode) .note-textarea {
  background-color: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

:global(body.dark-mode) .note-textarea:focus {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  border-color: #60a5fa;
}
</style>
