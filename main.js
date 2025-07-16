const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { parseFile } = require('music-metadata');

const playlistPath = path.join(app.getPath('userData'), 'playlist.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
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

// ✅ Fermer la fenêtre
ipcMain.handle('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

// ✅ Extract metadata from audio file
ipcMain.handle('get-metadata', async (event, filePath) => {
  try {
    console.log('Attempting to parse metadata for:', filePath);
    const metadata = await parseFile(filePath);
    console.log('Successfully parsed metadata:', metadata);
    
    return {
      title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration || 0
    };
  } catch (error) {
    console.error('Error reading metadata:', error);
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0
    };
  }
});

ipcMain.handle('write-metadata', (event, filePath, metadata) => {
  const success = NodeID3.write(metadata, filePath);
  if (!success) {
    throw new Error("Échec de l’écriture des métadonnées.");
  }
});
