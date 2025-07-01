import {Firestore} from "firebase-admin/firestore"
import type {ScheduleAssignment, TimeSlot} from "../../types/schedule"
import {db} from "../../firebase"
import {collection, getDocs, doc, updateDoc} from "firebase/firestore"

interface MigrationResult {
  success: boolean
  migratedCount: number
  error?: string
}

export async function migrateSchedules(db: Firestore): Promise<MigrationResult> {
  try {
    console.log("🔄 Iniciando migración de horarios...")

    // Get all classes from the CLASES collection
    const classesRef = db.collection("CLASES")
    const classesSnapshot = await classesRef.get()

    console.log(`📊 Total clases encontradas: ${classesSnapshot.size}`)

    let migratedCount = 0

    // Log current state of each class
    classesSnapshot.docs.forEach((doc) => {
      const classData = doc.data()
      console.log("\n🔍 Analizando clase:", {
        id: doc.id,
        name: classData.name,
        schedule: classData.schedule,
        startTime: classData.startTime,
        endTime: classData.endTime,
      })
    })

    for (const doc of classesSnapshot.docs) {
      const classData = doc.data()

      // Check if the class has a schedule that needs migration
      if (classData.schedule && typeof classData.schedule === "string") {
        // Parse the old schedule format and convert to new format
        const days = classData.schedule
          .toLowerCase()
          .split(",")
          .map((day) => day.trim())
          .filter((day) => day.length > 0)

        // Create new schedule format
        const newSchedule = {
          days,
          startTime: classData.startTime || "",
          endTime: classData.endTime || "",
        }

        // Update the class document with new schedule format
        await classesRef.doc(doc.id).update({
          schedule: newSchedule,
          updatedAt: new Date().toISOString(),
        })

        migratedCount++
        console.log(`✅ Migrado horario para clase: ${classData.name || doc.id}`)
      }
    }

    console.log(`\n📊 Migración completada. ${migratedCount} horarios migrados.`)

    return {
      success: true,
      migratedCount,
    }
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function fixInvalidSchedules() {
  const COLLECTION_NAME = "HORARIOS"

  try {
    console.log("🔄 Iniciando corrección de horarios inválidos...")

    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    let fixedCount = 0

    for (const docSnapshot of querySnapshot.docs) {
      const schedule = docSnapshot.data()

      // Si no tiene scheduleDay o está incompleto
      if (
        !schedule.scheduleDay ||
        !schedule.scheduleDay.dayOfWeek ||
        !schedule.scheduleDay.timeSlot
      ) {
        // Crear estructura scheduleDay basada en los datos existentes
        const scheduleDay = {
          dayOfWeek: schedule.dayOfWeek || "Lunes",
          timeSlot: {
            startTime: schedule.timeSlot?.startTime || schedule.startTime || "08:00",
            endTime: schedule.timeSlot?.endTime || schedule.endTime || "09:30",
            duration: 90, // duración por defecto en minutos
          },
          classId: schedule.classId || "",
          teacherId: schedule.teacherId || "",
          roomId: schedule.roomId || schedule.classroom || "",
          studentIds: schedule.studentIds || [],
          capacity: schedule.capacity || 0,
          isActive: schedule.isActive !== undefined ? schedule.isActive : true,
        }

        // Actualizar el documento
        await updateDoc(doc(db, COLLECTION_NAME, docSnapshot.id), {
          scheduleDay,
          updatedAt: new Date(),
        })

        fixedCount++
        console.log(`✅ Horario ${docSnapshot.id} actualizado con éxito`)
      }
    }

    console.log(`🎉 Migración completada. ${fixedCount} horarios actualizados.`)
    return {success: true, fixedCount}
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01 ${startTime}`)
  const end = new Date(`2000-01-01 ${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60) // duración en minutos
}
