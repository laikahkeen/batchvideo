# BatchVideo Monorepo Migration Plan

## Overview

This plan outlines the migration of BatchVideo from a single React web application to a monorepo structure supporting:

- **Web App** (React + Vite) - existing
- **Desktop App** (Electron + React) - priority focus
- **Mobile App** (React Native) - future consideration

## Tool Selection: pnpm Workspaces + Turborepo

### Why pnpm?

- **Disk efficient**: Hard links shared dependencies (saves ~70% disk space)
- **Strict dependency resolution**: Prevents phantom dependencies
- **Fast**: Parallel downloads, intelligent caching
- **Native workspace support**: Built-in, no plugins needed
- **Great GitHub Actions support**: First-class CI caching
- **Compatible**: Works seamlessly with Turborepo

### Why Turborepo?

- **Build orchestration**: Manages dependencies between packages
- **Caching**: Content-aware hashing (local + remote)
- **Parallel execution**: Runs independent tasks concurrently
- **GitHub-friendly**: Built-in remote caching support
- **Minimal config**: Works out of the box with pnpm
- **Acquired by Vercel**: Strong ecosystem and tooling

### Alternatives Considered

| Tool            | Pros                     | Cons                                         |
| --------------- | ------------------------ | -------------------------------------------- |
| Yarn Workspaces | Mature, widely used      | Slower than pnpm, phantom deps               |
| npm Workspaces  | No extra install         | Less features, slower                        |
| Nx              | Feature-rich, generators | Heavy, steeper learning curve                |
| Lerna           | Popular legacy option    | Deprecated patterns, now wraps npm/yarn/pnpm |

---

## Target Directory Structure

```
batchvideo/
├── apps/
│   ├── web/                          # Current React Vite app
│   │   ├── src/
│   │   │   ├── components/           # Web-specific components
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── desktop/                      # Electron app (Phase 1 focus)
│   │   ├── src/
│   │   │   ├── main/                 # Electron main process
│   │   │   │   ├── index.ts          # Main entry point
│   │   │   │   ├── ffmpeg.ts         # Native FFmpeg bindings
│   │   │   │   └── ipc.ts            # IPC handlers
│   │   │   ├── preload/
│   │   │   │   └── index.ts          # Preload scripts (contextBridge)
│   │   │   └── renderer/             # React renderer (extends web)
│   │   │       ├── App.tsx
│   │   │       └── main.tsx
│   │   ├── resources/                # App icons, installer assets
│   │   ├── electron-builder.json     # Build/packaging config
│   │   ├── vite.config.ts            # Renderer build config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                       # React Native app (Future)
│       ├── src/
│       ├── ios/
│       ├── android/
│       ├── app.json
│       ├── metro.config.js
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared business logic
│   │   ├── src/
│   │   │   ├── store/                # Zustand store (platform-agnostic)
│   │   │   │   ├── useVideoStore.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/                # TypeScript definitions
│   │   │   │   └── index.ts
│   │   │   ├── utils/                # Shared utilities
│   │   │   │   ├── format.ts         # File size formatting, etc.
│   │   │   │   └── validation.ts     # File type validation
│   │   │   └── index.ts              # Package exports
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # Platform-agnostic components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Switch.tsx
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   └── use-mobile.tsx
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ffmpeg-web/                   # FFmpeg.wasm wrapper (web/electron renderer)
│   │   ├── src/
│   │   │   ├── ffmpeg.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ffmpeg-native/                # Native FFmpeg bindings (electron main)
│       ├── src/
│       │   ├── ffmpeg.ts             # fluent-ffmpeg wrapper
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── deploy-web.yml            # GitHub Pages deployment
│       ├── build-desktop.yml         # Electron builds (Windows/Mac/Linux)
│       └── ci.yml                    # Shared CI (lint, typecheck, test)
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace definition
├── package.json                      # Root package.json
├── tsconfig.base.json                # Shared TypeScript config
├── .eslintrc.base.js                 # Shared ESLint config
├── .prettierrc                       # Shared Prettier config
├── .gitignore
├── README.md
├── CLAUDE.md                         # Updated for monorepo
└── MONOREPO_PLAN.md                  # This file
```

---

## Phase 1: Foundation Setup

### Step 1.1: Initialize pnpm and Workspace Configuration

**Create `pnpm-workspace.yaml`:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Create root `package.json`:**

```json
{
  "name": "batchvideo-monorepo",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo clean && rm -rf node_modules",
    "dev:web": "turbo dev --filter=@batchvideo/web",
    "dev:desktop": "turbo dev --filter=@batchvideo/desktop",
    "build:web": "turbo build --filter=@batchvideo/web",
    "build:desktop": "turbo build --filter=@batchvideo/desktop"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.7.4",
    "prettier-plugin-tailwindcss": "^0.7.2"
  }
}
```

### Step 1.2: Create Turborepo Configuration

**Create `turbo.json`:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV"],
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".eslintrc*", "eslint.config.*"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Step 1.3: Create Shared TypeScript Configuration

**Create `tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true
  }
}
```

---

## Phase 2: Extract Shared Packages

### Step 2.1: Create `@batchvideo/shared` Package

**`packages/shared/package.json`:**

```json
{
  "name": "@batchvideo/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./store": "./src/store/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**Extract from current codebase:**

- `src/types/index.ts` → `packages/shared/src/types/index.ts`
- `src/store/useVideoStore.ts` → `packages/shared/src/store/useVideoStore.ts`
  - Remove FFmpeg-specific imports (make platform-agnostic)
  - Add abstract FFmpeg interface for platform implementations

### Step 2.2: Create `@batchvideo/ui` Package

**`packages/ui/package.json`:**

```json
{
  "name": "@batchvideo/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.562.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "typescript": "^5.7.3"
  }
}
```

**Extract from current codebase:**

- `src/components/ui/*` → `packages/ui/src/components/`
- `src/lib/utils.ts` → `packages/ui/src/lib/utils.ts`
- `src/hooks/use-mobile.tsx` → `packages/ui/src/hooks/`

### Step 2.3: Create `@batchvideo/ffmpeg-web` Package

**`packages/ffmpeg-web/package.json`:**

```json
{
  "name": "@batchvideo/ffmpeg-web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.15",
    "@ffmpeg/util": "^0.12.2"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

**Extract:**

- `src/utils/ffmpeg.ts` → `packages/ffmpeg-web/src/ffmpeg.ts`

---

## Phase 3: Migrate Web App

### Step 3.1: Move Current App to `apps/web`

```bash
# Create apps directory
mkdir -p apps/web

# Move source files
mv src apps/web/
mv public apps/web/
mv index.html apps/web/
mv vite.config.ts apps/web/
mv tailwind.config.js apps/web/
mv tsconfig.json apps/web/tsconfig.json
mv tsconfig.app.json apps/web/
mv tsconfig.node.json apps/web/
mv eslint.config.js apps/web/
mv components.json apps/web/
```

### Step 3.2: Update Web App Dependencies

**`apps/web/package.json`:**

```json
{
  "name": "@batchvideo/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@batchvideo/shared": "workspace:*",
    "@batchvideo/ui": "workspace:*",
    "@batchvideo/ffmpeg-web": "workspace:*",
    "@tailwindcss/vite": "^4.1.18",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-dropzone": "^14.3.8",
    "tailwindcss": "^4.1.18",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^25.0.3",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "typescript": "^5.7.3",
    "vite": "^7.2.4"
  }
}
```

### Step 3.3: Update Imports in Web App

Replace local imports with workspace packages:

```typescript
// Before
import { useVideoStore } from './store/useVideoStore';
import { VideoFile } from './types';
import { Button } from './components/ui/button';

// After
import { useVideoStore } from '@batchvideo/shared/store';
import type { VideoFile } from '@batchvideo/shared/types';
import { Button } from '@batchvideo/ui';
```

---

## Phase 4: Electron Desktop App Setup

### Step 4.1: Create Electron App Structure

**`apps/desktop/package.json`:**

```json
{
  "name": "@batchvideo/desktop",
  "version": "0.0.1",
  "private": true,
  "main": "dist/main/index.js",
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux"
  },
  "dependencies": {
    "@batchvideo/shared": "workspace:*",
    "@batchvideo/ui": "workspace:*",
    "@batchvideo/ffmpeg-native": "workspace:*",
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-dropzone": "^14.3.8"
  },
  "devDependencies": {
    "@electron-toolkit/eslint-config-ts": "^3.0.0",
    "@types/node": "^25.0.3",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "electron": "^33.0.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.3.0",
    "eslint": "^9.39.1",
    "typescript": "^5.7.3",
    "vite": "^7.2.4"
  }
}
```

### Step 4.2: Electron Main Process

**`apps/desktop/src/main/index.ts`:**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import path from 'path';
import { setupFFmpegHandlers } from './ffmpeg';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.batchvideo.app');

  // Setup native FFmpeg IPC handlers
  setupFFmpegHandlers();

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### Step 4.3: Native FFmpeg Integration

**`packages/ffmpeg-native/package.json`:**

```json
{
  "name": "@batchvideo/ffmpeg-native",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "fluent-ffmpeg": "^2.1.3",
    "ffmpeg-static": "^5.2.0",
    "ffprobe-static": "^3.1.0"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.27",
    "typescript": "^5.7.3"
  }
}
```

**`packages/ffmpeg-native/src/ffmpeg.ts`:**

```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Set binary paths
ffmpeg.setFfmpegPath(ffmpegStatic!);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export interface ProcessOptions {
  inputPath: string;
  outputPath: string;
  lutPath?: string;
  codec: 'h264' | 'h265';
  crf: number;
  resolution?: string;
  onProgress?: (progress: number) => void;
}

export async function processVideo(options: ProcessOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(options.inputPath);

    // Apply LUT if provided
    if (options.lutPath) {
      command = command.videoFilter(`lut3d=${options.lutPath}`);
    }

    // Set codec
    const videoCodec = options.codec === 'h265' ? 'libx265' : 'libx264';
    command = command.videoCodec(videoCodec);

    // Set quality
    command = command.outputOptions([`-crf ${options.crf}`]);

    // Scale if needed
    if (options.resolution && options.resolution !== 'original') {
      command = command.size(`${options.resolution}x?`);
    }

    command
      .on('progress', (progress) => {
        options.onProgress?.(progress.percent ?? 0);
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(options.outputPath);
  });
}

export async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        folder: require('path').dirname(outputPath),
        filename: require('path').basename(outputPath),
        size: '320x?',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

export async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration ?? 0);
    });
  });
}
```

### Step 4.4: Electron Builder Configuration

**`apps/desktop/electron-builder.json`:**

```json
{
  "appId": "com.batchvideo.app",
  "productName": "BatchVideo",
  "directories": {
    "buildResources": "resources",
    "output": "release"
  },
  "files": ["dist/**/*"],
  "extraResources": [
    {
      "from": "node_modules/ffmpeg-static",
      "to": "ffmpeg-static"
    },
    {
      "from": "node_modules/ffprobe-static",
      "to": "ffprobe-static"
    }
  ],
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.video",
    "icon": "resources/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "notarize": false
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "resources/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Video",
    "icon": "resources/icons"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## Phase 5: GitHub Actions CI/CD

### Step 5.1: Shared CI Workflow

**`.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck
```

### Step 5.2: Web Deployment Workflow

**`.github/workflows/deploy-web.yml`:**

```yaml
name: Deploy Web

on:
  push:
    branches: [master]
    paths:
      - 'apps/web/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'

permissions:
  contents: write
  pages: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web app
        run: pnpm build:web

      - name: Add CNAME
        run: echo "batchvideo.laikahkeen.com" > apps/web/dist/CNAME

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./apps/web/dist
```

### Step 5.3: Desktop Build Workflow

**`.github/workflows/build-desktop.yml`:**

```yaml
name: Build Desktop

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: mac
          - os: windows-latest
            platform: win
          - os: ubuntu-latest
            platform: linux

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build desktop app
        run: pnpm --filter @batchvideo/desktop package:${{ matrix.platform }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: batchvideo-${{ matrix.platform }}
          path: apps/desktop/release/*
          retention-days: 30

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: write
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: artifacts/**/*
          draft: true
          generate_release_notes: true
```

---

## Phase 6: Future React Native Considerations

### Package Structure for Mobile

**`apps/mobile/package.json`:** (Future)

```json
{
  "name": "@batchvideo/mobile",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint ."
  },
  "dependencies": {
    "@batchvideo/shared": "workspace:*",
    "expo": "~52.0.0",
    "expo-av": "~14.0.0",
    "expo-file-system": "~17.0.0",
    "react": "^19.0.0",
    "react-native": "0.76.0",
    "ffmpeg-kit-react-native": "^6.0.0"
  }
}
```

### Mobile FFmpeg Strategy

- Use `ffmpeg-kit-react-native` for native FFmpeg on iOS/Android
- Create `@batchvideo/ffmpeg-mobile` package similar to `ffmpeg-native`
- Share types and store logic from `@batchvideo/shared`

---

## Implementation Checklist

> **Strategy Change**: Build desktop app first, then extract shared packages only as needed.
> This avoids premature abstraction and lets us discover what actually needs sharing.

### Phase 1: Foundation ✅ COMPLETE

- [x] Install pnpm globally (`npm install -g pnpm`)
- [x] Create `pnpm-workspace.yaml`
- [x] Create root `package.json`
- [x] Install Turborepo (`pnpm add -D turbo`)
- [x] Create `turbo.json`
- [x] Create `tsconfig.base.json`
- [x] Update `.gitignore` for monorepo

### Phase 2: Migrate Web App ✅ COMPLETE

- [x] Create `apps/web/` directory
- [x] Move current source files to `apps/web/`
- [x] Update `apps/web/package.json`
- [x] Update `vite.config.ts` for monorepo paths
- [x] Test web app still works (`pnpm dev:web`)

### Phase 3: Electron Desktop App ✅ COMPLETE

- [x] Create `apps/desktop/` directory structure
- [x] Install electron-vite and dependencies
- [x] Create main process (`src/main/index.ts`)
  - [x] BrowserWindow setup
  - [x] IPC handlers for native FFmpeg
- [x] Create preload scripts (`src/preload/index.ts`)
  - [x] Expose FFmpeg API via contextBridge
- [x] Create renderer process (`src/renderer/`)
  - [x] Copy web app components (not shared yet)
  - [x] Replace FFmpeg.wasm calls with IPC calls
- [x] Setup native FFmpeg
  - [x] Install fluent-ffmpeg
  - [x] Create ffmpeg wrapper in main process
- [x] Configure electron-builder for packaging
- [x] Test desktop app (`pnpm dev:desktop`)

### Phase 4: Extract Shared Packages (After Desktop Works)

> Only extract what's actually duplicated between web and desktop

- [ ] Identify duplicated code between apps/web and apps/desktop
- [ ] Create `packages/shared/` for common types and utilities
- [ ] Create `packages/ui/` for shared UI components (if needed)
- [ ] Update both apps to use shared packages
- [ ] Keep FFmpeg implementations separate (web=wasm, desktop=native)

### Phase 5: CI/CD

- [x] Update `.github/workflows/deploy.yml` for web (already works)
- [ ] Create `build-desktop.yml` for desktop releases
- [ ] Add matrix build (mac/win/linux)
- [ ] Setup artifact uploads and releases

### Phase 6: Documentation

- [ ] Update `README.md` for monorepo
- [ ] Update `CLAUDE.md` for new structure
- [ ] Create `apps/desktop/README.md`

---

## Key Benefits of This Architecture

1. **Code Sharing**: Types, store logic, and UI components shared across all platforms
2. **Independent Deployment**: Web, desktop, and mobile can be deployed separately
3. **Performance**: Native FFmpeg in Electron (10x faster than WebAssembly)
4. **Maintainability**: Single codebase, unified tooling
5. **CI/CD**: Efficient caching with Turborepo, parallel builds
6. **Developer Experience**: Fast iteration with pnpm and Turbo
7. **Future-Proof**: React Native can be added without restructuring

---

## Estimated Effort

| Phase | Description             | Status     |
| ----- | ----------------------- | ---------- |
| 1     | Foundation Setup        | ✅ Done    |
| 2     | Migrate Web App         | ✅ Done    |
| 3     | Electron Desktop App    | ✅ Done    |
| 4     | Extract Shared Packages | 🔄 Current |
| 5     | CI/CD                   | Pending    |
| 6     | React Native (Future)   | Future     |

**Current approach**: Build desktop app first with duplicated code, then extract shared packages only for what's actually reused. This avoids premature abstraction.
