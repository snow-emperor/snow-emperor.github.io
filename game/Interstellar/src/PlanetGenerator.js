import * as THREE from 'three';
import { LOD } from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export class PlanetGenerator {
  constructor(game) {
    this.game = game;
    this.noise = new SimplexNoise();
    this.planetGeometries = new Map();
  }

  generatePlanet(type, distance, angle) {
    const radius = this.getRadiusByType(type);
    const mesh = this.createPlanetMesh(type, radius);
    
    mesh.position.x = Math.cos(angle) * distance;
    mesh.position.z = Math.sin(angle) * distance;
    
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

  createPlanetMesh(type, radius) {
    const lod = new LOD();
    
    // 高细节级别
    const highDetailGeo = this.createPlanetGeometry(radius, 128);
    const highDetailMat = this.getMaterialByType(type, true);
    lod.addLevel(new THREE.Mesh(highDetailGeo, highDetailMat), 500);
    
    // 中细节级别
    const midDetailGeo = this.createPlanetGeometry(radius, 64);
    const midDetailMat = this.getMaterialByType(type, false);
    lod.addLevel(new THREE.Mesh(midDetailGeo, midDetailMat), 1500);
    
    // 低细节级别
    const lowDetailGeo = this.createPlanetGeometry(radius, 32);
    const lowDetailMat = this.getMaterialByType(type, false);
    lod.addLevel(new THREE.Mesh(lowDetailGeo, lowDetailMat), 3000);
    
    lod.name = `planet_${type}`;
    return lod;
  }

  createPlanetGeometry(radius, segments) {
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const vertices = geometry.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] / radius;
      const y = vertices[i + 1] / radius;
      const z = vertices[i + 2] / radius;
      
      const noiseValue = this.calculateTerrainNoise(x, y, z);
      const height = radius * (1 + noiseValue * 0.1);
      
      vertices[i] = x * height;
      vertices[i + 1] = y * height;
      vertices[i + 2] = z * height;
    }
    
    geometry.computeNormals();
    return geometry;
  }

  calculateTerrainNoise(x, y, z) {
    let value = 0;
    value += 0.5 * this.noise.noise3d(x * 2, y * 2, z * 2);
    value += 0.25 * this.noise.noise3d(x * 4, y * 4, z * 4);
    value += 0.125 * this.noise.noise3d(x * 8, y * 8, z * 8);
    return value;
  }

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

  generateResources(type) {
    const baseResources = [];
    
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
    
    return baseResources.map(resource => ({
      type: resource,
      quantity: Math.floor(Math.random() * 1000) + 100,
      positions: this.generateResourcePositions(5 + Math.floor(Math.random() * 15))
    }));
  }

  generateResourcePositions(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions.push({ theta, phi });
    }
    return positions;
  }

  // 辅助方法实现
  getRadiusByType(type) {
    const radii = { terran: 20, gasGiant: 50, ice: 15, volcanic: 25, desert: 18 };
    return radii[type] || 20;
  }
  
  getTerrainType(type) {
    const terrains = { terran: 'earth-like', gasGiant: 'clouds', ice: 'frozen', volcanic: 'rocky', desert: 'sandy' };
    return terrains[type] || 'unknown';
  }
  
  hasAtmosphere(type) {
    return ['terran', 'gasGiant', 'ice'].includes(type);
  }
  
  calculateGravity(radius, type) {
    const base = radius / 10;
    const multipliers = { terran: 1, gasGiant: 2, ice: 0.8, volcanic: 1.2, desert: 0.9 };
    return base * multipliers[type];
  }  createTerranMaterial(hasDetail) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
      metalness: 0.2
    });
    if (hasDetail) {
      // 可以添加纹理细节
    }
    return material;
  }
  
  createGasGiantMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.8,
      roughness: 1
    });
  }
  
  createIceMaterial(hasDetail) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0x111133
    });
    return material;
  }
  
  createVolcanicMaterial(hasDetail) {
    return new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.4
    });
  }
  
  createDesertMaterial(hasDetail) {
    return new THREE.MeshStandardMaterial({
      color: 0xe9c163,
      roughness: 0.7,
      metalness: 0.1
    });
  }
}

