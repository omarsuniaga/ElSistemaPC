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
exports.activateWhatsApp = exports.whatsappApi = void 0;
const functions = __importStar(require('firebase-functions'));
const cors_1 = __importDefault(require('cors'));
// Configurar CORS
const corsHandler = (0, cors_1.default)({
  origin: true,
  credentials: true,
});
// Estado global de WhatsApp
let whatsappClient = null;
let whatsappStatus = 'disconnected';
// Función de inicialización
const initializeWhatsApp = async () => {
  try {
    console.log('🚀 Inicializando WhatsApp...');
    // Aquí iría la lógica de Baileys
    // Por ahora simulamos la inicialización
    whatsappStatus = 'initializing';
    // Simular proceso de inicialización
    await new Promise((resolve) => setTimeout(resolve, 2000));
    whatsappStatus = 'waiting_for_qr';
    console.log('✅ WhatsApp inicializado - esperando QR');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    whatsappStatus = 'error';
    return false;
  }
};
// Función principal WhatsApp
exports.whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);
    const path = req.path.replace('/whatsappApi', '') || req.path;
    switch (path) {
    case '/status':
      res.status(200).json({
        status: whatsappStatus,
        message: `Estado actual: ${whatsappStatus}`,
        timestamp: new Date().toISOString(),
        clientConnected: whatsappClient !== null,
      });
      break;
    case '/init':
      // Endpoint para inicializar WhatsApp
      const initialized = await initializeWhatsApp();
      res.status(200).json({
        success: initialized,
        status: whatsappStatus,
        message: initialized ? 'WhatsApp inicializado' : 'Error al inicializar',
        timestamp: new Date().toISOString(),
      });
      break;
    case '/qr':
      if (whatsappStatus === 'disconnected') {
        // Auto-inicializar si no está iniciado
        await initializeWhatsApp();
      }
      res.status(200).json({
        status: whatsappStatus,
        message: 'QR en modo diagnóstico',
        qr_data: 'simulated_qr_data',
        timestamp: new Date().toISOString(),
      });
      break;
    case '/restart':
      // Endpoint para reiniciar WhatsApp
      whatsappClient = null;
      whatsappStatus = 'disconnected';
      const restarted = await initializeWhatsApp();
      res.status(200).json({
        success: restarted,
        status: whatsappStatus,
        message: 'WhatsApp reiniciado',
        timestamp: new Date().toISOString(),
      });
      break;
    default:
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path,
        availableEndpoints: ['/status', '/init', '/qr', '/restart'],
      });
    }
  });
});
// Función de activación automática (se ejecuta al desplegar)
exports.activateWhatsApp = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log('🔥 Activación automática de WhatsApp');
    const initialized = await initializeWhatsApp();
    res.status(200).json({
      message: 'WhatsApp activado automáticamente',
      success: initialized,
      status: whatsappStatus,
      timestamp: new Date().toISOString(),
    });
  });
});
//# sourceMappingURL=index-with-init.js.map
