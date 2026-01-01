import { ipcMain, app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

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

interface ProgressInfo {
  percent?: number;
  timemark?: string;
}

// Store active processes for cancellation
const activeProcesses = new Map<string, ffmpeg.FfmpegCommand>();

// Get FFmpeg binary paths - uses bundled binaries from ffmpeg-static
function getFFmpegPath(): string {
  if (!ffmpegStatic) {
    throw new Error('ffmpeg-static binary path not found');
  }
  // In packaged app, the path needs to be adjusted for asar
  if (app.isPackaged) {
    // ffmpeg-static binary is unpacked from asar
    return ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
  }
  return ffmpegStatic;
}

function getFFprobePath(): string {
  if (app.isPackaged) {
    return ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');
  }
  return ffprobeStatic.path;
}

// Initialize FFmpeg paths with bundled binaries
const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Calculate target bitrate based on compression method
function calculateTargetBitrate(
  compressionMethod: ProcessOptions['compressionMethod'],
  options: {
    fileSize?: number;
    duration?: number;
    targetPercentage?: number;
    targetSizePerMinute?: number;
  }
): number | null {
  const { fileSize, duration, targetPercentage, targetSizePerMinute } = options;

  if (!duration || duration <= 0) return null;

  switch (compressionMethod) {
    case 'percentage': {
      if (!targetPercentage || !fileSize) return null;
      const originalSizeMB = fileSize / (1024 * 1024);
      const targetSizeMB = originalSizeMB * (targetPercentage / 100);
      const totalBitrate = (targetSizeMB * 8 * 1024) / duration;
      const audioBitrate = 128;
      return Math.max(500, Math.round(totalBitrate - audioBitrate));
    }

    case 'size_per_minute': {
      if (!targetSizePerMinute) return null;
      const totalBitrate = (targetSizePerMinute * 8 * 1024) / 60;
      const audioBitrate = 128;
      return Math.max(500, Math.round(totalBitrate - audioBitrate));
    }

    default:
      return null;
  }
}

// Get video metadata
async function getVideoMetadata(inputPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  bitrate: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        bitrate: metadata.format.bit_rate ? parseInt(String(metadata.format.bit_rate)) / 1000 : 0,
      });
    });
  });
}

// Generate thumbnail
async function generateThumbnail(inputPath: string): Promise<string> {
  const tempDir = os.tmpdir();
  const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const outputPath = path.join(tempDir, thumbnailName);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        folder: tempDir,
        filename: thumbnailName,
        size: '320x?',
      })
      .on('end', () => {
        // Read the file and convert to base64 data URL
        const data = fs.readFileSync(outputPath);
        const base64 = data.toString('base64');
        fs.unlinkSync(outputPath); // Clean up temp file
        resolve(`data:image/jpeg;base64,${base64}`);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Process video
async function processVideo(
  jobId: string,
  options: ProcessOptions,
  onProgress: (progress: number) => void
): Promise<{ outputPath: string; size: number }> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(options.inputPath);

    // Store for cancellation
    activeProcesses.set(jobId, command);

    // Build video filters
    const videoFilters: string[] = [];

    if (options.lutPath) {
      videoFilters.push(`lut3d=${options.lutPath}`);
    }

    if (options.resolution !== 'original') {
      videoFilters.push(`scale=${options.resolution}:-1`);
    }

    if (videoFilters.length > 0) {
      command = command.videoFilter(videoFilters.join(','));
    }

    // LUT Only Mode
    if (options.isLutOnlyMode) {
      command = command.videoCodec('libx264').outputOptions(['-preset', 'ultrafast', '-crf', '18']).audioCodec('copy');
    } else {
      // Normal compression mode
      const videoCodec = options.codec === 'h265' ? 'libx265' : 'libx264';
      command = command.videoCodec(videoCodec);

      // Determine encoding parameters
      let shouldUseBitrate = false;
      let targetBitrate = 0;
      const targetCRF = options.qualityCrf || 23;

      if (options.compressionMethod === 'percentage' || options.compressionMethod === 'size_per_minute') {
        const calculatedBitrate = calculateTargetBitrate(options.compressionMethod, {
          fileSize: options.fileSize,
          duration: options.duration,
          targetPercentage: options.targetPercentage,
          targetSizePerMinute: options.targetSizePerMinute,
        });

        if (calculatedBitrate) {
          shouldUseBitrate = true;
          targetBitrate = calculatedBitrate;
        }
      }

      const outputOptions: string[] = [];
      outputOptions.push('-preset', options.preset);

      if (shouldUseBitrate) {
        outputOptions.push('-b:v', `${targetBitrate}k`);
      } else {
        outputOptions.push('-crf', String(targetCRF));

        if (options.maxBitrate && options.maxBitrate > 0) {
          outputOptions.push('-maxrate', `${options.maxBitrate}k`);
          const bufSize = options.bufferSize && options.bufferSize > 0 ? options.bufferSize : options.maxBitrate * 2;
          outputOptions.push('-bufsize', `${bufSize}k`);
        }
      }

      command = command.outputOptions(outputOptions).audioCodec('copy');
    }

    command
      .on('progress', (progress: ProgressInfo) => {
        onProgress(progress.percent || 0);
      })
      .on('end', () => {
        activeProcesses.delete(jobId);
        const stats = fs.statSync(options.outputPath);
        resolve({ outputPath: options.outputPath, size: stats.size });
      })
      .on('error', (err) => {
        activeProcesses.delete(jobId);
        reject(err);
      })
      .save(options.outputPath);
  });
}

// Cancel processing
function cancelProcess(jobId: string): boolean {
  const process = activeProcesses.get(jobId);
  if (process) {
    process.kill('SIGKILL');
    activeProcesses.delete(jobId);
    return true;
  }
  return false;
}

// Check if FFmpeg is available
async function checkFFmpeg(): Promise<{ available: boolean; version?: string; error?: string }> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err, _formats) => {
      if (err) {
        resolve({ available: false, error: err.message });
        return;
      }

      // Get version
      ffmpeg.getAvailableCodecs((err2, codecs) => {
        if (err2) {
          resolve({ available: true, version: 'unknown' });
          return;
        }

        const hasH264 = codecs['libx264'] !== undefined;
        const hasH265 = codecs['libx265'] !== undefined;

        resolve({
          available: true,
          version: `H.264: ${hasH264 ? 'yes' : 'no'}, H.265: ${hasH265 ? 'yes' : 'no'}`,
        });
      });
    });
  });
}

export function setupFFmpegHandlers(): void {
  // Check FFmpeg availability
  ipcMain.handle('ffmpeg:check', async () => {
    return checkFFmpeg();
  });

  // Get video metadata
  ipcMain.handle('ffmpeg:getMetadata', async (_, inputPath: string) => {
    try {
      return await getVideoMetadata(inputPath);
    } catch (error) {
      throw new Error(`Failed to get metadata: ${(error as Error).message}`);
    }
  });

  // Generate thumbnail
  ipcMain.handle('ffmpeg:generateThumbnail', async (_, inputPath: string) => {
    try {
      return await generateThumbnail(inputPath);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  });

  // Process video
  ipcMain.handle('ffmpeg:process', async (event, jobId: string, options: ProcessOptions) => {
    try {
      return await processVideo(jobId, options, (progress) => {
        event.sender.send('ffmpeg:progress', { jobId, progress });
      });
    } catch (error) {
      throw new Error(`Processing failed: ${(error as Error).message}`);
    }
  });

  // Cancel processing
  ipcMain.handle('ffmpeg:cancel', async (_, jobId: string) => {
    return cancelProcess(jobId);
  });

  // Cancel all processing
  ipcMain.handle('ffmpeg:cancelAll', async () => {
    const ids = Array.from(activeProcesses.keys());
    ids.forEach((id) => cancelProcess(id));
    return ids.length;
  });
}
