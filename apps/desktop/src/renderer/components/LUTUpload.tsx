import { Upload, X, Palette } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Switch } from '@workspace/ui/components/ui/switch';
import { Label } from '@workspace/ui/components/ui/label';
import { cn } from '@workspace/ui/lib/utils';
import useVideoStore from '../store/useVideoStore';

const LUTUpload = () => {
  const { lutPath, setLUT, removeLUT, isProcessing, isLutOnlyMode, setLutOnlyMode } = useVideoStore();

  const handleSelectLUT = async () => {
    const selectedPath = await window.api.dialog.openLUT();
    if (selectedPath) {
      setLUT(selectedPath);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeLUT();
  };

  const lutFileName = lutPath ? lutPath.split('/').pop() || lutPath.split('\\').pop() : null;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Palette className="h-5 w-5" />
          LUT (Optional)
        </h3>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Select a .cube LUT file to apply color grading to your videos
      </p>

      {lutPath ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{lutFileName}</p>
              <p className="max-w-[200px] truncate text-xs text-gray-600 dark:text-gray-400">{lutPath}</p>
            </div>
          </div>
          {!isProcessing && (
            <Button onClick={handleRemove} variant="destructive" size="icon" title="Remove LUT">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button onClick={handleSelectLUT} disabled={isProcessing} variant="secondary" className="w-full">
          <Upload className="h-4 w-4" />
          Select LUT File (.cube)
        </Button>
      )}

      <div className="mt-4 rounded-lg border border-gray-300 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="lut-only-mode"
              className={cn('text-sm font-medium', !lutPath && 'text-gray-500 dark:text-gray-500')}
            >
              LUT Only Mode
            </Label>
            <p
              className={cn(
                'text-xs',
                lutPath ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-600'
              )}
            >
              {lutPath
                ? 'Apply LUT without compression (keeps original quality)'
                : 'Select a LUT file to enable this mode'}
            </p>
          </div>
          <Switch
            id="lut-only-mode"
            checked={isLutOnlyMode}
            onCheckedChange={setLutOnlyMode}
            disabled={isProcessing || !lutPath}
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
