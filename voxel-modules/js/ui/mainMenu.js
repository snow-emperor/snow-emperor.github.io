import { showCreatePanel } from './createWorld.js';
import { startGame } from '../main.js';
import { openMarket } from './market.js';

export function showMainMenu() {
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('create-panel').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('market').classList.add('hidden');
  document.getElementById('btn-new').onclick = () => showCreatePanel();
  document.getElementById('btn-continue').onclick = () => startGame({ name: '继续', seed: 123, mode: 'survival' });
  document.getElementById('btn-market').onclick = () => openMarket();
}