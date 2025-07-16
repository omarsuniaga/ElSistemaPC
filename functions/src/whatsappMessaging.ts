import * as functions from 'firebase-functions';
import cors from 'cors';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  jidDecode,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { tmpdir } from 'os';
import { securityMiddleware, getSecurityStats } from './security';

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
  connectionTime: Date | null
  phoneNumber: string | null
}

const whatsappState: WhatsAppState = {
  socket: null,
  qrCode: null,
  status: 'disconnected',
  isReady: false,
  authDir: path.join(tmpdir(), 'baileys_auth'),
  lastQR: null,
  connectionTime: null,
  phoneNumber: null,
};

// Historial de mensajes enviados
const messageHistory: Array<{
  id: string
  to: string
  message: string
  timestamp: Date
  status: 'sent' | 'delivered' | 'read' | 'failed'
  error?: string
}> = [];

// Configuración de rate limiting y prevención de bloqueos
interface BulkSendConfig {
  maxBatchSize: number // Máximo de mensajes por lote
  minDelay: number // Retraso mínimo entre mensajes (ms)
  maxDelay: number // Retraso máximo entre mensajes (ms)
  maxDailyMessages: number // Límite diario de mensajes
  cooldownBetweenBatches: number // Pausa entre lotes (ms)
}

const bulkConfig: BulkSendConfig = {
  maxBatchSize: 50, // Máximo 50 mensajes por lote
  minDelay: 500, // Mínimo 500ms entre mensajes
  maxDelay: 1500, // Máximo 1.5s entre mensajes
  maxDailyMessages: 1000, // Máximo 1000 mensajes por día
  cooldownBetweenBatches: 30000, // 30 segundos entre lotes
};

// Contador de mensajes diarios (se resetea cada día)
let dailyMessageCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * Genera un retraso aleatorio para humanizar los envíos
 * Implementa "jitter" para romper patrones automatizados
 */
function getRandomDelay(): number {
  const { minDelay, maxDelay } = bulkConfig;
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

/**
 * Verifica y actualiza el contador diario de mensajes
 */
function checkDailyLimit(messageCount: number = 1): boolean {
  const today = new Date().toDateString();

  // Resetear contador si es un nuevo día
  if (today !== lastResetDate) {
    dailyMessageCount = 0;
    lastResetDate = today;
    console.log('🔄 Contador diario de mensajes reseteado');
  }

  // Verificar límite diario
  if (dailyMessageCount + messageCount > bulkConfig.maxDailyMessages) {
    console.warn(`⚠️ Límite diario alcanzado: ${dailyMessageCount}/${bulkConfig.maxDailyMessages}`);
    return false;
  }

  return true;
}

/**
 * Espera un tiempo aleatorio antes de continuar
 * Simula comportamiento humano en envíos masivos
 */
async function humanDelay(): Promise<void> {
  const delay = getRandomDelay();
  console.log(`⏳ Esperando ${delay}ms para humanizar envío...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Función para validar y formatear número de teléfono
const formatPhoneNumber = (number: string): string => {
  // Remover espacios, guiones y símbolos
  let formatted = number.replace(/[\s\-()\\+]/g, '');

  // Si no empieza con código de país, asumir República Dominicana (+1809)
  if (!formatted.startsWith('1') && formatted.length === 10) {
    formatted = '1809' + formatted;
  } else if (!formatted.startsWith('1') && formatted.length === 7) {
    formatted = '1809' + formatted;
  }

  // Validar que sea un número válido
  if (!/^\d{11,15}$/.test(formatted)) {
    throw new Error('Número de teléfono inválido. Use formato: 18091234567');
  }

  return formatted + '@s.whatsapp.net';
};

// Función para validar si un número existe en WhatsApp
const checkWhatsAppNumber = async (socket: WASocket, number: string): Promise<boolean> => {
  try {
    const results = await socket.onWhatsApp(number);
    return (results && results.length > 0 && Boolean(results[0]?.exists)) || false;
  } catch (error) {
    console.log('⚠️ No se pudo verificar el número, intentando envío directo');
    return true; // Asumir que existe si no se puede verificar
  }
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
      generateHighQualityLinkPreview: true,
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
        whatsappState.connectionTime = null;
        whatsappState.phoneNumber = null;

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
        whatsappState.connectionTime = new Date();

        // Obtener número de teléfono conectado
        if (socket.user?.id) {
          const decoded = jidDecode(socket.user.id);
          whatsappState.phoneNumber = decoded?.user || null;
        }

        console.log('✅ WhatsApp conectado exitosamente');
        console.log('📱 Número conectado:', whatsappState.phoneNumber);
      }
    });

    // Guardar credenciales cuando cambien
    socket.ev.on('creds.update', saveCreds);

    // Manejar confirmaciones de entrega de mensajes
    socket.ev.on('messages.update', (messageUpdate) => {
      for (const { key, update } of messageUpdate) {
        const messageId = key.id;
        const msgInHistory = messageHistory.find((msg) => msg.id === messageId);

        if (msgInHistory && update.status) {
          msgInHistory.status = update.status === 3 ? 'delivered' : 'sent';
          console.log(`📬 Mensaje ${messageId} actualizado a: ${msgInHistory.status}`);
        }
      }
    });

    // Manejar mensajes entrantes (opcional para logs)
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

// Función mejorada para enviar mensaje
const sendWhatsAppMessage = async (
  number: string,
  message: string,
  options: {validateNumber?: boolean} = {},
): Promise<{success: boolean; messageId?: string; error?: string}> => {
  try {
    if (!whatsappState.socket || !whatsappState.isReady) {
      throw new Error('WhatsApp no está conectado. Estado actual: ' + whatsappState.status);
    }

    // Formatear número
    const formattedNumber = formatPhoneNumber(number);
    console.log(`📤 Enviando mensaje a ${formattedNumber}`);

    // Validar si el número existe en WhatsApp (opcional)
    if (options.validateNumber !== false) {
      const numberExists = await checkWhatsAppNumber(whatsappState.socket, formattedNumber);
      if (!numberExists) {
        throw new Error('El número no tiene WhatsApp o no existe');
      }
      console.log('✅ Número validado en WhatsApp');
    }

    // Enviar mensaje
    const sentMessage = await whatsappState.socket.sendMessage(formattedNumber, {
      text: message,
    });

    const messageId = sentMessage?.key?.id || `msg_${Date.now()}`;

    // Guardar en historial
    messageHistory.push({
      id: messageId,
      to: number,
      message,
      timestamp: new Date(),
      status: 'sent',
    });

    console.log('✅ Mensaje enviado exitosamente, ID:', messageId);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error enviando mensaje:', errorMessage);

    // Guardar error en historial
    messageHistory.push({
      id: `error_${Date.now()}`,
      to: number,
      message,
      timestamp: new Date(),
      status: 'failed',
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Función para enviar mensaje con imagen
const sendWhatsAppImage = async (
  number: string,
  imageUrl: string,
  caption?: string,
): Promise<{success: boolean; messageId?: string; error?: string}> => {
  try {
    if (!whatsappState.socket || !whatsappState.isReady) {
      throw new Error('WhatsApp no está conectado');
    }

    const formattedNumber = formatPhoneNumber(number);
    console.log(`📸 Enviando imagen a ${formattedNumber}`);

    const sentMessage = await whatsappState.socket.sendMessage(formattedNumber, {
      image: { url: imageUrl },
      caption: caption || '',
    });

    const messageId = sentMessage?.key?.id || `img_${Date.now()}`;

    messageHistory.push({
      id: messageId,
      to: number,
      message: `[IMAGEN] ${caption || 'Sin descripción'}`,
      timestamp: new Date(),
      status: 'sent',
    });

    console.log('✅ Imagen enviada exitosamente, ID:', messageId);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error enviando imagen:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
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
    whatsappState.connectionTime = null;
    whatsappState.phoneNumber = null;

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
    return 'WhatsApp conectado y listo para enviar mensajes';
  case 'error':
    return 'Error en la conexión';
  default:
    return 'Estado desconocido';
  }
}

// Función principal WhatsApp API
export const whatsappApi = functions.https.onRequest((req: any, res: any) => {
  // Aplicar middleware de seguridad primero
  securityMiddleware(req, res, () => {
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
            connectionTime: whatsappState.connectionTime?.toISOString() || null,
            phoneNumber: whatsappState.phoneNumber,
            timestamp: new Date().toISOString(),
            message: getStatusMessage(whatsappState.status),
            messageHistory: messageHistory.slice(-5), // Últimos 5 mensajes
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

          const { number, message, validateNumber = true } = req.body;

          if (!number || !message) {
            res.status(400).json({
              error: 'Número y mensaje son requeridos',
              example: {
                number: '18091234567',
                message: 'Hola desde la Academia Musical',
                validateNumber: true,
              },
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

          console.log(`📤 Enviando mensaje a ${number}: ${message.substring(0, 50)}...`);
          const result = await sendWhatsAppMessage(number, message, { validateNumber });

          res.status(result.success ? 200 : 500).json({
            success: result.success,
            messageId: result.messageId,
            message: result.success ? 'Mensaje enviado correctamente' : result.error,
            timestamp: new Date().toISOString(),
            to: number,
          });
          break;
        }

        case '/send-image': {
          if (req.method !== 'POST') {
            res.status(405).json({ error: 'Método no permitido' });
            return;
          }

          const { number, imageUrl, caption } = req.body;

          if (!number || !imageUrl) {
            res.status(400).json({
              error: 'Número e imagen son requeridos',
              example: {
                number: '18091234567',
                imageUrl: 'https://example.com/image.jpg',
                caption: 'Descripción opcional',
              },
            });
            return;
          }

          if (!whatsappState.isReady) {
            res.status(400).json({
              error: 'WhatsApp no está conectado',
              status: whatsappState.status,
            });
            return;
          }

          const result = await sendWhatsAppImage(number, imageUrl, caption);

          res.status(result.success ? 200 : 500).json({
            success: result.success,
            messageId: result.messageId,
            message: result.success ? 'Imagen enviada correctamente' : result.error,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case '/send-bulk': {
          if (req.method !== 'POST') {
            res.status(405).json({ error: 'Método no permitido' });
            return;
          }

          const { recipients, message, validateNumbers = true } = req.body;

          if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            res.status(400).json({
              error: 'Lista de destinatarios requerida',
              example: {
                recipients: ['+18091234567', '+18097654321'],
                message: 'Mensaje para envío masivo',
                validateNumbers: true,
              },
            });
            return;
          }

          if (!message || typeof message !== 'string') {
            res.status(400).json({
              error: 'Mensaje requerido',
              example: {
                recipients: ['+18091234567', '+18097654321'],
                message: 'Mensaje para envío masivo',
                validateNumbers: true,
              },
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

          // Verificar límites de envío
          if (recipients.length > bulkConfig.maxBatchSize) {
            res.status(400).json({
              error: `Máximo ${bulkConfig.maxBatchSize} destinatarios por lote`,
              current: recipients.length,
              maxAllowed: bulkConfig.maxBatchSize,
              recommendation: 'Divide tu lista en lotes más pequeños para evitar bloqueos',
            });
            return;
          }

          // Verificar límite diario
          if (!checkDailyLimit(recipients.length)) {
            res.status(429).json({
              error: 'Límite diario de mensajes alcanzado',
              dailyLimit: bulkConfig.maxDailyMessages,
              currentCount: dailyMessageCount,
              recommendation: 'Intenta mañana o contacta soporte para aumentar límites',
            });
            return;
          }

          console.log(`📤 Iniciando envío masivo a ${recipients.length} destinatarios`);
          const startTime = Date.now();

          const results = {
            total: recipients.length,
            successful: 0,
            failed: 0,
            errors: [] as Array<{number: string; error: string}>,
            duration: 0,
          };

          try {
            for (let i = 0; i < recipients.length; i++) {
              const recipient = recipients[i];

              try {
                console.log(`📱 Enviando ${i + 1}/${recipients.length} a ${recipient}`);

                // Enviar mensaje individual
                const result = await sendWhatsAppMessage(recipient, message, {
                  validateNumber: validateNumbers,
                });

                if (result.success) {
                  results.successful++;
                  dailyMessageCount++;
                  console.log(`✅ Enviado exitosamente a ${recipient}`);
                } else {
                  results.failed++;
                  results.errors.push({
                    number: recipient,
                    error: result.error || 'Error desconocido',
                  });
                  console.log(`❌ Error enviando a ${recipient}: ${result.error}`);
                }
              } catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                results.errors.push({
                  number: recipient,
                  error: errorMessage,
                });
                console.error(`❌ Excepción enviando a ${recipient}:`, error);
              }

              // Aplicar retraso humanizado entre mensajes (excepto en el último)
              if (i < recipients.length - 1) {
                await humanDelay();
              }
            }

            results.duration = Date.now() - startTime;

            console.log('🎉 Envío masivo completado:', {
              exitosos: results.successful,
              fallidos: results.failed,
              duracion: `${Math.round(results.duration / 1000)}s`,
            });

            res.status(200).json({
              success: true,
              message: 'Envío masivo completado',
              results,
              timestamp: new Date().toISOString(),
              statistics: {
                successRate: Math.round((results.successful / results.total) * 100),
                averageTimePerMessage: Math.round(results.duration / results.total),
                totalDuration: results.duration,
              },
            });
          } catch (error) {
            console.error('❌ Error crítico en envío masivo:', error);
            res.status(500).json({
              success: false,
              error: 'Error crítico en envío masivo',
              results,
              message: error instanceof Error ? error.message : 'Error desconocido',
            });
          }
          break;
        }

        case '/security-stats': {
          if (req.method !== 'GET') {
            res.status(405).json({ error: 'Método no permitido' });
            return;
          }

          const stats = getSecurityStats();
          res.status(200).json({
            success: true,
            security: stats,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case '/history': {
          res.status(200).json({
            messages: messageHistory.slice(-20), // Últimos 20 mensajes
            total: messageHistory.length,
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
            availableEndpoints: [
              '/status',
              '/init',
              '/qr',
              '/send-message',
              '/send-bulk',
              '/send-image',
              '/security-stats',
              '/history',
              '/restart',
            ],
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
});

// Auto-inicializar al cargar (opcional)
console.log('🌟 Módulo WhatsApp con mensajería avanzada cargado. Listo para conexiones.');
