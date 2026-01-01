import { ElectronAPI } from '@electron-toolkit/preload';

export interface ProcessOptions {
  inputPath: string;
  outputPath: string;
  lutPath?: string;
  codec: 'h264' | 'h265';
  resolution: 'original' | '1920' | '1280' | '854';
  preset: string;
  isLutOnlyMode: boolean;
  compressionMethod: 'percentage' | 'size_per_minute' | 'quality';
  targetPercentage?: number;
  targetSizePerMinute?: number;
  qualityCrf?: number;
  maxBitrate?: number;
  bufferSize?: number;
  duration?: number;
  fileSize?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
}

export interface FFmpegStatus {
  available: boolean;
  version?: string;
  error?: string;
}

export interface FFmpegAPI {
  check: () => Promise<FFmpegStatus>;
  getMetadata: (inputPath: string) => Promise<VideoMetadata>;
  generateThumbnail: (inputPath: string) => Promise<string | null>;
  process: (
    jobId: string,
    options: ProcessOptions
  ) => Promise<{ outputPath: string; size: number }>;
  cancel: (jobId: string) => Promise<boolean>;
  cancelAll: () => Promise<number>;
  onProgress: (
    callback: (data: { jobId: string; progress: number }) => void
  ) => () => void;
}

export interface FileAPI {
  getInfo: (filePath: string) => Promise<FileInfo>;
  read: (filePath: string) => Promise<Buffer>;
  exists: (filePath: string) => Promise<boolean>;
  getTempDir: () => Promise<string>;
  createOutputPath: (inputPath: string, outputDir?: string) => Promise<string>;
  openInSystem: (filePath: string) => Promise<void>;
  showInFolder: (filePath: string) => Promise<void>;
  delete: (filePath: string) => Promise<void>;
  copy: (src: string, dest: string) => Promise<void>;
  getDownloadsFolder: () => Promise<string>;
}

export interface DialogAPI {
  openFiles: () => Promise<string[]>;
  openLUT: () => Promise<string | null>;
  saveFile: (defaultName: string) => Promise<string | null>;
  selectOutputFolder: () => Promise<string | null>;
}

export interface API {
  ffmpeg: FFmpegAPI;
  file: FileAPI;
  dialog: DialogAPI;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
