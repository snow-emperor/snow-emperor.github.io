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
      { sym: 'Si', ratio: 0.4 },
      { sym: 'O', ratio: 0.4 },
      { sym: 'Al', ratio: 0.1 },
      { sym: 'Fe', ratio: 0.1 }
    ],
    color: 0x888888,
    hardness: 3,
    texture: 'rough'
  },
  
  // 泥土 - 有机物和矿物质混合
  'dirt': {
    name: '泥土',
    components: [
      { sym: 'Si', ratio: 0.3 },
      { sym: 'O', ratio: 0.3 },
      { sym: 'C', ratio: 0.2 },
      { sym: 'H', ratio: 0.1 },
      { sym: 'N', ratio: 0.1 }
    ],
    color: 0x795548,
    hardness: 1,
    texture: 'soft'
  },
  
  // 铁矿石
  'iron_ore': {
    name: '铁矿石',
    components: [
      { sym: 'Fe', ratio: 0.6 },
      { sym: 'O', ratio: 0.3 },
      { sym: 'Si', ratio: 0.1 }
    ],
    color: 0xcd853f,
    hardness: 4,
    texture: 'grainy'
  },
  
  // 煤炭
  'coal': {
    name: '煤炭',
    components: [
      { sym: 'C', ratio: 0.8 },
      { sym: 'H', ratio: 0.15 },
      { sym: 'O', ratio: 0.05 }
    ],
    color: 0x2f4f4f,
    hardness: 2,
    texture: 'matte'
  },
  
  // 金矿石
  'gold_ore': {
    name: '金矿石',
    components: [
      { sym: 'Au', ratio: 0.7 },
      { sym: 'Ag', ratio: 0.2 },
      { sym: 'Cu', ratio: 0.1 }
    ],
    color: 0xffd700,
    hardness: 3,
    texture: 'shiny'
  }
};

// 世界生成中的物体分布
export function getObjectAt(wx, wy, wz) {
  // 根据深度和位置决定生成哪种物体
  const depth = -wy;
  
  // 表层 - 泥土和石头
  if (depth < 10) {
    return Math.random() > 0.7 ? 'dirt' : 'stone';
  }
  
  // 中层 - 矿石
  if (depth < 50) {
    const r = Math.random();
    if (r < 0.05) return 'gold_ore';
    if (r < 0.15) return 'iron_ore';
    if (r < 0.3) return 'coal';
    return 'stone';
  }
  
  // 深层 - 更多矿石
  if (depth < 150) {
    const r = Math.random();
    if (r < 0.1) return 'gold_ore';
    if (r < 0.3) return 'iron_ore';
    if (r < 0.5) return 'coal';
    return 'stone';
  }
  
  // 极深层 - 基岩
  return 'stone';
}

// 获取物体的原子组成
export function getObjectComposition(objectType) {
  const obj = OBJECTS[objectType];
  if (!obj) return [];
  
  return obj.components.map(comp => ({
    id: SYM2ID[comp.sym],
    symbol: comp.sym,
    ratio: comp.ratio
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