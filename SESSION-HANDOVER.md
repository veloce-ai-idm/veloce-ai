# SESSION HANDOVER — July 25, 2026

## ⚠️ CRITICAL: DO NOT BREAK fmovies/Rumble
- fmovies and Rumble use **HLS tunnel downloader** (`downloadHLS` in main.js)
- They do NOT go through yt-dlp
- The HLS path is: built-in segment downloader with AES-128 decryption, 10 tunnels
- Do NOT touch the yt-dlp routing logic for these sites
- If you break fmovies, restore from git immediately

---

## What We Built Today

### 1. YouTube Native Format Detection (WORKING ✅)
**File:** `renderer.src.js` — `detectYouTubeFormats()` function

Reads `ytInitialPlayerResponse` directly from YouTube's page DOM when a video loads. No external requests. No bot detection risk. This is IDM-style detection.

**How it works:**
1. Page loads → `checkSmartVideoDetection()` detects YouTube URL
2. For YouTube: calls `detectYouTubeFormats()` (bypasses snifferEnabled check)
3. Executes JS in webview to find and extract `ytInitialPlayerResponse` JSON
4. Maps YouTube itags to human-readable formats (1080p, 720p, etc.)
5. Shows format picker popup

**YouTube itag → format mapping:** Lines 595-623 in renderer.src.js
- Legacy: 18=360p, 22=720p, 37=1080p (have raw URLs)
- Next-gen: 394-399 (144p-1080p), 242-244 (webm), 298-299 (60fps)
- Audio: 139,140,160,249,250,251

### 2. YouTube Format Downloads (uses yt-dlp + deno)
**Why we can't use direct URLs for HD:** YouTube's `ytInitialPlayerResponse` only contains raw URLs for legacy format 18 (360p with audio). All adaptive formats (1080p, 720p, etc.) have encrypted URLs — `f.url` is empty, `f.signatureCipher` is empty. For itag 18 (360p), the direct URL download path exists and works (Route 3a in main.js: `fetchWithBrowser()` with browser session).

The popup's click handler checks `window._youtubeDirectUrls` — if the clicked format has a stored direct URL, it uses `startDownload()`. Otherwise falls back to yt-dlp. In practice, only 360p takes the direct path; everything else goes through yt-dlp.

**deno IS required** for yt-dlp YouTube downloads. Without it, YouTube returns "Sign in to confirm you're not a bot."

### 3. Cancel Dialog Fix (WORKING ✅)
**Files:** `main.js`, `renderer.src.js`

Cancel no longer shows the "Open File / Open Folder" completion dialog. The `wasCancelled` check in main.js's yt-dlp close handler prevents `download-complete` from being sent when the download was canceled. All legitimate completions include `complete: true` flag.

### 4. Package.json Rebuilt
Added missing `build` section with `extraResources` (ffmpeg.exe, yt-dlp.exe, ytdlp_helper.py). Updated dependencies: `cloakbrowser ^0.4.1`, `playwright-core ^1.61.0`.

### 5. Other Fixes Applied
- `preload.js`: Copied from working old version (identical functionality, different line endings)
- `index.html`: Loads `renderer.src.js` (not renderer.js — that's obfuscated)
- `main.js`: `wasCancelled` check moved BEFORE tracking deletes (was checking after, always true)

---

## What We TRIED But Didn't Work

### Attempt 1: `webContents.downloadURL()` for YouTube
**IPC:** `youtube-direct-download` (line 2987 in main.js, exposed in preload.js)
Tried to download googlevideo.com URLs through the browser's `webContents.downloadURL()`. Got HTTP 403 — YouTube's pre-signed URLs are session-bound and can't be downloaded from a different context.

### Attempt 2: Re-wiring popup button handlers
Tried to replace the popup's click handlers with direct download handlers. Failed because `showSmartPopup()` attaches its own handlers synchronously, and the old handler kept winning the race. Switched to intercepting INSIDE the old handler instead (checking `window._youtubeDirectUrls` before calling yt-dlp).

### Attempt 3: Browser session HTTP for googlevideo.com
Added Route 3a in `start-download` handler: `fetchWithBrowser()` with browser session for googlevideo.com URLs. Works for itag 18 but adaptive formats don't have raw URLs.

---

## Git Branches / Folders

All 3 git clones live INSIDE the workspace:

```
VELOCE AI TUNNELING — WORKSPACE\
├── git master\                     ← Latest (commit 6247bdf)
│     YouTube native detection + cancel fix + package rebuild
│     This is TODAY'S WORK. Use this.
│
├── git youtube-native-detection\   ← Same as master (6247bdf)
│     Frozen copy of today's work. Don't edit.
│     Restore to master if you want to go back here.
│
├── git pre-youtube-fixes\          ← BEFORE any today edits (b634abe)
│     State from ~7 hours ago. No YouTube detection changes.
│     No cancel fix. No package rebuild. Original working state.
│
├── main.js, renderer.src.js, ...   ← Actual working files (master)
```

**To restore:** Copy files from the git folder back to workspace root
**To see what branch you're on:** `git log --oneline -1` inside each git folder

**Differences between the 3:**
| Folder | YouTube detect | Cancel fix | Package build | Safe to use? |
|--------|---------------|------------|---------------|-------------|
| git master | ✅ | ✅ | ✅ | YES — current |
| git youtube-native-detection | ✅ | ✅ | ✅ | YES — same as master |
| git pre-youtube-fixes | ❌ | ❌ | ❌ | YES — original |

---

## ⚠️ Known Gotchas for Next Session

1. **fmovies/Rumble is HLS path** — do NOT route through yt-dlp
2. **renderer.src.js is the editable source** — index.html loads it, NOT renderer.js
3. **renderer.js is obfuscated** — edit renderer.src.js instead
4. **`main.js.kimi-broken`** is a backup of the broken state — don't use it
5. **Deno must be installed** for yt-dlp YouTube downloads (`winget install DenoLand.Deno`)
6. **`window._youtubeDirectUrls`** is the global map of format IDs → direct URLs
7. **The `ytDebug` IPC** can be used to debug renderer-side state in main process logs
8. **`npm start` for dev, `node build.js` for release build**
9. **AppData location:** `C:\Users\connie\AppData\Roaming\veloce-ai-idm30\`
