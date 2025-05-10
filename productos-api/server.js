//server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const productosRouter = require('./routes/productos');
const loginRouter = require('./routes/loginRoutes');
const sesionesRouter = require('./routes/sesiones');
const { isAuthenticated, isAdmin } = require('./controllers/sesiones');
const ventasRouter = require('./routes/ventas');
const app = express();
const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '020718', //coloca tu contraseña de tu MySql
    database: 'sistema_ventas', //Nombramiento de tu Base de datos
    port: 3307,  //Puerto
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =============================================
// 1. CONFIGURACIÓN BÁSICA DEL SERVIDOR
// =============================================
const PORT = process.env.PORT || 3000;

// =============================================
// 2. MIDDLEWARES 
// =============================================
// Middlewares de seguridad y parsing primero
app.use(cors({
    origin: 'http://localhost:3000', // o el puerto que uses
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        secure: false, // Cambia a true si usas HTTPS
    }
}));


// Servir archivos estáticos
app.use(express.static('public'));

app.use(express.json());// parsear JSON

// =============================================
// 3. RUTAS
// =============================================
// API Routes
app.use('/', sesionesRouter);
app.use('/', productosRouter); // Rutas de productos
app.use('/', loginRouter); // Rutas de login
app.use('/api/ventas', ventasRouter);
app.use('/build', express.static(__dirname + '/build'));
app.get('/api/ultimo-id-venta', async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT id_venta FROM ventas ORDER BY id_venta DESC LIMIT 1');
      if (rows.length > 0) {
        res.json({ id_venta: rows[0].id_venta });
      } else {
        res.json({ id_venta: 0 });
      }
    } catch (error) {
      console.error('Error en /api/ultimo-id-venta:', error.message);
      res.status(500).json({ error: 'Error al obtener el id de la venta' });
    }
  });

// 4. MANEJO DE ERRORES
// =============================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// =============================================
// 5. INICIO DEL SERVIDOR
// =============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});