import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AlienManager {
  constructor(game) {
    this.game = game;
    this.aliens = [];
    this.loader = new GLTFLoader();
    this.alienModels = new Map();
    this.loadAlienModels();
  }

  loadAlienModels() {
    const alienTypes = ['friendly', 'hostile', 'neutral'];
    
    alienTypes.forEach(type => {
      // 实际项目中替换为真实模型路径
      this.loader.load(
        `models/alien_${type}.glb`,
        (gltf) => {
          this.alienModels.set(type, gltf.scene);
        },
        (xhr) => {
          console.log(`Alien model ${type} loaded: ${(xhr.loaded / xhr.total) * 100}%`);
        },
        (error) => {
          console.error('Error loading alien model:', error);
          // 加载失败时使用默认模型
          this.alienModels.set(type, this.createDefaultAlien(type));
        }
      );
    });
  }

  spawnAliens(planet) {
    planet.aliens.forEach(alien => {
      this.game.sceneManager.removeFromScene(alien.mesh);
    });
    planet.aliens = [];
    
    const alienCount = 3 + Math.floor(Math.random() * 7);
    
    for (let i = 0; i < alienCount; i++) {
      const alienType = this.getAlienTypeForPlanet(planet.type);
      const alien = this.createAlien(alienType, planet);
      
      planet.aliens.push(alien);
      this.game.sceneManager.addToScene(alien.mesh);
    }
  }

  createAlien(type, planet) {
    const model = this.alienModels.get(type)?.clone() || this.createDefaultAlien(type);
    model.scale.set(0.5, 0.5, 0.5);
    
    const pos = this.getRandomPositionOnPlanet(planet);
    model.position.copy(pos);
    
    model.lookAt(planet.mesh.position);
    model.rotateY(Math.random() * Math.PI * 2);
    
    const alien = {
      type,
      mesh: model,
      health: 100,
      strength: 5 + Math.random() * 15,
      behavior: this.getBehaviorByType(type),
      resources: this.getAlienResources(type),
      isHostile: type === 'hostile',
      lastMoveTime: 0,
      moveInterval: 2 + Math.random() * 3
    };
    
    alien.update = (delta) => this.updateAlien(alien, delta, planet);
    return alien;
  }

  update(delta) {
    if (!this.game.activePlanet) return;
    
    this.game.activePlanet.aliens.forEach(alien => {
      if (alien.update) alien.update(delta);
      this.checkPlayerCollision(alien);
    });
  }

  updateAlien(alien, delta, planet) {
    alien.lastMoveTime += delta;
    
    if (alien.lastMoveTime >= alien.moveInterval) {
      alien.lastMoveTime = 0;
      
      switch (alien.behavior) {
        case 'wandering':
          this.wanderBehavior(alien, planet);
          break;
        case 'aggressive':
          this.aggressiveBehavior(alien, planet);
          break;
        case 'passive':
          this.passiveBehavior(alien, planet);
          break;
      }
    }
  }

  getAlienTypeForPlanet(planetType) {
    const probabilities = {
      'terran': { friendly: 0.4, neutral: 0.4, hostile: 0.2 },
      'volcanic': { friendly: 0.1, neutral: 0.3, hostile: 0.6 },
      'ice': { friendly: 0.2, neutral: 0.5, hostile: 0.3 },
      'desert': { friendly: 0.3, neutral: 0.4, hostile: 0.3 },
      'gasGiant': { friendly: 0, neutral: 1, hostile: 0 }
    };
    
    const prob = probabilities[planetType] || { friendly: 0.3, neutral: 0.4, hostile: 0.3 };
    const rand = Math.random();
    
    if (rand < prob.friendly) return 'friendly';
    if (rand < prob.friendly + prob.neutral) return 'neutral';
    return 'hostile';
  }

  createDefaultAlien(type) {
    const colors = { friendly: 0x00ff00, hostile: 0xff0000, neutral: 0xffff00 };
    const geometry = new THREE.CapsuleGeometry(0.3, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({ color: colors[type] });
    return new THREE.Mesh(geometry, material);
  }

  getRandomPositionOnPlanet(planet) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = planet.radius + 1;
    
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

    getBehaviorByType(type) {
    const behaviors = {
      friendly: 'passive',
      hostile: 'aggressive',
      neutral: 'wandering'
    };
    return behaviors[type] || 'wandering';
  }

  getAlienResources(type) {
    const resources = {
      friendly: ['food', 'water'],
      hostile: ['rareEarths'],
      neutral: ['minerals']
    };
    return resources[type] || [];
  }

  wanderBehavior(alien, planet) {
    const newPos = this.getRandomPositionOnPlanet(planet);
    newPos.add(planet.mesh.position);
    alien.mesh.position.lerp(newPos, 0.1);
    alien.mesh.lookAt(newPos);
  }

  aggressiveBehavior(alien, planet) {
    const playerPos = this.game.sceneManager.camera.position;
    const distance = playerPos.distanceTo(alien.mesh.position);
    
    if (distance < 20) {
      // 靠近玩家
      alien.mesh.position.lerp(playerPos, 0.05);
      alien.mesh.lookAt(playerPos);
    } else {
      // 远距离随机移动
      this.wanderBehavior(alien, planet);
    }
  }

  passiveBehavior(alien, planet) {
    const resources = this.game.resourceSystem.resourceNodes;
    if (resources.length > 0) {
      // 向最近的资源点移动
      const nearestResource = resources.reduce((nearest, resource) => {
        const dist = alien.mesh.position.distanceTo(resource.position);
        return (!nearest || dist < nearest.dist) ? { node: resource, dist } : nearest;
      }, null);
      
      if (nearestResource) {
        alien.mesh.position.lerp(nearestResource.node.position, 0.03);
        alien.mesh.lookAt(nearestResource.node.position);
      }
    } else {
      this.wanderBehavior(alien, planet);
    }
  }

  checkPlayerCollision(alien) {
    const playerPos = this.game.sceneManager.camera.position;
    const distance = playerPos.distanceTo(alien.mesh.position);
    
    if (distance < 2) {
      if (alien.isHostile) {
        // 敌对生物攻击玩家
        this.game.uiManager.showDamageIndicator();
      } else if (alien.type === 'friendly' && Math.random() < 0.01) {
        // 友好生物随机给予资源
        const giftResource = alien.resources[Math.floor(Math.random() * alien.resources.length)];
        this.game.resourceSystem.addToInventory(giftResource, 1 + Math.floor(Math.random() * 3));
        this.game.uiManager.showMessage(`友好生物给予了 ${giftResource}!`);
      }
    }
  }
}
