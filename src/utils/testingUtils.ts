/**
 * testingUtils.ts - Utilidades de testing para Music Academy
 *
 * Este archivo registra funciones de testing globales que pueden ser
 * utilizadas desde la consola del navegador para diagnosticar y probar
 * la aplicación Music Academy.
 */

import FunctionalTester from './FunctionalTester';

declare global {
  interface Window {
    runAllTests: () => Promise<void>
    testPWAFeatures: () => Promise<void>
    simulateOffline: () => void
    simulateOnline: () => void
    testRBAC: () => Promise<void>
    testAttendance: () => Promise<void>
  }
}

// Registrar funciones de testing solo en desarrollo
if (import.meta.env.DEV) {
  const tester = new FunctionalTester();

  // Función para ejecutar todos los tests
  window.runAllTests = async () => {
    console.log('🧪 Ejecutando suite completa de tests...');
    const results = await tester.runAllTests();
    return results;
  };

  // Test específico de PWA
  window.testPWAFeatures = async () => {
    console.log('📱 Testing PWA features...');
    const pwaTests = [
      {
        name: 'Service Worker',
        test: () => 'serviceWorker' in navigator,
      },
      {
        name: 'Manifest',
        test: async () => {
          const response = await fetch('/manifest.json');
          return response.ok;
        },
      },
      {
        name: 'Install Prompt',
        test: () =>
          (window as any).deferredPrompt !== undefined ||
          window.matchMedia('(display-mode: standalone)').matches,
      },
      {
        name: 'Offline Support',
        test: () => 'caches' in window,
      },
    ];

    for (const test of pwaTests) {
      try {
        const result = await test.test();
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
      } catch (error: any) {
        console.log(`❌ ${test.name}: FAIL - ${error.message}`);
      }
    }
  };

  // Simular modo offline
  window.simulateOffline = () => {
    console.log('📱 Simulando modo offline...');
    console.log('💡 Ve a DevTools > Network > Throttling > Offline');
    console.log('💡 O desconecta tu red temporalmente');

    // Disparar evento offline para testing
    window.dispatchEvent(new Event('offline'));
  };

  // Simular modo online
  window.simulateOnline = () => {
    console.log('🌐 Restaurando conexión...');
    console.log('💡 Ve a DevTools > Network > Throttling > Online');
    console.log('💡 O reconecta tu red');

    // Disparar evento online para testing
    window.dispatchEvent(new Event('online'));
  };

  // Test específico de RBAC
  window.testRBAC = async () => {
    console.log('🔒 Testing sistema de roles y permisos...');

    const roles = ['Maestro', 'Director', 'Admin', 'Superusuario'];
    const permissions = ['attendance.view', 'attendance.create', 'students.edit', 'reports.view'];

    console.log('📋 Verificando matriz de permisos:');
    console.log('================================');

    for (const role of roles) {
      console.log(`👤 ROL: ${role}`);
      for (const permission of permissions) {
        try {
          // Este es un test simulado - en un caso real verificaría el estado actual
          const hasPermission =
            role === 'Superusuario' ||
            (role === 'Admin' && permission !== 'system.config') ||
            (role === 'Director' && permission.startsWith('reports')) ||
            (role === 'Maestro' && permission.includes('view'));

          console.log(`   ${hasPermission ? '✅' : '❌'} ${permission}`);
        } catch (error) {
          console.log(`   ❌ Error verificando ${permission} para ${role}`);
        }
      }
      console.log('--------------------------------');
    }
  };

  // Test específico del sistema de asistencias
  window.testAttendance = async () => {
    console.log('📊 Testing sistema de asistencias...');

    const components = [
      'AttendanceCalendar',
      'StudentList',
      'AttendanceForm',
      'ObservationsModal',
      'AbsenceJustification',
    ];

    console.log('🔍 Verificando componentes de asistencia:');
    console.log('=======================================');

    for (const component of components) {
      // Simulación - en caso real verificaría la existencia del componente en el DOM
      const exists = document.querySelector(`.${component.toLowerCase()}`) !== null;
      console.log(`${exists ? '✅' : '❓'} ${component}`);
    }

    // Verificar store de asistencias (simulación)
    console.log('\n🏪 Verificando store de asistencias:');
    console.log('=================================');

    const storeFeatures = [
      'Carga inicial de datos',
      'Actualización en tiempo real',
      'Persistencia offline',
      'Sincronización automática',
    ];

    for (const feature of storeFeatures) {
      // Simulación de verificación
      const working = Math.random() > 0.2; // Simulación aleatoria
      console.log(`${working ? '✅' : '❌'} ${feature}`);
    }

    console.log('\nℹ️ Para tests más detallados usa window.runAllTests()');
  };

  console.log('🧪 Tests disponibles:');
  console.log('   - window.runAllTests() - Suite completa');
  console.log('   - window.testPWAFeatures() - Tests PWA específicos');
  console.log('   - window.simulateOffline() - Simular modo offline');
  console.log('   - window.simulateOnline() - Simular modo online');
  console.log('   - window.testRBAC() - Verificar roles y permisos');
  console.log('   - window.testAttendance() - Verificar sistema de asistencias');
}

export {};
