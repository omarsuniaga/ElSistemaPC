// Función para generar datos de muestra desde la aplicación
// Puedes agregar esta función temporalmente a tu componente o ejecutarla desde la consola

export async function generateSampleAttendanceData() {
  // Importar las funciones necesarias
  const { db } = await import('../../../firebase');
  const { collection, doc, setDoc } = await import('firebase/firestore');

  console.log('🎭 Iniciando generación de datos de muestra...');

  const classIds = [
    'kLhE8YiHBM7vPdW4QqJl', // IDs reales de tus clases
    'mN2oP9rF3xK8LtV6WsGh',
    'qR4uI7eH1yN5XcB8MfJd',
    'sT6wO2pL9kE3VnC7ZaGu',
    'vX8yR4mJ1qL6PdN9BhKf',
  ];

  const studentIds = [
    'XCMzMoaZAKQpMfUyFgz',
    '1663248027973',
    'Edelyn_Abreu_001',
    'Helen_Sofia_002',
    'Student_003',
    'Student_004',
    'Student_005',
    'Student_006',
    'Student_007',
    'Student_008',
  ];

  const teacherId = 'pzoktB8EldYNKq8wc23YQbE3WF3';

  // Generar fechas de los últimos 20 días
  const generateDates = (days) => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const dates = generateDates(20);
  let documentsCreated = 0;

  for (const fecha of dates) {
    for (const classId of classIds) {
      // 65% de probabilidad de que haya clase ese día
      if (Math.random() < 0.65) {
        // Seleccionar estudiantes para esta clase (entre 3 y 8)
        const numStudentsInClass = Math.floor(Math.random() * 6) + 3;
        const selectedStudents = studentIds.slice(0, numStudentsInClass);

        const presentes = [];
        const ausentes = [];
        const tarde = [];
        const justificacion = [];

        selectedStudents.forEach((studentId) => {
          const attendance = Math.random();

          if (attendance < 0.75) {
            // 75% presente
            presentes.push(studentId);
          } else if (attendance < 0.9) {
            // 15% ausente
            ausentes.push(studentId);

            // 35% de los ausentes tienen justificación
            if (Math.random() < 0.35) {
              const reasons = [
                'Cita médica',
                'Emergencia familiar',
                'Enfermedad',
                'Viaje programado',
                'Compromiso académico',
              ];

              justificacion.push({
                id: studentId,
                studentId,
                classId,
                fecha,
                reason: reasons[Math.floor(Math.random() * reasons.length)],
                documentUrl: null,
                approvalStatus: 'pending',
                createdAt: new Date(),
                timeLimit: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
              });
            }
          } else {
            // 10% tardanza
            tarde.push(studentId);
          }
        });

        const docId = `${fecha}_${classId}`;
        const attendanceDocument = {
          fecha,
          date: fecha, // Para compatibilidad
          classId,
          teacherId,
          uid: teacherId,
          createdAt: new Date(),
          updatedAt: new Date(),
          data: {
            presentes,
            ausentes,
            tarde,
            justificacion,
            observación:
              Math.random() < 0.25
                ? `Observación del ${fecha}: Clase desarrollada normalmente`
                : '',
            observations: [],
          },
        };

        try {
          await setDoc(doc(db, 'ASISTENCIAS', docId), attendanceDocument);
          documentsCreated++;

          console.log(
            `✅ ${docId}: ${presentes.length}P, ${ausentes.length}A, ${tarde.length}T, ${justificacion.length}J`,
          );
        } catch (error) {
          console.error(`❌ Error creando ${docId}:`, error);
        }

        // Pausa pequeña para no saturar Firestore
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
  }

  console.log(`🎉 ¡Completado! Se crearon ${documentsCreated} documentos de asistencia.`);
  console.log('📊 Los datos ya están disponibles en el tablero.');

  return documentsCreated;
}

// Para ejecutar desde la consola del navegador (cuando estés en la app):
// generateSampleAttendanceData().then(count => console.log(`Creados ${count} documentos`));
