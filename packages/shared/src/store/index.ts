/**
 * Unified Video Store
 *
 * Platform-agnostic Zustand store for managing video processing state.
 * Works with both web and desktop platforms.
 */

import { create } from 'zustand';
import type {
  VideoStoreState,
  VideoFile,
  FileStatus,
  CompressionMethod,
  FFmpegPreset,
  Codec,
  Resolution,
  LutSource,
} from '../types';
import { calculateOverallProgress, calculateStats } from '../utils';

// ============================================================================
// Store Implementation
// ============================================================================

const useVideoStore = create<VideoStoreState>((set, get) => ({
  // -------------------------------------------------------------------------
  // Initial State
  // -------------------------------------------------------------------------

  // Files
  files: [],

  // LUT
  lut: null,

  // Output directory (desktop only)
  outputDir: null,

  // Compression settings (defaults)
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

  // Processing state
  isProcessing: false,
  isCancelled: false,
  currentFileIndex: -1,

  // FFmpeg status
  ffmpegReady: false,

  // -------------------------------------------------------------------------
  // File Management Actions
  // -------------------------------------------------------------------------

  addFiles: (newFiles: VideoFile[]) =>
    set((state) => ({
      files: [...state.files, ...newFiles],
    })),

  removeFile: (id: string) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ files: [] }),

  // -------------------------------------------------------------------------
  // LUT Actions
  // -------------------------------------------------------------------------

  setLut: (lut: LutSource) => set({ lut }),

  removeLut: () => set({ lut: null, isLutOnlyMode: false }),

  // -------------------------------------------------------------------------
  // Output Directory (Desktop)
  // -------------------------------------------------------------------------

  setOutputDir: (dir: string | null) => set({ outputDir: dir }),

  // -------------------------------------------------------------------------
  // Compression Settings Actions
  // -------------------------------------------------------------------------

  setCompressionMethod: (method: CompressionMethod) =>
    set({ compressionMethod: method }),

  setTargetPercentage: (percentage: number) =>
    set({ targetPercentage: percentage }),

  setTargetSizePerMinute: (size: number) => set({ targetSizePerMinute: size }),

  setQualityCrf: (crf: number) => set({ qualityCrf: crf }),

  setMaxBitrate: (bitrate: number) => set({ maxBitrate: bitrate }),

  setBufferSize: (size: number) => set({ bufferSize: size }),

  setPreset: (preset: FFmpegPreset) => set({ preset }),

  setCodec: (codec: Codec) => set({ codec }),

  setResolution: (resolution: Resolution) => set({ resolution }),

  setLutOnlyMode: (isLutOnly: boolean) => set({ isLutOnlyMode: isLutOnly }),

  // -------------------------------------------------------------------------
  // File Update Actions
  // -------------------------------------------------------------------------

  updateFileStatus: (id: string, status: FileStatus) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, status } : f)),
    })),

  updateFileProgress: (id: string, progress: number) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, progress } : f)),
    })),

  updateFileOutput: (id: string, output: string, outputSize?: number) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              output,
              outputSize: outputSize ?? null,
              status: 'completed' as FileStatus,
            }
          : f
      ),
    })),

  updateFilePredictedSize: (id: string, predictedSize: number) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, predictedSize } : f
      ),
    })),

  updateFileDuration: (id: string, duration: number) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, duration } : f)),
    })),

  updateFileError: (id: string, error: string) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, error, status: 'error' as FileStatus } : f
      ),
    })),

  updateFileThumbnail: (id: string, thumbnail: string) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, thumbnail } : f)),
    })),

  // -------------------------------------------------------------------------
  // Processing State Actions
  // -------------------------------------------------------------------------

  setProcessing: (isProcessing: boolean) => set({ isProcessing }),

  setCancelled: (isCancelled: boolean) => set({ isCancelled }),

  setCurrentFileIndex: (index: number) => set({ currentFileIndex: index }),

  setFFmpegReady: (ready: boolean) => set({ ffmpegReady: ready }),

  // -------------------------------------------------------------------------
  // Computed Values
  // -------------------------------------------------------------------------

  getOverallProgress: () => calculateOverallProgress(get().files),

  getStats: () => calculateStats(get().files),
}));

export default useVideoStore;

// ============================================================================
// Re-exports
// ============================================================================

export { calculateOverallProgress, calculateStats } from '../utils';
