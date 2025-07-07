const importBtn = document.getElementById('importBtn');
const playlistContainer = document.createElement('ul');
document.body.appendChild(playlistContainer);

const audio = document.getElementById('audio');
const titleElem = document.getElementById('song-title');
const artistElem = document.getElementById('song-artist');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const progress = document.getElementById('progress');
const currentTimeElem = document.getElementById('currentTime');
const durationElem = document.getElementById('duration');
const volume = document.getElementById('volume');


let playlist = [];
let currentIndex = -1;
let isPlaying = false;

// 🔁 Charger la playlist
window.electronAPI.loadPlaylist().then((loaded) => {
  playlist = loaded;
  playlist.forEach(addTrackToUI);
});

// 📥 Importer un MP3
importBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.selectFile();
  if (!filePath) return;

  window.electronAPI.saveMP3(filePath);
  playlist.push(filePath);
  addTrackToUI(filePath);
  currentIndex = playlist.length - 1;
  playCurrentTrack();
});

// 🔊 Lecture / pause
playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;

  if (isPlaying) {
    audio.pause();
  } else {
    audio.play();
  }
});

audio.addEventListener('play', () => {
  isPlaying = true;
  playPauseBtn.textContent = '⏸️';
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  playPauseBtn.textContent = '▶️';
});

// ⏭️ Suivant
nextBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  playCurrentTrack();
});

// ⏮️ Précédent
prevBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playCurrentTrack();
});

// ▶️ Jouer un morceau de la playlist
function playCurrentTrack() {
  const filePath = playlist[currentIndex];
  if (!filePath) return;

  audio.src = filePath;
  titleElem.textContent = filePath.split(/(\\|\/)/g).pop();
  artistElem.textContent = 'Inconnu';
  audio.load();
  audio.play();
}

// 📜 Ajouter un titre dans la UI
function addTrackToUI(filePath) {
  const li = document.createElement('li');
  li.textContent = filePath.split(/(\\|\/)/g).pop();
  li.style.cursor = 'pointer';
  li.addEventListener('click', () => {
    currentIndex = playlist.indexOf(filePath);
    playCurrentTrack();
  });
  playlistContainer.appendChild(li);
}

// Quand le fichier est chargé, on met à jour la durée max
audio.addEventListener('loadedmetadata', () => {
  progress.max = Math.floor(audio.duration);
  durationElem.textContent = formatTime(audio.duration);
});

// Pendant la lecture, on met à jour la barre de progression
audio.addEventListener('timeupdate', () => {
  progress.value = Math.floor(audio.currentTime);
  currentTimeElem.textContent = formatTime(audio.currentTime);
});

// Quand l'utilisateur déplace le curseur, on change la position du son
progress.addEventListener('input', () => {
  audio.currentTime = progress.value;
});

// Au changement de la barre de volume
volume.addEventListener('input', () => {
  audio.volume = volume.value;
});

function formatTime(sec) {
  const minutes = Math.floor(sec / 60) || 0;
  const seconds = Math.floor(sec % 60) || 0;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
