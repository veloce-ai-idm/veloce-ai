/**
 * Compile JS → JSC bytecode using Electron's V8 (must match runtime!)
 * Run: ./node_modules/.bin/electron compile.js
 */
const bytenode = require('bytenode');
const path = require('path');
const fs = require('fs');

const files = ['main.js', 'preload.js'];

files.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(__dirname, file.replace('.js', '.jsc'));
  console.log(`Compiling ${file} → ${path.basename(dest)}...`);
  bytenode.compileFile(src, dest);
  const srcSize = fs.statSync(src).size;
  const destSize = fs.statSync(dest).size;
  console.log(`  ${(srcSize/1024).toFixed(1)}KB → ${(destSize/1024).toFixed(1)}KB ✓`);
});

console.log('\nDone. Electron V8 version:', process.versions.v8);
