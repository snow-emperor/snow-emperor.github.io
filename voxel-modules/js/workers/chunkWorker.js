import { atomAt } from '../worldgen.js';

const CS = 1024;
self.onmessage = ({ data: { sab, cx, cy, cz } }) => {
  try {
    const arr = new Uint16Array(sab);
    for (let y = 0; y < CS; y++) {
      for (let z = 0; z < CS; z++) {
        for (let x = 0; x < CS; x++) {
          arr[y * CS * CS + z * CS + x] = atomAt(cx * CS + x, cy * CS + y, cz * CS + z);
        }
      }
    }
    self.postMessage({ sab, cx, cy, cz }, [sab]);
  } catch (e) {
    console.error('Worker生成区块失败:', e);
  }
};