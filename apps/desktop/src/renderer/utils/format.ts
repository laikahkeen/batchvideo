export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const calculatePredictedSize = (
  fileSize: number,
  durationSeconds: number,
  options: {
    compressionMethod: 'percentage' | 'size_per_minute' | 'quality';
    targetPercentage?: number;
    targetSizePerMinute?: number;
    qualityCrf?: number;
  }
): number | null => {
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
};
