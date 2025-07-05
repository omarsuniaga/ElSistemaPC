import {defineStore} from "pinia"
import {auth, db} from "@/firebase"
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import {doc, getDoc, setDoc} from "firebase/firestore"
import {useStudentsStore} from "@/modulos/Students/store/students"
import {useTeachersStore} from "@/modulos/Teachers/store/teachers"
import {useClassesStore} from "@/modulos/Classes/store/classes"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useScheduleStore} from "@/modulos/Schedules/store/schedule"
import {getThemePreference} from "@/modulos/Users/service/userPreferences"

// Interfaz para el objeto de usuario
interface User {
  uid: string
  email: string | null
  role?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  userRoles?: string[]
  isDark?: boolean
  profileCompleted?: boolean
  // Agrega otros campos si es necesario
}

// Interfaz para las notificaciones
interface Notification {
  message: string
  type: "success" | "error" | "info"
}

// Variable para controlar las llamadas concurrentes al checkAuth
let authCheckPromise: Promise<any> | null = null

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
    isInitialized: false,
    notifications: [] as Notification[],
    dataInitialized: false,
  }),

  getters: {
    // Retorna true si hay un usuario autenticado
    isLoggedIn: (state) => !!state.user, // Computed properties para roles
    isDirector: (state) => state.user?.role === "Director",
    isTeacher: (state) => state.user?.role === "Maestro",
    isAdmin: (state) => state.user?.role === "Admin",
    isSuperusuario: (state) => state.user?.role === "Superusuario",
    // Retorna true si el usuario está aprobado
    isApproved: (state) => state.user?.status === "aprobado",
    // Permisos para gestionar módulos
    canManageStudents: (state) => ["Director", "Maestro"].includes(state.user?.role || ""),
    canManageAttendance: (state) => ["Director", "Maestro"].includes(state.user?.role || ""),
    canManageSchedule: (state) => ["Director", "Maestro"].includes(state.user?.role || ""), // Función para validar acceso a módulos específicos
    canAccessModule: (state) => (moduleName: string) => {
      const roleModules = {
        Maestro: ["home", "attendance", "schedule", "students"],
        Director: [
          "home",
          "attendance",
          "schedule",
          "students",
          "classes",
          "reports",
          "teachers",
          "profile",
        ],
        Admin: ["home", "attendance", "students", "profile"],
        Superusuario: [
          "home",
          "superusuario",
          "system",
          "audit",
          "backup",
          "permissions",
          "users",
          "roles",
        ],
      }
      return (
        state.user?.role &&
        roleModules[state.user.role as keyof typeof roleModules]?.includes(moduleName)
      )
    },
  },

  actions: {
    /**
     * Inicia sesión autenticando al usuario y obteniendo su perfil desde Firestore.
     * Si no existe el perfil, se crea uno (por ejemplo, para el director).
     */
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const userDocRef = doc(db, "USERS", userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          // Si el usuario no tiene perfil en la base de datos, no se le permite el acceso
          throw new Error("No se encontró el perfil del usuario")
        } else {
          const userData = userDoc.data()
          // Se asigna el perfil completo al estado
          this.user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userData,
          } as User

          // Redirigir según el estado del perfil
          if (userData.status === "pendiente" && !userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: "/complete-profile",
              message: "Por favor, completa tu perfil para continuar",
            }
          }
          if (userData.status === "pendiente" && userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: "/pending-approval",
              message: "Tu cuenta está pendiente de aprobación",
            }
          }
          if (userData.status === "rechazado") {
            throw new Error(
              "Tu solicitud de acceso ha sido rechazada. Contacta al administrador para más información."
            )
          }
          if (userData.status !== "aprobado") {
            throw new Error("Tu cuenta está pendiente de aprobación")
          }

          // Notificar a roles administrativos
          if (["Director", "Admin"].includes(userData.role)) {
            this.notifications.push({
              message: `¡Bienvenido ${userData.role}! Has iniciado sesión exitosamente.`,
              type: "success",
            })
          }
          // Actualizar el último login en Firestore
          await setDoc(userDocRef, {lastLogin: new Date().toISOString()}, {merge: true})
          
          // Crear notificación de login para profesores
          if (userData.role === "Maestro") {
            this.createTeacherLoginNotification(userCredential.user.uid)
          }
          
          // Inicializar datos de otros módulos
          await this.initializeData()

          // Inicializar sistema de notificaciones para roles administrativos
          if (["Director", "Admin", "Superusuario"].includes(userData.role)) {
            this.initializeAttendanceNotifications()
          }

          // Determinar redirección según el rol
          let redirectTo = "/"
          if (userData.role === "Superusuario") {
            redirectTo = "/superusuario/dashboard"
          } else if (userData.role === "Maestro") {
            redirectTo = "/teacher"
          } else if (["Director", "Admin"].includes(userData.role)) {
            redirectTo = "/dashboard"
          }

          const isAdmin = ["Director", "Admin", "Superusuario"].includes(userData.role)
          return {user: this.user, redirectTo, showNotification: isAdmin}
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    } /**
     * Cierra la sesión del usuario.
     * Limpia el estado del usuario y reinicia los stores de otros módulos.
     */,
    async signOut() {
      try {
        await firebaseSignOut(auth)
        this.user = null
        this.dataInitialized = false

        // Reinicia otros stores con manejo de errores individual
        try {
          const studentsStore = useStudentsStore()
          if (studentsStore.$reset) {
            studentsStore.$reset()
          }
        } catch (error) {
          console.warn("No se pudo resetear el store de students:", error)
        }

        try {
          const classesStore = useClassesStore()
          if (classesStore.$reset) {
            classesStore.$reset()
          }
        } catch (error) {
          console.warn("No se pudo resetear el store de classes:", error)
        }

        try {
          const attendanceStore = useAttendanceStore()
          if (attendanceStore.$reset) {
            attendanceStore.$reset()
          }
        } catch (error) {
          console.warn("No se pudo resetear el store de attendance:", error)
        }
      } catch (error: any) {
        console.error("Error al cerrar sesión:", error)
        throw error
      }
    },

    /**
     * Registra un nuevo usuario en Firebase y crea su perfil en Firestore.
     * Por defecto se registra como Maestro y en estado pendiente.
     */
    async register(email: string, password: string, userData?: Record<string, any>) {
      this.isLoading = true
      this.error = null
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, "USERS", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData?.name || "",
          phone: userData?.phone || "",
          role: userData?.role || "Maestro",
          status: "pendiente",
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDark: false, // Tema claro por defecto
        })
        return {
          message: "Registro exitoso. Por favor completa tu perfil para continuar.",
          user: userCredential.user,
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Verifica la autenticación usando onAuthStateChanged.
     * Se evita la duplicación de llamadas mediante authCheckPromise.
     */
    async checkAuth() {
      if (authCheckPromise) {
        return authCheckPromise
      }
      if (this.isInitialized) {
        return Promise.resolve(this.user)
      }
      authCheckPromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, "USERS", user.uid))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                if (userData.status === "aprobado") {
                  this.user = {uid: user.uid, email: user.email, ...userData} as User
                  // Cargar preferencia de tema del usuario
                  try {
                    const themePreference = await getThemePreference(user.uid)
                    if (themePreference !== null) {
                      // Si existe una preferencia explícita, actualizar el usuario con ella
                      this.user.isDark = themePreference
                    } else if (this.user.isDark === undefined) {
                      // Si no hay preferencia explícita ni en el perfil, usar claro por defecto
                      this.user.isDark = false
                      // Actualizar el perfil con el valor predeterminado
                      await setDoc(doc(db, "USERS", user.uid), {isDark: false}, {merge: true})
                    }
                  } catch (error) {
                    console.error("Error al cargar preferencia de tema:", error)
                  }
                } else {
                  console.error("🔐 Usuario no aprobado, cerrando sesión")
                  await this.signOut()
                }
              } else {
                console.error("🔐 Usuario sin perfil y no es director, cerrando sesión")
                await this.signOut()
              }
            } catch (error) {
              console.error("🔐 Error al obtener perfil:", error)
            }
          } else {
            console.error("🔐 Debes ser miembro de el sistema punta cana, para obtener acceso")
            this.user = null
          }
          this.isInitialized = true
          unsubscribe()
          authCheckPromise = null
          resolve(this.user)
        })
      })
      if (this.user && !this.dataInitialized) {
        await this.initializeData()
      }
      return authCheckPromise
    },

    /**
     * Inicializa datos de otros módulos (estudiantes, maestros, clases, asistencias).
     * Se llama después de un login exitoso.
     */
    async initializeData() {
      if (this.dataInitialized) return
      const studentsStore = useStudentsStore()
      const teachersStore = useTeachersStore()
      const classesStore = useClassesStore()
      const attendanceStore = useAttendanceStore()
      const scheduleStore = useScheduleStore()
      try {
        await Promise.all([
          studentsStore.fetchStudents(),
          teachersStore.fetchTeachers(),
          classesStore.fetchClasses(),
          attendanceStore.fetchAttendanceDocuments(),
          scheduleStore.fetchAllSchedules(),
        ])
        this.dataInitialized = true
      } catch (error) {
        console.error("Error initializing data:", error)
        // No marcamos como inicializado para permitir reintentos
      }
    },

    /**
     * Parsea y traduce códigos de error de Firebase en mensajes amigables.
     */
    parseAuthError(error: any): string {
      const errorCode = error.code
      switch (errorCode) {
        case "auth/invalid-email":
          return "El correo electrónico no es válido"
        case "auth/user-disabled":
          return "Esta cuenta ha sido deshabilitada"
        case "auth/user-not-found":
        case "auth/wrong-password":
          return "Credenciales inválidas"
        case "auth/email-already-in-use":
          return "Este correo electrónico ya está registrado"
        case "auth/weak-password":
          return "La contraseña debe tener al menos 6 caracteres"
        case "auth/too-many-requests":
          return "Demasiados intentos fallidos. Por favor, intente más tarde"
        default:
          return error.message ? error.message : "Error de autenticación"
      }
    },

    // Inicializar sistema de notificaciones de asistencia
    async initializeAttendanceNotifications() {
      try {
        console.log(
          "🔔 Inicializando sistema de notificaciones de asistencia para usuario administrativo..."
        )

        // Importar dinámicamente para evitar dependencias circulares
        const {default: notificationSystem} = await import(
          "@/services/attendanceNotificationManager"
        )

        // Esperar un poco para asegurar que Firebase esté completamente listo
        setTimeout(async () => {
          try {
            await notificationSystem.initialize()

            // Exponer en desarrollo para debugging
            if (import.meta.env.DEV) {
              ;(window as any).attendanceNotifications = notificationSystem
              console.log(
                "🔧 Sistema de notificaciones disponible en window.attendanceNotifications"
              )
            }
          } catch (error) {
            console.error("❌ Error inicializando notificaciones de asistencia:", error)
          }
        }, 2000) // Esperar 2 segundos después del login exitoso
      } catch (error) {
        console.error("❌ Error importando sistema de notificaciones:", error)
      }
    },

    // Crear notificación de login de profesor
    async createTeacherLoginNotification(teacherId: string) {
      try {
        // Importar dinámicamente para evitar dependencias circulares
        const {createTeacherLoginNotification} = await import("@/services/adminNotificationService")
        
        await createTeacherLoginNotification(teacherId)
      } catch (error) {
        console.error("❌ Error creando notificación de login:", error)
      }
    },
  },
})
