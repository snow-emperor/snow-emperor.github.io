import { ELEMENTS, SYM2ID } from './atomData.js';
import { getObjectAt } from './molecules.js';
import { ImprovedNoise } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/math/ImprovedNoise.js';
const noise = new ImprovedNoise();

export function density(wx, wy, wz) {
  return -wy + 40 + noise.noise(wx * 0.02, 0, wz * 0.02) * 20;
}

export function atomAt(wx, wy, wz) {
  const d = density(wx, wy, wz);
  if (d < 0) return 0; // 真空
  
  // 根据位置决定生成原子还是物体
  const depth = -wy;
  
  // 在某些区域生成物体而不是单个原子
  if (depth > 10 && Math.random() < 0.3) {
    // 生成物体（这里我们用特殊ID表示物体）
    const objectType = getObjectAt(wx, wy, wz);
    // 使用高位表示物体类型
    return SYM2ID[objectType] | 0x8000;
  }
  
  // 生成单个原子
  if (depth < 50) return SYM2ID['O'];
  if (depth < 150) return SYM2ID['Si'];
  if (depth < 400) return SYM2ID['Fe'];
  return SYM2ID['Ni'];
}