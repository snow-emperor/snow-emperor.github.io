import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { ELEMENTS } from './atomData.js';
import { OBJECTS } from './molecules.js';
import { textureManager } from './textureManager.js';

const CS = 32, atlasRows = 16; // 增加图集行数以容纳更多物体
const geo = new THREE.PlaneGeometry(0.9, 0.9); // 增大平面以覆盖整个体素

function getAtlasTex() {
  // 尝试获取已有的纹理
  const existingElementTexture = textureManager.getTexture('elementAtlas');
  const existingObjectTexture = textureManager.getTexture('objectAtlas');
  
  if (existingElementTexture && existingObjectTexture) {
    return existingObjectTexture; // 优先使用物体图集
  }
  
  // 如果没有，则创建新的纹理图集
  if (!existingObjectTexture) {
    console.log('创建新的物体纹理图集');
    return textureManager.createObjectTextures(OBJECTS);
  }
  
  return existingObjectTexture;
}

export function buildChunkInstanced(chunk, cx, cy, cz, world) {
  console.log('开始构建区块网格:', {cx, cy, cz});
  const atlasTex = getAtlasTex();
  const atlasMat = new THREE.MeshLambertMaterial({ 
    map: atlasTex,
    transparent: false,
    opacity: 1.0
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
    console.log(`面 ${f} 需要实例数:`, count);
    if (!count) continue;
    const mesh = new THREE.InstancedMesh(geo, atlasMat, count);
    mesh.count = count;
    mesh.frustumCulled = true; // 启用视锥剔除
    fillInst(mesh, chunk, n, rot, world, cx, cy, cz, f);
    meshes.push(mesh);
  }
  
  console.log('区块网格构建完成，网格数量:', meshes.length);
  return meshes;
}

function countFaces(chunk, n, world, cx, cy, cz) {
  let count = 0;
  const [nx, ny, nz] = n;
  
  for (let z = 0; z < CS; z++) {
    for (let y = 0; y < CS; y++) {
      for (let x = 0; x < CS; x++) {
        const i = x + y * CS + z * CS * CS;
        // 修复：检查chunk[i]是否存在且非空
        if (!chunk[i]) continue;
        
        const wx = cx * CS + x, wy = cy * CS + y, wz = cz * CS + z;
        const neighbor = world(wx + nx, wy + ny, wz + nz);
        // 修复：当邻居不存在（空气）时，应该渲染面
        if (!neighbor) count++;
      }
    }
  }
  
  return count;
}

function fillInst(mesh, chunk, n, rot, world, cx, cy, cz, faceIndex) {
  const mtx = new THREE.Matrix4();
  const [nx, ny, nz] = n;
  let instanceIndex = 0;
  
  for (let z = 0; z < CS; z++) {
    for (let y = 0; y < CS; y++) {
      for (let x = 0; x < CS; x++) {
        const i = x + y * CS + z * CS * CS;
        // 修复：检查chunk[i]是否存在且非空
        if (!chunk[i]) continue;
        
        const wx = cx * CS + x, wy = cy * CS + y, wz = cz * CS + z;
        const neighbor = world(wx + nx, wy + ny, wz + nz);
        // 修复：当邻居不存在（空气）时，应该渲染面
        if (neighbor) continue;
        
        // 设置纹理坐标
        const objId = chunk[i];
        const u = (objId % atlasRows) / atlasRows + 0.5 / atlasRows;
        const v = Math.floor(objId / atlasRows) / atlasRows + 0.5 / atlasRows;
        
        mtx.makeRotationFromEuler(rot);
        mtx.setPosition(wx + nx * 0.5, wy + ny * 0.5, wz + nz * 0.5);
        mesh.setMatrixAt(instanceIndex++, mtx);
      }
    }
  }
}