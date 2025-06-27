const pool = require('../config/db_connection');

// Modelo de Comercios (Sellers)
const SellerModel = {
  
  // Obtener comercios por tenant con paginación
  async getByTenant(tenantId, page = 1, size = 10) {
    const offset = (page - 1) * size;
    
    try {
      // Consulta principal para obtener comercios
      const comerciosQuery = `
        SELECT 
          comercio_id,
          tenant_id,
          nombre,
          calle,
          numero,
          ciudad,
          provincia,
          codigo_postal,
          lat,
          lon
        FROM comercios
        WHERE tenant_id = $1
        ORDER BY comercio_id
        LIMIT $2 OFFSET $3
      `;
      
      // Consulta para contar total de comercios
      const countQuery = `
        SELECT COUNT(*) as total
        FROM comercios
        WHERE tenant_id = $1
      `;
      
      const [comerciosResult, countResult] = await Promise.all([
        pool.query(comerciosQuery, [tenantId, size, offset]),
        pool.query(countQuery, [tenantId])
      ]);
      
      return {
        data: comerciosResult.rows,
        totalItems: parseInt(countResult.rows[0].total)
      };
      
    } catch (error) {
      console.error('Error en getByTenant:', error);
      throw error;
    }
  },

  // Obtener un comercio por ID
  async getById(comercioId) {
    try {
      const query = `
        SELECT 
          comercio_id,
          tenant_id,
          nombre,
          calle,
          numero,
          ciudad,
          provincia,
          codigo_postal,
          lat,
          lon
        FROM comercios
        WHERE comercio_id = $1
      `;
      
      const result = await pool.query(query, [comercioId]);
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Error en getById:', error);
      throw error;
    }
  },

  // Crear un nuevo comercio
  async create(comercioData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insertar el comercio
      const insertQuery = `
        INSERT INTO comercios (tenant_id, nombre, calle, numero, ciudad, provincia, codigo_postal, lat, lon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const comercioResult = await client.query(insertQuery, [
        comercioData.tenant_id,
        comercioData.nombre,
        comercioData.calle,
        comercioData.numero,
        comercioData.ciudad,
        comercioData.provincia,
        comercioData.codigo_postal,
        comercioData.lat,
        comercioData.lon
      ]);
      
      const nuevoComercio = comercioResult.rows[0];
      
      // Asociar todos los usuarios admin del tenant al nuevo comercio
      const adminQuery = `
        INSERT INTO usuario_comercio (usuario_id, comercio_id)
        SELECT u.usuario_id, $1
        FROM usuarios_tenant u
        WHERE u.tenant_id = $2 AND u.rol = 'admin'
      `;
      
      await client.query(adminQuery, [nuevoComercio.comercio_id, comercioData.tenant_id]);
      
      await client.query('COMMIT');
      return nuevoComercio;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en create:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualización parcial de un comercio
  async patch(comercioId, updateFields) {
    try {
      const fields = Object.keys(updateFields);
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [comercioId, ...Object.values(updateFields)];
      
      const query = `
        UPDATE comercios
        SET ${setClause}
        WHERE comercio_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Comercio no encontrado');
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Error en patch:', error);
      throw error;
    }
  },

  // Eliminar un comercio
  async delete(comercioId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que el comercio existe
      const checkQuery = 'SELECT * FROM comercios WHERE comercio_id = $1';
      const checkResult = await client.query(checkQuery, [comercioId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Comercio no encontrado');
      }
      
      const comercio = checkResult.rows[0];
      
      // Eliminar el comercio (CASCADE eliminará horarios y relaciones automáticamente)
      const deleteQuery = 'DELETE FROM comercios WHERE comercio_id = $1';
      await client.query(deleteQuery, [comercioId]);
      
      await client.query('COMMIT');
      return comercio;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en delete:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Buscar comercios cercanos por geolocalización
  async findNearby(lat, lon, radiusKm) {
    try {
      const query = `
        WITH distancias AS (
          SELECT 
            c.comercio_id,
            c.tenant_id,
            c.nombre,
            c.calle,
            c.numero,
            c.ciudad,
            c.provincia,
            c.codigo_postal,
            c.lat,
            c.lon,
            t.nombre as tenant_nombre,
            t.razon_social,
            t.estado as tenant_estado,
            (6371 * acos(cos(radians($1)) * cos(radians(c.lat)) * cos(radians(c.lon) - radians($2)) + sin(radians($1)) * sin(radians(c.lat)))) AS distancia_km
          FROM comercios c
          INNER JOIN tenants t ON c.tenant_id = t.tenant_id
          WHERE c.lat IS NOT NULL 
            AND c.lon IS NOT NULL
            AND t.estado = 'activo'
        )
        SELECT *
        FROM distancias
        WHERE distancia_km <= $3
        ORDER BY distancia_km
      `;
      
      const result = await pool.query(query, [lat, lon, radiusKm]);
      return result.rows;
      
    } catch (error) {
      console.error('Error en findNearby:', error);
      throw error;
    }
  },

  // Obtener horarios de un comercio
  async getHorarios(comercioId) {
    try {
      const query = `
        SELECT 
          horario_id,
          comercio_id,
          dia_semana,
          hora_apertura,
          hora_cierre,
          estado
        FROM horarios_comercio
        WHERE comercio_id = $1
        ORDER BY dia_semana
      `;
      
      const result = await pool.query(query, [comercioId]);
      return result.rows;
      
    } catch (error) {
      console.error('Error en getHorarios:', error);
      throw error;
    }
  },

  // Actualizar todos los horarios de un comercio (reemplaza todos)
  async updateHorarios(comercioId, horarios) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Eliminar horarios existentes
      await client.query('DELETE FROM horarios_comercio WHERE comercio_id = $1', [comercioId]);
      
      // Insertar nuevos horarios
      for (const horario of horarios) {
        // Validar que si hay hora_apertura también haya hora_cierre
        if ((horario.hora_apertura && !horario.hora_cierre) || (!horario.hora_apertura && horario.hora_cierre)) {
          throw new Error('Debe proporcionar tanto hora_apertura como hora_cierre, o ninguna de las dos');
        }
        
        const insertQuery = `
          INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, estado)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(insertQuery, [
          comercioId,
          horario.dia_semana,
          horario.hora_apertura,
          horario.hora_cierre,
          horario.estado || 'activo'
        ]);
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en updateHorarios:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualizar horario de un día específico
  async updateHorario(comercioId, diaNumero, horaApertura, horaCierre, estado = 'activo') {
    try {
      // Validar que si hay hora_apertura también haya hora_cierre
      if ((horaApertura && !horaCierre) || (!horaApertura && horaCierre)) {
        throw new Error('Debe proporcionar tanto hora_apertura como hora_cierre, o ninguna de las dos');
      }
      
      const query = `
        INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, estado)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (comercio_id, dia_semana)
        DO UPDATE SET 
          hora_apertura = $3,
          hora_cierre = $4,
          estado = $5
        RETURNING *
      `;
      
      const result = await pool.query(query, [comercioId, diaNumero, horaApertura, horaCierre, estado]);
      return result.rows[0];
      
    } catch (error) {
      console.error('Error en updateHorario:', error);
      throw error;
    }
  },

  // Verificar si un usuario tiene acceso a un comercio
  async checkUserAccess(usuarioId, comercioId) {
    const res = await pool.query(
      `SELECT 1 FROM usuario_comercio 
       WHERE usuario_id = $1 AND comercio_id = $2`,
      [usuarioId, comercioId]
    );
    return res.rows.length > 0;
  },

  // ============ GESTIÓN DE PRODUCTOS Y STOCK ============

  // Obtener productos del comercio con su stock
  async getProductsWithStock(comercioId) {
    try {
      const query = `
        SELECT 
          p.producto_id,
          p.nombre_producto,
          p.descripcion,
          p.precio,
          p.categoria_id,
          p.fecha_creacion,
          COALESCE(sc.cantidad_stock, 0) as cantidad_stock,
          c.nombre as categoria_nombre
        FROM productos p
        INNER JOIN comercios co ON p.tenant_id = co.tenant_id
        LEFT JOIN stock_comercio sc ON p.producto_id = sc.producto_id AND sc.comercio_id = $1
        LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
        WHERE co.comercio_id = $1
        ORDER BY p.nombre_producto
      `;
      
      const result = await pool.query(query, [comercioId]);
      return result.rows;
      
    } catch (error) {
      console.error('Error en getProductsWithStock:', error);
      throw error;
    }
  },

  // Obtener stock específico de un producto en un comercio
  async getProductStock(comercioId, productoId) {
    try {
      const query = `
        SELECT 
          sc.comercio_id,
          sc.producto_id,
          sc.cantidad_stock,
          p.nombre_producto,
          co.nombre as comercio_nombre
        FROM stock_comercio sc
        INNER JOIN productos p ON sc.producto_id = p.producto_id
        INNER JOIN comercios co ON sc.comercio_id = co.comercio_id
        WHERE sc.comercio_id = $1 AND sc.producto_id = $2
      `;
      
      const result = await pool.query(query, [comercioId, productoId]);
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Error en getProductStock:', error);
      throw error;
    }
  },

  // Actualizar stock de un producto en un comercio
  async updateProductStock(comercioId, productoId, cantidadStock) {
    try {
      // Verificar que el producto pertenece al tenant del comercio
      const checkQuery = `
        SELECT 1
        FROM productos p
        INNER JOIN comercios c ON p.tenant_id = c.tenant_id
        WHERE p.producto_id = $1 AND c.comercio_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [productoId, comercioId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Producto no pertenece al tenant del comercio');
      }

      // Obtener stock anterior para comparación
      const stockAnteriorQuery = `
        SELECT COALESCE(cantidad_stock, 0) as cantidad_anterior
        FROM stock_comercio
        WHERE comercio_id = $1 AND producto_id = $2
      `;
      
      const stockAnteriorResult = await pool.query(stockAnteriorQuery, [comercioId, productoId]);
      const cantidadAnterior = stockAnteriorResult.rows[0]?.cantidad_anterior || 0;

      // Upsert del stock
      const query = `
        INSERT INTO stock_comercio (comercio_id, producto_id, cantidad_stock)
        VALUES ($1, $2, $3)
        ON CONFLICT (comercio_id, producto_id)
        DO UPDATE SET cantidad_stock = EXCLUDED.cantidad_stock
        RETURNING *
      `;
      
      const result = await pool.query(query, [comercioId, productoId, cantidadStock]);

      // Obtener información completa para el evento
      const infoCompletaQuery = `
        SELECT 
          sc.comercio_id,
          sc.producto_id,
          sc.cantidad_stock,
          p.nombre_producto,
          p.descripcion,
          p.precio,
          p.categoria_id,
          c.nombre as categoria_nombre,
          co.nombre as comercio_nombre,
          co.tenant_id,
          t.nombre as tenant_nombre
        FROM stock_comercio sc
        INNER JOIN productos p ON sc.producto_id = p.producto_id
        INNER JOIN comercios co ON sc.comercio_id = co.comercio_id
        INNER JOIN tenants t ON co.tenant_id = t.tenant_id
        LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
        WHERE sc.comercio_id = $1 AND sc.producto_id = $2
      `;
      
      const infoResult = await pool.query(infoCompletaQuery, [comercioId, productoId]);
      const stockActualizado = infoResult.rows[0];
      
      // Agregar cantidad anterior al resultado
      stockActualizado.cantidad_anterior = cantidadAnterior;
      
      return stockActualizado;
      
    } catch (error) {
      console.error('Error en updateProductStock:', error);
      throw error;
    }
  },
  async getByUser(usuarioId, page = 1, size = 10) {
    const offset = (page - 1) * size;
  
    try {
      const comerciosQuery = `
        SELECT c.*
        FROM usuario_comercio uc
        INNER JOIN comercios c ON uc.comercio_id = c.comercio_id
        WHERE uc.usuario_id = $1
        ORDER BY c.comercio_id
        LIMIT $2 OFFSET $3
      `;
  
      const countQuery = `
        SELECT COUNT(*) as total
        FROM usuario_comercio uc
        INNER JOIN comercios c ON uc.comercio_id = c.comercio_id
        WHERE uc.usuario_id = $1
      `;
  
      const [comerciosResult, countResult] = await Promise.all([
        pool.query(comerciosQuery, [usuarioId, size, offset]),
        pool.query(countQuery, [usuarioId])
      ]);
  
      return {
        data: comerciosResult.rows,
        totalItems: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      console.error('Error en getByUser:', error);
      throw error;
    }
  },

  // Verificar si un usuario tiene acceso a un comercio específico
  async hasUserAccessToComercio(usuarioId, comercioId) {
    try {
      const query = `
        SELECT 1 
        FROM usuario_comercio uc
        WHERE uc.usuario_id = $1 AND uc.comercio_id = $2
      `;
      
      const result = await pool.query(query, [usuarioId, comercioId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error en hasUserAccessToComercio:', error);
      throw error;
    }
  },
  
};

module.exports = SellerModel; 