import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ChunkMgr } from './chunkMgr.js';
import { Player } from './player.js';
import { showMainMenu } from './ui/mainMenu.js';
import { showHUD, updateFPS } from './ui/hud.js';
import { initNuclear, updateNuclear } from './reactions/nuclear.js';
import { saveManager } from './saveManager.js';

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
    chunkMgr = new ChunkMgr();
    player = new Player(chunkMgr);
    player.mode = config.mode || 'survival';
    player.difficulty = config.difficulty || 'normal';
    initNuclear();
    animate();
  } catch (e) {
    console.error('启动游戏失败:', e);
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
      uiContainer.style.display = 'block';
    }
    showMainMenu();
    alert('启动游戏失败: ' + e.message);
  }
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

// 等待DOM加载完成后显示主菜单
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，显示主菜单');
    showMainMenu();
  });
} else {
  console.log('直接显示主菜单');
  showMainMenu();   // 首屏
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});