export const SKINS = [
  { symbol: 'H',  name: '霓虹氢',  color: 0xff00ff, price: 50,  own: false },
  { symbol: 'U',  name: '黄金铀',  color: 0xffd700, price: 500, own: false }
];

export async function pullSkins() {
  // 如果后端在线，拉取用户已拥有；否则走本地 localStorage
  const saved = localStorage.getItem('ownedSkins');
  if (saved) JSON.parse(saved).forEach(s => {
    const it = SKINS.find(x => x.symbol === s);
    if (it) it.own = true;
  });
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
  ELEMENTS[SYM2ID[symbol]].color = it.color;
}