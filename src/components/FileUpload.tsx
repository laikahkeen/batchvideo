import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video } from 'lucide-react';
import useVideoStore from '../store/useVideoStore';

const FileUpload = () => {
  const { addFiles, isProcessing } = useVideoStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        addFiles(acceptedFiles);
      }
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.mts', '.m4v', '.avi', '.mkv'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
        isDragActive
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600'
      } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''} `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <>
            <Upload className="h-16 w-16 text-blue-500" />
            <p className="text-xl font-medium text-blue-500">Drop your videos here...</p>
          </>
        ) : (
          <>
            <Video className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="mb-2 text-xl font-medium text-gray-700 dark:text-gray-200">
                Drop video files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supports MP4, MOV, MTS, M4V, AVI, MKV</p>
            </div>
          </>
        )}
      </div>

      {!isProcessing && (
        <div className="mt-6 text-xs text-gray-500">
          <p>Recommended: 1-5 files, under 5 minutes each, 1080p or lower</p>
          <p className="mt-1">Processing happens in your browser - keep this tab open</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
