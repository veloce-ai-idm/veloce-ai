/**
 * bytenode compiler for the VELOCE build — MUST run under Electron
 * (ELECTRON_RUN_AS_NODE=1) so the bytecode matches the app's V8.
 * Compiles the WORKSPACE main.js into build-staging/main.jsc.
 * The workspace source is never modified.
 */
'use strict';
const bytenode = require('bytenode');
const path = require('path');

const out = path.join(__dirname, 'build-staging', 'main.jsc');
bytenode.compileFile(path.join(__dirname, 'main.js'), out);
console.log('[build] main.jsc compiled with V8 ' + process.versions.v8 + ' -> ' + out);
