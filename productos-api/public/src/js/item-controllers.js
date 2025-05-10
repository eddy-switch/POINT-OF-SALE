const controllers = document.querySelectorAll('.item-controller');

controllers.forEach(controller => {
  const minusButton = controller.querySelector('.min-button');
  const plusButton = controller.querySelector('.sum-button');
  const quantityDisp = controller.querySelector('.quantity');
  const availableDisp = controller.closest('.item-info').querySelector('.available');

  let quantity = 0;
  let available = parseInt(availableDisp.textContent);

  quantityDisp.textContent = quantity;
  availableDisp.textContent = `${available} Available`;

  minusButton.disabled = true;
  plusButton.disabled = available === 0;

  minusButton.addEventListener('click', () => {
    if (quantity > 0) {
      quantity--;
      available++;
      quantityDisp.textContent = quantity;
      availableDisp.textContent = `${available} Available`;

      if (quantity === 0) {
        minusButton.disabled = true;
      }

      if(available > 0){
        plusButton.disabled = false;
      }
    }
  });

  plusButton.addEventListener('click', () => {
    if (available > 0) {
      quantity++;
      available--;
      quantityDisp.textContent = quantity;
      availableDisp.textContent = `${available} Available`;

      if (quantity > 0) {
        minusButton.disabled = false;
      }

      if (available === 0) {
        plusButton.disabled = true;
      }
    }
  });
});