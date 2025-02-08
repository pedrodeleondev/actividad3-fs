// LÍNEAS BÁSICAS DE EXPRESS.JS Y NODE.JS

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

const app = express();
const PUERTO = 3000;
const CLAVE_SECRETA = 'mi_clave_secreta';

app.use(bodyParser.json());

// FUNCIONES
async function leerTareas() {
  try {
    const datos = await fs.readFile('tareas.json', 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    return [];
  }
}

async function escribirTareas(tareas) {
  try {
    await fs.writeFile('tareas.json', JSON.stringify(tareas, null, 2));
  } catch (error) {
    console.error('Error al escribir tareas:', error);
    throw error;
  }
}

async function leerUsuarios() {
  try {
    const datos = await fs.readFile('usuarios.json', 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    return [];
  }
}

async function escribirUsuarios(usuarios) {
  try {
    await fs.writeFile('usuarios.json', JSON.stringify(usuarios, null, 2));
  } catch (error) {
    console.error('Error al escribir usuarios:', error);
    throw error;
  }
}

// MIDDLEWARE
function verificarToken(req, res, next) {
  const cabecera = req.headers['authorization'];
  const token = cabecera && cabecera.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  jwt.verify(token, CLAVE_SECRETA, (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

// RUTA: Base
app.get('/', (req, res) => {
    res.send('Actividad 3 por Pedro de León');
});


// RUTA: Registro
app.post('/registro', async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ error: 'Se requiere usuario y contraseña' });
    const usuarios = await leerUsuarios();
    if (usuarios.find(u => u.usuario === usuario)) return res.status(400).json({ error: 'El usuario ya existe' });
    
    const contrasenaCifrada = await bcrypt.hash(contrasena, 10);
    const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const nuevoUsuario = { id: nuevoId, usuario, contrasena: contrasenaCifrada };

    usuarios.push(nuevoUsuario);
    await escribirUsuarios(usuarios);
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    next(error);
  }
});

// RUTA: Login
app.post('/login', async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ error: 'Se requiere usuario y contraseña' });
    const usuarios = await leerUsuarios();
    const usuarioEncontrado = usuarios.find(u => u.usuario === usuario);
    if (!usuarioEncontrado) return res.status(400).json({ error: 'Usuario no encontrado' });
    
    const contrasenaValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
    if (!contrasenaValida) return res.status(400).json({ error: 'Contraseña incorrecta' });
    
    const token = jwt.sign({ id: usuarioEncontrado.id, usuario: usuarioEncontrado.usuario }, CLAVE_SECRETA, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// RUTA: Obtener todas las tareas
app.get('/tareas', verificarToken, async (req, res, next) => {
  try {
    const tareas = await leerTareas();
    res.json(tareas);
  } catch (error) {
    next(error);
  }
});

// RUTA: Agregar tarea
app.post('/tareas', verificarToken, async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) return res.status(400).json({ error: 'Se requiere título y descripción' });
    
    const tareas = await leerTareas();
    const nuevoId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1;
    const nuevaTarea = { id: nuevoId, titulo, descripcion };
    
    tareas.push(nuevaTarea);
    await escribirTareas(tareas);
    res.status(201).json({ message: 'Tarea creada correctamente', tarea: nuevaTarea });
  } catch (error) {
    next(error);
  }
});

// RUTA: Actualizar tarea
app.put('/tareas/:id', verificarToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    let tareas = await leerTareas();
    const indice = tareas.findIndex(t => t.id == id);
    if (indice === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    
    if (titulo) tareas[indice].titulo = titulo;
    if (descripcion) tareas[indice].descripcion = descripcion;
    
    await escribirTareas(tareas);
    res.json({ message: 'Tarea actualizada', tarea: tareas[indice] });
  } catch (error) {
    next(error);
  }
});

// RUTA: Eliminar tarea
app.delete('/tareas/:id', verificarToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    let tareas = await leerTareas();
    if (!tareas.find(t => t.id == id)) return res.status(404).json({ error: 'Tarea no encontrada' });
    
    tareas = tareas.filter(t => t.id != id);
    await escribirTareas(tareas);
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    next(error);
  }
});

// MIDDLEWARE: Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  res.status(500).json({ error: 'Error en el servidor' });
});

// INICIO DEL SERVIDOR
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
