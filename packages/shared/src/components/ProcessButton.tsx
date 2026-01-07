/**
 * Unified ProcessButton Component
 *
 * Main action button for processing videos.
 * Uses platform adapter for video processing and output handling.
 */

import { Play, Download, FolderOpen, Trash2, XCircle, Folder } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { usePlatform, usePlatformCapabilities } from '@workspace/shared/platform';
import useVideoStore from '@workspace/shared/store/useVideoStore';
import type { ProcessingOptions } from '@workspace/shared/platform';
import type { VideoFile } from '@workspace/shared/types';

const ProcessButton = () => {
  const { adapter } = usePlatform();
  const { supportsOutputDirectory, supportsShowInFolder } = usePlatformCapabilities();

  const {
    files,
    isProcessing,
    lut,
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

  const handleSelectOutputDir = async () => {
    if (!adapter.selectOutputDirectory) return;

    const dir = await adapter.selectOutputDirectory();
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
          const options: ProcessingOptions = {
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
            lut: lut ?? undefined,
            duration: file.duration ?? undefined,
            fileSize: file.size,
          };

          const result = await adapter.processVideo(file.id, file.source, options, (progress: number) => {
            updateFileProgress(file.id, Math.round(progress));
          });

          // Check if cancelled after processing
          if (useVideoStore.getState().isCancelled) {
            updateFileError(file.id, 'Cancelled by user');
            continue;
          }

          updateFileOutput(file.id, result.output, result.size);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          updateFileError(file.id, (error as Error).message || 'Processing failed');
        }
      }
    } catch (error) {
      console.error('Error during batch processing:', error);
      adapter.analytics.trackError('batch_processing', (error as Error).message || 'Unknown error');
      alert('An error occurred during processing. Please try again.');
    } finally {
      // Track completed videos
      const completedCount = useVideoStore.getState().files.filter((f) => f.status === 'completed').length;
      if (completedCount > 0) {
        adapter.analytics.trackVideosProcessed(completedCount);
      }
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
      await adapter.cancelAllProcessing();
    }
  };

  const handleDownloadAll = () => {
    const completedFiles = files.filter((f: VideoFile) => f.status === 'completed' && f.output);

    adapter.analytics.trackDownloadClicked();

    completedFiles.forEach((file: VideoFile, index: number) => {
      setTimeout(() => {
        adapter.downloadOutput(file.output!, `processed_${file.name}`);
      }, index * 200); // Stagger downloads slightly
    });
  };

  const handleOpenOutputFolder = async () => {
    if (!adapter.showInFolder) return;

    const completedFile = files.find((f: VideoFile) => f.status === 'completed' && f.output);
    if (completedFile?.output) {
      await adapter.showInFolder(completedFile.output);
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

          {/* Output directory selector (desktop only) */}
          {supportsOutputDirectory && !isProcessing && !allCompleted && (
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
              {supportsShowInFolder ? (
                <Button onClick={handleOpenOutputFolder} variant="secondary">
                  <FolderOpen className="h-4 w-4" />
                  Open Output Folder
                </Button>
              ) : (
                <Button onClick={handleDownloadAll} variant="secondary">
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
              )}
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
