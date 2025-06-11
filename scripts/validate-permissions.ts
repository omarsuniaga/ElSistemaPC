/**
 * Script de Validación del Sistema de Permisos
 * 
 * Este script valida que el sistema de permisos esté correctamente configurado
 * y funcionando según la documentación de roles y permisos.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { UserRole } from '../src/modulos/Auth/types/permissions'
import { PermissionsService } from '../src/modulos/Auth/services/permissionsService'

// ========== TESTS DE VALIDACIÓN ==========

/**
 * Valida que todos los roles tengan su configuración
 */
async function validateRolesConfiguration() {
  console.log('🔍 Validando configuración de roles...')
  
  try {
    for (const role of Object.values(UserRole)) {
      console.log(`  Validando rol: ${role}`)
      
      // Verificar permisos del rol
      const permissions = await PermissionsService.getRolePermissions(role)
      if (!permissions) {
        throw new Error(`No se encontraron permisos para el rol: ${role}`)
      }
      
      // Verificar configuración de reportes
      const reports = await PermissionsService.getRoleReportsConfig(role)
      if (!reports) {
        throw new Error(`No se encontró configuración de reportes para: ${role}`)
      }
      
      // Verificar configuración de módulos
      const modules = await PermissionsService.getRoleModulesConfig(role)
      if (!modules) {
        throw new Error(`No se encontró configuración de módulos para: ${role}`)
      }
      
      console.log(`  ✅ ${role}: Configuración completa`)
    }
    
    console.log('✅ Configuración de roles: VÁLIDA')
    
  } catch (error) {
    console.error('❌ Error en configuración de roles:', error)
    throw error
  }
}

/**
 * Valida permisos específicos según la documentación
 */
async function validateSpecificPermissions() {
  console.log('🔍 Validando permisos específicos según documentación...')
  
  try {
    // ========== VALIDAR PERMISOS DE MAESTRO ==========
    console.log('  Validando permisos de Maestro...')
    
    const maestroPermissions = await PermissionsService.getRolePermissions(UserRole.MAESTRO)
    
    // Permisos que DEBE tener
    const maestroMustHave = [
      'puedeVerPerfilAlumno',
      'puedeEditarMontaje',
      'puedeRegistrarAsistencia',
      'puedeEditarAsistencia',
      'puedeCrearObservaciones',
      'puedeEditarObservaciones',
      'puedeEvaluarAlumnos'
    ]
    
    for (const permission of maestroMustHave) {
      if (!maestroPermissions[permission]) {
        throw new Error(`Maestro debe tener permiso: ${permission}`)
      }
    }
    
    // Permisos que NO debe tener
    const maestroMustNotHave = [
      'puedeGenerarReportes',
      'puedeVerInfoConfidencialAlumno',
      'puedeEvaluarMaestros',
      'puedeAsignarClases'
    ]
    
    for (const permission of maestroMustNotHave) {
      if (maestroPermissions[permission] === true) {
        throw new Error(`Maestro NO debe tener permiso: ${permission}`)
      }
    }
    
    // Verificar alcance
    if (maestroPermissions.alcance !== 'clase') {
      throw new Error(`Maestro debe tener alcance 'clase', encontrado: ${maestroPermissions.alcance}`)
    }
    
    console.log('  ✅ Permisos de Maestro: VÁLIDOS')
    
    // ========== VALIDAR PERMISOS DE DIRECTOR ==========
    console.log('  Validando permisos de Director...')
    
    const directorPermissions = await PermissionsService.getRolePermissions(UserRole.DIRECTOR)
    
    // Permisos que DEBE tener
    const directorMustHave = [
      'puedeGenerarReportes',
      'puedeVerInfoConfidencialAlumno',
      'puedeEditarObras',
      'puedeEvaluarMaestros',
      'puedeAsignarClases',
      'puedeCrearColaboradoresTemporales',
      'puedeSupervisionGlobal'
    ]
    
    for (const permission of directorMustHave) {
      if (!directorPermissions[permission]) {
        throw new Error(`Director debe tener permiso: ${permission}`)
      }
    }
    
    // Verificar alcance
    if (directorPermissions.alcance !== 'global') {
      throw new Error(`Director debe tener alcance 'global', encontrado: ${directorPermissions.alcance}`)
    }
    
    console.log('  ✅ Permisos de Director: VÁLIDOS')
    
    console.log('✅ Permisos específicos: VÁLIDOS')
    
  } catch (error) {
    console.error('❌ Error en permisos específicos:', error)
    throw error
  }
}

/**
 * Valida configuración de reportes según documentación
 */
async function validateReportsConfiguration() {
  console.log('🔍 Validando configuración de reportes...')
  
  try {
    // ========== REPORTES DE MAESTRO ==========
    const maestroReports = await PermissionsService.getRoleReportsConfig(UserRole.MAESTRO)
    
    if (maestroReports.alcanceReportes !== 'clase') {
      throw new Error(`Maestro debe tener alcance de reportes 'clase'`)
    }
    
    // ========== REPORTES DE DIRECTOR ==========
    const directorReports = await PermissionsService.getRoleReportsConfig(UserRole.DIRECTOR)
    
    if (directorReports.alcanceReportes !== 'global') {
      throw new Error(`Director debe tener alcance de reportes 'global'`)
    }
    
    // Verificar que Director tenga todos los tipos de reportes documentados
    const requiredDirectorReports = [
      'asistencia_diaria',
      'asistencia_mensual',
      'progreso_por_alumno',
      'listados_por_clase',
      'horarios_por_alumno',
      'obras_trabajadas',
      'analisis_desempeno_general'
    ]
    
    for (const report of requiredDirectorReports) {
      if (!directorReports.reportesDisponibles.includes(report)) {
        console.warn(`⚠️  Director podría incluir reporte: ${report}`)
      }
    }
    
    console.log('✅ Configuración de reportes: VÁLIDA')
    
  } catch (error) {
    console.error('❌ Error en configuración de reportes:', error)
    throw error
  }
}

/**
 * Valida el funcionamiento de la verificación de permisos
 */
async function validatePermissionChecking() {
  console.log('🔍 Validando funcionamiento de verificación de permisos...')
  
  try {
    // Simular usuarios de prueba
    const testUsers = [
      { id: 'maestro_test', role: UserRole.MAESTRO },
      { id: 'director_test', role: UserRole.DIRECTOR }
    ]
    
    for (const user of testUsers) {
      console.log(`  Probando usuario: ${user.id} (${user.role})`)
      
      // Probar verificación básica
      const canGenerateReports = await PermissionsService.checkUserPermission(
        user.id,
        user.role,
        'puedeGenerarReportes'
      )
      
      if (user.role === UserRole.MAESTRO && canGenerateReports) {
        throw new Error(`Maestro no debería poder generar reportes`)
      }
      
      if (user.role === UserRole.DIRECTOR && !canGenerateReports) {
        throw new Error(`Director debería poder generar reportes`)
      }
      
      // Probar permisos efectivos
      const effectivePermissions = await PermissionsService.getUserEffectivePermissions(
        user.id,
        user.role
      )
      
      if (!effectivePermissions._metadata) {
        throw new Error(`Permisos efectivos deben incluir metadatos`)
      }
      
      console.log(`  ✅ ${user.id}: Verificación funcional`)
    }
    
    console.log('✅ Verificación de permisos: FUNCIONAL')
    
  } catch (error) {
    console.error('❌ Error en verificación de permisos:', error)
    throw error
  }
}

/**
 * Genera reporte de validación completo
 */
async function generateValidationReport() {
  console.log('📊 Generando reporte de validación...')
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      roles: {},
      systemConfig: {},
      summary: {
        rolesValidated: 0,
        permissionsChecked: 0,
        reportsValidated: 0,
        issuesFound: 0
      }
    }
    
    // Recopilar información de cada rol
    for (const role of Object.values(UserRole)) {
      const roleConfig = await PermissionsService.getFullRoleConfiguration(role)
      report.roles[role] = {
        permissions: Object.keys(roleConfig.permissions).length,
        reports: roleConfig.reports?.reportesDisponibles?.length || 0,
        modules: roleConfig.modules?.modulosPermitidos?.length || 0,
        scope: roleConfig.permissions.alcance
      }
      report.summary.rolesValidated++
    }
    
    // Configuración del sistema
    const systemConfig = await PermissionsService.getSystemPermissionsConfig()
    report.systemConfig = systemConfig
    
    console.log('')
    console.log('📋 REPORTE DE VALIDACIÓN')
    console.log('========================')
    console.log(`🕐 Timestamp: ${report.timestamp}`)
    console.log(`✅ Estado: ${report.status}`)
    console.log(`👥 Roles validados: ${report.summary.rolesValidated}`)
    console.log('')
    
    for (const [role, config] of Object.entries(report.roles)) {
      console.log(`🔹 ${role}:`)
      console.log(`   • Permisos: ${config.permissions}`)
      console.log(`   • Reportes: ${config.reports}`)
      console.log(`   • Módulos: ${config.modules}`)
      console.log(`   • Alcance: ${config.scope}`)
    }
    
    console.log('')
    console.log('🎉 ¡Sistema de permisos completamente validado!')
    
    return report
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error)
    throw error
  }
}

/**
 * Función principal de validación
 */
async function validatePermissionsSystem() {
  try {
    console.log('🚀 Iniciando validación del sistema de permisos...')
    console.log('')
    
    await validateRolesConfiguration()
    console.log('')
    
    await validateSpecificPermissions()
    console.log('')
    
    await validateReportsConfiguration()
    console.log('')
    
    await validatePermissionChecking()
    console.log('')
    
    const report = await generateValidationReport()
    
    console.log('')
    console.log('✨ ¡Validación completada exitosamente!')
    console.log('📝 El sistema de permisos está funcionando correctamente según la documentación.')
    
    return report
    
  } catch (error) {
    console.error('')
    console.error('💥 ¡Error en la validación del sistema!')
    console.error('🔧 Verifica la configuración y ejecuta el script de setup si es necesario.')
    console.error('')
    console.error('Error:', error.message)
    throw error
  }
}

// ========== EJECUCIÓN ==========
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePermissionsSystem()
    .then(() => {
      console.log('')
      console.log('🎯 Próximos pasos:')
      console.log('   1. Integrar PermissionGuard en componentes existentes')
      console.log('   2. Actualizar stores para usar usePermissions()')
      console.log('   3. Migrar lógica de permisos existente al nuevo sistema')
      console.log('   4. Probar flujos completos en el navegador')
      process.exit(0)
    })
    .catch((error) => {
      process.exit(1)
    })
}

export { validatePermissionsSystem }
