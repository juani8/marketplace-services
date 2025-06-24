const pool = require('../config/db_connection');

const OrderModel = {
  /**
   * Obtiene todas las órdenes de un comercio específico
   * @param {number} comercioId - ID del comercio
   * @returns {Promise<Array>} Array de órdenes
   */
  async getByComercioId(comercioId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          orden_id,
          tenant_id,
          comercio_id,
          cliente_nombre,
          medios_pago,
          estado,
          total,
          direccion_entrega,
          fecha_creacion,
          fecha_actualizacion
        FROM ordenes 
        WHERE comercio_id = $1
        ORDER BY fecha_creacion DESC
      `;

      const result = await client.query(query, [comercioId]);
      return result.rows;

    } finally {
      client.release();
    }
  },

  /**
   * Obtiene una orden específica por su ID
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object|null>} Orden encontrada o null si no existe
   */
  async getById(orderId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          o.orden_id,
          o.tenant_id,
          o.comercio_id,
          o.cliente_nombre,
          o.medios_pago,
          o.estado,
          o.total,
          o.direccion_entrega,
          o.fecha_creacion,
          o.fecha_actualizacion
        FROM ordenes o
        WHERE o.orden_id = $1
      `;

      const result = await client.query(query, [orderId]);
      return result.rows[0] || null;

    } finally {
      client.release();
    }
  },

  /**
   * Busca órdenes en un rango de fechas
   * @param {string} fechaDesde - Fecha inicial en formato ISO
   * @param {string} fechaHasta - Fecha final en formato ISO
   * @returns {Promise<Array>} Lista de órdenes encontradas
   */
  async findByDateRange(fechaDesde, fechaHasta) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          orden_id,
          fecha_creacion,
          total
        FROM ordenes 
        WHERE fecha_creacion >= $1 
        AND fecha_creacion <= $2
        AND estado = 'finalizada'
        ORDER BY fecha_creacion ASC
      `;

      const result = await client.query(query, [fechaDesde, fechaHasta]);
      return result.rows;

    } catch (error) {
      console.error('Error al buscar órdenes por rango de fecha:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener totales de órdenes por tenant y rango de fechas
  async getTotalsByTenantAndDateRange(tenantId, fechaDesde, fechaHasta) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as cantidad_ordenes,
          COALESCE(SUM(total), 0) as monto_total,
          COALESCE(AVG(total), 0) as promedio_por_orden
        FROM ordenes 
        WHERE tenant_id = $1 
        AND fecha_creacion >= $2 
        AND fecha_creacion <= $3
        AND estado = 'finalizada'
      `;

      const result = await client.query(query, [tenantId, fechaDesde, fechaHasta]);
      return result.rows[0];

    } catch (error) {
      console.error('Error al obtener totales de órdenes:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener totales de órdenes por tenant
  async getTotalsByTenant(tenantId) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as cantidad_ordenes,
          COALESCE(SUM(total), 0) as monto_total,
          COALESCE(AVG(total), 0) as promedio_por_orden
        FROM ordenes 
        WHERE tenant_id = $1 
        AND estado = 'finalizada'
      `;

      const result = await client.query(query, [tenantId]);
      return result.rows[0];

    } catch (error) {
      console.error('Error al obtener totales de órdenes por tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener tenant_id de un comercio
  async getTenantIdByComercioId(comercioId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT tenant_id 
        FROM comercios 
        WHERE comercio_id = $1
      `;
      const result = await client.query(query, [comercioId]);
      return result.rows[0]?.tenant_id || null;
    } finally {
      client.release();
    }
  },

  // Validar stock de productos para un comercio
  async validateStock(comercioId, productos) {
    const client = await pool.connect();
    try {
      // Comenzar transacción
      await client.query('BEGIN');

      for (const producto of productos) {
        const stockQuery = `
          SELECT sc.cantidad_stock 
          FROM stock_comercio sc
          INNER JOIN productos p ON p.producto_id = sc.producto_id
          WHERE sc.comercio_id = $1 
          AND p.nombre = $2
          FOR UPDATE
        `;
        
        const stockResult = await client.query(stockQuery, [comercioId, producto.nombre]);
        
        if (stockResult.rows.length === 0 || stockResult.rows[0].cantidad_stock < producto.cant) {
          await client.query('ROLLBACK');
          return {
            success: false,
            message: `Stock insuficiente para el producto: ${producto.nombre}`
          };
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualizar stock de productos
  async updateStock(comercioId, productos, client) {
    try {
      for (const producto of productos) {
        const updateQuery = `
          UPDATE stock_comercio sc
          SET cantidad_stock = cantidad_stock - $1
          FROM productos p
          WHERE sc.producto_id = p.producto_id
          AND sc.comercio_id = $2 
          AND p.nombre = $3
        `;
        await client.query(updateQuery, [producto.cant, comercioId, producto.nombre]);
      }
    } catch (error) {
      throw error;
    }
  },

  // Obtener producto_id por nombre
  async getProductIdByName(nombre, client) {
    const query = `
      SELECT producto_id 
      FROM productos 
      WHERE nombre = $1
    `;
    const result = await client.query(query, [nombre]);
    return result.rows[0]?.producto_id;
  },

  // Crear nuevo pedido
  async create(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar el pedido principal
      const orderQuery = `
        INSERT INTO ordenes (
          orden_id,
          tenant_id,
          comercio_id,
          cliente_nombre,
          medios_pago,
          estado,
          total,
          direccion_entrega
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING orden_id
      `;

      const total = orderData.productos.reduce((sum, p) => sum + (p.subPrecio || 0), 0);
      
      const orderValues = [
        orderData.pedidoId,
        orderData.tenant_id,
        orderData.comercio_id,
        orderData.cliente_nombre,
        'fiat', // valor por defecto
        'pendiente',
        total,
        orderData.direccion_entrega
      ];

      const orderResult = await client.query(orderQuery, orderValues);

      // Insertar los productos del pedido
      for (const producto of orderData.productos) {
        const productQuery = `
          INSERT INTO ordenes_productos (
            orden_id,
            producto_id,
            precio_unitario,
            cantidad
          ) VALUES ($1, $2, $3, $4)
        `;

        const productValues = [
          orderData.pedidoId,
          producto.producto_id,
          producto.precio,
          producto.cant
        ];

        await client.query(productQuery, productValues);
      }

      // Actualizar el stock
      await this.updateStock(orderData.comercio_id, orderData.productos, client);

      await client.query('COMMIT');
      
      // Obtener la orden completa
      const finalQuery = `
        SELECT 
          o.*,
          json_agg(
            json_build_object(
              'producto_id', op.producto_id,
              'precio_unitario', op.precio_unitario,
              'cantidad', op.cantidad,
              'subtotal', op.subtotal
            )
          ) as productos
        FROM ordenes o
        LEFT JOIN ordenes_productos op ON o.orden_id = op.orden_id
        WHERE o.orden_id = $1
        GROUP BY o.orden_id
      `;
      
      const finalResult = await client.query(finalQuery, [orderData.pedidoId]);
      return finalResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = OrderModel; 