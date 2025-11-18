let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;

export function showHUD() {
  document.getElementById('hud').classList.remove('hidden');
  // 快捷栏 9 格
  const bar = document.getElementById('hotbar');
  bar.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'atom-slot';
    slot.id = 'slot' + i;
    slot.textContent = i + 1;
    bar.appendChild(slot);
  }
  
  // 高亮第一个槽位
  if (bar.firstChild) {
    bar.firstChild.style.borderColor = '#2196F3';
  }
}

export function updateFPS() {
  const now = performance.now();
  frameCount++;
  
  if (now >= lastFrameTime + 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    frameCount = 0;
    lastFrameTime = now;
    
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps}`;
    }
  }
  
  return fps;
}