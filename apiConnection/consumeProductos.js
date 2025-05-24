const url = "https://backendrender-qfuu.onrender.com/api/productos/";

// Obtener todos los productos
export const obtainProductos = async () => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }
    const productos = await response.json();
    return productos;
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    throw error;
  }
};

// Obtener un producto por su ID
export const obtainProductoPorId = async (id) => {
  try {
    const response = await fetch(`${url}${id}`);
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }
    return await response.json();
  } catch (error) {
    console.error("Error al obtener el producto:", error.message);
    throw error;
  }
};

// Agregar un nuevo producto
export const addProducto = async (producto) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al agregar producto:", error.message);
    throw error;
  }
};

// Eliminar un producto por ID
export const deleteProducto = async (id) => {
  try {
    const response = await fetch(`${url}${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }

    return await response.text();
  } catch (error) {
    console.error("Error al eliminar producto:", error.message);
    throw error;
  }
};

// Editar un producto por ID
export const updateProducto = async (id, producto) => {
  try {
    const response = await fetch(`${url}${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al actualizar producto:", error.message);
    throw error;
  }
};
