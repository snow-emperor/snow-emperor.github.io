import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { buildChunkInstanced } from './mesher.js';
import { scene } from './main.js';
import { atomAt } from './worldgen.js';

const CS = 32, RENDER_DIST = 4; // 增加渲染距离
const CHUNK_SIZE = 10; // 可视化区块大小（米）

function key(cx, cy, cz) { return `${cx}_${cy}_${cz}`; }

export class ChunkMgr {
  constructor() {
    this.chunks = new Map();
    this.dirtyQueue = [];
    this.useWorkers = false; // 默认不使用Workers，避免CORS问题
    this.camera = null;
    this.chunkLoadQueue = []; // 区块加载队列
    this.maxChunksPerFrame = 3; // 每帧最多加载的区块数
    this.loadedChunkCount = 0; // 已加载区块计数
    this.maxTotalChunks = 216; // 最大总区块数 (6x6x6)
    this.lastPlayerPos = new THREE.Vector3();
    
    // 尝试初始化Web Workers
    try {
      if (typeof SharedArrayBuffer !== 'undefined') {
        this.worker = new Worker('./js/workers/chunkWorker.js', { type: 'module' });
        this.worker.onmessage = (e) => this.onWorkerMsg(e);
        this.useWorkers = true;
      }
    } catch (e) {
      console.warn('Web Workers初始化失败，将使用主线程生成区块:', e);
      this.useWorkers = false;
    }
  }
  
  // 添加getAtom方法，用于获取指定坐标的原子/方块
  getAtom(wx, wy, wz) {
    const cx = Math.floor(wx / CS), cy = Math.floor(wy / CS), cz = Math.floor(wz / CS);
    const k = key(cx, cy, cz);
    const chunk = this.chunks.get(k);
    
    if (!chunk) return 0;
    
    // 计算在区块内的相对坐标
    const x = ((wx % CS) + CS) % CS;
    const y = ((wy % CS) + CS) % CS;
    const z = ((wz % CS) + CS) % CS;
    
    // 返回该位置的原子/方块ID
    return chunk.data[x + y * CS + z * CS * CS];
  }
  
  update(playerPos, camera) {
    this.camera = camera;
    
    // 只在玩家移动足够距离时才更新区块
    const distance = this.lastPlayerPos.distanceTo(playerPos);
    if (distance < 3) return;
    
    this.lastPlayerPos.copy(playerPos);
    const pcx = Math.floor(playerPos.x / CS), pcy = Math.floor(playerPos.y / CS), pcz = Math.floor(playerPos.z / CS);
    const needed = new Set();
    const neededChunks = [];
    
    // 优先加载玩家附近的区块，限制总区块数
    let chunkCount = 0;
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST && chunkCount < this.maxTotalChunks; dx++) {
      for (let dy = -RENDER_DIST; dy <= RENDER_DIST && chunkCount < this.maxTotalChunks; dy++) {
        for (let dz = -RENDER_DIST; dz <= RENDER_DIST && chunkCount < this.maxTotalChunks; dz++) {
          const cx = pcx + dx, cy = pcy + dy, cz = pcz + dz;
          const k = key(cx, cy, cz);
          needed.add(k);
          
          if (!this.chunks.has(k)) {
            neededChunks.push([cx, cy, cz]);
          }
          chunkCount++;
        }
      }
    }
    
    // 卸载不需要的区块
    for (const [k, chunk] of this.chunks) {
      if (!needed.has(k)) {
        this.unloadChunk(chunk);
        this.chunks.delete(k);
      }
    }
    
    // 按距离排序需要加载的区块
    neededChunks.sort(([ax, ay, az], [bx, by, bz]) => {
      const ad = (ax - pcx) ** 2 + (ay - pcy) ** 2 + (az - pcz) ** 2;
      const bd = (bx - pcx) ** 2 + (by - pcy) ** 2 + (bz - pcz) ** 2;
      return ad - bd;
    });
    
    // 将需要加载的区块添加到队列
    this.chunkLoadQueue.push(...neededChunks);
    
    // 每帧加载有限数量的区块
    const chunksToLoad = Math.min(this.chunkLoadQueue.length, this.maxChunksPerFrame);
    for (let i = 0; i < chunksToLoad; i++) {
      const [cx, cy, cz] = this.chunkLoadQueue.shift();
      this.loadChunk(cx, cy, cz);
    }
    
    // 更新所有区块
    for (const chunk of this.chunks.values()) {
      if (chunk.dirty) {
        this.dirtyQueue.push(chunk);
        chunk.dirty = false;
      }
    }
    
    // 处理脏区块队列
    const toProcess = Math.min(this.dirtyQueue.length, 2);
    for (let i = 0; i < toProcess; i++) {
      const chunk = this.dirtyQueue.shift();
      this.updateChunk(chunk);
    }
  }
  
  loadChunk(cx, cy, cz) {
    const k = key(cx, cy, cz);
    if (this.chunks.has(k)) return;
    
    console.log(`正在加载区块: ${k}`);
    const chunk = { 
      cx, cy, cz, 
      data: new Uint8Array(CS * CS * CS),
      meshes: [],
      dirty: true
    };
    
    // 生成区块数据
    let i = 0;
    for (let z = 0; z < CS; z++) {
      for (let y = 0; y < CS; y++) {
        for (let x = 0; x < CS; x++, i++) {
          const wx = cx * CS + x, wy = cy * CS + y, wz = cz * CS + z;
          chunk.data[i] = atomAt(wx, wy, wz);
        }
      }
    }
    
    this.chunks.set(k, chunk);
    console.log(`区块加载完成: ${k}`);
  }
  
  unloadChunk(chunk) {
    console.log(`正在卸载区块: ${key(chunk.cx, chunk.cy, chunk.cz)}`);
    for (const mesh of chunk.meshes) {
      scene.remove(mesh);
      if (mesh.dispose) mesh.dispose();
    }
    chunk.meshes.length = 0;
  }
  
  updateChunk(chunk) {
    console.log(`正在更新区块网格: ${key(chunk.cx, chunk.cy, chunk.cz)}`);
    // 移除旧网格
    for (const mesh of chunk.meshes) {
      scene.remove(mesh);
      if (mesh.dispose) mesh.dispose();
    }
    chunk.meshes.length = 0;
    
    // 构建新网格
    const newMeshes = buildChunkInstanced(chunk.data, chunk.cx, chunk.cy, chunk.cz, (x, y, z) => {
      // 修复：确保正确处理边界情况
      const cx = Math.floor(x / CS), cy = Math.floor(y / CS), cz = Math.floor(z / CS);
      const k = key(cx, cy, cz);
      const c = this.chunks.get(k);
      
      // 修复：正确返回邻居的值
      if (c) {
        // 计算在区块内的相对坐标
        const localX = ((x % CS) + CS) % CS;
        const localY = ((y % CS) + CS) % CS;
        const localZ = ((z % CS) + CS) % CS;
        return c.data[localX + localY * CS + localZ * CS * CS];
      }
      // 如果邻居区块不存在，则根据世界生成函数生成值
      return atomAt(x, y, z);
    });
    
    // 添加新网格到场景
    for (const mesh of newMeshes) {
      mesh.position.set(chunk.cx * CS, chunk.cy * CS, chunk.cz * CS);
      scene.add(mesh);
      chunk.meshes.push(mesh);
    }
    
    console.log(`区块网格更新完成: ${key(chunk.cx, chunk.cy, chunk.cz)}, 新增网格数: ${newMeshes.length}`);
  }

  onWorkerMsg(e) {
    const { type, data } = e.data;
    switch (type) {
      case 'chunk':
        const k = key(data.cx, data.cy, data.cz);
        const chunk = this.chunks.get(k);
        if (chunk) {
          chunk.data.set(data.voxels);
          chunk.dirty = true;
        }
        break;
    }
  }
}