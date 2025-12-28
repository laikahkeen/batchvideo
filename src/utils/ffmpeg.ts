import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ProcessingOptions } from '../types';

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
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    // Add LUT filter if present
    if (options.lutFile) {
      args.push('-vf', 'lut3d=lut.cube');
    }

    // Add codec settings
    if (options.codec === 'h264') {
      args.push('-c:v', 'libx264');
    } else if (options.codec === 'h265') {
      args.push('-c:v', 'libx265');
    }

    // Add CRF (quality)
    args.push('-crf', String(options.compressionQuality));

    // Add preset for speed/quality balance
    args.push('-preset', 'medium');

    // Resolution scaling
    if (options.resolution !== 'original') {
      args.push('-vf', `scale=${options.resolution}:-1`);
    }

    // Copy audio
    args.push('-c:a', 'copy');

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

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      resolve(0);
    };

    video.src = URL.createObjectURL(file);
  });
};
