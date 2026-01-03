/**
 * Shared types for BatchVideo across all platforms
 */

// ============================================================================
// Core Enums / Union Types
// ============================================================================

export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export type Codec = 'h264' | 'h265';

export type Resolution = 'original' | '1920' | '1280' | '854';

export type EncodingMode = 'bitrate' | 'crf';

export type FFmpegPreset =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

export type CompressionMethod = 'percentage' | 'size_per_minute' | 'quality';

// ============================================================================
// Unified VideoFile (platform-agnostic)
// ============================================================================

/**
 * Platform-agnostic video file representation.
 * Works with both File objects (web) and file paths (desktop).
 */
export interface VideoFile {
  id: string;
  name: string;
  size: number;
  duration: number | null;
  thumbnail: string | null;
  status: FileStatus;
  progress: number;
  /** Original source - File object for web, path string for desktop */
  source: File | string;
  /** Output location - blob URL for web, file path for desktop */
  output: string | null;
  outputSize: number | null;
  predictedSize: number | null;
  error: string | null;
}

// ============================================================================
// Processing Stats
// ============================================================================

export interface ProcessingStats {
  total: number;
  completed: number;
  processing: number;
  pending: number;
  error: number;
}

// ============================================================================
// Compression Settings
// ============================================================================

export interface CompressionSettings {
  compressionMethod: CompressionMethod;
  targetPercentage: number;
  targetSizePerMinute: number;
  qualityCrf: number;
  maxBitrate: number;
  bufferSize: number;
  preset: FFmpegPreset;
  codec: Codec;
  resolution: Resolution;
  isLutOnlyMode: boolean;
}

export const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
  compressionMethod: 'quality',
  targetPercentage: 60,
  targetSizePerMinute: 15,
  qualityCrf: 23,
  maxBitrate: 0,
  bufferSize: 0,
  preset: 'medium',
  codec: 'h264',
  resolution: 'original',
  isLutOnlyMode: false,
};

// ============================================================================
// LUT Types
// ============================================================================

/**
 * LUT source - File object for web, path string for desktop
 */
export type LutSource = File | string | null;

// ============================================================================
// Unified Store State
// ============================================================================

export interface VideoStoreState extends CompressionSettings {
  // Video files
  files: VideoFile[];

  // LUT
  lut: LutSource;

  // Output directory (desktop only, null on web)
  outputDir: string | null;

  // Processing state
  isProcessing: boolean;
  isCancelled: boolean;
  currentFileIndex: number;

  // FFmpeg status
  ffmpegReady: boolean;

  // Actions - File management
  addFiles: (files: VideoFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;

  // Actions - LUT
  setLut: (lut: LutSource) => void;
  removeLut: () => void;

  // Actions - Output directory (desktop)
  setOutputDir: (dir: string | null) => void;

  // Actions - Compression settings
  setCompressionMethod: (method: CompressionMethod) => void;
  setTargetPercentage: (percentage: number) => void;
  setTargetSizePerMinute: (size: number) => void;
  setQualityCrf: (crf: number) => void;
  setMaxBitrate: (bitrate: number) => void;
  setBufferSize: (size: number) => void;
  setPreset: (preset: FFmpegPreset) => void;
  setCodec: (codec: Codec) => void;
  setResolution: (resolution: Resolution) => void;
  setLutOnlyMode: (isLutOnly: boolean) => void;

  // Actions - File updates
  updateFileStatus: (id: string, status: FileStatus) => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileOutput: (id: string, output: string, outputSize?: number) => void;
  updateFilePredictedSize: (id: string, predictedSize: number) => void;
  updateFileDuration: (id: string, duration: number) => void;
  updateFileError: (id: string, error: string) => void;
  updateFileThumbnail: (id: string, thumbnail: string) => void;

  // Actions - Processing state
  setProcessing: (isProcessing: boolean) => void;
  setCancelled: (isCancelled: boolean) => void;
  setCurrentFileIndex: (index: number) => void;
  setFFmpegReady: (ready: boolean) => void;

  // Computed
  getOverallProgress: () => number;
  getStats: () => ProcessingStats;
}

// ============================================================================
// File Utilities Types
// ============================================================================

export interface FileInfo {
  name: string;
  size: number;
  path?: string;
}

export interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const ACCEPTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.mts',
  '.m4v',
  '.avi',
  '.mkv',
] as const;

export const ACCEPTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-m4v',
] as const;

export const ACCEPTED_LUT_EXTENSIONS = ['.cube'] as const;

export const RESOLUTION_MAP: Record<Resolution, string> = {
  original: 'Original',
  '1920': '1080p (1920x1080)',
  '1280': '720p (1280x720)',
  '854': '480p (854x480)',
};

export const PRESET_MAP: Record<FFmpegPreset, string> = {
  ultrafast: 'Ultra Fast (lowest quality)',
  superfast: 'Super Fast',
  veryfast: 'Very Fast',
  faster: 'Faster',
  fast: 'Fast',
  medium: 'Medium (balanced)',
  slow: 'Slow',
  slower: 'Slower',
  veryslow: 'Very Slow (highest quality)',
};

// ============================================================================
// Size Constants
// ============================================================================

/** 2GB in bytes - web browser memory limit */
export const WEB_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
