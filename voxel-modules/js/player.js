import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { GameMode, Difficulty, mineTime, damage, canPlace, canBreak } from './gameMode.js';
import { camera, scene } from './main.js';

export class Player {
  constructor(chunkMgr) {
    this.chunkMgr = chunkMgr;
    this.eye = camera;
    this.vel = new THREE.Vector3();
    this.keys = { w: 0, a: 0, s: 0, d: 0, shift: 0, space: 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    this.mode = GameMode.SURVIVAL;
    this.difficulty = Difficulty.NORMAL;
    this.hp = 20; 
    this.food = 20; 
    this.rad = 0;
    this.energy = 100; // 新增能量系统
    this.selectedID = 1;
    this.selectedSlot = 0;
    this.lastBreakTime = 0;
    this.lastPlaceTime = 0;
    this.onGround = false;
    this.registerEvents();
  }
  
  get position() { return this.eye.position; }
  
  registerEvents() {
    addEventListener('keydown', e => this.onKey(e.code, 1));
    addEventListener('keyup', e => this.onKey(e.code, 0));
    document.body.addEventListener('click', () => document.body.requestPointerLock());
    addEventListener('mousemove', e => {
      if (document.pointerLockElement !== document.body) return;
      this.eye.rotation.y -= e.movementX * 0.002;
      this.eye.rotation.x -= e.movementY * 0.002;
      this.eye.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.eye.rotation.x));
    });
    addEventListener('mousedown', e => { 
      if (e.button === 0) this.break(); 
      if (e.button === 2) this.place(); 
    });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('wheel', e => this.changeSlot(e.deltaY));
  }
  
  onKey(code, v) {
    switch (code) {
      case 'KeyW': this.keys.w = v; break;
      case 'KeyS': this.keys.s = v; break;
      case 'KeyA': this.keys.a = v; break;
      case 'KeyD': this.keys.d = v; break;
      case 'ShiftLeft': this.keys.shift = v; break;
      case 'Space': this.keys.space = v; break;
      case 'Digit1': if (v) this.selectSlot(0); break;
      case 'Digit2': if (v) this.selectSlot(1); break;
      case 'Digit3': if (v) this.selectSlot(2); break;
      case 'Digit4': if (v) this.selectSlot(3); break;
      case 'Digit5': if (v) this.selectSlot(4); break;
      case 'KeyF': if (v) this.toggleFlight(); break;
      case 'KeyE': if (v) this.useItem(); break;
    }
  }
  
  selectSlot(slot) {
    this.selectedSlot = slot;
    // 根据槽位索引获取对应的物品ID（假设物品栏元素有data-id属性）
    const slotElement = document.getElementById('slot' + slot);
    if (slotElement) {
      // 移除其他槽位的高亮
      document.querySelectorAll('.atom-slot').forEach(el => el.style.borderColor = '#666');
      // 高亮选中的槽位
      slotElement.style.borderColor = '#2196F3';
      // 更新选中的原子ID
      this.selectedID = parseInt(slotElement.dataset.id) || (slot + 1);
    }
  }
  
  changeSlot(delta) {
    if (delta > 0) {
      this.selectedSlot = (this.selectedSlot + 1) % 9;
    } else {
      this.selectedSlot = (this.selectedSlot + 8) % 9;
    }
    this.selectSlot(this.selectedSlot);
  }
  
  toggleFlight() {
    if (this.mode === GameMode.CREATIVE) {
      // 创造模式切换飞行
      console.log('切换飞行模式');
    }
  }
  
  useItem() {
    // 使用物品功能
    console.log('使用物品');
  }
  
  break() {
    const now = Date.now();
    if (now - this.lastBreakTime < mineTime(this.mode, this.selectedID, this.difficulty)) return;
    
    const hit = this.raycast(5);
    if (!hit) return;
    
    if (this.mode === GameMode.ADVENTURE && !canBreak(this.mode, this.chunkMgr.getAtom(hit.x, hit.y, hit.z))) {
      console.log('冒险模式下无法破坏该原子');
      return;
    }
    
    this.chunkMgr.setAtom(hit.x, hit.y, hit.z, 0);
    this.lastBreakTime = now;
    
    // 消耗能量
    if (this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) {
      this.energy = Math.max(0, this.energy - 0.5);
    }
  }
  
  place() {
    const now = Date.now();
    if (now - this.lastPlaceTime < 100) return; // 放置间隔限制
    
    const hit = this.raycast(5);
    if (!hit) return;
    
    if (this.mode === GameMode.ADVENTURE && !canPlace(this.mode, this.selectedID)) {
      console.log('冒险模式下无法放置该原子');
      return;
    }
    
    // 检查是否有足够能量
    if ((this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) && this.energy < 1) {
      console.log('能量不足');
      return;
    }
    
    this.chunkMgr.setAtom(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz, this.selectedID);
    this.lastPlaceTime = now;
    
    // 消耗能量
    if (this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) {
      this.energy = Math.max(0, this.energy - 1);
    }
  }
  
  raycast(maxDist) {
    const dir = new THREE.Vector3();
    this.eye.getWorldDirection(dir);
    const step = 0.05;
    for (let t = 0; t < maxDist; t += step) {
      const p = this.position.clone().addScaledVector(dir, t);
      const x = Math.floor(p.x), y = Math.floor(p.y), z = Math.floor(p.z);
      if (this.chunkMgr.getAtom(x, y, z) !== 0) return { x, y, z, nx: Math.sign(dir.x), ny: Math.sign(dir.y), nz: Math.sign(dir.z) };
    }
    return null;
  }
  
  update() {
    const speed = this.mode === GameMode.CREATIVE ? 0.3 : 0.15;
    const move = new THREE.Vector3(this.keys.d - this.keys.a, 0, this.keys.s - this.keys.w).normalize().multiplyScalar(speed);
    move.applyQuaternion(this.eye.quaternion);
    this.position.add(move);
    
    if (this.keys.shift) this.position.y -= speed;
    if (this.keys.space && (this.onGround || this.mode === GameMode.CREATIVE)) { 
      this.vel.y = 0.2; 
      this.onGround = false; 
    }
    
    this.vel.y -= 0.015;
    this.position.y += this.vel.y;
    
    const wx = Math.floor(this.position.x), wy = Math.floor(this.position.y - 1.6), wz = Math.floor(this.position.z);
    if (this.chunkMgr.getAtom(wx, wy, wz) !== 0) {
      this.position.y = wy + 1.6 + 0.01; this.vel.y = 0; this.onGround = true;
    } else this.onGround = false;
    
    // 回复能量
    if (this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) {
      this.energy = Math.min(100, this.energy + 0.05);
      
      // 辐射衰减
      this.rad *= 0.999;
      
      // 更新HUD
      document.getElementById('hp').textContent = `❤ ${Math.floor(this.hp)}`;
      document.getElementById('food').textContent = `🍖 ${Math.floor(this.food)}`;
      document.getElementById('rad').textContent = `☢ ${Math.floor(this.rad)}`;
      document.getElementById('energy').textContent = `⚡ ${Math.floor(this.energy)}`;
    }
    
    const p = this.position;
    document.getElementById('coords').textContent = `${Math.floor(p.x)} ${Math.floor(p.y)} ${Math.floor(p.z)}`;
    
    let modeText = '';
    switch (this.mode) {
      case GameMode.CREATIVE: modeText = '创造'; break;
      case GameMode.SURVIVAL: modeText = '生存'; break;
      case GameMode.ADVENTURE: modeText = '冒险'; break;
    }
    
    document.getElementById('mode').textContent = modeText;
  }
}