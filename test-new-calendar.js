/**
 * 🧪 SCRIPT DE PRUEBA PARA EL NUEVO CALENDARIO DE ASISTENCIAS
 * Valida que la lógica del CalendarService funcione correctamente
 */

import { CalendarService } from './src/modulos/Attendance/services/CalendarService.js';

// 🎯 Datos de prueba que simulan "Ensayo General"
const mockEnsayoGeneral = {
  id: 'ensayo-general-123',
  name: 'Ensayo General',
  teacherId: 'teacher-123',
  teachers: [
    {
      teacherId: 'teacher-456',
      permissions: { canTakeAttendance: true },
    },
  ],
  schedule: {
    slots: [
      { day: 'martes', startTime: '17:00', endTime: '18:30' },
      { day: 'jueves', startTime: '17:00', endTime: '18:30' },
      { day: 'sábado', startTime: '09:00', endTime: '12:30' },
    ],
  },
  students: ['student1', 'student2'],
  location: 'Salón Bustamante',
};

const mockClasses = [mockEnsayoGeneral];

// 🧪 Pruebas de validación
console.log('🧪 INICIANDO PRUEBAS DEL NUEVO CALENDARIO\n');

// Prueba 1: Domingo 6 de julio 2025 (NO debería aparecer)
console.log('📋 PRUEBA 1: Domingo 6 de julio 2025');
console.log('Expected: Ensayo General NO debe aparecer');

try {
  const domingoResult = await CalendarService.getClassesForDay(mockClasses, {
    date: '2025-07-06',
    teacherId: 'teacher-123',
  });
  
  console.log(`✅ Resultado: ${domingoResult.totalClasses} clases encontradas`);
  console.log(`✅ Clases: ${domingoResult.classes.map(c => c.name).join(', ') || 'NINGUNA'}`);
  
  if (domingoResult.totalClasses === 0) {
    console.log('🎉 PRUEBA 1 EXITOSA: Ensayo General NO aparece en domingo\n');
  } else {
    console.log('❌ PRUEBA 1 FALLIDA: Ensayo General SÍ aparece en domingo\n');
  }
} catch (error) {
  console.error('❌ Error en prueba 1:', error);
}

// Prueba 2: Martes 8 de julio 2025 (SÍ debería aparecer)
console.log('📋 PRUEBA 2: Martes 8 de julio 2025');
console.log('Expected: Ensayo General SÍ debe aparecer');

try {
  const martesResult = await CalendarService.getClassesForDay(mockClasses, {
    date: '2025-07-08',
    teacherId: 'teacher-123',
  });
  
  console.log(`✅ Resultado: ${martesResult.totalClasses} clases encontradas`);
  console.log(`✅ Clases: ${martesResult.classes.map(c => c.name).join(', ') || 'NINGUNA'}`);
  
  if (martesResult.totalClasses === 1 && martesResult.classes[0].name === 'Ensayo General') {
    console.log('🎉 PRUEBA 2 EXITOSA: Ensayo General SÍ aparece en martes\n');
  } else {
    console.log('❌ PRUEBA 2 FALLIDA: Ensayo General NO aparece en martes\n');
  }
} catch (error) {
  console.error('❌ Error en prueba 2:', error);
}

// Prueba 3: Jueves 10 de julio 2025 (SÍ debería aparecer)
console.log('📋 PRUEBA 3: Jueves 10 de julio 2025');
console.log('Expected: Ensayo General SÍ debe aparecer');

try {
  const juevesResult = await CalendarService.getClassesForDay(mockClasses, {
    date: '2025-07-10',
    teacherId: 'teacher-123',
  });
  
  console.log(`✅ Resultado: ${juevesResult.totalClasses} clases encontradas`);
  console.log(`✅ Clases: ${juevesResult.classes.map(c => c.name).join(', ') || 'NINGUNA'}`);
  
  if (juevesResult.totalClasses === 1 && juevesResult.classes[0].name === 'Ensayo General') {
    console.log('🎉 PRUEBA 3 EXITOSA: Ensayo General SÍ aparece en jueves\n');
  } else {
    console.log('❌ PRUEBA 3 FALLIDA: Ensayo General NO aparece en jueves\n');
  }
} catch (error) {
  console.error('❌ Error en prueba 3:', error);
}

// Prueba 4: Sábado 12 de julio 2025 (SÍ debería aparecer)
console.log('📋 PRUEBA 4: Sábado 12 de julio 2025');
console.log('Expected: Ensayo General SÍ debe aparecer');

try {
  const sabadoResult = await CalendarService.getClassesForDay(mockClasses, {
    date: '2025-07-12',
    teacherId: 'teacher-123',
  });
  
  console.log(`✅ Resultado: ${sabadoResult.totalClasses} clases encontradas`);
  console.log(`✅ Clases: ${sabadoResult.classes.map(c => c.name).join(', ') || 'NINGUNA'}`);
  
  if (sabadoResult.totalClasses === 1 && sabadoResult.classes[0].name === 'Ensayo General') {
    console.log('🎉 PRUEBA 4 EXITOSA: Ensayo General SÍ aparece en sábado\n');
  } else {
    console.log('❌ PRUEBA 4 FALLIDA: Ensayo General NO aparece en sábado\n');
  }
} catch (error) {
  console.error('❌ Error en prueba 4:', error);
}

// Prueba 5: Lunes 7 de julio 2025 (NO debería aparecer)
console.log('📋 PRUEBA 5: Lunes 7 de julio 2025');
console.log('Expected: Ensayo General NO debe aparecer');

try {
  const lunesResult = await CalendarService.getClassesForDay(mockClasses, {
    date: '2025-07-07',
    teacherId: 'teacher-123',
  });
  
  console.log(`✅ Resultado: ${lunesResult.totalClasses} clases encontradas`);
  console.log(`✅ Clases: ${lunesResult.classes.map(c => c.name).join(', ') || 'NINGUNA'}`);
  
  if (lunesResult.totalClasses === 0) {
    console.log('🎉 PRUEBA 5 EXITOSA: Ensayo General NO aparece en lunes\n');
  } else {
    console.log('❌ PRUEBA 5 FALLIDA: Ensayo General SÍ aparece en lunes\n');
  }
} catch (error) {
  console.error('❌ Error en prueba 5:', error);
}

console.log('🏁 PRUEBAS COMPLETADAS');
console.log('Si todas las pruebas son exitosas, el nuevo sistema funcionará correctamente');
