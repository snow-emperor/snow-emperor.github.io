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
  
  // 导出存档到文件
  exportSaveToFile(saveName) {
    try {
      const saveKey = `voxel_save_${saveName}`;
      const saveData = localStorage.getItem(saveKey);
      
      if (!saveData) {
        console.error('未找到存档:', saveName);
        return false;
      }
      
      // 创建一个Blob对象
      const blob = new Blob([saveData], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${saveName}.json`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('存档已导出:', saveName);
      return true;
    } catch (e) {
      console.error('导出存档失败:', e);
      return false;
    }
  }
  
  // 从文件导入存档
  importSaveFromFile(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const saveData = JSON.parse(event.target.result);
            
            if (!saveData.name) {
              reject(new Error('无效的存档文件'));
              return;
            }
            
            // 保存到localStorage
            const saveKey = `voxel_save_${saveData.name}`;
            localStorage.setItem(saveKey, event.target.result);
            
            // 更新存档列表
            const saveList = this.getSaveList();
            if (!saveList.includes(saveData.name)) {
              saveList.push(saveData.name);
              localStorage.setItem('voxel_save_list', JSON.stringify(saveList));
            }
            
            console.log('存档已导入:', saveData.name);
            resolve(saveData.name);
          } catch (e) {
            reject(new Error('存档文件格式错误'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('读取文件失败'));
        };
        
        reader.readAsText(file);
      } catch (e) {
        reject(e);
      }
    });
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
  
  // 删除游戏存档
  deleteGame(saveName) {
    try {
      const saveKey = `voxel_save_${saveName}`;
      localStorage.removeItem(saveKey);
      
      // 更新存档列表
      const saveList = this.getSaveList();
      const index = saveList.indexOf(saveName);
      if (index !== -1) {
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
  
  // 检查存档是否存在
  saveExists(saveName) {
    try {
      const saveKey = `voxel_save_${saveName}`;
      return localStorage.getItem(saveKey) !== null;
    } catch (e) {
      return false;
    }
  }
}

// 创建全局实例
export const saveManager = new SaveManager();



