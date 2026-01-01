import { useEffect, useState } from 'react';
import { Upload, Video, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import useVideoStore from '../store/useVideoStore';
import { formatFileSize } from '../utils/format';

const FileUpload = () => {
  const { files, addFiles, isProcessing, ffmpegAvailable, setFFmpegStatus } = useVideoStore();
  const [isCheckingFFmpeg, setIsCheckingFFmpeg] = useState(true);

  useEffect(() => {
    const checkFFmpeg = async () => {
      try {
        const status = await window.api.ffmpeg.check();
        setFFmpegStatus(status.available, status.version);
      } catch (error) {
        console.error('Failed to check FFmpeg:', error);
        setFFmpegStatus(false, undefined);
      } finally {
        setIsCheckingFFmpeg(false);
      }
    };

    checkFFmpeg();
  }, [setFFmpegStatus]);

  const handleSelectFiles = async () => {
    try {
      const filePaths = await window.api.dialog.openFiles();
      if (filePaths.length > 0) {
        await addFiles(filePaths);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
        isProcessing || isCheckingFFmpeg || !ffmpegAvailable
          ? 'cursor-not-allowed border-gray-300 bg-gray-50/50 opacity-50 dark:border-gray-700 dark:bg-gray-800/50'
          : 'cursor-pointer border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'
      }`}
      onClick={!isProcessing && !isCheckingFFmpeg && ffmpegAvailable ? handleSelectFiles : undefined}
    >
      <div className="flex flex-col items-center gap-4">
        {isCheckingFFmpeg ? (
          <>
            <Loader className="h-16 w-16 animate-spin text-blue-500" />
            <p className="text-xl font-medium text-blue-500">Checking FFmpeg...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment</p>
          </>
        ) : !ffmpegAvailable ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-500" />
            <p className="text-xl font-medium text-red-500">FFmpeg Initialization Failed</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              There was an error loading the video processor. Please restart the app.
            </p>
          </>
        ) : (
          <>
            <Video className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="mb-2 text-xl font-medium text-gray-700 dark:text-gray-200">Click to select video files</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supports MP4, MOV, MTS, M4V, AVI, MKV, WebM</p>
            </div>
            <Button variant="secondary" size="lg" className="mt-4">
              <Upload className="mr-2 h-5 w-5" />
              Select Videos
            </Button>
          </>
        )}
      </div>

      {ffmpegAvailable && !isProcessing && !isCheckingFFmpeg && (
        <div className="mt-6 space-y-2 text-xs text-gray-500">
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
        </div>
      )}
    </div>
  );
};

export default FileUpload;
