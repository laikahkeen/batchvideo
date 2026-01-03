import { Settings } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import useVideoStore from '@workspace/shared/store/useVideoStore';
import type { CompressionMethod, FFmpegPreset, Resolution } from '@workspace/shared/types';

const CompressionSettings = () => {
  const {
    compressionMethod,
    targetPercentage,
    targetSizePerMinute,
    qualityCrf,
    maxBitrate,
    bufferSize,
    preset,
    codec,
    resolution,
    isProcessing,
    isLutOnlyMode,
    files,
    setCompressionMethod,
    setTargetPercentage,
    setTargetSizePerMinute,
    setQualityCrf,
    setMaxBitrate,
    setBufferSize,
    setPreset,
    setCodec,
    setResolution,
  } = useVideoStore();

  const getEstimatedSize = (file: (typeof files)[0]) => {
    if (!file) return null;

    const originalSizeMB = file.size / (1024 * 1024);
    const estimatedDurationMin = originalSizeMB / 15;

    switch (compressionMethod) {
      case 'percentage':
        return ((originalSizeMB * targetPercentage) / 100).toFixed(1);
      case 'size_per_minute':
        return (targetSizePerMinute * estimatedDurationMin).toFixed(1);
      case 'quality':
        return null;
      default:
        return null;
    }
  };

  const getTotalEstimatedSize = () => {
    if (files.length === 0) return null;
    const total = files.reduce((sum: number, file: (typeof files)[0]) => {
      const estimate = getEstimatedSize(file);
      return sum + (estimate ? parseFloat(estimate) : 0);
    }, 0);
    return total.toFixed(1);
  };

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Settings className="h-5 w-5" />
          Compression Settings
        </h3>
      </div>

      {isLutOnlyMode && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">LUT Only Mode Active</p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Compression settings are disabled. Only LUT will be applied.
          </p>
        </div>
      )}

      {!isLutOnlyMode && (
        <div className="space-y-6">
          {/* Compression Method Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Compression Method
            </label>
            <select
              value={compressionMethod}
              onChange={(e) => setCompressionMethod(e.target.value as CompressionMethod)}
              disabled={isProcessing}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="quality">Target quality (CRF value)</option>
              <option value="percentage">Target file size (Percentage)</option>
              <option value="size_per_minute">Target file size (MB per minute)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {compressionMethod === 'percentage' && 'Compress to a percentage of the original file size'}
              {compressionMethod === 'size_per_minute' && 'Set consistent quality across all videos by MB per minute'}
              {compressionMethod === 'quality' && 'Maintain visual quality with optional bitrate constraints'}
            </p>
          </div>

          {/* Percentage Mode */}
          {compressionMethod === 'percentage' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Size (%)</label>
                <span className="text-sm font-medium text-blue-500 dark:text-blue-400">{targetPercentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                disabled={isProcessing}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>10% (Max compression)</span>
                <span>100% (Original size)</span>
              </div>
              {files.length > 0 && (
                <div className="mt-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Estimated total: ~{getTotalEstimatedSize()} MB ({files.length} file{files.length > 1 ? 's' : ''})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Size Per Minute Mode */}
          {compressionMethod === 'size_per_minute' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Size (MB per minute)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                step="5"
                value={targetSizePerMinute ?? ''}
                onChange={(e) => {
                  const newValue = e.target.value === '' ? 5 : Number(e.target.value);
                  setTargetSizePerMinute(newValue);
                }}
                disabled={isProcessing}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recommended: 15-30 MB/min for good quality.
              </p>
              {files.length > 0 && (
                <div className="mt-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Estimated total: ~{getTotalEstimatedSize()} MB (varies by video duration)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quality Mode */}
          {compressionMethod === 'quality' && (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality (CRF Value)</label>
                  <span className="text-sm font-medium text-blue-500 dark:text-blue-400">{qualityCrf}</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="28"
                  step="1"
                  value={qualityCrf}
                  onChange={(e) => setQualityCrf(Number(e.target.value))}
                  disabled={isProcessing}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>High Quality (18)</span>
                  <span>Smaller File (28)</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compression Speed
                </label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as FFmpegPreset)}
                  disabled={isProcessing}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="ultrafast">Ultrafast</option>
                  <option value="superfast">Superfast</option>
                  <option value="veryfast">Very Fast</option>
                  <option value="faster">Faster</option>
                  <option value="fast">Fast</option>
                  <option value="medium">Medium (recommended)</option>
                  <option value="slow">Slow</option>
                  <option value="slower">Slower</option>
                  <option value="veryslow">Very Slow</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Bitrate (Optional, kbps)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="100"
                  value={maxBitrate ?? ''}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? 0 : Number(e.target.value);
                    setMaxBitrate(newValue);
                  }}
                  disabled={isProcessing}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rate Control Buffer (Optional, kbps)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="100"
                  value={bufferSize ?? ''}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? 0 : Number(e.target.value);
                    setBufferSize(newValue);
                  }}
                  disabled={isProcessing}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Codec Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Codec</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setCodec('h264')}
                disabled={isProcessing}
                variant={codec === 'h264' ? 'default' : 'outline'}
                className="h-auto flex-col py-3"
              >
                <div className="text-sm font-semibold">H.264</div>
                <div className="text-xs opacity-75">Best compatibility</div>
              </Button>

              <Button
                onClick={() => setCodec('h265')}
                disabled={isProcessing}
                variant={codec === 'h265' ? 'default' : 'outline'}
                className="h-auto flex-col py-3"
              >
                <div className="text-sm font-semibold">H.265</div>
                <div className="text-xs opacity-75">Smaller files</div>
              </Button>
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Resolution (Optional)
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value as Resolution)}
              disabled={isProcessing}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="original">Keep original</option>
              <option value="1920">1080p (1920px)</option>
              <option value="1280">720p (1280px)</option>
              <option value="854">480p (854px)</option>
            </select>
          </div>
        </div>
      )}

      {!isLutOnlyMode && codec === 'h265' && (
        <div className="mt-6 rounded-lg p-3 text-xs">
          <p className="text-yellow-700 dark:text-yellow-400">
            H.265 provides better compression but may have compatibility issues on older devices
          </p>
        </div>
      )}
    </div>
  );
};

export default CompressionSettings;
