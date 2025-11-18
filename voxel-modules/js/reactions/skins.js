export const SKINS = [];

export async function pullSkins() {
  console.log('皮肤系统已移除');
}

export async function buySkin(symbol, price) {
  console.log('皮肤系统已移除');
}

export async function pullSkins() {
  // 如果后端在线，拉取用户已拥有；否则走本地 localStorage
  const saved = localStorage.getItem('ownedSkins');
  if (saved) {
    try {
      JSON.parse(saved).forEach(s => {
        const it = SKINS.find(x => x.symbol === s);
        if (it) it.own = true;
      });
    } catch (e) {
      console.error('解析已拥有皮肤数据失败:', e);
    }
  }
  
  // 初始化用户金币
  if (!localStorage.getItem('coins')) {
    localStorage.setItem('coins', '100'); // 初始100金币
  }
}

export async function buySkin(symbol, price) {
  const coins = Number(localStorage.getItem('coins') || 0);
  if (coins < price) return alert('💰 金币不足');
  const it = SKINS.find(x => x.symbol === symbol);
  if (it.own) return alert('已拥有');
  it.own = true;
  localStorage.setItem('coins', coins - price);
  localStorage.setItem('ownedSkins', JSON.stringify(SKINS.filter(x => x.own).map(x => x.symbol)));
  alert(`✅ 购买 ${it.name} 成功！`);
  // 实时替换全局颜色
  if (typeof SYM2ID !== 'undefined' && typeof ELEMENTS !== 'undefined' && SYM2ID[symbol]) {
    ELEMENTS[SYM2ID[symbol]].color = it.color;
  }
}