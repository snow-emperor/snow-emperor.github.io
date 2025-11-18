import { SYM2ID } from '../atomData.js';

const RULES = [
  { in: [{ sym: 'H', n: 2 }, { sym: 'O', n: 1 }], out: [{ sym: 'H2O', n: 1 }], Ea: 1 },
  { in: [{ sym: 'C', n: 1 }, { sym: 'O', n: 2 }], out: [{ sym: 'CO2', n: 1 }], Ea: 0.5 }
];

export function tryChem(grid, x, y, z) {
  const around = countAround(grid, x, y, z);
  for (const rx of RULES) {
    const ok = rx.in.every(i => around[SYM2ID[i.sym]] >= i.n);
    if (!ok) continue;
    if (Math.random() > 0.01 * (1 / rx.Ea)) continue;
    rx.in.forEach(i => grid.add(x, y, z, SYM2ID[i.sym], -i.n));
    rx.out.forEach(o => grid.add(x, y, z, SYM2ID[o.sym], o.n));
    return;
  }
}

function countAround(grid, x, y, z, r = 3) {
  const cnt = {};
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        const id = grid.get(x + dx, y + dy, z + dz);
        cnt[id] = (cnt[id] || 0) + 1;
      }
    }
  }
  return cnt;
}