/**
 * VELOCE AI IDM — Stealth Preload
 *
 * Loaded via session.setPreloads() — runs on ALL web contents in the
 * browser session, including OOPIF cross-origin iframes like Cloudflare
 * Turnstile (challenges.cloudflare.com).
 *
 * Uses webFrame.executeJavaScript() to inject into the MAIN WORLD
 * (page context), not the isolated preload context.
 */

'use strict';

try {
  var webFrame = require('electron').webFrame;

  webFrame.executeJavaScript("(" + function() {
    'use strict';

    // Track all spoofed functions for toString patching
    var _spoofedFunctions = [];
    function markSpoofed(fn) { if (fn) _spoofedFunctions.push(fn); }

    // ═══════════════════════════════════════════════════════════
    // 1. navigator.webdriver — must be undefined (not false)
    // ═══════════════════════════════════════════════════════════
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: function() { return undefined; },
        configurable: true
      });
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 2. navigator.userAgentData — THE CRITICAL FIX
    //    Electron adds { brand: "Electron", version: "XX" } to brands.
    //    Cloudflare Turnstile checks this. Must look like pure Chrome.
    // ═══════════════════════════════════════════════════════════
    try {
      var chromeBrands = [
        { brand: 'Chromium', version: '122' },
        { brand: 'Not(A:Brand', version: '24' },
        { brand: 'Google Chrome', version: '122' }
      ];

      var fullBrands = [
        { brand: 'Chromium', version: '122.0.6261.112' },
        { brand: 'Not(A:Brand', version: '24.0.0.0' },
        { brand: 'Google Chrome', version: '122.0.6261.112' }
      ];

      var getHighEntropyValues = function(hints) {
        return Promise.resolve({
          architecture: 'x86',
          bitness: '64',
          brands: fullBrands,
          fullVersionList: fullBrands,
          mobile: false,
          model: '',
          platform: 'Windows',
          platformVersion: '15.0.0',
          uaFullVersion: '122.0.6261.112',
          wow64: false
        });
      };
      markSpoofed(getHighEntropyValues);

      var toJSON = function() {
        return { brands: chromeBrands, mobile: false, platform: 'Windows' };
      };
      markSpoofed(toJSON);

      var uaDataObj = {
        brands: chromeBrands,
        mobile: false,
        platform: 'Windows',
        getHighEntropyValues: getHighEntropyValues,
        toJSON: toJSON
      };

      Object.defineProperty(navigator, 'userAgentData', {
        get: function() { return uaDataObj; },
        configurable: true,
        enumerable: true
      });
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 3. window.chrome — full Chrome API surface
    // ═══════════════════════════════════════════════════════════
    try {
      if (!window.chrome) window.chrome = {};

      if (!window.chrome.runtime) {
        var rtConnect = function(extId, info) {
          return {
            name: '', sender: undefined,
            onMessage: { addListener: function(){}, removeListener: function(){}, hasListeners: function(){ return false; } },
            onDisconnect: { addListener: function(){}, removeListener: function(){}, hasListeners: function(){ return false; } },
            postMessage: function(){}, disconnect: function(){}
          };
        };
        var rtSendMessage = function(a, b, c, d) {
          var cb = typeof c === 'function' ? c : typeof d === 'function' ? d : null;
          if (cb) setTimeout(cb, 0);
        };
        var rtGetManifest = function() { return {}; };
        var rtGetURL = function(p) { return ''; };

        markSpoofed(rtConnect);
        markSpoofed(rtSendMessage);
        markSpoofed(rtGetManifest);
        markSpoofed(rtGetURL);

        window.chrome.runtime = {
          connect: rtConnect,
          sendMessage: rtSendMessage,
          getManifest: rtGetManifest,
          getURL: rtGetURL,
          onConnect: { addListener: function(){}, removeListener: function(){}, hasListeners: function(){ return false; } },
          onMessage: { addListener: function(){}, removeListener: function(){}, hasListeners: function(){ return false; } },
          onInstalled: { addListener: function(){}, removeListener: function(){}, hasListeners: function(){ return false; } },
          id: undefined
        };
      }

      if (!window.chrome.csi) {
        window.chrome.csi = function() {
          return { startE: Date.now(), onloadT: Date.now(), pageT: Math.random() * 500 + 100, tran: 15 };
        };
        markSpoofed(window.chrome.csi);
      }

      if (!window.chrome.loadTimes) {
        window.chrome.loadTimes = function() {
          var now = Date.now() / 1000;
          return {
            commitLoadTime: now, connectionInfo: 'h2',
            finishDocumentLoadTime: now + 0.01, finishLoadTime: now + 0.05,
            firstPaintAfterLoadTime: 0, firstPaintTime: now + 0.005,
            navigationType: 'Other', npnNegotiatedProtocol: 'h2',
            requestTime: now - 0.16, startLoadTime: now - 0.15,
            wasAlternateProtocolAvailable: false,
            wasFetchedViaSpdy: true, wasNpnNegotiated: true
          };
        };
        markSpoofed(window.chrome.loadTimes);
      }

      if (!window.chrome.app) {
        var appGetDetails = function() { return null; };
        var appGetIsInstalled = function() { return false; };
        var appInstallState = function(cb) { if (cb) cb('not_installed'); };
        var appRunningState = function() { return 'cannot_run'; };
        markSpoofed(appGetDetails);
        markSpoofed(appGetIsInstalled);
        markSpoofed(appInstallState);
        markSpoofed(appRunningState);

        window.chrome.app = {
          isInstalled: false,
          getDetails: appGetDetails,
          getIsInstalled: appGetIsInstalled,
          installState: appInstallState,
          runningState: appRunningState,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        };
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 4. navigator.plugins + mimeTypes
    // ═══════════════════════════════════════════════════════════
    try {
      var fakePlugins = [
        { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer', length: 1 },
        { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', length: 1 },
        { name: 'Native Client', description: '', filename: 'internal-nacl-plugin', length: 2 }
      ];
      fakePlugins.item = function(i) { return this[i] || null; };
      fakePlugins.namedItem = function(n) { for (var j = 0; j < this.length; j++) { if (this[j].name === n) return this[j]; } return null; };
      fakePlugins.refresh = function() {};
      Object.defineProperty(navigator, 'plugins', { get: function() { return fakePlugins; }, configurable: true });
    } catch(e) {}

    try {
      var fakeMimes = [
        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
        { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' }
      ];
      fakeMimes.item = function(i) { return this[i] || null; };
      fakeMimes.namedItem = function(n) { for (var j = 0; j < this.length; j++) { if (this[j].type === n) return this[j]; } return null; };
      Object.defineProperty(navigator, 'mimeTypes', { get: function() { return fakeMimes; }, configurable: true });
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 5. navigator identity properties
    // ═══════════════════════════════════════════════════════════
    try {
      Object.defineProperty(navigator, 'vendor', { get: function() { return 'Google Inc.'; }, configurable: true });
    } catch(e) {}
    try {
      Object.defineProperty(navigator, 'platform', { get: function() { return 'Win32'; }, configurable: true });
    } catch(e) {}
    try {
      Object.defineProperty(navigator, 'productSub', { get: function() { return '20030107'; }, configurable: true });
    } catch(e) {}
    try {
      Object.defineProperty(navigator, 'languages', { get: function() { return ['en-US', 'en']; }, configurable: true });
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 6. navigator.permissions.query
    // ═══════════════════════════════════════════════════════════
    try {
      var origQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = function(params) {
        if (params && params.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission, onchange: null });
        }
        return origQuery(params);
      };
      markSpoofed(navigator.permissions.query);
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 7. navigator.connection (NetworkInformation API)
    // ═══════════════════════════════════════════════════════════
    try {
      if (!navigator.connection) {
        Object.defineProperty(navigator, 'connection', {
          get: function() {
            return {
              effectiveType: '4g', rtt: 50, downlink: 10, saveData: false,
              onchange: null,
              addEventListener: function() {}, removeEventListener: function() {},
              dispatchEvent: function() { return true; }
            };
          },
          configurable: true
        });
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 8. window dimensions — real Chrome has toolbar offset
    // ═══════════════════════════════════════════════════════════
    try {
      var _origOuterHeight = window.outerHeight;
      var _origInnerHeight = window.innerHeight;
      if (_origOuterHeight <= _origInnerHeight) {
        Object.defineProperty(window, 'outerHeight', {
          get: function() { return window.innerHeight + 85; },
          configurable: true
        });
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 9. Remove Electron globals
    // ═══════════════════════════════════════════════════════════
    var globals = ['process', 'require', 'module', 'exports', '__electron_contextBridge', 'Buffer'];
    for (var g = 0; g < globals.length; g++) {
      try {
        if (window[globals[g]] !== undefined) delete window[globals[g]];
      } catch(e) {
        try { window[globals[g]] = undefined; } catch(e2) {}
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 10. Error stack trace cleaning — hide Electron paths
    // ═══════════════════════════════════════════════════════════
    try {
      var _origCaptureStack = Error.captureStackTrace;
      if (_origCaptureStack) {
        Error.captureStackTrace = function(obj, fn) {
          _origCaptureStack.call(Error, obj, fn);
          if (obj && obj.stack && typeof obj.stack === 'string') {
            obj.stack = obj.stack
              .split('\\n')
              .filter(function(line) {
                return line.indexOf('electron') === -1 && line.indexOf('.asar') === -1;
              })
              .join('\\n');
          }
        };
        markSpoofed(Error.captureStackTrace);
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 11. Notification.permission
    // ═══════════════════════════════════════════════════════════
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Object.defineProperty(Notification, 'permission', {
          get: function() { return 'default'; },
          configurable: true
        });
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 12. iframe frameElement protection
    // ═══════════════════════════════════════════════════════════
    try {
      if (window.self !== window.top) {
        Object.defineProperty(window, 'frameElement', {
          get: function() { return null; },
          configurable: true
        });
      }
    } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 13. Remove automation indicators
    // ═══════════════════════════════════════════════════════════
    try { delete window.domAutomation; } catch(e) {}
    try { delete window.domAutomationController; } catch(e) {}
    try { delete window._phantom; } catch(e) {}
    try { delete window.callPhantom; } catch(e) {}
    try { delete window.__nightmare; } catch(e) {}

    // ═══════════════════════════════════════════════════════════
    // 14. Function.prototype.toString — make everything look native
    // ═══════════════════════════════════════════════════════════
    try {
      var _nativeToString = Function.prototype.toString;
      var _spoofSet = new WeakSet();
      for (var s = 0; s < _spoofedFunctions.length; s++) {
        try { _spoofSet.add(_spoofedFunctions[s]); } catch(e) {}
      }

      Function.prototype.toString = function() {
        if (_spoofSet.has(this)) {
          return 'function ' + (this.name || '') + '() { [native code] }';
        }
        return _nativeToString.call(this);
      };
      _spoofSet.add(Function.prototype.toString);
    } catch(e) {}

    // Confirm stealth is active (visible in DevTools console)
    console.log('[Veloce Stealth] Active on ' + location.hostname + ' (' + (window.self === window.top ? 'main frame' : 'iframe') + ')');

  } + ")();").catch(function(e) {
    // Silent fail
  });

} catch (e) {
  // Preload environment error — silent
}
