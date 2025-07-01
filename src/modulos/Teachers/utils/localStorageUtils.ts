/**
 * Saves data to localStorage with the given key
 */
export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving item to localStorage with key "${key}":`, error)
  }
}

/**
 * Retrieves data from localStorage by key
 */
export const getFromLocalStorage = (key: string): any | null => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(`Error getting item from localStorage with key "${key}":`, error)
    return null
  }
}

/**
 * Clears a specific item from localStorage
 */
export const clearLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error clearing item from localStorage with key "${key}":`, error)
  }
}

/**
 * Clears all items from localStorage
 */
export const clearAllLocalStorage = (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error(`Error clearing all localStorage: ${error}`)
  }
}
