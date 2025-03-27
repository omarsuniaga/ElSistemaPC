import { defineStore } from 'pinia'
import { auth, db } from '../firebase'
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword, signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useTeachersStore } from '../modulos/Classes/store/teachers'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'

interface User {
  uid: string
  email: string | null
  role?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

// Variable para controlar las llamadas al checkAuth
let authCheckPromise: Promise<any> | null = null;

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
    isLoggedIn: (state) => !!state.user,
    isDirector: (state) => state.user?.role === 'Director',
    isTeacher: (state) => state.user?.role === 'Maestro',
    isApproved: (state) => state.user?.status === 'aprobado',
    canManageStudents: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageAttendance: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageSchedule: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
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
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        // Primero autenticamos con Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        
        // Luego obtenemos el perfil del usuario de Firestore
        const userDocRef = doc(db, 'USERS', userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (!userDoc.exists()) {
          // Si el usuario no existe en Firestore, lo creamos con rol Director
          if (email === 'director@gmail.com') {
            const directorData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              role: 'Director',
              status: 'aprobado',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            await setDoc(userDocRef, directorData)
            this.user = directorData
            
            // Mostrar notificación para director
            this.notifications.push({
              message: '¡Bienvenido Director! Has iniciado sesión exitosamente.',
              type: 'success'
            });
            
            return {
              user: this.user,
              redirectTo: '/',
              showNotification: true
            }
          } else {
            throw new Error('No se encontró el perfil del usuario')
          }
        } else {
          const userData = userDoc.data()
          
          // Creamos el objeto de usuario con los datos completos
          this.user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userData
          }
          
          // Verificamos si el usuario está pendiente de completar perfil
          if (userData.status === 'pendiente' && !userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: '/complete-profile',
              message: 'Por favor, completa tu perfil para continuar'
            }
          }
          
          // Verificamos si el usuario está pendiente de aprobación
          if (userData.status === 'pendiente' && userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: '/pending-approval',
              message: 'Tu cuenta está pendiente de aprobación'
            }
          }
          
          // Verificamos si el usuario está rechazado
          if (userData.status === 'rechazado') {
            throw new Error('Tu solicitud de acceso ha sido rechazada. Contacta al administrador para más información.')
          }
          
          // Verificamos si el usuario está aprobado
          if (userData.status !== 'aprobado') {
            throw new Error('Tu cuenta está pendiente de aprobación')
          }

          // Mostrar notificación para roles administrativos
          if (['Director', 'Admin'].includes(userData.role)) {
            this.notifications.push({
              message: `¡Bienvenido ${userData.role}! Has iniciado sesión exitosamente.`,
              type: 'success'
            });
          }

          // Actualizar último login
          await setDoc(userDocRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true })

          // Inicializar datos después del login exitoso
          await this.initializeData()

          // Retornar respuesta según el rol del usuario
          const isAdmin = ['Director', 'Admin'].includes(userData.role)
          return {
            user: this.user,
            redirectTo: '/',
            showNotification: isAdmin
          }
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },
    //cerrar sesion
    async signOut() {
      try {
        await firebaseSignOut(auth)
        this.user = null
        this.dataInitialized = false
    
        // Limpiar el caché al cerrar sesión
        const studentsStore = useStudentsStore()
        // const teachersStore = useTeachersStore()
        const classesStore = useClassesStore()
        const attendanceStore = useAttendanceStore()
        await Promise.all([
          studentsStore.$reset(),
          //teachersStore.reset(), // Se utiliza el reset personalizado
          classesStore.$reset(),
          attendanceStore.$reset()
        ])
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error)
        throw error
      }
    },    

    async register(email: string, password: string, userData?: Record<string, any>) {
      this.isLoading = true
      this.error = null

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Crear el perfil del usuario en Firestore con datos adicionales
        await setDoc(doc(db, 'USERS', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData?.name || '',
          phone: userData?.phone || '',
          role: userData?.role || 'Maestro', // Por defecto se registra como maestro
          status: 'pendiente', // Estado pendiente hasta aprobación
          profileCompleted: false, // Indica que el perfil no está completo
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

    async checkAuth() {
      console.log('🔐 checkAuth llamado, estado de inicialización:', this.isInitialized)
      
      // Si ya hay una promesa pendiente, retornar esa
      if (authCheckPromise) {
        console.log('🔐 Reutilizando promesa de checkAuth existente')
        return authCheckPromise
      }
      
      // Si ya está inicializado, simplemente devolver el usuario actual
      if (this.isInitialized) {
        console.log('🔐 Auth ya inicializado, devolviendo estado actual')
        return Promise.resolve(this.user)
      }
      
      console.log('🔐 Iniciando nueva verificación de autenticación')
      
      // Crear una nueva promesa para la verificación
      authCheckPromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log(`🔐 Estado de autenticación de Firebase: ${user ? 'autenticado' : 'no autenticado'}`)
          
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, 'USERS', user.uid))
              console.log(`🔐 Perfil de usuario encontrado: ${userDoc.exists() ? 'sí' : 'no'}`)
              
              if (userDoc.exists()) {
                const userData = userDoc.data()
                if (userData.status === 'aprobado') {
                  this.user = {
                    uid: user.uid,
                    email: user.email,
                    ...userData
                  }
                  console.log('🔐 Usuario aprobado, sesión establecida')
                } else {
                  console.log('🔐 Usuario no aprobado, cerrando sesión')
                  await this.signOut()
                }
              } else if (user.email === 'director@gmail.com') {
                // Crear perfil de director si no existe
                const directorData = {
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
          
          // Marcar como inicializado y limpiar la promesa
          this.isInitialized = true
          unsubscribe()
          authCheckPromise = null
          resolve(this.user)
        })
      })
      
      // Si el usuario está autenticado, inicializar datos
      if (this.user && !this.dataInitialized) {
        await this.initializeData()
      }
      
      return authCheckPromise
    },

    async initializeData() {
      if (this.dataInitialized) return

      const studentsStore = useStudentsStore()
      const teachersStore = useTeachersStore()
      const classesStore = useClassesStore()
      const attendanceStore = useAttendanceStore()

      try {
        // Cargar datos en paralelo usando los métodos correctos
        await Promise.all([
          studentsStore.fetchStudents(),
          teachersStore.fetchTeachers(),
          classesStore.fetchClasses(),
          attendanceStore.fetchAttendance()
        ])

        this.dataInitialized = true
      } catch (error) {
        console.error('Error initializing data:', error)
        // No marcamos como inicializado para que se pueda reintentar
      }
    },

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
          if (error.message) {
            return error.message
          }
          return 'Error de autenticación'
      }
    }
  }
})