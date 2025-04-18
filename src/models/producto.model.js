const pool = require('../config/db');

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
  async create(producto) {
    const {
      catalogo_id,
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      categoria,
      imagenes
    } = producto;

    const res = await pool.query(
      `INSERT INTO productos 
        (catalogo_id, nombre_producto, descripcion, precio, cantidad_stock, categoria, imagenes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        catalogo_id,
        nombre_producto,
        descripcion,
        precio,
        cantidad_stock,
        categoria,
        imagenes
      ]
    );

    return res.rows[0];
  },

  // Método para actualizar un producto
  async update(id, updateData) {
    const {
      nombre_producto,
      descripcion,
      precio,
      cantidad_stock,
      categoria,
      imagenes
    } = updateData;

    const res = await pool.query(
      `UPDATE productos SET
        nombre_producto = $1,
        descripcion = $2,
        precio = $3,
        cantidad_stock = $4,
        categoria = $5,
        imagenes = $6
       WHERE producto_id = $7
       RETURNING *`,
      [nombre_producto, descripcion, precio, cantidad_stock, categoria, imagenes, id]
    );

    return res.rows[0];
  },

  // Método para eliminar un producto
  async delete(id) {
    await pool.query('DELETE FROM productos WHERE producto_id = $1', [id]);
  }
};

module.exports = ProductoModel;
