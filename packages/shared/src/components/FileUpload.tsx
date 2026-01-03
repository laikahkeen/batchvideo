/**
 * Unified FileUpload Component
 *
 * Platform-agnostic file upload with drag-drop support.
 * Uses platform adapter for file selection and metadata retrieval.
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { usePlatform, usePlatformCapabilities } from '@workspace/shared/platform';
import useVideoStore from '@workspace/shared/store/useVideoStore';
import { formatFileSize } from '@workspace/shared/utils';
import type { VideoFile } from '@workspace/shared/types';
import { ACCEPTED_VIDEO_EXTENSIONS } from '@workspace/shared/types';

const FileUpload = () => {
  const { adapter, ffmpegStatus, isInitializing } = usePlatform();
  const { supportsDragDrop, maxFileSize } = usePlatformCapabilities();
  const { files, addFiles, isProcessing } = useVideoStore();

  const currentTotalSize = files.reduce((sum: number, f: VideoFile) => sum + f.size, 0);
  const isDisabled = isProcessing || isInitializing || !ffmpegStatus.available;

  // Check if adding files would exceed size limit
  const checkSizeLimit = (newFilesSize: number): boolean => {
    if (maxFileSize === null) return true; // No limit
    return currentTotalSize + newFilesSize <= maxFileSize;
  };

  // Handle file selection via platform adapter
  const handleSelectFiles = useCallback(async () => {
    if (isDisabled) return;

    try {
      const fileInfos = await adapter.selectFiles();
      if (fileInfos.length === 0) return;

      const totalNewSize = fileInfos.reduce((sum: number, f) => sum + f.size, 0);
      if (!checkSizeLimit(totalNewSize)) {
        alert(
          `Total file size exceeds ${formatFileSize(maxFileSize!)} limit.\n\n` +
            `Current files: ${formatFileSize(currentTotalSize)}\n` +
            `New files: ${formatFileSize(totalNewSize)}\n` +
            `Total: ${formatFileSize(currentTotalSize + totalNewSize)}\n\n` +
            `Please remove some files or upload smaller files.`
        );
        return;
      }

      // Convert FileInputInfo to VideoFile
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
      console.error('Error selecting files:', error);
    }
  }, [adapter, addFiles, currentTotalSize, isDisabled, maxFileSize]);

  // Handle dropped files (web only)
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!supportsDragDrop || !adapter.handleDroppedFiles) return;
      if (acceptedFiles.length === 0) return;

      const totalNewSize = acceptedFiles.reduce((sum, f) => sum + f.size, 0);
      if (!checkSizeLimit(totalNewSize)) {
        alert(
          `Total file size exceeds ${formatFileSize(maxFileSize!)} limit.\n\n` +
            `Current files: ${formatFileSize(currentTotalSize)}\n` +
            `New files: ${formatFileSize(totalNewSize)}\n` +
            `Total: ${formatFileSize(currentTotalSize + totalNewSize)}\n\n` +
            `Please remove some files or upload smaller files.`
        );
        return;
      }

      try {
        const fileInfos = await adapter.handleDroppedFiles(acceptedFiles);

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
        console.error('Error handling dropped files:', error);
      }
    },
    [adapter, addFiles, supportsDragDrop, currentTotalSize, maxFileSize]
  );

  // Configure dropzone (only for web)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ACCEPTED_VIDEO_EXTENSIONS.map((ext) => ext) as string[],
    },
    multiple: true,
    disabled: isDisabled || !supportsDragDrop,
    noClick: true, // We handle click separately
    noKeyboard: true,
  });

  // Dropzone props only apply if drag-drop is supported
  const dropzoneProps = supportsDragDrop ? getRootProps() : {};

  return (
    <div
      {...dropzoneProps}
      onClick={!isDisabled ? handleSelectFiles : undefined}
      className={`rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
        isDragActive && supportsDragDrop
          ? 'border-blue-500 bg-blue-500/10'
          : isDisabled
            ? 'cursor-not-allowed border-gray-300 bg-gray-50/50 opacity-50 dark:border-gray-700 dark:bg-gray-800/50'
            : 'cursor-pointer border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'
      }`}
    >
      {supportsDragDrop && <input {...getInputProps()} />}

      <div className="flex flex-col items-center gap-4">
        {isInitializing ? (
          <>
            <Loader className="h-16 w-16 animate-spin text-blue-500" />
            <p className="text-xl font-medium text-blue-500">
              {adapter.type === 'web' ? 'Initializing FFmpeg...' : 'Checking FFmpeg...'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment</p>
          </>
        ) : !ffmpegStatus.available ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-500" />
            <p className="text-xl font-medium text-red-500">FFmpeg Initialization Failed</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ffmpegStatus.error || 'There was an error loading the video processor. Please restart.'}
            </p>
          </>
        ) : isDragActive && supportsDragDrop ? (
          <>
            <Upload className="h-16 w-16 text-blue-500" />
            <p className="text-xl font-medium text-blue-500">Drop your videos here...</p>
          </>
        ) : (
          <>
            <Video className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="mb-2 text-xl font-medium text-gray-700 dark:text-gray-200">
                {supportsDragDrop ? 'Drop video files here or click to browse' : 'Click to select video files'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supports MP4, MOV, MTS, M4V, AVI, MKV</p>
            </div>
            {adapter.type === 'desktop' && (
              <Button variant="secondary" size="lg" className="mt-4">
                <Upload className="mr-2 h-5 w-5" />
                Select Videos
              </Button>
            )}
          </>
        )}
      </div>

      {ffmpegStatus.available && !isProcessing && !isInitializing && (
        <div className="mt-6 space-y-2 text-xs text-gray-500">
          {adapter.type === 'web' ? (
            <>
              <p>Recommended: 1-5 files, under 5 minutes each, 1080p or lower</p>
              <p className="mt-1">Processing happens in your browser - keep this tab open</p>
              <p className="mt-1 font-medium">
                Max total size: 2GB {files.length > 0 && `(Current: ${formatFileSize(currentTotalSize)})`}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Native FFmpeg - 10x faster than browser processing</span>
              </div>
              <p>No file size limits - process files of any size</p>
              {files.length > 0 && (
                <p className="font-medium">
                  Current: {formatFileSize(currentTotalSize)} ({files.length} files)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
