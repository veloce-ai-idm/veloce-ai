/**
 * Profile store for Bit-style multi-profile browser (VELOCE AI integration).
 * Stores profiles in app userData/profiles.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getProfilesPath() {
  return path.join(app.getPath('userData'), 'profiles.json');
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  const filePath = getProfilesPath();
  ensureDir(filePath);
  if (!fs.existsSync(filePath)) return { nextId: 1, profiles: [] };
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.nextId != null ? data : { nextId: (data.profiles && data.profiles.length) ? data.profiles.length + 1 : 1, profiles: data.profiles || [] };
  } catch (e) {
    return { nextId: 1, profiles: [] };
  }
}

function save(state) {
  const filePath = getProfilesPath();
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

function list() {
  const state = load();
  return state.profiles || [];
}

function get(id) {
  const state = load();
  return (state.profiles || []).find(function(p) { return p.id === id; });
}

function getDefaultFingerprint() {
  return {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    timezone: 'America/New_York',
    language: 'en-US',
    webrtc: 'replace',
    pcType: 'i7-32',
    gpuType: 'rtx4060',
    ignoreHttpsErrors: false,
  };
}

function add(profile) {
  const state = load();
  const id = String(state.nextId++);
  const created = {
    id: id,
    name: profile.name || 'Unnamed',
    group: profile.group || '',
    proxy: profile.proxy || { type: 'http', host: '', port: '', username: '', password: '' },
    fingerprint: profile.fingerprint || getDefaultFingerprint(),
    openUrls: profile.openUrls || [],
    createdAt: new Date().toISOString(),
    lastOpenedAt: null,
  };
  state.profiles = state.profiles || [];
  state.profiles.push(created);
  save(state);
  return created;
}

function update(id, updates) {
  const state = load();
  state.profiles = state.profiles || [];
  const idx = state.profiles.findIndex(function(p) { return p.id === id; });
  if (idx === -1) return null;
  state.profiles[idx] = Object.assign({}, state.profiles[idx], updates);
  save(state);
  return state.profiles[idx];
}

function remove(id) {
  const state = load();
  state.profiles = (state.profiles || []).filter(function(p) { return p.id !== id; });
  save(state);
  return true;
}

function touchLastOpened(id) {
  return update(id, { lastOpenedAt: new Date().toISOString() });
}

module.exports = {
  getProfilesPath: getProfilesPath,
  load: load,
  save: save,
  list: list,
  get: get,
  add: add,
  update: update,
  remove: remove,
  touchLastOpened: touchLastOpened,
  getDefaultFingerprint: getDefaultFingerprint,
};
