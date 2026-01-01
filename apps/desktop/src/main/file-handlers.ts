import { ipcMain, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
}

export function setupFileHandlers(): void {
  // Get file info
  ipcMain.handle('file:getInfo', async (_, filePath: string): Promise<FileInfo> => {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size
    };
  });

  // Read file as buffer (for LUT files)
  ipcMain.handle('file:read', async (_, filePath: string): Promise<Buffer> => {
    return fs.readFileSync(filePath);
  });

  // Check if file exists
  ipcMain.handle('file:exists', async (_, filePath: string): Promise<boolean> => {
    return fs.existsSync(filePath);
  });

  // Get temp directory
  ipcMain.handle('file:getTempDir', async (): Promise<string> => {
    const tempDir = path.join(os.tmpdir(), 'batchvideo');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  });

  // Create output path
  ipcMain.handle(
    'file:createOutputPath',
    async (_, inputPath: string, outputDir?: string): Promise<string> => {
      const inputName = path.basename(inputPath, path.extname(inputPath));
      const dir = outputDir || path.dirname(inputPath);
      const outputName = `${inputName}_processed.mp4`;
      return path.join(dir, outputName);
    }
  );

  // Open file in system
  ipcMain.handle('file:openInSystem', async (_, filePath: string): Promise<void> => {
    await shell.openPath(filePath);
  });

  // Show file in folder
  ipcMain.handle('file:showInFolder', async (_, filePath: string): Promise<void> => {
    shell.showItemInFolder(filePath);
  });

  // Delete file
  ipcMain.handle('file:delete', async (_, filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Copy file
  ipcMain.handle('file:copy', async (_, src: string, dest: string): Promise<void> => {
    fs.copyFileSync(src, dest);
  });

  // Get downloads folder
  ipcMain.handle('file:getDownloadsFolder', async (): Promise<string> => {
    const homeDir = os.homedir();
    const downloadsDir = path.join(homeDir, 'Downloads');
    return fs.existsSync(downloadsDir) ? downloadsDir : homeDir;
  });
}
