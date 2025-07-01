import {defineStore} from "pinia"
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  Firestore,
} from "firebase/firestore"
import {db} from "../firebase"

export type AlertType = "ConsecutiveAbsences" | "LowAttendance" | "LatePattern"
export type AlertPriority = "High" | "Medium" | "Low"
export type AlertStatus = "New" | "Sent" | "Dismissed"

export interface AttendanceAlert {
  id: string
  studentId: number
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  message: string
  createdAt: string
  updatedAt: string
  details?: {
    absences?: number
    attendanceRate?: number
    lateDays?: number[]
  }
}

export interface AlertRule {
  id: string
  type: AlertType
  threshold: number
  priority: AlertPriority
  enabled: boolean
}

export const useAlertsStore = defineStore("alerts", {
  state: () => ({
    alerts: [] as AttendanceAlert[],
    rules: [] as AlertRule[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getActiveAlerts: (state) => {
      return state.alerts.filter((alert) => alert.status === "New")
    },

    getHighPriorityAlerts: (state) => {
      return state.alerts.filter((alert) => alert.priority === "High" && alert.status === "New")
    },

    getAlertsByStudent: (state) => {
      return (studentId: number) => state.alerts.filter((alert) => alert.studentId === studentId)
    },
  },

  actions: {
    async fetchAlerts() {
      this.isLoading = true
      this.error = null

      try {
        const querySnapshot = await getDocs(
          query(collection(db as Firestore, "ALERTAS"), orderBy("createdAt", "desc"))
        )

        this.alerts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AttendanceAlert[]
      } catch (error) {
        this.error = "Error al cargar las alertas"
        console.error("Error fetching alerts:", error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchRules() {
      this.isLoading = true
      this.error = null

      try {
        const querySnapshot = await getDocs(collection(db as Firestore, "REGLAS_ALERTAS"))
        this.rules = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AlertRule[]
      } catch (error) {
        this.error = "Error al cargar las reglas de alertas"
        console.error("Error fetching alert rules:", error)
      } finally {
        this.isLoading = false
      }
    },

    async createAlert(alert: Omit<AttendanceAlert, "id" | "createdAt" | "updatedAt">) {
      try {
        const docRef = await addDoc(collection(db as Firestore, "ALERTAS"), {
          ...alert,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        const newAlert: AttendanceAlert = {
          id: docRef.id,
          ...alert,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        this.alerts.unshift(newAlert)
        return newAlert
      } catch (error) {
        this.error = "Error al crear la alerta"
        console.error("Error creating alert:", error)
        throw error
      }
    },

    async updateAlertStatus(alertId: string, status: AlertStatus) {
      try {
        const docRef = doc(db as Firestore, "ALERTAS", alertId)
        await updateDoc(docRef, {
          status,
          updatedAt: new Date().toISOString(),
        })

        const index = this.alerts.findIndex((a) => a.id === alertId)
        if (index !== -1) {
          this.alerts[index] = {
            ...this.alerts[index],
            status,
            updatedAt: new Date().toISOString(),
          }
        }
      } catch (error) {
        this.error = "Error al actualizar el estado de la alerta"
        console.error("Error updating alert status:", error)
        throw error
      }
    },

    async checkConsecutiveAbsences(studentId: number, absences: number) {
      const rule = this.rules.find((r) => r.type === "ConsecutiveAbsences" && r.enabled)
      if (rule && absences >= rule.threshold) {
        const existingAlert = this.alerts.find(
          (a) => a.studentId === studentId && a.type === "ConsecutiveAbsences" && a.status === "New"
        )

        if (!existingAlert) {
          await this.createAlert({
            studentId,
            type: "ConsecutiveAbsences",
            priority: rule.priority,
            status: "New",
            message: `El estudiante ha faltado ${absences} clases consecutivas`,
            details: {absences},
          })
        }
      }
    },

    async checkLowAttendance(studentId: number, rate: number) {
      const rule = this.rules.find((r) => r.type === "LowAttendance" && r.enabled)
      if (rule && rate <= rule.threshold) {
        const existingAlert = this.alerts.find(
          (a) => a.studentId === studentId && a.type === "LowAttendance" && a.status === "New"
        )

        if (!existingAlert) {
          await this.createAlert({
            studentId,
            type: "LowAttendance",
            priority: rule.priority,
            status: "New",
            message: `La tasa de asistencia del estudiante es ${(rate * 100).toFixed(1)}%`,
            details: {attendanceRate: rate},
          })
        }
      }
    },

    async checkLatePattern(studentId: number, lateDays: string[]) {
      const rule = this.rules.find((r) => r.type === "LatePattern" && r.enabled)
      if (rule && lateDays.length >= rule.threshold) {
        const existingAlert = this.alerts.find(
          (a) => a.studentId === studentId && a.type === "LatePattern" && a.status === "New"
        )

        if (!existingAlert) {
          await this.createAlert({
            studentId,
            type: "LatePattern",
            priority: rule.priority,
            status: "New",
            message: `El estudiante ha llegado tarde ${lateDays.length} veces en el último mes`,
            details: {lateDays: lateDays.map((d) => new Date(d).getTime())},
          })
        }
      }
    },
  },
})
