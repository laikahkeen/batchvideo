/**
 * Platform Context
 *
 * Provides platform-specific functionality to all components via React context.
 * Each app wraps its root with PlatformProvider and supplies the appropriate adapter.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  PlatformAdapter,
  PlatformContextValue,
  FFmpegStatus,
} from './types';

// ============================================================================
// Context
// ============================================================================

const PlatformContext = createContext<PlatformContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface PlatformProviderProps {
  adapter: PlatformAdapter;
  children: ReactNode;
}

export function PlatformProvider({ adapter, children }: PlatformProviderProps) {
  const [ffmpegStatus, setFFmpegStatus] = useState<FFmpegStatus>({
    available: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initFFmpeg = async () => {
      try {
        setIsInitializing(true);
        const status = await adapter.initFFmpeg();
        if (mounted) {
          setFFmpegStatus(status);
        }
      } catch (error) {
        if (mounted) {
          setFFmpegStatus({
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initFFmpeg();

    return () => {
      mounted = false;
      adapter.cleanup?.();
    };
  }, [adapter]);

  const value: PlatformContextValue = {
    adapter,
    ffmpegStatus,
    isInitializing,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);

  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if platform is ready (FFmpeg initialized)
 */
export function usePlatformReady(): boolean {
  const { ffmpegStatus, isInitializing } = usePlatform();
  return !isInitializing && ffmpegStatus.available;
}

/**
 * Hook to get platform type
 */
export function usePlatformType() {
  const { adapter } = usePlatform();
  return adapter.type;
}

/**
 * Hook to check platform capabilities
 */
export function usePlatformCapabilities() {
  const { adapter } = usePlatform();

  return {
    supportsDragDrop: adapter.supportsDragDrop,
    supportsOutputDirectory: adapter.supportsOutputDirectory,
    supportsShowInFolder: adapter.supportsShowInFolder,
    maxFileSize: adapter.maxFileSize,
  };
}
