/**
 * useLocalStorage Hook
 *
 * A type-safe hook for persisting state in localStorage.
 * SSR-safe with window checks.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook to persist state in localStorage
 *
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue] tuple like useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Use ref to avoid initialValue causing re-renders when it's an object/array
  const initialValueRef = useRef(initialValue);

  // Get initial value from localStorage or use default
  const readValue = useCallback((): T => {
    if (!isLocalStorageAvailable()) {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update state and localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Use functional update to avoid stale closure
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;

          if (isLocalStorageAvailable()) {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          // Ignore parse errors from other sources
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Simple helper to check if a localStorage key exists and is truthy
 */
export function hasLocalStorageFlag(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const value = window.localStorage.getItem(key);
    return value === 'true' || value === '"true"';
  } catch {
    return false;
  }
}

/**
 * Simple helper to set a localStorage flag
 */
export function setLocalStorageFlag(key: string, value: boolean): void {
  if (!isLocalStorageAvailable()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore errors
  }
}
