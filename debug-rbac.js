// Debug script for RBAC user access
console.log('🔍 Iniciando debug de acceso RBAC...');

// Function to check user access
async function debugUserAccess(userEmail) {
  try {
    // Get user from Firestore
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    const { db } = await import('./src/firebase.ts');
    
    console.log(`📧 Buscando usuario con email: ${userEmail}`);
    
    // Find user by email
    const usersQuery = query(collection(db, 'USERS'), where('email', '==', userEmail));
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    console.log('👤 Datos del usuario:', userData);
    
    // Check role assignments
    const rbacUserRolesQuery = query(
      collection(db, 'rbac_user_roles'), 
      where('userId', '==', userData.uid)
    );
    const roleAssignments = await getDocs(rbacUserRolesQuery);
    
    console.log(`🏷️ Asignaciones de roles encontradas: ${roleAssignments.size}`);
    roleAssignments.forEach(doc => {
      console.log('   📝 Asignación:', doc.data());
    });
    
    // Check available roles
    const rolesQuery = query(collection(db, 'rbac_roles'));
    const rolesSnapshot = await getDocs(rolesQuery);
    
    console.log('🎭 Roles disponibles:');
    rolesSnapshot.forEach(doc => {
      const role = doc.data();
      console.log(`   - ${role.name} (${role.id}): ${role.permissions.length} permisos`);
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

// Call with a test user email - replace with actual email
// debugUserAccess('maestro@test.com');

console.log('✅ Funciones de debug cargadas. Ejecuta: debugUserAccess("email@example.com")');
