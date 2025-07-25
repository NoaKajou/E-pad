const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveMP3: (filePath) => ipcRenderer.invoke('save-mp3', filePath),
  loadPlaylist: () => ipcRenderer.invoke('load-playlist'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  getMetadata: (filePath) => ipcRenderer.invoke('get-metadata', filePath),
});
