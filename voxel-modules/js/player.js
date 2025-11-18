import * as THREE from 'three';
import { GameMode } from './gameMode.js';
import { camera, scene } from './main.js';

export class Player {
  constructor(chunkMgr) {
    this.chunkMgr = chunkMgr;
    this.eye = camera;
    this.vel = new THREE.Vector3();
    this.keys = { w: 0, a: 0, s: 0, d: 0, shift: 0, space: 0 };
    this.mode = GameMode.SURVIVAL;
    this.hp = 20; this.food = 20; this.rad = 0;
    this.selectedID = 1;
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
    addEventListener('mousedown', e => { if (e.button === 0) this.break(); if (e.button === 2) this.place(); });
    addEventListener('contextmenu', e => e.preventDefault());
  }
  onKey(code, v) {
    switch (code) {
      case 'KeyW': this.keys.w = v; break;
      case 'KeyS': this.keys.s = v; break;
      case 'KeyA': this.keys.a = v; break;
      case 'KeyD': this.keys.d = v; break;
      case 'ShiftLeft': this.keys.shift = v; break;
      case 'Space': this.keys.space = v; break;
    }
  }
  break() {
    const hit = this.raycast(5);
    if (!hit) return;
    this.chunkMgr.setAtom(hit.x, hit.y, hit.z, 0);
  }
  place() {
    const hit = this.raycast(5);
    if (!hit) return;
    this.chunkMgr.setAtom(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz, this.selectedID);
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
    if (this.keys.space && this.onGround) { this.vel.y = 0.2; this.onGround = false; }
    this.vel.y -= 0.015;
    this.position.y += this.vel.y;
    const wx = Math.floor(this.position.x), wy = Math.floor(this.position.y - 1.6), wz = Math.floor(this.position.z);
    if (this.chunkMgr.getAtom(wx, wy, wz) !== 0) {
      this.position.y = wy + 1.6 + 0.01; this.vel.y = 0; this.onGround = true;
    } else this.onGround = false;
    if (this.mode === GameMode.SURVIVAL) {
      this.rad *= 0.99;
      document.getElementById('hp').textContent = `❤ ${this.hp}`;
      document.getElementById('food').textContent = `🍖 ${this.food}`;
      document.getElementById('rad').textContent = `☢ ${Math.floor(this.rad)}`;
    }
    const p = this.position;
    document.getElementById('coords').textContent = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
    document.getElementById('mode').textContent = this.mode === GameMode.CREATIVE ? '创造' : '生存';
  }
}