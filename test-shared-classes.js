// Script de prueba rápida para verificar el sistema de clases compartidas
// Ejecutar en la consola del navegador

window.testSharedClasses = () => {
  console.log('🧪 === PRUEBA DEL SISTEMA DE CLASES COMPARTIDAS ===');
  
  // Verificar que los componentes estén montados
  const sharedClassesSection = document.querySelector('[data-testid="shared-classes"]') || 
                              document.querySelector('.shared-classes-list');
  
  if (sharedClassesSection) {
    console.log('✅ Componente SharedClassesList encontrado');
  } else {
    console.log('❌ Componente SharedClassesList no encontrado');
    console.log('💡 Asegúrate de estar en la pestaña "Clases Compartidas"');
  }
  
  // Verificar el estado de Vue
  if (window.Vue || window.__VUE__) {
    console.log('✅ Vue está disponible');
  } else {
    console.log('⚠️  Vue no detectado globalmente');
  }
  
  // Verificar filtros en localStorage
  const storedFilters = localStorage.getItem('music-academy-filters');
  if (storedFilters) {
    console.log('📊 Filtros guardados:', JSON.parse(storedFilters));
  } else {
    console.log('📊 No hay filtros guardados aún');
  }
  
  // Datos de prueba para clases compartidas
  const demoSharedData = {
    totalClasses: 6,
    sharedClasses: 2,
    ownedShared: 1,
    sharedWithMe: 1,
    permissions: {
      read: 3,
      write: 2,
      admin: 1
    }
  };
  
  console.log('📈 Datos de demostración disponibles:', demoSharedData);
  
  // Instrucciones para el usuario
  console.log('\n🎯 INSTRUCCIONES DE PRUEBA:');
  console.log('1. Ve a la pestaña "Clases Compartidas"');
  console.log('2. Verifica que aparezcan las clases demo');
  console.log('3. Prueba los filtros (Todas, Mis clases, Compartidas conmigo)');
  console.log('4. Haz clic en "Compartir Nueva Clase"');
  console.log('5. Prueba editar permisos de una clase');
  
  console.log('\n✨ Sistema listo para pruebas!');
};

// Auto-ejecutar en modo desarrollo
if (window.location.hostname === 'localhost') {
  console.log('🔧 Modo desarrollo detectado');
  console.log('💡 Ejecuta testSharedClasses() para probar el sistema');
}

// Verificar errores en tiempo real
window.addEventListener('error', (event) => {
  if (event.message.includes('SharedClassesList') || event.message.includes('length')) {
    console.error('🚨 Error detectado en SharedClassesList:', event.message);
    console.log('🔧 Posible solución: Recargar la página o verificar props');
  }
});

console.log('🎵 Script de prueba cargado. Usa testSharedClasses() para verificar el sistema.');
