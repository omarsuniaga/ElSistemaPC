'use strict';
const __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
      if (k2 === undefined) k2 = k;
      let desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
          enumerable: true,
          get() {
            return m[k];
          },
        };
      }
      Object.defineProperty(o, k2, desc);
    }
    : function (o, m, k, k2) {
      if (k2 === undefined) k2 = k;
      o[k2] = m[k];
    });
const __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
      Object.defineProperty(o, 'default', { enumerable: true, value: v });
    }
    : function (o, v) {
      o['default'] = v;
    });
const __importStar =
  (this && this.__importStar) ||
  (function () {
    let ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          const ar = [];
          for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      const result = {};
      if (mod != null)
        for (let k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.whatsappApi = void 0;
const functions = __importStar(require('firebase-functions'));
const cors_1 = __importDefault(require('cors'));
const baileys_1 = __importStar(require('@whiskeysockets/baileys'));
const path_1 = __importDefault(require('path'));
const os_1 = require('os');
// Configurar CORS
const corsHandler = (0, cors_1.default)({
  origin: true,
  credentials: true,
});
const whatsappState = {
  socket: null,
  qrCode: null,
  status: 'disconnected',
  isReady: false,
  authDir: path_1.default.join((0, os_1.tmpdir)(), 'baileys_auth'),
  lastQR: null,
};
// Función para inicializar WhatsApp con Baileys
const initializeWhatsApp = async () => {
  try {
    console.log('🚀 Inicializando WhatsApp con Baileys...');
    whatsappState.status = 'connecting';
    // Preparar autenticación
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(whatsappState.authDir);
    // Crear socket de WhatsApp
    const socket = (0, baileys_1.default)({
      auth: state,
      printQRInTerminal: true, // Para debug en logs
      logger: functions.logger,
      defaultQueryTimeoutMs: 60000,
    });
    whatsappState.socket = socket;
    // Manejar eventos de conexión
    socket.ev.on('connection.update', (update) => {
      let _a, _b, _c;
      const { connection, lastDisconnect, qr } = update;
      console.log('📡 Actualización de conexión:', {
        connection,
        qr: qr ? 'QR disponible' : 'Sin QR',
        lastDisconnect:
          (_a =
            lastDisconnect === null || lastDisconnect === void 0
              ? void 0
              : lastDisconnect.error) === null || _a === void 0
            ? void 0
            : _a.message,
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
          ((_c =
            (_b =
              lastDisconnect === null || lastDisconnect === void 0
                ? void 0
                : lastDisconnect.error) === null || _b === void 0
              ? void 0
              : _b.output) === null || _c === void 0
            ? void 0
            : _c.statusCode) !== baileys_1.DisconnectReason.loggedOut;
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
        whatsappState.qrCode = null; // Limpiar QR al conectar
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
const sendWhatsAppMessage = async (number, message) => {
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
const restartWhatsApp = async () => {
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
// Función principal WhatsApp API
exports.whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    let _a;
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);
    const path = req.path.replace('/whatsappApi', '') || req.path;
    try {
      switch (path) {
      case '/status':
        // Estado detallado
        const statusInfo = {
          status: whatsappState.status,
          isReady: whatsappState.isReady,
          hasQR: whatsappState.qrCode !== null,
          hasSocket: whatsappState.socket !== null,
          lastQR:
              ((_a = whatsappState.lastQR) === null || _a === void 0 ? void 0 : _a.toISOString()) ||
              null,
          timestamp: new Date().toISOString(),
          message: getStatusMessage(whatsappState.status),
        };
        console.log('📊 Estado actual:', statusInfo);
        res.status(200).json(statusInfo);
        break;
      case '/init':
        console.log('🚀 Iniciando WhatsApp...');
        const initialized = await initializeWhatsApp();
        res.status(200).json({
          success: initialized,
          status: whatsappState.status,
          message: initialized ? 'WhatsApp inicializando...' : 'Error al inicializar',
          timestamp: new Date().toISOString(),
        });
        break;
      case '/qr':
        console.log('📱 Solicitando QR...');
        // Auto-inicializar si es necesario
        if (whatsappState.status === 'disconnected' && !whatsappState.socket) {
          console.log('🔄 Auto-inicializando...');
          await initializeWhatsApp();
        }
        if (whatsappState.qrCode) {
          try {
            // Importar qrcode dinámicamente
            const { toDataURL } = await Promise.resolve().then(() =>
              __importStar(require('qrcode')),
            );
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
      case '/send-message':
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
      case '/restart':
        console.log('🔄 Reiniciando WhatsApp...');
        const restarted = await restartWhatsApp();
        res.status(200).json({
          success: restarted,
          status: whatsappState.status,
          message: restarted ? 'WhatsApp reiniciado' : 'Error al reiniciar',
          timestamp: new Date().toISOString(),
        });
        break;
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
// Función auxiliar para mensajes de estado
function getStatusMessage(status) {
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
// Auto-inicializar al cargar (opcional)
console.log('🌟 Módulo WhatsApp cargado. Listo para conexiones.');
//# sourceMappingURL=whatsappBaileys.js.map
