import * as THREE from 'three';

export class ResourceSystem {
  constructor(game) {
    this.game = game;
    this.playerInventory = new Map();
    this.processingFacilities = [];
    this.resourceNodes = [];
  }

  scanResources(planet) {
    this.resourceNodes.forEach(node => {
      this.game.sceneManager.removeFromScene(node.mesh);
    });
    this.resourceNodes = [];

    planet.resources.forEach(resource => {
      resource.positions.forEach(pos => {
        const node = this.createResourceNode(
          resource.type, 
          pos.theta, 
          pos.phi, 
          planet.radius,
          resource.quantity
        );
        node.planet = planet;
        this.resourceNodes.push(node);
        this.game.sceneManager.addToScene(node.mesh);
      });
    });
  }

  createResourceNode(type, theta, phi, planetRadius, quantity) {
    const radius = planetRadius + 0.5;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.getResourceColor(type),
      emissive: this.getResourceColor(type),
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    return {
      type,
      quantity,
      maxQuantity: quantity,
      mesh,
      position: new THREE.Vector3(x, y, z)
    };
  }

  collectResource(node) {
    if (node.quantity <= 0) return false;

    const collectionAmount = Math.min(
      10 * (1 + this.game.techTree.getTechLevel('resourceCollection') * 0.2),
      node.quantity
    );

    node.quantity -= collectionAmount;
    this.addToInventory(node.type, collectionAmount);
    
    if (node.quantity <= 0) {
      this.game.sceneManager.removeFromScene(node.mesh);
      this.resourceNodes = this.resourceNodes.filter(n => n !== node);
    }

    this.game.uiManager.updateResourceDisplay(node.type);
    return true;
  }

  processResource(inputType, outputType, facility) {
    const requiredAmount = facility.recipe.inputAmount;
    if (!this.playerInventory.has(inputType) || this.playerInventory.get(inputType) < requiredAmount) {
      return false;
    }

    this.addToInventory(inputType, -requiredAmount);
    facility.isProcessing = true;
    facility.processingTime = 0;
    facility.targetOutput = outputType;
    
    return true;
  }

  updateProcessing(deltaTime) {
    this.processingFacilities.forEach(facility => {
      if (facility.isProcessing) {
        facility.processingTime += deltaTime;
        
        if (facility.processingTime >= facility.recipe.processTime) {
          facility.isProcessing = false;
          this.addToInventory(facility.targetOutput, facility.recipe.outputAmount);
          this.game.uiManager.updateResourceDisplay(facility.targetOutput);
        }
      }
    });
  }

  addToInventory(type, amount) {
    const current = this.playerInventory.get(type) || 0;
    this.playerInventory.set(type, Math.max(0, current + amount));
  }

  getResourceColor(type) {
    const colors = {
      'water': 0x00ffff,
      'wood': 0x8b4513,
      'minerals': 0xaaaaaa,
      'food': 0x00ff00,
      'hydrogen': 0xffffff,
      'helium': 0xe0e0e0,
      'methane': 0xa9a9a9,
      'waterIce': 0x87cefa,
      'heavyMetals': 0x555555,
      'helium3': 0xadd8e6,
      'lava': 0xff4400,
      'rareEarths': 0x9370db,
      'silicon': 0xc0c0c0,
      'silica': 0xf0e68c,
      'sand': 0xe9c163,
      'undergroundWater': 0x1e90ff,
      'metal': 0x808080
    };
    return colors[type] || 0x00ff00;
  }
}
