import * as functions from "firebase-functions"
import cors from "cors"
import { toDataURL } from "qrcode"

// Configurar CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
})

// Estado global simplificado
let qrCode: string | null = null
let connectionStatus = "disconnected"

// Función para generar QR de prueba
const generateTestQR = async () => {
  try {
    // Generar un QR de prueba con datos simulados que se ve como un QR real de WhatsApp
    const testQRData = `1@${Math.random().toString(36).substr(2, 25)},${Math.random().toString(36).substr(2, 25)},${Date.now()}`
    qrCode = testQRData
    connectionStatus = "qr_ready"
    console.log("📱 QR de prueba generado:", testQRData.substring(0, 20) + "...")
    return true
  } catch (error) {
    console.error("❌ Error generando QR de prueba:", error)
    connectionStatus = "error"
    return false
  }
}

// Función principal WhatsApp API
export const whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`)
    
    const path = req.path.replace("/whatsappApi", "") || req.path
    
    switch (path) {
      case "/status":
        res.status(200).json({
          status: connectionStatus,
          message: `Estado actual: ${connectionStatus}`,
          timestamp: new Date().toISOString(),
          hasQR: qrCode !== null,
        })
        break
        
      case "/init":
        console.log("🔄 Inicializando WhatsApp...")
        const initialized = await generateTestQR()
        res.status(200).json({
          success: initialized,
          status: connectionStatus,
          message: initialized ? "WhatsApp inicializado" : "Error al inicializar",
          timestamp: new Date().toISOString(),
        })
        break
        
      case "/qr":
        console.log("🎯 Solicitando QR...")
        
        // Auto-inicializar si no está iniciado
        if (connectionStatus === "disconnected") {
          console.log("🚀 Auto-inicializando...")
          await generateTestQR()
        }
        
        if (qrCode) {
          try {
            console.log("📱 Generando imagen QR...")
            
            // Generar imagen QR
            const qrImage = await toDataURL(qrCode, {
              width: 256,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF"
              }
            })
            
            console.log("✅ Imagen QR generada exitosamente")
            
            // Convertir a buffer y enviar como imagen
            const base64Data = qrImage.replace(/^data:image\/png;base64,/, "")
            const imgBuffer = Buffer.from(base64Data, "base64")
            
            res.setHeader("Content-Type", "image/png")
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            res.setHeader("Pragma", "no-cache")
            res.setHeader("Expires", "0")
            res.status(200).send(imgBuffer)
          } catch (error) {
            console.error("❌ Error generando imagen QR:", error)
            res.status(500).json({
              error: "Error generando imagen QR",
              status: connectionStatus,
              hasQR: false,
              details: error instanceof Error ? error.message : "Error desconocido"
            })
          }
        } else {
          console.log("⚠️ QR no disponible")
          res.status(200).json({
            status: connectionStatus,
            message: "QR no disponible aún, reintentando...",
            hasQR: false,
            timestamp: new Date().toISOString(),
          })
        }
        break
        
      case "/send-message":
        if (req.method !== "POST") {
          res.status(405).json({ error: "Método no permitido" })
          return
        }
        
        // Simular envío de mensaje
        const { number, message } = req.body
        
        if (!number || !message) {
          res.status(400).json({
            error: "Número y mensaje son requeridos",
          })
          return
        }
        
        res.status(200).json({
          success: true,
          message: "Mensaje simulado enviado correctamente",
          timestamp: new Date().toISOString(),
          note: "Esta es una función de prueba"
        })
        break
        
      default:
        res.status(404).json({
          error: "Endpoint no encontrado",
          path: path,
          availableEndpoints: ["/status", "/init", "/qr", "/send-message"],
        })
    }
  })
})
