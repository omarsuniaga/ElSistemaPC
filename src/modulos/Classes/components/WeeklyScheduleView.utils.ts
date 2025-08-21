export const timeStringToMinutes = (time?: string | null) => {
  if (!time) return null;
  const parts = String(time).split(':').map((p) => Number(p));
  if (parts.length === 0 || Number.isNaN(parts[0])) return null;
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
};

export const normalizeDayName = (day: string): string => {
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

export const formatTime = (time?: string) => {
  if (!time) return '';
  const [hours, minutes] = String(time).split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const getProgramName = (level?: string) => {
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

export const getClassColorByInstrument = (instrument?: string) => {
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

export const getClassBorderColor = (instrument?: string) => {
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

export const getStatusColor = (status?: string) => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

export const getStatusText = (status?: string) => {
  if (!status) return 'Sin estado';
  const texts: Record<string, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    suspended: 'Suspendida',
  };
  return texts[status] || 'Sin estado';
};
