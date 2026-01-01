import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
const ffmpegAPI = {
  check: () => ipcRenderer.invoke("ffmpeg:check"),
  getMetadata: (inputPath) => ipcRenderer.invoke("ffmpeg:getMetadata", inputPath),
  generateThumbnail: (inputPath) => ipcRenderer.invoke("ffmpeg:generateThumbnail", inputPath),
  process: (jobId, options) => ipcRenderer.invoke("ffmpeg:process", jobId, options),
  cancel: (jobId) => ipcRenderer.invoke("ffmpeg:cancel", jobId),
  cancelAll: () => ipcRenderer.invoke("ffmpeg:cancelAll"),
  onProgress: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("ffmpeg:progress", listener);
    return () => ipcRenderer.removeListener("ffmpeg:progress", listener);
  }
};
const fileAPI = {
  getInfo: (filePath) => ipcRenderer.invoke("file:getInfo", filePath),
  read: (filePath) => ipcRenderer.invoke("file:read", filePath),
  exists: (filePath) => ipcRenderer.invoke("file:exists", filePath),
  getTempDir: () => ipcRenderer.invoke("file:getTempDir"),
  createOutputPath: (inputPath, outputDir) => ipcRenderer.invoke("file:createOutputPath", inputPath, outputDir),
  openInSystem: (filePath) => ipcRenderer.invoke("file:openInSystem", filePath),
  showInFolder: (filePath) => ipcRenderer.invoke("file:showInFolder", filePath),
  delete: (filePath) => ipcRenderer.invoke("file:delete", filePath),
  copy: (src, dest) => ipcRenderer.invoke("file:copy", src, dest),
  getDownloadsFolder: () => ipcRenderer.invoke("file:getDownloadsFolder")
};
const dialogAPI = {
  openFiles: () => ipcRenderer.invoke("dialog:openFiles"),
  openLUT: () => ipcRenderer.invoke("dialog:openLUT"),
  saveFile: (defaultName) => ipcRenderer.invoke("dialog:saveFile", defaultName),
  selectOutputFolder: () => ipcRenderer.invoke("dialog:selectOutputFolder")
};
const api = {
  ffmpeg: ffmpegAPI,
  file: fileAPI,
  dialog: dialogAPI,
  platform: process.platform
};
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
