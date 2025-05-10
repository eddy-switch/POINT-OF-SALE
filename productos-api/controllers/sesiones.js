exports.isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        if (req.accepts('html')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
};
exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'administrador') {
        return next();
    }
    res.status(403).send('Acceso denegado');
};




