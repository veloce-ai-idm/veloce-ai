/**
 * VELOCE AI — Download Dialog Preload
 * Bridges IPC for the floating download dialog window
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dlDialog', {
  // Receive data updates from main process
  onUpdate: (callback) => ipcRenderer.on('dl-dialog-update', (e, data) => callback(data)),
  onSafety: (callback) => ipcRenderer.on('dl-dialog-safety', (e, data) => callback(data)),

  // Send actions back to main process (which forwards to renderer)
  startDownload: () => ipcRenderer.send('dl-dialog-action', 'start'),
  cancelDownload: () => ipcRenderer.send('dl-dialog-action', 'cancel'),
  stopDownload: () => ipcRenderer.send('dl-dialog-action', 'stop'),
});
