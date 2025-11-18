import { saveManager, loadGame } from '../main.js';

export function showLoadPanel() {
  const container = document.getElementById('ui-container');
  if (!container) {
    console.error('未找到UI容器');
    return;
  }

  container.innerHTML = `
    <div id="load-panel" class="panel">
      <h2>加载世界</h2>
      <div class="save-list" id="save-list">
        <!-- 存档列表将通过JavaScript动态填充 -->
      </div>
      <div class="panel-actions">
        <input type="file" id="import-save-input" accept=".json" style="display: none;">
        <button id="btn-import-save" class="action-btn">导入存档</button>
        <button id="btn-back" class="action-btn">返回</button>
      </div>
    </div>
  `;

  // 填充存档列表
  const saveList = saveManager.getSaveList();
  const listContainer = document.getElementById('save-list');
  
  if (saveList.length === 0) {
    listContainer.innerHTML = '<p>暂无存档</p>';
  } else {
    listContainer.innerHTML = saveList.map(name => `
      <div class="save-item">
        <span>${name}</span>
        <button class="action-btn load-save-btn" data-name="${name}">加载</button>
        <button class="action-btn delete-save-btn" data-name="${name}">删除</button>
      </div>
    `).join('');
  }

  // 绑定事件
  document.getElementById('btn-back')?.addEventListener('click', () => {
    import('./mainMenu.js').then(module => module.showMainMenu());
  });

  // 绑定加载按钮事件
  document.querySelectorAll('.load-save-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const saveName = e.target.getAttribute('data-name');
      if (saveName) {
        const saveData = loadGame(saveName);
        if (saveData) {
          // 加载游戏逻辑
          console.log('加载游戏:', saveName);
          // 这里应该调用游戏加载函数
        }
      }
    });
  });

  // 绑定删除按钮事件
  document.querySelectorAll('.delete-save-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const saveName = e.target.getAttribute('data-name');
      if (saveName && confirm(`确定要删除存档 "${saveName}" 吗?`)) {
        saveManager.deleteGame(saveName);
        // 重新加载面板
        showLoadPanel();
      }
    });
  });

  // 绑定导入存档按钮事件
  const importButton = document.getElementById('btn-import-save');
  const importInput = document.getElementById('import-save-input');
  
  if (importButton && importInput) {
    importButton.addEventListener('click', () => {
      importInput.click();
    });
    
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        saveManager.importSaveFromFile(file)
          .then(saveName => {
            alert(`存档 "${saveName}" 导入成功!`);
            showLoadPanel(); // 刷新列表
          })
          .catch(error => {
            alert(`导入失败: ${error.message}`);
          });
      }
    });
  }
}