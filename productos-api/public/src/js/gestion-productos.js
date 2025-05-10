document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const productoForm = document.getElementById('productoForm');
    const nuevoProductoBtn = document.getElementById('nuevoProducto');
    const cancelarEdicionBtn = document.getElementById('cancelarEdicion');
    const eliminarProductoBtn = document.getElementById('eliminarProducto');
    const listarProductosBtn = document.getElementById('listarProductos');
    const mensajeDiv = document.getElementById('mensaje');
    const productoActionsDiv = document.getElementById('productoActions');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const logoutBtn = document.getElementById('logoutBtn');

    const buscarProductoInput = document.getElementById('buscarProducto');
    const resultadosBusqueda = document.createElement('div');
    resultadosBusqueda.id = 'resultadosBusqueda';
    resultadosBusqueda.className = 'resultados-busqueda';
    buscarProductoInput.parentNode.insertBefore(resultadosBusqueda, buscarProductoInput.nextSibling);

    // Event Listeners
    productoForm.addEventListener('submit', handleFormSubmit);
    nuevoProductoBtn.addEventListener('click', resetForm);
    cancelarEdicionBtn.addEventListener('click', resetForm);
    eliminarProductoBtn.addEventListener('click', eliminarProductoActual);
    listarProductosBtn.addEventListener('click', listarTodosProductos);
    logoutBtn.addEventListener('click', cerrarSesion);
    
    buscarProductoInput.addEventListener('input', buscarProductosEnTiempoReal);
    document.addEventListener('click', cerrarResultadosBusqueda);

    // Verificar sesión al cargar la página
    verificarSesion();

    async function verificarSesion() {
        try {
            const response = await fetch('/api/session', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Error al verificar la sesión';
                console.error('Error del backend:', errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (!data.authenticated || data.user?.rol !== 'administrador') {
                window.location.replace('/login.html');
                return false;
            }
            
            console.log('Sesión verificada:', data);
            document.getElementById('userName').textContent = data.user?.nombre || 'Usuario';
            
            configurarManejoHistorial();
            return true;
            
        } catch (error) {
            console.error('Error en verificarSesion:', error.message);
            window.location.replace('/login.html');
            return false;
        }
    }

    function configurarManejoHistorial() {
        if (!window.location.pathname.includes('/login.html')) {
            const currentPage = window.location.pathname.split('/').pop() || 'menu.html';

            if (!window.history.state || window.history.state.page !== currentPage) {
                window.history.replaceState({ 
                    page: currentPage,
                    timestamp: Date.now(),
                    authenticated: true
                }, '', window.location.href);
            }
            
            window.addEventListener('popstate', function(event) {
                if (!event.state || (event.state.page === 'login.html' && event.state.authenticated !== true)) {
                    window.history.pushState({ 
                        page: currentPage,
                        timestamp: Date.now(),
                        authenticated: true
                    }, '', window.location.href);
                    
                    mostrarMensaje('Ya estás en la página actual', 'info');
                }
            });
            
            window.history.pushState({ 
                page: currentPage,
                timestamp: Date.now(),
                authenticated: true
            }, '', window.location.href);
        }
    }

    async function cerrarSesion() {
        try {
            const response = await fetch('/api/logout', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.redirected) {
                window.location.replace(response.url);
                return;
            }

            if (response.ok) {
                window.location.replace('/login.html');
                return;
            }

            const errorText = await response.text();
            throw new Error(errorText || 'Error al cerrar sesión');

        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            mostrarMensaje(`Error al cerrar sesión: ${error.message}`, 'error');
            window.location.replace('/login.html');
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const productoId = document.getElementById('productoId').value;
        const url = productoId ? `/${productoId}` : '/api/crear';
        const method = productoId ? 'PUT' : 'POST';
        
        const nombre = document.getElementById('nombre').value.trim();
        const precioVenta = document.getElementById('precio_venta').value;
        
        if (!nombre || !precioVenta) {
            mostrarMensaje('Nombre y precio de venta son campos obligatorios', 'error');
            return;
        }
    
        const productoData = {
            nombre: nombre,
            codigo_barras: document.getElementById('codigo_barras').value.trim(),
            precio_compra: parseFloat(document.getElementById('precio_compra').value) || 0,
            precio_venta: parseFloat(precioVenta),
            existencia: parseInt(document.getElementById('existencia').value) || 0,
            id_proveedor: parseInt(document.getElementById('id_proveedor').value) || null
        };
    
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(productoData)
            });
    
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(text || 'Respuesta no JSON recibida');
            }
    
            const data = await response.json();
            
            if (response.ok) {
                mostrarMensaje(
                    productoId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                    'success'
                );
                if (!productoId) {
                    document.getElementById('productoId').value = data.id_producto || data.id;
                    cargarProductoEnFormulario(data);
                }
            } else {
                throw new Error(data.error || data.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error en handleFormSubmit:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Error de conexión con el servidor';
            } else if (error.message.includes('Unexpected token')) {
                errorMessage = 'Respuesta inválida del servidor';
            }
            
            mostrarMensaje(`Error: ${errorMessage}`, 'error');
        }
    }



    function mostrarSugerencias(productos) {
        resultadosBusqueda.innerHTML = '';
        
        productos.forEach(producto => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            
            suggestionItem.innerHTML = `
                ${producto.nombre} 
                <span class="price">$${Number(producto.precio_venta).toFixed(2)}</span>
                <span class="id">ID: ${producto.id_producto}</span>
            `;
            
            suggestionItem.addEventListener('click', () => {
                cargarProductoEnFormulario(producto);
                buscarProductoInput.value = producto.id_producto;
                resultadosBusqueda.innerHTML = '';
                mostrarMensaje('Producto cargado', 'success');
            });
            
            resultadosBusqueda.appendChild(suggestionItem);
        });
        
        resultadosBusqueda.style.display = 'block';
    }



    function buscarProductosEnTiempoReal(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            resultadosBusqueda.innerHTML = '';
            resultadosBusqueda.style.display = 'none';
            return;
        }
        
        clearTimeout(buscarProductoInput.debounceTimer);
        buscarProductoInput.debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                
                if (response.ok) {
                    const productos = await response.json();
                    if (productos.length > 0) {
                        mostrarSugerencias(productos);
                    } else {
                        resultadosBusqueda.innerHTML = '<div class="no-results">No se encontraron productos</div>';
                        resultadosBusqueda.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Error en búsqueda:', error);
            }
        }, 300);
    }





    function cerrarResultadosBusqueda(e) {
        if (!buscarProductoInput.contains(e.target) && !resultadosBusqueda.contains(e.target)) {
            resultadosBusqueda.style.display = 'none';
        }
    }

    async function eliminarProductoActual() {
        const productoId = document.getElementById('productoId').value;
        
        if (!productoId) {
            mostrarMensaje('No hay producto cargado para eliminar', 'error');
            return;
        }
    
        if (!confirm('¿Está seguro que desea eliminar este producto permanentemente?')) {
            return;
        }
    
        try {
            const response = await fetch(`/${productoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al eliminar el producto');
            }
    
            mostrarMensaje('Producto eliminado correctamente', 'success');
            resetForm();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje(`Error al eliminar: ${error.message}`, 'error');
        }
    }

    function cargarProductoEnFormulario(producto) {
        console.log("Datos del producto recibidos:", producto);
        document.getElementById('productoId').value = producto.id_producto || producto.id;
        document.getElementById('nombre').value = producto.nombre || '';
        document.getElementById('codigo_barras').value = producto.codigo_barras || '';
        document.getElementById('precio_compra').value = producto.precio_compra || '';
        document.getElementById('precio_venta').value = producto.precio_venta || '';
        document.getElementById('existencia').value = producto.existencia || '';
        document.getElementById('id_proveedor').value = producto.id_proveedor || '';
        
        submitBtn.textContent = 'Actualizar Producto';
        cancelarEdicionBtn.classList.remove('hidden');
        productoActionsDiv.classList.remove('hidden');
        formTitle.textContent = 'Editar Producto';
    }

    function resetForm() {
        productoForm.reset();
        document.getElementById('productoId').value = '';
        submitBtn.textContent = 'Guardar Producto';
        cancelarEdicionBtn.classList.add('hidden');
        productoActionsDiv.classList.add('hidden');
        formTitle.textContent = 'Nuevo Producto';
        mostrarMensaje('Formulario listo para nuevo producto', 'info');
        buscarProductoInput.value = '';
    }

    async function listarTodosProductos() {
        try {
            const response = await fetch('/api/listar');
            const productos = await response.json();
            
            if (response.ok) {
                if (productos.length === 0) {
                    mostrarMensaje('No hay productos registrados', 'info');
                } else {
                    mostrarMensaje(`Mostrando ${productos.length} productos`, 'info');
                    mostrarListaProductos(productos);
                }
            } else {
                throw new Error(productos.error || 'Error al obtener productos');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje(`Error: ${error.message}`, 'error');
        }
    }

    function mostrarMensaje(mensaje, tipo) {
        mensajeDiv.innerHTML = `<p>${mensaje}</p>`;
        mensajeDiv.className = tipo;
        
        setTimeout(() => {
            if (mensajeDiv.textContent === mensaje) {
                mensajeDiv.textContent = '';
                mensajeDiv.className = '';
            }
        }, 5000);
    }

    function mostrarListaProductos(productos) {
        const lista = document.createElement('div');
        lista.innerHTML = '<h3>Lista de productos:</h3>';
        
        const ul = document.createElement('ul');
        productos.forEach(producto => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>ID: ${producto.id_producto}</strong> - ${producto.nombre} 
                (Existencia: ${producto.existencia}) 
                <button class="secondary" onclick="cargarProductoDesdeLista(${producto.id_producto})">Editar</button>
            `;
            ul.appendChild(li);
        });
        
        lista.appendChild(ul);
        mensajeDiv.appendChild(lista);
    }

    window.cargarProductoDesdeLista = async function(id) {
        try {
            const response = await fetch(`/${id}`);
            const producto = await response.json();
            
            if (response.ok) {
                cargarProductoEnFormulario(producto);
                mostrarMensaje(`Producto ID: ${id} cargado para edición`, 'success');
                buscarProductoInput.value = id;
            } else {
                throw new Error(producto.error || 'Error al cargar producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje(`Error: ${error.message}`, 'error');
        }
    };
});