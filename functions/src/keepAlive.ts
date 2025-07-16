import * as functions from 'firebase-functions';
import { https } from 'firebase-functions/v1';

/**
 * Función programada para mantener activo el servicio de WhatsApp
 * Se ejecuta cada 10 minutos para evitar que la función principal entre en estado de reposo
 *
 * Esta función elimina la dependencia del cliente para mantener el servicio activo
 * Garantiza disponibilidad 24/7 sin intervención del usuario
 */
export const keepWhatsAppAlive = functions.pubsub
  .schedule('every 10 minutes')
  .timeZone('America/Santo_Domingo') // Zona horaria de República Dominicana
  .onRun(async (context) => {
    try {
      console.log('🔄 Ejecutando keep-alive para WhatsApp service...');

      // Hacer ping al endpoint de status para mantener la función activa
      const functionUrl = 'https://whatsappapi-4ffilcsmva-uc.a.run.app/status';

      // Usar fetch nativo de Node.js
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Firebase-KeepAlive/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Keep-alive exitoso. Estado WhatsApp:', {
          status: data.status,
          isReady: data.isReady,
          timestamp: new Date().toISOString(),
        });

        // Log adicional para monitoreo
        if (data.status === 'connected') {
          console.log('🟢 WhatsApp service está activo y conectado');
        } else if (data.status === 'connecting') {
          console.log('🟡 WhatsApp service está en proceso de conexión');
        } else {
          console.log('🔴 WhatsApp service requiere atención:', data.status);
        }

        return {
          success: true,
          status: data.status,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error en keep-alive:', error);

      // No fallar silenciosamente - log para debugging
      const errorDetails = {
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
        context: context.eventId,
      };

      console.error('📊 Detalles del error keep-alive:', errorDetails);

      // Retornar error para monitoreo en Firebase Console
      return {
        success: false,
        error: errorDetails,
      };
    }
  });

/**
 * Función HTTP alternativa para verificar el estado del keep-alive
 * Útil para debugging y monitoreo manual
 */
export const keepAliveStatus = https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Información sobre la función keep-alive
    const keepAliveInfo = {
      service: 'WhatsApp Keep-Alive Service',
      status: 'active',
      schedule: 'every 10 minutes',
      timezone: 'America/Santo_Domingo',
      target: 'https://whatsappapi-4ffilcsmva-uc.a.run.app/status',
      lastCheck: new Date().toISOString(),
      description: 'Mantiene activo el servicio WhatsApp para eliminar dependencia del cliente',
    };

    res.status(200).json({
      success: true,
      data: keepAliveInfo,
    });
  } catch (error) {
    console.error('Error en keepAliveStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
});
