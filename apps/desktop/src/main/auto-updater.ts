import updaterPkg from 'electron-updater';
import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
const { autoUpdater } = updaterPkg;
autoUpdater.logger = log;

// Configure updater for silent operation
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoRunAppAfterInstall = true;

export function setupAutoUpdater(): void {
  // Only check for updates in production
  if (!app.isPackaged) {
    log.info('Auto-updater: Skipping in development mode');
    return;
  }

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    log.info('Auto-updater: Checking for update...');
    sendStatusToRenderer('checking');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Auto-updater: Update available', info.version);
    sendStatusToRenderer('available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('Auto-updater: No update available');
    sendStatusToRenderer('not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info(`Auto-updater: Download progress ${Math.round(progress.percent)}%`);
    sendStatusToRenderer('downloading', { progress: Math.round(progress.percent) });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Auto-updater: Update downloaded', info.version);
    sendStatusToRenderer('downloaded', { version: info.version });
    // Silent install on next restart - no prompt needed
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater: Error', err);
    sendStatusToRenderer('error', { error: err.message });
  });

  // IPC handler for manual update check
  ipcMain.handle('updater:checkForUpdates', async () => {
    log.info('Auto-updater: Manual check requested');
    return autoUpdater.checkForUpdates();
  });

  // Check for updates on startup (after 5 second delay)
  setTimeout(() => {
    log.info('Auto-updater: Initial check');
    autoUpdater.checkForUpdates();
  }, 5000);

  // Check periodically (every 4 hours)
  setInterval(
    () => {
      log.info('Auto-updater: Periodic check');
      autoUpdater.checkForUpdates();
    },
    4 * 60 * 60 * 1000
  );
}

export function checkForUpdates(): void {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
}

function sendStatusToRenderer(status: string, data?: { version?: string; progress?: number; error?: string }): void {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    win.webContents.send('updater:status', { status, ...data });
  });
}
