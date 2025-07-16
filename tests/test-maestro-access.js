// Script para probar el acceso de Maestro
import { rbacService } from './src/services/rbac/rbacService.ts';

async function testMaestroAccess() {
  console.log('🧪 Probando acceso de Maestro...');

  try {
    // Simular un usuario Maestro - reemplaza con un ID real
    const maestroUserId = 'test-maestro-id';

    // Verificar acceso a la ruta /teacher
    const hasTeacherAccess = await rbacService.checkUserRouteAccess(maestroUserId, '/teacher');
    console.log(`Acceso a /teacher: ${hasTeacherAccess ? '✅' : '❌'}`);

    // Verificar acceso al módulo teacher
    const hasTeacherModuleAccess = await rbacService.checkUserModuleAccess(maestroUserId, 'teacher');
    console.log(`Acceso al módulo teacher: ${hasTeacherModuleAccess ? '✅' : '❌'}`);

    // Obtener roles del usuario
    const userRoles = await rbacService.getUserRoles(maestroUserId);
    console.log('Roles del usuario:', userRoles);

    // Obtener todos los roles disponibles
    const allRoles = await rbacService.getAllRoles();
    const maestroRole = allRoles.find((role) => role.name === 'Maestro');
    console.log('Rol Maestro:', maestroRole);
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

testMaestroAccess();
