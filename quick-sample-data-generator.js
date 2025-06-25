/**
 * Script para generar datos de asistencia de muestra desde la consola del navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Ve a la página de "Informe de Asistencia" del maestro
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega este código completo
 * 5. Presiona Enter para ejecutar
 * 6. Espera a que termine y recarga la página
 */

window.generateQuickSampleData = async function() {
  console.log('🎭 === GENERADOR RÁPIDO DE DATOS DE ASISTENCIA ===');
  console.log('⏳ Iniciando generación...');

  try {
    // Verificar que Firebase esté disponible
    if (!window.firebase && !window.db) {
      throw new Error('Firebase no está disponible en el contexto global');
    }

    // Obtener referencia a Firebase (adaptarse a la estructura de tu app)
    const db = window.db || window.firebase?.firestore?.();
    if (!db) {
      throw new Error('No se pudo obtener referencia a Firestore');
    }

    // Datos de muestra
    const teacherId = 'pzoktB8EldYNKq8wc23YQbE3WF3'; // Tu ID de maestro
    
    const classIds = [
      'kLhE8YiHBM7vPdW4QqJl',
      'mN2oP9rF3xK8LtV6WsGh', 
      'qR4uI7eH1yN5XcB8MfJd',
      'sT6wO2pL9kE3VnC7ZaGu',
      'vX8yR4mJ1qL6PdN9BhKf'
    ];

    const studentIds = [
      'XCMzMoaZAKQpMfUyFgz',
      '1663248027973',
      'Edelyn_Abreu_ID',
      'Helen_Sofia_ID',
      'Estudiante_005',
      'Estudiante_006',
      'Estudiante_007',
      'Estudiante_008',
      'Estudiante_009',
      'Estudiante_010'
    ];

    // Generar fechas de los últimos 20 días
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    console.log(`📅 Generando datos para ${dates.length} fechas`);
    console.log(`🏫 Usando ${classIds.length} clases`);
    console.log(`👥 Con ${studentIds.length} estudiantes`);

    let documentsCreated = 0;
    let errors = 0;

    for (const fecha of dates) {
      for (const classId of classIds) {
        // 75% probabilidad de clase
        if (Math.random() < 0.75) {
          
          // Seleccionar estudiantes (4-8 por clase)
          const numStudents = Math.floor(Math.random() * 5) + 4;
          const classStudents = studentIds.slice(0, numStudents);
          
          const presentes = [];
          const ausentes = [];
          const tarde = [];
          const justificacion = [];
          
          classStudents.forEach(studentId => {
            const rand = Math.random();
            
            if (rand < 0.78) {
              presentes.push(studentId);
            } else if (rand < 0.93) {
              ausentes.push(studentId);
              
              // 35% justificación
              if (Math.random() < 0.35) {
                justificacion.push({
                  id: studentId,
                  studentId: studentId,
                  classId: classId,
                  fecha: fecha,
                  reason: ['Cita médica', 'Enfermedad', 'Emergencia', 'Viaje'][Math.floor(Math.random() * 4)],
                  documentUrl: null,
                  approvalStatus: 'pending',
                  createdAt: new Date(),
                  timeLimit: new Date(Date.now() + 48 * 60 * 60 * 1000)
                });
              }
            } else {
              tarde.push(studentId);
            }
          });

          const docId = `${fecha}_${classId}`;
          const data = {
            fecha: fecha,
            date: fecha,
            classId: classId,
            teacherId: teacherId,
            uid: teacherId,
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {
              presentes,
              ausentes,
              tarde,
              justificacion,
              observación: Math.random() < 0.3 ? `Clase del ${fecha} desarrollada correctamente` : '',
              observations: []
            }
          };

          try {
            // Usar la API REST de Firestore si las SDK no están disponibles
            const projectId = 'tu-proyecto-id'; // Cambiar por tu project ID
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/ASISTENCIAS/${docId}`;
            
            // Si tienes acceso directo a Firestore SDK:
            if (window.firebase?.firestore) {
              await db.collection('ASISTENCIAS').doc(docId).set(data);
            } else {
              console.log(`📝 Documento preparado: ${docId}`);
              console.log(`   ${presentes.length} presentes, ${ausentes.length} ausentes, ${tarde.length} tarde, ${justificacion.length} justificados`);
            }
            
            documentsCreated++;
            
          } catch (error) {
            console.error(`❌ Error en ${docId}:`, error);
            errors++;
          }

          // Pausa pequeña
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    console.log(`✅ Proceso completado!`);
    console.log(`📊 Documentos creados: ${documentsCreated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('🔄 Recarga la página para ver los datos');

    return { documentsCreated, errors };

  } catch (error) {
    console.error('💥 Error general:', error);
    return { error: error.message };
  }
};

// Mensaje de ayuda
console.log('🎯 Función disponible: generateQuickSampleData()');
console.log('💡 Ejecuta: generateQuickSampleData().then(result => console.log(result))');

// Auto-ejecutar si se desea
// generateQuickSampleData();
