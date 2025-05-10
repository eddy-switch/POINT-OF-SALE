const express = require('express');
const router = express.Router();
const { registrarVenta } = require('../controllers/ventasController');


// Solo una vez, define la ruta
router.post('/', registrarVenta);

module.exports = router;
