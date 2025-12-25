# BatchVideo - Project Context for AI Assistants

## Project Overview

BatchVideo is a browser-based batch video processing application that allows users to apply LUTs, compress, and process multiple videos entirely client-side using FFmpeg.wasm. No server uploads required - all processing happens in the browser.

**Key Characteristics:**
- Client-side video processing (privacy-focused)
- React 19 + TypeScript + Vite
- Tailwind CSS for styling
- Zustand for state management
- FFmpeg.wasm for video processing
- Deployed to GitHub Pages with custom domain: batchvideo.laikahkeen.com

## Architecture

### Core Components

```
src/
├── components/
│   ├── FileUpload.tsx          # Drag-and-drop file upload using react-dropzone
│   ├── FileList.tsx            # Display uploaded files with thumbnails and status
│   ├── LUTUpload.tsx           # LUT file (.cube) upload component
│   ├── CompressionSettings.tsx # Quality (CRF), codec (H.264/H.265), resolution settings
│   ├── ProgressTracker.tsx     # Overall batch progress display
│   └── ProcessButton.tsx       # Main process/download/clear controls
├── store/
│   └── useVideoStore.ts        # Zustand store - single source of truth for app state
├── types/
│   └── index.ts               # TypeScript interfaces and types
├── utils/
│   └── ffmpeg.ts              # FFmpeg.wasm initialization and processing utilities
├── App.tsx                     # Main app layout and component orchestration
├── main.tsx                    # App entry point with React 19 createRoot
└── index.css                   # Global styles with Tailwind directives
```

### State Management (Zustand)

The entire application state lives in `useVideoStore.ts`:

```typescript
{
  files: VideoFile[]           // Uploaded files with metadata and status
  lutFile: File | null         // Uploaded LUT file
  compressionSettings: {...}   // CRF, codec, scale settings
  isProcessing: boolean        // Global processing state
  currentProcessingIndex: number
  overallProgress: number

  // Actions
  addFiles, removeFile, clearFiles
  setLutFile, setCompressionSettings
  startProcessing, updateFileProgress, etc.
}
```

**Key Pattern:** Components subscribe to specific slices of state using selectors to avoid unnecessary re-renders.

### Video Processing Flow

1. **Upload Phase:**
   - User drags/drops or selects video files
   - Files added to store with initial status: 'pending'
   - Thumbnails generated using `createObjectURL`

2. **Configuration Phase:**
   - Optional: Upload .cube LUT file
   - Adjust compression settings (CRF 18-28, codec, resolution)

3. **Processing Phase:**
   - Click "Process Batch" triggers sequential processing
   - For each file:
     - FFmpeg.wasm loads file into virtual filesystem
     - Applies LUT filter if provided
     - Applies compression settings
     - Updates progress via callbacks
     - Generates output blob
     - Status changes: 'pending' → 'processing' → 'completed'/'error'

4. **Download Phase:**
   - Individual file downloads or batch "Download All"
   - Files can be cleared to start over

## Important Technical Details

### FFmpeg.wasm Configuration

**Critical Headers Required:**
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are set in `vite.config.ts` for development and must be configured in deployment (GitHub Pages).

**Loading Strategy:**
- FFmpeg instance is created lazily (only when needed)
- Uses core-mt (multi-threaded) for better performance
- Loaded from unpkg CDN

### File Type Support

**Accepted Video Formats:**
- MP4, MOV, MTS, M4V, AVI, MKV

**LUT Format:**
- Only .cube format supported

### Performance Considerations

1. **Processing Speed:** 5-10x slower than native FFmpeg (WebAssembly overhead)
2. **Memory:** Browser tab can consume significant memory with large files
3. **Sequential Processing:** Files processed one at a time (not parallel)
4. **Recommended Limits:**
   - 1-5 files per batch
   - Videos under 5 minutes
   - 1080p or lower resolution
   - ~2-4GB per file maximum

### Compression Settings

- **CRF (Constant Rate Factor):** 18-28
  - Lower = higher quality, larger files
  - Default: 23 (good balance)
- **Codecs:**
  - H.264 (libx264): Better compatibility
  - H.265 (libx265): Better compression, smaller files
- **Resolution Scaling:** Original, 1080p, 720p, 480p

## Common Patterns

### Adding New Features

1. **State Changes:**
   - Add state/actions to `useVideoStore.ts`
   - Follow Zustand patterns (immutable updates)

2. **New Components:**
   - Create in `src/components/`
   - Use TypeScript for props
   - Subscribe to store using selectors
   - Use Tailwind for styling

3. **FFmpeg Operations:**
   - Extend `utils/ffmpeg.ts`
   - Always handle errors gracefully
   - Provide progress callbacks
   - Clean up virtual filesystem after processing

### TypeScript Types

All types defined in `src/types/index.ts`:
- `VideoFile`: Core file metadata and status
- `CompressionSettings`: Encoding parameters
- `VideoStatus`: 'pending' | 'processing' | 'completed' | 'error'

## Deployment

### GitHub Pages Setup

- **Workflow:** `.github/workflows/deploy.yml`
- **Branch:** Deploys from `master` branch
- **Custom Domain:** batchvideo.laikahkeen.com
- **CNAME:** Auto-generated during build
- **Permissions:** Requires `contents: write` permission

### Build Process

```bash
npm install
npm run build  # TypeScript compilation + Vite build
```

Output: `dist/` directory (static files ready for deployment)

## Development Workflow

### Local Development

```bash
npm install
npm run dev    # Starts Vite dev server on :5173
npm run lint   # ESLint checks
npm run format # Prettier formatting
```

### Code Style

- **Formatting:** Prettier with Tailwind plugin
- **Linting:** ESLint 9 with flat config
- **TypeScript:** Strict mode enabled
- **Tailwind:** v4 with PostCSS

## Gotchas and Important Notes

1. **FFmpeg.wasm Headers:** Missing CORS headers will cause FFmpeg to fail to load. Always test deployment thoroughly.

2. **Memory Management:** Large video files can cause browser tab to crash. Always recommend users stay within limits.

3. **File Cleanup:** Always revoke object URLs when done to prevent memory leaks.

4. **Browser Compatibility:** Works best in Chrome/Edge. Safari/Firefox may have issues with SharedArrayBuffer.

5. **Tab Visibility:** Processing can slow down or pause if tab is backgrounded (browser throttling).

6. **LUT Validation:** Currently accepts any .cube file without validation. Invalid LUTs will cause FFmpeg errors.

7. **Sequential Processing:** Parallel processing not feasible due to FFmpeg.wasm memory constraints.

## Future Enhancement Opportunities

See `development-plan.md` for detailed roadmap:
- LUT preview feature
- Before/after comparison
- Frame extraction and preview
- Advanced FFmpeg filters
- ZIP download for batch
- Desktop app with native FFmpeg (Electron/Tauri)

## Dependencies to Watch

- **@ffmpeg/ffmpeg:** Core video processing - major version changes may break API
- **React 19:** Using latest features (may need adjustments for older patterns)
- **Tailwind CSS v4:** New architecture, different from v3
- **Zustand:** State management - simple and performant

## Testing Considerations

Currently no test suite. When adding tests:
- Mock FFmpeg.wasm (too heavy for unit tests)
- Test state management logic separately
- Use React Testing Library for components
- E2E tests for critical flows (upload → process → download)

## Support and Resources

- **FFmpeg.wasm Docs:** https://ffmpegwasm.netlify.app/
- **Zustand Docs:** https://github.com/pmndrs/zustand
- **Deployment URL:** https://batchvideo.laikahkeen.com
- **Repository Issues:** Track bugs and features in GitHub issues
