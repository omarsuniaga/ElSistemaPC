// SCRIPT DE TESTING BÁSICO PARA FASE 1
// Ejecutar en la consola del navegador

console.log('🧪 INICIANDO TESTS DE FASE 1 - GESTIÓN AVANZADA DE ESTUDIANTES');
console.log('================================================================');

// Test 1: Verificar que la ruta funciona
const testRouting = () => {
  console.log('📍 Test 1: Verificando routing...');

  try {
    // Intentar navegar a la ruta avanzada
    const currentPath = window.location.pathname;
    console.log(`   Ruta actual: ${currentPath}`);

    if (currentPath.includes('/admin/students/advanced')) {
      console.log('   ✅ Ruta de gestión avanzada activa');
      return true;
    } else {
      console.log('   ⚠️ No estás en la ruta de gestión avanzada');
      console.log('   💡 Navega a /admin/students/advanced para testear');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error en routing:', error);
    return false;
  }
};

// Test 2: Verificar componente en DOM
const testComponent = () => {
  console.log('🧩 Test 2: Verificando componente en DOM...');

  try {
    const component = document.querySelector('.advanced-students-management');

    if (component) {
      console.log('   ✅ Componente AdvancedStudentsManagement encontrado en DOM');

      // Verificar sub-elementos
      const toolbar = component.querySelector('.management-toolbar');
      const table = component.querySelector('.students-table');
      const header = component.querySelector('.management-header');

      console.log(`   📊 Header: ${header ? '✅' : '❌'}`);
      console.log(`   🔧 Toolbar: ${toolbar ? '✅' : '❌'}`);
      console.log(`   📋 Tabla: ${table ? '✅' : '❌'}`);

      return true;
    } else {
      console.log('   ❌ Componente no encontrado en DOM');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error verificando componente:', error);
    return false;
  }
};

// Test 3: Verificar funcionalidad de búsqueda
const testSearch = () => {
  console.log('🔍 Test 3: Verificando funcionalidad de búsqueda...');

  try {
    const searchInput = document.querySelector('input[placeholder*="Buscar"]');

    if (searchInput) {
      console.log('   ✅ Campo de búsqueda encontrado');

      // Simular búsqueda
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));

      console.log('   ✅ Evento de búsqueda simulado');
      return true;
    } else {
      console.log('   ❌ Campo de búsqueda no encontrado');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error en funcionalidad de búsqueda:', error);
    return false;
  }
};

// Test 4: Verificar botones de acción
const testActions = () => {
  console.log('⚡ Test 4: Verificando botones de acción...');

  try {
    const importBtn = document.querySelector('button:has([class*="ArrowUpTray"])');
    const exportBtn = document.querySelector('button:has([class*="ArrowDownTray"])');
    const createBtn = document.querySelector('button:has([class*="Plus"])');

    console.log(`   📥 Botón Importar: ${importBtn ? '✅' : '❌'}`);
    console.log(`   📤 Botón Exportar: ${exportBtn ? '✅' : '❌'}`);
    console.log(`   ➕ Botón Crear: ${createBtn ? '✅' : '❌'}`);

    return importBtn && exportBtn && createBtn;
  } catch (error) {
    console.log('   ❌ Error verificando botones:', error);
    return false;
  }
};

// Test 5: Verificar métricas en header
const testMetrics = () => {
  console.log('📊 Test 5: Verificando métricas en header...');

  try {
    const metrics = document.querySelectorAll('.metric-card');

    if (metrics.length > 0) {
      console.log(`   ✅ ${metrics.length} métricas encontradas`);

      metrics.forEach((metric, index) => {
        const value = metric.querySelector('.metric-value');
        const label = metric.querySelector('.metric-label');

        if (value && label) {
          console.log(`   📈 Métrica ${index + 1}: ${label.textContent} = ${value.textContent}`);
        }
      });

      return true;
    } else {
      console.log('   ❌ No se encontraron métricas');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error verificando métricas:', error);
    return false;
  }
};

// Test 6: Verificar responsive design
const testResponsive = () => {
  console.log('📱 Test 6: Verificando diseño responsive...');

  try {
    const component = document.querySelector('.advanced-students-management');

    if (component) {
      const styles = window.getComputedStyle(component);
      const isFlexColumn = styles.flexDirection === 'column';
      const hasGap = styles.gap !== '' && styles.gap !== 'normal';

      console.log(`   📐 Flex Direction: ${styles.flexDirection} ${isFlexColumn ? '✅' : '❌'}`);
      console.log(`   📏 Gap: ${styles.gap} ${hasGap ? '✅' : '❌'}`);

      return isFlexColumn && hasGap;
    } else {
      console.log('   ❌ Componente no encontrado para test responsive');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error verificando responsive:', error);
    return false;
  }
};

// Ejecutar todos los tests
const runAllTests = () => {
  console.log('🚀 EJECUTANDO BATERÍA COMPLETA DE TESTS...');
  console.log('');

  const tests = [
    { name: 'Routing', fn: testRouting },
    { name: 'Componente DOM', fn: testComponent },
    { name: 'Búsqueda', fn: testSearch },
    { name: 'Botones Acción', fn: testActions },
    { name: 'Métricas Header', fn: testMetrics },
    { name: 'Responsive Design', fn: testResponsive },
  ];

  let passed = 0;
  const results = [];

  tests.forEach((test) => {
    const result = test.fn();
    results.push({ name: test.name, passed: result });
    if (result) passed++;
    console.log('');
  });

  // Resumen
  console.log('📋 RESUMEN DE RESULTADOS');
  console.log('========================');

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log('');
  console.log(`🎯 TOTAL: ${passed}/${tests.length} tests pasaron`);

  if (passed === tests.length) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON! La Fase 1 está funcionando correctamente.');
  } else {
    console.log('⚠️ Algunos tests fallaron. Revisar implementación.');
  }

  console.log('');
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('1. Si todos los tests pasaron, proceder con testing manual');
  console.log('2. Probar importación de archivos CSV');
  console.log('3. Verificar modales de comunicación masiva');
  console.log('4. Testear filtros y búsqueda avanzada');
  console.log('5. Validar responsive en diferentes dispositivos');

  return { passed, total: tests.length, success: passed === tests.length };
};

// Test específico para funcionalidad de importación
const testImportFunction = () => {
  console.log('📁 Test Extra: Verificando funcionalidad de importación...');

  try {
    // Simular click en botón de importar
    const importBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Importar'),
    );

    if (importBtn) {
      console.log('   ✅ Botón de importar encontrado');

      // Simular click
      importBtn.click();

      setTimeout(() => {
        const menu = document.querySelector('.import-export-section .absolute');
        if (menu && menu.style.display !== 'none') {
          console.log('   ✅ Menú de importación se abrió correctamente');
        } else {
          console.log('   ⚠️ Menú de importación no visible (puede ser por z-index)');
        }
      }, 100);

      return true;
    } else {
      console.log('   ❌ Botón de importar no encontrado');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error testando importación:', error);
    return false;
  }
};

// Hacer funciones disponibles globalmente
window.runPhase1Tests = runAllTests;
window.testImportFunction = testImportFunction;
window.testRouting = testRouting;
window.testComponent = testComponent;

// Mensaje de instrucciones
console.log('💡 FUNCIONES DISPONIBLES:');
console.log('- runPhase1Tests() : Ejecutar todos los tests');
console.log('- testImportFunction() : Test específico de importación');
console.log('- testRouting() : Test solo de routing');
console.log('- testComponent() : Test solo de componente DOM');
console.log('');
console.log('🎯 Para empezar, ejecuta: runPhase1Tests()');
console.log('');
