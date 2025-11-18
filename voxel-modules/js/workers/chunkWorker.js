const CS = 1024;

// 使用 CDN 加载 worldgen.js
const WORLDGEN_CDN_URL = 'https://cdn.example.com/worldgen.js'; // ← 请替换为实际 CDN 地址
importScripts(WORLDGEN_CDN_URL);

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