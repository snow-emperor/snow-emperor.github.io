import { showMainMenu } from './mainMenu.js';
import { startGame } from '../main.js';

export function showCreatePanel() {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('create-panel').classList.remove('hidden');
  document.getElementById('btn-back').onclick = () => showMainMenu();
  document.getElementById('btn-create').onclick = () => {
    try {
      const cfg = {
        name: document.getElementById('world-name').value,
        seed: parseInt(document.getElementById('world-seed').value),
        mode: document.getElementById('world-mode').value
      };
      
      if (!cfg.name) {
        showError('世界名称不能为空');
        return;
      }
      
      if (isNaN(cfg.seed)) {
        showError('种子必须是数字');
        return;
      }
      
      document.getElementById('create-error-message').style.display = 'none';
      startGame(cfg);
    } catch (e) {
      console.error('创建世界失败:', e);
      showError('创建世界时发生错误，请查看控制台了解详情');
    }
  };
}

function showError(message) {
  const errorElement = document.getElementById('create-error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}