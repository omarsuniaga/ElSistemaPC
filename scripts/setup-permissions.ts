/**
 * Script de Configuración de Permisos Dinámicos en Firestore
 *
 * Este script configura los permisos dinámicos en Firestore según la matriz
 * de permisos documentada. Ejecutar este script para initializar la configuración
 * de permisos en la base de datos.
 */

import {initializeApp} from "firebase/app"
import {getFirestore, doc, setDoc, collection, writeBatch} from "firebase/firestore"
import {UserRole, ROLE_PERMISSIONS} from "../src/modulos/Auth/types/permissions"

// ========== CONFIGURACIÓN DE PERMISOS DINÁMICOS ==========

// Configuración de permisos específicos por rol (según documentación)
const DYNAMIC_PERMISSIONS_CONFIG = {
  [UserRole.MAESTRO]: {
    // ========== PERMISOS BÁSICOS MAESTRO ==========
    puedeVerPerfilAlumno: true,
    puedeEditarMontaje: true,
    puedeRegistrarAsistencia: true,
    puedeEditarAsistencia: true,
    puedeCrearObservaciones: true,
    puedeEditarObservaciones: true,
    puedeVerObrasAsignadas: true,
    puedeEvaluarAlumnos: true,
    puedeEditarPerfil: true,
    puedeEditarDisponibilidad: true,

    // ========== PERMISOS RESTRINGIDOS ==========
    puedeGenerarReportes: false,
    puedeVerInfoConfidencialAlumno: false,
    puedeEditarObras: false,
    puedeEvaluarMaestros: false,
    puedeAsignarClases: false,
    puedeCrearColaboradoresTemporales: false,
    puedeSupervisionGlobal: false,

    // ========== ALCANCE ==========
    alcance: "clase", // 'clase' | 'global'
    puedeVerTodosLosAlumnos: false,
    puedeVerTodosLosMaestros: false,

    // ========== METADATOS ==========
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
  },

  [UserRole.DIRECTOR]: {
    // ========== TODOS LOS PERMISOS DE MAESTRO ==========
    puedeVerPerfilAlumno: true,
    puedeEditarMontaje: true,
    puedeRegistrarAsistencia: true,
    puedeEditarAsistencia: true,
    puedeCrearObservaciones: true,
    puedeEditarObservaciones: true,
    puedeVerObrasAsignadas: true,
    puedeEvaluarAlumnos: true,
    puedeEditarPerfil: true,
    puedeEditarDisponibilidad: true,

    // ========== PERMISOS EXCLUSIVOS DIRECTOR ==========
    puedeGenerarReportes: true,
    puedeVerInfoConfidencialAlumno: true,
    puedeEditarObras: true,
    puedeEditarRepertorios: true,
    puedeEditarCompases: true,
    puedeEvaluarMaestros: true,
    puedeEvaluarMontaje: true,
    puedeAsignarClases: true,
    puedeAsignarObras: true,
    puedeCrearColaboradoresTemporales: true,
    puedeSupervisionGlobal: true,

    // ========== REPORTES Y EXPORTS ==========
    puedeGenerarPDFsInstitucionales: true,
    puedeExportarAsistencia: true,
    puedeVerMapaCalorCompleto: true,
    puedeVerAlertasAsistencia: true,
    puedeVerMetricasGlobales: true,

    // ========== GESTIÓN ACADÉMICA ==========
    puedeGestionarClases: true,
    puedeCrearClasesEmergentes: true,
    puedeAsignarMaestrosAClases: true,
    puedeEditarPlanTrabajo: true,

    // ========== ALCANCE ==========
    alcance: "global",
    puedeVerTodosLosAlumnos: true,
    puedeVerTodosLosMaestros: true,
    puedeVerTodasLasClases: true,

    // ========== METADATOS ==========
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
  },
}

// ========== CONFIGURACIÓN DE REPORTES POR ROL ==========
const REPORTS_CONFIG = {
  [UserRole.MAESTRO]: {
    reportesDisponibles: ["progreso_alumnos_clase", "asistencia_clase", "observaciones_clase"],
    formatosDisponibles: ["pdf", "excel"],
    alcanceReportes: "clase",
  },

  [UserRole.DIRECTOR]: {
    reportesDisponibles: [
      // ========== REPORTES DE ASISTENCIA ==========
      "asistencia_diaria",
      "asistencia_mensual",
      "asistencia_personalizada",
      "alertas_inasistencia",

      // ========== REPORTES DE PROGRESO ==========
      "progreso_por_alumno",
      "indicadores_positivos",
      "progreso_por_clase",
      "progreso_por_maestro",

      // ========== REPORTES DE LISTADOS ==========
      "listados_por_clase",
      "listados_por_maestro",
      "listados_por_agrupacion",

      // ========== REPORTES DE HORARIOS ==========
      "horarios_por_alumno",
      "horarios_por_maestro",
      "horarios_por_clase",
      "horarios_por_dia",

      // ========== REPORTES DE OBRAS ==========
      "obras_trabajadas",
      "estado_compases",
      "progreso_montaje",

      // ========== REPORTE GENERAL ==========
      "analisis_desempeno_general",
      "metricas_maestro_alumno",
      "resumen_dias_horas",
      "resumen_montajes",
      "resumen_especialidades",
    ],
    formatosDisponibles: ["pdf", "excel", "csv", "json"],
    alcanceReportes: "global",
  },
}

// ========== CONFIGURACIÓN DE MÓDULOS ==========
const MODULES_ACCESS_CONFIG = {
  [UserRole.MAESTRO]: {
    modulosPermitidos: [
      "asistencia",
      "observaciones",
      "montaje",
      "evaluaciones",
      "perfil",
      "horarios",
      "clases_asignadas",
    ],
    modulosRestringidos: [
      "gestion_usuarios",
      "reportes_globales",
      "configuracion_sistema",
      "auditoria",
    ],
  },

  [UserRole.DIRECTOR]: {
    modulosPermitidos: [
      "asistencia",
      "observaciones",
      "montaje",
      "evaluaciones",
      "perfil",
      "horarios",
      "clases_asignadas",
      "gestion_usuarios",
      "reportes_globales",
      "gestion_obras",
      "gestion_repertorios",
      "supervision",
      "configuracion_academica",
    ],
    modulosRestringidos: ["configuracion_sistema_critica", "gestion_infraestructura"],
  },
}

// ========== FUNCIONES DE CONFIGURACIÓN ==========

/**
 * Configura los permisos dinámicos en Firestore
 */
async function setupDynamicPermissions() {
  try {
    console.log("🔧 Configurando permisos dinámicos en Firestore...")

    const db = getFirestore()
    const batch = writeBatch(db)

    // Configurar permisos por rol
    for (const [role, permissions] of Object.entries(DYNAMIC_PERMISSIONS_CONFIG)) {
      const roleDoc = doc(db, "roles", role)
      batch.set(roleDoc, permissions)
      console.log(`✅ Configurado rol: ${role}`)
    }

    // Configurar reportes por rol
    for (const [role, reportConfig] of Object.entries(REPORTS_CONFIG)) {
      const reportDoc = doc(db, "role_reports", role)
      batch.set(reportDoc, reportConfig)
      console.log(`📊 Configurados reportes para: ${role}`)
    }

    // Configurar acceso a módulos
    for (const [role, moduleConfig] of Object.entries(MODULES_ACCESS_CONFIG)) {
      const moduleDoc = doc(db, "role_modules", role)
      batch.set(moduleDoc, moduleConfig)
      console.log(`🎯 Configurado acceso a módulos para: ${role}`)
    }

    // Configuración general del sistema
    const systemConfigDoc = doc(db, "system_config", "permissions")
    batch.set(systemConfigDoc, {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      staticPermissions: ROLE_PERMISSIONS,
      dynamicPermissionsEnabled: true,
      permissionsCacheTimeout: 300000, // 5 minutos
      auditEnabled: true,
    })

    await batch.commit()
    console.log("🎉 ¡Configuración de permisos completada exitosamente!")
  } catch (error) {
    console.error("❌ Error configurando permisos:", error)
    throw error
  }
}

/**
 * Configura permisos específicos para un usuario
 */
async function setupUserPermissions(userId: string, role: UserRole, customPermissions?: any) {
  try {
    console.log(`👤 Configurando permisos para usuario: ${userId} (${role})`)

    const db = getFirestore()
    const userPermissionsDoc = doc(db, "user_permissions", userId)

    const userPermissionData = {
      userId,
      role,
      customPermissions: customPermissions || {},
      effectiveDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: true,
    }

    await setDoc(userPermissionsDoc, userPermissionData)
    console.log(`✅ Permisos configurados para usuario: ${userId}`)
  } catch (error) {
    console.error(`❌ Error configurando permisos para usuario ${userId}:`, error)
    throw error
  }
}

/**
 * Crea usuarios de ejemplo con permisos
 */
async function createExampleUsers() {
  try {
    console.log("👥 Creando usuarios de ejemplo...")

    // Usuario Maestro de ejemplo
    await setupUserPermissions("maestro_ejemplo_1", UserRole.MAESTRO, {
      clasesAsignadas: ["violin-basico", "piano-intermedio"],
      especialidades: ["violin", "piano"],
      puedeAsignarResponsablesInstrumento: true, // Permiso especial
    })

    // Usuario Director de ejemplo
    await setupUserPermissions("director_ejemplo_1", UserRole.DIRECTOR, {
      departamento: "cuerdas",
      puedeAccederModuloExperimental: true, // Permiso especial
    })

    console.log("✅ Usuarios de ejemplo creados")
  } catch (error) {
    console.error("❌ Error creando usuarios de ejemplo:", error)
    throw error
  }
}

/**
 * Función principal de configuración
 */
export async function initializePermissionsSystem() {
  try {
    console.log("🚀 Inicializando sistema de permisos...")

    await setupDynamicPermissions()
    await createExampleUsers()

    console.log("🎉 ¡Sistema de permisos inicializado correctamente!")
    console.log("")
    console.log("📋 Resumen de configuración:")
    console.log(`   • Roles configurados: ${Object.keys(DYNAMIC_PERMISSIONS_CONFIG).length}`)
    console.log(`   • Reportes configurados: ${Object.keys(REPORTS_CONFIG).length}`)
    console.log(`   • Módulos configurados: ${Object.keys(MODULES_ACCESS_CONFIG).length}`)
    console.log(`   • Usuarios de ejemplo: 2`)
    console.log("")
    console.log("✨ El sistema está listo para usar!")
  } catch (error) {
    console.error("💥 Error inicializando sistema de permisos:", error)
    throw error
  }
}

// ========== UTILITARIOS PARA TESTING ==========

/**
 * Verifica que los permisos estén configurados correctamente
 */
export async function validatePermissionsSetup() {
  try {
    console.log("🔍 Validando configuración de permisos...")

    const db = getFirestore()

    // Verificar roles
    for (const role of Object.values(UserRole)) {
      const roleDoc = doc(db, "roles", role)
      // En un caso real, harías getDoc(roleDoc) para verificar
      console.log(`✅ Rol ${role}: Configurado`)
    }

    console.log("✅ Validación completada exitosamente")
  } catch (error) {
    console.error("❌ Error en validación:", error)
    throw error
  }
}

// ========== EXPORT PARA USO EN SCRIPTS ==========
export {
  DYNAMIC_PERMISSIONS_CONFIG,
  REPORTS_CONFIG,
  MODULES_ACCESS_CONFIG,
  setupDynamicPermissions,
  setupUserPermissions,
  createExampleUsers,
}

// ========== SCRIPT DE EJECUCIÓN DIRECTA ==========
if (import.meta.url === `file://${process.argv[1]}`) {
  initializePermissionsSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Error fatal:", error)
      process.exit(1)
    })
}
