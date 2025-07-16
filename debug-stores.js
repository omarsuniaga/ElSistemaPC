// Debug script to check store initialization
console.log('🔍 [Store Debug] Iniciando diagnóstico de stores...');

// Check if running in browser
if (typeof window !== 'undefined') {
  console.log('✅ [Store Debug] Ejecutándose en el navegador');
  
  // Check Vue app instance
  if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps?.length > 0) {
    console.log('✅ [Store Debug] Vue app detectada');
    
    // Check Pinia
    const app = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps[0];
    if (app.config?.globalProperties?.$pinia) {
      console.log('✅ [Store Debug] Pinia está inicializada');
      
      // Check specific stores
      const pinia = app.config.globalProperties.$pinia;
      console.log('📊 [Store Debug] Estados de Pinia:', Object.keys(pinia.state.value));
      
      // Check students store specifically
      if (pinia.state.value.students) {
        console.log('✅ [Store Debug] StudentsStore está disponible');
        console.log('📈 [Store Debug] Estado del StudentsStore:', {
          students: pinia.state.value.students.students?.length || 0,
          loading: pinia.state.value.students.loading,
          error: pinia.state.value.students.error,
        });
      } else {
        console.log('❌ [Store Debug] StudentsStore NO está disponible');
      }
      
    } else {
      console.log('❌ [Store Debug] Pinia NO está inicializada');
    }
  } else {
    console.log('❌ [Store Debug] Vue app NO detectada');
  }
} else {
  console.log('❌ [Store Debug] No se está ejecutando en el navegador');
}

// Check console errors
let errorCount = 0;
const originalError = console.error;
console.error = function(...args) {
  errorCount++;
  console.log(`🚨 Error ${errorCount}:`, ...args);
  originalError.apply(console, args);
};

setTimeout(() => {
  console.log(`📊 Total de errores detectados: ${errorCount}`);
}, 5000);
