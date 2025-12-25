# batchvideo

A powerful web-based batch video processor built with React, Vite, Tailwind CSS, and FFmpeg.wasm. Process multiple videos directly in your browser with LUT application, compression settings, and real-time progress tracking.

## Features

- **Batch Upload**: Drag-and-drop multiple video files with support for MP4, MOV, MTS, M4V, AVI, MKV
- **LUT Application**: Upload .cube LUT files to apply color grading to your videos
- **Compression Settings**:
  - Adjustable quality slider (CRF 18-28)
  - Codec selection (H.264 or H.265)
  - Resolution scaling options
- **Real-time Progress**: Track processing progress for each file and overall batch
- **Client-side Processing**: All video processing happens in your browser using FFmpeg.wasm - your videos never leave your computer
- **Batch Download**: Download all processed videos at once

## Tech Stack

- **React 19** + **TypeScript**: Type-safe UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **FFmpeg.wasm**: Client-side video processing
- **Zustand**: State management
- **react-dropzone**: File upload handling
- **lucide-react**: Icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd batchvideo
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### 1. Upload Videos

- Drag and drop video files onto the upload area, or click to browse
- Supported formats: MP4, MOV, MTS, M4V, AVI, MKV
- You can upload multiple files at once

### 2. Configure Settings (Optional)

**Upload LUT:**

- Click "Upload LUT File" to apply color grading
- Only .cube format is supported
- The LUT will be applied to all videos in the batch

**Adjust Compression:**

- Use the quality slider to balance between file size and quality
- Select codec (H.264 for compatibility, H.265 for smaller files)
- Lower CRF values = higher quality but larger files

### 3. Process Videos

- Click "Process Batch" to start processing
- Watch real-time progress for each file
- Processing happens sequentially
- Keep the tab open during processing

### 4. Download

- Download individual videos using the download button on each file
- Or use "Download All" to download all processed videos
- Use "Clear All" to remove all files and start over

## Performance Tips

- **Recommended**: 1-5 files, under 5 minutes each, 1080p or lower
- **Browser**: Chrome or Edge for best performance
- **Processing**: Happens in your browser - slower than desktop apps but private
- **Keep tab open**: Do not close or refresh during processing
- **Large files**: 4K videos or very long videos may cause performance issues

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx          # Drag-and-drop file upload
│   ├── FileList.tsx            # Display uploaded files with thumbnails
│   ├── LUTUpload.tsx           # LUT file upload component
│   ├── CompressionSettings.tsx # Quality and codec settings
│   ├── ProgressTracker.tsx     # Overall progress display
│   └── ProcessButton.tsx       # Main process and download controls
├── store/
│   └── useVideoStore.ts        # Zustand state management
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   └── ffmpeg.ts              # FFmpeg.wasm utilities
├── App.tsx                     # Main app component
├── main.tsx                    # App entry point
└── index.css                   # Global styles with Tailwind
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to deploy to any static hosting service (Vercel, Netlify, etc.).

## Deployment

This app can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use `gh-pages` package

### Important Headers for FFmpeg.wasm

The app requires specific headers for SharedArrayBuffer support. These are configured in `vite.config.ts` for local development. For production, ensure your hosting service sets:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Limitations

- Processing is 5-10x slower than native FFmpeg
- Recommended file size limit: ~2-4GB per file
- Sequential processing only (no parallel processing)
- Browser tab must remain open during processing
- Memory usage increases with file size

## Future Enhancements

See `development-plan.md` for detailed roadmap including:

- LUT preview feature
- Before/after comparison
- Advanced compression settings
- Rename functionality
- ZIP download for batch
- Desktop app version with native FFmpeg

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
