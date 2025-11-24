import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    this.clock = new THREE.Clock();
  }

  init() {
    this.sceneManager.init();
    this.player.init();
    this.uiManager.init();
    
    this.generateSolarSystem(5);
    this.questSystem.init();
    this.techTree.init();
  }

  generateSolarSystem(planetCount) {
    for (let i = 0; i < planetCount; i++) {
      const planetType = this.getRandomPlanetType();
      const planet = this.planetGenerator.generatePlanet(
        planetType,
        50 + i * 300,
        i * Math.PI / 3
      );
      this.planets.push(planet);
      this.sceneManager.addToScene(planet.mesh);
    }
  }

  getRandomPlanetType() {
    const types = ['terran', 'gasGiant', 'ice', 'volcanic', 'desert'];
    return types[Math.floor(Math.random() * types.length)];
  }

  start() {
    this.isRunning = true;
    this.update();
  }

  update() {
    if (!this.isRunning) return;
    
    const delta = this.clock.getDelta();
    this.sceneManager.update(delta);
    this.player.update(delta);
    this.alienManager.update(delta);
    this.questSystem.checkProgress();
    this.baseBuilder.update(delta);
    this.resourceSystem.updateProcessing(delta);
    
    requestAnimationFrame(() => this.update());
  }

  landOnPlanet(planet) {
    this.activePlanet = planet;
    this.player.land(planet);
    this.resourceSystem.scanResources(planet);
    this.alienManager.spawnAliens(planet);
    this.uiManager.showPlanetInfo(planet);
  }
}
