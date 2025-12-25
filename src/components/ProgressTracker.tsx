import { CheckCircle, Loader, AlertCircle, Clock } from 'lucide-react';
import useVideoStore from '../store/useVideoStore';

const ProgressTracker = () => {
  const { isProcessing, getStats, getOverallProgress } = useVideoStore();

  if (!isProcessing) return null;

  const stats = getStats();
  const overallProgress = getOverallProgress();

  return (
    <div className="card border-blue-700/50 bg-linear-to-br from-blue-900/30 to-purple-900/30">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Loader className="h-5 w-5 animate-spin text-blue-400" />
          Processing Videos
        </h3>
        <span className="text-2xl font-bold text-blue-400">{overallProgress}%</span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-900">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Total</span>
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

      <div className="mt-4 text-center text-xs text-gray-400">
        Keep this tab open while processing • Do not close or refresh
      </div>
    </div>
  );
};

export default ProgressTracker;
