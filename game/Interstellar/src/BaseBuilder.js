import * as THREE from 'three';

export class BaseBuilder {
  constructor(game) {
    this.game = game;
    this.buildings = [];
    this.buildableTypes = new Map();
    this.gridSize = 2;
    this.selectedBuildingType = null;
    this.initBuildableTypes();
  }

  initBuildableTypes() {
    this.buildableTypes.set('hut', {
      name: '基础小屋',
      requiredResources: new Map([['wood', 5], ['minerals', 3]]),
      size: { x: 2, z: 2 },
      health: 100,
      buildTime: 5,
      description: '基础居住单位',
      model: this.createBuildingModel(0x8b4513, 2, 1, 2)
    });

    this.buildableTypes.set('refinery', {
      name: '精炼厂',
      requiredResources: new Map([['minerals', 15], ['wood', 10]]),
      size: { x: 4, z: 4 },
      health: 200,
      buildTime: 15,
      description: '加工原始资源',
      model: this.createBuildingModel(0x444444, 4, 2, 4),
      recipe: {
        inputType: 'minerals',
        outputType: 'metal',
        inputAmount: 5,
        outputAmount: 3,
        processTime: 10
      }
    });
  }

  createBuildingModel(color, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  canBuildAt(position, buildingType) {
    const buildingData = this.buildableTypes.get(buildingType);
    if (!buildingData) return false;

    const resources = this.game.resourceSystem.playerInventory;
    for (const [resource, amount] of buildingData.requiredResources) {
      if ((resources.get(resource) || 0) < amount) {
        return false;
      }
    }

    const gridPos = this.worldToGridPosition(position);
    for (let x = 0; x < buildingData.size.x; x++) {
      for (let z = 0; z < buildingData.size.z; z++) {
        if (this.isGridCellOccupied({ x: gridPos.x + x, z: gridPos.z + z })) {
          return false;
        }
      }
    }

    return true;
  }

  placeBuilding(position, buildingType) {
    if (!this.canBuildAt(position, buildingType)) return null;

    const buildingData = this.buildableTypes.get(buildingType);
    
    const resources = this.game.resourceSystem.playerInventory;
    for (const [resource, amount] of buildingData.requiredResources) {
      resources.set(resource, resources.get(resource) - amount);
    }

    const gridPos = this.worldToGridPosition(position);
    const worldPos = this.gridToWorldPosition(gridPos);
    
    const building = {
      type: buildingType,
      position: worldPos,
      gridPosition: gridPos,
      health: buildingData.health,
      mesh: buildingData.model.clone(),
      isConstructing: true,
      constructionTime: 0,
      totalConstructionTime: buildingData.buildTime
    };

    building.mesh.position.set(worldPos.x, worldPos.y + buildingData.size.y/2, worldPos.z);
    
    if (buildingType === 'refinery') {
      building.recipe = buildingData.recipe;
      building.isProcessing = false;
      building.processingTime = 0;
      this.game.resourceSystem.processingFacilities.push(building);
    }

    this.buildings.push(building);
    this.game.sceneManager.addToScene(building.mesh);
    
    this.game.uiManager.updateResourceDisplay();
    return building;
  }

  update(deltaTime) {
    this.buildings.forEach(building => {
      if (building.isConstructing) {
        building.constructionTime += deltaTime;
        if (building.constructionTime >= building.totalConstructionTime) {
          building.isConstructing = false;
          building.mesh.material.emissiveIntensity = 0;
        } else {
          building.mesh.material.emissiveIntensity = 0.5 * (1 - building.constructionTime / building.totalConstructionTime);
        }
      }
    });
  }

  worldToGridPosition(worldPos) {
    return {
      x: Math.floor(worldPos.x / this.gridSize),
      z: Math.floor(worldPos.z / this.gridSize)
    };
  }

  gridToWorldPosition(gridPos) {
    return {
      x: gridPos.x * this.gridSize,
      z: gridPos.z * this.gridSize
    };
  }

  isGridCellOccupied(gridPos) {
    return this.buildings.some(building => {
      const startX = building.gridPosition.x;
      const endX = startX + this.buildableTypes.get(building.type).size.x;
      const startZ = building.gridPosition.z;
      const endZ = startZ + this.buildableTypes.get(building.type).size.z;
      
      return gridPos.x >= startX && gridPos.x < endX && 
             gridPos.z >= startZ && gridPos.z < endZ;
    });
  }
}
