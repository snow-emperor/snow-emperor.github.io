import * as THREE from 'three';
import { buildChunkInstanced } from './mesher.js';
import { scene } from './main.js';

const CS = 1024, RENDER_DIST = 4;

function key(cx, cy, cz) { return `${cx}_${cy}_${cz}`; }

export class ChunkMgr {
  constructor() {
    this.chunks = new Map();
    this.worker = new Worker('./js/workers/chunkWorker.js', { type: 'module' });
    this.worker.onmessage = (e) => this.onWorkerMsg(e);
    this.dirtyQueue = [];
  }
  update(playerPos) {
    const pcx = Math.floor(playerPos.x / CS), pcy = Math.floor(playerPos.y / CS), pcz = Math.floor(playerPos.z / CS);
    const needed = new Set();
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
      for (let dy = -RENDER_DIST; dy <= RENDER_DIST; dy++) {
        for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) needed.add(key(pcx + dx, pcy + dy, pcz + dz));
      }
    }
    for (const [k, ch] of this.chunks) {
      if (!needed.has(k)) { ch.meshes.forEach(m => scene.remove(m)); this.chunks.delete(k); }
    }
    for (const k of needed) {
      if (!this.chunks.has(k)) {
        const [cx, cy, cz] = k.split('_').map(Number);
        const sab = new SharedArrayBuffer(CS * CS * CS * 2);
        this.worker.postMessage({ sab, cx, cy, cz }, [sab]);
      }
    }
    if (this.dirtyQueue.length) { const ch = this.dirtyQueue.shift(); this.rebuildChunk(ch); }
  }
  onWorkerMsg({ data }) {
    const { sab, cx, cy, cz } = data;
    const arr = new Uint16Array(sab);
    const meshes = buildChunkInstanced(arr, cx, cy, cz, this);
    meshes.forEach(m => scene.add(m));
    this.chunks.set(key(cx, cy, cz), { meshes, sab, arr, x: cx, y: cy, z: cz });
  }
  getAtom(wx, wy, wz) {
    const cx = Math.floor(wx / CS), cy = Math.floor(wy / CS), cz = Math.floor(wz / CS);
    const ch = this.chunks.get(key(cx, cy, cz));
    if (!ch) return 0;
    const lx = wx - cx * CS, ly = wy - cy * CS, lz = wz - cz * CS;
    return ch.arr[ly * CS * CS + lz * CS + lx];
  }
  setAtom(wx, wy, wz, id) {
    const cx = Math.floor(wx / CS), cy = Math.floor(wy / CS), cz = Math.floor(wz / CS);
    const ch = this.chunks.get(key(cx, cy, cz));
    if (!ch) return;
    const lx = wx - cx * CS, ly = wy - cy * CS, lz = wz - cz * CS;
    ch.arr[ly * CS * CS + lz * CS + lx] = id;
    if (!ch.dirty) { ch.dirty = true; this.dirtyQueue.push(ch); }
  }
  rebuildChunk(ch) {
    ch.meshes.forEach(m => scene.remove(m));
    const meshes = buildChunkInstanced(ch.arr, ch.x, ch.y, ch.z, this);
    meshes.forEach(m => scene.add(m));
    ch.meshes = meshes; ch.dirty = false;
  }
}