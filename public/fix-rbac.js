// Script para corregir RBAC desde la consola del navegador
// Este script debe ejecutarse en la consola del navegador cuando estés en la aplicación

async function fixRBACForMaestro() {
  console.log('🔧 Iniciando corrección RBAC para Maestros...');

  try {
    // Importar los servicios necesarios
    const { initializeRBAC } = await import('./src/scripts/initializeRBAC.ts');

    console.log('🚀 Ejecutando inicialización/corrección de RBAC...');
    await initializeRBAC.run();

    console.log('✅ RBAC corregido exitosamente');
    console.log('🔄 Recarga la página e intenta hacer login como Maestro nuevamente');
  } catch (error) {
    console.error('❌ Error corrigiendo RBAC:', error);
  }
}

// También función para verificar estado actual
async function checkCurrentRBACState() {
  console.log('🔍 Verificando estado actual del RBAC...');

  try {
    const { rbacService } = await import('./src/services/rbac/rbacService.ts');

    // Verificar roles disponibles
    const roles = await rbacService.getAllRoles();
    console.log('🎭 Roles disponibles:', roles);

    // Buscar rol Maestro
    const maestroRole = roles.find((role) => role.name === 'Maestro');
    if (maestroRole) {
      console.log('👨‍🏫 Rol Maestro encontrado:', maestroRole);
      console.log('🎫 Permisos del Maestro:', maestroRole.permissions);
    } else {
      console.log('❌ Rol Maestro no encontrado');
    }

    // Verificar módulo teacher
    const teacherModule = await rbacService.getModuleAccess('teacher');
    console.log('📦 Módulo Teacher:', teacherModule);

    // Verificar acceso a ruta /teacher
    console.log('🛣️ Intentando verificar acceso a /teacher para rol Maestro...');
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
}

console.log('🔧 Scripts de corrección RBAC cargados.');
console.log('📋 Funciones disponibles:');
console.log('  - fixRBACForMaestro(): Corrige la configuración RBAC');
console.log('  - checkCurrentRBACState(): Verifica el estado actual');
console.log('');
console.log('💡 Ejecuta: fixRBACForMaestro()');
