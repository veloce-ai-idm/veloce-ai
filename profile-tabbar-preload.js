/**
 * Preload for profile browser tab bar (no partition — UI only).
 * Exposes add/switch/close tab and receives tab list updates from main.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('profileTabs', {
  addTab: () => ipcRenderer.invoke('profile-tabs-add'),
  switchTab: (index) => ipcRenderer.invoke('profile-tabs-switch', index),
  closeTab: (index) => ipcRenderer.invoke('profile-tabs-close', index),
  onUpdate: (callback) => {
    ipcRenderer.on('profile-tabs-update', (event, data) => {
      if (typeof callback === 'function') callback(data);
    });
  },
});
