import { obtainCompras } from "../apiConnection/consumeCompras.js";

document.addEventListener("DOMContentLoaded", () => {
    getCompras();
});

async function getCompras() {
    const comprasObtained = await obtainCompras();
    const container = document.querySelector('#compras-body');

    comprasObtained.forEach((compra) => {
        const { _id, id_usuario, fecha_compra, total } = compra;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${_id}</td>
            <td>${id_usuario}</td>
            <td>${fecha_compra}</td>
            <td>${total}</td>
            <td>
                <button class="btn color3 compra-details-btn"
                    data-_id="${_id}"
                    data-id_usuario="${id_usuario}"
                    data-fecha_compra="${fecha_compra}"
                    data-total="${total}">
                    Details
                </button>
            </td>
            <td><button class="btn color2">Edit</button></td>
            <td><button class="btn color5">Delete</button></td>
        `;
        container.appendChild(row);
    });

    document.querySelectorAll('.compra-details-btn').forEach(button => {
        button.addEventListener('click', showCompraDetails);
    });
}

async function showCompraDetails(event) {
    const button = event.currentTarget;

    const _id = button.getAttribute('data-_id');
    const id_usuario = button.getAttribute('data-id_usuario');
    const fecha_compra = button.getAttribute('data-fecha_compra');
    const total = button.getAttribute('data-total');

    let usuario;
    try {
        const response = await fetch(`https://backendrender-qfuu.onrender.com/api/compras/usuario/${id_usuario}`);
        usuario = await response.json();
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        alert("No se pudo obtener la información del usuario.");
        return;
    }

    const { nombre, cedula, email, telefono } = usuario.usuario; // ✅ Acceso correcto a los datos

    let modal = document.getElementById('compra-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'compra-details-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);

        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '20px';
        modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        modal.style.zIndex = '1000';
        modal.style.borderRadius = '8px';
        modal.style.maxWidth = '600px';
        modal.style.width = '90%';
    }

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="margin: 0;">Detalles de la Compra</h3>
            <button id="close-compra-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Campo</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Valor</th></tr>
            <tr><td style="padding:6px;">ID Compra</td><td style="padding:6px;">${_id}</td></tr>
            <tr><td style="padding:6px;">Fecha</td><td style="padding:6px;">${fecha_compra}</td></tr>
            <tr><td style="padding:6px;">Total</td><td style="padding:6px;">${total}</td></tr>
            <tr><td style="padding:6px;">Nombre Usuario</td><td style="padding:6px;">${nombre}</td></tr>
            <tr><td style="padding:6px;">Cédula Usuario</td><td style="padding:6px;">${cedula}</td></tr>
            <tr><td style="padding:6px;">Correo Usuario</td><td style="padding:6px;">${email}</td></tr>
            <tr><td style="padding:6px;">Teléfono Usuario</td><td style="padding:6px;">${telefono}</td></tr>
        </table>
    `;

    modal.style.display = 'block';

    document.getElementById('close-compra-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
