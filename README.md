# Aplicación de Mapeo de Infraestructura

Esta aplicación web permite visualizar y gestionar elementos de infraestructura en un mapa utilizando Vue 3, Leaflet y Supabase.

## Características

- Visualización de mapa centrado en El Salvador
- Añadir elementos de infraestructura como postes, mufas, centrales y terminales
- Crear conexiones de cableado entre elementos
- Definir zonas geográficas
- Autenticación de usuarios
- Almacenamiento de datos en Supabase

## Configuración del Proyecto

### Prerequisitos

- Node.js (v16 o superior)
- Cuenta en Supabase
``
### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/mapeo.git
   cd mapeo/frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la carpeta `/frontend` con las siguientes variables:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. Inicializa la base de datos:
   - Ve al [panel de Supabase](https://app.supabase.com)
   - Abre el editor SQL
   - Ejecuta el script que se encuentra en `scripts/create_map_tables.sql`

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Solución de Problemas

### La aplicación no se conecta a Supabase

Si la aplicación no puede conectarse a Supabase, verifica lo siguiente:

1. Asegúrate de que las variables de entorno estén configuradas correctamente en el archivo `.env`
2. Verifica que tu proyecto de Supabase esté activo
3. Utiliza la herramienta de diagnóstico incluida en `/public/diagnostico.html`

### No se pueden crear las tablas en Supabase

Si tienes problemas al crear las tablas:

1. Asegúrate de tener los permisos adecuados en tu proyecto de Supabase
2. Verifica que el script SQL no contenga errores
3. Ejecuta las sentencias una por una si es necesario

### Cómo conectar puntos en el mapa

Para crear conexiones entre puntos de infraestructura:

1. **Método 1 - Desde el popup:**
   - Haz clic en un punto en el mapa para abrir su popup
   - Haz clic en el botón "Conectar"
   - Se activará el modo de conexión y verás una notificación en la parte superior
   - Selecciona otro punto en el mapa para completar la conexión
   - Completa la información en el modal y guarda la conexión

2. **Método 2 - Usando el modo Conectar:**
   - Haz clic en el icono de conexión (🔌) en la barra de herramientas
   - Selecciona un primer punto en el mapa como origen
   - Verás una línea punteada que sigue tu cursor desde el punto de origen
   - Selecciona un segundo punto como destino
   - Completa la información en el modal y guarda la conexión

Si la conexión no aparece después de guardarla:
- Verifica que no haya errores en la consola del navegador
- Intenta refrescar la página para cargar las conexiones nuevamente
- Comprueba que la tabla `cable_connections` exista en Supabase

**Nota importante:** Si necesitas cancelar una conexión en proceso, puedes hacer clic en el botón "Cancelar" en la notificación superior o simplemente cambiar a otro modo de edición.

## Uso de la Aplicación

### Problema al guardar puntos en el mapa

Si encuentras problemas al guardar puntos en el mapa, verifica lo siguiente:

1. **Tablas en Supabase**: Asegúrate de que has ejecutado correctamente el script SQL para crear las tablas. Puedes acceder a la página de diagnóstico en `/diagnostico.html` para verificar.

2. **Autenticación**: Debes estar autenticado para poder guardar puntos. Verifica que has iniciado sesión correctamente.

3. **Permisos RLS**: Verifica que las políticas de seguridad en Supabase permiten operaciones de inserción, actualización y eliminación.

4. **Variables de entorno**: Asegúrate de que las variables de entorno en el archivo `.env` son correctas.

Para más información, consulta la guía de instalación en `/instalacion.html`.

## Estructura del Proyecto

- `src/components/MapView.vue`: Componente principal del mapa
- `src/components/SetupHelp.vue`: Guía de uso
- `src/supabase.js`: Configuración de Supabase
- `scripts/create_map_tables.sql`: Script para crear tablas en Supabase

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).
