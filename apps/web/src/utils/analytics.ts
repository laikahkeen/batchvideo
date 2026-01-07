import posthog from 'posthog-js';
import {
  AnalyticsEvents,
  type AnalyticsEvent,
  type AnalyticsEventData,
  type AnalyticsBaseProperties,
} from '@workspace/shared/types';

let isInitialized = false;

// App version from package.json (injected at build time via Vite)
const APP_VERSION = __APP_VERSION__;

/**
 * Base properties included with every event
 */
function getBaseProperties(): AnalyticsBaseProperties {
  return {
    platform: 'web',
    env: import.meta.env.PROD ? 'production' : 'development',
    version: APP_VERSION,
  };
}

/**
 * Initialize PostHog analytics for web
 */
export function initAnalytics(): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics] Disabled in development mode');
    return;
  }

  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    console.warn('[Analytics] Missing VITE_PUBLIC_POSTHOG_KEY');
    return;
  }

  if (isInitialized) return;

  try {
    posthog.init(apiKey, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'localStorage',
    });

    isInitialized = true;
    console.log('[Analytics] Initialized');

    // Track app opened on page load
    trackAppOpened();
  } catch (error) {
    console.error('[Analytics] Failed to initialize', error);
  }
}

/**
 * Track an analytics event with base properties
 */
export function trackEvent<E extends AnalyticsEvent>(event: E, data: AnalyticsEventData[E]): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics DEV]', event, data);
  }

  if (!isInitialized) return;

  try {
    const properties = { ...getBaseProperties(), ...data };
    posthog.capture(event, properties);
  } catch (error) {
    console.error(`[Analytics] Failed to track "${event}"`, error);
  }
}

// =============================================================================
// Convenience functions for each event
// =============================================================================

export function trackAppOpened(): void {
  trackEvent(AnalyticsEvents.APP_OPENED, {});
}

export function trackVideosProcessed(count: number): void {
  trackEvent(AnalyticsEvents.VIDEOS_PROCESSED, { count });
}

export function trackFilesAdded(count: number, totalSize: number): void {
  trackEvent(AnalyticsEvents.FILES_ADDED, { count, total_size: totalSize });
}

export function trackLutApplied(lutName: string): void {
  trackEvent(AnalyticsEvents.LUT_APPLIED, { lut_name: lutName });
}

export function trackDownloadClicked(): void {
  trackEvent(AnalyticsEvents.DOWNLOAD_CLICKED, {});
}

export function trackFeedbackClicked(): void {
  trackEvent(AnalyticsEvents.FEEDBACK_CLICKED, {});
}

export function trackError(errorType: string, message: string): void {
  trackEvent(AnalyticsEvents.ERROR_OCCURRED, { error_type: errorType, message });
}

export function trackHeroDismissed(): void {
  trackEvent(AnalyticsEvents.HERO_DISMISSED, {});
}

export { AnalyticsEvents };
