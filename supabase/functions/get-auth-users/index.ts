// supabase/functions/get-auth-users/index.ts
// @deno-types="https://deno.land/std@0.177.0/http/server.d.ts"
/// <reference types="https://deno.land/x/supabase@1.3.1/mod.ts" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Declare Deno namespace for TypeScript in non-Deno environments
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejar solicitud OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {    // Crear un cliente de Supabase con la clave de servicio
    const supabaseAdmin = createClient(
      // Obtener estos valores de las variables de entorno
      (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : process.env.SUPABASE_URL) ?? '',
      (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY) ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autorización del usuario que hace la solicitud
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extraer y verificar token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario no autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el usuario tiene rol de admin (consultar tabla profiles)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('user_id', user.id)
      .single();
      
    if (profileError || profile?.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado. Se requiere rol de administrador.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }    // Obtener la lista de usuarios (esto solo funciona con el service_role_key)
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    // Imprimir para depuración
    console.log(`Obtenidos ${authUsers.users.length} usuarios de autenticación`);

    // Retornar la lista de usuarios - asegurarse de devolver un array
    return new Response(JSON.stringify(authUsers.users || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
