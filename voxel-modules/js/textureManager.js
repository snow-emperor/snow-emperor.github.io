// 纹理资源管理器
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

class TextureManager {
  constructor() {
    this.textures = new Map();
    this.materials = new Map();
  }
  
  // 创建物体纹理图集
  createObjectTextures(objects) {
    const canvas = document.createElement('canvas');
    const size = 2048; // 增大纹理图集以提高质量
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
      
      // 根据物体状态和纹理类型绘制不同图案
      switch (object.state) {
        case 'liquid':
          this.drawLiquidTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        case 'gas':
          this.drawGasTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
          break;
        default:
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
            case 'metal':
              this.drawMetalTexture(ctx, x, y, cellSize, cellSize, ctx.fillStyle);
              break;
            default:
              // 默认纯色
              ctx.fillRect(x, y, cellSize, cellSize);
          }
      }
      
      // 绘制物体名称
      if (object.name) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(14, cellSize/10)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(object.name, x + cellSize/2, y + cellSize/2);
      }
      
      // 添加边框
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    this.textures.set('objectAtlas', texture);
    return texture;
  }
  
  // 绘制液体纹理
  drawLiquidTexture(ctx, x, y, width, height, color) {
    // 创建波浪效果
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 20));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加波浪纹理
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < 5; i++) {
      const yOffset = y + (i + 0.5) * height / 5;
      ctx.moveTo(x, yOffset);
      for (let j = 0; j <= 10; j++) {
        const xOffset = x + j * width / 10;
        const waveHeight = Math.sin(j * Math.PI / 5) * 5;
        ctx.lineTo(xOffset, yOffset + waveHeight);
      }
    }
    ctx.stroke();
  }
  
  // 绘制气体纹理
  drawGasTexture(ctx, x, y, width, height, color) {
    // 创建半透明气体效果
    ctx.fillStyle = hexToRgba(color, 0.4);
    ctx.fillRect(x, y, width, height);
    
    // 添加云雾效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 50; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const r = Math.random() * 10;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加小颗粒
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 100; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }
  
  // 绘制粗糙纹理
  drawRoughTexture(ctx, x, y, width, height, color) {
    // 创建基础颜色
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 20));
    gradient.addColorStop(1, darkenColor(color, 20));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加粗糙纹理效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let i = 0; i < 150; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const rw = Math.random() * 5;
      const rh = Math.random() * 5;
      ctx.fillRect(rx, ry, rw, rh);
    }
    
    // 添加亮点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 50; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const r = Math.random() * 3;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 绘制柔软纹理
  drawSoftTexture(ctx, x, y, width, height, color) {
    // 创建渐变背景
    const gradient = ctx.createRadialGradient(
      x + width/2, y + height/2, 0,
      x + width/2, y + height/2, width/2
    );
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加柔软纹理
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 80; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const r = Math.random() * 6;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 绘制颗粒纹理
  drawGrainyTexture(ctx, x, y, width, height, color) {
    // 基础颜色
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // 添加颗粒效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 300; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      ctx.fillRect(rx, ry, 1, 1);
    }
    
    // 添加较大颗粒
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 80; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const size = Math.random() * 4;
      ctx.fillRect(rx, ry, size, size);
    }
  }
  
  // 绘制哑光纹理
  drawMatteTexture(ctx, x, y, width, height, color) {
    // 基础颜色
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // 添加细微纹理
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 120; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const rw = Math.random() * 8;
      ctx.fillRect(rx, ry, rw, 1);
    }
    
    // 添加垂直纹理
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 60; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const rh = Math.random() * 6;
      ctx.fillRect(rx, ry, 1, rh);
    }
  }
  
  // 绘制闪亮纹理
  drawShinyTexture(ctx, x, y, width, height, color) {
    // 创建金属质感背景
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 40));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 30));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加高光
    const highlight = ctx.createRadialGradient(
      x + width/3, y + height/3, 0,
      x + width/3, y + height/3, width/4
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(x + width/3, y + height/3, width/4, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加反射
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + width*0.7, y + height*0.4, width/8, height/6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加额外的闪光点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 10; i++) {
      const rx = x + Math.random() * width;
      const ry = y + Math.random() * height;
      const r = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 绘制金属纹理
  drawMetalTexture(ctx, x, y, width, height, color) {
    // 创建金属质感背景
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lightenColor(color, 20));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 30));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 添加划痕效果
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const startX = x + Math.random() * width;
      const startY = y + Math.random() * height;
      const length = 5 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + Math.cos(angle) * length,
        startY + Math.sin(angle) * length
      );
      ctx.stroke();
    }
    
    // 添加高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(
      x + width * 0.7, 
      y + height * 0.3, 
      width * 0.2, 
      height * 0.1, 
      Math.PI / 4, 
      0, 
      Math.PI * 2
    );
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
  
  // 创建元素纹理图集
  createElementAtlas(elements) {
    const canvas = document.createElement('canvas');
    const size = 2048;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    
    const elementKeys = Object.keys(elements);
    const gridSize = Math.ceil(Math.sqrt(elementKeys.length));
    const cellSize = size / Math.max(gridSize, 1);
    
    elementKeys.forEach((key, index) => {
      const element = elements[key];
      if (!element) return;
      
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = col * cellSize;
      const y = row * cellSize;
      
      // 绘制元素背景
      ctx.fillStyle = element.color || '#808080';
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // 绘制元素符号
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(20, cellSize/2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(element.symbol || key, x + cellSize/2, y + cellSize/3);
      
      // 绘制元素名称
      ctx.font = `bold ${Math.max(12, cellSize/4)}px Arial`;
      ctx.fillText(element.name || '', x + cellSize/2, y + cellSize*2/3);
      
      // 添加边框
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    this.textures.set('elementAtlas', texture);
    return texture;
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

// 辅助函数：将十六进制颜色转换为RGBA
function hexToRgba(hex, alpha) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 创建全局实例
export const textureManager = new TextureManager();