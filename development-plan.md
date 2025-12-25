# Batch Video Processor - Development Plans

## Plan 1: Web App POC (Lumatic Web)

### Overview

Proof of concept web app using FFmpeg.wasm for client-side video processing. Focus on core features with excellent UX.

### Tech Stack

- **Frontend**: React + Vite
- **Video Processing**: FFmpeg.wasm
- **UI Library**: Tailwind CSS + shadcn/ui (clean, modern components)
- **State Management**: Zustand (lightweight)
- **File Handling**: react-dropzone

### Core Features

#### 1. Batch Upload

- Drag-and-drop multiple video files
- Mobile-friendly file picker
- Show file list with thumbnails, duration, size
- Remove individual files from queue
- Support common formats: MP4, MOV, MTS, M4V

#### 2. LUT Application

- Upload .cube LUT files (most common format)
- **Quick Preview**: Extract single frame → apply LUT → show before/after
- Preview slider to compare original vs LUT applied
- Save favorite LUTs for quick access (localStorage)
- Common presets: "D-Log to Rec.709", "S-Log to Rec.709"

#### 3. Compression Settings

- **Visual quality slider**: "High Quality" to "Smaller File"
  - Maps to CRF values (18-28)
- **Before/After comparison**:
  - Show estimated output size
  - Estimated file size reduction %
- Advanced toggle for power users:
  - Codec selection (H.264, H.265)
  - Resolution scaling options
  - Bitrate/CRF manual control
  - Audio codec/bitrate

#### 4. Optional Rename

- Simple pattern-based renaming
- Variables: `{original}`, `{date}`, `{number}`
- Example: `graded_{original}` or `{date}_{number}`
- Live preview of output filenames

#### 5. Progress & UX

- **Per-file progress**:
  - Current file processing (with progress bar)
  - Queue position (Processing 3 of 10)
  - Estimated time remaining
  - Current FFmpeg operation stage
- **Overall batch progress**: Visual progress ring/bar
- **Background processing indicator**: Sticky header when scrolling
- **Completion**:
  - Download all as ZIP
  - Download individually
  - Clear notification with file size savings
- **Error handling**:
  - Show which files failed with reason
  - Allow retry individual files
  - Continue with remaining files

#### 6. Mobile Optimizations

- Responsive layout (mobile-first design)
- Touch-friendly controls (large tap targets)
- Simplified UI on small screens (hide advanced options)
- Warning about battery/performance on mobile
- Recommend desktop for large batches

### User Flow

```
1. Land on page → See clean interface
2. Drop files or click to upload
3. (Optional) Upload LUT → See instant preview on first frame
4. Adjust compression settings → See size estimate
5. (Optional) Set rename pattern
6. Click "Process Batch"
7. Watch progress with clear updates
8. Download processed files
```

### Development Phases

**Phase 1: MVP (Week 1-2)**

- Basic file upload and list
- Single LUT application (no preview yet)
- Basic compression (H.264, fixed CRF)
- Simple progress indicator
- Download processed files

**Phase 2: Polish (Week 3)**

- LUT preview feature
- Before/after comparison
- Better progress UI
- Error handling
- Mobile responsive

**Phase 3: Enhancement (Week 4)**

- Preset LUTs
- Advanced compression settings
- Rename functionality
- ZIP download for batch
- Performance optimizations

### Limitations to Communicate

- Recommended: 1-5 files, under 5 minutes each, 1080p
- Processing is slower than desktop apps
- Keep tab open during processing
- Large 4K files may cause issues

### Deployment

- Vercel/Netlify (free tier)
- Custom domain: lumatic.app
- No backend needed (fully client-side)

---

## Plan 2: Native Desktop App (Lumatic Pro)

### Overview

Production-grade desktop application with native FFmpeg for professional batch processing. Zero compromises on speed and capability.

### Tech Stack Decision

#### Option A: Electron (Recommended)

**Pros:**

- Reuse React codebase from web POC (90% code reuse)
- Cross-platform (Windows, Mac, Linux) from single codebase
- Rich ecosystem, easy to package
- Can bundle native FFmpeg binary

**Cons:**

- Larger app size (~150-200MB)
- More memory usage

#### Option B: Tauri (Lighter Alternative)

**Pros:**

- Much smaller bundle size (~10-20MB)
- Lower memory footprint
- Modern, fast (Rust backend)
- Still use web frontend (React/HTML/CSS)

**Cons:**

- Newer ecosystem, fewer examples
- Slightly steeper learning curve

#### Option C: React Native Desktop (Not Recommended)

**Pros:**

- Native performance

**Cons:**

- React Native Desktop support is weak
- Not ideal for desktop-first apps
- More complexity than benefit

**🎯 Recommendation: Start with Electron, consider Tauri later if app size matters**

### Architecture

```
┌─────────────────────────────────────┐
│         React Frontend UI           │
│   (Reuse web app components)        │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Electron Main Process         │
│  - Native FFmpeg spawning           │
│  - File system operations           │
│  - Progress monitoring              │
│  - Multi-threaded processing        │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Native FFmpeg Binary           │
│   (Bundled with app installer)      │
└─────────────────────────────────────┘
```

### Core Features (Enhanced from Web)

#### 1. True Batch Processing

- **Parallel processing**: Process multiple files simultaneously
  - Auto-detect CPU cores
  - User-configurable (e.g., "Use 4 threads")
- **Queue management**:
  - Pause/resume entire batch
  - Pause/resume individual files
  - Reorder queue priority
  - Cancel specific files
- **Scheduling**: Start batch at specific time

#### 2. Advanced LUT Management

- LUT library with folders/categories
- Import multiple LUTs at once
- A/B compare different LUTs side-by-side
- Create LUT presets with compression settings
- Export/import preset profiles

#### 3. Professional Compression Control

- All FFmpeg parameters exposed
- Preset profiles:
  - "YouTube Upload" (optimized settings)
  - "Instagram/TikTok" (mobile-optimized)
  - "Archive" (maximum quality)
  - "Delivery" (client-friendly sizes)
- Two-pass encoding option for better quality
- Hardware acceleration (NVENC, QuickSync, VideoToolbox)
- Custom FFmpeg command injection for power users

#### 4. Batch Rename & Organization

- Advanced pattern system:
  - `{original}`, `{date}`, `{time}`, `{counter}`
  - `{resolution}`, `{codec}`, `{duration}`
  - Custom text insertion
- Folder structure creation
- Move/copy to destination folder
- Preserve or strip metadata

#### 5. Quality Control

- **Before processing**:
  - Preview any frame with LUT applied
  - Generate comparison strips (original vs processed)
- **After processing**:
  - Side-by-side viewer
  - Quick quality check interface
  - Flag files for re-processing

#### 6. Progress & Monitoring

- Real-time FFmpeg output parsing
- Per-file detailed stats:
  - Current FPS processing speed
  - Bitrate output
  - Frame count progress
  - Time remaining (accurate ETA)
- System resource monitoring:
  - CPU usage
  - Memory usage
  - Disk space checking (warn if running low)
- Processing history log
- Error logs with details

#### 7. Workflow Automation

- Watch folders: Auto-process new files
- Batch templates: Save entire workflow setups
- Command-line interface for scripting
- Webhook notifications when batch completes

### Desktop-Specific Features

#### System Integration

- File association: Open videos directly in app
- Context menu: "Process with Lumatic"
- Native notifications when processing completes
- Dock/taskbar progress indicators
- Prevent sleep during processing

#### Performance

- Native FFmpeg at full speed
- Multi-core utilization
- No file size limits
- Handle hundreds of files
- Background processing (minimize to tray)

#### Storage

- Local database (SQLite) for:
  - Processing history
  - LUT library
  - Presets and templates
  - Settings sync

### Development Phases

**Phase 1: Core App (Month 1)**

- Electron setup with bundled FFmpeg
- Port web UI components
- Implement native FFmpeg spawning
- Basic batch processing (sequential)
- Progress monitoring

**Phase 2: Power Features (Month 2)**

- Parallel processing
- Advanced compression settings
- Hardware acceleration
- LUT library management
- Preset system

**Phase 3: Polish (Month 3)**

- Batch rename/organization
- Quality control features
- System integration
- Auto-updates
- Comprehensive error handling

**Phase 4: Pro Features (Month 4)**

- Watch folders
- CLI interface
- Workflow automation
- Advanced reporting
- Performance optimizations

### Distribution

#### Packaging

- **Windows**: NSIS installer (.exe)
- **Mac**: DMG with code signing
- **Linux**: AppImage or .deb

#### Updates

- Electron auto-updater
- Check for updates on launch
- Background downloads
- Release notes display

#### Licensing Options

- Free tier: 10 files per batch, basic features
- Pro tier ($29 one-time or $5/month):
  - Unlimited batch size
  - Parallel processing
  - Hardware acceleration
  - Watch folders
  - Priority support

### Monetization Strategy (Optional)

**Free/Open Source Path:**

- Build community
- Accept donations
- Establish credibility

**Commercial Path:**

- Freemium model (limited free version)
- One-time purchase ($29-49)
- Or subscription ($5-10/month)

**Hybrid Path:**

- Free web app (limited features)
- Paid desktop app (full power)
- Builds funnel from free to paid

---

## Comparison Matrix

| Feature              | Web App POC            | Desktop Native App       |
| -------------------- | ---------------------- | ------------------------ |
| **Speed**            | 5-10x slower           | Native FFmpeg speed      |
| **File Size Limit**  | ~2-4GB per file        | Unlimited                |
| **Batch Size**       | 1-10 files realistic   | Hundreds of files        |
| **Processing**       | Sequential only        | Parallel (multi-core)    |
| **Installation**     | None (browser)         | Required (~150-200MB)    |
| **Offline**          | Yes (after first load) | Fully offline            |
| **Mobile Support**   | Yes (limited)          | No (desktop only)        |
| **FFmpeg Features**  | Limited subset         | Full access              |
| **Hardware Accel**   | No                     | Yes (GPU encoding)       |
| **File Management**  | Basic download         | Advanced rename/organize |
| **Target User**      | Casual users, testing  | Professionals, bulk work |
| **Development Time** | 2-4 weeks              | 3-4 months               |
| **Maintenance**      | Low                    | Medium                   |

---

## Recommended Path

### Start Small, Scale Up

1. **Build Web POC first** (2-4 weeks)
   - Validate concept quickly
   - Get user feedback
   - Build audience
   - Learn pain points

2. **Gather feedback** (2-4 weeks)
   - Beta test with target users
   - See if people actually need batch processing
   - Understand real-world use cases

3. **Build Desktop App** (3-4 months)
   - Reuse 90% of web UI code
   - Focus on performance features
   - Target proven user demand

### Alternative: Desktop First

If you're **certain** about professional market:

- Skip web POC
- Go straight to desktop with Electron
- Build proper tool from the start
- Longer development but better end product

---

## Next Steps

### For Web POC:

1. Set up React + Vite project
2. Integrate FFmpeg.wasm
3. Build file upload UI
4. Implement basic LUT application
5. Add progress tracking
6. Deploy to Vercel

### For Desktop App:

1. Set up Electron project
2. Bundle FFmpeg binary
3. Test FFmpeg spawning and monitoring
4. Port/build React UI
5. Implement parallel processing
6. Build installer packages

**Question for you**: Want to start with web POC to validate, or jump straight to desktop if you're confident in the market?
