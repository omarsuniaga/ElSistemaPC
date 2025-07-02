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
const admin = __importStar(require("firebase-admin"))
const baileys_1 = require("@whiskeysockets/baileys")
const firestore_1 = require("@google-cloud/firestore")
const qrcode_1 = require("qrcode")
const qr = __importStar(require("qr-image"))
const pino_1 = __importDefault(require("pino"))
admin.initializeApp()
const db = new firestore_1.Firestore()
const SESSION_COLLECTION = "whatsappSessions"
// Custom logger to bridge Pino with Firebase Functions logger
const baileysLogger = {
  fatal: (msg, ...args) => functions.logger.error(msg, ...args),
  error: (msg, ...args) => functions.logger.error(msg, ...args),
  warn: (msg, ...args) => functions.logger.warn(msg, ...args),
  info: (msg, ...args) => functions.logger.info(msg, ...args),
  debug: (msg, ...args) => functions.logger.debug(msg, ...args),
  trace: (msg, ...args) => functions.logger.debug(msg, ...args),
  child: (bindings) => {
    return (0, pino_1.default)(bindings).child({level: "info"})
  },
}
const useFirestoreAuthState = async (sessionId) => {
  const docRef = db.collection(SESSION_COLLECTION).doc(sessionId)
  const writeData = async (data) => {
    await docRef.set(data, {merge: true})
  }
  const readData = async () => {
    const doc = await docRef.get()
    return doc.data()
  }
  let creds
  let keys = {}
  const data = await readData()
  if (data) {
    creds = data.creds
    keys = data.keys
  } else {
    creds = {}
    keys = {}
  }
  return {
    state: {
      creds,
      keys: (0, baileys_1.makeCacheableSignalKeyStore)(keys, baileysLogger),
    },
    saveCreds: async () => {
      await writeData({creds, keys})
    },
  }
}
let sock = null
let qrCodeData = null
let connectionStatus = "disconnected"
const startWhatsappClient = async (sessionId) => {
  if (sock) return sock
  const {state, saveCreds} = await useFirestoreAuthState(sessionId)
  const {version} = await (0, baileys_1.fetchLatestBaileysVersion)()
  sock = (0, baileys_1.makeWASocket)({
    version,
    logger: baileysLogger, // Cast to any to bypass strict type checking for now
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: state.keys,
    },
    browser: ["Music Academy App", "Chrome", "1.0"],
  })
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", async (update) => {
    let _a, _b
    const {connection, lastDisconnect, qr} = update
    if (qr) {
      qrCodeData = await (0, qrcode_1.toDataURL)(qr)
      functions.logger.info("QR Code generated")
    }
    if (connection === "close") {
      const shouldReconnect =
        ((_b =
          (_a =
            lastDisconnect === null || lastDisconnect === void 0
              ? void 0
              : lastDisconnect.error) === null || _a === void 0
            ? void 0
            : _a.output) === null || _b === void 0
          ? void 0
          : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut
      functions.logger.info(
        "Connection closed due to ",
        lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      )
      // reset sock and qrCodeData on logout
      if (!shouldReconnect) {
        sock = null
        qrCodeData = null
        connectionStatus = "logged_out"
        await db.collection(SESSION_COLLECTION).doc(sessionId).delete()
      }
      if (shouldReconnect) {
        connectionStatus = "reconnecting"
        startWhatsappClient(sessionId)
      }
    } else if (connection === "open") {
      functions.logger.info("Opened connection")
      connectionStatus = "connected"
      qrCodeData = null // Clear QR code once connected
    }
  })
  sock.ev.on("messages.upsert", async (m) => {
    functions.logger.info("Received messages", JSON.stringify(m))
    // Handle incoming messages here if needed
  })
  return sock
}
exports.whatsappApi = functions.https.onRequest(async (req, res) => {
  const sessionId = "default" // You can make this dynamic if you need multiple WhatsApp instances
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.set("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }
  try {
    await startWhatsappClient(sessionId)
    if (req.path === "/whatsappApi/qr" && req.method === "GET") {
      if (qrCodeData) {
        const imageBuffer = qr.imageSync(qrCodeData, {type: "png"})
        res.writeHead(200, {"Content-Type": "image/png"})
        res.end(imageBuffer, "binary")
      } else if (connectionStatus === "connected") {
        res
          .status(200)
          .send({status: "connected", message: "WhatsApp client is already connected."})
      } else if (connectionStatus === "logged_out") {
        res.status(200).send({
          status: "logged_out",
          message: "WhatsApp client logged out. Please request QR again to re-authenticate.",
        })
      } else {
        res.status(202).send({
          status: "waiting_for_qr",
          message: "Waiting for QR code to be generated. Please try again shortly.",
        })
      }
    } else if (req.path === "/whatsappApi/send-message" && req.method === "POST") {
      if (connectionStatus !== "connected") {
        res.status(400).send({
          status: connectionStatus,
          message: "WhatsApp client not connected. Cannot send message.",
        })
        return
      }
      const {to, message} = req.body
      if (!to || !message) {
        res.status(400).send("Missing 'to' or 'message' in request body.")
        return
      }
      await sock.sendMessage(to, {text: message})
      res.status(200).send("Message sent successfully!")
    } else if (req.path === "/whatsappApi/status" && req.method === "GET") {
      res.status(200).send({status: connectionStatus})
    } else {
      res.status(404).send("Not Found")
    }
  } catch (error) {
    functions.logger.error("Error in whatsappApi:", error)
    res.status(500).send(`Internal Server Error: ${error.message}`)
  }
})
//# sourceMappingURL=index-backup.js.map
