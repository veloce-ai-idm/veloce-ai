/**
 * VELOCE AI IDM — Preload Script
 *
 * Exposes safe IPC bridges to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('veloce', {
  // Downloads
  startDownload: (url, filename, referer, pageTitle) =>
    ipcRenderer.invoke('start-download', { url, filename, referer, pageTitle }),

  openDownloads: () =>
    ipcRenderer.invoke('open-downloads'),

  // Open a specific file or show it in folder
  openFile: (filePath) =>
    ipcRenderer.invoke('open-file', filePath),

  openFolder: (filePath) =>
    ipcRenderer.invoke('open-folder', filePath),

  // Open current page in system browser (Opera GX, Edge, Chrome)
  openInBrowser: (url) =>
    ipcRenderer.invoke('open-in-browser', url),

  // Check file size before downloading (HEAD request for direct files)
  checkSize: (url) =>
    ipcRenderer.invoke('check-size', url),

  // Check HLS stream size (fetches m3u8, samples segments, estimates total)
  checkHlsSize: (url) =>
    ipcRenderer.invoke('check-hls-size', url),

  // Pre-download safety check
  checkSafety: (url, filename, fileSize) =>
    ipcRenderer.invoke('check-safety', url, filename, fileSize),

  // Post-download hash scan
  scanFileHash: (filePath) =>
    ipcRenderer.invoke('scan-file-hash', filePath),

  // Pause / Resume downloads
  pauseDownload: (id) =>
    ipcRenderer.invoke('pause-download', id),

  resumeDownload: (id) =>
    ipcRenderer.invoke('resume-download', id),

  cancelInterceptedDownload: (id) =>
    ipcRenderer.invoke('cancel-intercepted-download', id),

  // Toggle main window DevTools (Ctrl+Shift+J)
  toggleDevTools: () =>
    ipcRenderer.invoke('toggle-devtools'),

  // AI Search
  search: (query, options) =>
    ipcRenderer.invoke('veloce-search', query, options),

  checkUrlAlive: (url) =>
    ipcRenderer.invoke('check-url-alive', url),

  resurrectLink: (url) =>
    ipcRenderer.invoke('resurrect-link', url),

  // Open URL in new tab (from right-click context menu)
  onOpenUrlInTab: (callback) =>
    ipcRenderer.on('open-url-in-tab', (event, url) => callback(url)),

  // Media detection events from main process
  onMediaDetected: (callback) =>
    ipcRenderer.on('media-detected', (event, data) => callback(data)),

  // Download progress events
  onDownloadProgress: (callback) =>
    ipcRenderer.on('download-progress', (event, data) => callback(data)),

  // Download started event (will-download intercepted a file)
  onDownloadStarted: (callback) =>
    ipcRenderer.on('download-started', (event, data) => callback(data)),

  // Download complete event (file finished downloading)
  onDownloadComplete: (callback) =>
    ipcRenderer.on('download-complete', (event, data) => callback(data)),

  // CEF browser profile launch errors
  onCefLaunchError: (callback) =>
    ipcRenderer.on('cef-launch-error', (event, msg) => callback(msg)),

  // ── ReClip-style Smart Download (yt-dlp video detection) ──
  extractVideoInfo: (url) =>
    ipcRenderer.invoke('ytdlp-extract', url),

  downloadFormat: (url, formatId, isAudio, title, ytDlpId) =>
    ipcRenderer.invoke('ytdlp-download-format', { url, formatId, isAudio, title, ytDlpId }),

  // Cancel yt-dlp format download (kill proc + delete partial files)
  cancelFormat: (ytDlpId) =>
    ipcRenderer.invoke('ytdlp-cancel-format', ytDlpId),

  // ── Self-Learning Crawler (Developer Mode) ──
  crawlerStart: (opts) => ipcRenderer.invoke('crawler-start', opts),
  crawlerPause: () => ipcRenderer.invoke('crawler-pause'),
  crawlerResume: () => ipcRenderer.invoke('crawler-resume'),
  crawlerStop: () => ipcRenderer.invoke('crawler-stop'),
  crawlerSkip: () => ipcRenderer.invoke('crawler-skip'),
  crawlerStats: () => ipcRenderer.invoke('crawler-stats'),
  crawlerAddTerm: (term, category) => ipcRenderer.invoke('crawler-add-term', term, category),
  crawlerExport: () => ipcRenderer.invoke('crawler-export'),
  onCrawlerUpdate: (callback) =>
    ipcRenderer.on('crawler-update', (event, data) => callback(data)),

  // ── Training Term Management ──
  crawlerGetTerms: () => ipcRenderer.invoke('crawler-get-terms'),
  crawlerRemoveTerm: (term, category) => ipcRenderer.invoke('crawler-remove-term', term, category),
  crawlerRemoveBulk: (items) => ipcRenderer.invoke('crawler-remove-bulk', items),

  // ── Bit-style Profiles (multi-profile browser) ──
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    get: (id) => ipcRenderer.invoke('profiles:get', id),
    add: (profile) => ipcRenderer.invoke('profiles:add', profile),
    update: (id, updates) => ipcRenderer.invoke('profiles:update', id, updates),
    remove: (id) => ipcRenderer.invoke('profiles:remove', id),
  },
  browserLaunch: (profileId) => ipcRenderer.invoke('browser:launch', profileId),
  proxyCheck: (proxy) => ipcRenderer.invoke('proxy:check', proxy),

  // ── Engine Settings ──
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  selectDownloadPath: () => ipcRenderer.invoke('select-download-path'),

  // ── Browser Menu (hamburger) ──
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  clearBrowsingData: (opts) => ipcRenderer.invoke('clear-browsing-data', opts || {}),

  // ── Floating Download Dialog ──
  openDlDialog: (data) => ipcRenderer.invoke('open-dl-dialog', data),
  updateDlDialog: (data) => ipcRenderer.invoke('update-dl-dialog', data),
  updateDlDialogSafety: (data) => ipcRenderer.invoke('update-dl-dialog-safety', data),
  closeDlDialog: () => ipcRenderer.invoke('close-dl-dialog'),
  onDlDialogAction: (callback) => ipcRenderer.on('dl-dialog-action', (e, action) => callback(action)),

  // ── License & Trial ──
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),
  getLicense: () => ipcRenderer.invoke('get-license'),
  checkTrial: () => ipcRenderer.invoke('check-trial'),
});
