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
  },
  
  // 氨气 NH3
  'NH3': {
    name: '氨气',
    formula: 'NH3',
    structure: [
      { sym: 'N', x: 0, y: 0, z: 0 },
      { sym: 'H', x: 0.1, y: 0.1, z: 0 },
      { sym: 'H', x: -0.1, y: 0.1, z: 0 },
      { sym: 'H', x: 0, y: 0.1, z: 0.1 }
    ],
    color: 0xffffff,
    density: 0.8
  },
  
  // 硫化氢 H2S
  'H2S': {
    name: '硫化氢',
    formula: 'H2S',
    structure: [
      { sym: 'S', x: 0, y: 0, z: 0 },
      { sym: 'H', x: 0.1, y: 0, z: 0 },
      { sym: 'H', x: -0.1, y: 0, z: 0 }
    ],
    color: 0xffff00,
    density: 1.2
  },
  
  // 一氧化碳 CO
  'CO': {
    name: '一氧化碳',
    formula: 'CO',
    structure: [
      { sym: 'C', x: 0, y: 0, z: 0 },
      { sym: 'O', x: 0.1, y: 0, z: 0 }
    ],
    color: 0x000000,
    density: 1.3
  },
  
  // 二氧化硫 SO2
  'SO2': {
    name: '二氧化硫',
    formula: 'SO2',
    structure: [
      { sym: 'S', x: 0, y: 0, z: 0 },
      { sym: 'O', x: 0.1, y: 0.1, z: 0 },
      { sym: 'O', x: -0.1, y: 0.1, z: 0 }
    ],
    color: 0xffff00,
    density: 2.6
  },
  
  // 二氧化氮 NO2
  'NO2': {
    name: '二氧化氮',
    formula: 'NO2',
    structure: [
      { sym: 'N', x: 0, y: 0, z: 0 },
      { sym: 'O', x: 0.1, y: 0, z: 0 },
      { sym: 'O', x: 0, y: 0.1, z: 0 }
    ],
    color: 0xff4500,
    density: 1.9
  },
  
  // 臭氧 O3
  'O3': {
    name: '臭氧',
    formula: 'O3',
    structure: [
      { sym: 'O', x: -0.1, y: 0, z: 0 },
      { sym: 'O', x: 0, y: 0, z: 0 },
      { sym: 'O', x: 0.1, y: 0, z: 0 }
    ],
    color: 0x0000ff,
    density: 2.1
  },
  
  // 氢氟酸 HF
  'HF': {
    name: '氢氟酸',
    formula: 'HF',
    structure: [
      { sym: 'H', x: 0, y: 0, z: 0 },
      { sym: 'F', x: 0.1, y: 0, z: 0 }
    ],
    color: 0x00ffff,
    density: 1.0
  }
};

// 物体定义 - 分子或原子的聚合体
export const OBJECTS = {
  // 岩石类
  'granite': {
    name: '花岗岩',
    components: [
      { sym: 'Si', ratio: 0.3, variance: 0.1 },
      { sym: 'O', ratio: 0.4, variance: 0.1 },
      { sym: 'Al', ratio: 0.1, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.05 },
      { sym: 'K', ratio: 0.05, variance: 0.03 },
      { sym: 'Na', ratio: 0.05, variance: 0.03 }
    ],
    color: 0x888888,
    hardness: 6,
    texture: 'rough',
    state: 'solid', // 固体状态
    density: 2.6 // g/cm³
  },
  
  'basalt': {
    name: '玄武岩',
    components: [
      { sym: 'Si', ratio: 0.4, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.1 },
      { sym: 'Fe', ratio: 0.15, variance: 0.05 },
      { sym: 'Mg', ratio: 0.1, variance: 0.05 },
      { sym: 'Ca', ratio: 0.05, variance: 0.03 }
    ],
    color: 0x444444,
    hardness: 7,
    texture: 'rough',
    state: 'solid', // 固体状态
    density: 3.0 // g/cm³
  },
  
  'marble': {
    name: '大理石',
    components: [
      { sym: 'Ca', ratio: 0.6, variance: 0.1 },
      { sym: 'C', ratio: 0.2, variance: 0.05 },
      { sym: 'O', ratio: 0.2, variance: 0.05 }
    ],
    color: 0xf5f5f5,
    hardness: 3,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 2.7 // g/cm³
  },
  
  'limestone': {
    name: '石灰岩',
    components: [
      { sym: 'Ca', ratio: 0.7, variance: 0.1 },
      { sym: 'C', ratio: 0.2, variance: 0.05 },
      { sym: 'O', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xe0e0e0,
    hardness: 3,
    texture: 'rough',
    state: 'solid', // 固体状态
    density: 2.5 // g/cm³
  },
  
  'sandstone': {
    name: '砂岩',
    components: [
      { sym: 'Si', ratio: 0.7, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.05 }
    ],
    color: 0xc2b280,
    hardness: 4,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 2.2 // g/cm³
  },
  
  'shale': {
    name: '页岩',
    components: [
      { sym: 'Si', ratio: 0.5, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.1 },
      { sym: 'Al', ratio: 0.1, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.05 }
    ],
    color: 0x7a7a7a,
    hardness: 2,
    texture: 'soft',
    state: 'solid', // 固体状态
    density: 2.4 // g/cm³
  },
  
  'quartzite': {
    name: '石英岩',
    components: [
      { sym: 'Si', ratio: 0.33, variance: 0.05 },
      { sym: 'O', ratio: 0.67, variance: 0.05 }
    ],
    color: 0xfafad2,
    hardness: 7,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 2.6 // g/cm³
  },
  
  // 土壤类
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
    state: 'solid', // 固体状态
    density: 1.2 // g/cm³
  },
  
  'sand': {
    name: '砂土',
    components: [
      { sym: 'Si', ratio: 0.7, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.05 }
    ],
    color: 0xc2b280,
    hardness: 1,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 1.6 // g/cm³
  },
  
  'clay': {
    name: '粘土',
    components: [
      { sym: 'Al', ratio: 0.4, variance: 0.1 },
      { sym: 'Si', ratio: 0.3, variance: 0.1 },
      { sym: 'O', ratio: 0.2, variance: 0.05 },
      { sym: 'H', ratio: 0.1, variance: 0.05 }
    ],
    color: 0xa52a2a,
    hardness: 1,
    texture: 'soft',
    state: 'solid', // 固体状态
    density: 1.8 // g/cm³
  },
  
  'silt': {
    name: '粉土',
    components: [
      { sym: 'Si', ratio: 0.5, variance: 0.1 },
      { sym: 'O', ratio: 0.4, variance: 0.1 },
      { sym: 'Al', ratio: 0.1, variance: 0.05 }
    ],
    color: 0x8b7355,
    hardness: 1,
    texture: 'soft',
    state: 'solid', // 固体状态
    density: 1.3 // g/cm³
  },
  
  'water': {
    name: '水',
    components: [
      { sym: 'H', ratio: 0.11, variance: 0.01 },
      { sym: 'O', ratio: 0.89, variance: 0.01 }
    ],
    color: 0x1e90ff,
    hardness: 0,
    texture: 'liquid',
    state: 'liquid', // 液体状态
    density: 1.0 // g/cm³
  },
  
  'lava': {
    name: '熔岩',
    components: [
      { sym: 'Si', ratio: 0.4, variance: 0.05 },
      { sym: 'O', ratio: 0.4, variance: 0.05 },
      { sym: 'Fe', ratio: 0.2, variance: 0.05 }
    ],
    color: 0xff4500,
    hardness: 0,
    texture: 'liquid',
    state: 'liquid', // 液体状态
    density: 3.0 // g/cm³
  },
  
  // 矿物类
  'hematite': {
    name: '赤铁矿',
    components: [
      { sym: 'Fe', ratio: 0.7, variance: 0.1 },
      { sym: 'O', ratio: 0.3, variance: 0.05 }
    ],
    color: 0xcd5c5c,
    hardness: 5,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 5.3 // g/cm³
  },
  
  'magnetite': {
    name: '磁铁矿',
    components: [
      { sym: 'Fe', ratio: 0.72, variance: 0.1 },
      { sym: 'O', ratio: 0.28, variance: 0.05 }
    ],
    color: 0x2f4f4f,
    hardness: 6,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 5.2 // g/cm³
  },
  
  'pyrite': {
    name: '黄铁矿',
    components: [
      { sym: 'Fe', ratio: 0.5, variance: 0.1 },
      { sym: 'S', ratio: 0.5, variance: 0.05 }
    ],
    color: 0xf0e68c,
    hardness: 6,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 5.0 // g/cm³
  },
  
  'chalcopyrite': {
    name: '黄铜矿',
    components: [
      { sym: 'Cu', ratio: 0.35, variance: 0.1 },
      { sym: 'Fe', ratio: 0.35, variance: 0.05 },
      { sym: 'S', ratio: 0.3, variance: 0.05 }
    ],
    color: 0xdaa520,
    hardness: 4,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 4.2 // g/cm³
  },
  
  'galena': {
    name: '方铅矿',
    components: [
      { sym: 'Pb', ratio: 0.87, variance: 0.1 },
      { sym: 'S', ratio: 0.13, variance: 0.05 }
    ],
    color: 0x708090,
    hardness: 3,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 7.5 // g/cm³
  },
  
  'sphalerite': {
    name: '闪锌矿',
    components: [
      { sym: 'Zn', ratio: 0.67, variance: 0.1 },
      { sym: 'S', ratio: 0.33, variance: 0.05 }
    ],
    color: 0xf0e68c,
    hardness: 4,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 4.1 // g/cm³
  },
  
  'cassiterite': {
    name: '锡石',
    components: [
      { sym: 'Sn', ratio: 0.79, variance: 0.1 },
      { sym: 'O', ratio: 0.21, variance: 0.05 }
    ],
    color: 0x663300,
    hardness: 6,
    texture: 'grainy',
    state: 'solid', // 固体状态
    density: 6.9 // g/cm³
  },
  
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
    state: 'solid', // 固体状态
    density: 2.6 // g/cm³
  },
  
  'uraninite': {
    name: '晶质铀矿',
    components: [
      { sym: 'U', ratio: 0.85, variance: 0.1 },
      { sym: 'O', ratio: 0.15, variance: 0.05 }
    ],
    color: 0x32cd32,
    hardness: 5,
    texture: 'grainy',
    radioactive: true,
    state: 'solid', // 固体状态
    density: 10.0 // g/cm³
  },
  
  // 宝石类
  'diamond': {
    name: '钻石',
    components: [
      { sym: 'C', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xb0e0e6,
    hardness: 10,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 3.5 // g/cm³
  },
  
  'ruby': {
    name: '红宝石',
    components: [
      { sym: 'Al', ratio: 0.8, variance: 0.05 },
      { sym: 'Cr', ratio: 0.2, variance: 0.02 }
    ],
    color: 0xdc143c,
    hardness: 9,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 4.0 // g/cm³
  },
  
  'sapphire': {
    name: '蓝宝石',
    components: [
      { sym: 'Al', ratio: 0.8, variance: 0.05 },
      { sym: 'Fe', ratio: 0.1, variance: 0.02 },
      { sym: 'Ti', ratio: 0.1, variance: 0.02 }
    ],
    color: 0x4169e1,
    hardness: 9,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 4.0 // g/cm³
  },
  
  'emerald': {
    name: '祖母绿',
    components: [
      { sym: 'Be', ratio: 0.2, variance: 0.02 },
      { sym: 'Al', ratio: 0.6, variance: 0.05 },
      { sym: 'Si', ratio: 0.15, variance: 0.03 },
      { sym: 'O', ratio: 0.05, variance: 0.01 }
    ],
    color: 0x00fa9a,
    hardness: 8,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 2.7 // g/cm³
  },
  
  'amethyst': {
    name: '紫水晶',
    components: [
      { sym: 'Si', ratio: 0.33, variance: 0.03 },
      { sym: 'O', ratio: 0.67, variance: 0.05 }
    ],
    color: 0x9370db,
    hardness: 7,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 2.6 // g/cm³
  },
  
  'topaz': {
    name: '黄玉',
    components: [
      { sym: 'Al', ratio: 0.4, variance: 0.05 },
      { sym: 'Si', ratio: 0.2, variance: 0.03 },
      { sym: 'F', ratio: 0.4, variance: 0.05 }
    ],
    color: 0xffd700,
    hardness: 8,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 3.5 // g/cm³
  },
  
  'opal': {
    name: '蛋白石',
    components: [
      { sym: 'Si', ratio: 0.33, variance: 0.03 },
      { sym: 'O', ratio: 0.67, variance: 0.05 }
    ],
    color: 0xe0ffff,
    hardness: 6,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 2.1 // g/cm³
  },
  
  // 金属类
  'gold': {
    name: '金',
    components: [
      { sym: 'Au', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xffd700,
    hardness: 3,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 19.3 // g/cm³
  },
  
  'silver': {
    name: '银',
    components: [
      { sym: 'Ag', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xc0c0c0,
    hardness: 3,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 10.5 // g/cm³
  },
  
  'copper': {
    name: '铜',
    components: [
      { sym: 'Cu', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xcd853f,
    hardness: 3,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 8.9 // g/cm³
  },
  
  'platinum': {
    name: '铂金',
    components: [
      { sym: 'Pt', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xe6e6fa,
    hardness: 4,
    texture: 'shiny',
    state: 'solid', // 固体状态
    density: 21.4 // g/cm³
  },
  
  'iron': {
    name: '铁',
    components: [
      { sym: 'Fe', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xd3d3d3,
    hardness: 5,
    texture: 'metal',
    state: 'solid', // 固体状态
    density: 7.8 // g/cm³
  },
  
  'lead': {
    name: '铅',
    components: [
      { sym: 'Pb', ratio: 1.0, variance: 0.0 }
    ],
    color: 0x708090,
    hardness: 2,
    texture: 'metal',
    state: 'solid', // 固体状态
    density: 11.3 // g/cm³
  },
  
  'tin': {
    name: '锡',
    components: [
      { sym: 'Sn', ratio: 1.0, variance: 0.0 }
    ],
    color: 0x66cdaa,
    hardness: 2,
    texture: 'metal',
    state: 'solid', // 固体状态
    density: 7.3 // g/cm³
  },
  
  'zinc': {
    name: '锌',
    components: [
      { sym: 'Zn', ratio: 1.0, variance: 0.0 }
    ],
    color: 0xf0e68c,
    hardness: 2,
    texture: 'metal',
    state: 'solid', // 固体状态
    density: 7.1 // g/cm³
  },
  
  'titanium': {
    name: '钛',
    components: [
      { sym: 'Ti', ratio: 1.0, variance: 0.0 }
    ],
    color: 0x7fffd4,
    hardness: 6,
    texture: 'metal',
    state: 'solid', // 固体状态
    density: 4.5 // g/cm³
  },
  
  // 气体类
  'steam': {
    name: '蒸汽',
    components: [
      { sym: 'H', ratio: 0.11, variance: 0.01 },
      { sym: 'O', ratio: 0.89, variance: 0.01 }
    ],
    color: 0xe0ffff,
    hardness: 0,
    texture: 'gas',
    state: 'gas', // 气体状态
    density: 0.6 // g/cm³
  }
};

// 世界生成中的物体分布算法
export function getObjectAt(wx, wy, wz) {
  // 根据深度和位置决定生成哪种物体
  const depth = -wy;
  
  // 生成随机因子用于物体分布
  const seed = Math.sin(wx * 12.9898 + wy * 78.233 + wz * 37.719) * 43758.5453;
  const random = seed - Math.floor(seed);
  
  // 表面层 - 各种土壤和沉积岩
  if (depth < 5) {
    const surfaceType = Math.floor(random * 4);
    switch (surfaceType) {
      case 0: return 'dirt';
      case 1: return 'sand';
      case 2: return 'clay';
      case 3: return 'silt';
    }
  }
  
  // 浅层 - 沉积岩和常见矿物
  if (depth < 20) {
    const shallowType = Math.floor(random * 6);
    switch (shallowType) {
      case 0: return 'limestone';
      case 1: return 'shale';
      case 2: return 'sandstone';
      case 3: return 'hematite';
      case 4: return 'pyrite';
      case 5: return 'gypsum';
    }
  }
  
  // 中层 - 各种岩石和矿物
  if (depth < 50) {
    const midType = Math.floor(random * 10);
    switch (midType) {
      case 0: return 'granite';
      case 1: return 'basalt';
      case 2: return 'marble';
      case 3: return 'quartzite';
      case 4: return 'hematite';
      case 5: return 'magnetite';
      case 6: return 'chalcopyrite';
      case 7: return 'galena';
      case 8: return 'sphalerite';
      case 9: return 'cassiterite';
    }
  }
  
  // 深层 - 硬质岩石和稀有矿物
  if (depth < 100) {
    const deepType = Math.floor(random * 12);
    switch (deepType) {
      case 0: return 'granite';
      case 1: return 'basalt';
      case 2: return 'quartzite';
      case 3: return 'magnetite';
      case 4: return 'chalcopyrite';
      case 5: return 'galena';
      case 6: return 'sphalerite';
      case 7: return 'cassiterite';
      case 8: return 'bauxite';
      case 9: return 'uraninite';
      case 10: return 'diamond';
      case 11: return 'ruby';
    }
  }
  
  // 极深层 - 最硬的岩石和最稀有的矿物
  if (depth < 200) {
    const veryDeepType = Math.floor(random * 14);
    switch (veryDeepType) {
      case 0: return 'basalt';
      case 1: return 'quartzite';
      case 2: return 'magnetite';
      case 3: return 'bauxite';
      case 4: return 'uraninite';
      case 5: return 'diamond';
      case 6: return 'ruby';
      case 7: return 'sapphire';
      case 8: return 'emerald';
      case 9: return 'amethyst';
      case 10: return 'topaz';
      case 11: return 'opal';
      case 12: return 'platinum';
      case 13: return 'titanium';
    }
  }
  
  // 超深层 - 基岩
  const bedrockType = Math.floor(random * 3);
  switch (bedrockType) {
    case 0: return 'basalt';
    case 1: return 'granite';
    case 2: return 'quartzite';
  }
}

// 获取物体的原子组成（基于权重算法）
export function getObjectComposition(objectType) {
  const obj = OBJECTS[objectType];
  if (!obj) return [];
  
  return obj.components.map(comp => ({
    id: SYM2ID[comp.sym],
    symbol: comp.sym,
    ratio: Math.max(0, Math.min(1, comp.ratio + (Math.random() - 0.5) * comp.variance * 2))
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