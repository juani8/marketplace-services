const multer = require('multer');

// Usar memoryStorage para archivos CSV
const storage = multer.memoryStorage();

// File filter to accept only CSV files
const csvFileFilter = (req, file, cb) => {
  // Verificar tanto el mimetype como la extensión del archivo
  const isCSV = file.mimetype === 'text/csv' || 
                file.mimetype === 'application/csv' ||
                file.originalname.toLowerCase().endsWith('.csv');
  
  if (isCSV) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos CSV. Por favor sube un archivo .csv'), false);
  }
};

const uploadCSV = multer({
  storage: storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit para CSV
    files: 1 // Solo un archivo a la vez
  }
});

module.exports = uploadCSV; 