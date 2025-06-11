// Script para inicializar datos RBAC en Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuración de Firebase (asegúrate de usar tu configuración)
const firebaseConfig = {
  // Agrega tu configuración de Firebase aquí
  // No incluimos las credenciales por seguridad
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Permisos predefinidos para el sistema
const defaultPermissions = [
  // Permisos de Asistencia
  { name: 'Ver Asistencia', description: 'Puede ver registros de asistencia', module: 'attendance', action: 'read', resource: 'attendance_records' },
  { name: 'Crear Asistencia', description: 'Puede crear nuevos registros de asistencia', module: 'attendance', action: 'create', resource: 'attendance_records' },
  { name: 'Editar Asistencia', description: 'Puede modificar registros de asistencia', module: 'attendance', action: 'update', resource: 'attendance_records' },
  { name: 'Eliminar Asistencia', description: 'Puede eliminar registros de asistencia', module: 'attendance', action: 'delete', resource: 'attendance_records' },
  { name: 'Calendario Asistencia', description: 'Puede acceder al calendario de asistencia', module: 'attendance', action: 'read', resource: 'attendance_calendar' },
  
  // Permisos de Clases
  { name: 'Ver Clases', description: 'Puede ver información de clases', module: 'classes', action: 'read', resource: 'classes' },
  { name: 'Gestionar Clases', description: 'Puede crear y modificar clases', module: 'classes', action: 'write', resource: 'classes' },
  
  // Permisos de Estudiantes
  { name: 'Ver Estudiantes', description: 'Puede ver información de estudiantes', module: 'students', action: 'read', resource: 'students' },
  { name: 'Gestionar Estudiantes', description: 'Puede crear y modificar estudiantes', module: 'students', action: 'write', resource: 'students' },
  
  // Permisos de Maestros
  { name: 'Ver Maestros', description: 'Puede ver información de maestros', module: 'teachers', action: 'read', resource: 'teachers' },
  { name: 'Gestionar Maestros', description: 'Puede crear y modificar maestros', module: 'teachers', action: 'write', resource: 'teachers' },
  
  // Permisos de Dashboard
  { name: 'Dashboard Maestro', description: 'Acceso al dashboard de maestro', module: 'dashboard', action: 'read', resource: 'teacher_dashboard' },
  { name: 'Dashboard Admin', description: 'Acceso al dashboard administrativo', module: 'dashboard', action: 'read', resource: 'admin_dashboard' },
  
  // Permisos de Sistema
  { name: 'Gestión RBAC', description: 'Puede gestionar roles y permisos', module: 'system', action: 'admin', resource: 'rbac' },
  { name: 'Configuración Sistema', description: 'Puede configurar el sistema', module: 'system', action: 'admin', resource: 'configuration' }
];

// Roles predefinidos
const defaultRoles = [
  {
    name: 'Maestro',
    description: 'Profesor con acceso a módulos de enseñanza',
    permissions: [
      'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Calendario Asistencia',
      'Ver Clases', 'Ver Estudiantes', 'Dashboard Maestro'
    ],
    isActive: true
  },
  {
    name: 'Director',
    description: 'Administrador general con acceso académico',
    permissions: [
      'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Eliminar Asistencia', 'Calendario Asistencia',
      'Ver Clases', 'Gestionar Clases',
      'Ver Estudiantes', 'Gestionar Estudiantes',
      'Ver Maestros', 'Gestionar Maestros',
      'Dashboard Admin'
    ],
    isActive: true
  },
  {
    name: 'Admin',
    description: 'Administrador con permisos limitados',
    permissions: [
      'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Calendario Asistencia',
      'Ver Clases', 'Gestionar Clases',
      'Ver Estudiantes', 'Gestionar Estudiantes',
      'Dashboard Admin'
    ],
    isActive: true
  },
  {
    name: 'Superusuario',
    description: 'Super administrador con acceso completo',
    permissions: [
      'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Eliminar Asistencia', 'Calendario Asistencia',
      'Ver Clases', 'Gestionar Clases',
      'Ver Estudiantes', 'Gestionar Estudiantes',
      'Ver Maestros', 'Gestionar Maestros',
      'Dashboard Admin', 'Gestión RBAC', 'Configuración Sistema'
    ],
    isActive: true
  }
];

async function initializeRBAC() {
  try {
    console.log('Iniciando inicialización de RBAC...');
    
    // Crear permisos por defecto si no existen
    const permissionsSnapshot = await getDocs(collection(db, 'rbac_permissions'));
    if (permissionsSnapshot.empty) {
      console.log('Creando permisos por defecto...');
      for (const permission of defaultPermissions) {
        await addDoc(collection(db, 'rbac_permissions'), {
          ...permission,
          createdAt: serverTimestamp()
        });
        console.log(`✓ Permiso creado: ${permission.name}`);
      }
    } else {
      console.log('Los permisos ya existen en la base de datos.');
    }

    // Crear roles por defecto si no existen
    const rolesSnapshot = await getDocs(collection(db, 'rbac_roles'));
    if (rolesSnapshot.empty) {
      console.log('Creando roles por defecto...');
      for (const role of defaultRoles) {
        await addDoc(collection(db, 'rbac_roles'), {
          ...role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✓ Rol creado: ${role.name}`);
      }
    } else {
      console.log('Los roles ya existen en la base de datos.');
    }

    console.log('✅ Inicialización de RBAC completada exitosamente!');
  } catch (error) {
    console.error('❌ Error al inicializar RBAC:', error);
  }
}

// Solo ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeRBAC();
}

export { initializeRBAC };
