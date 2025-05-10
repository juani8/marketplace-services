const ProductoModel = require('../models/producto.model');

// Función auxiliar para formatear productos con su información completa
async function formatearProductos(productos) {
  const productosFormateados = [];
  
  for (const producto of productos) {
    try {
      // Obtener imágenes y promociones usando los métodos del modelo
      const imagenes = await ProductoModel.getImagenes(producto.producto_id) || [];
      const promociones = await ProductoModel.getPromociones(producto.producto_id) || [];
      
      // Formatear las promociones con verificación de valores
      const promocionesFormateadas = promociones.map(promo => {
        if (!promo) return null;
        
        return {
          promocion_id: promo.promocion_id ? String(promo.promocion_id) : "",
          tenant_id: String(producto.catalogo_id), // Usamos catalogo_id en lugar de tenant_id
          nombre: promo.nombre || "",
          descripcion: promo.descripcion || "",
          tipo_promocion: promo.tipo_promocion || "",
          fecha_inicio: promo.fecha_inicio || null,
          fecha_fin: promo.fecha_fin || null,
          productos_incluidos: [String(producto.producto_id)],
          estado: promo.estado || "activa"
        };
      }).filter(promo => promo !== null); // Eliminar valores nulos
      
      // Añadir el producto formateado
      productosFormateados.push({
        producto_id: String(producto.producto_id),
        nombre_producto: producto.nombre_producto || "",
        descripcion: producto.descripcion || "",
        precio: producto.precio || 0,
        cantidad_stock: producto.cantidad_stock || 0,
        categoria: producto.categoria || "",
        imagenes: imagenes,
        promociones: promocionesFormateadas
      });
    } catch (error) {
      console.error('Error formateando producto:', producto, error);
      // Continuar con el siguiente producto
    }
  }
  
  return productosFormateados;
}

module.exports = {
  formatearProductos
}; 