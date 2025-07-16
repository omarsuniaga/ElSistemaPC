/**
 * pwaTester.ts - Script de prueba para características PWA
 *
 * Ejecuta este script en la consola del navegador para verificar
 * que todas las características PWA están funcionando correctamente.
 */

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
}

// Extender el tipo Window para incluir nuestras funciones globales
declare global {
  interface Window {
    musicAcademyDebug?: any
    runAllTests?: () => Promise<void>
    testPWAFeatures?: () => Promise<TestResult[]>
  }

  interface Navigator {
    connection?: {
      effectiveType?: string
    }
  }
}

console.log('🚀 Iniciando pruebas PWA para Music Academy...');

// Función principal de testing
async function testPWAFeatures(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n📋 PRUEBAS DE FUNCIONALIDADES PWA');
  console.log('================================');

  // 1. Test Service Worker
  console.log('\n🔧 1. Testing Service Worker...');
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('✅ Service Worker registrado');
        console.log(`   Scope: ${registration.scope}`);
        console.log(`   Estado: ${registration.active ? 'Activo' : 'Inactivo'}`);
        results.push({ test: 'Service Worker', status: 'PASS' });
      } else {
        console.log('❌ Service Worker no registrado');
        results.push({ test: 'Service Worker', status: 'FAIL' });
      }
    } else {
      console.log('❌ Service Worker no soportado');
      results.push({ test: 'Service Worker', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Service Worker:', error);
    results.push({ test: 'Service Worker', status: 'FAIL' });
  }

  // 2. Test Herramientas de Debug
  console.log('\n🛠️ 2. Testing Debug Tools...');
  try {
    if (window.musicAcademyDebug) {
      console.log('✅ Debug tools disponibles');
      const swStatus = await window.musicAcademyDebug.getServiceWorkerStatus();
      console.log(`   SW Status: ${swStatus.status}`);
      console.log(`   SW Version: ${swStatus.version || 'N/A'}`);
      results.push({ test: 'Debug Tools', status: 'PASS' });
    } else {
      console.log('❌ Debug tools no disponibles');
      results.push({ test: 'Debug Tools', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Debug Tools:', error);
    results.push({ test: 'Debug Tools', status: 'FAIL' });
  }
  // 3. Test Functional Tester
  console.log('\n🧪 3. Testing Functional Tester...');
  try {
    if (typeof window.runAllTests === 'function') {
      console.log('✅ Functional Tester disponible');
      console.log('   Ejecutar: window.runAllTests()');
      results.push({ test: 'Functional Tester', status: 'PASS' });
    } else {
      console.log('❌ Functional Tester no disponible');
      results.push({ test: 'Functional Tester', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Functional Tester:', error);
    results.push({ test: 'Functional Tester', status: 'FAIL' });
  }

  // 4. Test Cache API
  console.log('\n💾 4. Testing Cache API...');
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('✅ Cache API disponible');
      console.log(`   Caches disponibles: ${cacheNames.length}`);
      cacheNames.forEach((name) => console.log(`   - ${name}`));
      results.push({ test: 'Cache API', status: 'PASS' });
    } else {
      console.log('❌ Cache API no disponible');
      results.push({ test: 'Cache API', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Cache API:', error);
    results.push({ test: 'Cache API', status: 'FAIL' });
  }

  // 5. Test Storage Quota
  console.log('\n💽 5. Testing Storage Quota...');
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      console.log('✅ Storage Quota disponible');
      console.log(`   Usado: ${usedMB}MB`);
      console.log(`   Cuota: ${quotaMB}MB`);
      results.push({ test: 'Storage Quota', status: 'PASS' });
    } else {
      console.log('❌ Storage Quota no disponible');
      results.push({ test: 'Storage Quota', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Storage Quota:', error);
    results.push({ test: 'Storage Quota', status: 'FAIL' });
  }

  // 6. Test Network Status
  console.log('\n🌐 6. Testing Network Status...');
  try {
    console.log(`✅ Estado de red: ${navigator.onLine ? 'Online' : 'Offline'}`);
    console.log(
      `   Connection: ${navigator.connection ? navigator.connection.effectiveType : 'N/A'}`,
    );
    results.push({ test: 'Network Status', status: 'PASS' });
  } catch (error) {
    console.error('❌ Error al verificar Network Status:', error);
    results.push({ test: 'Network Status', status: 'FAIL' });
  }

  // 7. Test Manifest
  console.log('\n📱 7. Testing PWA Manifest...');
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log('✅ Manifest linked');
      console.log(`   Href: ${manifestLink.getAttribute('href')}`);
      results.push({ test: 'PWA Manifest', status: 'PASS' });
    } else {
      console.log('❌ Manifest no encontrado');
      results.push({ test: 'PWA Manifest', status: 'FAIL' });
    }
  } catch (error) {
    console.error('❌ Error al verificar Manifest:', error);
    results.push({ test: 'PWA Manifest', status: 'FAIL' });
  }

  // Generar resumen final
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('====================');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`✅ Pruebas exitosas: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Pruebas fallidas: ${total - passed}/${total}`);

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
  });

  // Comandos útiles
  console.log('\n🛠️ COMANDOS ÚTILES DISPONIBLES');
  console.log('===============================');
  console.log('• window.runAllTests() - Ejecutar todos los tests funcionales');
  console.log('• window.testPWAFeatures() - Probar características PWA');
  console.log('• window.musicAcademyDebug - Herramientas de debug avanzadas');
  console.log('• window.simulateOffline() - Simular modo offline');
  console.log('• window.simulateOnline() - Simular modo online');

  return results;
}

// Exponer función globalmente
window.testPWAFeatures = testPWAFeatures;

// Ejecutar automáticamente en modo desarrollo
if (import.meta?.env?.DEV) {
  console.log('🔧 Modo desarrollo detectado - PWA Tester listo');
  console.log('💡 Ejecuta window.testPWAFeatures() para probar todas las características');
}

export default testPWAFeatures;
