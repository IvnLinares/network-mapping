
# Aplicación de Mapeo de Infraestructura

Esta aplicación web permite visualizar y gestionar elementos de infraestructura en un mapa utilizando Vue 3, Leaflet, un backend Express y PostgreSQL.

## Características

- Visualización de mapa centrado en El Salvador
- Añadir elementos de infraestructura como postes, mufas, centrales y terminales
- Crear conexiones de cableado entre elementos
- Definir zonas geográficas
- Backend Express y API REST
- Almacenamiento de datos en PostgreSQL

## Configuración del Proyecto

### Prerequisitos

- Node.js (v16 o superior)
- PostgreSQL (local o en servidor)
### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/mapeo.git
   cd mapeo
   ```

2. Instala las dependencias del frontend y backend:
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Configura las variables de entorno:
   - En `/backend`, crea un archivo `.env` con:
   ```
   PGUSER=postgres
   PGPASSWORD=Alf@adm1n
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=mapeo
   ```

4. Inicializa la base de datos PostgreSQL:
   - Crea la base de datos y las tablas usando el script `scripts/create_map_tables.sql` en tu servidor PostgreSQL.
   - Puedes usar PgAdmin, DBeaver o la terminal `psql`:
   ```bash
   psql -U postgres -d mapeo -f scripts/create_map_tables.sql
   ```

5. Inicia el backend y el frontend:
   ```bash
   # En una terminal
   cd backend
   npm start

   # En otra terminal
   cd frontend
   npm run dev
   ```

## Solución de Problemas

### La aplicación no se conecta a la base de datos

Si la aplicación no puede conectarse a la base de datos, verifica lo siguiente:

1. Asegúrate de que las variables de entorno estén configuradas correctamente en el archivo `.env` del backend
2. Verifica que el backend Express esté corriendo
3. Verifica que PostgreSQL esté activo y accesible

### No se pueden crear las tablas en PostgreSQL

Si tienes problemas al crear las tablas:

1. Asegúrate de tener los permisos adecuados en tu servidor PostgreSQL
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
- Comprueba que la tabla `cable_connections` exista en tu base de datos PostgreSQL

**Nota importante:** Si necesitas cancelar una conexión en proceso, puedes hacer clic en el botón "Cancelar" en la notificación superior o simplemente cambiar a otro modo de edición.

## Uso de la Aplicación

### Problema al guardar puntos en el mapa

Si encuentras problemas al guardar puntos en el mapa, verifica lo siguiente:

1. **Tablas en PostgreSQL**: Asegúrate de que has ejecutado correctamente el script SQL para crear las tablas.

2. **Variables de entorno**: Asegúrate de que las variables de entorno en el archivo `.env` del backend son correctas.

Para más información, consulta la guía de instalación en `/instalacion.html`.

## Estructura del Proyecto

- `src/components/MapView.vue`: Componente principal del mapa
- `src/components/SetupHelp.vue`: Guía de uso
- `backend/index.js`: Servidor Express y API REST
- `backend/db.js`: Conexión a PostgreSQL
- `scripts/create_map_tables.sql`: Script para crear tablas en PostgreSQL

## Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).
