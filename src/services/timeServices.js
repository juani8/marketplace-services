// Mapeo de días en español a números
const DIAS_SEMANA = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'miércoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
    'sábado': 6
  };
  
  // Mapeo inverso de números a días en español
  const DIAS_NUMEROS = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miércoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sábado'
  };
  
  /**
   * Formatea horarios para el frontend (convierte números de día a español)
   * @param {Array} horarios - Array de horarios desde la base de datos
   * @returns {Array} Horarios formateados con días en español
   */
  function formatearHorarios(horarios) {
    return horarios.map(horario => ({
      dia_semana: DIAS_NUMEROS[horario.dia_semana],
      hora_apertura: horario.hora_apertura || null,
      hora_cierre: horario.hora_cierre || null,
      estado: horario.estado
    }));
  }
  
  /**
   * Valida el formato y estructura de horarios del frontend
   * @param {Array} horariosInput - Array de horarios desde el frontend
   * @returns {Object} { valid: boolean, errores?: Array, horarios?: Array }
   */
  function validarHorarios(horariosInput) {
    if (!horariosInput || !Array.isArray(horariosInput)) {
      return { valid: true, horarios: [] }; // Opcional, no es error
    }
  
    const errores = [];
    const diasEncontrados = new Set();
  
    // Validar cada horario
    for (let i = 0; i < horariosInput.length; i++) {
      const horario = horariosInput[i];
      
      // Validar estructura básica
      if (!horario || typeof horario !== 'object') {
        errores.push(`Horario en posición ${i}: debe ser un objeto`);
        continue;
      }
  
      // Validar día de semana
      if (!horario.dia_semana || typeof horario.dia_semana !== 'string') {
        errores.push(`Horario en posición ${i}: dia_semana es requerido y debe ser string`);
        continue;
      }
  
      const diaLower = horario.dia_semana.toLowerCase().trim();
      if (!DIAS_SEMANA.hasOwnProperty(diaLower)) {
        errores.push(`Horario en posición ${i}: "${horario.dia_semana}" no es un día válido. Debe ser: domingo, lunes, martes, miércoles, jueves, viernes, sábado`);
        continue;
      }
  
      // Verificar días duplicados
      if (diasEncontrados.has(diaLower)) {
        errores.push(`Día duplicado: "${horario.dia_semana}"`);
        continue;
      }
      diasEncontrados.add(diaLower);
  
      // Validar horarios
      const { hora_apertura, hora_cierre } = horario;
  
      // Si hay horarios, ambos deben estar presentes
      if ((hora_apertura && !hora_cierre) || (!hora_apertura && hora_cierre)) {
        errores.push(`Día "${horario.dia_semana}": debe proporcionar tanto hora_apertura como hora_cierre, o ninguna de las dos (para días cerrados)`);
        continue;
      }
  
      // Validar formato de horas si están presentes
      if (hora_apertura && hora_cierre) {
        if (!validarFormatoHora(hora_apertura)) {
          errores.push(`Día "${horario.dia_semana}": hora_apertura "${hora_apertura}" no tiene formato válido. Use formato HH:MM (ej: "08:30")`);
        }
        
        if (!validarFormatoHora(hora_cierre)) {
          errores.push(`Día "${horario.dia_semana}": hora_cierre "${hora_cierre}" no tiene formato válido. Use formato HH:MM (ej: "22:00")`);
        }
  
        // Validar que apertura sea antes que cierre
        if (validarFormatoHora(hora_apertura) && validarFormatoHora(hora_cierre)) {
          if (compararHoras(hora_apertura, hora_cierre) >= 0) {
            errores.push(`Día "${horario.dia_semana}": hora_apertura "${hora_apertura}" debe ser anterior a hora_cierre "${hora_cierre}"`);
          }
        }
      }
    }
  
    if (errores.length > 0) {
      return { valid: false, errores };
    }
  
    return { valid: true, horarios: horariosInput };
  }
  
  /**
   * Valida formato de hora (HH:MM)
   * @param {string} hora - Hora en formato string
   * @returns {boolean} True si el formato es válido
   */
  function validarFormatoHora(hora) {
    if (!hora || typeof hora !== 'string') return false;
    
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(hora.trim());
  }
  
  /**
   * Compara dos horas en formato HH:MM
   * @param {string} h1 - Primera hora
   * @param {string} h2 - Segunda hora
   * @returns {number} -1 si h1 < h2, 0 si iguales, 1 si h1 > h2
   */
  function compararHoras(h1, h2) {
    const [h1_horas, h1_minutos] = h1.split(':').map(Number);
    const [h2_horas, h2_minutos] = h2.split(':').map(Number);
    
    const tiempo1 = h1_horas * 60 + h1_minutos;
    const tiempo2 = h2_horas * 60 + h2_minutos;
    
    return tiempo1 - tiempo2;
  }
  
  /**
   * Crea horarios completos para toda la semana (incluye días cerrados con NULL)
   * @param {Array} horariosInput - Horarios proporcionados del frontend
   * @returns {Array} Array con horarios para los 7 días de la semana
   */
  function crearHorariosCompletos(horariosInput) {
    const horariosMap = new Map();
    
    // Agregar horarios proporcionados
    if (horariosInput && Array.isArray(horariosInput)) {
      horariosInput.forEach(horario => {
        const diaNumero = DIAS_SEMANA[horario.dia_semana.toLowerCase().trim()];
        horariosMap.set(diaNumero, {
          dia_semana: diaNumero,
          hora_apertura: horario.hora_apertura || null,
          hora_cierre: horario.hora_cierre || null,
          estado: horario.estado || 'activo'
        });
      });
    }
  
    // Completar días faltantes como cerrados (NULL)
    const horariosCompletos = [];
    for (let dia = 0; dia <= 6; dia++) {
      if (horariosMap.has(dia)) {
        horariosCompletos.push(horariosMap.get(dia));
      } else {
        horariosCompletos.push({
          dia_semana: dia,
          hora_apertura: null,
          hora_cierre: null,
          estado: 'activo'
        });
      }
    }
  
    return horariosCompletos;
  }
  
  /**
   * Parsea horarios del frontend a formato de base de datos
   * @param {Array} horariosInput - Horarios desde el frontend
   * @returns {Array} Horarios parseados para la base de datos
   */
  function parsearHorarios(horariosInput) {
    if (!horariosInput || !Array.isArray(horariosInput)) {
      return [];
    }
  
    return horariosInput.map(horario => {
      const diaNumero = DIAS_SEMANA[horario.dia_semana?.toLowerCase()];
      
      if (diaNumero === undefined) {
        throw new Error(`Día de semana inválido: ${horario.dia_semana}. Debe ser: domingo, lunes, martes, miércoles, jueves, viernes, sábado`);
      }
  
      return {
        dia_semana: diaNumero,
        hora_apertura: horario.hora_apertura || null,
        hora_cierre: horario.hora_cierre || null,
        estado: horario.estado || 'activo'
      };
    });
  }
  
  /**
   * Obtiene el nombre del día en español dado un número
   * @param {number} diaNumero - Número del día (0-6)
   * @returns {string} Nombre del día en español
   */
  function obtenerNombreDia(diaNumero) {
    return DIAS_NUMEROS[diaNumero] || null;
  }
  
  /**
   * Obtiene el número del día dado un nombre en español
   * @param {string} nombreDia - Nombre del día en español
   * @returns {number} Número del día (0-6) o null si no es válido
   */
  function obtenerNumeroDia(nombreDia) {
    if (!nombreDia || typeof nombreDia !== 'string') return null;
    return DIAS_SEMANA[nombreDia.toLowerCase().trim()] ?? null;
  }
  
  module.exports = {
    formatearHorarios,
    validarHorarios,
    validarFormatoHora,
    compararHoras,
    crearHorariosCompletos,
    parsearHorarios,
    obtenerNombreDia,
    obtenerNumeroDia,
    DIAS_SEMANA,
    DIAS_NUMEROS
  };