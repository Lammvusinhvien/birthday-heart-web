const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let particles = [];
let formingHeart = false;
let heartScale = 1;

function createParticles() {
  particles = [];
  for (let i = 0; i < 300; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 1,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.2,
      color: `rgba(255, ${Math.random()*120}, ${Math.random()*200+55}, 0.9)`
    });
  }
}

function heart(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x, y };
}

function triggerHeartFormation() {
  if (formingHeart) return;
  formingHeart = true;

  particles.forEach((p, i) => {
    const t = (i / particles.length) * Math.PI * 2;
    const pos = heart(t);
    p.targetX = canvas.width / 2 + pos.x * 15;
    p.targetY = canvas.height / 2 + pos.y * 15;
  });

  setTimeout(() => {
    document.getElementById("birthdayText").classList.remove("hidden");
  }, 1200);
}

function update() {
  particles.forEach(p => {
    if (formingHeart) {
      p.x += (p.targetX - p.x) * 0.08;
      p.y += (p.targetY - p.y) * 0.08;
    } else {
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
    }
  });

  if (formingHeart) {
    heartScale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(heartScale, heartScale);
  ctx.translate(-canvas.width/2, -canvas.height/2);

  particles.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff69b4";
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });

  ctx.restore();
}

function animate() {
  update();
  draw();
  requestAnimationFrame(animate);
}

createParticles();
animate();