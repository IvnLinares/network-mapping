const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// Endpoint de ejemplo: obtener todos los perfiles
app.get('/api/profiles', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nombre, apellido, telefono, email, rol');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Aquí puedes agregar más rutas y lógica de tu API

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});