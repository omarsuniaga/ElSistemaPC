// Script para crear clases de ejemplo para probar el horario
// Ejecutar en la consola del navegador

// Función para crear clases de ejemplo
async function createSampleClasses() {
  console.log('🎵 Creando clases de ejemplo...');
  
  // Simulamos datos de maestros y estudiantes
  const sampleTeachers = [
    { id: 'teacher1', name: 'Prof. García' },
    { id: 'teacher2', name: 'Prof. López' },
    { id: 'teacher3', name: 'Prof. Martín' },
    { id: 'teacher4', name: 'Prof. Silva' }
  ];
  
  const sampleStudents = [
    'student1', 'student2', 'student3', 'student4', 'student5', 
    'student6', 'student7', 'student8', 'student9', 'student10'
  ];
  
  // Clases de ejemplo con diferentes horarios
  const sampleClasses = [
    {
      id: 'class1',
      name: 'Piano Básico A',
      instrument: 'Piano',
      level: 'preparatoria',
      teacherId: 'teacher1',
      studentIds: ['student1', 'student2', 'student3'],
      schedule: {
        slots: [
          { day: 'monday', startTime: '08:00', endTime: '09:00' },
          { day: 'wednesday', startTime: '08:00', endTime: '09:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class2',
      name: 'Guitarra Intermedio',
      instrument: 'Guitarra',
      level: 'teoria-musical',
      teacherId: 'teacher2',
      studentIds: ['student4', 'student5'],
      schedule: {
        slots: [
          { day: 'monday', startTime: '10:00', endTime: '11:30' },
          { day: 'friday', startTime: '10:00', endTime: '11:30' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class3',
      name: 'Violín Avanzado',
      instrument: 'Violín',
      level: 'orquesta',
      teacherId: 'teacher3',
      studentIds: ['student6', 'student7', 'student8'],
      schedule: {
        slots: [
          { day: 'tuesday', startTime: '14:00', endTime: '15:30' },
          { day: 'thursday', startTime: '14:00', endTime: '15:30' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class4',
      name: 'Coro Infantil',
      instrument: 'Canto',
      level: 'coro',
      teacherId: 'teacher4',
      studentIds: ['student9', 'student10', 'student1', 'student2'],
      schedule: {
        slots: [
          { day: 'wednesday', startTime: '16:00', endTime: '17:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class5',
      name: 'Piano Intermedio',
      instrument: 'Piano',
      level: 'teoria-musical',
      teacherId: 'teacher1',
      studentIds: ['student3', 'student4'],
      schedule: {
        slots: [
          { day: 'tuesday', startTime: '09:00', endTime: '10:00' },
          { day: 'thursday', startTime: '09:00', endTime: '10:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class6',
      name: 'Batería Principiante',
      instrument: 'Batería',
      level: 'preparatoria',
      teacherId: 'teacher2',
      studentIds: ['student5', 'student6'],
      schedule: {
        slots: [
          { day: 'friday', startTime: '15:00', endTime: '16:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class7',
      name: 'Teoría Musical',
      instrument: 'Teoría',
      level: 'teoria-musical',
      teacherId: 'teacher3',
      studentIds: ['student7', 'student8', 'student9'],
      schedule: {
        slots: [
          { day: 'monday', startTime: '19:00', endTime: '20:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class8',
      name: 'Ensamble Jazz',
      instrument: 'Conjunto',
      level: 'orquesta',
      teacherId: 'teacher4',
      studentIds: ['student10', 'student1', 'student3'],
      schedule: {
        slots: [
          { day: 'saturday', startTime: '10:00', endTime: '12:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class9',
      name: 'Flauta Básico',
      instrument: 'Flauta',
      level: 'preparatoria',
      teacherId: 'teacher1',
      studentIds: ['student2', 'student4'],
      schedule: {
        slots: [
          { day: 'wednesday', startTime: '11:00', endTime: '12:00' }
        ]
      },
      status: 'active'
    },
    {
      id: 'class10',
      name: 'Guitarra Clásica',
      instrument: 'Guitarra',
      level: 'orquesta',
      teacherId: 'teacher2',
      studentIds: ['student5', 'student7'],
      schedule: {
        slots: [
          { day: 'thursday', startTime: '16:30', endTime: '18:00' }
        ]
      },
      status: 'active'
    }
  ];
  
  return { sampleClasses, sampleTeachers, sampleStudents };
}

// Función para inyectar las clases en el store de Vue
function injectSampleData() {
  try {
    const { sampleClasses, sampleTeachers, sampleStudents } = createSampleClasses();
    
    // Si estamos en el contexto de Vue, inyectar en los stores
    if (window.__VUE_APP__ || window.Vue) {
      console.log('📊 Inyectando datos de ejemplo en los stores...');
      
      // Esto funcionaría si tuviéramos acceso a los stores desde la consola
      console.log('Clases de ejemplo creadas:', sampleClasses.length);
      console.log('Maestros de ejemplo:', sampleTeachers.length);
      console.log('Estudiantes de ejemplo:', sampleStudents.length);
      
      // Mostrar estructura de ejemplo
      console.log('Ejemplo de clase:', sampleClasses[0]);
    } else {
      console.log('❌ No se puede acceder a los stores de Vue desde la consola');
    }
    
    return { sampleClasses, sampleTeachers, sampleStudents };
  } catch (error) {
    console.error('Error creando datos de ejemplo:', error);
  }
}

// Función para crear datos en localStorage (para testing)
function createLocalStorageData() {
  const data = createSampleClasses();
  
  localStorage.setItem('sampleClasses', JSON.stringify(data.sampleClasses));
  localStorage.setItem('sampleTeachers', JSON.stringify(data.sampleTeachers));
  localStorage.setItem('sampleStudents', JSON.stringify(data.sampleStudents));
  
  console.log('✅ Datos de ejemplo guardados en localStorage');
  console.log('Para usarlos, recarga la página y los datos deberían aparecer');
  
  return data;
}

// Función para mostrar resumen
function showSampleDataSummary() {
  const data = createSampleClasses();
  
  console.log('📋 RESUMEN DE DATOS DE EJEMPLO');
  console.log('==============================');
  
  data.sampleClasses.forEach(cls => {
    console.log(`🎵 ${cls.name}`);
    console.log(`   Instrumento: ${cls.instrument}`);
    console.log(`   Maestro: ${cls.teacherId}`);
    console.log(`   Estudiantes: ${cls.studentIds.length}`);
    console.log(`   Horarios:`);
    cls.schedule.slots.forEach(slot => {
      console.log(`     - ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
    });
    console.log('');
  });
  
  console.log('==============================');
  console.log(`Total: ${data.sampleClasses.length} clases`);
  console.log(`Maestros: ${data.sampleTeachers.length}`);
  console.log(`Estudiantes: ${data.sampleStudents.length}`);
}

// Exportar funciones
if (typeof module !== 'undefined') {
  module.exports = {
    createSampleClasses,
    injectSampleData,
    createLocalStorageData,
    showSampleDataSummary
  };
}

// Si estamos en el navegador, agregar a window
if (typeof window !== 'undefined') {
  window.createSampleClasses = createSampleClasses;
  window.injectSampleData = injectSampleData;
  window.createLocalStorageData = createLocalStorageData;
  window.showSampleDataSummary = showSampleDataSummary;
  
  console.log('🎯 Funciones de datos de ejemplo disponibles:');
  console.log('   - createSampleClasses()');
  console.log('   - showSampleDataSummary()');
  console.log('   - createLocalStorageData()');
  console.log('   - injectSampleData()');
}

// Auto-ejecutar resumen si estamos en la consola
if (typeof window !== 'undefined' && window.console) {
  showSampleDataSummary();
}
