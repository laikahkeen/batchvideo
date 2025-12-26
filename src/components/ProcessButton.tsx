import { Play, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useVideoStore from '../store/useVideoStore';
import { processVideo, loadFFmpeg } from '../utils/ffmpeg';

const ProcessButton = () => {
  const {
    files,
    isProcessing,
    lutFile,
    compressionQuality,
    codec,
    setProcessing,
    updateFileStatus,
    updateFileProgress,
    updateFileOutput,
    updateFileError,
    setFFmpegLoaded,
    ffmpegLoaded,
    clearFiles,
    getStats,
  } = useVideoStore();

  const stats = getStats();
  const hasFiles = files.length > 0;
  const allCompleted = stats.completed === stats.total && stats.total > 0;

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    try {
      // Load FFmpeg if not already loaded
      if (!ffmpegLoaded) {
        await loadFFmpeg();
        setFFmpegLoaded(true);
      }

      // Process each file sequentially
      for (const file of files) {
        if (file.status === 'completed') continue;

        updateFileStatus(file.id, 'processing');

        try {
          const result = await processVideo(
            file.file,
            {
              lutFile,
              compressionQuality,
              codec,
              resolution: 'original',
            },
            (progress: number) => {
              updateFileProgress(file.id, progress);
            }
          );

          updateFileOutput(file.id, result.url);
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
    }
  };

  const handleDownloadAll = () => {
    const completedFiles = files.filter((f) => f.status === 'completed' && f.outputUrl);

    completedFiles.forEach((file, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = file.outputUrl!;
        a.download = `processed_${file.name}`;
        a.click();
      }, index * 200); // Stagger downloads slightly
    });
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

        <div className="flex items-center gap-3">
          {allCompleted && (
            <>
              <Button onClick={handleDownloadAll} variant="secondary">
                <Download className="h-4 w-4" />
                Download All
              </Button>
              <Button onClick={handleClearAll} variant="destructive">
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </>
          )}

          {!allCompleted && (
            <Button onClick={handleProcess} disabled={isProcessing} size="lg" className="px-8">
              <Play className="h-5 w-5" />
              {isProcessing ? 'Processing...' : 'Process Batch'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessButton;
