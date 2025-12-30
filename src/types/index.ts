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

export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration: number | null; // Cached duration in seconds
  thumbnail: string | null;
  status: FileStatus;
  progress: number;
  outputUrl: string | null;
  outputSize: number | null;
  predictedSize: number | null;
  error: string | null;
}

export interface ProcessingOptions {
  lutFile: File | null;
  codec: Codec;
  resolution: Resolution;
  preset: FFmpegPreset;
  isLutOnlyMode: boolean;

  // Compression method options
  compressionMethod: CompressionMethod;
  targetPercentage?: number;
  targetSizePerMinute?: number;

  // Quality mode (CRF) options
  qualityCrf?: number; // CRF value for quality mode (18-28)
  maxBitrate?: number; // Maximum bitrate constraint (kbps)
  bufferSize?: number; // Rate control buffer size (kbps)
}

export interface ProcessingStats {
  total: number;
  completed: number;
  processing: number;
  pending: number;
  error: number;
}

export interface VideoStoreState {
  // Video files
  files: VideoFile[];

  // LUT
  lut: File | null;
  lutFile: File | null;

  // Compression settings
  compressionMethod: CompressionMethod;
  targetPercentage: number; // For 'percentage' mode (0-100)
  targetSizePerMinute: number; // For 'size_per_minute' mode (MB/min)

  // Quality mode (CRF) settings
  qualityCrf: number; // CRF value (18-28)
  maxBitrate: number; // Maximum bitrate constraint (kbps)
  bufferSize: number; // Rate control buffer size (kbps)
  preset: FFmpegPreset; // Compression speed

  // Global settings
  codec: Codec;
  resolution: Resolution;
  isLutOnlyMode: boolean;

  // Processing state
  isProcessing: boolean;
  isCancelled: boolean;
  currentFileIndex: number;
  processingProgress: Record<string, number>;

  // FFmpeg instance
  ffmpegLoaded: boolean;

  // Actions
  addFiles: (files: File[], timestamp?: number) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setLUT: (lutFile: File) => void;
  removeLUT: () => void;

  // Compression method setters
  setCompressionMethod: (method: CompressionMethod) => void;
  setTargetPercentage: (percentage: number) => void;
  setTargetSizePerMinute: (size: number) => void;

  // Quality mode (CRF) setters
  setQualityCrf: (crf: number) => void;
  setMaxBitrate: (bitrate: number) => void;
  setBufferSize: (size: number) => void;
  setPreset: (preset: FFmpegPreset) => void;

  // Global setters
  setCodec: (codec: Codec) => void;
  setResolution: (resolution: Resolution) => void;
  setLutOnlyMode: (isLutOnly: boolean) => void;

  updateFileStatus: (id: string, status: FileStatus) => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileOutput: (id: string, outputUrl: string, outputSize?: number) => void;
  updateFilePredictedSize: (id: string, predictedSize: number) => void;
  updateFileDuration: (id: string, duration: number) => void;
  updateFileError: (id: string, error: string) => void;
  updateFileThumbnail: (id: string, thumbnail: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setCancelled: (isCancelled: boolean) => void;
  setCurrentFileIndex: (index: number) => void;
  setFFmpegLoaded: (loaded: boolean) => void;
  getOverallProgress: () => number;
  getStats: () => ProcessingStats;
}
