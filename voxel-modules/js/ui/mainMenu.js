import { showCreatePanel } from './createWorld.js';
import { startGame, loadGame, saveGame, saveExists, exportSave } from '../main.js';
import { saveManager } from '../saveManager.js';

export function showMainMenu() {
  console.log('显示主菜单');
  const mainMenu = document.getElementById('main-menu');
  if (mainMenu) {
    mainMenu.classList.remove('hidden');
  }
  
  const panelsToHide = [
    'create-panel',
    'hud',
    'market',
    'settings-panel',
    'help-panel',
    'save-load-panel'
  ];
  
  panelsToHide.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('hidden');
    }
  });
  
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
  
  const newButton = document.getElementById('btn-new');
  const continueButton = document.getElementById('btn-continue');
  const loadButton = document.getElementById('btn-load');
  const settingsButton = document.getElementById('btn-settings');
  const helpButton = document.getElementById('btn-help');
  const exportButton = document.getElementById('btn-export-save');
  
  console.log('找到按钮元素:', { newButton, continueButton, loadButton, settingsButton, helpButton });
  
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
  
  if (settingsButton) {
    settingsButton.onclick = () => {
      console.log('点击了设置按钮');
      try {
        const mainMenu = document.getElementById('main-menu');
        const settingsPanel = document.getElementById('settings-panel');
        if (mainMenu) mainMenu.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.remove('hidden');
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
        const mainMenu = document.getElementById('main-menu');
        const helpPanel = document.getElementById('help-panel');
        if (mainMenu) mainMenu.classList.add('hidden');
        if (helpPanel) helpPanel.classList.remove('hidden');
      } catch (e) {
        console.error('打开帮助失败:', e);
        showError('无法打开帮助面板: ' + e.message);
      }
    };
  } else {
    console.error('找不到帮助按钮');
  }
  
  if (loadButton) {
    loadButton.onclick = () => {
      console.log('点击了加载存档按钮');
      try {
        showSaveLoadPanel();
      } catch (e) {
        console.error('打开存档面板失败:', e);
        showError('无法打开存档面板: ' + e.message);
      }
    };
  } else {
    console.error('找不到加载存档按钮');
  }
  
  if (exportButton) {
    exportButton.onclick = () => {
      console.log('点击了导出存档按钮');
      try {
        const saveName = prompt('请输入要导出的存档名称:');
        if (saveName && saveExists(saveName)) {
          exportSave(saveName);
        } else if (saveName) {
          alert('存档不存在');
        }
      } catch (e) {
        console.error('导出存档失败:', e);
        showError('无法导出存档: ' + e.message);
      }
    };
  } else {
    console.warn('未找到导出存档按钮，如果需要此功能请在HTML中添加id为btn-export-save的按钮');
  }
  
  // 设置面板事件
  const closeSettingsButton = document.getElementById('btn-close-settings');
  const saveSettingsButton = document.getElementById('btn-save-settings');
  
  if (closeSettingsButton) {
    closeSettingsButton.onclick = () => {
      const settingsPanel = document.getElementById('settings-panel');
      const mainMenu = document.getElementById('main-menu');
      if (settingsPanel) settingsPanel.classList.add('hidden');
      if (mainMenu) mainMenu.classList.remove('hidden');
    };
  }
  
  if (saveSettingsButton) {
    saveSettingsButton.onclick = () => {
      // 保存设置逻辑
      alert('设置已保存');
      const settingsPanel = document.getElementById('settings-panel');
      const mainMenu = document.getElementById('main-menu');
      if (settingsPanel) settingsPanel.classList.add('hidden');
      if (mainMenu) mainMenu.classList.remove('hidden');
    };
  }
  
  // 帮助面板事件
  const closeHelpButton = document.getElementById('btn-close-help');
  if (closeHelpButton) {
    closeHelpButton.onclick = () => {
      const helpPanel = document.getElementById('help-panel');
      const mainMenu = document.getElementById('main-menu');
      if (helpPanel) helpPanel.classList.add('hidden');
      if (mainMenu) mainMenu.classList.remove('hidden');
    };
  }
}

// 显示存档/读档面板
function showSaveLoadPanel() {
  const mainMenu = document.getElementById('main-menu');
  const panel = document.getElementById('save-load-panel');
  if (mainMenu) mainMenu.classList.add('hidden');
  if (panel) panel.classList.remove('hidden');
  
  // 绑定关闭事件
  const closeBtn = document.getElementById('btn-close-save-panel');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (panel) panel.classList.add('hidden');
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.remove('hidden');
    };
  }
  
  // 绑定保存事件
  const saveBtn = document.getElementById('btn-save-game');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const saveName = document.getElementById('save-name').value || '默认存档';
      // 这里应该调用实际的保存函数
      if (saveGame(saveName)) {
        alert(`存档 "${saveName}" 已保存到浏览器存储中`);
      } else {
        alert('存档保存失败');
      }
    };
  }
  
  // 绑定导出存档事件
  const exportBtn = document.getElementById('btn-export-save');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const saveName = document.getElementById('save-name').value || '默认存档';
      // 导出存档到用户选择的目录
      if (saveExists(saveName)) {
        saveManager.exportSave(saveName);
      } else {
        alert(`存档 "${saveName}" 不存在，请先保存游戏`);
      }
    };
  }
  
  // 绑定文件选择和导入事件
  const browseBtn = document.getElementById('btn-browse-saves');
  const fileInput = document.getElementById('save-file-input');
  if (browseBtn && fileInput) {
    browseBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        saveManager.importSave(file).then(saveName => {
          alert(`存档 "${saveName}" 已导入`);
          refreshSaveList();
        }).catch(err => {
          alert('导入失败: ' + err.message);
        });
      }
    };
  }
  
  // 初始化并显示存档列表
  refreshSaveList();
}

// 刷新存档列表显示
function refreshSaveList() {
  const saveListContainer = document.getElementById('save-list');
  if (!saveListContainer) return;
  
  const saves = saveManager.getSaveList();
  if (saves.length === 0) {
    saveListContainer.innerHTML = '<p>暂无存档</p>';
    return;
  }
  
  saveListContainer.innerHTML = saves.map(saveName => `
    <div class="save-item">
      <span>${saveName}</span>
      <div>
        <button onclick="loadSave('${saveName}')" class="action-btn">加载</button>
        <button onclick="deleteSave('${saveName}')" class="menu-btn">删除</button>
        <button onclick="exportSave('${saveName}')" class="menu-btn">导出</button>
      </div>
    </div>
  `).join('');
}

// 全局函数，供HTML中的onclick调用
window.loadSave = (saveName) => {
  if (loadGame(saveName)) {
    const saveLoadPanel = document.getElementById('save-load-panel');
    const mainMenu = document.getElementById('main-menu');
    if (saveLoadPanel) saveLoadPanel.classList.add('hidden');
    if (mainMenu) mainMenu.classList.remove('hidden');
  } else {
    alert('加载存档失败');
  }
};

window.deleteSave = (saveName) => {
  if (confirm(`确定要删除存档 "${saveName}" 吗？`)) {
    saveManager.deleteSave(saveName);
    refreshSaveList();
  }
};

window.exportSave = (saveName) => {
  saveManager.exportSave(saveName);
};

function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    console.error('无法显示错误消息：未找到error-message元素');
  }
}