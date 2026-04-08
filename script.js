const music = document.getElementById("bgMusic");

const introScreen = document.getElementById("introScreen");
const videoScreen = document.getElementById("videoScreen");
const endScreen = document.getElementById("endScreen");

const btnIntroNext = document.getElementById("btnIntroNext");
const btnVideoBack = document.getElementById("btnVideoBack");
const btnVideoNext = document.getElementById("btnVideoNext");
const btnEndBack = document.getElementById("btnEndBack");

let musicStarted = false;

function showScreen(screen) {
  [introScreen, videoScreen, endScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function fadeOutMusic(duration = 300) {
  const startVolume = music.volume || 1;
  const step = startVolume / (duration / 30);

  const timer = setInterval(() => {
    music.volume = Math.max(0, music.volume - step);
    if (music.volume <= 0.001) {
      clearInterval(timer);
      music.pause();
      music.volume = 1;
    }
  }, 30);
}

function fadeInMusic(duration = 300) {
  music.volume = 0;
  music.play().catch(() => {});
  const step = 1 / (duration / 30);

  const timer = setInterval(() => {
    music.volume = Math.min(1, music.volume + step);
    if (music.volume >= 0.999) {
      clearInterval(timer);
      music.volume = 1;
    }
  }, 30);
}

document.addEventListener("click", () => {
  if (!musicStarted) {
    music.play().catch(() => {});
    musicStarted = true;
  }
}, { once: true });

btnIntroNext.addEventListener("click", () => {
  fadeOutMusic(300);
  showScreen(videoScreen);
});

btnVideoBack.addEventListener("click", () => {
  showScreen(introScreen);
  fadeInMusic(300);
});

btnVideoNext.addEventListener("click", () => {
  showScreen(endScreen);
});

btnEndBack.addEventListener("click", () => {
  showScreen(introScreen);
  fadeInMusic(300);
});