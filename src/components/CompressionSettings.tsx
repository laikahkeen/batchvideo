import { Settings } from 'lucide-react';
import useVideoStore from '../store/useVideoStore';
import type { Codec } from '../types';

const CompressionSettings = () => {
  const {
    compressionQuality,
    codec,
    setCompressionQuality,
    setCodec,
    isProcessing,
  } = useVideoStore();

  const getQualityLabel = (value: number): string => {
    if (value <= 20) return 'High Quality';
    if (value <= 24) return 'Balanced';
    return 'Smaller File';
  };

  const getCRFDescription = (value: number): string => {
    if (value <= 20) return 'Larger file size, minimal quality loss';
    if (value <= 24) return 'Good balance between quality and size';
    return 'Smaller file size, some quality loss';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Compression Settings
        </h3>
      </div>

      {/* Quality Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Quality
          </label>
          <span className="text-sm text-blue-400 font-medium">
            {getQualityLabel(compressionQuality)}
          </span>
        </div>

        <input
          type="range"
          min="18"
          max="28"
          step="1"
          value={compressionQuality}
          onChange={(e) => setCompressionQuality(Number(e.target.value))}
          disabled={isProcessing}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>High Quality</span>
          <span>Smaller File</span>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          CRF {compressionQuality}: {getCRFDescription(compressionQuality)}
        </p>
      </div>

      {/* Codec Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Codec
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCodec('h264' as Codec)}
            disabled={isProcessing}
            className={`
              px-4 py-3 rounded-lg font-medium transition-all
              ${codec === 'h264'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-sm font-semibold">H.264</div>
            <div className="text-xs opacity-75">Best compatibility</div>
          </button>

          <button
            onClick={() => setCodec('h265' as Codec)}
            disabled={isProcessing}
            className={`
              px-4 py-3 rounded-lg font-medium transition-all
              ${codec === 'h265'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-sm font-semibold">H.265</div>
            <div className="text-xs opacity-75">Smaller files</div>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400">
        <p className="font-medium text-gray-300 mb-1">Settings will apply to all videos</p>
        <p>Lower CRF = higher quality but larger files</p>
        <p className="mt-1">H.265 provides better compression but may have compatibility issues on older devices</p>
      </div>
    </div>
  );
};

export default CompressionSettings;
