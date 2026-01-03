/**
 * Web Platform Adapter
 *
 * Implements PlatformAdapter for browser environment using FFmpeg.wasm.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type {
  PlatformAdapter,
  FFmpegStatus,
  FileInputInfo,
  ProcessingOptions,
  ProcessingResult,
} from '@workspace/shared/platform';
import { generateUniqueId, calculateTargetBitrate } from '@workspace/shared/utils';
import { WEB_MAX_FILE_SIZE } from '@workspace/shared/types';

// FFmpeg instance singleton
let ffmpegInstance: FFmpeg | null = null;
let currentProgressCallback: ((progress: number) => void) | null = null;

// ============================================================================
// FFmpeg Helpers
// ============================================================================

const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  // Set up progress listener
  ffmpeg.on('progress', ({ progress }) => {
    if (currentProgressCallback) {
      currentProgressCallback(Math.round(progress * 100));
    }
  });

  // Load from CDN
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

// ============================================================================
// Web Platform Adapter Implementation
// ============================================================================

export const webAdapter: PlatformAdapter = {
  type: 'web',

  // ---------------------------------------------------------------------------
  // FFmpeg Initialization
  // ---------------------------------------------------------------------------

  async initFFmpeg(): Promise<FFmpegStatus> {
    try {
      await loadFFmpeg();
      return { available: true };
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Failed to load FFmpeg.wasm',
      };
    }
  },

  // ---------------------------------------------------------------------------
  // File Selection
  // ---------------------------------------------------------------------------

  async selectFiles(): Promise<FileInputInfo[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*,.mp4,.mov,.mts,.m4v,.avi,.mkv';
      input.multiple = true;

      input.onchange = () => {
        const files = Array.from(input.files || []);
        const timestamp = Date.now();

        const fileInfos: FileInputInfo[] = files.map((file, index) => ({
          id: `${timestamp}-${index}`,
          name: file.name,
          size: file.size,
          source: file,
        }));

        resolve(fileInfos);
      };

      input.oncancel = () => {
        resolve([]);
      };

      input.click();
    });
  },

  supportsDragDrop: true,

  async handleDroppedFiles(files: File[]): Promise<FileInputInfo[]> {
    const timestamp = Date.now();

    return files.map((file, index) => ({
      id: `${timestamp}-${index}`,
      name: file.name,
      size: file.size,
      source: file,
    }));
  },

  // ---------------------------------------------------------------------------
  // File Metadata
  // ---------------------------------------------------------------------------

  async getVideoDuration(file: File | string): Promise<number> {
    if (typeof file === 'string') {
      // Web adapter only handles File objects
      return 0;
    }

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
  },

  async generateThumbnail(file: File | string): Promise<string | null> {
    if (typeof file === 'string') {
      return null;
    }

    let inputName = '';
    let outputName = '';

    try {
      const ffmpeg = await loadFFmpeg();

      const uniqueId = generateUniqueId();
      inputName = `input-${uniqueId}.mp4`;
      outputName = `thumbnail-${uniqueId}.jpg`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(['-i', inputName, '-vframes', '1', '-vf', 'scale=320:-1', outputName]);

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

      // Cleanup on error
      if (ffmpegInstance && inputName) {
        await ffmpegInstance.deleteFile(inputName).catch(() => {});
      }
      if (ffmpegInstance && outputName) {
        await ffmpegInstance.deleteFile(outputName).catch(() => {});
      }

      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // Processing
  // ---------------------------------------------------------------------------

  async processVideo(
    _jobId: string,
    file: File | string,
    options: ProcessingOptions,
    onProgress: (progress: number) => void
  ): Promise<ProcessingResult> {
    if (typeof file === 'string') {
      throw new Error('Web adapter only supports File objects');
    }

    const ffmpeg = await loadFFmpeg();

    // Set progress callback
    currentProgressCallback = onProgress;

    const inputName = file.name;
    const outputName = `processed_${file.name}`;

    try {
      // Write input file
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Write LUT file if provided
      if (options.lut && typeof options.lut !== 'string') {
        await ffmpeg.writeFile('lut.cube', await fetchFile(options.lut));
      }

      // Build FFmpeg command
      const args: string[] = ['-i', inputName];

      if (options.isLutOnlyMode) {
        // LUT Only Mode
        if (options.lut) {
          args.push('-vf', 'lut3d=lut.cube');
          args.push('-c:v', 'libx264');
          args.push('-preset', 'ultrafast');
          args.push('-crf', '18');
        }
        args.push('-c:a', 'copy');
      } else {
        // Normal compression mode
        const videoFilters: string[] = [];

        if (options.lut) {
          videoFilters.push('lut3d=lut.cube');
        }

        if (options.resolution !== 'original') {
          videoFilters.push(`scale=${options.resolution}:-1`);
        }

        if (videoFilters.length > 0) {
          args.push('-vf', videoFilters.join(','));
        }

        // Codec
        if (options.codec === 'h264') {
          args.push('-c:v', 'libx264');
        } else if (options.codec === 'h265') {
          args.push('-c:v', 'libx265');
        }

        // Encoding parameters
        let shouldUseBitrate = false;
        let targetBitrate = 0;
        let targetCRF = 23;

        switch (options.compressionMethod) {
          case 'percentage':
          case 'size_per_minute': {
            const duration = options.duration || (await this.getVideoDuration(file));
            if (duration > 0) {
              const calculatedBitrate = calculateTargetBitrate(
                options.compressionMethod === 'percentage'
                  ? (file.size / (1024 * 1024)) * (options.targetPercentage / 100)
                  : options.targetSizePerMinute * (duration / 60),
                duration
              );

              if (calculatedBitrate > 0) {
                shouldUseBitrate = true;
                targetBitrate = calculatedBitrate;
              }
            }
            break;
          }
          case 'quality':
            targetCRF = options.qualityCrf || 23;
            break;
        }

        if (shouldUseBitrate) {
          args.push('-b:v', `${targetBitrate}k`);
        } else {
          args.push('-crf', String(targetCRF));

          if (options.maxBitrate && options.maxBitrate > 0) {
            args.push('-maxrate', `${options.maxBitrate}k`);
            const bufSize = options.bufferSize && options.bufferSize > 0 ? options.bufferSize : options.maxBitrate * 2;
            args.push('-bufsize', `${bufSize}k`);
          }
        }

        args.push('-preset', options.preset);
        args.push('-c:a', 'copy');
      }

      args.push(outputName);

      console.log('FFmpeg command:', args.join(' '));

      // Execute
      await ffmpeg.exec(args);

      // Read output
      const data = await ffmpeg.readFile(outputName);
      if (typeof data === 'string') {
        throw new Error('Expected binary data but got string');
      }

      const blob = new Blob([new Uint8Array(data)], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      if (options.lut) {
        await ffmpeg.deleteFile('lut.cube').catch(() => {});
      }

      currentProgressCallback = null;

      return { output: url, size: blob.size };
    } catch (error) {
      currentProgressCallback = null;

      // Cleanup on error
      try {
        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});
        if (options.lut) {
          await ffmpeg.deleteFile('lut.cube').catch(() => {});
        }
      } catch {
        // Ignore cleanup errors
      }

      throw error;
    }
  },

  async cancelProcessing(_jobId: string): Promise<void> {
    // FFmpeg.wasm doesn't support cancellation directly
    // We rely on the isCancelled flag in the store
    currentProgressCallback = null;
  },

  async cancelAllProcessing(): Promise<void> {
    currentProgressCallback = null;
  },

  // ---------------------------------------------------------------------------
  // Output Handling
  // ---------------------------------------------------------------------------

  downloadOutput(output: string, filename: string): void {
    const a = document.createElement('a');
    a.href = output;
    a.download = filename;
    a.click();
  },

  // ---------------------------------------------------------------------------
  // Platform Capabilities
  // ---------------------------------------------------------------------------

  maxFileSize: WEB_MAX_FILE_SIZE,
  supportsOutputDirectory: false,
  supportsShowInFolder: false,

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  cleanup(): void {
    // Revoke any object URLs if needed
    currentProgressCallback = null;
  },
};

export default webAdapter;
