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
  // Direct download phrases
  'download', 'download now', 'direct download', 'free download',
  'start download', 'begin download', 'get download', 'fast download',
  'secure download', 'safe download', 'official download', 'latest download',
  'download file', 'download link', 'download here', 'download page',
  'download it', 'download this', 'download below',

  // "Get it" / "Grab it" variants
  'get it', 'get it here', 'get it now', 'get file', 'get the file',
  'get this', 'get here', 'grab', 'grab it', 'grab here', 'grab this',
  'grab the file', 'grab it here', 'get software', 'get program', 'get app',

  // "Click here" hidden link variants (very common on older sites)
  'click here', 'click here to download', 'click to download',
  'click here for download', 'click here to get', 'click here to grab',
  'click here to start', 'click here to begin', 'click here to access',
  'click here for the file', 'click here for file', 'click this link',
  'click the link', 'click below', 'click above', 'click the button',

  // "Look here" / "Find here" / "Go here" variants
  'look here', 'find download here', 'find it here', 'find here',
  'find the file', 'find the download', 'find file', 'find link',
  'go here', 'go to download', 'go to file', 'visit here', 'visit page',
  'visit this page', 'visit the page', 'visit the link', 'follow this link',
  'follow link', 'follow the link', 'see here', 'see it here',

  // "Proceed" / "Continue" / navigation to download
  'proceed', 'proceed to download', 'proceed here', 'continue',
  'continue to download', 'continue here', 'go to download page',
  'access download', 'access file', 'access here',

  // Mirror / alternate links
  'mirror', 'mirror link', 'mirror download', 'alternate link',
  'alternate download', 'alternative link', 'alternative download',
  'external link', 'external mirror', 'external download',
  'direct link', 'direct file', 'direct url',

  // View/show files
  'show all', 'showall', 'view all', 'view contents', 'view files',
  'see all', 'see files', 'all files', 'file list', 'files list',
  'show files', 'show downloads', 'show all files', 'show all downloads',
  'browse files', 'browse all', 'view all files', 'list files',
  'expand', 'more', 'show more', 'load more', 'see more',

  // Release / version info
  'latest version', 'stable release', 'release notes', 'changelog',
  'assets', 'releases', 'tags', 'release', 'latest release',
  'current version', 'current release', 'new version', 'updated version',

  // File type / format keywords
  'source code', 'binary', 'binaries', 'installer', 'portable',
  'full version', 'setup', 'install', 'executable', 'package',
  'archive', 'compressed', 'zip file', 'exe file', 'msi file',

  // Soft/generic CTA-style link texts common on download portals
  'here', 'this link', 'this page', 'this file', 'this download',
  'read more', 'learn more', 'more info', 'more information',
  'details', 'file details', 'view details', 'full details',
  'open', 'open file', 'open link', 'open page', 'open download',
  'save', 'save file', 'save as', 'save this',
  'fetch', 'fetch file', 'retrieve', 'retrieve file',

  // Forms/buttons on sites like MajorGeeks, FileHorse, Softpedia
  'download now', 'download file now', 'start download now',
  'free download now', 'no thanks', 'skip ad', 'skip wait',
  'regular download', 'slow download', 'fast download link',
  'use this mirror', 'select mirror', 'choose mirror',
  'download via', 'download from', 'download using',
];

// ── URL patterns that often lead to download pages ──
const DOWNLOAD_URL_PATTERNS = [
  '/download/', '/downloads/', '/files/', '/release/',
  '/releases/', '/get/', '/fetch/', '/mirror/',
  '/dl/', '/d/', '/file/', '/archive/',
  'sourceforge.net/projects/', '/files/latest/download',
  'github.com/', '/releases/tag/', '/releases/download/',
  'archive.org/download/', 'archive.org/details/',
  // Download gateway redirectors (Softpedia, MajorGeeks, etc.)
  'dyn-postdownload', 'dyn-dl', 'getdownload', 'download-now',
  'download.php', 'download.asp', 'dl.php', 'getfile',
  '/download-file/', '/downloads/download/', '/getdownload/',
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

        function add(url, text) {
          if (url && !seen[url] && typeof url === 'string' && url.length > 1 &&
              !url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
            seen[url] = true;
            found.push({ url: url, text: (text || '').trim().slice(0, 100) });
          }
        }

        // 1. Standard <a href> links — capture text
        Array.from(document.querySelectorAll('a[href]')).forEach(function(a) {
          add(a.href, (a.textContent || '').trim());
        });

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
          // Cast the widest net — any element that could be a hidden download trigger
          var clickTargets = document.querySelectorAll(
            'a, button, span, div, p, li, td, th, label, ' +
            'input[type="button"], input[type="submit"], input[type="image"], ' +
            '[role="button"], [role="link"], [onclick], [data-url], [data-href]'
          );
          var clicked = 0;
          // ALL the indirect/vague/hidden phrases sites use for download links
          var downloadKeywords = [
            // Direct
            'download', 'free download', 'direct download', 'start download',
            'secure download', 'safe download', 'official download', 'download now',
            'download here', 'download link', 'download file', 'download it',
            // Get/Grab
            'get it', 'get it here', 'get it now', 'get file', 'grab', 'grab it',
            'grab here', 'get software', 'get program', 'get app', 'get the file',
            // Click here variants
            'click here', 'click here to download', 'click to download',
            'click here to get', 'click here to grab', 'click here to start',
            'click here to access', 'click this link', 'click the link',
            'click below', 'click the button', 'click above',
            // Look/Find/Go/Visit
            'look here', 'find download here', 'find it here', 'find here',
            'find the file', 'find the download', 'go here', 'go to download',
            'visit here', 'visit this page', 'visit the link', 'follow this link',
            'follow link', 'see here', 'see it here', 'see the file',
            // Proceed/Continue
            'proceed', 'proceed to download', 'continue', 'continue to download',
            'access download', 'access file', 'continue here',
            // Mirror/Alternate
            'mirror', 'mirror link', 'alternate link', 'alternative link',
            'external link', 'external mirror', 'direct link', 'direct file',
            // View/Show files
            'show all', 'view all', 'view files', 'show files', 'browse files',
            'see all', 'all files', 'file list', 'show more', 'see more',
            'expand', 'load more', 'view all files', 'browse all',
            // Release/Asset
            'releases', 'assets', 'latest version', 'stable release',
            'latest release', 'changelog', 'release notes',
            // File type
            'installer', 'portable', 'setup', 'executable', 'binary', 'binaries',
            // Portal-specific CTAs
            'regular download', 'slow download', 'use this mirror', 'select mirror',
            'download via', 'download from', 'no thanks', 'skip ad',
            // Generic soft CTAs
            'here', 'this link', 'this file', 'this download', 'details',
            'file details', 'full details', 'open', 'open file', 'fetch',
            'save file', 'more info', 'more information', 'read more',
            'retrieve', 'learn more'
          ];
          for (var i = 0; i < clickTargets.length && clicked < 25; i++) {
            var el = clickTargets[i];
            // Gather all text signals from this element
            var text = (el.textContent || '').toLowerCase().trim();
            var href = (el.getAttribute('href') || '').toLowerCase();
            var cls = (el.className || '').toString().toLowerCase();
            var id = (el.id || '').toLowerCase();
            var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            var title = (el.getAttribute('title') || '').toLowerCase();
            var val = (el.getAttribute('value') || '').toLowerCase();
            var alt = (el.getAttribute('alt') || '').toLowerCase();
            // Combined signal string — check all text sources
            var combined = text + ' ' + ariaLabel + ' ' + title + ' ' + val + ' ' + alt;

            var isDownloadText = false;
            for (var dk = 0; dk < downloadKeywords.length; dk++) {
              if (combined.indexOf(downloadKeywords[dk]) !== -1) { isDownloadText = true; break; }
            }

            // href URL patterns that suggest a download or next-step page
            var isDownloadHref = (
              href.indexOf('/download') !== -1 || href.indexOf('/get/') !== -1 ||
              href.indexOf('/files/') !== -1 || href.indexOf('/dl/') !== -1 ||
              href.indexOf('/mirror') !== -1 || href.indexOf('/release') !== -1 ||
              href.indexOf('/fetch') !== -1 || href.indexOf('/grab') !== -1 ||
              href.indexOf('download.php') !== -1 || href.indexOf('dl.php') !== -1 ||
              href.indexOf('getfile') !== -1 || href.indexOf('getdownload') !== -1
            );

            // Class/id/data attributes that reveal hidden download triggers
            var isDownloadClass = (
              cls.indexOf('download') !== -1 || cls.indexOf('btn-dl') !== -1 ||
              cls.indexOf('mirror') !== -1 || cls.indexOf('dl-btn') !== -1 ||
              cls.indexOf('get-file') !== -1 || cls.indexOf('fetch') !== -1 ||
              cls.indexOf('show-all') !== -1 || cls.indexOf('view-all') !== -1 ||
              id.indexOf('download') !== -1 || id.indexOf('btn-dl') !== -1 ||
              id.indexOf('mirror') !== -1 || id.indexOf('get-file') !== -1 ||
              id.indexOf('fetch') !== -1 || id.indexOf('show-all') !== -1 ||
              el.hasAttribute('data-url') || el.hasAttribute('data-download') ||
              el.hasAttribute('data-href') || el.hasAttribute('data-link')
            );

            if ((isDownloadText || isDownloadHref || isDownloadClass) && el.offsetParent !== null) {
              try { el.click(); clicked++; } catch(e) {}
            }
          }
        });
        await new Promise(function(r) { setTimeout(r, 2500); });
        // Re-collect after interaction (now also checks onclick + buttons)
        var linksAfterClick = await page.evaluate(function() {
          var found = [];
          var seen = {};
          function add(url, text) {
            if (url && !seen[url] && typeof url === 'string' && url.length > 1 &&
                !url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
              seen[url] = true;
              found.push({ url: url, text: (text || '').trim().slice(0, 100) });
            }
          }
          // Standard links — capture text
          Array.from(document.querySelectorAll('a[href]')).forEach(function(a) {
            add(a.href, (a.textContent || '').trim());
          });
          // data-* attributes
          Array.from(document.querySelectorAll('[data-url]')).forEach(function(el) { add(el.getAttribute('data-url')); });
          Array.from(document.querySelectorAll('[data-download]')).forEach(function(el) { add(el.getAttribute('data-download')); });
          Array.from(document.querySelectorAll('[data-href]')).forEach(function(el) { add(el.getAttribute('data-href')); });
          Array.from(document.querySelectorAll('[data-link]')).forEach(function(el) { add(el.getAttribute('data-link')); });
          // onclick handlers on any element (download buttons often use JS redirects)
          var allElems = document.querySelectorAll('*[onclick]');
          for (var i = 0; i < allElems.length; i++) {
            var oc = allElems[i].getAttribute('onclick') || '';
            var m = oc.match(/(?:location\.href|window\.location|location|window\.open)\s*[=\(]\s*['"]([^'"]+)['"]/);
            if (m) add(m[1]);
            m = oc.match(/['"](https?:\/\/[^'"]+)['"]/);
            if (m) add(m[1]);
          }
          return found;
        });
        if (linksAfterClick && linksAfterClick.length > 0) {
          var seenUrls = {};
          for (var li = 0; li < links.length; li++) { seenUrls[links[li].url || links[li]] = true; }
          for (var lj = 0; lj < linksAfterClick.length; lj++) {
            var laUrl = linksAfterClick[lj].url || linksAfterClick[lj];
            if (!seenUrls[laUrl]) {
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

  // ── Check if a page is actually relevant to the search term ──
  pageIsRelevant(url, title, body, searchTerm) {
    if (!searchTerm) return true;
    // Split into words, keep 2+ char (preserves VLC, CPU, ISO, etc.)
    var words = searchTerm.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 1; });
    if (words.length === 0) return true;

    var haystack = (title || '').toLowerCase() + ' ' + (url || '').toLowerCase() + ' ' + (body || '').slice(0, 2000).toLowerCase();

    // MUST-MATCH: the longest word (most specific) must be in the page
    var longestWord = words[0];
    for (var i = 1; i < words.length; i++) {
      if (words[i].length > longestWord.length) longestWord = words[i];
    }
    if (haystack.indexOf(longestWord) === -1) return false;

    // THRESHOLD: at least 50% of words must match
    var matched = 0;
    for (var i = 0; i < words.length; i++) {
      if (haystack.indexOf(words[i]) !== -1) matched++;
    }
    return matched >= Math.ceil(words.length * 0.5);
  }

  // ── Crawl a single page and its links ──
  async crawlPage(url, searchTerm, depth) {
    if (depth > this.maxDepth) return;
    // Strip hash fragments — #download, #main etc are the same page
    var urlNoHash = url.split('#')[0];
    if (this.visitedUrls.has(urlNoHash)) return;
    if (!this.running || this.paused) return;

    this.visitedUrls.add(urlNoHash);
    this.stats.pagesVisited++;
    this.stats.currentUrl = urlNoHash;
    this.sessionVisited++;

    var domain = this.getDomain(url);

    // Skip bad domains
    for (var i = 0; i < SKIP_DOMAINS.length; i++) {
      if (domain.includes(SKIP_DOMAINS[i])) return;
    }
    // Skip official vendor sites — their domain contains a word from the search term
    // e.g. searching "Kaspersky Free" → skip kaspersky.com, kaspersky.co.za
    var searchWords = searchTerm.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 3; });
    for (var sw = 0; sw < searchWords.length; sw++) {
      if (domain.indexOf(searchWords[sw]) !== -1) {
        this.addLog('info', '  ⊘ Skipping vendor site: ' + domain);
        return;
      }
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

      // ── Relevance check: reject pages unrelated to search term ──
      var pageTitle = '';
      if (page.body) {
        var titleMatch = page.body.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) pageTitle = titleMatch[1];
      }
      var isRelevant = this.pageIsRelevant(url, pageTitle, page.body || '', searchTerm);
      if (!isRelevant) {
        this.addLog('info', '  ⊘ Skipping irrelevant page: ' + pageTitle.slice(0, 60));
        return;
      }

      // Use pre-extracted links from CloakBrowser if available, else parse HTML
      var links = [];
      if (page.links && page.links.length > 0) {
        // CloakBrowser already extracted links — score them using the original logic
        var seen = new Set();
        for (var li = 0; li < page.links.length; li++) {
          var linkObj = page.links[li];
          var href = typeof linkObj === 'string' ? linkObj : (linkObj.url || '');
          var linkText = typeof linkObj === 'string' ? '' : (linkObj.text || '');
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
          // Score based on link's OWN text (was checking page.body globally — useless)
          for (var ki = 0; ki < DOWNLOAD_KEYWORDS.length; ki++) {
            if (linkText.toLowerCase().indexOf(DOWNLOAD_KEYWORDS[ki]) !== -1) { score += 5; reasons.push('text:' + DOWNLOAD_KEYWORDS[ki]); break; }
          }
          // Include links with text even if score=0 (match extractLinks behaviour)
          if (score > 0 || linkText) {
            links.push({ url: fullUrl, text: linkText, score: score, reasons: reasons, isDirectFile: score >= 10 });
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
      // Lower threshold: score>=3 catches text-matched links (download keywords = +5, path match = +5)
      var promiseLinks = links.filter(function(l) { return !l.isDirectFile && l.score >= 3; });

      // Filter out self-links and hash-only links that waste follow slots
      links = links.filter(function(l) {
        var lUrl;
        try { lUrl = new URL(l.url, url).href; } catch(e) { return false; }
        // Skip same-page hash links
        if (lUrl.split('#')[0] === url.split('#')[0] && lUrl.indexOf('#') !== -1) return false;
        return true;
      });

      // Debug: log top links to see what we're working with
      for (var di = 0; di < Math.min(links.length, 5); di++) {
        var dl = links[di];
        this.addLog('info', '  [' + dl.score + '] ' + (dl.text || '(no text)').slice(0, 40) + ' → ' + dl.url.slice(0, 80));
      }

      // Record direct file links — save ALL high-score links, not just ones that pass HEAD.
      // Gateway/redirect URLs like /mg/get/, /download.php, filehorse tokens etc. never respond
      // to HEAD as binary but ARE real downloads. HEAD is only used to get size/type bonus.
      for (var i = 0; i < directFiles.length && i < 20; i++) {
        var link = directFiles[i];
        if (!this.running || this.paused) return;

        var fName = link.url.split('/').pop().split('?')[0] || 'download';

        // Try HEAD for size/type — but save the pattern regardless of outcome
        var fileInfo = await this.checkIfFile(link.url);
        var fSizeMB = (fileInfo && fileInfo.size > 0) ? (fileInfo.size / 1048576).toFixed(1) + ' MB' : 'gateway';
        this.addLog('found', '★ ' + fName + ' (' + fSizeMB + ') via "' + (link.text || 'direct').slice(0, 30) + '"');

        this.recordPattern(domain, {
          searchTerm: searchTerm,
          pageUrl: url,
          fileUrl: link.url,
          fileName: fName,
          fileSize: fileInfo ? fileInfo.size : 0,
          fileType: fileInfo ? fileInfo.type : 'gateway',
          linkText: link.text,
          depth: depth,
          pathPattern: this.getPathPattern(link.url),
        });

        // Small delay between HEAD checks
        await this.sleep(300);
      }

      // Also save promising non-file links that look like download gateways (score 5-9)
      // Only save if the link text or URL contains at least one word from the search term
      // — cuts sidebar noise like "Yahoo", "IObit Turns 21!", "How to Uninstall" etc.
      var termWordsForFilter = searchTerm.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 3; });
      for (var gi = 0; gi < promiseLinks.length && gi < 10; gi++) {
        var pl = promiseLinks[gi];
        if (pl.score < 5) continue;
        // Relevance gate: link text OR url must contain at least one search term word
        var plHaystack = (pl.text + ' ' + pl.url).toLowerCase();
        var plRelevant = termWordsForFilter.length === 0 || termWordsForFilter.some(function(w) { return plHaystack.indexOf(w) !== -1; });
        if (!plRelevant) continue;
        this.recordPattern(domain, {
          searchTerm: searchTerm,
          pageUrl: url,
          fileUrl: pl.url,
          fileName: '',
          fileSize: 0,
          fileType: 'page-gateway',
          linkText: pl.text,
          depth: depth,
          pathPattern: this.getPathPattern(pl.url),
        });
      }

      // Follow promising non-file links deeper (top 5, score >= 3)
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
    var sfUrl = 'https://sourceforge.net/directory/?q=' + encoded;
    // Build relevance words from search term for filtering unrelated SF projects
    var termWords = term.toLowerCase().split(/[\s\-_\.]+/).filter(function(w) { return w.length > 2; });
    try {
      var page = await this.fetchPage(sfUrl);
      if (!page || page.status !== 200) return [];

      var results = [];
      // Grab project path AND the surrounding text snippet to test relevance
      var projectRegex = /href="(\/projects\/([^"\/]+)\/?)["]/gi;
      var match;
      var seen = new Set();
      while ((match = projectRegex.exec(page.body)) !== null && results.length < 5) {
        var projectPath = match[1];
        var projectSlug = match[2].toLowerCase();
        if (seen.has(projectPath)) continue;
        seen.add(projectPath);
        // Only keep projects whose slug contains at least one term word
        var slugMatches = termWords.some(function(w) { return projectSlug.indexOf(w) !== -1; });
        // Also check 200-char context around the match in the page body
        var ctxStart = Math.max(0, match.index - 100);
        var ctx = page.body.slice(ctxStart, match.index + 200).toLowerCase();
        var ctxMatches = termWords.some(function(w) { return ctx.indexOf(w) !== -1; });
        if (!slugMatches && !ctxMatches) continue;  // skip unrelated
        results.push({
          url: 'https://sourceforge.net' + projectPath + 'files/',
          title: projectSlug,
          source: 'sourceforge.net',
        });
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  // ── Search known download sites directly (bypass search engines, get clean HTML) ──
  async searchDirectSites(term) {
    var encoded = encodeURIComponent(term);
    var results = [];

    // Softpedia — huge catalogue, strong search
    try {
      var spUrl = 'https://www.softpedia.com/dyn-search.php?search_term=' + encoded;
      var spPage = await this.fetchPage(spUrl);
      if (spPage && spPage.body && spPage.status === 200) {
        var spRegex = /<a[^>]*href="(https?:\/\/www\.softpedia\.com\/get\/[^"]+\.shtml)"[^>]*>/gi;
        var spMatch;
        var spSeen = new Set();
        while ((spMatch = spRegex.exec(spPage.body)) !== null && results.length < 4) {
          var spLink = spMatch[1];
          if (!spSeen.has(spLink)) { spSeen.add(spLink); results.push({ url: spLink, title: 'Softpedia: ' + term, source: 'softpedia.com' }); }
        }
      }
    } catch (e) { /* silent */ }

    // FossHub — clean, direct .exe/.msi links for open source
    try {
      var fhubUrl = 'https://www.fosshub.com/search/?q=' + encoded;
      var fhubPage = await this.fetchPage(fhubUrl);
      if (fhubPage && fhubPage.body && fhubPage.status === 200) {
        var fhubRegex = /<a[^>]*href="(\/[^"]*\/[^"]+)"[^>]*class="[^"]*project[^"]*"[^>]*>/gi;
        var fhubMatch;
        var fhubSeen = new Set();
        while ((fhubMatch = fhubRegex.exec(fhubPage.body)) !== null && results.length < 5) {
          var fhubLink = 'https://www.fosshub.com' + fhubMatch[1];
          if (!fhubSeen.has(fhubLink)) { fhubSeen.add(fhubLink); results.push({ url: fhubLink, title: 'FossHub: ' + term, source: 'fosshub.com' }); }
        }
      }
    } catch (e) { /* silent */ }

    // FileHippo — clean HTML, often has direct download links
    try {
      var fhUrl = 'https://filehippo.com/search/?query=' + encoded;
      var page = await this.fetchPage(fhUrl);
      if (page && page.body && page.status === 200) {
        // Extract result links from FileHippo search
        var fhRegex = /<a[^>]*href="(\/download_[^"]+)"[^>]*>/gi;
        var match;
        var seen = new Set();
        while ((match = fhRegex.exec(page.body)) !== null && results.length < 3) {
          var link = 'https://filehippo.com' + match[1];
          if (!seen.has(link)) { seen.add(link); results.push({ url: link, title: 'FileHippo: ' + term, source: 'filehippo.com' }); }
        }
        if (results.length === 0) {
          // Fallback: broader pattern
          var fhRegex2 = /<a[^>]*href="(\/[^"]*download[^"]*)"[^>]*>/gi;
          while ((match = fhRegex2.exec(page.body)) !== null && results.length < 3) {
            var link2 = 'https://filehippo.com' + match[1];
            if (!seen.has(link2)) { seen.add(link2); results.push({ url: link2, title: 'FileHippo: ' + term, source: 'filehippo.com' }); }
          }
        }
      }
    } catch (e) { /* silent */ }

    // OldVersion.com — great for old software, clean HTML
    try {
      var ovUrl = 'https://www.oldversion.com/search?q=' + encoded;
      var ovPage = await this.fetchPage(ovUrl);
      if (ovPage && ovPage.body && ovPage.status === 200) {
        var ovRegex = /<a[^>]*href="(\/windows\/[^"]+)"[^>]*>/gi;
        var ovMatch;
        var ovSeen = new Set();
        while ((ovMatch = ovRegex.exec(ovPage.body)) !== null && results.length < 5) {
          var ovLink = 'https://www.oldversion.com' + ovMatch[1];
          if (!ovSeen.has(ovLink)) { ovSeen.add(ovLink); results.push({ url: ovLink, title: 'OldVersion: ' + term, source: 'oldversion.com' }); }
        }
      }
    } catch (e) { /* silent */ }

    return results;
  }

  // ── Search DuckDuckGo via CloakBrowser (JS-rendered, bypasses bot detection) ──
  async searchSoftwareSites(term) {
    var encoded = encodeURIComponent(term + ' download');
    // Also search for direct file links
    var encodedDirect = encodeURIComponent(term + ' .exe OR .msi OR .zip');
    var results = [];
    var seen = new Set();

    // Run both queries in parallel
    var urls = [
      'https://duckduckgo.com/?q=' + encoded + '&ia=web',
      'https://duckduckgo.com/?q=' + encodedDirect + '&ia=web',
    ];

    for (var u = 0; u < urls.length; u++) {
      try {
        if (!this.cloakBrowser) {
          this.addLog('info', 'Starting CloakBrowser stealth engine...');
          var { launch } = await import('cloakbrowser');
          this.cloakBrowser = await launch({ headless: true });
          this.addLog('success', 'CloakBrowser ready');
        }
        var ddgPage = await this.cloakBrowser.newPage();
        var ddgHtml = '';
        try {
          await ddgPage.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          });
          await ddgPage.goto(urls[u], { waitUntil: 'networkidle0', timeout: 20000 });
          await this.sleep(1000);
          ddgHtml = await ddgPage.content();
        } finally {
          await ddgPage.close();
        }

        // Extract result links
        var patterns = [
          /<a[^>]*data-testid="result-title-a"[^>]*href="(https?:\/\/[^"]+)"/gi,
          /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*data-testid="result-title-a"/gi,
          /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*/gi,
          /<a[^>]*href="(https?:\/\/(?!duckduckgo\.com|google\.com|youtube\.com|facebook\.com|twitter\.com|reddit\.com|amazon\.com|ebay\.com)[^"]+)"/gi,
        ];

        for (var pi = 0; pi < patterns.length && results.length < 8; pi++) {
          var match;
          while ((match = patterns[pi].exec(ddgHtml)) !== null && results.length < 8) {
            var link = match[1].replace(/&amp;/g, '&');
            if (link.indexOf('duckduckgo.com') !== -1) continue;
            if (link.indexOf('google.com') !== -1) continue;
            if (link.indexOf('youtube.com') !== -1) continue;
            if (link.indexOf('amazon.com') !== -1) continue;
            if (link.indexOf('ebay.com') !== -1) continue;
            // Skip DDG redirect/tracking URLs
            if (link.indexOf('/l/?') !== -1 || link.indexOf('uddg=') !== -1) continue;
            if (seen.has(link)) continue;
            seen.add(link);
            results.push({ url: link, title: 'DDG: ' + term, source: 'duckduckgo.com' });
          }
        }
      } catch (e) {
        // Silent per-query
      }
    }

    if (results.length === 0) {
      this.addLog('info', '  ⊘ DDG: no results matched');
    }
    return results;
  }

  // ── Search across multiple sources for a term ──
  async searchAllSources(term) {
    this.addLog('info', '🔍 Searching: "' + term + '"');
    var results = [];

    try {
      // Run ALL sources in parallel — Archive.org + GitHub were previously excluded!
      var searches = await Promise.allSettled([
        this.searchDirectSites(term),    // Softpedia, FossHub, FileHippo, OldVersion
        this.searchSoftwareSites(term),  // DuckDuckGo (2 queries)
        this.searchSourceForge(term),    // SourceForge directory
        this.searchArchiveOrg(term),     // Internet Archive
        this.searchGitHub(term),         // GitHub releases
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
  async start(opts) {
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

    // Terms: use selectedTerms if provided, otherwise load by category filter
    var categoryFilter = (opts && opts.category) || null;
    var selectedTerms = (opts && opts.selectedTerms) || null;
    var terms;
    if (selectedTerms && selectedTerms.length > 0) {
      terms = selectedTerms;
      this.addLog('info', 'Using ' + terms.length + ' selected term(s)');
    } else {
      terms = this.loadTerms(categoryFilter);
      if (terms.length === 0) {
        this.addLog('error', 'No training terms found!');
        this.running = false;
        this.stats.status = 'stopped';
        this.sendUpdate();
        return;
      }
      this.addLog('info', 'Loaded ' + terms.length + ' training terms');

      // Shuffle terms for variety
      for (var i = terms.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = terms[i];
        terms[i] = terms[j];
        terms[j] = temp;
      }
    }

    this.stats.totalTerms = terms.length;

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
