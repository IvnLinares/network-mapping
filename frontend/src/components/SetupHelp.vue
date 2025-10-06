<template>
  <div class="setup-help">
    <div class="setup-help-overlay" v-if="showHelp">
      <div class="setup-help-content">
        <div class="setup-help-header">
          <h3><i class="fas fa-question-circle"></i> Guía de Uso del Mapa</h3>
          <button class="btn-close" @click="showHelp = false"></button>
        </div>
        <div class="setup-help-body">
          <div class="tab-container">          <div class="tab-buttons">
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'elements' }" 
                @click="activeTab = 'elements'"
              >
                <i class="fas fa-map-pin"></i> Añadir Elementos
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'connections' }" 
                @click="activeTab = 'connections'"
              >
                <i class="fas fa-project-diagram"></i> Crear Conexiones
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'zones' }" 
                @click="activeTab = 'zones'"
              >
                <i class="fas fa-draw-polygon"></i> Definir Zonas
              </button>
            </div>            
            <!-- Pestaña de cómo añadir elementos -->
            <div class="tab-content" v-if="activeTab === 'elements'">
              <h4>Cómo Añadir Postes, Mufas y Otros Elementos</h4>
              
              <div class="guide-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h5>Activar el modo de añadir infraestructura</h5>
                  <p>En la barra superior del mapa, haz clic en el botón <i class="fas fa-map-pin"></i> para activar el modo de añadir elementos.</p>
                  <div class="guide-image">
                    <img src="https://via.placeholder.com/350x150?text=Seleccionar+modo+de+infraestructura" alt="Modo de añadir infraestructura">
                  </div>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h5>Seleccionar el tipo de elemento</h5>
                  <p>Una vez activado el modo, aparecerán los botones para seleccionar el tipo de infraestructura que deseas añadir:</p>
                  <ul>
                    <li><i class="fas fa-bolt"></i> <strong>Poste</strong> - Para postes de luz o telecomunicaciones</li>
                    <li><i class="fas fa-box"></i> <strong>Mufa</strong> - Para empalmes o conexiones</li>
                    <li><i class="fas fa-building"></i> <strong>Central</strong> - Para estaciones centrales</li>
                    <li><i class="fas fa-network-wired"></i> <strong>Terminal</strong> - Para puntos terminales</li>
                  </ul>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h5>Colocar el elemento en el mapa</h5>
                  <p>Haz clic en cualquier punto del mapa donde desees colocar el elemento. Aparecerá un marcador temporal con un formulario.</p>
                  <div class="guide-image">
                    <img src="https://via.placeholder.com/350x200?text=Colocar+elemento+en+mapa" alt="Colocar elemento">
                  </div>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h5>Completar información y guardar</h5>
                  <p>Ingresa el nombre/código y una descripción opcional del elemento, luego haz clic en "Guardar".</p>
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <span>Usa códigos identificativos como "PT-001" para postes o "MF-001" para mufas.</span>
                  </div>
                </div>
              </div>
              
              <div class="alert alert-success mt-4">
                <i class="fas fa-check-circle"></i>
                <span>Ahora podrás ver tu elemento en el mapa. Puedes repetir este proceso para añadir más elementos.</span>
              </div>
            </div>
            
            <!-- Pestaña de cómo crear conexiones -->
            <div class="tab-content" v-if="activeTab === 'connections'">
              <h4>Cómo Crear Conexiones entre Elementos</h4>
              
              <div class="guide-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h5>Activar el modo de conexión</h5>
                  <p>En la barra superior del mapa, haz clic en el botón <i class="fas fa-project-diagram"></i> para activar el modo de crear conexiones.</p>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h5>Seleccionar el punto de origen</h5>
                  <p>Haz clic en el elemento que será el punto de origen de la conexión (ej: un poste).</p>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h5>Seleccionar el punto de destino</h5>
                  <p>Haz clic en el elemento que será el punto de destino de la conexión.</p>
                  <div class="guide-image">
                    <img src="https://via.placeholder.com/350x200?text=Seleccionar+origen+y+destino" alt="Seleccionar puntos">
                  </div>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h5>Configurar la conexión</h5>
                  <p>Se abrirá una ventana donde podrás configurar:</p>
                  <ul>
                    <li><strong>Tipo de cable</strong> - Fibra óptica, coaxial o par trenzado</li>
                    <li><strong>Color</strong> - Para visualizar la conexión en el mapa</li>
                  </ul>
                  <p>Haz clic en "Guardar Conexión" para completar el proceso.</p>
                </div>
              </div>
              
              <div class="alert alert-info mt-4">
                <i class="fas fa-info-circle"></i>
                <span>La distancia entre los puntos se calcula automáticamente en metros.</span>
              </div>
            </div>
            
            <!-- Pestaña de cómo definir zonas -->
            <div class="tab-content" v-if="activeTab === 'zones'">
              <h4>Cómo Definir Zonas de Cobertura</h4>
              
              <div class="guide-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h5>Activar el modo de zonas</h5>
                  <p>En la barra superior del mapa, haz clic en el botón <i class="fas fa-draw-polygon"></i> para activar el modo de definir zonas.</p>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h5>Dibujar los vértices de la zona</h5>
                  <p>Haz clic en el mapa para crear los vértices del polígono que definirá la zona. Cada clic añade un punto al perímetro.</p>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h5>Completar el polígono</h5>
                  <p>Para cerrar el polígono, haz clic en el primer punto que creaste o haz doble clic en cualquier punto.</p>
                  <div class="guide-image">
                    <img src="https://via.placeholder.com/350x200?text=Dibujar+polígono+de+zona" alt="Dibujar zona">
                  </div>
                </div>
              </div>
              
              <div class="guide-step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h5>Configurar la zona</h5>
                  <p>Se abrirá una ventana donde podrás:</p>
                  <ul>
                    <li><strong>Nombrar la zona</strong> - Ej: "Zona Centro", "Sector Norte"</li>
                    <li><strong>Asignar un color</strong> - Para visualizar la zona en el mapa</li>
                  </ul>
                  <p>Haz clic en "Guardar Zona" para completar el proceso.</p>
                </div>
              </div>
              
              <div class="alert alert-warning mt-4">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Las zonas ayudan a definir áreas de cobertura o sectores de servicio.</span>
              </div>
            </div>
          </div>
        </div>
        <div class="setup-help-footer">
          <button class="btn btn-secondary" @click="showHelp = false">Cerrar</button>
        </div>
      </div>
    </div>    <button class="btn btn-primary setup-help-button" @click="showHelp = true">
      <i class="fas fa-question-circle"></i> Guía de Uso
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showHelp = ref(false);
const activeTab = ref('elements'); // Por defecto mostrar la guía de elementos

onMounted(() => {
  // Nada que verificar al montar el componente
});
</script>

<style scoped>
.setup-help-button {
  position: fixed;
  bottom: 100px;
  right: 32px;
  z-index: 1090;
  border-radius: 50px;
  padding: 10px 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.setup-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.setup-help-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

.setup-help-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setup-help-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setup-help-body {
  padding: 10px 20px 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.setup-help-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.setup-help-footer .btn {
  margin-left: 10px;
}

.alert {
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-warning {
  background-color: #fff8e6;
  border-left: 4px solid #f59e0b;
  color: #92400e;
}

.alert-info {
  background-color: #ecf8ff;
  border-left: 4px solid #0ea5e9;
  color: #0369a1;
}

.alert-success {
  background-color: #f0fdf4;
  border-left: 4px solid #10b981;
  color: #047857;
}

h4 {
  margin-top: 24px;
  margin-bottom: 15px;
  font-size: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

h5 {
  font-size: 17px;
  margin-bottom: 10px;
  color: #1e40af;
}

p {
  line-height: 1.6;
}

pre.sql-code {
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 15px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  color: #334155;
}

.copy-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* Estilos para las pestañas */
.tab-container {
  display: flex;
  flex-direction: column;
}

.tab-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.tab-btn {
  padding: 8px 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  color: #4b5563;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.tab-btn:hover:not(.active) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

/* Estilos para los pasos de la guía */
.guide-step {
  display: flex;
  margin-bottom: 25px;
  position: relative;
}

.step-number {
  background-color: #2563eb;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.step-content {
  flex-grow: 1;
}

.guide-image {
  margin: 15px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.guide-image img {
  width: 100%;
  max-width: 500px;
  height: auto;
  display: block;
}

ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

ul li {
  margin-bottom: 8px;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Ajustes para modo oscuro */
:global(body.dark-mode) .setup-help-content {
  background-color: #1e293b;
  color: #f1f5f9;
}

:global(body.dark-mode) .setup-help-header,
:global(body.dark-mode) .setup-help-footer {
  border-color: #334155;
}

:global(body.dark-mode) .tab-buttons {
  border-color: #334155;
}

:global(body.dark-mode) .tab-btn {
  background-color: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

:global(body.dark-mode) .tab-btn.active {
  background-color: #3b82f6;
  color: #f1f5f9;
  border-color: #3b82f6;
}

:global(body.dark-mode) .tab-btn:hover:not(.active) {
  background-color: #1e293b;
  border-color: #475569;
}

:global(body.dark-mode) h4 {
  border-color: #334155;
  color: #93c5fd;
}

:global(body.dark-mode) h5 {
  color: #60a5fa;
}

:global(body.dark-mode) .alert-warning {
  background-color: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
  color: #fbbf24;
}

:global(body.dark-mode) .alert-info {
  background-color: rgba(14, 165, 233, 0.1);
  border-color: #0ea5e9;
  color: #38bdf8;
}

:global(body.dark-mode) .alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
  color: #34d399;
}

:global(body.dark-mode) pre.sql-code {
  background-color: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

:global(body.dark-mode) .step-number {
  background-color: #3b82f6;
}
</style>
