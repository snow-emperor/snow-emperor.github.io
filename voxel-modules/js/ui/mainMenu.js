import { showCreatePanel } from './createWorld.js';
import { startGame } from '../main.js';
import { openMarket } from './market.js';

export function showMainMenu() {
  console.log('显示主菜单');
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('create-panel').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('market').classList.add('hidden');
  document.getElementById('error-message').style.display = 'none';
  
  const newButton = document.getElementById('btn-new');
  const continueButton = document.getElementById('btn-continue');
  const marketButton = document.getElementById('btn-market');
  
  console.log('找到按钮元素:', { newButton, continueButton, marketButton });
  
  if (newButton) {
    newButton.onclick = () => {
      console.log('点击了新建世界按钮');
      try {
        showCreatePanel();
      } catch (e) {
        console.error('显示创建面板失败:', e);
        showError('无法打开创建世界面板: ' + e.message);
      }
    };
  } else {
    console.error('找不到新建世界按钮');
  }
  
  if (continueButton) {
    continueButton.onclick = () => {
      console.log('点击了继续按钮');
      try {
        startGame({ name: '继续', seed: 123, mode: 'survival' });
      } catch (e) {
        console.error('继续游戏失败:', e);
        showError('无法继续游戏: ' + e.message);
      }
    };
  } else {
    console.error('找不到继续按钮');
  }
  
  if (marketButton) {
    marketButton.onclick = () => {
      console.log('点击了皮肤市场按钮');
      try {
        openMarket();
      } catch (e) {
        console.error('打开市场失败:', e);
        showError('无法打开皮肤市场: ' + e.message);
      }
    };
  } else {
    console.error('找不到皮肤市场按钮');
  }
}

function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    console.error('无法显示错误消息：未找到error-message元素');
  }
}