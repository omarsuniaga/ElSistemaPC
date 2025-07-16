import { defineStore } from 'pinia';
import { auth, db } from '@/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getThemePreference } from '@/modulos/Users/service/userPreferences';

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
  type: 'success' | 'error' | 'info'
}

// Variable para controlar las llamadas concurrentes al checkAuth
let authCheckPromise: Promise<any> | null = null;

export const useAuthStore = defineStore('auth', {
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
    isLoggedIn: (state) => !!state.user,
    // Computed properties para roles
    isDirector: (state) => state.user?.role === 'Director',
    isTeacher: (state) => state.user?.role === 'Maestro',
    isAdmin: (state) => state.user?.role === 'Admin',
    isSuperusuario: (state) => state.user?.role === 'Superusuario',
    // Retorna true si el usuario está aprobado
    isApproved: (state) => state.user?.status === 'aprobado',
    // Permisos para gestionar módulos
    canManageStudents: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageAttendance: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    canManageSchedule: (state) => ['Director', 'Maestro'].includes(state.user?.role || ''),
    // Función para validar acceso a módulos específicos
    canAccessModule: (state) => (moduleName: string) => {
      const roleModules = {
        Maestro: ['teacher', 'attendance', 'schedule', 'students', 'montaje'],
        Director: [
          'home',
          'attendance',
          'schedule',
          'students',
          'classes',
          'reports',
          'teachers',
          'profile',
        ],
        Admin: ['home', 'attendance', 'students', 'profile'],
        Superusuario: [
          'home',
          'superusuario',
          'system',
          'audit',
          'backup',
          'permissions',
          'users',
          'roles',
        ],
      };
      return (
        state.user?.role &&
        roleModules[state.user.role as keyof typeof roleModules]?.includes(moduleName)
      );
    },
  },

  actions: {
    /**
     * Inicia sesión autenticando al usuario y obteniendo su perfil desde Firestore.
     */
    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'USERS', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('No se encontró el perfil del usuario');
        } else {
          const userData = userDoc.data();
          this.user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userData,
          } as User;

          // Redirigir según el estado del perfil
          if (userData.status === 'pendiente' && !userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: '/complete-profile',
              message: 'Por favor, completa tu perfil para continuar',
            };
          }
          if (userData.status === 'pendiente' && userData.profileCompleted) {
            return {
              user: this.user,
              redirectTo: '/pending-approval',
              message: 'Tu cuenta está pendiente de aprobación',
            };
          }
          if (userData.status === 'rechazado') {
            throw new Error(
              'Tu solicitud de acceso ha sido rechazada. Contacta al administrador para más información.',
            );
          }
          if (userData.status !== 'aprobado') {
            throw new Error('Tu cuenta está pendiente de aprobación');
          }

          // Notificar a roles administrativos
          if (['Director', 'Admin'].includes(userData.role)) {
            this.notifications.push({
              message: `¡Bienvenido ${userData.role}! Has iniciado sesión exitosamente.`,
              type: 'success',
            });
          }

          // Actualizar el último login en Firestore
          await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });

          // Crear notificación de login para profesores
          if (userData.role === 'Maestro') {
            this.createTeacherLoginNotification(userCredential.user.uid);
          }

          // Inicializar datos de otros módulos
          await this.initializeData();

          // Inicializar sistema de notificaciones para roles administrativos
          if (['Director', 'Admin', 'Superusuario'].includes(userData.role)) {
            this.initializeAttendanceNotifications();
          }

          // Determinar redirección según el rol
          let redirectTo = '/';
          if (userData.role === 'Superusuario') {
            redirectTo = '/superusuario/dashboard';
          } else if (userData.role === 'Maestro') {
            redirectTo = '/teacher';
          } else if (['Director', 'Admin'].includes(userData.role)) {
            redirectTo = '/dashboard';
          }

          const isAdmin = ['Director', 'Admin', 'Superusuario'].includes(userData.role);
          return { user: this.user, redirectTo, showNotification: isAdmin };
        }
      } catch (error: any) {
        this.error = this.parseAuthError(error);
        throw new Error(this.error || 'Error de autenticación');
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Cierra la sesión del usuario.
     */
    async signOut() {
      try {
        await firebaseSignOut(auth);
        this.user = null;
        this.dataInitialized = false;

        // Reinicia otros stores con importaciones dinámicas
        try {
          const { useStudentsStore } = await import('@/modulos/Students/store/students');
          const studentsStore = useStudentsStore();
          if (studentsStore.$reset) {
            studentsStore.$reset();
          }
        } catch (error) {
          console.warn('No se pudo resetear el store de students:', error);
        }

        try {
          const { useClassesStore } = await import('@/modulos/Classes/store/classes');
          const classesStore = useClassesStore();
          if (classesStore.$reset) {
            classesStore.$reset();
          }
        } catch (error) {
          console.warn('No se pudo resetear el store de classes:', error);
        }

        try {
          const { useAttendanceStore } = await import('@/modulos/Attendance/store/attendance');
          const attendanceStore = useAttendanceStore();
          if (attendanceStore.$reset) {
            attendanceStore.$reset();
          }
        } catch (error) {
          console.warn('No se pudo resetear el store de attendance:', error);
        }
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error);
        throw error;
      }
    },

    /**
     * Registra un nuevo usuario en Firebase y crea su perfil en Firestore.
     */
    async register(email: string, password: string, userData?: Record<string, any>) {
      this.isLoading = true;
      this.error = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'USERS', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData?.name || '',
          phone: userData?.phone || '',
          role: userData?.role || 'Maestro',
          status: 'pendiente',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDark: false,
        });
        return {
          message: 'Registro exitoso. Por favor completa tu perfil para continuar.',
          user: userCredential.user,
        };
      } catch (error: any) {
        this.error = this.parseAuthError(error);
        throw new Error(this.error || 'Error de registro');
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Verifica la autenticación usando onAuthStateChanged.
     */
    async checkAuth() {
      if (authCheckPromise) {
        return authCheckPromise;
      }
      if (this.isInitialized) {
        return Promise.resolve(this.user);
      }
      authCheckPromise = new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, 'USERS', user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.status === 'aprobado') {
                  this.user = { uid: user.uid, email: user.email, ...userData } as User;
                  // Cargar preferencia de tema del usuario
                  try {
                    const themePreference = await getThemePreference(user.uid);
                    if (themePreference !== null) {
                      this.user.isDark = themePreference;
                    } else if (this.user.isDark === undefined) {
                      this.user.isDark = false;
                      await setDoc(doc(db, 'USERS', user.uid), { isDark: false }, { merge: true });
                    }
                  } catch (error) {
                    console.error('Error al cargar preferencia de tema:', error);
                  }
                } else {
                  console.error('🔐 Usuario no aprobado, cerrando sesión');
                  await this.signOut();
                }
              } else {
                console.error('🔐 Usuario sin perfil, cerrando sesión');
                await this.signOut();
              }
            } catch (error) {
              console.error('🔐 Error al obtener perfil:', error);
            }
          } else {
            this.user = null;
          }
          this.isInitialized = true;
          unsubscribe();
          authCheckPromise = null;
          resolve(this.user);
        });
      });
      
      // ✅ OPTIMIZACIÓN: Solo inicializar datos si hay usuario autenticado
      if (this.user && !this.dataInitialized) {
        console.log('🔄 [Auth] Usuario autenticado detectado, inicializando datos...');
        await this.initializeData();
      } else if (!this.user) {
        console.log('🔍 [Auth] No hay usuario autenticado, saltando inicialización de datos');
      }
      
      return authCheckPromise;
    },

    /**
     * Inicializa datos de otros módulos.
     */
    async initializeData() {
      // ✅ Verificación adicional de seguridad
      if (this.dataInitialized) {
        console.log('📊 [Auth] Datos ya inicializados, saltando...');
        return;
      }
      
      if (!this.user || !this.isLoggedIn) {
        console.log('🔒 [Auth] Usuario no autenticado, no se pueden cargar datos');
        return;
      }

      console.log('📊 [Auth] Iniciando carga de datos para usuario autenticado...');

      try {
        // Importaciones dinámicas para evitar dependencias circulares
        console.log('📦 [Auth] Importando stores de módulos...');
        const [
          { useStudentsStore },
          { useTeachersStore },
          { useClassesStore },
          { useAttendanceStore },
          { useScheduleStore },
        ] = await Promise.all([
          import('@/modulos/Students/store/students'),
          import('@/modulos/Teachers/store/teachers'),
          import('@/modulos/Classes/store/classes'),
          import('@/modulos/Attendance/store/attendance'),
          import('@/modulos/Schedules/store/schedule'),
        ]);

        console.log('🔗 [Auth] Stores importados, inicializando instancias...');
        const studentsStore = useStudentsStore();
        const teachersStore = useTeachersStore();
        const classesStore = useClassesStore();
        const attendanceStore = useAttendanceStore();
        const scheduleStore = useScheduleStore();

        console.log('🔄 [Auth] Cargando datos desde Firestore...');
        const startTime = Date.now();
        
        await Promise.all([
          studentsStore.fetchStudents(),
          teachersStore.fetchTeachers(),
          classesStore.fetchClasses(),
          attendanceStore.fetchAttendanceDocuments(),
          scheduleStore.fetchAllSchedules(),
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`✅ [Auth] Datos cargados exitosamente en ${loadTime}ms`);

        this.dataInitialized = true;
      } catch (error) {
        console.error('❌ [Auth] Error inicializando datos:', error);
        
        // Información adicional sobre el error
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            console.error(
              '🔒 [Auth] Error de permisos - Usuario puede no estar autenticado correctamente',
            );
          } else if (error.message.includes('unavailable')) {
            console.error('🌐 [Auth] Firestore no disponible - Problemas de conectividad');
          } else {
            console.error('⚠️ [Auth] Error desconocido:', error.message);
          }
        }
        
        // No marcar como inicializado si hay error
        this.dataInitialized = false;
      }
    },

    /**
     * Parsea errores de Firebase.
     */
    parseAuthError(error: any): string {
      const errorCode = error.code;
      switch (errorCode) {
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Credenciales inválidas';
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por favor, intente más tarde';
      default:
        return error.message ? error.message : 'Error de autenticación';
      }
    },

    /**
     * Inicializar sistema de notificaciones de asistencia.
     */
    async initializeAttendanceNotifications() {
      try {
        console.log('🔔 Inicializando sistema de notificaciones de asistencia...');
        
        // Inicializar de manera diferida para evitar bloquear el login
        setTimeout(async () => {
          try {
            // Usar la nueva función de inicialización diferida
            const { initializeAttendanceNotificationsAfterLogin } = await import(
              '@/services/attendanceNotifications'
            );
            
            const isReady = await initializeAttendanceNotificationsAfterLogin();
            
            if (isReady) {
              console.log('✅ Sistema de notificaciones de asistencia completamente listo');
            } else {
              console.warn('⚠️ Sistema de notificaciones funcionando con limitaciones');
            }
            
            // También inicializar el sistema legacy si es necesario
            try {
              const { default: notificationSystem } = await import(
                '@/services/attendanceNotificationManager'
              );
              await notificationSystem.initialize();
              
              if (import.meta.env.DEV) {
                ;(window as any).attendanceNotifications = notificationSystem;
                console.log(
                  '🔧 Sistema de notificaciones disponible en window.attendanceNotifications',
                );
              }
            } catch (legacyError) {
              console.warn('⚠️ Sistema legacy de notificaciones no disponible:', legacyError);
            }
          } catch (error) {
            console.error('❌ Error inicializando notificaciones de asistencia:', error);
          }
        }, 1500); // Reducido de 2000ms a 1500ms
      } catch (error) {
        console.error('❌ Error importando sistema de notificaciones:', error);
      }
    },

    /**
     * Crear notificación de login de profesor.
     */
    async createTeacherLoginNotification(teacherId: string) {
      try {
        const { createTeacherLoginNotification } = await import('@/services/adminNotificationService');
        await createTeacherLoginNotification(teacherId);
      } catch (error) {
        console.error('❌ Error creando notificación de login:', error);
      }
    },
  },
});
