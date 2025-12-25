import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';
import useVideoStore from '../store/useVideoStore';
import { formatFileSize, generateThumbnail } from '../utils/ffmpeg';
import type { VideoFile } from '../types';

interface FileItemProps {
  file: VideoFile;
}

const FileItem = ({ file }: FileItemProps) => {
  const { removeFile, isProcessing, updateFileThumbnail } = useVideoStore();

  useEffect(() => {
    if (!file.thumbnail && file.file) {
      generateThumbnail(file.file).then(thumb => {
        if (thumb) {
          updateFileThumbnail(file.id, thumb);
        }
      });
    }
  }, [file.id, file.file, file.thumbnail, updateFileThumbnail]);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
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
    <div className="card flex items-center gap-4 hover:border-gray-600 transition-colors">
      {/* Thumbnail */}
      <div className="w-24 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader className="w-6 h-6 text-gray-600 animate-spin" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{file.name}</p>
        <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>

        {/* Progress bar */}
        {file.status === 'processing' && (
          <div className="mt-2 bg-gray-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {file.status === 'error' && file.error && (
          <p className="text-sm text-red-400 mt-1">{file.error}</p>
        )}

        {/* Progress percentage */}
        {file.status === 'processing' && (
          <p className="text-xs text-gray-400 mt-1">{file.progress}%</p>
        )}
      </div>

      {/* Status and actions */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}

        {file.status === 'completed' && file.outputUrl && (
          <button
            onClick={handleDownload}
            className="btn btn-secondary p-2"
            title="Download processed video"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {!isProcessing && file.status !== 'processing' && (
          <button
            onClick={() => removeFile(file.id)}
            className="btn btn-danger p-2"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const FileList = () => {
  const { files } = useVideoStore();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">
        Files ({files.length})
      </h3>
      {files.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  );
};

export default FileList;
