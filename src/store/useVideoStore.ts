import { create } from 'zustand';
import type { VideoStoreState, FileStatus, Codec, Resolution } from '../types';

const useVideoStore = create<VideoStoreState>((set, get) => ({
  // Video files
  files: [],

  // LUT
  lut: null,
  lutFile: null,

  // Compression settings
  compressionQuality: 23, // CRF value (18-28)
  codec: 'h264' as Codec,
  resolution: 'original' as Resolution,

  // Processing state
  isProcessing: false,
  currentFileIndex: -1,
  processingProgress: {},

  // FFmpeg instance
  ffmpegLoaded: false,

  // Actions
  addFiles: (newFiles: File[]) =>
    set((state) => ({
      files: [
        ...state.files,
        ...newFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          name: file.name,
          size: file.size,
          thumbnail: null,
          status: 'pending' as FileStatus,
          progress: 0,
          outputUrl: null,
          error: null,
        })),
      ],
    })),

  removeFile: (id: string) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ files: [] }),

  setLUT: (lutFile: File) => set({ lutFile, lut: lutFile }),

  removeLUT: () => set({ lutFile: null, lut: null }),

  setCompressionQuality: (quality: number) => set({ compressionQuality: quality }),

  setCodec: (codec: Codec) => set({ codec }),

  setResolution: (resolution: Resolution) => set({ resolution }),

  updateFileStatus: (id: string, status: FileStatus) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, status } : f)),
    })),

  updateFileProgress: (id: string, progress: number) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, progress } : f)),
    })),

  updateFileOutput: (id: string, outputUrl: string) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, outputUrl, status: 'completed' as FileStatus } : f)),
    })),

  updateFileError: (id: string, error: string) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, error, status: 'error' as FileStatus } : f)),
    })),

  updateFileThumbnail: (id: string, thumbnail: string) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, thumbnail } : f)),
    })),

  setProcessing: (isProcessing: boolean) => set({ isProcessing }),

  setCurrentFileIndex: (index: number) => set({ currentFileIndex: index }),

  setFFmpegLoaded: (loaded: boolean) => set({ ffmpegLoaded: loaded }),

  // Get overall progress
  getOverallProgress: () => {
    const state = get();
    if (state.files.length === 0) return 0;
    const totalProgress = state.files.reduce((acc, file) => acc + file.progress, 0);
    return Math.round(totalProgress / state.files.length);
  },

  // Get processing stats
  getStats: () => {
    const state = get();
    return {
      total: state.files.length,
      completed: state.files.filter((f) => f.status === 'completed').length,
      processing: state.files.filter((f) => f.status === 'processing').length,
      pending: state.files.filter((f) => f.status === 'pending').length,
      error: state.files.filter((f) => f.status === 'error').length,
    };
  },
}));

export default useVideoStore;
