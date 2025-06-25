// Script para agregar datos de asistencia desde la consola del navegador
// Copia y pega este código en la consola de Chrome mientras estés en la aplicación

(async function generateSampleAttendance() {
  console.log('🎭 Generando datos de asistencia de muestra...');
  
  // Importar Firebase desde el contexto global
  const { db, collection, doc, setDoc, serverTimestamp } = window;
  
  if (!db) {
    console.error('❌ Firebase no está disponible. Asegúrate de estar en la aplicación.');
    return;
  }
  
  const sampleClasses = [
    'clase-violin-1',
    'clase-violin-2', 
    'clase-iniciacion-violin',
    'clase-ensayo-general',
    'clase-ensayo-seccional',
    'clase-taller-violas'
  ];
  
  const sampleStudents = [
    'XCMzMoaZAKQpMfUyFgz',
    '1663248027973',
    'edelyn-abreu-id',
    'helen-sofia-abogado-brea-id',
    'student-1',
    'student-2',
    'student-3',
    'student-4',
    'student-5'
  ];
  
  const teacherId = 'pzoktB8EldYNKq8wc23YQbE3WF3';
  
  // Generar fechas de los últimos 15 días
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  let documentsCreated = 0;
  
  for (const date of dates) {
    for (const classId of sampleClasses) {
      // 70% de probabilidad de que haya clase
      if (Math.random() < 0.7) {
        
        // Generar asistencia aleatoria
        const presentes = [];
        const ausentes = [];
        const tarde = [];
        const justificacion = [];
        
        // Seleccionar 4-7 estudiantes para esta clase
        const numStudents = Math.floor(Math.random() * 4) + 4;
        const classStudents = sampleStudents.slice(0, numStudents);
        
        classStudents.forEach(studentId => {
          const rand = Math.random();
          if (rand < 0.7) {
            presentes.push(studentId);
          } else if (rand < 0.9) {
            ausentes.push(studentId);
            // 40% de probabilidad de justificación
            if (Math.random() < 0.4) {
              justificacion.push({
                id: studentId,
                studentId: studentId,
                classId: classId,
                fecha: date,
                reason: `Justificación médica - ${date}`,
                documentUrl: null,
                approvalStatus: 'pending',
                createdAt: new Date(),
                timeLimit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              });
            }
          } else {
            tarde.push(studentId);
          }
        });
        
        const docId = `${date}_${classId}`;
        const attendanceDoc = {
          fecha: date,
          date: date,
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
            observación: Math.random() < 0.3 ? `Clase productiva del ${date}` : '',
            observations: []
          }
        };
        
        try {
          // Usar la API de Firebase disponible en el contexto
          await fetch(`https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/ASISTENCIAS/${docId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              // Aquí necesitarías el token de autenticación
            },
            body: JSON.stringify({
              fields: attendanceDoc
            })
          });
          
          documentsCreated++;
          console.log(`✅ Documento creado: ${docId} - ${presentes.length}P, ${ausentes.length}A, ${tarde.length}T`);
          
        } catch (error) {
          console.error(`❌ Error creando ${docId}:`, error);
        }
        
        // Pequeña pausa para no saturar
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  console.log(`🎉 Proceso completado! Se crearon ${documentsCreated} documentos.`);
  console.log('🔄 Recarga la página para ver los nuevos datos.');
})();
