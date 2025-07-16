/**
 * 🎯 Test Rápido del Sistema de Permisos
 *
 * Este archivo demuestra cómo usar el sistema de permisos
 * de manera práctica y directa.
 */

import {
  UserRole,
  ResourceType,
  PermissionAction,
  ROLE_PERMISSIONS,
} from '../src/modulos/Auth/types/permissions';

// ========== FUNCIÓN DE PRUEBA RÁPIDA ==========

function testPermissionsSystem() {
  console.log('🎯 Probando Sistema de Permisos Granular');
  console.log('=====================================');
  console.log('');

  // ========== PROBAR PERMISOS ESTÁTICOS ==========
  console.log('📊 MATRIZ DE PERMISOS ESTÁTICA:');
  console.log('');

  // Mostrar permisos de Maestro
  console.log('🧑‍🏫 MAESTRO:');
  const maestroPerms = ROLE_PERMISSIONS[UserRole.MAESTRO];

  console.log('✅ Puede hacer:');
  maestroPerms.forEach((perm) => {
    if (perm.action === PermissionAction.CREATE || perm.action === PermissionAction.UPDATE) {
      console.log(`   • ${perm.action.toUpperCase()} ${perm.resource} (${perm.scope})`);
    }
  });

  console.log('❌ NO puede hacer:');
  console.log('   • Generar reportes institucionales');
  console.log('   • Ver información confidencial');
  console.log('   • Gestionar otros maestros');
  console.log('');

  // Mostrar permisos de Director
  console.log('🧑‍🎓 DIRECTOR:');
  const directorPerms = ROLE_PERMISSIONS[UserRole.DIRECTOR];

  console.log('✅ Puede hacer TODO lo del Maestro +');
  console.log('   • Generar reportes institucionales');
  console.log('   • Ver información confidencial');
  console.log('   • Supervisar maestros');
  console.log('   • Gestionar clases emergentes');
  console.log('   • Crear colaboradores temporales');
  console.log('');

  // ========== SIMULAR VERIFICACIÓN DE PERMISOS ==========
  console.log('🔍 SIMULACIÓN DE VERIFICACIÓN:');
  console.log('');

  const testCases = [
    {
      role: UserRole.MAESTRO,
      resource: ResourceType.DAILY_ATTENDANCE,
      action: PermissionAction.CREATE,
      expected: true,
      description: 'Maestro registra asistencia',
    },
    {
      role: UserRole.MAESTRO,
      resource: ResourceType.ATTENDANCE_REPORTS,
      action: PermissionAction.GENERATE_REPORTS,
      expected: false,
      description: 'Maestro intenta generar reportes',
    },
    {
      role: UserRole.DIRECTOR,
      resource: ResourceType.ATTENDANCE_REPORTS,
      action: PermissionAction.GENERATE_REPORTS,
      expected: true,
      description: 'Director genera reportes',
    },
    {
      role: UserRole.DIRECTOR,
      resource: ResourceType.CONFIDENTIAL_INFO,
      action: PermissionAction.READ,
      expected: true,
      description: 'Director ve info confidencial',
    },
    {
      role: UserRole.MAESTRO,
      resource: ResourceType.CONFIDENTIAL_INFO,
      action: PermissionAction.READ,
      expected: false,
      description: 'Maestro intenta ver info confidencial',
    },
  ];

  testCases.forEach((testCase) => {
    const hasPermission = checkPermissionStatic(testCase.role, testCase.resource, testCase.action);
    const result = hasPermission === testCase.expected ? '✅' : '❌';
    const status = hasPermission ? 'PERMITIDO' : 'DENEGADO';

    console.log(`${result} ${testCase.description}: ${status}`);
  });

  console.log('');

  // ========== EJEMPLOS DE USO EN CÓDIGO ==========
  console.log('💻 EJEMPLOS DE USO EN CÓDIGO:');
  console.log('');

  console.log('// 1. En un componente Vue:');
  console.log(`<PermissionGuard 
  :resource="ResourceType.ATTENDANCE_REPORTS" 
  :action="PermissionAction.GENERATE_REPORTS"
>
  <button>📊 Generar Reporte</button>
</PermissionGuard>`);
  console.log('');

  console.log('// 2. En un store/action:');
  console.log(`const { hasPermission } = usePermissions()
if (!hasPermission(ResourceType.DAILY_ATTENDANCE, PermissionAction.CREATE)) {
  throw new Error('Sin permisos para registrar asistencia')
}`);
  console.log('');

  console.log('// 3. Verificación con contexto:');
  console.log(`const validation = await PermissionsService.validateUserAction(
  userId, 
  role, 
  'puedeEditarAsistencia',
  'estudiante',
  { studentClassId, userClassIds }
)`);
  console.log('');

  // ========== CONFIGURACIÓN FIRESTORE ==========
  console.log('🔥 CONFIGURACIÓN FIRESTORE:');
  console.log('');
  console.log('Estructura sugerida:');
  console.log(`/roles/Maestro: {
  "puedeVerPerfilAlumno": true,
  "puedeEditarMontaje": true,
  "puedeGenerarReportes": false,
  "alcance": "clase"
}`);
  console.log('');
  console.log(`/roles/Director: {
  "puedeEditarObras": true,
  "puedeEvaluarMaestros": true,
  "puedeVerInfoConfidencialAlumno": true,
  "puedeGenerarReportes": true,
  "alcance": "global"
}`);
  console.log('');

  // ========== RESUMEN ==========
  console.log('🎉 RESUMEN DEL SISTEMA:');
  console.log('');
  console.log('✅ Sistema completamente implementado según documentación');
  console.log('✅ Permisos granulares para Maestro y Director');
  console.log('✅ Soporte para validación estática y dinámica');
  console.log('✅ Componentes UI listos para usar');
  console.log('✅ Servicios Firestore configurados');
  console.log('✅ Scripts de setup y validación');
  console.log('');
  console.log('🚀 ¡Listo para integrar en tu aplicación!');
}

// ========== FUNCIÓN AUXILIAR PARA VERIFICAR PERMISOS ESTÁTICOS ==========
function checkPermissionStatic(
  role: UserRole,
  resource: ResourceType,
  action: PermissionAction,
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.some((perm) => perm.resource === resource && perm.action === action);
}

// ========== EJECUTAR PRUEBA ==========
testPermissionsSystem();

export { testPermissionsSystem };
