// Utilidades para consumir la API REST del backend Express
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getInfrastructureTypes() {
  const res = await fetch(`${API_URL}/infrastructure_types`);
  if (!res.ok) throw new Error('Error al obtener tipos de infraestructura');
  return res.json();
}

export async function getInfrastructurePoints() {
  const res = await fetch(`${API_URL}/infrastructure_points`);
  if (!res.ok) throw new Error('Error al obtener puntos de infraestructura');
  return res.json();
}

export async function createInfrastructurePoint(point) {
  const res = await fetch(`${API_URL}/infrastructure_points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(point)
  });
  if (!res.ok) throw new Error('Error al crear punto');
  return res.json();
}

export async function updateInfrastructurePoint(id, data) {
  const res = await fetch(`${API_URL}/infrastructure_points/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar punto');
  return res.json();
}

export async function deleteInfrastructurePoint(id) {
  const res = await fetch(`${API_URL}/infrastructure_points/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar punto');
  return res.json();
}

export async function getCableConnections() {
  const res = await fetch(`${API_URL}/cable_connections`);
  if (!res.ok) throw new Error('Error al obtener conexiones');
  return res.json();
}

export async function createCableConnection(conn) {
  const res = await fetch(`${API_URL}/cable_connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conn)
  });
  if (!res.ok) throw new Error('Error al crear conexión');
  return res.json();
}

export async function updateCableConnection(id, data) {
  const res = await fetch(`${API_URL}/cable_connections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar conexión');
  return res.json();
}

export async function deleteCableConnection(id) {
  const res = await fetch(`${API_URL}/cable_connections/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar conexión');
  return res.json();
}

export async function getZones() {
  const res = await fetch(`${API_URL}/zones`);
  if (!res.ok) throw new Error('Error al obtener zonas');
  return res.json();
}

export async function createZone(zone) {
  const res = await fetch(`${API_URL}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zone)
  });
  if (!res.ok) throw new Error('Error al crear zona');
  return res.json();
}

export async function updateZone(id, data) {
  const res = await fetch(`${API_URL}/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar zona');
  return res.json();
}

export async function deleteZone(id) {
  const res = await fetch(`${API_URL}/zones/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar zona');
  return res.json();
}

export async function getPointNotes() {
  const res = await fetch(`${API_URL}/point_notes`);
  if (!res.ok) throw new Error('Error al obtener notas');
  return res.json();
}

export async function createPointNote(note) {
  const res = await fetch(`${API_URL}/point_notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error('Error al crear nota');
  return res.json();
}

export async function updatePointNote(id, data) {
  const res = await fetch(`${API_URL}/point_notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar nota');
  return res.json();
}

export async function deletePointNote(id) {
  const res = await fetch(`${API_URL}/point_notes/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar nota');
  return res.json();
}
