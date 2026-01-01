import { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Loader, Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import useVideoStore from '../store/useVideoStore';
import {
  formatFileSize,
  generateThumbnail,
  getVideoDuration,
  calculatePredictedSize,
  checkFileSizeLimit,
  MAX_TOTAL_SIZE,
} from '../utils/ffmpeg';
import type { VideoFile } from '../types';

interface FileItemProps {
  file: VideoFile;
}

const FileItem = ({ file }: FileItemProps) => {
  const { removeFile, isProcessing, updateFileThumbnail } = useVideoStore();

  useEffect(() => {
    let cancelled = false;

    if (!file.thumbnail && file.file) {
      // Generate thumbnail with retry logic
      const attemptGeneration = async (retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          if (cancelled) return;

          try {
            const thumb = await generateThumbnail(file.file);
            if (thumb && !cancelled) {
              updateFileThumbnail(file.id, thumb);
              return;
            }
          } catch (error) {
            console.error(`Thumbnail generation attempt ${i + 1} failed:`, error);
            if (i < retries) {
              // Wait a bit before retrying (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
            }
          }
        }
      };

      attemptGeneration();
    }

    return () => {
      cancelled = true;
    };
  }, [file.id, file.file, file.thumbnail, updateFileThumbnail]);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const handleDownload = () => {
    if (file.outputUrl) {
      const a = document.createElement('a');
      a.href = file.outputUrl;
      a.download = `processed_${file.name}`;
      a.click();
    }
  };

  return (
    <div className="card flex items-center gap-4 transition-colors hover:border-gray-600 dark:hover:border-gray-500">
      {/* Thumbnail */}
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-900">
        {file.thumbnail ? (
          <img src={file.thumbnail} alt={file.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-gray-600" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 dark:text-white">{file.name}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{formatFileSize(file.size)}</span>

          {/* Show predicted/actual output size */}
          {file.status === 'completed' && file.outputSize && (
            <span className="text-green-600 dark:text-green-400">→ {formatFileSize(file.outputSize)}</span>
          )}
          {file.status === 'processing' && file.predictedSize && (
            <span className="text-blue-600 dark:text-blue-400">→ ~{formatFileSize(file.predictedSize)}</span>
          )}
          {file.status === 'pending' && file.predictedSize && (
            <span className="text-blue-600 dark:text-blue-400">→ ~{formatFileSize(file.predictedSize)}</span>
          )}
          {/* Show appropriate message when prediction is not available */}
          {(file.status === 'pending' || file.status === 'processing') &&
            file.predictedSize === null &&
            !useVideoStore.getState().isLutOnlyMode && (
              <span className="text-gray-500 dark:text-gray-500">
                {(() => {
                  const state = useVideoStore.getState();
                  const isCrfMode = state.compressionMethod === 'quality';
                  return isCrfMode ? '→ Size varies' : '→ Calculating...';
                })()}
              </span>
            )}
        </div>

        {/* Progress bar */}
        {file.status === 'processing' && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-900">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}

        {/* Error message */}
        {file.status === 'error' && file.error && <p className="mt-1 text-sm text-red-400">{file.error}</p>}

        {/* Progress percentage */}
        {file.status === 'processing' && <p className="mt-1 text-xs text-gray-400">{file.progress}%</p>}
      </div>

      {/* Status and actions */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}

        {file.status === 'completed' && file.outputUrl && (
          <Button onClick={handleDownload} variant="secondary" size="icon" title="Download processed video">
            <Download className="h-4 w-4" />
          </Button>
        )}

        {!isProcessing && file.status !== 'processing' && (
          <Button onClick={() => removeFile(file.id)} variant="destructive" size="icon" title="Remove file">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const FileList = () => {
  const {
    files,
    addFiles,
    clearFiles,
    isProcessing,
    compressionMethod,
    targetPercentage,
    targetSizePerMinute,
    qualityCrf,
    isLutOnlyMode,
    updateFilePredictedSize,
    updateFileDuration,
  } = useVideoStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate predicted sizes when compression settings change (with debounce)
  useEffect(() => {
    // Debounce to avoid excessive recalculations while user is adjusting sliders
    const timeoutId = setTimeout(() => {
      const currentFiles = useVideoStore.getState().files;

      // Skip if LUT-only mode
      if (isLutOnlyMode) {
        // Clear predictions for LUT-only mode
        currentFiles.forEach((file) => {
          if (file.status === 'pending' && file.predictedSize !== null) {
            updateFilePredictedSize(file.id, null as any);
          }
        });
        return;
      }

      // Recalculate for all pending files
      currentFiles.forEach(async (file) => {
        if (file.status === 'pending') {
          try {
            // Use cached duration or fetch it if not available
            let duration = file.duration;
            if (duration === null) {
              duration = await getVideoDuration(file.file);
              if (duration > 0) {
                updateFileDuration(file.id, duration);
              }
            }

            if (duration && duration > 0) {
              const predicted = calculatePredictedSize(file.file, duration, {
                compressionMethod,
                targetPercentage,
                targetSizePerMinute,
                qualityCrf,
              });
              if (predicted !== null) {
                updateFilePredictedSize(file.id, predicted);
              } else {
                // Clear prediction if we can't calculate it
                updateFilePredictedSize(file.id, null as any);
              }
            }
          } catch (error) {
            console.error('Error recalculating predicted size:', error);
          }
        }
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    compressionMethod,
    targetPercentage,
    targetSizePerMinute,
    qualityCrf,
    isLutOnlyMode,
    updateFilePredictedSize,
    updateFileDuration,
  ]);

  if (files.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No files uploaded</h3>
      </div>
    );
  }

  const handleRemoveAll = () => {
    if (confirm(`Are you sure you want to remove all ${files.length} files?`)) {
      clearFiles();
    }
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    // Check size limit
    const sizeCheck = checkFileSizeLimit(files, newFiles);
    if (!sizeCheck.withinLimit) {
      alert(
        `Total file size exceeds 2GB limit.\n\n` +
          `Current files: ${formatFileSize(sizeCheck.currentSize)}\n` +
          `New files: ${formatFileSize(sizeCheck.newSize)}\n` +
          `Total: ${formatFileSize(sizeCheck.totalSize)}\n\n` +
          `Please remove some files or upload smaller files.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Add files with shared timestamp
    const timestamp = Date.now();
    addFiles(newFiles, timestamp);

    // Calculate predicted sizes and cache duration
    if (!isLutOnlyMode) {
      newFiles.forEach(async (file, index) => {
        try {
          const duration = await getVideoDuration(file);
          const fileId = `${timestamp}-${index}`;

          if (duration > 0) {
            // Cache the duration
            updateFileDuration(fileId, duration);

            // Calculate predicted size
            const predicted = calculatePredictedSize(file, duration, {
              compressionMethod,
              targetPercentage,
              targetSizePerMinute,
              qualityCrf,
            });
            if (predicted !== null) {
              updateFilePredictedSize(fileId, predicted);
            }
          }
        } catch (error) {
          console.error('Error calculating predicted size:', error);
        }
      });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);
  const remainingSize = MAX_TOTAL_SIZE - currentTotalSize;

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Files ({files.length})</h3>
          <p className="text-xs text-gray-500">
            {formatFileSize(currentTotalSize)} / 2GB ({formatFileSize(remainingSize)} remaining)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isProcessing && remainingSize > 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.mts,.m4v,.avi,.mkv"
                multiple
                onChange={handleAddFiles}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Add More
              </Button>
            </>
          )}
          {!isProcessing && (
            <Button onClick={handleRemoveAll} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove All
            </Button>
          )}
        </div>
      </div>

      {files.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
};

export default FileList;
