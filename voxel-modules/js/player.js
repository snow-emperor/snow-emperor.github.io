import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { GameMode, Difficulty, mineTime, damage, canPlace, canBreak } from './gameMode.js';
import { camera, scene } from './main.js';
import { getObjectComposition, getObjectHardness } from './molecules.js';

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
    this.inventory = {}; // 玩家物品栏
    this.breakProgress = 0; // 破坏进度
    this.breakingBlock = null; // 正在破坏的方块
    this.registerEvents();
  }
  
  get position() { return this.eye.position; }
  
  registerEvents() {
    addEventListener('keydown', e => this.onKey(e.code, 1));
    addEventListener('keyup', e => this.onKey(e.code, 0));
    document.body.addEventListener('click', () => {
      // 更安全的指针锁定请求
      if (document.body.requestPointerLock) {
        document.body.requestPointerLock().catch(err => {
          console.warn('指针锁定请求失败:', err);
        });
      }
    });
    addEventListener('mousemove', e => {
      if (document.pointerLockElement !== document.body) return;
      this.eye.rotation.y -= e.movementX * 0.002;
      this.eye.rotation.x -= e.movementY * 0.002;
      this.eye.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.eye.rotation.x));
    });
    addEventListener('mousedown', e => { 
      if (e.button === 0) this.startBreak(); 
      if (e.button === 2) this.place(); 
    });
    addEventListener('mouseup', e => {
      if (e.button === 0) this.stopBreak();
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
      case 'KeyP': if (v) this.showInventory(); break; // 显示物品栏
    }
  }
  
  selectSlot(slot) {
    this.selectedSlot = slot;
    const slotElement = document.getElementById('slot' + slot);
    if (slotElement) {
      // 移除其他槽位的高亮
      document.querySelectorAll('.atom-slot').forEach(el => el.style.borderColor = '#666');
      // 高亮选中的槽位
      slotElement.style.borderColor = '#2196F3';
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
  
  showInventory() {
    // 显示物品栏
    let inventoryText = "物品栏:\n";
    for (const [key, value] of Object.entries(this.inventory)) {
      inventoryText += `${key}: ${value}\n`;
    }
    alert(inventoryText);
  }
  
  startBreak() {
    const hit = this.raycast(5);
    if (!hit) return;
    
    // 检查是否可以破坏
    if (this.mode === GameMode.ADVENTURE) {
      const atomId = this.chunkMgr.getAtom(hit.x, hit.y, hit.z);
      if (!canBreak(this.mode, atomId)) {
        console.log('冒险模式下无法破坏该物体');
        return;
      }
    }
    
    this.breakingBlock = hit;
    this.breakProgress = 0;
  }
  
  stopBreak() {
    if (this.breakingBlock) {
      // 如果破坏进度达到100%，则破坏方块
      if (this.breakProgress >= 100) {
        this.completeBreak();
      }
      this.breakingBlock = null;
      this.breakProgress = 0;
    }
  }
  
  updateBreak() {
    if (this.breakingBlock) {
      const now = Date.now();
      if (now - this.lastBreakTime >= 50) { // 每50ms更新一次
        const mineTime = this.calculateMineTime();
        this.breakProgress = Math.min(100, this.breakProgress + (50 / mineTime) * 100);
        this.lastBreakTime = now;
      }
      
      // 如果破坏完成
      if (this.breakProgress >= 100) {
        this.completeBreak();
        this.breakingBlock = null;
      }
    }
  }
  
  completeBreak() {
    if (!this.breakingBlock) return;
    
    const hit = this.breakingBlock;
    
    // 获取被破坏的物体类型
    const atomId = this.chunkMgr.getAtom(hit.x, hit.y, hit.z);
    if (atomId & 0x8000) {
      // 是物体
      const objectType = Object.keys(OBJECTS)[atomId & 0x7FFF];
      if (objectType) {
        // 根据物体组成添加到物品栏
        const composition = getObjectComposition(objectType);
        composition.forEach(comp => {
          if (!this.inventory[comp.symbol]) {
            this.inventory[comp.symbol] = 0;
          }
          // 根据元素稀有度调整获得数量 - 稀有元素获得更少
          const rarityFactor = 1 - ELEMENTS[comp.id].rarity; // 稀有度越高，rarity值越低
          const amount = Math.max(1, Math.floor(comp.ratio * 10 * rarityFactor));
          this.inventory[comp.symbol] += amount;
        });
      }
    }
    
    // 破坏物体
    this.chunkMgr.setAtom(hit.x, hit.y, hit.z, 0);
    
    // 消耗能量
    if (this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) {
      this.energy = Math.max(0, this.energy - 0.5);
    }
  }
  
  calculateMineTime() {
    if (!this.breakingBlock) return 200;
    
    const hit = this.breakingBlock;
    
    // 检查是否是物体并计算挖掘时间
    if (this.chunkMgr.isObject(hit.x, hit.y, hit.z)) {
      const objectType = this.chunkMgr.getObjectType(hit.x, hit.y, hit.z);
      // 物体的挖掘时间基于其硬度
      const hardness = getObjectHardness(Object.keys(OBJECTS)[objectType]);
      let time = hardness * 200; // 基础时间(ms)
      
      // 根据难度调整
      switch (this.difficulty) {
        case Difficulty.EASY: time *= 0.8; break;
        case Difficulty.HARD: time *= 1.2; break;
        case Difficulty.PEACEFUL: time *= 0.5; break;
      }
      
      // 根据游戏模式调整
      if (this.mode === GameMode.CREATIVE) time = 0;
      
      return time;
    }
    
    return 200; // 默认时间
  }
  
  place() {
    const now = Date.now();
    if (now - this.lastPlaceTime < 100) return; // 放置间隔限制
    
    const hit = this.raycast(5);
    if (!hit) return;
    
    if (this.mode === GameMode.ADVENTURE && !canPlace(this.mode, this.selectedID)) {
      console.log('冒险模式下无法放置该物体');
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
    if (this.mode === GameMode.CREATIVE) {
      this.handleCreativeMode();
      return;
    }
    
    // 生存模式物理
    const speed = 0.1;
    
    // 获取相机方向向量
    const direction = new THREE.Vector3();
    this.eye.getWorldDirection(direction);
    
    // 计算右侧向量（垂直于方向向量和Y轴）
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    // 计算前向向量（在XZ平面上，忽略Y分量）
    const forward = new THREE.Vector3();
    forward.copy(direction);
    forward.y = 0; // 忽略上下观察角度的影响
    forward.normalize();
    
    // 根据相机方向移动
    if (this.keys['w'] || this.keys['W']) {
      this.position.x += forward.x * speed;
      this.position.z += forward.z * speed;
    }
    if (this.keys['s'] || this.keys['S']) {
      this.position.x -= forward.x * speed;
      this.position.z -= forward.z * speed;
    }
    if (this.keys['a'] || this.keys['A']) {
      this.position.x -= right.x * speed;
      this.position.z -= right.z * speed;
    }
    if (this.keys['d'] || this.keys['D']) {
      this.position.x += right.x * speed;
      this.position.z += right.z * speed;
    }
    if (this.keys.shift) this.position.y -= speed;
    if (this.keys.space && (this.onGround || this.mode === GameMode.CREATIVE)) { 
      this.vel.y = 0.2; 
      this.onGround = false; 
    }
    
    this.vel.y -= 0.015;
    this.position.y += this.vel.y;
    
    // 改进碰撞检测 - 检查玩家碰撞箱的多个点
    this.checkGroundCollision();
    this.checkWallCollision();
    
    // 更新破坏进度
    this.updateBreak();
    
    // 回复能量
    if (this.mode === GameMode.SURVIVAL || this.mode === GameMode.ADVENTURE) {
      this.energy = Math.min(100, this.energy + 0.05);
      
      // 饥饿值下降
      this.hunger = Math.max(0, this.hunger - 0.01);
      if (this.hunger <= 0) {
        this.health = Math.max(0, this.health - 0.05);
      }
    }
  }
  
  // 检查地面碰撞
  checkGroundCollision() {
    const playerHeight = 1.6;
    const playerRadius = 0.3;
    
    // 检查脚部位置
    const footX = Math.floor(this.position.x);
    const footY = Math.floor(this.position.y - playerHeight);
    const footZ = Math.floor(this.position.z);
    
    // 检查脚下是否为实体方块
    if (this.chunkMgr.getAtom(footX, footY, footZ) !== 0) {
      this.position.y = footY + playerHeight + 0.01;
      this.vel.y = 0;
      this.onGround = true;
      return;
    }
    
    // 检查脚下周围是否为实体方块（更精确的碰撞）
    for (let x = -playerRadius; x <= playerRadius; x++) {
      for (let z = -playerRadius; z <= playerRadius; z++) {
        const checkX = Math.floor(this.position.x + x);
        const checkY = Math.floor(this.position.y - playerHeight);
        const checkZ = Math.floor(this.position.z + z);
        
        if (this.chunkMgr.getAtom(checkX, checkY, checkZ) !== 0) {
          this.position.y = checkY + playerHeight + 0.01;
          this.vel.y = 0;
          this.onGround = true;
          return;
        }
      }
    }
    
    this.onGround = false;
  }
  
  // 检查墙体碰撞
  checkWallCollision() {
    const playerHeight = 1.6;
    const playerRadius = 0.3;
    
    // 检查前方是否为实体方块
    for (let y = 0; y <= playerHeight; y += 0.5) {
      const checkX = Math.floor(this.position.x);
      const checkY = Math.floor(this.position.y - playerHeight + y);
      const checkZ = Math.floor(this.position.z);
      
      if (this.chunkMgr.getAtom(checkX, checkY, checkZ) !== 0) {
        // 简单的墙体碰撞处理 - 阻止移动
        // 这里可以进一步优化碰撞反应
        return;
      }
    }
  }
  
  // 创造模式控制
  handleCreativeMode() {
    const speed = 0.2;
    
    // 获取相机方向向量
    const direction = new THREE.Vector3();
    this.eye.getWorldDirection(direction);
    
    // 计算右侧向量（垂直于方向向量和Y轴）
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    // 计算前向向量（在XZ平面上，忽略Y分量）
    const forward = new THREE.Vector3();
    forward.copy(direction);
    forward.y = 0; // 忽略上下观察角度的影响
    forward.normalize();
    
    // 根据相机方向移动
    if (this.keys['w'] || this.keys['W']) {
      this.position.x += forward.x * speed;
      this.position.z += forward.z * speed;
    }
    if (this.keys['s'] || this.keys['S']) {
      this.position.x -= forward.x * speed;
      this.position.z -= forward.z * speed;
    }
    if (this.keys['a'] || this.keys['A']) {
      this.position.x -= right.x * speed;
      this.position.z -= right.z * speed;
    }
    if (this.keys['d'] || this.keys['D']) {
      this.position.x += right.x * speed;
      this.position.z += right.z * speed;
    }
    if (this.keys.shift) this.position.y -= speed;
    if (this.keys.space) this.position.y += speed;
  }

  // 获取玩家数据用于保存
  getData() {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      hp: this.hp,
      food: this.food,
      rad: this.rad,
      energy: this.energy,
      mode: this.mode,
      difficulty: this.difficulty,
      inventory: this.inventory
    };
  }
  
  // 从保存的数据恢复玩家状态
  setData(data) {
    if (data.position) {
      this.position.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.hp !== undefined) this.hp = data.hp;
    if (data.food !== undefined) this.food = data.food;
    if (data.rad !== undefined) this.rad = data.rad;
    if (data.energy !== undefined) this.energy = data.energy;
    if (data.mode) this.mode = data.mode;
    if (data.difficulty) this.difficulty = data.difficulty;
    if (data.inventory) this.inventory = data.inventory;
  }
}