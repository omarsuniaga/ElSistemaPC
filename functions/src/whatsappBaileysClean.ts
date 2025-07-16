import * as functions from 'firebase-functions';
import cors from 'cors';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { tmpdir } from 'os';

// Configurar CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// Estado global de WhatsApp
interface WhatsAppState {
  socket: WASocket | null
  qrCode: string | null
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error'
  isReady: boolean
  authDir: string
  lastQR: Date | null
}

const whatsappState: WhatsAppState = {
  socket: null,
  qrCode: null,
  status: 'disconnected',
  isReady: false,
  authDir: path.join(tmpdir(), 'baileys_auth'),
  lastQR: null,
};

// Función para inicializar WhatsApp con Baileys
const initializeWhatsApp = async (): Promise<boolean> => {
  try {
    console.log('🚀 Inicializando WhatsApp con Baileys...');
    whatsappState.status = 'connecting';

    // Preparar autenticación
    const { state, saveCreds } = await useMultiFileAuthState(whatsappState.authDir);

    // Crear socket de WhatsApp
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      defaultQueryTimeoutMs: 60000,
    });

    whatsappState.socket = socket;

    // Manejar eventos de conexión
    socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      console.log('📡 Actualización de conexión:', {
        connection,
        qr: qr ? 'QR disponible' : 'Sin QR',
        lastDisconnect: lastDisconnect?.error?.message,
      });

      // Manejar QR
      if (qr) {
        whatsappState.qrCode = qr;
        whatsappState.status = 'qr_ready';
        whatsappState.lastQR = new Date();
        console.log('📱 Nuevo QR generado');
      }

      // Manejar estado de conexión
      if (connection === 'close') {
        whatsappState.isReady = false;
        whatsappState.status = 'disconnected';

        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        console.log('🔌 Conexión cerrada. Reconectar:', shouldReconnect);

        if (shouldReconnect) {
          console.log('🔄 Reintentando conexión...');
          setTimeout(() => initializeWhatsApp(), 5000);
        } else {
          whatsappState.status = 'disconnected';
          whatsappState.socket = null;
        }
      } else if (connection === 'open') {
        whatsappState.status = 'connected';
        whatsappState.isReady = true;
        whatsappState.qrCode = null;
        console.log('✅ WhatsApp conectado exitosamente');
      }
    });

    // Guardar credenciales cuando cambien
    socket.ev.on('creds.update', saveCreds);

    // Manejar mensajes (opcional para logs)
    socket.ev.on('messages.upsert', (m) => {
      console.log('📩 Mensajes recibidos:', m.messages.length);
    });

    return true;
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    whatsappState.status = 'error';
    whatsappState.socket = null;
    return false;
  }
};

// Función para enviar mensaje
const sendWhatsAppMessage = async (number: string, message: string): Promise<boolean> => {
  try {
    if (!whatsappState.socket || !whatsappState.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    // Formatear número
    const formattedNumber = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;

    console.log(`📤 Enviando mensaje a ${formattedNumber}`);

    await whatsappState.socket.sendMessage(formattedNumber, { text: message });

    console.log('✅ Mensaje enviado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    return false;
  }
};

// Función para reiniciar WhatsApp
const restartWhatsApp = async (): Promise<boolean> => {
  try {
    console.log('🔄 Reiniciando WhatsApp...');

    // Cerrar conexión actual si existe
    if (whatsappState.socket) {
      await whatsappState.socket.logout();
      whatsappState.socket = null;
    }

    // Limpiar estado
    whatsappState.qrCode = null;
    whatsappState.status = 'disconnected';
    whatsappState.isReady = false;

    // Reinicializar
    return await initializeWhatsApp();
  } catch (error) {
    console.error('❌ Error reiniciando WhatsApp:', error);
    whatsappState.status = 'error';
    return false;
  }
};

// Función auxiliar para mensajes de estado
function getStatusMessage(status: string): string {
  switch (status) {
  case 'disconnected':
    return 'WhatsApp desconectado';
  case 'connecting':
    return 'Conectando a WhatsApp...';
  case 'qr_ready':
    return 'QR listo para escanear';
  case 'connected':
    return 'WhatsApp conectado y listo';
  case 'error':
    return 'Error en la conexión';
  default:
    return 'Estado desconocido';
  }
}

// Función principal WhatsApp API
export const whatsappApi = functions.https.onRequest((req: any, res: any) => {
  corsHandler(req, res, async () => {
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);

    const path = req.path.replace('/whatsappApi', '') || req.path;

    try {
      switch (path) {
      case '/status': {
        // Estado detallado
        const statusInfo = {
          status: whatsappState.status,
          isReady: whatsappState.isReady,
          hasQR: whatsappState.qrCode !== null,
          hasSocket: whatsappState.socket !== null,
          lastQR: whatsappState.lastQR?.toISOString() || null,
          timestamp: new Date().toISOString(),
          message: getStatusMessage(whatsappState.status),
        };

        console.log('📊 Estado actual:', statusInfo);
        res.status(200).json(statusInfo);
        break;
      }

      case '/init': {
        console.log('🚀 Iniciando WhatsApp...');
        const initialized = await initializeWhatsApp();

        res.status(200).json({
          success: initialized,
          status: whatsappState.status,
          message: initialized ? 'WhatsApp inicializando...' : 'Error al inicializar',
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case '/qr': {
        console.log('📱 Solicitando QR...');

        // Auto-inicializar si es necesario
        if (whatsappState.status === 'disconnected' && !whatsappState.socket) {
          console.log('🔄 Auto-inicializando...');
          await initializeWhatsApp();
        }

        if (whatsappState.qrCode) {
          try {
            // Importar qrcode dinámicamente
            const { toDataURL } = await import('qrcode');

            const qrImage = await toDataURL(whatsappState.qrCode, {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });

            const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.status(200).send(imgBuffer);
          } catch (error) {
            console.error('❌ Error generando imagen QR:', error);
            res.status(500).json({
              error: 'Error generando imagen QR',
              status: whatsappState.status,
              hasQR: false,
              details: error instanceof Error ? error.message : 'Error desconocido',
            });
          }
        } else {
          res.status(200).json({
            status: whatsappState.status,
            message: 'QR no disponible aún',
            hasQR: false,
            timestamp: new Date().toISOString(),
            note: 'Espera unos segundos y vuelve a intentar',
          });
        }
        break;
      }

      case '/send-message': {
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Método no permitido' });
          return;
        }

        const { number, message } = req.body;

        if (!number || !message) {
          res.status(400).json({
            error: 'Número y mensaje son requeridos',
          });
          return;
        }

        if (!whatsappState.isReady) {
          res.status(400).json({
            error: 'WhatsApp no está conectado',
            status: whatsappState.status,
            message: 'Conecta WhatsApp escaneando el QR primero',
          });
          return;
        }

        console.log(`📤 Enviando mensaje a ${number}`);
        const sent = await sendWhatsAppMessage(number, message);

        res.status(sent ? 200 : 500).json({
          success: sent,
          message: sent ? 'Mensaje enviado correctamente' : 'Error al enviar mensaje',
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case '/restart': {
        console.log('🔄 Reiniciando WhatsApp...');
        const restarted = await restartWhatsApp();

        res.status(200).json({
          success: restarted,
          status: whatsappState.status,
          message: restarted ? 'WhatsApp reiniciado' : 'Error al reiniciar',
          timestamp: new Date().toISOString(),
        });
        break;
      }

      default:
        res.status(404).json({
          error: 'Endpoint no encontrado',
          path,
          availableEndpoints: ['/status', '/init', '/qr', '/send-message', '/restart'],
        });
      }
    } catch (error) {
      console.error('❌ Error en WhatsApp API:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      });
    }
  });
});

// Auto-inicializar al cargar (opcional)
console.log('🌟 Módulo WhatsApp cargado. Listo para conexiones.');
