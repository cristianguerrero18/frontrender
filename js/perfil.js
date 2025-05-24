import { obtenerUsuarioPorId, editarUsuario } from "../apiConnection/consumeUsuarios.js";

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userNameElement = document.getElementById('user-name');
    const userButtonsContainer = document.getElementById('user-buttons');
    const editButton = document.getElementById('edit-btn');
    const profileContainer = document.getElementById('profile-container');

 

    userNameElement.textContent = currentUser.nombre;
    setupUserButtons();
    loadUserProfile();
    setupEditButton();

    async function loadUserProfile() {
        try {
            const userData = await obtenerUsuarioPorId(currentUser._id); // Usar _id en lugar de id
            console.log('Datos de usuario recibidos:', userData);

            if (!userData) {
                showError('No se encontraron datos del usuario.');
                return;
            }

            // Actualizar la UI con los datos del usuario
            document.getElementById('nombre').textContent = userData.nombre || 'No especificado';
            document.getElementById('email').textContent = userData.email || 'No especificado';
            document.getElementById('telefono').textContent = userData.telefono || 'No especificado';
            document.getElementById('cedula').textContent = userData.cedula || 'No especificado';
            document.getElementById('direccion').textContent = userData.direccion || 'No especificado';
            document.getElementById('password').textContent = '••••••••'; // No mostrar la contraseña real

            // Guardar valores originales para edición
            document.getElementById('nombre').dataset.originalValue = userData.nombre || '';
            document.getElementById('email').dataset.originalValue = userData.email || '';
            document.getElementById('telefono').dataset.originalValue = userData.telefono || '';
            document.getElementById('cedula').dataset.originalValue = userData.cedula || '';
            document.getElementById('direccion').dataset.originalValue = userData.direccion || '';
            document.getElementById('password').dataset.originalValue = userData.password || '';

            // Actualizar datos en localStorage
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            userNameElement.textContent = updatedUser.nombre;

        } catch (error) {
            console.error('Error al cargar perfil:', error);
            showError('Error al cargar los datos del usuario. Intenta nuevamente.');
        }
    }

    function setupEditButton() {
        editButton.addEventListener('click', function() {
            if (editButton.innerHTML.includes('Editar')) {
                enableEditMode();
            } else {
                saveChanges();
            }
        });
    }

    function enableEditMode() {
        editButton.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
        editButton.classList.remove('btn-primary');
        editButton.classList.add('btn-success');

        const fields = ['nombre', 'email', 'telefono', 'cedula', 'direccion', 'password'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            const originalValue = element.dataset.originalValue || '';
            
            if (fieldId === 'password') {
                element.innerHTML = `
                    <div class="input-group input-group-sm w-auto">
                        <input type="password"
                               class="form-control"
                               id="edit-${fieldId}"
                               value="${originalValue}"
                               placeholder="Nueva contraseña (dejar en blanco para no cambiar)">
                        <button class="btn btn-outline-secondary" type="button" id="toggle-${fieldId}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                `;

                document.getElementById(`toggle-${fieldId}`).addEventListener('click', () => {
                    const input = document.getElementById(`edit-${fieldId}`);
                    const icon = document.querySelector(`#toggle-${fieldId} i`);
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                });
            } else {
                element.innerHTML = `
                    <input type="${fieldId === 'email' ? 'email' : 'text'}" 
                           class="form-control form-control-sm d-inline-block w-auto" 
                           id="edit-${fieldId}" 
                           value="${originalValue}"
                           ${fieldId === 'email' ? 'readonly' : ''}>
                `;
            }
        });

        if (!document.getElementById('cancel-btn')) {
            const cancelButton = document.createElement('button');
            cancelButton.id = 'cancel-btn';
            cancelButton.className = 'btn btn-outline-secondary ms-2';
            cancelButton.innerHTML = '<i class="bi bi-x-circle me-2"></i>Cancelar';
            cancelButton.addEventListener('click', cancelEdit);
            editButton.parentNode.appendChild(cancelButton);
        }
    }

    async function saveChanges() {
        try {
            const updatedData = {
                nombre: document.getElementById('edit-nombre').value,
                email: document.getElementById('edit-email').value,
                telefono: document.getElementById('edit-telefono').value,
                cedula: document.getElementById('edit-cedula').value,
                direccion: document.getElementById('edit-direccion').value
            };

            // Solo actualizar la contraseña si se proporcionó un nuevo valor
            const newPassword = document.getElementById('edit-password').value;
            if (newPassword && newPassword.trim() !== '') {
                updatedData.password = newPassword;
            }

            if (!updatedData.nombre || !updatedData.email) {
                throw new Error('Nombre y email son campos obligatorios');
            }

            editButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            editButton.disabled = true;

            // Usar _id para la actualización
            const updatedUser = await editarUsuario(currentUser._id, updatedData);

            if (!updatedUser || !updatedUser._id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            // Actualizar localStorage con los nuevos datos
            const mergedUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('currentUser', JSON.stringify(mergedUser));

            showSuccess('Perfil actualizado correctamente');

            cancelEdit();
            await loadUserProfile();

        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            showError(error.message || 'Error al actualizar el perfil');
            editButton.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
            editButton.disabled = false;
        }
    }

    function cancelEdit() {
        editButton.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Perfil';
        editButton.classList.remove('btn-success');
        editButton.classList.add('btn-primary');
        editButton.disabled = false;

        const cancelButton = document.getElementById('cancel-btn');
        if (cancelButton) {
            cancelButton.remove();
        }

        const fields = ['nombre', 'email', 'telefono', 'cedula', 'direccion', 'password'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            const originalValue = element.dataset.originalValue || 'No especificado';
            element.textContent = fieldId === 'password' ? '••••••••' : originalValue;
        });
    }

    function showError(message) {
        const existingAlert = document.querySelector('.alert-danger');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mb-4';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const cardHeader = document.querySelector('.profile-header');
        cardHeader.parentNode.insertBefore(alertDiv, cardHeader.nextSibling);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function showSuccess(message) {
        const existingAlert = document.querySelector('.alert-success');
        if (existingAlert) existingAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mb-4';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const cardHeader = document.querySelector('.profile-header');
        cardHeader.parentNode.insertBefore(alertDiv, cardHeader.nextSibling);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function setupUserButtons() {
        userButtonsContainer.innerHTML = `
            <button id="logout-btn" class="btn btn-outline-light btn-sm">
                <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
            </button>
        `;

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
});