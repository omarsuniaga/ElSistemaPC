// Script de prueba para verificar la corrección del flash de login
// Ejecutar en la consola del navegador después de iniciar sesión

console.log('🧪 Iniciando prueba de corrección del flash de login...');

// Función para simular recarga de página
function testPageReload() {
  console.log('🔄 Simulando recarga de página...');
  window.location.reload();
}

// Función para simular navegación con botones del navegador
function testBrowserNavigation() {
  console.log('🔙 Simulando navegación con botones del navegador...');

  // Ir a una página diferente
  window.history.pushState({}, '', '/dashboard');

  // Volver atrás
  setTimeout(() => {
    window.history.back();
  }, 1000);

  // Ir adelante
  setTimeout(() => {
    window.history.forward();
  }, 2000);
}

// Función para verificar el estado de autenticación
function checkAuthState() {
  console.log('🔐 Verificando estado de autenticación...');

  // Acceder al store de autenticación desde Vue
  const app = document.querySelector('#app').__vue_app__;
  const authStore = app.config.globalProperties.$pinia.state.value.auth;

  console.log('✅ Estado actual:', {
    isLoggedIn: authStore.isLoggedIn,
    isInitialized: authStore.isInitialized,
    user: authStore.user?.email || 'No user',
    role: authStore.user?.role || 'No role',
  });

  return authStore;
}

// Función principal de prueba
function runLoginFlashTest() {
  console.log('🏁 Ejecutando prueba completa...');

  // 1. Verificar estado inicial
  const authStore = checkAuthState();

  if (!authStore.isLoggedIn) {
    console.log('❌ Error: No hay usuario autenticado. Inicia sesión primero.');
    return;
  }

  console.log('✅ Usuario autenticado. Continuando con las pruebas...');

  // 2. Test de recarga de página
  console.log('📝 Test 1: Recarga de página');
  console.log('   - Deberías ver "Iniciando aplicación..." brevemente');
  console.log('   - NO deberías ver la vista de login');
  console.log('   - La página debería cargar directamente');

  // 3. Test de navegación
  console.log('📝 Test 2: Navegación con botones del navegador');
  console.log('   - Simula navegación adelante/atrás');
  console.log('   - NO debería aparecer flash de login');

  // 4. Instrucciones manuales
  console.log('📋 Pruebas manuales adicionales:');
  console.log('   1. Presiona F5 para recargar la página');
  console.log('   2. Usa los botones ← → del navegador');
  console.log('   3. Navega a diferentes secciones de la app');
  console.log('   4. Verifica que no aparece flash de login');

  return {
    testPageReload,
    testBrowserNavigation,
    checkAuthState,
  };
}

// Exponer funciones globalmente para pruebas manuales
window.testLoginFlash = runLoginFlashTest;
window.testPageReload = testPageReload;
window.testBrowserNavigation = testBrowserNavigation;
window.checkAuthState = checkAuthState;

// Ejecutar prueba automáticamente
const testFunctions = runLoginFlashTest();

console.log('🎯 Funciones de prueba disponibles:');
console.log('   - window.testLoginFlash() - Ejecutar prueba completa');
console.log('   - window.testPageReload() - Simular recarga');
console.log('   - window.testBrowserNavigation() - Simular navegación');
console.log('   - window.checkAuthState() - Verificar estado auth');

export { runLoginFlashTest as testLoginFlash, testPageReload, testBrowserNavigation, checkAuthState };
