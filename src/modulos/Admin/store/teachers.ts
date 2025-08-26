import { defineStore } from 'pinia';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../stores/auth'; // Importar el store de autenticación

interface Teacher {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  specialties?: string[];
  status: 'active' | 'inactive' | 'pending'; // Cambiado de 'activo' a 'status'
  createdAt: Date;
  [key: string]: any; // Para propiedades adicionales
}

export const useAdminTeachersStore = defineStore('adminTeachers', {
  state: () => ({
    teachers: [] as Teacher[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    // ... (getters existentes)
  },

  actions: {
    async loadTeachers() {
      this.isLoading = true;
      try {
        // Use singular role 'maestro' to match how new users are created below
        const teacherRoles = ['maestro', 'administrador', 'director'];
        const q = query(collection(db, 'USERS'), where('role', 'in', teacherRoles));
        const querySnapshot = await getDocs(q);
        const fetchedTeachers = querySnapshot.docs.map((snap) => {
          const data: any = snap.data();
          // Support both 'isActive' and legacy 'activo' fields
          const isActive = (data.isActive ?? data.activo) as boolean | undefined;

          // Normalize createdAt: Timestamp (has toDate), ISO string, number or missing
          let createdAt: Date;
          const rawCreated = data.createdAt;
          if (rawCreated && typeof rawCreated.toDate === 'function') {
            createdAt = rawCreated.toDate();
          } else if (typeof rawCreated === 'string' || typeof rawCreated === 'number') {
            createdAt = new Date(rawCreated as any);
          } else {
            createdAt = new Date();
          }

          return {
            id: snap.id,
            uid: snap.id, // El UID del usuario es el ID del documento en la colección USERS
            ...data,
            status: isActive ? 'active' : 'inactive', // Mapear a 'status'
            createdAt,
          } as Teacher;
        }) as Teacher[];
        console.log('🔍 [TeachersStore] Consulta realizada en colección USERS');
        console.log('📊 [TeachersStore] Roles buscados:', teacherRoles);
        console.log('👥 [TeachersStore] Maestros encontrados:', fetchedTeachers.length);
        console.log('📋 [TeachersStore] Datos de maestros:', fetchedTeachers);
        this.teachers = fetchedTeachers as Teacher[];
      } catch (error: any) {
        this.error = error.message;
        console.error('Error loading teachers:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async addTeacher(teacherData: {
      nombre: string;
      apellido: string;
      email: string;
      password: string;
      telefono?: string;
      especialidades?: string[];
      activo: boolean; // Todavía recibimos 'activo' del modal
    }) {
      this.isLoading = true;
      this.error = null;
      const authStore = useAuthStore();

      try {
        const fullName = `${teacherData.nombre} ${teacherData.apellido}`.trim();
        const userData = {
          name: fullName,
          email: teacherData.email,
          phone: teacherData.telefono || '',
          specialties: teacherData.especialidades || [],
          status: teacherData.activo ? 'active' : 'inactive', // Mapear 'activo' a 'status' para Firestore
          role: 'maestro', // Asignar el rol de maestro
        };

        // Registrar el usuario en Firebase Auth y Firestore (colección USERS)
        const newUser = await authStore.registerUser(
          teacherData.email,
          teacherData.password,
          userData,
        );

        if (newUser) {
          // Create a USERS document for the new user in Firestore so queries will find it
          try {
            await setDoc(doc(db, 'USERS', newUser.uid), {
              ...userData,
              role: 'maestro',
              createdAt: serverTimestamp(),
            });
          } catch (fireErr) {
            console.warn('Warning: could not write USERS document for new teacher:', fireErr);
          }

          // Añadir el nuevo maestro al estado del store (optimistic)
          this.teachers.push({
            id: newUser.uid,
            uid: newUser.uid,
            name: fullName,
            email: teacherData.email,
            phone: teacherData.telefono || '',
            specialties: teacherData.especialidades || [],
            status: teacherData.activo ? 'active' : 'inactive', // Mapear 'activo' a 'status' para el estado local
            createdAt: new Date(), // O el timestamp real de Firestore si se devuelve
          });
        } else {
          throw new Error('No se pudo crear el usuario maestro.');
        }
      } catch (error: any) {
        this.error = error.message;
        console.error('Error adding teacher:', error);
        throw error; // Re-lanzar el error para que la vista lo maneje
      } finally {
        this.isLoading = false;
      }
    },

    async updateTeacher(id: string, updates: Partial<Teacher>) {
      this.isLoading = true;
      this.error = null;
      try {
        // Asumiendo que tienes un servicio para actualizar usuarios en la colección USERS
        // Por ahora, solo actualizamos el estado local
        const index = this.teachers.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.teachers[index] = { ...this.teachers[index], ...updates };
        }
        // TODO: Implementar la actualización en Firestore para la colección USERS
      } catch (error: any) {
        this.error = error.message;
        console.error('Error updating teacher:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async deleteTeacher(id: string) {
      this.isLoading = true;
      this.error = null;
      try {
        // Asumiendo que tienes un servicio para eliminar usuarios de la colección USERS
        // y de Firebase Auth si es necesario
        this.teachers = this.teachers.filter((t) => t.id !== id);
        // TODO: Implementar la eliminación en Firestore y Firebase Auth
      } catch (error: any) {
        this.error = error.message;
        console.error('Error deleting teacher:', error);
      } finally {
        this.isLoading = false;
      }
    },

    exportTeachers(teachersToExport: Teacher[]) {
      try {
        const headers = ['ID', 'UID', 'Nombre', 'Email', 'Teléfono', 'Especialidades', 'Estado', 'Fecha de Creación']; // Actualizado 'Activo' a 'Estado'
        const rows = teachersToExport.map((teacher) => [
          teacher.id,
          teacher.uid,
          teacher.name,
          teacher.email,
          teacher.phone || '',
          (teacher.specialties || []).join('; '),
          teacher.status, // Usar 'status'
          teacher.createdAt ? teacher.createdAt.toISOString() : '',
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach((row) => {
          csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = `teachers-${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error exporting teachers:', err);
      }
    },
  },
});

