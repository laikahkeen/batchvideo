/**
 * Unified LUTUpload Component
 *
 * LUT file upload with optional LUT-only mode toggle.
 * Works with both File objects (web) and file paths (desktop).
 */

import { useRef } from 'react';
import { Upload, X, Palette } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { Switch } from '@workspace/shared/components/ui/switch';
import { Label } from '@workspace/shared/components/ui/label';
import { cn } from '@workspace/shared/lib/utils';
import { usePlatform } from '@workspace/shared/platform';
import useVideoStore from '@workspace/shared/store/useVideoStore';

const LUTUpload = () => {
  const { adapter } = usePlatform();
  const { lut, setLut, removeLut, isProcessing, isLutOnlyMode, setLutOnlyMode } = useVideoStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLut = lut !== null;

  // Get LUT display info
  const getLutInfo = () => {
    if (!lut) return null;

    if (typeof lut === 'string') {
      // Desktop: file path
      const name = lut.split('/').pop() || lut.split('\\').pop() || 'LUT File';
      return { name, size: null };
    } else {
      // Web: File object
      return { name: lut.name, size: lut.size };
    }
  };

  const lutInfo = getLutInfo();

  // Handle file selection for web
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.cube')) {
      setLut(file);
      adapter.analytics.trackLutApplied(file.name);
    } else if (file) {
      alert('Please upload a .cube LUT file');
    }
  };

  // Handle click for both web and desktop
  const handleClick = async () => {
    if (adapter.type === 'web') {
      // Web: use file input
      fileInputRef.current?.click();
    } else {
      // Desktop: use Electron dialog (would need platform adapter extension)
      // For now, we'll need to handle this in the desktop adapter
      // This is a simplified approach - desktop should override this component
      // or we need to add LUT selection to the platform adapter
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeLut();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Palette className="h-5 w-5" />
          LUT (Optional)
        </h3>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Upload a .cube LUT file to apply color grading to your videos
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".cube"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {hasLut && lutInfo ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{lutInfo.name}</p>
              {lutInfo.size !== null && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{(lutInfo.size / 1024).toFixed(1)} KB</p>
              )}
            </div>
          </div>
          {!isProcessing && (
            <Button onClick={handleRemove} variant="destructive" size="icon" title="Remove LUT">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button onClick={handleClick} disabled={isProcessing} variant="secondary" className="w-full">
          <Upload className="h-4 w-4" />
          Upload LUT File (.cube)
        </Button>
      )}

      <div className="mt-4 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="lut-only-mode"
              className={cn('text-sm font-medium', !hasLut && 'text-gray-500 dark:text-gray-500')}
            >
              LUT Only Mode
            </Label>
            <p
              className={cn(
                'text-xs',
                hasLut ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-600'
              )}
            >
              {hasLut
                ? 'Apply LUT without compression (keeps original quality)'
                : 'Upload a LUT file to enable this mode'}
            </p>
          </div>
          <Switch
            id="lut-only-mode"
            checked={isLutOnlyMode}
            onCheckedChange={setLutOnlyMode}
            disabled={isProcessing || !hasLut}
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>LUT will be applied to all videos during processing</p>
        <p className="mt-1">Common formats: D-Log to Rec.709, S-Log to Rec.709</p>
      </div>
    </div>
  );
};

export default LUTUpload;
