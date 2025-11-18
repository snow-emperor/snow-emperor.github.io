import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ChunkMgr } from './chunkMgr.js';
import { Player } from './player.js';
import { showMainMenu } from './ui/mainMenu.js';
import { showHUD, updateFPS } from './ui/hud.js';
import { initNuclear, updateNuclear } from './reactions/nuclear.js';
import { SaveManager } from './saveManager.js';
import { textureManager } from './textureManager.js';
import { ELEMENTS } from './atomData.js';
import { OBJECTS } from './molecules.js';

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 50, 300);
scene.background = new THREE.Color(0x87ceeb);

export const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 30, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(1, 1, 1);
scene.add(dirLight, new THREE.AmbientLight(0xffffff, 0.4));

let chunkMgr, player;
let gameConfig = null;

// 初始化纹理系统
function initTextures() {
  try {
    // 创建元素纹理图集
    textureManager.createElementAtlas(ELEMENTS);
    
    // 创建物体纹理图集
    textureManager.createObjectTextures(OBJECTS);
    
    console.log('纹理系统初始化完成');
  } catch (e) {
    console.error('纹理系统初始化失败:', e);
  }
}

// 修改startGame函数，添加更多调试信息
export function startGame(config) {
  console.log('开始游戏，配置:', config);
  try {
    gameConfig = config;
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
      uiContainer.style.display = 'none';
    } else {
      console.error('未找到ui-container元素');
    }
    showHUD();
    
    // 异步初始化游戏内容，避免阻塞主线程
    setTimeout(() => {
      try {
        console.log('正在初始化区块管理器...');
        chunkMgr = new ChunkMgr();
        
        console.log('正在初始化玩家...');
        player = new Player(chunkMgr);
        player.mode = config.mode || 'survival';
        player.difficulty = config.difficulty || 'normal';
        
        console.log('正在初始化核反应系统...');
        initNuclear();
        
        console.log('正在启动游戏循环...');
        animate();
        
        // 添加调试信息
        setTimeout(debugScene, 1000);
      } catch (e) {
        console.error('游戏初始化失败:', e);
        handleGameStartError(e);
      }
    }, 10);
  } catch (e) {
    console.error('启动游戏失败:', e);
    handleGameStartError(e);
  }
}

function updateLoadingText(text) {
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent = text;
  }
}

function handleGameStartError(e) {
  // 隐藏加载面板
  const loadingPanel = document.getElementById('loading-panel');
  if (loadingPanel) {
    loadingPanel.classList.add('hidden');
  }
  
  // 显示主菜单
  const uiContainer = document.getElementById('ui-container');
  if (uiContainer) {
    uiContainer.style.display = 'block';
  }
  showMainMenu();
  alert('启动游戏失败: ' + e.message);
}

// 列出所有存档
export function listSaves() {
  try {
    return saveManager.listSaves();
  } catch (e) {
    console.error('获取存档列表失败:', e);
    return [];
  }
}

// 删除存档
export function deleteSave(saveName) {
  try {
    const success = saveManager.deleteSave(saveName);
    if (success) {
      // 显示删除成功提示
      const indicator = document.getElementById('delete-indicator');
      if (indicator) {
        indicator.textContent = `存档 "${saveName}" 已删除`;
        indicator.style.display = 'block';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 2000);
      }
    }
    return success;
  } catch (e) {
    console.error('删除存档失败:', e);
    return false;
  }
}

export const saveManager = new SaveManager();

// 导出存档函数
export function exportSave(saveName) {
  return saveManager.exportSaveToFile(saveName);
}

// 检查存档是否存在
export function saveExists(saveName) {
  return saveManager.saveExists(saveName);
}

// 保存游戏
export function saveGame(saveName) {
  if (!chunkMgr || !player) {
    console.error('游戏未启动，无法保存');
    return false;
  }
  
  try {
    // 收集游戏数据
    const worldData = {
      seed: gameConfig ? gameConfig.seed : 12345,
      mode: player.mode,
      difficulty: player.difficulty
    };
    
    const playerData = {
      position: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
      },
      hp: player.hp,
      food: player.food,
      rad: player.rad,
      energy: player.energy,
      mode: player.mode,
      difficulty: player.difficulty
    };
    
    // 保存游戏
    const success = saveManager.saveGame(saveName, worldData, playerData);
    if (success) {
      // 显示保存成功提示
      const indicator = document.getElementById('save-indicator');
      if (indicator) {
        indicator.style.display = 'block';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 2000);
      }
    }
    return success;
  } catch (e) {
    console.error('保存游戏失败:', e);
    return false;
  }
}

// 加载游戏
export function loadGame(saveName) {
  try {
    const saveData = saveManager.loadGame(saveName);
    if (!saveData) {
      console.error('无法加载存档:', saveName);
      return false;
    }
    
    // 使用保存的数据启动游戏
    const config = {
      name: saveData.name,
      seed: saveData.world.seed,
      mode: saveData.world.mode,
      difficulty: saveData.world.difficulty
    };
    
    startGame(config);
    
    // 恢复玩家数据（在游戏启动后）
    setTimeout(() => {
      if (player && saveData.player) {
        // 恢复玩家属性
        player.hp = saveData.player.hp;
        player.food = saveData.player.food;
        player.rad = saveData.player.rad;
        player.energy = saveData.player.energy;
        player.mode = saveData.player.mode;
        player.difficulty = saveData.player.difficulty;
        
        // 恢复玩家位置
        if (saveData.player.position) {
          player.position.set(
            saveData.player.position.x,
            saveData.player.position.y,
            saveData.player.position.z
          );
        }
      }
    }, 100);
    
    return true;
  } catch (e) {
    console.error('加载游戏失败:', e);
    return false;
  }
}

function animate() {
  requestAnimationFrame(animate);
  try {
    if (player) player.update();
    if (chunkMgr) chunkMgr.update(player.position, camera);
    updateNuclear();
    updateFPS();
  } catch (e) {
    console.error('游戏循环错误:', e);
  }
  renderer.render(scene, camera);
}

// 添加调试函数，用于检查场景中的对象
function debugScene() {
  console.log('场景对象数量:', scene.children.length);
  scene.children.forEach((child, index) => {
    console.log(`对象 ${index}:`, child.type, child.name || 'unnamed');
  });
  
  if (chunkMgr) {
    console.log('已加载区块数量:', chunkMgr.chunks.size);
  }
}

// 等待DOM加载完成后显示主菜单
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，显示主菜单');
    initTextures(); // 初始化纹理
    showMainMenu();
  });
} else {
  console.log('直接显示主菜单');
  initTextures(); // 初始化纹理
  showMainMenu();   // 首屏
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});