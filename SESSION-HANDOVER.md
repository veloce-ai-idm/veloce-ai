# SESSION HANDOVER — July 25, 2026 (Session 2)

## ⚠️ CRITICAL: DO NOT BREAK fmovies/Rumble
- fmovies and Rumble use **HLS tunnel downloader** (`downloadHLS` in main.js)
- They do NOT go through yt-dlp
- The HLS path is: built-in segment downloader with AES-128 decryption, 10 tunnels
- Do NOT touch the yt-dlp routing logic for these sites

---

## What Got Fixed Today

### 1. YouTube First-Load Auto-Refresh (WORKING ✅)
**Commit:** b8667dc
**File:** `renderer.src.js` — `detectYouTubeFormats()` + `_ytAutoRefreshed` global

**Problem:** Very first YouTube video after app launch doesn't have `ytInitialPlayerResponse` in the DOM. `executeJavaScript` returns `{"error":"no json"}` — even after polling for 15 seconds. But after refresh, it works instantly.

**Fix:** When extraction fails, auto-refresh the webview ONCE per URL. `_ytAutoRefreshed[cleanUrl]` prevents loops. The reloaded page has cached data → detection succeeds → popup appears. User sees "Loading YouTube player data..." briefly, then the page refreshes and popup appears.

### 2. Crawler Term Selection (WORKING ✅)
**Files:** `renderer.src.js` (start button), `crawler.js` (start function), `main.js` (IPC)

**Problem:** Tick marks on terms were only for bulk REMOVAL. Start button always crawled ALL terms in shuffled order — never just the ticked ones.

**Fix:** Start button now collects `.cw-term-check:checked` checkboxes and passes `{ selectedTerms: [...] }` to the crawler. If terms are ticked → crawl ONLY those. If nothing ticked → fall back to category filter (old behavior).

---

## What We TRIED But Didn't Work (YouTube)

### Decrypted URL Capture (IDM-style)
Tried to intercept `googlevideo.com/videoplayback` URLs via `onBeforeRequest` → `media-detected` IPC → capture decrypted signatures.

**Why it failed:** YouTube's adaptive formats (1080p, 720p, etc.) NO LONGER include `&itag=N` in the query string. The format is encoded in an opaque `id=o-...` parameter. Legacy format 18 (360p) still has itag= — but no one wants 360p. Newer formats can't be mapped to specific qualities from the URL alone.

---

## Crawler Problem — CURRENT STATE (BROKEN)

### What works:
- Term selection (tick terms, Start, crawls only those)
- Relevance filtering (skips pages unrelated to search term)
- CloakBrowser launch (C++ patched Chromium)
- Cloudflare auto-solver (detects + clicks Turnstile checkboxes)
- GitHub API search
- File scoring / download link detection

### What's broken:
**ALL search sources return garbage or nothing:**

| Source | Status | Why |
|--------|--------|-----|
| GitHub | Works | Returns repos, not software downloads |
| SourceForge | Broken | "Kaspersky Free 21" → "megalinter.mirror" (irrelevant) |
| archive.org | Removed | Always returned books/audio/CD-ROMs, not software |
| majorgeeks.com | Blocked | Returns 0 bytes |
| filehippo.com | No match | 185KB HTML loaded but regex doesn't match links |
| DuckDuckGo lite | Blocked | `robots: noindex, nofollow` meta tag |
| DuckDuckGo html | Blocked | Same — bot detection |
| DuckDuckGo JS (CloakBrowser) | Timeout | 15s timeout, no results |

**Root cause:** There's no working search engine. Without search, the crawler can't find pages to crawl. The relevance filter correctly rejects garbage, but then there's nothing left.

### What the crawler needs:
A search source that:
1. Actually returns software download pages for the search term
2. Doesn't block CloakBrowser/bots
3. Returns clean parseable HTML

### Ideas not yet tried:
- **Bing API** — Microsoft's search API, has a free tier
- **SearXNG** — public instances like `searx.be` return clean HTML without blocking
- **Direct site crawling** — maintain a hardcoded list of software archive sites and crawl their directory structures directly (bypass search entirely)
- **Yandex** — Russian search engine, less aggressive bot detection
- **Pre-built URL list** — use `crawler-links.jsonl` with manually seeded download URLs, crawler just visits + follows links

### Crawler files:
- `crawler.js` — engine (search, crawl, score, record)
- `crawler-links.jsonl` — lightweight link database
- `patterns.json` — full pattern database
- `training-terms.json` — search terms by category
- `renderer.src.js` — crawler UI (panel, terms tab, start/stop buttons)

---

## Git Folders (5 total)

All inside `VELOCE AI TUNNELING — WORKSPACE\`:

| Folder | Commit | What |
|--------|--------|------|
| **`git refresh YT auto`** | b8667dc | ★ LATEST — YouTube auto-refresh + term selection fix |
| `git master` | b30e3ab | YouTube detect + cancel fix + Route 3a + itag map |
| `git youtube-native-detection` | 6247bdf | YouTube DOM format detection + cancel fix |
| `git pre-youtube-fixes` | b634abe | Original state before any YouTube changes |

**To restore:** `cp "git <name>/file.js" file.js` from workspace root
**To see what's in each:** `cd "git <name>" && git log --oneline -1`

---

## Build Process

```
npm run build  →  node build.js
```

Steps:
1. Creates `build-staging/` (fresh disposable copy)
2. Copies readable files (HTML, CSS, JS utilities)
3. Obfuscates `renderer.src.js` → `renderer.js` (hidden UI logic)
4. Compiles `main.js` → `main.jsc` (V8 bytecode — tunnel logic, license, download engine hidden)
5. electron-builder packs `build-staging/` into `release/VELOCE AI IDM Setup 1.0.0.exe`
6. Installer: oneClick (no Next buttons), installs to `%LOCALAPPDATA%`

**Config:** `electron-builder.yml` (uses `oneClick: true`, `app: build-staging`, `output: release`)

---

## Known Gotchas

1. **fmovies/Rumble is HLS path** — do NOT route through yt-dlp
2. **renderer.src.js is the editable source** — index.html loads it, NOT renderer.js
3. **renderer.js is obfuscated** — edit renderer.src.js instead
4. **Deno must be installed** for yt-dlp YouTube downloads (`winget install DenoLand.Deno`)
5. **`npm start` for dev, `node build.js` for release build**
6. **AppData location:** `C:\Users\connie\AppData\Roaming\veloce-ai-idm30\`
7. **CloakBrowser** (`cloakbrowser ^0.4.1`) — C++ patched Chromium for stealth browsing
8. **AI Search reads from crawler DB** — `searchLocalPatterns()` in main.js reads `crawler-links.jsonl` + `patterns.json`
9. **Playwright-core** is a dependency but not directly required — might be unused
