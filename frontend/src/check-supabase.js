// Utilidad para verificar la conexión y tablas de Supabase
import { createClient } from '@supabase/supabase-js';

// Usar las mismas variables de entorno que la aplicación
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseTables() {
  console.log('Verificando conexión a Supabase...');
  
  try {
    // Verificar la conexión
    const { data: healthData, error: healthError } = await supabase.from('infrastructure_types').select('count()', { count: 'exact' });
    
    if (healthError) {
      console.error('Error de conexión o tabla no existe:', healthError);
      
      if (healthError.code === '42P01') {
        console.error('La tabla infrastructure_types no existe. Por favor, ejecuta el script SQL para crear las tablas.');
      } else {
        console.error('Error de conexión:', healthError.message);
      }
      return;
    }
    
    console.log('Conexión exitosa a Supabase');
    console.log('Recuento de tipos de infraestructura:', healthData);
    
    // Verificar otras tablas importantes
    const tables = [
      'infrastructure_points',
      'cable_connections',
      'zones'
    ];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count()', { count: 'exact', head: true });
        
        if (error) {
          console.error(`La tabla ${table} no existe o hay un problema:`, error);
        } else {
          console.log(`La tabla ${table} existe y es accesible.`);
        }
      } catch (tableError) {
        console.error(`Error al verificar la tabla ${table}:`, tableError);
      }
    }
    
  } catch (error) {
    console.error('Error general al verificar Supabase:', error);
  }
}

// Ejecutar la verificación
checkSupabaseTables();
