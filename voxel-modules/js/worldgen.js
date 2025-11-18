import { ELEMENTS, SYM2ID } from './atomData.js';
import { ImprovedNoise } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/math/ImprovedNoise.js';
const noise = new ImprovedNoise();

export function density(wx, wy, wz) {
  return -wy + 40 + noise.noise(wx * 0.02, 0, wz * 0.02) * 20;
}
export function atomAt(wx, wy, wz) {
  const d = density(wx, wy, wz);
  if (d < 0) return 0; // 真空
  const depth = -wy;
  if (depth < 50) return SYM2ID['O'];
  if (depth < 150) return SYM2ID['Si'];
  if (depth < 400) return SYM2ID['Fe'];
  return SYM2ID['Ni'];
}