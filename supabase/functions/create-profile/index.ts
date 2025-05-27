// supabase/functions/create-profile/index.ts
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
  
  try {
    // Crear un cliente de Supabase con la clave de servicio
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
    }    // Verificar que el usuario tiene rol de admin (consultar tabla profiles)
    // Primero intentamos obtener el rol desde el perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('user_id', user.id)
      .single();
    
    // Si no hay perfil, intentamos obtener el rol desde los metadatos del usuario
    const userMetadata = user.user_metadata || {};
    const userRole = profile?.rol || userMetadata.rol || userMetadata.role;
    
    console.log('User role from profile:', profile?.rol);
    console.log('User metadata:', userMetadata);
    console.log('Determined user role:', userRole);
      
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado. Se requiere rol de administrador.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener datos del perfil a crear del cuerpo de la solicitud
    const profileData = await req.json();
    
    if (!profileData || !profileData.user_id) {
      return new Response(JSON.stringify({ error: 'Datos de perfil inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creando perfil para usuario:', profileData.user_id);

    // Verificar si ya existe un perfil para este usuario
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', profileData.user_id)
      .maybeSingle();

    let result;
    
    if (existingProfile) {
      // Si existe, actualizar
      console.log('Perfil existente, actualizando');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('user_id', profileData.user_id)
        .select();
        
      if (error) throw error;
      result = { updated: true, data };
    } else {
      // Si no existe, crear
      console.log('Creando nuevo perfil');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert([profileData])
        .select();
        
      if (error) throw error;
      result = { created: true, data };
    }

    // Retornar resultado
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en create-profile:', error);
    // Log more detailed error information
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});