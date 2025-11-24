 游戏核心类
import { SceneManager } from './SceneManager.js';
import { Player } from './Player.js';
import { PlanetGenerator } from './PlanetGenerator.js';
import { ResourceSystem } from './ResourceSystem.js';
import { BaseBuilder } from './BaseBuilder.js';
import { AlienManager } from './AlienManager.js';
import { QuestSystem } from './QuestSystem.js';
import { TechTree } from './TechTree.js';
import { UIManager } from './UIManager.js';

export class Game {
  constructor() {
    this.sceneManager = new SceneManager();
    this.player = new Player(this);
    this.planetGenerator = new PlanetGenerator(this);
    this.resourceSystem = new ResourceSystem(this);
    this.baseBuilder = new BaseBuilder(this);
    this.alienManager = new AlienManager(this);
    this.questSystem = new QuestSystem(this);
    this.techTree = new TechTree(this);
    this.uiManager = new UIManager(this);
    
    this.isRunning = false;
    this.planets = [];
    this.activePlanet = null;
  }

  // 初始化游戏资源
  init() {
    this.sceneManager.init();
    this.player.init();
    this.uiManager.init();
    
    // 生成初始星系
    this.generateSolarSystem(5);
    
    // 初始化任务和科技树
    this.questSystem.init();
    this.techTree.init();
  }

  // 生成太阳系
  generateSolarSystem(planetCount) {
    for (let i = 0; i < planetCount; i++) {
      const planetType = this.getRandomPlanetType();
      const planet = this.planetGenerator.generatePlanet(
        planetType,
        50 + i * 300, // 距离太阳的距离
        i * Math.PI / 3 // 角度
      );
      this.planets.push(planet);
      this.sceneManager.addToScene(planet.mesh);
    }
  }

  // 获取随机星球类型
  getRandomPlanetType() {
    const types = ['terran', 'gasGiant', 'ice', 'volcanic', 'desert'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // 开始游戏循环
  start() {
    this.isRunning = true;
    this.update();
  }

  // 游戏主循环
  update() {
    if (!this.isRunning) return;
    
    this.sceneManager.update();
    this.player.update();
    this.alienManager.update();
    this.questSystem.checkProgress();
    
    requestAnimationFrame(() => this.update());
  }

  // 玩家登录星球
  landOnPlanet(planet) {
    this.activePlanet = planet;
    this.player.land(planet);
    this.resourceSystem.scanResources(planet);
    this.alienManager.spawnAliens(planet);
    this.uiManager.showPlanetInfo(planet);
  }
}

// src/PlanetGenerator.js - 星球生成系统
import * as THREE from 'three';
import { LOD } from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export class PlanetGenerator {
  constructor(game) {
    this.game = game;
    this.noise = new SimplexNoise();
    this.planetGeometries = new Map(); // 缓存几何体
  }

  // 生成星球
  generatePlanet(type, distance, angle) {
    const radius = this.getRadiusByType(type);
    const mesh = this.createPlanetMesh(type, radius);
    
    // 设置位置
    mesh.position.x = Math.cos(angle) * distance;
    mesh.position.z = Math.sin(angle) * distance;
    
    // 创建星球数据对象
    const planet = {
      type,
      radius,
      mesh,
      position: mesh.position.clone(),
      resources: this.generateResources(type),
      terrainType: this.getTerrainType(type),
      atmosphere: this.hasAtmosphere(type),
      gravity: this.calculateGravity(radius, type),
      aliens: []
    };
    
    return planet;
  }

  // 根据类型创建星球网格
  createPlanetMesh(type, radius) {
    // 使用LOD系统优化性能
    const lod = new LOD();
    
    // 高细节级别 (近距离)
    const highDetailGeo = this.createPlanetGeometry(radius, 128);
    const highDetailMat = this.getMaterialByType(type, true);
    lod.addLevel(new THREE.Mesh(highDetailGeo, highDetailMat), 500);
    
    // 中细节级别
    const midDetailGeo = this.createPlanetGeometry(radius, 64);
    const midDetailMat = this.getMaterialByType(type, false);
    lod.addLevel(new THREE.Mesh(midDetailGeo, midDetailMat), 1500);
    
    // 低细节级别 (远距离)
    const lowDetailGeo = this.createPlanetGeometry(radius, 32);
    const lowDetailMat = this.getMaterialByType(type, false);
    lod.addLevel(new THREE.Mesh(lowDetailGeo, lowDetailMat), 3000);
    
    lod.name = `planet_${type}`;
    return lod;
  }

  // 创建星球几何体
  createPlanetGeometry(radius, segments) {
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const vertices = geometry.attributes.position.array;
    
    // 应用噪声生成地形
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] / radius;
      const y = vertices[i + 1] / radius;
      const z = vertices[i + 2] / radius;
      
      // 基于球面坐标生成噪声
      const noiseValue = this.calculateTerrainNoise(x, y, z);
      const height = radius * (1 + noiseValue * 0.1);
      
      vertices[i] = x * height;
      vertices[i + 1] = y * height;
      vertices[i + 2] = z * height;
    }
    
    geometry.computeNormals();
    return geometry;
  }

  // 计算地形噪声
  calculateTerrainNoise(x, y, z) {
    let value = 0;
    value += 0.5 * this.noise.noise3d(x * 2, y * 2, z * 2);
    value += 0.25 * this.noise.noise3d(x * 4, y * 4, z * 4);
    value += 0.125 * this.noise.noise3d(x * 8, y * 8, z * 8);
    return value;
  }

  // 根据星球类型获取材质
  getMaterialByType(type, hasDetail) {
    switch (type) {
      case 'terran':
        return this.createTerranMaterial(hasDetail);
      case 'gasGiant':
        return this.createGasGiantMaterial();
      case 'ice':
        return this.createIceMaterial(hasDetail);
      case 'volcanic':
        return this.createVolcanicMaterial(hasDetail);
      case 'desert':
        return this.createDesertMaterial(hasDetail);
      default:
        return new THREE.MeshStandardMaterial({ color: 0x888888 });
    }
  }

  // 生成星球资源
  generateResources(type) {
    const baseResources = [];
    
    // 根据星球类型生成不同资源
    switch (type) {
      case 'terran':
        baseResources.push('water', 'wood', 'minerals', 'food');
        break;
      case 'gasGiant':
        baseResources.push('hydrogen', 'helium', 'methane');
        break;
      case 'ice':
        baseResources.push('waterIce', 'heavyMetals', 'helium3');
        break;
      case 'volcanic':
        baseResources.push('lava', 'rareEarths', 'silicon');
        break;
      case 'desert':
        baseResources.push('silica', 'sand', 'undergroundWater');
        break;
    }
    
    // 随机生成资源点
    return baseResources.map(resource => ({
      type: resource,
      quantity: Math.floor(Math.random() * 1000) + 100,
      positions: this.generateResourcePositions(5 + Math.floor(Math.random() * 15))
    }));
  }

  // 生成资源位置
  generateResourcePositions(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      // 在球面上生成随机点
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions.push({ theta, phi });
    }
    return positions;
  }

  // 辅助方法...
  getRadiusByType(type) { /* 实现 */ }
  getTerrainType(type) { /* 实现 */ }
  hasAtmosphere(type) { /* 实现 */ }
  calculateGravity(radius, type) { /* 实现 */ }
  createTerranMaterial(hasDetail) { /* 实现 */ }
  createGasGiantMaterial() { /* 实现 */ }
  createIceMaterial(hasDetail) { /* 实现 */ }
  createVolcanicMaterial(hasDetail) { /* 实现 */ }
  createDesertMaterial(hasDetail) { /* 实现 */ }
}

// src/AlienManager.js - 外星生物管理系统
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AlienManager {
  constructor(game) {
    this.game = game;
    this.aliens = [];
    this.loader = new GLTFLoader();
    this.alienModels = new Map(); // 缓存外星生物模型
    this.loadAlienModels();
  }

  // 加载外星生物模型
  loadAlienModels() {
    const alienTypes = ['friendly', 'hostile', 'neutral'];
    
    alienTypes.forEach(type => {
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
        }
      );
    });
  }

  // 在星球上生成外星生物
  spawnAliens(planet) {
    // 清空现有外星生物
    planet.aliens.forEach(alien => {
      this.game.sceneManager.removeFromScene(alien.mesh);
    });
    planet.aliens = [];
    
    // 根据星球类型生成不同数量和类型的外星生物
    const alienCount = 3 + Math.floor(Math.random() * 7);
    
    for (let i = 0; i < alienCount; i++) {
      const alienType = this.getAlienTypeForPlanet(planet.type);
      const alien = this.createAlien(alienType, planet);
      
      planet.aliens.push(alien);
      this.game.sceneManager.addToScene(alien.mesh);
    }
  }

  // 创建外星生物
  createAlien(type, planet) {
    // 克隆模型
    const model = this.alienModels.get(type)?.clone() || this.createDefaultAlien(type);
    model.scale.set(0.5, 0.5, 0.5);
    
    // 随机位置
    const pos = this.getRandomPositionOnPlanet(planet);
    model.position.copy(pos);
    
    // 面向星球表面
    model.lookAt(planet.mesh.position);
    model.rotateY(Math.random() * Math.PI * 2);
    
    // 外星生物数据
    return {
      type,
      mesh: model,
      health: 100,
      strength: 5 + Math.random() * 15,
      behavior: this.getBehaviorByType(type),
      resources: this.getAlienResources(type),
      isHostile: type === 'hostile',
      update: (delta) => this.updateAlien(alien, delta)
    };
  }

  // 更新外星生物状态
  update(delta) {
    if (!this.game.activePlanet) return;
    
    this.game.activePlanet.aliens.forEach(alien => {
      if (alien.update) alien.update(delta);
      
      // 检测与玩家的碰撞
      this.checkPlayerCollision(alien);
    });
  }

  // 外星生物行为逻辑
  updateAlien(alien, delta) {
    switch (alien.behavior) {
      case 'wandering':
        this.wanderBehavior(alien, delta);
        break;
      case 'aggressive':
        this.aggressiveBehavior(alien, delta);
        break;
      case 'passive':
        this.passiveBehavior(alien, delta);
        break;
    }
  }

  // 辅助方法...
  getAlienTypeForPlanet(planetType) { /* 实现 */ }
  createDefaultAlien(type) { /* 实现 */ }
  getRandomPositionOnPlanet(planet) { /* 实现 */ }
  getBehaviorByType(type) { /* 实现 */ }
  getAlienResources(type) { /* 实现 */ }
  wanderBehavior(alien, delta) { /* 实现 */ }
  aggressiveBehavior(alien, delta) { /* 实现 */ }
  passiveBehavior(alien, delta) { /* 实现 */ }
  checkPlayerCollision(alien) { /* 实现 */ }
}

// 其他核心模块 (SceneManager.js, Player.js, ResourceSystem.js等) 遵循类似的模块化结构