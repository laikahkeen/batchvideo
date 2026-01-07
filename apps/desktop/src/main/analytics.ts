import { PostHog } from 'posthog-node';
import { app } from 'electron';
import nodeMachineId from 'node-machine-id';
import log from 'electron-log';
import {
  AnalyticsEvents,
  type AnalyticsEvent,
  type AnalyticsEventData,
  type AnalyticsBaseProperties,
} from '@workspace/shared/types';

let posthog: PostHog | null = null;
let anonymousId: string | null = null;

/**
 * Base properties included with every event
 */
function getBaseProperties(): AnalyticsBaseProperties {
  return {
    platform: 'desktop',
    env: app.isPackaged ? 'production' : 'development',
    version: app.getVersion(),
  };
}

/**
 * Initialize PostHog analytics
 */
export function initAnalytics(): void {
  if (!app.isPackaged) {
    log.info('[Analytics] Disabled in development mode');
    return;
  }

  const apiKey = process.env.MAIN_VITE_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    log.warn('[Analytics] Missing MAIN_VITE_PUBLIC_POSTHOG_KEY');
    return;
  }

  try {
    anonymousId = nodeMachineId.machineIdSync(true);

    posthog = new PostHog(apiKey, {
      host: process.env.MAIN_VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    });

    log.info('[Analytics] Initialized');

    // Track app opened
    trackAppOpened();
  } catch (error) {
    log.error('[Analytics] Failed to initialize', error);
  }
}

/**
 * Track an analytics event with base properties
 */
export function trackEvent<E extends AnalyticsEvent>(event: E, data: AnalyticsEventData[E]): void {
  if (!app.isPackaged) {
    log.info('[Analytics DEV]', event, data);
  }

  if (!posthog || !anonymousId) return;

  try {
    const properties = { ...getBaseProperties(), ...data };
    posthog.capture({
      distinctId: anonymousId,
      event,
      properties,
    });
  } catch (error) {
    log.error(`[Analytics] Failed to track "${event}"`, error);
  }
}

/**
 * Track event with raw string (for IPC handler from renderer)
 */
export function trackEventRaw(event: string, properties?: Record<string, unknown>): void {
  if (!app.isPackaged) {
    log.info('[Analytics DEV]', event, properties || {});
  }

  if (!posthog || !anonymousId) return;

  try {
    posthog.capture({
      distinctId: anonymousId,
      event,
      properties: { ...getBaseProperties(), ...properties },
    });
  } catch (error) {
    log.error(`[Analytics] Failed to track "${event}"`, error);
  }
}

/**
 * Shutdown analytics (flush remaining events)
 */
export async function shutdownAnalytics(): Promise<void> {
  if (!posthog) return;

  try {
    await posthog.shutdown();
    log.info('[Analytics] Shutdown complete');
  } catch (error) {
    log.error('[Analytics] Shutdown failed', error);
  }
}

// =============================================================================
// Convenience functions for each event
// =============================================================================

export function trackAppOpened(): void {
  trackEvent(AnalyticsEvents.APP_OPENED, { arch: process.arch });
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

export { AnalyticsEvents };
