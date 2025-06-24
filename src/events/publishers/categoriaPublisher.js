const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento categoria.crear cuando se crea una nueva categoría
 * @param {Object} categoria - La categoría creada
 */
async function publishCategoriaCreated(categoria) {
  const payload = {
    categoria: {
      categoria_id: categoria.categoria_id,
      tenant_id: categoria.tenant_id,
      nombre: categoria.nombre
    },
    timestamp: getTimestamp(),
  };

  await publishEvent('categoria.creada', payload);
}

module.exports = {
  publishCategoriaCreated
};
