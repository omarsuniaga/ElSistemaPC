# Prompt de Refactorización del Módulo de Asistencia

**Objetivo:** Refactorizar integralmente el módulo `attendance` para alinearlo con la Arquitectura Limpia, el patrón de diseño MVC y las reglas de oro del proyecto.

**Agente Encargado:** Agente de Desarrollo AI

---

## Tarea 1: Limpieza de Archivos Obsoletos

**Acción:** Eliminar los siguientes archivos y directorios. Representan código muerto de intentos de refactorización anteriores y añaden confusión.

**Archivos a Eliminar:**
- `src/modulos/Attendance/views/AttendanceViewOptimized.vue`
- `src/modulos/Attendance/components/AttendanceCalendarOptimized.vue`
- `src/modulos/Attendance/components/AttendanceList.new.vue`
- `src/modulos/Attendance/components/AttendanceListOptimized.vue`
- `src/modulos/Attendance/composables/useAttendanceOptimized.ts`
- `src/modulos/Attendance/service/attendance.ts.backup`
- `src/views/AttendanceView.fixed.vue`
- ... (y cualquier otro archivo con sufijos `.new`, `.temp`, `.optimized`, `.fixed`, `.backup`)

---

## Tarea 2: Creación y Consolidación de la Capa de Servicios

**Acción:** Crear los siguientes archivos de servicio y mover la lógica de acceso a Firestore a ellos.

### 2.1. Servicio de Clases
**Archivo a Crear:** `src/services/classesService.ts`
**Contenido:**
```typescript
// src/services/classesService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "CLASES";

// Mover toda la lógica de Firestore de 'stores/classes.ts' aquí
export const fetchClassesFromDB = async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addClassToDB = async (classData) => {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const newClass = { ...classData, id: newDocRef.id };
    await setDoc(newDocRef, newClass);
    return newClass;
};

// ... (addClass, updateClass, deleteClass, etc.)
```

### 2.2. Servicio de Estudiantes
**Archivo a Crear:** `src/services/studentsService.ts`
**Contenido:**
```typescript
// src/services/studentsService.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "ESTUDIANTES";

// Mover toda la lógica de Firestore de 'stores/students.ts' aquí
export const fetchStudentsFromDB = async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ... (addStudent, updateStudent, deleteStudent, etc.)
```

### 2.3. Servicio de Horarios
**Archivo a Crear:** `src/services/schedulesService.ts`
**Contenido:**
```typescript
// src/services/schedulesService.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "SCHEDULES";

// Mover toda la lógica de Firestore de 'stores/schedules.ts' aquí
export const fetchSchedulesFromDB = async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ... (addSchedule, updateSchedule, deleteSchedule, etc.)
```

---

## Tarea 3: Refactorización de Stores

**Acción:** Modificar los stores para que utilicen la nueva capa de servicios.

### 3.1. Store de Clases
**Archivo a Modificar:** `src/stores/classes.ts`
**Cambio:**
```typescript
// ANTES
// import { collection, getDocs } from "firebase/firestore";

// DESPUÉS
import { fetchClassesFromDB, addClassToDB } from "../services/classesService";

// ... en las actions
async fetchClasses() {
    this.loading = true;
    this.classes = await fetchClassesFromDB();
    this.loading = false;
}

async addClass(classData) {
    this.loading = true;
    const newClass = await addClassToDB(classData);
    this.classes.push(newClass);
    this.loading = false;
}
// ... (modificar el resto de actions)
```

### 3.2. Store de Estudiantes y Horarios
**Acción:** Aplicar el mismo patrón de refactorización a `src/stores/students.ts` y `src/stores/schedules.ts`, haciendo que llamen a sus respectivos servicios.

---

## Tarea 4: Creación del Composable Orquestador

**Acción:** Crear el composable que centralizará toda la lógica de negocio del módulo.

**Archivo a Crear:** `src/modulos/Attendance/composables/useAttendance.ts`
**Contenido:**
```typescript
// src/modulos/Attendance/composables/useAttendance.ts
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useClassesStore } from '../../../stores/classes';
import { useStudentsStore } from '../../../stores/students';
import { useAttendanceStore } from '../store/attendance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export function useAttendance() {
    // 1. STORES
    const route = useRoute();
    const classesStore = useClassesStore();
    const studentsStore = useStudentsStore();
    const attendanceStore = useAttendanceStore();

    // 2. ESTADO REACTIVO
    const isLoading = ref(false);
    const currentMonth = ref(new Date());
    const selectedDate = ref(null);
    
    // 3. ESTADO COMPUTADO (DERIVADO)
    const calendarDays = computed(() => {
        // Lógica para generar los días del calendario...
        // Combina clases del classesStore con registros del attendanceStore
        // para determinar el estado de cada día ('complete', 'partial', 'scheduled', 'none').
        return []; // Placeholder
    });

    const attendanceList = computed(() => {
        // Lógica para obtener la lista de estudiantes de la clase seleccionada
        // y cruzarla con los registros de asistencia para esa fecha.
        return []; // Placeholder
    });

    // 4. FUNCIONES (ACCIONES)
    function changeMonth(direction) {
        // Lógica para cambiar de mes
    }

    async function selectDateAndPrepareModal(date) {
        // Lógica para seleccionar una fecha, obtener las clases de ese día
        // y preparar los datos para el modal.
    }

    async function updateStudentStatus(studentId, status) {
        // Lógica para actualizar el estado de un estudiante.
        // Llama a una acción en attendanceStore.
    }

    async function saveAttendance() {
        // Lógica para guardar todos los cambios pendientes.
        // Llama a una acción en attendanceStore.
    }

    // 5. LIFECYCLE HOOKS
    onMounted(async () => {
        isLoading.value = true;
        await Promise.all([
            classesStore.fetchClasses(),
            studentsStore.fetchStudents(),
            attendanceStore.fetchAttendanceDocuments()
        ]);
        isLoading.value = false;
    });

    // 6. API PÚBLICA DEL COMPOSABLE
    return {
        isLoading,
        calendarDays,
        attendanceList,
        changeMonth,
        selectDateAndPrepareModal,
        updateStudentStatus,
        saveAttendance
    };
}
```

---

## Tarea 5: Refactorización de Vistas

### 5.1. Vista del Calendario
**Archivo a Modificar:** `src/modulos/Attendance/views/ProfessionalCalendarView.vue`
**Acción:** Reemplazar todo el contenido del `<script setup>` y la lógica del `<template>` para usar el nuevo composable.

**Contenido del Script:**
```vue
<script setup>
import { useAttendance } from '../composables/useAttendance';

const { isLoading, calendarDays, changeMonth, selectDateAndPrepareModal } = useAttendance();
</script>
```
**Lógica del Template:**
- El `v-for` del calendario ahora itera sobre `calendarDays`.
- Los botones de navegación llaman a `changeMonth('prev')` y `changeMonth('next')`.
- El `@click` de cada día llama a `selectDateAndPrepareModal(day.date)`.
- El modal de clases del día se alimenta de datos preparados por el composable.

### 5.2. Vista de la Lista de Asistencia
**Archivo a Modificar:** `src/modulos/Attendance/views/AttendanceList.vue` (o el nombre que corresponda a la ruta `TeacherAttendanceDetail`).
**Acción:** Reemplazar completamente el archivo.

**Contenido del Script:**
```vue
<script setup>
import { useAttendance } from '../composables/useAttendance';

// El composable se encargará de leer los params de la ruta internamente
const { isLoading, attendanceList, updateStudentStatus, saveAttendance } = useAttendance();
</script>
```
**Lógica del Template:**
- El `v-for` de la tabla de estudiantes ahora itera sobre `attendanceList`.
- Los botones de estado (`Presente`, `Ausente`, etc.) llaman a `updateStudentStatus(student.id, 'Presente')`.
- El botón de guardar principal llama a `saveAttendance()`.
- Eliminar toda la lógica de fetching, props complejas y estado local. El componente se vuelve puramente presentacional.

---

**Verificación Final:** Una vez completados todos los pasos, ejecutar los comandos de linting y build del proyecto para asegurar que no se han introducido errores.
