// Script para verificar y mostrar las clases reales de Firestore
// Ejecutar en la consola del navegador

window.debugFirestoreClasses = () => {
  console.log('🔥 === ANÁLISIS DE CLASES FIRESTORE ===');

  // Intentar acceder al store de clases
  let classes = [];

  // Buscar en el contexto de Vue/Pinia
  try {
    const app = document.querySelector('#app')?.__vue_app__;
    if (app) {
      const store = app.config.globalProperties.$pinia;
      if (store) {
        console.log('📦 Store de Pinia encontrado');
        // Aquí intentaríamos acceder al store de clases
      }
    }
  } catch (error) {
    console.log('⚠️  No se pudo acceder al store via Vue app');
  }

  // Buscar en el localStorage datos guardados
  const localData = localStorage.getItem('classes-data');
  if (localData) {
    console.log('💾 Datos encontrados en localStorage');
    try {
      const parsed = JSON.parse(localData);
      classes = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log('❌ Error parseando localStorage data');
    }
  }

  // Si no encontramos datos, crear algunos de ejemplo basados en Firestore
  if (classes.length === 0) {
    console.log('📝 Creando datos de ejemplo basados en la estructura de Firestore');
    classes = [
      {
        id: '6URLsR4hz1U3OkphzGZo',
        name: 'Clase de Piano',
        description: 'Clase de piano para estudiantes intermedios',
        instrument: 'Piano',
        level: 'intermedio',
        teacherId: '1MsigzUDs3TWgODw.hF3GVDvPOf3',
        teachers: ['1MsigzUDs3TWgODw.hF3GVDvPOf3', 'pzoktR8EiJYNKq8wc23YQbE3jWF3'],
        assignedAt: new Date('2025-06-11T20:31:00.000Z'),
        assignedBy: '1MsigzUDs3TWgODw.hF3GVDvPOf3',
        permissions: {
          canAddObservations: true,
          canEditClass: false,
          canManageTeachers: false,
          canTakeAttendance: true,
          canViewAttendanceHistory: true,
        },
        role: 'assistant',
      },
      {
        id: 'test-class-2',
        name: 'Guitarra Básica',
        description: 'Introducción a la guitarra',
        instrument: 'Guitarra',
        level: 'básico',
        teacherId: 'otro-teacher-id',
        teachers: [], // No compartida
        role: 'lead',
      },
    ];
  }

  console.log('📊 ANÁLISIS DE DATOS:');
  console.log(`Total de clases: ${classes.length}`);

  classes.forEach((cls, index) => {
    console.log(`\n📚 Clase ${index + 1}: "${cls.name}"`);
    console.log(`   ID: ${cls.id}`);
    console.log(`   Instrumento: ${cls.instrument}`);
    console.log(`   teacherId: ${cls.teacherId}`);

    if (cls.teachers) {
      console.log(
        `   teachers: [${Array.isArray(cls.teachers) ? cls.teachers.join(', ') : cls.teachers}]`,
      );
      console.log(
        `   Es compartida: ${Array.isArray(cls.teachers) && cls.teachers.length > 0 ? '✅ SÍ' : '❌ NO'}`,
      );
    } else {
      console.log('   teachers: undefined');
      console.log('   Es compartida: ❌ NO');
    }
  });

  // Filtrar clases compartidas
  const sharedClasses = classes.filter(
    (cls) => cls.teachers && Array.isArray(cls.teachers) && cls.teachers.length > 0,
  );

  console.log(`\n🔗 CLASES COMPARTIDAS ENCONTRADAS: ${sharedClasses.length}`);
  sharedClasses.forEach((cls) => {
    console.log(`   ✅ ${cls.name} → teachers: [${cls.teachers.join(', ')}]`);
  });

  if (sharedClasses.length === 0) {
    console.log('⚠️  No se encontraron clases compartidas');
    console.log('💡 Verifica que las clases en Firestore tengan la propiedad "teachers" poblada');
  }

  return { allClasses: classes, sharedClasses };
};

// Función para inyectar una clase compartida de prueba
window.injectTestSharedClass = () => {
  console.log('💉 Inyectando clase compartida de prueba...');

  const testClass = {
    id: 'firestore-shared-test',
    name: 'Piano Compartido - Prueba Firestore',
    description: 'Clase de prueba con estructura de Firestore',
    instrument: 'Piano',
    level: 'intermedio',
    teacherId: 'main-teacher-123',
    teachers: ['main-teacher-123', 'assistant-teacher-456', 'otro-teacher-789'],
    permissions: {
      canAddObservations: true,
      canTakeAttendance: true,
      canViewAttendanceHistory: true,
    },
    role: 'assistant',
  };

  // Guardar en localStorage
  try {
    const existing = localStorage.getItem('test-classes') || '[]';
    const classes = JSON.parse(existing);
    classes.push(testClass);
    localStorage.setItem('test-classes', JSON.stringify(classes));
    console.log('✅ Clase inyectada en localStorage');
    console.log('🔄 Recarga la página para ver los cambios');
  } catch (error) {
    console.error('❌ Error inyectando clase:', error);
  }
};

console.log('🔥 Scripts de debug Firestore cargados:');
console.log('- debugFirestoreClasses() - Analizar todas las clases');
console.log('- injectTestSharedClass() - Inyectar clase de prueba');
