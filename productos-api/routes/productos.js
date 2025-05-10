const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Rutas para productos solo se requiere el path, y el import
router.post('/api/crear', productosController.crearProducto); //POST procesa datos enviado por el cliente, ejemplo el agregar el producto, autenticar usuarios
router.get('/api/listar', productosController.listarProductos);// GET obtiene los datos de la API en cuestion, buscar, filtrar
router.get('/api/search', productosController.obtenerProducto);
router.put('/:id', productosController.actualizarProducto); //actualiza los recursos en el servidor, modificar en este caso
router.delete('/:id', productosController.eliminarProducto); //eleminar los recursos del servidor 





module.exports = router;


