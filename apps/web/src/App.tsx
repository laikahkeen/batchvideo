import FileUpload from '@workspace/shared/components/FileUpload';
import FileList from '@workspace/shared/components/FileList';
import ProgressTracker from '@workspace/shared/components/ProgressTracker';
import LUTUpload from '@workspace/shared/components/LUTUpload';
import CompressionSettings from '@workspace/shared/components/CompressionSettings';
import ProcessButton from '@workspace/shared/components/ProcessButton';
import { ThemeProvider } from '@workspace/shared/components/theme-provider';

import { PlatformProvider } from '@workspace/shared/platform';
import useVideoStore from '@workspace/shared/store/useVideoStore';
import { webAdapter } from './platform/webAdapter';
import { useLocalStorage } from '@workspace/shared/hooks/useLocalStorage';
import Header, { TabType } from './components/Header';
import HeroContent from './components/HeroContent';

const VISITED_STORAGE_KEY = 'batchvideo-has-visited';

function AppContent() {
  const { isProcessing, files } = useVideoStore();
  const hasFiles = files.length > 0;
  const [hasVisited, setHasVisited] = useLocalStorage(VISITED_STORAGE_KEY, false);

  // Default tab: first-time visitors see "home", returning visitors see "app"
  const [activeTab, setActiveTab] = useLocalStorage<TabType>('batchvideo-active-tab', hasVisited ? 'app' : 'home');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Mark as visited when user navigates (they've engaged with the app)
    if (!hasVisited) {
      setHasVisited(true);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 transition-colors dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Unified Header */}
      <Header activeTab={activeTab} onTabChange={handleTabChange} isProcessing={isProcessing} />

      {/* Tab Content */}
      {activeTab === 'home' ? (
        <HeroContent onGetStarted={() => handleTabChange('app')} />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Main Content */}
          <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
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

            {/* Upload Section or File List */}
            {!hasFiles ? (
              <div className="mb-8">
                <FileUpload />
              </div>
            ) : (
              <div className="mb-8 space-y-6">
                <FileList />
                <ProgressTracker />
              </div>
            )}

            <div className="mb-8 space-y-6">
              <LUTUpload />
              <CompressionSettings />
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
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="batchvideo-theme">
      <PlatformProvider adapter={webAdapter}>
        <AppContent />
      </PlatformProvider>
    </ThemeProvider>
  );
}

export default App;
