/**
 * Attendance service
 * Manages attendance-related data in localStorage
 */

// Keys used for storing attendance data
const ATTENDANCE_KEYS = {
  SESSIONS: 'music-academy-attendance-sessions',
  HISTORY: 'music-academy-attendance-history',
  TEMP_DATA: 'music-academy-attendance-temp',
  USER_RECORDS: 'music-academy-user-attendance'
};

/**
 * Clears all attendance-related data from localStorage
 */
export function clearLocalStorageData() {
  try {
    // Remove all attendance-related data
    Object.values(ATTENDANCE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('Attendance data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing attendance data:', error);
  }
}

/**
 * Gets attendance records from localStorage
 */
export function getAttendanceRecords() {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEYS.SESSIONS) || '{}');
  } catch (error) {
    console.error('Error retrieving attendance records:', error);
    return {};
  }
}

/**
 * Saves an attendance record to localStorage
 */
export function saveAttendanceRecord(sessionId, data) {
  try {
    const records = getAttendanceRecords();
    records[sessionId] = {
      ...data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(ATTENDANCE_KEYS.SESSIONS, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving attendance record:', error);
  }
}
