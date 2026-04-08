const videoElement = document.getElementById('camera');

function isFist(landmarks) {
  const tips = [8, 12, 16, 20];
  const palm = landmarks[0];
  return tips.every(tip => {
    const dx = landmarks[tip].x - palm.x;
    const dy = landmarks[tip].y - palm.y;
    return Math.sqrt(dx * dx + dy * dy) < 0.15;
  });
}

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    if (isFist(landmarks)) {
      triggerHeartFormation();
    }
  }
}

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    const hands = new Hands({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();
  } catch (error) {
    console.warn("Không thể truy cập camera:", error);
  }
}

window.addEventListener("load", initCamera);