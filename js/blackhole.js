// blackhole.js
// Futuristic 360° space environment + animated black hole with interactive popups.
// Uses global THREE from `js/vendor/three.min.js` (works in file:// and on GitHub Pages).

const POPUPS = {
  core: {
    title: "Singularity (Core)",
    body:
      "Scientists use the word “singularity” for the predicted ultra‑dense core. It’s a place where our current physics can’t fully explain what happens, so it’s still one of the biggest mysteries in science."
  },
  horizon: {
    title: "Event Horizon",
    body:
      "The event horizon is the boundary of no return. If something crosses it, it cannot escape or send information back out (not even light)."
  },
  disk: {
    title: "Accretion Disk (Plasma Ring)",
    body:
      "This glowing ring is super‑hot gas and dust orbiting the black hole. As it spirals in, it heats up and shines—often the brightest thing you can actually see."
  },
  lens: {
    title: "Gravity Distortion (Lensing)",
    body:
      "A black hole bends spacetime so strongly that light paths curve. That’s why stars can look warped or doubled around the black hole."
  }
};

function $(id) {
  return document.getElementById(id);
}

function showModal(topicKey) {
  const data = POPUPS[topicKey];
  if (!data) return;
  const modal = $("bh-modal");
  const title = $("bh-modal-title");
  const body = $("bh-modal-body");
  if (!modal || !title || !body) return;
  title.textContent = data.title;
  body.textContent = data.body;
  modal.classList.remove("hidden");
}

function hideModal() {
  const modal = $("bh-modal");
  if (modal) modal.classList.add("hidden");
}

function hideLoader() {
  const overlay = $("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}

function createNebulaTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Base cosmic gradient
  const bg = ctx.createRadialGradient(
    size * 0.35,
    size * 0.25,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.9
  );
  bg.addColorStop(0, "#2b0b52");
  bg.addColorStop(0.35, "#090a2a");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Nebula clouds (soft blobs)
  const blobs = [
    { c: "#8a2be2", a: 0.22 },
    { c: "#00bfff", a: 0.18 },
    { c: "#ff2d78", a: 0.14 },
    { c: "#7cfffb", a: 0.10 }
  ];
  for (let i = 0; i < 36; i++) {
    const b = blobs[i % blobs.length];
    ctx.globalAlpha = b.a;
    ctx.fillStyle = b.c;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = size * (0.05 + Math.random() * 0.18);
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, b.c);
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny stars
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const s = Math.random() < 0.92 ? 1 : 2;
    ctx.fillStyle = i % 11 === 0 ? "#b5e7ff" : "#ffffff";
    ctx.globalAlpha = 0.25 + Math.random() * 0.7;
    ctx.fillRect(x, y, s, s);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

function makeStarField(count, radius) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    pos[i3 + 2] = radius * Math.cos(phi);

    // Rainbow-ish star colors
    c.setHSL(0.52 + (Math.random() - 0.5) * 0.18, 0.55, 0.72 + Math.random() * 0.22);
    col[i3] = c.r;
    col[i3 + 1] = c.g;
    col[i3 + 2] = c.b;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9
  });
  return new THREE.Points(geo, mat);
}

function makeGalaxyBillboards() {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(18, 12);

  function galaxyTexture(hue) {
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext("2d");
    const grd = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
    grd.addColorStop(0, `hsla(${hue}, 90%, 90%, 1)`);
    grd.addColorStop(0.35, `hsla(${hue}, 80%, 60%, 0.55)`);
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(canvas);
  }

  for (let i = 0; i < 6; i++) {
    const hue = 190 + i * 22;
    const mat = new THREE.MeshBasicMaterial({
      map: galaxyTexture(hue),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 90,
      -90 - Math.random() * 90
    );
    m.rotation.y = Math.random() * Math.PI;
    m.userData.drift = 0.15 + Math.random() * 0.2;
    group.add(m);
  }
  return group;
}

function makeBlackHole(interactive) {
  const group = new THREE.Group();

  // Core shadow
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  core.userData.topic = "core";
  group.add(core);
  interactive.push(core);

  // Event horizon glow shell
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0xb57cff, transparent: true, opacity: 0.22 })
  );
  horizon.userData.topic = "horizon";
  group.add(horizon);
  interactive.push(horizon);

  // Photon sphere (cyan)
  const photon = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x7cfffb, transparent: true, opacity: 0.12 })
  );
  photon.userData.topic = "lens";
  group.add(photon);
  interactive.push(photon);

  // Accretion disk (rainbow plasma texture on ring)
  const inner = 4.8;
  const outer = 10.4;
  const ringGeo = new THREE.RingGeometry(inner, outer, 180);

  const plasmaCanvas = document.createElement("canvas");
  plasmaCanvas.width = plasmaCanvas.height = 1024;
  const ctx = plasmaCanvas.getContext("2d");
  const cx = 512,
    cy = 512;
  const grd = ctx.createRadialGradient(cx, cy, 80, cx, cy, 520);
  grd.addColorStop(0.0, "#ffffff");
  grd.addColorStop(0.12, "#a855f7");
  grd.addColorStop(0.32, "#22d3ee");
  grd.addColorStop(0.52, "#ff2d78");
  grd.addColorStop(0.72, "#7cfffb");
  grd.addColorStop(1.0, "#070012");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff" : "#7cfffb";
    ctx.beginPath();
    ctx.ellipse(
      cx + (Math.random() - 0.5) * 260,
      cy + (Math.random() - 0.5) * 260,
      180 + Math.random() * 240,
      8 + Math.random() * 30,
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  const plasmaTex = new THREE.CanvasTexture(plasmaCanvas);
  plasmaTex.center.set(0.5, 0.5);

  const diskMat = new THREE.MeshBasicMaterial({
    map: plasmaTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const disk = new THREE.Mesh(ringGeo, diskMat);
  disk.rotation.x = Math.PI / 2.15;
  disk.userData.topic = "disk";
  group.add(disk);
  interactive.push(disk);

  // Lensing ring (torus)
  const lensRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.25, 0.33, 32, 260),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending
    })
  );
  lensRing.rotation.x = Math.PI / 2.15;
  lensRing.userData.topic = "lens";
  group.add(lensRing);

  // Floating particles (dust)
  const dust = makeStarField(900, 28);
  dust.material.size = 0.55;
  dust.material.opacity = 0.55;
  group.add(dust);

  group.userData = { core, horizon, photon, disk, lensRing, dust };
  return group;
}

function spawnShootingStar(streaks) {
  const sGeo = new THREE.BufferGeometry();
  const len = 2.2 + Math.random() * 3;
  const pos = new Float32Array([0, 0, 0, -len, -len * 0.2, -len * 1.2]);
  sGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const line = new THREE.Line(sGeo, mat);
  line.position.set(
    (Math.random() - 0.5) * 140,
    30 + Math.random() * 40,
    -80 - Math.random() * 140
  );
  line.userData.life = 0;
  line.userData.speed = 18 + Math.random() * 18;
  streaks.add(line);
}

(function () {
  let spaceModeEnabled = false;

  function initBlackHoleExperience() {
  const canvas = $("universeCanvas");
  if (!canvas) {
    hideLoader();
    return;
  }

  // Modal wiring
  const closeBtn = $("bh-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  const modal = $("bh-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideModal();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
  });

  if (!window.THREE) {
    console.warn("Three.js not found. Ensure `js/vendor/three.min.js` is present.");
    hideLoader();
    return;
  }

  const THREE = window.THREE;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) {
    console.warn("WebGL unavailable:", e);
    hideLoader();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x02010a, 1);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1200
  );
  camera.position.set(0, 2, 28);

  // 360° sky
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(420, 48, 48),
    new THREE.MeshBasicMaterial({
      map: createNebulaTexture(),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.92
    })
  );
  scene.add(sky);

  // Star field + dust
  const stars = makeStarField(4200, 320);
  scene.add(stars);

  // Moving galaxies
  const galaxies = makeGalaxyBillboards();
  scene.add(galaxies);

  // Black hole + interactive mesh list
  const interactive = [];
  const bh = makeBlackHole(interactive);
  scene.add(bh);

  // Controls (custom orbit): drag to look around, wheel/pinch to zoom (in space mode).
  const target = new THREE.Vector3(0, 0.2, 0);
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(camera.position.clone().sub(target));

  const controlState = {
    enabled: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
    rotateSpeed: 0.006,
    zoomSpeed: 0.0016,
    minR: 8,
    maxR: 110,
    vTheta: 0,
    vPhi: 0,
    vR: 0
  };

  function applyCameraFromSpherical() {
    spherical.radius = Math.max(controlState.minR, Math.min(controlState.maxR, spherical.radius));
    spherical.phi = Math.max(0.18, Math.min(Math.PI - 0.18, spherical.phi));
    const pos = new THREE.Vector3().setFromSpherical(spherical).add(target);
    camera.position.copy(pos);
    camera.lookAt(target);
  }
  applyCameraFromSpherical();

  function onPointerDown(e) {
    if (!controlState.enabled) return;
    controlState.dragging = true;
    controlState.lastX = e.clientX;
    controlState.lastY = e.clientY;
  }
  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (!controlState.enabled || !controlState.dragging) return;
    const dx = e.clientX - controlState.lastX;
    const dy = e.clientY - controlState.lastY;
    controlState.lastX = e.clientX;
    controlState.lastY = e.clientY;

    controlState.vTheta -= dx * controlState.rotateSpeed;
    controlState.vPhi -= dy * controlState.rotateSpeed;
  }
  function onPointerUp() {
    controlState.dragging = false;
  }

  function onWheel(e) {
    if (!controlState.enabled) return;
    e.preventDefault();
    controlState.vR += e.deltaY * controlState.zoomSpeed;
  }

  // Touch pinch zoom
  let pinchDist = null;
  function dist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function onTouchMove(e) {
    if (!controlState.enabled) return;
    if (e.touches && e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      if (pinchDist !== null) {
        const delta = pinchDist - d;
        controlState.vR += delta * 0.004;
      }
      pinchDist = d;
    }
  }
  function onTouchEnd() {
    pinchDist = null;
  }

  // Hover tooltip (optional)
  const tip = $("space-tooltip");
  const tipTitle = $("tooltip-title");
  const tipBody = $("tooltip-body");

  function setTooltip(title, body) {
    if (!tip || !tipTitle || !tipBody) return;
    tipTitle.textContent = title;
    tipBody.textContent = body;
    tip.classList.remove("hidden");
  }
  function hideTooltip() {
    if (!tip) return;
    tip.classList.add("hidden");
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastHoverTopic = null;

  function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactive, true);
    if (hits.length) {
      const topic = hits[0].object.userData.topic;
      if (topic) showModal(topic);
    }
  }

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("click", onClick);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
  renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
  renderer.domElement.addEventListener("touchend", onTouchEnd);

  // Lab focus buttons
  document.querySelectorAll(".lab-focus-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const focus = btn.getAttribute("data-focus");
      if (focus === "core") camera.position.set(10, 2, 12);
      if (focus === "disk") camera.position.set(2, 10, 15);
      if (focus === "photon") camera.position.set(0, 4, 10);
      if (focus === "horizon") camera.position.set(0, 1.5, 9);
      if (focus === "orbit") camera.position.set(20, 12, 20);
      controls.update();
      if (focus && POPUPS[focus]) showModal(focus);
    });
  });

  // Shooting stars
  const streaks = new THREE.Group();
  scene.add(streaks);
  let shootingTimer = 0;

  // Floating facts
  const factList = [
    "Fact: Time runs slower near strong gravity.",
    "Fact: Supermassive black holes live in galaxy centers.",
    "Fact: Black holes can merge and create gravitational waves.",
    "Fact: The “black hole image” is a shadow surrounded by glowing gas."
  ];
  let factIdx = 0;
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const showFact = () => {
    if (!heroSubtitle) return;
    heroSubtitle.textContent = factList[factIdx % factList.length];
    factIdx += 1;
  };
  setInterval(showFact, 9000);

  // Start journey and space mode buttons
  const startBtn = $("startJourneyBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const journey = $("journey");
      if (journey) journey.scrollIntoView({ behavior: "smooth" });
    });
  }

  const spaceBtn = $("spaceModeBtn");
  const spaceToggle = $("spaceModeToggle");

  function applySpaceMode(enabled) {
    spaceModeEnabled = enabled;
    controlState.enabled = enabled;

    if (spaceBtn) {
      if (enabled) {
        spaceBtn.textContent = "SPACE MODE ACTIVE";
      } else {
        spaceBtn.innerHTML =
          "🚀 ENTER SPACE MODE<span class=\"btn-subtext\">Enable 3D space navigation</span>";
      }
    }
    if (spaceToggle) {
      if (enabled) {
        spaceToggle.classList.remove("hidden");
      } else {
        spaceToggle.classList.add("hidden");
      }
    }
  }

  if (spaceBtn) {
    spaceBtn.addEventListener("click", () => {
      applySpaceMode(true);
      // Re‑center camera and give a quick lensing explanation.
      spherical.radius = 26;
      spherical.theta = Math.PI / 2;
      spherical.phi = Math.PI / 2.4;
      applyCameraFromSpherical();
      showModal("lens");
    });
  }
  if (spaceToggle) {
    spaceToggle.addEventListener("click", () => {
      applySpaceMode(false);
    });
  }

  // Sound effects (tiny + optional)
  let audioCtx = null;
  function playPing() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = 440 + Math.random() * 220;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      o.stop(audioCtx.currentTime + 0.14);
    } catch {
      // ignore
    }
  }
  window.addEventListener("click", playPing, { once: true });

  // Render loop
  const clock = new THREE.Clock();

  function render() {
    const t = clock.getElapsedTime();
    // Controls smoothing / floating feel.
    controlState.vTheta *= 0.88;
    controlState.vPhi *= 0.88;
    controlState.vR *= 0.86;
    spherical.theta += controlState.vTheta;
    spherical.phi += controlState.vPhi;
    spherical.radius += controlState.vR;
    applyCameraFromSpherical();

    // Subtle drift
    stars.rotation.y = t * 0.003;
    sky.rotation.y = t * 0.0008;

    galaxies.children.forEach((g) => {
      g.position.x += g.userData.drift * 0.002;
      if (g.position.x > 90) g.position.x = -90;
    });

    // Animate black hole
    const u = bh.userData;
    if (u) {
      u.disk.rotation.z += 0.0032;
      u.lensRing.rotation.z -= 0.0016;
      u.photon.material.opacity = 0.09 + 0.06 * Math.sin(t * 1.5);
      u.horizon.material.opacity = 0.18 + 0.06 * Math.sin(t * 1.7 + 1);
      u.dust.rotation.y -= 0.003;
    }

    // Shooting stars spawn + update
    shootingTimer -= 1 / 60;
    if (shootingTimer <= 0) {
      if (Math.random() < 0.55) spawnShootingStar(streaks);
      shootingTimer = 2.5 + Math.random() * 3.8;
    }

    for (let i = streaks.children.length - 1; i >= 0; i--) {
      const s = streaks.children[i];
      s.userData.life += 1 / 60;
      s.position.x += s.userData.speed * 0.016;
      s.position.y -= s.userData.speed * 0.002;
      s.material.opacity = Math.max(0, 1 - s.userData.life * 1.2);
      if (s.userData.life > 1.2) {
        streaks.remove(s);
        s.geometry.dispose();
        s.material.dispose();
      }
    }

    // Hover tooltip
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactive, true);
    if (hits.length) {
      const topic = hits[0].object.userData.topic;
      if (topic && topic !== lastHoverTopic) {
        lastHoverTopic = topic;
        const data = POPUPS[topic];
        if (data) setTooltip(data.title, "Click to open a quick explanation.");
      }
    } else if (lastHoverTopic) {
      lastHoverTopic = null;
      hideTooltip();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  hideLoader();
  render();
  }

  window.initBlackHoleExperience = initBlackHoleExperience;
})();

