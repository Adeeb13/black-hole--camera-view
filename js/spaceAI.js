// spaceAI.js
// "Ask the Cosmos AI" – beginner-friendly, predefined knowledge system.

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s’'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const KB = [
  {
    keys: ["what is a black hole", "define black hole", "black hole"],
    a:
      "A black hole is a place in space where gravity is so strong that nothing can escape—not even light. It’s like a super‑powerful gravity well."
  },
  {
    keys: ["can light escape", "why cant light escape", "escape velocity"],
    a:
      "Light can’t escape because at the event horizon the escape speed becomes the speed of light. Since nothing can go faster than light, nothing can escape from inside."
  },
  {
    keys: ["event horizon", "point of no return"],
    a:
      "The event horizon is the boundary around a black hole. If you cross it, you can’t come back out, and you can’t send a message to the outside universe."
  },
  {
    keys: ["singularity"],
    a:
      "The singularity is a predicted region deep inside where matter is squeezed extremely. Scientists think our current physics isn’t complete there, so it’s still a big mystery."
  },
  {
    keys: ["accretion disk", "disk", "plasma ring"],
    a:
      "The accretion disk is hot gas and dust swirling around a black hole. Friction heats it up until it glows—often brighter than the black hole itself."
  },
  {
    keys: ["photon sphere", "light orbit"],
    a:
      "The photon sphere is a region where gravity is strong enough that light can orbit the black hole. These light orbits are unstable, so tiny changes make photons escape or fall in."
  },
  {
    keys: ["how do black holes form", "form", "massive star", "supernova"],
    a:
      "Many black holes form when a very massive star runs out of fuel and collapses. The outer layers can explode as a supernova while the core collapses into a black hole."
  },
  {
    keys: ["types of black holes", "stellar", "supermassive", "intermediate"],
    a:
      "There are stellar‑mass black holes (from big stars), intermediate‑mass black holes (rarer), and supermassive black holes (millions to billions of Sun masses) found in galaxy centers."
  },
  {
    keys: ["how big are black holes", "size", "schwarzschild"],
    a:
      "A black hole’s size depends on its mass. The event horizon radius grows as mass increases. Supermassive black holes can be larger than our solar system."
  },
  {
    keys: ["how are black holes detected", "detected", "evidence"],
    a:
      "We detect black holes by their effects: stars orbiting something invisible, hot glowing accretion disks, X‑rays from infalling matter, and gravitational waves from black hole mergers."
  },
  {
    keys: ["first black hole image", "event horizon telescope", "m87"],
    a:
      "In 2019, the Event Horizon Telescope created the first image of a black hole’s shadow (in galaxy M87) by combining radio telescopes around Earth like one giant telescope."
  },
  {
    keys: ["galaxy", "what is a galaxy"],
    a:
      "A galaxy is a huge collection of stars, gas, dust, and dark matter held together by gravity. Many galaxies have a supermassive black hole at the center."
  },
  {
    keys: ["gravity", "spacetime", "relativity"],
    a:
      "In Einstein’s idea, gravity is spacetime curved by mass and energy. Near a black hole, the curvature is so strong that paths of light and matter bend dramatically."
  },
  {
    keys: ["space exploration", "nasa", "telescope", "jwst", "hubble"],
    a:
      "Telescopes in space and on Earth observe the universe in many kinds of light (radio to gamma rays). Missions like Hubble and JWST help us study how black holes and galaxies grow."
  }
];

function findAnswer(qRaw) {
  const q = normalize(qRaw);
  if (!q) return null;

  // Strong match: phrase contained
  for (const item of KB) {
    for (const k of item.keys) {
      const kk = normalize(k);
      if (kk && q.includes(kk)) return item.a;
    }
  }

  // Fallback: count shared words
  const qWords = new Set(q.split(" ").filter((w) => w.length >= 4));
  let best = null;
  let bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const k of item.keys) {
      for (const w of normalize(k).split(" ")) {
        if (qWords.has(w)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 && best ? best.a : null;
}

function appendMessage(logEl, text, role) {
  const el = document.createElement("div");
  el.className = "assistant-message " + role;
  el.textContent = text;
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function initSpaceAI() {
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  const log = document.getElementById("assistantLog");
  if (!form || !input || !log) return;

  appendMessage(
    log,
    "[COSMOS‑AI] Neon console online. Ask me about black holes, gravity, galaxies, stars, or space exploration.",
    "system"
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    appendMessage(log, "> " + q, "user");

    const a = findAnswer(q);
    if (a) {
      appendMessage(log, "AI: " + a, "ai");
    } else {
      appendMessage(
        log,
        "AI: I don’t have a perfect match yet. Try asking about “event horizon”, “accretion disk”, “can light escape”, “types of black holes”, or “how black holes form”.",
        "ai"
      );
    }
    input.value = "";
    input.focus();
  });
}

window.initSpaceAI = initSpaceAI;

