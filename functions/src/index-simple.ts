import * as functions from 'firebase-functions';
import cors from 'cors';

// Configurar CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// Función de diagnóstico simple
export const testApi = functions.https.onRequest((req, res) => {
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
export const whatsappApi = functions.https.onRequest((req, res) => {
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
