import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const PARTICLE_COUNT = 18000;
const EXPLODE_DURATION = 1.55;
const HOLD_DURATION = 5.0;
const REGATHER_DURATION = 3.5;
const CLICK_CYCLE_DURATION = EXPLODE_DURATION + HOLD_DURATION + REGATHER_DURATION;

const DEFAULT_CAMERA_RADIUS = 230;
const MIN_CAMERA_RADIUS = 110;
const MAX_CAMERA_RADIUS = 420;
const DRAG_SENSITIVITY = 0.0055;
const MAX_PITCH = 0.85;

const PARTICLE_COLOR = '#ff5c93';
const BIRTHDAY_LINES = ['CHÚC MỪNG', 'SINH NHẬT', 'KHÁNH TÂMM'];

const container = document.getElementById('introApp');

let renderer, scene, camera, clock, particles;
let geometry, material;
let elapsedTime = 0;

const positions = new Float32Array(PARTICLE_COUNT * 3);
const heartPositions = new Float32Array(PARTICLE_COUNT * 3);
const textPositions = new Float32Array(PARTICLE_COUNT * 3);
const scatterPositions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = new Float32Array(PARTICLE_COUNT * 3);
const seeds = new Float32Array(PARTICLE_COUNT * 4);
const colors = new Float32Array(PARTICLE_COUNT * 3);
const randomFactors = new Float32Array(PARTICLE_COUNT);

const particleTone = new THREE.Color(PARTICLE_COLOR);

let currentShape = 'heart';
let nextShape = 'text';

const burst = {
  active: false,
  elapsed: CLICK_CYCLE_DURATION,
  gain: 1,
  destination: 'text'
};

const drag = {
  active: false,
  moved: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  pointerId: null
};

const activePointers = new Map();
const pinch = {
  active: false,
  startDistance: 0,
  startRadius: DEFAULT_CAMERA_RADIUS
};

const orbit = {
  targetYaw: 0,
  targetPitch: 0,
  yaw: 0,
  pitch: 0,
  targetRadius: DEFAULT_CAMERA_RADIUS,
  radius: DEFAULT_CAMERA_RADIUS
};

initThree();
initializeParticleState();
buildHeartTargets();
buildTextTargets();
setPositionsFromShape('heart', true);
generateScatterTargets();
applyParticleTone();
animate();

window.addEventListener('resize', onResize);

window.addEventListener('wheel', (event) => {
  event.preventDefault();
  adjustZoom(event.deltaY * 0.12);
}, { passive: false });

window.addEventListener('pointerdown', (event) => {
  if (!container.contains(renderer.domElement)) return;

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 1) {
    drag.active = true;
    drag.moved = false;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    renderer.domElement.classList.add('dragging');
  } else if (activePointers.size === 2) {
    pinch.active = true;
    pinch.startDistance = getPointerDistance();
    pinch.startRadius = orbit.targetRadius;
    drag.active = false;
    drag.moved = true;
    renderer.domElement.classList.remove('dragging');
  }
});

window.addEventListener('pointermove', (event) => {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  if (pinch.active && activePointers.size >= 2) {
    const distance = getPointerDistance();
    if (pinch.startDistance > 0 && distance > 0) {
      const scale = pinch.startDistance / distance;
      orbit.targetRadius = THREE.MathUtils.clamp(
        pinch.startRadius * scale,
        MIN_CAMERA_RADIUS,
        MAX_CAMERA_RADIUS
      );
    }
    return;
  }

  if (!drag.active || drag.pointerId !== event.pointerId) return;

  const dx = event.clientX - drag.lastX;
  const dy = event.clientY - drag.lastY;
  const totalMove = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);

  if (totalMove > 6) drag.moved = true;

  if (drag.moved) {
    orbit.targetYaw += dx * DRAG_SENSITIVITY;
    orbit.targetPitch += dy * DRAG_SENSITIVITY;
    orbit.targetPitch = THREE.MathUtils.clamp(orbit.targetPitch, -MAX_PITCH, MAX_PITCH);
  }

  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
});

window.addEventListener('pointerup', handlePointerEnd);
window.addEventListener('pointercancel', handlePointerEnd);

function initThree() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  container.prepend(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08101d, 0.0036);

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, DEFAULT_CAMERA_RADIUS);

  clock = new THREE.Clock();

  const ambient = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0xff83b0, 5.2, 600, 2);
  pointLight.position.set(90, 120, 130);
  scene.add(pointLight);

  const rimLight = new THREE.PointLight(0xb57cff, 3.4, 500, 2);
  rimLight.position.set(-120, -80, 100);
  scene.add(rimLight);

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomFactors, 1));

  material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uSize: { value: 5.6 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uTime: { value: 0 },
      uOpacity: { value: 0.98 }
    },
    vertexShader: `
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uTime;
      attribute float aRandom;
      varying vec3 vColor;
      varying float vPulse;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float depthScale = 1.0 / max(0.15, -mvPosition.z * 0.02);
        vPulse = 0.55 + 0.45 * sin(uTime * (0.7 + aRandom * 1.2) + aRandom * 6.28318);
        gl_PointSize = uSize * depthScale * uPixelRatio * (0.82 + vPulse * 0.42);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vPulse;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float glow = smoothstep(0.52, 0.0, d);
        float core = smoothstep(0.18, 0.0, d);
        vec3 colorOut = vColor * (0.74 + vPulse * 0.48) + core * 0.22;
        float alpha = max(glow * (0.76 + vPulse * 0.24), core) * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(colorOut, alpha);
      }
    `
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function initializeParticleState() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;

    velocities[i3] = 0;
    velocities[i3 + 1] = 0;
    velocities[i3 + 2] = 0;

    seeds[i * 4] = Math.random() * 2 - 1;
    seeds[i * 4 + 1] = Math.random() * 2 - 1;
    seeds[i * 4 + 2] = Math.random() * 2 - 1;
    seeds[i * 4 + 3] = Math.random() * Math.PI * 2;
    randomFactors[i] = Math.random();
  }
}

function getShapeArray(shape) {
  return shape === 'heart' ? heartPositions : textPositions;
}

function assignPointsToArray(pointList, targetArray, zRange = 2.5) {
  const total = pointList.length;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const point = pointList[(i * 131 + Math.floor(i / 7)) % total];
    targetArray[i3] = point.x + seeds[i * 4] * point.jitter;
    targetArray[i3 + 1] = point.y + seeds[i * 4 + 1] * point.jitter;
    targetArray[i3 + 2] = seeds[i * 4 + 2] * zRange;
  }
}

function sampleCanvasPoints(drawCallback, worldScaleX, worldScaleY, step = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCallback(ctx, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const points = [];

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const alpha = image[(y * canvas.width + x) * 4 + 3];
      if (alpha > 24) {
        const worldX = ((x / canvas.width) - 0.5) * worldScaleX;
        const worldY = (0.5 - (y / canvas.height)) * worldScaleY;
        points.push({ x: worldX, y: worldY, jitter: step * 0.11 });
      }
    }
  }

  return points.length ? points : [{ x: 0, y: 0, jitter: 1 }];
}

function heartPoint(t, scale = 5.8) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: x * scale, y: y * scale };
}

function buildHeartTargets() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const t = (i / PARTICLE_COUNT) * Math.PI * 2;
    const base = heartPoint(t, 5.7 + Math.sin(i * 0.13) * 0.18);
    const layerDepth = (Math.sin(i * 0.17) * 0.5 + Math.cos(i * 0.07) * 0.5) * 22;
    const innerBlend = 0.6 + 0.4 * Math.random();
    const jitter = (Math.random() - 0.5) * 2.6;

    heartPositions[i3] = base.x * innerBlend + seeds[i * 4] * jitter;
    heartPositions[i3 + 1] = base.y * innerBlend + seeds[i * 4 + 1] * jitter;
    heartPositions[i3 + 2] = layerDepth + seeds[i * 4 + 2] * 3.0;
  }
}

function drawSpacedText(ctx, text, centerX, centerY, spacing = 10) {
  const chars = Array.from(text);
  const widths = chars.map((char) => ctx.measureText(char).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, chars.length - 1);
  let cursorX = centerX - totalWidth * 0.5;

  chars.forEach((char, index) => {
    ctx.fillText(char, cursorX + widths[index] * 0.5, centerY);
    cursorX += widths[index] + spacing;
  });
}

function buildTextTargets() {
  const pts = sampleCanvasPoints((ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = w * 0.5;
    const centerY = h * 0.5;

    ctx.font = '900 132px Inter, Segoe UI, Arial, sans-serif';
    drawSpacedText(ctx, BIRTHDAY_LINES[0], centerX, centerY - 170, 10);

    ctx.font = '900 160px Inter, Segoe UI, Arial, sans-serif';
    drawSpacedText(ctx, BIRTHDAY_LINES[1], centerX, centerY - 4, 10);

    ctx.font = '900 170px Inter, Segoe UI, Arial, sans-serif';
    drawSpacedText(ctx, BIRTHDAY_LINES[2], centerX, centerY + 186, 9);
  }, 280, 205, 3);

  assignPointsToArray(pts, textPositions, 1.5);
}

function setPositionsFromShape(shape, resetVelocity = false) {
  const source = getShapeArray(shape);
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    positions[i] = source[i];
    if (resetVelocity) velocities[i] = 0;
  }
  geometry.attributes.position.needsUpdate = true;
}

function generateScatterTargets() {
  const depth = orbit.targetRadius;
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
  const width = height * camera.aspect;
  const padX = width * 0.04;
  const padY = height * 0.04;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    scatterPositions[i3] = THREE.MathUtils.randFloat(-width * 0.5 + padX, width * 0.5 - padX);
    scatterPositions[i3 + 1] = THREE.MathUtils.randFloat(-height * 0.5 + padY, height * 0.5 - padY);
    scatterPositions[i3 + 2] = THREE.MathUtils.randFloatSpread(48);
  }
}

function applyParticleTone() {
  const hsl = {};
  particleTone.getHSL(hsl);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const hueOffset = Math.sin(i * 0.11) * 0.014;
    const lightOffset = (Math.sin(i * 0.09) + 1) * 0.08 - 0.04;
    const saturationBoost = (Math.cos(i * 0.07) + 1) * 0.08;
    const c = new THREE.Color().setHSL(
      (hsl.h + hueOffset + 1) % 1,
      THREE.MathUtils.clamp(hsl.s + saturationBoost, 0.4, 1),
      THREE.MathUtils.clamp(hsl.l + lightOffset, 0.35, 0.84)
    );
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  geometry.attributes.color.needsUpdate = true;
}

function getPointerDistance() {
  const points = Array.from(activePointers.values());
  if (points.length < 2) return 0;
  const dx = points[0].x - points[1].x;
  const dy = points[0].y - points[1].y;
  return Math.hypot(dx, dy);
}

function handlePointerEnd(event) {
  const wasTap = drag.active && drag.pointerId === event.pointerId && !drag.moved && !pinch.active;

  activePointers.delete(event.pointerId);

  if (activePointers.size < 2) {
    pinch.active = false;
  }

  if (activePointers.size === 1) {
    const [remainingId, point] = activePointers.entries().next().value;
    drag.active = true;
    drag.moved = true;
    drag.pointerId = remainingId;
    drag.startX = point.x;
    drag.startY = point.y;
    drag.lastX = point.x;
    drag.lastY = point.y;
    renderer.domElement.classList.add('dragging');
  } else {
    drag.active = false;
    drag.moved = false;
    drag.pointerId = null;
    renderer.domElement.classList.remove('dragging');
  }

  if (wasTap) {
    triggerBurst(1.2);
  }
}

function adjustZoom(delta) {
  orbit.targetRadius = THREE.MathUtils.clamp(
    orbit.targetRadius + delta,
    MIN_CAMERA_RADIUS,
    MAX_CAMERA_RADIUS
  );
}

function triggerBurst(gain = 1) {
  if (burst.active) return;

  nextShape = currentShape === 'heart' ? 'text' : 'heart';
  burst.destination = nextShape;
  burst.active = true;
  burst.elapsed = 0;
  burst.gain = gain;
  generateScatterTargets();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const toX = scatterPositions[i3] - positions[i3];
    const toY = scatterPositions[i3 + 1] - positions[i3 + 1];
    const toZ = scatterPositions[i3 + 2] - positions[i3 + 2];
    const invLen = 1 / Math.sqrt(toX * toX + toY * toY + toZ * toZ + 0.0001);
    const softForce = (1.45 + Math.random() * 1.1) * gain;
    velocities[i3] = toX * invLen * softForce + seeds[i * 4] * 0.32;
    velocities[i3 + 1] = toY * invLen * softForce + seeds[i * 4 + 1] * 0.32;
    velocities[i3 + 2] = toZ * invLen * (softForce * 0.7) + seeds[i * 4 + 2] * 0.22;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.033, clock.getDelta());
  elapsedTime += delta;
  material.uniforms.uTime.value = elapsedTime;

  updateBurstState(delta);
  updateParticles(elapsedTime);
  updateCamera(delta);

  renderer.render(scene, camera);
}

function updateBurstState(delta) {
  if (!burst.active) return;

  burst.elapsed += delta;

  if (burst.elapsed >= CLICK_CYCLE_DURATION) {
    burst.active = false;
    currentShape = burst.destination;
    nextShape = currentShape === 'heart' ? 'text' : 'heart';
  }
}

function updateParticles(time) {
  const explodeEnd = EXPLODE_DURATION;
  const driftEnd = EXPLODE_DURATION + HOLD_DURATION;
  const morphInProgress = burst.active && burst.elapsed > driftEnd
    ? THREE.MathUtils.smoothstep(
        THREE.MathUtils.clamp((burst.elapsed - driftEnd) / REGATHER_DURATION, 0, 1),
        0,
        1
      )
    : 0;

  const driftStrength = burst.active
    ? (burst.elapsed < explodeEnd ? THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(burst.elapsed / EXPLODE_DURATION, 0, 1), 0, 1) * 0.55
      : burst.elapsed < driftEnd ? 1
      : 1 - morphInProgress)
    : 0;

  const scatterSpring = burst.active
    ? (burst.elapsed < explodeEnd ? 0.012 + morphInProgress * 0.006 : 0.008)
    : 0;

  const gatherSpring = 0.024 + morphInProgress * 0.074;
  const damping = burst.active
    ? (burst.elapsed < explodeEnd ? 0.952 : burst.elapsed < driftEnd ? 0.968 : 0.925)
    : 0.91;

  const stableTarget = getShapeArray(currentShape);
  const destinationTarget = getShapeArray(burst.destination);
  const stablePulse = !burst.active
    ? currentShape === 'heart'
      ? 1 + Math.sin(time * 2.15) * 0.015
      : 1 + Math.sin(time * 1.9) * 0.0075
    : 1;
  const stableYOffset = !burst.active && currentShape === 'text'
    ? Math.sin(time * 1.9) * 0.7
    : 0;

  material.uniforms.uSize.value = THREE.MathUtils.lerp(5.7, 4.9, morphInProgress);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const s4 = i * 4;

    const baseTarget = burst.active ? destinationTarget : stableTarget;
    const baseX = baseTarget[i3] * stablePulse;
    const baseY = baseTarget[i3 + 1] * stablePulse + stableYOffset;
    const baseZ = baseTarget[i3 + 2];

    const fireflyX =
      Math.sin(time * (0.36 + randomFactors[i] * 0.28) + seeds[s4 + 3]) * (5.0 + randomFactors[i] * 6.0) +
      Math.cos(time * (0.21 + randomFactors[i] * 0.16) + seeds[s4] * 4.0) * 2.0;
    const fireflyY =
      Math.cos(time * (0.31 + randomFactors[i] * 0.26) + seeds[s4 + 3] * 1.2) * (4.2 + randomFactors[i] * 5.2) +
      Math.sin(time * (0.19 + randomFactors[i] * 0.14) + seeds[s4 + 1] * 4.6) * 1.8;
    const fireflyZ =
      Math.sin(time * (0.24 + randomFactors[i] * 0.2) + seeds[s4 + 2] * 5.2) * (2.0 + randomFactors[i] * 3.2);

    const sx = scatterPositions[i3] + fireflyX * driftStrength;
    const sy = scatterPositions[i3 + 1] + fireflyY * driftStrength;
    const sz = scatterPositions[i3 + 2] + fireflyZ * driftStrength;

    const targetX = burst.active ? THREE.MathUtils.lerp(sx, baseX, morphInProgress) : baseX;
    const targetY = burst.active ? THREE.MathUtils.lerp(sy, baseY, morphInProgress) : baseY;
    const targetZ = burst.active ? THREE.MathUtils.lerp(sz, baseZ, morphInProgress) : baseZ;

    const px = positions[i3];
    const py = positions[i3 + 1];
    const pz = positions[i3 + 2];

    const dx = targetX - px;
    const dy = targetY - py;
    const dz = targetZ - pz;

    let vx = velocities[i3];
    let vy = velocities[i3 + 1];
    let vz = velocities[i3 + 2];

    if (burst.active && burst.elapsed < driftEnd) {
      vx += dx * scatterSpring;
      vy += dy * scatterSpring;
      vz += dz * scatterSpring;
    } else {
      vx += dx * gatherSpring;
      vy += dy * gatherSpring;
      vz += dz * gatherSpring;
    }

    vx += Math.sin(time * 0.44 + seeds[s4 + 3] * 1.3) * 0.0028 * driftStrength;
    vy += Math.cos(time * 0.39 + seeds[s4 + 3] * 0.8) * 0.0028 * driftStrength;
    vz += Math.sin(time * 0.27 + seeds[s4 + 3] * 1.6) * 0.0016 * driftStrength;

    vx *= damping;
    vy *= damping;
    vz *= damping;

    positions[i3] = px + vx;
    positions[i3 + 1] = py + vy;
    positions[i3 + 2] = pz + vz;

    velocities[i3] = vx;
    velocities[i3 + 1] = vy;
    velocities[i3 + 2] = vz;
  }

  geometry.attributes.position.needsUpdate = true;
}

function updateCamera(delta) {
  if (!drag.active) {
    orbit.targetYaw *= Math.pow(0.92, delta * 60);
    orbit.targetPitch *= Math.pow(0.9, delta * 60);
  }

  orbit.yaw += (orbit.targetYaw - orbit.yaw) * 0.12;
  orbit.pitch += (orbit.targetPitch - orbit.pitch) * 0.12;
  orbit.radius += (orbit.targetRadius - orbit.radius) * 0.14;

  const x = Math.sin(orbit.yaw) * orbit.radius * Math.cos(orbit.pitch);
  const y = Math.sin(orbit.pitch) * orbit.radius * 0.82;
  const z = Math.cos(orbit.yaw) * orbit.radius * Math.cos(orbit.pitch);

  camera.position.x += (x - camera.position.x) * 0.18;
  camera.position.y += (y - camera.position.y) * 0.18;
  camera.position.z += (z - camera.position.z) * 0.18;
  camera.lookAt(0, 0, 0);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);

  buildHeartTargets();
  buildTextTargets();

  if (!burst.active) setPositionsFromShape(currentShape, false);
  generateScatterTargets();
}

window.triggerIntroBurst = triggerBurst;