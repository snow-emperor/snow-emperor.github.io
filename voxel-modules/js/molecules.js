// 分子和物体系统
// 定义分子和物体的结构和生成规则

import { ELEMENTS, SYM2ID } from './atomData.js';

// 分子定义 - 原子组合形成分子
export const MOLECULES = {
  // 水分子 H2O
  'H2O': {
    name: '水',
    formula: 'H2O',
    structure: [
      { sym: 'H', x: -0.1, y: 0, z: 0 },
      { sym: 'H', x: 0.1, y: 0, z: 0 },
      { sym: 'O', x: 0, y: 0, z: 0 }
    ],
    color: 0x0000ff,
    density: 1.0
  },
  
  // 二氧化碳 CO2
  'CO2': {
    name: '二氧化碳',
    formula: 'CO2',
    structure: [
      { sym: 'O', x: -0.2, y: 0, z: 0 },
      { sym: 'C', x: 0, y: 0, z: 0 },
      { sym: 'O', x: 0.2, y: 0, z: 0 }
    ],
    color: 0xffffff,
    density: 1.5
  },
  
  // 甲烷 CH4
  'CH4': {
    name: '甲烷',
    formula: 'CH4',
    structure: [
      { sym: 'C', x: 0, y: 0, z: 0 },
      { sym: 'H', x: 0.1, y: 0.1, z: 0.1 },
      { sym: 'H', x: -0.1, y: 0.1, z: -0.1 },
      { sym: 'H', x: 0.1, y: -0.1, z: -0.1 },
      { sym: 'H', x: -0.1, y: -0.1, z: 0.1 }
    ],
    color: 0xaaaaaa,
    density: 0.7
  }
};

// 物体定义 - 分子或原子的聚合体
export const OBJECTS = {
  // 石头 - 多种硅化合物的混合体
  'stone': {
    name: '石头',
    components: [
      { sym: 'Si', ratio: 0.4, variance: 0.1 },
      { sym: 'O', ratio: 0.4, variance: 0.1 },
      { sym: 'Al', ratio: 0.1, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.05 }
    ],
    color: 0x888888,
    hardness: 3,
    texture: 'rough',
    rarity: 1.0
  },
  
  // 泥土 - 有机物和矿物质混合
  'dirt': {
    name: '泥土',
    components: [
      { sym: 'Si', ratio: 0.3, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.1 },
      { sym: 'C', ratio: 0.2, variance: 0.1 },
      { sym: 'H', ratio: 0.1, variance: 0.05 },
      { sym: 'N', ratio: 0.1, variance: 0.05 }
    ],
    color: 0x795548,
    hardness: 1,
    texture: 'soft',
    rarity: 1.0
  },
  
  // 铁矿石
  'iron_ore': {
    name: '铁矿石',
    components: [
      { sym: 'Fe', ratio: 0.6, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.05 },
      { sym: 'Si', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xcd853f,
    hardness: 4,
    texture: 'grainy',
    rarity: 0.7
  },
  
  // 煤炭
  'coal': {
    name: '煤炭',
    components: [
      { sym: 'C', ratio: 0.8, variance: 0.1 },
      { sym: 'H', ratio: 0.15, variance: 0.05 },
      { sym: 'O', ratio: 0.05, variance: 0.02 }
    ],
    color: 0x2f4f4f,
    hardness: 2,
    texture: 'matte',
    rarity: 0.8
  },
  
  // 金矿石
  'gold_ore': {
    name: '金矿石',
    components: [
      { sym: 'Au', ratio: 0.7, variance: 0.1 },
      { sym: 'Ag', ratio: 0.2, variance: 0.05 },
      { sym: 'Cu', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xffd700,
    hardness: 3,
    texture: 'shiny',
    rarity: 0.3
  },
  
  // 铜矿石
  'copper_ore': {
    name: '铜矿石',
    components: [
      { sym: 'Cu', ratio: 0.6, variance: 0.1 },
      { sym: 'S', ratio: 0.3, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xcd853f,
    hardness: 3,
    texture: 'grainy',
    rarity: 0.5
  },
  
  // 铝土矿
  'bauxite': {
    name: '铝土矿',
    components: [
      { sym: 'Al', ratio: 0.5, variance: 0.1 },
      { sym: 'O', ratio: 0.4, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xc0c0c0,
    hardness: 2,
    texture: 'rough',
    rarity: 0.6
  },
  
  // 铀矿
  'uranium_ore': {
    name: '铀矿',
    components: [
      { sym: 'U', ratio: 0.7, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.05 }
    ],
    color: 0x32cd32,
    hardness: 4,
    texture: 'grainy',
    rarity: 0.2,
    radioactive: true
  },
  
  // 钻石
  'diamond': {
    name: '钻石',
    components: [
      { sym: 'C', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xb0e0e6,
    hardness: 10,
    texture: 'shiny',
    rarity: 0.1
  },
  
  // 红宝石
  'ruby': {
    name: '红宝石',
    components: [
      { sym: 'Al', ratio: 0.8, variance: 0.05 },
      { sym: 'Cr', ratio: 0.2, variance: 0.02 }
    ],
    color: 0xff0000,
    hardness: 9,
    texture: 'shiny',
    rarity: 0.15
  }
};

// 世界生成中的物体分布算法
export function getObjectAt(wx, wy, wz) {
  // 根据深度和位置决定生成哪种物体
  const depth = -wy;
  
  // 生成随机因子用于物体分布
  const seed = Math.sin(wx * 12.9898 + wy * 78.233 + wz * 37.719) * 43758.5453;
  const random = seed - Math.floor(seed);
  
  // 表层 - 泥土和石头
  if (depth < 10) {
    return random > 0.7 ? 'dirt' : 'stone';
  }
  
  // 中层 - 石头和常见矿石
  if (depth < 50) {
    if (random < 0.05) return 'gold_ore';
    if (random < 0.15) return 'iron_ore';
    if (random < 0.3) return 'coal';
    if (random < 0.4) return 'copper_ore';
    return 'stone';
  }
  
  // 深层 - 更多矿石
  if (depth < 150) {
    if (random < 0.05) return 'uranium_ore';
    if (random < 0.1) return 'gold_ore';
    if (random < 0.25) return 'iron_ore';
    if (random < 0.4) return 'coal';
    if (random < 0.55) return 'copper_ore';
    if (random < 0.65) return 'bauxite';
    return 'stone';
  }
  
  // 极深层 - 稀有矿物
  if (depth < 300) {
    if (random < 0.02) return 'diamond';
    if (random < 0.07) return 'ruby';
    if (random < 0.15) return 'uranium_ore';
    if (random < 0.3) return 'gold_ore';
    if (random < 0.5) return 'iron_ore';
    if (random < 0.6) return 'coal';
    return 'stone';
  }
  
  // 超深层 - 基岩
  return 'stone';
}

// 获取物体的原子组成（基于稀有度和权重算法）
export function getObjectComposition(objectType) {
  const obj = OBJECTS[objectType];
  if (!obj) return [];
  
  return obj.components.map(comp => ({
    id: SYM2ID[comp.sym],
    symbol: comp.sym,
    ratio: Math.max(0, Math.min(1, comp.ratio + (Math.random() - 0.5) * comp.variance * 2)),
    rarity: ELEMENTS[SYM2ID[comp.sym]] ? ELEMENTS[SYM2ID[comp.sym]].rarity : 1.0
  }));
}

// 获取物体的颜色
export function getObjectColor(objectType) {
  const obj = OBJECTS[objectType];
  return obj ? obj.color : 0x888888;
}

// 获取物体的硬度（影响挖掘时间）
export function getObjectHardness(objectType) {
  const obj = OBJECTS[objectType];
  return obj ? obj.hardness : 1;
}

// 获取物体的稀有度
export function getObjectRarity(objectType) {
  const obj = OBJECTS[objectType];
  return obj ? (obj.rarity || 1.0) : 1.0;
}