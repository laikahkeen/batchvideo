# Quick Start Guide

## Run the App

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:5173`

3. **Start processing videos:**
   - Drag and drop video files
   - (Optional) Upload a .cube LUT file
   - Adjust compression settings
   - Click "Process Batch"
   - Download your processed videos

## Testing the App

### Test Files Needed:
- 1-2 short video files (MP4, MOV, etc.)
- Optional: A .cube LUT file for color grading

### Quick Test:
1. Upload a short test video (under 1 minute)
2. Click "Process Batch" without any settings
3. Wait for processing to complete
4. Download the processed video

### Test with LUT:
1. Upload a .cube LUT file
2. Upload a test video
3. Process and see the color grading applied

## Common Issues

### FFmpeg.wasm Loading Error
- Make sure you're using a modern browser (Chrome/Edge recommended)
- Check browser console for CORS errors
- Ensure the dev server is running with proper headers

### Processing Stuck
- Check browser console for errors
- Try with a smaller video file first
- Ensure the browser tab stays active

### Memory Issues
- Close other tabs to free up memory
- Process fewer files at once
- Use smaller video files (under 1080p)

## Development

### File Structure:
```
src/
├── components/       # React components
├── store/           # Zustand state management
├── utils/           # FFmpeg utilities
├── App.jsx          # Main app
└── index.css        # Tailwind styles
```

### Key Files:
- `src/utils/ffmpeg.js` - FFmpeg.wasm wrapper and video processing logic
- `src/store/useVideoStore.js` - Global state management
- `src/components/ProcessButton.jsx` - Main processing logic

### Adding Features:
1. Add new components to `src/components/`
2. Update store in `src/store/useVideoStore.js`
3. Modify FFmpeg commands in `src/utils/ffmpeg.js`

## Build for Production

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- Any static hosting service

**Important:** Ensure your hosting sets these headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Next Steps

Check `development-plan.md` for:
- Phase 2: LUT preview, before/after comparison
- Phase 3: Advanced features, rename, ZIP download
- Plan 2: Desktop app with native FFmpeg
