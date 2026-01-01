import { useRef } from 'react';
import { Upload, X, Palette } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Switch } from '@workspace/ui/components/ui/switch';
import { Label } from '@workspace/ui/components/ui/label';
import { cn } from '@workspace/ui/lib/utils';
import useVideoStore from '../store/useVideoStore';

const LUTUpload = () => {
  const { lutFile, setLUT, removeLUT, isProcessing, isLutOnlyMode, setLutOnlyMode } = useVideoStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.cube')) {
      setLUT(file);
    } else if (file) {
      alert('Please upload a .cube LUT file');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeLUT();
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

      {lutFile ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{lutFile.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{(lutFile.size / 1024).toFixed(1)} KB</p>
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
              className={cn('text-sm font-medium', !lutFile && 'text-gray-500 dark:text-gray-500')}
            >
              LUT Only Mode
            </Label>
            <p
              className={cn(
                'text-xs',
                lutFile ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-600'
              )}
            >
              {lutFile
                ? 'Apply LUT without compression (keeps original quality)'
                : 'Upload a LUT file to enable this mode'}
            </p>
          </div>
          <Switch
            id="lut-only-mode"
            checked={isLutOnlyMode}
            onCheckedChange={setLutOnlyMode}
            disabled={isProcessing || !lutFile}
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
