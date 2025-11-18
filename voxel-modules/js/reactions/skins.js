export const SKINS = [
  { symbol: 'H',  name: '霓虹氢',  color: 0xff00ff, price: 50,  own: false },
  { symbol: 'He', name: '极光氦',  color: 0x00ffff, price: 80,  own: false },
  { symbol: 'C',  name: '钻石碳',  color: 0x4deeea, price: 100, own: false },
  { symbol: 'O',  name: '蓝氧',    color: 0x74ee15, price: 60,  own: false },
  { symbol: 'Fe', name: '钢铁铁',  color: 0xffe700, price: 120, own: false },
  { symbol: 'Cu', name: '彩虹铜',  color: 0xf000ff, price: 150, own: false },
  { symbol: 'Au', name: '闪耀金',  color: 0xffd700, price: 500, own: false },
  { symbol: 'Ag', name: '月光银',  color: 0xc0c0c0, price: 300, own: false },
  { symbol: 'U',  name: '黄金铀',  color: 0xffd700, price: 1000, own: false },
  { symbol: 'Pu', name: '紫钚',    color: 0xda70d6, price: 1500, own: false },
  { symbol: 'C',  name: '黑钻石',  color: 0x111111, price: 800, own: false, special: true },
  { symbol: 'O',  name: '红氧',    color: 0xff0000, price: 200, own: false, special: true }
];

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