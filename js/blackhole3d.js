// Three.js black hole universe scene.
// Renders a rotating black hole with accretion disk, photon sphere,
// simple gravitational lensing ring, and a 360° starfield.

(function () {
  let scene, camera, renderer, controls;
  let blackHoleCore, accretionDisk, photonSphere, horizonShell, lensingRing;
  let starField, backgroundSphere;
  let interactiveZones = [];
  // These are created lazily once THREE is confirmed to exist.
  let raycaster, mouseNDC;
  let lastScrollY = 0;
  let animationId = null;

  const tooltipEl = () => document.getElementById("space-tooltip");
  const tooltipTitleEl = () => document.getElementById("tooltip-title");
  const tooltipBodyEl = () => document.getElementById("tooltip-body");

  const TOPIC_DATA = {
    core: {
      title: "Gravitational Singularity",
      text:
        "At the theoretical core lies the singularity—a region where density and curvature become extreme. Classical physics breaks down here; we need quantum gravity to truly describe it."
    },
    horizon: {
      title: "Event Horizon",
      text:
        "The event horizon is the no‑return boundary. From far away, infalling matter seems to slow and fade as its light is stretched by gravity."
    },
    disk: {
      title: "Accretion Disk",
      text:
        "A disk of orbiting gas and dust heats up as it spirals inward, glowing across the spectrum. It is often the brightest part of a black hole system."
    },
    photon: {
      title: "Photon Sphere",
      text:
        "At the photon sphere, light can orbit the black hole. Orbits here are unstable; the slightest nudge sends photons inward or outward."
    },
    orbit: {
      title: "Stellar Orbits",
      text:
        "By tracking the orbits of stars near galactic centers, astronomers infer the presence and mass of invisible supermassive black holes."
    }
  };

  function setTooltip(topicKey) {
    const tt = tooltipEl();
    const titleEl = tooltipTitleEl();
    const bodyEl = tooltipBodyEl();
    if (!tt || !titleEl || !bodyEl) return;

    const data = TOPIC_DATA[topicKey];
    if (!data) return;

    titleEl.textContent = data.title;
    bodyEl.textContent = data.text;
    tt.classList.remove("hidden");
  }

  function hideTooltip() {
    const tt = tooltipEl();
    if (!tt) return;
    tt.classList.add("hidden");
  }

  function createRenderer(canvas) {
    const r = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputEncoding = THREE.sRGBEncoding;
    r.setClearColor(0x020109, 1);
    return r;
  }

  function createStarfield() {
    const starCount = 2400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const r = 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const hue = 0.55 + (Math.random() - 0.5) * 0.08;
      const sat = 0.2 + Math.random() * 0.25;
      const light = 0.7 + Math.random() * 0.3;
      color.setHSL(hue, sat, light);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
  }

  function createBackgroundSphere() {
    const geometry = new THREE.SphereGeometry(320, 32, 32);

    // Simple radial gradient using a canvas texture to mimic a nebula sky.
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    const grd = ctx.createRadialGradient(
      size * 0.3,
      size * 0.2,
      size * 0.1,
      size * 0.5,
      size * 0.5,
      size * 0.8
    );
    grd.addColorStop(0, "#27316a");
    grd.addColorStop(0.4, "#06091a");
    grd.addColorStop(1, "#000000");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    // Light nebula streaks
    ctx.globalAlpha = 0.45;
    const streakColors = ["#334c91", "#263a7c", "#1c5b91", "#662a90"];
    for (let i = 0; i < 7; i++) {
      const c = streakColors[i % streakColors.length];
      ctx.fillStyle = c;
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = size * (0.15 + Math.random() * 0.25);
      const h = size * (0.03 + Math.random() * 0.1);
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9
    });

    backgroundSphere = new THREE.Mesh(geometry, material);
    scene.add(backgroundSphere);
  }

  function createBlackHole() {
    const group = new THREE.Group();

    // Core "shadow"
    const coreGeo = new THREE.SphereGeometry(3.4, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    blackHoleCore = new THREE.Mesh(coreGeo, coreMat);
    blackHoleCore.userData.topic = "core";
    group.add(blackHoleCore);
    interactiveZones.push(blackHoleCore);

    // Event horizon shell
    const horizonGeo = new THREE.SphereGeometry(3.7, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18
    });
    horizonShell = new THREE.Mesh(horizonGeo, horizonMat);
    horizonShell.userData.topic = "horizon";
    group.add(horizonShell);
    interactiveZones.push(horizonShell);

    // Photon sphere
    const photonGeo = new THREE.SphereGeometry(4.3, 64, 64);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xfaffd1,
      transparent: true,
      opacity: 0.1
    });
    photonSphere = new THREE.Mesh(photonGeo, photonMat);
    photonSphere.userData.topic = "photon";
    group.add(photonSphere);
    interactiveZones.push(photonSphere);

    // Accretion disk (ring)
    const innerRadius = 4.9;
    const outerRadius = 9.8;
    const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 128);
    const diskMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true
    });

    // Gradient texture disk
    const diskSize = 512;
    const diskCanvas = document.createElement("canvas");
    diskCanvas.width = diskCanvas.height = diskSize;
    const dctx = diskCanvas.getContext("2d");
    const dgrd = dctx.createRadialGradient(
      diskSize / 2,
      diskSize / 2,
      diskSize * 0.1,
      diskSize / 2,
      diskSize / 2,
      diskSize * 0.5
    );
    dgrd.addColorStop(0, "#ffffff");
    dgrd.addColorStop(0.1, "#ffd58f");
    dgrd.addColorStop(0.4, "#ff8a3c");
    dgrd.addColorStop(0.65, "#ff2a63");
    dgrd.addColorStop(1, "#08010f");
    dctx.fillStyle = dgrd;
    dctx.fillRect(0, 0, diskSize, diskSize);
    const diskTexture = new THREE.CanvasTexture(diskCanvas);
    diskTexture.center.set(0.5, 0.5);
    diskTexture.rotation = Math.PI / 4;
    diskMaterial.map = diskTexture;
    diskMaterial.opacity = 0.87;

    accretionDisk = new THREE.Mesh(ringGeo, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2.3;
    accretionDisk.userData.topic = "disk";
    group.add(accretionDisk);
    interactiveZones.push(accretionDisk);

    // Lensing ring: faint torus
    const lensGeo = new THREE.TorusGeometry(5.2, 0.3, 32, 256);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0xfff2d7,
      transparent: true,
      opacity: 0.3
    });
    lensingRing = new THREE.Mesh(lensGeo, lensMat);
    lensingRing.rotation.x = Math.PI / 2.3;
    lensingRing.userData.topic = "photon";
    group.add(lensingRing);

    // A few orbiting "test" stars (small spheres)
    const orbitGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const sGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 18, 18);
      const sMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xfff2ce : 0xaed5ff
      });
      const star = new THREE.Mesh(sGeo, sMat);
      const radius = 14 + Math.random() * 7;
      const angle = (i / 6) * Math.PI * 2;
      star.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 5,
        Math.sin(angle) * radius
      );
      star.userData = {
        baseAngle: angle,
        orbitRadius: radius,
        orbitSpeed: 0.12 + Math.random() * 0.08,
        verticalOffset: star.position.y,
        topic: "orbit"
      };
      orbitGroup.add(star);
      interactiveZones.push(star);
    }
    group.add(orbitGroup);

    group.position.set(0, 0, 0);
    scene.add(group);

    return orbitGroup;
  }

  function handleMouseMove(event) {
    if (!renderer || !camera) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    mouseNDC.set(x * 2 - 1, -(y * 2 - 1));
  }

  function handleClick() {
    // On click, immediately show tooltip for the intersected object if any.
    if (!camera || !scene) return;
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(interactiveZones, true);
    if (hits.length > 0) {
      const obj = hits[0].object;
      const topic = (obj.userData && obj.userData.topic) || null;
      if (topic) {
        setTooltip(topic);
      }
    }
  }

  function setupLabButtons() {
    const buttons = document.querySelectorAll(".lab-focus-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const focus = btn.getAttribute("data-focus");
        if (!focus || !camera) return;

        if (focus === "core") {
          camera.position.set(10, 2, 12);
        } else if (focus === "disk") {
          camera.position.set(2, 10, 15);
        } else if (focus === "photon") {
          camera.position.set(0, 4, 10);
        } else if (focus === "horizon") {
          camera.position.set(0, 1.5, 9);
        } else if (focus === "orbit") {
          camera.position.set(20, 12, 20);
        }

        camera.lookAt(0, 0, 0);
        setTooltip(focus === "disk" ? "disk" : focus);
      });
    });
  }

  function syncCameraToScroll() {
    if (!camera) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight || 1;
    const t = Math.min(1, Math.max(0, scrollY / docHeight));

    // Fly inward as user scrolls, with subtle vertical drift.
    const baseZ = 30;
    const minZ = 10;
    const z = baseZ - (baseZ - minZ) * t;
    const y = 4 * (t - 0.5);
    camera.position.z = z;
    camera.position.y = y;
    camera.lookAt(0, 0, 0);

    lastScrollY = scrollY;
  }

  function initEvents() {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", syncCameraToScroll);

    window.addEventListener("resize", () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const startBtn = document.getElementById("startJourneyBtn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const journey = document.getElementById("journey");
        if (journey) {
          journey.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    const freeBtn = document.getElementById("freeExploreBtn");
    if (freeBtn) {
      freeBtn.addEventListener("click", () => {
        if (controls) {
          controls.enabled = true;
        }
        hideTooltip();
      });
    }

    setupLabButtons();
  }

  function animate(orbitGroup, clock) {
    animationId = requestAnimationFrame(() => animate(orbitGroup, clock));

    const t = clock.getElapsedTime();

    if (starField) {
      starField.rotation.y = t * 0.002;
    }
    if (backgroundSphere) {
      backgroundSphere.rotation.y = t * 0.0007;
    }

    if (accretionDisk) {
      accretionDisk.rotation.z += 0.0008;
    }
    if (lensingRing) {
      lensingRing.rotation.z -= 0.0005;
    }

    // Subtle breathing of photon sphere glow.
    if (photonSphere && horizonShell) {
      const pul = 0.08 * Math.sin(t * 1.7) + 0.15;
      photonSphere.material.opacity = 0.09 + pul;
      horizonShell.material.opacity = 0.14 + pul * 0.4;
    }

    // Orbiting stars
    if (orbitGroup) {
      orbitGroup.children.forEach((star) => {
        const ud = star.userData;
        if (!ud) return;
        const angle = ud.baseAngle + t * ud.orbitSpeed;
        star.position.set(
          Math.cos(angle) * ud.orbitRadius,
          ud.verticalOffset,
          Math.sin(angle) * ud.orbitRadius
        );
      });
    }

    // Hover detection via raycasting.
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(interactiveZones, true);
    if (hits.length > 0) {
      const obj = hits[0].object;
      const topic = (obj.userData && obj.userData.topic) || null;
      if (topic) {
        setTooltip(topic);
      }
    } else if (document.activeElement !== document.getElementById("assistantInput")) {
      hideTooltip();
    }

    if (controls) {
      controls.update();
    }
    renderer.render(scene, camera);
  }

  function revealLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 900);
  }

  function failInit(reason) {
    // If the 3D engine cannot start, fade out the loader and keep
    // the rest of the site usable.
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
    const heroSubtitle = document.querySelector(".hero-subtitle");
    if (heroSubtitle && reason === "no-three") {
      heroSubtitle.textContent =
        "3D engine offline. Connect to the internet to stream the real‑time black hole simulation, or explore the learning modules below.";
    }
  }

  function initBlackHoleScene() {
    try {
      const canvas = document.getElementById("universeCanvas");
      if (!canvas) {
        failInit("no-canvas");
        return;
      }
      if (!window.THREE) {
        console.warn("Three.js library not loaded – 3D scene disabled.");
        failInit("no-three");
        return;
      }

      // Now safe to construct Three.js helpers that depend on the global THREE.
      raycaster = new THREE.Raycaster();
      mouseNDC = new THREE.Vector2();

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 26);

      renderer = createRenderer(canvas);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.4;
      controls.zoomSpeed = 0.6;
      controls.enablePan = false;
      controls.minDistance = 7;
      controls.maxDistance = 70;
      controls.enabled = false; // Enabled when user requests free exploration.

      createStarfield();
      createBackgroundSphere();
      const orbitGroup = createBlackHole();

      initEvents();

      const clock = new THREE.Clock();
      animate(orbitGroup, clock);
      syncCameraToScroll();
      revealLoadingOverlay();
    } catch (err) {
      console.error("Error while starting 3D scene:", err);
      failInit("error");
    }
  }

  window.initBlackHoleScene = initBlackHoleScene;
})();

