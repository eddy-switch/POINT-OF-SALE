const express = require('express');
const router = express.Router();
const path = require('path');
const sesiones = require('../controllers/sesiones');
const loginController = require('../controllers/loginController');
const noCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};

router.get('/api/session', sesiones.isAuthenticated, noCache, (req, res) => {
    res.json({
        authenticated: true,
        user: req.session.user  // El middleware ya verificó que existe
    });
});

router.post('/api/login', loginController.login, noCache, (req, res) => {
    if (req.session.user) {
        // Cambio solicitado aquí:
        if (req.session.user.rol === 'administrador') {
            return res.redirect('/menu.html');
        } else {
            return res.redirect('/caja.html');
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para logout
router.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al destruir sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        res.clearCookie('connect.sid');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.redirect('/login.html');
    });
});



router.get('/login.html', noCache, (req, res) => {
    if (req.session.user) {
        // Cambio solicitado aquí:
        return res.redirect(req.session.user.rol === 'administrador' ? '/menu.html' : '/cajero.html');
    }
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Ruta protegida para gestión de productos (solo admin)
router.get('/gestion-productos.html', sesiones.isAuthenticated, sesiones.isAdmin, noCache, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/gestion-productos.html'));
});

// Ruta protegida para el menú (requiere autenticación)
router.get('/menu.html', sesiones.isAuthenticated, noCache, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/menu.html'));
});


module.exports = router;