import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { SYM2ID } from '../atomData.js';
import { scene } from '../main.js';

const geo = new THREE.SphereGeometry(0.02, 8, 8);
const matN = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const matG = new THREE.MeshBasicMaterial({ color: 0xff00ff });
let instN = null, instG = null;
const neutronPool = [], gammaPool = [];

export function initNuclear() {
  instN = new THREE.InstancedMesh(geo, matN, 500);
  instG = new THREE.InstancedMesh(geo, matG, 200);
  scene.add(instN, instG);
}

const REACT = {
  fission: {
    left: [{ sym: 'U', n: 1 }, { sym: 'n', n: 1 }],
    right: [{ sym: 'Ba', n: 1 }, { sym: 'Kr', n: 1 }, { sym: 'n', n: 3 }, { energy: 200 }]
  }
};

export function tryReact(grid, x, y, z) {
  const id = grid.get(x, y, z);
  if (id !== SYM2ID['U']) return;
  if (Math.random() > 0.02) return;
  const rx = REACT.fission;
  rx.left.forEach(l => grid.add(x, y, z, SYM2ID[l.sym], -l.n));
  rx.right.forEach(r => {
    if (r.sym) grid.add(x, y, z, SYM2ID[r.sym], r.n);
    if (r.energy) spawnEnergy(x, y, z, r.energy);
  });
}

function spawnEnergy(x, y, z, MeV) {
  const n = Math.floor(MeV / 5);
  for (let i = 0; i < n; i++) {
    neutronPool.push({ pos: new THREE.Vector3(x, y, z), dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), life: 100 });
  }
}

export function updateNuclear() {
  const dummy = new THREE.Object3D();
  let ni = 0, gi = 0;
  
  // 使用 for 循环反向遍历，避免 splice 导致的索引错位问题
  for (let i = neutronPool.length - 1; i >= 0; i--) {
    const p = neutronPool[i];
    p.pos.addScaledVector(p.dir, 0.3);
    p.life--;
    
    if (p.life <= 0) {
      neutronPool.splice(i, 1);
    } else {
      dummy.position.copy(p.pos).multiplyScalar(0.1);
      dummy.updateMatrix();
      instN.setMatrixAt(ni++, dummy.matrix);
    }
  }
  
  instN.instanceMatrix.needsUpdate = true;
  instN.count = ni;
}