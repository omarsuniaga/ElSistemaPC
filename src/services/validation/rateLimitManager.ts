// Servicio de Rate Limiting y Control de Flujo para WhatsApp
// Previene spam y gestiona límites de envío

interface RateLimitConfig {
  maxMessagesPerMinute: number
  maxMessagesPerHour: number
  maxMessagesPerDay: number
  cooldownBetweenMessages: number // milliseconds
}

interface SendAttempt {
  timestamp: number
  phoneNumber: string
  success: boolean
  messageType: string
}

interface RateLimitStatus {
  canSend: boolean
  reason?: string
  nextAvailableTime?: number
  currentLimits: {
    perMinute: {current: number; max: number}
    perHour: {current: number; max: number}
    perDay: {current: number; max: number}
  }
}

class RateLimitManager {
  private attempts: SendAttempt[] = [];
  private config: RateLimitConfig;
  private lastSendTime = 0;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxMessagesPerMinute: 10,
      maxMessagesPerHour: 100,
      maxMessagesPerDay: 500,
      cooldownBetweenMessages: 2000, // 2 segundos entre mensajes
      ...config,
    };
  }

  /**
   * Limpia intentos antiguos
   */
  private cleanOldAttempts(): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    this.attempts = this.attempts.filter((attempt) => attempt.timestamp > oneDayAgo);
  }

  /**
   * Cuenta mensajes enviados en un período
   */
  private countMessagesInPeriod(periodMs: number): number {
    const now = Date.now();
    const cutoff = now - periodMs;

    return this.attempts.filter((attempt) => attempt.timestamp > cutoff && attempt.success).length;
  }

  /**
   * Verifica si se puede enviar un mensaje
   */
  checkRateLimit(): RateLimitStatus {
    this.cleanOldAttempts();

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const messagesLastMinute = this.countMessagesInPeriod(oneMinute);
    const messagesLastHour = this.countMessagesInPeriod(oneHour);
    const messagesLastDay = this.countMessagesInPeriod(oneDay);

    // Verificar cooldown entre mensajes
    const timeSinceLastSend = now - this.lastSendTime;
    if (timeSinceLastSend < this.config.cooldownBetweenMessages) {
      return {
        canSend: false,
        reason: `Cooldown activo. Espere ${Math.ceil((this.config.cooldownBetweenMessages - timeSinceLastSend) / 1000)} segundos`,
        nextAvailableTime: this.lastSendTime + this.config.cooldownBetweenMessages,
        currentLimits: {
          perMinute: { current: messagesLastMinute, max: this.config.maxMessagesPerMinute },
          perHour: { current: messagesLastHour, max: this.config.maxMessagesPerHour },
          perDay: { current: messagesLastDay, max: this.config.maxMessagesPerDay },
        },
      };
    }

    // Verificar límites por período
    if (messagesLastMinute >= this.config.maxMessagesPerMinute) {
      const oldestInMinute = this.attempts
        .filter((a) => a.timestamp > now - oneMinute && a.success)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      return {
        canSend: false,
        reason: `Límite por minuto excedido (${messagesLastMinute}/${this.config.maxMessagesPerMinute})`,
        nextAvailableTime: oldestInMinute.timestamp + oneMinute,
        currentLimits: {
          perMinute: { current: messagesLastMinute, max: this.config.maxMessagesPerMinute },
          perHour: { current: messagesLastHour, max: this.config.maxMessagesPerHour },
          perDay: { current: messagesLastDay, max: this.config.maxMessagesPerDay },
        },
      };
    }

    if (messagesLastHour >= this.config.maxMessagesPerHour) {
      return {
        canSend: false,
        reason: `Límite por hora excedido (${messagesLastHour}/${this.config.maxMessagesPerHour})`,
        currentLimits: {
          perMinute: { current: messagesLastMinute, max: this.config.maxMessagesPerMinute },
          perHour: { current: messagesLastHour, max: this.config.maxMessagesPerHour },
          perDay: { current: messagesLastDay, max: this.config.maxMessagesPerDay },
        },
      };
    }

    if (messagesLastDay >= this.config.maxMessagesPerDay) {
      return {
        canSend: false,
        reason: `Límite diario excedido (${messagesLastDay}/${this.config.maxMessagesPerDay})`,
        currentLimits: {
          perMinute: { current: messagesLastMinute, max: this.config.maxMessagesPerMinute },
          perHour: { current: messagesLastHour, max: this.config.maxMessagesPerHour },
          perDay: { current: messagesLastDay, max: this.config.maxMessagesPerDay },
        },
      };
    }

    return {
      canSend: true,
      currentLimits: {
        perMinute: { current: messagesLastMinute, max: this.config.maxMessagesPerMinute },
        perHour: { current: messagesLastHour, max: this.config.maxMessagesPerHour },
        perDay: { current: messagesLastDay, max: this.config.maxMessagesPerDay },
      },
    };
  }

  /**
   * Registra un intento de envío
   */
  recordAttempt(phoneNumber: string, success: boolean, messageType: string): void {
    const attempt: SendAttempt = {
      timestamp: Date.now(),
      phoneNumber,
      success,
      messageType,
    };

    this.attempts.push(attempt);

    if (success) {
      this.lastSendTime = attempt.timestamp;
    }

    console.log(
      `📊 Rate Limit - Intento registrado: ${phoneNumber}, éxito: ${success}, tipo: ${messageType}`,
    );
  }

  /**
   * Obtiene estadísticas actuales
   */
  getStatistics(): {
    totalAttempts: number
    successfulSends: number
    failedSends: number
    successRate: number
    messagesLastHour: number
    messagesLastDay: number
    rateLimitStatus: RateLimitStatus
    } {
    this.cleanOldAttempts();

    const totalAttempts = this.attempts.length;
    const successfulSends = this.attempts.filter((a) => a.success).length;
    const failedSends = totalAttempts - successfulSends;
    const successRate = totalAttempts > 0 ? (successfulSends / totalAttempts) * 100 : 0;

    return {
      totalAttempts,
      successfulSends,
      failedSends,
      successRate,
      messagesLastHour: this.countMessagesInPeriod(60 * 60 * 1000),
      messagesLastDay: this.countMessagesInPeriod(24 * 60 * 60 * 1000),
      rateLimitStatus: this.checkRateLimit(),
    };
  }

  /**
   * Calcula tiempo de espera óptimo para envío en lotes
   */
  calculateBatchDelay(batchSize: number): number {
    const rateLimitStatus = this.checkRateLimit();

    if (!rateLimitStatus.canSend && rateLimitStatus.nextAvailableTime) {
      return rateLimitStatus.nextAvailableTime - Date.now();
    }

    // Calcular delay para evitar exceder límites
    const remainingPerMinute =
      rateLimitStatus.currentLimits.perMinute.max - rateLimitStatus.currentLimits.perMinute.current;

    if (batchSize > remainingPerMinute) {
      // Necesitamos distribuir en más de un minuto
      const minutesNeeded = Math.ceil(batchSize / this.config.maxMessagesPerMinute);
      return (minutesNeeded * 60 * 1000) / batchSize;
    }

    return this.config.cooldownBetweenMessages;
  }

  /**
   * Resetea estadísticas (usar con cuidado)
   */
  reset(): void {
    this.attempts = [];
    this.lastSendTime = 0;
    console.log('🔄 Rate Limit - Estadísticas reseteadas');
  }
}

// Instancia global del rate limiter
const globalRateLimiter = new RateLimitManager();

/**
 * Wrapper para envío de mensajes con rate limiting
 */
export const sendMessageWithRateLimit = async (
  phoneNumber: string,
  message: string,
  messageType: string,
  sendFunction: (phone: string, msg: string) => Promise<boolean>,
): Promise<{
  success: boolean
  error?: string
  rateLimitInfo?: RateLimitStatus
}> => {
  // Verificar rate limit
  const rateLimitStatus = globalRateLimiter.checkRateLimit();

  if (!rateLimitStatus.canSend) {
    console.log(`🚫 Rate Limit - Envío bloqueado: ${rateLimitStatus.reason}`);

    globalRateLimiter.recordAttempt(phoneNumber, false, messageType);

    return {
      success: false,
      error: rateLimitStatus.reason,
      rateLimitInfo: rateLimitStatus,
    };
  }

  try {
    // Intentar envío
    const success = await sendFunction(phoneNumber, message);

    // Registrar resultado
    globalRateLimiter.recordAttempt(phoneNumber, success, messageType);

    if (success) {
      console.log(`✅ Rate Limit - Mensaje enviado exitosamente a ${phoneNumber}`);
    } else {
      console.log(`❌ Rate Limit - Fallo en envío a ${phoneNumber}`);
    }

    return {
      success,
      rateLimitInfo: rateLimitStatus,
    };
  } catch (error) {
    globalRateLimiter.recordAttempt(phoneNumber, false, messageType);

    console.error(`💥 Rate Limit - Error en envío a ${phoneNumber}:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      rateLimitInfo: rateLimitStatus,
    };
  }
};

/**
 * Envío en lotes con rate limiting automático
 */
export const sendBatchWithRateLimit = async (
  messages: Array<{
    phoneNumber: string
    message: string
    messageType: string
  }>,
  sendFunction: (phone: string, msg: string) => Promise<boolean>,
  onProgress?: (completed: number, total: number, current: string) => void,
): Promise<{
  results: Array<{
    phoneNumber: string
    success: boolean
    error?: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
    rateLimited: number
  }
}> => {
  const results: Array<{
    phoneNumber: string
    success: boolean
    error?: string
  }> = [];

  let successful = 0;
  let failed = 0;
  let rateLimited = 0;

  console.log(`🚀 Rate Limit - Iniciando envío en lotes: ${messages.length} mensajes`);

  for (let i = 0; i < messages.length; i++) {
    const { phoneNumber, message, messageType } = messages[i];

    // Callback de progreso
    if (onProgress) {
      onProgress(i, messages.length, phoneNumber);
    }

    const result = await sendMessageWithRateLimit(phoneNumber, message, messageType, sendFunction);

    if (result.success) {
      successful++;
      results.push({ phoneNumber, success: true });
    } else {
      if (result.rateLimitInfo && !result.rateLimitInfo.canSend) {
        rateLimited++;
      } else {
        failed++;
      }

      results.push({
        phoneNumber,
        success: false,
        error: result.error,
      });
    }

    // Si hay rate limit, esperar el tiempo recomendado
    if (
      result.rateLimitInfo &&
      !result.rateLimitInfo.canSend &&
      result.rateLimitInfo.nextAvailableTime
    ) {
      const waitTime = result.rateLimitInfo.nextAvailableTime - Date.now();
      if (waitTime > 0) {
        console.log(`⏳ Rate Limit - Esperando ${Math.ceil(waitTime / 1000)} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // Callback final de progreso
  if (onProgress) {
    onProgress(messages.length, messages.length, '');
  }

  console.log(
    `✅ Rate Limit - Lote completado: ${successful} éxitos, ${failed} fallos, ${rateLimited} rate limited`,
  );

  return {
    results,
    summary: {
      total: messages.length,
      successful,
      failed,
      rateLimited,
    },
  };
};

/**
 * Obtiene estadísticas del rate limiter
 */
export const getRateLimitStatistics = () => {
  return globalRateLimiter.getStatistics();
};

/**
 * Resetea el rate limiter (usar solo en desarrollo/testing)
 */
export const resetRateLimit = () => {
  globalRateLimiter.reset();
};

export default {
  sendMessageWithRateLimit,
  sendBatchWithRateLimit,
  getRateLimitStatistics,
  resetRateLimit,
  RateLimitManager,
};
