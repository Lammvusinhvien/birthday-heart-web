const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];
let formingHeart = false;

function createParticles() {
  particles = [];
  for (let i = 0; i < 220; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
}

function heartShape(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x * 12, y: y * 12 };
}

function triggerHeartFormation() {
  if (formingHeart) return;
  formingHeart = true;

  particles.forEach((p, i) => {
    const t = (i / particles.length) * Math.PI * 2;
    const pos = heartShape(t);
    p.targetX = canvas.width / 2 + pos.x;
    p.targetY = canvas.height / 2 + pos.y;
    p.color = "#ff69b4";
  });

  setTimeout(() => {
    document.getElementById("birthdayText").classList.remove("hidden");
  }, 1200);
}

function update() {
  particles.forEach(p => {
    if (formingHeart) {
      p.x += (p.targetX - p.x) * 0.06;
      p.y += (p.targetY - p.y) * 0.06;
    } else {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
}

function animate() {
  update();
  draw();
  requestAnimationFrame(animate);
}

createParticles();
animate();