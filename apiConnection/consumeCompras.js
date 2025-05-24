const url = "https://backendrender-qfuu.onrender.com/api/compras"; 

/**
 * Obtiene todas las compras registradas.
 * @returns {Promise<Array>} Un array de objetos de compra.
 * @throws {Error} Si ocurre un error al obtener las compras.
 */
export const obtainCompras = async () => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al obtener compras: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en obtainCompras:", error);
    throw error;
  }
};

/**
 * Crea una nueva compra.
 * @param {object} datosCompra - Objeto con los datos de la compra {id_usuario: string, items: Array<{id_producto: string, cantidad: number}>}.
 * @returns {Promise<object>} Objeto con la compra creada y sus detalles.
 * @throws {Error} Si ocurre un error al procesar la compra.
 */
export const crearCompra = async (datosCompra) => {
  try {
    // Validación básica antes de enviar
    if (!datosCompra?.id_usuario || !Array.isArray(datosCompra?.items) || datosCompra.items.length === 0) {
      throw new Error("Datos de compra inválidos: se requiere id_usuario y al menos un item");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosCompra),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al procesar la compra");
    }

    return data;
  } catch (error) {
    console.error("Error en crearCompra:", error);
    throw error;
  }
};

/**
 * Obtiene una compra específica con sus detalles por su ID.
 * @param {string} idCompra - El ID de la compra a obtener.
 * @returns {Promise<object>} Objeto que contiene la compra y sus detalles.
 * @throws {Error} Si ocurre un error al obtener la compra.
 */
export const obtainCompraConDetalles = async (idCompra) => {
  try {
    if (!idCompra) throw new Error("ID de compra requerido");

    const response = await fetch(`${url}/${idCompra}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error al obtener la compra con detalles: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Error en obtainCompraConDetalles para ID ${idCompra}:`, error);
    throw error;
  }
};

/**
 * Obtiene todas las compras con sus detalles para un usuario específico.
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array>} Un array de objetos de compra, cada uno con sus detalles.
 * @throws {Error} Si ocurre un error al obtener las compras del usuario.
 */
export const obtainComprasConDetallesPorUsuario = async (idUsuario) => {
  try {
    if (!idUsuario) throw new Error("ID de usuario requerido");

    const response = await fetch(`${url}/usuario/${idUsuario}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener compras del usuario");
    }

    return data;
  } catch (error) {
    console.error(`Error en obtainComprasConDetallesPorUsuario para usuario ${idUsuario}:`, error);
    throw error;
  }
};