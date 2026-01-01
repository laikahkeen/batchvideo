import { create } from 'zustand';
import type {
  VideoStoreState,
  FileStatus,
  Codec,
  Resolution,
  FFmpegPreset,
  CompressionMethod
} from '../types';

const useVideoStore = create<VideoStoreState>((set, get) => ({
  // Video files
  files: [],

  // LUT
  lutPath: null,

  // Output directory
  outputDir: null,

  // Compression settings
  compressionMethod: 'quality' as CompressionMethod,
  targetPercentage: 60,
  targetSizePerMinute: 15,

  // Quality mode (CRF) settings
  qualityCrf: 23,
  maxBitrate: 0,
  bufferSize: 0,
  preset: 'medium' as FFmpegPreset,

  // Global settings
  codec: 'h264' as Codec,
  resolution: 'original' as Resolution,
  isLutOnlyMode: false,

  // Processing state
  isProcessing: false,
  isCancelled: false,
  currentFileIndex: -1,

  // FFmpeg status
  ffmpegAvailable: false,
  ffmpegVersion: null,

  // Actions
  addFiles: async (filePaths: string[]) => {
    const timestamp = Date.now();
    const newFiles = await Promise.all(
      filePaths.map(async (filePath, index) => {
        const fileInfo = await window.api.file.getInfo(filePath);
        return {
          id: `${timestamp}-${index}`,
          path: filePath,
          name: fileInfo.name,
          size: fileInfo.size,
          duration: null,
          thumbnail: null,
          status: 'pending' as FileStatus,
          progress: 0,
          outputPath: null,
          outputSize: null,
          predictedSize: null,
          error: null
        };
      })
    );

    set((state) => ({
      files: [...state.files, ...newFiles]
    }));

    // Generate thumbnails and get metadata in background
    for (const file of newFiles) {
      // Get metadata
      window.api.ffmpeg.getMetadata(file.path).then((metadata) => {
        get().updateFileDuration(file.id, metadata.duration);
      }).catch(console.error);

      // Generate thumbnail
      window.api.ffmpeg.generateThumbnail(file.path).then((thumbnail) => {
        if (thumbnail) {
          get().updateFileThumbnail(file.id, thumbnail);
        }
      }).catch(console.error);
    }
  },

  removeFile: (id: string) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id)
    })),

  clearFiles: () => set({ files: [] }),

  setLUT: (lutPath: string) => set({ lutPath }),

  removeLUT: () => set({ lutPath: null, isLutOnlyMode: false }),

  setOutputDir: (dir: string | null) => set({ outputDir: dir }),

  // Compression method setters
  setCompressionMethod: (method: CompressionMethod) =>
    set({ compressionMethod: method }),

  setTargetPercentage: (percentage: number) =>
    set({ targetPercentage: percentage }),

  setTargetSizePerMinute: (size: number) => set({ targetSizePerMinute: size }),

  // Quality mode (CRF) setters
  setQualityCrf: (crf: number) => set({ qualityCrf: crf }),

  setMaxBitrate: (bitrate: number) => set({ maxBitrate: bitrate }),

  setBufferSize: (size: number) => set({ bufferSize: size }),

  setPreset: (preset: FFmpegPreset) => set({ preset }),

  // Global setters
  setCodec: (codec: Codec) => set({ codec }),

  setResolution: (resolution: Resolution) => set({ resolution }),

  setLutOnlyMode: (isLutOnly: boolean) => set({ isLutOnlyMode: isLutOnly }),

  updateFileStatus: (id: string, status: FileStatus) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, status } : f))
    })),

  updateFileProgress: (id: string, progress: number) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, progress } : f))
    })),

  updateFileOutput: (id: string, outputPath: string, outputSize?: number) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              outputPath,
              outputSize: outputSize ?? null,
              status: 'completed' as FileStatus
            }
          : f
      )
    })),

  updateFilePredictedSize: (id: string, predictedSize: number) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, predictedSize } : f
      )
    })),

  updateFileDuration: (id: string, duration: number) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, duration } : f))
    })),

  updateFileError: (id: string, error: string) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, error, status: 'error' as FileStatus } : f
      )
    })),

  updateFileThumbnail: (id: string, thumbnail: string) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, thumbnail } : f))
    })),

  setProcessing: (isProcessing: boolean) => set({ isProcessing }),

  setCancelled: (isCancelled: boolean) => set({ isCancelled }),

  setCurrentFileIndex: (index: number) => set({ currentFileIndex: index }),

  setFFmpegStatus: (available: boolean, version?: string) =>
    set({ ffmpegAvailable: available, ffmpegVersion: version || null }),

  // Get overall progress
  getOverallProgress: () => {
    const state = get();
    if (state.files.length === 0) return 0;

    const totalProgress = state.files.reduce((acc, file) => {
      if (file.status === 'completed') return acc + 100;
      if (file.status === 'processing')
        return acc + Math.min(Math.max(file.progress || 0, 0), 100);
      return acc;
    }, 0);

    const result = Math.round(totalProgress / state.files.length);
    return isNaN(result) || !isFinite(result)
      ? 0
      : Math.min(Math.max(result, 0), 100);
  },

  // Get processing stats
  getStats: () => {
    const state = get();
    return {
      total: state.files.length,
      completed: state.files.filter((f) => f.status === 'completed').length,
      processing: state.files.filter((f) => f.status === 'processing').length,
      pending: state.files.filter((f) => f.status === 'pending').length,
      error: state.files.filter((f) => f.status === 'error').length
    };
  }
}));

export default useVideoStore;
