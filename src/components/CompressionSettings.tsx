import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useVideoStore from '../store/useVideoStore';

const CompressionSettings = () => {
  const { compressionQuality, codec, setCompressionQuality, setCodec, isProcessing } = useVideoStore();

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
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Settings className="h-5 w-5" />
          Compression Settings
        </h3>
      </div>

      {/* Quality Slider */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality</label>
          <span className="text-sm font-medium text-blue-500 dark:text-blue-400">
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
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
        />

        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-500">
          <span>High Quality</span>
          <span>Smaller File</span>
        </div>

        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          CRF {compressionQuality}: {getCRFDescription(compressionQuality)}
        </p>
      </div>

      {/* Codec Selection */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Codec</label>
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

      {/* Info */}
      <div className="bg-background rounded-lg p-3 text-xs">
        <p className="mb-1 font-medium">Settings will apply to all videos</p>
        <p>Lower CRF = higher quality but larger files</p>
        <p className="mt-1">H.265 provides better compression but may have compatibility issues on older devices</p>
      </div>
    </div>
  );
};

export default CompressionSettings;
