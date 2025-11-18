import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ELEMENTS } from './atomData.js';
import { OBJECTS } from './molecules.js';

const CS = 32, atlasRows = 8;
const geo = new THREE.PlaneGeometry(0.1, 0.1); // 0.1 nm
let atlasTex = null;

function getAtlasTex() {
  if (atlasTex) return atlasTex;
  const can = document.createElement('canvas');
  can.width = can.height = 256;
  const ctx = can.getContext('2d');
  for (let i = 0; i < 118; i++) {
    const x = (i % 8) * 32, y = Math.floor(i / 8) * 32;
    // 确保元素存在且有color属性
    if (ELEMENTS[i] && ELEMENTS[i].color !== undefined) {
      ctx.fillStyle = `#${ELEMENTS[i].color.toString(16).padStart(6, '0')}`;
      ctx.fillRect(x, y, 32, 32);
      ctx.strokeStyle = '#000'; ctx.strokeRect(x, y, 32, 32);
      ctx.fillStyle = '#fff'; ctx.font = '10px sans'; ctx.fillText(ELEMENTS[i].symbol, x + 4, y + 12);
    } else {
      // 默认颜色
      ctx.fillStyle = '#808080';
      ctx.fillRect(x, y, 32, 32);
    }
  }
  atlasTex = new THREE.CanvasTexture(can);
  atlasTex.magFilter = THREE.NearestFilter;
  atlasTex.minFilter = THREE.NearestFilter;
  return atlasTex;
}

// 获取颜色（支持物体）
function getColorForId(id) {
  // 检查是否是物体
  if (id & 0x8000) {
    // 物体ID
    const objectId = id & 0x7FFF;
    const objectKeys = Object.keys(OBJECTS);
    if (objectId < objectKeys.length) {
      return OBJECTS[objectKeys[objectId]].color;
    }
    return 0x888888; // 默认颜色
  }
  // 原子ID
  if (id < ELEMENTS.length && ELEMENTS[id] && ELEMENTS[id].color !== undefined) {
    return ELEMENTS[id].color;
  }
  return 0x000000;
}

export function buildChunkInstanced(chunk, cx, cy, cz, world) {
  const atlasMat = new THREE.MeshLambertMaterial({ 
    map: getAtlasTex(),
    transparent: true,
    opacity: 0.95
  });
  
  // 启用视锥剔除
  atlasMat.frustumCulled = true;
  
  const meshes = [];
  const dirs = [
    { n: [0, 0, 1], rot: new THREE.Euler(0, 0, 0) },
    { n: [0, 0, -1], rot: new THREE.Euler(0, Math.PI, 0) },
    { n: [0, 1, 0], rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
    { n: [0, -1, 0], rot: new THREE.Euler(Math.PI / 2, 0, 0) },
    { n: [1, 0, 0], rot: new THREE.Euler(0, Math.PI / 2, 0) },
    { n: [-1, 0, 0], rot: new THREE.Euler(0, -Math.PI / 2, 0) }
  ];
  
  for (let f = 0; f < 6; f++) {
    const { n, rot } = dirs[f];
    const count = countFaces(chunk, n, world, cx, cy, cz);
    if (!count) continue;
    const mesh = new THREE.InstancedMesh(geo, atlasMat, count);
    mesh.count = count;
    mesh.frustumCulled = true; // 启用视锥剔除
    fillInst(mesh, chunk, n, rot, world, cx, cy, cz, f);
    meshes.push(mesh);
  }
  return meshes;
}

function countFaces(chunk, n, world, cx, cy, cz) {
  let c = 0;
  for (let y = 0; y < CS; y++) {
    for (let z = 0; z < CS; z++) {
      for (let x = 0; x < CS; x++) {
        const id = chunk[y * CS * CS + z * CS + x];
        if (!id) continue;
        const wx = cx * CS + x + n[0], wy = cy * CS + y + n[1], wz = cz * CS + z + n[2];
        if (world.getAtom(wx, wy, wz) === 0) c++;
      }
    }
  }
  return c;
}

function fillInst(mesh, chunk, n, rot, world, cx, cy, cz, f) {
  const dummy = new THREE.Object3D();
  let i = 0;
  for (let y = 0; y < CS; y++) {
    for (let z = 0; z < CS; z++) {
      for (let x = 0; x < CS; x++) {
        const id = chunk[y * CS * CS + z * CS + x];
        if (!id) continue;
        const wx = cx * CS + x + n[0], wy = cy * CS + y + n[1], wz = cz * CS + z + n[2];
        if (world.getAtom(wx, wy, wz) !== 0) continue;
        dummy.position.set(cx * CS + x + 0.05, cy * CS + y + 0.05, cz * CS + z + 0.05);
        dummy.rotation.copy(rot);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        // uv
        const u = (id % atlasRows) / atlasRows, v = Math.floor(id / atlasRows) / atlasRows;
        mesh.setColorAt(i, new THREE.Color(1, 1, 1));
        i++;
      }
    }
  }
  
  // 标记更新
  if (mesh.instanceMatrix) mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}