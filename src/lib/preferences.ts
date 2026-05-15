export interface UserPreferences {
  defaultLocation: string
  preferredType: string
  minPrice: string
  maxPrice: string
}

const PREFS_KEY = 'addkaro_preferences'

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLocation: '',
  preferredType: '',
  minPrice: '',
  maxPrice: '',
}

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
