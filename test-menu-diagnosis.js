// Script de diagnóstico avanzado para menús en vista lista
// Ejecutar en la consola del navegador en el dashboard del maestro

console.log('🔍 Iniciando diagnóstico avanzado de menús en vista lista...');

// Función para diagnosticar el stacking context
function diagnoseStackingContext() {
  console.log('📐 Analizando stacking context...');
  
  // Encontrar todos los elementos con z-index
  const allElements = document.querySelectorAll('*');
  const zIndexElements = [];
  
  allElements.forEach(el => {
    const style = getComputedStyle(el);
    const zIndex = style.zIndex;
    const position = style.position;
    const isolation = style.isolation;
    
    if (zIndex !== 'auto' || isolation === 'isolate' || ['relative', 'absolute', 'fixed', 'sticky'].includes(position)) {
      zIndexElements.push({
        element: el,
        tagName: el.tagName,
        className: el.className,
        zIndex: zIndex,
        position: position,
        isolation: isolation,
        rect: el.getBoundingClientRect()
      });
    }
  });
  
  // Ordenar por z-index
  zIndexElements.sort((a, b) => {
    const aZ = a.zIndex === 'auto' ? 0 : parseInt(a.zIndex);
    const bZ = b.zIndex === 'auto' ? 0 : parseInt(b.zIndex);
    return bZ - aZ;
  });
  
  console.log('📊 Elementos con stacking context:', zIndexElements.slice(0, 10));
  return zIndexElements;
}

// Función para forzar cambio a vista lista
function forceListView() {
  console.log('📋 Forzando cambio a vista lista...');
  
  const listButton = document.querySelector('button[title="Vista de lista"]');
  if (listButton) {
    listButton.click();
    console.log('✅ Vista cambiada a lista');
    return true;
  }
  
  // Método alternativo: buscar por texto
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.includes('Lista') || button.innerHTML.includes('Lista')) {
      button.click();
      console.log('✅ Vista cambiada a lista (método alternativo)');
      return true;
    }
  }
  
  console.log('❌ No se pudo cambiar a vista lista');
  return false;
}

// Función para probar menús específicamente
function testMenuVisibility() {
  console.log('🎯 Probando visibilidad de menús...');
  
  // Esperar un poco para que se aplique la vista lista
  setTimeout(() => {
    const menuButtons = document.querySelectorAll('.menu-container button, button[class*="EllipsisVertical"]');
    console.log(`📊 Encontrados ${menuButtons.length} botones de menú`);
    
    if (menuButtons.length === 0) {
      console.log('❌ No se encontraron botones de menú');
      return;
    }
    
    // Probar cada menú
    menuButtons.forEach((button, index) => {
      console.log(`🖱️ Probando menú ${index + 1}...`);
      
      // Hacer clic para abrir
      button.click();
      
      setTimeout(() => {
        // Buscar el menú abierto
        const openMenu = document.querySelector('[role="menu"], .menu-dropdown');
        
        if (openMenu) {
          const rect = openMenu.getBoundingClientRect();
          const style = getComputedStyle(openMenu);
          
          console.log(`✅ Menú ${index + 1} abierto:`, {
            visible: rect.width > 0 && rect.height > 0,
            position: {
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right
            },
            style: {
              zIndex: style.zIndex,
              position: style.position,
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity
            },
            inViewport: rect.top >= 0 && rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth
          });
          
          // Verificar si está siendo tapado
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const elementAtCenter = document.elementFromPoint(centerX, centerY);
          
          console.log(`🎯 Elemento en el centro del menú:`, {
            tagName: elementAtCenter?.tagName,
            className: elementAtCenter?.className,
            isMenu: elementAtCenter === openMenu || openMenu.contains(elementAtCenter)
          });
          
        } else {
          console.log(`❌ Menú ${index + 1} no se abrió o no es visible`);
        }
        
        // Cerrar menú
        document.body.click();
        
      }, 100);
    });
    
  }, 200);
}

// Función para aplicar correcciones en tiempo real
function applyRuntimeFixes() {
  console.log('🔧 Aplicando correcciones en tiempo real...');
  
  // Agregar estilos CSS para forzar visibilidad
  const style = document.createElement('style');
  style.textContent = `
    /* Correcciones de emergencia para menús */
    .teacher-class-card [role="menu"],
    .menu-dropdown {
      z-index: 999999 !important;
      position: fixed !important;
      isolation: isolate !important;
      transform: translateZ(0) !important;
    }
    
    .list-view-card {
      overflow: visible !important;
      z-index: auto !important;
    }
    
    .list-view-card:hover {
      z-index: 100 !important;
    }
    
    .menu-container {
      isolation: isolate !important;
      z-index: 1000 !important;
    }
    
    /* Asegurar que no hay elementos padre que bloqueen */
    .teacher-class-card,
    .list-view-card {
      isolation: auto !important;
      transform: none !important;
    }
  `;
  
  document.head.appendChild(style);
  console.log('✅ Estilos de corrección aplicados');
}

// Función para monitorear menús en tiempo real
function monitorMenus() {
  console.log('👁️ Iniciando monitoreo de menús...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && (node.matches('[role="menu"]') || node.classList?.contains('menu-dropdown'))) {
          console.log('🆕 Nuevo menú detectado:', node);
          
          // Forzar estilos de visibilidad
          node.style.zIndex = '999999';
          node.style.position = 'fixed';
          node.style.isolation = 'isolate';
          
          const rect = node.getBoundingClientRect();
          console.log('📐 Posición del nuevo menú:', rect);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Monitoreo iniciado');
  return observer;
}

// Función principal
function runMenuDiagnostic() {
  console.log('🏁 Ejecutando diagnóstico completo de menús...');
  
  // 1. Verificar ubicación
  if (!window.location.pathname.includes('/teacher')) {
    console.log('❌ No estás en el dashboard del maestro');
    return;
  }
  
  // 2. Aplicar correcciones
  applyRuntimeFixes();
  
  // 3. Iniciar monitoreo
  const observer = monitorMenus();
  
  // 4. Cambiar a vista lista
  setTimeout(() => {
    if (forceListView()) {
      // 5. Diagnosticar stacking
      setTimeout(() => {
        diagnoseStackingContext();
        
        // 6. Probar menús
        setTimeout(() => {
          testMenuVisibility();
          
          console.log('🎯 Diagnóstico completado. Revisa los logs anteriores.');
          console.log('📋 Acciones recomendadas:');
          console.log('   1. Si los menús siguen ocultos, ejecuta applyRuntimeFixes()');
          console.log('   2. Verifica que los z-index sean los más altos');
          console.log('   3. Prueba manualmente cada menú hamburguesa');
          
        }, 1000);
      }, 500);
    }
  }, 100);
  
  return observer;
}

// Exponer funciones globalmente
window.runMenuDiagnostic = runMenuDiagnostic;
window.forceListView = forceListView;
window.testMenuVisibility = testMenuVisibility;
window.diagnoseStackingContext = diagnoseStackingContext;
window.applyRuntimeFixes = applyRuntimeFixes;
window.monitorMenus = monitorMenus;

// Ejecutar automáticamente
const observer = runMenuDiagnostic();

console.log('🎯 Funciones disponibles:');
console.log('   - window.runMenuDiagnostic() - Diagnóstico completo');
console.log('   - window.forceListView() - Cambiar a vista lista');
console.log('   - window.testMenuVisibility() - Probar menús');
console.log('   - window.applyRuntimeFixes() - Aplicar correcciones');

export { 
  runMenuDiagnostic, 
  forceListView, 
  testMenuVisibility, 
  diagnoseStackingContext,
  applyRuntimeFixes,
  monitorMenus
};
