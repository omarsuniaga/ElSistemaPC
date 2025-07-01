import {defineStore} from "pinia"
import type {EmergencyClass, EmergencyClassStatus} from "../types/attendance"
import {
  registerEmergencyClassFirebase,
  getEmergencyClassesFirebase,
  updateEmergencyClassStatusFirebase,
  getEmergencyClassByIdFirebase,
  getEmergencyClassesByTeacherFirebase,
} from "../service/emergencyClass"
import {useAuthStore} from "../../../stores/auth"
import {useNotificationsStore} from "../../../stores/notifications"

export const useEmergencyClassStore = defineStore("emergencyClass", {
  state: () => ({
    emergencyClasses: [] as EmergencyClass[],
    teacherEmergencyClasses: [] as EmergencyClass[],
    isLoading: false,
    error: null as string | null,
    selectedEmergencyClass: null as EmergencyClass | null,
  }),

  getters: {
    getPendingEmergencyClasses: (state) => {
      return state.emergencyClasses.filter((ec) => ec.status === "Pendiente")
    },

    getEmergencyClassById: (state) => {
      return (id: string): EmergencyClass | undefined => {
        return state.emergencyClasses.find((ec) => ec.id === id)
      }
    },

    getCountByStatus: (state) => {
      return (status: EmergencyClassStatus): number => {
        return state.emergencyClasses.filter((ec) => ec.status === status).length
      }
    },
  },

  actions: {
    async fetchEmergencyClasses(status?: EmergencyClassStatus) {
      this.isLoading = true
      this.error = null

      try {
        const classes = await getEmergencyClassesFirebase(status)
        this.emergencyClasses = classes
        return classes
      } catch (error) {
        this.error = "Error al cargar las clases emergentes"
        console.error("Error fetching emergency classes:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTeacherEmergencyClasses() {
      this.isLoading = true
      this.error = null

      try {
        const authStore = useAuthStore()
        // Asegurarse de que hay un usuario y tiene ID
        if (!authStore.user || !authStore.user.uid) {
          throw new Error("Usuario no autenticado")
        }

        const classes = await getEmergencyClassesByTeacherFirebase(authStore.user.uid)
        this.teacherEmergencyClasses = classes
        return classes
      } catch (error) {
        this.error = "Error al cargar las clases emergentes del profesor"
        console.error("Error fetching teacher emergency classes:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async registerEmergencyClass(classData: {
      classId: string
      className: string
      date: string
      reason?: string
    }) {
      this.isLoading = true
      this.error = null

      try {
        const authStore = useAuthStore()
        let notificationsStore

        try {
          // Try to get notifications store, but don't fail if it's not available
          notificationsStore = useNotificationsStore()
        } catch (error) {
          console.warn("Notifications store not available, skipping notification", error)
        }

        // Verificar que hay un usuario autenticado
        if (!authStore.user) {
          throw new Error("Usuario no autenticado")
        }

        const teacherId = authStore.user.uid
        const teacherName = authStore.user.displayName || "Profesor"

        // Preparar datos de la clase emergente
        const emergencyClassData = {
          classId: classData.classId,
          className: classData.className,
          teacherId,
          teacherName,
          date: classData.date,
          reason: classData.reason || "No se especificó razón",
        }

        // Registrar la clase emergente
        const emergencyClassId = await registerEmergencyClassFirebase(emergencyClassData)

        // Enviar notificación a administradores si está disponible el store
        if (notificationsStore) {
          try {
            await notificationsStore.sendNotification({
              title: "Nueva clase emergente registrada",
              message: `${teacherName} ha registrado una clase emergente para ${classData.className} el ${classData.date}`,
              type: "info",
              recipientRoles: ["admin", "director"],
              link: `/admin/emergency-classes/${emergencyClassId}`,
              expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
            })
          } catch (notifError) {
            console.warn("Error sending notification, continuing anyway:", notifError)
          }
        }

        // Actualizar lista de clases emergentes
        await this.fetchTeacherEmergencyClasses()

        return emergencyClassId
      } catch (error) {
        this.error = "Error al registrar la clase emergente"
        console.error("Error registering emergency class:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateEmergencyClassStatus(emergencyClassId: string, status: EmergencyClassStatus) {
      this.isLoading = true
      this.error = null

      try {
        const authStore = useAuthStore()
        let notificationsStore

        try {
          // Try to get notifications store, but don't fail if it's not available
          notificationsStore = useNotificationsStore()
        } catch (error) {
          console.warn("Notifications store not available, skipping notification", error)
        }

        // Verificar que hay un usuario autenticado
        if (!authStore.user) {
          throw new Error("Usuario no autenticado")
        }

        const responderId = authStore.user.uid
        const responderName = authStore.user.displayName || "Administrador"

        // Actualizar el estado
        const updatedClass = await updateEmergencyClassStatusFirebase(
          emergencyClassId,
          status,
          responderId,
          responderName
        )

        // Enviar notificación al profesor si está disponible el store
        if (notificationsStore && updatedClass) {
          try {
            await notificationsStore.sendNotification({
              title: `Clase emergente ${status.toLowerCase()}`,
              message: `Tu solicitud de clase emergente para ${updatedClass.className} el ${updatedClass.date} ha sido ${status.toLowerCase()}`,
              type: status === "Aceptada" ? "success" : status === "Rechazada" ? "error" : "info",
              recipientIds: [updatedClass.teacherId],
              link: `/teacher/emergency-classes/${emergencyClassId}`,
              expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
            })
          } catch (notifError) {
            console.warn("Error sending notification, continuing anyway:", notifError)
          }
        }

        // Actualizar la lista de clases emergentes
        await this.fetchEmergencyClasses()

        return updatedClass
      } catch (error) {
        this.error = "Error al actualizar el estado de la clase emergente"
        console.error("Error updating emergency class status:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
