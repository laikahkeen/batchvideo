import { X, CheckCircle, AlertCircle, Loader, FolderOpen, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useVideoStore from '../store/useVideoStore';
import { formatFileSize } from '../utils/format';
import type { VideoFile } from '../types';

interface FileItemProps {
  file: VideoFile;
}

const FileItem = ({ file }: FileItemProps) => {
  const { removeFile, isProcessing } = useVideoStore();

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

  const handleShowInFolder = async () => {
    if (file.outputPath) {
      await window.api.file.showInFolder(file.outputPath);
    } else {
      await window.api.file.showInFolder(file.path);
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

          {file.status === 'completed' && file.outputSize && (
            <span className="text-green-600 dark:text-green-400">
              → {formatFileSize(file.outputSize)}
            </span>
          )}
          {file.status === 'processing' && file.predictedSize && (
            <span className="text-blue-600 dark:text-blue-400">
              → ~{formatFileSize(file.predictedSize)}
            </span>
          )}
          {file.status === 'pending' && file.predictedSize && (
            <span className="text-blue-600 dark:text-blue-400">
              → ~{formatFileSize(file.predictedSize)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {file.status === 'processing' && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-900">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {file.status === 'error' && file.error && (
          <p className="mt-1 text-sm text-red-400">{file.error}</p>
        )}

        {/* Progress percentage */}
        {file.status === 'processing' && (
          <p className="mt-1 text-xs text-gray-400">{file.progress}%</p>
        )}
      </div>

      {/* Status and actions */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}

        {file.status === 'completed' && file.outputPath && (
          <Button
            onClick={handleShowInFolder}
            variant="secondary"
            size="icon"
            title="Show in folder"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        )}

        {!isProcessing && file.status !== 'processing' && (
          <Button
            onClick={() => removeFile(file.id)}
            variant="destructive"
            size="icon"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const FileList = () => {
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
    const filePaths = await window.api.dialog.openFiles();
    if (filePaths.length > 0) {
      await addFiles(filePaths);
    }
  };

  const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Files ({files.length})
          </h3>
          <p className="text-xs text-gray-500">{formatFileSize(currentTotalSize)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isProcessing && (
            <>
              <Button onClick={handleAddFiles} variant="secondary" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Add More
              </Button>
              <Button onClick={handleRemoveAll} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove All
              </Button>
            </>
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
