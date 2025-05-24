const url = "https://backendrender-qfuu.onrender.com/api/usuarios/"; 

// Obtener todos los usuarios
export const obtenerUsuarios = async () => {
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error(`HTTP error! status: ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error; 
    }
};

// Crear un nuevo usuario
export const crearUsuario = async (usuario) => {
    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario),
        });
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw error;
    }
};

export const obtenerUsuarioPorId = async (id) => {
    try {
        const respuesta = await fetch(`${url}${id}`);
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || "Error al obtener usuario");
        }
        return await respuesta.json();
    } catch (error) {
        console.error(`Error al obtener usuario con ID ${id}:`, error);
        throw error;
    }
};

export const eliminarUsuario = async (id) => {
    try {
        const respuesta = await fetch(`${url}${id}`, {
            method: "DELETE",
        });
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${respuesta.status}`);
        }
        return await respuesta.text();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw error;
    }
};

export const editarUsuario = async (id, usuario) => {
    try {
        const respuesta = await fetch(`${url}${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario),
        });
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${respuesta.status}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error(`Error al editar usuario con ID ${id}:`, error);
        throw error;
    }
};

// Obtener ID por email
export const obtenerIdPorEmail = async (email) => {
    try {
        const respuesta = await fetch(`${url}email/${encodeURIComponent(email)}`);
        const result = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(result.message || "Error al buscar ID por email");
        }
        return result.id;
    } catch (error) {
        console.error("Error al obtener ID por email:", error);
        throw error;
    }
};

export const obtenerUsuariosPorNombre = async (nombre) => {
    try {
        const respuesta = await fetch(`${url}nombre/${encodeURIComponent(nombre)}`);
        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || "No se encontraron usuarios con ese nombre");
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Error al buscar usuarios por nombre:", error);
        throw error;
    }
};

export const loginUsuario = async (email, password) => {
    try {
        const respuesta = await fetch(`${url}login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || "Error en el login: Credenciales inválidas o problema del servidor.");
        }

        return await respuesta.json(); 
    } catch (error) {
        console.error("Error al hacer login:", error);
        throw error;
    }
};