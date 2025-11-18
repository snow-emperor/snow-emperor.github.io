import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ChunkMgr } from './chunkMgr.js';
import { Player } from './player.js';
import { showMainMenu } from './ui/mainMenu.js';
import { showHUD, updateFPS } from './ui/hud.js';
import { initNuclear, updateNuclear } from './reactions/nuclear.js';
import { pullSkins } from './reactions/skins.js';

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

export function startGame(config) {
  console.log('开始游戏，配置:', config);
  try {
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
    pullSkins();
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