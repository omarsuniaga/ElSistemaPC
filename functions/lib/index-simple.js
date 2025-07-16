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
exports.whatsappApi = exports.testApi = void 0;
const functions = __importStar(require('firebase-functions'));
const cors_1 = __importDefault(require('cors'));
// Configurar CORS
const corsHandler = (0, cors_1.default)({
  origin: true,
  credentials: true,
});
// Función de diagnóstico simple
exports.testApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    console.log('🔍 Test API llamada recibida');
    const response = {
      status: 'ok',
      message: 'Firebase Function está funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
    };
    res.status(200).json(response);
  });
});
// Función principal WhatsApp (simplificada para diagnóstico)
exports.whatsappApi = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);
    const path = req.path.replace('/whatsappApi', '') || req.path;
    switch (path) {
    case '/status':
      res.status(200).json({
        status: 'disconnected',
        message: 'Función funcionando - WhatsApp no conectado aún',
        timestamp: new Date().toISOString(),
      });
      break;
    case '/qr':
      res.status(200).json({
        status: 'waiting_for_qr',
        message: 'Generar QR - Función en modo diagnóstico',
        timestamp: new Date().toISOString(),
      });
      break;
    default:
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path,
        availableEndpoints: ['/status', '/qr'],
      });
    }
  });
});
//# sourceMappingURL=index-simple.js.map
