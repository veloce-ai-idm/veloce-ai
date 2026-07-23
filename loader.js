/**
 * VELOCE AI — Electron loader
 * Enables bytenode .jsc bytecode support, then boots the main process.
 */
'use strict';
require('bytenode');
require('./main.jsc');
