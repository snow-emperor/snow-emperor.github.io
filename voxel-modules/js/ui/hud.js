export function showHUD() {
  document.getElementById('hud').classList.remove('hidden');
  // 快捷栏 9 格
  const bar = document.getElementById('hotbar');
  bar.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'atom-slot';
    slot.id = 'slot' + i;
    bar.appendChild(slot);
  }
}