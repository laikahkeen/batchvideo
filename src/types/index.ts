export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export type Codec = 'h264' | 'h265';

export type Resolution = 'original' | '1920' | '1280' | '854';

export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbnail: string | null;
  status: FileStatus;
  progress: number;
  outputUrl: string | null;
  error: string | null;
}

export interface ProcessingOptions {
  lutFile: File | null;
  compressionQuality: number;
  codec: Codec;
  resolution: Resolution;
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
  compressionQuality: number;
  codec: Codec;
  resolution: Resolution;

  // Processing state
  isProcessing: boolean;
  isCancelled: boolean;
  currentFileIndex: number;
  processingProgress: Record<string, number>;

  // FFmpeg instance
  ffmpegLoaded: boolean;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setLUT: (lutFile: File) => void;
  removeLUT: () => void;
  setCompressionQuality: (quality: number) => void;
  setCodec: (codec: Codec) => void;
  setResolution: (resolution: Resolution) => void;
  updateFileStatus: (id: string, status: FileStatus) => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileOutput: (id: string, outputUrl: string) => void;
  updateFileError: (id: string, error: string) => void;
  updateFileThumbnail: (id: string, thumbnail: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setCancelled: (isCancelled: boolean) => void;
  setCurrentFileIndex: (index: number) => void;
  setFFmpegLoaded: (loaded: boolean) => void;
  getOverallProgress: () => number;
  getStats: () => ProcessingStats;
}
