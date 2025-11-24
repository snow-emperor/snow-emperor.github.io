import { Game } from './src/Game.js';
// 初始化游戏
 document.addEventListener('DOMContentLoaded', () => {
   const game = new Game();
   game.init();
   game.start();
 });