// Claves para el almacenamiento local
export const LOCAL_STORAGE_KEYS = {
  ATTENDANCE_DOCUMENTS: 'attendance_documents',
  ATTENDANCE_RECORDS: 'attendance_records',
  ATTENDANCE_OBSERVATIONS: 'attendance_observations',
  ATTENDANCE_JUSTIFICATIONS: 'attendance_justifications',
  USER_PREFERENCES: 'user_preferences',
  AUTH: 'auth',
  SELECTED_CLASS: 'selected_class',
  SELECTED_DATE: 'selected_date'
} as const;

export type LocalStorageKey = keyof typeof LOCAL_STORAGE_KEYS;
