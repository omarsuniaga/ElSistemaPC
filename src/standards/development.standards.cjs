/**
 * @file Estándares de Desarrollo - Music Academy Manager
 * @description Este archivo contiene las políticas y estándares de desarrollo que deben seguirse en el proyecto.
 * @version 1.0.0
 */

/**
 * Estándares de Arquitectura y Estructura
 */
const ARCHITECTURE_STANDARDS = {
  MAX_FILE_LINES: 600,
  FOLDER_STRUCTURE: {
    COMPONENTS: 'components/',
    COMPOSABLES: 'composables/',
    STORES: 'stores/',
    SERVICES: 'services/',
    VIEWS: 'views/',
    ASSETS: 'assets/'
  },
  DATA_FLOW: [
    'Vistas',
    'Componentes',
    'Composables',
    'Stores',
    'Services',
    'Firestore'
  ]
};

/**
 * Estándares de UI/UX
 */
const UI_UX_STANDARDS = {
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  },
  TRANSITIONS: {
    DURATION: '300ms',
    TIMING_FUNCTION: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

/**
 * Estándares de Rendimiento
 */
const PERFORMANCE_STANDARDS = {
  MAX_ASSET_SIZE: '100kb',
  MAX_INITIAL_LOAD: '200kb',
  MAX_CHUNK_SIZE: '500kb',
  CACHE_STRATEGY: {
    ASSETS: 'CacheFirst',
    API: 'NetworkFirst',
    FALLBACK: 'CacheFirst'
  }
};

/**
 * Estándares de Código
 */
const CODE_STANDARDS = {
  NAMING: {
    COMPONENTS: 'PascalCase',
    COMPOSABLES: 'useCamelCase',
    STORES: 'useStoreName',
    VARIABLES: 'camelCase',
    CONSTANTS: 'UPPER_SNAKE_CASE',
    TYPES: 'TPascalCase',
    INTERFACES: 'IPascalCase'
  },
  IMPORTS: {
    ORDER: [
      'Bibliotecas de terceros',
      'Módulos de Node.js',
      'Módulos de la aplicación',
      'Estilos',
      'Tipos',
      'Assets'
    ]
  }
};

/**
 * Estándares de PWA
 */
const PWA_STANDARDS = {
  CACHE_NAME: 'music-academy-cache-v1',
  PRECACHE: [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
  ],
  OFFLINE_PAGE: '/offline.html',
  CACHEABLE_RESPONSE_TYPES: [
    'basic',
    'cors',
    'default'
  ]
};

/**
 * Verifica si un archivo cumple con los estándares de tamaño
 * @param filePath Ruta del archivo a verificar
 * @returns boolean - true si cumple con los estándares
 */
function checkFileSize(fileContent) {
  const lineCount = fileContent.split('\n').length;
  return lineCount <= ARCHITECTURE_STANDARDS.MAX_FILE_LINES;
}

/**
 * Valida la estructura de un componente Vue
 * @param componentContent Contenido del componente
 * @returns boolean - true si la estructura es válida
 */
function validateComponentStructure(componentContent) {
  const requiredSections = [
    '<template>',
    '<script',
    '<style'
  ];
  
  return requiredSections.every(section => 
    componentContent.includes(section)
  );
}

/**
 * Obtiene los estándares en formato legible
 * @returns string - Estándares formateados
 */
function getFormattedStandards() {
  return `
    ===== ESTÁNDARES DE DESARROLLO =====
    
    📐 ARQUITECTURA:
    - Límite de ${ARCHITECTURE_STANDARDS.MAX_FILE_LINES} líneas por archivo
    - Flujo de datos: ${ARCHITECTURE_STANDARDS.DATA_FLOW.join(' → ')}
    
    🎨 UI/UX:
    - Soporte para temas: ${Object.values(UI_UX_STANDARDS.THEMES).join(', ')}
    - Breakpoints: ${Object.entries(UI_UX_STANDARDS.BREAKPOINTS).map(([k, v]) => `${k}:${v}`).join(', ')}
    
    ⚡ RENDIMIENTO:
    - Tamaño máximo de assets: ${PERFORMANCE_STANDARDS.MAX_ASSET_SIZE}
    - Tamaño máximo de carga inicial: ${PERFORMANCE_STANDARDS.MAX_INITIAL_LOAD}
    
    📱 PWA:
    - Nombre de caché: ${PWA_STANDARDS.CACHE_NAME}
    - Página offline: ${PWA_STANDARDS.OFFLINE_PAGE}
  `;
}

// Exportar todos los estándares
module.exports = {
  ARCHITECTURE_STANDARDS,
  UI_UX_STANDARDS,
  PERFORMANCE_STANDARDS,
  CODE_STANDARDS,
  PWA_STANDARDS,
  checkFileSize,
  validateComponentStructure,
  getFormattedStandards
};