let startX = 0;
let videoShown = false;
let heartTriggered = false;

// Fallback: chạm để tạo trái tim (rất quan trọng cho iPhone)
function handleFirstInteraction() {
  if (!heartTriggered) {
    triggerHeartFormation();
    heartTriggered = true;
  }
}

document.addEventListener("click", handleFirstInteraction);
document.addEventListener("touchstart", handleFirstInteraction, { passive: true });

// Vuốt để mở video
document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  if (Math.abs(endX - startX) > 50 && !videoShown) {
    showVideo();
    videoShown = true;
  }
});

// YouTube
let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: 'dQw4w9WgXcQ', // 👉 Thay ID video nếu muốn
    playerVars: { playsinline: 1 },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function showVideo() {
  document.getElementById("videoSection").classList.remove("hidden");
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