import * as functions from 'firebase-functions';
import cors from 'cors';

// Configurar CORS
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// Estado global de WhatsApp
let whatsappClient: any = null;
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
export const whatsappApi = functions.https.onRequest((req, res) => {
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
export const activateWhatsApp = functions.https.onRequest((req, res) => {
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
