import "./style.css";
import Game from "./core/Game";

// ── Canvas ─────────────────────────────────────────────────────────────────
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

// ── HTML Overlay ───────────────────────────────────────────────────────────
const overlay = document.createElement("div");
overlay.id = "nr-overlay";
document.body.appendChild(overlay);

// Start screen — shown on first load / after refresh
const startScreen = document.createElement("div");
startScreen.id = "nr-start-screen";
startScreen.innerHTML = `
  <div class="nr-title-block">
    <div class="nr-globe">🌍</div>
    <div class="nr-title">NATIONAL ROYALE</div>
    <div class="nr-subtitle">Last flag standing wins the round!</div>
  </div>
  <button id="nr-start-btn" class="nr-btn nr-btn-primary">▶&nbsp; START PLAYING</button>
`;
overlay.appendChild(startScreen);

// ── Game ───────────────────────────────────────────────────────────────────
const game = new Game(canvas);

function resize() {
  game.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);
resize();
game.loop();

// ── Button Handlers ────────────────────────────────────────────────────────
document.getElementById("nr-start-btn").addEventListener("click", () => {
  // Smooth fade-out of the start screen before launching the game
  startScreen.classList.add("nr-hiding");
  setTimeout(() => {
    startScreen.style.display = "none";
    game.startGame();
  }, 380);
});