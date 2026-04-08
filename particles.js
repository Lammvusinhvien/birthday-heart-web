const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let formingHeart = false;

function createParticles() {
  particles = [];
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
}

function drawHeartShape(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x * 10, y: y * 10 };
}

function triggerHeartFormation() {
  if (formingHeart) return;
  formingHeart = true;

  particles.forEach((p, i) => {
    const t = (i / particles.length) * Math.PI * 2;
    const pos = drawHeartShape(t);
    p.targetX = canvas.width / 2 + pos.x;
    p.targetY = canvas.height / 2 + pos.y;
    p.color = "#ff69b4";
  });

  setTimeout(() => {
    document.getElementById("birthdayText").classList.remove("hidden");
  }, 1500);
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    if (formingHeart) {
      p.x += (p.targetX - p.x) * 0.05;
      p.y += (p.targetY - p.y) * 0.05;
    } else {
      p.x += p.vx;
      p.y += p.vy;
    }

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createParticles();
});

createParticles();
animate();