-- Script simplificado para crear las tablas para el almacenamiento de elementos del mapa

-- Tabla de tipos de infraestructura
CREATE TABLE infrastructure_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Insertar tipos básicos
INSERT INTO infrastructure_types (name, icon) VALUES 
  ('Poste', 'fa-bolt'),
  ('Mufa', 'fa-box'),
  ('Central', 'fa-building'),
  ('Terminal', 'fa-network-wired');

-- Tabla de puntos de infraestructura
CREATE TABLE infrastructure_points (
  id UUID PRIMARY KEY,
  type_id INTEGER REFERENCES infrastructure_types(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  properties JSONB DEFAULT '{}'::jsonb
);

-- Tabla de conexiones de cable
CREATE TABLE cable_connections (
  id UUID PRIMARY KEY,
  start_point_id UUID REFERENCES infrastructure_points(id) ON DELETE CASCADE,
  end_point_id UUID REFERENCES infrastructure_points(id) ON DELETE CASCADE,
  cable_type TEXT NOT NULL,
  color TEXT NOT NULL,
  distance DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  properties JSONB DEFAULT '{}'::jsonb
);

-- Tabla de zonas
CREATE TABLE zones (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  polygon JSONB NOT NULL, -- Array de coordenadas [lat, lng]
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS básico
ALTER TABLE infrastructure_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público a tipos" ON infrastructure_types FOR ALL USING (true);

ALTER TABLE infrastructure_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público a puntos" ON infrastructure_points FOR ALL USING (true);

ALTER TABLE cable_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público a conexiones" ON cable_connections FOR ALL USING (true);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público a zonas" ON zones FOR ALL USING (true);
