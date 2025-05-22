const ProductoModel = require('../models/producto.model');
const CategoriaModel = require('../models/categoria.model');

async function formatearProductos(productos) {
  const productosFormateados = [];

  for (const producto of productos) {
    try {
      const imagenes = await ProductoModel.getImagenes(producto.producto_id) || [];
      const promociones = await ProductoModel.getPromociones(producto.producto_id) || [];

      const categoria = producto.categoria_id
        ? await CategoriaModel.getById(producto.categoria_id)
        : null;

      const promocionesFormateadas = promociones.map(promo => ({
        promocion_id: promo.promocion_id?.toString() || "",
        nombre: promo.nombre || "",
        tipo_promocion: promo.tipo_promocion || "",
        valor_descuento: parseFloat(promo.valor_descuento) || 0,
        fecha_inicio: promo.fecha_inicio || null,
        fecha_fin: promo.fecha_fin || null,
        productos_incluidos: [String(producto.producto_id)]
      }));

      productosFormateados.push({
        producto_id: String(producto.producto_id),
        nombre_producto: producto.nombre_producto || "",
        descripcion: producto.descripcion || "",
        precio: parseFloat(producto.precio) || 0,
        cantidad_stock: producto.cantidad_stock || 0,
        categoria: categoria ? {
          categoria_id: String(categoria.categoria_id),
          nombre: categoria.nombre,
          descripcion: categoria.descripcion
        } : null,
        imagenes,
        promociones: promocionesFormateadas
      });
    } catch (error) {
      console.error('Error formateando producto:', producto, error);
    }
  }

  return productosFormateados;
}

module.exports = {
  formatearProductos
};
