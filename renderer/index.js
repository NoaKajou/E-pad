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
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');


let playlist = [];
let currentIndex = -1;
let isPlaying = false;
let isShuffleMode = false;
let isRepeatMode = false;
let shuffledIndices = [];

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
  playNextTrack();
});

// ⏮️ Précédent
prevBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  playPreviousTrack();
});

// 🔀 Shuffle mode
shuffleBtn.addEventListener('click', () => {
  isShuffleMode = !isShuffleMode;
  shuffleBtn.classList.toggle('active', isShuffleMode);
  
  if (isShuffleMode) {
    generateShuffledIndices();
  }
});

// 🔁 Repeat mode
repeatBtn.addEventListener('click', () => {
  isRepeatMode = !isRepeatMode;
  repeatBtn.classList.toggle('active', isRepeatMode);
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

function updateTitle(text) {
  const titleEl = document.getElementById("song-title");
  titleEl.textContent = text;

  const parentWidth = titleEl.parentElement.offsetWidth;
  const scrollWidth = titleEl.scrollWidth;

  // Activer ou désactiver l’animation selon la longueur
  if (scrollWidth > parentWidth) {
    titleEl.style.animation = "scroll-text 10s linear infinite";
  } else {
    titleEl.style.animation = "none";
  }
}

// ===== SHUFFLE & REPEAT FUNCTIONS =====

function generateShuffledIndices() {
  shuffledIndices = [...Array(playlist.length).keys()];
  // Fisher-Yates shuffle algorithm
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }
}

function playNextTrack() {
  if (playlist.length === 0) return;
  
  if (isShuffleMode) {
    if (shuffledIndices.length === 0) {
      generateShuffledIndices();
    }
    
    const currentShuffledIndex = shuffledIndices.findIndex(index => index === currentIndex);
    const nextShuffledIndex = (currentShuffledIndex + 1) % shuffledIndices.length;
    currentIndex = shuffledIndices[nextShuffledIndex];
  } else {
    currentIndex = (currentIndex + 1) % playlist.length;
  }
  
  playCurrentTrack();
}

function playPreviousTrack() {
  if (playlist.length === 0) return;
  
  if (isShuffleMode) {
    if (shuffledIndices.length === 0) {
      generateShuffledIndices();
    }
    
    const currentShuffledIndex = shuffledIndices.findIndex(index => index === currentIndex);
    const prevShuffledIndex = (currentShuffledIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
    currentIndex = shuffledIndices[prevShuffledIndex];
  } else {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  }
  
  playCurrentTrack();
}

// Handle track end for repeat mode
audio.addEventListener('ended', () => {
  if (isRepeatMode) {
    // Repeat current track
    audio.currentTime = 0;
    audio.play();
  } else {
    // Play next track
    playNextTrack();
  }
});
