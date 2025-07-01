<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import AppImage from "@/components/ui/AppImage.vue"
import {useRouter} from "vue-router"
import {useTeachersStore} from "../../store/teachers"
import {useClassesStore} from "../../../Classes/store/classes"
import {useScheduleStore} from "../../../../modulos/Schedules/store/schedule"
import {useNotificationsStore} from "../../../../stores/notifications"
import {useUserSessionsStore} from "../../../Users/store/userSessions"
import NotificationSystem from "../../../../components/NotificationSystem.vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"
import FileUpload from "../../../../components/FileUpload.vue"
import {getAuth} from "firebase/auth"
import {
  SunIcon,
  MoonIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"
import {Dialog, DialogPanel, TransitionRoot, TransitionChild} from "@headlessui/vue"
import {jsPDF} from "jspdf"
import "jspdf-autotable"

const notificationsStore = useNotificationsStore()
const router = useRouter()
const auth = getAuth()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const scheduleStore = useScheduleStore()
const userSessionsStore = useUserSessionsStore()

// Only set dark mode on mount, don't toggle it
const isDark = ref(localStorage.getItem("darkMode") === "true")
onMounted(() => {
  document.documentElement.classList.toggle("dark", isDark.value)
})

// Get the current user's UID from Firebase Auth
const currentUserUID = ref(auth.currentUser?.uid || "")
// Use refs for both UID and ID to handle asynchronous updating
const teacherUID = ref("")
const teacherId = ref(null)

const dismissNotification = async (id: string) => {
  await notificationsStore.dismissNotification(id)
}

const teacher = ref(null)
const isLoading = ref(true)

// Update the teacherClasses computation to use the teacherId ref
const teacherClasses = computed(() =>
  classesStore.classes.filter((c: any) => c.teacherId === teacherId.value)
)

const statistics = ref({totalStudents: 0, activeClasses: 0, weeklyHours: 0})

const loadTeacherData = async () => {
  isLoading.value = true
  try {
    console.log("Current user UID:", currentUserUID.value)

    if (!currentUserUID.value) {
      console.error("No authenticated user found")
      return
    }

    teacherUID.value = currentUserUID.value

    // Fetch teachers first to ensure we have the full collection
    await teachersStore.fetchTeachers()

    // Find the teacher with matching UID directly from teachers collection
    const teacherWithUID = teachersStore.teachers.find((t) => t.uid === teacherUID.value)

    if (teacherWithUID) {
      // If found by UID, use the teacher's ID
      teacherId.value = teacherWithUID.id
      teacher.value = teacherWithUID
      console.log("Teacher found by UID:", teacher.value)
    } else {
      // As a fallback, try to get teacher ID from userSessions store
      const id = await userSessionsStore.getTeacherIdByUID(teacherUID.value)

      if (id) {
        teacherId.value = id
        // Find teacher by ID
        teacher.value = teachersStore.teachers.find((t) => t.id === teacherId.value)
        console.log("Teacher found by ID from userSessions:", teacher.value)
      } else {
        console.error("Teacher not found with UID:", teacherUID.value)
      }
    }

    // Continue loading other data
    await Promise.all([classesStore.fetchClasses(), scheduleStore.fetchAllSchedules()])

    // Calculate statistics with the classes for this teacher
    if (teacher.value) {
      calculateStatistics()
    }
  } catch (error) {
    console.error("Error loading teacher data:", error)
  } finally {
    isLoading.value = false
  }
}

// Move the statistics calculation to a separate function
const calculateStatistics = () => {
  // Get unique students from all classes
  const uniqueStudents = new Set()
  teacherClasses.value.forEach((cls) => {
    if (cls.studentIds) {
      cls.studentIds.forEach((id) => uniqueStudents.add(id))
    }
  })

  // Calculate total weekly hours from all class schedules
  const weeklyHours = teacherClasses.value.reduce((total, cls) => {
    if (!cls.schedule?.slots) return total

    return (
      total +
      cls.schedule.slots.reduce((slotTotal, slot) => {
        const [startHour, startMin] = slot.startTime.split(":").map(Number)
        const [endHour, endMin] = slot.endTime.split(":").map(Number)
        const hours = endHour - startHour + (endMin - startMin) / 60
        return slotTotal + hours
      }, 0)
    )
  }, 0)

  statistics.value = {
    totalStudents: uniqueStudents.size,
    activeClasses: teacherClasses.value.length,
    weeklyHours,
  }
}

// Call loadTeacherData when the component is mounted
onMounted(loadTeacherData)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle("dark", isDark.value)
  localStorage.setItem("darkMode", String(isDark.value))
}

const formatHours = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
const formattedDate = format(new Date(), "EEEE, d 'de' MMMM yyyy", {locale: es})

const handleLogout = async () => {
  await auth.signOut()
  router.push("/login")
}

const handleEditProfile = () => {
  router.push(`/teachers/${teacherUID.value}/edit`)
}

const showNotificationsModal = ref(false)
const notifications = ref([])

// Function to generate and download PDF
const downloadSchedule = async () => {
  const doc = new jsPDF()

  // Configurar el título
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("Horario de Clases", doc.internal.pageSize.width / 2, 20, {align: "center"})

  // Nombre del profesor y fecha
  doc.setFont("helvetica", "normal")
  doc.setFontSize(14)
  doc.text(`${teacher.value?.name}`, doc.internal.pageSize.width / 2, 30, {align: "center"})
  doc.text(format(new Date(), "MMMM yyyy", {locale: es}), doc.internal.pageSize.width / 2, 40, {
    align: "center",
  })

  // Preparar datos para la tabla
  const tableData = teacherClasses.value
    .map((cls) => {
      return cls.schedule?.slots.map((slot) => [
        cls.name,
        slot.day,
        `${slot.startTime} - ${slot.endTime}`,
      ])
    })
    .flat()

  // Generar tabla
  doc.autoTable({
    startY: 50,
    head: [["Clase", "Día", "Horario"]],
    body: tableData,
    theme: "striped",
    headStyles: {fillColor: [63, 81, 181]},
    styles: {fontSize: 10, cellPadding: 5},
  })

  // Guardar el PDF
  doc.save(`${teacher.value?.name}_${format(new Date(), "MMMM_yyyy", {locale: es})}.pdf`)
}
</script>

<template>
  <div v-if="!isLoading" class="max-w-5xl mx-auto py-8 px-6 space-y-8">
    <!-- Perfil Header -->
    <div
      class="flex items-center gap-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white"
    >
      <div class="w-24 h-24 rounded-full shadow-lg border-4 border-white overflow-hidden">
        <AppImage
          :src="teacher?.photoURL || ''"
          :alt="`Foto de ${teacher?.name || 'profesor'}`"
          :rounded="true"
          img-class="w-full h-full object-cover"
        >
          <template #fallback>
            <div class="w-full h-full flex items-center justify-center bg-indigo-500">
              <span class="text-white text-2xl font-bold">
                {{ teacher?.name?.charAt(0) || "P" }}
              </span>
            </div>
          </template>
        </AppImage>
      </div>
      <div>
        <h1 class="text-2xl font-bold">{{ teacher ? teacher.name : "Profesor" }}</h1>
        <p class="text-indigo-100">
          {{ teacher && teacher.instruments ? teacher.instruments : "Profesor de Música" }}
        </p>
        <p class="text-sm">{{ formattedDate }}</p>
      </div>
      <button
        class="ml-auto p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
        @click="toggleDarkMode"
      >
        <SunIcon v-if="isDark" class="w-6 h-6" />
        <MoonIcon v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Estadísticas y Clases -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <ChartBarIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ statistics.activeClasses }}</h3>
        <p class="text-sm text-gray-500">Clases activas</p>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <UserIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ statistics.totalStudents }}</h3>
        <p class="text-sm text-gray-500">Estudiantes</p>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded p-4">
        <ClockIcon class="h-8 w-8 text-indigo-500" />
        <h3 class="text-lg font-semibold">{{ formatHours(statistics.weeklyHours) }}</h3>
        <p class="text-sm text-gray-500">Horas semanales</p>
      </div>
    </div>

    <!-- Botones de acción -->
    <NotificationSystem
      :notifications="notificationsStore.notifications"
      @dismiss="dismissNotification"
    />
    <div class="flex flex-wrap gap-4">
      <button class="btn-red" @click="handleLogout">
        <ArrowLeftOnRectangleIcon class="w-5 h-5 mr-1" />Cerrar Sesión
      </button>
      <button class="btn-indigo" @click="handleEditProfile">
        <PencilIcon class="w-5 h-5 mr-1" />Editar Perfil
      </button>
      <button class="btn-indigo" @click="downloadSchedule">
        <DocumentArrowDownIcon class="w-5 h-5 mr-1" />Descargar Horario
      </button>
      <button class="btn-indigo" @click="showNotificationsModal = true">
        <BellIcon class="w-5 h-5 mr-1" />Notificaciones
      </button>
    </div>
  </div>

  <div v-else class="text-center py-20">
    <span class="text-gray-500">Cargando datos del profesor...</span>
  </div>

  <TransitionRoot appear :show="showNotificationsModal" as="template">
    <Dialog as="div" class="relative z-50" @close="showNotificationsModal = false">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Notificaciones</h3>
                <button
                  class="text-gray-400 hover:text-gray-500"
                  @click="showNotificationsModal = false"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>
              <div class="mt-4">
                <NotificationSystem
                  :notifications="notificationsStore.notifications"
                  @dismiss="dismissNotification"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style lang="postcss" scoped>
.btn-indigo {
  @apply flex items-center bg-indigo-500 text-white py-2 px-4 rounded-lg shadow hover:bg-indigo-600 transition;
}
.btn-red {
  @apply flex items-center bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition;
}
</style>
