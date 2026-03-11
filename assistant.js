// Futuristic "Ask the Universe" assistant.
// Uses the SPACE_KNOWLEDGE base to answer common questions.

(function () {
  function normalize(text) {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function findAnswer(question) {
    if (!window.SPACE_KNOWLEDGE) return null;
    const q = normalize(question);

    // Exact-ish keyword group matching first
    for (const entry of window.SPACE_KNOWLEDGE) {
      for (const key of entry.keywords) {
        const nk = normalize(key);
        if (q.includes(nk)) {
          return entry.answer;
        }
      }
    }

    // Loose word-based matching as fallback
    const words = q.split(" ").filter(Boolean);
    let bestEntry = null;
    let bestScore = 0;

    for (const entry of window.SPACE_KNOWLEDGE) {
      let score = 0;
      for (const key of entry.keywords) {
        const nk = normalize(key);
        for (const w of words) {
          if (w.length > 3 && nk.includes(w)) {
            score += 1;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore >= 2) {
      return bestEntry.answer;
    }

    return null;
  }

  function appendMessage(logEl, text, role) {
    const el = document.createElement("div");
    el.className = "assistant-message " + role;
    el.textContent = text;
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function initSpaceAssistant() {
    const form = document.getElementById("assistantForm");
    const input = document.getElementById("assistantInput");
    const log = document.getElementById("assistantLog");

    if (!form || !input || !log) return;

    appendMessage(
      log,
      "[ORACLE] Spacetime interface online. Ask me about black holes, galaxies, gravity, or cosmic history.",
      "system"
    );

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      const value = input.value.trim();
      if (!value) return;

      appendMessage(log, "> " + value, "user");

      const answer = findAnswer(value);

      if (answer) {
        appendMessage(
          log,
          "AI: " + answer,
          "ai"
        );
      } else {
        appendMessage(
          log,
          "AI: My current star‑charts do not contain a precise answer, but I can tell you this: black holes, galaxies, and gravity are all connected through the curvature of spacetime. Try asking about one of those directly.",
          "ai"
        );
      }

      input.value = "";
      input.focus();
    });
  }

  window.initSpaceAssistant = initSpaceAssistant;
})();

