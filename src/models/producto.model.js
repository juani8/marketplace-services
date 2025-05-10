const pool = require('../config/db_connection');

const ProductoModel = {
  // Método para obtener todos los productos
  async getAll() {
    const res = await pool.query('SELECT * FROM productos');
    return res.rows;
  },

  // Método para obtener un producto por ID
  async getById(id) {
    const res = await pool.query('SELECT * FROM productos WHERE producto_id = $1', [id]);
    return res.rows[0];
  },

  // Método para obtener productos por catalogo_id
  async getByCatalogoId(catalogo_id) {
    const res = await pool.query('SELECT * FROM productos WHERE catalogo_id = $1', [catalogo_id]);
    return res.rows;
  },

  // Método para crear un nuevo producto
  async create(productoData) {
    try {
      const query = `
        INSERT INTO productos (
          catalogo_id, 
          nombre_producto, 
          descripcion, 
          precio, 
          cantidad_stock, 
          categoria
        ) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      
      const values = [
        productoData.catalogo_id,
        productoData.nombre_producto,
        productoData.descripcion,
        productoData.precio,
        productoData.cantidad_stock,
        productoData.categoria
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en create producto:', error);
      throw error;
    }
  },

  // Método para actualizar un producto
  async update(productoId, updateData) {
    try {
      // Extraemos imagenes del updateData para no intentar actualizarlas en la tabla productos
      const { imagenes, ...productoData } = updateData;

      // Construimos la query dinámicamente solo con los campos válidos
      const validFields = ['nombre_producto', 'descripcion', 'precio', 'cantidad_stock', 'categoria'];
      const updates = Object.keys(productoData)
        .filter(key => validFields.includes(key) && productoData[key] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`);

      if (updates.length === 0) {
        return await getById(productoId); // Si no hay campos para actualizar, retornamos el producto actual
      }

      const query = `
        UPDATE productos 
        SET ${updates.join(', ')} 
        WHERE producto_id = $1 
        RETURNING *
      `;

      const values = [productoId, ...Object.values(productoData)
        .filter((_, index) => validFields.includes(Object.keys(productoData)[index]))];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error en update producto:', error);
      throw error;
    }
  },

  // Método para eliminar un producto
  async delete(id) {
    await pool.query('DELETE FROM productos WHERE producto_id = $1', [id]);
  },

  // Método para obtener imágenes de un producto
  async getImagenes(producto_id) {
    const res = await pool.query('SELECT url FROM imagenes_producto WHERE producto_id = $1', [producto_id]);
    return res.rows.map(img => img.url);
  },

  // Método para obtener promociones de un producto
  async getPromociones(producto_id) {
    const res = await pool.query('SELECT * FROM promociones WHERE producto_id = $1', [producto_id]);
    return res.rows;
  },

  // Método para agregar una nueva imagen a un producto
  async addImagen(imagenData) {
    try {
      const query = `
        INSERT INTO imagenes_producto (producto_id, url)
        VALUES ($1, $2)
        RETURNING *
      `;
      const values = [imagenData.producto_id, imagenData.url];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error agregando imagen:', error);
      throw error;
    }
  },

  // Agregar función para eliminar imágenes existentes
  async deleteImagenes(productoId) {
    try {
      const query = 'DELETE FROM imagenes_producto WHERE producto_id = $1';
      await pool.query(query, [productoId]);
    } catch (error) {
      console.error('Error eliminando imágenes:', error);
      throw error;
    }
  }
};

module.exports = ProductoModel;
