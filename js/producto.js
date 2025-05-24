import { obtainProductos, addProducto, deleteProducto, updateProducto } from "../apiConnection/consumeProductos.js";

document.addEventListener("DOMContentLoaded", () => {
    getProductos();
    nuevoProducto();
});

function nuevoProducto() {
    const formAgregar = document.getElementById("form-agregar");
    const enviarFormularioBtn = document.getElementById("enviarFormulario");

    if (enviarFormularioBtn) {
        enviarFormularioBtn.addEventListener("click", () => {
            // Esto es una buena práctica para disparar el submit del formulario
            formAgregar.dispatchEvent(new Event("submit"));
        });
    }

    if (formAgregar) {
        formAgregar.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombrecel = document.getElementById("nombrecel").value;
            const marca = document.getElementById("marca").value;
            const modelo = document.getElementById("modelo").value;
            const descripcion = document.getElementById("descripcion").value;
            // Asegurarse de que son números y manejar posibles errores de parseFloat/parseInt
            const precio_unitario = Number.parseFloat(document.getElementById("precio").value);
            const stock = Number.parseInt(document.getElementById("stock").value);
            const imagen = document.getElementById("imagen").value;
            const fecha_creacion = new Date().toISOString(); // Correcto para MongoDB (fecha completa)

            if (!nombrecel || !marca || !modelo || !descripcion || isNaN(precio_unitario) || isNaN(stock) || !imagen) {
                alert("Por favor, complete todos los campos correctamente.");
                return;
            }

            const nuevoProducto = {
                nombre: nombrecel,
                marca: marca,
                modelo: modelo,
                descripcion: descripcion,
                precio_unitario: precio_unitario,
                stock: stock,
                imagen: imagen,
                fecha_creacion: fecha_creacion,
            };

            try {
                const respuesta = await addProducto(nuevoProducto);

                if (respuesta && respuesta._id) { // MongoDB usa _id
                    alert("Producto agregado correctamente");
                    formAgregar.reset();
                    // Limpia solo el cuerpo de la tabla para evitar recrear toda la estructura
                    document.querySelector("#productos-body").innerHTML = "";
                    getProductos();
                } else {
                    alert("Error al agregar el producto. Respuesta inesperada del servidor.");
                }
            } catch (error) {
                console.error("Error al agregar producto:", error);
                alert("Ocurrió un error inesperado al agregar el producto: " + error.message);
            }
        });
    }
}

async function getProductos() {
    try {
        const productosObtained = await obtainProductos();
        const container = document.querySelector("#productos-body");

        if (!container) {
            console.error("No se encontró el contenedor de la tabla #productos-body");
            return;
        }

        container.innerHTML = ""; // Limpiar antes de añadir

        if (!productosObtained || productosObtained.length === 0) {
            container.innerHTML = '<tr><td colspan="8">No hay productos disponibles.</td></tr>';
            return;
        }

        productosObtained.forEach((producto) => {
            const { _id, nombre, marca, modelo, descripcion, precio_unitario, stock, imagen, fecha_creacion } = producto;

            // Asegurarse de que fecha_Creacion es un string válido antes de crear la fecha
            let fechaFormateada = 'Fecha inválida';
            let fechaParaDataAttr = ''; // Mantener la cadena ISO para el data attribute
            if (fecha_creacion) {
                try {
                    const dateObj = new Date(fecha_creacion);
                    if (!isNaN(dateObj.getTime())) { // Comprobar si la fecha es válida
                        fechaFormateada = dateObj.toLocaleDateString();
                        fechaParaDataAttr = fecha_creacion; // Usar la original ISO string
                    } else {
                        console.warn(`Fecha_creacion inválida para producto ${_id}: "${fecha_creacion}"`);
                    }
                } catch (e) {
                    console.error(`Error al parsear fecha para producto ${_id}: "${fecha_creacion}"`, e);
                }
            }


            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${_id}</td>
                <td>${nombre}</td>
                <td>${marca}</td>
                <td>${stock}</td>
                <td><img src="${imagen}" width="100px" alt="${nombre}"></td>
                <td>${fechaFormateada}</td>
                <td>
                    <button class="btn color3 details-btn"
                        data-id="${_id}"
                        data-nombre="${nombre}"
                        data-marca="${marca}"
                        data-modelo="${modelo}"
                        data-descripcion="${descripcion}"
                        data-precio="${precio_unitario}"
                        data-stock="${stock}"
                        data-imagen="${imagen}"
                        data-fecha="${fechaParaDataAttr}">
                        Details
                    </button>
                </td>
                <td>
                    <button class="btn color2 update-btn"
                        data-id="${_id}"
                        data-nombre="${nombre}"
                        data-marca="${marca}"
                        data-modelo="${modelo}"
                        data-descripcion="${descripcion}"
                        data-precio="${precio_unitario}"
                        data-stock="${stock}"
                        data-imagen="${imagen}"
                        data-fecha="${fechaParaDataAttr}">
                        Edit
                    </button>
                </td>
                <td><button class="btn color5 delete-btn" data-id="${_id}">Delete</button></td>
            `;
            container.appendChild(row);
        });

        // Agregar event listeners (Delegación de eventos podría ser más eficiente en tablas grandes)
        document.querySelectorAll(".details-btn").forEach((button) => {
            button.addEventListener("click", showDetails);
        });

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", handleDelete);
        });

        document.querySelectorAll(".update-btn").forEach((button) => {
            button.addEventListener("click", handleEditProducto);
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("Error al cargar los productos: " + error.message);
    }
}

async function handleDelete(event) {
    const button = event.currentTarget;
    const id = button.getAttribute("data-id");

    if (!id) {
        alert("ID de producto no válido para eliminar.");
        return;
    }

    if (confirm("¿Está seguro que desea eliminar este producto?")) {
        try {
            const respuesta = await deleteProducto(id);

            // Verificar si la eliminación fue exitosa, considerando la respuesta de MongoDB
            if (respuesta && (respuesta.message || respuesta.deletedCount > 0)) {
                alert(respuesta.message || "Producto eliminado correctamente.");
                // Limpiar y recargar para reflejar los cambios
                document.querySelector("#productos-body").innerHTML = "";
                getProductos();
            } else {
                alert("No se pudo eliminar el producto o la respuesta del servidor fue inesperada.");
            }
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            alert("Ocurrió un error al eliminar el producto: " + error.message);
        }
    }
}

function handleEditProducto(event) {
    const button = event.currentTarget;

    let modal = document.getElementById('edit-producto-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-producto-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);

        // Estilos del modal (considera moverlos a un archivo CSS)
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '20px';
        modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        modal.style.zIndex = '1000';
        modal.style.borderRadius = '8px';
        modal.style.maxWidth = '500px';
        modal.style.width = '90%';
    }

    // Obtener datos del producto
    const id = button.getAttribute('data-id');
    const nombre = button.getAttribute('data-nombre');
    const marca = button.getAttribute('data-marca');
    const modelo = button.getAttribute('data-modelo');
    const descripcion = button.getAttribute('data-descripcion');
    const precio = button.getAttribute('data-precio');
    const stock = button.getAttribute('data-stock');
    const imagen = button.getAttribute('data-imagen');

    // Contenido del modal de edición
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <h3 style="margin: 0;">Editar Producto</h3>
            <button id="close-edit-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        </div>
        <form id="edit-producto-form">
            <input type="hidden" id="edit-id" value="${id}">
            <div style="margin-bottom: 15px;">
                <label for="edit-nombre" style="display: block; margin-bottom: 5px;">Nombre:</label>
                <input type="text" id="edit-nombre" value="${nombre}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-marca" style="display: block; margin-bottom: 5px;">Marca:</label>
                <input type="text" id="edit-marca" value="${marca}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-modelo" style="display: block; margin-bottom: 5px;">Modelo:</label>
                <input type="text" id="edit-modelo" value="${modelo}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-descripcion" style="display: block; margin-bottom: 5px;">Descripción:</label>
                <textarea id="edit-descripcion" style="width: 100%; padding: 8px; box-sizing: border-box; min-height: 80px;">${descripcion}</textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-precio" style="display: block; margin-bottom: 5px;">Precio:</label>
                <input type="number" step="0.01" id="edit-precio" value="${precio}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-stock" style="display: block; margin-bottom: 5px;">Stock:</label>
                <input type="number" id="edit-stock" value="${stock}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label for="edit-imagen" style="display: block; margin-bottom: 5px;">URL de la Imagen:</label>
                <input type="text" id="edit-imagen" value="${imagen}" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Guardar Cambios</button>
        </form>
    `;

    modal.style.display = 'block';

    // Cerrar modal
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Manejar envío del formulario
    document.getElementById('edit-producto-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const productoActualizado = {
            nombre: document.getElementById('edit-nombre').value,
            marca: document.getElementById('edit-marca').value,
            modelo: document.getElementById('edit-modelo').value,
            descripcion: document.getElementById('edit-descripcion').value,
            precio_unitario: parseFloat(document.getElementById('edit-precio').value),
            stock: parseInt(document.getElementById('edit-stock').value),
            imagen: document.getElementById('edit-imagen').value
        };

        try {
            const respuesta = await updateProducto(id, productoActualizado);

            if (respuesta && respuesta._id) { // Verificar por _id en MongoDB
                alert("Producto actualizado correctamente.");
                modal.style.display = 'none';
                document.querySelector("#productos-body").innerHTML = "";
                getProductos();
            } else {
                throw new Error("No se pudo actualizar el producto o la respuesta del servidor fue inesperada.");
            }
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            alert("Error al actualizar producto: " + error.message);
        }
    });

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showDetails(event) {
    const button = event.currentTarget;

    const id = button.getAttribute("data-id");
    const nombre = button.getAttribute("data-nombre");
    const marca = button.getAttribute("data-marca");
    const modelo = button.getAttribute("data-modelo");
    const descripcion = button.getAttribute("data-descripcion");
    const precio = button.getAttribute("data-precio");
    const stock = button.getAttribute("data-stock");
    const imagen = button.getAttribute("data-imagen");
    const fecha = button.getAttribute("data-fecha"); // Esta es la cadena ISO

    // --- PUNTO CRÍTICO PARA DEPURAR ---
    console.log("-----------------------------------------");
    console.log("En showDetails:");
    console.log("Valor de data-fecha (cadena ISO):", fecha);
    const dateObjFromData = new Date(fecha);
    console.log("Objeto Date creado:", dateObjFromData);
    console.log("¿Es una fecha válida (isNaN)?", isNaN(dateObjFromData.getTime()));
    // -----------------------------------------

    let fechaFormateada = 'Fecha inválida';
    if (fecha && !isNaN(dateObjFromData.getTime())) {
        fechaFormateada = dateObjFromData.toLocaleString();
    } else {
        console.error(`Error: La fecha obtenida del atributo data-fecha es inválida: "${fecha}"`);
    }

    let detailsModal = document.getElementById("details-modal");
    if (!detailsModal) {
        detailsModal = document.createElement("div");
        detailsModal.id = "details-modal";
        detailsModal.className = "modal";
        document.body.appendChild(detailsModal);

        detailsModal.style.position = "fixed";
        detailsModal.style.top = "50%";
        detailsModal.style.left = "50%";
        detailsModal.style.transform = "translate(-50%, -50%)";
        detailsModal.style.backgroundColor = "white";
        detailsModal.style.padding = "20px";
        detailsModal.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        detailsModal.style.zIndex = "1000";
        detailsModal.style.borderRadius = "8px";
        detailsModal.style.maxWidth = "600px";
        detailsModal.style.width = "90%";
    }

    detailsModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="margin: 0;">Detalles del Producto</h3>
            <button id="close-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Campo</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Valor</th></tr>
            <tr><td style="padding:6px;">ID</td><td style="padding:6px;">${id}</td></tr>
            <tr><td style="padding:6px;">Nombre</td><td style="padding:6px;">${nombre}</td></tr>
            <tr><td style="padding:6px;">Marca</td><td style="padding:6px;">${marca}</td></tr>
            <tr><td style="padding:6px;">Modelo</td><td style="padding:6px;">${modelo}</td></tr>
            <tr><td style="padding:6px;">Descripción</td><td style="padding:6px;">${descripcion}</td></tr>
            <tr><td style="padding:6px;">Precio</td><td style="padding:6px;">${precio}</td></tr>
            <tr><td style="padding:6px;">Stock</td><td style="padding:6px;">${stock}</td></tr>
            <tr><td style="padding:6px;">Imagen</td><td style="padding:6px;"><img src="${imagen}" width="100px" alt="${nombre}"></td></tr>
            <tr><td style="padding:6px;">Fecha de Creación</td><td style="padding:6px;">${fechaFormateada}</td></tr>
        </table>
    `;

    detailsModal.style.display = "block";

    document.getElementById("close-modal").addEventListener("click", () => {
        detailsModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === detailsModal) {
            detailsModal.style.display = "none";
        }
    });
}