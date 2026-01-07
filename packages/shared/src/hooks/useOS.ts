/**
 * OS Detection Hook
 *
 * Detects the user's operating system from the browser's user agent.
 */

import { useMemo } from 'react';
import { GITHUB_RELEASES_URL } from '@workspace/shared/constants/urls';

export type OS = 'macos' | 'windows' | 'linux' | 'unknown';

/**
 * Detect operating system from user agent string
 */
export function detectOS(): OS {
  if (typeof window === 'undefined' || !navigator?.userAgent) {
    return 'unknown';
  }

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // Check macOS
  if (ua.includes('mac') || platform.includes('mac')) {
    return 'macos';
  }

  // Check Windows
  if (ua.includes('win') || platform.includes('win')) {
    return 'windows';
  }

  // Check Linux
  if (ua.includes('linux') || platform.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Hook to get the current operating system
 * Memoized since OS doesn't change during session
 */
export function useOS(): OS {
  return useMemo(() => detectOS(), []);
}

/**
 * Get the display name for an OS
 */
export function getOSDisplayName(os: OS): string {
  switch (os) {
    case 'macos':
      return 'macOS';
    case 'windows':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return 'Desktop';
  }
}

/**
 * Get the GitHub release download URL for an OS
 * Currently only macOS is available, others link to releases page
 */
export function getDownloadURL(_os: OS): string {
  // For now, all OS link to the releases page
  // Future: parse latest release and link directly to .dmg/.exe
  return GITHUB_RELEASES_URL;
}
