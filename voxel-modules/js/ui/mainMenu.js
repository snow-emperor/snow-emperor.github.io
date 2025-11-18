import { showCreatePanel } from './createWorld.js';
import { startGame } from '../main.js';
import { openMarket } from './market.js';

export function showMainMenu() {
  console.log('显示主菜单');
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('create-panel').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('market').classList.add('hidden');
  document.getElementById('settings-panel').classList.add('hidden');
  document.getElementById('help-panel').classList.add('hidden');
  document.getElementById('error-message').style.display = 'none';
  
  const newButton = document.getElementById('btn-new');
  const continueButton = document.getElementById('btn-continue');
  const marketButton = document.getElementById('btn-market');
  const settingsButton = document.getElementById('btn-settings');
  const helpButton = document.getElementById('btn-help');
  
  console.log('找到按钮元素:', { newButton, continueButton, marketButton, settingsButton, helpButton });
  
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
  
  if (settingsButton) {
    settingsButton.onclick = () => {
      console.log('点击了设置按钮');
      try {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings-panel').classList.remove('hidden');
      } catch (e) {
        console.error('打开设置失败:', e);
        showError('无法打开设置面板: ' + e.message);
      }
    };
  } else {
    console.error('找不到设置按钮');
  }
  
  if (helpButton) {
    helpButton.onclick = () => {
      console.log('点击了帮助按钮');
      try {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('help-panel').classList.remove('hidden');
      } catch (e) {
        console.error('打开帮助失败:', e);
        showError('无法打开帮助面板: ' + e.message);
      }
    };
  } else {
    console.error('找不到帮助按钮');
  }
  
  // 设置面板事件
  const closeSettingsButton = document.getElementById('btn-close-settings');
  const saveSettingsButton = document.getElementById('btn-save-settings');
  
  if (closeSettingsButton) {
    closeSettingsButton.onclick = () => {
      document.getElementById('settings-panel').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
    };
  }
  
  if (saveSettingsButton) {
    saveSettingsButton.onclick = () => {
      // 保存设置逻辑
      alert('设置已保存');
      document.getElementById('settings-panel').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
    };
  }
  
  // 帮助面板事件
  const closeHelpButton = document.getElementById('btn-close-help');
  if (closeHelpButton) {
    closeHelpButton.onclick = () => {
      document.getElementById('help-panel').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
    };
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