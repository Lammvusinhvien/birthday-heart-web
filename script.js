let startX = 0;
let videoShown = false;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  if (Math.abs(endX - startX) > 50 && !videoShown) {
    showVideo();
    videoShown = true;
  }
});

// Fallback: chạm màn hình để tạo trái tim
document.addEventListener("click", () => {
  triggerHeartFormation();
});

document.addEventListener("touchstart", () => {
  triggerHeartFormation();
}, { once: true });

function showVideo() {
  document.getElementById("videoSection").classList.remove("hidden");
  loadYouTube();
}

let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: 'dQw4w9WgXcQ', // Thay bằng video của bạn
    playerVars: { playsinline: 1 },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function loadYouTube() {
  if (window.YT && YT.Player) {
    onYouTubeIframeAPIReady();
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    document.getElementById("videoSection").classList.add("hidden");
    document.getElementById("question").classList.remove("hidden");
  }
}