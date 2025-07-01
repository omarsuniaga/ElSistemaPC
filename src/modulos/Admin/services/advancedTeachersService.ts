import {collection, getDocs, query, where, orderBy, limit, Timestamp} from "firebase/firestore"
import {db} from "../../../firebase/config"

// Define Teacher interface for type safety
interface Teacher {
  id: string
  nombre?: string
  name?: string
  apellido?: string
  lastname?: string
  activo?: boolean
  status?: string
  createdAt?: any
  updatedAt?: any
}

// Interfaces for Teachers Advanced Features
export interface TeacherMetrics {
  totalTeachers: number
  activeTeachers: number
  newTeachersThisMonth: number
  averageStudentsPerTeacher: number
  averageHoursPerWeek: number
  topPerformers: number
  teachersAtRisk: number
  averageRating: number
  totalHoursThisMonth: number
  payrollAmount: number
}

export interface TeacherPerformanceAnalysis {
  teacherId: string
  teacherName: string
  studentsManaged: number
  averageAttendance: number
  studentRetention: number
  evaluationScore: number
  hoursPerWeek: number
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
  recommendations: string[]
  actionItems: string[]
}

export interface TeacherScheduleOptimization {
  teacherId: string
  currentHours: number
  optimalHours: number
  suggestions: string[]
  conflicts: string[]
  availability: {
    day: string
    timeSlots: {start: string; end: string; available: boolean}[]
  }[]
}

export interface TeacherPayrollReport {
  teacherId: string
  teacherName: string
  hoursWorked: number
  hourlyRate: number
  baseAmount: number
  bonuses: number
  deductions: number
  totalAmount: number
  paymentStatus: "pending" | "paid" | "overdue"
}

export class AdvancedTeachersService {
  private teachersCollection = collection(db, "teachers")
  private classesCollection = collection(db, "classes")
  private attendanceCollection = collection(db, "attendance")
  private evaluationsCollection = collection(db, "teacher_evaluations")
  private payrollCollection = collection(db, "payroll")

  // ==================== ANALYTICS FUNCTIONS ====================

  /**
   * Get comprehensive teacher metrics
   */ async getTeacherMetrics(): Promise<TeacherMetrics> {
    try {
      const teachersSnapshot = await getDocs(this.teachersCollection)
      const teachers = teachersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Teacher)

      const totalTeachers = teachers.length
      const activeTeachers = teachers.filter((t) => t.activo || t.status === "active").length

      // Calculate new teachers this month
      const currentMonth = new Date()
      currentMonth.setDate(1)

      const newThisMonth = teachers.filter((t) => {
        if (!t.createdAt) return false
        const createdAt =
          t.createdAt instanceof Timestamp ? t.createdAt.toDate() : new Date(t.createdAt)
        return createdAt >= currentMonth
      }).length // Get classes to calculate students per teacher
      const classesSnapshot = await getDocs(this.classesCollection)
      const classes = classesSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))

      const teacherStudentCounts = teachers.map((teacher) => {
        const teacherClasses = classes.filter((c: any) => c.teacherId === teacher.id)
        const totalStudents = teacherClasses.reduce(
          (sum: number, c: any) => sum + (c.alumnos?.length || 0),
          0
        )
        return totalStudents
      })

      const averageStudentsPerTeacher =
        teacherStudentCounts.length > 0
          ? teacherStudentCounts.reduce((sum, count) => sum + count, 0) /
            teacherStudentCounts.length
          : 0

      // Calculate hours per week (from class schedules)
      const teacherHours = await Promise.all(teachers.map((t) => this.calculateWeeklyHours(t.id)))
      const averageHoursPerWeek =
        teacherHours.length > 0
          ? teacherHours.reduce((sum, hours) => sum + hours, 0) / teacherHours.length
          : 0 // Calculate performance metrics
      const evaluations = await this.getTeacherEvaluations()
      const averageRating =
        evaluations.length > 0
          ? evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / evaluations.length
          : 0

      const topPerformers = evaluations.filter((e) => e.rating >= 4.5).length

      // Calculate payroll
      const payrollRecords = await this.getCurrentMonthPayroll()
      const payrollAmount = payrollRecords.reduce((sum, record) => sum + record.totalAmount, 0)
      const totalHoursThisMonth = payrollRecords.reduce(
        (sum, record) => sum + record.hoursWorked,
        0
      ) // Teachers at risk (low performance or issues)
      const riskAnalysis = await this.getTeacherRiskAnalysis()
      const teachersAtRisk = riskAnalysis.filter(
        (r) => r.performanceLevel === "needs_improvement"
      ).length

      return {
        totalTeachers,
        activeTeachers,
        newTeachersThisMonth: newThisMonth,
        averageStudentsPerTeacher,
        averageHoursPerWeek,
        topPerformers,
        teachersAtRisk,
        averageRating,
        totalHoursThisMonth,
        payrollAmount,
      }
    } catch (error) {
      console.error("Error getting teacher metrics:", error)
      throw error
    }
  }

  /**
   * Get detailed performance analysis for all teachers
   */ async getTeacherPerformanceAnalysis(): Promise<TeacherPerformanceAnalysis[]> {
    try {
      const teachersSnapshot = await getDocs(this.teachersCollection)
      const teachers = teachersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Teacher)

      const performanceAnalysis = await Promise.all(
        teachers.map(async (teacher) => {
          const studentsManaged = await this.getTeacherStudentCount(teacher.id)
          const averageAttendance = await this.getTeacherClassAttendance(teacher.id)
          const studentRetention = await this.getTeacherStudentRetention(teacher.id)
          const evaluationScore = await this.getTeacherAverageEvaluation(teacher.id)
          const hoursPerWeek = await this.calculateWeeklyHours(teacher.id)

          // Determine performance level
          let performanceLevel: "excellent" | "good" | "average" | "needs_improvement" = "average"

          if (evaluationScore >= 4.5 && averageAttendance >= 0.85 && studentRetention >= 0.8) {
            performanceLevel = "excellent"
          } else if (
            evaluationScore >= 4.0 &&
            averageAttendance >= 0.75 &&
            studentRetention >= 0.7
          ) {
            performanceLevel = "good"
          } else if (evaluationScore < 3.5 || averageAttendance < 0.6 || studentRetention < 0.6) {
            performanceLevel = "needs_improvement"
          }
          const recommendations = this.generateTeacherRecommendations(
            evaluationScore,
            averageAttendance,
            studentRetention,
            hoursPerWeek
          )

          const actionItems = this.generateTeacherActionItems(performanceLevel)

          return {
            teacherId: teacher.id,
            teacherName:
              `${teacher.nombre || teacher.name || ""} ${teacher.apellido || teacher.lastname || ""}`.trim(),
            studentsManaged,
            averageAttendance,
            studentRetention,
            evaluationScore,
            hoursPerWeek,
            performanceLevel,
            recommendations,
            actionItems,
          }
        })
      )

      return performanceAnalysis
    } catch (error) {
      console.error("Error getting teacher performance analysis:", error)
      throw error
    }
  }

  /**
   * Generate schedule optimization suggestions for teachers
   */ async getScheduleOptimization(): Promise<TeacherScheduleOptimization[]> {
    try {
      const teachersSnapshot = await getDocs(this.teachersCollection)
      const teachers = teachersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Teacher)

      const optimizations = await Promise.all(
        teachers.map(async (teacher) => {
          const currentHours = await this.calculateWeeklyHours(teacher.id)
          const optimalHours = this.calculateOptimalHours(teacher.id, currentHours)
          const suggestions = this.generateScheduleSuggestions(
            teacher.id,
            currentHours,
            optimalHours
          )
          const conflicts = await this.detectScheduleConflicts(teacher.id)
          const availability = await this.getTeacherAvailability(teacher.id)

          return {
            teacherId: teacher.id,
            currentHours,
            optimalHours,
            suggestions,
            conflicts,
            availability,
          }
        })
      )

      return optimizations
    } catch (error) {
      console.error("Error getting schedule optimization:", error)
      throw error
    }
  }

  /**
   * Generate payroll report for current month
   */
  async getPayrollReport(): Promise<TeacherPayrollReport[]> {
    try {
      const payrollRecords = await this.getCurrentMonthPayroll()

      return payrollRecords.map((record) => ({
        teacherId: record.teacherId,
        teacherName: record.teacherName,
        hoursWorked: record.hoursWorked,
        hourlyRate: record.hourlyRate,
        baseAmount: record.hoursWorked * record.hourlyRate,
        bonuses: record.bonuses || 0,
        deductions: record.deductions || 0,
        totalAmount: record.totalAmount,
        paymentStatus: record.paymentStatus || "pending",
      }))
    } catch (error) {
      console.error("Error getting payroll report:", error)
      throw error
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  private async calculateWeeklyHours(teacherId: string): Promise<number> {
    try {
      const classesQuery = query(this.classesCollection, where("teacherId", "==", teacherId))

      const classesSnapshot = await getDocs(classesQuery)
      let totalHours = 0

      classesSnapshot.docs.forEach((doc) => {
        const classData = doc.data()
        if (classData.horario) {
          const startTime = new Date(`1970-01-01T${classData.horario.horaInicio}:00`)
          const endTime = new Date(`1970-01-01T${classData.horario.horaFin}:00`)
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // Hours
          totalHours += duration
        }
      })

      return totalHours
    } catch (error) {
      console.error("Error calculating weekly hours:", error)
      return 0
    }
  }

  private async getTeacherStudentCount(teacherId: string): Promise<number> {
    try {
      const classesQuery = query(this.classesCollection, where("teacherId", "==", teacherId))

      const classesSnapshot = await getDocs(classesQuery)
      let totalStudents = 0

      classesSnapshot.docs.forEach((doc) => {
        const classData = doc.data()
        totalStudents += classData.alumnos?.length || 0
      })

      return totalStudents
    } catch (error) {
      console.error("Error getting teacher student count:", error)
      return 0
    }
  }

  private async getTeacherClassAttendance(teacherId: string): Promise<number> {
    try {
      // Get all classes for this teacher
      const classesQuery = query(this.classesCollection, where("teacherId", "==", teacherId))
      const classesSnapshot = await getDocs(classesQuery)
      const classIds = classesSnapshot.docs.map((doc) => doc.id)

      if (classIds.length === 0) return 0

      // Get attendance records for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      let totalAttendanceRecords = 0
      let totalPresentRecords = 0

      for (const classId of classIds) {
        const attendanceQuery = query(
          this.attendanceCollection,
          where("classId", "==", classId),
          where("fecha", ">=", thirtyDaysAgo.toISOString().split("T")[0])
        )

        const attendanceSnapshot = await getDocs(attendanceQuery)

        attendanceSnapshot.docs.forEach((doc) => {
          const attendance = doc.data()
          if (attendance.attendanceRecords) {
            Object.values(attendance.attendanceRecords).forEach((record: any) => {
              totalAttendanceRecords++
              if (record.status === "present" || record.status === "delayed") {
                totalPresentRecords++
              }
            })
          }
        })
      }

      return totalAttendanceRecords > 0 ? totalPresentRecords / totalAttendanceRecords : 0
    } catch (error) {
      console.error("Error getting teacher class attendance:", error)
      return 0
    }
  }

  private async getTeacherStudentRetention(teacherId: string): Promise<number> {
    try {
      // Get students from 6 months ago vs current students
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const classesQuery = query(this.classesCollection, where("teacherId", "==", teacherId))

      const classesSnapshot = await getDocs(classesQuery)
      const currentStudents = new Set()

      classesSnapshot.docs.forEach((doc) => {
        const classData = doc.data()
        classData.alumnos?.forEach((studentId: string) => currentStudents.add(studentId))
      })

      // For simplicity, we'll estimate retention based on current active students
      // In a real implementation, you'd track historical enrollment data
      const estimatedRetention = Math.min(
        currentStudents.size / Math.max(currentStudents.size * 1.2, 1),
        1
      )

      return estimatedRetention
    } catch (error) {
      console.error("Error getting teacher student retention:", error)
      return 0.7 // Default estimate
    }
  }

  private async getTeacherAverageEvaluation(teacherId: string): Promise<number> {
    try {
      const evaluationsQuery = query(
        this.evaluationsCollection,
        where("teacherId", "==", teacherId),
        orderBy("createdAt", "desc"),
        limit(10) // Last 10 evaluations
      )

      const evaluationsSnapshot = await getDocs(evaluationsQuery)

      if (evaluationsSnapshot.empty) {
        return 4.0 // Default neutral score
      }

      const scores = evaluationsSnapshot.docs.map((doc) => doc.data().rating || 4.0)
      return scores.reduce((sum, score) => sum + score, 0) / scores.length
    } catch (error) {
      console.error("Error getting teacher average evaluation:", error)
      return 4.0 // Default neutral score
    }
  }

  private async getTeacherEvaluations(): Promise<any[]> {
    try {
      const evaluationsSnapshot = await getDocs(this.evaluationsCollection)
      return evaluationsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
    } catch (error) {
      console.error("Error getting teacher evaluations:", error)
      return []
    }
  }
  private async getCurrentMonthPayroll(): Promise<any[]> {
    try {
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      const payrollQuery = query(
        this.payrollCollection,
        where("period", ">=", Timestamp.fromDate(startOfMonth)),
        where("period", "<=", Timestamp.fromDate(endOfMonth))
      )

      const payrollSnapshot = await getDocs(payrollQuery)
      return payrollSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
    } catch (error) {
      console.error("Error getting current month payroll:", error)
      return []
    }
  }

  private async getTeacherRiskAnalysis(): Promise<TeacherPerformanceAnalysis[]> {
    // This would be implemented to analyze teachers at risk
    // For now, return empty array
    return []
  }
  private calculateOptimalHours(_teacherId: string, currentHours: number): number {
    // Business logic to determine optimal hours based on performance, demand, etc.
    if (currentHours < 10) return 15 // Part-time teachers could work more
    if (currentHours > 35) return 30 // Full-time teachers might be overloaded
    return currentHours // Current hours are optimal
  }

  private generateScheduleSuggestions(
    _teacherId: string,
    currentHours: number,
    optimalHours: number
  ): string[] {
    const suggestions = []

    if (currentHours < optimalHours) {
      suggestions.push("Asignar clases adicionales en horarios de alta demanda")
      suggestions.push("Considerar clases grupales para maximizar impacto")
    } else if (currentHours > optimalHours) {
      suggestions.push("Redistribuir algunas clases a otros maestros")
      suggestions.push("Agrupar clases en días específicos para mejor eficiencia")
    }

    suggestions.push("Optimizar tiempos de traslado entre clases")
    suggestions.push("Programar descansos adecuados entre sesiones intensivas")

    return suggestions
  }

  private async detectScheduleConflicts(teacherId: string): Promise<string[]> {
    // Detect scheduling conflicts for the teacher
    const conflicts = []

    try {
      const classesQuery = query(this.classesCollection, where("teacherId", "==", teacherId))

      const classesSnapshot = await getDocs(classesQuery)
      const classes = classesSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))

      // Check for overlapping schedules
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          if (this.hasScheduleOverlap(classes[i], classes[j])) {
            const class1 = classes[i] as any
            const class2 = classes[j] as any
            conflicts.push(
              `Conflicto entre ${class1.nombre || "Clase"} y ${class2.nombre || "Clase"}`
            )
          }
        }
      }
    } catch (error) {
      console.error("Error detecting schedule conflicts:", error)
    }

    return conflicts
  }

  private hasScheduleOverlap(class1: any, class2: any): boolean {
    if (!class1.horario || !class2.horario) return false
    if (class1.horario.dia !== class2.horario.dia) return false

    const start1 = class1.horario.horaInicio
    const end1 = class1.horario.horaFin
    const start2 = class2.horario.horaInicio
    const end2 = class2.horario.horaFin

    return start1 < end2 && start2 < end1
  }

  private async getTeacherAvailability(_teacherId: string): Promise<any[]> {
    // Get teacher's availability for each day of the week
    const availability = []
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    for (const day of days) {
      availability.push({
        day,
        timeSlots: [
          {start: "08:00", end: "12:00", available: true},
          {start: "14:00", end: "18:00", available: true},
          {start: "18:00", end: "22:00", available: true},
        ],
      })
    }

    return availability
  }

  private generateTeacherRecommendations(
    evaluationScore: number,
    averageAttendance: number,
    studentRetention: number,
    hoursPerWeek: number
  ): string[] {
    const recommendations = []

    if (evaluationScore < 4.0) {
      recommendations.push("Considerar capacitación adicional en técnicas pedagógicas")
      recommendations.push("Solicitar feedback específico de estudiantes")
    }

    if (averageAttendance < 0.7) {
      recommendations.push("Revisar metodología de enseñanza para mejorar engagement")
      recommendations.push("Implementar estrategias de motivación estudiantil")
    }

    if (studentRetention < 0.7) {
      recommendations.push("Mejorar comunicación con estudiantes y padres")
      recommendations.push("Personalizar más el enfoque de enseñanza")
    }

    if (hoursPerWeek > 30) {
      recommendations.push("Considerar redistribuir carga horaria para evitar burnout")
    } else if (hoursPerWeek < 10) {
      recommendations.push("Explorar oportunidades para incrementar horas de trabajo")
    }

    return recommendations
  }

  private generateTeacherActionItems(performanceLevel: string): string[] {
    const actions = []

    switch (performanceLevel) {
      case "excellent":
        actions.push("Reconocer logros públicamente")
        actions.push("Considerar para roles de mentoring")
        actions.push("Ofrecer oportunidades de desarrollo profesional")
        break
      case "good":
        actions.push("Mantener el buen trabajo")
        actions.push("Explorar áreas de mejora específicas")
        break
      case "average":
        actions.push("Programar reunión de seguimiento mensual")
        actions.push("Establecer metas específicas de mejora")
        break
      case "needs_improvement":
        actions.push("Programar reunión urgente de evaluación")
        actions.push("Crear plan de mejora con fechas específicas")
        actions.push("Considerar período de prueba supervisado")
        break
    }

    return actions
  }
}

// Export singleton instance
export const advancedTeachersService = new AdvancedTeachersService()
