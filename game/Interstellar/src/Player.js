import * as THREE from 'three';

export class Player {
  constructor(game) {
    this.game = game;
    this.mesh = null;
    this.speed = 5;
    this.experience = 0;
    this.level = 1;
    this.isOnPlanet = false;
  }

  init() {
    // 创建玩家模型
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.game.sceneManager.addToScene(this.mesh);
    this.game.sceneManager.camera.add(this.mesh);
    this.mesh.position.set(0, -1, -5);
  }

  update(delta) {
    // 简单的移动控制
    if (this.isOnPlanet) {
      const moveSpeed = this.speed * delta;
      if (window.keyboardState?.['KeyW']) {
        this.game.sceneManager.camera.translateZ(-moveSpeed);
      }
      if (window.keyboardState?.['KeyS']) {
        this.game.sceneManager.camera.translateZ(moveSpeed);
      }
      if (window.keyboardState?.['KeyA']) {
        this.game.sceneManager.camera.translateX(-moveSpeed);
      }
      if (window.keyboardState?.['KeyD']) {
        this.game.sceneManager.camera.translateX(moveSpeed);
      }
      
      // 资源收集检测
      if (window.keyboardState?.['KeyE']) {
        this.checkResourceCollection();
      }
    }
  }

  land(planet) {
    this.isOnPlanet = true;
    // 放置玩家在星球表面
    this.game.sceneManager.camera.position.copy(planet.mesh.position);
    this.game.sceneManager.camera.position.add(new THREE.Vector3(0, planet.radius + 5, planet.radius + 5));
    this.game.sceneManager.camera.lookAt(planet.mesh.position);
  }

  checkResourceCollection() {
    const playerPos = this.game.sceneManager.camera.position;
    this.game.resourceSystem.resourceNodes.forEach(node => {
      const distance = playerPos.distanceTo(node.position);
      if (distance < 3) {
        this.game.resourceSystem.collectResource(node);
      }
    });
  }

  addExperience(amount) {
    this.experience += amount;
    const required = this.level * 100;
    while (this.experience >= required) {
      this.experience -= required;
      this.level++;
      this.game.uiManager.showLevelUp(this.level);
    }
    this.game.uiManager.updatePlayerInfo();
  }
}

// 键盘状态监听
window.keyboardState = {};
window.addEventListener('keydown', (e) => {
  window.keyboardState[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  window.keyboardState[e.code] = false;
});
