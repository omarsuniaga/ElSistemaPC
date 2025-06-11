// Test script for RBAC with USERS collection
// Ejecutar en la consola del navegador

async function testRBACWithUsersCollection() {
    console.log('🧪 Iniciando prueba de RBAC con colección USERS...');
    
    try {
        // Importar el servicio RBAC
        const { rbacService } = await import('./src/services/rbac/rbacService.ts');
        
        // Simular diferentes usuarios - reemplaza con IDs reales de tu Firestore
        const testUsers = [
            { uid: 'test-maestro', expectedRole: 'Maestro' },
            { uid: 'test-director', expectedRole: 'Director' }
        ];
        
        for (const testUser of testUsers) {
            console.log(`\n👤 Probando usuario: ${testUser.uid} (esperado: ${testUser.expectedRole})`);
            
            // Test 1: Obtener roles del usuario
            const userRoles = await rbacService.getUserRoles(testUser.uid);
            console.log(`   🏷️ Roles encontrados:`, userRoles);
            
            // Test 2: Verificar acceso a rutas
            const routes = ['/teacher', '/dashboard', '/superusuario/dashboard'];
            for (const route of routes) {
                const hasAccess = await rbacService.checkUserRouteAccess(testUser.uid, route);
                console.log(`   🛣️ Acceso a ${route}: ${hasAccess ? '✅' : '❌'}`);
            }
            
            // Test 3: Verificar permisos específicos
            const permissions = ['teacher_dashboard_view', 'dashboard_view', 'rbac_manage'];
            for (const permission of permissions) {
                const hasPermission = await rbacService.checkUserPermission(testUser.uid, permission);
                console.log(`   🎫 Permiso ${permission}: ${hasPermission ? '✅' : '❌'}`);
            }
        }
        
        console.log('\n✅ Prueba de RBAC completada');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    }
}

console.log('🔧 Script de prueba RBAC cargado.');
console.log('💡 Ejecuta: testRBACWithUsersCollection()');
