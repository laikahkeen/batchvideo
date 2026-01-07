/**
 * Platform Adapter Types
 *
 * Defines the interface that each platform (web, desktop, mobile) must implement
 * to enable unified components across all platforms.
 */

import type { Codec, Resolution, FFmpegPreset, CompressionMethod } from '@workspace/shared/types';

// ============================================================================
// Platform Types
// ============================================================================

export type PlatformType = 'web' | 'desktop' | 'mobile';

// ============================================================================
// File Input Types (what we receive from the user)
// ============================================================================

/**
 * Web: Browser File object
 * Desktop: File path string
 * Mobile: Document picker result
 */
export type FileInput = File | string;

export interface FileInputInfo {
  id: string;
  name: string;
  size: number;
  /** Original input - File object for web, path string for desktop */
  source: FileInput;
}

// ============================================================================
// FFmpeg Types
// ============================================================================

export interface FFmpegStatus {
  available: boolean;
  version?: string;
  error?: string;
}

export interface ProcessingOptions {
  codec: Codec;
  resolution: Resolution;
  preset: FFmpegPreset;
  isLutOnlyMode: boolean;
  compressionMethod: CompressionMethod;
  targetPercentage: number;
  targetSizePerMinute: number;
  qualityCrf: number;
  maxBitrate: number;
  bufferSize: number;
  /** LUT source - File for web, path for desktop */
  lut?: FileInput;
  /** File duration in seconds (if known) */
  duration?: number;
  /** Original file size in bytes */
  fileSize?: number;
}

export interface ProcessingResult {
  /** Output location - blob URL for web, file path for desktop */
  output: string;
  /** Output file size in bytes */
  size: number;
}

export interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
}

// ============================================================================
// Platform Adapter Interface
// ============================================================================

export interface PlatformAdapter {
  /** Platform type identifier */
  type: PlatformType;

  // -------------------------------------------------------------------------
  // FFmpeg Initialization
  // -------------------------------------------------------------------------

  /**
   * Initialize FFmpeg and check availability
   * - Web: Load FFmpeg.wasm
   * - Desktop: Check native FFmpeg binary
   */
  initFFmpeg(): Promise<FFmpegStatus>;

  // -------------------------------------------------------------------------
  // File Selection
  // -------------------------------------------------------------------------

  /**
   * Open file picker dialog
   * - Web: Returns File objects (via dropzone or file input)
   * - Desktop: Returns file paths (via Electron dialog)
   */
  selectFiles(): Promise<FileInputInfo[]>;

  /**
   * Check if file selection via drag-drop is supported
   */
  supportsDragDrop: boolean;

  /**
   * Handle dropped files (web only, desktop uses native drag-drop)
   */
  handleDroppedFiles?(files: File[]): Promise<FileInputInfo[]>;

  // -------------------------------------------------------------------------
  // File Metadata
  // -------------------------------------------------------------------------

  /**
   * Get video duration
   */
  getVideoDuration(file: FileInput): Promise<number>;

  /**
   * Generate thumbnail image
   * Returns base64 data URL or null if failed
   */
  generateThumbnail(file: FileInput): Promise<string | null>;

  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------

  /**
   * Process a video file
   * @param jobId Unique identifier for this job (for progress tracking)
   * @param file Input file
   * @param options Processing options
   * @param onProgress Progress callback (0-100)
   */
  processVideo(
    jobId: string,
    file: FileInput,
    options: ProcessingOptions,
    onProgress: (progress: number) => void
  ): Promise<ProcessingResult>;

  /**
   * Cancel ongoing processing
   */
  cancelProcessing(jobId: string): Promise<void>;

  /**
   * Cancel all ongoing processing
   */
  cancelAllProcessing(): Promise<void>;

  // -------------------------------------------------------------------------
  // Output Handling
  // -------------------------------------------------------------------------

  /**
   * Download/save processed file
   * - Web: Trigger browser download
   * - Desktop: File is already saved, this is a no-op
   */
  downloadOutput(output: string, filename: string): void;

  /**
   * Show output file in file explorer (desktop only)
   */
  showInFolder?(output: string): Promise<void>;

  /**
   * Select output directory (desktop only)
   */
  selectOutputDirectory?(): Promise<string | null>;

  // -------------------------------------------------------------------------
  // Platform Capabilities
  // -------------------------------------------------------------------------

  /**
   * Whether there's a file size limit
   * Web: 2GB due to browser memory constraints
   * Desktop/Mobile: No limit
   */
  maxFileSize: number | null;

  /**
   * Whether output directory selection is supported
   */
  supportsOutputDirectory: boolean;

  /**
   * Whether showing files in folder is supported
   */
  supportsShowInFolder: boolean;

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  /**
   * Analytics tracking methods (implemented by each platform)
   */
  analytics: {
    trackFilesAdded(count: number, totalSize: number): void;
    trackLutApplied(lutName: string): void;
    trackVideosProcessed(count: number): void;
    trackDownloadClicked(): void;
    trackFeedbackClicked(): void;
    trackError(errorType: string, message: string): void;
  };

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Cleanup resources (e.g., revoke blob URLs)
   */
  cleanup?(): void;
}

// ============================================================================
// Platform Context Value
// ============================================================================

export interface PlatformContextValue {
  adapter: PlatformAdapter;
  ffmpegStatus: FFmpegStatus;
  isInitializing: boolean;
}
