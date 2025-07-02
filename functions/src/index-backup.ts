import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys"
import {Firestore} from "@google-cloud/firestore"
import {toDataURL} from "qrcode"
import * as qr from "qr-image"
import {Boom} from "@hapi/boom"
import Pino from "pino"

admin.initializeApp()
const db = new Firestore()

const SESSION_COLLECTION = "whatsappSessions"

interface SessionData {
  creds: any
  keys: any
}

// Custom logger to bridge Pino with Firebase Functions logger
const baileysLogger = {
  fatal: (msg: string, ...args: any[]) => functions.logger.error(msg, ...args),
  error: (msg: string, ...args: any[]) => functions.logger.error(msg, ...args),
  warn: (msg: string, ...args: any[]) => functions.logger.warn(msg, ...args),
  info: (msg: string, ...args: any[]) => functions.logger.info(msg, ...args),
  debug: (msg: string, ...args: any[]) => functions.logger.debug(msg, ...args),
  trace: (msg: string, ...args: any[]) => functions.logger.debug(msg, ...args),
  child: (bindings: any) => {
    return Pino(bindings).child({level: "info"})
  },
}

const useFirestoreAuthState = async (sessionId: string) => {
  const docRef = db.collection(SESSION_COLLECTION).doc(sessionId)

  const writeData = async (data: any) => {
    await docRef.set(data, {merge: true})
  }

  const readData = async () => {
    const doc = await docRef.get()
    return doc.data() as SessionData | undefined
  }

  let creds: any
  let keys: any = {}

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
      keys: makeCacheableSignalKeyStore(keys, baileysLogger as any),
    },
    saveCreds: async () => {
      await writeData({creds, keys})
    },
  }
}

let sock: any = null
let qrCodeData: string | null = null
let connectionStatus: string = "disconnected"

const startWhatsappClient = async (sessionId: string) => {
  if (sock) return sock

  const {state, saveCreds} = await useFirestoreAuthState(sessionId)
  const {version} = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger: baileysLogger as any, // Cast to any to bypass strict type checking for now
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: state.keys,
    },
    browser: ["Music Academy App", "Chrome", "1.0"],
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update: any) => {
    const {connection, lastDisconnect, qr} = update

    if (qr) {
      qrCodeData = await toDataURL(qr)
      functions.logger.info("QR Code generated")
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      functions.logger.info(
        "Connection closed due to ",
        lastDisconnect?.error,
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

  sock.ev.on("messages.upsert", async (m: any) => {
    functions.logger.info("Received messages", JSON.stringify(m))
    // Handle incoming messages here if needed
  })

  return sock
}

export const whatsappApi = functions.https.onRequest(async (req, res) => {
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
  } catch (error: any) {
    functions.logger.error("Error in whatsappApi:", error)
    res.status(500).send(`Internal Server Error: ${error.message}`)
  }
})
