// main.js
// Entry point: wires up 3D, Cosmos AI, journey animations, and the mini‑game.

function hideLoader() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function initJourneyObserver() {
  const stages = document.querySelectorAll(".journey-stage");
  if (!stages.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.28 }
  );

  stages.forEach((s) => observer.observe(s));
}

// Safety: never let a JS error keep the loader stuck.
window.addEventListener("error", () => hideLoader());
window.addEventListener("unhandledrejection", () => hideLoader());

document.addEventListener("DOMContentLoaded", () => {
  // Hard stop: hide loader even on slow devices.
  setTimeout(hideLoader, 1800);

  if (window.initBlackHoleExperience) window.initBlackHoleExperience();
  if (window.initSpaceAI) window.initSpaceAI();

  if (window.initGame) window.initGame();
  initJourneyObserver();
});

