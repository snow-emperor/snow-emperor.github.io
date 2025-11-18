import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { buildChunkInstanced } from './mesher.js';
import { scene } from './main.js';
import { atomAt } from './worldgen.js';

const CS = 1024, RENDER_DIST = 4;
const CHUNK_SIZE = 10; // 可视化区块大小（米）

function key(cx, cy, cz) { return `${cx}_${cy}_${cz}`; }

export class ChunkMgr {
  constructor() {
    this.chunks = new Map();
    this.dirtyQueue = [];
    this.useWorkers = false; // 默认不使用Workers，避免CORS问题
    this.camera = null;
    
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
    const pcx = Math.floor(playerPos.x / CS), pcy = Math.floor(playerPos.y / CS), pcz = Math.floor(playerPos.z / CS);
    const needed = new Set();
    
    // 优先加载玩家附近的区块
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
      for (let dy = -RENDER_DIST; dy <= RENDER_DIST; dy++) {
        for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist <= RENDER_DIST) {
            needed.add(key(pcx + dx, pcy + dy, pcz + dz));
          }
        }
      }
    }
    
    // 移除不需要的区块
    for (const [k, ch] of this.chunks) {
      if (!needed.has(k)) { 
        if (ch.meshes) ch.meshes.forEach(m => scene.remove(m)); 
        this.chunks.delete(k); 
      }
    }
    
    // 添加新需要的区块
    for (const k of needed) {
      if (!this.chunks.has(k)) {
        const [cx, cy, cz] = k.split('_').map(Number);
        if (this.useWorkers) {
          try {
            const sab = new SharedArrayBuffer(CS * CS * CS * 2);
            this.worker.postMessage({ sab, cx, cy, cz }, [sab]);
          } catch (e) {
            console.warn('通过Web Worker生成区块失败，使用主线程:', e);
            this.generateChunkOnMainThread(cx, cy, cz);
          }
        } else {
          this.generateChunkOnMainThread(cx, cy, cz);
        }
      }
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
}