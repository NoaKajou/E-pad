const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const playlistPath = path.join(app.getPath('userData'), 'playlist.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('renderer/index.html');
}

app.whenReady().then(() => {
  createWindow();
});

// ✅ Lecture de la playlist au démarrage
ipcMain.handle('load-playlist', () => {
  try {
    if (!fs.existsSync(playlistPath)) return [];
    const content = fs.readFileSync(playlistPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
});

// ✅ Enregistrer un MP3 dans la playlist
ipcMain.handle('save-mp3', (event, filePath) => {
  let playlist = [];
  if (fs.existsSync(playlistPath)) {
    playlist = JSON.parse(fs.readFileSync(playlistPath));
  }
  if (!playlist.includes(filePath)) {
    playlist.push(filePath);
    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
  }
});

// ✅ Sélectionner un fichier audio
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'flac', 'ogg', 'wav'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});
