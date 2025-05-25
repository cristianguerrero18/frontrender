import {
    obtenerUsuarios,
    crearUsuario,
    obtenerUsuarioPorId,
    eliminarUsuario,
    editarUsuario,
    obtenerIdPorEmail, 
    obtenerUsuariosPorNombre,
    loginUsuario
} from '../apiConnection/consumeUsuarios.js';

console.log('¡login.js script cargado!');

const API_BASE_URL_FOR_DIRECT_EMAIL_LOOKUP = 'https://backendrender-qfuu.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', function() {
    console.log('¡DOMContentLoaded ha disparado! El script principal está ejecutándose.');

    // Referencias a elementos del DOM
    const roleSelection = document.getElementById('role-selection');
    const adminOption = document.getElementById('admin-option');
    const clientOption = document.getElementById('client-option');
    const clientForm = document.getElementById('client-form');
    const registerForm = document.getElementById('register-form');
    const adminForm = document.getElementById('admin-form');
    const registerLink = document.getElementById('register-link');
    const backFromClient = document.getElementById('back-from-client');
    const backFromRegister = document.getElementById('back-from-register');
    const backFromAdmin = document.getElementById('back-from-admin');

    // Elementos de formulario
    const clientLoginForm = document.getElementById('client-login-form');
    const clientRegisterForm = document.getElementById('client-register-form');
    const adminLoginForm = document.getElementById('admin-login-form');

    // Elementos de mensajes
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Credenciales de administrador (solo para desarrollo)
    const ADMIN_CREDENTIALS = {
        email: "admin@movilescf.com",
        password: "admin123"
    };

    // Verificar parámetros de error en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'unauthorized') {
        showError('Acceso no autorizado. Solo los administradores pueden acceder al panel.');
    }

    // Note: getUsuarioPorCorreo is now less relevant since we're doing a direct fetch in handleClientLogin
    const getUsuarioPorCorreo = async (email) => {
        try {
            const userId = await obtenerIdPorEmail(email);
            console.log(`[getUsuarioPorCorreo] ID de usuario recibido para ${email}:`, userId);
            return userId;
        } catch (error) {
            console.error("Error al obtener ID de usuario por correo:", error);
            showError(`Error al obtener ID por correo: ${error.message}`);
            throw error;
        }
    };

    // Event Listeners para la navegación entre formularios
    if (adminOption) {
        adminOption.addEventListener('click', function() {
            console.log('Clic en Administrador.');
            roleSelection.style.display = 'none';
            adminForm.style.display = 'block';
            clearMessages();
        });
    }

    if (clientOption) {
        clientOption.addEventListener('click', showClientForm);
    }
    if (registerLink) {
        registerLink.addEventListener('click', showRegisterForm);
    }
    if (backFromClient) {
        backFromClient.addEventListener('click', showRoleSelection);
    }
    if (backFromRegister) {
        backFromRegister.addEventListener('click', showClientForm);
    }
    if (backFromAdmin) {
        backFromAdmin.addEventListener('click', showRoleSelection);
    }

    // Event listeners para el envío de formularios
    if (clientLoginForm) {
        clientLoginForm.addEventListener('submit', handleClientLogin);
        console.log('clientLoginForm listener añadido.');
    }

    if (clientRegisterForm) {
        clientRegisterForm.addEventListener('submit', handleClientRegister);
        console.log('clientRegisterForm listener añadido.');
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
        console.log('adminLoginForm listener añadido.');
    }

    // Funciones para mostrar/ocultar formularios
    function showClientForm() {
        console.log('Mostrando formulario de cliente.');
        if (roleSelection) roleSelection.style.display = 'none';
        if (clientForm) clientForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (adminForm) adminForm.style.display = 'none';
        clearMessages();
    }

    function showRegisterForm(e) {
        if (e) e.preventDefault();
        console.log('Mostrando formulario de registro.');
        if (clientForm) clientForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (adminForm) adminForm.style.display = 'none';
        clearMessages();
    }

    function showRoleSelection() {
        console.log('Mostrando selección de rol.');
        if (clientForm) clientForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (adminForm) adminForm.style.display = 'none';
        if (roleSelection) roleSelection.style.display = 'flex';
        clearMessages();
    }

    function clearMessages() {
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.classList.add('d-none');
            errorMessage.classList.remove('alert', 'alert-danger');
        }
        if (successMessage) {
            successMessage.textContent = '';
            successMessage.classList.add('d-none');
            successMessage.classList.remove('alert', 'alert-success');
        }
    }

    // --- LOGIN ADMINISTRADOR ---
    async function handleAdminLogin(e) {
        e.preventDefault();
        clearMessages();
        console.log('Intentando login de administrador...');

        const email = document.getElementById('admin-email')?.value;
        const password = document.getElementById('admin-password')?.value;

        if (!email || !password) {
            showError('Por favor, ingresa el email y la contraseña del administrador.');
            return;
        }

        try {
            if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
                const adminId = "admin_id";
                console.log(`[handleAdminLogin] ID de administrador recibido (hardcodeado): ${adminId}`);

                const userData = {
                    _id: adminId,
                    nombre: "Administrador",
                    email: ADMIN_CREDENTIALS.email,
                    tipo: "admin"
                };
                localStorage.setItem('currentUser', JSON.stringify(userData));

                // Set session expiration (2 minutes from now)
                const expirationTime = new Date().getTime() + 2 * 60 * 1000; // 2 minutes in milliseconds
                localStorage.setItem('sessionExpiration', expirationTime);

                window.location.href = 'admin.html';
            } else {
                throw new Error('Credenciales de administrador incorrectas');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showError(error.message);
        }
    }

    // --- LOGIN CLIENTE ---
    async function handleClientLogin(e) {
        e.preventDefault();
        clearMessages();
        console.log('Intentando login de cliente...');

        const email = document.getElementById('client-email')?.value;
        const password = document.getElementById('client-password')?.value;

        alert(`Bienvenido usuario \nEmail: ${email}`);

        if (!email || !password) {
            showError('Por favor, ingresa tu email y contraseña.');
            return;
        }

        let usuarioAutenticado = null;
        let userId = null;

        try {
            console.log(`[handleClientLogin] Intentando login con loginUsuario para: ${email}`);
            usuarioAutenticado = await loginUsuario(email, password);

            console.log('[handleClientLogin] Objeto de usuario recibido de loginUsuario (primera respuesta):', usuarioAutenticado);

            if (usuarioAutenticado && (usuarioAutenticado._id || usuarioAutenticado.id || usuarioAutenticado.id_usuario)) {
                userId = usuarioAutenticado._id || usuarioAutenticado.id || usuarioAutenticado.id_usuario;
                console.log(`%c[handleClientLogin] ID obtenido de la respuesta de loginUsuario: ${userId}`, 'color: green; font-weight: bold;');
            } else {
                console.warn('%c[handleClientLogin] ID no encontrado en la respuesta directa de loginUsuario. Intentando consulta por email...', 'color: orange; font-weight: bold;', usuarioAutenticado);
                
                try {
                    const emailLookupUrl = `${API_BASE_URL_FOR_DIRECT_EMAIL_LOOKUP}/usuarios/email/${encodeURIComponent(email)}`;
                    console.log(`[handleClientLogin] Realizando consulta directa a: ${emailLookupUrl}`);
                    
                    const response = await fetch(emailLookupUrl);
                    if (!response.ok) {
                        const errorDetail = await response.text();
                        throw new Error(`Error ${response.status} al obtener usuario por email: ${errorDetail}`);
                    }
                    const dataFromEmailLookup = await response.json();

                    console.log('[handleClientLogin] Datos recibidos de la consulta por email:', dataFromEmailLookup);

                    if (dataFromEmailLookup && (dataFromEmailLookup._id || dataFromEmailLookup.id || dataFromEmailLookup.id_usuario)) {
                        userId = dataFromEmailLookup._id || dataFromEmailLookup.id || dataFromEmailLookup.id_usuario;
                        usuarioAutenticado = dataFromEmailLookup;
                        console.log(`%c[handleClientLogin] ID de usuario obtenido de consulta por email: ${userId}`, 'color: green; font-weight: bold;');
                    } else {
                        throw new Error('No se encontró un ID válido en la consulta por email.');
                    }
                } catch (emailLookupError) {
                    console.error('[handleClientLogin] Fallo en la consulta directa por email:', emailLookupError);
                    showError(`Error al verificar usuario: ${emailLookupError.message}`);
                    throw new Error('Fallo de autenticación: No se pudo verificar el usuario.');
                }
            }

            if (!userId) {
                throw new Error('No se pudo obtener un ID de usuario válido después de todos los intentos.');
            }

            const userData = {
                _id: userId,
                nombre: usuarioAutenticado.nombre || 'Usuario Cliente',
                email: usuarioAutenticado.email || email,
                tipo: usuarioAutenticado.tipo || 'cliente'
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Set session expiration (2 minutes from now)
            const expirationTime = new Date().getTime() + 2 * 60 * 1000; // 2 minutes in milliseconds
            localStorage.setItem('sessionExpiration', expirationTime);

            console.log('[handleClientLogin] Login exitoso. Redirigiendo a cliente.html');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Login error (handleClientLogin):', error);
            showError(error.message || 'Error durante el proceso de login.');
        }
    }

    // --- REGISTRO CLIENTE ---
    async function handleClientRegister(e) {
        e.preventDefault();
        clearMessages();
        console.log('Intentando registro de cliente...');

        const nombre = document.getElementById('register-nombre')?.value;
        const email = document.getElementById('register-email')?.value;
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;
        const direccion = document.getElementById('register-direccion')?.value;
        const telefono = document.getElementById('register-telefono')?.value;
        const cedula = document.getElementById('register-cedula')?.value;

        if (!nombre || !email || !password || !confirmPassword || !direccion || !telefono || !cedula) {
            showError('Todos los campos son obligatorios.');
            return;
        }

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden.');
            return;
        }

        try {
            const nuevoUsuario = {
                nombre,
                email,
                password,
                direccion,
                telefono: parseInt(telefono),
                tipo: 'cliente',
                cedula: parseInt(cedula),
                fecha_registro: new Date().toISOString()
            };

            const usuarioCreado = await crearUsuario(nuevoUsuario);

            console.log('[handleClientRegister] Objeto de usuario recibido de crearUsuario:', usuarioCreado);

            if (!usuarioCreado || !usuarioCreado._id) {
                console.error('%c[handleClientRegister] ¡ERROR! El usuario creado no tiene un ID válido. Objeto recibido:', 'color: red; font-weight: bold;', usuarioCreado);
                throw new Error('Error en el registro: No se recibió un ID de usuario válido.');
            } else {
                console.log(`%c[handleClientRegister] ID del usuario registrado: ${usuarioCreado._id}`, 'color: green; font-weight: bold;');
            }

            localStorage.setItem('currentUser', JSON.stringify({
                _id: usuarioCreado._id,
                nombre: usuarioCreado.nombre,
                email: usuarioCreado.email,
                tipo: 'cliente'
            }));

            showSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
            clientRegisterForm.reset();
            setTimeout(() => showClientForm(), 1500);
        } catch (error) {
            console.error('Register error (handleClientRegister):', error);
            showError(error.message);
        }
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('d-none');
            errorMessage.classList.add('alert', 'alert-danger');
        }
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.remove('d-none');
            successMessage.classList.add('alert', 'alert-success');
        }
    }
});