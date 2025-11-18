import { showMainMenu } from './mainMenu.js';
import { startGame } from '../main.js';

export function showCreatePanel() {
  console.log('显示创建世界面板');
  const mainMenu = document.getElementById('main-menu');
  const createPanel = document.getElementById('create-panel');
  const backButton = document.getElementById('btn-back');
  const createButton = document.getElementById('btn-create');
  
  console.log('找到元素:', { mainMenu, createPanel, backButton, createButton });
  
  if (mainMenu) mainMenu.classList.add('hidden');
  if (createPanel) createPanel.classList.remove('hidden');
  
  if (backButton) {
    backButton.onclick = () => {
      console.log('点击了返回按钮');
      showMainMenu();
    };
  } else {
    console.error('找不到返回按钮');
  }
  
  if (createButton) {
    createButton.onclick = () => {
      console.log('点击了创建按钮');
      try {
        const nameInput = document.getElementById('world-name');
        const seedInput = document.getElementById('world-seed');
        const modeSelect = document.getElementById('world-mode');
        const difficultySelect = document.getElementById('world-difficulty');
        
        console.log('表单元素:', { nameInput, seedInput, modeSelect, difficultySelect });
        
        const cfg = {
          name: nameInput ? nameInput.value : '新世界',
          seed: seedInput ? parseInt(seedInput.value) : 12345,
          mode: modeSelect ? modeSelect.value : 'survival',
          difficulty: difficultySelect ? difficultySelect.value : 'normal'
        };
        
        console.log('配置:', cfg);
        
        if (!cfg.name) {
          showError('世界名称不能为空');
          return;
        }
        
        if (isNaN(cfg.seed)) {
          showError('种子必须是数字');
          return;
        }
        
        const errorMessage = document.getElementById('create-error-message');
        if (errorMessage) {
          errorMessage.style.display = 'none';
        }
        
        // 显示加载面板
        const createPanel = document.getElementById('create-panel');
        const loadingPanel = document.getElementById('loading-panel');
        const loadingText = document.getElementById('loading-text');
        
        if (createPanel) createPanel.classList.add('hidden');
        if (loadingPanel) {
          loadingPanel.classList.remove('hidden');
          if (loadingText) {
            loadingText.textContent = `正在生成世界: ${cfg.name}`;
          }
        }
        
        // 延迟启动游戏，确保UI更新
        setTimeout(() => {
          startGame(cfg);
        }, 100);
      } catch (e) {
        console.error('创建世界失败:', e);
        showError('创建世界时发生错误，请查看控制台了解详情');
        
        // 隐藏加载面板并显示创建面板
        const loadingPanel = document.getElementById('loading-panel');
        const createPanel = document.getElementById('create-panel');
        if (loadingPanel) loadingPanel.classList.add('hidden');
        if (createPanel) createPanel.classList.remove('hidden');
      }
    };
  } else {
    console.error('找不到创建按钮');
  }
}

function showError(message) {
  const errorElement = document.getElementById('create-error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    console.error('无法显示错误消息：未找到create-error-message元素');
  }
}