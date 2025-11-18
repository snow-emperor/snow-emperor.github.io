import { showMainMenu } from './mainMenu.js';
import { startGame } from '../main.js';

export function showCreatePanel() {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('create-panel').classList.remove('hidden');
  document.getElementById('btn-back').onclick = () => showMainMenu();
  document.getElementById('btn-create').onclick = () => {
    const cfg = {
      name: document.getElementById('world-name').value,
      seed: parseInt(document.getElementById('world-seed').value),
      mode: document.getElementById('world-mode').value
    };
    startGame(cfg);
  };
}