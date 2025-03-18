/**
 * Attendance service
 * Utility functions for managing attendance data in local storage
 */

// Keys used for storing attendance data in localStorage
const ATTENDANCE_KEYS = {
  SESSIONS: 'music-academy-attendance-sessions',
  HISTORY: 'music-academy-attendance-history',
  TEMP_DATA: 'music-academy-attendance-temp',
  USER_RECORDS: 'music-academy-user-attendance'
};

/**
 * Clears all attendance-related data from local storage
 * Used during logout to ensure user data is removed
 */
export function clearLocalStorageData(): void {
  try {
    // Remove all attendance-related data
    Object.values(ATTENDANCE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Attendance data successfully cleared from localStorage');
  } catch (error) {
    console.error('Error clearing attendance data:', error);
  }
}

/**
 * Saves attendance record to local storage
 * @param sessionId - ID of the class/lesson session
 * @param data - Attendance data to save
 */
export function saveAttendanceRecord(sessionId: string, data: any): void {
  try {
    // Get existing records or initialize empty object
    const existingRecords = JSON.parse(
      localStorage.getItem(ATTENDANCE_KEYS.SESSIONS) || '{}'
    );
    
    // Update with new record
    existingRecords[sessionId] = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem(
      ATTENDANCE_KEYS.SESSIONS, 
      JSON.stringify(existingRecords)
    );
  } catch (error) {
    console.error('Error saving attendance record:', error);
  }
}

/**
 * Gets attendance records from local storage
 * @returns All stored attendance records
 */
export function getAttendanceRecords(): Record<string, any> {
  try {
    return JSON.parse(
      localStorage.getItem(ATTENDANCE_KEYS.SESSIONS) || '{}'
    );
  } catch (error) {
    console.error('Error retrieving attendance records:', error);
    return {};
  }
}
