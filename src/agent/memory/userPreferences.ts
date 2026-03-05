/**
 * User Preferences Memory — Stores persistent user preferences across tasks.
 *
 * This allows the agent to remember things like:
 * - Coding style (functional vs class, indentation)
 * - Library preferences (Tailwind vs CSS Modules)
 * - Language preferences (TypeScript vs JavaScript)
 * - Project structure preferences
 */

const PREFERENCES_STORAGE_KEY = 'nasus-user-preferences'

export interface UserPreferences {
  [key: string]: string | boolean | number
}

/**
 * Load user preferences from localStorage.
 */
export function loadUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load user preferences:', error)
  }
  return {}
}

/**
 * Save user preferences to localStorage.
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.warn('Failed to save user preferences:', error)
  }
}

/**
 * Update a specific preference.
 */
export function updatePreference(key: string, value: string | boolean | number): void {
  const prefs = loadUserPreferences()
  prefs[key] = value
  saveUserPreferences(prefs)
}

/**
 * Build a summary of user preferences to inject into the system prompt.
 */
export function buildPreferencesSummary(): string {
  const prefs = loadUserPreferences()
  const keys = Object.keys(prefs)
  
  if (keys.length === 0) return ''
  
  const summaryLines = keys.map(key => `- ${key}: ${prefs[key]}`)
  return `[User Preferences]\n${summaryLines.join('\n')}`
}

/**
 * Parse user input for potential preferences to save.
 * Simple heuristic-based extraction.
 */
export function extractPreferencesFromText(text: string): UserPreferences {
  const prefs: UserPreferences = {}
  
  // Example heuristics:
  if (text.toLowerCase().includes('always use typescript')) prefs['language'] = 'TypeScript'
  if (text.toLowerCase().includes('prefer tailwind')) prefs['styling'] = 'Tailwind CSS'
  if (text.toLowerCase().includes('use functional components')) prefs['react_style'] = 'Functional Components'
  
  return prefs
}
