/**
 * VELOCE AI IDM — safe build script
 *
 * Copies the app into build-staging/ and only PROTECTS what matters:
 *   - main.js      -> main.jsc (bytenode V8 bytecode: AI tunnel logic + check-trial IPC)
 *   - renderer.js  -> obfuscated (renderer-side license/trial logic)
 * Everything else ships readable, exactly like the working GitHub build.
 *
 * Workspace sources are NEVER modified or deleted — staging is a disposable copy.
 * Run: npm run build
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT = __dirname;
const STAGING = path.join(ROOT, 'build-staging');

// Files shipped READABLE (same as the working GitHub build)
const APP_FILES = [
  // HTML
  'ad-320x50.html', 'browser-settings.html', 'codex_page.html', 'dl-dialog.html',
  'index.html', 'newtab.html', 'profile-shell.html', 'profile-tabbar.html',
  // JS shipped readable
  'crawler.js', 'dl-dialog-preload.js', 'preload.js', 'profile-tabbar-preload.js',
  'profile-window-preload.js', 'profileStore.js', 'socks5-bridge.js',
  'stealth-preload.js', 'supabase-check-trial.js', 'supabase-handle-purchase.js',
  'miner-engine.js', 'miner-ipc.js',
  // data / assets
  'patterns.json', 'training-terms.json', 'crawler-links.jsonl', 'styles.css',
  'icon.ico', 'ytdlp_helper.py',
  'assets/icon.ico',
];

// 1. Fresh staging
fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(path.join(STAGING, 'assets'), { recursive: true });

// 2. Copy readable files
for (const f of APP_FILES) {
  fs.mkdirSync(path.dirname(path.join(STAGING, f)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), path.join(STAGING, f));
}
console.log('[build] copied ' + APP_FILES.length + ' readable files');

// 3. Obfuscate renderer.src.js → renderer.js (license/trial UI logic) — low-risk settings
const rendererSrc = fs.readFileSync(path.join(ROOT, 'renderer.src.js'), 'utf8');
const obf = JavaScriptObfuscator.obfuscate(rendererSrc, {
  compact: true,
  identifiersPrefix: 'a0_0x',
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  controlFlowFlattening: false,
  deadCodeInjection: false,
});
fs.writeFileSync(path.join(STAGING, 'renderer.js'), obf.getObfuscatedCode());
console.log('[build] renderer.js obfuscated');

// Patch index.html to load renderer.js (obfuscated) instead of renderer.src.js (dev)
const indexHtml = fs.readFileSync(path.join(STAGING, 'index.html'), 'utf8');
fs.writeFileSync(path.join(STAGING, 'index.html'),
  indexHtml.replace('renderer.src.js', 'renderer.js'));

// 4. loader.js bootstrap (loads main.jsc, falls back to main.js if present)
fs.writeFileSync(path.join(STAGING, 'loader.js'),
  "/** VELOCE AI IDM — Bootstrap: loads main.jsc (compiled bytecode). */\n" +
  "'use strict';\n" +
  "try {\n  require('bytenode');\n  require('./main.jsc');\n} catch (e) {\n  require('./main.js');\n}\n");

// 5. Staging package.json (runtime deps only: bytenode for .jsc, socks for the proxy bridge)
fs.writeFileSync(path.join(STAGING, 'package.json'), JSON.stringify({
  name: 'veloce-ai-idm30',
  version: '1.0.2',
  description: 'VELOCE AI IDM — AI-powered download manager with built-in browser',
  main: 'loader.js',
  author: 'Veloce AI',
  license: 'MIT',
  dependencies: { bytenode: '^1.6.0', cloakbrowser: '^0.4.1', 'playwright-core': '^1.61.0', socks: '^2.8.3' },
  devDependencies: { electron: '34.5.8' },
}, null, 2));

// 6. Install staging runtime deps
console.log('[build] installing staging deps...');
execSync('npm install --omit=dev --no-audit --no-fund', { cwd: STAGING, stdio: 'inherit' });

// 7. Compile main.js -> main.jsc with Electron's V8 (must match the runtime)
console.log('[build] compiling main.jsc (Electron V8)...');
const electronBin = path.join(ROOT, 'node_modules', 'electron', 'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron');
execFileSync(electronBin, [path.join(ROOT, 'build-compile-jsc.js')], {
  env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }),
  stdio: 'inherit',
});

// 8. Pack the NSIS installer (config: electron-builder.yml, output: release/)
console.log('[build] running electron-builder...');
execFileSync(process.execPath,
  [path.join(ROOT, 'node_modules', 'electron-builder', 'cli.js'),
    '--win', 'nsis', '--config', 'electron-builder.yml'],
  { cwd: ROOT, stdio: 'inherit' });

console.log('[build] DONE — installer is in release/');
