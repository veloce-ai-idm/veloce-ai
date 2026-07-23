/**
 * VELOCE AI — Self-Learning Crawler Engine
 *
 * Crawls download sites, learns where files are hidden, saves patterns.
 * Developer-only feature — not shipped to customers.
 *
 * How it works:
 *  1. Picks a search term from training-terms.json
 *  2. Searches Archive.org, GitHub, SourceForge, open directories
 *  3. Visits each result page
 *  4. Scans for download links (direct files, hidden behind buttons/links)
 *  5. Follows promising links deeper (up to 3 levels)
 *  6. Records successful patterns: "on this domain, this CSS selector/text leads to files"
 *  7. Saves patterns to patterns.json
 *  8. Moves to next search term
 */

'use strict';

const { net, session } = require('electron');
const fs = require('fs');
const path = require('path');

// ── File extensions we're looking for ──
const DOWNLOAD_EXTENSIONS = [
  '.exe', '.msi', '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  '.iso', '.img', '.dmg', '.pkg', '.deb', '.rpm', '.appimage',
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mpg', '.mpeg',
  '.mp3', '.flac', '.wav', '.ogg', '.aac', '.wma', '.m4a',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.apk', '.ipa', '.bin', '.rom', '.fw', '.update',
  '.torrent',
];

// ── Keywords that suggest a link leads to downloads ──
const DOWNLOAD_KEYWORDS = [
  'download', 'download now', 'direct download', 'free download',
  'get file', 'get it', 'grab', 'mirror',
  'show all', 'showall', 'view all', 'view contents', 'view files',
  'see all', 'see files', 'all files', 'file list', 'files list',
  'click here to download', 'click to download',
  'latest version', 'stable release', 'release notes',
  'assets', 'releases', 'tags',
  'source code', 'binary', 'binaries', 'installer', 'portable',
  'full version', 'setup', 'install',
  'expand', 'more', 'show more', 'load more',
];

// ── URL patterns that often lead to download pages ──
const DOWNLOAD_URL_PATTERNS = [
  '/download/', '/downloads/', '/files/', '/release/',
  '/releases/', '/get/', '/fetch/', '/mirror/',
  '/dl/', '/d/', '/file/', '/archive/',
  'sourceforge.net/projects/', '/files/latest/download',
  'github.com/', '/releases/tag/', '/releases/download/',
  'archive.org/download/', 'archive.org/details/',
];

// ── Domains to skip (waste of time) ──
const SKIP_DOMAINS = [
  'google.com', 'facebook.com', 'twitter.com', 'youtube.com',
  'instagram.com', 'tiktok.com', 'reddit.com', 'linkedin.com',
  'amazon.com', 'ebay.com', 'wikipedia.org',
  'bing.com', 'yahoo.com', 'duckduckgo.com',
  'cloudflare.com', 'googleapis.com', 'gstatic.com',
];

class VeloceCrawler {
  constructor(options) {
    this.patternsPath = options.patternsPath || path.join(__dirname, 'patterns.json');
    this.termsPath = options.termsPath || path.join(__dirname, 'training-terms.json');
    this.browserSession = options.browserSession || null;

    // State
    this.running = false;
    this.paused = false;
    this.patterns = { domains: {}, meta: { totalPatterns: 0, totalPages: 0, totalFiles: 0, startedAt: null, lastRun: null } };
    this.stats = {
      sitesVisited: 0,
      pagesVisited: 0,
      patternsFound: 0,
      filesFound: 0,
      errors: 0,
      currentTerm: '',
      currentUrl: '',
      currentCategory: '',
      termIndex: 0,
      totalTerms: 0,
      startTime: null,
      status: 'idle',  // idle, running, paused, stopped
    };
    this.log = [];  // Recent log entries for the dashboard
    this.maxLogEntries = 200;
    this.onUpdate = null;  // Callback to send updates to renderer
    this.crawlDelay = 2000;  // ms between page visits (be polite)
    this.maxDepth = 3;  // max link depth to follow
    this.pageTimeout = 15000;  // 15s per page fetch
    this.visitedUrls = new Set();  // Avoid revisiting
    this.sessionVisited = 0;
    this.cloakBrowser = null;      // CloakBrowser instance (replaces Python crawl4ai)

    this.loadPatterns();
  }

  // ── Load saved patterns from disk ──
  loadPatterns() {
    try {
      if (fs.existsSync(this.patternsPath)) {
        var data = fs.readFileSync(this.patternsPath, 'utf8');
        this.patterns = JSON.parse(data);
        this.stats.patternsFound = this.patterns.meta.totalPatterns || 0;
        this.stats.filesFound = this.patterns.meta.totalFiles || 0;
        this.addLog('info', 'Loaded ' + this.stats.patternsFound + ' patterns from database');
      }
    } catch (e) {
      this.addLog('error', 'Failed to load patterns: ' + e.message);
    }
  }

  // ── Save patterns to disk ──
  savePatterns() {
    try {
      this.patterns.meta.lastRun = new Date().toISOString();
      this.patterns.meta.totalPatterns = this.stats.patternsFound;
      this.patterns.meta.totalFiles = this.stats.filesFound;
      fs.writeFileSync(this.patternsPath, JSON.stringify(this.patterns, null, 2), 'utf8');
    } catch (e) {
      this.addLog('error', 'Failed to save patterns: ' + e.message);
    }
  }

  // ── Load training terms ──
  loadTerms(categoryFilter) {
    try {
      var data = fs.readFileSync(this.termsPath, 'utf8');
      var terms = JSON.parse(data);
      var allTerms = [];
      var categories = terms.categories || {};
      for (var cat in categories) {
        if (categoryFilter && categoryFilter !== '__all__' && cat !== categoryFilter) continue;
        var items = categories[cat];
        for (var i = 0; i < items.length; i++) {
          allTerms.push({ term: items[i], category: cat });
        }
      }
      return allTerms;
    } catch (e) {
      this.addLog('error', 'Failed to load training terms: ' + e.message);
      return [];
    }
  }

  // ── Add log entry ──
  addLog(type, message) {
    var entry = {
      time: new Date().toISOString(),
      type: type,  // info, success, error, warning, found
      message: message,
    };
    this.log.unshift(entry);
    if (this.log.length > this.maxLogEntries) this.log.pop();

    // Console output for developer
    var prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'found' ? '★' : type === 'warning' ? '⚠' : '·';
    console.log('[Veloce Crawler] ' + prefix + ' ' + message);
  }

  // ── Send status update to renderer ──
  sendUpdate() {
    if (this.onUpdate) {
      this.onUpdate({
        stats: Object.assign({}, this.stats),
        log: this.log.slice(0, 50),
        patternsCount: Object.keys(this.patterns.domains).length,
      });
    }
  }

  // ── Stealth fetch via CloakBrowser (C++-patched Chromium — bypasses bot detection) ──
  async fetchPageStealth(url) {
    var self = this;

    // Lazy-launch CloakBrowser on first use
    if (!self.cloakBrowser) {
      self.addLog('info', 'Starting CloakBrowser stealth engine...');
      try {
        var { launch } = await import('cloakbrowser');
        self.cloakBrowser = await launch({ headless: true });
        self.addLog('success', 'CloakBrowser ready');
      } catch (e) {
        self.addLog('error', 'CloakBrowser launch failed: ' + e.message.slice(0, 60));
        throw e;
      }
    }

    var page = await self.cloakBrowser.newPage();
    try {
      var response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: self.pageTimeout,
      });

      var html = await page.content();
      var links = await page.evaluate(function() {
        var found = [];
        var seen = {};

        function add(url) {
          if (url && !seen[url] && typeof url === 'string' && url.length > 1 &&
              !url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
            seen[url] = true;
            found.push(url);
          }
        }

        // 1. Standard <a href> links
        Array.from(document.querySelectorAll('a[href]')).forEach(function(a) { add(a.href); });

        // 2. data-* attributes that hide URLs
        Array.from(document.querySelectorAll('[data-url]')).forEach(function(el) { add(el.getAttribute('data-url')); });
        Array.from(document.querySelectorAll('[data-download]')).forEach(function(el) { add(el.getAttribute('data-download')); });
        Array.from(document.querySelectorAll('[data-href]')).forEach(function(el) { add(el.getAttribute('data-href')); });
        Array.from(document.querySelectorAll('[data-link]')).forEach(function(el) { add(el.getAttribute('data-link')); });

        // 3. onclick handlers containing URLs
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var oc = all[i].getAttribute('onclick');
          if (oc) {
            var m = oc.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = oc.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = oc.match(/location\s*=\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = oc.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
          }
        }

        // 4. Form action URLs
        Array.from(document.querySelectorAll('form[action]')).forEach(function(f) {
          var action = f.getAttribute('action');
          if (action && action !== '#' && !action.startsWith('javascript:')) {
            add(action);
          }
        });

        // 5. Buttons/inputs that trigger downloads
        Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).forEach(function(el) {
          var onclick = el.getAttribute('onclick');
          if (onclick) {
            var m = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = onclick.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = onclick.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
          }
          var dataUrl = el.getAttribute('data-url') || el.getAttribute('data-download') || el.getAttribute('data-href');
          if (dataUrl) add(dataUrl);
        });

        return found;
      });

      // ── Interact with page to reveal hidden download links ──
      try {
        await page.evaluate(function() {
          var clickTargets = document.querySelectorAll(
            'a, button, span, div, input[type="button"], input[type="submit"]'
          );
          var clicked = 0;
          for (var i = 0; i < clickTargets.length && clicked < 8; i++) {
            var el = clickTargets[i];
            var text = (el.textContent || '').toLowerCase().trim();
            var isDownloadBtn =
              text === 'download' || text === 'download now' || text === 'direct download' ||
              text === 'get it' || text === 'grab' || text === 'show all' || text === 'view all' ||
              text === 'show mirrors' || text === 'mirrors' || text === 'more' ||
              text === 'expand' || text === 'show files' || text === 'view files' ||
              text === 'all downloads' || text === 'show download links' ||
              text === 'latest version' || text === 'download latest';
            var cls = (el.className || '').toString().toLowerCase();
            var id = (el.id || '').toLowerCase();
            var isDownloadClass =
              cls.includes('download') || cls.includes('btn-dl') || cls.includes('mirror') ||
              id.includes('download') || id.includes('btn-dl') || id.includes('mirror') ||
              cls.includes('show-all') || cls.includes('view-all');
            if ((isDownloadBtn || isDownloadClass) && el.offsetParent !== null) {
              try { el.click(); clicked++; } catch(e) {}
            }
          }
        });
        await new Promise(function(r) { setTimeout(r, 2000); });
        // Re-collect after interaction
        var linksAfterClick = await page.evaluate(function() {
          var found = [];
          var seen = {};
          function add(url) {
            if (url && !seen[url] && typeof url === 'string' && url.length > 1 &&
                !url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
              seen[url] = true;
              found.push(url);
            }
          }
          Array.from(document.querySelectorAll('a[href]')).forEach(function(a) { add(a.href); });
          Array.from(document.querySelectorAll('[data-url]')).forEach(function(el) { add(el.getAttribute('data-url')); });
          Array.from(document.querySelectorAll('[data-download]')).forEach(function(el) { add(el.getAttribute('data-download')); });
          Array.from(document.querySelectorAll('[data-href]')).forEach(function(el) { add(el.getAttribute('data-href')); });
          Array.from(document.querySelectorAll('[data-link]')).forEach(function(el) { add(el.getAttribute('data-link')); });
          return found;
        });
        if (linksAfterClick && linksAfterClick.length > 0) {
          var seenUrls = {};
          for (var li = 0; li < links.length; li++) { seenUrls[links[li]] = true; }
          for (var lj = 0; lj < linksAfterClick.length; lj++) {
            if (!seenUrls[linksAfterClick[lj]]) {
              links.push(linksAfterClick[lj]);
            }
          }
        }
        html = await page.content();
      } catch (e) {
        // Silent — interaction is best-effort
      }

      var ct = response ? (response.headers()['content-type'] || 'text/html') : 'text/html';
      var status = response ? response.status() : 200;

      return {
        url: url,
        finalUrl: page.url(),
        status: status,
        contentType: ct,
        body: html,
        size: html.length,
        headers: {},
        links: links,
      };
    } catch (e) {
      self.addLog('error', 'CloakBrowser fetch error: ' + e.message.slice(0, 60));
      throw e;
    } finally {
      await page.close().catch(function() {});
    }
  }

  // ── Fetch a URL: CloakBrowser for JS-rendered sites, plain net for open APIs ──
  async fetchPage(url, timeoutMs) {
    var self = this;
    var timeout = timeoutMs || self.pageTimeout;

    // Open APIs don't need a browser — fast plain fetch
    var isOpenApi = url.includes('api.github.com') ||
      url.includes('archive.org/advancedsearch') ||
      url.includes('sourceforge.net/directory');

    if (!isOpenApi) {
      try {
        var stealthResult = await self.fetchPageStealth(url);
        if (stealthResult && stealthResult.body && stealthResult.body.length > 100) {
          return stealthResult;
        }
      } catch(e) {
        self.addLog('info', '⚠ Stealth failed (' + e.message.slice(0, 50) + '), using plain fetch...');
      }
    }

    // Plain Electron net (APIs + fallback for open sites)
    return new Promise(function(resolve, reject) {
      try {
        var options = { method: 'GET', url: url };
        if (self.browserSession) options.session = self.browserSession;
        var request = net.request(options);
        var body = [];
        var timer = setTimeout(function() { request.abort(); reject(new Error('Timeout')); }, timeout);
        request.on('response', function(response) {
          if (response.statusCode >= 300 && response.statusCode < 400) {
            clearTimeout(timer);
            var loc = response.headers['location'];
            if (loc) {
              var redir = Array.isArray(loc) ? loc[0] : loc;
              if (redir.startsWith('/')) { try { redir = new URL(redir, url).href; } catch(e) {} }
              self.fetchPage(redir, timeout).then(resolve).catch(reject);
            } else { reject(new Error('Redirect without location')); }
            return;
          }
          response.on('data', function(chunk) { body.push(chunk); });
          response.on('end', function() {
            clearTimeout(timer);
            var buf = Buffer.concat(body);
            var ct = response.headers['content-type'] || '';
            ct = Array.isArray(ct) ? ct[0] : ct;
            resolve({ url: url, status: response.statusCode, contentType: ct, body: buf.toString('utf8'), size: buf.length, headers: response.headers });
          });
        });
        request.on('error', function(err) { clearTimeout(timer); reject(err); });
        request.end();
      } catch(e) { reject(e); }
    });
  }

  // ── Extract all links from HTML (href, onclick, data-*, forms) ──
  extractLinks(html, baseUrl) {
    var links = [];
    var seen = new Set();
    var htmlLower = html.toLowerCase();

    function resolveUrl(raw) {
      try { return new URL(raw, baseUrl).href; } catch (e) { return null; }
    }

    function addLink(raw, linkText, source) {
      if (!raw || raw.startsWith('#') || raw.startsWith('javascript:') || raw.startsWith('mailto:')) return;
      var fullUrl = resolveUrl(raw);
      if (!fullUrl || seen.has(fullUrl)) return;
      seen.add(fullUrl);

      var score = 0;
      var reasons = [];
      var urlLower = fullUrl.toLowerCase();

      for (var i = 0; i < DOWNLOAD_EXTENSIONS.length; i++) {
        if (urlLower.endsWith(DOWNLOAD_EXTENSIONS[i])) { score += 10; reasons.push('ext:' + DOWNLOAD_EXTENSIONS[i]); break; }
      }
      for (var i = 0; i < DOWNLOAD_URL_PATTERNS.length; i++) {
        if (urlLower.includes(DOWNLOAD_URL_PATTERNS[i])) { score += 5; reasons.push('path:' + DOWNLOAD_URL_PATTERNS[i]); break; }
      }
      // Check link text for download keywords
      var ctx = (linkText || '').toLowerCase();
      for (var i = 0; i < DOWNLOAD_KEYWORDS.length; i++) {
        if (ctx.includes(DOWNLOAD_KEYWORDS[i])) { score += 3; reasons.push('text:' + DOWNLOAD_KEYWORDS[i]); break; }
      }
      // Bonus for hidden/form/discovered links — they're often the real downloads
      if (source === 'onclick' || source === 'data-attrib' || source === 'form') { score += 2; }
      if (source === 'button') { score += 3; }

      if (score > 0 || linkText) {
        links.push({ url: fullUrl, text: linkText || '', score: score, reasons: reasons, isDirectFile: score >= 10 });
      }
    }

    // 1. Standard <a href> links
    var hrefRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]{0,100})/gi;
    var match;
    while ((match = hrefRegex.exec(html)) !== null) {
      addLink(match[1].trim(), match[2].trim(), 'href');
    }
    // Also catch href values around any tag
    var hrefAnyRegex = /href\s*=\s*["']([^"']+)["']/gi;
    while ((match = hrefAnyRegex.exec(html)) !== null) {
      addLink(match[1].trim(), '', 'href');
    }

    // 2. data-* attributes that hide URLs
    var dataAttrs = ['data-url', 'data-download', 'data-href', 'data-link'];
    for (var d = 0; d < dataAttrs.length; d++) {
      var daRegex = new RegExp(dataAttrs[d] + '\\s*=\\s*["\']([^"\']+)["\']', 'gi');
      while ((match = daRegex.exec(html)) !== null) {
        addLink(match[1].trim(), '', 'data-attrib');
      }
    }

    // 3. onclick handlers containing URLs
    var onclickRegex = /onclick\s*=\s*["']([^"']{0,500})["']/gi;
    while ((match = onclickRegex.exec(html)) !== null) {
      var oc = match[1];
      var m = oc.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (m) addLink(m[1], '', 'onclick');
      m = oc.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
      if (m) addLink(m[1], '', 'onclick');
      m = oc.match(/location\s*=\s*['"]([^'"]+)['"]/);
      if (m) addLink(m[1], '', 'onclick');
      m = oc.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
      if (m) addLink(m[1], '', 'onclick');
    }

    // 4. Form action URLs
    var formRegex = /<form\s[^>]*action\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((match = formRegex.exec(html)) !== null) {
      addLink(match[1].trim(), '', 'form');
    }

    // 5. Buttons/inputs with onclick URLs
    var btnRegex = /<(?:button|input)\s[^>]*onclick\s*=\s*["']([^"']{0,500})["'][^>]*>/gi;
    while ((match = btnRegex.exec(html)) !== null) {
      var boc = match[1];
      var bm = boc.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (bm) addLink(bm[1], '', 'button');
      bm = boc.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
      if (bm) addLink(bm[1], '', 'button');
      bm = boc.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
      if (bm) addLink(bm[1], '', 'button');
    }
    // Also: buttons/inputs with data-* download URLs
    var btnDataRegex = /<(?:button|input)\s[^>]*(?:data-url|data-download|data-href)\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((match = btnDataRegex.exec(html)) !== null) {
      addLink(match[1].trim(), '', 'button');
    }

    links.sort(function(a, b) { return b.score - a.score; });
    return links;
  }

  // ── Check if a URL points to a downloadable file (HEAD request) ──
  async checkIfFile(url) {
    try {
      var self = this;
      return new Promise(function(resolve, reject) {
        var options = { method: 'HEAD', url: url };
        if (self.browserSession) options.session = self.browserSession;

        var request = net.request(options);
        var timer = setTimeout(function() {
          request.abort();
          resolve(null);
        }, 8000);

        request.on('response', function(response) {
          clearTimeout(timer);
          var ct = response.headers['content-type'];
          ct = ct ? (Array.isArray(ct) ? ct[0] : ct) : '';
          var cl = response.headers['content-length'];
          var size = cl ? parseInt(Array.isArray(cl) ? cl[0] : cl) : 0;

          // Is it a binary/download file?
          var isFile = ct.includes('octet-stream') || ct.includes('application/zip') ||
            ct.includes('application/x-') || ct.includes('application/pdf') ||
            ct.includes('audio/') || ct.includes('video/') ||
            ct.includes('application/gzip') || ct.includes('application/rar') ||
            size > 100000;  // >100KB is probably a file

          resolve(isFile ? { size: size, type: ct } : null);
        });

        request.on('error', function() {
          clearTimeout(timer);
          resolve(null);
        });

        request.end();
      });
    } catch (e) {
      return null;
    }
  }

  // ── Get domain from URL ──
  getDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  // ── Save a discovered pattern ──
  recordPattern(domain, pattern) {
    if (!this.patterns.domains[domain]) {
      this.patterns.domains[domain] = { patterns: [], filesFound: 0, pagesVisited: 0 };
    }

    var domainData = this.patterns.domains[domain];

    // Check if we already have this pattern
    var isDuplicate = false;
    for (var i = 0; i < domainData.patterns.length; i++) {
      var existing = domainData.patterns[i];
      if (existing.fileUrl === pattern.fileUrl) {
        isDuplicate = true;
        existing.hitCount = (existing.hitCount || 1) + 1;
        existing.lastSeen = new Date().toISOString();
        break;
      }
    }

    if (!isDuplicate) {
      domainData.patterns.push({
        searchTerm: pattern.searchTerm,
        pageUrl: pattern.pageUrl,
        fileUrl: pattern.fileUrl,
        fileName: pattern.fileName || '',
        fileSize: pattern.fileSize || 0,
        fileType: pattern.fileType || '',
        linkText: pattern.linkText || '',
        depth: pattern.depth || 0,
        pathPattern: pattern.pathPattern || '',
        hitCount: 1,
        discoveredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
      domainData.filesFound++;
      this.stats.patternsFound++;
      this.stats.filesFound++;
    }

    domainData.pagesVisited++;

    // Auto-save every 10 new patterns
    if (this.stats.patternsFound % 10 === 0) {
      this.savePatterns();
    }

    // Also append to crawler-links.jsonl so AI Search can find it
    try {
      var linksPath = path.join(path.dirname(this.patternsPath), 'crawler-links.jsonl');
      var linkEntry = JSON.stringify({
        url: pattern.fileUrl,
        title: pattern.fileName || '',
        size: pattern.fileSize || 0,
        type: pattern.fileType || '',
        term: pattern.searchTerm || '',
        date: new Date().toISOString().split('T')[0],
      });
      fs.appendFileSync(linksPath, linkEntry + '\n', 'utf8');
    } catch (e) {
      // Silent — don't break crawling for logging failures
    }
  }

  // ── Extract path pattern from URL (for learning) ──
  getPathPattern(url) {
    try {
      var parsed = new URL(url);
      // Replace specific IDs/filenames with wildcards
      var pathParts = parsed.pathname.split('/').filter(function(p) { return p.length > 0; });
      return '/' + pathParts.map(function(part) {
        // Keep meaningful path segments, wildcard specifics
        if (part.match(/^[a-f0-9]{8,}$/i)) return '{id}';
        if (part.match(/^\d{5,}$/)) return '{num}';
        return part;
      }).join('/');
    } catch (e) {
      return '';
    }
  }

  // ── Crawl a single page and its links ──
  async crawlPage(url, searchTerm, depth) {
    if (depth > this.maxDepth) return;
    if (this.visitedUrls.has(url)) return;
    if (!this.running || this.paused) return;

    this.visitedUrls.add(url);
    this.stats.pagesVisited++;
    this.stats.currentUrl = url;
    this.sessionVisited++;

    var domain = this.getDomain(url);

    // Skip bad domains
    for (var i = 0; i < SKIP_DOMAINS.length; i++) {
      if (domain.includes(SKIP_DOMAINS[i])) return;
    }

    this.addLog('info', (depth > 0 ? '  '.repeat(depth) + '↳ ' : '') + 'Visiting: ' + url.slice(0, 100));
    this.sendUpdate();

    try {
      var page = await this.fetchPage(url);

      if (!page || page.status >= 400) {
        this.addLog('warning', 'HTTP ' + (page ? page.status : 'error') + ': ' + url.slice(0, 80));
        this.stats.errors++;
        return;
      }

      // Is this page itself a file download? (not HTML)
      if (page.contentType && !page.contentType.includes('html') && !page.contentType.includes('text')) {
        if (page.size > 50000) {
          var fileName = url.split('/').pop().split('?')[0];
          this.addLog('found', 'Direct file: ' + fileName + ' (' + (page.size / 1048576).toFixed(1) + ' MB)');
          this.recordPattern(domain, {
            searchTerm: searchTerm,
            pageUrl: url,
            fileUrl: url,
            fileName: fileName,
            fileSize: page.size,
            fileType: page.contentType,
            depth: depth,
            pathPattern: this.getPathPattern(url),
          });
          return;
        }
      }

      // Use pre-extracted links from CloakBrowser if available, else parse HTML
      var links = [];
      if (page.links && page.links.length > 0) {
        // CloakBrowser already extracted links — score them using the original logic
        var seen = new Set();
        for (var li = 0; li < page.links.length; li++) {
          var href = page.links[li];
          if (!href || seen.has(href)) continue;
          seen.add(href);
          var fullUrl;
          try { fullUrl = new URL(href, url).href; } catch(e) { continue; }
          var urlLower = fullUrl.toLowerCase();
          var score = 0;
          var reasons = [];
          for (var ei = 0; ei < DOWNLOAD_EXTENSIONS.length; ei++) {
            if (urlLower.endsWith(DOWNLOAD_EXTENSIONS[ei])) { score += 10; reasons.push('ext:' + DOWNLOAD_EXTENSIONS[ei]); break; }
          }
          for (var pi = 0; pi < DOWNLOAD_URL_PATTERNS.length; pi++) {
            if (urlLower.includes(DOWNLOAD_URL_PATTERNS[pi])) { score += 5; reasons.push('path:' + DOWNLOAD_URL_PATTERNS[pi]); break; }
          }
          // Check link text in page body for keywords
          var ltext = '';
          for (var ki = 0; ki < DOWNLOAD_KEYWORDS.length; ki++) {
            if (page.body && page.body.toLowerCase().includes(DOWNLOAD_KEYWORDS[ki])) { score += 2; ltext = DOWNLOAD_KEYWORDS[ki]; break; }
          }
          if (score > 0) {
            links.push({ url: fullUrl, text: ltext, score: score, reasons: reasons, isDirectFile: score >= 10 });
          }
        }
        links.sort(function(a, b) { return b.score - a.score; });
      } else {
        // Fallback: parse HTML body with original extractLinks
        links = this.extractLinks(page.body, url);
      }
      this.addLog('info', 'Found ' + links.length + ' scored links on page');

      // Process direct file links first
      var directFiles = links.filter(function(l) { return l.isDirectFile; });
      var promiseLinks = links.filter(function(l) { return !l.isDirectFile && l.score >= 3; });

      // Record direct file links
      for (var i = 0; i < directFiles.length && i < 20; i++) {
        var link = directFiles[i];
        if (!this.running || this.paused) return;

        // Verify it's actually a file
        var fileInfo = await this.checkIfFile(link.url);
        if (fileInfo) {
          var fName = link.url.split('/').pop().split('?')[0];
          var fSizeMB = fileInfo.size > 0 ? (fileInfo.size / 1048576).toFixed(1) + ' MB' : 'unknown size';
          this.addLog('found', '★ ' + fName + ' (' + fSizeMB + ') via "' + (link.text || 'direct').slice(0, 30) + '"');

          this.recordPattern(domain, {
            searchTerm: searchTerm,
            pageUrl: url,
            fileUrl: link.url,
            fileName: fName,
            fileSize: fileInfo.size,
            fileType: fileInfo.type,
            linkText: link.text,
            depth: depth,
            pathPattern: this.getPathPattern(link.url),
          });
        }

        // Small delay between HEAD checks
        await this.sleep(500);
      }

      // Follow promising non-file links deeper
      for (var i = 0; i < promiseLinks.length && i < 5; i++) {
        if (!this.running || this.paused) return;
        await this.sleep(this.crawlDelay);
        await this.crawlPage(promiseLinks[i].url, searchTerm, depth + 1);
      }

    } catch (e) {
      this.addLog('error', 'Crawl error: ' + e.message.slice(0, 80));
      this.stats.errors++;
    }
  }

  // ── Search Archive.org for a term ──
  async searchArchiveOrg(term) {
    var encoded = encodeURIComponent(term);
    var url = 'https://archive.org/advancedsearch.php?q=' + encoded +
      '&fl[]=identifier&fl[]=title&fl[]=description&sort[]=downloads+desc&rows=5&page=1&output=json';

    try {
      var page = await this.fetchPage(url);
      if (!page || page.status !== 200) return [];

      var data = JSON.parse(page.body);
      var results = [];
      var docs = (data.response && data.response.docs) || [];

      for (var i = 0; i < docs.length; i++) {
        results.push({
          url: 'https://archive.org/details/' + docs[i].identifier,
          downloadUrl: 'https://archive.org/download/' + docs[i].identifier,
          title: docs[i].title || docs[i].identifier,
          source: 'archive.org',
        });
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  // ── Search GitHub for a term ──
  async searchGitHub(term) {
    var encoded = encodeURIComponent(term);
    var url = 'https://api.github.com/search/repositories?q=' + encoded + '&sort=stars&per_page=3';

    try {
      var page = await this.fetchPage(url);
      if (!page || page.status !== 200) return [];

      var data = JSON.parse(page.body);
      var results = [];
      var items = data.items || [];

      for (var i = 0; i < items.length; i++) {
        results.push({
          url: items[i].html_url + '/releases',
          title: items[i].full_name,
          source: 'github.com',
        });
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  // ── Search SourceForge for a term ──
  async searchSourceForge(term) {
    var encoded = encodeURIComponent(term);
    var url = 'https://sourceforge.net/directory/?q=' + encoded;
    // SourceForge search returns HTML, we just extract project links
    try {
      var page = await this.fetchPage(url);
      if (!page || page.status !== 200) return [];

      var results = [];
      var regex = /href="(\/projects\/[^"\/]+\/?)"/gi;
      var match;
      var seen = new Set();
      while ((match = regex.exec(page.body)) !== null && results.length < 3) {
        var projectPath = match[1];
        if (seen.has(projectPath)) continue;
        seen.add(projectPath);
        results.push({
          url: 'https://sourceforge.net' + projectPath + 'files/',
          title: projectPath.replace('/projects/', '').replace(/\//g, ''),
          source: 'sourceforge.net',
        });
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  // ── Search across multiple sources for a term ──
  async searchAllSources(term) {
    this.addLog('info', '🔍 Searching: "' + term + '"');
    var results = [];

    try {
      // Run searches in parallel
      var searches = await Promise.allSettled([
        this.searchArchiveOrg(term),
        this.searchGitHub(term),
        this.searchSourceForge(term),
      ]);

      for (var i = 0; i < searches.length; i++) {
        if (searches[i].status === 'fulfilled' && searches[i].value) {
          results = results.concat(searches[i].value);
        }
      }

      this.addLog('info', 'Found ' + results.length + ' results across sources');
    } catch (e) {
      this.addLog('error', 'Search error: ' + e.message);
    }

    return results;
  }

  // ── Main crawler loop ──
  async start(categoryFilter) {
    if (this.running) return;

    this.running = true;
    this.paused = false;
    this.stats.status = 'running';
    this.stats.startTime = Date.now();
    this.patterns.meta.startedAt = this.patterns.meta.startedAt || new Date().toISOString();
    this.sessionVisited = 0;
    this.visitedUrls.clear();

    this.addLog('info', '═══ VELOCE CRAWLER STARTED ═══');
    this.sendUpdate();

    // Load terms (filtered by category if specified)
    var terms = this.loadTerms(categoryFilter);
    if (terms.length === 0) {
      this.addLog('error', 'No training terms found!');
      this.running = false;
      this.stats.status = 'stopped';
      this.sendUpdate();
      return;
    }

    this.stats.totalTerms = terms.length;
    this.addLog('info', 'Loaded ' + terms.length + ' training terms');

    // Shuffle terms for variety
    for (var i = terms.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = terms[i];
      terms[i] = terms[j];
      terms[j] = temp;
    }

    // Main loop
    for (var idx = 0; idx < terms.length; idx++) {
      if (!this.running) break;

      // Handle pause
      while (this.paused && this.running) {
        await this.sleep(1000);
      }
      if (!this.running) break;

      var item = terms[idx];
      this.stats.termIndex = idx + 1;
      this.stats.currentTerm = item.term;
      this.stats.currentCategory = item.category;
      this.skipCurrentTerm = false;
      this.sendUpdate();

      this.addLog('info', '');
      this.addLog('info', '── Term ' + (idx + 1) + '/' + terms.length + ': "' + item.term + '" [' + item.category + '] ──');

      // Search all sources
      var results = await this.searchAllSources(item.term);

      // Crawl each result
      for (var r = 0; r < results.length; r++) {
        if (!this.running || this.paused || this.skipCurrentTerm) break;

        var result = results[r];
        this.stats.sitesVisited++;

        this.addLog('info', '');
        this.addLog('info', '→ ' + result.source + ': ' + (result.title || '').slice(0, 50));

        // If Archive.org, crawl both the details and download pages
        if (result.source === 'archive.org') {
          await this.crawlPage(result.url, item.term, 0);
          await this.sleep(this.crawlDelay);
          if (result.downloadUrl) {
            await this.crawlPage(result.downloadUrl, item.term, 0);
          }
        } else {
          await this.crawlPage(result.url, item.term, 0);
        }

        await this.sleep(this.crawlDelay);
      }

      // Save progress periodically
      if (idx % 5 === 0) {
        this.savePatterns();
        this.addLog('info', '💾 Patterns saved (' + this.stats.patternsFound + ' total)');
      }
    }

    // Done
    this.running = false;
    this.stats.status = 'stopped';
    this.savePatterns();
    this.addLog('info', '');
    this.addLog('info', '═══ CRAWLER FINISHED ═══');
    this.addLog('info', 'Patterns: ' + this.stats.patternsFound + ' | Pages: ' + this.stats.pagesVisited + ' | Errors: ' + this.stats.errors);
    this.sendUpdate();
  }

  // ── Control methods ──
  pause() {
    this.paused = true;
    this.stats.status = 'paused';
    this.addLog('info', '⏸ Crawler paused');
    this.sendUpdate();
  }

  resume() {
    this.paused = false;
    this.stats.status = 'running';
    this.addLog('info', '▶ Crawler resumed');
    this.sendUpdate();
  }

  async stop() {
    this.running = false;
    this.paused = false;
    this.stats.status = 'stopped';
    this.savePatterns();
    this.addLog('info', '⏹ Crawler stopped — patterns saved');
    this.sendUpdate();

    // Shut down CloakBrowser
    if (this.cloakBrowser) {
      try {
        await this.cloakBrowser.close();
      } catch (e) {}
      this.cloakBrowser = null;
      this.addLog('info', 'CloakBrowser shut down');
    }
  }

  skipTerm() {
    this.addLog('info', '⏭ Skipping current term');
    this.skipCurrentTerm = true;
  }

  addSearchTerm(term, category) {
    try {
      var data = JSON.parse(fs.readFileSync(this.termsPath, 'utf8'));
      var cat = category || 'custom';
      if (!data.categories[cat]) data.categories[cat] = [];
      data.categories[cat].push(term);
      fs.writeFileSync(this.termsPath, JSON.stringify(data, null, 2), 'utf8');
      this.addLog('info', 'Added term: "' + term + '" to category: ' + cat);
    } catch (e) {
      this.addLog('error', 'Failed to add term: ' + e.message);
    }
  }

  getStats() {
    return {
      stats: Object.assign({}, this.stats),
      log: this.log.slice(0, 50),
      patternsCount: Object.keys(this.patterns.domains).length,
      domainsLearned: Object.keys(this.patterns.domains),
      uptime: this.stats.startTime ? Math.floor((Date.now() - this.stats.startTime) / 1000) : 0,
    };
  }

  exportPatterns() {
    return JSON.parse(JSON.stringify(this.patterns));
  }

  sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }
}

module.exports = VeloceCrawler;
