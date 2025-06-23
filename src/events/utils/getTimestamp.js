/**
 * Obtiene un timestamp en formato ISO 8601
 * @returns {string} Timestamp actual en formato ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

module.exports = {
  getTimestamp
}; 