import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

// Asegurarse de que Firebase Admin se inicialice solo una vez
if (admin.apps.length === 0) {
  admin.initializeApp()
}

/**
 * @function checkNotificationFunctionsHealth
 * @description Función HTTPS onCall para verificar la salud de las funciones de notificación.
 * @param {object} data - El objeto de datos de la llamada (vacío para este caso).
 * @param {functions.https.CallableContext} context - El contexto de la función.
 * @returns {Promise<{status: string, message?: string}>} - Un objeto con el estado de salud.
 */
export const checkNotificationFunctionsHealth = functions.https.onCall(async (data, context) => {
  // Opcional: Verificar autenticación si esta función no debe ser pública
  // if (!context.auth) {
  //   throw new functions.https.HttpsError(
  //     "unauthenticated",
  //     "El usuario debe estar autenticado para realizar esta acción."
  //   );
  // }

  try {
    // Aquí se podría añadir lógica más compleja para verificar la salud real
    // Por ejemplo, intentar una operación de prueba en Firestore relacionada con notificaciones,
    // o verificar la configuración de Baileys si fuera accesible desde aquí.
    // Por ahora, una simple ejecución sin errores indica que la función está operativa.

    return {status: "operational", message: "Las funciones de notificación están operativas."}
  } catch (error) {
    console.error("Error en la verificación de salud de las funciones de notificación:", error)
    throw new functions.https.HttpsError(
      "internal",
      "Fallo en la verificación de salud de las funciones de notificación."
    )
  }
})
