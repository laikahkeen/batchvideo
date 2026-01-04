# Debugging BatchVideo Desktop App

This guide covers all the ways to debug the BatchVideo Electron desktop application, including both the **main process** (Node.js backend) and the **renderer process** (React frontend).

## Table of Contents

- [Quick Start](#quick-start)
- [Debugging the Renderer Process (Frontend)](#debugging-the-renderer-process-frontend)
- [Debugging the Main Process (Backend)](#debugging-the-main-process-backend)
- [VS Code Debugging](#vs-code-debugging)
- [Debugging Techniques](#debugging-techniques)
- [Common Issues](#common-issues)
- [Advanced Debugging](#advanced-debugging)

---

## Quick Start

### Open DevTools Automatically

DevTools opens automatically in development mode. Just run:

```bash
cd apps/desktop
pnpm dev
```

The Chrome DevTools will open automatically when the app launches.

### Toggle DevTools with Keyboard Shortcut

- **macOS:** `Cmd + Shift + I`
- **Windows/Linux:** `Ctrl + Shift + I`
- **All platforms:** `F12` (provided by electron-toolkit)

---

## Debugging the Renderer Process (Frontend)

The renderer process is your React application. It runs in a Chromium browser environment.

### Keyboard Shortcuts

Use any of these shortcuts to toggle DevTools:

- `Cmd + Shift + I` (macOS) / `Ctrl + Shift + I` (Windows/Linux)
- `F12` (all platforms)

### What You Can Debug in Renderer Process

- **React Components:** Inspect component hierarchy, props, state
- **DOM Elements:** Examine HTML structure and CSS styles
- **Console Logs:** All `console.log()`, `console.error()`, etc.
- **Network Requests:** Monitor API calls (if any)
- **Performance:** Profile React renders and identify bottlenecks
- **Storage:** View localStorage, sessionStorage, IndexedDB
- **Zustand State:** Inspect app state using React DevTools

### Installing React DevTools

To get better React debugging, install the React DevTools extension:

1. Install the package:

```bash
cd apps/desktop
pnpm add -D electron-devtools-installer
```

2. Update `src/main/index.ts` in the `app.whenReady()` section:

```typescript
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

app.whenReady().then(async () => {
  // Install React DevTools in development
  if (is.dev) {
    try {
      await installExtension(REACT_DEVELOPER_TOOLS);
      console.log('React DevTools installed');
    } catch (err) {
      console.log('Error installing React DevTools:', err);
    }
  }

  // ... rest of your code
});
```

---

## Debugging the Main Process (Backend)

The main process is your Node.js code that handles Electron APIs, FFmpeg processing, file operations, etc.

### Method 1: VS Code Debugger (Recommended)

This is the most powerful way to debug the main process with breakpoints, step-through debugging, and variable inspection.

#### Using the Pre-configured Launch Configurations

We've set up three debugging configurations in `.vscode/launch.json`:

1. **Debug Electron Main Process**
   - Launches Electron with the debugger attached to the main process
   - Use this to debug main process code with breakpoints

2. **Debug Electron Main + Renderer**
   - Runs the full development server (`pnpm dev`)
   - Attach debugger to the main process
   - Best for end-to-end debugging

3. **Attach to Electron Main Process**
   - Attaches to an already running Electron process
   - Useful if you started the app separately

#### How to Use

1. Open VS Code in the project root
2. Go to the **Run and Debug** panel (Cmd+Shift+D / Ctrl+Shift+D)
3. Select "Debug All (Main + Renderer)" from the dropdown
4. Click the green play button or press `F5`

The app will launch with the debugger attached. You can now:

- Set breakpoints in any `.ts` file in `src/main/`
- Step through code execution
- Inspect variables
- Evaluate expressions in the Debug Console

#### Setting Breakpoints

1. Open any file in `src/main/` (e.g., `src/main/index.ts`, `src/main/ffmpeg.ts`)
2. Click in the gutter (left of line numbers) to set a red breakpoint dot
3. Run the debug configuration
4. When execution hits your breakpoint, the app will pause

#### Debug Console

While paused at a breakpoint, you can:

- Hover over variables to see their values
- Type expressions in the Debug Console to evaluate them
- Use the toolbar to step over, step into, or continue execution

### Method 2: Chrome DevTools for Main Process

You can also debug the main process using Chrome DevTools:

1. Start the app with the `--inspect` flag:

```bash
cd apps/desktop
./node_modules/.bin/electron --inspect=5858 .
```

2. Open Chrome and navigate to:

```
chrome://inspect
```

3. Click "Configure" and add `localhost:5858`
4. Click "inspect" under your Electron app

### Method 3: Console Logging

The simplest debugging method - just use `console.log()`:

```typescript
// In src/main/index.ts or any main process file
console.log('Creating window...');
console.log('Window size:', mainWindow.getSize());
console.error('Something went wrong:', error);
```

**Where to see the output:**

- **Terminal:** Look at the terminal where you ran `pnpm dev`
- **VS Code Debug Console:** If using VS Code debugger

### Method 4: Electron Inspector

For debugging IPC communication and Electron internals:

```bash
cd apps/desktop
pnpm dev --inspect-brk
```

This will pause execution at the start, allowing you to attach a debugger before any code runs.

---

## VS Code Debugging

### Available Configurations

Our `.vscode/launch.json` provides these configurations:

#### 1. Debug Electron Main Process

```json
{
  "name": "Debug Electron Main Process",
  "type": "node",
  "request": "launch",
  "cwd": "${workspaceFolder}/apps/desktop",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": ["--inspect=5858", "."],
  "outputCapture": "std"
}
```

**Use this when:** You want to debug only the main process with maximum control.

#### 2. Debug Electron Main + Renderer

```json
{
  "name": "Debug Electron Main + Renderer",
  "type": "node",
  "request": "launch",
  "cwd": "${workspaceFolder}/apps/desktop",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["run", "dev"]
}
```

**Use this when:** You want to run the full dev server and debug both processes.

#### 3. Attach to Electron Main Process

```json
{
  "name": "Attach to Electron Main Process",
  "type": "node",
  "request": "attach",
  "port": 5858,
  "address": "localhost"
}
```

**Use this when:** The app is already running and you want to attach the debugger.

### Debugging Workflow

1. **Set breakpoints** in your code
2. **Start debugging** (F5 or click the green play button)
3. **Interact with the app** to trigger your breakpoints
4. **Inspect variables** when execution pauses
5. **Step through code** using the debug toolbar
6. **Modify and continue** - make code changes and hot reload

### Debug Toolbar

When paused at a breakpoint:

- **Continue (F5):** Resume execution
- **Step Over (F10):** Execute current line, don't step into functions
- **Step Into (F11):** Step into function calls
- **Step Out (Shift+F11):** Step out of current function
- **Restart (Cmd+Shift+F5):** Restart the debugging session
- **Stop (Shift+F5):** Stop debugging

---

## Debugging Techniques

### Debugging FFmpeg Processing

When debugging video processing in `src/main/ffmpeg.ts`:

```typescript
export function processVideo(filePath: string, options: ProcessingOptions) {
  console.log('Processing video:', filePath);
  console.log('Options:', JSON.stringify(options, null, 2));

  // Set breakpoint here to inspect FFmpeg command
  const command = ffmpeg(filePath);

  command
    .on('start', (commandLine) => {
      console.log('FFmpeg command:', commandLine);
    })
    .on('progress', (progress) => {
      console.log('Progress:', progress.percent + '%');
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      debugger; // This will trigger breakpoint if DevTools is open
    });
}
```

### Debugging IPC Communication

To debug messages between main and renderer:

```typescript
// In main process
ipcMain.handle('some-channel', async (event, data) => {
  console.log('IPC received:', 'some-channel', data);
  debugger; // Pause execution here
  return result;
});

// In renderer process (React)
const result = await window.electron.ipcRenderer.invoke('some-channel', data);
console.log('IPC result:', result);
```

### Debugging React State (Zustand)

Use React DevTools to inspect Zustand store:

1. Open DevTools in renderer process
2. Click the "Components" tab
3. Find your component using the store
4. Inspect the props to see current state

Or add logging middleware:

```typescript
// In src/renderer/store/useVideoStore.ts
import { devtools } from 'zustand/middleware';

export const useVideoStore = create(
  devtools(
    (set, get) => ({
      // ... your store
    }),
    { name: 'VideoStore' }
  )
);
```

### Debugging File Operations

When debugging file handlers in `src/main/file-handlers.ts`:

```typescript
import fs from 'fs';

export function readFile(path: string) {
  console.log('Reading file:', path);
  console.log('File exists:', fs.existsSync(path));

  if (!fs.existsSync(path)) {
    debugger; // Pause if file doesn't exist
    throw new Error('File not found');
  }

  const data = fs.readFileSync(path);
  console.log('File size:', data.length, 'bytes');
  return data;
}
```

---

## Common Issues

### DevTools Won't Open

**Problem:** DevTools doesn't open even in development mode.

**Solutions:**

1. Check that you're running in development mode:

   ```bash
   pnpm dev  # NOT pnpm build && pnpm preview
   ```

2. Manually toggle DevTools with `Cmd+Shift+I` or `F12`

3. Check if there's an error in the main process console (terminal)

### Breakpoints Not Hitting

**Problem:** Breakpoints in VS Code are grayed out or not triggering.

**Solutions:**

1. Make sure you're using the correct debug configuration
2. Check that the file path matches (sometimes TypeScript compilation can cause issues)
3. Try adding `debugger;` statements instead of breakpoints
4. Rebuild the app: `pnpm build` then restart debugging

### Source Maps Not Working

**Problem:** Can't see original TypeScript code in DevTools, only compiled JavaScript.

**Solutions:**

1. Check `electron.vite.config.ts` has source maps enabled:

   ```typescript
   export default defineConfig({
     main: {
       build: {
         sourcemap: true, // Add this
       },
     },
   });
   ```

2. Rebuild: `pnpm build`

### Console Logs Not Appearing

**Problem:** `console.log()` statements aren't showing up.

**Solutions:**

1. **Main process logs:** Check the terminal where you ran `pnpm dev`
2. **Renderer process logs:** Check Chrome DevTools Console tab
3. Make sure you're looking in the right place for each process

### Hot Reload Not Working During Debug

**Problem:** Changes aren't reflected without restarting the debugger.

**Solutions:**

1. Use "Debug Electron Main + Renderer" configuration
2. Make sure electron-vite's HMR is working (check terminal for errors)
3. For main process changes, you'll need to restart the debugger

---

## Advanced Debugging

### Debugging Production Builds

To debug production builds:

1. Build the app with source maps:

   ```bash
   pnpm build
   ```

2. Package the app:

   ```bash
   pnpm package
   ```

3. Run the packaged app with inspector:
   ```bash
   # On macOS
   ./dist/mac/BatchVideo.app/Contents/MacOS/BatchVideo --inspect=5858
   ```

### Performance Profiling

#### Renderer Process Performance

1. Open DevTools
2. Go to "Performance" tab
3. Click "Record"
4. Interact with the app
5. Click "Stop"
6. Analyze the flame graph to find bottlenecks

#### Main Process Performance

Use Node.js profiling:

```bash
cd apps/desktop
node --inspect --prof ./node_modules/.bin/electron .
```

### Memory Leak Detection

#### Renderer Process

1. Open DevTools
2. Go to "Memory" tab
3. Take a heap snapshot
4. Perform actions in the app
5. Take another snapshot
6. Compare snapshots to find leaks

#### Main Process

Use Chrome DevTools connected to the main process:

1. Start with `--inspect`
2. Open `chrome://inspect`
3. Click "Take heap snapshot" in Memory tab

### Network Debugging

If your app makes HTTP requests:

1. Open DevTools in renderer process
2. Go to "Network" tab
3. Interact with the app
4. Inspect requests, responses, timing

### Debugging Crashes

If the app crashes:

1. Check crash logs:
   - **macOS:** `~/Library/Logs/BatchVideo/`
   - **Windows:** `%APPDATA%\BatchVideo\logs\`
   - **Linux:** `~/.config/BatchVideo/logs/`

2. Enable crash reporting:

   ```typescript
   import { crashReporter } from 'electron';

   crashReporter.start({
     productName: 'BatchVideo',
     submitURL: 'https://your-crash-server.com/submit',
     uploadToServer: false, // Set to true for production
   });
   ```

---

## Environment-Specific Debugging

### Development vs Production

The app behaves differently in development vs production:

```typescript
import { is } from '@electron-toolkit/utils';

if (is.dev) {
  console.log('Running in DEVELOPMENT mode');
  // Development-only debugging features
} else {
  console.log('Running in PRODUCTION mode');
  // Production-specific code
}
```

### Platform-Specific Debugging

Debug platform-specific issues:

```typescript
if (process.platform === 'darwin') {
  console.log('Running on macOS');
} else if (process.platform === 'win32') {
  console.log('Running on Windows');
} else if (process.platform === 'linux') {
  console.log('Running on Linux');
}
```

---

## Tips and Best Practices

1. **Use descriptive console.log messages:**

   ```typescript
   console.log('[FFmpeg] Starting conversion:', filePath);
   console.log('[IPC] Received message:', channel, data);
   ```

2. **Add error context:**

   ```typescript
   try {
     // risky operation
   } catch (error) {
     console.error('[FileHandler] Failed to read file:', filePath, error);
     throw error;
   }
   ```

3. **Use debugger statements strategically:**

   ```typescript
   if (someCondition) {
     debugger; // Only pause when condition is true
   }
   ```

4. **Enable verbose logging in development:**

   ```typescript
   if (is.dev) {
     app.commandLine.appendSwitch('enable-logging');
     app.commandLine.appendSwitch('v', '1');
   }
   ```

5. **Monitor IPC traffic:**
   ```typescript
   // Log all IPC calls
   ipcMain.on('*', (event, ...args) => {
     console.log('[IPC]', event.sender.getURL(), args);
   });
   ```

---

## Quick Reference

| What to Debug      | Tool                   | Location         |
| ------------------ | ---------------------- | ---------------- |
| React components   | Chrome DevTools        | Renderer process |
| Zustand state      | React DevTools         | Renderer process |
| FFmpeg processing  | Console.log + VS Code  | Main process     |
| IPC communication  | Console.log both sides | Both processes   |
| File operations    | VS Code debugger       | Main process     |
| Performance issues | Chrome Performance tab | Renderer process |
| Memory leaks       | Chrome Memory tab      | Both processes   |
| Network requests   | Chrome Network tab     | Renderer process |

---

## Keyboard Shortcuts Summary

| Action               | macOS         | Windows/Linux  |
| -------------------- | ------------- | -------------- |
| Toggle DevTools      | `Cmd+Shift+I` | `Ctrl+Shift+I` |
| Alternative DevTools | `F12`         | `F12`          |
| Open VS Code Debug   | `Cmd+Shift+D` | `Ctrl+Shift+D` |
| Start Debugging      | `F5`          | `F5`           |
| Step Over            | `F10`         | `F10`          |
| Step Into            | `F11`         | `F11`          |
| Step Out             | `Shift+F11`   | `Shift+F11`    |
| Continue             | `F5`          | `F5`           |

---

## Getting Help

If you're still stuck:

1. Check the terminal for error messages
2. Look for errors in Chrome DevTools console
3. Search GitHub issues for similar problems
4. Check Electron documentation: https://www.electronjs.org/docs/latest/
5. Check electron-vite documentation: https://electron-vite.org/

---

## Summary

- **Renderer Process (React):** Use Chrome DevTools (opens automatically)
- **Main Process (Node.js):** Use VS Code debugger or Chrome DevTools with `--inspect`
- **Keyboard Shortcuts:** `Cmd/Ctrl+Shift+I` or `F12` for DevTools
- **Best Method:** VS Code debugging with "Debug All (Main + Renderer)" configuration
- **Quick Debug:** Add `console.log()` and check terminal (main) or DevTools (renderer)

Happy debugging!
