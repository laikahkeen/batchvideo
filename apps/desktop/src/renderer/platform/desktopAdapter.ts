/**
 * Desktop Platform Adapter
 *
 * Implements PlatformAdapter for Electron environment using native FFmpeg.
 */

import type {
  PlatformAdapter,
  FFmpegStatus,
  FileInputInfo,
  ProcessingOptions,
  ProcessingResult,
} from '@workspace/shared/platform';
import { AnalyticsEvents } from '@workspace/shared/types';

// ============================================================================
// Desktop Platform Adapter Implementation
// ============================================================================

export const desktopAdapter: PlatformAdapter = {
  type: 'desktop',

  // ---------------------------------------------------------------------------
  // FFmpeg Initialization
  // ---------------------------------------------------------------------------

  async initFFmpeg(): Promise<FFmpegStatus> {
    try {
      const status = await window.api.ffmpeg.check();
      return {
        available: status.available,
        version: status.version,
        error: status.error,
      };
    } catch (error) {
      console.error('Failed to check FFmpeg:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Failed to check FFmpeg',
      };
    }
  },

  // ---------------------------------------------------------------------------
  // File Selection
  // ---------------------------------------------------------------------------

  async selectFiles(): Promise<FileInputInfo[]> {
    try {
      const filePaths = await window.api.dialog.openFiles();
      if (filePaths.length === 0) {
        return [];
      }

      const timestamp = Date.now();
      const fileInfos: FileInputInfo[] = await Promise.all(
        filePaths.map(async (path, index) => {
          const info = await window.api.file.getInfo(path);
          return {
            id: `${timestamp}-${index}`,
            name: info.name,
            size: info.size,
            source: path,
          };
        })
      );

      return fileInfos;
    } catch (error) {
      console.error('Error selecting files:', error);
      return [];
    }
  },

  supportsDragDrop: false, // Desktop uses Electron dialogs

  // ---------------------------------------------------------------------------
  // File Metadata
  // ---------------------------------------------------------------------------

  async getVideoDuration(file: File | string): Promise<number> {
    if (typeof file !== 'string') {
      // Desktop adapter only handles file paths
      return 0;
    }

    try {
      const metadata = await window.api.ffmpeg.getMetadata(file);
      return metadata.duration;
    } catch (error) {
      console.error('Error getting video duration:', error);
      return 0;
    }
  },

  async generateThumbnail(file: File | string): Promise<string | null> {
    if (typeof file !== 'string') {
      return null;
    }

    try {
      return await window.api.ffmpeg.generateThumbnail(file);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // Processing
  // ---------------------------------------------------------------------------

  async processVideo(
    jobId: string,
    file: File | string,
    options: ProcessingOptions,
    onProgress: (progress: number) => void
  ): Promise<ProcessingResult> {
    if (typeof file !== 'string') {
      throw new Error('Desktop adapter only supports file paths');
    }

    // Set up progress listener
    const unsubscribe = window.api.ffmpeg.onProgress(({ jobId: id, progress }) => {
      if (id === jobId) {
        onProgress(Math.round(progress));
      }
    });

    try {
      // Get output directory from store (we'll need to pass this differently)
      // For now, use default output path creation
      const outputPath = await window.api.file.createOutputPath(file);

      const result = await window.api.ffmpeg.process(jobId, {
        inputPath: file,
        outputPath,
        lutPath: typeof options.lut === 'string' ? options.lut : undefined,
        codec: options.codec,
        resolution: options.resolution,
        preset: options.preset,
        isLutOnlyMode: options.isLutOnlyMode,
        compressionMethod: options.compressionMethod,
        targetPercentage: options.targetPercentage,
        targetSizePerMinute: options.targetSizePerMinute,
        qualityCrf: options.qualityCrf,
        maxBitrate: options.maxBitrate,
        bufferSize: options.bufferSize,
        duration: options.duration,
        fileSize: options.fileSize,
      });

      unsubscribe();

      return {
        output: result.outputPath,
        size: result.size,
      };
    } catch (error) {
      unsubscribe();
      throw error;
    }
  },

  async cancelProcessing(jobId: string): Promise<void> {
    await window.api.ffmpeg.cancel(jobId);
  },

  async cancelAllProcessing(): Promise<void> {
    await window.api.ffmpeg.cancelAll();
  },

  // ---------------------------------------------------------------------------
  // Output Handling
  // ---------------------------------------------------------------------------

  downloadOutput(output: string, _filename: string): void {
    // Desktop doesn't need download - files are already on disk
    // Just show in folder instead
    window.api.file.showInFolder(output);
  },

  async showInFolder(output: string): Promise<void> {
    await window.api.file.showInFolder(output);
  },

  async selectOutputDirectory(): Promise<string | null> {
    return await window.api.dialog.selectOutputFolder();
  },

  // ---------------------------------------------------------------------------
  // Platform Capabilities
  // ---------------------------------------------------------------------------

  maxFileSize: null, // No limit on desktop
  supportsOutputDirectory: true,
  supportsShowInFolder: true,

  // ---------------------------------------------------------------------------
  // Analytics (sends events to main process via IPC)
  // ---------------------------------------------------------------------------

  analytics: {
    trackFilesAdded(count: number, totalSize: number): void {
      window.api.analytics.track(AnalyticsEvents.FILES_ADDED, { count, total_size: totalSize });
    },
    trackLutApplied(lutName: string): void {
      window.api.analytics.track(AnalyticsEvents.LUT_APPLIED, { lut_name: lutName });
    },
    trackVideosProcessed(count: number): void {
      window.api.analytics.track(AnalyticsEvents.VIDEOS_PROCESSED, { count });
    },
    trackDownloadClicked(): void {
      window.api.analytics.track(AnalyticsEvents.DOWNLOAD_CLICKED, {});
    },
    trackFeedbackClicked(): void {
      window.api.analytics.track(AnalyticsEvents.FEEDBACK_CLICKED, {});
    },
    trackError(errorType: string, message: string): void {
      window.api.analytics.track(AnalyticsEvents.ERROR_OCCURRED, { error_type: errorType, message });
    },
  },

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  cleanup(): void {
    // No cleanup needed for desktop
  },
};

export default desktopAdapter;
