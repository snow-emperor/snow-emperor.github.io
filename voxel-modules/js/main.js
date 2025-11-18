import * as THREE from 'three';
import { ChunkMgr } from './chunkMgr.js';
import { Player } from './player.js';
import { showMainMenu } from './ui/mainMenu.js';
import { showHUD } from './ui/hud.js';
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
  try {
    document.getElementById('ui-container').style.display = 'none';
    showHUD();
    chunkMgr = new ChunkMgr();
    player = new Player(chunkMgr);
    player.mode = config.mode;
    initNuclear();
    pullSkins();
    animate();
  } catch (e) {
    console.error('启动游戏失败:', e);
    document.getElementById('ui-container').style.display = 'block';
    showMainMenu();
    alert('启动游戏失败: ' + e.message);
  }
}

function animate() {
  requestAnimationFrame(animate);
  try {
    player.update();
    chunkMgr.update(player.position);
    updateNuclear();
  } catch (e) {
    console.error('游戏循环错误:', e);
  }
  renderer.render(scene, camera);
}

showMainMenu();   // 首屏
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});