// Configuración centralizada para debugging del sistema de asistencia
// Este archivo permite controlar qué funciones de debugging están activas

interface DebugConfig {
  // Logs de attendance
  attendanceLogging: boolean
  attendanceAutoDebug: boolean
  attendanceAnalytics: boolean

  // Logs de componentes
  componentLogging: boolean
  watcherLogging: boolean

  // Logs del store
  storeLogging: boolean

  // Verificación de integridad
  integrityChecks: boolean
}

// Configuración por defecto (optimizada para producción)
const defaultConfig: DebugConfig = {
  attendanceLogging: false,
  attendanceAutoDebug: false,
  attendanceAnalytics: false,
  componentLogging: false,
  watcherLogging: false,
  storeLogging: false,
  integrityChecks: false,
};

// Configuración para desarrollo
const developmentConfig: DebugConfig = {
  attendanceLogging: true,
  attendanceAutoDebug: false, // Solo cuando se necesite
  attendanceAnalytics: false, // Deshabilitado por problemas de índices
  componentLogging: false, // Reducido para evitar spam
  watcherLogging: false, // Reducido para evitar spam
  storeLogging: false, // Reducido para evitar spam
  integrityChecks: true,
};

// Función para obtener la configuración actual
export function getDebugConfig(): DebugConfig {
  // Verificar si estamos en desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Si no hay window (SSR), usar configuración por defecto
  if (typeof window === 'undefined') {
    return isDevelopment ? developmentConfig : defaultConfig;
  }

  // Crear configuración basada en localStorage
  const config: DebugConfig = {
    attendanceLogging: window.localStorage.getItem('attendance-debug') === 'true',
    attendanceAutoDebug: window.localStorage.getItem('attendance-auto-debug') === 'true',
    attendanceAnalytics: window.localStorage.getItem('attendance-analytics-enabled') === 'true',
    componentLogging: window.localStorage.getItem('component-debug') === 'true',
    watcherLogging: window.localStorage.getItem('watcher-debug') === 'true',
    storeLogging: window.localStorage.getItem('store-debug') === 'true',
    integrityChecks: window.localStorage.getItem('integrity-checks') === 'true',
  };

  // Si no hay configuración en localStorage, usar configuración por defecto
  const hasAnyConfig = Object.values(config).some((value) => value === true);
  if (!hasAnyConfig && isDevelopment) {
    return developmentConfig;
  }

  return hasAnyConfig ? config : defaultConfig;
}

// Función para habilitar debugging específico
export function enableDebugMode(mode: keyof DebugConfig) {
  if (typeof window !== 'undefined') {
    const key = {
      attendanceLogging: 'attendance-debug',
      attendanceAutoDebug: 'attendance-auto-debug',
      attendanceAnalytics: 'attendance-analytics-enabled',
      componentLogging: 'component-debug',
      watcherLogging: 'watcher-debug',
      storeLogging: 'store-debug',
      integrityChecks: 'integrity-checks',
    }[mode];

    window.localStorage.setItem(key, 'true');
  }
}

// Función para deshabilitar debugging específico
export function disableDebugMode(mode: keyof DebugConfig) {
  if (typeof window !== 'undefined') {
    const key = {
      attendanceLogging: 'attendance-debug',
      attendanceAutoDebug: 'attendance-auto-debug',
      attendanceAnalytics: 'attendance-analytics-enabled',
      componentLogging: 'component-debug',
      watcherLogging: 'watcher-debug',
      storeLogging: 'store-debug',
      integrityChecks: 'integrity-checks',
    }[mode];

    window.localStorage.removeItem(key);
  }
}

// Función para limpiar toda la configuración de debugging
export function clearAllDebugModes() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('attendance-debug');
    window.localStorage.removeItem('attendance-auto-debug');
    window.localStorage.removeItem('attendance-analytics-enabled');
    window.localStorage.removeItem('component-debug');
    window.localStorage.removeItem('watcher-debug');
    window.localStorage.removeItem('store-debug');
    window.localStorage.removeItem('integrity-checks');
  }
}

// Función para habilitar debugging mínimo (solo errores críticos)
export function enableMinimalDebug() {
  clearAllDebugModes();
  enableDebugMode('integrityChecks');
}

// Función para habilitar debugging completo
export function enableFullDebug() {
  Object.keys(defaultConfig).forEach((key) => {
    enableDebugMode(key as keyof DebugConfig);
  });
}

// Helper para logs condicionales
export function debugLog(mode: keyof DebugConfig, ...args: any[]) {
  const config = getDebugConfig();
  if (config[mode]) {
    console.log(...args);
  }
}

export function debugWarn(mode: keyof DebugConfig, ...args: any[]) {
  const config = getDebugConfig();
  if (config[mode]) {
    console.warn(...args);
  }
}

export function debugError(mode: keyof DebugConfig, ...args: any[]) {
  const config = getDebugConfig();
  if (config[mode]) {
    console.error(...args);
  }
}
