<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useClassesStore} from "../../Classes/store/classes"
import {useStudentsStore} from "../../Students/store/students"

// Tipos para mejorar la seguridad y la autocompletación
interface Conflict {
  teacherId: string
  classId: number
  type: "overlap" | "capacity" | "level"
  description: string
}

interface ScheduleItem {
  id: number
  name: string
  teacherId: string
  studentIds: number[]
  schedule: string
  level: string
  teacher: string
  students: number
  hasConflict: boolean
}

// Instanciación de los stores
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()

// Estado reactivo
const conflicts = ref<Conflict[]>([])
const isOptimizing = ref(false)
const isCheckingConflicts = ref(false)

// Inicializar datos de los stores si es necesario
onMounted(async () => {
  try {
    // Carga paralela de los datos necesarios
    await Promise.all([
      !teachersStore.teachers.length && teachersStore.fetchTeachers(),
      !classesStore.classes.length && classesStore.fetchClasses(),
      !studentsStore.students.length && studentsStore.fetchStudents(),
    ])
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error)
  }
})

// Computed properties para derivar datos
const schedule = computed<ScheduleItem[]>(() => {
  const allClasses = classesStore.classes
  const allTeachers = teachersStore.teachers

  return allClasses.map((class_) => {
    interface Teacher {
      id: string
      name: string
      // Agregar otras propiedades pertinentes si es necesario
    }
    const teacher: Teacher | undefined = allTeachers.find((t: Teacher) => t.id === class_.teacherId)
    interface RawSchedule {
      days: string[]
      startTime: string
      endTime: string
    }

    interface RawClass {
      id: number | string
      name: string
      teacherId?: string
      studentIds?: Array<number | string>
      schedule: string | RawSchedule | null
      level?: string
    }

    return {
      id: Number(class_.id),
      name: class_.name,
      teacherId: class_.teacherId ?? "",
      studentIds: class_.studentIds
        ? class_.studentIds.map((id: number | string): number => Number(id))
        : [],
      schedule:
        typeof class_.schedule === "string"
          ? class_.schedule
          : class_.schedule
            ? `${(class_.schedule as RawSchedule).days.join(
                ", "
              )} ${(class_.schedule as RawSchedule).startTime}-${
                (class_.schedule as RawSchedule).endTime
              }`
            : "",
      level: class_.level ?? "",
      teacher: teacher?.name || "Sin asignar",
      students: class_.studentIds ? class_.studentIds.length : 0,
      hasConflict: conflicts.value.some(
        (c: Conflict): boolean => c.classId.toString() === class_.id.toString()
      ),
    } as ScheduleItem
  })
})

// Función para verificar si dos horarios se solapan
const doSchedulesOverlap = (schedule1: string, schedule2: string): boolean => {
  // Implementación mejorada para detectar solapamientos
  // Por ejemplo: convertir strings como "Lunes 10:00-12:00" a objetos comparables

  // Esta es una implementación básica para demostración
  const [day1, time1] = schedule1.split(" ")
  const [day2, time2] = schedule2.split(" ")

  // Si son días diferentes, no hay solapamiento
  if (day1 !== day2) return false

  // Extraer horas de inicio y fin
  const [start1, end1] = time1.split("-").map((t) => {
    const [hours, minutes] = t.split(":").map(Number)
    return hours * 60 + minutes
  })

  const [start2, end2] = time2.split("-").map((t) => {
    const [hours, minutes] = t.split(":").map(Number)
    return hours * 60 + minutes
  })

  // Verificar solapamiento
  return start1 < end2 && start2 < end1
}

// Métodos
const checkConflicts = async () => {
  isCheckingConflicts.value = true
  conflicts.value = []

  try {
    // Check for schedule overlaps
    schedule.value.forEach((class1) => {
      schedule.value.forEach((class2) => {
        if (
          class1.id !== class2.id &&
          class1.teacherId === class2.teacherId &&
          doSchedulesOverlap(class1.schedule, class2.schedule)
        ) {
          conflicts.value.push({
            teacherId: class1.teacherId.toString(),
            classId: class1.id,
            type: "overlap",
            description: `Conflicto de horario con ${class2.name}`,
          })
        }
      })
    })

    // Check classroom capacity (asumiendo un límite máximo configurable)
    const MAX_CLASSROOM_CAPACITY = 10 // Idealmente, esto vendría de la configuración
    schedule.value.forEach((class_) => {
      if (class_.students > MAX_CLASSROOM_CAPACITY) {
        conflicts.value.push({
          teacherId: class_.teacherId.toString(),
          classId: class_.id,
          type: "capacity",
          description: `Excede la capacidad máxima del aula (${MAX_CLASSROOM_CAPACITY} estudiantes)`,
        })
      }
    })

    // Check student level compatibility
    schedule.value.forEach((class_) => {
      const students = studentsStore.students.filter((s) =>
        class_.studentIds.includes(Number(s.id))
      )

      const incompatibleStudents = students.filter((s) => s.level !== class_.level)

      if (incompatibleStudents.length > 0) {
        conflicts.value.push({
          teacherId: class_.teacherId.toString(),
          classId: class_.id,
          type: "level",
          description: `${incompatibleStudents.length} estudiantes con nivel incompatible`,
        })
      }
    })
  } catch (error) {
    console.error("Error al verificar conflictos:", error)
  } finally {
    isCheckingConflicts.value = false
  }
}

const optimizeSchedule = async () => {
  isOptimizing.value = true
  try {
    // Implementación de la lógica de optimización
    // 1. Analizar disponibilidad de profesores
    // const teacherAvailability = teachersStore.teachers.map(teacher => ({
    //   id: teacher.id,
    //   name: teacher.name,
    //   availableTimes: teacher.availableTimes || []
    // }));

    // 2. Considerar preferencias de estudiantes
    // 3. Verificar disponibilidad de aulas
    // 4. Agrupar por niveles
    // 5. Minimizar conflictos

    // Simulación de tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Actualizar horarios (esto sería una llamada real a un método del store)
    // await classesStore.updateSchedules(optimizedSchedules);

    // Verificar conflictos después de optimizar
    await checkConflicts()
  } catch (error) {
    console.error("Error al optimizar horarios:", error)
  } finally {
    isOptimizing.value = false
  }
}

const suggestChanges = () => {
  // Lógica para sugerir mejoras en los horarios
  // Este método podría generar sugerencias basadas en:

  // 1. Análisis de conflictos actuales
  const conflictSuggestions = conflicts.value
    .map((conflict) => {
      const class_ = schedule.value.find((c) => c.id === conflict.classId)

      switch (conflict.type) {
        case "overlap":
          return {
            classId: conflict.classId,
            suggestion: `Cambiar el horario de "${class_?.name}" para evitar solapamientos`,
          }
        case "capacity":
          return {
            classId: conflict.classId,
            suggestion: `Dividir la clase "${class_?.name}" en dos grupos o asignar un aula más grande`,
          }
        case "level":
          return {
            classId: conflict.classId,
            suggestion: `Reasignar estudiantes de nivel incompatible en "${class_?.name}"`,
          }
        default:
          return null
      }
    })
    .filter(Boolean)

  // Aquí se implementaría la lógica para presentar estas sugerencias al usuario
  console.log("Sugerencias generadas:", conflictSuggestions)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Schedule Controls -->
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Horarios</h2>
      <div class="flex gap-3">
        <button
          class="btn bg-yellow-600 text-white hover:bg-yellow-700 flex items-center gap-2"
          :disabled="isCheckingConflicts"
          @click="checkConflicts"
        >
          <span
            v-if="isCheckingConflicts"
            class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
          />
          {{ isCheckingConflicts ? "Verificando..." : "Verificar Conflictos" }}
        </button>
        <button
          class="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          :disabled="isOptimizing"
          @click="optimizeSchedule"
        >
          <span
            v-if="isOptimizing"
            class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
          />
          {{ isOptimizing ? "Optimizando..." : "Optimizar" }}
        </button>
        <button
          class="btn bg-blue-600 text-white hover:bg-blue-700"
          :disabled="conflicts.length === 0"
          @click="suggestChanges"
        >
          Sugerir Cambios
        </button>
      </div>
    </div>

    <!-- Conflicts -->
    <div v-if="conflicts.length > 0" class="card bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
      <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
        Conflictos Detectados ({{ conflicts.length }})
      </h3>
      <div class="space-y-2">
        <div
          v-for="conflict in conflicts"
          :key="`${conflict.teacherId}-${conflict.classId}`"
          class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
        >
          <div>
            <p class="font-medium">
              {{ schedule.find((s) => s.id === conflict.classId)?.name || "Clase desconocida" }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ conflict.description }}
            </p>
          </div>
          <span
            class="px-2 py-1 text-sm rounded"
            :class="{
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':
                conflict.type === 'overlap',
              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':
                conflict.type === 'capacity',
              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400':
                conflict.type === 'level',
            }"
          >
            {{
              conflict.type === "overlap"
                ? "Solapamiento"
                : conflict.type === "capacity"
                  ? "Capacidad"
                  : "Nivel"
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule Grid -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Clase</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Profesor</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Horario</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Alumnos</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(class_, index) in schedule"
            :key="class_.id || index"
            class="border-b dark:border-gray-700 transition-colors"
            :class="{'bg-red-50 dark:bg-red-900/10': class_.hasConflict}"
          >
            <td class="px-4 py-2">{{ class_.name }}</td>
            <td class="px-4 py-2">{{ class_.teacher }}</td>
            <td class="px-4 py-2">{{ class_.schedule }}</td>
            <td class="px-4 py-2">{{ class_.students }}</td>
            <td class="px-4 py-2">
              <span
                class="px-2 py-1 text-sm rounded"
                :class="
                  class_.hasConflict
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                "
              >
                {{ class_.hasConflict ? "Conflicto" : "OK" }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md transition-colors duration-200 font-medium;
  min-width: 120px;
}

.btn:disabled {
  @apply opacity-70 cursor-not-allowed;
}

.card {
  @apply shadow-sm;
}
</style>
