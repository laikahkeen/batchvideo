import { app, shell, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { join } from 'path';
import { setupFFmpegHandlers } from './ffmpeg';
import { setupFileHandlers } from './file-handlers';
import { setupAutoUpdater } from './auto-updater';
import { createAppMenu } from './menu';
import { initAnalytics, shutdownAnalytics, trackEventRaw } from './analytics';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.batchvideo.app');

  // Initialize analytics
  initAnalytics();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Register global keyboard shortcut for DevTools toggle
  // Cmd+Shift+I on macOS, Ctrl+Shift+I on Windows/Linux
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });

  // Setup IPC handlers
  setupFFmpegHandlers();
  setupFileHandlers();

  // Setup auto-updater and app menu
  setupAutoUpdater();
  createAppMenu();

  // App version handler
  ipcMain.on('app:getVersion', (event) => {
    event.returnValue = app.getVersion();
  });

  // Handle file dialog
  ipcMain.handle('dialog:openFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Videos',
          extensions: ['mp4', 'mov', 'mts', 'm4v', 'avi', 'mkv', 'webm'],
        },
      ],
    });
    return result.filePaths;
  });

  ipcMain.handle('dialog:openLUT', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'LUT Files',
          extensions: ['cube'],
        },
      ],
    });
    return result.filePaths[0] || null;
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        {
          name: 'Video',
          extensions: ['mp4'],
        },
      ],
    });
    return result.filePath || null;
  });

  ipcMain.handle('dialog:selectOutputFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.filePaths[0] || null;
  });

  // Analytics IPC handler (accepts any event string from renderer)
  ipcMain.on('analytics:track', (_, event: string, properties?: Record<string, unknown>) => {
    trackEventRaw(event, properties);
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup global shortcuts and shutdown analytics when app quits
app.on('will-quit', async () => {
  globalShortcut.unregisterAll();
  await shutdownAnalytics();
});
