import { SKINS } from '../reactions/skins.js';

export function openMarket() {
  const div = document.getElementById('market');
  div.classList.remove('hidden');
  
  // 获取用户拥有的金币数
  const coins = Number(localStorage.getItem('coins') || 0);
  
  let html = `<h2>皮肤市场 <span style="font-size:16px">💰 ${coins}</span></h2>`;
  
  // 按类别分组显示皮肤
  const categories = {
    '基础元素': SKINS.filter(s => ['H', 'He', 'C', 'N', 'O'].includes(s.symbol)),
    '金属元素': SKINS.filter(s => ['Fe', 'Cu', 'Au', 'Ag'].includes(s.symbol)),
    '稀有元素': SKINS.filter(s => ['U', 'Pu', 'Au'].includes(s.symbol)),
    '特殊皮肤': SKINS.filter(s => s.special)
  };
  
  for (const [category, skins] of Object.entries(categories)) {
    if (skins.length > 0) {
      html += `<h3 style="margin:15px 0 5px;color:#4fc3f7">${category}</h3>`;
      html += skins.map(s => `
        <div style="margin:10px;padding:10px;background:#333;border-radius:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="color:#${s.color.toString(16).padStart(6,'0')}">${s.name}(${s.symbol})</span>
            ${s.own ? '<span style="color:#4CAF50;margin-left:10px">✓ 已拥有</span>' : ''}
          </div>
          <button onclick="buySkin('${s.symbol}',${s.price})" ${s.own ? 'disabled' : ''} style="padding:5px 10px">
            ${s.own ? '已购买' : `💰 ${s.price}`}
          </button>
        </div>
      `).join('');
    }
  }
  
  html += '<button onclick="closeMarket()" class="action-btn" style="margin-top:20px">关闭</button>';
  div.innerHTML = html;
}

window.closeMarket = () => {
  document.getElementById('market').classList.add('hidden');
}

window.buySkin = (sym, price) => {
  const coins = Number(localStorage.getItem('coins') || 0);
  if (coins < price) {
    alert('💰 金币不足');
    return;
  }
  
  const skin = SKINS.find(x => x.symbol === sym);
  if (skin.own) {
    alert('已拥有');
    return;
  }
  
  skin.own = true;
  localStorage.setItem('coins', coins - price);
  localStorage.setItem('ownedSkins', JSON.stringify(SKINS.filter(x => x.own).map(x => x.symbol)));
  alert(`✅ 购买 ${skin.name} 成功！`);
  
  // 实时替换全局颜色
  // ELEMENTS[SYM2ID[sym]].color = skin.color;
  
  // 刷新市场显示
  openMarket();
};