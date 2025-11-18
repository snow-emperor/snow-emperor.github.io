// 存档管理系统
export class SaveManager {
  constructor() {
    this.currentSave = null;
  }
  
  // 保存游戏
  saveGame(saveName, worldData, playerData) {
    try {
      const saveData = {
        name: saveName,
        timestamp: Date.now(),
        version: '2.0',
        world: worldData,
        player: playerData
      };
      
      // 保存到localStorage
      const saveKey = `voxel_save_${saveName}`;
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      
      // 保存存档列表
      const saveList = this.getSaveList();
      if (!saveList.includes(saveName)) {
        saveList.push(saveName);
        localStorage.setItem('voxel_save_list', JSON.stringify(saveList));
      }
      
      console.log('游戏已保存:', saveName);
      return true;
    } catch (e) {
      console.error('保存游戏失败:', e);
      return false;
    }
  }
  
  // 加载游戏
  loadGame(saveName) {
    try {
      const saveKey = `voxel_save_${saveName}`;
      const saveData = localStorage.getItem(saveKey);
      
      if (!saveData) {
        console.error('未找到存档:', saveName);
        return null;
      }
      
      const parsedData = JSON.parse(saveData);
      console.log('游戏已加载:', saveName);
      return parsedData;
    } catch (e) {
      console.error('加载游戏失败:', e);
      return null;
    }
  }
  
  // 获取存档列表
  getSaveList() {
    try {
      const saveList = localStorage.getItem('voxel_save_list');
      return saveList ? JSON.parse(saveList) : [];
    } catch (e) {
      console.error('获取存档列表失败:', e);
      return [];
    }
  }
  
  // 删除存档
  deleteSave(saveName) {
    try {
      const saveKey = `voxel_save_${saveName}`;
      localStorage.removeItem(saveKey);
      
      // 更新存档列表
      const saveList = this.getSaveList();
      const index = saveList.indexOf(saveName);
      if (index > -1) {
        saveList.splice(index, 1);
        localStorage.setItem('voxel_save_list', JSON.stringify(saveList));
      }
      
      console.log('存档已删除:', saveName);
      return true;
    } catch (e) {
      console.error('删除存档失败:', e);
      return false;
    }
  }
  
  // 导出存档到文件
  exportSave(saveName) {
    try {
      const saveData = this.loadGame(saveName);
      if (!saveData) return false;
      
      const dataStr = JSON.stringify(saveData);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${saveName}.json`;
      link.click();
      
      console.log('存档已导出:', saveName);
      return true;
    } catch (e) {
      console.error('导出存档失败:', e);
      return false;
    }
  }
  
  // 从文件导入存档
  importSave(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const saveData = JSON.parse(e.target.result);
            if (!saveData.name) {
              reject(new Error('无效的存档文件'));
              return;
            }
            
            // 保存到localStorage
            const saveKey = `voxel_save_${saveData.name}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            // 更新存档列表
            const saveList = this.getSaveList();
            if (!saveList.includes(saveData.name)) {
              saveList.push(saveData.name);
              localStorage.setItem('voxel_save_list', JSON.stringify(saveList));
            }
            
            console.log('存档已导入:', saveData.name);
            resolve(saveData.name);
          } catch (parseError) {
            reject(new Error('存档文件格式错误'));
          }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file);
      } catch (e) {
        reject(e);
      }
    });
  }
}

// 创建全局实例
export const saveManager = new SaveManager();

