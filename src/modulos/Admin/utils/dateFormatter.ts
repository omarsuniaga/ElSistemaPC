/**
 * Utility functions for date formatting in Admin module
 * Handles various date formats including Firebase Timestamps
 */

// Define a more specific type for Firestore Timestamp
interface IFirestoreTimestamp {
  toDate?: () => Date;
  seconds?: number;
  _seconds?: number;
  nanoseconds?: number;
  _nanoseconds?: number;
}

// Type guard to check if an object is a Firestore Timestamp
const isFirestoreTimestamp = (obj: unknown): obj is IFirestoreTimestamp => {
  if (obj === null || typeof obj !== 'object') return false;
  
  const timestamp = obj as IFirestoreTimestamp;
  return (
    typeof timestamp.toDate === 'function' ||
    typeof timestamp.seconds === 'number' ||
    typeof timestamp._seconds === 'number'
  );
};

// Input type for date functions
type DateInput = string | Date | number | null | undefined | IFirestoreTimestamp;

/**
 * Safely formats a date value to a localized string
 * Handles Firebase Timestamps, Date objects, strings, and numbers
 */
export const formatDate = (date: DateInput, options?: Intl.DateTimeFormatOptions): string => {
  // Handle null, undefined, empty strings, or invalid dates first
  if (!date || (typeof date === 'string' && date.trim() === '')) {
    return 'Sin fecha';
  }
  
  let dateObj: Date | null = null;
  
  try {
    // Handle Firebase Timestamp objects
    if (date && isFirestoreTimestamp(date)) {
      const timestamp = date as IFirestoreTimestamp;
      if (typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Handle Firestore Timestamp format
        dateObj = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds) {
        // Handle Firestore Timestamp format (alternative)
        dateObj = new Date(timestamp._seconds * 1000);
      }
    }
    
    // If we still don't have a date, try other formats
    if (!dateObj) {
      // Handle Date objects
      if (date instanceof Date) {
        dateObj = date;
      }
      // Handle timestamp numbers (milliseconds or seconds)
      else if (typeof date === 'number') {
        // Check if it's in seconds (Firestore timestamp) or milliseconds
        dateObj = date > 1e10 ? new Date(date) : new Date(date * 1000);
      }
      // Handle string dates
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      }
      // Handle objects with seconds property (Firebase Timestamp format)
      else if (date && isFirestoreTimestamp(date)) {
        const timestamp = date as IFirestoreTimestamp;
        if (timestamp.seconds) {
          dateObj = new Date(timestamp.seconds * 1000);
        } else if (timestamp._seconds) {
          dateObj = new Date(timestamp._seconds * 1000);
        }
      }
      else {
        console.warn('Unknown date format:', date);
        return 'Formato inválido';
      }
    }
    
    // Check if the resulting date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      console.warn('Invalid date result:', dateObj, 'from:', date);
      return 'Fecha inválida';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return dateObj.toLocaleDateString('es-ES', options || defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error, 'Original value:', date);
    return 'Error en fecha';
  }
};

/**
 * Formats a date with time
 */
export const formatDateTime = (date: DateInput): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats a date in a more compact way (MM/DD/YYYY)
 */
export const formatDateCompact = (date: DateInput): string => {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Returns a relative time string (e.g., "hace 2 horas")
 */
export const formatRelativeTime = (date: DateInput): string => {
  if (!date) return 'Sin fecha';
  
  let dateObj: Date | null = null;
  
  try {
    // Use the same parsing logic as formatDate
    if (date instanceof Date) {
      dateObj = date;
    } else if (isFirestoreTimestamp(date)) {
      const timestamp = date as IFirestoreTimestamp;
      if (typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (timestamp.seconds) {
        dateObj = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds) {
        dateObj = new Date(timestamp._seconds * 1000);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date > 1e10 ? date : date * 1000);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    
    // Check if we have a valid date object
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Hace unos segundos';
    }
    
    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    }
    
    // Less than a month
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
    
    // Less than a year
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
    }
    
    // More than a year
    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
    
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Error en fecha';
  }
};

/**
 * Safely extracts a Date object from various input types
 */
export const toDate = (date: DateInput): Date | null => {
  if (!date) return null;
  
  if (date instanceof Date) return date;
  
  if (typeof date === 'number') {
    // Check if it's in seconds (Firestore timestamp) or milliseconds
    return date > 1e10 ? new Date(date) : new Date(date * 1000);
  }
  
  if (typeof date === 'string') {
    return new Date(date);
  }
  
  // Handle Firebase/Firestore Timestamp objects
  if (isFirestoreTimestamp(date)) {
    const timestamp = date as IFirestoreTimestamp;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
  }
  
  return null;
};

/**
 * Checks if a date is valid
 */
export const isValidDate = (date: DateInput): boolean => {
  const dateObj = toDate(date);
  return dateObj !== null && !isNaN(dateObj.getTime());
};

/**
 * Gets the age from a birth date
 */
export const getAge = (birthDate: DateInput): number | null => {
  const date = toDate(birthDate);
  if (!date) return null;
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
};

/**
 * Formats age from birth date
 */
export const formatAge = (birthDate: DateInput): string => {
  const age = getAge(birthDate);
  return age !== null ? `${age} años` : 'Edad no disponible';
};

export default {
  formatDate,
  formatDateTime,
  formatDateCompact,
  formatRelativeTime,
  toDate,
  isValidDate,
  getAge,
  formatAge,
};