// Script de prueba para verificar RBAC
import {
  UserRole,
  ResourceType,
  PermissionAction,
  hasPermission,
} from "../src/modulos/Auth/types/permissions"

console.log("🧪 Iniciando pruebas de RBAC...\n")

// Prueba 1: Verificar permisos del Maestro para asistencia
console.log("📝 Prueba 1: Permisos de Maestro para asistencia")
const maestroCanReadAttendance = hasPermission(
  UserRole.MAESTRO,
  ResourceType.DAILY_ATTENDANCE,
  PermissionAction.READ,
  "class"
)
const maestroCanCreateAttendance = hasPermission(
  UserRole.MAESTRO,
  ResourceType.DAILY_ATTENDANCE,
  PermissionAction.CREATE,
  "class"
)
const maestroCanViewStudents = hasPermission(
  UserRole.MAESTRO,
  ResourceType.CLASS_STUDENTS,
  PermissionAction.READ,
  "class"
)

console.log(`  ✓ Maestro puede leer asistencia: ${maestroCanReadAttendance ? "✅" : "❌"}`)
console.log(`  ✓ Maestro puede crear asistencia: ${maestroCanCreateAttendance ? "✅" : "❌"}`)
console.log(`  ✓ Maestro puede ver estudiantes: ${maestroCanViewStudents ? "✅" : "❌"}`)

// Prueba 2: Verificar permisos del Director
console.log("\n📝 Prueba 2: Permisos de Director")
const directorCanReadAttendance = hasPermission(
  UserRole.DIRECTOR,
  ResourceType.DAILY_ATTENDANCE,
  PermissionAction.READ,
  "all"
)
const directorCanDeleteAttendance = hasPermission(
  UserRole.DIRECTOR,
  ResourceType.DAILY_ATTENDANCE,
  PermissionAction.DELETE,
  "all"
)
const directorCanManageClasses = hasPermission(
  UserRole.DIRECTOR,
  ResourceType.MANAGE_CLASSES,
  PermissionAction.CREATE
)

console.log(`  ✓ Director puede leer asistencia: ${directorCanReadAttendance ? "✅" : "❌"}`)
console.log(`  ✓ Director puede eliminar asistencia: ${directorCanDeleteAttendance ? "✅" : "❌"}`)
console.log(`  ✓ Director puede gestionar clases: ${directorCanManageClasses ? "✅" : "❌"}`)

// Prueba 3: Verificar restricciones
console.log("\n📝 Prueba 3: Verificar restricciones")
const maestroCannotDeleteAttendance = !hasPermission(
  UserRole.MAESTRO,
  ResourceType.DAILY_ATTENDANCE,
  PermissionAction.DELETE
)
const maestroCannotManageSystem = !hasPermission(
  UserRole.MAESTRO,
  ResourceType.SYSTEM_CONFIGURATION,
  PermissionAction.READ
)

console.log(
  `  ✓ Maestro NO puede eliminar asistencia: ${maestroCannotDeleteAttendance ? "✅" : "❌"}`
)
console.log(`  ✓ Maestro NO puede configurar sistema: ${maestroCannotManageSystem ? "✅" : "❌"}`)

console.log("\n🎉 Pruebas de RBAC completadas!")
