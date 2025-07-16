// Utilidades comunes del sistema musical

// Formateo de fechas
export const formatDate = (date: Date | string | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string => {
  if (!date) return 'N/A'; // Handle null or undefined dates

  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else if (typeof (date as any).toDate === 'function') { // Handle Firebase Timestamp
    d = (date as any).toDate();
  } else {
    return 'N/A'; // Invalid date type
  }

  if (isNaN(d.getTime())) return 'N/A'; // Handle invalid date objects

  if (format === 'time') {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  if (format === 'long') {
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Ensure leading zeros for day and month
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Validación de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generación de IDs únicos
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Capitalizar primera letra
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Formatear nombres completos
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

// Calcular porcentaje
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Formatear puntuación
export const formatScore = (score: number, maxScore: number = 100): string => {
  const percentage = calculatePercentage(score, maxScore);
  return `${score}/${maxScore} (${percentage}%)`;
};

// Obtener color por puntuación
export const getScoreColor = (score: number, maxScore: number = 100): string => {
  const percentage = calculatePercentage(score, maxScore);
  
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 80) return 'text-blue-600';
  if (percentage >= 70) return 'text-yellow-600';
  if (percentage >= 60) return 'text-orange-600';
  return 'text-red-600';
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Validar rango de puntuación
export const isValidScore = (score: number, min: number = 0, max: number = 100): boolean => {
  return score >= min && score <= max && !isNaN(score);
};

// Formatear duración en minutos
export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return '0min';
  }
  
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

// Copiar al portapapeles
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Obtener iniciales de un nombre
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};
