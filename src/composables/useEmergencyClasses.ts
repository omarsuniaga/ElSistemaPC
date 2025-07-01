import {ref, computed} from "vue"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import {db} from "../firebase/config"
import {useAuthStore} from "../stores/auth"

// Helper function to safely convert Firestore date fields to Date objects
const convertToDate = (value: any): Date => {
  if (!value) {
    return new Date()
  }

  // If it's a Firestore Timestamp with toDate method
  if (value && typeof value.toDate === "function") {
    try {
      return value.toDate()
    } catch (error) {
      console.warn("[useEmergencyClasses] Error converting Timestamp to Date:", error)
      return new Date()
    }
  }

  // If it's already a Date object
  if (value instanceof Date) {
    return value
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  // If it's a number (timestamp in milliseconds)
  if (typeof value === "number") {
    return new Date(value)
  }

  // Fallback to current date
  console.warn("[useEmergencyClasses] Unknown date format, using current date:", value)
  return new Date()
}

// Helper function to safely convert date to Date object or return undefined
const convertToDateOrUndefined = (value: any): Date | undefined => {
  if (!value) {
    return undefined
  }

  try {
    return convertToDate(value)
  } catch (error) {
    console.warn("[useEmergencyClasses] Error converting date, returning undefined:", error)
    return undefined
  }
}

// Types
export interface EmergencyClass {
  id?: string
  className: string
  classType: string
  date: string
  startTime: string
  endTime: string
  instrument?: string
  reason: string
  selectedStudents: string[]
  teacherId: string
  status: "pending" | "active" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
  // Metadata adicional
  approvedBy?: string
  approvedAt?: Date
  notes?: string
}

export interface CreateEmergencyClassData {
  className: string
  classType: string
  date: string
  startTime: string
  endTime: string
  instrument?: string
  reason: string
  selectedStudents: string[]
  teacherId: string
}

export function useEmergencyClasses() {
  const authStore = useAuthStore()

  // State
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)
  const emergencyClasses = ref<EmergencyClass[]>([])

  // Computed
  const hasError = computed(() => !!error.value)
  const isProcessing = computed(
    () => isLoading.value || isCreating.value || isUpdating.value || isDeleting.value
  )

  // Helper function to clear error
  const clearError = () => {
    error.value = null
  }

  // Helper function to set error
  const setError = (message: string) => {
    error.value = message
    console.error("[useEmergencyClasses]", message)
  }

  /**
   * Create a new emergency class
   */
  const createEmergencyClass = async (data: CreateEmergencyClassData): Promise<string | null> => {
    try {
      isCreating.value = true
      clearError()

      console.log("[useEmergencyClasses] Creating emergency class:", data)

      // Validate required fields
      if (
        !data.className ||
        !data.classType ||
        !data.date ||
        !data.startTime ||
        !data.endTime ||
        !data.reason
      ) {
        throw new Error("Faltan campos requeridos para crear la clase emergente")
      }

      if (!data.selectedStudents || data.selectedStudents.length === 0) {
        throw new Error("Debe seleccionar al menos un estudiante")
      }

      if (!data.teacherId) {
        throw new Error("ID del maestro requerido")
      }

      // Create the emergency class document
      const emergencyClassData: Omit<EmergencyClass, "id"> = {
        className: data.className.trim(),
        classType: data.classType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        instrument: data.instrument?.trim() || "",
        reason: data.reason.trim(),
        selectedStudents: data.selectedStudents,
        teacherId: data.teacherId,
        status: "active", // Las clases emergentes están activas inmediatamente
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, "EMERGENCY_CLASSES"), {
        ...emergencyClassData,
        createdAt: Timestamp.fromDate(emergencyClassData.createdAt),
        updatedAt: Timestamp.fromDate(emergencyClassData.updatedAt),
      })

      console.log("[useEmergencyClasses] Emergency class created with ID:", docRef.id)

      // Add to local state
      const newEmergencyClass: EmergencyClass = {
        id: docRef.id,
        ...emergencyClassData,
      }
      emergencyClasses.value.push(newEmergencyClass)

      return docRef.id
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear la clase emergente"
      setError(errorMessage)
      console.error("[useEmergencyClasses] Error creating emergency class:", err)
      return null
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Get all emergency classes
   */
  const fetchEmergencyClasses = async (teacherId?: string): Promise<EmergencyClass[]> => {
    try {
      isLoading.value = true
      clearError()

      console.log("[useEmergencyClasses] Fetching emergency classes for teacher:", teacherId)

      let q = query(collection(db, "EMERGENCY_CLASSES"), orderBy("createdAt", "desc"))

      // Filter by teacher if specified
      if (teacherId) {
        q = query(
          collection(db, "EMERGENCY_CLASSES"),
          where("teacherId", "==", teacherId),
          orderBy("createdAt", "desc")
        )
      }

      const querySnapshot = await getDocs(q)
      const classes: EmergencyClass[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        classes.push({
          id: doc.id,
          className: data.className,
          classType: data.classType,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          instrument: data.instrument || "",
          reason: data.reason,
          selectedStudents: data.selectedStudents || [],
          teacherId: data.teacherId,
          status: data.status || "active",
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
          approvedBy: data.approvedBy,
          approvedAt: convertToDateOrUndefined(data.approvedAt),
          notes: data.notes,
        })
      })

      emergencyClasses.value = classes
      console.log("[useEmergencyClasses] Fetched", classes.length, "emergency classes")

      return classes
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar las clases emergentes"
      setError(errorMessage)
      console.error("[useEmergencyClasses] Error fetching emergency classes:", err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get emergency classes for a specific date
   */
  const getEmergencyClassesForDate = async (
    date: string,
    teacherId?: string
  ): Promise<EmergencyClass[]> => {
    try {
      console.log("[useEmergencyClasses] Getting emergency classes for date:", date)

      let q = query(
        collection(db, "EMERGENCY_CLASSES"),
        where("date", "==", date),
        orderBy("startTime", "asc")
      )

      if (teacherId) {
        q = query(
          collection(db, "EMERGENCY_CLASSES"),
          where("date", "==", date),
          where("teacherId", "==", teacherId),
          orderBy("startTime", "asc")
        )
      }

      const querySnapshot = await getDocs(q)
      const classes: EmergencyClass[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        classes.push({
          id: doc.id,
          className: data.className,
          classType: data.classType,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          instrument: data.instrument || "",
          reason: data.reason,
          selectedStudents: data.selectedStudents || [],
          teacherId: data.teacherId,
          status: data.status || "active",
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
          approvedBy: data.approvedBy,
          approvedAt: convertToDateOrUndefined(data.approvedAt),
          notes: data.notes,
        })
      })

      console.log("[useEmergencyClasses] Found", classes.length, "emergency classes for date", date)
      return classes
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar las clases emergentes para la fecha"
      setError(errorMessage)
      console.error("[useEmergencyClasses] Error getting emergency classes for date:", err)
      return []
    }
  }

  /**
   * Update an emergency class
   */
  const updateEmergencyClass = async (
    id: string,
    updates: Partial<EmergencyClass>
  ): Promise<boolean> => {
    try {
      isUpdating.value = true
      clearError()

      console.log("[useEmergencyClasses] Updating emergency class:", id, updates)

      const docRef = doc(db, "EMERGENCY_CLASSES", id)
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      }

      // Remove id from updates if present
      delete updateData.id

      await updateDoc(docRef, updateData)

      // Update local state
      const index = emergencyClasses.value.findIndex((cls) => cls.id === id)
      if (index !== -1) {
        emergencyClasses.value[index] = {
          ...emergencyClasses.value[index],
          ...updates,
          updatedAt: new Date(),
        }
      }

      console.log("[useEmergencyClasses] Emergency class updated successfully")
      return true
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar la clase emergente"
      setError(errorMessage)
      console.error("[useEmergencyClasses] Error updating emergency class:", err)
      return false
    } finally {
      isUpdating.value = false
    }
  }

  /**
   * Delete an emergency class
   */
  const deleteEmergencyClass = async (id: string): Promise<boolean> => {
    try {
      isDeleting.value = true
      clearError()

      console.log("[useEmergencyClasses] Deleting emergency class:", id)

      const docRef = doc(db, "EMERGENCY_CLASSES", id)
      await deleteDoc(docRef)

      // Remove from local state
      emergencyClasses.value = emergencyClasses.value.filter((cls) => cls.id !== id)

      console.log("[useEmergencyClasses] Emergency class deleted successfully")
      return true
    } catch (err: any) {
      const errorMessage = err.message || "Error al eliminar la clase emergente"
      setError(errorMessage)
      console.error("[useEmergencyClasses] Error deleting emergency class:", err)
      return false
    } finally {
      isDeleting.value = false
    }
  }

  /**
   * Change emergency class status
   */
  const changeClassStatus = async (
    id: string,
    status: EmergencyClass["status"]
  ): Promise<boolean> => {
    return updateEmergencyClass(id, {status})
  }

  return {
    // State
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    emergencyClasses,

    // Computed
    hasError,
    isProcessing,

    // Methods
    clearError,
    createEmergencyClass,
    fetchEmergencyClasses,
    getEmergencyClassesForDate,
    updateEmergencyClass,
    deleteEmergencyClass,
    changeClassStatus,
  }
}
