
const url = "https://backendrender-qfuu.onrender.com/api/facturas/";

export const obtainFacturas = async () => {
    try {
        const resultado = await fetch(url);
        const facturas = await resultado.json();
        return facturas;
    } catch (error) {
        console.error("Error al obtener facturas:", error);
        throw error; 
    }
};

export const obtainFacturasPorUsuario = async (id_usuario) => {
    try {
        const resultado = await fetch(`${url}usuario/${id_usuario}`);
        const facturas = await resultado.json();
        return facturas;
    } catch (error) {
        console.error("Error al obtener facturas por usuario:", error);
        throw error; 
    }
};


export const crearFactura = async (facturaData) => {
    try {
        const resultado = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(facturaData),
        });

        if (!resultado.ok) {
            const errorData = await resultado.json();
            throw new Error(errorData.message || 'Error al crear la factura');
        }

        const nuevaFactura = await resultado.json();
        return nuevaFactura;
    } catch (error) {
        console.error("Error al crear factura:", error);
        throw error; 
    }
};

export const obtainFacturaPorId = async (id_factura) => {
    try {
        const resultado = await fetch(`${url}${id_factura}`); 
        
        if (!resultado.ok) {
            const errorData = await resultado.json();
            throw new Error(errorData.message || 'Error al obtener la factura por ID');
        }

        const factura = await resultado.json();
        return factura;
    } catch (error) {
        console.error(`Error al obtener factura con ID ${id_factura}:`, error);
        throw error; 
    }
};