import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import express from "express"
import cors from "cors"

// Asegurarse de que Firebase Admin se inicialice solo una vez
if (admin.apps.length === 0) {
  admin.initializeApp()
}

const db = admin.firestore()
const app = express()
app.use(cors({origin: true}))

/**
 * @function findStudentByPhone
 * @description Busca un estudiante por su número de teléfono (padre o madre).
 * @param {string} phoneNumber - El número de teléfono a buscar.
 * @returns {Promise<admin.firestore.QueryDocumentSnapshot | null>} - El documento del estudiante o null si no se encuentra.
 */
async function findStudentByPhone(
  phoneNumber: string
): Promise<admin.firestore.QueryDocumentSnapshot | null> {
  const studentsRef = db.collection("ALUMNOS")

  // Buscar en el teléfono de la madre
  const parentPhoneQuery = studentsRef.where("contactInfo.parentPhone", "==", phoneNumber)
  const parentPhoneSnapshot = await parentPhoneQuery.get()
  if (!parentPhoneSnapshot.empty) {
    return parentPhoneSnapshot.docs[0]
  }

  // Si no se encuentra, buscar en el teléfono del padre (si existe un campo diferente)
  // const fatherPhoneQuery = studentsRef.where("contactInfo.fatherPhone", "==", phoneNumber);
  // const fatherPhoneSnapshot = await fatherPhoneQuery.get();
  // if (!fatherPhoneSnapshot.empty) {
  //   return fatherPhoneSnapshot.docs[0];
  // }

  return null
}

// Middleware para parsear el body de la solicitud
app.use(express.json())

/**
 * @route POST /handleReply
 * @description Webhook para recibir respuestas de WhatsApp desde Baileys.
 */
app.post("/handleReply", async (req, res) => {
  const {from, body, timestamp} = req.body

  if (!from || !body) {
    functions.logger.warn("Solicitud inválida, 'from' y 'body' son requeridos.", req.body)
    return res.status(400).send("Bad Request: 'from' and 'body' are required.")
  }

  // Limpiar el número de teléfono
  const cleanedPhoneNumber = from.split("@")[0]

  try {
    // 1. Encontrar al estudiante por el número de teléfono
    const studentDoc = await findStudentByPhone(cleanedPhoneNumber)

    if (!studentDoc) {
      functions.logger.info(`No se encontró estudiante para el número: ${cleanedPhoneNumber}`)
      return res.status(404).send("Student not found for this phone number.")
    }

    const studentId = studentDoc.id
    const studentData = studentDoc.data()

    // 2. Guardar la conversación
    const conversationData = {
      studentId,
      studentName: `${studentData.name} ${studentData.lastName}`,
      from: cleanedPhoneNumber,
      message: body,
      timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
      direction: "incoming", // Mensaje entrante del padre/madre
      processed: false, // Marcar como no procesado para futura IA
    }

    await db.collection("conversations").add(conversationData)

    functions.logger.info(`Conversación guardada para el estudiante ${studentId}`)

    // 3. (Opcional) Enviar respuesta automática de confirmación
    // Aquí se podría integrar una llamada a la función de envío de WhatsApp
    // para notificar que el mensaje fue recibido.

    return res.status(200).send({success: true, message: "Reply processed successfully."})
  } catch (error) {
    functions.logger.error("Error procesando la respuesta de WhatsApp:", error)
    return res.status(500).send("Internal Server Error")
  }
})

export const whatsAppReplyWebhook = functions.https.onRequest(app)
