import { CheckCircle, Loader, AlertCircle, Clock, Download } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import useVideoStore from '../store/useVideoStore';

const ProgressTracker = () => {
  const { isProcessing, getStats, getOverallProgress, files } = useVideoStore();

  const stats = getStats();
  const hasFiles = files.length > 0;
  const hasProcessedFiles = stats.completed > 0 || stats.processing > 0 || stats.error > 0;

  // Show if currently processing OR if there are processed/completed files
  if (!hasFiles || (!isProcessing && !hasProcessedFiles)) return null;

  const overallProgress = getOverallProgress();
  const allCompleted = stats.completed + stats.error === stats.total;

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

  return (
    <div
      className={`card ${allCompleted ? 'border-green-700/50 bg-linear-to-br from-green-900/30 to-emerald-900/30' : 'border-blue-700/50 bg-linear-to-br from-blue-900/30 to-purple-900/30'}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          {allCompleted ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-400" />
              Processing Complete
            </>
          ) : (
            <>
              <Loader className="h-5 w-5 animate-spin text-blue-400" />
              Processing Videos
            </>
          )}
        </h3>
        <span className={`text-2xl font-bold ${allCompleted ? 'text-green-400' : 'text-blue-400'}`}>
          {overallProgress}%
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-900">
          <div
            className={`h-full transition-all duration-300 ${allCompleted ? 'bg-linear-to-r from-green-500 to-emerald-500' : 'bg-linear-to-r from-blue-500 to-purple-500'}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-900 dark:text-gray-400" />
            <span className="text-xs text-gray-900 dark:text-gray-400">Total</span>
          </div>
          <p className="text-xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Loader className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Processing</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{stats.processing}</p>
        </div>

        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <p className="text-xl font-bold text-green-400">{stats.completed}</p>
        </div>

        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-400">Errors</span>
          </div>
          <p className="text-xl font-bold text-red-400">{stats.error}</p>
        </div>
      </div>

      {!allCompleted && (
        <div className="mt-4 text-center text-xs text-gray-900 dark:text-gray-400">
          Keep this tab open while processing • Do not close or refresh
        </div>
      )}
      {allCompleted && stats.completed > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <Button onClick={handleDownloadAll} className="w-80 bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Download All ({stats.completed} {stats.completed === 1 ? 'file' : 'files'})
          </Button>
          <p className="text-center text-xs text-green-400">All videos have been processed successfully</p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
