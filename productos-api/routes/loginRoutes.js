//routes/loginRoutes
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.post('/', loginController.login); //POST procesa datos enviado por el cliente, el login en generla
module.exports = router;