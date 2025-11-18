import { ELEMENTS } from './atomData.js';

export const GameMode = { CREATIVE: 'creative', SURVIVAL: 'survival' };
export function canFly(mode) { return mode === GameMode.CREATIVE; }
export function mineTime(mode, id) {
  return mode === GameMode.CREATIVE ? 0 : ELEMENTS[id].density * 200; // ms
}
export function damage(mode, player, dmg) {
  if (mode === GameMode.CREATIVE) return;
  player.hp -= dmg;
  if (player.hp <= 0) alert('你死了！按 F5 重来');
}