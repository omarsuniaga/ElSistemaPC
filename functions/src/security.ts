import { Request, Response } from 'express';

/**
 * Middleware de seguridad para validar requests autorizados
 * Implementa una versión básica de App Check para proteger endpoints
 *
 * En producción, esto debería usar Firebase App Check real
 * con tokens generados por el cliente autorizado
 */

interface SecurityConfig {
  allowedOrigins: string[]
  requiredHeaders: string[]
  rateLimiting: {
    maxRequestsPerMinute: number
    maxRequestsPerHour: number
  }
}

const securityConfig: SecurityConfig = {
  allowedOrigins: [
    'https://music-academy-app-act.netlify.app', // Dominio de producción
    'http://localhost:3000', // Desarrollo local
    'http://localhost:3001', // Desarrollo alternativo
    'https://localhost:3000', // HTTPS local
  ],
  requiredHeaders: ['content-type', 'user-agent'],
  rateLimiting: {
    maxRequestsPerMinute: 30, // Máximo 30 requests por minuto por IP
    maxRequestsPerHour: 500, // Máximo 500 requests por hora por IP
  },
};

// Cache para rate limiting (en producción usar Redis)
const requestCache = new Map<
  string,
  {
    requests: number[]
    lastReset: number
  }
>();

/**
 * Verifica si el origen está autorizado
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false; // No permitir requests sin Origin header
  }

  return securityConfig.allowedOrigins.includes(origin);
}

/**
 * Implementa rate limiting básico por IP
 */
function checkRateLimit(ip: string): {allowed: boolean; resetTime?: number} {
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  // Obtener datos de cache para esta IP
  let ipData = requestCache.get(ip);

  if (!ipData) {
    ipData = {
      requests: [],
      lastReset: now,
    };
    requestCache.set(ip, ipData);
  }

  // Limpiar requests antiguos (más de 1 hora)
  ipData.requests = ipData.requests.filter((timestamp) => now - timestamp < hour);

  // Contar requests en la última hora y minuto
  const requestsLastHour = ipData.requests.length;
  const requestsLastMinute = ipData.requests.filter((timestamp) => now - timestamp < minute).length;

  // Verificar límites
  if (requestsLastMinute >= securityConfig.rateLimiting.maxRequestsPerMinute) {
    return {
      allowed: false,
      resetTime: Math.min(...ipData.requests.filter((t) => now - t < minute)) + minute,
    };
  }

  if (requestsLastHour >= securityConfig.rateLimiting.maxRequestsPerHour) {
    return {
      allowed: false,
      resetTime: Math.min(...ipData.requests) + hour,
    };
  }

  // Registrar esta request
  ipData.requests.push(now);

  return { allowed: true };
}

/**
 * Middleware de seguridad principal
 */
export function securityMiddleware(req: Request, res: Response, next: Function): void {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const origin = req.get('Origin') || req.get('Referer');
  const userAgent = req.get('User-Agent');

  console.log(`🔒 Validando seguridad para ${clientIP} desde ${origin}`);

  // 1. Verificar origen autorizado
  if (!isOriginAllowed(origin)) {
    console.warn(`⚠️ Origen no autorizado bloqueado: ${origin} desde IP ${clientIP}`);
    res.status(403).json({
      error: 'Acceso denegado',
      message: 'Origen no autorizado',
      code: 'UNAUTHORIZED_ORIGIN',
    });
    return;
  }

  // 2. Verificar User-Agent (filtrar bots maliciosos)
  if (!userAgent || userAgent.length < 10) {
    console.warn(`⚠️ User-Agent sospechoso bloqueado: ${userAgent} desde IP ${clientIP}`);
    res.status(403).json({
      error: 'Acceso denegado',
      message: 'User-Agent requerido',
      code: 'INVALID_USER_AGENT',
    });
    return;
  }

  // 3. Verificar rate limiting
  const rateLimitCheck = checkRateLimit(clientIP);
  if (!rateLimitCheck.allowed) {
    const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime) : new Date();
    console.warn(`⚠️ Rate limit excedido para IP ${clientIP}`);

    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de requests permitidos',
      code: 'RATE_LIMIT_EXCEEDED',
      resetTime: resetTime.toISOString(),
      limits: securityConfig.rateLimiting,
    });
    return;
  }

  // 4. Log de acceso autorizado
  console.log(`✅ Acceso autorizado para ${clientIP} desde ${origin}`);

  // 5. Añadir headers de seguridad
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });

  next();
}

/**
 * Función para obtener estadísticas de seguridad
 */
export function getSecurityStats(): {
  totalIPs: number
  activeConnections: Array<{ip: string; requests: number; lastActivity: string}>
  config: SecurityConfig
  } {
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  const activeConnections = Array.from(requestCache.entries())
    .filter(([, data]) => data.requests.some((timestamp) => now - timestamp < hour))
    .map(([ip, data]) => ({
      ip,
      requests: data.requests.filter((timestamp) => now - timestamp < hour).length,
      lastActivity: new Date(Math.max(...data.requests)).toISOString(),
    }))
    .sort((a, b) => b.requests - a.requests);

  return {
    totalIPs: requestCache.size,
    activeConnections,
    config: securityConfig,
  };
}
