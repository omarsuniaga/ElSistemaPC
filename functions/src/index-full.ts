import * as functions from 'firebase-functions';
import cors from 'cors';
import * as admin from 'firebase-admin';
import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { toDataURL } from 'qrcode';
import { Boom } from '@hapi/boom';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configurar CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// Estado global de WhatsApp
let sock: any = null;
let qrCode: string | null = null;
let connectionStatus = 'disconnected';

// Función para inicializar WhatsApp
const initializeWhatsApp = async () => {
  try {
    console.log('🚀 Inicializando WhatsApp con Baileys...');

    const { version } = await fetchLatestBaileysVersion();

    // Usar auth state en memoria por simplicidad
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' }) as any,
        fatal: () => {},
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
      } as any,
    });

    sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 QR Code generado!');
        qrCode = qr;
        connectionStatus = 'qr_ready';
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔄 Conexión cerrada. Reconectando?', shouldReconnect);

        if (shouldReconnect) {
          connectionStatus = 'reconnecting';
          setTimeout(() => initializeWhatsApp(), 3000);
        } else {
          connectionStatus = 'disconnected';
          qrCode = null;
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp conectado!');
        connectionStatus = 'connected';
        qrCode = null;
      }
    });

    sock.ev.on('creds.update', saveCreds);

    return true;
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    connectionStatus = 'error';
    return false;
  }
};

// Función principal WhatsApp API
export const whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);

    const path = req.path.replace('/whatsappApi', '') || req.path;

    switch (path) {
    case '/status':
      res.status(200).json({
        status: connectionStatus,
        message: `Estado actual: ${connectionStatus}`,
        timestamp: new Date().toISOString(),
        hasQR: qrCode !== null,
        clientConnected: sock !== null,
      });
      break;

    case '/init':
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        const initialized = await initializeWhatsApp();
        res.status(200).json({
          success: initialized,
          status: connectionStatus,
          message: initialized ? 'WhatsApp inicializado' : 'Error al inicializar',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(200).json({
          success: true,
          status: connectionStatus,
          message: 'WhatsApp ya está inicializado',
          timestamp: new Date().toISOString(),
        });
      }
      break;

    case '/qr':
      // Auto-inicializar si no está iniciado
      if (connectionStatus === 'disconnected') {
        await initializeWhatsApp();

        // Esperar un poco para que se genere el QR
        let attempts = 0;
        while (!qrCode && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }
      }

      if (qrCode) {
        try {
          // Generar imagen QR
          const qrImage = await toDataURL(qrCode, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          // Convertir a buffer y enviar como imagen
          const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');

          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.status(200).send(imgBuffer);
        } catch (error) {
          console.error('Error generando imagen QR:', error);
          res.status(500).json({
            error: 'Error generando imagen QR',
            status: connectionStatus,
            hasQR: false,
          });
        }
      } else {
        res.status(200).json({
          status: connectionStatus,
          message:
              connectionStatus === 'connected' ? 'Ya está conectado' : 'QR no disponible aún',
          hasQR: false,
          timestamp: new Date().toISOString(),
        });
      }
      break;

    case '/send-message':
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return;
      }

      if (connectionStatus !== 'connected' || !sock) {
        res.status(400).json({
          error: 'WhatsApp no está conectado',
          status: connectionStatus,
        });
        return;
      }

      const { number, message } = req.body;

      if (!number || !message) {
        res.status(400).json({
          error: 'Número y mensaje son requeridos',
        });
        return;
      }

      try {
        const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });

        res.status(200).json({
          success: true,
          message: 'Mensaje enviado correctamente',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({
          error: 'Error enviando mensaje',
          details: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
      break;

    default:
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path,
        availableEndpoints: ['/status', '/init', '/qr', '/send-message'],
      });
    }
  });
});
