"use strict"
const __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        let desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get() {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
const __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", {enumerable: true, value: v})
      }
    : function (o, v) {
        o["default"] = v
      })
const __importStar =
  (this && this.__importStar) ||
  (function () {
    let ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          const ar = []
          for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
          return ar
        }
      return ownKeys(o)
    }
    return function (mod) {
      if (mod && mod.__esModule) return mod
      const result = {}
      if (mod != null)
        for (let k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i])
      __setModuleDefault(result, mod)
      return result
    }
  })()
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod}
  }
Object.defineProperty(exports, "__esModule", {value: true})
exports.whatsappApi = void 0
const functions = __importStar(require("firebase-functions"))
const cors_1 = __importDefault(require("cors"))
const baileys_1 = __importStar(require("@whiskeysockets/baileys"))
const path_1 = __importDefault(require("path"))
const os_1 = require("os")
// Configurar CORS
const corsHandler = (0, cors_1.default)({
  origin: true,
  credentials: true,
})
const whatsappState = {
  socket: null,
  qrCode: null,
  status: "disconnected",
  isReady: false,
  authDir: path_1.default.join((0, os_1.tmpdir)(), "baileys_auth"),
  lastQR: null,
  connectionTime: null,
  phoneNumber: null,
}
// Historial de mensajes enviados
const messageHistory = []
// Función para validar y formatear número de teléfono
const formatPhoneNumber = (number) => {
  // Remover espacios, guiones y símbolos
  let formatted = number.replace(/[\s\-()\\+]/g, "")
  // Si no empieza con código de país, asumir República Dominicana (+1809)
  if (!formatted.startsWith("1") && formatted.length === 10) {
    formatted = "1809" + formatted
  } else if (!formatted.startsWith("1") && formatted.length === 7) {
    formatted = "1809" + formatted
  }
  // Validar que sea un número válido
  if (!/^\d{11,15}$/.test(formatted)) {
    throw new Error("Número de teléfono inválido. Use formato: 18091234567")
  }
  return formatted + "@s.whatsapp.net"
}
// Función para validar si un número existe en WhatsApp
const checkWhatsAppNumber = async (socket, number) => {
  let _a
  try {
    const results = await socket.onWhatsApp(number)
    return (
      (results &&
        results.length > 0 &&
        Boolean((_a = results[0]) === null || _a === void 0 ? void 0 : _a.exists)) ||
      false
    )
  } catch (error) {
    console.log("⚠️ No se pudo verificar el número, intentando envío directo")
    return true // Asumir que existe si no se puede verificar
  }
}
// Función para inicializar WhatsApp con Baileys
const initializeWhatsApp = async () => {
  try {
    console.log("🚀 Inicializando WhatsApp con Baileys...")
    whatsappState.status = "connecting"
    // Preparar autenticación
    const {state, saveCreds} = await (0, baileys_1.useMultiFileAuthState)(whatsappState.authDir)
    // Crear socket de WhatsApp
    const socket = (0, baileys_1.default)({
      auth: state,
      printQRInTerminal: true,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: true,
    })
    whatsappState.socket = socket
    // Manejar eventos de conexión
    socket.ev.on("connection.update", (update) => {
      let _a, _b, _c, _d
      const {connection, lastDisconnect, qr} = update
      console.log("📡 Actualización de conexión:", {
        connection,
        qr: qr ? "QR disponible" : "Sin QR",
        lastDisconnect:
          (_a =
            lastDisconnect === null || lastDisconnect === void 0
              ? void 0
              : lastDisconnect.error) === null || _a === void 0
            ? void 0
            : _a.message,
      })
      // Manejar QR
      if (qr) {
        whatsappState.qrCode = qr
        whatsappState.status = "qr_ready"
        whatsappState.lastQR = new Date()
        console.log("📱 Nuevo QR generado")
      }
      // Manejar estado de conexión
      if (connection === "close") {
        whatsappState.isReady = false
        whatsappState.status = "disconnected"
        whatsappState.connectionTime = null
        whatsappState.phoneNumber = null
        const shouldReconnect =
          ((_c =
            (_b =
              lastDisconnect === null || lastDisconnect === void 0
                ? void 0
                : lastDisconnect.error) === null || _b === void 0
              ? void 0
              : _b.output) === null || _c === void 0
            ? void 0
            : _c.statusCode) !== baileys_1.DisconnectReason.loggedOut
        console.log("🔌 Conexión cerrada. Reconectar:", shouldReconnect)
        if (shouldReconnect) {
          console.log("🔄 Reintentando conexión...")
          setTimeout(() => initializeWhatsApp(), 5000)
        } else {
          whatsappState.status = "disconnected"
          whatsappState.socket = null
        }
      } else if (connection === "open") {
        whatsappState.status = "connected"
        whatsappState.isReady = true
        whatsappState.qrCode = null
        whatsappState.connectionTime = new Date()
        // Obtener número de teléfono conectado
        if ((_d = socket.user) === null || _d === void 0 ? void 0 : _d.id) {
          const decoded = (0, baileys_1.jidDecode)(socket.user.id)
          whatsappState.phoneNumber =
            (decoded === null || decoded === void 0 ? void 0 : decoded.user) || null
        }
        console.log("✅ WhatsApp conectado exitosamente")
        console.log("📱 Número conectado:", whatsappState.phoneNumber)
      }
    })
    // Guardar credenciales cuando cambien
    socket.ev.on("creds.update", saveCreds)
    // Manejar confirmaciones de entrega de mensajes
    socket.ev.on("messages.update", (messageUpdate) => {
      for (const {key, update} of messageUpdate) {
        const messageId = key.id
        const msgInHistory = messageHistory.find((msg) => msg.id === messageId)
        if (msgInHistory && update.status) {
          msgInHistory.status = update.status === 3 ? "delivered" : "sent"
          console.log(`📬 Mensaje ${messageId} actualizado a: ${msgInHistory.status}`)
        }
      }
    })
    // Manejar mensajes entrantes (opcional para logs)
    socket.ev.on("messages.upsert", (m) => {
      console.log("📩 Mensajes recibidos:", m.messages.length)
    })
    return true
  } catch (error) {
    console.error("❌ Error inicializando WhatsApp:", error)
    whatsappState.status = "error"
    whatsappState.socket = null
    return false
  }
}
// Función mejorada para enviar mensaje
const sendWhatsAppMessage = async (number, message, options = {}) => {
  let _a
  try {
    if (!whatsappState.socket || !whatsappState.isReady) {
      throw new Error("WhatsApp no está conectado. Estado actual: " + whatsappState.status)
    }
    // Formatear número
    const formattedNumber = formatPhoneNumber(number)
    console.log(`📤 Enviando mensaje a ${formattedNumber}`)
    // Validar si el número existe en WhatsApp (opcional)
    if (options.validateNumber !== false) {
      const numberExists = await checkWhatsAppNumber(whatsappState.socket, formattedNumber)
      if (!numberExists) {
        throw new Error("El número no tiene WhatsApp o no existe")
      }
      console.log("✅ Número validado en WhatsApp")
    }
    // Enviar mensaje
    const sentMessage = await whatsappState.socket.sendMessage(formattedNumber, {
      text: message,
    })
    const messageId =
      ((_a = sentMessage === null || sentMessage === void 0 ? void 0 : sentMessage.key) === null ||
      _a === void 0
        ? void 0
        : _a.id) || `msg_${Date.now()}`
    // Guardar en historial
    messageHistory.push({
      id: messageId,
      to: number,
      message,
      timestamp: new Date(),
      status: "sent",
    })
    console.log("✅ Mensaje enviado exitosamente, ID:", messageId)
    return {
      success: true,
      messageId,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("❌ Error enviando mensaje:", errorMessage)
    // Guardar error en historial
    messageHistory.push({
      id: `error_${Date.now()}`,
      to: number,
      message,
      timestamp: new Date(),
      status: "failed",
      error: errorMessage,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}
// Función para enviar mensaje con imagen
const sendWhatsAppImage = async (number, imageUrl, caption) => {
  let _a
  try {
    if (!whatsappState.socket || !whatsappState.isReady) {
      throw new Error("WhatsApp no está conectado")
    }
    const formattedNumber = formatPhoneNumber(number)
    console.log(`📸 Enviando imagen a ${formattedNumber}`)
    const sentMessage = await whatsappState.socket.sendMessage(formattedNumber, {
      image: {url: imageUrl},
      caption: caption || "",
    })
    const messageId =
      ((_a = sentMessage === null || sentMessage === void 0 ? void 0 : sentMessage.key) === null ||
      _a === void 0
        ? void 0
        : _a.id) || `img_${Date.now()}`
    messageHistory.push({
      id: messageId,
      to: number,
      message: `[IMAGEN] ${caption || "Sin descripción"}`,
      timestamp: new Date(),
      status: "sent",
    })
    console.log("✅ Imagen enviada exitosamente, ID:", messageId)
    return {
      success: true,
      messageId,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("❌ Error enviando imagen:", errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
// Función para reiniciar WhatsApp
const restartWhatsApp = async () => {
  try {
    console.log("🔄 Reiniciando WhatsApp...")
    // Cerrar conexión actual si existe
    if (whatsappState.socket) {
      await whatsappState.socket.logout()
      whatsappState.socket = null
    }
    // Limpiar estado
    whatsappState.qrCode = null
    whatsappState.status = "disconnected"
    whatsappState.isReady = false
    whatsappState.connectionTime = null
    whatsappState.phoneNumber = null
    // Reinicializar
    return await initializeWhatsApp()
  } catch (error) {
    console.error("❌ Error reiniciando WhatsApp:", error)
    whatsappState.status = "error"
    return false
  }
}
// Función auxiliar para mensajes de estado
function getStatusMessage(status) {
  switch (status) {
    case "disconnected":
      return "WhatsApp desconectado"
    case "connecting":
      return "Conectando a WhatsApp..."
    case "qr_ready":
      return "QR listo para escanear"
    case "connected":
      return "WhatsApp conectado y listo para enviar mensajes"
    case "error":
      return "Error en la conexión"
    default:
      return "Estado desconocido"
  }
}
// Función principal WhatsApp API
exports.whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    let _a, _b
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`)
    const path = req.path.replace("/whatsappApi", "") || req.path
    try {
      switch (path) {
        case "/status": {
          // Estado detallado
          const statusInfo = {
            status: whatsappState.status,
            isReady: whatsappState.isReady,
            hasQR: whatsappState.qrCode !== null,
            hasSocket: whatsappState.socket !== null,
            lastQR:
              ((_a = whatsappState.lastQR) === null || _a === void 0 ? void 0 : _a.toISOString()) ||
              null,
            connectionTime:
              ((_b = whatsappState.connectionTime) === null || _b === void 0
                ? void 0
                : _b.toISOString()) || null,
            phoneNumber: whatsappState.phoneNumber,
            timestamp: new Date().toISOString(),
            message: getStatusMessage(whatsappState.status),
            messageHistory: messageHistory.slice(-5), // Últimos 5 mensajes
          }
          console.log("📊 Estado actual:", statusInfo)
          res.status(200).json(statusInfo)
          break
        }
        case "/init": {
          console.log("🚀 Iniciando WhatsApp...")
          const initialized = await initializeWhatsApp()
          res.status(200).json({
            success: initialized,
            status: whatsappState.status,
            message: initialized ? "WhatsApp inicializando..." : "Error al inicializar",
            timestamp: new Date().toISOString(),
          })
          break
        }
        case "/qr": {
          console.log("📱 Solicitando QR...")
          // Auto-inicializar si es necesario
          if (whatsappState.status === "disconnected" && !whatsappState.socket) {
            console.log("🔄 Auto-inicializando...")
            await initializeWhatsApp()
          }
          if (whatsappState.qrCode) {
            try {
              // Importar qrcode dinámicamente
              const {toDataURL} = await Promise.resolve().then(() =>
                __importStar(require("qrcode"))
              )
              const qrImage = await toDataURL(whatsappState.qrCode, {
                width: 256,
                margin: 2,
                color: {
                  dark: "#000000",
                  light: "#FFFFFF",
                },
              })
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
                status: whatsappState.status,
                hasQR: false,
                details: error instanceof Error ? error.message : "Error desconocido",
              })
            }
          } else {
            res.status(200).json({
              status: whatsappState.status,
              message: "QR no disponible aún",
              hasQR: false,
              timestamp: new Date().toISOString(),
              note: "Espera unos segundos y vuelve a intentar",
            })
          }
          break
        }
        case "/send-message": {
          if (req.method !== "POST") {
            res.status(405).json({error: "Método no permitido"})
            return
          }
          const {number, message, validateNumber = true} = req.body
          if (!number || !message) {
            res.status(400).json({
              error: "Número y mensaje son requeridos",
              example: {
                number: "18091234567",
                message: "Hola desde la Academia Musical",
                validateNumber: true,
              },
            })
            return
          }
          if (!whatsappState.isReady) {
            res.status(400).json({
              error: "WhatsApp no está conectado",
              status: whatsappState.status,
              message: "Conecta WhatsApp escaneando el QR primero",
            })
            return
          }
          console.log(`📤 Enviando mensaje a ${number}: ${message.substring(0, 50)}...`)
          const result = await sendWhatsAppMessage(number, message, {validateNumber})
          res.status(result.success ? 200 : 500).json({
            success: result.success,
            messageId: result.messageId,
            message: result.success ? "Mensaje enviado correctamente" : result.error,
            timestamp: new Date().toISOString(),
            to: number,
          })
          break
        }
        case "/send-image": {
          if (req.method !== "POST") {
            res.status(405).json({error: "Método no permitido"})
            return
          }
          const {number, imageUrl, caption} = req.body
          if (!number || !imageUrl) {
            res.status(400).json({
              error: "Número e imagen son requeridos",
              example: {
                number: "18091234567",
                imageUrl: "https://example.com/image.jpg",
                caption: "Descripción opcional",
              },
            })
            return
          }
          if (!whatsappState.isReady) {
            res.status(400).json({
              error: "WhatsApp no está conectado",
              status: whatsappState.status,
            })
            return
          }
          const result = await sendWhatsAppImage(number, imageUrl, caption)
          res.status(result.success ? 200 : 500).json({
            success: result.success,
            messageId: result.messageId,
            message: result.success ? "Imagen enviada correctamente" : result.error,
            timestamp: new Date().toISOString(),
          })
          break
        }
        case "/history": {
          res.status(200).json({
            messages: messageHistory.slice(-20), // Últimos 20 mensajes
            total: messageHistory.length,
            timestamp: new Date().toISOString(),
          })
          break
        }
        case "/restart": {
          console.log("🔄 Reiniciando WhatsApp...")
          const restarted = await restartWhatsApp()
          res.status(200).json({
            success: restarted,
            status: whatsappState.status,
            message: restarted ? "WhatsApp reiniciado" : "Error al reiniciar",
            timestamp: new Date().toISOString(),
          })
          break
        }
        default:
          res.status(404).json({
            error: "Endpoint no encontrado",
            path,
            availableEndpoints: [
              "/status",
              "/init",
              "/qr",
              "/send-message",
              "/send-image",
              "/history",
              "/restart",
            ],
          })
      }
    } catch (error) {
      console.error("❌ Error en WhatsApp API:", error)
      res.status(500).json({
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      })
    }
  })
})
// Auto-inicializar al cargar (opcional)
console.log("🌟 Módulo WhatsApp con mensajería avanzada cargado. Listo para conexiones.")
//# sourceMappingURL=whatsappMessaging.js.map
