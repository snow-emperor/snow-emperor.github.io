import { Game } from './src/Game.js';

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
  game.start();
});
