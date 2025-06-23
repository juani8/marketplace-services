const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento categoria.crear cuando se crea una nueva categoría
 * @param {Object} categoria - La categoría creada
 */
async function publishCategoriaCreated(categoria) {
  const eventPayload = {
    timestamp: getTimestamp(),
    categoria: {
      categoria_id: categoria.categoria_id,
      tenant_id: categoria.tenant_id,
      nombre: categoria.nombre
    }
  };

  await publishEvent('categoria.creada', eventPayload);
}

module.exports = {
  publishCategoriaCreated
};
