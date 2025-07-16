import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Asegurarse de que Firebase Admin se inicialice solo una vez
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * @function getStudentAttendanceSummary
 * @description Función HTTPS onCall para obtener el resumen de asistencias (ausencias y tardanzas) de un estudiante.
 * @param {object} data - El objeto de datos de la llamada.
 * @param {string} data.studentId - El ID del estudiante a consultar.
 * @param {functions.https.CallableContext} context - El contexto de la función.
 * @returns {Promise<{absentCount: number, lateCount: number}>} - Un objeto con el conteo de ausencias y tardanzas.
 */
export const getStudentAttendanceSummary = functions.https.onCall(async (data, context) => {
  // 1. Verificación de Autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para realizar esta acción.',
    );
  }

  const studentId = data.studentId;

  // 2. Validación de Parámetros
  if (!studentId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'El ID del estudiante (studentId) es un parámetro requerido.',
    );
  }

  try {
    // 3. Consulta a Firestore
    const attendanceRef = db.collection('attendance');
    const snapshot = await attendanceRef.where('studentId', '==', studentId).get();

    if (snapshot.empty) {
      return { absentCount: 0, lateCount: 0 };
    }

    let absentCount = 0;
    let lateCount = 0;

    // 4. Conteo de Estados
    snapshot.forEach((doc) => {
      const record = doc.data();
      if (record.status === 'absent') {
        absentCount++;
      } else if (record.status === 'late') {
        lateCount++;
      }
    });

    return { absentCount, lateCount };
  } catch (error) {
    console.error('Error al obtener el resumen de asistencias:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Ocurrió un error interno al procesar la solicitud.',
    );
  }
});
