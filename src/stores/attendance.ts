// DEPRECATED: This store is deprecated. Use the modular attendance store instead.
// File: @/modulos/Attendance/store/attendance.ts
//
// This file is kept for backward compatibility and will be removed in future versions.
// All new code should use the modular attendance store.

import { useAttendanceStore as useModularAttendanceStore } from '@/modulos/Attendance/store/attendance';

// Re-export the modular store for backward compatibility
export const useAttendanceStore = useModularAttendanceStore;

// Legacy interface for compatibility (will be removed)
export interface AttendanceAnalytics {
  totalClasses: number
  attendanceRate: number
  commonAbsenceReasons: string[]
}
