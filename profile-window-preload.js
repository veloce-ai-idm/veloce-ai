/**
 * Preload for profile browser window. Page loads directly (e.g. Google);
 * main injects a tab bar and this exposes switch/add/close to the injected script.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('veloceProfile', {
  switchTab: function(index) { ipcRenderer.send('profile-switch-tab', index); },
  addTab: function() { ipcRenderer.send('profile-add-tab'); },
  closeTab: function(index) { ipcRenderer.send('profile-close-tab', index); },
});
