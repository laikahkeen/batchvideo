/**
 * Shared utility functions for BatchVideo
 */

import type { FileStatus, ProcessingStats } from '@workspace/shared/types';

// ============================================================================
// File Size Formatting
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  return Math.round(value * (units[unit] || 1));
}

// ============================================================================
// Duration Formatting
// ============================================================================

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '--:--';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);

  if (parts.length === 3) {
    const [hrs, mins, secs] = parts;
    return hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const [mins, secs] = parts;
    return mins * 60 + secs;
  }

  return 0;
}

// ============================================================================
// File Validation
// ============================================================================

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mts', '.m4v', '.avi', '.mkv'];
const LUT_EXTENSIONS = ['.cube'];

export function isValidVideoFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(ext);
}

export function isValidLutFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return LUT_EXTENSIONS.includes(ext);
}

export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
}

// ============================================================================
// Progress Calculation
// ============================================================================

interface FileWithProgress {
  status: FileStatus;
  progress: number;
}

export function calculateOverallProgress(files: FileWithProgress[]): number {
  if (files.length === 0) return 0;

  const totalProgress = files.reduce((acc, file) => {
    if (file.status === 'completed') return acc + 100;
    if (file.status === 'processing') {
      return acc + Math.min(Math.max(file.progress || 0, 0), 100);
    }
    return acc;
  }, 0);

  const result = Math.round(totalProgress / files.length);
  return isNaN(result) || !isFinite(result) ? 0 : Math.min(Math.max(result, 0), 100);
}

export function calculateStats(files: FileWithProgress[]): ProcessingStats {
  return {
    total: files.length,
    completed: files.filter((f) => f.status === 'completed').length,
    processing: files.filter((f) => f.status === 'processing').length,
    pending: files.filter((f) => f.status === 'pending').length,
    error: files.filter((f) => f.status === 'error').length,
  };
}

// ============================================================================
// ID Generation
// ============================================================================

export function generateFileId(timestamp: number, index: number): string {
  return `${timestamp}-${index}`;
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Bitrate Calculation
// ============================================================================

export function calculateTargetBitrate(targetSizeMB: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const bitsPerSecond = (targetSizeMB * 8 * 1024 * 1024) / durationSeconds;
  return Math.round(bitsPerSecond / 1000);
}

export function estimateOutputSize(bitrateKbps: number, durationSeconds: number): number {
  return Math.round((bitrateKbps * 1000 * durationSeconds) / 8);
}

export function calculateTargetSizeFromPercentage(originalSize: number, targetPercentage: number): number {
  return Math.round((originalSize * targetPercentage) / 100);
}

export function calculateTargetSizeFromSizePerMinute(sizePerMinuteMB: number, durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return Math.round(sizePerMinuteMB * durationMinutes * 1024 * 1024);
}

// ============================================================================
// Percentage Helpers
// ============================================================================

export function calculateCompressionRatio(originalSize: number, outputSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round((outputSize / originalSize) * 100);
}

export function calculateSavings(originalSize: number, outputSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - outputSize) / originalSize) * 100);
}

// ============================================================================
// String Helpers
// ============================================================================

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;

  const ext = getFileExtension(filename);
  const name = getFileNameWithoutExtension(filename);
  const availableLength = maxLength - ext.length - 3;

  if (availableLength < 5) return filename.substring(0, maxLength - 3) + '...';

  return name.substring(0, availableLength) + '...' + ext;
}

// ============================================================================
// Predicted Size Calculation
// ============================================================================

export interface PredictedSizeOptions {
  compressionMethod: 'percentage' | 'size_per_minute' | 'quality';
  targetPercentage?: number;
  targetSizePerMinute?: number;
  qualityCrf?: number;
}

export function calculatePredictedSize(
  fileSize: number,
  durationSeconds: number,
  options: PredictedSizeOptions
): number | null {
  if (!durationSeconds || durationSeconds <= 0) return null;

  const durationMin = durationSeconds / 60;

  switch (options.compressionMethod) {
    case 'percentage': {
      if (!options.targetPercentage) return null;
      return Math.round(fileSize * (options.targetPercentage / 100));
    }

    case 'size_per_minute': {
      if (!options.targetSizePerMinute) return null;
      const targetSizeMB = options.targetSizePerMinute * durationMin;
      return Math.round(targetSizeMB * 1024 * 1024);
    }

    case 'quality': {
      // CRF mode: file size cannot be accurately predicted
      return null;
    }

    default:
      return null;
  }
}
