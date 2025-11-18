import { showCreatePanel } from './createWorld.js';
import { startGame } from '../main.js';
import { openMarket } from './market.js';

export function showMainMenu() {
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('create-panel').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('market').classList.add('hidden');
  document.getElementById('error-message').style.display = 'none';
  
  document.getElementById('btn-new').onclick = () => {
    try {
      showCreatePanel();
    } catch (e) {
      console.error('显示创建面板失败:', e);
      showError('无法打开创建世界面板: ' + e.message);
    }
  };
  
  document.getElementById('btn-continue').onclick = () => {
    try {
      startGame({ name: '继续', seed: 123, mode: 'survival' });
    } catch (e) {
      console.error('继续游戏失败:', e);
      showError('无法继续游戏: ' + e.message);
    }
  };
  
  document.getElementById('btn-market').onclick = () => {
    try {
      openMarket();
    } catch (e) {
      console.error('打开市场失败:', e);
      showError('无法打开皮肤市场: ' + e.message);
    }
  };
}

function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}