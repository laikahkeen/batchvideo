import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ProcessingOptions, CompressionMethod } from '../types';

let ffmpegInstance: FFmpeg | null = null;

export const loadFFmpeg = async (onProgress?: (progress: number) => void): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    // If already loaded, update the progress callback if provided
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  // Load from CDN (unpkg) - works in both dev and production
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

export const getFFmpeg = (): FFmpeg | null => ffmpegInstance;

export const generateThumbnail = async (file: File): Promise<string | null> => {
  let inputName = '';
  let outputName = '';

  try {
    // Ensure FFmpeg is loaded
    const ffmpeg = await loadFFmpeg();

    // Use unique filenames to avoid conflicts when multiple thumbnails are generated concurrently
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    inputName = `input-${uniqueId}.mp4`;
    outputName = `thumbnail-${uniqueId}.jpg`;

    // Write input file
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Extract first frame (much faster than seeking to 1 second)
    // -vframes 1: Extract only 1 frame
    // -vf scale=320:-1: Scale to 320px width, maintain aspect ratio
    await ffmpeg.exec(['-i', inputName, '-vframes', '1', '-vf', 'scale=320:-1', outputName]);

    // Read output file
    const data = await ffmpeg.readFile(outputName);
    if (typeof data === 'string') {
      throw new Error('Expected binary data but got string');
    }
    const blob = new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    // Cleanup
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});

    return url;
  } catch (error) {
    console.error('Error generating thumbnail:', error);

    // Ensure cleanup even on error
    if (ffmpegInstance && inputName) {
      try {
        await ffmpegInstance.deleteFile(inputName).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (ffmpegInstance && outputName) {
      try {
        await ffmpegInstance.deleteFile(outputName).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return null;
  }
};

export const processVideo = async (
  file: File,
  options: ProcessingOptions,
  onProgress?: (progress: number) => void
): Promise<{ url: string; size: number }> => {
  const ffmpeg = await loadFFmpeg(onProgress);

  const inputName = file.name;
  const outputName = `processed_${file.name}`;

  try {
    // Write input file
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Write LUT file if provided
    if (options.lutFile) {
      await ffmpeg.writeFile('lut.cube', await fetchFile(options.lutFile));
    }

    // Build FFmpeg command
    const args: string[] = ['-i', inputName];

    // LUT Only Mode: Apply LUT with minimal re-encoding
    if (options.isLutOnlyMode) {
      if (options.lutFile) {
        // Apply LUT filter - must re-encode video
        args.push('-vf', 'lut3d=lut.cube');
        // Use very fast preset and high quality CRF to maintain quality
        args.push('-c:v', 'libx264');
        args.push('-preset', 'ultrafast');
        args.push('-crf', '18'); // Very high quality
      }
      // Copy audio without re-encoding
      args.push('-c:a', 'copy');
    } else {
      // Normal compression mode

      // Build video filters (combine LUT + resolution to avoid overwriting -vf)
      const videoFilters: string[] = [];

      if (options.lutFile) {
        videoFilters.push('lut3d=lut.cube');
      }

      if (options.resolution !== 'original') {
        videoFilters.push(`scale=${options.resolution}:-1`);
      }

      if (videoFilters.length > 0) {
        args.push('-vf', videoFilters.join(','));
      }

      // Add codec settings
      if (options.codec === 'h264') {
        args.push('-c:v', 'libx264');
      } else if (options.codec === 'h265') {
        args.push('-c:v', 'libx265');
      }

      // Determine encoding parameters based on compression method
      let shouldUseBitrate = false;
      let targetBitrate = 0;
      let targetCRF = 23;

      switch (options.compressionMethod) {
        case 'percentage':
        case 'size_per_minute': {
          // Calculate target bitrate
          const calculatedBitrate = await calculateTargetBitrate(file, options.compressionMethod, {
            targetPercentage: options.targetPercentage,
            targetSizePerMinute: options.targetSizePerMinute,
          });

          if (calculatedBitrate) {
            shouldUseBitrate = true;
            targetBitrate = calculatedBitrate;
          } else {
            // Fallback to CRF if calculation fails
            console.warn('Failed to calculate bitrate, falling back to CRF 23');
            targetCRF = 23;
          }
          break;
        }

        case 'quality': {
          // Use CRF mode with quality value
          targetCRF = options.qualityCrf || 23;
          break;
        }

        default:
          // Fallback to CRF 23
          targetCRF = 23;
      }

      // Apply encoding mode
      if (shouldUseBitrate) {
        args.push('-b:v', `${targetBitrate}k`);
      } else {
        args.push('-crf', String(targetCRF));

        // Add maxBitrate constraint if specified (for quality mode)
        if (options.maxBitrate && options.maxBitrate > 0) {
          args.push('-maxrate', `${options.maxBitrate}k`);

          // Add buffer size (defaults to 2x maxBitrate if not specified or 0)
          const bufSize = options.bufferSize && options.bufferSize > 0
            ? options.bufferSize
            : options.maxBitrate * 2;
          args.push('-bufsize', `${bufSize}k`);
        }
      }

      // Add preset for speed/quality balance
      args.push('-preset', options.preset);

      // Copy audio
      args.push('-c:a', 'copy');
    }

    // Output file
    args.push(outputName);

    console.log('FFmpeg command:', args.join(' '));

    // Execute
    await ffmpeg.exec(args);

    // Read output file
    const data = await ffmpeg.readFile(outputName);
    if (typeof data === 'string') {
      throw new Error('Expected binary data but got string');
    }
    const blob = new Blob([new Uint8Array(data)], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    if (options.lutFile) {
      await ffmpeg.deleteFile('lut.cube');
    }

    return { url, size: blob.size };
  } catch (error) {
    console.error('Error processing video:', error);

    // Cleanup on error
    try {
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
      if (options.lutFile) {
        await ffmpeg.deleteFile('lut.cube').catch(() => {});
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    throw error;
  }
};

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

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const cleanup = () => {
      if (video.src) {
        window.URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      cleanup();
      resolve(video.duration);
    };

    video.onerror = () => {
      cleanup();
      resolve(0);
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate target bitrate based on compression method
 * Returns bitrate in kbps
 */
export const calculateTargetBitrate = async (
  file: File,
  compressionMethod: CompressionMethod,
  options: {
    targetPercentage?: number;
    targetSizePerMinute?: number;
  }
): Promise<number | null> => {
  try {
    const duration = await getVideoDuration(file);
    if (!duration || duration <= 0) return null;

    const originalSizeMB = file.size / (1024 * 1024);

    switch (compressionMethod) {
      case 'percentage': {
        if (!options.targetPercentage) return null;
        // Calculate target size in MB
        const targetSizeMB = originalSizeMB * (options.targetPercentage / 100);
        // Convert to bitrate (kbps)
        // Formula: (size_MB * 8 * 1024) / duration_seconds
        // Subtract audio bitrate (assume 128 kbps) to get video bitrate
        const totalBitrate = (targetSizeMB * 8 * 1024) / duration;
        const audioBitrate = 128; // kbps
        const videoBitrate = Math.max(500, totalBitrate - audioBitrate); // Minimum 500 kbps
        return Math.round(videoBitrate);
      }

      case 'size_per_minute': {
        if (!options.targetSizePerMinute) return null;
        // Calculate bitrate from MB/min
        // Formula: (MB_per_min * 8 * 1024) / 60
        const totalBitrate = (options.targetSizePerMinute * 8 * 1024) / 60;
        const audioBitrate = 128; // kbps
        const videoBitrate = Math.max(500, totalBitrate - audioBitrate);
        return Math.round(videoBitrate);
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error calculating target bitrate:', error);
    return null;
  }
};

export const calculatePredictedSize = (
  file: File,
  durationSeconds: number,
  options: {
    compressionMethod: CompressionMethod;
    targetPercentage?: number;
    targetSizePerMinute?: number;
    qualityCrf?: number;
  }
): number | null => {
  if (!durationSeconds || durationSeconds <= 0) return null;

  const originalSizeBytes = file.size;
  const durationMin = durationSeconds / 60;

  switch (options.compressionMethod) {
    case 'percentage': {
      if (!options.targetPercentage) return null;
      // Calculate based on percentage of original size
      return Math.round(originalSizeBytes * (options.targetPercentage / 100));
    }

    case 'size_per_minute': {
      if (!options.targetSizePerMinute) return null;
      // Calculate based on MB per minute
      const targetSizeMB = options.targetSizePerMinute * durationMin;
      return Math.round(targetSizeMB * 1024 * 1024);
    }

    case 'quality': {
      // CRF mode: file size is content-dependent and cannot be accurately predicted
      return null;
    }

    default:
      return null;
  }
};

export const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

export const checkFileSizeLimit = (
  currentFiles: { size: number }[],
  newFiles: File[]
): { withinLimit: boolean; currentSize: number; newSize: number; totalSize: number } => {
  const currentSize = currentFiles.reduce((sum, f) => sum + f.size, 0);
  const newSize = newFiles.reduce((sum, f) => sum + f.size, 0);
  const totalSize = currentSize + newSize;

  return {
    withinLimit: totalSize <= MAX_TOTAL_SIZE,
    currentSize,
    newSize,
    totalSize
  };
};
