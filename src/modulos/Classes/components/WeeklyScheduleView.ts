import { ref, computed, onMounted } from 'vue';
import {
  timeStringToMinutes as _timeStringToMinutes,
  normalizeDayName as _normalizeDayName,
  formatTime as _formatTime,
  getProgramName as _getProgramName,
  getClassColorByInstrument as _getClassColorByInstrument,
  getClassBorderColor as _getClassBorderColor,
  getStatusColor as _getStatusColor,
  getStatusText as _getStatusText,
} from './WeeklyScheduleView.utils';

import { useAuthStore } from '../../../stores/auth';
import { useStudentsStore } from '../../Students/store/students';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { getAppConfig, setAppConfig, type AppConfig } from '../service/appConfig';
import { useClassesStore } from '../store/classes';
import type { ClassData } from '../types/class';

// Extend Window interface for demo system
declare global {
  interface IWindow {
    demoScheduleSystem?: Record<string, unknown>
  }
}

interface IProps {
  classes?: ClassData[]
}

interface IScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export function useWeeklySchedule(props: IProps = {}) {
  const teachersStore = useTeachersStore();
  const studentsStore = useStudentsStore();
  const classesStore = useClassesStore();
  const authStore = useAuthStore();

  // Get current teacher ID from auth store
  const currentTeacherId = computed(() => authStore.user?.uid || '');

  // Reactive data
  const viewMode = ref<'week' | 'list'>('week');
  const searchTerm = ref('');
  const selectedTeacher = ref('');
  const selectedInstrument = ref('');
  const selectedProgram = ref('');
  const filterType = ref<'all' | 'owned' | 'shared-with-me' | 'shared-owned'>('all');
  const selectedClass = ref<ClassData | null>(null);
  const currentWeekStart = ref(new Date());
  const isLoading = ref(false);
  const loadingMessage = ref('Cargando datos...');

  // Permissions modal
  const showPermissionsModal = ref(false);
  const selectedClassForPermissions = ref<ClassData | null>(null);
  const tempPermissions = ref<Record<string, string[]>>({});

  // Time configuration
  const timeConfig = ref<AppConfig>({
    esTemprano: true,
    esTarde: true,
    esNoche: true,
    viewMode: 'standard',
  });

// NOTE: The SFC that includes this script must still declare props via defineProps
// and export the components used. When imported by Vue, the SFC template will
// have access to these variables because the SFC will execute this module.

// The remainder of the logic is identical to the original inline script.

  const allClasses = computed(() => {
    return props.classes || classesStore.classes || [];
  });

const teachers = computed(() => {
  return teachersStore.teachers || [];
});

const students = computed(() => {
  return studentsStore.students || [];
});

const instruments = computed(() => {
  const instrumentSet = new Set<string>();
  allClasses.value.forEach((classItem) => {
    if (classItem.instrument) {
      instrumentSet.add(classItem.instrument);
    }
  });
  return Array.from(instrumentSet).sort();
});

const filteredClasses = computed(() => {
  let classes = allClasses.value;

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    classes = classes.filter(
      (classItem) =>
        classItem.name?.toLowerCase().includes(term) ||
        classItem.instrument?.toLowerCase().includes(term) ||
        classItem.description?.toLowerCase().includes(term),
    );
  }

  // Apply teacher filter
  if (selectedTeacher.value) {
    classes = classes.filter((classItem) => classItem.teacherId === selectedTeacher.value);
  }

  // Apply instrument filter
  if (selectedInstrument.value) {
    classes = classes.filter((classItem) => classItem.instrument === selectedInstrument.value);
  }

  // Apply program filter
  if (selectedProgram.value) {
    classes = classes.filter((classItem) => classItem.level === selectedProgram.value);
  }

  // Apply shared classes filter
  if (filterType.value !== 'all') {
    switch (filterType.value) {
    case 'owned':
      classes = classes.filter((classItem) => classItem.teacherId === currentTeacherId.value);
      break;
    case 'shared-with-me':
      classes = classes.filter((classItem) => isSharedWithMe(classItem));
      break;
    case 'shared-owned':
      classes = classes.filter((classItem) => isMySharedClass(classItem));
      break;
    }
  }

  // Apply time period filters
  if (!timeConfig.value.esTemprano || !timeConfig.value.esTarde || !timeConfig.value.esNoche) {
    classes = classes.filter((classItem) => {
      const schedules = getClassSchedules(classItem);
      return schedules.some((schedule) => {
        if (!schedule.startTime) return true;

        const [hours] = schedule.startTime.split(':').map(Number);

        // Check if class falls within active time periods
        if (timeConfig.value.esTemprano && hours >= 7 && hours < 14) return true;
        if (timeConfig.value.esTarde && hours >= 14 && hours < 19) return true;
        if (timeConfig.value.esNoche && hours >= 19 && hours < 23) return true;

        return false;
      });
    });
  }

  return classes;
});

  const weekDays = computed(() => {
  const days: Array<{ key: string; name: string; date: string }> = [];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesSpanish = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  for (let i = 0; i < 6; i++) {
    const date = new Date(currentWeekStart.value);
    date.setDate(currentWeekStart.value.getDate() + i);
    const dayIndex = date.getDay();

    days.push({
      key: dayNames[dayIndex],
      name: dayNamesSpanish[dayIndex],
      date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    });
  }

  return days;
});

  const timeSlots = computed(() => {
  const slots: string[] = [];
  const startHour = 7;
  const endHour = 22;
  for (let h = startHour; h <= endHour; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`);
  }
  return slots;
});

const SLOT_HEIGHT = 80; // px per hour-row (matches CSS min-h-[80px])
const START_HOUR = 7;
const END_HOUR = 22;

  const calendarHeight = computed(() => `${timeSlots.value.length * SLOT_HEIGHT}px`);

const timeStringToMinutes = _timeStringToMinutes;

interface IClassBlock {
  classItem: ClassData;
  slot: { day: string; startTime: string; endTime: string };
  startMin: number;
  endMin: number;
  topPct: number;
  heightPct: number;
  lane?: number;
  top?: string;
  height?: string;
  left?: string;
  width?: string;
}

  const getClassBlocksForDay = (dayKey: string) => {
  const blocks: IClassBlock[] = [];
  const classes = filteredClasses.value || [];

  const totalMinutes = (END_HOUR - START_HOUR) * 60;

  // collect blocks
  for (const classItem of classes) {
    const schedules = getClassSchedules(classItem);
    for (const slot of schedules) {
      if (!slot || !slot.day) continue;
      if (normalizeDayName(slot.day) !== normalizeDayName(dayKey)) continue;
      const startMin = timeStringToMinutes(slot.startTime);
      const endMin = timeStringToMinutes(slot.endTime);
      if (startMin === null || endMin === null) continue;
      const clampedStart = Math.max(startMin, START_HOUR * 60);
      const clampedEnd = Math.min(endMin, END_HOUR * 60);
      if (clampedEnd <= clampedStart) continue;

      const minutesFromStart = clampedStart - START_HOUR * 60;
      const duration = clampedEnd - clampedStart;

      const topPct = (minutesFromStart / totalMinutes) * 100;
      const heightPct = (duration / totalMinutes) * 100;

      blocks.push({ classItem, slot, startMin: clampedStart, endMin: clampedEnd, topPct, heightPct });
    }
  }

  // assign lanes to avoid full overlap (simple greedy algorithm)
  blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const lanes: IClassBlock[][] = [];
  for (const b of blocks) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const last = lane[lane.length - 1];
      if (!last || last.endMin <= b.startMin) {
        lane.push(b);
        b.lane = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([b]);
      b.lane = lanes.length - 1;
    }
  }

  const laneCount = Math.max(1, lanes.length);
  // compute left/width per block
  for (const b of blocks) {
    const laneIdx = b.lane || 0;
    const gapPct = 2; // small gap between lanes in percent
    const widthPerLane = (100 - gapPct * (laneCount - 1)) / laneCount;
    const left = laneIdx * (widthPerLane + gapPct);
    b.top = `${b.topPct}%`;
    b.height = `${b.heightPct}%`;
    b.left = `${left}%`;
    b.width = `${widthPerLane}%`;
  }

  return blocks;
  };

  const isMySharedClass = (classItem: ClassData): boolean => {
  if (!classItem.teachers || !Array.isArray(classItem.teachers)) return false;

  return classItem.teacherId === currentTeacherId.value && classItem.teachers.length > 1;
  };

  const canManagePermissions = (classItem: ClassData): boolean => {
  if (classItem.teacherId === currentTeacherId.value) return true;

  const myPermissions = getMyPermissions(classItem);
  return myPermissions.includes('manage');
  };

  const getMyPermissions = (classItem: ClassData): string[] => {
  if (!classItem.permissions || typeof classItem.permissions !== 'object') return ['read'];

  return classItem.permissions[currentTeacherId.value] || ['read'];
  };

  const getTeacherPermissions = (classItem: ClassData | null, teacherId: string): string[] => {
  if (!classItem?.permissions || typeof classItem.permissions !== 'object') return ['read'];

  return classItem.permissions[teacherId] || ['read'];
  };

  const getPermissionText = (permissions: string[]): string => {
  if (!permissions || permissions.length === 0) return 'Sin permisos';

  if (permissions.includes('manage')) return 'Administrador';
  if (permissions.includes('write')) return 'Editor';
  if (permissions.includes('read')) return 'Solo lectura';

  return 'Permisos personalizados';
  };

  const getPermissionLevel = (classItem: ClassData | null, teacherId: string): string => {
  const permissions = getTeacherPermissions(classItem, teacherId);

  if (permissions.includes('manage')) return 'manage';
  if (permissions.includes('write')) return 'write';
  return 'read';
  };

  const getSharedTeachers = (classItem: ClassData | null) => {
  if (!classItem?.teachers || !Array.isArray(classItem.teachers)) return [];

  return classItem.teachers
    .filter((teacherItem) => {
      const teacherId = typeof teacherItem === 'string' ? teacherItem : teacherItem.teacherId;
      return teacherId !== classItem.teacherId; // Exclude the owner
    })
    .map((teacherItem) => {
      const teacherId = typeof teacherItem === 'string' ? teacherItem : teacherItem.teacherId;
      const teacher = teachers.value?.find((t) => t.id === teacherId);
      return {
        id: teacherId,
        name: teacher?.name || `Maestro ${teacherId}`,
      };
    });
  };

  const isSharedWithMe = (classItem: ClassData): boolean => {
  if (!classItem) return false;
  if (!classItem.teachers || !Array.isArray(classItem.teachers)) return false;

  const teacherIds = classItem.teachers.map((t) => (typeof t === 'string' ? t : t.teacherId));
  return teacherIds.includes(currentTeacherId.value) && classItem.teacherId !== currentTeacherId.value;
  };

  const saveTimeConfig = async () => {
  try {
    await setAppConfig({
      esTemprano: !!timeConfig.value.esTemprano,
      esTarde: !!timeConfig.value.esTarde,
      esNoche: !!timeConfig.value.esNoche,
      viewMode: timeConfig.value.viewMode || 'standard',
    });
  } catch (err) {
    console.warn('No se pudo guardar la configuración de tiempo:', err);
  }
  };

  const loadTimeConfig = async () => {
  try {
    const cfg = await getAppConfig();
    timeConfig.value = { ...timeConfig.value, ...cfg };
  } catch (err) {
    console.warn('No se pudo cargar la configuración de tiempo, usando valores por defecto', err);
  }
  };

  const setCurrentWeekStart = () => {
  const now = new Date();
  const start = new Date(now);
  const day = now.getDay();
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  currentWeekStart.value = start;
  };

  const openShareModal = (classItem: ClassData) => {
  selectedClassForPermissions.value = classItem;
  tempPermissions.value = { ...(classItem.permissions || {}) };
  showPermissionsModal.value = true;
  };

  const editFormVisible = ref(false);
  // Make editForm non-nullable to simplify template bindings (avoid possibly-null warnings)
  const editForm = ref<Partial<ClassData>>({});
  const editFormErrors = ref<Record<string, string>>({});

  const validateEditForm = (): boolean => {
  editFormErrors.value = {};
  if (!editForm.value) return false;
  if (!editForm.value.name || String(editForm.value.name).trim().length === 0) {
    editFormErrors.value.name = 'El nombre es requerido';
  }
  if (!editForm.value.teacherId || String(editForm.value.teacherId).trim().length === 0) {
    editFormErrors.value.teacherId = 'Seleccione un maestro';
  }

  return Object.keys(editFormErrors.value).length === 0;
  };

  const saveClassEdits = async () => {
  if (!editForm.value) return;
  if (!validateEditForm()) return;

  try {
    isLoading.value = true;
    loadingMessage.value = 'Guardando clase...';

    const payload: any = { ...editForm.value };
    if (payload.schedule && !('slots' in payload.schedule)) {
      payload.schedule = { slots: payload.schedule.slots || [] };
    }

    if (!payload.id) throw new Error('ID de clase ausente');

    payload.updatedAt = new Date();

    await classesStore.updateClass(payload as any);

    cancelEdit();
    await refreshData();
  } catch (err) {
    console.error('Error guardando cambios de clase:', err);
    editFormErrors.value.general = (err as any)?.message || String(err);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
  };

  const editClass = (classItem: ClassData) => openEditModal(classItem);

  const handleEditFromDetails = () => {
  if (!selectedClass.value) return;
  openEditModal(selectedClass.value);
  closeClassDetails();
  };

  const closePermissionsModal = () => {
  showPermissionsModal.value = false;
  selectedClassForPermissions.value = null;
  tempPermissions.value = {};
  };

  const updatePermission = (teacherId: string, level: string) => {
  switch (level) {
  case 'read':
    tempPermissions.value[teacherId] = ['read'];
    break;
  case 'write':
    tempPermissions.value[teacherId] = ['read', 'write'];
    break;
  case 'manage':
    tempPermissions.value[teacherId] = ['read', 'write', 'manage'];
    break;
  default:
    tempPermissions.value[teacherId] = ['read'];
  }
  };

  const savePermissions = async () => {
  if (!selectedClassForPermissions.value) return;

  try {
    isLoading.value = true;
    loadingMessage.value = 'Guardando permisos...';

    const updatedClass = {
      ...selectedClassForPermissions.value,
      permissions: tempPermissions.value,
    };

    await classesStore.updateClass(updatedClass);

    closePermissionsModal();

    await refreshData();
  } catch (error) {
    console.error('Error al guardar permisos:', error);
  } finally {
    isLoading.value = false;
  }
  };

  const getWeekRange = () => {
  const endDate = new Date(currentWeekStart.value);
  endDate.setDate(currentWeekStart.value.getDate() + 5);

  const startStr = currentWeekStart.value.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  const endStr = endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return `${startStr} - ${endStr}`;
  };

  const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(currentWeekStart.value.getDate() - 7);
  currentWeekStart.value = newDate;
  };

  const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(currentWeekStart.value.getDate() + 7);
  currentWeekStart.value = newDate;
  };

  const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
  };

  const getProgramName = (level?: string) => {
  if (!level) return 'Sin programa';
  const programs: Record<string, string> = {
    preparatoria: 'Preparatoria',
    'teoria-musical': 'Teoría Musical',
    coro: 'Coro',
    orquesta: 'Orquesta',
    otros: 'Otros',
  };
  return programs[level] || level;
  };

  const getTeacherName = (teacherId?: string) => {
  if (!teacherId) return 'Sin asignar';
  const teacher = teachers.value.find((t) => t.id === teacherId);
  return teacher?.name || 'Sin asignar';
  };

  const getClassSchedules = (classItem: ClassData) => {
  if (!classItem.schedule) {
    console.log(`Clase "${classItem.name}" no tiene horario definido`);
    return [];
  }

  if ('slots' in classItem.schedule && Array.isArray(classItem.schedule.slots)) {
    return classItem.schedule.slots;
  }

  if ('day' in classItem.schedule && classItem.schedule.day) {
    const singleSlot = {
      day: classItem.schedule.day,
      startTime: classItem.schedule.startTime || '',
      endTime: classItem.schedule.endTime || '',
    };
    console.log(`Clase "${classItem.name}" tiene formato directo de horario:`, singleSlot);
    return [singleSlot];
  }

  console.log(
    `Clase "${classItem.name}" tiene horario en formato no reconocido:`,
    classItem.schedule,
  );
  return [];
  };

  const getClassesForDay = (day: string) => {
  const classes = filteredClasses.value
    .filter((classItem) => {
      const schedules = getClassSchedules(classItem);
      return schedules.some((schedule) => {
        const normalizedScheduleDay = normalizeDayName(schedule.day);
        const normalizedTargetDay = normalizeDayName(day);
        return normalizedScheduleDay === normalizedTargetDay;
      });
    })
    .sort((a, b) => {
      const aSchedule = getClassSchedules(a).find(
        (s) => normalizeDayName(s.day) === normalizeDayName(day),
      );
      const bSchedule = getClassSchedules(b).find(
        (s) => normalizeDayName(s.day) === normalizeDayName(day),
      );
      if (!aSchedule || !bSchedule) return 0;
      return aSchedule.startTime.localeCompare(bSchedule.startTime);
    });

  console.log(
    `Clases para ${day}:`,
    classes.map((c) => c.name),
  );
  return classes;
  };

  const normalizeDayName = (day: string): string => {
  const dayMapping: Record<string, string> = {
    lunes: 'monday',
    martes: 'tuesday',
    'miércoles': 'wednesday',
    miercoles: 'wednesday',
    jueves: 'thursday',
    viernes: 'friday',
    'sábado': 'saturday',
    sabado: 'saturday',
    domingo: 'sunday',
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday',
  };

  return dayMapping[day.toLowerCase()] || day.toLowerCase();
  };

  const getClassTimeRange = (classItem: ClassData) => {
  const schedules = getClassSchedules(classItem);
  if (schedules.length === 0) return '';
  const schedule = schedules[0];
  return `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
  };

  // Open / close class details (used by template)
  const openClassDetails = (classItem: ClassData) => {
    selectedClass.value = classItem;
  };

  const closeClassDetails = () => {
    selectedClass.value = null;
  };

  const resetAllFilters = async () => {
    searchTerm.value = '';
    selectedTeacher.value = '';
    selectedInstrument.value = '';
    selectedProgram.value = '';
    filterType.value = 'all';
    await refreshData();
  };

  const showAllDay = () => {
    timeConfig.value = { esTemprano: true, esTarde: true, esNoche: true, viewMode: 'standard' } as AppConfig;
  };

  const getClassColorByInstrument = (instrument?: string) => {
  if (!instrument) return 'bg-gray-500 text-white';
  const colors: Record<string, string> = {
    Piano: 'bg-blue-500 text-white',
    Guitarra: 'bg-green-500 text-white',
    Violín: 'bg-purple-500 text-white',
    Flauta: 'bg-yellow-500 text-white',
    Cello: 'bg-red-500 text-white',
    Batería: 'bg-gray-700 text-white',
    Canto: 'bg-pink-500 text-white',
  };
  return colors[instrument] || 'bg-indigo-500 text-white';
  };

  const getClassBorderColor = (instrument?: string) => {
  if (!instrument) return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  const colors: Record<string, string> = {
    Piano: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    Guitarra: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    Violín: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    Flauta: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    Cello: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    Batería: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
    Canto: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
  };
  return colors[instrument] || 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
  };

  const getStatusColor = (status?: string) => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getStatusText = (status?: string) => {
  if (!status) return 'Sin estado';
  const texts: Record<string, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    suspended: 'Suspendida',
  };
  return texts[status] || 'Sin estado';
  };

  const openEditModal = (classItem: ClassData) => {
    editForm.value = JSON.parse(JSON.stringify(classItem));
    if (!editForm.value.schedule) editForm.value.schedule = { slots: [] } as unknown as { slots: IScheduleSlot[] };
    if (!('slots' in (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }))) {
      (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }) = { slots: [] };
    }
    editFormVisible.value = true;
  };

  const cancelEdit = () => {
    editFormVisible.value = false;
    editForm.value = {};
  };

  const ensureFirstSlot = () => {
    if (!editForm.value.schedule) editForm.value.schedule = { slots: [] } as unknown as { slots: IScheduleSlot[] };
    if (!('slots' in (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }))) {
      (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }) = { slots: [] };
    }
    const slots = (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }).slots;
    if (!slots || slots.length === 0) {
      (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }).slots.push({ day: 'monday', startTime: '', endTime: '' });
    }
    return (editForm.value.schedule as unknown as { slots: IScheduleSlot[] }).slots[0];
  };

  const firstSlotDay = computed<string>({
    get() {
      const slot = ensureFirstSlot();
      return slot ? slot.day || 'monday' : 'monday';
    },
    set(val: string) {
      const slot = ensureFirstSlot();
      if (slot) slot.day = val;
    },
  });

  const firstSlotStart = computed<string>({
    get() {
      const slot = ensureFirstSlot();
      return slot ? slot.startTime || '' : '';
    },
    set(val: string) {
      const slot = ensureFirstSlot();
      if (slot) slot.startTime = val;
    },
  });

  const firstSlotEnd = computed<string>({
    get() {
      const slot = ensureFirstSlot();
      return slot ? slot.endTime || '' : '';
    },
    set(val: string) {
      const slot = ensureFirstSlot();
      if (slot) slot.endTime = val;
    },
  });

  const exportSchedule = () => {
    console.log('Exporting schedule...');
  };

const refreshData = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Actualizando datos...';

    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
    ]);
  } catch (error) {
    console.error('Error al actualizar datos:', error);
  } finally {
    isLoading.value = false;
  }
};

  onMounted(async () => {
  setCurrentWeekStart();

  try {
    isLoading.value = true;
    loadingMessage.value = 'Cargando configuración...';

    await loadTimeConfig();

    loadingMessage.value = 'Cargando clases...';

    if (!classesStore.classes || classesStore.classes.length === 0) {
      await classesStore.fetchClasses();
    }

    loadingMessage.value = 'Cargando maestros y estudiantes...';

    await Promise.all([teachersStore.fetchTeachers(), studentsStore.fetchStudents()]);

    console.log('WeeklyScheduleView mounted with', allClasses.value.length, 'classes');
    console.log('Current teacher ID:', currentTeacherId.value);

    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        // debugClasses();
        loadDemoData();
      }, 1000);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    isLoading.value = false;
  }
  });

  const loadDemoData = () => {
  try {
    if ((window as any).demoScheduleSystem) {
      console.log('🎵 Sistema de demostración disponible!');
      console.log('💡 Usa runFullDemo() en consola para ver ejemplos');

      if (allClasses.value.length === 0) {
        console.log('📝 No hay clases - considera usar createLocalStorageData() para pruebas');
      }
    }
  } catch (error) {
    console.log('Sistema de demo no cargado');
  }
  };

  const debugClasses = () => {
    // optional debug code
  };

  // Return the bindings the template needs
  return {
    // state
    viewMode,
    searchTerm,
    selectedTeacher,
    selectedInstrument,
    selectedProgram,
    filterType,
    selectedClass,
    currentWeekStart,
    isLoading,
    loadingMessage,
    showPermissionsModal,
    selectedClassForPermissions,
    tempPermissions,
    timeConfig,

    // computed/data
    allClasses,
    teachers: computed(() => teachersStore.teachers || []),
    students: computed(() => studentsStore.students || []),
    instruments,
    filteredClasses,
    weekDays,
    timeSlots,
    calendarHeight,

  // methods
  saveTimeConfig,
  loadTimeConfig,
  previousWeek,
  nextWeek,
  getWeekRange,
  exportSchedule,
  refreshData,
  showAllDay,
  resetAllFilters,

  // rendering helpers
    getClassBlocksForDay,
    getClassColorByInstrument,
    getTeacherName,
    getClassesForDay,
    getClassTimeRange,
    getProgramName,
    getPermissionText,
    getMyPermissions,
    canManagePermissions,
    isSharedWithMe,
    isMySharedClass,
    getSharedTeachers,
    getTeacherPermissions,
    getPermissionLevel,
    updatePermission,
    savePermissions,
  closePermissionsModal,

    // edit modal
    editFormVisible,
    editForm,
    editFormErrors,
    firstSlotDay,
    firstSlotStart,
    firstSlotEnd,
    ensureFirstSlot,
    validateEditForm,
    saveClassEdits,
    openEditModal,
    cancelEdit,
    editClass,
    handleEditFromDetails,

    // class details
    openClassDetails,
    closeClassDetails,

    // debug
    loadDemoData,
    debugClasses,
    getClassBorderColor,
    getStatusColor,
    getStatusText,
  };
}
