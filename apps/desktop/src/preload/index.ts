import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Types
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

// FFmpeg API
const ffmpegAPI = {
  check: (): Promise<FFmpegStatus> => ipcRenderer.invoke('ffmpeg:check'),

  getMetadata: (inputPath: string): Promise<VideoMetadata> => ipcRenderer.invoke('ffmpeg:getMetadata', inputPath),

  generateThumbnail: (inputPath: string): Promise<string | null> =>
    ipcRenderer.invoke('ffmpeg:generateThumbnail', inputPath),

  process: (jobId: string, options: ProcessOptions): Promise<{ outputPath: string; size: number }> =>
    ipcRenderer.invoke('ffmpeg:process', jobId, options),

  cancel: (jobId: string): Promise<boolean> => ipcRenderer.invoke('ffmpeg:cancel', jobId),

  cancelAll: (): Promise<number> => ipcRenderer.invoke('ffmpeg:cancelAll'),

  onProgress: (callback: (data: { jobId: string; progress: number }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { jobId: string; progress: number }) => callback(data);
    ipcRenderer.on('ffmpeg:progress', listener);
    return () => ipcRenderer.removeListener('ffmpeg:progress', listener);
  },
};

// File API
const fileAPI = {
  getInfo: (filePath: string): Promise<FileInfo> => ipcRenderer.invoke('file:getInfo', filePath),

  read: (filePath: string): Promise<Buffer> => ipcRenderer.invoke('file:read', filePath),

  exists: (filePath: string): Promise<boolean> => ipcRenderer.invoke('file:exists', filePath),

  getTempDir: (): Promise<string> => ipcRenderer.invoke('file:getTempDir'),

  createOutputPath: (inputPath: string, outputDir?: string): Promise<string> =>
    ipcRenderer.invoke('file:createOutputPath', inputPath, outputDir),

  openInSystem: (filePath: string): Promise<void> => ipcRenderer.invoke('file:openInSystem', filePath),

  showInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke('file:showInFolder', filePath),

  delete: (filePath: string): Promise<void> => ipcRenderer.invoke('file:delete', filePath),

  copy: (src: string, dest: string): Promise<void> => ipcRenderer.invoke('file:copy', src, dest),

  getDownloadsFolder: (): Promise<string> => ipcRenderer.invoke('file:getDownloadsFolder'),
};

// Dialog API
const dialogAPI = {
  openFiles: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles'),

  openLUT: (): Promise<string | null> => ipcRenderer.invoke('dialog:openLUT'),

  saveFile: (defaultName: string): Promise<string | null> => ipcRenderer.invoke('dialog:saveFile', defaultName),

  selectOutputFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectOutputFolder'),
};

// Updater API
const updaterAPI = {
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('updater:checkForUpdates'),

  onStatus: (callback: (data: { status: string; version?: string; progress?: number; error?: string }) => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { status: string; version?: string; progress?: number; error?: string }) => callback(data);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
};

// Analytics API
const analyticsAPI = {
  track: (event: string, properties?: Record<string, unknown>): void => {
    ipcRenderer.send('analytics:track', event, properties);
  },
};

// Custom APIs for renderer
const api = {
  ffmpeg: ffmpegAPI,
  file: fileAPI,
  dialog: dialogAPI,
  updater: updaterAPI,
  analytics: analyticsAPI,
  platform: process.platform,
  getVersion: (): string => ipcRenderer.sendSync('app:getVersion'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as unknown as { electron: typeof electronAPI }).electron = electronAPI;
  (window as unknown as { api: typeof api }).api = api;
}
