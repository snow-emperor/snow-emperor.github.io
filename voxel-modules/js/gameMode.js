import { ELEMENTS } from './atomData.js';
import { OBJECTS } from './molecules.js';

export const GameMode = { 
  CREATIVE: 'creative', 
  SURVIVAL: 'survival',
  ADVENTURE: 'adventure' 
};

export const Difficulty = {
  PEACEFUL: 'peaceful',
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

export function canFly(mode) { 
  return mode === GameMode.CREATIVE; 
}

export function mineTime(mode, id, difficulty = Difficulty.NORMAL) {
  if (mode === GameMode.CREATIVE) return 0;
  
  // 检查是否是物体（高位标记）
  if (id & 0x8000) {
    // 物体挖掘时间计算
    const objectId = id & 0x7FFF;
    const objectKeys = Object.keys(OBJECTS);
    if (objectId < objectKeys.length) {
      const object = OBJECTS[objectKeys[objectId]];
      let time = (object.hardness || 1) * 300; // 物体基础时间
      
      // 根据难度调整
      switch (difficulty) {
        case Difficulty.EASY: time *= 0.8; break;
        case Difficulty.HARD: time *= 1.2; break;
        case Difficulty.PEACEFUL: time *= 0.5; break;
      }
      
      return time;
    }
  }
  
  // 原子挖掘时间计算
  if (id >= ELEMENTS.length) return 200;
  
  let time = ELEMENTS[id].density * 200; // 基础时间(ms)
  
  // 根据难度调整
  switch (difficulty) {
    case Difficulty.EASY: time *= 0.8; break;
    case Difficulty.HARD: time *= 1.2; break;
    case Difficulty.PEACEFUL: time *= 0.5; break;
  }
  
  return time;
}

export function damage(mode, player, dmg, difficulty = Difficulty.NORMAL) {
  if (mode === GameMode.CREATIVE) return;
  
  // 根据难度调整伤害
  switch (difficulty) {
    case Difficulty.EASY: dmg *= 0.8; break;
    case Difficulty.HARD: dmg *= 1.2; break;
    case Difficulty.PEACEFUL: dmg = 0; break;
  }
  
  player.hp -= dmg;
  if (player.hp <= 0) alert('你死了！按 F5 重来');
}

export function canPlace(mode, id) {
  if (mode !== GameMode.ADVENTURE) return true;
  // 冒险模式只能放置特定元素
  const allowed = ['H', 'O', 'C', 'N', 'Fe', 'Cu', 'Au'];
  return allowed.includes(ELEMENTS[id].symbol);
}

export function canBreak(mode, id) {
  if (mode !== GameMode.ADVENTURE) return true;
  // 冒险模式只能破坏特定元素
  const allowed = ['H', 'O', 'C', 'N', 'Fe', 'Cu', 'Au', 'U'];
  return allowed.includes(ELEMENTS[id].symbol);
}

