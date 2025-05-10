let productosGlobales = [];
const modalKeyboard = document.querySelector('.keyboard-modal');
const displayDinero = document.querySelector('.money');
let valorDinero = '';

async function listarTodosProductos() {
  try {
      const response = await fetch('/api/listar');
      const productos = await response.json();

      if (response.ok) {
        productosGlobales = productos;
          if (productos.length === 0) {
          } else {
            mostrarProductos([]);
          }
      } else {
          throw new Error(productos.error || 'Error al obtener productos');
      }
  } catch (error) {
      console.error('Error:', error);
      //mostrarMensaje(`Error: ${error.message}`, 'error');
  }
}

async function ultimoIdVenta() {
  const response = await fetch('../api/ultimo-id-venta');
  if (!response.ok) {
    throw new Error('Error al obtener el id de la venta');
  }
  const data = await response.json();
  return data.id_venta;
}
/*
====================================================================
=========================== FUNCIONES UI ===========================
====================================================================
*/
function mostrarMensaje(mensaje, tipo) {
  const mensajeContainer = document.querySelector('.mensaje-container');
  mensajeContainer.innerHTML = `<div class="mensaje ${tipo}">${mensaje}</div>`;
}

function mostrarProductos(productos) {
  if (!Array.isArray(productos)) {
      console.error('La variable productos no es un arreglo:', productos);
      return;
  }

  const purchaseContainer = document.querySelector('.purchase');
  purchaseContainer.innerHTML = '';

  productos.forEach(producto => {
    const itemHTML = `
          <div class="purchase-item">
            <div class="item-info">
              <div class="product">
                <p class="item-id" data-id="${producto.id_producto}">ID: ${producto.id_producto}</p>
                <p class="product-name">${producto.nombre}</p>
              </div>

              <div class="item-controller">
                <button class="item-control min-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 1"><path d="M6.5 1h-6C.22 1 0 .78 0 .5S.22 0 .5 0h6c.28 0 .5.22.5.5s-.22.5-.5.5Z"/></svg>
                </button>

                <p class="quantity">0</p>

                <button class="item-control sum-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 7"><path d="M6.5 3H4V.5c0-.28-.22-.5-.5-.5S3 .22 3 .5V3H.5c-.28 0-.5.22-.5.5s.22.5.5.5H3v2.5c0 .28.22.5.5.5s.5-.22.5-.5V4h2.5c.28 0 .5-.22.5-.5S6.78 3 6.5 3Z"/></svg>
                </button>
              </div>

              <div class="price-available">
                <p class="price">$${producto.precio_venta}</p>
                <p class="info-low available">${producto.existencia}</p>
              </div>

            </div>
          </div>
    `;
    purchaseContainer.innerHTML += itemHTML;
    agregarListenersAControles();
  });
}

/*
======================================================================================
=========================== FUNCIONES CONTROL DE PRODUCTOS ===========================
======================================================================================
*/
function agregarListenersAControles() {
  const controllers = document.querySelectorAll('.item-controller');

  controllers.forEach(controller => {
    const minusButton = controller.querySelector('.min-button');
    const plusButton = controller.querySelector('.sum-button');
    const quantityDisp = controller.querySelector('.quantity');
    const availableDisp = controller.closest('.item-info').querySelector('.available');

    const productId = controller.closest('.purchase-item').querySelector('.item-id').dataset.id; // Obtén el id del producto

    let quantity = 0;
    let available = parseInt(availableDisp.textContent);

    quantityDisp.textContent = quantity;
    availableDisp.textContent = `${available} Available`;

    minusButton.disabled = true;
    plusButton.disabled = available === 0;

    minusButton.addEventListener('click', () => {
      let quantity = parseInt(quantityDisp.textContent); // <-- actualizar quantity real
      let available = parseInt(availableDisp.textContent);

      if (quantity > 0) {
        quantity--;
        available++;
        quantityDisp.textContent = quantity;
        availableDisp.textContent = `${available} Available`;

        minusButton.disabled = quantity === 0;
        plusButton.disabled = false;

        const itemInfo = controller.closest('.item-info');
        const productName = itemInfo.querySelector('.product .product-name').textContent;
        const price = itemInfo.querySelector('.price').textContent;

        anadirDetallesPago(productId, productName, price, quantity);
      }

      actualizarDetallesPago();
    });

    plusButton.addEventListener('click', () => {
      let quantity = parseInt(quantityDisp.textContent); // <-- actualizar quantity real
      let available = parseInt(availableDisp.textContent);
      if (available > 0) {
        quantity++;
        available--;
        quantityDisp.textContent = quantity;
        availableDisp.textContent = `${available} Available`;

        minusButton.disabled = false;
        plusButton.disabled = available === 0;

        const itemInfo = controller.closest('.item-info');
        const productName = itemInfo.querySelector('.product .product-name').textContent;
        const price = itemInfo.querySelector('.price').textContent;
        anadirDetallesPago(productId, productName, price, quantity);
      }

      actualizarDetallesPago();
    });
  });
}

function anadirDetallesPago(idProducto,nombreProducto, precio, cantidad){
  const billProducts = document.querySelector('.bill-products');

  let billProduct = Array.from(billProducts.querySelectorAll('.bill-product')).find(producto => {
    return producto.querySelector('p').textContent === nombreProducto;
  });

  if (cantidad === 0) {
    // Si cantidad es cero, eliminar el producto (si existe)
    if (billProduct) {
      const billInfo = billProduct.nextElementSibling;
      billProduct.remove();
      if (billInfo && billInfo.classList.contains('bill-info')) {
        billInfo.remove();
      }
    }
    return;
  }

  if (billProduct) {
    const amount = billProduct.nextElementSibling.querySelector('.right-info p:last-child');
    amount.textContent = cantidad;
  } else {
    const billProductHTML = `
      <div class="bill-product" data-id="${idProducto}">
        <div>
          <p>${nombreProducto}</p>
          <p class="price">${precio}</p>
        </div>
        <button class="cross">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5.24 5.24"><path d="M5.1 4.39 3.33 2.62 5.1.85c.2-.2.2-.51 0-.71s-.51-.2-.71 0L2.62 1.91.85.15c-.19-.2-.51-.2-.7 0s-.2.51 0 .7l1.77 1.77L.15 4.39c-.2.2-.2.51 0 .71s.51.2.71 0l1.77-1.77L4.4 5.1c.2.2.51.2.71 0s.2-.51 0-.71Z"/></svg>
        </button>
      </div>
      <div class="bill-info">
        <div class="left-info">
          <p>Amount</p>
        </div>
        <div class="right-info">
          <p>${cantidad}</p>
        </div>
      </div>
    `;

    billProducts.insertAdjacentHTML('beforeend', billProductHTML);
  }
}

function eliminarProductos() {
  const billProductsContainer = document.querySelector('.bill-products');

  billProductsContainer.addEventListener('click', (e) => {
    const crossButton = e.target.closest('.cross');
    if (!crossButton) return;

    const billProduct = crossButton.closest('.bill-product');
    const billInfo = billProduct.nextElementSibling;
    const nombreProducto = billProduct.querySelector('p').textContent;
    const cantidad = parseInt(billInfo.querySelector('.right-info p:last-child').textContent);

    // Restaurar cantidad y existencia en el producto correspondiente
    const productos = document.querySelectorAll('.purchase-item');
    productos.forEach(item => {
      const nombre = item.querySelector('.product-name').textContent;
      if (nombre === nombreProducto) {
        const availableText = item.querySelector('.available');
        const quantityText = item.querySelector('.quantity');
        const minus = item.querySelector('.min-button');
        const plus = item.querySelector('.sum-button');

        let available = parseInt(availableText.textContent);
        available += cantidad;

        quantityText.textContent = '0';
        availableText.textContent = `${available} Available`;

        minus.disabled = true;
        plus.disabled = available === 0;
      }
    });

    // Eliminar de la factura
    billProduct.remove();
    if (billInfo && billInfo.classList.contains('bill-info')) {
      billInfo.remove();
    }

    actualizarDetallesPago();
  });
}

function actualizarDetallesPago() {
  const billProducts = document.querySelectorAll('.bill-product');
  const checkoutButton = document.querySelector('.checkout-button');
  const descuentoInput = document.querySelector('.discount-input');
  const radioCash = document.getElementById('cash');
  const radioCard = document.getElementById('card');
  const changeContenido = document.getElementById('change-container');
  const cardContenido = document.querySelector('.transaction-card');
  const cashContenido = document.querySelector('.transaction-cash');
  const completarPagoButton = document.querySelector('.complete-payment-button');

  let subtotal = 0;
  let descuentoPorcentaje = 0;
  completarPagoButton.disabled = true;

  if (radioCash.checked) {
    cashContenido.style.display = 'block';
    cardContenido.style.display = 'none';
    changeContenido.style.display = 'flex';
    actualizarDetallesPagoModal();
  } else if (radioCard.checked) {
    cashContenido.style.display = 'none';
    cardContenido.style.display = 'block';
    changeContenido.style.display = 'none';
    completarPagoButton.disabled = false;
  }

  billProducts.forEach(billProduct => {
    const precioProducto = parseFloat(billProduct.querySelector('.price').textContent.replace('$', ''));
    const cantidadProducto = parseInt(billProduct.nextElementSibling.querySelector('.right-info p').textContent);

    subtotal += precioProducto * cantidadProducto;
  });

  // Calcular los impuestos (por ejemplo, 16%)
  if (descuentoInput) {
    descuentoPorcentaje = parseFloat(descuentoInput.value) || 0;
    if (descuentoPorcentaje < 0) descuentoPorcentaje = 0;
    if (descuentoPorcentaje > 100) descuentoPorcentaje = 100;
  }

  const descuento = (descuentoPorcentaje / 100) * subtotal;
  const subtotalConDescuento = subtotal - descuento;
  const impuestos = (16 / 100) * subtotalConDescuento;
  const total = subtotalConDescuento + impuestos;

  // Actualizar los valores en la UI
  const subtotalElemento = document.querySelector('.subtotal');
  const impuestosElemento = document.querySelector('.taxes');
  const totalElemento = document.querySelector('.total-amount');
  if (billProducts.length === 0) {
    subtotalElemento.textContent = '$0.00';
    impuestosElemento.textContent = '$0.00';
    totalElemento.textContent = '$0.00';
    checkoutButton.disabled = true;
  } else {
    subtotalElemento.textContent = `$${subtotalConDescuento.toFixed(2)}`;
    impuestosElemento.textContent = `$${impuestos.toFixed(2)}`;
    totalElemento.textContent = `$${total.toFixed(2)}`;
    checkoutButton.disabled = false;
  }
}
/*
================================================================================
=========================== FUNCIONES DE NUEVA ORDEN ===========================
================================================================================
*/
function nuevaOrden() {
  const newOrderButton = document.querySelector('.new-order-button');
  const itemSearch = document.querySelector('.item-search');
  const newOrderContainer = document.querySelector('.new-order');
  const avisoPago = document.querySelector('.bill-advice');
  const contenedorBill = document.querySelector('.bill-container');

  itemSearch.removeAttribute('disabled');

  newOrderButton.classList.add('fade-out');
  newOrderContainer.classList.add('fade-out');
  avisoPago.classList.add('hidden');
  contenedorBill.classList.add('visible');

  setTimeout(() => {
    newOrderContainer.style.display = 'none';
  }, 300);
}

async function actualizarIdVenta() {
  const newOrderButton = document.querySelector('.new-order-button');
  const billIdElement = document.querySelector('.bill-id');

  newOrderButton.addEventListener('click', async () => {
    try {
      const lastBillId = await ultimoIdVenta();
      const newBillId = lastBillId + 1;

      billIdElement.textContent = `#${newBillId}`;

      // Opcional: Aquí puedes hacer cualquier otra acción, como mostrar un mensaje o actualizar otros elementos de la UI.

    } catch (error) {
      console.error('Error al obtener el id de la venta:', error);
    }
  });
}

/*
===================================================================================
=========================== FUNCIONES DEL MODAL DE PAGO ===========================
===================================================================================
*/
function productosEnModal(){
  const productosPago = document.querySelectorAll('.bill-product');
  const contenedorTransaccion = document.querySelector('.transaction-items');

  contenedorTransaccion.innerHTML = '';

  productosPago.forEach(productoPago => {
    const nombre = productoPago.querySelector('p').textContent;
    const precio = productoPago.querySelector('.price').textContent;
    const cantidad = productoPago.nextElementSibling.querySelector('.right-info p').textContent;

    const itemHTML = `
        <div class="transaction-item">
        <div>
          <p>${nombre}</p>
          <p>${precio}</p>
        </div>
        <p>${cantidad}x</p>
      </div>
    `

    contenedorTransaccion.insertAdjacentHTML('beforeend', itemHTML);
  })
}

function actualizarDetallesPagoModal() {
  const totalElemento = document.querySelector('.total-amount');
  const subtotalElemento = document.querySelector('.subtotal');
  const impuestosElemento = document.querySelector('.taxes');
  const totalModal = document.querySelector('.modal-total');
  const subtotalModal = document.querySelector('.modal-subtotal');
  const impuestosModal = document.querySelector('.modal-taxes');
  const cambioModal = document.querySelector('.modal-change');
  const completarPagoButton = document.querySelector('.complete-payment-button');

  const radioCash = document.getElementById('cash');
  const radioCard = document.getElementById('card');

  if (!totalElemento || !totalModal || !subtotalElemento || !subtotalModal || !impuestosElemento || !impuestosModal) {
    console.error('Error: No se encontraron todos los elementos necesarios');
    return;
  }

  if (radioCard.checked) {
    completarPagoButton.disabled = false;
    return;
  }

  totalModal.textContent = totalElemento.textContent;
  subtotalModal.textContent = subtotalElemento.textContent;
  impuestosModal.textContent = impuestosElemento.textContent;

  // Solo si es efectivo se valida el cambio
  const totalFloat = stringAFloat(totalElemento.textContent);
  const montoRecibido = stringAFloat(displayDinero.textContent);
  const cambio = montoRecibido - totalFloat;

  if (cambio >= 0) {
    cambioModal.textContent = '$' + cambio.toFixed(2);
    completarPagoButton.disabled = false;
  } else {
    cambioModal.textContent = 'Faltan $' + Math.abs(cambio).toFixed(2);
    completarPagoButton.disabled = true;
  }
}

function abrirModal(){
  const abrirModal = document.querySelector('.checkout-button');
  const modal = document.querySelector('.payment-modal');
  const cerrarModal = document.querySelector('.modal-close');

  abrirModal.addEventListener('click', (e) => {
    e.preventDefault();

    productosEnModal();
    actualizarDetallesPagoModal();
    modal.classList.add('payment-modal-show');
    valorDinero = '';
    actualizarDisplayDinero();
  })

  cerrarModal.addEventListener('click', (e) =>{
    e.preventDefault();
    modal.classList.remove('payment-modal-show');
  })
}

function stringAFloat(cadena){
  const numero = parseFloat(cadena.replace(/[^\d.-]/g, '')) || 0;
  return Number(numero.toFixed(2));
}

function actualizarDisplayDinero() {
  // Asegurarse de que siempre haya al menos dos ceros para representar centavos
  if (!valorDinero || /^0+$/.test(valorDinero)) {
    displayDinero.textContent = '$0.00';
    return 0.00;
  }

  const relleno = valorDinero.padStart(3, '0');
  const pesos = relleno.slice(0, -2) || '0';
  const centavos = relleno.slice(-2);
  const valorNumerico = parseFloat(pesos + '.' + centavos)

  displayDinero.textContent = `$${pesos}.${centavos}`;
  return valorNumerico;
}

function configurartecladoModal() {
    const modalKeys = modalKeyboard.querySelectorAll('.keyboard-key');

    modalKeys.forEach(btn => {
      btn.addEventListener('click', () =>{
        const key = btn.dataset.key;

        if (key === 'del') {
          valorDinero = valorDinero.slice(0, -1);
        } else if(!isNaN(key)) {
          if (valorDinero.length >= 9) {
            return
          }

          if (valorDinero === '' && key === '0') {
              return;
          }

          valorDinero += key;
        }

        actualizarDisplayDinero();
        actualizarDetallesPagoModal();
      });
    });
}

/*
================================================================================
=========================== FUNCIONES DE NUEVA ORDEN ===========================
================================================================================
*/
async function registrarVenta() {
  try {
    const idAnterior = await ultimoIdVenta();
    const nuevoId = idAnterior + 1;
    const subtotal = parseFloat(document.querySelector('.subtotal').textContent.replace('$', ''));
    const total = parseFloat(document.querySelector('.total-amount').textContent.replace('$', ''));
    const productos = [];

    // Recolectar los productos en la factura
    const billProducts = document.querySelectorAll('.bill-product');
    billProducts.forEach(billProduct => {
      const idProducto = billProduct.dataset.id; // Asegúrate que esto existe
      const nombreProducto = billProduct.querySelector('p').textContent; // Cambiado de .product-name
      const cantidadProducto = parseInt(billProduct.nextElementSibling.querySelector('.right-info p').textContent);
      const precioProducto = parseFloat(billProduct.querySelector('.price').textContent.replace('$', ''));

      productos.push({
        id_producto: idProducto,
        nombre: nombreProducto,
        cantidad: cantidadProducto,
        precio_unitario: precioProducto // Cambiado a precio_unitario para coincidir con el backend
      });
    });

    // Enviar los datos al backend (servidor)
    const response = await fetch('/api/ventas/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_venta: nuevoId,
        total: total,
        detalles: productos // Cambiado a "detalles" para coincidir con el backend
      })
    });

    if (!response.ok) {
      const errorData = await response.text(); // Lee el cuerpo del error
      throw new Error(`Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();

    if (response.ok) {
      console.log('Venta registrada con éxito:', data);
      // Limpiar el carrito y mostrar mensaje
      document.querySelector('.bill-products').innerHTML = '';
      actualizarDetallesPago();

      const pagoRealizadoModal = document.querySelector('.payment-completed-modal');
      const modal = document.querySelector('.payment-modal');
      pagoRealizadoModal.classList.add('payment-completed-modal-active');
      modal.classList.remove('payment-modal-show');

      setTimeout(() => {
        location.reload();
      }, 5000);

      document.querySelector('.return-button').addEventListener('click', () => {
        location.reload();
      });
    } else {
      throw new Error(data.error || 'Error al registrar la venta');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  listarTodosProductos();
  eliminarProductos();
  actualizarIdVenta();
  abrirModal();
  configurartecladoModal();

  document.querySelector('.new-order-button').addEventListener('click', nuevaOrden);
  document.querySelector('.discount-input').addEventListener('input', actualizarDetallesPago);
  document.getElementById('cash').addEventListener('change', actualizarDetallesPago);
  document.getElementById('card').addEventListener('change', actualizarDetallesPago);
  document.getElementById('change-container').addEventListener('change', actualizarDetallesPago);
  document.querySelector('.complete-payment-button').addEventListener('click', registrarVenta);

  const inputBuscar = document.querySelector('.item-search');
  inputBuscar.addEventListener('input', (e) => {
    const texto = e.target.value.trim();

    if (texto === '') {
      mostrarProductos([]);
      return;
    }

    const filtrados = productosGlobales.filter(producto =>
      producto.id_producto.toString().includes(texto)
    );

    mostrarProductos(filtrados);
  });
});