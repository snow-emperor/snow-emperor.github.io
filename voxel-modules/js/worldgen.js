import { ELEMENTS, SYM2ID } from './atomData.js';
import { getObjectAt } from './molecules.js';
import { OBJECTS } from './molecules.js';
import { ImprovedNoise } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/math/ImprovedNoise.js';
const noise = new ImprovedNoise();

// 创建多个噪声函数用于不同属性
const densityNoise = new ImprovedNoise();
const caveNoise = new ImprovedNoise();
const oreNoise = new ImprovedNoise();
const biomeNoise = new ImprovedNoise();

export function density(wx, wy, wz) {
  // 基础地形高度
  const baseHeight = 40;
  
  // 主要地形噪声
  const terrainNoise = densityNoise.noise(wx * 0.02, 0, wz * 0.02) * 20;
  
  // 山脉噪声
  const mountainNoise = densityNoise.noise(wx * 0.005, 0, wz * 0.005) * 50;
  
  // 细节噪声
  const detailNoise = densityNoise.noise(wx * 0.1, 0, wz * 0.1) * 2;
  
  // 生物群落噪声
  const biomeFactor = biomeNoise.noise(wx * 0.01, 0, wz * 0.01);
  
  // 洞穴系统
  const caveFactor = caveNoise.noise(wx * 0.05, wy * 0.05, wz * 0.05);
  const caveThreshold = 0.3 + Math.max(0, (wy + 30) / 100); // 深度越深洞穴越少
  
  // 综合计算
  let d = baseHeight + terrainNoise + mountainNoise + detailNoise + wy;
  
  // 根据生物群落调整地形
  if (biomeFactor > 0.5) {
    // 山地
    d += 15;
  } else if (biomeFactor < -0.5) {
    // 平原
    d -= 10;
  }
  
  // 应用洞穴系统
  if (caveFactor > caveThreshold) {
    d -= 100; // 创建洞穴
  }
  
  return d;
}

// 创建一个简单的对象类型到ID的映射
const OBJECT_KEYS = Object.keys(OBJECTS);
const OBJECT_TYPE_MAP = {};
for (let i = 0; i < OBJECT_KEYS.length; i++) {
  OBJECT_TYPE_MAP[OBJECT_KEYS[i]] = i + 1; // 从1开始，0表示空气
}

export function atomAt(wx, wy, wz) {
  const d = density(wx, wy, wz);
  
  // 真空区域
  if (d < 0) return 0;
  
  // 根据深度和位置决定生成物体
  const depth = -wy;
  
  // 获取生物群落因子
  const biomeFactor = biomeNoise.noise(wx * 0.01, 0, wz * 0.01);
  
  // 表面层 - 根据生物群落生成不同地表
  if (depth < 5) {
    if (biomeFactor > 0.5) {
      // 山地 - 花岗岩
      return OBJECT_TYPE_MAP['granite'];
    } else if (biomeFactor < -0.5) {
      // 平原 - 泥土
      return OBJECT_TYPE_MAP['dirt'];
    } else if (biomeFactor > 0) {
      // 丘陵 - 砂土
      return OBJECT_TYPE_MAP['sand'];
    } else {
      // 普通 - 粘土
      return OBJECT_TYPE_MAP['clay'];
    }
  }
  
  // 浅层 - 根据生物群落生成不同土壤层
  if (depth < 20) {
    if (biomeFactor > 0.3) {
      // 山地 - 石灰岩
      if (Math.random() < 0.2) return OBJECT_TYPE_MAP['limestone'];
      return OBJECT_TYPE_MAP['dirt'];
    } else if (biomeFactor < -0.3) {
      // 平原 - 粘土
      if (Math.random() < 0.3) return OBJECT_TYPE_MAP['clay'];
      return OBJECT_TYPE_MAP['dirt'];
    } else {
      // 普通 - 泥土
      return OBJECT_TYPE_MAP['dirt'];
    }
  }
  
  // 中层 - 石头和矿石
  if (depth < 50) {
    // 生成矿石
    const oreValue = oreNoise.noise(wx * 0.1, wy * 0.1, wz * 0.1);
    if (oreValue > 0.9) return OBJECT_TYPE_MAP['diamond'];
    if (oreValue > 0.85) return OBJECT_TYPE_MAP['ruby'];
    if (oreValue > 0.8) return OBJECT_TYPE_MAP['sapphire'];
    if (oreValue > 0.75) return OBJECT_TYPE_MAP['emerald'];
    if (oreValue > 0.7) return OBJECT_TYPE_MAP['hematite'];
    if (oreValue > 0.65) return OBJECT_TYPE_MAP['pyrite'];
    if (oreValue > 0.6) return OBJECT_TYPE_MAP['chalcopyrite'];
    if (oreValue > 0.55) return OBJECT_TYPE_MAP['limestone'];
    return OBJECT_TYPE_MAP['granite'];
  }
  
  // 深层 - 更多矿石和基岩
  if (depth < 100) {
    const oreValue = oreNoise.noise(wx * 0.05, wy * 0.05, wz * 0.05);
    if (oreValue > 0.95) return OBJECT_TYPE_MAP['diamond'];
    if (oreValue > 0.9) return OBJECT_TYPE_MAP['ruby'];
    if (oreValue > 0.85) return OBJECT_TYPE_MAP['sapphire'];
    if (oreValue > 0.8) return OBJECT_TYPE_MAP['emerald'];
    if (oreValue > 0.75) return OBJECT_TYPE_MAP['amethyst'];
    if (oreValue > 0.7) return OBJECT_TYPE_MAP['topaz'];
    if (oreValue > 0.65) return OBJECT_TYPE_MAP['opal'];
    if (oreValue > 0.6) return OBJECT_TYPE_MAP['magnetite'];
    if (oreValue > 0.55) return OBJECT_TYPE_MAP['chalcopyrite'];
    if (oreValue > 0.5) return OBJECT_TYPE_MAP['galena'];
    if (oreValue > 0.45) return OBJECT_TYPE_MAP['sphalerite'];
    if (oreValue > 0.4) return OBJECT_TYPE_MAP['cassiterite'];
    if (oreValue > 0.35) return OBJECT_TYPE_MAP['bauxite'];
    if (oreValue > 0.3) return OBJECT_TYPE_MAP['quartzite'];
    return OBJECT_TYPE_MAP['granite'];
  }
  
  // 极深层 - 稀有矿物和坚硬岩石
  if (depth < 200) {
    const oreValue = oreNoise.noise(wx * 0.03, wy * 0.03, wz * 0.03);
    if (oreValue > 0.98) return OBJECT_TYPE_MAP['diamond'];
    if (oreValue > 0.95) return OBJECT_TYPE_MAP['ruby'];
    if (oreValue > 0.92) return OBJECT_TYPE_MAP['sapphire'];
    if (oreValue > 0.89) return OBJECT_TYPE_MAP['emerald'];
    if (oreValue > 0.86) return OBJECT_TYPE_MAP['amethyst'];
    if (oreValue > 0.83) return OBJECT_TYPE_MAP['topaz'];
    if (oreValue > 0.8) return OBJECT_TYPE_MAP['opal'];
    if (oreValue > 0.75) return OBJECT_TYPE_MAP['uraninite'];
    if (oreValue > 0.7) return OBJECT_TYPE_MAP['gold'];
    if (oreValue > 0.65) return OBJECT_TYPE_MAP['platinum'];
    if (oreValue > 0.6) return OBJECT_TYPE_MAP['magnetite'];
    if (oreValue > 0.55) return OBJECT_TYPE_MAP['quartzite'];
    if (oreValue > 0.5) return OBJECT_TYPE_MAP['marble'];
    return OBJECT_TYPE_MAP['basalt'];
  }
  
  // 超深层 - 坚硬基岩
  const oreValue = oreNoise.noise(wx * 0.01, wy * 0.01, wz * 0.01);
  if (oreValue > 0.9) return OBJECT_TYPE_MAP['diamond'];
  if (oreValue > 0.8) return OBJECT_TYPE_MAP['quartzite'];
  if (oreValue > 0.7) return OBJECT_TYPE_MAP['marble'];
  return OBJECT_TYPE_MAP['basalt'];
}