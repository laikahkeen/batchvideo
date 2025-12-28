import { Video } from 'lucide-react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import LUTUpload from './components/LUTUpload';
import CompressionSettings from './components/CompressionSettings';
import ProgressTracker from './components/ProgressTracker';
import ProcessButton from './components/ProcessButton';
import ThemeToggle from './components/ThemeToggle';
import GitHubLink from './components/GitHubLink';
import useVideoStore from './store/useVideoStore';

function App() {
  const { isProcessing } = useVideoStore();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 transition-colors dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">batchvideo</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Batch Video Processor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isProcessing && (
                <span className="flex items-center gap-2 text-sm text-blue-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>
                  Processing...
                </span>
              )}
              <GitHubLink />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Info Section */}
        <div className="mb-8 rounded-xl border border-blue-200/50 bg-linear-to-r from-blue-50 to-purple-50 p-6 dark:border-blue-800/30 dark:from-blue-900/20 dark:to-purple-900/20">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">How it works</h3>
          <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-3 dark:text-gray-300">
            <div>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                1
              </div>
              <p className="mb-1 font-medium">Upload Videos</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Drag and drop your video files or click to browse
              </p>
            </div>
            <div>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                2
              </div>
              <p className="mb-1 font-medium">Configure Settings</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Optional: Upload LUT and adjust compression settings
              </p>
            </div>
            <div>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                3
              </div>
              <p className="mb-1 font-medium">Process & Download</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click Process Batch and download your processed videos
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload />
        </div>

        {/* Two Column Layout */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column - File List */}
          <div className="space-y-6 lg:col-span-2">
            <FileList />
            <ProgressTracker />
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            <LUTUpload />
            <CompressionSettings />
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-500">
          <p>All processing happens in your browser using FFmpeg.wasm - your videos never leave your computer</p>
          <p className="mt-2">
            Best performance: Chrome/Edge • Recommended: 1-5 files, under 5 minutes each, 1080p or lower
          </p>
        </div>
      </main>

      {/* Process Button - Sticky Footer */}
      <ProcessButton />
    </div>
  );
}

export default App;
