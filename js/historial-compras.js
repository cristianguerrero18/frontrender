import { obtainComprasConDetallesPorUsuario } from "../apiConnection/consumeCompras.js";

document.addEventListener('DOMContentLoaded', function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const comprasContainer = document.getElementById('compras-container');
    const totalComprasBadge = document.getElementById('total-compras');
    const userNameElement = document.getElementById('user-name');
    const userButtonsContainer = document.getElementById('user-buttons');

    // Verificar autenticación
    if (!currentUser || !currentUser._id) {
        window.location.href = 'login.html';
        return;
    }

    // Configurar UI
    userNameElement.textContent = currentUser.nombre;
    setupUserButtons();
    loadPurchaseHistory();

    async function loadPurchaseHistory() {
        try {
            const comprasRaw = await obtainComprasConDetallesPorUsuario(currentUser._id);
            console.log('Compras recibidas (raw):', comprasRaw); // For debugging

            // Check if comprasRaw is valid and extract compras array
            let compras = [];
            if (comprasRaw && Array.isArray(comprasRaw.compras)) {
                compras = comprasRaw.compras.map(item => ({
                    ...(item.compra || {}), // Spread compra properties
                    detalles: item.detalles || [] // Ensure detalles is an array
                }));
            } else {
                console.warn('comprasRaw.compras is not an array:', comprasRaw);
            }

            console.log('Compras procesadas:', compras); // For debugging

            if (!compras || compras.length === 0) {
                comprasContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No tienes compras registradas. <a href="index.html" class="alert-link">Ir a comprar</a>
                    </div>
                `;
                totalComprasBadge.textContent = '0 compras';
                return;
            }

            // Sort purchases by date (most recent first)
            compras.sort((a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra));

            totalComprasBadge.textContent = `${compras.length} ${compras.length === 1 ? 'compra' : 'compras'}`;
            comprasContainer.innerHTML = '';

            for (const [index, compra] of compras.entries()) {
                const compraIdDisplay = compra._id ? compra._id.substring(0, 8) : 'N/A';
                const fechaCompra = new Date(compra.fecha_compra);
                const fechaFormateada = fechaCompra.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const compraElement = document.createElement('div');
                compraElement.className = 'accordion-item mb-3 border-0 shadow-sm';
                compraElement.innerHTML = `
                    <h2 class="accordion-header" id="heading-${compra._id}">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button"
                                data-bs-toggle="collapse" data-bs-target="#collapse-${compra._id}"
                                aria-expanded="${index === 0 ? 'true' : 'false'}"
                                aria-controls="collapse-${compra._id}">
                            <div class="d-flex justify-content-between w-100 me-3">
                                <div>
                                    <span class="fw-bold">Compra #${compraIdDisplay}</span>
                                    ${compra.numero_factura ? `<span class="ms-2 badge bg-secondary">Factura: ${compra.numero_factura}</span>` : ''}
                                </div>
                                <div>
                                    <span class="text-muted me-3">${fechaFormateada}</span>
                                    <span class="badge bg-primary">$${compra.total ? compra.total.toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse-${compra._id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                         aria-labelledby="heading-${compra._id}">
                        <div class="accordion-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Producto</th>
                                            <th class="text-end">Precio</th>
                                            <th class="text-center">Cantidad</th>
                                            <th class="text-end">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody id="detalles-${compra._id}">
                                    </tbody>
                                    <tfoot class="table-group-divider">
                                        <tr>
                                            <td colspan="3" class="text-end fw-bold">Total:</td>
                                            <td class="text-end fw-bold">$${compra.total ? compra.total.toFixed(2) : '0.00'}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
                comprasContainer.appendChild(compraElement);

                // Fill product details
                const detallesBody = document.getElementById(`detalles-${compra._id}`);
                for (const detalle of compra.detalles || []) {
                    let productNameDisplay = detalle.id_producto || 'ID Desconocido';
                    let productBrandModel = '';

                    // Fetch product details to get the name
                    try {
                        const productResponse = await fetch(`http://localhost:5000/api/productos/${detalle.id_producto}`);
                        const producto = await productResponse.json();
                        productNameDisplay = producto.nombre || detalle.id_producto; // Fallback to ID if name is unavailable
                        productBrandModel = `${producto.marca || ''} ${producto.modelo || ''}`.trim(); // Combine brand and model
                    } catch (error) {
                        console.error(`Error al obtener detalles del producto ${detalle.id_producto}:`, error);
                    }

                    const detalleRow = document.createElement('tr');
                    detalleRow.className = 'align-middle';
                    detalleRow.innerHTML = `
                        <td>
                            <div class="d-flex align-items-center">
                                <div>
                                    <h6 class="mb-1">${productNameDisplay}</h6>
                                    <small class="text-muted">${productBrandModel}</small>
                                </div>
                            </div>
                        </td>
                        <td class="text-end">$${detalle.precio_unitario ? detalle.precio_unitario.toFixed(2) : '0.00'}</td>
                        <td class="text-center">${detalle.cantidad || 0}</td>
                        <td class="text-end">$${(detalle.precio_unitario && detalle.cantidad) ? (detalle.precio_unitario * detalle.cantidad).toFixed(2) : '0.00'}</td>
                    `;
                    detallesBody.appendChild(detalleRow);
                }
            }

        } catch (error) {
            console.error('Error al cargar historial:', error);
            comprasContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar el historial de compras: ${error.message}
                </div>
            `;
        }
    }

    function setupUserButtons() {
        userButtonsContainer.innerHTML = `
            <button id="profile-btn" class="btn btn-outline-light btn-sm me-2">
                <i class="bi bi-person-circle me-1"></i> Mi Perfil
            </button>
            <button id="logout-btn" class="btn btn-outline-light btn-sm">
                <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
            </button>
        `;

        document.getElementById('profile-btn').addEventListener('click', () => {
            window.location.href = 'perfil.html';
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
});