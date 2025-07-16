// 🚀 Debug script para verificar navegación de asistencias
// Ejecutar en la consola del navegador para diagnosticar problemas

console.log('🔍 DEBUGGING ATTENDANCE NAVIGATION');
console.log('==================================');

// 1. Verificar autenticación
const authStore = window.app?.config?.globalProperties?.$stores?.auth || 
                  window.Vue?.config?.globalProperties?.$stores?.auth;
console.log('👤 Auth Store:', authStore?.user);

// 2. Verificar router
const router = window.app?.config?.globalProperties?.$router ||
               window.Vue?.config?.globalProperties?.$router;
console.log('🔄 Router Current Route:', router?.currentRoute?.value);

// 3. Verificar si la ruta está registrada
const routes = router?.getRoutes?.() || [];
const attendanceRoutes = routes.filter(route => route.path.includes('attendance'));
console.log('📍 Attendance Routes Found:', attendanceRoutes.map(r => ({
  name: r.name,
  path: r.path,
  component: r.component,
})));

// 4. Verificar store de clases
const classesStore = window.app?.config?.globalProperties?.$stores?.classes ||
                     window.Vue?.config?.globalProperties?.$stores?.classes;
console.log('📚 Classes Store:', {
  totalClasses: classesStore?.classes?.length || 0,
  sampleClasses: classesStore?.classes?.slice(0, 3)?.map(c => ({
    id: c.id,
    name: c.name,
  })) || [],
});

// 5. Buscar la clase específica
const targetClassId = '5lsTt6jmHj3CkjyGjg2t';
const targetClass = classesStore?.classes?.find(c => c.id === targetClassId);
console.log(`🎯 Target Class (${targetClassId}):`, targetClass);

// 6. Verificar URL de prueba
const testUrl = '/attendance/20250705/5lsTt6jmHj3CkjyGjg2t';
console.log('🌐 Test URL:', testUrl);

// 7. Intentar navegación programática
if (router) {
  console.log('🚀 Attempting programmatic navigation...');
  router.push(testUrl).then(() => {
    console.log('✅ Navigation successful');
  }).catch(err => {
    console.error('❌ Navigation failed:', err);
  });
}

// 8. Verificar guard RBAC
console.log('🛡️ RBAC Information:');
console.log('- User Role:', authStore?.user?.role);
console.log('- Is Authenticated:', !!authStore?.user);

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Check if user is properly authenticated');
console.log('2. Verify the class ID exists in the classes store');
console.log('3. Ensure RBAC permissions allow access to attendance routes');
console.log('4. Check browser console for any error messages');
