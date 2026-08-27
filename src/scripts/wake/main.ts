import { startGame } from "./game";

const canvas = document.getElementById("c");
const scoreEl = document.getElementById("score");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Wake: expected a canvas with id \"c\"");
}
if (!(scoreEl instanceof HTMLElement)) {
  throw new Error("Wake: expected a score element with id \"score\"");
}

startGame(canvas, scoreEl);
