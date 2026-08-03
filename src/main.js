import "./style.css";
import Game from "./core/Game";

console.log("main.js loaded");

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

console.log("Canvas created");

const game = new Game(canvas);

console.log("Game created");

function resize() {
  game.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);

resize();

console.log("Starting loop");

game.loop();