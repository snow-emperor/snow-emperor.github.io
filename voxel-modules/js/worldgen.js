import { ELEMENTS, SYM2ID } from './atomData.js';
import { getObjectAt } from './molecules.js';
import { ImprovedNoise } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/math/ImprovedNoise.js';
const noise = new ImprovedNoise();

// 创建多个噪声函数用于不同属性
const densityNoise = new ImprovedNoise();
const caveNoise = new ImprovedNoise();
const oreNoise = new ImprovedNoise();

export function density(wx, wy, wz) {
  // 基础地形高度
  const baseHeight = 40;
  
  // 主要地形噪声
  const terrainNoise = densityNoise.noise(wx * 0.02, 0, wz * 0.02) * 20;
  
  // 山脉噪声
  const mountainNoise = densityNoise.noise(wx * 0.005, 0, wz * 0.005) * 50;
  
  // 细节噪声
  const detailNoise = densityNoise.noise(wx * 0.1, 0, wz * 0.1) * 2;
  
  // 洞穴系统
  const caveFactor = caveNoise.noise(wx * 0.05, wy * 0.05, wz * 0.05);
  const caveThreshold = 0.3 + Math.max(0, (wy + 30) / 100); // 深度越深洞穴越少
  
  // 综合计算
  let d = baseHeight + terrainNoise + mountainNoise + detailNoise + wy;
  
  // 应用洞穴系统
  if (caveFactor > caveThreshold) {
    d -= 100; // 创建洞穴
  }
  
  return d;
}

export function atomAt(wx, wy, wz) {
  const d = density(wx, wy, wz);
  
  // 真空区域
  if (d < 0) return 0;
  
  // 根据深度和位置决定生成物体
  const depth = -wy;
  
  // 表面层 - 草和泥土
  if (depth < 5) {
    if (depth < 2) return SYM2ID['stone']; // 表面石头
    return SYM2ID['dirt']; // 表面泥土
  }
  
  // 浅层 - 泥土和石头
  if (depth < 20) {
    // 添加一些有机物
    if (Math.random() < 0.05) return SYM2ID['coal'];
    return SYM2ID['dirt'];
  }
  
  // 中层 - 石头和矿石
  if (depth < 50) {
    // 生成矿石
    const oreValue = oreNoise.noise(wx * 0.1, wy * 0.1, wz * 0.1);
    if (oreValue > 0.7) return SYM2ID['iron_ore'];
    if (oreValue > 0.6) return SYM2ID['coal'];
    if (oreValue > 0.5) return SYM2ID['copper_ore'];
    return SYM2ID['stone'];
  }
  
  // 深层 - 更多矿石和基岩
  if (depth < 100) {
    const oreValue = oreNoise.noise(wx * 0.05, wy * 0.05, wz * 0.05);
    if (oreValue > 0.7) return SYM2ID['gold_ore'];
    if (oreValue > 0.5) return SYM2ID['iron_ore'];
    if (oreValue > 0.4) return SYM2ID['coal'];
    if (oreValue > 0.3) return SYM2ID['copper_ore'];
    if (oreValue > 0.2) return SYM2ID['bauxite'];
    return SYM2ID['stone'];
  }
  
  // 极深层 - 稀有矿物
  if (depth < 200) {
    const oreValue = oreNoise.noise(wx * 0.03, wy * 0.03, wz * 0.03);
    if (oreValue > 0.8) return SYM2ID['diamond'];
    if (oreValue > 0.7) return SYM2ID['ruby'];
    if (oreValue > 0.6) return SYM2ID['uranium_ore'];
    if (oreValue > 0.4) return SYM2ID['gold_ore'];
    return SYM2ID['stone'];
  }
  
  // 超深层 - 基岩
  return SYM2ID['stone'];
}