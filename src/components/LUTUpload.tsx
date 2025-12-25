import { useRef } from 'react';
import { Upload, X, Palette } from 'lucide-react';
import useVideoStore from '../store/useVideoStore';

const LUTUpload = () => {
  const { lutFile, setLUT, removeLUT, isProcessing } = useVideoStore();
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
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Palette className="h-5 w-5" />
          LUT (Optional)
        </h3>
      </div>

      <p className="mb-4 text-sm text-gray-400">Upload a .cube LUT file to apply color grading to your videos</p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".cube"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {lutFile ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-white">{lutFile.name}</p>
              <p className="text-xs text-gray-400">{(lutFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          {!isProcessing && (
            <button onClick={handleRemove} className="btn btn-danger p-2" title="Remove LUT">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isProcessing}
          className="btn btn-secondary flex w-full items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload LUT File (.cube)
        </button>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>LUT will be applied to all videos during processing</p>
        <p className="mt-1">Common formats: D-Log to Rec.709, S-Log to Rec.709</p>
      </div>
    </div>
  );
};

export default LUTUpload;
