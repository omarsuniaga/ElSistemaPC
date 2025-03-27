import { useAttendanceStore } from '../stores/attendance'
import { useClassesStore } from '../stores/classes'
import { useStudentsStore } from '../stores/students'

export function useAttendanceModules() {
  const attendanceStore = useAttendanceStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()

  return {
    attendanceStore,
    classesStore,
    studentsStore
  }
}