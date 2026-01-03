/**
 * Unified FileList Component
 *
 * Displays uploaded files with thumbnails, status, and actions.
 * Uses platform adapter for metadata retrieval and file actions.
 */

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader, Download, FolderOpen, Trash2, Upload } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { usePlatform, usePlatformCapabilities } from '@workspace/shared/platform';
import useVideoStore from '@workspace/shared/store/useVideoStore';
import { formatFileSize } from '@workspace/shared/utils';
import type { VideoFile } from '@workspace/shared/types';

// ============================================================================
// FileItem Component
// ============================================================================

interface FileItemProps {
  file: VideoFile;
}

const FileItem = ({ file }: FileItemProps) => {
  const { adapter } = usePlatform();
  const { supportsShowInFolder } = usePlatformCapabilities();
  const { removeFile, isProcessing, updateFileThumbnail, compressionMethod, isLutOnlyMode } = useVideoStore();

  // Generate thumbnail if not available
  useEffect(() => {
    let cancelled = false;

    if (!file.thumbnail && file.source) {
      const generateThumb = async () => {
        try {
          const thumb = await adapter.generateThumbnail(file.source);
          if (thumb && !cancelled) {
            updateFileThumbnail(file.id, thumb);
          }
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
        }
      };

      generateThumb();
    }

    return () => {
      cancelled = true;
    };
  }, [adapter, file.id, file.source, file.thumbnail, updateFileThumbnail]);

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
    if (file.output) {
      adapter.downloadOutput(file.output, `processed_${file.name}`);
    }
  };

  const handleShowInFolder = async () => {
    if (file.output && adapter.showInFolder) {
      await adapter.showInFolder(file.output);
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
          {(file.status === 'processing' || file.status === 'pending') && file.predictedSize && (
            <span className="text-blue-600 dark:text-blue-400">→ ~{formatFileSize(file.predictedSize)}</span>
          )}
          {/* Show appropriate message when prediction is not available */}
          {(file.status === 'pending' || file.status === 'processing') &&
            file.predictedSize === null &&
            !isLutOnlyMode && (
              <span className="text-gray-500 dark:text-gray-500">
                {compressionMethod === 'quality' ? '→ Size varies' : '→ Calculating...'}
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

        {file.status === 'completed' && file.output && (
          <>
            {supportsShowInFolder && adapter.showInFolder ? (
              <Button onClick={handleShowInFolder} variant="secondary" size="icon" title="Show in folder">
                <FolderOpen className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleDownload} variant="secondary" size="icon" title="Download processed video">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </>
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

// ============================================================================
// FileList Component
// ============================================================================

const FileList = () => {
  const { adapter } = usePlatform();
  const { maxFileSize } = usePlatformCapabilities();
  const { files, addFiles, clearFiles, isProcessing } = useVideoStore();

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

  const handleAddFiles = async () => {
    try {
      const fileInfos = await adapter.selectFiles();
      if (fileInfos.length === 0) return;

      const totalNewSize = fileInfos.reduce((sum: number, f) => sum + f.size, 0);
      const currentTotalSize = files.reduce((sum: number, f: VideoFile) => sum + f.size, 0);

      if (maxFileSize !== null && currentTotalSize + totalNewSize > maxFileSize) {
        alert(
          `Total file size exceeds ${formatFileSize(maxFileSize)} limit.\n\n` +
            `Current files: ${formatFileSize(currentTotalSize)}\n` +
            `New files: ${formatFileSize(totalNewSize)}\n` +
            `Total: ${formatFileSize(currentTotalSize + totalNewSize)}\n\n` +
            `Please remove some files or upload smaller files.`
        );
        return;
      }

      const newFiles: VideoFile[] = fileInfos.map(
        (info: { id: string; name: string; size: number; source: File | string }) => ({
          id: info.id,
          name: info.name,
          size: info.size,
          source: info.source,
          duration: null,
          thumbnail: null,
          status: 'pending',
          progress: 0,
          output: null,
          outputSize: null,
          predictedSize: null,
          error: null,
        })
      );

      addFiles(newFiles);

      // Fetch metadata in background
      newFiles.forEach(async (file) => {
        try {
          const [duration, thumbnail] = await Promise.all([
            adapter.getVideoDuration(file.source),
            adapter.generateThumbnail(file.source),
          ]);

          if (duration > 0) {
            useVideoStore.getState().updateFileDuration(file.id, duration);
          }
          if (thumbnail) {
            useVideoStore.getState().updateFileThumbnail(file.id, thumbnail);
          }
        } catch (error) {
          console.error('Error fetching file metadata:', error);
        }
      });
    } catch (error) {
      console.error('Error adding files:', error);
    }
  };

  const currentTotalSize = files.reduce((sum: number, f: VideoFile) => sum + f.size, 0);
  const remainingSize = maxFileSize !== null ? maxFileSize - currentTotalSize : null;

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Files ({files.length})</h3>
          <p className="text-xs text-gray-500">
            {formatFileSize(currentTotalSize)}
            {maxFileSize !== null && ` / ${formatFileSize(maxFileSize)}`}
            {remainingSize !== null && ` (${formatFileSize(remainingSize)} remaining)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isProcessing && (remainingSize === null || remainingSize > 0) && (
            <Button onClick={handleAddFiles} variant="secondary" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Add More
            </Button>
          )}
          {!isProcessing && (
            <Button onClick={handleRemoveAll} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove All
            </Button>
          )}
        </div>
      </div>

      {files.map((file: VideoFile) => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
};

export default FileList;
