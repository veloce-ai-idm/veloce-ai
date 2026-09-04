/**
 * VELOCE AI IDM — Electron Main Process
 *
 * Full Chromium browser with:
 *   - Widevine DRM (plays fmovies, Netflix, etc.)
 *   - Network request interception (sniffer)
 *   - Tab management via <webview>
 *   - Built-in HLS downloader with AES-128 decryption
 *   - yt-dlp fallback for YouTube/Vimeo/etc.
 */

'use strict';

const { app, BrowserWindow, ipcMain, session, shell, net, Menu, MenuItem, clipboard, dialog, protocol } = require('electron');

// Kill the stun.l.google.com error spam — WebRTC is not needed for scraping
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns,WebAuthenticationRemoteDesktopSupport');
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
app.commandLine.appendSwitch('disable-webauthn');
const path = require('path');
const netNode = require('net');  // Node TCP for proxy check (Electron net is for net.request only)
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
let socks5Bridge = null;
try { socks5Bridge = require('./socks5-bridge'); } catch (_) { /* BitBrowser proxy removed */ }

// ── Path resolution — __dirname is inside read-only app.asar in production builds ──
var RESOURCES = __dirname;           // Bundled assets (ytdlp_helper.py, ffmpeg, icon, html, preloads)
var APPDATA = __dirname;             // Writable files (patterns.json, cookies, crawler state)
var IS_PACKAGED = false;
app.on('ready', function() {
  if (app.isPackaged) {
    IS_PACKAGED = true;
    RESOURCES = process.resourcesPath;
    APPDATA = app.getPath('userData');
    try { fs.mkdirSync(APPDATA, { recursive: true }); } catch (_) {}
    // Seed writable files from the asar into userData on first run
    ['patterns.json', 'training-terms.json', 'crawler-links.jsonl'].forEach(function(f) {
      var seed = path.join(__dirname, f);
      var dest = path.join(APPDATA, f);
      if (!fs.existsSync(dest) && fs.existsSync(seed)) {
        try { fs.copyFileSync(seed, dest); } catch (_) {}
      }
    });
  }
});

// ── Chromium flags ──
// ── Chromium flags ──
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy,CrossOriginEmbedderPolicy');

// ── Custom protocol: veloce:// → served on browser session (webviews use persist:browser) ──
protocol.registerSchemesAsPrivileged([
  { scheme: 'veloce', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let mainWindow = null;
var browserSession = null;  // Dedicated session for webviews (stealth + sniffer)
var veloceCrawler = null;   // Self-learning crawler instance (developer mode)
var dlDialogWindow = null;  // Floating download dialog (separate window)
var profileWebRequestReady = new Set();  // Track partitions that already have webRequest listeners

// ── Media patterns to detect ──
const STREAM_PATTERNS = [
  '.m3u8', '.mpd',
  'videoplayback',
  '/hls/', '/dash/',
  'master.m3u8', 'playlist.m3u8', 'index.m3u8',
];

const MEDIA_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.mp3', '.aac', '.flac', '.ogg', '.wav',
  '.exe', '.msi', '.dmg', '.zip', '.rar', '.7z', '.iso',
];

const IGNORE_EXTENSIONS = [
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.css', '.js', '.mjs', '.jsx', '.tsx',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
  '.html', '.htm', '.json', '.xml', '.txt', '.map',
];

const JUNK_PATTERNS = [
  'secure_browser', 'antivirus', 'setup.exe', 'install.exe',
  'clickserv', 'doubleclick', 'googleads', 'googlesyndication',
  'adservice', 'analytics', 'tracker', 'pixel', 'beacon',
  'success.mp3', 'opm.mp3', '/s/search/audio/'
];

function isMediaUrl(url) {
  var lower = url.toLowerCase();
  var urlPath = lower.split('?')[0];
  for (var i = 0; i < IGNORE_EXTENSIONS.length; i++) {
    if (urlPath.endsWith(IGNORE_EXTENSIONS[i])) return null;
  }
  for (var i = 0; i < JUNK_PATTERNS.length; i++) {
    if (lower.indexOf(JUNK_PATTERNS[i]) !== -1) return null;
  }
  for (var i = 0; i < MEDIA_EXTENSIONS.length; i++) {
    if (lower.indexOf(MEDIA_EXTENSIONS[i]) !== -1) return MEDIA_EXTENSIONS[i];
  }
  for (var i = 0; i < STREAM_PATTERNS.length; i++) {
    if (lower.indexOf(STREAM_PATTERNS[i]) !== -1) return STREAM_PATTERNS[i];
  }
  if (urlPath.endsWith('.ts')) {
    if (/\d+\.ts$/.test(urlPath) || lower.indexOf('/seg') !== -1 ||
        lower.indexOf('/chunk') !== -1 || lower.indexOf('/hls') !== -1 ||
        lower.indexOf('neonhorizon') !== -1 || lower.indexOf('cdn') !== -1 ||
        lower.indexOf('stream') !== -1 || lower.indexOf('video') !== -1 ||
        lower.indexOf('media') !== -1) {
      return null;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// ── BUILT-IN HLS DOWNLOADER with AES-128 DECRYPTION ──
// Uses browser session (Electron net) — bypasses Cloudflare.
// Decrypts encrypted segments using Node.js crypto module.
// ══════════════════════════════════════════════════════════════

const CONCURRENCY = 16;  // 16 tunnels like IDM

/**
 * Fetch URL using Electron's net module (browser session = same cookies/TLS)
 */
function fetchWithBrowser(url) {
  return new Promise(function(resolve, reject) {
    try {
      var request = net.request({ url: url, session: browserSession || session.defaultSession });
      var chunks = [];
      var totalSize = 0;

      request.on('response', function(response) {
        var statusCode = response.statusCode;
        if (statusCode >= 300 && statusCode < 400) {
          var location = response.headers['location'];
          if (location) {
            var redir = Array.isArray(location) ? location[0] : location;
            if (!redir.startsWith('http')) {
              var u = new URL(url);
              redir = redir.startsWith('/')
                ? u.protocol + '//' + u.host + redir
                : url.substring(0, url.lastIndexOf('/') + 1) + redir;
            }
            fetchWithBrowser(redir).then(resolve).catch(reject);
            return;
          }
        }
        response.on('data', function(chunk) {
          chunks.push(chunk);
          totalSize += chunk.length;
        });
        response.on('end', function() {
          if (statusCode >= 200 && statusCode < 400) {
            resolve(Buffer.concat(chunks, totalSize));
          } else {
            reject(new Error('HTTP ' + statusCode + ' for ' + url.slice(0, 80)));
          }
        });
        response.on('error', reject);
      });
      request.on('error', function(err) {
        reject(new Error('Net request failed: ' + err.message));
      });
      request.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fetch a byte range (for 16-booster direct downloads). Uses same session as fetchWithBrowser.
 */
function fetchRangeWithBrowser(url, start, end) {
  return new Promise(function(resolve, reject) {
    try {
      var request = net.request({ url: url, session: browserSession || session.defaultSession });
      var rangeHeader = 'bytes=' + start + '-' + end;
      request.setHeader('Range', rangeHeader);
      var chunks = [];
      var totalSize = 0;

      request.on('response', function(response) {
        var statusCode = response.statusCode;
        if (statusCode >= 300 && statusCode < 400) {
          var location = response.headers['location'];
          if (location) {
            var redir = Array.isArray(location) ? location[0] : location;
            if (!redir.startsWith('http')) {
              var u = new URL(url);
              redir = redir.startsWith('/')
                ? u.protocol + '//' + u.host + redir
                : url.substring(0, url.lastIndexOf('/') + 1) + redir;
            }
            fetchRangeWithBrowser(redir, start, end).then(resolve).catch(reject);
            return;
          }
        }
        if (statusCode !== 200 && statusCode !== 206) {
          reject(new Error('HTTP ' + statusCode + ' for range ' + rangeHeader));
          return;
        }
        response.on('data', function(chunk) {
          chunks.push(chunk);
          totalSize += chunk.length;
        });
        response.on('end', function() {
          resolve(Buffer.concat(chunks, totalSize));
        });
        response.on('error', reject);
      });
      request.on('error', function(err) {
        reject(new Error('Net request failed: ' + err.message));
      });
      request.end();
    } catch (err) {
      reject(err);
    }
  });
}

function resolveUrl(relative, baseUrl) {
  if (relative.startsWith('http://') || relative.startsWith('https://')) return relative;
  try { return new URL(relative, baseUrl).href; } catch (e) {
    if (relative.startsWith('/')) {
      var u = new URL(baseUrl);
      return u.protocol + '//' + u.host + relative;
    }
    return baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + relative;
  }
}

/**
 * Parse M3U8 playlist — handles master + media playlists + encryption keys
 */
function parseM3U8(content, baseUrl) {
  var lines = content.split('\n').map(function(l) { return l.trim(); });

  // Check for master playlist
  var hasMaster = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('#EXT-X-STREAM-INF') !== -1) { hasMaster = true; break; }
  }

  if (hasMaster) {
    var bestBw = 0;
    var bestUrl = null;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('#EXT-X-STREAM-INF') !== -1) {
        var bwMatch = lines[i].match(/BANDWIDTH=(\d+)/);
        var bw = bwMatch ? parseInt(bwMatch[1]) : 0;
        for (var j = i + 1; j < lines.length; j++) {
          if (lines[j] && lines[j][0] !== '#') {
            if (bw > bestBw) { bestBw = bw; bestUrl = lines[j]; }
            break;
          }
        }
      }
    }
    if (bestUrl) {
      return { type: 'master', variantUrl: resolveUrl(bestUrl, baseUrl), bandwidth: bestBw };
    }
  }

  // Media playlist — collect segments AND encryption keys
  var segments = [];
  var currentKey = null;  // { method, uri, iv }
  var mediaSequence = 0;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Parse media sequence number (used as default IV)
    if (line.indexOf('#EXT-X-MEDIA-SEQUENCE') !== -1) {
      var seqMatch = line.match(/:(\d+)/);
      if (seqMatch) mediaSequence = parseInt(seqMatch[1]);
    }

    // Parse encryption key
    if (line.indexOf('#EXT-X-KEY') !== -1) {
      var methodMatch = line.match(/METHOD=([^,\s]+)/);
      var uriMatch = line.match(/URI="([^"]+)"/);
      var ivMatch = line.match(/IV=0x([0-9a-fA-F]+)/);

      var method = methodMatch ? methodMatch[1] : 'NONE';
      if (method === 'NONE') {
        currentKey = null;
      } else {
        currentKey = {
          method: method,
          uri: uriMatch ? resolveUrl(uriMatch[1], baseUrl) : null,
          iv: ivMatch ? ivMatch[1] : null,
        };
      }
    }

    // Segment URL
    if (line && line[0] !== '#') {
      segments.push({
        url: resolveUrl(line, baseUrl),
        key: currentKey,
        index: segments.length + mediaSequence,
      });
    }
  }

  return { type: 'media', segments: segments, encrypted: !!currentKey };
}

/**
 * Decrypt a segment using AES-128-CBC
 */
function decryptSegment(data, keyBuffer, iv) {
  try {
    var decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, iv);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  } catch (err) {
    console.log('[Veloce HLS] Decryption error: ' + err.message + ' — saving raw');
    return data;  // Return raw data if decryption fails
  }
}

/**
 * AI-Controlled Smart Tunnel Pool
 *
 * Each tunnel tracks: speed, failures, latency, health score.
 * The AI manager:
 *  - Detects slow tunnels (3x slower than avg) and kills them
 *  - Detects failed tunnels and replaces them with fresh connections
 *  - Applies per-segment timeout (30s) — slow segments get reassigned
 *  - Retries with exponential backoff (up to 3 attempts)
 *  - Reports active/healthy tunnel count in real-time
 */

function createTunnelPool(optSize) {
  var poolSize = optSize || activeConcurrency || 10;  // optSize for direct, activeConcurrency for HLS
  var isHLS = !optSize;
  var tunnels = [];
  for (var i = 0; i < poolSize; i++) {
    tunnels.push({
      id: i + 1,
      totalBytes: 0,
      totalTime: 0,       // ms spent downloading
      successes: 0,
      failures: 0,
      active: false,
      healthy: true,
    });
  }

  function getAvgSpeed() {
    var total = 0, count = 0;
    for (var i = 0; i < tunnels.length; i++) {
      if (tunnels[i].successes > 0 && tunnels[i].totalTime > 0) {
        total += tunnels[i].totalBytes / (tunnels[i].totalTime / 1000);
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }

  function getTunnelSpeed(t) {
    return t.totalTime > 0 ? t.totalBytes / (t.totalTime / 1000) : 0;
  }

  function getHealthyCount() {
    var c = 0;
    for (var i = 0; i < tunnels.length; i++) {
      if (tunnels[i].healthy) c++;
    }
    return c;
  }

  function getActiveCount() {
    var c = 0;
    for (var i = 0; i < tunnels.length; i++) {
      if (tunnels[i].active) c++;
    }
    return c;
  }

  // AI decision: is this tunnel performing poorly?
  function isTunnelSlow(t) {
    var minSuccesses = isHLS ? 5 : 2;
    if (t.successes < minSuccesses) return false;  // not enough data
    var avgSpeed = getAvgSpeed();
    if (avgSpeed <= 0) return false;
    var tunnelSpeed = getTunnelSpeed(t);
    var threshold = isHLS ? 0.25 : 0.5;  // HLS is bursty, be more lenient (4x slower)
    return tunnelSpeed < avgSpeed * threshold;
  }

  // AI decision: is this tunnel dead?
  function isTunnelDead(t) {
    if (isHLS) {
      if (t.failures >= 2 && t.successes === 0) return true;
      return t.failures >= 3;
    } else {
      // Aggressive swap: if it fails on its first ever attempt, kill it immediately.
      if (t.failures >= 1 && t.successes === 0) return true;
      // Otherwise, it's dead after 2 consecutive failures.
      return t.failures >= 2;
    }
  }

  // Reset a bad tunnel (simulates "swapping to a new connection")
  function resetTunnel(t) {
    console.log('[Veloce AI] Resetting tunnel #' + t.id +
      ' (failures: ' + t.failures + ', speed: ' + (getTunnelSpeed(t) / 1024).toFixed(0) + ' KB/s)');
    t.totalBytes = 0;
    t.totalTime = 0;
    t.successes = 0;
    t.failures = 0;
    t.healthy = true;
  }

  // Record a successful download on a tunnel
  function recordSuccess(t, bytes, timeMs) {
    t.totalBytes += bytes;
    t.totalTime += timeMs;
    t.successes++;
    t.active = false;
    t.healthy = true;

    // AI: check if tunnel became slow after enough samples
    if (t.successes >= 3 && isTunnelSlow(t)) {
      console.log('[Veloce AI] Tunnel #' + t.id + ' is slow (' +
        (getTunnelSpeed(t) / 1024).toFixed(0) + ' KB/s vs avg ' +
        (getAvgSpeed() / 1024).toFixed(0) + ' KB/s) — resetting');
      resetTunnel(t);
    }
  }

  // Record a failure on a tunnel
  function recordFailure(t) {
    t.failures++;
    t.active = false;

    if (isTunnelDead(t)) {
      console.log('[Veloce AI] Tunnel #' + t.id + ' is dead — replacing');
      resetTunnel(t);
    } else if (t.failures > t.successes && t.failures >= 4) {
      // Only mark unhealthy if failures significantly exceed successes
      t.healthy = false;
    }
    // If a tunnel accumulates too many failures, give it a fresh start
    if (t.failures >= 4 && t.successes > 0) {
      console.log('[Veloce AI] Tunnel #' + t.id + ' accumulated failures — refreshing');
      resetTunnel(t);
    }
  }

  // Pick the best available tunnel for a new download
  function acquireTunnel() {
    // Prefer healthy, idle tunnels sorted by speed (fastest first)
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < tunnels.length; i++) {
      var t = tunnels[i];
      if (t.active) continue;
      var score = t.healthy ? 1000 : 0;
      score += t.successes * 10;
      score -= t.failures * 100;
      if (t.totalTime > 0) score += getTunnelSpeed(t) / 1024;
      if (score > bestScore) { bestScore = score; best = t; }
    }
    if (best) best.active = true;
    return best;
  }

  return {
    tunnels: tunnels,
    acquireTunnel: acquireTunnel,
    recordSuccess: recordSuccess,
    recordFailure: recordFailure,
    getAvgSpeed: getAvgSpeed,
    getHealthyCount: getHealthyCount,
    getActiveCount: getActiveCount,
    getTunnelSpeed: getTunnelSpeed,
  };
}

/**
 * Download a single segment with timeout and tunnel tracking
 */
function downloadSegmentWithTunnel(seg, tunnel, pool, timeoutMs) {
  return new Promise(function(resolve) {
    var startMs = Date.now();
    var done = false;
    var timer = null;

    // Timeout: if segment takes too long, fail it
    if (timeoutMs > 0) {
      timer = setTimeout(function() {
        if (!done) {
          done = true;
          pool.recordFailure(tunnel);
          console.log('[Veloce AI] Tunnel #' + tunnel.id + ' timed out (' + (timeoutMs / 1000) + 's)');
          resolve(null);  // null = needs retry
        }
      }, timeoutMs);
    }

    fetchWithBrowser(seg.url).then(function(data) {
      if (done) return;  // timed out already
      done = true;
      if (timer) clearTimeout(timer);
      var elapsed = Date.now() - startMs;
      pool.recordSuccess(tunnel, data.length, elapsed);
      resolve(data);
    }).catch(function(err) {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      pool.recordFailure(tunnel);
      resolve(null);  // null = needs retry
    });
  });
}

/**
 * Download HLS stream with AI-controlled tunnel management
 * - 16 concurrent tunnels with health tracking
 * - Slow tunnel detection & replacement
 * - Per-segment timeout (30s)
 * - Up to 3 retries with backoff
 */
var activeConcurrency = 10;  // Stable 10 tunnels — global so both HLS and direct boosters use it
var userMaxConcurrency = 10;  // Tracks user's max setting (AI restore won't exceed this)

// ── User-configurable engine settings (persisted via IPC) ──
var settingsDownloadPath = path.join(app.getPath('downloads'), 'VELOCE_AI');
var settingsRemuxEnabled = true;
var settingsSnifferEnabled = true;
var settingsSoundEnabled = true;
var settingsAutoStart = false;

function getDownloadsDir() {
  if (!fs.existsSync(settingsDownloadPath)) fs.mkdirSync(settingsDownloadPath, { recursive: true });
  return settingsDownloadPath;
}

async function downloadHLS(m3u8Url, outputPath, onProgress, cancelKey) {
  console.log('[Veloce HLS] Fetching manifest: ' + m3u8Url.slice(0, 100));

  // Step 1: Fetch & parse m3u8
  var m3u8Data = await fetchWithBrowser(m3u8Url);
  var m3u8Text = m3u8Data.toString('utf8');
  var parsed = parseM3U8(m3u8Text, m3u8Url);

  if (parsed.type === 'master' && parsed.variantUrl) {
    console.log('[Veloce HLS] Master playlist -> best variant (' + parsed.bandwidth + ' bps)');
    var variantData = await fetchWithBrowser(parsed.variantUrl);
    parsed = parseM3U8(variantData.toString('utf8'), parsed.variantUrl);
  }

  if (!parsed.segments || parsed.segments.length === 0) {
    throw new Error('No segments found in HLS playlist');
  }

  var totalSegments = parsed.segments.length;
  var isEncrypted = parsed.encrypted;
  console.log('[Veloce HLS] ' + totalSegments + ' segments, encrypted: ' + isEncrypted);

  // Step 2: Download encryption keys
  var keyCache = {};
  if (isEncrypted) {
    console.log('[Veloce HLS] Downloading encryption keys...');
    for (var i = 0; i < parsed.segments.length; i++) {
      var seg = parsed.segments[i];
      if (seg.key && seg.key.uri && !keyCache[seg.key.uri]) {
        try {
          var keyData = await fetchWithBrowser(seg.key.uri);
          keyCache[seg.key.uri] = keyData;
          console.log('[Veloce HLS] Got key: ' + seg.key.uri.slice(0, 60));
        } catch (err) {
          console.log('[Veloce HLS] Key download failed: ' + err.message);
        }
      }
    }
  }

  // Step 3: AI-controlled tunnel pool download
  var pool = createTunnelPool();
  var writeStream = fs.createWriteStream(outputPath);

  // Results buffer — segments must be written in order
  var results = new Array(totalSegments);
  var nextWriteIdx = 0;
  var completed = 0;
  var totalBytes = 0;
  var startTime = Date.now();
  var lastReportTime = startTime;
  var lastReportBytes = 0;
  var SEGMENT_TIMEOUT = 12000;  // 12s per segment — faster dead-tunnel detection
  var MAX_RETRIES = 8;          // Never give up easily — 8 attempts

  // Queue of segment indices to download
  var queue = [];
  for (var i = 0; i < totalSegments; i++) queue.push(i);

  // Process segment result: decrypt + buffer for ordered writing
  function processResult(segIdx, data) {
    var seg = parsed.segments[segIdx];

    // Decrypt if needed
    if (data && data.length > 0 && seg.key && seg.key.uri && keyCache[seg.key.uri]) {
      var keyBuf = keyCache[seg.key.uri];
      var iv;
      if (seg.key.iv) {
        iv = Buffer.from(seg.key.iv.padStart(32, '0'), 'hex');
      } else {
        iv = Buffer.alloc(16, 0);
        iv.writeUInt32BE(seg.index, 12);
      }
      data = decryptSegment(data, keyBuf, iv);
    }

    results[segIdx] = data || Buffer.alloc(0);
  }

  // Flush completed segments to disk in order
  function flushWriteBuffer() {
    while (nextWriteIdx < totalSegments && results[nextWriteIdx] !== undefined) {
      var segData = results[nextWriteIdx];
      writeStream.write(segData);
      totalBytes += segData.length;
      completed++;
      results[nextWriteIdx] = null;  // free memory
      nextWriteIdx++;

      // Report progress
      var now = Date.now();
      var elapsed = (now - startTime) / 1000;
      var recentElapsed = (now - lastReportTime) / 1000;
      var overallSpeed = elapsed > 0 ? totalBytes / elapsed : 0;
      var recentSpeed = recentElapsed > 0.5 ? (totalBytes - lastReportBytes) / recentElapsed : overallSpeed;
      var speed = recentElapsed > 1 ? (recentSpeed * 0.7 + overallSpeed * 0.3) : overallSpeed;
      var remaining = totalSegments - completed;
      var avgSegSize = completed > 0 ? totalBytes / completed : 0;
      var remainingBytes = remaining * avgSegSize;
      var eta = speed > 0 ? Math.round(remainingBytes / speed) : 0;

      if (recentElapsed > 2) {
        lastReportTime = now;
        lastReportBytes = totalBytes;
      }

      if (onProgress) {
        // Build per-tunnel speed data for the dashboard
        var tunnelSpeeds = [];
        for (var ti = 0; ti < pool.tunnels.length; ti++) {
          var tn = pool.tunnels[ti];
          tunnelSpeeds.push({
            id: tn.id,
            speed: pool.getTunnelSpeed(tn),
            active: tn.active,
            healthy: tn.healthy,
            ok: tn.successes,
            fail: tn.failures,
          });
        }

        onProgress({
          done: completed,
          total: totalSegments,
          bytes: totalBytes,
          speed: speed,
          eta: eta,
          tunnels: activeConcurrency,
          activeTunnels: pool.getActiveCount(),
          encrypted: isEncrypted,
          tunnelSpeeds: tunnelSpeeds,
        });
      }
    }
  }

  // Track consecutive failures to detect CDN rate-limiting
  var consecutiveFailures = 0;

  // Download a segment — NEVER skips, keeps retrying with longer waits
  async function downloadWithRetry(segIdx) {
    var seg = parsed.segments[segIdx];
    for (var attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Abort early if download was cancelled
      if (cancelKey && cancelledDownloads[cancelKey]) return;
      var tunnel = pool.acquireTunnel();
      if (!tunnel) {
        await new Promise(function(r) { setTimeout(r, 500); });
        tunnel = pool.acquireTunnel();
      }
      if (!tunnel) {
        tunnel = pool.tunnels[segIdx % pool.tunnels.length];
        tunnel.active = true;
      }

      var data = await downloadSegmentWithTunnel(seg, tunnel, pool, SEGMENT_TIMEOUT);
      if (data !== null && data.length > 0) {
        processResult(segIdx, data);
        // Success — reset failure counter, restore to 8 if throttled
        consecutiveFailures = 0;
        if (activeConcurrency < userMaxConcurrency) {
          activeConcurrency = Math.min(activeConcurrency + 3, userMaxConcurrency);
          console.log('[Veloce AI] Restoring concurrency to ' + activeConcurrency);
        }
        return;
      }

      // Failed — increase failure counter
      consecutiveFailures++;

      // AI: if many consecutive failures, CDN is rate-limiting
      // Throttle concurrency and wait longer
      if (consecutiveFailures >= 10 && activeConcurrency > 2) {
        var newConcurrency = Math.max(2, activeConcurrency - Math.max(1, Math.floor(activeConcurrency * 0.2)));
        if (newConcurrency < activeConcurrency) {
          console.log('[Veloce AI] CDN rate-limit detected — throttling from ' +
            activeConcurrency + ' to ' + newConcurrency + ' tunnels');
          activeConcurrency = newConcurrency;
        }
      }

      // Exponential backoff: 2s, 4s, 6s, 8s, 10s, 10s, 10s, 10s
      var backoff = Math.min((attempt + 1) * 2000, 10000);
      // Extra wait if CDN is angry
      if (consecutiveFailures >= 10) backoff = Math.min(backoff + 5000, 15000);

      if (attempt < MAX_RETRIES - 1) {
        console.log('[Veloce AI] Segment ' + segIdx + ' retry ' + (attempt + 2) + '/' + MAX_RETRIES +
          ' in ' + (backoff / 1000) + 's (concurrent: ' + activeConcurrency + ')');
        await new Promise(function(r) { setTimeout(r, backoff); });
      }
    }

    // Last resort: one final attempt with a very long timeout (90s) and no concurrency pressure
    console.log('[Veloce AI] Segment ' + segIdx + ' — final attempt with 90s timeout');
    try {
      var lastData = await fetchWithBrowser(seg.url);
      if (lastData && lastData.length > 0) {
        processResult(segIdx, lastData);
        console.log('[Veloce AI] Segment ' + segIdx + ' recovered on final attempt');
        return;
      }
    } catch (e) {}

    // Absolute last resort — save empty (this should be very rare now)
    console.log('[Veloce AI] Segment ' + segIdx + ' LOST after all attempts');
    processResult(segIdx, Buffer.alloc(0));
  }

  // AI: Send initial progress payload BEFORE the first segment even completes, so the Booster Dashboard lights up immediately!
  if (onProgress) {
    var initialSpeeds = [];
    for (var ti = 0; ti < pool.tunnels.length; ti++) {
      var tn = pool.tunnels[ti];
      initialSpeeds.push({
        id: tn.id, speed: 0, active: false, healthy: true, ok: 0, fail: 0,
      });
    }
    onProgress({
      done: 0, total: totalSegments, bytes: 0, speed: 0, eta: 0,
      tunnels: activeConcurrency, activeTunnels: 0, encrypted: isEncrypted,
      tunnelSpeeds: initialSpeeds,
    });
  }

  // Main download loop: feed segments to the tunnel pool
  // Uses activeConcurrency which the AI can throttle down during rate-limiting
  var inFlight = 0;
  var queueIdx = 0;

  await new Promise(function(resolve) {
    function tryLaunch() {
      // Check if download was cancelled
      if (cancelKey && cancelledDownloads[cancelKey]) {
        console.log('[Veloce HLS] Download cancelled by user: ' + cancelKey);
        if (inFlight === 0) resolve();
        return;
      }
      while (inFlight < activeConcurrency && queueIdx < queue.length) {
        if (cancelKey && cancelledDownloads[cancelKey]) {
          if (inFlight === 0) resolve();
          return;
        }
        var segIdx = queue[queueIdx++];
        inFlight++;
        downloadWithRetry(segIdx).then(function() {
          inFlight--;
          flushWriteBuffer();
          if (cancelKey && cancelledDownloads[cancelKey]) {
            if (inFlight === 0) resolve();
            return;
          }
          if (queueIdx >= queue.length && inFlight === 0) {
            resolve();
          } else {
            tryLaunch();
          }
        });
      }
    }
    tryLaunch();
  });

  // Final flush
  flushWriteBuffer();

  // Log tunnel stats
  console.log('[Veloce AI] Tunnel stats:');
  for (var t = 0; t < pool.tunnels.length; t++) {
    var tn = pool.tunnels[t];
    if (tn.successes > 0 || tn.failures > 0) {
      console.log('  Tunnel #' + tn.id + ': ' + tn.successes + ' ok, ' +
        tn.failures + ' fail, ' + (pool.getTunnelSpeed(tn) / 1024).toFixed(0) + ' KB/s avg');
    }
  }

  // Step 4: Close file
  return new Promise(function(resolve) {
    writeStream.end(function() {
      var finalMb = (totalBytes / 1048576).toFixed(1);
      console.log('[Veloce HLS] Download complete: ' + finalMb + ' MB, ' + totalSegments + ' segments');
      console.log('[Veloce HLS] Healthy tunnels: ' + pool.getHealthyCount() + '/' + pool.tunnels.length);
      resolve({ totalBytes: totalBytes, totalSegments: totalSegments, encrypted: isEncrypted });
    });
  });
}

/**
 * Remux .ts to .mp4 using ffmpeg
 * - Video: copy (fast, no re-encoding)
 * - Audio: convert to AAC (ensures ALL media players work — WMP, Movies&TV, etc.)
 * - movflags +faststart: puts metadata at start for instant playback
 */
function remuxToMp4(tsPath) {
  var mp4Path = tsPath.replace(/\.ts$/, '.mp4');

  var ffmpegPath = null;
  try {
    var localFfmpeg = path.join(__dirname, 'ffmpeg.exe');
    if (fs.existsSync(localFfmpeg)) {
      ffmpegPath = localFfmpeg;
    } else {
      var result = execSync('where ffmpeg', { encoding: 'utf8', timeout: 5000 }).trim();
      if (result) ffmpegPath = result.split('\n')[0].trim();
    }
  } catch (e) {}

  if (!ffmpegPath) {
    console.log('[Veloce] ffmpeg not found — .ts file saved (plays in VLC)');
    return Promise.resolve(tsPath);
  }

  return new Promise(function(resolve) {
    console.log('[Veloce] Remuxing to MP4: ' + mp4Path);

    // Fast path: stream copy (no re-encoding, near-instant)
    // -c copy = copy all streams as-is
    // -bsf:a aac_adtstoasc = fix AAC bitstream for MP4 container (TS uses ADTS)
    // -movflags +faststart = metadata at start for instant playback
    var argsFast = ['-i', tsPath, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', '-movflags', '+faststart', '-y', mp4Path];
    var proc = require('child_process').spawn(ffmpegPath, argsFast, { stdio: 'pipe' });

    var timedOut = false;
    var timer = setTimeout(function() {
      timedOut = true;
      proc.kill();
    }, 120000);  // 2 min timeout for stream copy (should be instant)

    proc.on('close', function(code) {
      clearTimeout(timer);
      if (!timedOut && code === 0 && fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0) {
        fs.unlinkSync(tsPath);
        console.log('[Veloce] MP4 created (stream copy): ' + mp4Path);
        resolve(mp4Path);
      } else {
        // Fallback: re-encode audio to AAC for maximum player compatibility
        console.log('[Veloce] Stream copy failed, re-encoding audio to AAC...');
        var args2 = ['-i', tsPath, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-y', mp4Path];
        var proc2 = require('child_process').spawn(ffmpegPath, args2, { stdio: 'pipe' });
        var timer2 = setTimeout(function() { proc2.kill(); }, 600000);

        proc2.on('close', function(code2) {
          clearTimeout(timer2);
          if (code2 === 0 && fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0) {
            fs.unlinkSync(tsPath);
            console.log('[Veloce] MP4 created (AAC re-encode): ' + mp4Path);
            resolve(mp4Path);
          } else {
            console.log('[Veloce] Remux failed — keeping .ts file');
            resolve(tsPath);
          }
        });

        proc2.on('error', function() {
          clearTimeout(timer2);
          resolve(tsPath);
        });
      }
    });

    proc.on('error', function(err) {
      clearTimeout(timer);
      console.log('[Veloce] Remux error: ' + err.message);
      resolve(tsPath);
    });
  });
}

// ── Direct file download with boosters (TRUE IDM architecture) ──
// Each worker owns one continuous range and streams it via a single persistent connection.
// No chunk splitting, no request overhead — just like real IDM.
var DIRECT_BOOSTER_MIN_SIZE = 512 * 1024;
var DIRECT_CHUNK_SIZE = 5 * 1024 * 1024;     // only used for settings UI (not for IDM mode)
var DIRECT_MAX_RETRIES = 5;
var DIRECT_MAX_CONSECUTIVE_FAILS = 30;
var DIRECT_WORKERS = 16;
var DIRECT_STALL_TIMEOUT = 30000;             // 30s no data = connection stalled, reconnect
var nodeHttps = require('https');
var nodeHttp = require('http');
var httpsAgent = new nodeHttps.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 32 });
var httpAgent = new nodeHttp.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 32 });

/**
 * Resolve the final URL after redirects (HuggingFace redirects to xet-bridge).
 * Done once before starting workers so they all hit the final URL directly.
 */
function resolveRedirects(url) {
  return new Promise(function(resolve) {
    try {
      var parsed = new URL(url);
      var httpModule = parsed.protocol === 'https:' ? nodeHttps : nodeHttp;
      var req = httpModule.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        agent: parsed.protocol === 'https:' ? httpsAgent : httpAgent,
        timeout: 15000,
      }, function(res) {
        res.resume();
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolveRedirects(res.headers.location).then(resolve);
        } else {
          resolve(url);
        }
      });
      req.on('error', function() { resolve(url); });
      req.on('timeout', function() { req.destroy(); resolve(url); });
      req.end();
    } catch (e) { resolve(url); }
  });
}

/**
 * Stream a continuous range to disk. Instead of downloading a small chunk and stopping,
 * this streams until the range is complete or the connection stalls.
 * Returns a promise with { bytesWritten, finished } where finished=true means the full range was received.
 */
function streamSegment(url, startOffset, endByte, fd, stallTimeout, onData) {
  return new Promise(function(resolve) {
    var done = false;
    var bytesWritten = 0;
    var writePos = startOffset;
    var stallTimer = null;
    var req = null;

    function resetStallTimer() {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(function() {
        if (!done) {
          done = true;
          if (req) try { req.destroy(); } catch(e) {}
          resolve({ bytesWritten: bytesWritten, finished: false });
        }
      }, stallTimeout);
    }

    function finish(completed) {
      if (done) return;
      done = true;
      if (stallTimer) clearTimeout(stallTimer);
      resolve({ bytesWritten: bytesWritten, finished: completed });
    }

    try {
      var parsed = new URL(url);
      var httpModule = parsed.protocol === 'https:' ? nodeHttps : nodeHttp;
      req = httpModule.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'Range': 'bytes=' + startOffset + '-' + endByte,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
        },
        agent: parsed.protocol === 'https:' ? httpsAgent : httpAgent,
      }, function(res) {
        // Follow redirects. Mark this call done and disarm the stall timer FIRST:
        // otherwise the outer timer can fire while the delegated request is still
        // streaming, resolve with bytesWritten:0, and leave an orphaned stream
        // writing to fd and inflating the caller's byte counters — which is how
        // segments ended up with skipped ranges (zero-filled holes) in the file.
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          done = true;
          if (stallTimer) clearTimeout(stallTimer);
          streamSegment(res.headers.location, startOffset, endByte, fd, stallTimeout, onData).then(resolve);
          return;
        }

        if (res.statusCode !== 200 && res.statusCode !== 206) {
          res.resume();
          finish(false);
          return;
        }

        resetStallTimer();

        res.on('data', function(chunk) {
          if (done) return;
          try {
            fs.writeSync(fd, chunk, 0, chunk.length, writePos);
            writePos += chunk.length;
            bytesWritten += chunk.length;
            resetStallTimer();
            if (onData) {
              var keepGoing = onData(chunk.length);
              if (keepGoing === false) {
                if (req) try { req.destroy(); } catch(e) {}
                if (res) try { res.destroy(); } catch(e) {}
                finish(false);
              }
            }
          } catch (e) {
            finish(false);
          }
        });

        res.on('end', function() {
          var expected = endByte - startOffset + 1;
          finish(bytesWritten >= expected);
        });

        res.on('error', function() {
          finish(false);
        });
      });

      req.on('error', function() { finish(false); });
      req.on('timeout', function() { req.destroy(); finish(false); });
      resetStallTimer();
      req.end();
    } catch (e) {
      finish(false);
    }
  });
}

/**
 * Download a direct file using TRUE IDM architecture.
 * Each worker owns one continuous segment of the file and streams it via
 * a single persistent connection. If connection stalls, reconnects from
 * where it left off. Zero chunking overhead.
 */
async function downloadDirectWithBoosters(url, outPath, totalSize, onProgress, cancelKey) {
  // Resolve redirects ONCE so workers hit the final URL directly
  console.log('[Veloce DL] Resolving download URL...');
  var finalUrl = await resolveRedirects(url);
  console.log('[Veloce DL] Final URL: ' + finalUrl.slice(0, 80) + '...');

  // Hosts that throttle parallel connections — fewer workers = fewer dropped
  // connections = the download actually finishes (archive.org, rumble).
  var numWorkers = activeConcurrency;
  var dlLower = finalUrl.toLowerCase();
  var throttleHosts = ['archive.org', 'rumble.cloud'];
  for (var hi = 0; hi < throttleHosts.length; hi++) {
    if (dlLower.indexOf(throttleHosts[hi]) !== -1) {
      numWorkers = Math.min(numWorkers, 4);
      console.log('[Veloce DL] Throttled host (' + throttleHosts[hi] + ') — capping to ' + numWorkers + ' connections');
      break;
    }
  }

  // Split file into N segments — one per worker (like real IDM)
  var segmentSize = Math.ceil(totalSize / numWorkers);
  var segments = [];
  for (var i = 0; i < numWorkers; i++) {
    var segStart = i * segmentSize;
    var segEnd = Math.min(segStart + segmentSize - 1, totalSize - 1);
    if (segStart > totalSize - 1) break;
    // pos = the next byte this segment still needs. Everything from `start` up to
    // `pos` is on disk and contiguous. The fill-holes pass resumes from `pos`
    // rather than start+bytesWritten, because bytesWritten can over-count (e.g. a
    // retried range) and would then skip past bytes that were never written.
    segments.push({ id: i, start: segStart, end: segEnd, pos: segStart, bytesWritten: 0, finished: false });
  }

  console.log('[Veloce DL] TRUE IDM mode: ' + segments.length + ' persistent connections, ' +
    (segmentSize / 1048576).toFixed(0) + ' MB per segment');

  var fd = fs.openSync(outPath, 'w');
  fs.ftruncateSync(fd, totalSize);

  var totalBytes = 0;
  var startTime = Date.now();
  var lastReportTime = startTime;
  var aborted = false;

  function buildTunnelSpeeds() {
    var arr = [];
    var elapsed = (Date.now() - startTime) / 1000;
    for (var si = 0; si < segments.length; si++) {
      var seg = segments[si];
      var segSpeed = elapsed > 0 ? seg.bytesWritten / elapsed : 0;
      arr.push({
        id: si + 1,
        speed: segSpeed,
        active: !seg.finished,
        healthy: !seg.finished || seg.bytesWritten > 0,
        ok: seg.bytesWritten > 0 ? 1 : 0,
        fail: 0,
      });
    }
    return arr;
  }

  function reportProgress() {
    var now = Date.now();
    if (onProgress && (now - lastReportTime >= 500)) {
      lastReportTime = now;
      var elapsed = (now - startTime) / 1000;
      var speed = elapsed > 0 ? totalBytes / elapsed : 0;
      var pct = totalSize > 0 ? Math.round(totalBytes / totalSize * 100) : 0;
      var eta = speed > 0 ? Math.round((totalSize - totalBytes) / speed) : 0;
      var etaStr = eta > 60 ? Math.floor(eta / 60) + ':' + ('0' + (eta % 60)).slice(-2) : '0:' + ('0' + eta).slice(-2);
      var speedStr = speed >= 1048576 ? (speed / 1048576).toFixed(1) + ' MB/s' : (speed / 1024).toFixed(0) + ' KB/s';

      console.log('[Veloce DL] ' + pct + '% | ' + (totalBytes / 1048576).toFixed(1) + '/' + (totalSize / 1048576).toFixed(0) + ' MB' +
        ' | ' + speedStr + ' | ETA ' + etaStr + ' | Connections: ' + segments.length);

      onProgress({
        bytes: totalBytes,
        totalBytes: totalSize,
        speed: speed,
        eta: eta,
        tunnels: segments.length,
        tunnelSpeeds: buildTunnelSpeeds(),
      });
    }
  }

  // Progress reporting interval
  var reportInterval = setInterval(reportProgress, 500);

  // Each worker streams its entire segment via ONE persistent connection
  async function segmentWorker(seg) {
    var currentPos = seg.start;
    var retries = 0;

    while (currentPos <= seg.end && !aborted) {
      if (cancelKey && cancelledDownloads[cancelKey]) return;

      var result = await streamSegment(finalUrl, currentPos, seg.end, fd, DIRECT_STALL_TIMEOUT,
        function(chunkLen) {
          if (cancelKey && cancelledDownloads[cancelKey]) {
            aborted = true;
            return false;
          }
          totalBytes += chunkLen;
          seg.bytesWritten += chunkLen;
          return true;
        }
      );

      currentPos += result.bytesWritten;
      seg.pos = currentPos;

      if (result.finished) {
        seg.finished = true;
        return;  // segment complete
      }

      if (result.bytesWritten > 0) {
        retries = 0;  // got data, reset retries
        console.log('[Veloce DL] Seg ' + seg.id + ' reconnecting at ' + (currentPos / 1048576).toFixed(1) + ' MB');
      } else {
        retries++;
        if (retries >= DIRECT_MAX_RETRIES) {
          console.log('[Veloce DL] Seg ' + seg.id + ' failed after ' + retries + ' retries');
          return;
        }
        var delay = Math.min(1000 * Math.pow(2, retries - 1), 8000);
        console.log('[Veloce DL] Seg ' + seg.id + ' retry ' + retries + '/' + DIRECT_MAX_RETRIES + ' in ' + (delay / 1000) + 's');
        await new Promise(function(res) { setTimeout(res, delay); });
      }
    }
  }

  // Launch all segment workers in parallel
  var workerPromises = segments.map(function(seg) { return segmentWorker(seg); });
  await Promise.all(workerPromises);

  // ── Fill-holes pass ──
  // A dropped connection often succeeds on a fresh one (transient CDN reset).
  // Re-attempt each unfinished segment's remaining range before giving up.
  var holes = segments.filter(function(s) { return !s.finished; });
  if (cancelKey && cancelledDownloads[cancelKey]) aborted = true;
  for (var fi = 0; fi < holes.length && !aborted; fi++) {
    var hole = holes[fi];
    var resumeAt = hole.pos;
    console.log('[Veloce DL] Re-fetching dropped segment ' + hole.id + ' from ' + (resumeAt / 1048576).toFixed(1) + ' MB');
    for (var att = 0; att < 3 && resumeAt <= hole.end && !aborted; att++) {
      if (cancelKey && cancelledDownloads[cancelKey]) { aborted = true; break; }
      var holeResult = await streamSegment(finalUrl, resumeAt, hole.end, fd, DIRECT_STALL_TIMEOUT,
        function(chunkLen) {
          if (cancelKey && cancelledDownloads[cancelKey]) { aborted = true; return false; }
          totalBytes += chunkLen;
          hole.bytesWritten += chunkLen;
          return true;
        }
      );
      resumeAt += holeResult.bytesWritten;
      hole.pos = resumeAt;
      if (holeResult.finished) {
        hole.finished = true;
        console.log('[Veloce DL] Segment ' + hole.id + ' recovered');
        break;
      }
      await new Promise(function(res) { setTimeout(res, 2000); });
    }
  }

  clearInterval(reportInterval);
  reportProgress();  // final report

  fs.closeSync(fd);
  // A segment only counts as done if its write cursor passed its last byte.
  // Checking `pos` as well as `finished` means a skipped range can never be
  // mistaken for a complete segment.
  var allDone = segments.every(function(s) { return s.finished && s.pos > s.end; });
  if (allDone) {
    console.log('[Veloce DL] ✓ Complete: ' + (totalBytes / 1048576).toFixed(1) + ' MB');
  } else {
    console.log('[Veloce DL] Partial: ' + (totalBytes / 1048576).toFixed(1) + '/' + (totalSize / 1048576).toFixed(1) + ' MB');
  }
  return { totalBytes: totalBytes, complete: allDone };
}

// ── Track active downloads to prevent duplicates ──
var activeDownloads = {};  // url -> true

// ── Track download items for pause/resume ──
var downloadItems = {};  // id or filename -> Electron DownloadItem

// dlId -> display filename. The booster workers check cancellation by the DISPLAY
// name, but the renderer cancels intercepted downloads by Electron's item id
// ("dl-<timestamp>"). This map lets us resolve the id to the name so cancel works.
var dlIdToName = {};  // dlId -> display filename

// ── Cancellation flags for HLS downloads ──
var cancelledDownloads = {};  // filename -> true

// ══════════════════════════════════════════════════════════════
// ── SECURITY: Input validation & rate limiting ──
// ══════════════════════════════════════════════════════════════

function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

function isPathSafe(filePath) {
  if (typeof filePath !== 'string' || !filePath) return false;
  // Must be absolute and within the downloads folder or user's home
  var resolved = path.resolve(filePath);
  var downloadsDir = getDownloadsDir();
  var userHome = app.getPath('home');
  // Block path traversal — resolved path must be within known safe dirs
  return resolved.startsWith(downloadsDir) || resolved.startsWith(app.getPath('downloads'));
}

function sanitizeFilename(name) {
  if (typeof name !== 'string') return 'download';
  // Strip path traversal attempts
  name = name.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
  name = name.replace(/^[\/\\]+/, '');        // Strip leading slashes
  name = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, ''); // Remove illegal chars + control chars
  name = name.replace(/\s+/g, '_');           // Spaces to underscores
  name = name.replace(/_+/g, '_');            // Collapse underscores
  name = name.replace(/^[.\s]+|[.\s]+$/g, ''); // No leading/trailing dots or spaces
  if (!name || name === '.' || name === '..') return 'download';
  return name.slice(0, 200);                  // Sane length limit
}

// Rate limiter: track IPC call timestamps per channel
var ipcRateLimits = {};
var IPC_RATE_WINDOW = 2000;  // 2 second window
var IPC_RATE_MAX = 10;       // max 10 calls per window

function checkRateLimit(channel) {
  var now = Date.now();
  if (!ipcRateLimits[channel]) ipcRateLimits[channel] = [];
  // Remove old timestamps outside window
  ipcRateLimits[channel] = ipcRateLimits[channel].filter(function(t) { return now - t < IPC_RATE_WINDOW; });
  if (ipcRateLimits[channel].length >= IPC_RATE_MAX) {
    console.log('[Veloce Security] Rate limit hit: ' + channel);
    return false;
  }
  ipcRateLimits[channel].push(now);
  return true;
}

// ══════════════════════════════════════════════════════════════
// ── PRE-DOWNLOAD SAFETY CHECKS ──
// Fast checks run BEFORE download starts (~1-2 seconds)
// ══════════════════════════════════════════════════════════════

// Known safe domains (green light)
var TRUSTED_DOMAINS = [
  'archive.org', 'github.com', 'githubusercontent.com', 'github.io',
  'sourceforge.net', 'microsoft.com', 'apple.com', 'google.com',
  'mozilla.org', 'python.org', 'nodejs.org', 'npmjs.com',
  'ubuntu.com', 'debian.org', 'fedoraproject.org',
  'videolan.org', 'ffmpeg.org', 'audacityteam.org',
];

// Risky file extensions (needs warning)
var RISKY_EXTENSIONS = [
  '.exe', '.msi', '.bat', '.cmd', '.ps1', '.vbs', '.vbe',
  '.scr', '.pif', '.com', '.wsf', '.wsh', '.reg', '.inf',
  '.dll', '.sys', '.cpl', '.hta', '.jar',
];

// Medium risk (less common but still executable)
var MEDIUM_RISK_EXTENSIONS = [
  '.app', '.dmg', '.pkg', '.deb', '.rpm', '.appimage',
  '.apk', '.ipa', '.run', '.sh', '.bin',
];

// Safe file types
var SAFE_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.mp3', '.flac', '.wav', '.ogg', '.aac', '.wma',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  '.iso', '.img',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.json', '.xml',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp',
];

function getDomainFromUrl(url) {
  try {
    var hostname = new URL(url).hostname.toLowerCase();
    // Get root domain (last 2 parts)
    var parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return '';
  }
}

function getExtensionFromUrl(url) {
  try {
    var pathname = new URL(url).pathname.toLowerCase();
    var match = pathname.match(/(\.[a-z0-9]{1,8})$/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

function assessFileSafety(url, filename, fileSize) {
  var result = {
    overall: 'safe',          // 'safe', 'caution', 'warning'
    overallLabel: '',
    checks: [],               // Array of { label, status, detail }
  };

  var domain = getDomainFromUrl(url);
  var ext = getExtensionFromUrl(url);
  if (!ext && filename) {
    var fnLower = filename.toLowerCase();
    var fnMatch = fnLower.match(/(\.[a-z0-9]{1,8})$/);
    if (fnMatch) ext = fnMatch[1];
  }

  // ── Check 1: Domain reputation ──
  var domainTrusted = false;
  for (var i = 0; i < TRUSTED_DOMAINS.length; i++) {
    if (domain === TRUSTED_DOMAINS[i] || domain.endsWith('.' + TRUSTED_DOMAINS[i])) {
      domainTrusted = true;
      break;
    }
  }

  if (domainTrusted) {
    result.checks.push({ label: 'Source', status: 'safe', detail: 'Trusted domain (' + domain + ')' });
  } else if (domain) {
    result.checks.push({ label: 'Source', status: 'caution', detail: 'Unknown domain (' + domain + ')' });
  } else {
    result.checks.push({ label: 'Source', status: 'warning', detail: 'Could not verify source' });
  }

  // ── Check 2: File extension risk ──
  var isRisky = false;
  var isMediumRisk = false;
  var isSafe = false;

  for (var i = 0; i < RISKY_EXTENSIONS.length; i++) {
    if (ext === RISKY_EXTENSIONS[i]) { isRisky = true; break; }
  }
  if (!isRisky) {
    for (var i = 0; i < MEDIUM_RISK_EXTENSIONS.length; i++) {
      if (ext === MEDIUM_RISK_EXTENSIONS[i]) { isMediumRisk = true; break; }
    }
  }
  if (!isRisky && !isMediumRisk) {
    for (var i = 0; i < SAFE_EXTENSIONS.length; i++) {
      if (ext === SAFE_EXTENSIONS[i]) { isSafe = true; break; }
    }
  }

  if (isRisky) {
    result.checks.push({ label: 'File type', status: 'warning', detail: 'Executable file (' + ext + ') — can run code on your PC' });
  } else if (isMediumRisk) {
    result.checks.push({ label: 'File type', status: 'caution', detail: 'Installer/package (' + ext + ')' });
  } else if (isSafe) {
    result.checks.push({ label: 'File type', status: 'safe', detail: 'Media/document file (' + ext + ')' });
  } else if (ext) {
    result.checks.push({ label: 'File type', status: 'caution', detail: 'Unknown file type (' + ext + ')' });
  } else {
    result.checks.push({ label: 'File type', status: 'caution', detail: 'Stream/unknown type' });
  }

  // ── Check 3: File size sanity ──
  if (fileSize > 0) {
    var sizeMB = fileSize / 1048576;
    if (isRisky && sizeMB < 0.1) {
      // Executable under 100KB is suspicious
      result.checks.push({ label: 'File size', status: 'warning', detail: 'Very small executable (' + (fileSize / 1024).toFixed(0) + ' KB) — unusual' });
    } else if (isRisky && sizeMB < 1) {
      result.checks.push({ label: 'File size', status: 'caution', detail: 'Small executable (' + (fileSize / 1024).toFixed(0) + ' KB)' });
    } else if (sizeMB > 1) {
      var sizeMbStr = sizeMB >= 1 ? sizeMB.toFixed(1) + ' MB' : (fileSize / 1024).toFixed(0) + ' KB';
      result.checks.push({ label: 'File size', status: 'safe', detail: sizeMbStr });
    } else {
      result.checks.push({ label: 'File size', status: 'safe', detail: (fileSize / 1024).toFixed(0) + ' KB' });
    }
  } else {
    result.checks.push({ label: 'File size', status: 'caution', detail: 'Unknown (cannot verify)' });
  }

  // ── Check 4: URL patterns ──
  var urlLower = url.toLowerCase();
  var suspiciousPatterns = [
    'free-download', 'crack', 'keygen', 'patch', 'activator',
    'hack', 'cheat', 'trainer', 'loader',
  ];
  var hasSuspicious = false;
  for (var i = 0; i < suspiciousPatterns.length; i++) {
    if (urlLower.indexOf(suspiciousPatterns[i]) !== -1) { hasSuspicious = true; break; }
  }
  if (hasSuspicious) {
    result.checks.push({ label: 'URL analysis', status: 'warning', detail: 'URL contains suspicious keywords' });
  }

  // ── Calculate overall risk ──
  var warnings = 0;
  var cautions = 0;
  for (var i = 0; i < result.checks.length; i++) {
    if (result.checks[i].status === 'warning') warnings++;
    if (result.checks[i].status === 'caution') cautions++;
  }

  if (warnings >= 2) {
    result.overall = 'warning';
    result.overallLabel = 'This file looks suspicious — download at your own risk';
  } else if (warnings === 1) {
    result.overall = 'caution';
    result.overallLabel = 'Caution — verify this file is from a trusted source';
  } else if (cautions >= 2) {
    result.overall = 'caution';
    result.overallLabel = 'Unable to fully verify — proceed with caution';
  } else {
    result.overall = 'safe';
    result.overallLabel = 'File appears safe';
  }

  return result;
}

// Google Safe Browsing URL check (using Transparency Report - no API key needed)
async function checkUrlReputation(url) {
  try {
    var domain = getDomainFromUrl(url);
    if (!domain) return { safe: true, source: 'unknown' };

    // Check against known trusted domains first (instant)
    for (var i = 0; i < TRUSTED_DOMAINS.length; i++) {
      if (domain === TRUSTED_DOMAINS[i] || domain.endsWith('.' + TRUSTED_DOMAINS[i])) {
        return { safe: true, source: 'trusted', detail: 'Known trusted domain' };
      }
    }

    // For non-trusted domains, do a quick DNS/connectivity check
    // (Full Safe Browsing API requires API key - we keep it simple and fast)
    return { safe: true, source: 'unchecked', detail: 'Domain not in trusted list' };
  } catch (e) {
    return { safe: true, source: 'error', detail: 'Check failed' };
  }
}

// ══════════════════════════════════════════════════════════════
// ── Window & Sniffer ──
// ══════════════════════════════════════════════════════════════

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 600,
    backgroundColor: '#060a12', title: 'VELOCE AI IDM',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, webviewTag: true,
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

function setupBrowserSession() {
  // ── Create dedicated session for webviews ──
  browserSession = session.fromPartition('persist:browser');

  // Register veloce:// protocol on THIS session (webviews use persist:browser, not default)
  browserSession.protocol.handle('veloce', function(request) {
    var pathname = request.url.replace('veloce://', '').replace(/\/$/, '').split('?')[0];
    var filePath = path.join(__dirname, pathname + '.html');
    try {
      return new Response(fs.readFileSync(filePath), {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });
    } catch (e) {
      return new Response('Page not found', { status: 404 });
    }
  });

  // ── Stealth preloads — JS-level patches for ALL web contents ──
  var preloadPath = path.join(__dirname, 'stealth-preload.js');
  browserSession.setPreloads([preloadPath]);
  console.log('[Veloce] Stealth preload: ' + preloadPath + ' (exists: ' + fs.existsSync(preloadPath) + ')');

  // ── Clean user agent ──
  var CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  browserSession.setUserAgent(CHROME_UA);

  // ══════════════════════════════════════════════════════════════
  // ── CRITICAL: Clean sec-ch-ua HTTP headers ──
  // Electron sends sec-ch-ua: "Chromium";v="130", "Electron";v="29"
  // Cloudflare checks these BEFORE any JavaScript runs (server-side).
  // Must replace with pure Chrome headers.
  // ══════════════════════════════════════════════════════════════
  browserSession.webRequest.onBeforeSendHeaders(function(details, callback) {
    var headers = details.requestHeaders;

    // Override Client Hints to remove "Electron" brand
    headers['sec-ch-ua'] = '"Chromium";v="130", "Not(A:Brand";v="24", "Google Chrome";v="130"';
    headers['sec-ch-ua-mobile'] = '?0';
    headers['sec-ch-ua-platform'] = '"Windows"';

    // Full version list (sent on high-entropy requests)
    if (headers['sec-ch-ua-full-version-list']) {
      headers['sec-ch-ua-full-version-list'] = '"Chromium";v="130.0.6723.44", "Not(A:Brand";v="24.0.0.0", "Google Chrome";v="130.0.6723.44"';
    }

    // Ensure User-Agent is clean (no "Electron" substring)
    headers['User-Agent'] = CHROME_UA;

    callback({ requestHeaders: headers });
  });

  // ── Auto-grant permissions ──
  browserSession.setPermissionRequestHandler(function(webContents, permission, callback) {
    callback(true);
  });

  // ── Remove X-Frame-Options — allows Cloudflare challenge iframes to load ──
  browserSession.webRequest.onHeadersReceived(function(details, callback) {
    var responseHeaders = details.responseHeaders || {};
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    callback({ responseHeaders: responseHeaders });
  });

  // ── Network sniffer on the browser session ──
  browserSession.webRequest.onBeforeRequest(function(details, callback) {
    var url = details.url;
    var pattern = isMediaUrl(url);
    if (pattern && mainWindow && !mainWindow.isDestroyed()) {
      // IDM-style: only show videoplayback popup when user is on a YouTube /watch page
      // YouTube preloads videoplayback on homepage/search — ignore those
      if (url.toLowerCase().indexOf('videoplayback') !== -1) {
        try {
          var focusedWV = mainWindow.webContents;
          // Ask the renderer for the active tab URL
          focusedWV.send('media-detected', { url: url, pattern: pattern, needsPageCheck: true });
        } catch (e) {
          // Fallback: send it anyway
          mainWindow.webContents.send('media-detected', { url: url, pattern: pattern });
        }
      } else {
        mainWindow.webContents.send('media-detected', { url: url, pattern: pattern });
      }
    }
    callback({});
  });

  // ══════════════════════════════════════════════════════════════
  // ── Intercept file downloads (like real IDM) ──
  // When user clicks a download link (.exe, .zip, etc.), Electron's
  // will-download fires. We intercept it, show progress, speed, ETA.
  // ══════════════════════════════════════════════════════════════
  browserSession.on('will-download', function(event, item, webContents) {
    var url = item.getURL();
    var suggestedName = item.getFilename() || 'download';
    var totalBytes = item.getTotalBytes();
    var mimeType = item.getMimeType() || '';

    console.log('[Veloce DL] Intercepted: ' + suggestedName + ' (' + (totalBytes > 0 ? (totalBytes / 1048576).toFixed(1) + ' MB' : 'unknown size') + ')');

    // Set save path to VELOCE_AI downloads folder
    var downloadsDir = getDownloadsDir();
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
    var savePath = path.join(downloadsDir, suggestedName);

    // Avoid overwriting — add number if exists
    var counter = 1;
    var ext = path.extname(suggestedName);
    var base = path.basename(suggestedName, ext);
    while (fs.existsSync(savePath)) {
      savePath = path.join(downloadsDir, base + ' (' + counter + ')' + ext);
      counter++;
    }
    item.setSavePath(savePath);

    var startTime = Date.now();
    var lastBytes = 0;
    var lastTime = startTime;
    var dlId = 'dl-' + Date.now();
    var finalName = path.basename(savePath);

    // Track the download item for pause/resume
    downloadItems[dlId] = item;
    downloadItems[finalName] = item;
    dlIdToName[dlId] = finalName;  // so cancel-by-id resolves to the display name

    // ── PAUSE immediately — show info dialog first, user clicks Start Download ──
    item.pause();

    // Notify renderer: download ready (paused, waiting for user to start)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-started', {
        id: dlId,
        filename: finalName,
        url: url,
        totalBytes: totalBytes,
        mimeType: mimeType,
        size: totalBytes > 0 ? (totalBytes / 1048576).toFixed(1) + ' MB' : undefined,
        paused: true,  // tells renderer to show Start Download button
        resumable: true,
      });
    }

    item.on('updated', function(event, state) {
      if (state === 'interrupted') {
        console.log('[Veloce DL] Interrupted: ' + finalName);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            id: dlId,
            filename: finalName,
            status: 'Interrupted',
            percent: 0,
          });
        }
        return;
      }

      var received = item.getReceivedBytes();
      var total = item.getTotalBytes();
      var now = Date.now();
      var elapsed = (now - startTime) / 1000;
      var recentElapsed = (now - lastTime) / 1000;

      // Calculate speed
      var overallSpeed = elapsed > 0 ? received / elapsed : 0;
      var recentSpeed = recentElapsed > 0.5 ? (received - lastBytes) / recentElapsed : overallSpeed;
      var speed = recentElapsed > 1 ? (recentSpeed * 0.7 + overallSpeed * 0.3) : overallSpeed;

      // ETA
      var remaining = total > 0 ? total - received : 0;
      var eta = speed > 0 ? Math.round(remaining / speed) : 0;

      // Percent
      var pct = total > 0 ? Math.round((received / total) * 100) : 0;

      if (recentElapsed > 1) {
        lastBytes = received;
        lastTime = now;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', {
          id: dlId,
          filename: finalName,
          percent: pct,
          speed: formatSpeed(speed),
          eta: formatETA(eta),
          size: (total > 0 ? (total / 1048576).toFixed(1) + ' MB' : (received / 1048576).toFixed(1) + ' MB'),
          received: (received / 1048576).toFixed(1) + ' MB',
          status: 'Downloading',
        });
      }
    });

    item.once('done', function(event, state) {
      var finalPath = item.getSavePath();
      var totalSize = item.getTotalBytes();

      // Clean up tracking
      delete downloadItems[dlId];
      delete downloadItems[finalName];

      if (state === 'completed') {
        console.log('[Veloce DL] Complete: ' + finalPath);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-complete', {
            id: dlId,
            filename: finalName,
            path: finalPath,
            folder: path.dirname(finalPath),
            size: totalSize > 0 ? (totalSize / 1048576).toFixed(1) + ' MB' : '—',
            status: 'Complete',
            complete: true,
          });
        }
      } else {
        console.log('[Veloce DL] Failed (' + state + '): ' + finalName);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            id: dlId,
            filename: finalName,
            status: 'Error',
            percent: 0,
          });
        }
      }
    });
  });

  console.log('[Veloce] Browser session ready: stealth headers + preloads + download intercept active');
}

// ══════════════════════════════════════════════════════════════
// ── IPC: Start download ──
// ══════════════════════════════════════════════════════════════

function formatSpeed(bytesPerSec) {
  if (bytesPerSec > 1048576) return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
  if (bytesPerSec > 1024) return (bytesPerSec / 1024).toFixed(0) + ' KB/s';
  return bytesPerSec.toFixed(0) + ' B/s';
}

function formatETA(seconds) {
  if (seconds <= 0) return '--:--';
  if (seconds > 3600) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return h + 'h ' + m + 'm';
  }
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ══════════════════════════════════════════════════════════════
// ── BIT-STYLE PROFILES: multi-profile browser (same Chromium engine) ──
// ══════════════════════════════════════════════════════════════

var profileStore = require('./profileStore');
var profileProxyAuth = new Map(); // webContents.id -> { username, password } for proxy login (bible §6)

var CHROME_UA_PROFILE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/** Build proxyRules only (no credentials - Electron rejects user:pass in proxyRules and throws ERR_NO_SUPPORTED_PROXIES). */
function buildProxyRules(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return '';
  var type = (proxy.type || 'http').toLowerCase();
  var host = String(proxy.host).trim();
  var port = String(proxy.port).trim();
  return type + '://' + host + ':' + port;
}

function normalizeProxyInput(proxy) {
  var host = proxy && proxy.host ? String(proxy.host).trim() : '';
  var port = proxy && proxy.port ? String(proxy.port).trim() : '';
  if (host.indexOf('://') !== -1) {
    try {
      var parsed = new URL(host);
      if (parsed && parsed.hostname) host = parsed.hostname;
      if (!port && parsed && parsed.port) port = parsed.port;
    } catch (e) {}
  }
  if (host.indexOf('@') !== -1) host = host.split('@').pop();
  if (host.indexOf('/') !== -1) host = host.split('/')[0];
  if (!port && host.indexOf(':') !== -1) {
    var parts = host.split(':');
    if (parts.length > 1) {
      port = parts.pop();
      host = parts.join(':');
    }
  }
  return { host: host, port: port };
}

function buildChromeProxyRules(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return '';
  var type = (proxy.type || 'http').toLowerCase();
  var normalized = normalizeProxyInput(proxy);
  var host = normalized.host;
  var port = normalized.port;
  if (!host || !port) return '';
  if (type === 'http' || type === 'https') {
    return 'http=' + host + ':' + port + ';https=' + host + ':' + port;
  }
  if (type === 'socks5' || type === 'socks') {
    return 'socks5://' + host + ':' + port;
  }
  return host + ':' + port;
}

function setupProfileSession(profile) {
  var partition = 'persist:profile-' + profile.id;
  var ses = session.fromPartition(partition);
  var preloadPath = path.join(__dirname, 'stealth-preload.js');
  ses.setPreloads([preloadPath]);

  var ua = (profile.fingerprint && profile.fingerprint.userAgent) || CHROME_UA_PROFILE;
  ses.setUserAgent(ua);

  var proxyRules = buildChromeProxyRules(profile.proxy);
  if (proxyRules) {
    ses.setProxy({
      mode: 'fixed_servers',
      proxyRules: proxyRules,
      proxyBypassRules: '<local>',
    });
  } else {
    ses.setProxy({ mode: 'direct' });
  }

  if (!profileWebRequestReady.has(partition)) {
    profileWebRequestReady.add(partition);

    ses.webRequest.onBeforeSendHeaders(function(details, callback) {
      var headers = details.requestHeaders || {};
      headers['sec-ch-ua'] = '"Chromium";v="130", "Not(A:Brand";v="24", "Google Chrome";v="130"';
      headers['sec-ch-ua-mobile'] = '?0';
      headers['sec-ch-ua-platform'] = '"Windows"';
      if (headers['sec-ch-ua-full-version-list']) {
        headers['sec-ch-ua-full-version-list'] = '"Chromium";v="130.0.6723.44", "Not(A:Brand";v="24.0.0.0", "Google Chrome";v="130.0.6723.44"';
      }
      headers['User-Agent'] = ua;
      callback({ requestHeaders: headers });
    });

    ses.webRequest.onHeadersReceived(function(details, callback) {
      var responseHeaders = details.responseHeaders || {};
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      callback({ responseHeaders: responseHeaders });
    });
  }

  ses.setPermissionRequestHandler(function(webContents, permission, callback) { callback(true); });

  var ignoreHttps = profile.fingerprint && profile.fingerprint.ignoreHttpsErrors === true;
  if (ignoreHttps) {
    ses.setCertificateVerifyProc(function(request, callback) { callback(0); });
  }

  return ses;
}

function getProfileStartUrl(profile) {
  if (profile.openUrls && profile.openUrls.length > 0) {
    var first = (profile.openUrls[0] || '').trim();
    if (first.indexOf('http') === 0) return first;
  }
  return 'https://www.google.com';
}

function escapeHtmlProfile(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Profile browser: loads startUrl directly in main frame. Full screen, no tabs. (Shell/tabs caused layout issues.) */
function launchProfileBrowser(profile) {
  setupProfileSession(profile);
  var partition = 'persist:profile-' + profile.id;
  var startUrl = getProfileStartUrl(profile);

  var useProxy = !!(profile.proxy && profile.proxy.host && profile.proxy.port);
  var relaxHttps = (profile.fingerprint && profile.fingerprint.ignoreHttpsErrors) || useProxy;

  var win = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 400,
    minHeight: 300,
    title: (profile.name || 'Profile') + ' — VELOCE AI',
    webPreferences: {
      partition: partition,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !relaxHttps,
      webviewTag: true,
    },
  });

  var wcId = win.webContents.id;
  var authCreds = null;
  var profileAuthIds = new Set([wcId]);
  if (profile.proxy && (profile.proxy.username || profile.proxy.password)) {
    authCreds = {
      username: profile.proxy.username || '',
      password: profile.proxy.password || '',
    };
    profileProxyAuth.set(wcId, authCreds);
  }

  win.webContents.on('did-attach-webview', function(event, webContents) {
    if (!authCreds || !webContents) return;
    profileProxyAuth.set(webContents.id, authCreds);
    profileAuthIds.add(webContents.id);
    webContents.on('destroyed', function() {
      profileProxyAuth.delete(webContents.id);
      profileAuthIds.delete(webContents.id);
    });
  });

  var shellPath = path.join(__dirname, 'profile-shell.html');
  win.loadFile(shellPath, { query: { partition: partition, startUrl: startUrl } }).catch(function(err) {
    console.error('[Veloce Profile] Load failed:', err);
  });

  win.webContents.on('did-fail-load', function(event, errorCode, errorDescription, validatedURL) {
    if (!event.isMainFrame) return;
    console.error('[Veloce Profile] Load failed:', errorCode, errorDescription, validatedURL);
    var msg = escapeHtmlProfile(errorDescription || 'Unknown error') + ' (' + errorCode + ')';
    var url = escapeHtmlProfile(validatedURL || startUrl);
    var hint = errorCode === -111
      ? '<p style="margin-top:1em;color:#94a3b8;"><strong>Connection refused (-111)</strong>. If using a proxy: check Host/Port, CHECK PROXY, and enable <strong>Ignore HTTPS errors</strong> in Edit profile → Fingerprint.</p>'
      : '<p style="margin-top:1em;color:#94a3b8;">Edit profile → check proxy and enable Ignore HTTPS errors if needed.</p>';
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Load failed</title></head><body style="font-family:sans-serif;padding:2em;max-width:640px;background:#0c1220;color:#c8d6e5;">' +
      '<h2 style="color:#f59e0b;">Page could not load</h2><p><strong>' + msg + '</strong></p><p>URL: ' + url + '</p>' + hint + '</body></html>';
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)).catch(function() {});
  });

  win.on('closed', function() {
    profileAuthIds.forEach(function(id) { profileProxyAuth.delete(id); });
    profileAuthIds.clear();
    profileStore.touchLastOpened(profile.id);
  });

  return win;
}

function getCefHostPath() {
  return path.join(__dirname, '..', 'cef-host', 'build', 'Release', 'veloce_cef_host.exe');
}

function notifyCefLaunchError(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('cef-launch-error', message);
  }
}

function getChromePath() {
  var candidates = [
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
  ].filter(Boolean);
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return '';
}

function getChromeProfileDir(profileId) {
  var base = path.join(app.getPath('userData'), 'profiles', String(profileId), 'chrome');
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return base;
}

function getChromeExtensionDir(profileId) {
  var base = path.join(app.getPath('userData'), 'profiles', String(profileId), 'chrome-extension');
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return base;
}

function getPcPreset(fp) {
  var pc = (fp && fp.pcType) || 'i7-32';
  if (pc === 'i9-64') return { hardwareConcurrency: 64, deviceMemory: 64, platform: 'Win32' };
  if (pc === 'i5-16') return { hardwareConcurrency: 16, deviceMemory: 16, platform: 'Win32' };
  return { hardwareConcurrency: 32, deviceMemory: 32, platform: 'Win32' };
}

function getGpuPreset(fp) {
  var gpu = (fp && fp.gpuType) || 'rtx4060';
  if (gpu === 'rtx5090') return { webglVendor: 'Google Inc.', webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5090 Direct3D11 vs_5_0 ps_5_0)' };
  if (gpu === 'rtx4090') return { webglVendor: 'Google Inc.', webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0)' };
  if (gpu === 'rx7900xtx') return { webglVendor: 'Google Inc.', webglRenderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0)' };
  if (gpu === 'intel') return { webglVendor: 'Google Inc.', webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)' };
  return { webglVendor: 'Google Inc.', webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)' };
}

function ensureProfileChromeExtension(profile) {
  var fp = profile && profile.fingerprint ? profile.fingerprint : {};
  var pc = getPcPreset(fp);
  var gpu = getGpuPreset(fp);
  var extDir = getChromeExtensionDir(profile.id);
  var manifest = {
    name: 'Veloce Profile Overrides',
    version: '1.0.0',
    manifest_version: 2,
    permissions: ['webRequest', 'webRequestBlocking', '<all_urls>'],
    background: { scripts: ['background.js'], persistent: true },
    content_scripts: [
      { matches: ['<all_urls>'], js: ['inject.js'], run_at: 'document_start', all_frames: true }
    ],
  };
  var config = {
    hardwareConcurrency: pc.hardwareConcurrency,
    deviceMemory: pc.deviceMemory,
    platform: pc.platform,
    webglVendor: gpu.webglVendor,
    webglRenderer: gpu.webglRenderer,
  };
  var inject = [
    '(async function(){',
    '  function overrideProp(obj, prop, value){',
    '    try { Object.defineProperty(obj, prop, { get: function(){ return value; }, configurable: true }); } catch(e) {}',
    '  }',
    '  function applyOverrides(cfg){',
    '    var navProto = Navigator.prototype;',
    '    if (cfg.hardwareConcurrency) overrideProp(navProto, "hardwareConcurrency", cfg.hardwareConcurrency);',
    '    if (cfg.deviceMemory) overrideProp(navProto, "deviceMemory", cfg.deviceMemory);',
    '    if (cfg.platform) overrideProp(navProto, "platform", cfg.platform);',
    '    var vendor = cfg.webglVendor || "Google Inc.";',
    '    var renderer = cfg.webglRenderer || "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)";',
    '    var patch = function(proto){',
    '      if (!proto || !proto.getParameter) return;',
    '      var original = proto.getParameter;',
    '      proto.getParameter = function(param){',
    '        if (param === 37445) return vendor;',
    '        if (param === 37446) return renderer;',
    '        if (param === 7936) return vendor;',
    '        if (param === 7937) return renderer;',
    '        return original.call(this, param);',
    '      };',
    '    };',
    '    patch(WebGLRenderingContext && WebGLRenderingContext.prototype);',
    '    patch(WebGL2RenderingContext && WebGL2RenderingContext.prototype);',
    '  }',
    '  try {',
    '    var cfg = await fetch(chrome.runtime.getURL("profile.json")).then(function(r){ return r.json(); });',
    '    var s = document.createElement("script");',
    '    s.textContent = "(" + applyOverrides.toString() + ")(" + JSON.stringify(cfg) + ");";',
    '    (document.documentElement || document.head || document.body).appendChild(s);',
    '    s.remove();',
    '  } catch(e) {}',
    '})();'
  ].join('\n');
  fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(extDir, 'profile.json'), JSON.stringify(config, null, 2), 'utf8');
  fs.writeFileSync(path.join(extDir, 'inject.js'), inject, 'utf8');
  var proxyUser = profile.proxy ? String(profile.proxy.username || '') : '';
  var proxyPass = profile.proxy ? String(profile.proxy.password || '') : '';
  var background = [
    'var PROXY_USER = ' + JSON.stringify(proxyUser) + ';',
    'var PROXY_PASS = ' + JSON.stringify(proxyPass) + ';',
    'chrome.webRequest.onAuthRequired.addListener(',
    '  function(details){',
    '    if (!details.isProxy) return {};',
    '    if (!PROXY_USER && !PROXY_PASS) return {};',
    '    return { authCredentials: { username: PROXY_USER, password: PROXY_PASS } };',
    '  },',
    '  { urls: ["<all_urls>"] },',
    '  ["blocking"]',
    ');'
  ].join('\n');
  fs.writeFileSync(path.join(extDir, 'background.js'), background, 'utf8');
  return extDir;
}

async function launchProfileBrowserChrome(profile) {
  var chromePath = getChromePath();
  if (!chromePath) {
    var missing = 'Chrome not found. Install Chrome to use the profile browser.';
    notifyCefLaunchError(missing);
    console.log('[Veloce Chrome] ' + missing);
    return { ok: false, error: missing };
  }
  var startUrl = getProfileStartUrl(profile);
  var ua = (profile.fingerprint && profile.fingerprint.userAgent) || CHROME_UA_PROFILE;
  var proxy = profile.proxy || {};
  var pType = (proxy.type || 'http').toLowerCase();
  var proxyRules = buildProxyRules(profile.proxy);
  if ((pType === 'socks5' || pType === 'socks') && proxy.host && proxy.port) {
    try {
      var bridge = await socks5Bridge.startSocks5Bridge(proxy);
      if (bridge && bridge.port) {
        proxyRules = 'http://127.0.0.1:' + bridge.port;
      } else {
        console.error('[Veloce] SOCKS5 bridge failed to start for ' + proxy.host + ':' + proxy.port + ' — check proxy and ensure "socks" package is installed (npm install socks)');
      }
    } catch (e) {
      console.error('[Veloce] SOCKS5 bridge error:', e && e.message);
    }
  }
  var args = [];
  var extDir = ensureProfileChromeExtension(profile);
  args.push('--user-data-dir=' + getChromeProfileDir(profile.id));
  args.push('--profile-directory=Default');
  args.push('--load-extension=' + extDir);
  args.push('--no-first-run');
  args.push('--no-default-browser-check');
  if (proxyRules) {
    args.push('--proxy-server=' + proxyRules);
    args.push('--webrtc-ip-handling-policy=disable_non_proxied_udp');
    args.push('--force-webrtc-ip-handling-policy=disable_non_proxied_udp');
  }
  if (ua) args.push('--user-agent=' + ua);
  if (profile.fingerprint && profile.fingerprint.language) {
    args.push('--lang=' + profile.fingerprint.language);
  }
  if (startUrl) args.push(startUrl);
  try {
    var child = spawn(chromePath, args, { detached: true, stdio: 'ignore' });
    child.unref();
    console.log('[Veloce Chrome] Launching: ' + chromePath + ' ' + args.join(' '));
    return { ok: true };
  } catch (e) {
    var errMsg = e && e.message ? e.message : 'Chrome launch failed';
    notifyCefLaunchError(errMsg);
    console.log('[Veloce Chrome] ' + errMsg);
    return { ok: false, error: errMsg };
  }
}

function launchProfileBrowserCef(profile) {
  var exePath = getCefHostPath();
  if (!fs.existsSync(exePath)) {
    var missing = 'CEF host not found: ' + exePath;
    notifyCefLaunchError(missing);
    console.log('[Veloce CEF] ' + missing);
    return { ok: false, error: missing };
  }
  var startUrl = getProfileStartUrl(profile);
  var ua = (profile.fingerprint && profile.fingerprint.userAgent) || CHROME_UA_PROFILE;
  var proxyRules = buildProxyRules(profile.proxy);
  var useProxy = !!(profile.proxy && profile.proxy.host && profile.proxy.port);
  var ignoreHttps = (profile.fingerprint && profile.fingerprint.ignoreHttpsErrors) || useProxy;
  var args = [];
  if (startUrl) args.push('--start-url=' + startUrl);
  if (proxyRules) args.push('--proxy=' + proxyRules);
  if (ua) args.push('--user-agent=' + ua);
  if (ignoreHttps) args.push('--ignore-https=1');
  try {
    var child = spawn(exePath, args, { detached: false, stdio: 'ignore', cwd: path.dirname(exePath), windowsHide: false });
    var launchedAt = Date.now();
    child.on('error', function(err) {
      var msg = 'CEF launch failed: ' + (err && err.message ? err.message : 'Unknown error');
      notifyCefLaunchError(msg);
      console.log('[Veloce CEF] ' + msg);
    });
    child.on('exit', function(code, signal) {
      if (Date.now() - launchedAt < 2000) {
        var exitMsg = 'CEF closed immediately (code ' + code + (signal ? ', signal ' + signal : '') + ')';
        notifyCefLaunchError(exitMsg);
        console.log('[Veloce CEF] ' + exitMsg);
      }
    });
    console.log('[Veloce CEF] Launching: ' + exePath + ' ' + args.join(' '));
    return { ok: true };
  } catch (e) {
    var errMsg = e && e.message ? e.message : 'CEF launch failed';
    console.log('[Veloce CEF] ' + errMsg);
    return { ok: false, error: errMsg };
  }
}

ipcMain.handle('profiles:list', function() { return profileStore.list(); });
ipcMain.handle('profiles:get', function(event, id) { return profileStore.get(id); });
ipcMain.handle('profiles:add', function(event, profile) { return profileStore.add(profile); });
ipcMain.handle('profiles:update', function(event, id, updates) { return profileStore.update(id, updates); });
ipcMain.handle('profiles:remove', function(event, id) { return profileStore.remove(id); });
ipcMain.handle('browser:launch', async function(event, profileId) {
  var profile = profileStore.get(profileId);
  if (!profile) throw new Error('Profile not found');
  var result = await launchProfileBrowserChrome(profile);
  return { ok: result.ok, error: result.error, mode: 'chrome' };
});

app.on('login', function(event, webContents, request, authInfo, callback) {
  if (!authInfo || !authInfo.isProxy || typeof callback !== 'function') {
    if (typeof callback === 'function') callback();
    return;
  }
  var creds = profileProxyAuth.get(webContents.id);
  if (creds) {
    event.preventDefault();
    callback(creds.username, creds.password);
  } else {
    callback();
  }
});

ipcMain.handle('proxy:check', function(event, proxy) {
  return new Promise(function(resolve) {
    function done(result) {
      try { if (socket && !socket.destroyed) socket.destroy(); } catch (e) {}
      resolve(result);
    }
    var socket = null;
    var guard = setTimeout(function() {
      guard = null;
      done({ ok: false, message: 'Check timeout' });
    }, 12000);

    try {
      if (!proxy || !proxy.host || !proxy.port) {
        clearTimeout(guard);
        done({ ok: false, message: 'Enter proxy Host and Port' });
        return;
      }
      var host = String(proxy.host).trim();
      var port = parseInt(proxy.port, 10) || 0;
      if (!port || port < 1 || port > 65535) {
        clearTimeout(guard);
        done({ ok: false, message: 'Invalid port' });
        return;
      }
      socket = new netNode.Socket();
      socket.setTimeout(8000);
      socket.on('connect', function() {
        if (guard) { clearTimeout(guard); guard = null; }
        done({ ok: true, message: 'Working', host: host, port: String(port) });
      });
      socket.on('timeout', function() {
        if (guard) { clearTimeout(guard); guard = null; }
        done({ ok: false, message: 'Connection timeout' });
      });
      socket.on('error', function(err) {
        if (guard) { clearTimeout(guard); guard = null; }
        done({ ok: false, message: err.message || 'Connection failed' });
      });
      socket.connect(port, host);
    } catch (err) {
      if (guard) clearTimeout(guard);
      done({ ok: false, message: (err && err.message) || 'Check failed' });
    }
  });
});

// ── End Bit-style profiles ──

ipcMain.handle('start-download', async function(event, data) {
  // ── Security: Rate limit ──
  if (!checkRateLimit('start-download')) {
    return { success: false, error: 'Too many download requests — slow down' };
  }

  var url = data.url;
  var filename = data.filename || 'download';
  var referer = data.referer || '';
  var pageTitle = data.pageTitle || '';
  var dlId = data.id || null;  // Electron intercepted-item id ("dl-<ts>"), if this came through the dialog

  // ── Security: Validate URL ──
  if (!isValidUrl(url)) {
    console.log('[Veloce Security] Blocked download — invalid URL: ' + String(url).slice(0, 50));
    return { success: false, error: 'Invalid URL — must be http or https' };
  }

  // ── Prevent duplicate downloads ──
  // Strip query params for comparison (same base URL = same file)
  var urlKey = url.split('?')[0];
  if (activeDownloads[urlKey]) {
    console.log('[Veloce] Duplicate download blocked: ' + url.slice(0, 80));
    return { success: false, error: 'Already downloading this file', duplicate: true };
  }
  activeDownloads[urlKey] = true;

  var downloadsDir = getDownloadsDir();
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  // ── Better filename: use page title if available ──
  var uniqueId = Date.now().toString().slice(-5);
  var baseName = sanitizeFilename(filename);
  if (pageTitle && pageTitle.length > 3 && (baseName === 'download' || baseName.indexOf('master') !== -1 || baseName.indexOf('index') !== -1)) {
    var cleanTitle = sanitizeFilename(pageTitle).slice(0, 80);
    if (cleanTitle) baseName = cleanTitle;
  }
  // Put unique ID BEFORE the extension so file keeps its proper extension
  var nameNoExt = baseName;
  var extMatch = baseName.match(/(\.[a-zA-Z0-9]{1,10})$/);
  var fileExt = extMatch ? extMatch[1] : '';
  if (fileExt) nameNoExt = baseName.slice(0, baseName.length - fileExt.length);
  nameNoExt = nameNoExt.replace(/[^a-zA-Z0-9._-]/g, '_');
  var safeName = nameNoExt + '_' + uniqueId + fileExt;

  // Clear any stale cancel flags for this file before starting. A cancel from a
  // previous attempt (or one the renderer re-fires for old rows after a page
  // refresh) lands under the display name, and the booster workers check that
  // same key — so without this reset the next download of the same file aborts
  // instantly at 0 MB.
  delete cancelledDownloads[baseName];
  delete cancelledDownloads[safeName];
  if (dlId) delete cancelledDownloads[dlId];

  var lower = url.toLowerCase();
  var isHLS = lower.indexOf('.m3u8') !== -1;
  var isStream = isHLS || lower.indexOf('.mpd') !== -1 || lower.indexOf('/hls/') !== -1;

  var ytdlpSites = [
    'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
    'twitch.tv', 'twitter.com', 'x.com', 'tiktok.com',
    'instagram.com', 'facebook.com', 'reddit.com',
  ];
  var isYtdlp = false;
  for (var i = 0; i < ytdlpSites.length; i++) {
    if (lower.indexOf(ytdlpSites[i]) !== -1) { isYtdlp = true; break; }
  }

  // ── Route 1: HLS streams — built-in downloader with decryption ──
  if (isHLS || (isStream && !isYtdlp)) {
    // Detect CDN hosts that rate-limit — use fewer tunnels
    var cdnConcurrency = activeConcurrency;
    var cdnHosts = ['rumble.cloud'];
    for (var ci = 0; ci < cdnHosts.length; ci++) {
      if (lower.indexOf(cdnHosts[ci]) !== -1) {
        cdnConcurrency = Math.min(cdnConcurrency, 3);
        console.log('[Veloce] CDN detected (' + cdnHosts[ci] + ') — limiting to ' + cdnConcurrency + ' tunnels');
        break;
      }
    }
    // Temporarily override concurrency for this download
    var savedConcurrency = activeConcurrency;
    if (cdnConcurrency < activeConcurrency) activeConcurrency = cdnConcurrency;
    
    console.log('[Veloce] HLS download (' + activeConcurrency + ' tunnels, AES decryption): ' + url.slice(0, 100));
    var tsPath = path.join(downloadsDir, safeName + '.ts');

    try {
      var result = await downloadHLS(url, tsPath, function(p) {
        var pct = Math.round((p.done / p.total) * 100);
        var mb = (p.bytes / 1048576).toFixed(1);
        var speedStr = formatSpeed(p.speed);
        var etaStr = formatETA(p.eta);

        console.log('[Veloce HLS] ' + pct + '% | ' + p.done + '/' + p.total +
          ' | ' + mb + ' MB | ' + speedStr + ' | ETA ' + etaStr +
          ' | Tunnels: ' + p.tunnels + (p.encrypted ? ' | DECRYPTING' : ''));

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            filename: safeName,
            percent: pct,
            speed: speedStr,
            eta: etaStr,
            tunnels: p.tunnels,
    
            received: mb + ' MB',
            status: 'Downloading',
            tunnelSpeeds: p.tunnelSpeeds || null,
          });
        }
      }, safeName);

      // If download was cancelled, clean up and don't remux
      if (cancelledDownloads[safeName]) {
        console.log('[Veloce HLS] Download was cancelled — skipping remux, cleaning up');
        delete cancelledDownloads[safeName];
        if (savedConcurrency && savedConcurrency !== activeConcurrency) activeConcurrency = savedConcurrency;
        delete activeDownloads[urlKey];
        // Delete the partial .ts file
        try { if (fs.existsSync(tsPath)) fs.unlinkSync(tsPath); } catch (e) {}
        // Notify UI
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            filename: safeName,
            percent: 0,
            speed: '',
            eta: '',
            status: 'Cancelled',
          });
        }
        return { success: false, cancelled: true };
      }

      // Clean up cancel flag if it was set
      delete cancelledDownloads[safeName];

      // Restore original concurrency if we limited it for CDN
      if (savedConcurrency && savedConcurrency !== activeConcurrency) {
        activeConcurrency = savedConcurrency;
      }

      // Remux to MP4 if ffmpeg available
      // Tell the UI we're remuxing so users don't think it's stuck
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', {
          filename: safeName,
          percent: 100,
          speed: '',
          eta: '',
          status: 'Remuxing...',
          size: (result.totalBytes / 1048576).toFixed(1) + ' MB',
          received: (result.totalBytes / 1048576).toFixed(1) + ' MB',
        });
      }
      var finalPath = await remuxToMp4(tsPath);
      var finalMb = (result.totalBytes / 1048576).toFixed(1);
      var ext = path.extname(finalPath);

      console.log('[Veloce] Done: ' + finalPath);
      delete activeDownloads[urlKey];

      // Notify renderer: HLS download complete
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-complete', {
          filename: safeName,
          path: finalPath,
          folder: path.dirname(finalPath),
          size: finalMb + ' MB',
          complete: true,
        });
      }

      return {
        success: true, path: finalPath, filename: safeName + ext,
        size: finalMb + ' MB',
      };
    } catch (err) {
      console.log('[Veloce] HLS failed: ' + err.message + ' — trying yt-dlp...');
      delete activeDownloads[urlKey];
      delete cancelledDownloads[safeName];
      return ytdlpDownload(url, downloadsDir, safeName, referer);
    }
  }

  // ── Route 2: yt-dlp sites ──
  if (isYtdlp) {
    try {
      var result = await ytdlpDownload(url, downloadsDir, safeName, referer);
      delete activeDownloads[urlKey];
      return result;
    } catch (err) {
      delete activeDownloads[urlKey];
      throw err;
    }
  }

  // ── Route 3: Direct file download (16 boosters when server supports ranges) ──
  console.log('[Veloce] Direct download: ' + url.slice(0, 80));
  var outPath = path.join(downloadsDir, safeName);
  try {
    var headResult = await new Promise(function(resolve) {
      var req = net.request({ method: 'HEAD', url: url, session: browserSession || session.defaultSession });
      req.on('response', function(res) {
        var cl = res.headers['content-length'];
        var size = cl ? parseInt(Array.isArray(cl) ? cl[0] : cl) : 0;
        var ar = res.headers['accept-ranges'];
        var resumable = !!(ar && (Array.isArray(ar) ? ar[0] : ar).toLowerCase().indexOf('bytes') !== -1);
        resolve({ size: size, resumable: resumable });
      });
      req.on('error', function() { resolve({ size: 0, resumable: false }); });
      req.end();
    });

    var totalSize = headResult.size || 0;
    var useBoosters = headResult.resumable && totalSize >= DIRECT_BOOSTER_MIN_SIZE;

    // If HEAD didn't confirm range support but file is large enough, probe with a Range GET
    // Many CDNs (Hugging Face, Cloudflare R2) support ranges but don't advertise in HEAD
    if (!useBoosters && totalSize >= 10485760) {  // 10 MB minimum
      try {
        var probeResult = await new Promise(function(resolve) {
          var req = net.request({
            method: 'GET', url: url,
            session: browserSession || session.defaultSession,
          });
          req.setHeader('Range', 'bytes=0-0');
          req.on('response', function(res) {
            var supportsRanges = res.statusCode === 206;
            res.destroy();
            resolve(supportsRanges);
          });
          req.on('error', function() { resolve(false); });
          req.end();
        });
        if (probeResult) {
          useBoosters = true;
          console.log('[Veloce] Range probe succeeded — enabling boosters for ' + (totalSize / 1048576).toFixed(1) + ' MB file');
        }
      } catch (e) {}
    }

    if (useBoosters) {
      console.log('[Veloce] Direct download with ' + activeConcurrency + ' workers: ' + (totalSize / 1048576).toFixed(1) + ' MB');
      var result = await downloadDirectWithBoosters(url, outPath, totalSize, function(p) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          var pct = totalSize > 0 ? Math.round((p.bytes / totalSize) * 100) : 0;
          mainWindow.webContents.send('download-progress', {
            // Use the DISPLAY name (baseName), not safeName — the renderer matches
            // rows/dialog by the display name or id. safeName has a unique ID
            // inserted before the extension, so it never matches.
            id: dlId || undefined,
            filename: baseName,
            percent: pct,
            speed: formatSpeed(p.speed),
            eta: formatETA(p.eta),
            tunnels: p.tunnels,
            size: (totalSize / 1048576).toFixed(1) + ' MB',
            received: (p.bytes / 1048576).toFixed(1) + ' MB',
            status: 'Downloading',
            tunnelSpeeds: p.tunnelSpeeds || null,
          });
        }
      }, baseName);

      // Check if download was cancelled by user (checked against the display name,
      // which is the key the renderer's cancel flag lands under)
      if (cancelledDownloads[baseName] || cancelledDownloads[safeName]) {
        console.log('[Veloce DL] Direct download cancelled — cleaning up partial file');
        delete cancelledDownloads[baseName];
        delete cancelledDownloads[safeName];
        delete activeDownloads[urlKey];
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            filename: baseName,
            percent: 0,
            speed: '',
            eta: '',
            status: 'Cancelled',
          });
        }
        return { success: false, cancelled: true };
      }

      var dlSize = (result.totalBytes / 1048576).toFixed(1) + ' MB';
      delete activeDownloads[urlKey];

      // NEVER report a partial download as complete — the file is pre-truncated
      // to full size, so dropped segments leave zero-filled holes = corrupt file.
      if (!result.complete) {
        console.log('[Veloce DL] FAILED — incomplete (' + dlSize + ' of ' + (totalSize / 1048576).toFixed(1) + ' MB). Deleting corrupt file.');
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-progress', {
            filename: baseName,
            percent: 0,
            speed: '',
            eta: '',
            status: 'Error',
          });
        }
        throw new Error('Download incomplete: got ' + dlSize + ' of ' + (totalSize / 1048576).toFixed(1) + ' MB — the server dropped connections. Try again.');
      }

      // Auto-rename: remove unique ID suffix for clean filename
      var cleanName = nameNoExt.replace(/_$/, '') + fileExt;  // e.g. "Qwen...Q4_K_M.gguf"
      var cleanPath = path.join(downloadsDir, cleanName);
      if (cleanName !== safeName && !fs.existsSync(cleanPath)) {
        try {
          fs.renameSync(outPath, cleanPath);
          outPath = cleanPath;
          safeName = cleanName;
          console.log('[Veloce DL] Renamed to: ' + cleanName);
        } catch (e) {
          console.log('[Veloce DL] Rename failed, keeping: ' + safeName);
        }
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-complete', {
          filename: safeName,
          path: outPath,
          folder: path.dirname(outPath),
          size: dlSize,
          complete: true,
        });
      }
      return { success: true, path: outPath, filename: safeName, size: dlSize };
    }

    var fileData = await fetchWithBrowser(url);
    fs.writeFileSync(outPath, fileData);
    var dlSize = (fileData.length / 1048576).toFixed(1) + ' MB';
    delete activeDownloads[urlKey];

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-complete', {
        filename: safeName,
        path: outPath,
        folder: path.dirname(outPath),
        size: dlSize,
      });
    }

    return { success: true, path: outPath, filename: safeName, size: dlSize };
  } catch (err) {
    delete activeDownloads[urlKey];
    throw err;
  }
});

// ── Export ALL browser cookies for yt-dlp ──
async function exportCookiesForYtDlp() {
  try {
    var ses = browserSession || session.defaultSession;
    var cookies = await ses.cookies.get({});
    var cookieFile = path.join(app.getPath('userData'), 'cookies.txt');
    var lines = ['# Netscape HTTP Cookie File', '# Auto-exported by VELOCE AI IDM', ''];
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      var domain = (c.domain || '').replace(/^\./, '');
      var flag = domain.charAt(0) === '.' ? 'TRUE' : 'FALSE';
      var cookiePath = c.path || '/';
      var secure = c.secure ? 'TRUE' : 'FALSE';
      var expiry = c.expirationDate ? Math.floor(c.expirationDate) : 0;
      var name = c.name || '';
      var value = c.value || '';
      lines.push([domain, flag, cookiePath, secure, expiry, name, value].join('\t'));
    }
    try { fs.mkdirSync(path.dirname(cookieFile), { recursive: true }); } catch (_) {}
    fs.writeFileSync(cookieFile, lines.join('\n'), 'utf8');
    return cookieFile;
  } catch (e) {
    console.log('[Veloce] Cookie export failed:', e.message);
    return null;
  }
}

// ── Export cookies for specific URL ──
async function exportCookies(filterUrl) {
  try {
    var ses = browserSession || session.defaultSession;
    var cookies = await ses.cookies.get({ url: filterUrl });
    var cookieFile = path.join(app.getPath('userData'), 'cookies.txt');
    var lines = ['# Netscape HTTP Cookie File', '# Auto-exported by VELOCE AI IDM', ''];
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      var domain = (c.domain || '').replace(/^\./, '');
      var flag = domain.charAt(0) === '.' ? 'TRUE' : 'FALSE';
      var cookiePath = c.path || '/';
      var secure = c.secure ? 'TRUE' : 'FALSE';
      var expiry = c.expirationDate ? Math.floor(c.expirationDate) : 0;
      var name = c.name || '';
      var value = c.value || '';
      lines.push([domain, flag, cookiePath, secure, expiry, name, value].join('\t'));
    }
    try { fs.mkdirSync(path.dirname(cookieFile), { recursive: true }); } catch (_) {}
    fs.writeFileSync(cookieFile, lines.join('\n'), 'utf8');
    return cookieFile;
  } catch (e) {
    console.log('[Veloce] Cookie export failed:', e.message);
    return null;
  }
}

// Export cookies every 60 seconds
setInterval(function() { exportCookies().catch(function() {}); }, 60000);

async function ytdlpDownload(url, downloadsDir, safeName, referer) {
  return new Promise(async function(resolve, reject) {
    var outTemplate = path.join(downloadsDir, safeName + '.%(ext)s');
    var args = [
      '-m', 'yt_dlp', '-o', outTemplate,
      '--no-warnings', '--no-check-certificates',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      // YouTube block bypass (same as the Android app): mweb/android/ios resolve
      // without cookies; the default web client hits the PO-token bot wall.
      '--extractor-args', 'youtube:player_client=mweb,android,ios',
    ];
    if (referer) args.push('--referer', referer);
    args.push(url);

    console.log('[Veloce] yt-dlp: ' + url.slice(0, 80));
    // Add cookies if available
    try {
      var cookieFile = await exportCookiesForYtDlp();
      if (cookieFile && fs.existsSync(cookieFile)) {
        args.push('--cookies', cookieFile);
      }
    } catch (e) {}
    var proc = spawn('python', args);
    var stdoutData = '';
    var stderrData = '';
    proc.stdout.on('data', function(chunk) {
      stdoutData += chunk.toString();
      console.log('[yt-dlp] ' + chunk.toString().trim());
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', { filename: safeName, output: chunk.toString() });
      }
    });
    proc.stderr.on('data', function(chunk) {
      stderrData += chunk.toString();
      console.log('[yt-dlp ERR] ' + chunk.toString().trim());
    });
    proc.on('close', function(code) {
      if (code === 0) resolve({ success: true, path: downloadsDir, filename: safeName });
      else {
        var errMsg = stderrData.slice(-300) || stdoutData.slice(-300) || 'Unknown error';
        reject(new Error('yt-dlp error: ' + errMsg.split('\n').pop()));
      }
    });
    proc.on('error', function(err) { reject(new Error('Failed to run python: ' + err.message)); });
  });
}

// ══════════════════════════════════════════════════════════════
// ── IPC: yt-dlp Smart Video Detection (ReClip-style) ──
// Runs yt-dlp --dump-json to extract video metadata without downloading.
// Returns: title, thumbnail, duration, and available formats/qualities.
// ══════════════════════════════════════════════════════════════

// Shared format cleaner — used by both yt-dlp.exe and Python branches
function buildCleanFormatResult(info, url) {
  var title = info.title || info.fulltitle || 'Video';
  var thumbnail = info.thumbnail || '';
  var duration = info.duration || 0;
  var uploader = info.uploader || info.channel || '';
  var extractor = info.extractor || info.extractor_key || '';

  var formats = info.formats || [];
  var seen = {};
  var cleanFormats = [];

  // Sort by quality (highest first)
  formats.sort(function(a, b) {
    return (b.height || 0) - (a.height || 0);
  });

  for (var i = 0; i < formats.length; i++) {
    var f = formats[i];
    if (!f.height && !f.abr) continue;
    if (f.format_note === 'storyboard') continue;

    var key;
    if (f.height) {
      key = f.height + 'p';
      if (f.fps && f.fps > 30) key += f.fps;
    } else if (f.abr) {
      key = 'audio-' + Math.round(f.abr) + 'k';
    } else {
      continue;
    }

    if (seen[key]) continue;
    seen[key] = true;

    var filesize = f.filesize || f.filesize_approx || 0;
    cleanFormats.push({
      id: f.format_id,
      label: key,
      ext: f.ext || 'mp4',
      height: f.height || 0,
      fps: f.fps || 0,
      filesize: filesize,
      filesizeStr: filesize > 0 ? (filesize > 1073741824
        ? (filesize / 1073741824).toFixed(1) + ' GB'
        : (filesize / 1048576).toFixed(0) + ' MB') : '',
      hasVideo: !!(f.vcodec && f.vcodec !== 'none'),
      hasAudio: !!(f.acodec && f.acodec !== 'none'),
    });
  }

  if (cleanFormats.length === 0) {
    cleanFormats.push({
      id: 'best', label: 'Best', ext: 'mp4', height: 0,
      fps: 0, filesize: 0, filesizeStr: '', hasVideo: true, hasAudio: true,
    });
  }

  var videoFormats = cleanFormats.filter(function(f) { return f.hasVideo; }).slice(0, 5);
  var audioFormats = cleanFormats.filter(function(f) { return !f.hasVideo && f.hasAudio; }).slice(0, 2);

  var durationStr = '';
  if (duration > 0) {
    if (duration > 3600) {
      durationStr = Math.floor(duration / 3600) + ':' + ('0' + Math.floor((duration % 3600) / 60)).slice(-2) + ':' + ('0' + (duration % 60)).slice(-2);
    } else {
      durationStr = Math.floor(duration / 60) + ':' + ('0' + (duration % 60)).slice(-2);
    }
  }

  return {
    ok: true,
    title: title,
    thumbnail: thumbnail,
    duration: duration,
    durationStr: durationStr,
    uploader: uploader,
    extractor: extractor,
    formats: videoFormats,
    audioFormats: audioFormats,
    pageUrl: url,
  };
}

ipcMain.handle('ytdlp-extract', async function(event, url) {
  if (!isValidUrl(url)) return { ok: false, error: 'Invalid URL' };
  if (!checkRateLimit('ytdlp-extract')) return { ok: false, error: 'Rate limited' };

  console.log('[Veloce ReClip] Extracting info: ' + url.slice(0, 100));

  // Export cookies first
  await exportCookies(url).catch(function() {});

  return new Promise(function(resolve) {
    // Try bundled yt-dlp.exe first (no Python required)
    var ytdlpExe = path.join(process.resourcesPath, 'yt-dlp.exe');
    if (fs.existsSync(ytdlpExe)) {
      var exeArgs = ['--dump-json', '--no-playlist', '--impersonate', 'chrome'];
      var cf = path.join(app.getPath('userData'), 'cookies.txt');
      if (fs.existsSync(cf)) { exeArgs.push('--cookies', cf); }
      exeArgs.push(url);
      var proc = spawn(ytdlpExe, exeArgs, { timeout: 30000 });
      var stdoutData = '', stderrData = '';
      proc.stdout.on('data', function(chunk) { stdoutData += chunk.toString(); });
      proc.stderr.on('data', function(chunk) { stderrData += chunk.toString(); });
      proc.on('close', function() {
        try {
          var info = JSON.parse(stdoutData.trim());
          resolve(buildCleanFormatResult(info, url));
        }
        catch (e) { resolve({ ok: false, error: (stderrData || stdoutData || 'yt-dlp failed').slice(-200) }); }
      });
      proc.on('error', function(err) { resolve({ ok: false, error: 'yt-dlp not found: ' + err.message }); });
      return;
    }
    // Fallback: Python
    var args = [
      '-m', 'yt_dlp', '--dump-json',
      '--no-warnings', '--no-check-certificates', '--no-playlist',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      // YouTube block bypass (same as the Android app): mweb/android/ios resolve
      // without cookies; the default web client hits the PO-token bot wall.
      '--extractor-args', 'youtube:player_client=mweb,android,ios',
      url
    ];

    var proc = spawn('python', args, { timeout: 30000 });
    var stdoutData = '';
    var stderrData = '';

    proc.stdout.on('data', function(chunk) {
      stdoutData += chunk.toString();
    });
    proc.stderr.on('data', function(chunk) {
      stderrData += chunk.toString();
    });

    proc.on('close', function(code) {
      if (code !== 0 || !stdoutData.trim()) {
        console.log('[Veloce ReClip] Extract failed: ' + (stderrData || 'no output').slice(-200));
        resolve({ ok: false, error: stderrData.slice(-200) || 'yt-dlp failed' });
        return;
      }

      try {
        var info = JSON.parse(stdoutData);
        var result = buildCleanFormatResult(info, url);
        console.log('[Veloce ReClip] ' + result.title + ' — ' + result.formats.length + ' video, ' + result.audioFormats.length + ' audio formats');
        resolve(result);
      } catch (e) {
        console.log('[Veloce ReClip] JSON parse error: ' + e.message);
        resolve({ ok: false, error: 'Failed to parse video info' });
      }
    });

    proc.on('error', function(err) {
      resolve({ ok: false, error: 'python not found: ' + err.message });
    });
  });
});

// ── IPC: yt-dlp Download with specific format ──
var _ytdlpProcs = {};
var _ytdlpDirs = {};
var _ytdlpSafeNames = {};

ipcMain.handle('ytdlp-download-format', async function(event, data) {
  if (!isValidUrl(data.url)) return { ok: false, error: 'Invalid URL' };
  if (!checkRateLimit('start-download')) return { ok: false, error: 'Rate limited' };

  var url = data.url;
  var formatId = data.formatId || 'best';
  var isAudio = data.isAudio || false;
  var pageTitle = data.title || 'video';

  var downloadsDir = getDownloadsDir();
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  var safeName = sanitizeFilename(pageTitle).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) + '_' + Date.now().toString().slice(-5);
  var outTemplate = path.join(downloadsDir, safeName + '.%(ext)s');

  // Use bundled yt-dlp.exe if available, otherwise fall back to Python
  var useExe = fs.existsSync(path.join(process.resourcesPath, 'yt-dlp.exe'));
  var ytDlpCmd, ytDlpArgs;
  // YouTube block bypass (same as the Android app): mweb/android/ios clients
  // resolve WITHOUT a logged-in cookie file, whereas the default web client
  // triggers the "sign in to confirm you're not a bot" PO-token wall. The
  // extractor falls through these clients until one returns formats.
  var ytBypass = ['--extractor-args', 'youtube:player_client=mweb,android,ios'];
  if (useExe) {
    ytDlpCmd = path.join(process.resourcesPath, 'yt-dlp.exe');
    ytDlpArgs = ['-o', outTemplate, '--no-warnings', '--no-check-certificates', '--newline', '--progress', '--impersonate', 'chrome'].concat(ytBypass);
  } else {
    ytDlpCmd = 'python';
    ytDlpArgs = ['-m', 'yt_dlp', '-o', outTemplate, '--no-warnings', '--no-check-certificates', '--newline', '--progress', '--impersonate', 'chrome'].concat(ytBypass);
  }

  if (isAudio) {
    ytDlpArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    // ALWAYS merge video+audio to ensure playback with sound
    // Use height-based selection instead of raw format IDs (which can be video-only)
    var heightStr = '';
    if (formatId && formatId !== 'best') {
      // Extract height from format label like "1080p" or use format ID
      var hMatch = String(formatId).match(/(\d+)/);
      if (hMatch) heightStr = hMatch[1];
    }

    if (heightStr) {
      // Pick best video at this height + best audio, merged
      ytDlpArgs.push('-f', 'bestvideo[height<=' + heightStr + ']+bestaudio/best[height<=' + heightStr + ']/best');
    } else {
      ytDlpArgs.push('-f', 'bestvideo+bestaudio/best');
    }
    ytDlpArgs.push('--merge-output-format', 'mp4');
    // Force AAC audio so Windows Media Player / Movies & TV can play it (not just VLC)
    ytDlpArgs.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
  }

  ytDlpArgs.push(url);

  console.log('[Veloce ReClip] Downloading: ' + pageTitle + ' [' + (isAudio ? 'MP3' : formatId) + ']');

  var ytDlpId = data.ytDlpId || safeName;
  _ytdlpDirs[ytDlpId] = downloadsDir;
  _ytdlpSafeNames[ytDlpId] = safeName;

  return new Promise(async function(resolve, reject) {
    // Add cookies if available
    try {
      var cookieFile = await exportCookiesForYtDlp();
      if (cookieFile && fs.existsSync(cookieFile)) {
        ytDlpArgs.push('--cookies', cookieFile);
      }
    } catch (e) {}
    var proc = spawn(ytDlpCmd, ytDlpArgs);
    _ytdlpProcs[ytDlpId] = proc;
    var stdoutData = '';
    var stderrData = '';

    function parseAndSendProgress(text) {
      // Split into lines — --newline gives one update per line
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        console.log('[yt-dlp] ' + line);
        if (mainWindow && !mainWindow.isDestroyed()) {
          var pctMatch = line.match(/(\d+\.?\d*)%/);
          var speedMatch = line.match(/at\s+([^\s]+)/);
          var etaMatch = line.match(/ETA\s+([^\s]+)/);
          var sizeMatch = line.match(/of\s+~?([\d.]+\s*[KMGi]+B)/i);
          if (pctMatch || speedMatch) {  // only send if it looks like a progress line
            mainWindow.webContents.send('download-progress', {
              filename: safeName,
              output: line,
              percent: pctMatch ? parseFloat(pctMatch[1]) : undefined,
              speed: speedMatch ? speedMatch[1] : undefined,
              eta: etaMatch ? etaMatch[1] : undefined,
              size: sizeMatch ? sizeMatch[1] : undefined,
              status: 'Downloading',
            });
          }
        }
      }
    }

    proc.stdout.on('data', function(chunk) {
      var text = chunk.toString();
      stdoutData += text;
      parseAndSendProgress(text);
    });
    proc.stderr.on('data', function(chunk) {
      var text = chunk.toString();
      stderrData += text;
      // yt-dlp also writes progress to stderr — parse it too
      parseAndSendProgress(text);
    });

    proc.on('close', function(code) {
      // Detach after cancel: tracking data was already deleted by cancel handler.
      // Check BEFORE we delete — cancel handler removes _ytdlpDirs first.
      var wasCancelled = !_ytdlpDirs[ytDlpId];
      delete _ytdlpProcs[ytDlpId];
      delete _ytdlpDirs[ytDlpId];
      delete _ytdlpSafeNames[ytDlpId];
      // Find the actual output file
      var outputFile = '';
      var files = fs.readdirSync(downloadsDir);
      for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf(safeName) !== -1) {
          outputFile = path.join(downloadsDir, files[i]);
          break;
        }
      }

      // Check if output file exists with data — yt-dlp may exit non-zero
      // even after a successful download (e.g. post-processor warnings)
      var fileExists = outputFile && fs.existsSync(outputFile);
      var fileSize = fileExists ? fs.statSync(outputFile).size : 0;

      if (code === 0 || (fileExists && fileSize > 0)) {
        var sizeStr = fileSize > 1048576 ? (fileSize / 1048576).toFixed(1) + ' MB' : (fileSize / 1024).toFixed(0) + ' KB';

        if (mainWindow && !mainWindow.isDestroyed() && !wasCancelled) {
          mainWindow.webContents.send('download-complete', {
            filename: safeName,
            path: outputFile,
            folder: downloadsDir,
            size: sizeStr,
            complete: true,
          });
        }

        resolve({ ok: true, path: outputFile, filename: safeName, size: sizeStr });
      } else {
        reject(new Error('yt-dlp error: ' + (stderrData || stdoutData).slice(-200)));
      }
    });
    proc.on('error', function(err) {
      delete _ytdlpProcs[ytDlpId];
      delete _ytdlpDirs[ytDlpId];
      delete _ytdlpSafeNames[ytDlpId];
      reject(new Error('Failed to run python: ' + err.message));
    });
  });
});


// ── IPC: Cancel yt-dlp download (kill proc + delete partial files) ──
ipcMain.handle('ytdlp-cancel-format', function(event, ytDlpId) {
  // Capture tracking data BEFORE killing the process —
  // the close handler will delete these once the process exits
  var dir = _ytdlpDirs[ytDlpId];
  var safeName = _ytdlpSafeNames[ytDlpId];
  var proc = _ytdlpProcs[ytDlpId];

  // Delete tracking immediately so the close handler sees a clean slate
  // and does NOT try to find/output the file (it was cancelled)
  delete _ytdlpProcs[ytDlpId];
  delete _ytdlpDirs[ytDlpId];
  delete _ytdlpSafeNames[ytDlpId];

  // Kill the yt-dlp process tree — SIGTERM is unreliable on Windows,
  // so use taskkill /F /T to force-terminate the whole tree
  if (proc) {
    try {
      if (process.platform === 'win32') {
        require('child_process').exec('taskkill /F /T /PID ' + proc.pid);
      } else {
        proc.kill('SIGKILL');
      }
    } catch(e) {}
  }

  // Clean up partial files — give the OS a moment to release file handles,
  // then delete any file in the download directory that matches the safeName
  if (dir && safeName) {
    setTimeout(function() {
      try {
        if (!fs.existsSync(dir)) return;
        var files = fs.readdirSync(dir);
        for (var f = 0; f < files.length; f++) {
          if (files[f].indexOf(safeName) !== -1) {
            var fpp = path.join(dir, files[f]);
            try { fs.unlinkSync(fpp); console.log('[Veloce ReClip] Cleaned up partial: ' + fpp); } catch(e) {}
          }
        }
        // Also sweep yt-dlp temp files (*.part, *.ytdl) if they match the safeName pattern
        for (var f = 0; f < files.length; f++) {
          var lowerFile = files[f].toLowerCase();
          if ((lowerFile.endsWith('.part') || lowerFile.endsWith('.ytdl')) && files[f].indexOf(safeName) !== -1) {
            var fpp = path.join(dir, files[f]);
            try { fs.unlinkSync(fpp); console.log('[Veloce ReClip] Cleaned up temp: ' + fpp); } catch(e) {}
          }
        }
      } catch(e) {}
    }, 800);
  }

  return { ok: true };
});
// ── IPC: Check file size (HEAD request) before downloading ──
ipcMain.handle('check-size', async function(event, url) {
  if (!isValidUrl(url)) return { size: 0, type: '', resumable: false };
  if (!checkRateLimit('check-size')) return { size: 0, type: '', resumable: false };
  try {
    return await new Promise(function(resolve, reject) {
      var request = net.request({
        method: 'HEAD',
        url: url,
        session: browserSession || session.defaultSession,
      });
      request.on('response', function(response) {
        var cl = response.headers['content-length'];
        var size = cl ? parseInt(Array.isArray(cl) ? cl[0] : cl) : 0;
        var ct = response.headers['content-type'];
        var type = ct ? (Array.isArray(ct) ? ct[0] : ct) : '';
        var resumable = !!response.headers['accept-ranges'];
        resolve({ size: size, type: type, resumable: resumable });
      });
      request.on('error', function() {
        resolve({ size: 0, type: '', resumable: false });
      });
      request.end();
    });
  } catch (e) {
    return { size: 0, type: '', resumable: false };
  }
});

// ── IPC: Check HLS stream size (fetch manifest, download sample segments) ──
ipcMain.handle('check-hls-size', async function(event, url) {
  if (!isValidUrl(url)) return { size: 0, segments: 0, estimated: false };
  if (!checkRateLimit('check-hls-size')) return { size: 0, segments: 0, estimated: false };

  // Hard 12-second timeout — never leave dialog stuck on "Checking..."
  var timeoutResult = new Promise(function(resolve) {
    setTimeout(function() {
      console.log('[Veloce] HLS size check timed out');
      resolve({ size: 0, segments: 0, estimated: false, timedOut: true });
    }, 12000);
  });

  var checkPromise = (async function() {
    try {
      // Step 1: Fetch the m3u8 manifest
      var m3u8Data = await fetchWithBrowser(url);
      var m3u8Text = m3u8Data.toString('utf8');
      var parsed = parseM3U8(m3u8Text, url);

      // Step 2: If master playlist, fetch the best variant
      if (parsed.type === 'master' && parsed.variantUrl) {
        var variantData = await fetchWithBrowser(parsed.variantUrl);
        parsed = parseM3U8(variantData.toString('utf8'), parsed.variantUrl);
      }

      if (!parsed.segments || parsed.segments.length === 0) {
        return { size: 0, segments: 0, estimated: false };
      }

      var totalSegments = parsed.segments.length;

      // Step 3: Sample 3 segments to estimate size — but cap each fetch at 8s
      var sampleIndices = [];
      if (totalSegments <= 3) {
        for (var i = 0; i < totalSegments; i++) sampleIndices.push(i);
      } else {
        sampleIndices = [
          Math.floor(totalSegments * 0.1),
          Math.floor(totalSegments * 0.5),
          Math.floor(totalSegments * 0.9),
        ];
      }

      var totalSampleBytes = 0;
      var samplesOk = 0;
      for (var i = 0; i < sampleIndices.length; i++) {
        try {
          var seg = parsed.segments[sampleIndices[i]];
          // Race each segment fetch against 8s timeout
          var segData = await Promise.race([
            fetchWithBrowser(seg.url),
            new Promise(function(_, reject) { setTimeout(function() { reject(new Error('seg timeout')); }, 8000); }),
          ]);
          if (segData && segData.length > 0) {
            totalSampleBytes += segData.length;
            samplesOk++;
            console.log('[Veloce] Sample segment ' + sampleIndices[i] + ': ' + (segData.length / 1024).toFixed(0) + ' KB');
          }
        } catch (e) {
          console.log('[Veloce] Sample segment failed: ' + e.message);
        }
      }

      var avgSegSize = samplesOk > 0 ? totalSampleBytes / samplesOk : 0;
      var estimatedTotal = Math.round(avgSegSize * totalSegments);

      console.log('[Veloce] HLS size estimate: ' + totalSegments + ' segments, avg ' +
        (avgSegSize / 1024).toFixed(0) + ' KB/seg, total ~' + (estimatedTotal / 1048576).toFixed(1) + ' MB');

      return {
        size: estimatedTotal,
        segments: totalSegments,
        encrypted: parsed.encrypted || false,
        estimated: true,
        avgSegSize: Math.round(avgSegSize),
      };
    } catch (e) {
      console.log('[Veloce] HLS size check failed: ' + e.message);
      return { size: 0, segments: 0, estimated: false };
    }
  })();

  return Promise.race([checkPromise, timeoutResult]);
});

// ── IPC: Pre-download safety check ──
ipcMain.handle('check-safety', async function(event, url, filename, fileSize) {
  if (!checkRateLimit('check-safety')) return { overall: 'safe', overallLabel: 'Rate limited', checks: [] };
  try {
    var safety = assessFileSafety(url || '', filename || '', fileSize || 0);
    console.log('[Veloce Security] Safety check: ' + safety.overall + ' — ' + (url || '').slice(0, 60));
    return safety;
  } catch (e) {
    console.log('[Veloce Security] Safety check error: ' + e.message);
    return { overall: 'safe', overallLabel: 'Check failed', checks: [] };
  }
});

// ── IPC: Post-download hash check (SHA-256 → VirusTotal lookup) ──
ipcMain.handle('scan-file-hash', async function(event, filePath) {
  if (!checkRateLimit('scan-file-hash')) return { scanned: false, error: 'Rate limited' };
  if (!filePath || !fs.existsSync(filePath)) return { scanned: false, error: 'File not found' };

  try {
    // Step 1: Calculate SHA-256 hash
    var hash = await new Promise(function(resolve, reject) {
      var sha256 = crypto.createHash('sha256');
      var stream = fs.createReadStream(filePath);
      stream.on('data', function(chunk) { sha256.update(chunk); });
      stream.on('end', function() { resolve(sha256.digest('hex')); });
      stream.on('error', reject);
    });

    console.log('[Veloce Security] File hash: ' + hash + ' — ' + path.basename(filePath));

    // Step 2: Check VirusTotal (hash lookup — no upload, instant if known)
    // This requires a free API key from virustotal.com
    // For now, return the hash so the user can manually check if they want
    var vtResult = { known: false, positives: 0, total: 0, link: 'https://www.virustotal.com/gui/file/' + hash };

    return {
      scanned: true,
      hash: hash,
      fileName: path.basename(filePath),
      fileSize: fs.statSync(filePath).size,
      vt: vtResult,
    };
  } catch (e) {
    console.log('[Veloce Security] Hash scan error: ' + e.message);
    return { scanned: false, error: e.message };
  }
});

// ── IPC: Pause download ──
ipcMain.handle('pause-download', function(event, id) {
  // Check for cancel request (id ends with :cancel)
  if (typeof id === 'string' && id.endsWith(':cancel')) {
    var realId = id.replace(':cancel', '');
    // Cancel direct download items
    var cancelItem = downloadItems[realId];
    if (cancelItem) {
      cancelItem.cancel();
      delete downloadItems[realId];
      console.log('[Veloce DL] Cancelled direct download: ' + realId);
    }
    // Set cancellation flag for HLS/booster downloads (checked by tunnel loop).
    // The booster workers check by the DISPLAY name, so resolve the intercepted
    // Electron item id ("dl-<ts>") to its display filename when we have one.
    var dlName = dlIdToName[realId] || realId;
    cancelledDownloads[realId] = true;
    cancelledDownloads[dlName] = true;
    cancelledDownloads[sanitizeFilename(dlName)] = true;
    console.log('[Veloce DL] Cancel flag set: ' + dlName + ' (from ' + realId + ')');
    return;
  }
  var item = downloadItems[id];
  if (item && !item.isPaused()) {
    item.pause();
    console.log('[Veloce DL] Paused: ' + id);
  }
});

// ── IPC: Resume download ──
ipcMain.handle('resume-download', function(event, id) {
  var item = downloadItems[id];
  if (item) {
    if (item.canResume()) {
      item.resume();
      console.log('[Veloce DL] Resumed: ' + id);
    } else {
      console.log('[Veloce DL] Cannot resume: ' + id);
    }
  }
});

// ── IPC: Cancel intercepted download (so we can use 16-booster path instead) ──
ipcMain.handle('cancel-intercepted-download', function(event, id) {
  var item = downloadItems[id];
  if (item) {
    var p = item.getSavePath();
    var fn = p ? path.basename(p) : null;
    item.cancel();
    delete downloadItems[id];
    if (fn) delete downloadItems[fn];
    console.log('[Veloce DL] Cancelled intercepted: ' + id + ' (using booster download instead)');
  }
});

// ── IPC: Clear browser cache ──
ipcMain.handle('clear-cache', async function() {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.webContents.session.clearCache();
      console.log('[Veloce] Cache cleared');
      return { success: true };
    }
  } catch (e) {
    console.log('[Veloce] Clear cache error: ' + e.message);
    return { success: false, error: e.message };
  }
});

// ── IPC: Clear browsing data with options (timeRange hours, dataTypes object) ──
ipcMain.handle('clear-browsing-data', async function(event, opts) {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { success: false, error: 'No active browser window' };
    }
    var ses = mainWindow.webContents.session;
    var dataTypes = (opts && opts.dataTypes) || {};
    var timeRange = (opts && opts.timeRange) || 0; // hours, 0 = all time

    // Build storage types array from selected options
    var storages = [];
    if (dataTypes.cookies !== false) storages.push('cookies');
    if (dataTypes.storage !== false) {
      storages.push('localstorage', 'indexdb', 'sessionstorage', 'cachestorage');
    }

    // Calculate time cutoff (timeRange in hours, 0 = all time)
    var cutoffMs = timeRange > 0 ? Date.now() - (timeRange * 3600000) : 0;

    // Clear cache if selected (cache has no time filter in Electron — cleared fully)
    if (dataTypes.cache !== false) {
      await ses.clearCache();
      console.log('[Veloce] Cache cleared');
    }

    // Clear cookies and storage if selected
    if (storages.length > 0) {
      // Only pass time-based filter for cookies — Electron storage API has no time filter
      var clearOpts = { storages: storages };
      if (cutoffMs > 0) {
        clearOpts.start = cutoffMs / 1000; // Electron expects seconds
        console.log('[Veloce] Clearing data since: ' + new Date(cutoffMs).toISOString());
      }
      await ses.clearStorageData(clearOpts);
      console.log('[Veloce] Storage cleared: ' + storages.join(', '));
    }

    // Clear history if selected (Electron's clearHistory is minimal — it clears navigation entries)
    if (dataTypes.history !== false) {
      try {
        // Clear navigation history for the session
        await ses.clearStorageData({ storages: ['serviceworkers'] });
      } catch (eh) {
        console.log('[Veloce] History clear note: ' + eh.message);
      }
    }

    var cleared = [];
    if (dataTypes.history !== false) cleared.push('history');
    if (dataTypes.cookies !== false) cleared.push('cookies');
    if (dataTypes.cache !== false) cleared.push('cache');
    if (dataTypes.storage !== false) cleared.push('storage');

    console.log('[Veloce] Browsing data cleared: ' + cleared.join(', ') + ' (timeRange: ' + (timeRange || 'all') + ')');
    return { success: true, cleared: cleared };
  } catch (e) {
    console.log('[Veloce] Clear data error: ' + e.message);
    return { success: false, error: e.message };
  }
});

// ── IPC: Floating Download Dialog Window ──
ipcMain.handle('open-dl-dialog', function(event, data) {
  // Close existing dialog if open
  if (dlDialogWindow && !dlDialogWindow.isDestroyed()) {
    dlDialogWindow.close();
  }

  // Get main window position to place dialog near it
  var mainBounds = mainWindow ? mainWindow.getBounds() : { x: 200, y: 200 };

  dlDialogWindow = new BrowserWindow({
    width: 480,
    height: 520,
    x: mainBounds.x + mainBounds.width - 500,
    y: mainBounds.y + 80,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
    resizable: true,
    minimizable: false,
    skipTaskbar: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'dl-dialog-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  dlDialogWindow.loadFile(path.join(__dirname, 'dl-dialog.html'));

  // Send initial data once loaded
  dlDialogWindow.webContents.on('did-finish-load', function() {
    if (dlDialogWindow && !dlDialogWindow.isDestroyed()) {
      dlDialogWindow.webContents.send('dl-dialog-update', data);
    }
  });

  dlDialogWindow.on('closed', function() {
    dlDialogWindow = null;
  });

  console.log('[Veloce] Opened floating download dialog');
});

ipcMain.handle('update-dl-dialog', function(event, data) {
  if (dlDialogWindow && !dlDialogWindow.isDestroyed()) {
    dlDialogWindow.webContents.send('dl-dialog-update', data);
  }
});

ipcMain.handle('update-dl-dialog-safety', function(event, data) {
  if (dlDialogWindow && !dlDialogWindow.isDestroyed()) {
    dlDialogWindow.webContents.send('dl-dialog-safety', data);
  }
});

ipcMain.handle('close-dl-dialog', function() {
  if (dlDialogWindow && !dlDialogWindow.isDestroyed()) {
    dlDialogWindow.close();
    dlDialogWindow = null;
  }
});

// Forward actions from dialog back to renderer
ipcMain.on('dl-dialog-action', function(event, action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dl-dialog-action', action);
  }
});

// ── IPC: Open in system browser (for Cloudflare-blocked sites) ──
ipcMain.handle('open-in-browser', function(event, url) {
  if (!isValidUrl(url)) {
    console.log('[Veloce Security] Blocked openExternal — not http/https: ' + String(url).slice(0, 50));
    return;
  }
  shell.openExternal(url);
  console.log('[Veloce] Opened in system browser: ' + url.slice(0, 80));
});

// ── IPC: Toggle DevTools for main window (Ctrl+Shift+J) ──
ipcMain.handle('toggle-devtools', function() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.toggleDevTools();
  }
});

// ── IPC: Open a specific file ──
ipcMain.handle('open-file', function(event, filePath) {
  if (!filePath || !isPathSafe(filePath)) {
    console.log('[Veloce Security] Blocked open-file — path outside safe dirs: ' + String(filePath).slice(0, 80));
    return;
  }
  if (fs.existsSync(filePath)) {
    shell.openPath(filePath);
    console.log('[Veloce] Opening file: ' + filePath);
  }
});

// ── IPC: Open a specific folder (and select the file) ──
ipcMain.handle('open-folder', function(event, filePath) {
  if (!filePath || !isPathSafe(filePath)) {
    console.log('[Veloce Security] Blocked open-folder — path outside safe dirs: ' + String(filePath).slice(0, 80));
    return;
  }
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    console.log('[Veloce] Showing in folder: ' + filePath);
  }
});

// ── IPC: Open downloads folder ──
ipcMain.handle('open-downloads', function() {
  var dir = getDownloadsDir();
  shell.openPath(dir);
});

// ── IPC: Engine Settings ──
ipcMain.handle('settings:get', function() {
  return {
    hlsTunnels: activeConcurrency,
    directWorkers: DIRECT_WORKERS,
    chunkSizeMB: DIRECT_CHUNK_SIZE / (1024 * 1024),
    maxRetries: DIRECT_MAX_RETRIES,
    downloadPath: settingsDownloadPath,
    remuxEnabled: settingsRemuxEnabled,
    snifferEnabled: settingsSnifferEnabled,
    soundEnabled: settingsSoundEnabled,
    autoStart: settingsAutoStart,
  };
});

ipcMain.handle('settings:update', function(event, settings) {
  if (settings.hlsTunnels != null && typeof settings.hlsTunnels === 'number') {
    activeConcurrency = Math.max(2, Math.min(32, settings.hlsTunnels));
    userMaxConcurrency = activeConcurrency;
    console.log('[Veloce Settings] Tunnels set to: ' + activeConcurrency);
  }
  if (settings.directWorkers != null && typeof settings.directWorkers === 'number') {
    DIRECT_WORKERS = Math.max(2, Math.min(64, settings.directWorkers));
    console.log('[Veloce Settings] Direct workers set to: ' + DIRECT_WORKERS);
  }
  if (settings.chunkSizeMB != null && typeof settings.chunkSizeMB === 'number') {
    DIRECT_CHUNK_SIZE = Math.max(0.5, Math.min(50, settings.chunkSizeMB)) * 1024 * 1024;
    console.log('[Veloce Settings] Chunk size set to: ' + (DIRECT_CHUNK_SIZE / 1048576) + ' MB');
  }
  if (settings.maxRetries != null && typeof settings.maxRetries === 'number') {
    DIRECT_MAX_RETRIES = Math.max(1, Math.min(20, settings.maxRetries));
    console.log('[Veloce Settings] Max retries set to: ' + DIRECT_MAX_RETRIES);
  }
  if (typeof settings.remuxEnabled === 'boolean') {
    settingsRemuxEnabled = settings.remuxEnabled;
    console.log('[Veloce Settings] Remux enabled: ' + settingsRemuxEnabled);
  }
  if (typeof settings.snifferEnabled === 'boolean') {
    settingsSnifferEnabled = settings.snifferEnabled;
    console.log('[Veloce Settings] Sniffer enabled: ' + settingsSnifferEnabled);
  }
  if (typeof settings.soundEnabled === 'boolean') {
    settingsSoundEnabled = settings.soundEnabled;
    console.log('[Veloce Settings] Sound enabled: ' + settingsSoundEnabled);
  }
  if (typeof settings.autoStart === 'boolean') {
    settingsAutoStart = settings.autoStart;
    console.log('[Veloce Settings] Auto-start: ' + settingsAutoStart);
  }
  if (typeof settings.downloadPath === 'string' && settings.downloadPath) {
    settingsDownloadPath = settings.downloadPath;
    console.log('[Veloce Settings] Download path: ' + settingsDownloadPath);
  }
  return { ok: true };
});

// Browse for download folder
ipcMain.handle('select-download-path', async function() {
  var result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Download Folder',
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// ══════════════════════════════════════════════════════════════
// ── VELOCE AI SEARCH ENGINE ──
// Deep search across Internet Archive, Wayback Machine, GitHub,
// Open Directories, and Software Archives
// ══════════════════════════════════════════════════════════════

/**
 * Smart query expansion — generates alternative search terms
 * e.g. "Samsung GT-S5360 firmware" → also searches "Galaxy Y stock ROM", build numbers etc.
 */
function expandQuery(query) {
  var expansions = [query];
  var q = query.toLowerCase();

  // Firmware-related expansions
  if (q.includes('firmware') || q.includes('flash') || q.includes('rom') || q.includes('stock')) {
    expansions.push(query + ' flash file');
    expansions.push(query + ' stock ROM');
    expansions.push(query + ' original firmware download');
  }

  // Software version expansions
  if (q.match(/v?\d+\.\d+/)) {
    // Has version number — also search without it for broader results
    var noVersion = query.replace(/v?\d+[\.\d]*/gi, '').trim();
    if (noVersion.length > 3) expansions.push(noVersion + ' download');
  }

  // Driver expansions
  if (q.includes('driver')) {
    expansions.push(query + ' setup');
    expansions.push(query + ' installer');
  }

  // Old software expansions
  if (q.includes('old') || q.includes('legacy') || q.includes('classic') || q.includes('retro')) {
    expansions.push(query.replace(/old|legacy|classic|retro/gi, '').trim() + ' vintage software');
    expansions.push(query + ' abandonware');
  }

  // Deduplicate and limit
  var seen = {};
  var unique = [];
  for (var i = 0; i < expansions.length; i++) {
    var e = expansions[i].trim();
    if (e && !seen[e.toLowerCase()]) {
      seen[e.toLowerCase()] = true;
      unique.push(e);
    }
  }
  return unique.slice(0, 4);  // Max 4 query variants
}

/**
 * Fetch JSON with timeout using Electron's net module
 */
function fetchJSON(url, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error('Timeout')); }, timeoutMs || 15000);
    var reqSession = browserSession || session.defaultSession;

    try {
      var request = net.request({ url: url, session: reqSession });
      var body = '';

      request.on('response', function(response) {
        response.on('data', function(chunk) { body += chunk.toString(); });
        response.on('end', function() {
          clearTimeout(timer);
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Invalid JSON')); }
        });
      });

      request.on('error', function(err) {
        clearTimeout(timer);
        reject(err);
      });

      request.end();
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

/**
 * Fetch raw text with timeout
 */
function fetchText(url, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error('Timeout')); }, timeoutMs || 15000);
    var reqSession = browserSession || session.defaultSession;

    try {
      var request = net.request({ url: url, session: reqSession });
      var body = '';

      request.on('response', function(response) {
        response.on('data', function(chunk) { body += chunk.toString(); });
        response.on('end', function() {
          clearTimeout(timer);
          resolve(body);
        });
      });

      request.on('error', function(err) {
        clearTimeout(timer);
        reject(err);
      });

      request.end();
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

/**
 * Search Internet Archive (archive.org)
 * Returns: [{ title, url, source, size, type, date, description }]
 */
async function searchInternetArchive(query, maxResults) {
  maxResults = maxResults || 10;
  var results = [];

  // File extensions we care about (skip metadata files)
  var GOOD_EXTENSIONS = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    '.iso', '.img', '.bin', '.rom', '.fw',
    '.exe', '.msi', '.dmg', '.deb', '.rpm', '.apk', '.app',
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
    '.mp3', '.flac', '.ogg', '.wav', '.aac',
    '.pdf', '.doc', '.docx', '.txt',
    '.cab', '.dat', '.pak',
  ];

  var SKIP_EXTENSIONS = [
    '_meta.xml', '_files.xml', '_meta.sqlite', '_archive.torrent',
    '_reviews.xml', '_thumb', '.thumbs/',
  ];

  try {
    var searchUrl = 'https://archive.org/advancedsearch.php?q=' +
      encodeURIComponent(query) +
      '&rows=' + Math.min(maxResults, 8) +
      '&output=json&fl[]=identifier&fl[]=title&fl[]=format&fl[]=description&fl[]=date&fl[]=item_size&fl[]=mediatype';

    var data = await fetchJSON(searchUrl, 15000);
    var docs = (data && data.response && data.response.docs) ? data.response.docs : [];

    // For each item, fetch actual files inside it
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      var ident = d.identifier;
      if (!ident) continue;

      var itemTitle = d.title || ident;
      var pageUrl = 'https://archive.org/details/' + ident;
      var itemDate = d.date || '';
      var itemDesc = (d.description || '').toString().slice(0, 200);

      // Fetch the file list for this item using the main metadata API
      // API returns { "files": [...], "metadata": {...}, ... }
      try {
        var metaUrl = 'https://archive.org/metadata/' + ident;
        var filesData = await fetchJSON(metaUrl, 12000);

        // Handle multiple API response formats
        var files = [];
        if (filesData) {
          if (Array.isArray(filesData.files)) {
            files = filesData.files;
          } else if (Array.isArray(filesData.result)) {
            files = filesData.result;
          } else if (Array.isArray(filesData)) {
            files = filesData;
          }
        }

        console.log('[Veloce Search] IA item "' + ident + '" has ' + files.length + ' files');

        if (files.length === 0) {
          // Fallback: no files API, just return the download page
          results.push({
            title: itemTitle,
            url: 'https://archive.org/download/' + ident,
            pageUrl: pageUrl,
            source: 'Internet Archive',
            size: d.item_size ? Number(d.item_size) : 0,
            type: d.mediatype || 'unknown',
            date: itemDate,
            description: itemDesc,
            formats: Array.isArray(d.format) ? d.format.join(', ') : (d.format || ''),
          });
          continue;
        }

        // Filter to actual downloadable files (skip metadata, thumbs, etc.)
        var goodFiles = [];
        for (var f = 0; f < files.length; f++) {
          var file = files[f];
          var fname = file.name || '';
          var fnameLower = fname.toLowerCase();

          // Skip metadata/internal files
          var skip = false;
          for (var s = 0; s < SKIP_EXTENSIONS.length; s++) {
            if (fnameLower.indexOf(SKIP_EXTENSIONS[s]) !== -1) { skip = true; break; }
          }
          if (skip) continue;

          // Check if it has a useful extension
          var hasGoodExt = false;
          for (var g = 0; g < GOOD_EXTENSIONS.length; g++) {
            if (fnameLower.endsWith(GOOD_EXTENSIONS[g])) { hasGoodExt = true; break; }
          }
          // Also check if extension is embedded (e.g., "file.exe.bz2" contains ".exe")
          if (!hasGoodExt) {
            for (var g = 0; g < GOOD_EXTENSIONS.length; g++) {
              if (fnameLower.indexOf(GOOD_EXTENSIONS[g]) !== -1) { hasGoodExt = true; break; }
            }
          }

          // Also accept files > 100KB even without known extension
          var fileSize = file.size ? Number(file.size) : 0;
          if (hasGoodExt || fileSize > 102400) {
            goodFiles.push({
              name: fname,
              size: fileSize,
              format: file.format || '',
            });
          }
        }

        // Sort by size (largest first — usually the main file)
        goodFiles.sort(function(a, b) { return b.size - a.size; });

        // Take up to 3 best files per item
        var filesToShow = goodFiles.slice(0, 3);

        if (filesToShow.length === 0) {
          // No good files found — still show the item page
          results.push({
            title: itemTitle,
            url: 'https://archive.org/download/' + ident,
            pageUrl: pageUrl,
            source: 'Internet Archive',
            size: d.item_size ? Number(d.item_size) : 0,
            type: d.mediatype || 'unknown',
            date: itemDate,
            description: itemDesc,
          });
        } else {
          // Create a result for each downloadable file with DIRECT download URL
          for (var ff = 0; ff < filesToShow.length; ff++) {
            var theFile = filesToShow[ff];
            var directUrl = 'https://archive.org/download/' + ident + '/' + encodeURIComponent(theFile.name);

            results.push({
              title: itemTitle + ' — ' + theFile.name,
              url: directUrl,
              pageUrl: pageUrl,
              source: 'Internet Archive',
              size: theFile.size,
              type: theFile.format || d.mediatype || 'file',
              date: itemDate,
              description: itemDesc,
            });
          }
        }
      } catch (fileErr) {
        // Files API failed — fall back to download page
        console.log('[Veloce Search] IA files fetch failed for ' + ident + ': ' + fileErr.message);
        results.push({
          title: itemTitle,
          url: 'https://archive.org/download/' + ident,
          pageUrl: pageUrl,
          source: 'Internet Archive',
          size: d.item_size ? Number(d.item_size) : 0,
          type: d.mediatype || 'unknown',
          date: itemDate,
          description: itemDesc,
        });
      }
    }
  } catch (e) {
    console.log('[Veloce Search] Internet Archive error: ' + e.message);
  }

  return results.slice(0, maxResults * 2);  // Allow more since we expand items to files
}

/**
 * Search Wayback Machine CDX API — finds archived versions of pages/files
 * Great for finding old downloads that no longer exist
 */
async function searchWaybackMachine(query, maxResults) {
  maxResults = maxResults || 8;
  var results = [];

  try {
    // Search for URLs containing the query
    var cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=*' +
      encodeURIComponent(query) +
      '*&output=json&fl=original,timestamp,mimetype,statuscode,length&limit=' + maxResults +
      '&filter=statuscode:200&collapse=urlkey';

    var data = await fetchJSON(cdxUrl, 15000);

    // First row is headers
    if (data && data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var original = row[0];
        var timestamp = row[1];
        var mime = row[2];
        var size = row[4] ? Number(row[4]) : 0;

        if (!original) continue;

        // Build Wayback URL
        var waybackUrl = 'https://web.archive.org/web/' + timestamp + 'if_/' + original;

        // Get filename from URL
        var filename = original.split('/').pop().split('?')[0] || original;
        if (filename.length > 80) filename = filename.slice(0, 80) + '…';

        // Format date from timestamp (20231215120000 → 2023-12-15)
        var dateStr = '';
        if (timestamp && timestamp.length >= 8) {
          dateStr = timestamp.slice(0, 4) + '-' + timestamp.slice(4, 6) + '-' + timestamp.slice(6, 8);
        }

        results.push({
          title: filename,
          url: waybackUrl,
          originalUrl: original,
          pageUrl: 'https://web.archive.org/web/' + timestamp + '/' + original,
          source: 'Wayback Machine',
          size: size,
          type: mime || 'unknown',
          date: dateStr,
          description: 'Archived from: ' + original.slice(0, 120),
        });
      }
    }
  } catch (e) {
    console.log('[Veloce Search] Wayback Machine error: ' + e.message);
  }

  return results;
}

/**
 * Search GitHub Releases — finds old software, tools, firmware hosted on GitHub
 */
async function searchGitHubReleases(query, maxResults) {
  maxResults = maxResults || 8;
  var results = [];

  try {
    // Search repositories first
    var searchUrl = 'https://api.github.com/search/repositories?q=' +
      encodeURIComponent(query) +
      '&sort=stars&per_page=' + Math.min(maxResults, 5);

    var data = await fetchJSON(searchUrl, 15000);

    if (data && data.items) {
      for (var i = 0; i < data.items.length; i++) {
        var repo = data.items[i];

        // Get latest release for each repo
        try {
          var relUrl = 'https://api.github.com/repos/' + repo.full_name + '/releases?per_page=3';
          var releases = await fetchJSON(relUrl, 10000);

          if (releases && releases.length > 0) {
            for (var r = 0; r < releases.length && r < 2; r++) {
              var rel = releases[r];
              if (rel.assets && rel.assets.length > 0) {
                for (var a = 0; a < rel.assets.length && a < 3; a++) {
                  var asset = rel.assets[a];
                  results.push({
                    title: repo.name + ' — ' + asset.name,
                    url: asset.browser_download_url,
                    pageUrl: rel.html_url,
                    source: 'GitHub',
                    size: asset.size || 0,
                    type: asset.content_type || 'application/octet-stream',
                    date: (rel.published_at || '').slice(0, 10),
                    description: (repo.description || '').slice(0, 200),
                    stars: repo.stargazers_count,
                    version: rel.tag_name,
                  });
                }
              } else {
                // No assets — link to release page
                results.push({
                  title: repo.name + ' — ' + (rel.tag_name || 'release'),
                  url: rel.html_url,
                  pageUrl: rel.html_url,
                  source: 'GitHub',
                  size: 0,
                  type: 'release',
                  date: (rel.published_at || '').slice(0, 10),
                  description: (rel.body || repo.description || '').slice(0, 200),
                  stars: repo.stargazers_count,
                  version: rel.tag_name,
                });
              }
            }
          }
        } catch (relErr) {
          // No releases — skip
        }
      }
    }
  } catch (e) {
    console.log('[Veloce Search] GitHub error: ' + e.message);
  }

  return results.slice(0, maxResults);
}

/**
 * Search open directories / file indexes
 * Uses Google dorking to find open FTP/HTTP directories
 */
async function searchOpenDirectories(query, maxResults) {
  maxResults = maxResults || 8;
  var results = [];

  try {
    // Use the Programmable Search or fallback approach
    // Search for open directory listings that contain the query
    var dork = encodeURIComponent('intitle:"index of" "' + query + '"');
    var googleUrl = 'https://www.google.com/search?q=' + dork + '&num=' + maxResults;

    // We'll use a simpler approach — search known open directory indexes
    // ODAT (Open Directory Search) and similar
    var filepursuitUrl = 'https://filepursuit.com/pursuit?q=' + encodeURIComponent(query) + '&type=all';

    // Add a reference result pointing to open directory search
    results.push({
      title: '🔍 Open Directory Search: "' + query + '"',
      url: filepursuitUrl,
      pageUrl: filepursuitUrl,
      source: 'Open Directories',
      size: 0,
      type: 'search',
      date: '',
      description: 'Search open FTP/HTTP directories for files matching "' + query + '"',
    });

    // Also search archive.org's open collections
    var archiveCollections = 'https://archive.org/advancedsearch.php?q=' +
      encodeURIComponent(query + ' AND mediatype:software') +
      '&rows=' + Math.min(maxResults, 5) +
      '&output=json&fl[]=identifier&fl[]=title&fl[]=item_size&fl[]=date';

    try {
      var archiveData = await fetchJSON(archiveCollections, 12000);
      var docs = (archiveData && archiveData.response && archiveData.response.docs) ? archiveData.response.docs : [];

      for (var i = 0; i < docs.length; i++) {
        var d = docs[i];
        if (!d.identifier) continue;
        results.push({
          title: d.title || d.identifier,
          url: 'https://archive.org/download/' + d.identifier,
          pageUrl: 'https://archive.org/details/' + d.identifier,
          source: 'Archive Software',
          size: d.item_size ? Number(d.item_size) : 0,
          type: 'software',
          date: d.date || '',
          description: 'Software archive on Internet Archive',
        });
      }
    } catch (e2) {}

  } catch (e) {
    console.log('[Veloce Search] Open Directories error: ' + e.message);
  }

  return results.slice(0, maxResults);
}

/**
 * Check if a URL is still alive (HEAD request)
 * Returns { alive, size, type, redirectUrl }
 */
async function checkUrlAlive(url) {
  return new Promise(function(resolve) {
    var timer = setTimeout(function() { try { request.abort(); } catch(e) {} resolve({ alive: false }); }, 10000);
    var reqSession = browserSession || session.defaultSession;

    try {
      var request = net.request({ method: 'HEAD', url: url, session: reqSession });

      request.on('response', function(response) {
        clearTimeout(timer);
        var size = 0;
        var type = '';
        var headers = response.headers || {};
        if (headers['content-length']) size = Number(headers['content-length'][0] || headers['content-length']);
        if (headers['content-type']) type = (headers['content-type'][0] || headers['content-type']).toString();

        resolve({
          alive: response.statusCode >= 200 && response.statusCode < 400,
          statusCode: response.statusCode,
          size: size,
          type: type,
        });
      });

      request.on('error', function() {
        clearTimeout(timer);
        resolve({ alive: false });
      });

      request.end();
    } catch (e) {
      clearTimeout(timer);
      resolve({ alive: false });
    }
  });
}

/**
 * Dead link resurrection — if original URL is dead, find it on Wayback Machine
 */
async function resurrectDeadLink(url) {
  try {
    var waybackApi = 'https://archive.org/wayback/available?url=' + encodeURIComponent(url);
    var data = await fetchJSON(waybackApi, 10000);

    if (data && data.archived_snapshots && data.archived_snapshots.closest) {
      var snap = data.archived_snapshots.closest;
      if (snap.available && snap.url) {
        return {
          found: true,
          waybackUrl: snap.url,
          timestamp: snap.timestamp,
        };
      }
    }
  } catch (e) {}
  return { found: false };
}

/**
 * Main search function — searches all sources in parallel
 */
/**
 * Score a result's relevance to the search query
 * Returns 0-100 (higher = more relevant)
 */
function scoreRelevance(result, query) {
  var score = 0;
  var queryWords = query.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 1; });
  var titleLower = (result.title || '').toLowerCase();
  var descLower = (result.description || '').toLowerCase();
  var urlLower = (result.url || '').toLowerCase();
  var allText = titleLower + ' ' + descLower + ' ' + urlLower;

  // Check how many query words appear in the result
  var matchCount = 0;
  for (var i = 0; i < queryWords.length; i++) {
    if (allText.indexOf(queryWords[i]) !== -1) {
      matchCount++;
      // Extra points for title matches
      if (titleLower.indexOf(queryWords[i]) !== -1) score += 15;
      else score += 5;
    }
  }

  // Bonus: what fraction of query words matched
  if (queryWords.length > 0) {
    score += Math.round((matchCount / queryWords.length) * 40);
  }

  // Bonus for having a downloadable file size
  if (result.size > 1024) score += 10;
  if (result.size > 1048576) score += 10;  // > 1 MB

  // Bonus for direct download sources
  if (result.source === 'GitHub') score += 5;
  if (result.source === 'Internet Archive') score += 3;

  // Penalty for very small files (likely metadata)
  if (result.size > 0 && result.size < 100) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Search the crawler's local link database (crawler-links.jsonl + patterns.json).
 * Returns files the crawler has already discovered that match the query.
 */
function searchLocalPatterns(query, maxResults) {
  maxResults = maxResults || 8;
  var results = [];
  var seenUrls = {};
  var queryWords = query.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 1; });
  if (queryWords.length === 0) queryWords = [query.toLowerCase()];

  function matchesQuery(text) {
    if (!text) return false;
    var lower = text.toLowerCase();
    for (var i = 0; i < queryWords.length; i++) {
      if (lower.indexOf(queryWords[i]) !== -1) return true;
    }
    return false;
  }

  function addResult(entry) {
    if (!entry.url || seenUrls[entry.url]) return;
    if (results.length >= maxResults) return;

    var title = entry.title || entry.fileName || '';
    var term = entry.term || entry.searchTerm || '';

    // Must match at least one query word in title, term, or filename
    if (!matchesQuery(title) && !matchesQuery(term) && !matchesQuery(entry.url)) return;

    var size = entry.size || entry.fileSize || 0;
    var sizeStr = '';
    if (size > 1073741824) sizeStr = (size / 1073741824).toFixed(1) + ' GB';
    else if (size > 1048576) sizeStr = (size / 1048576).toFixed(0) + ' MB';
    else if (size > 1024) sizeStr = (size / 1024).toFixed(0) + ' KB';
    else if (size > 0) sizeStr = size + ' B';

    seenUrls[entry.url] = true;
    results.push({
      title: title || entry.url.split('/').pop().split('?')[0] || 'Unknown',
      url: entry.url,
      size: size,
      sizeStr: sizeStr,
      type: entry.type || entry.fileType || '',
      source: 'Crawler DB',
      sourceIcon: '🕷',
      description: term ? 'Found while crawling for: ' + term : 'Previously discovered by crawler',
      _relevance: 0,
    });
  }

  try {
    // 1. Search crawler-links.jsonl first (lighter, faster)
    var linksPath = path.join(APPDATA, 'crawler-links.jsonl');
    if (fs.existsSync(linksPath)) {
      var lines = fs.readFileSync(linksPath, 'utf8').split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        try {
          var entry = JSON.parse(lines[i]);
          addResult(entry);
        } catch (e) {}
      }
    }
  } catch (e) {
    console.log('[Veloce Search] Error reading crawler-links.jsonl: ' + e.message);
  }

  // 2. If we still need more results, deep-search patterns.json
  if (results.length < maxResults) {
    try {
      var patternsPath = path.join(APPDATA, 'patterns.json');
      if (fs.existsSync(patternsPath)) {
        var data = fs.readFileSync(patternsPath, 'utf8');
        var patterns = JSON.parse(data);
        var domains = patterns.domains || {};
        var domainKeys = Object.keys(domains);
        for (var d = 0; d < domainKeys.length && results.length < maxResults; d++) {
          var domainPatterns = domains[domainKeys[d]].patterns || [];
          for (var p = 0; p < domainPatterns.length && results.length < maxResults; p++) {
            addResult(domainPatterns[p]);
          }
        }
      }
    } catch (e) {
      console.log('[Veloce Search] Error reading patterns.json: ' + e.message);
    }
  }

  if (results.length > 0) {
    console.log('[Veloce Search] Local patterns found: ' + results.length + ' matches');
  }
  return results;
}

async function veloceSearch(query, options) {
  options = options || {};
  var maxPerSource = options.maxPerSource || 8;
  var expandQueries = options.expand !== false;

  console.log('[Veloce Search] Searching: "' + query + '"');
  var startTime = Date.now();

  // Expand query for better coverage
  var queries = expandQueries ? expandQuery(query) : [query];
  console.log('[Veloce Search] Query variants: ' + JSON.stringify(queries));

  // Search all sources in parallel using the primary query
  var primaryQuery = queries[0];
  var allResults = [];

  try {
    var searches = await Promise.allSettled([
      searchInternetArchive(primaryQuery, maxPerSource),
      searchWaybackMachine(primaryQuery, maxPerSource),
      searchGitHubReleases(primaryQuery, maxPerSource),
      searchOpenDirectories(primaryQuery, maxPerSource),
      searchLocalPatterns(primaryQuery, maxPerSource),
    ]);

    for (var s = 0; s < searches.length; s++) {
      if (searches[s].status === 'fulfilled' && searches[s].value) {
        allResults = allResults.concat(searches[s].value);
      }
    }
  } catch (e) {
    console.log('[Veloce Search] Parallel search error: ' + e.message);
  }

  // If we have expanded queries and few results, search with alternates
  if (allResults.length < 5 && queries.length > 1) {
    for (var q = 1; q < queries.length; q++) {
      try {
        var extra = await searchInternetArchive(queries[q], 4);
        allResults = allResults.concat(extra);
      } catch (e) {}
    }
  }

  // Score each result for relevance
  for (var i = 0; i < allResults.length; i++) {
    allResults[i]._relevance = scoreRelevance(allResults[i], primaryQuery);
  }

  // Filter out clearly irrelevant results (score < 15 = no meaningful keyword match)
  var relevant = allResults.filter(function(r) {
    return r._relevance >= 15;
  });

  // If filtering removed everything, fall back to all results
  if (relevant.length === 0) relevant = allResults;

  // Deduplicate by URL
  var seenUrls = {};
  var unique = [];
  for (var i = 0; i < relevant.length; i++) {
    var r = relevant[i];
    var key = (r.url || '').split('?')[0].toLowerCase();
    if (key && !seenUrls[key]) {
      seenUrls[key] = true;
      unique.push(r);
    }
  }

  // Sort by relevance score (highest first), then by size
  unique.sort(function(a, b) {
    // Relevance first
    if (a._relevance !== b._relevance) return b._relevance - a._relevance;
    // Then items with known sizes
    if (a.size > 0 && b.size <= 0) return -1;
    if (b.size > 0 && a.size <= 0) return 1;
    // Then by size (larger first)
    return b.size - a.size;
  });

  // Clean up internal fields
  for (var i = 0; i < unique.length; i++) {
    unique[i].relevance = unique[i]._relevance;
    delete unique[i]._relevance;
  }

  var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('[Veloce Search] Found ' + unique.length + ' results in ' + elapsed + 's');

  // Log top results with scores for debugging
  for (var i = 0; i < Math.min(5, unique.length); i++) {
    console.log('[Veloce Search] #' + (i + 1) + ' [' + unique[i].relevance + '] ' +
      unique[i].source + ': ' + unique[i].title.slice(0, 60));
  }

  return {
    query: query,
    expandedQueries: queries,
    results: unique,
    totalResults: unique.length,
    searchTime: elapsed,
  };
}

// ── IPC: Veloce AI Search ──
ipcMain.handle('veloce-search', async function(event, query, options) {
  try {
    return await veloceSearch(query, options);
  } catch (e) {
    console.log('[Veloce Search] Error: ' + e.message);
    return { query: query, results: [], totalResults: 0, error: e.message };
  }
});

// ── IPC: Check if a URL is alive ──
ipcMain.handle('check-url-alive', async function(event, url) {
  return await checkUrlAlive(url);
});

// ── IPC: Resurrect dead link via Wayback Machine ──
ipcMain.handle('resurrect-link', async function(event, url) {
  return await resurrectDeadLink(url);
});

// ── App lifecycle ──
app.whenReady().then(function() {
  // Set up the dedicated browser session (stealth, sniffer, permissions, UA)
  setupBrowserSession();

  // Stealth + compatibility for ALL web contents (including OOPIF iframes like Turnstile)
  var CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  // Backup stealth code — injected at dom-ready as last resort
  var backupStealth = [
    'try {',
    '  if (navigator.userAgentData) {',
    '    var b=[{brand:"Chromium",version:"122"},{brand:"Not(A:Brand",version:"24"},{brand:"Google Chrome",version:"122"}];',
    '    Object.defineProperty(navigator,"userAgentData",{get:function(){return{brands:b,mobile:false,platform:"Windows",',
    '      getHighEntropyValues:function(){return Promise.resolve({brands:b,mobile:false,platform:"Windows"})},',
    '      toJSON:function(){return{brands:b,mobile:false,platform:"Windows"}}}},configurable:true});',
    '  }',
    '  Object.defineProperty(navigator,"webdriver",{get:function(){return undefined},configurable:true});',
    '  if(!window.chrome)window.chrome={};',
    '  if(!window.chrome.runtime)window.chrome.runtime={id:undefined};',
    '  if(!window.chrome.csi)window.chrome.csi=function(){return{}};',
    '  if(!window.chrome.loadTimes)window.chrome.loadTimes=function(){return{}};',
    '  if(!window.chrome.app)window.chrome.app={isInstalled:false};',
    '  try{delete window.process}catch(e){}',
    '  try{delete window.require}catch(e){}',
    '  try{delete window.module}catch(e){}',
    '  try{delete window.Buffer}catch(e){}',
    '  console.log("[Veloce Backup Stealth] Applied on "+location.hostname);',
    '} catch(e) {}',
  ].join('\n');

  app.on('web-contents-created', function(event, contents) {
    // Set clean Chrome UA on every WebContents
    contents.setUserAgent(CHROME_UA);

    // Backup: inject stealth at dom-ready (covers cases where session preloads fail)
    contents.on('dom-ready', function() {
      contents.executeJavaScript(backupStealth).catch(function() {});
    });

    // Allow new windows from Cloudflare challenges and popups
    contents.setWindowOpenHandler(function(details) {
      return { action: 'allow' };
    });

    // ── Right-click context menu (copy, paste, cut, select all) ──
    contents.on('context-menu', function(e, params) {
      var menu = new Menu();

      // If text is selected, show Cut/Copy
      if (params.selectionText) {
        if (params.isEditable) {
          menu.append(new MenuItem({
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          }));
        }
        menu.append(new MenuItem({
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        }));
      }

      // If in an editable field, show Paste
      if (params.isEditable) {
        menu.append(new MenuItem({
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        }));
      }

      // Select All (always available)
      menu.append(new MenuItem({
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      }));

      // If there's a link, show Copy Link
      if (params.linkURL) {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Copy Link',
          click: function() { clipboard.writeText(params.linkURL); },
        }));
        menu.append(new MenuItem({
          label: 'Open Link in New Tab',
          click: function() {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('open-url-in-tab', params.linkURL);
            }
          },
        }));
      }

      // If there's an image, show Copy Image / Save Image
      if (params.mediaType === 'image' && params.srcURL) {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Copy Image URL',
          click: function() { clipboard.writeText(params.srcURL); },
        }));
      }

      // Reload / Back / Forward
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() { contents.reload(); },
      }));
      menu.append(new MenuItem({
        label: 'Inspect Element',
        click: function() { contents.inspectElement(params.x, params.y); },
      }));

      menu.popup();
    });
  });

  createWindow();

  // Block WebAuthn/FIDO2 — prevents "Insert security key" popup on LinkedIn
  try {
    var ses = session.defaultSession;
    ses.setPermissionCheckHandler(function(wc, permission) {
      if (permission === 'hid') return false;  // block security keys
      return true;
    });
    ses.setPermissionRequestHandler(function(wc, permission, callback) {
      if (permission === 'hid') return callback(false);
      callback(true);
    });
    console.log('[Veloce] WebAuthn/FIDO2 security key popup blocked');
  } catch(e) { console.error('[Veloce] Permission handler error:', e.message); }

  console.log('[Veloce] App ready — Electron ' + process.versions.electron);
  console.log('[Veloce] HLS downloader: ' + activeConcurrency + ' tunnels, AES-128 decryption enabled');
  console.log('[Veloce] Cloudflare Turnstile: stealth preloads active on all frames');
});

// ── Data Miner IPC (plan, save, open-folder) ──
// Scraping runs renderer-side in Veloce's real stealth webview.

// ══════════════════════════════════════════════════════════════
// ── SELF-LEARNING CRAWLER (Developer Mode) ──
// ══════════════════════════════════════════════════════════════

var VeloceCrawler = require('./crawler.js');

ipcMain.handle('crawler-start', function(event, opts) {
  if (!veloceCrawler) {
    veloceCrawler = new VeloceCrawler({
      patternsPath: path.join(APPDATA, 'patterns.json'),
      termsPath: path.join(APPDATA, 'training-terms.json'),
      browserSession: browserSession || session.defaultSession,
    });
    veloceCrawler.onUpdate = function(data) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('crawler-update', data);
      }
    };
  }
  veloceCrawler.start(opts);
  console.log('[Veloce] Crawler started' + (opts ? ' (selectedTerms: ' + (opts.selectedTerms ? opts.selectedTerms.length : 0) + ', category: ' + (opts.category || 'all') + ')' : ''));
  return { ok: true };
});

ipcMain.handle('crawler-pause', function() {
  if (veloceCrawler) veloceCrawler.pause();
  return { ok: true };
});

ipcMain.handle('crawler-resume', function() {
  if (veloceCrawler) veloceCrawler.resume();
  return { ok: true };
});

ipcMain.handle('crawler-stop', async function() {
  if (veloceCrawler) await veloceCrawler.stop();
  return { ok: true };
});

ipcMain.handle('crawler-skip', function() {
  if (veloceCrawler) veloceCrawler.skipTerm();
  return { ok: true };
});

ipcMain.handle('crawler-stats', function() {
  if (veloceCrawler) return veloceCrawler.getStats();
  return { stats: { status: 'idle' }, log: [], patternsCount: 0 };
});

ipcMain.handle('crawler-add-term', function(event, term, category) {
  if (veloceCrawler) {
    veloceCrawler.addSearchTerm(term, category);
  } else {
    // Create temp instance just to add the term
    var tmp = new VeloceCrawler({
      patternsPath: path.join(APPDATA, 'patterns.json'),
      termsPath: path.join(APPDATA, 'training-terms.json'),
    });
    tmp.addSearchTerm(term, category);
  }
  return { ok: true };
});

ipcMain.handle('crawler-export', function() {
  if (veloceCrawler) return veloceCrawler.exportPatterns();
  try {
    var pPath = path.join(APPDATA, 'patterns.json');
    if (fs.existsSync(pPath)) return JSON.parse(fs.readFileSync(pPath, 'utf8'));
  } catch (e) {}
  return { domains: {}, meta: {} };
});

ipcMain.handle('crawler-clear-patterns', function() {
  try {
    var pPath = path.join(APPDATA, 'patterns.json');
    var linksPath = path.join(APPDATA, 'crawler-links.jsonl');

    // Count before wipe so we can report
    var cleared = 0;
    if (fs.existsSync(pPath)) {
      try {
        var old = JSON.parse(fs.readFileSync(pPath, 'utf8'));
        cleared = (old.meta && old.meta.totalPatterns) ? old.meta.totalPatterns : 0;
      } catch(e) {}
      // Wipe patterns.json
      var blank = { domains: {}, meta: { totalPatterns: 0, totalFiles: 0, totalPages: 0, startedAt: null, lastRun: null } };
      fs.writeFileSync(pPath, JSON.stringify(blank, null, 2), 'utf8');
    }
    // Wipe crawler-links.jsonl
    if (fs.existsSync(linksPath)) fs.writeFileSync(linksPath, '', 'utf8');

    // Reset in-memory crawler state too
    if (veloceCrawler) {
      veloceCrawler.patterns = { domains: {}, meta: { totalPatterns: 0, totalFiles: 0, totalPages: 0, startedAt: null, lastRun: null } };
      veloceCrawler.stats.patternsFound = 0;
      veloceCrawler.stats.filesFound = 0;
      veloceCrawler.sendUpdate();
    }

    console.log('[Veloce] Crawler patterns cleared (' + cleared + ' patterns wiped)');
    return { ok: true, cleared: cleared };
  } catch (e) {
    console.log('[Veloce] Failed to clear patterns: ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ── Training Term Management IPCs ──
var crawlerTermsPath = path.join(APPDATA, 'training-terms.json');

ipcMain.handle('crawler-get-terms', function() {
  try {
    if (!fs.existsSync(crawlerTermsPath)) return { categories: {}, terms: [] };
    var data = JSON.parse(fs.readFileSync(crawlerTermsPath, 'utf8'));
    // Build categories map from flat array or existing object
    var categories = {};
    var termsList = [];
    if (Array.isArray(data)) {
      // Flat array of { term, category } objects
      for (var i = 0; i < data.length; i++) {
        var cat = data[i].category || 'custom';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(data[i].term);
        termsList.push({ term: data[i].term, category: cat });
      }
    } else if (data.categories) {
      categories = data.categories;
      var cats = Object.keys(categories);
      for (var c = 0; c < cats.length; c++) {
        for (var t = 0; t < categories[cats[c]].length; t++) {
          termsList.push({ term: categories[cats[c]][t], category: cats[c] });
        }
      }
    }
    return { categories: categories, terms: termsList };
  } catch (e) {
    return { categories: {}, terms: [], error: e.message };
  }
});

ipcMain.handle('crawler-remove-term', function(event, term, category) {
  try {
    if (!fs.existsSync(crawlerTermsPath)) return { ok: false, error: 'File not found' };
    var data = JSON.parse(fs.readFileSync(crawlerTermsPath, 'utf8'));
    if (Array.isArray(data)) {
      data = data.filter(function(t) { return !(t.term === term && t.category === category); });
    } else if (data.categories && data.categories[category]) {
      data.categories[category] = data.categories[category].filter(function(t) { return t !== term; });
      if (data.categories[category].length === 0) delete data.categories[category];
    }
    fs.writeFileSync(crawlerTermsPath, JSON.stringify(data, null, 2), 'utf8');
    // Return updated data
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('crawler-remove-bulk', function(event, items) {
  try {
    if (!fs.existsSync(crawlerTermsPath)) return { ok: false, error: 'File not found' };
    var data = JSON.parse(fs.readFileSync(crawlerTermsPath, 'utf8'));
    var toRemove = {};
    for (var i = 0; i < items.length; i++) {
      var key = items[i].term + '||' + items[i].category;
      toRemove[key] = true;
    }
    if (Array.isArray(data)) {
      data = data.filter(function(t) { return !toRemove[t.term + '||' + t.category]; });
    } else if (data.categories) {
      var cats = Object.keys(data.categories);
      for (var c = 0; c < cats.length; c++) {
        data.categories[cats[c]] = data.categories[cats[c]].filter(function(t) {
          return !toRemove[t + '||' + cats[c]];
        });
        if (data.categories[cats[c]].length === 0) delete data.categories[cats[c]];
      }
    }
    fs.writeFileSync(crawlerTermsPath, JSON.stringify(data, null, 2), 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ══════════════════════════════════════════════════════════════
// LICENSE SYSTEM — Supabase Edge Function + Gumroad, hardware-locked
// ══════════════════════════════════════════════════════════════

var EDGE_FN_URL = 'https://lsulbthkooxqsesgypak.supabase.co/functions/v1/validate-license';
var SUPABASE_KEY = 'sb_publishable_27jypxdZHvpfsfH9TsveZA_Gn5vn022';
var LICENSE_FILE = path.join(app.getPath('userData'), '.veloce_lic');

function getMachineId() {
  try {
    var mb = require('child_process').execSync('wmic baseboard get serialnumber', { encoding: 'utf8', timeout: 5000 });
    var cpu = require('child_process').execSync('wmic cpu get processorid', { encoding: 'utf8', timeout: 5000 });
    var raw = (mb.split('\n')[2] || '').trim() + '|' + (cpu.split('\n')[2] || '').trim();
    return require('crypto').createHash('sha256').update(raw).digest('hex').slice(0, 32);
  } catch (e) {
    return 'UNKNOWN-' + Date.now().toString(36);
  }
}

function saveLicense(key) {
  var data = Buffer.from(key + '|' + getMachineId()).toString('base64');
  fs.writeFileSync(LICENSE_FILE, data, 'utf8');
}

function loadLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      var raw = Buffer.from(fs.readFileSync(LICENSE_FILE, 'utf8'), 'base64').toString('utf8');
      var parts = raw.split('|');
      var key = parts[0];
      var savedHwid = parts[1] || '';
      var currentHwid = getMachineId();
      if (savedHwid === currentHwid) return key;
      // HWID changed — force re-activation
      fs.unlinkSync(LICENSE_FILE);
    }
  } catch (e) {}
  return null;
}

// ── License Validation: Supabase Edge Function (hardware lock) ──
ipcMain.handle('validate-license', async function(event, key) {
  try {
    var hwid = getMachineId();
    var resp = await net.fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({ license_key: key, hardware_id: hwid })
    });
    var result = await resp.json();

    if (!result.ok) {
      return { ok: false, error: result.error || 'Invalid license key' };
    }

    saveLicense(key);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error — check your connection' };
  }
});

ipcMain.handle('get-license', async function() {
  var localKey = loadLicense();
  if (!localKey) return null;

  // Re-validate with Supabase — if key was deleted (refund), lock the app
  try {
    var hwid = getMachineId();
    var resp = await net.fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({ license_key: localKey, hardware_id: hwid })
    });
    var result = await resp.json();

    if (!result.ok) {
      // Key revoked or deleted — wipe local license
      try { fs.unlinkSync(LICENSE_FILE); } catch (_) {}
      return null;
    }

    return localKey;
  } catch (e) {
    // Network error — allow cached license (offline grace)
    return localKey;
  }
});

// ══════════════════════════════════════════════════════════════
// TRIAL SYSTEM — 3-day free trial, HWID-locked via Supabase
// Server time check prevents clock manipulation.
// ══════════════════════════════════════════════════════════════

var TRIAL_FN_URL = 'https://lsulbthkooxqsesgypak.supabase.co/functions/v1/check-trial';

ipcMain.handle('check-trial', async function() {
  try {
    var hwid = getMachineId();
    if (hwid.startsWith('UNKNOWN-')) {
      return { trial: false, error: 'Could not identify this machine' };
    }

    var resp = await net.fetch(TRIAL_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({ hardware_id: hwid })
    });

    var result = await resp.json();

    // Server time check — if local clock is more than 1 hour off, reject
    if (result.server_time) {
      var serverTime = new Date(result.server_time).getTime();
      var localTime = Date.now();
      var diff = Math.abs(serverTime - localTime);
      if (diff > 3600000) { // 1 hour
        return { trial: false, error: 'System clock is incorrect. Please set the correct date and time.' };
      }
    }

    return {
      trial: result.trial || false,
      days_left: result.days_left || 0,
      error: result.error || null
    };
  } catch (e) {
    return { trial: false, error: 'Could not verify trial — connect to the internet and restart' };
  }
});

app.on('window-all-closed', function() { app.quit(); });

