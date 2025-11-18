import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { buildChunkInstanced } from './mesher.js';
import { scene } from './main.js';
import { atomAt } from './worldgen.js';

const CS = 32, RENDER_DIST = 3; // 增加渲染距离
const CHUNK_SIZE = 10; // 可视化区块大小（米）

function key(cx, cy, cz) { return `${cx}_${cy}_${cz}`; }

export class ChunkMgr {
  constructor() {
    this.chunks = new Map();
    this.dirtyQueue = [];
    this.useWorkers = false; // 默认不使用Workers，避免CORS问题
    this.camera = null;
    this.chunkLoadQueue = []; // 区块加载队列
    this.maxChunksPerFrame = 2; // 每帧最多加载的区块数
    this.loadedChunkCount = 0; // 已加载区块计数
    this.maxTotalChunks = 125; // 最大总区块数 (5x5x5)
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
  
  update(playerPos, camera) {
    this.camera = camera;
    
    // 只在玩家移动足够距离时才更新区块
    const distance = this.lastPlayerPos.distanceTo(playerPos);
    if (distance < 5) return;
    
    this.lastPlayerPos.copy(playerPos);
    const pcx = Math.floor(playerPos.x / CS), pcy = Math.floor(playerPos.y / CS), pcz = Math.floor(playerPos.z / CS);
    const needed = new Set();
    const neededChunks = [];
    
    // 优先加载玩家附近的区块，限制总区块数
    let chunkCount = 0;
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST && chunkCount < this.maxTotalChunks; dx++) {
      for (let dy = -RENDER_DIST; dy <= RENDER_DIST && chunkCount < this.maxTotalChunks; dy++) {
        for (let dz = -RENDER_DIST; dz <= RENDER_DIST && chunkCount < this.maxTotalChunks; dz++) {
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist <= RENDER_DIST) {
            const chunkKey = key(pcx + dx, pcy + dy, pcz + dz);
            needed.add(chunkKey);
            neededChunks.push({key: chunkKey, dist: dist, x: pcx + dx, y: pcy + dy, z: pcz + dz});
            chunkCount++;
          }
        }
      }
    }
    
    // 按距离排序，近的优先
    neededChunks.sort((a, b) => a.dist - b.dist);
    
    // 移除不需要的区块
    for (const [k, ch] of this.chunks) {
      if (!needed.has(k)) { 
        if (ch.meshes) ch.meshes.forEach(m => scene.remove(m)); 
        this.chunks.delete(k); 
        this.loadedChunkCount--;
      }
    }
    
    // 添加新需要的区块到加载队列
    for (const chunkInfo of neededChunks) {
      const {key, x, y, z} = chunkInfo;
      if (!this.chunks.has(key) && !this.chunkLoadQueue.find(item => item.key === key)) {
        this.chunkLoadQueue.push({key, x, y, z});
      }
    }
    
    // 每帧只加载有限数量的区块，并限制总区块数
    let loadedCount = 0;
    while (this.chunkLoadQueue.length > 0 && 
           loadedCount < this.maxChunksPerFrame && 
           this.loadedChunkCount < this.maxTotalChunks) {
      const chunkInfo = this.chunkLoadQueue.shift();
      const {x, y, z} = chunkInfo;
      
      if (this.useWorkers) {
        try {
          const sab = new SharedArrayBuffer(CS * CS * CS * 2);
          this.worker.postMessage({ sab, cx: x, cy: y, cz: z }, [sab]);
        } catch (e) {
          console.warn('通过Web Worker生成区块失败，使用主线程:', e);
          this.generateChunkOnMainThread(x, y, z);
        }
      } else {
        this.generateChunkOnMainThread(x, y, z);
      }
      loadedCount++;
    }
    
    if (this.dirtyQueue.length) { 
      const ch = this.dirtyQueue.shift(); 
      this.rebuildChunk(ch); 
    }
  }
  
  generateChunkOnMainThread(cx, cy, cz) {
    try {
      // 在主线程中生成区块数据
      const buffer = new Uint16Array(CS * CS * CS);
      for (let y = 0; y < CS; y++) {
        for (let z = 0; z < CS; z++) {
          for (let x = 0; x < CS; x++) {
            buffer[y * CS * CS + z * CS + x] = atomAt(cx * CS + x, cy * CS + y, cz * CS + z);
          }
        }
      }
      
      // 处理生成的区块数据
      const meshes = buildChunkInstanced(buffer, cx, cy, cz, this);
      meshes.forEach(m => scene.add(m));
      this.chunks.set(key(cx, cy, cz), { meshes, buffer, arr: buffer, x: cx, y: cy, z: cz });
      this.loadedChunkCount++;
    } catch (e) {
      console.error('主线程生成区块失败:', e);
    }
  }
  
  onWorkerMsg({ data }) {
    try {
      const { sab, cx, cy, cz } = data;
      const arr = new Uint16Array(sab);
      const meshes = buildChunkInstanced(arr, cx, cy, cz, this);
      meshes.forEach(m => scene.add(m));
      this.chunks.set(key(cx, cy, cz), { meshes, sab, arr, x: cx, y: cy, z: cz });
      this.loadedChunkCount++;
    } catch (e) {
      console.error('处理Worker消息失败:', e);
    }
  }
  
  getAtom(wx, wy, wz) {
    try {
      const cx = Math.floor(wx / CS), cy = Math.floor(wy / CS), cz = Math.floor(wz / CS);
      const ch = this.chunks.get(key(cx, cy, cz));
      if (!ch) return 0;
      const lx = wx - cx * CS, ly = wy - cy * CS, lz = wz - cz * CS;
      return ch.arr[ly * CS * CS + lz * CS + lx];
    } catch (e) {
      console.error('获取原子失败:', e);
      return 0;
    }
  }
  
  setAtom(wx, wy, wz, id) {
    try {
      const cx = Math.floor(wx / CS), cy = Math.floor(wy / CS), cz = Math.floor(wz / CS);
      const ch = this.chunks.get(key(cx, cy, cz));
      if (!ch) return;
      const lx = wx - cx * CS, ly = wy - cy * CS, lz = wz - cz * CS;
      ch.arr[ly * CS * CS + lz * CS + lx] = id;
      if (!ch.dirty) { ch.dirty = true; this.dirtyQueue.push(ch); }
    } catch (e) {
      console.error('设置原子失败:', e);
    }
  }
  
  rebuildChunk(ch) {
    try {
      if (ch.meshes) ch.meshes.forEach(m => scene.remove(m));
      const meshes = buildChunkInstanced(ch.arr, ch.x, ch.y, ch.z, this);
      meshes.forEach(m => scene.add(m));
      ch.meshes = meshes; 
      ch.dirty = false;
    } catch (e) {
      console.error('重建区块失败:', e);
    }
  }
  
  // 检查指定位置是否是物体
  isObject(wx, wy, wz) {
    const id = this.getAtom(wx, wy, wz);
    return (id & 0x8000) !== 0;
  }
  
  // 获取物体类型
  getObjectType(wx, wy, wz) {
    const id = this.getAtom(wx, wy, wz);
    if (!(id & 0x8000)) return null;
    return id & 0x7FFF;
  }
  
  // 获取世界数据用于保存
  getData() {
    return {
      // 当前版本中我们只保存基本设置，因为区块是程序生成的
      chunkSize: CS,
      renderDist: RENDER_DIST
    };
  }
  
  // 从保存的数据恢复世界状态
  setData(data) {
    // 区块是程序生成的，所以我们不需要恢复它们
    // 但我们可以根据保存的数据调整设置
    if (data.chunkSize) {
      // 可以根据需要调整区块大小
    }
    if (data.renderDist) {
      // 可以根据需要调整渲染距离
    }
  }
}