const input = document.querySelector('.item-search');
const mainKeyboard = document.querySelector('.keyboard');
const mainButtons = mainKeyboard.querySelectorAll('.keyboard-key');
mainButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    if (key === 'del') {
      input.value = input.value.slice(0, -1); // Borra el último carácter
    } else if (key === 'clr'){
      input.value = '';
    }
    else {
      input.value += key; // Añade el carácter al input
    }

    // Disparar la búsqueda al escribir en el input
    ejecutarBusqueda();
  });
});



// Cuando el input recibe foco, muestra el teclado
input.addEventListener('focus', () => {
  mainKeyboard.classList.remove('keyboard-hidden');
});

// Limitar la entrada a números
input.addEventListener('input', () => {
  input.value = input.value.replace(/[^0-9]/g, ''); // Solo números
  ejecutarBusqueda(); // Llamar a la búsqueda cuando cambia el valor
});

function ejecutarBusqueda() {
  const texto = input.value.trim();

  if (texto === '') {
    // Si el campo está vacío, no se muestra nada
    mostrarProductos([]);
    //mostrarMensaje(`No se encontraron productos`, 'info');
    return;
  }

  const filtrados = productosGlobales.filter(producto =>
    producto.id_producto.toString().includes(texto)
  );

  //mostrarMensaje(`Mostrando ${filtrados.length} productos encontrados`, 'info');
  mostrarProductos(filtrados);
}

// Ocultar el teclado si se hace clic fuera de él
document.addEventListener('click', (e) => {
  if (!input.contains(e.target) && !mainKeyboard.contains(e.target)) {
    mainKeyboard.classList.add('keyboard-hidden');
  }
});
