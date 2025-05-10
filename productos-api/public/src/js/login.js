document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión activa al cargar la página
    try {
        const sessionCheck = await fetch('/api/session', {
            credentials: 'include'
        });
        
        if (sessionCheck.ok) {
            const result = await sessionCheck.json();
            // Usar replace para evitar que el login quede en el historial
            if (window.location.pathname.includes('login.html')) {
                window.location.replace(result.user.rol === 'administrador' 
                    ? '/menu.html' 
                    : '/cajero.html');
            }
            return;
        }
    } catch (error) {
        console.log('No hay sesión activa, mostrando formulario de login');
    }

    // Configurar el evento de login solo si no hay sesión activa
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            usuario: e.target.usuario.value,
            contrasena: e.target.contrasena.value
        };
        
try {
            const response = await fetch('/api/login', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                window.location.replace(result.redirectUrl || '/menu.html'); //Checar esta linea
            } else {
                const error = await response.json();
                alert(error.error || 'Error en el login');
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error de conexión con el servidor');
        }
    });
});