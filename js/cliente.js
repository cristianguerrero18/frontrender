import { obtainProductos } from "../apiConnection/consumeProductos.js";
import { crearCompra, obtainComprasConDetallesPorUsuario } from "../apiConnection/consumeCompras.js";
import { crearFactura } from "../apiConnection/consumeFacturas.js";

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay un usuario en sesión
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const logoutBtn = document.getElementById('logout-btn');
    const userWelcome = document.querySelector('.user-welcome');
    
    // Mostrar u ocultar elementos según el estado de autenticación
    if (currentUser && currentUser.tipo === 'cliente') {
        // Mostrar nombre del usuario
        document.getElementById('user-name').textContent = currentUser.nombre;
        logoutBtn.style.display = 'block';
        userWelcome.style.display = 'block';
        
        // Crear contenedor para botones de usuario
        const userButtonsContainer = document.createElement('div');
        userButtonsContainer.className = 'd-flex align-items-center';
        
        // Botón de historial de compras
        const historyBtn = document.createElement('button');
        historyBtn.className = 'btn btn-outline-light btn-sm me-2';
        historyBtn.innerHTML = '<i class="bi bi-person-circle"></i> Mi perfil';
        historyBtn.id = 'history-btn';
        
        // Agregar botones al contenedor
        userButtonsContainer.appendChild(historyBtn);
        userButtonsContainer.appendChild(logoutBtn.cloneNode(true));
        
        // Reemplazar el logoutBtn original con el contenedor
        logoutBtn.replaceWith(userButtonsContainer);
       
        historyBtn.addEventListener('click', () => {
            window.location.href = 'historial-compras.html';
        });
        
        document.getElementById('logout-btn').addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('cart');
            window.location.href = 'login.html';
        });
    }
    
    // Cargar productos
    loadProducts();

    // Inicializar carrito desde localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartUI();

    // Event listeners
    document.getElementById('search-btn').addEventListener('click', function() {
        filterProducts();
    });

    document.getElementById('search-input').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterProducts();
        }
    });

    document.getElementById('filter-select').addEventListener('change', function() {
        filterProducts();
    });

    document.getElementById('add-to-cart-modal').addEventListener('click', function() {
        const productId = this.dataset.productId;
        const quantity = parseInt(document.getElementById('product-quantity').value);
        addToCart(productId, quantity);
        
        // Cerrar modal después de agregar al carrito
        const modal = bootstrap.Modal.getInstance(document.getElementById('product-modal'));
        modal.hide();
    });

    document.getElementById('checkout-btn').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        showCheckoutModal();
    });

    document.getElementById('confirm-checkout').addEventListener('click', function() {
        processCheckout();
    });

    // Funciones principales
    async function loadProducts() {
        try {
            const productos = await obtainProductos();
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            productos.forEach(producto => {
                const { _id, nombre, marca, modelo, descripcion, precio_unitario, stock, imagen } = producto;
                
                const productCard = document.createElement('div');
                productCard.className = 'col-md-4 col-lg-3 mb-4';
                productCard.innerHTML = `
                    <div class="card product-card h-100">
                        <img src="${imagen}" class="card-img-top product-img" alt="${nombre}" style="height: 200px; object-fit: contain;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${nombre}</h5>
                            <p class="card-text">
                                <strong>Marca:</strong> ${marca}<br>
                                <strong>Precio:</strong> $${precio_unitario.toFixed(2)}
                            </p>
                            <div class="mt-auto d-flex justify-content-between">
                                <button class="btn btn-sm btn-outline-primary view-details" data-id="${_id}">
                                    <i class="bi bi-eye"></i> Ver detalles
                                </button>
                                <button class="btn btn-sm btn-primary add-to-cart" data-id="${_id}" ${stock <= 0 ? 'disabled' : ''}>
                                    <i class="bi bi-cart-plus"></i> ${stock <= 0 ? 'Agotado' : 'Agregar'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(productCard);
            });
            
            // Agregar event listeners
            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.dataset.id;
                    showProductDetails(productId);
                });
            });
            
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.dataset.id;
                    addToCart(productId, 1);
                });
            });
        } catch (error) {
            console.error('Error al cargar productos:', error);
            alert('Error al cargar los productos: ' + error.message);
        }
    }

    async function showProductDetails(productId) {
        try {
            const productos = await obtainProductos();
            const producto = productos.find(p => p._id == productId);
            
            if (!producto) {
                alert('Producto no encontrado');
                return;
            }
            
            const { nombre, marca, modelo, descripcion, precio_unitario, stock, imagen } = producto;
            
            document.getElementById('modal-product-name').textContent = nombre;
            document.getElementById('modal-product-image').src = imagen;
            document.getElementById('modal-product-price').textContent = `$${precio_unitario.toFixed(2)}`;
            document.getElementById('modal-product-brand').textContent = marca;
            document.getElementById('modal-product-model').textContent = modelo;
            document.getElementById('modal-product-stock').textContent = stock;
            document.getElementById('modal-product-description').textContent = descripcion;
            document.getElementById('product-quantity').value = 1;
            document.getElementById('product-quantity').max = stock;
            
            // Guardar el ID del producto en el botón de agregar al carrito
            document.getElementById('add-to-cart-modal').dataset.productId = productId;
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('product-modal'));
            modal.show();
        } catch (error) {
            console.error('Error al mostrar detalles del producto:', error);
            alert('Error al cargar los detalles del producto: ' + error.message);
        }
    }

    function addToCart(productId, quantity) {
        if (!currentUser) {
            alert('Por favor inicia sesión para agregar productos al carrito');
            window.location.href = 'login.html';
            return;
        }

        if (quantity <= 0) {
            alert('Por favor, selecciona una cantidad válida');
            return;
        }
        
        obtainProductos().then(productos => {
            const producto = productos.find(p => p._id == productId);
            
            if (!producto) {
                alert('Producto no encontrado');
                return;
            }
            
            if (quantity > producto.stock) {
                alert(`Solo hay ${producto.stock} unidades disponibles`);
                return;
            }
            
            // Verificar si el producto ya está en el carrito
            const existingItemIndex = cart.findIndex(item => item.id == productId);
            
            if (existingItemIndex >= 0) {
                const newQuantity = cart[existingItemIndex].quantity + quantity;
                
                if (newQuantity > producto.stock) {
                    alert(`No puedes agregar más unidades. Stock disponible: ${producto.stock}`);
                    return;
                }
                
                cart[existingItemIndex].quantity = newQuantity;
            } else {
                cart.push({
                    id: productId,
                    name: producto.nombre,
                    price: producto.precio_unitario,
                    image: producto.imagen,
                    quantity: quantity
                });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
            alert(`${producto.nombre} agregado al carrito`);
        }).catch(error => {
            console.error('Error al agregar al carrito:', error);
            alert('Error al agregar el producto al carrito: ' + error.message);
        });
    }

    function updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center">Tu carrito está vacío</p>';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        let total = 0;
        
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item d-flex align-items-center p-2 border-bottom';
            cartItem.innerHTML = `
                <img src="${item.image}" class="cart-item-img rounded me-3" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="flex-grow-1">
                    <div class="fw-bold">${item.name}</div>
                    <div>${item.quantity} x $${item.price.toFixed(2)}</div>
                </div>
                <div class="text-end">
                    <div class="fw-bold">$${subtotal.toFixed(2)}</div>
                    <button class="btn btn-sm btn-outline-danger cart-item-remove" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
        
        document.querySelectorAll('.cart-item-remove').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.dataset.index;
                removeFromCart(index);
            });
        });
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }

    function filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filterValue = document.getElementById('filter-select').value;
        
        obtainProductos().then(productos => {
            let filteredProducts = productos;
            
            if (searchTerm) {
                filteredProducts = productos.filter(producto => 
                    producto.nombre.toLowerCase().includes(searchTerm) ||
                    producto.marca.toLowerCase().includes(searchTerm) ||
                    producto.modelo.toLowerCase().includes(searchTerm) ||
                    producto.descripcion.toLowerCase().includes(searchTerm)
                );
            }
            
            switch (filterValue) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => a.precio_unitario - b.precio_unitario);
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => b.precio_unitario - a.precio_unitario);
                    break;
                case 'name-asc':
                    filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    break;
                case 'name-desc':
                    filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
                    break;
            }
            
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            if (filteredProducts.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-center">No se encontraron productos</p></div>';
                return;
            }
            
            filteredProducts.forEach(producto => {
                const { _id, nombre, marca, modelo, descripcion, precio_unitario, stock, imagen } = producto;
                
                const productCard = document.createElement('div');
                productCard.className = 'col-md-4 col-lg-3 mb-4';
                productCard.innerHTML = `
                    <div class="card product-card h-100">
                        <img src="${imagen}" class="card-img-top product-img" alt="${nombre}" style="height: 200px; object-fit: contain;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${nombre}</h5>
                            <p class="card-text">
                                <strong>Marca:</strong> ${marca}<br>
                                <strong>Precio:</strong> $${precio_unitario.toFixed(2)}
                            </p>
                            <div class="mt-auto d-flex justify-content-between">
                                <button class="btn btn-sm btn-outline-primary view-details" data-id="${_id}">
                                    <i class="bi bi-eye"></i> Ver detalles
                                </button>
                                <button class="btn btn-sm btn-primary add-to-cart" data-id="${_id}" ${stock <= 0 ? 'disabled' : ''}>
                                    <i class="bi bi-cart-plus"></i> ${stock <= 0 ? 'Agotado' : 'Agregar'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(productCard);
            });
            
            document.querySelectorAll('.view-details').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.dataset.id;
                    showProductDetails(productId);
                });
            });
            
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.dataset.id;
                    addToCart(productId, 1);
                });
            });
        }).catch(error => {
            console.error('Error al filtrar productos:', error);
            alert('Error al filtrar los productos: ' + error.message);
        });
    }

    function showCheckoutModal() {
        if (!currentUser) {
            alert('Por favor inicia sesión para realizar una compra');
            window.location.href = 'login.html';
            return;
        }

        const checkoutItems = document.getElementById('checkout-items');
        const checkoutTotal = document.getElementById('checkout-total');
        
        checkoutItems.innerHTML = '';
        
        let total = 0;
        
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'd-flex justify-content-between mb-2';
            itemElement.innerHTML = `
                <span>${item.quantity} x ${item.name}</span>
                <span>$${subtotal.toFixed(2)}</span>
            `;
            checkoutItems.appendChild(itemElement);
        });
        
        checkoutTotal.textContent = `$${total.toFixed(2)}`;
        
        const modal = new bootstrap.Modal(document.getElementById('checkout-modal'));
        modal.show();
    }
    
    async function processCheckout() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
    
        if (!currentUser || !currentUser._id) {
            alert('No has iniciado sesión o el usuario no está correctamente definido.');
            return;
        }
    
        try {
            const checkoutBtn = document.getElementById('confirm-checkout');
            checkoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
            checkoutBtn.disabled = true;
            
            // Crear objeto de compra para el backend
            const compraData = {
                id_usuario: currentUser._id,
                items: cart.map(item => ({
                    id_producto: item.id,
                    cantidad: item.quantity
                }))
            };
            
            // Enviar la compra al servidor
            const compraResult = await crearCompra(compraData);
            
            if (compraResult && compraResult.compra) {
                // Generar la factura automáticamente
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const facturaData = {
                    id_compra: compraResult.compra._id,
                    numero_factura: `FAC-${Date.now()}`,
                    fecha_emision: new Date().toISOString(),
                    total: total
                };
                
                // Crear la factura
                const facturaResult = await crearFactura(facturaData);
                
                if (facturaResult) {
                    // Limpiar carrito
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartUI();
                    
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('checkout-modal'));
                    modal.hide();
                    
                    // Mostrar mensaje de éxito con información de la factura
                    alert(`¡Compra realizada con éxito!\nNúmero de factura: ${facturaResult.numero_factura}\nTotal: $${total.toFixed(2)}`);
                    
                    // Recargar productos para actualizar stock
                    loadProducts();
                } else {
                    throw new Error('No se pudo generar la factura');
                }
            } else {
                throw new Error('No se recibió una respuesta válida del servidor para la compra');
            }
        } catch (error) {
            console.error('Error al procesar la compra:', error);
            alert('Error al procesar la compra: ' + error.message);
        } finally {
            const checkoutBtn = document.getElementById('confirm-checkout');
            checkoutBtn.innerHTML = 'Confirmar Compra';
            checkoutBtn.disabled = false;
        }
    }
});