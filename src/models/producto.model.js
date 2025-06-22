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
  async getProductsByTenantId(tenantId) {
    const res = await pool.query('SELECT * FROM productos WHERE tenant_id = $1', [tenantId]);
    return res.rows;
  },

  // Método para crear un nuevo producto
  async create(productoData) {
    try {
      const query = `
        INSERT INTO productos (
          tenant_id,
          nombre_producto, 
          descripcion, 
          precio, 
          cantidad_stock, 
          categoria_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      
      const values = [
        productoData.tenant_id,
        productoData.nombre_producto,
        productoData.descripcion,
        productoData.precio,
        productoData.cantidad_stock,
        productoData.categoria_id
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
      const validFields = ['nombre_producto', 'descripcion', 'precio', 'cantidad_stock', 'categoria_id'];
      const updates = Object.keys(productoData)
        .filter(key => validFields.includes(key) && productoData[key] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`);

      if (updates.length === 0) {
        return await this.getById(productoId); // Si no hay campos para actualizar, retornamos el producto actual
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
    const query = `
      SELECT p.*
      FROM promociones p
      INNER JOIN promociones_productos pp ON p.promocion_id = pp.promocion_id
      WHERE pp.producto_id = $1
    `;
    const res = await pool.query(query, [producto_id]);
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
  },

  // ============ CARGA MASIVA DE PRODUCTOS ============

  // Crear múltiples productos en una transacción
  async createBulk(productosData, tenantId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const productosCreados = [];
      const errores = [];

      for (let i = 0; i < productosData.length; i++) {
        const producto = productosData[i];
        
        try {
          // Validar datos requeridos
          if (!producto.nombre_producto || !producto.precio) {
            errores.push({
              fila: i + 2, // +2 porque fila 1 es header y arrays empiezan en 0
              error: 'nombre_producto y precio son requeridos'
            });
            continue;
          }

          // Validar precio
          const precio = parseFloat(producto.precio);
          if (isNaN(precio) || precio <= 0) {
            errores.push({
              fila: i + 2,
              error: 'precio debe ser un número mayor a 0'
            });
            continue;
          }

          // Validar categoria_id si se proporciona
          let categoriaId = null;
          if (producto.categoria_id) {
            categoriaId = parseInt(producto.categoria_id);
            if (isNaN(categoriaId)) {
              errores.push({
                fila: i + 2,
                error: 'categoria_id debe ser un número válido'
              });
              continue;
            }

            // Verificar que la categoría existe
            const categoriaCheck = await client.query(
              'SELECT categoria_id FROM categorias WHERE categoria_id = $1',
              [categoriaId]
            );
            
            if (categoriaCheck.rows.length === 0) {
              errores.push({
                fila: i + 2,
                error: `categoría con ID ${categoriaId} no existe`
              });
              continue;
            }
          }

          const query = `
            INSERT INTO productos (
              tenant_id,
              nombre_producto, 
              descripcion, 
              precio, 
              categoria_id
            ) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
          `;
          
          const values = [
            tenantId,
            producto.nombre_producto,
            producto.descripcion || null,
            precio,
            categoriaId
          ];

          const result = await client.query(query, values);
          productosCreados.push({
            fila: i + 2,
            producto: result.rows[0]
          });

        } catch (error) {
          console.error(`Error creando producto en fila ${i + 2}:`, error);
          errores.push({
            fila: i + 2,
            error: error.message
          });
        }
      }

      await client.query('COMMIT');
      
      return {
        productos_creados: productosCreados,
        errores: errores,
        total_procesados: productosData.length,
        total_exitosos: productosCreados.length,
        total_errores: errores.length
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en createBulk:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener categorías para validación
  async getCategorias() {
    try {
      const query = 'SELECT categoria_id, nombre FROM categorias ORDER BY nombre';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }
};

module.exports = ProductoModel;
