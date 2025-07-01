import {optimizedAttendanceQueries} from "../services/optimizedQueries"
import {format, subDays} from "date-fns"

/**
 * Script de prueba para las consultas optimizadas
 */
async function testOptimizedQueries() {
  console.log("🧪 Iniciando pruebas de consultas optimizadas...")

  try {
    // Rango de fechas de prueba: últimos 30 días
    const endDate = format(new Date(), "yyyy-MM-dd")
    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd")

    console.log(`📅 Consultando asistencias del ${startDate} al ${endDate}`)

    // Probar consulta paginada
    const result = await optimizedAttendanceQueries.getAttendanceDocumentsPaginated(
      startDate,
      endDate,
      10
    )

    console.log("✅ Consulta paginada exitosa:", {
      documentsCount: result.documents.length,
      hasMore: result.hasMore,
      sampleDocument: result.documents[0]
        ? {
            id: result.documents[0].id,
            fecha: result.documents[0].fecha,
            classId: result.documents[0].classId,
            presentesCount: result.documents[0].data.presentes?.length || 0,
            ausentesCount: result.documents[0].data.ausentes?.length || 0,
          }
        : null,
    })

    // Probar estadísticas
    const stats = await optimizedAttendanceQueries.getAttendanceStatsCached(startDate, endDate)

    console.log("📊 Estadísticas obtenidas:", {
      totalRecords: stats.totalRecords,
      attendanceRate: stats.attendanceRate,
      byStatus: stats.byStatus,
    })

    // Probar top ausentes
    const topAbsentees = await optimizedAttendanceQueries.getTopAbsentStudentsByRange(
      startDate,
      endDate,
      5
    )

    console.log("🔝 Top estudiantes ausentes:", topAbsentees)

    console.log("🎉 Todas las pruebas completadas exitosamente!")
  } catch (error) {
    console.error("❌ Error en las pruebas:", error)
  }
}

// Exportar para uso en consola
if (typeof window !== "undefined") {
  ;(window as any).testOptimizedQueries = testOptimizedQueries
}

export {testOptimizedQueries}
