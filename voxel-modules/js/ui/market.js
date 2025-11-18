const SKINS = [
  { symbol: 'H',  name: '霓虹氢',  color: 0xff00ff, price: 50 },
  { symbol: 'U',  name: '黄金铀',  color: 0xffd700, price: 500 }
];

export function openMarket() {
  const div = document.getElementById('market');
  div.classList.remove('hidden');
  div.innerHTML = '<h2>皮肤市场</h2>' + SKINS.map(s => `
    <div style="margin:10px;padding:10px;background:#333">
      <span style="color:#${s.color.toString(16).padStart(6,'0')}">${s.name}</span>
      <button onclick="buySkin('${s.symbol}',${s.price})">💰 ${s.price}</button>
    </div>`).join('') + '<button onclick="closeMarket()">关闭</button>';
}
window.closeMarket = () => document.getElementById('market').classList.add('hidden');
window.buySkin = (sym, price) => { alert(`购买 ${sym} 皮肤 -${price} 金币`); };