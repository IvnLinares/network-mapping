import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Infraestructura Types
app.get('/api/infrastructure_types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM infrastructure_types');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Infraestructura Points
app.get('/api/infrastructure_points', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM infrastructure_points');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo punto de infraestructura
app.post('/api/infrastructure_points', async (req, res) => {
  const { id, type_id, latitude, longitude, name, description, created_at, created_by, properties } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO infrastructure_points (id, type_id, latitude, longitude, name, description, created_at, created_by, properties)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, type_id, latitude, longitude, name, description, created_at, created_by, properties]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar punto de infraestructura
app.put('/api/infrastructure_points/:id', async (req, res) => {
  const { id } = req.params;
  const { type_id, latitude, longitude, name, description, properties } = req.body;
  try {
    const result = await pool.query(
      `UPDATE infrastructure_points SET type_id=$1, latitude=$2, longitude=$3, name=$4, description=$5, properties=$6 WHERE id=$7 RETURNING *`,
      [type_id, latitude, longitude, name, description, properties, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar punto de infraestructura
app.delete('/api/infrastructure_points/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM infrastructure_points WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cable Connections
app.get('/api/cable_connections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cable_connections');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva conexión de cable
app.post('/api/cable_connections', async (req, res) => {
  const { id, start_point_id, end_point_id, cable_type, color, distance, created_at, created_by, properties } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cable_connections (id, start_point_id, end_point_id, cable_type, color, distance, created_at, created_by, properties)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, start_point_id, end_point_id, cable_type, color, distance, created_at, created_by, properties]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar conexión de cable
app.put('/api/cable_connections/:id', async (req, res) => {
  const { id } = req.params;
  const { start_point_id, end_point_id, cable_type, color, distance, properties } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cable_connections SET start_point_id=$1, end_point_id=$2, cable_type=$3, color=$4, distance=$5, properties=$6 WHERE id=$7 RETURNING *`,
      [start_point_id, end_point_id, cable_type, color, distance, properties, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar conexión de cable
app.delete('/api/cable_connections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cable_connections WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zones
app.get('/api/zones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zones');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva zona
app.post('/api/zones', async (req, res) => {
  const { id, name, polygon, created_at, created_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO zones (id, name, polygon, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, polygon, created_at, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar zona
app.put('/api/zones/:id', async (req, res) => {
  const { id } = req.params;
  const { name, polygon } = req.body;
  try {
    const result = await pool.query(
      `UPDATE zones SET name=$1, polygon=$2 WHERE id=$3 RETURNING *`,
      [name, polygon, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar zona
app.delete('/api/zones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM zones WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Point Notes
app.get('/api/point_notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM point_notes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva nota
app.post('/api/point_notes', async (req, res) => {
  const { id, point_id, text, author, date, created_by, created_at } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO point_notes (id, point_id, text, author, date, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, point_id, text, author, date, created_by, created_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar nota
app.put('/api/point_notes/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const result = await pool.query(
      `UPDATE point_notes SET text=$1 WHERE id=$2 RETURNING *`,
      [text, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar nota
app.delete('/api/point_notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM point_notes WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API escuchando en http://localhost:${PORT}`);
});
