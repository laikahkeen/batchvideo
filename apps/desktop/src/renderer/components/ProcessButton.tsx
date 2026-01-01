import { useEffect } from 'react';
import { Play, FolderOpen, Trash2, XCircle, Folder } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import useVideoStore from '../store/useVideoStore';

const ProcessButton = () => {
  const {
    files,
    isProcessing,
    lutPath,
    outputDir,
    compressionMethod,
    targetPercentage,
    targetSizePerMinute,
    qualityCrf,
    maxBitrate,
    bufferSize,
    codec,
    resolution,
    preset,
    isLutOnlyMode,
    setProcessing,
    setCancelled,
    setOutputDir,
    updateFileStatus,
    updateFileProgress,
    updateFileOutput,
    updateFileError,
    clearFiles,
    getStats,
  } = useVideoStore();

  const stats = getStats();
  const hasFiles = files.length > 0;
  const allCompleted = stats.completed === stats.total && stats.total > 0;

  // Listen for progress updates from main process
  useEffect(() => {
    const unsubscribe = window.api.ffmpeg.onProgress(({ jobId, progress }) => {
      updateFileProgress(jobId, Math.round(progress));
    });

    return () => unsubscribe();
  }, [updateFileProgress]);

  const handleSelectOutputDir = async () => {
    const dir = await window.api.dialog.selectOutputFolder();
    if (dir) {
      setOutputDir(dir);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setCancelled(false);

    try {
      // Process each file sequentially
      for (const file of files) {
        // Check if cancelled
        if (useVideoStore.getState().isCancelled) {
          if (file.status === 'pending') {
            updateFileError(file.id, 'Cancelled by user');
          }
          continue;
        }

        if (file.status === 'completed') continue;

        updateFileStatus(file.id, 'processing');

        try {
          // Create output path
          const outputPath = await window.api.file.createOutputPath(file.path, outputDir || undefined);

          const result = await window.api.ffmpeg.process(file.id, {
            inputPath: file.path,
            outputPath,
            lutPath: lutPath || undefined,
            codec,
            resolution,
            preset,
            isLutOnlyMode,
            compressionMethod,
            targetPercentage,
            targetSizePerMinute,
            qualityCrf,
            maxBitrate,
            bufferSize,
            duration: file.duration || undefined,
            fileSize: file.size,
          });

          // Check if cancelled after processing
          if (useVideoStore.getState().isCancelled) {
            updateFileError(file.id, 'Cancelled by user');
            continue;
          }

          updateFileOutput(file.id, result.outputPath, result.size);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          updateFileError(file.id, (error as Error).message || 'Processing failed');
        }
      }
    } catch (error) {
      console.error('Error during batch processing:', error);
      alert('An error occurred during processing. Please try again.');
    } finally {
      setProcessing(false);
      setCancelled(false);
    }
  };

  const handleCancel = async () => {
    if (
      confirm(
        'Are you sure you want to cancel the processing? Files currently being processed will be marked as failed.'
      )
    ) {
      setCancelled(true);
      await window.api.ffmpeg.cancelAll();
    }
  };

  const handleOpenOutputFolder = async () => {
    const completedFile = files.find((f) => f.status === 'completed' && f.outputPath);
    if (completedFile?.outputPath) {
      await window.api.file.showInFolder(completedFile.outputPath);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all files?')) {
      clearFiles();
    }
  };

  if (!hasFiles) return null;

  return (
    <div className="sticky bottom-0 -mb-6 border-t border-gray-300 bg-white/95 p-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {allCompleted ? (
              <span className="font-medium text-green-500 dark:text-green-400">
                All videos processed! ({stats.completed}/{stats.total})
              </span>
            ) : (
              <span>
                {stats.total} video{stats.total !== 1 ? 's' : ''} ready to process
              </span>
            )}
          </div>

          {/* Output directory selector */}
          {!isProcessing && !allCompleted && (
            <Button onClick={handleSelectOutputDir} variant="outline" size="sm">
              <Folder className="mr-2 h-4 w-4" />
              {outputDir ? 'Change Output Folder' : 'Set Output Folder'}
            </Button>
          )}
          {outputDir && !isProcessing && !allCompleted && (
            <span className="max-w-[200px] truncate text-xs text-gray-500" title={outputDir}>
              → {outputDir.split('/').pop()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {allCompleted && (
            <>
              <Button onClick={handleOpenOutputFolder} variant="secondary">
                <FolderOpen className="h-4 w-4" />
                Open Output Folder
              </Button>
              <Button onClick={handleClearAll} variant="destructive">
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </>
          )}

          {!allCompleted && !isProcessing && (
            <Button onClick={handleProcess} size="lg" className="px-8">
              <Play className="h-5 w-5" />
              Process Batch
            </Button>
          )}

          {!allCompleted && isProcessing && (
            <Button onClick={handleCancel} variant="destructive" size="lg" className="px-8">
              <XCircle className="h-5 w-5" />
              Cancel Processing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessButton;
