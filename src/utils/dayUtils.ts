/**
 * 🎯 UTILIDAD COMPARTIDA PARA MAPEO DE DÍAS
 * Esta función será utilizada tanto por AttendanceCalendarOptimized.vue como por TeacherHome.vue
 * para asegurar consistencia en el filtrado de clases por día
 */

/**
 * Mapea nombres de días a índices numéricos de manera robusta
 * @param dayString - Día como string o número
 * @returns Índice numérico del día en formato LUNES=0 (0=lunes, 1=martes, 2=miércoles, 3=jueves, 4=viernes, 5=sábado, 6=domingo) o -1 si no se reconoce
 */
export const getDayIndex = (dayString: string | number): number => {
  // Si ya es un número, retornarlo
  if (typeof dayString === 'number') return dayString;

  // 🔄 NUEVO MAPEO: Lunes=0, Domingo=6 (formato corregido para alineación)
  const dayMapping: Record<string, number> = {
    // Formato completo español - NUEVO MAPEO LUNES=0
    lunes: 0,
    martes: 1,
    miércoles: 2,
    jueves: 3,
    viernes: 4,
    sábado: 5,
    domingo: 6,
    Lunes: 0,
    Martes: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
    Domingo: 6,
    
    // Formato abreviado - NUEVO MAPEO LUNES=0
    lun: 0,
    mar: 1,
    mié: 2,
    jue: 3,
    vie: 4,
    sáb: 5,
    dom: 6,
    Lun: 0,
    Mar: 1,
    Mié: 2,
    Jue: 3,
    Vie: 4,
    Sáb: 5,
    Dom: 6,
    
    // Formato sin acentos (fallback) - NUEVO MAPEO LUNES=0
    miercoles: 2,
    sabado: 5,
    Miercoles: 2,
    Sabado: 5,
    
    // Inglés (por compatibilidad) - NUEVO MAPEO LUNES=0
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
    
    // Números como string - NUEVO MAPEO LUNES=0
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
  };

  // Normalizar: quitar espacios y convertir a string
  const normalized = String(dayString).trim();
  
  // Buscar en el mapeo directo
  if (normalized in dayMapping) {
    return dayMapping[normalized];
  }
  
  // Buscar en minúsculas como fallback
  const lowercased = normalized.toLowerCase();
  if (lowercased in dayMapping) {
    return dayMapping[lowercased];
  }
  
  // Log de warning para días no reconocidos
  console.warn(`⚠️ [getDayIndex] Día no reconocido: "${dayString}" (normalizado: "${normalized}")`);
  return -1;
};

/**
 * Verifica si una clase está programada para un día específico de la semana
 * @param classItem - Objeto de clase con estructura schedule
 * @param targetDayOfWeek - Día de la semana objetivo en formato LUNES=0 (0=lunes, 1=martes, 2=miércoles, 3=jueves, 4=viernes, 5=sábado, 6=domingo)
 * @returns true si la clase está programada para ese día
 */
export const isClassScheduledForDay = (classItem: any, targetDayOfWeek: number): boolean => {
  const schedule = classItem.schedule;
  if (!schedule) {
    console.log(`[isClassScheduledForDay] Clase "${classItem.name}": NO tiene schedule`);
    return false;
  }

  // Manejar diferentes estructuras de horario
  let slots = [];
  if (schedule.slots && Array.isArray(schedule.slots)) {
    slots = schedule.slots;
  } else if (schedule.day) {
    // Estructura legacy con day directo
    slots = [schedule];
  }

  console.log(
    `[isClassScheduledForDay] Clase "${classItem.name}": Verificando ${slots.length} slots para día ${targetDayOfWeek}`,
  );
  
  const hasMatchingDay = slots.some((slot: any) => {
    const slotDayIndex = getDayIndex(slot.day);
    const matches = slotDayIndex === targetDayOfWeek;
    console.log(
      `[isClassScheduledForDay]   Slot "${slot.day}" -> índice ${slotDayIndex}, día buscado ${targetDayOfWeek}: ${matches ? 'MATCH' : 'no match'}`,
    );
    return matches;
  });

  console.log(
    `[isClassScheduledForDay] Clase "${classItem.name}": Resultado final = ${hasMatchingDay}`,
  );
  return hasMatchingDay;
};

/**
 * Filtra clases del maestro que están programadas para un día específico
 * @param allClasses - Array de todas las clases
 * @param teacherId - ID del maestro
 * @param dayOfWeek - Día de la semana en formato LUNES=0 (0=lunes, 1=martes, 2=miércoles, 3=jueves, 4=viernes, 5=sábado, 6=domingo)
 * @returns Array de clases filtradas
 */
export const getClassesForTeacherOnDay = (
  allClasses: any[],
  teacherId: string,
  dayOfWeek: number,
): any[] => {
  console.log(`[getClassesForTeacherOnDay] === FILTRADO PARA DÍA ${dayOfWeek} ===`);
  console.log(`[getClassesForTeacherOnDay] Total clases: ${allClasses.length}`);
  console.log(`[getClassesForTeacherOnDay] TeacherId: ${teacherId}`);
  
  // 1. Clases donde el maestro es principal
  const primaryClasses = allClasses.filter((cls: any) => {
    const isPrimary = cls.teacherId === teacherId;
    const isScheduled = isClassScheduledForDay(cls, dayOfWeek);
    console.log(
      `[getClassesForTeacherOnDay] Clase "${cls.name}": isPrimary=${isPrimary}, isScheduled=${isScheduled}`,
    );
    return isPrimary && isScheduled;
  });

  // 2. Clases donde el maestro es colaborador
  const collaborativeClasses = allClasses.filter((cls: any) => {
    // Verificar si NO es el profesor principal (evitar duplicados)
    if (cls.teacherId === teacherId) return false;

    // Verificar si está en el array de teachers
    const isCollaborator = cls.teachers?.some((teacher: any) => {
      if (typeof teacher === 'string') {
        return teacher === teacherId;
      } else if (typeof teacher === 'object' && teacher.teacherId) {
        return teacher.teacherId === teacherId;
      }
      return false;
    });

    if (!isCollaborator) return false;

    const isScheduled = isClassScheduledForDay(cls, dayOfWeek);
    console.log(
      `[getClassesForTeacherOnDay] Clase compartida "${cls.name}": isCollaborator=${isCollaborator}, isScheduled=${isScheduled}`,
    );
    return isScheduled;
  });

  const totalClasses = [...primaryClasses, ...collaborativeClasses];
  console.log(
    `[getClassesForTeacherOnDay] Resultado: ${primaryClasses.length} principales + ${collaborativeClasses.length} compartidas = ${totalClasses.length} total`,
  );
  
  return totalClasses;
};
