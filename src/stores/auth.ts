import { defineStore } from 'pinia'
import { auth, db } from '../firebase'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useTeachersStore } from '../modulos/Teachers/store/teachers'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'

// Interfaz para el objeto de usuario
interface User {
  uid: string
  email: string | null
  role?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  // Agrega otros campos si es necesario
}

// Interfaz para las notificaciones
interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
}

// Variable para controlar las llamadas concurrentes al checkAuth
let authCheckPromise: Promise<any> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
    isInitialized: false,
    notifications: [] as Notification[],
    dataInitialized: false
  }),

  getters: {
    // Retorna true si hay un usuario autenticado
    isLoggedIn: (state) => !!state.user,
    // Computed properties para roles
    isDirector: (state) => state.user?.role === 'Director',
    isTeacher: (state) => state.user?.role === 'Maestro',
    isAdmin: (state) => state.user?.role === 'Admin',
    // Retorna true si el usuario está aprobado
    isApproved: (state) => state.user?.status === 'aprobado',
    // Permisos para gestionar módulos
    canManageStudents: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageAttendance: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageSchedule: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    // Función para validar acceso a módulos específicos
    canAccessModule: (state) => (moduleName: string) => {
      const roleModules = {
        'Maestro': ['home', 'attendance', 'schedule', 'profile'],
        'Director': ['home', 'attendance', 'schedule', 'profile', 'students', 'classes', 'reports', 'teachers'],
        'Admin': ['home', 'profile']
      }
      return state.user?.role && roleModules[state.user.role as keyof typeof roleModules]?.includes(moduleName)
    }
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
        const userDocRef = doc(db, 'USERS', userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (!userDoc.exists()) {
          // Si no existe el perfil y el correo corresponde al director, se crea el perfil
          if (email === 'director@gmail.com') {
            const directorData: User = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              role: 'Director',
              status: 'aprobado',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            await setDoc(userDocRef, directorData)
            this.user = directorData
            this.notifications.push({
              message: '¡Bienvenido Director! Has iniciado sesión exitosamente.',
              type: 'success'
            })
            return { user: this.user, redirectTo: '/', showNotification: true }
          } else {
            throw new Error('No se encontró el perfil del usuario')
          }
        } else {
          const userData = userDoc.data()
          // Se asigna el perfil completo al estado
          this.user = { uid: userCredential.user.uid, email: userCredential.user.email, ...userData } as User
          
          // Redirigir según el estado del perfil
          if (userData.status === 'pendiente' && !userData.profileCompleted) {
            return { user: this.user, redirectTo: '/complete-profile', message: 'Por favor, completa tu perfil para continuar' }
          }
          if (userData.status === 'pendiente' && userData.profileCompleted) {
            return { user: this.user, redirectTo: '/pending-approval', message: 'Tu cuenta está pendiente de aprobación' }
          }
          if (userData.status === 'rechazado') {
            throw new Error('Tu solicitud de acceso ha sido rechazada. Contacta al administrador para más información.')
          }
          if (userData.status !== 'aprobado') {
            throw new Error('Tu cuenta está pendiente de aprobación')
          }
          
          // Notificar a roles administrativos
          if (['Director', 'Admin'].includes(userData.role)) {
            this.notifications.push({
              message: `¡Bienvenido ${userData.role}! Has iniciado sesión exitosamente.`,
              type: 'success'
            })
          }
          
          // Actualizar el último login en Firestore
          await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true })
          // Inicializar datos de otros módulos
          await this.initializeData()
          
          const isAdmin = ['Director', 'Admin'].includes(userData.role)
          return { user: this.user, redirectTo: '/', showNotification: isAdmin }
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Cierra la sesión del usuario.
     * Limpia el estado del usuario y reinicia los stores de otros módulos.
     */
    async signOut() {
      try {
        await firebaseSignOut(auth)
        this.user = null
        this.dataInitialized = false
        // Reinicia otros stores; para stores sin $reset, se puede implementar un método reset personalizado
        const studentsStore = useStudentsStore()
        const classesStore = useClassesStore()
        const attendanceStore = useAttendanceStore()
        await Promise.all([
          studentsStore.$reset(),
          classesStore.$reset(),
          attendanceStore.$reset()
        ])
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error)
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
        await setDoc(doc(db, 'USERS', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData?.name || '',
          phone: userData?.phone || '',
          role: userData?.role || 'Maestro',
          status: 'pendiente',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        return {
          message: 'Registro exitoso. Por favor completa tu perfil para continuar.',
          user: userCredential.user
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
      console.log('🔐 checkAuth llamado, estado de inicialización:', this.isInitialized)
      if (authCheckPromise) {
        console.log('🔐 Reutilizando promesa de checkAuth existente')
        return authCheckPromise
      }
      if (this.isInitialized) {
        console.log('🔐 Auth ya inicializado, devolviendo estado actual')
        return Promise.resolve(this.user)
      }
      console.log('🔐 Iniciando nueva verificación de autenticación')
      authCheckPromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log(`🔐 Estado de autenticación: ${user ? 'autenticado' : 'no autenticado'}`)
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, 'USERS', user.uid))
              console.log(`🔐 Perfil de usuario encontrado: ${userDoc.exists() ? 'sí' : 'no'}`)
              if (userDoc.exists()) {
                const userData = userDoc.data()
                if (userData.status === 'aprobado') {
                  this.user = { uid: user.uid, email: user.email, ...userData } as User
                  console.log('🔐 Usuario aprobado, sesión establecida')
                } else {
                  console.log('🔐 Usuario no aprobado, cerrando sesión')
                  await this.signOut()
                }
              } else if (user.email === 'director@gmail.com') {
                // Crear perfil de director si no existe
                const directorData: User = {
                  uid: user.uid,
                  email: user.email,
                  role: 'Director',
                  status: 'aprobado',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
                console.log('🔐 Creando perfil de director')
                await setDoc(doc(db, 'USERS', user.uid), directorData)
                this.user = directorData
              } else {
                console.log('🔐 Usuario sin perfil y no es director, cerrando sesión')
                await this.signOut()
              }
            } catch (error) {
              console.error('🔐 Error al obtener perfil:', error)
            }
          } else {
            console.log('🔐 No hay usuario autenticado')
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
      try {
        await Promise.all([
          studentsStore.fetchStudents(),
          teachersStore.fetchTeachers(),
          classesStore.fetchClasses(),
          attendanceStore.fetchAttendance()
        ])
        this.dataInitialized = true
      } catch (error) {
        console.error('Error initializing data:', error)
        // No marcamos como inicializado para permitir reintentos
      }
    },

    /**
     * Parsea y traduce códigos de error de Firebase en mensajes amigables.
     */
    parseAuthError(error: any): string {
      const errorCode = error.code
      switch (errorCode) {
        case 'auth/invalid-email':
          return 'El correo electrónico no es válido'
        case 'auth/user-disabled':
          return 'Esta cuenta ha sido deshabilitada'
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Credenciales inválidas'
        case 'auth/email-already-in-use':
          return 'Este correo electrónico ya está registrado'
        case 'auth/weak-password':
          return 'La contraseña debe tener al menos 6 caracteres'
        case 'auth/too-many-requests':
          return 'Demasiados intentos fallidos. Por favor, intente más tarde'
        default:
          return error.message ? error.message : 'Error de autenticación'
      }
    }
  }
})
