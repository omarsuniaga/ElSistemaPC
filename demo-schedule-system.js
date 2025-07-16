// Demostración en vivo del sistema de horarios
// Ejecutar en la consola del navegador desde la vista de horarios

window.demoScheduleSystem = {
  // Datos de ejemplo más realistas
  sampleClasses: [
    {
      id: 'piano_basico_a',
      name: 'Piano Básico A',
      teacher: 'María González',
      instrument: 'Piano',
      program: 'Básico',
      students: ['Ana Pérez', 'Luis Torres'],
      schedule: {
        slots: [
          { day: 'lunes', startTime: '08:00', endTime: '09:00' },
          { day: 'miércoles', startTime: '08:00', endTime: '09:00' },
        ],
      },
    },
    {
      id: 'guitarra_intermedio',
      name: 'Guitarra Intermedio',
      teacher: 'Carlos Ruiz',
      instrument: 'Guitarra',
      program: 'Intermedio',
      students: ['Pedro López', 'Sofia Martín'],
      schedule: {
        slots: [
          { day: 'martes', startTime: '15:30', endTime: '16:30' },
          { day: 'jueves', startTime: '15:30', endTime: '16:30' },
        ],
      },
    },
    {
      id: 'violin_avanzado',
      name: 'Violín Avanzado',
      teacher: 'Elena Vásquez',
      instrument: 'Violín',
      program: 'Avanzado',
      students: ['Carmen Silva', 'Diego Ramos'],
      schedule: {
        slots: [
          { day: 'lunes', startTime: '19:00', endTime: '20:00' },
          { day: 'viernes', startTime: '19:00', endTime: '20:00' },
        ],
      },
    },
    {
      id: 'piano_avanzado_noche',
      name: 'Piano Avanzado Nocturno',
      teacher: 'Roberto Chen',
      instrument: 'Piano',
      program: 'Avanzado',
      students: ['Laura García', 'Miguel Herrera'],
      schedule: {
        slots: [
          { day: 'martes', startTime: '20:30', endTime: '21:30' },
          { day: 'jueves', startTime: '20:30', endTime: '21:30' },
        ],
      },
    },
    {
      id: 'coro_infantil',
      name: 'Coro Infantil',
      teacher: 'Ana Morales',
      instrument: 'Voz',
      program: 'Básico',
      students: ['Pablo Jiménez', 'Isabella Cruz', 'Mateo Vargas'],
      schedule: {
        slots: [{ day: 'sábado', startTime: '10:00', endTime: '11:30' }],
      },
    },
    {
      id: 'bateria_rock',
      name: 'Batería Rock',
      teacher: 'Javier Metal',
      instrument: 'Batería',
      program: 'Intermedio',
      students: ['Alex Stone', 'Rita Thunder'],
      schedule: {
        slots: [
          { day: 'miércoles', startTime: '17:00', endTime: '18:00' },
          { day: 'viernes', startTime: '17:00', endTime: '18:00' },
        ],
      },
    },
  ],

  // Configuración de tiempo de ejemplo
  sampleTimeConfig: {
    morning: { enabled: true, start: '07:00', end: '14:00' },
    afternoon: { enabled: true, start: '14:00', end: '19:00' },
    night: { enabled: true, start: '19:00', end: '23:00' },
  },

  // Demostrar filtros en acción
  demonstrateFilters() {
    console.log('🎵 === DEMOSTRACIÓN DE FILTROS DE HORARIO ===');

    const classes = this.sampleClasses;

    // Categorizar clases por período
    const periods = {
      morning: [],
      afternoon: [],
      night: [],
    };

    classes.forEach((cls) => {
      cls.schedule.slots.forEach((slot) => {
        const hour = parseInt(slot.startTime.split(':')[0]);

        if (hour >= 7 && hour < 14) {
          periods.morning.push({ class: cls.name, time: slot.startTime, day: slot.day });
        } else if (hour >= 14 && hour < 19) {
          periods.afternoon.push({ class: cls.name, time: slot.startTime, day: slot.day });
        } else if (hour >= 19 && hour < 23) {
          periods.night.push({ class: cls.name, time: slot.startTime, day: slot.day });
        }
      });
    });

    console.log('🌅 CLASES DE MAÑANA (7am-2pm):');
    periods.morning.forEach((item) => {
      console.log(`  📅 ${item.day} ${item.time} - ${item.class}`);
    });

    console.log('\n🌞 CLASES DE TARDE (2pm-7pm):');
    periods.afternoon.forEach((item) => {
      console.log(`  📅 ${item.day} ${item.time} - ${item.class}`);
    });

    console.log('\n🌙 CLASES DE NOCHE (7pm-11pm):');
    periods.night.forEach((item) => {
      console.log(`  📅 ${item.day} ${item.time} - ${item.class}`);
    });

    return periods;
  },

  // Simular cambio de filtros
  simulateFilterChange(filterName, enabled) {
    console.log(
      `\n🔄 SIMULANDO: ${filterName.toUpperCase()} = ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`,
    );

    const config = { ...this.sampleTimeConfig };
    config[filterName].enabled = enabled;

    const activeFilters = Object.keys(config).filter((key) => config[key].enabled);

    console.log('📊 FILTROS ACTIVOS:', activeFilters.join(', '));

    if (activeFilters.length === 0) {
      console.log('⚠️  Sin filtros activos - mostrando todo el día');
      return { start: '07:00', end: '23:00' };
    }

    const times = activeFilters.map((filter) => ({
      start: config[filter].start,
      end: config[filter].end,
    }));

    const earliestStart = times.reduce(
      (min, time) => (time.start < min ? time.start : min),
      '23:59',
    );
    const latestEnd = times.reduce((max, time) => (time.end > max ? time.end : max), '00:00');

    console.log(`📍 RANGO VISIBLE: ${earliestStart} - ${latestEnd}`);

    return { start: earliestStart, end: latestEnd };
  },

  // Mostrar clases con solapamiento
  demonstrateOverlap() {
    console.log('\n🔄 === DEMOSTRACIÓN DE SOLAPAMIENTO ===');

    // Crear horarios superpuestos intencionalmente
    const overlappingClasses = [
      {
        name: 'Piano Individual A',
        time: 'lunes 15:00',
        teacher: 'María González',
      },
      {
        name: 'Piano Individual B',
        time: 'lunes 15:00',
        teacher: 'Carlos Ruiz',
      },
      {
        name: 'Piano Grupal',
        time: 'lunes 15:00',
        teacher: 'Elena Vásquez',
      },
    ];

    console.log('📚 CLASES SUPERPUESTAS EN EL MISMO SLOT:');
    overlappingClasses.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name} - ${cls.teacher} (${cls.time})`);
    });

    console.log('\n🎨 VISUALIZACIÓN:');
    console.log('  Modo estándar: Mostrar solo 1 clase');
    console.log('  Modo solapamiento: Mostrar las 3 clases apiladas');

    return overlappingClasses;
  },

  // Ejecutar demostración completa
  runFullDemo() {
    console.clear();
    console.log('🎵 === DEMOSTRACIÓN COMPLETA DEL SISTEMA DE HORARIOS ===\n');

    // 1. Mostrar clases por período
    this.demonstrateFilters();

    // 2. Simular cambios de filtros
    console.log('\n🔄 === SIMULACIÓN DE CAMBIOS DE FILTROS ===');
    this.simulateFilterChange('morning', false);
    this.simulateFilterChange('afternoon', false);
    this.simulateFilterChange('night', true);

    // 3. Mostrar solapamiento
    this.demonstrateOverlap();

    // 4. Estadísticas finales
    console.log('\n📊 === ESTADÍSTICAS DEL SISTEMA ===');
    console.log(`📚 Total de clases: ${this.sampleClasses.length}`);
    console.log(`👥 Total de estudiantes: ${this.getTotalStudents()}`);
    console.log(`🎼 Instrumentos únicos: ${this.getUniqueInstruments().length}`);
    console.log(`👨‍🏫 Maestros únicos: ${this.getUniqueTeachers().length}`);

    console.log('\n✅ Demo completada. El sistema está listo para pruebas!');
  },

  // Funciones auxiliares
  getTotalStudents() {
    const allStudents = new Set();
    this.sampleClasses.forEach((cls) => {
      cls.students.forEach((student) => allStudents.add(student));
    });
    return allStudents.size;
  },

  getUniqueInstruments() {
    return [...new Set(this.sampleClasses.map((cls) => cls.instrument))];
  },

  getUniqueTeachers() {
    return [...new Set(this.sampleClasses.map((cls) => cls.teacher))];
  },
};

// Funciones rápidas para la consola
window.demoFilters = () => window.demoScheduleSystem.demonstrateFilters();
window.demoOverlap = () => window.demoScheduleSystem.demonstrateOverlap();
window.runFullDemo = () => window.demoScheduleSystem.runFullDemo();

// Ejecutar demo automáticamente
console.log('🎵 Sistema de demostración cargado!');
console.log('📋 Comandos disponibles:');
console.log('  - runFullDemo() - Ejecutar demostración completa');
console.log('  - demoFilters() - Mostrar filtros por período');
console.log('  - demoOverlap() - Demostrar solapamiento de clases');
console.log('\n💡 Tip: Ejecuta runFullDemo() para ver todo en acción');
