export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export type Codec = 'h264' | 'h265';

export type Resolution = 'original' | '1920' | '1280' | '854';

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
  path: string; // File path instead of File object
  name: string;
  size: number;
  duration: number | null;
  thumbnail: string | null;
  status: FileStatus;
  progress: number;
  outputPath: string | null; // Output file path instead of URL
  outputSize: number | null;
  predictedSize: number | null;
  error: string | null;
}

export interface ProcessingOptions {
  lutPath: string | null;
  codec: Codec;
  resolution: Resolution;
  preset: FFmpegPreset;
  isLutOnlyMode: boolean;
  compressionMethod: CompressionMethod;
  targetPercentage?: number;
  targetSizePerMinute?: number;
  qualityCrf?: number;
  maxBitrate?: number;
  bufferSize?: number;
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
  lutPath: string | null;

  // Output directory
  outputDir: string | null;

  // Compression settings
  compressionMethod: CompressionMethod;
  targetPercentage: number;
  targetSizePerMinute: number;

  // Quality mode (CRF) settings
  qualityCrf: number;
  maxBitrate: number;
  bufferSize: number;
  preset: FFmpegPreset;

  // Global settings
  codec: Codec;
  resolution: Resolution;
  isLutOnlyMode: boolean;

  // Processing state
  isProcessing: boolean;
  isCancelled: boolean;
  currentFileIndex: number;

  // FFmpeg status
  ffmpegAvailable: boolean;
  ffmpegVersion: string | null;

  // Actions
  addFiles: (filePaths: string[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setLUT: (lutPath: string) => void;
  removeLUT: () => void;
  setOutputDir: (dir: string | null) => void;

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

  updateFileStatus: (id: string, status: FileStatus) => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileOutput: (id: string, outputPath: string, outputSize?: number) => void;
  updateFilePredictedSize: (id: string, predictedSize: number) => void;
  updateFileDuration: (id: string, duration: number) => void;
  updateFileError: (id: string, error: string) => void;
  updateFileThumbnail: (id: string, thumbnail: string) => void;

  setProcessing: (isProcessing: boolean) => void;
  setCancelled: (isCancelled: boolean) => void;
  setCurrentFileIndex: (index: number) => void;
  setFFmpegStatus: (available: boolean, version?: string) => void;

  getOverallProgress: () => number;
  getStats: () => ProcessingStats;
}
