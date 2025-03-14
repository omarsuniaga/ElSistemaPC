import { defineStore } from 'pinia'
import { auth, db } from '../firebase'
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface User {
  uid: string
  email: string | null
  role?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
    isInitialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isDirector: (state) => state.user?.role === 'Director',
    isTeacher: (state) => state.user?.role === 'Maestro',
    isApproved: (state) => state.user?.status === 'aprobado',
    canManageStudents: (state) => ['Director', 'Maestro'].includes(state.user?.role || '')
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
          } else {
            throw new Error('No se encontró el perfil del usuario')
          }
        } else {
          const userData = userDoc.data()
          
          // Verificamos si el usuario está aprobado
          if (userData.status !== 'aprobado') {
            throw new Error('Tu cuenta está pendiente de aprobación')
          }

          this.user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userData
          }

          // Actualizar último login
          await setDoc(userDocRef, {
            updatedAt: new Date().toISOString()
          }, { merge: true })
        }

        return this.user
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, password: string) {
      this.isLoading = true
      this.error = null

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Crear el perfil del usuario en Firestore
        await setDoc(doc(db, 'USERS', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: 'Maestro', // Por defecto se registra como maestro
          status: 'pendiente', // Estado pendiente hasta aprobación
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        return {
          message: 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
          user: userCredential.user
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error)
        throw new Error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    async signOut() {
      try {
        await firebaseSignOut(auth)
        this.user = null
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error)
        throw error
      }
    },

    async checkAuth() {
      if (!this.isInitialized) {
        this.isInitialized = true
        
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              try {
                const userDoc = await getDoc(doc(db, 'USERS', user.uid))
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  if (userData.status === 'aprobado') {
                    this.user = {
                      uid: user.uid,
                      email: user.email,
                      ...userData
                    }
                  } else {
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
                  await setDoc(doc(db, 'USERS', user.uid), directorData)
                  this.user = directorData
                }
              } catch (error) {
                console.error('Error al obtener perfil:', error)
              }
            } else {
              this.user = null
            }
            unsubscribe()
            resolve(this.user)
          })
        })
      }
      
      return this.user
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