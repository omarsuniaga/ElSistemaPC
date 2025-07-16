/**
 * 🔐 SISTEMA DE SEGURIDAD AVANZADO
 * Fase 2 - Iniciativa 2: Security Hardening
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// ==================== TIPOS ====================

interface SecurityConfig {
  csp: {
    enabled: boolean
    directives: Record<string, string[]>
    reportUri?: string
  }
  headers: {
    xFrameOptions: string
    xContentTypeOptions: string
    xXSSProtection: string
    strictTransportSecurity: string
    referrerPolicy: string
  }
  validation: {
    enableInputSanitization: boolean
    enableOutputEncoding: boolean
    enableCSRFProtection: boolean
  }
  monitoring: {
    enableSecurityLogging: boolean
    enableVulnerabilityScanning: boolean
  }
}

interface SecurityViolation {
  id: string
  type: 'csp' | 'xss' | 'injection' | 'csrf' | 'unauthorized'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: Date
  userAgent?: string
  ip?: string
  blocked: boolean
}

interface SecurityAudit {
  timestamp: Date
  score: number
  violations: SecurityViolation[]
  recommendations: string[]
  config: SecurityConfig
}

// ==================== CONFIGURACIÓN PREDETERMINADA ====================

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    enabled: true,
    directives: {
      'default-src': ['\'self\''],
      'script-src': [
        '\'self\'',
        '\'unsafe-inline\'',
        'https://apis.google.com',
        'https://www.gstatic.com',
      ],
      'style-src': ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
      'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
      'img-src': ['\'self\'', 'data:', 'https:', 'blob:'],
      'connect-src': [
        '\'self\'',
        'https://firebaseapp.com',
        'https://*.firebaseio.com',
        'https://firestore.googleapis.com',
      ],
      'frame-src': ['\'none\''],
      'object-src': ['\'none\''],
      'base-uri': ['\'self\''],
      'form-action': ['\'self\''],
    },
  },
  headers: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
  validation: {
    enableInputSanitization: true,
    enableOutputEncoding: true,
    enableCSRFProtection: true,
  },
  monitoring: {
    enableSecurityLogging: true,
    enableVulnerabilityScanning: true,
  },
};

// ==================== STORE DE SEGURIDAD ====================

export const useSecurityStore = defineStore('security', () => {
  // Estado
  const config = ref<SecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const violations = ref<SecurityViolation[]>([]);
  const isInitialized = ref(false);
  const lastAudit = ref<SecurityAudit | null>(null);

  // Computed
  const securityScore = computed(() => {
    if (!lastAudit.value) return 0;
    return lastAudit.value.score;
  });

  const criticalViolations = computed(() =>
    violations.value.filter((v) => v.severity === 'critical'),
  );

  const recentViolations = computed(() =>
    violations.value.filter(
      (v) => Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000, // Últimas 24 horas
    ),
  );

  const securityStatus = computed(() => {
    const score = securityScore.value;
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'needs-improvement';
    return 'poor';
  });

  // ==================== INICIALIZACIÓN ====================

  function initializeSecurity() {
    if (isInitialized.value) return;

    console.log('🔐 Inicializando sistema de seguridad...');

    try {
      // Configurar CSP
      setupContentSecurityPolicy();

      // Configurar headers de seguridad
      setupSecurityHeaders();

      // Configurar validación
      setupInputValidation();

      // Configurar monitoreo
      setupSecurityMonitoring();

      // Ejecutar audit inicial
      performSecurityAudit();

      isInitialized.value = true;
      console.log('✅ Sistema de seguridad inicializado');
    } catch (error) {
      console.error('❌ Error inicializando seguridad:', error);
      reportViolation({
        type: 'unauthorized',
        severity: 'high',
        description: 'Error en inicialización de seguridad',
        blocked: false,
      });
    }
  }

  // ==================== CONTENT SECURITY POLICY ====================

  function setupContentSecurityPolicy() {
    if (!config.value.csp.enabled) return;

    try {
      const cspString = generateCSPString();

      // Crear meta tag para CSP
      const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (existingCSP) {
        existingCSP.setAttribute('content', cspString);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Security-Policy');
        meta.setAttribute('content', cspString);
        document.head.appendChild(meta);
      }

      console.log('🛡️ Content Security Policy configurado');
    } catch (error) {
      console.error('❌ Error configurando CSP:', error);
    }
  }

  function generateCSPString(): string {
    const directives = Object.entries(config.value.csp.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    const reportUri = config.value.csp.reportUri ? `; report-uri ${config.value.csp.reportUri}` : '';

    return directives + reportUri;
  }

  // ==================== SECURITY HEADERS ====================

  function setupSecurityHeaders() {
    // Los headers deben configurarse en el servidor, pero podemos validarlos
    validateSecurityHeaders();
  }

  function validateSecurityHeaders() {
    // En una app real, esto se haría en el servidor
    // Aquí solo registramos la configuración para referencia
    console.log('🔒 Configuración de headers de seguridad:', config.value.headers);
  }

  // ==================== VALIDACIÓN DE ENTRADA ====================

  function setupInputValidation() {
    if (!config.value.validation.enableInputSanitization) return;

    // Interceptar formularios
    document.addEventListener('submit', handleFormSubmit);

    // Interceptar inputs en tiempo real
    document.addEventListener('input', handleInputValidation);

    console.log('✅ Validación de entrada configurada');
  }

  function handleFormSubmit(event: Event) {
    const form = event.target as HTMLFormElement;
    if (!form) return;

    try {
      const formData = new FormData(form);

      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          const sanitized = sanitizeInput(value);
          if (sanitized !== value) {
            console.warn(`🚨 Input potencialmente peligroso detectado en campo: ${key}`);
            reportViolation({
              type: 'xss',
              severity: 'medium',
              description: `Input sospechoso en campo ${key}`,
              blocked: false,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error validando formulario:', error);
    }
  }

  function handleInputValidation(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input?.value) return;

    try {
      const sanitized = sanitizeInput(input.value);
      if (sanitized !== input.value) {
        // No modificar el input directamente, solo reportar
        reportViolation({
          type: 'xss',
          severity: 'low',
          description: 'Input potencialmente peligroso detectado',
          blocked: false,
        });
      }
    } catch (error) {
      console.error('Error validando input:', error);
    }
  }

  // ==================== SANITIZACIÓN ====================

  function sanitizeInput(input: string): string {
    if (!input) return input;

    // Escapar caracteres peligrosos
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function sanitizeHTML(html: string): string {
    // Crear un elemento temporal para sanitizar
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateURL(url: string): boolean {
    try {
      const parsedURL = new URL(url);
      // Solo permitir HTTPS y HTTP
      return ['https:', 'http:'].includes(parsedURL.protocol);
    } catch {
      return false;
    }
  }

  // ==================== MONITOREO DE SEGURIDAD ====================

  function setupSecurityMonitoring() {
    if (!config.value.monitoring.enableSecurityLogging) return;

    // Interceptar errores globales
    window.addEventListener('error', handleSecurityError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Monitorear intentos de CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    console.log('👀 Monitoreo de seguridad activado');
  }

  function handleSecurityError(event: ErrorEvent) {
    const error = event.error;
    if (error && isSecurityError(error)) {
      reportViolation({
        type: 'unauthorized',
        severity: 'medium',
        description: `Error de seguridad: ${error.message}`,
        blocked: false,
      });
    }
  }

  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    if (reason && isSecurityError(reason)) {
      reportViolation({
        type: 'unauthorized',
        severity: 'medium',
        description: `Promise rechazada por seguridad: ${reason.message || reason}`,
        blocked: false,
      });
    }
  }

  function handleCSPViolation(event: SecurityPolicyViolationEvent) {
    reportViolation({
      type: 'csp',
      severity: 'high',
      description: `CSP Violation: ${event.violatedDirective} - ${event.blockedURI}`,
      blocked: true,
    });
  }

  function isSecurityError(error: any): boolean {
    if (!error) return false;

    const message = error.message || error.toString();
    const securityKeywords = [
      'script',
      'eval',
      'injection',
      'xss',
      'csrf',
      'security',
      'unauthorized',
      'forbidden',
    ];

    return securityKeywords.some((keyword) => message.toLowerCase().includes(keyword));
  }

  // ==================== REPORTE DE VIOLACIONES ====================

  function reportViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp'>) {
    const fullViolation: SecurityViolation = {
      id: generateViolationId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ...violation,
    };

    violations.value.push(fullViolation);

    // Mantener solo las últimas 1000 violaciones
    if (violations.value.length > 1000) {
      violations.value = violations.value.slice(-1000);
    }

    console.warn('🚨 Violación de seguridad reportada:', fullViolation);

    // En producción, enviar a sistema de monitoreo
    if (import.meta.env.PROD) {
      sendToSecurityMonitoring(fullViolation);
    }
  }

  function generateViolationId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function sendToSecurityMonitoring(violation: SecurityViolation) {
    // En una aplicación real, esto enviaría la violación a un servicio de monitoreo
    // como Sentry, LogRocket, o un endpoint personalizado
    console.log('📤 Enviando violación a sistema de monitoreo:', violation);
  }

  // ==================== AUDITORÍA DE SEGURIDAD ====================

  function performSecurityAudit(): SecurityAudit {
    console.log('🔍 Ejecutando auditoría de seguridad...');

    const audit: SecurityAudit = {
      timestamp: new Date(),
      score: calculateSecurityScore(),
      violations: violations.value.slice(-50), // Últimas 50 violaciones
      recommendations: generateSecurityRecommendations(),
      config: config.value,
    };

    lastAudit.value = audit;
    console.log('📊 Auditoría de seguridad completada. Score:', audit.score);

    return audit;
  }

  function calculateSecurityScore(): number {
    let score = 100;

    // Deducir puntos por violaciones recientes
    const recentCritical = recentViolations.value.filter((v) => v.severity === 'critical').length;
    const recentHigh = recentViolations.value.filter((v) => v.severity === 'high').length;
    const recentMedium = recentViolations.value.filter((v) => v.severity === 'medium').length;

    score -= recentCritical * 20;
    score -= recentHigh * 10;
    score -= recentMedium * 5;

    // Deducir puntos por configuración faltante
    if (!config.value.csp.enabled) score -= 15;
    if (!config.value.validation.enableInputSanitization) score -= 10;
    if (!config.value.monitoring.enableSecurityLogging) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  function generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (criticalViolations.value.length > 0) {
      recommendations.push('🚨 Atender violaciones críticas de seguridad inmediatamente');
    }

    if (!config.value.csp.enabled) {
      recommendations.push('🛡️ Habilitar Content Security Policy');
    }

    if (recentViolations.value.length > 10) {
      recommendations.push('📊 Revisar logs de seguridad - muchas violaciones recientes');
    }

    if (!config.value.validation.enableCSRFProtection) {
      recommendations.push('🔒 Implementar protección CSRF');
    }

    if (securityScore.value < 75) {
      recommendations.push('🔧 Revisar configuración de seguridad general');
    }

    return recommendations;
  }

  // ==================== UTILIDADES ====================

  function clearViolations() {
    violations.value = [];
  }

  function exportSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      audit: lastAudit.value,
      violations: violations.value,
      config: config.value,
    };
  }

  function updateSecurityConfig(newConfig: Partial<SecurityConfig>) {
    config.value = { ...config.value, ...newConfig };

    // Re-inicializar con nueva configuración
    if (isInitialized.value) {
      setupContentSecurityPolicy();
      setupInputValidation();
    }
  }

  // ==================== RETURN ====================

  return {
    // Estado
    config,
    violations,
    isInitialized,
    lastAudit,

    // Computed
    securityScore,
    criticalViolations,
    recentViolations,
    securityStatus,

    // Métodos principales
    initializeSecurity,
    performSecurityAudit,
    reportViolation,

    // Utilidades
    sanitizeInput,
    sanitizeHTML,
    validateEmail,
    validateURL,
    clearViolations,
    exportSecurityReport,
    updateSecurityConfig,
  };
});

// ==================== COMPOSABLE ====================

export function useSecurity() {
  const store = useSecurityStore();

  return {
    ...store,

    // Métodos de conveniencia
    checkInput: (input: string) => {
      const sanitized = store.sanitizeInput(input);
      if (sanitized !== input) {
        store.reportViolation({
          type: 'xss',
          severity: 'low',
          description: 'Input potencialmente peligroso detectado',
          blocked: false,
        });
      }
      return sanitized;
    },

    secureRedirect: (url: string) => {
      if (!store.validateURL(url)) {
        store.reportViolation({
          type: 'injection',
          severity: 'medium',
          description: 'Intento de redirección a URL inválida',
          blocked: true,
        });
        return false;
      }
      return true;
    },
  };
}

// ==================== DIRECTIVA DE SEGURIDAD ====================

export const vSecure = {
  mounted(el: HTMLElement, binding: any) {
    const securityStore = useSecurityStore();

    // Sanitizar contenido del elemento
    if (binding.value?.sanitize && el.innerHTML) {
      el.innerHTML = securityStore.sanitizeHTML(el.innerHTML);
    }

    // Monitorear cambios de contenido
    if (binding.value?.monitor) {
      const observer = new MutationObserver(() => {
        if (el.innerHTML) {
          const sanitized = securityStore.sanitizeHTML(el.innerHTML);
          if (sanitized !== el.innerHTML) {
            securityStore.reportViolation({
              type: 'xss',
              severity: 'medium',
              description: 'Contenido potencialmente peligroso detectado en elemento',
              blocked: false,
            });
          }
        }
      });

      observer.observe(el, { childList: true, subtree: true });
    }
  },
};
