const publishEvent = require('../utils/publishEvent');
const { getTimestamp } = require('../utils/getTimestamp');

/**
 * Publica el evento categoria.crear cuando se crea una nueva categoría
 * @param {Object} categoria - La categoría creada
 */
async function publishCategoryCreated(category) {
  const payload = {
    categoria: {
      categoria_id: category.categoria_id,
      tenant_id: category.tenant_id,
      nombre: category.nombre
    },
    timestamp: getTimestamp(),
  };

  await publishEvent('categoria.creada', payload);
}

module.exports = {
  publishCategoryCreated
};
