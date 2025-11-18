import * as THREE from 'three';
import { ELEMENTS } from '../atomData.js';

const BALMER = [
  { n: 3, λ: 656, rgb: new THREE.Color(1, 0.09, 0) },
  { n: 4, λ: 486, rgb: new THREE.Color(0, 0.68, 1) },
  { n: 5, λ: 434, rgb: new THREE.Color(0.2, 0, 1) },
  { n: 6, λ: 410, rgb: new THREE.Color(0.8, 0, 1) }
];

export function exciteColor(elementID, level) {
  if (elementID !== 0) return new THREE.Color(ELEMENTS[elementID].color);
  const line = BALMER[Math.min(level - 3, 3)];
  return line.rgb;
}

export function atomMesh(atomID, excite = 0) {
  const geo = new THREE.IcosahedronGeometry(0.05, 2);
  const mat = new THREE.MeshBasicMaterial({ color: exciteColor(atomID, excite), transparent: true, opacity: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  const cloudGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.BackSide });
  const cloud = new THREE.Mesh(cloudGeo, cloudMat);
  mesh.add(cloud);
  return mesh;
}