const videoElement = document.getElementById('camera');

let hands;
let camera;
let gestureEnabled = false;

function isFist(landmarks) {
  const tips = [8, 12, 16, 20];
  const palm = landmarks[0];

  let closedCount = 0;

  tips.forEach(tip => {
    const dx = landmarks[tip].x - palm.x;
    const dy = landmarks[tip].y - palm.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.28) { // nới lỏng điều kiện
      closedCount++;
    }
  });

  return closedCount >= 3; // chỉ cần 3 ngón co lại
}

function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

  const landmarks = results.multiHandLandmarks[0];

  if (isFist(landmarks)) {
    triggerHeartFormation();
  }
}

async function initHandTracking() {
  if (gestureEnabled) return;
  gestureEnabled = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });

    videoElement.srcObject = stream;

    hands = new Hands({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    hands.onResults(onResults);

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();
  } catch (err) {
    console.log("Camera error:", err);
  }
}

// 🔥 RẤT QUAN TRỌNG cho iPhone
document.addEventListener("click", initHandTracking, { once: true });
document.addEventListener("touchstart", initHandTracking, { once: true });