const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - runs before web page loads
 * Provides safe bridge between Electron and web content
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Backend health check
  checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),

  // Platform information
  platform: process.platform,

  // Node version (for debugging)
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Optional: Expose a flag to detect if running in Electron
contextBridge.exposeInMainWorld('isElectron', true);

console.log('Preload script loaded successfully');
