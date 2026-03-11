// "Escape the Event Horizon" mini‑game using HTML5 Canvas.
// The player steers a ship away from a black hole's gravity,
// dodging asteroids and collecting energy stars.

(function () {
  const STATE = {
    running: false,
    gameOver: false,
    victory: false,
    score: 0,
    health: 3,
    time: 0
  };

  const ship = {
    x: 140,
    y: 250,
    vx: 0,
    vy: 0,
    radius: 16
  };

  const world = {
    width: 900,
    height: 500,
    gravityCenterX: 80,
    gravityStrength: 18
  };

  const keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  const touch = {
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0
  };

  let canvas, ctx;
  let asteroids = [];
  let stars = [];
  let lastFrameTime = performance.now();
  let rafId = null;
  let orbitTimer = 0;

  function resetWorld() {
    STATE.running = true;
    STATE.gameOver = false;
    STATE.victory = false;
    STATE.score = 0;
    STATE.health = 3;
    STATE.time = 0;
    orbitTimer = 0;

    ship.x = 160;
    ship.y = world.height / 2;
    ship.vx = 0;
    ship.vy = 0;

    asteroids = [];
    stars = [];

    // Populate asteroids and stars with a gentle gradient of difficulty.
    for (let i = 0; i < 14; i++) {
      asteroids.push({
        x: 260 + Math.random() * 600,
        y: 70 + Math.random() * 360,
        vx: -16 - Math.random() * 20,
        vy: (Math.random() - 0.5) * 12,
        radius: 16 + Math.random() * 14
      });
    }

    for (let i = 0; i < 14; i++) {
      stars.push({
        x: 260 + Math.random() * 580,
        y: 60 + Math.random() * 380,
        radius: 8 + Math.random() * 4,
        collected: false
      });
    }
  }

  function installInput() {
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          keys.up = true;
          break;
        case "arrowdown":
        case "s":
          keys.down = true;
          break;
        case "arrowleft":
        case "a":
          keys.left = true;
          break;
        case "arrowright":
        case "d":
          keys.right = true;
          break;
        default:
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          keys.up = false;
          break;
        case "arrowdown":
        case "s":
          keys.down = false;
          break;
        case "arrowleft":
        case "a":
          keys.left = false;
          break;
        case "arrowright":
        case "d":
          keys.right = false;
          break;
        default:
          break;
      }
    });

    const restartBtn = document.getElementById("restartGameBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        resetWorld();
      });
    }

    // Touch / pointer drag controls (works on phones and trackpads).
    const onDown = (e) => {
      const p = e.touches ? e.touches[0] : e;
      touch.active = true;
      touch.startX = p.clientX;
      touch.startY = p.clientY;
      touch.dx = 0;
      touch.dy = 0;
    };
    const onMove = (e) => {
      if (!touch.active) return;
      const p = e.touches ? e.touches[0] : e;
      touch.dx = p.clientX - touch.startX;
      touch.dy = p.clientY - touch.startY;
    };
    const onUp = () => {
      touch.active = false;
      touch.dx = 0;
      touch.dy = 0;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onUp);
  }

  function update(dt) {
    if (!STATE.running) return;

    STATE.time += dt;

    // Player thrust.
    const thrust = 110;
    if (keys.up) ship.vy -= thrust * dt;
    if (keys.down) ship.vy += thrust * dt;
    if (keys.left) ship.vx -= thrust * dt;
    if (keys.right) ship.vx += thrust * dt;

    // Touch drag thrust (dx,dy mapped to direction)
    if (touch.active) {
      const max = 90;
      const dx = Math.max(-max, Math.min(max, touch.dx));
      const dy = Math.max(-max, Math.min(max, touch.dy));
      ship.vx += (dx / max) * (thrust * 0.9) * dt;
      ship.vy += (dy / max) * (thrust * 0.9) * dt;
    }

    // Black hole gravity pull toward gravityCenterX
    const dxToHole = world.gravityCenterX - ship.x;
    const distScale = Math.max(40, Math.abs(dxToHole));
    const gx = (world.gravityStrength * dxToHole) / distScale;
    ship.vx += gx * dt;

    // Small vertical damping so ship is controllable.
    ship.vy *= 0.99;
    ship.vx *= 0.99;

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Constrain ship vertically.
    if (ship.y < 40) {
      ship.y = 40;
      ship.vy *= -0.2;
    }
    if (ship.y > world.height - 40) {
      ship.y = world.height - 40;
      ship.vy *= -0.2;
    }

    // If ship gets too close to the black hole on the extreme left, it is lost.
    if (ship.x < world.gravityCenterX - 8) {
      STATE.gameOver = true;
      STATE.running = false;
    }

    // Victory 1: safe zone on the far right (escape).
    if (ship.x > world.width - 40) {
      STATE.victory = true;
      STATE.running = false;
    }

    // Victory 2: maintain a near‑circular "orbit band" for several seconds.
    const inOrbitBand =
      ship.x > 260 && ship.x < 540 && ship.y > 110 && ship.y < world.height - 110;
    if (inOrbitBand) {
      orbitTimer += dt;
    } else {
      orbitTimer = Math.max(0, orbitTimer - dt * 0.7);
    }
    if (!STATE.gameOver && !STATE.victory && orbitTimer > 12) {
      STATE.victory = true;
      STATE.running = false;
    }

    // Update asteroids
    asteroids.forEach((a) => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.y < 40 || a.y > world.height - 40) {
        a.vy *= -1;
      }
      if (a.x < world.gravityCenterX - 80) {
        a.x = world.width - 20;
        a.y = 70 + Math.random() * 360;
      }
    });

    // Collisions with asteroids
    asteroids.forEach((a) => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const distSq = dx * dx + dy * dy;
      const rad = a.radius + ship.radius - 2;
      if (distSq < rad * rad && !STATE.gameOver && !STATE.victory) {
        STATE.health -= 1;
        ship.vx -= dx * 0.8;
        ship.vy -= dy * 0.8;
        a.x += Math.sign(dx || 1) * 40;
        if (STATE.health <= 0) {
          STATE.gameOver = true;
          STATE.running = false;
        }
      }
    });

    // Energy star collection
    stars.forEach((s) => {
      if (s.collected) return;
      const dx = s.x - ship.x;
      const dy = s.y - ship.y;
      const d2 = dx * dx + dy * dy;
      const rad = s.radius + ship.radius;
      if (d2 < rad * rad) {
        s.collected = true;
        STATE.score += 10;
        if (STATE.health < 5) STATE.health += 0.25;
      }
    });
  }

  function drawBackground() {
    // Black hole core
    const cx = world.gravityCenterX;
    const cy = world.height / 2;
    const coreRadius = 38;

    const grd = ctx.createRadialGradient(cx, cy, 6, cx, cy, 130);
    grd.addColorStop(0, "#000000");
    grd.addColorStop(0.3, "#060717");
    grd.addColorStop(0.7, "#050411");
    grd.addColorStop(1, "#000000");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, world.width, world.height);

    // Accretion disk
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.25);
    const diskGrd = ctx.createLinearGradient(-140, 0, 140, 0);
    diskGrd.addColorStop(0, "#ffb347");
    diskGrd.addColorStop(0.4, "#ff7038");
    diskGrd.addColorStop(0.8, "#ff2a7b");
    diskGrd.addColorStop(1, "#190018");
    ctx.fillStyle = diskGrd;
    ctx.beginPath();
    ctx.ellipse(0, 0, 140, 56, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, 60, 24, 0, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Event horizon outline
    ctx.save();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#fefcff";
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawStarsAndAsteroids() {
    // Distant stars
    ctx.save();
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 50; i++) {
      const x = (i * 17.1) % world.width;
      const y = ((i * 51.7) % world.height) * 0.8;
      ctx.globalAlpha = 0.2 + ((i % 5) / 10);
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    // Energy stars
    stars.forEach((s) => {
      if (s.collected) return;
      const blink = 0.2 + Math.random() * 0.4;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(0.3);
      ctx.globalAlpha = 0.6 + blink;
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, s.radius * 1.8);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(0.4, "#f6ffb4");
      grd.addColorStop(1, "#00ffff00");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, -s.radius);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.lineTo(Math.cos(angle) * s.radius, Math.sin(angle) * s.radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Asteroids
    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate((a.x + a.y) * 0.01);
      ctx.fillStyle = "#585b6e";
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;
        const r = a.radius * (0.7 + Math.random() * 0.4);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(ship.vy, ship.vx + 40);
    ctx.rotate(angle);

    // Body
    const hullGrd = ctx.createLinearGradient(-10, 0, 22, 0);
    hullGrd.addColorStop(0, "#87d7ff");
    hullGrd.addColorStop(0.4, "#ffffff");
    hullGrd.addColorStop(1, "#4a8bff");
    ctx.fillStyle = hullGrd;
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(18, 0);
    ctx.lineTo(-18, 10);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = "#142548";
    ctx.beginPath();
    ctx.arc(-4, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Thrusters (flame)
    if (STATE.running && (keys.up || keys.left || keys.right)) {
      const flameGrd = ctx.createLinearGradient(-25, 0, -8, 0);
      flameGrd.addColorStop(0, "#fffb96");
      flameGrd.addColorStop(0.4, "#ff854a");
      flameGrd.addColorStop(1, "#ff2d78");
      ctx.fillStyle = flameGrd;
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.lineTo(-28 - Math.random() * 6, 0);
      ctx.lineTo(-18, 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawHUD() {
    ctx.save();
    ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#d6e4ff";
    ctx.textBaseline = "top";

    ctx.fillText("Score: " + STATE.score, 16, 12);
    ctx.fillText("Hull Integrity:", 16, 30);

    // Health bar
    const maxBar = 120;
    const ratio = Math.max(0, Math.min(1, STATE.health / 5));
    ctx.fillStyle = "#19233f";
    ctx.fillRect(104, 32, maxBar, 10);
    const grd = ctx.createLinearGradient(104, 32, 104 + maxBar, 32);
    grd.addColorStop(0, "#58ffb1");
    grd.addColorStop(0.5, "#f6ffb0");
    grd.addColorStop(1, "#ff6a6a");
    ctx.fillStyle = grd;
    ctx.fillRect(104, 32, maxBar * ratio, 10);

    ctx.fillStyle = "#9bb7ff";
    ctx.fillText("Gravity Well", 18, world.height - 38);
    ctx.fillText("Safe Zone", world.width - 100, world.height - 38);

    // Gravity meter (educational)
    const dxToHole = Math.abs(world.gravityCenterX - ship.x);
    const gravityIntensity = Math.min(1, 240 / Math.max(20, dxToHole)); // closer -> higher
    ctx.fillStyle = "#d6e4ff";
    ctx.fillText("Gravity:", 16, 48);
    const meterX = 78;
    const meterY = 50;
    const meterW = 146;
    const meterH = 10;
    ctx.fillStyle = "#19233f";
    ctx.fillRect(meterX, meterY, meterW, meterH);
    const mg = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
    mg.addColorStop(0, "#58ffb1");
    mg.addColorStop(0.5, "#f6ffb0");
    mg.addColorStop(1, "#ff2d78");
    ctx.fillStyle = mg;
    ctx.fillRect(meterX, meterY, meterW * gravityIntensity, meterH);

    if (STATE.gameOver || STATE.victory) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#f4f7ff";
      const msg = STATE.victory
        ? "Mission Success! You escaped the event horizon."
        : "Mission Lost. The ship crossed the critical radius.";
      ctx.fillText(msg, world.width / 2, world.height / 2 - 10);
      ctx.font = "13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillStyle = "#a9c4ff";
      ctx.fillText(
        "Tip: The closer you orbit a black hole, the stronger its gravitational pull becomes.",
        world.width / 2,
        world.height / 2 + 18
      );
    }

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.04, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    update(dt);

    ctx.clearRect(0, 0, world.width, world.height);
    drawBackground();
    drawStarsAndAsteroids();
    drawShip();
    drawHUD();

    rafId = requestAnimationFrame(loop);
  }

  function initGame() {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    world.width = canvas.width;
    world.height = canvas.height;

    installInput();
    resetWorld();
    lastFrameTime = performance.now();
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  window.initGame = initGame;
})();

