// Script para probar la funcionalidad de gestión de permisos en clases compartidas
// Ejecutar en la consola del navegador después de navegar a la sección de clases compartidas

window.testPermissionsSystem = () => {
  console.log('🔐 === PRUEBA DEL SISTEMA DE PERMISOS ===');
  
  // Crear datos de prueba con permisos detallados
  const testClassesWithPermissions = [
    {
      id: 'test-permissions-class-1',
      name: 'Piano Avanzado - Con Permisos',
      description: 'Clase de prueba para el sistema de permisos',
      instrument: 'Piano',
      level: 'avanzado',
      teacherId: 'main-teacher-123',
      teachers: [
        // Maestro principal (string)
        'main-teacher-123',
        // Maestro asistente con permisos completos
        {
          teacherId: 'assistant-full-123',
          role: 'assistant',
          assignedAt: new Date(),
          assignedBy: 'main-teacher-123',
          permissions: {
            canTakeAttendance: true,
            canAddObservations: true,
            canViewAttendanceHistory: true,
            canEditClass: true,
            canManageStudents: true,
            canManageTeachers: false,
            canManageSchedule: false
          }
        },
        // Maestro asistente con permisos limitados
        {
          teacherId: 'assistant-limited-456',
          role: 'assistant',
          assignedAt: new Date(),
          assignedBy: 'main-teacher-123',
          permissions: {
            canTakeAttendance: true,
            canAddObservations: true,
            canViewAttendanceHistory: true,
            canEditClass: false,
            canManageStudents: false,
            canManageTeachers: false,
            canManageSchedule: false
          }
        },
        // Maestro asistente con permisos de administrador
        {
          teacherId: 'assistant-admin-789',
          role: 'assistant',
          assignedAt: new Date(),
          assignedBy: 'main-teacher-123',
          permissions: {
            canTakeAttendance: true,
            canAddObservations: true,
            canViewAttendanceHistory: true,
            canEditClass: true,
            canManageStudents: true,
            canManageTeachers: true,
            canManageSchedule: true
          }
        }
      ],
      studentIds: ['student-1', 'student-2', 'student-3'],
      status: 'active'
    }
  ];
  
  const testTeachers = [
    {
      id: 'main-teacher-123',
      name: 'Ana María González',
      email: 'ana.gonzalez@music.edu',
      instrument: 'Piano'
    },
    {
      id: 'assistant-full-123',
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@music.edu',
      instrument: 'Piano'
    },
    {
      id: 'assistant-limited-456',
      name: 'María López',
      email: 'maria.lopez@music.edu',
      instrument: 'Piano'
    },
    {
      id: 'assistant-admin-789',
      name: 'Pedro Martínez',
      email: 'pedro.martinez@music.edu',
      instrument: 'Piano'
    }
  ];
  
  // Guardar datos de prueba
  localStorage.setItem('permissions-test-classes', JSON.stringify(testClassesWithPermissions));
  localStorage.setItem('permissions-test-teachers', JSON.stringify(testTeachers));
  
  console.log('✅ Datos de prueba con permisos creados:');
  console.log(`📚 ${testClassesWithPermissions.length} clases con diferentes niveles de permisos`);
  console.log(`👨‍🏫 ${testTeachers.length} maestros de prueba`);
  
  // Analizar estructura de permisos
  const classWithPermissions = testClassesWithPermissions[0];
  console.log('\n🔍 ANÁLISIS DE PERMISOS:');
  console.log(`Clase: ${classWithPermissions.name}`);
  console.log(`Maestro principal: ${classWithPermissions.teacherId}`);
  
  classWithPermissions.teachers.forEach((teacher, index) => {
    if (typeof teacher === 'string') {
      console.log(`\n👤 Maestro ${index + 1}: ${teacher} (Propietario)`);
      console.log('   Permisos: Todos (propietario)');
    } else {
      const teacherInfo = testTeachers.find(t => t.id === teacher.teacherId);
      console.log(`\n👤 Maestro ${index + 1}: ${teacherInfo?.name || teacher.teacherId}`);
      console.log(`   Rol: ${teacher.role}`);
      console.log('   Permisos:');
      Object.entries(teacher.permissions).forEach(([perm, value]) => {
        console.log(`     ${perm}: ${value ? '✅' : '❌'}`);
      });
      
      // Determinar nivel de acceso
      const permissions = teacher.permissions;
      let accessLevel = 'Solo lectura';
      if (permissions.canManageTeachers && permissions.canManageSchedule) {
        accessLevel = 'Administrador';
      } else if (permissions.canEditClass || permissions.canManageStudents) {
        accessLevel = 'Editor';
      }
      console.log(`   Nivel de acceso: ${accessLevel}`);
    }
  });
  
  return {
    classes: testClassesWithPermissions,
    teachers: testTeachers
  };
};

// Función para cargar datos con permisos en la aplicación
window.loadPermissionsTestData = () => {
  console.log('📥 Cargando datos de prueba con permisos...');
  
  try {
    const classes = JSON.parse(localStorage.getItem('permissions-test-classes') || '[]');
    const teachers = JSON.parse(localStorage.getItem('permissions-test-teachers') || '[]');
    
    if (classes.length === 0) {
      console.log('⚠️  No hay datos de prueba. Ejecuta testPermissionsSystem() primero');
      return;
    }
    
    // Intentar inyectar en el store de Vue
    const vueApp = document.querySelector('#app')?.__vue_app__;
    if (vueApp && vueApp.config.globalProperties.$pinia) {
      const stores = Object.values(vueApp.config.globalProperties.$pinia._s);
      
      // Inyectar clases
      const classesStore = stores.find(store => 
        store.$id === 'classes' || store.classes !== undefined
      );
      
      if (classesStore) {
        console.log('📦 Inyectando clases con permisos...');
        if (classesStore.$patch) {
          classesStore.$patch({ classes });
        } else {
          classesStore.classes = classes;
        }
        console.log('✅ Clases inyectadas');
      }
      
      // Inyectar maestros
      const teachersStore = stores.find(store => 
        store.$id === 'teachers' || store.teachers !== undefined
      );
      
      if (teachersStore) {
        console.log('👨‍🏫 Inyectando maestros...');
        if (teachersStore.$patch) {
          teachersStore.$patch({ teachers });
        } else {
          teachersStore.teachers = teachers;
        }
        console.log('✅ Maestros inyectados');
      }
      
    } else {
      console.log('⚠️  Usando localStorage como fallback');
      localStorage.setItem('classes-data', JSON.stringify(classes));
      localStorage.setItem('teachers-data', JSON.stringify(teachers));
    }
    
    console.log(`✅ ${classes.length} clases y ${teachers.length} maestros cargados`);
    console.log('🔄 Recarga la página para ver los cambios si es necesario');
    
    return { classes, teachers };
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
  }
};

// Función para probar la funcionalidad de permisos en UI
window.testPermissionsUI = () => {
  console.log('🎨 === PRUEBA DE UI DE PERMISOS ===');
  
  // Buscar tab de clases compartidas
  const sharedTab = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Compartidas')
  );
  
  if (!sharedTab) {
    console.log('❌ Tab de clases compartidas no encontrado');
    return;
  }
  
  console.log('✅ Tab de clases compartidas encontrado');
  sharedTab.click();
  
  setTimeout(() => {
    // Buscar tarjetas de clases compartidas
    const sharedClassCards = document.querySelectorAll('.shared-class-item, [data-testid="shared-class-item"]');
    console.log(`📋 ${sharedClassCards.length} tarjetas de clases compartidas encontradas`);
    
    // Buscar botones de editar permisos
    const editPermissionButtons = document.querySelectorAll('button[title="Editar permisos"]');
    console.log(`🔧 ${editPermissionButtons.length} botones de editar permisos encontrados`);
    
    if (editPermissionButtons.length > 0) {
      console.log('🖱️  Probando click en primer botón de editar permisos...');
      editPermissionButtons[0].click();
      
      setTimeout(() => {
        const permissionsDialog = document.querySelector('.fixed.inset-0');
        if (permissionsDialog) {
          console.log('✅ Diálogo de permisos abierto correctamente');
          
          // Buscar elementos del formulario
          const radioButtons = permissionsDialog.querySelectorAll('input[type="radio"]');
          const checkboxes = permissionsDialog.querySelectorAll('input[type="checkbox"]');
          
          console.log(`📻 ${radioButtons.length} opciones de nivel de acceso`);
          console.log(`☑️  ${checkboxes.length} checkboxes de permisos específicos`);
          
          if (radioButtons.length > 0) {
            console.log('🎯 Elementos del diálogo encontrados correctamente');
          }
        } else {
          console.log('❌ Diálogo de permisos no se abrió');
        }
      }, 500);
    }
  }, 1000);
};

// Función para simular actualización de permisos
window.simulatePermissionUpdate = (classId = 'test-permissions-class-1', teacherId = 'assistant-limited-456') => {
  console.log('🔄 === SIMULANDO ACTUALIZACIÓN DE PERMISOS ===');
  console.log(`Clase: ${classId}`);
  console.log(`Maestro: ${teacherId}`);
  
  const newPermissions = [
    'write',
    'canTakeAttendance',
    'canAddObservations',
    'canViewAttendanceHistory',
    'canEditClass',
    'canManageStudents'
  ];
  
  const updateData = {
    classId,
    teacherId,
    permissions: newPermissions
  };
  
  console.log('📝 Nuevos permisos:', newPermissions);
  console.log('💾 Datos de actualización:', updateData);
  console.log('✅ Simulación completada');
  
  return updateData;
};

console.log('🔐 Scripts de prueba de permisos cargados:');
console.log('- testPermissionsSystem() - Crear datos de prueba con permisos');
console.log('- loadPermissionsTestData() - Cargar datos en la aplicación');
console.log('- testPermissionsUI() - Probar interfaz de permisos');
console.log('- simulatePermissionUpdate() - Simular actualización de permisos');
