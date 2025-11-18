// 纹理资源管理器
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

class TextureManager {
  constructor() {
    this.textures = new Map();
    this.materials = new Map();
  }
  
  // 创建元素纹理图集
  createElementAtlas(elements) {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    
    const gridSize = 8;
    const cellSize = size / gridSize;
    
    for (let i = 0; i < elements.length && i < 64; i++) {
      const element = elements[i];
      if (!element) continue;
      
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = col * cellSize;
      const y = row * cellSize;
      
      // 绘制元素背景
      const color = element.color !== undefined ? element.color : 0x808080;
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      
      // 绘制渐变背景
      const gradient = ctx.createRadialGradient(
        x + cellSize/2, y + cellSize/2, 2,
        x + cellSize/2, y + cellSize/2, cellSize/2
      );
      gradient.addColorStop(0, lightenColor(ctx.fillStyle, 40));
      gradient.addColorStop(1, ctx.fillStyle);
      
      ctx.fillStyle = gradient;
      this.roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
      
      // 添加高光效果
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x + cellSize/3, y + cellSize/3, cellSize/6, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制元素符号
      if (element.symbol) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(8, cellSize/4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.symbol, x + cellSize/2, y + cellSize/2);
        
        // 添加原子序数
        ctx.font = `${Math.max(6, cellSize/6)}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(i+1, x + cellSize/4, y + cellSize/4);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    this.textures.set('elementAtlas', texture);
    return texture;
  }
  
  // 创建物体纹理图集
  createObjectTextures(objects) {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    
    const objectKeys = Object.keys(objects);
    const gridSize = Math.ceil(Math.sqrt(objectKeys.length));
    const cellSize = size / Math.max(gridSize, 1);
    
    objectKeys.forEach((key, index) => {
      const object = objects[key];
      if (!object) return;
      
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = col * cellSize;
      const y = row * cellSize;
      
      // 绘制物体背景
      const color = object.color !== undefined ? object.color : 0x808080;
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      
      // 根据纹理类型绘制不同图案
      switch (object.texture) {
        case 'rough':
          this.drawRoughTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        case 'soft':
          this.drawSoftTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        case 'grainy':
          this.drawGrainyTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        case 'matte':
          this.drawMatteTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        case 'shiny':
          this.drawShinyTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        default:
          // 默认纯色
          ctx.fillRect(x, y, cellSize, cellSize);
      }
      
      // 根据稀有度添加边框效果
      const rarity = object.rarity !== undefined ? object.rarity : 1.0;
      if (rarity < 0.3) { // 非常稀有
        ctx.strokeStyle = '#ffd700'; // 金色边框
        ctx.lineWidth = 3;
      } else if (rarity < 0.6) { // 稀有
        ctx.strokeStyle = '#c0c0c0'; // 银色边框
        ctx.lineWidth = 2;
      } else { // 常见
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
      }
      
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    this.textures.set('objectAtlas', texture);
    return texture;
  }
  
  // 绘制粗糙纹理
  drawRoughTexture(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // 添加粗糙纹理效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 50; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const rw = Math.random() * 3;
      const rh = Math.random() * 3;
      ctx.fillRect(rx, ry, rw, rh);
    }
  }
  
  // 绘制柔软纹理
  drawSoftTexture(ctx, x, y, width, height, color) {
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 20));
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加柔软纹理
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const r = Math.random() * 4;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 绘制颗粒纹理
  drawGrainyTexture(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // 添加颗粒效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 100; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      ctx.fillRect(rx, ry, 1, 1);
    }
  }
  
  // 绘制哑光纹理
  drawMatteTexture(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // 添加细微纹理
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 20; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const rw = Math.random() * 5;
      ctx.fillRect(rx, ry, rw, 1);
    }
  }
  
  // 绘制闪亮纹理
  drawShinyTexture(ctx, x, y, width, height, color) {
    // 创建金属质感背景
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 20));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + width/3, y + height/3, width/6, height/4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 获取纹理
  getTexture(name) {
    return this.textures.get(name);
  }
  
  // 获取材质
  getMaterial(name) {
    return this.materials.get(name);
  }
  
  // 创建材质
  createMaterial(textureName, options = {}) {
    const texture = this.getTexture(textureName);
    if (!texture) return null;
    
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: options.transparent || false,
      opacity: options.opacity || 1.0,
      ...options
    });
    
    this.materials.set(textureName, material);
    return material;
  }
}

// 颜色处理工具函数
function lightenColor(color, percent) {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent);
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent);
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent);
  
  return `rgb(${r},${g},${b})`;
}

function darkenColor(color, percent) {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent);
  
  return `rgb(${r},${g},${b})`;
}

// 创建全局实例
export const textureManager = new TextureManager();