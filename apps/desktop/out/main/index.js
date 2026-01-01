import { app, ipcMain, shell, dialog, BrowserWindow } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import path, { join } from "path";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const activeProcesses = /* @__PURE__ */ new Map();
function getFFmpegPath() {
  if (app.isPackaged) {
    return ffmpegStatic.replace("app.asar", "app.asar.unpacked");
  }
  return ffmpegStatic;
}
function getFFprobePath() {
  if (app.isPackaged) {
    return ffprobeStatic.path.replace("app.asar", "app.asar.unpacked");
  }
  return ffprobeStatic.path;
}
const ffmpegPath = getFFmpegPath();
const ffprobePath = getFFprobePath();
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
function calculateTargetBitrate(compressionMethod, options) {
  const { fileSize, duration, targetPercentage, targetSizePerMinute } = options;
  if (!duration || duration <= 0) return null;
  switch (compressionMethod) {
    case "percentage": {
      if (!targetPercentage || !fileSize) return null;
      const originalSizeMB = fileSize / (1024 * 1024);
      const targetSizeMB = originalSizeMB * (targetPercentage / 100);
      const totalBitrate = targetSizeMB * 8 * 1024 / duration;
      const audioBitrate = 128;
      return Math.max(500, Math.round(totalBitrate - audioBitrate));
    }
    case "size_per_minute": {
      if (!targetSizePerMinute) return null;
      const totalBitrate = targetSizePerMinute * 8 * 1024 / 60;
      const audioBitrate = 128;
      return Math.max(500, Math.round(totalBitrate - audioBitrate));
    }
    default:
      return null;
  }
}
async function getVideoMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        bitrate: metadata.format.bit_rate ? parseInt(String(metadata.format.bit_rate)) / 1e3 : 0
      });
    });
  });
}
async function generateThumbnail(inputPath) {
  const tempDir = os.tmpdir();
  const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const outputPath = path.join(tempDir, thumbnailName);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath).screenshots({
      count: 1,
      folder: tempDir,
      filename: thumbnailName,
      size: "320x?"
    }).on("end", () => {
      const data = fs.readFileSync(outputPath);
      const base64 = data.toString("base64");
      fs.unlinkSync(outputPath);
      resolve(`data:image/jpeg;base64,${base64}`);
    }).on("error", (err) => {
      reject(err);
    });
  });
}
async function processVideo(jobId, options, onProgress) {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(options.inputPath);
    activeProcesses.set(jobId, command);
    const videoFilters = [];
    if (options.lutPath) {
      videoFilters.push(`lut3d=${options.lutPath}`);
    }
    if (options.resolution !== "original") {
      videoFilters.push(`scale=${options.resolution}:-1`);
    }
    if (videoFilters.length > 0) {
      command = command.videoFilter(videoFilters.join(","));
    }
    if (options.isLutOnlyMode) {
      command = command.videoCodec("libx264").outputOptions(["-preset", "ultrafast", "-crf", "18"]).audioCodec("copy");
    } else {
      const videoCodec = options.codec === "h265" ? "libx265" : "libx264";
      command = command.videoCodec(videoCodec);
      let shouldUseBitrate = false;
      let targetBitrate = 0;
      let targetCRF = options.qualityCrf || 23;
      if (options.compressionMethod === "percentage" || options.compressionMethod === "size_per_minute") {
        const calculatedBitrate = calculateTargetBitrate(options.compressionMethod, {
          fileSize: options.fileSize,
          duration: options.duration,
          targetPercentage: options.targetPercentage,
          targetSizePerMinute: options.targetSizePerMinute
        });
        if (calculatedBitrate) {
          shouldUseBitrate = true;
          targetBitrate = calculatedBitrate;
        }
      }
      const outputOptions = [];
      outputOptions.push("-preset", options.preset);
      if (shouldUseBitrate) {
        outputOptions.push("-b:v", `${targetBitrate}k`);
      } else {
        outputOptions.push("-crf", String(targetCRF));
        if (options.maxBitrate && options.maxBitrate > 0) {
          outputOptions.push("-maxrate", `${options.maxBitrate}k`);
          const bufSize = options.bufferSize && options.bufferSize > 0 ? options.bufferSize : options.maxBitrate * 2;
          outputOptions.push("-bufsize", `${bufSize}k`);
        }
      }
      command = command.outputOptions(outputOptions).audioCodec("copy");
    }
    command.on("progress", (progress) => {
      onProgress(progress.percent || 0);
    }).on("end", () => {
      activeProcesses.delete(jobId);
      const stats = fs.statSync(options.outputPath);
      resolve({ outputPath: options.outputPath, size: stats.size });
    }).on("error", (err) => {
      activeProcesses.delete(jobId);
      reject(err);
    }).save(options.outputPath);
  });
}
function cancelProcess(jobId) {
  const process2 = activeProcesses.get(jobId);
  if (process2) {
    process2.kill("SIGKILL");
    activeProcesses.delete(jobId);
    return true;
  }
  return false;
}
async function checkFFmpeg() {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        resolve({ available: false, error: err.message });
        return;
      }
      ffmpeg.getAvailableCodecs((err2, codecs) => {
        if (err2) {
          resolve({ available: true, version: "unknown" });
          return;
        }
        const hasH264 = codecs["libx264"] !== void 0;
        const hasH265 = codecs["libx265"] !== void 0;
        resolve({
          available: true,
          version: `H.264: ${hasH264 ? "yes" : "no"}, H.265: ${hasH265 ? "yes" : "no"}`
        });
      });
    });
  });
}
function setupFFmpegHandlers() {
  ipcMain.handle("ffmpeg:check", async () => {
    return checkFFmpeg();
  });
  ipcMain.handle("ffmpeg:getMetadata", async (_, inputPath) => {
    try {
      return await getVideoMetadata(inputPath);
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  });
  ipcMain.handle("ffmpeg:generateThumbnail", async (_, inputPath) => {
    try {
      return await generateThumbnail(inputPath);
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      return null;
    }
  });
  ipcMain.handle(
    "ffmpeg:process",
    async (event, jobId, options) => {
      try {
        return await processVideo(jobId, options, (progress) => {
          event.sender.send("ffmpeg:progress", { jobId, progress });
        });
      } catch (error) {
        throw new Error(`Processing failed: ${error.message}`);
      }
    }
  );
  ipcMain.handle("ffmpeg:cancel", async (_, jobId) => {
    return cancelProcess(jobId);
  });
  ipcMain.handle("ffmpeg:cancelAll", async () => {
    const ids = Array.from(activeProcesses.keys());
    ids.forEach((id) => cancelProcess(id));
    return ids.length;
  });
}
function setupFileHandlers() {
  ipcMain.handle("file:getInfo", async (_, filePath) => {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size
    };
  });
  ipcMain.handle("file:read", async (_, filePath) => {
    return fs.readFileSync(filePath);
  });
  ipcMain.handle("file:exists", async (_, filePath) => {
    return fs.existsSync(filePath);
  });
  ipcMain.handle("file:getTempDir", async () => {
    const tempDir = path.join(os.tmpdir(), "batchvideo");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  });
  ipcMain.handle(
    "file:createOutputPath",
    async (_, inputPath, outputDir) => {
      const inputName = path.basename(inputPath, path.extname(inputPath));
      const dir = outputDir || path.dirname(inputPath);
      const outputName = `${inputName}_processed.mp4`;
      return path.join(dir, outputName);
    }
  );
  ipcMain.handle("file:openInSystem", async (_, filePath) => {
    await shell.openPath(filePath);
  });
  ipcMain.handle("file:showInFolder", async (_, filePath) => {
    shell.showItemInFolder(filePath);
  });
  ipcMain.handle("file:delete", async (_, filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  ipcMain.handle("file:copy", async (_, src, dest) => {
    fs.copyFileSync(src, dest);
  });
  ipcMain.handle("file:getDownloadsFolder", async () => {
    const homeDir = os.homedir();
    const downloadsDir = path.join(homeDir, "Downloads");
    return fs.existsSync(downloadsDir) ? downloadsDir : homeDir;
  });
}
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.batchvideo.app");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  setupFFmpegHandlers();
  setupFileHandlers();
  ipcMain.handle("dialog:openFiles", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Videos",
          extensions: ["mp4", "mov", "mts", "m4v", "avi", "mkv", "webm"]
        }
      ]
    });
    return result.filePaths;
  });
  ipcMain.handle("dialog:openLUT", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "LUT Files",
          extensions: ["cube"]
        }
      ]
    });
    return result.filePaths[0] || null;
  });
  ipcMain.handle("dialog:saveFile", async (_, defaultName) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        {
          name: "Video",
          extensions: ["mp4"]
        }
      ]
    });
    return result.filePath || null;
  });
  ipcMain.handle("dialog:selectOutputFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });
    return result.filePaths[0] || null;
  });
  createWindow();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
