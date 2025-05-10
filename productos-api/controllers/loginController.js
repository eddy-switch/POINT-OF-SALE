// controllers/loginController.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { usuario, contrasena } = req.body;
    
    try {
        // Cambiar 'usuarios' por el nombre correcto de la tabla (parece ser 'empleados' aunque no se ve el nombre completo)
        const [users] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
    
        const user = users[0];
        
        // Comparación directa de contraseña (sin bcrypt, ya que en la BD se ven en texto plano)
        // Si realmente están en texto plano (como parece en la imagen)
        if (contrasena !== user.contrasena) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        

        
        req.session.user = {
            id: user.id_empleado,
            username: user.usuario,
            nombre: user.nombre,
            rol: user.rol
        };

        // Redirección según el rol
// Mantener el mismo código pero modificar la respuesta:
if (user.rol === 'administrador') {
    return res.json({ redirectUrl: '/menu.html' });
} else if (user.rol === 'cajero') {
    return res.json({ redirectUrl: '/cajero.html' });
}

        // Si no coincide con ningún rol conocido
        res.json({ 
            message: 'Login exitoso',
            user: {
                id: user.id_empleado,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};