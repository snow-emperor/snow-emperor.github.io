/**
 * UI控制器
 * 负责管理游戏中的所有UI元素
 */
export class UIController {
  constructor(game) {
    this.game = game;

    // UI元素
    this.elements = {};

    // UI状态
    this.isDialogueActive = false;
    this.isShopActive = false;
    this.isSpellSelectionActive = false;
    this.isSpecializationSelectionActive = false;

    // 交互提示
    this.interactionPrompt = null;

    // 通知队列
    this.notifications = [];

    // 初始化
    this.initElements();
    this.setupEventListeners();
  }

  /* -------------------- 初始化 -------------------- */
  initElements() {
    // 主界面
    this.elements.levelValue = document.getElementById('level-value');
    this.elements.goldValue = document.getElementById('gold-value');
    this.elements.healthBar = document.getElementById('health-bar');
    this.elements.healthValue = document.getElementById('health-value');
    this.elements.manaBar = document.getElementById('mana-bar');
    this.elements.manaValue = document.getElementById('mana-value');
    this.elements.expBar = document.getElementById('exp-bar');
    this.elements.expValue = document.getElementById('exp-value');

    // 选中咒语
    this.elements.selectedSpellIcon = document.getElementById('selected-spell-icon');
    this.elements.selectedSpellInfo = document.getElementById('selected-spell-info');

    // 属性面板
    this.elements.attributesPanel = document.getElementById('attributes-panel');
    this.elements.attrLevel = document.getElementById('attr-level');
    this.elements.attrExp = document.getElementById('attr-exp');
    this.elements.attrHealth = document.getElementById('attr-health');
    this.elements.attrMana = document.getElementById('attr-mana');
    this.elements.attrAttack = document.getElementById('attr-attack');
    this.elements.attrDefense = document.getElementById('attr-defense');
    this.elements.attrCastSpeed = document.getElementById('attr-cast-speed');
    this.elements.attrSpecialization = document.getElementById('attr-specialization');

    // 装备
    this.elements.equipWand = document.getElementById('equip-wand');
    this.elements.equipRobe = document.getElementById('equip-robe');
    this.elements.equipAccessory = document.getElementById('equip-accessory');

    // 咒语面板
    this.elements.spellsPanel = document.getElementById('spells-panel');
    this.elements.spellsList = document.getElementById('spells-list');

    // 任务面板
    this.elements.questsPanel = document.getElementById('quests-panel');
    this.elements.mainQuests = document.getElementById('main-quests');
    this.elements.sideQuests = document.getElementById('side-quests');
    this.elements.dailyQuests = document.getElementById('daily-quests');

    // 战斗面板
    this.elements.combatPanel = document.getElementById('combat-panel');
    this.elements.enemyName = document.getElementById('enemy-name');
    this.elements.enemyLevel = document.getElementById('enemy-level');
    this.elements.enemyHealthBar = document.getElementById('enemy-health-bar');
    this.elements.enemyHealthValue = document.getElementById('enemy-health-value');

    // 对话框
    this.elements.dialogueBox = document.getElementById('dialogue-box');
    this.elements.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.elements.dialogueText = document.getElementById('dialogue-text');
    this.elements.dialogueOptions = document.getElementById('dialogue-options');

    // 游戏结束
    this.elements.gameOverScreen = document.getElementById('game-over-screen');
    this.elements.gameOverTitle = document.getElementById('game-over-title');
    this.elements.gameOverMessage = document.getElementById('game-over-message');
    this.elements.restartBtn = document.getElementById('restart-btn');
  }

  setupEventListeners() {
    // 面板关闭按钮
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panelId = btn.getAttribute('data-panel');
        this.hidePanel(panelId);
      });
    });

    // 重新开始
    this.elements.restartBtn.addEventListener('click', () => {
      this.game.saveSystem.loadGame();
    });
  }

  init() {
    this.updatePlayerStats();
    this.updateSpellsPanel();
    this.updateQuestsPanel();
    this.hideAllPanels();
  }

  /* -------------------- 每帧更新 -------------------- */
  update(dt) {
    this.updateNotifications(dt);
    this.updateCombatPanel();
    this.updateInteractionPrompt();
  }

  /* -------------------- 玩家状态 -------------------- */
  updatePlayerStats() {
    const p = this.game.playerController;

    this.elements.levelValue.textContent = p.level;
    this.elements.goldValue.textContent = p.gold;

    this.elements.healthBar.style.width = `${(p.health / p.maxHealth) * 100}%`;
    this.elements.healthValue.textContent = `${p.health}/${p.maxHealth}`;

    this.elements.manaBar.style.width = `${(p.mana / p.maxMana) * 100}%`;
    this.elements.manaValue.textContent = `${p.mana}/${p.maxMana}`;

    this.elements.expBar.style.width = `${(p.experience / p.experienceToNext) * 100}%`;
    this.elements.expValue.textContent = `${p.experience}/${p.experienceToNext}`;

    this.elements.attrLevel.textContent = p.level;
    this.elements.attrExp.textContent = `${p.experience}/${p.experienceToNext}`;
    this.elements.attrHealth.textContent = `${p.health}/${p.maxHealth}`;
    this.elements.attrMana.textContent = `${p.mana}/${p.maxMana}`;
    this.elements.attrAttack.textContent = p.attack;
    this.elements.attrDefense.textContent = p.defense;
    this.elements.attrCastSpeed.textContent = `${p.castSpeed}x`;

    const specNames = { null: '未选择', fire: '火焰', ice: '冰霜', thunder: '雷电', nature: '自然' };
    this.elements.attrSpecialization.textContent = specNames[p.specialization];

    const wandNames = { basic: '基础魔杖', fire: '火焰魔杖', ice: '冰霜魔杖', thunder: '雷电魔杖', nature: '自然魔杖', ultimate: '终极魔杖' };
    this.elements.equipWand.textContent = wandNames[p.wand] || '未知';

    const robeNames = { basic: '基础制服', fire: '火焰法袍', ice: '冰霜法袍', thunder: '雷电法袍', nature: '自然法袍' };
    this.elements.equipRobe.textContent = robeNames[p.robe] || '未知';

    const accessoryNames = {
      null: '无', 'life-necklace': '生命项链', 'mana-necklace': '魔法项链',
      'attack-ring': '攻击戒指', 'defense-ring': '防御戒指', 'cast-cloak': '施法披风', 'chaos-amulet': '混沌护身符'
    };
    this.elements.equipAccessory.textContent = accessoryNames[p.accessory] || '未知';

    this.updateSelectedSpell();
  }

  updateSelectedSpell() {
    const p = this.game.playerController;
    if (!p.selectedSpell) {
      this.elements.selectedSpellIcon.innerHTML = '<span class="spell-placeholder">无</span>';
      this.elements.selectedSpellInfo.innerHTML = '<span>选择一个咒语</span>';
      return;
    }
    const spell = this.game.spellSystem.getSpell(p.selectedSpell);
    if (!spell) {
      this.elements.selectedSpellIcon.innerHTML = '<span class="spell-placeholder">未知咒语</span>';
      this.elements.selectedSpellInfo.innerHTML = '<span>未知咒语</span>';
      return;
    }
    this.elements.selectedSpellIcon.innerHTML = `
      <img src="src/assets/spells/${spell.id}.png" alt="${spell.name}" class="spell-icon">
      <div class="spell-cooldown" id="selected-spell-cooldown"></div>`;
    this.elements.selectedSpellInfo.innerHTML = `
      <div class="spell-name">${spell.name}</div>
      <div class="spell-info">消耗: ${spell.cost} 魔法值</div>
      <div class="spell-info">冷却: ${spell.cooldown} 秒</div>`;
    this.updateSpellCooldown(p.selectedSpell);
  }

  updateSpellCooldown(spellId) {
    const el = document.getElementById('selected-spell-cooldown');
    if (!el) return;
    const cd = this.game.playerController.spellCooldowns[spellId];
    if (cd > 0) {
      el.style.display = 'block';
      el.textContent = Math.ceil(cd);
    } else {
      el.style.display = 'none';
    }
  }

  /* -------------------- 咒语面板 -------------------- */
  updateSpellsPanel() {
    const p = this.game.playerController;
    this.elements.spellsList.innerHTML = '';
    p.learnedSpells.forEach(id => {
      const spell = this.game.spellSystem.getSpell(id);
      if (!spell) return;
      const div = document.createElement('div');
      div.className = 'spell-item';
      div.dataset.spellId = id;
      if (p.selectedSpell === id) div.classList.add('selected');
      if (p.spellCooldowns[id] > 0) div.classList.add('cooldown');

      div.innerHTML = `
        <div class="spell-icon-container">
          <img src="src/assets/spells/${spell.id}.png" alt="${spell.name}" class="spell-icon">
        </div>
        <div class="spell-name">${spell.name}</div>
        <div class="spell-cost">${spell.cost} MP</div>
        <div class="spell-cooldown" id="spell-cooldown-${id}"></div>`;

      div.addEventListener('click', () => {
        if (p.spellCooldowns[id] > 0) return this.showNotification('咒语冷却中');
        p.selectedSpell = id;
        this.updateSelectedSpell();
        this.updateSpellsPanel();
      });
      this.elements.spellsList.appendChild(div);
      this.updateSpellCooldownInPanel(id);
    });
  }

  updateSpellCooldownInPanel(spellId) {
    const el = document.getElementById(`spell-cooldown-${spellId}`);
    if (!el) return;
    const cd = this.game.playerController.spellCooldowns[spellId];
    el.style.display = cd > 0 ? 'block' : 'none';
    if (cd > 0) el.textContent = Math.ceil(cd);
  }

  /* -------------------- 任务面板 -------------------- */
  updateQuestsPanel() {
    const qs = this.game.questSystem;
    this.updateQuestList(qs.mainQuests, this.elements.mainQuests);
    this.updateQuestList(qs.sideQuests, this.elements.sideQuests);
    this.updateQuestList(qs.dailyQuests, this.elements.dailyQuests);
  }

  updateQuestList(quests, container) {
    container.innerHTML = '';
    quests.forEach(q => {
      const div = document.createElement('div');
      div.className = 'quest-item';
      if (q.status === 'completed') div.classList.add('completed');
      else if (q.status === 'in-progress') div.classList.add('in-progress');
      else div.classList.add('locked');

      div.innerHTML = `
        <div class="quest-title">
          ${q.title}
          <span class="quest-status ${q.status}">${this.getQuestStatusText(q.status)}</span>
        </div>
        <div class="quest-description">${q.description}</div>`;
      div.addEventListener('click', () => this.showQuestDetails(q));
      container.appendChild(div);
    });
  }

  getQuestStatusText(status) {
    const map = { completed: '已完成', 'in-progress': '进行中', locked: '未解锁' };
    return map[status] || '未知';
  }

  showQuestDetails(quest) {
    const statusText = this.getQuestStatusText(quest.status);
    let objHtml = '';
    quest.objectives.forEach(o => {
      objHtml += `<div>${o.completed ? '✓' : '○'} ${o.description}</div>`;
    });
    let rewHtml = '';
    quest.rewards.forEach(r => {
      rewHtml += `<div>${r.description}: ${r.amount}</div>`;
    });
    this.showDialogue(
      quest.title,
      `<div>状态: ${statusText}</div>
       <div>描述: ${quest.description}</div>
       <div>目标:</div>${objHtml}
       <div>奖励:</div>${rewHtml}`
    );
  }

  /* -------------------- 战斗面板 -------------------- */
  updateCombatPanel() {
    const enemies = this.game.enemySystem.enemies;
    let nearest = null, min = Infinity;
    enemies.forEach(e => {
      const d = this.game.playerController.position.distanceTo(e.position);
      if (d < min) { min = d; nearest = e; }
    });
    if (nearest && min < 10) {
      this.elements.combatPanel.classList.remove('hidden');
      this.elements.enemyName.textContent = nearest.name;
      this.elements.enemyLevel.textContent = nearest.level;
      const pct = (nearest.health / nearest.maxHealth) * 100;
      this.elements.enemyHealthBar.style.width = `${pct}%`;
      this.elements.enemyHealthValue.textContent = `${nearest.health}/${nearest.maxHealth}`;
    } else {
      this.elements.combatPanel.classList.add('hidden');
    }
  }

  /* -------------------- 对话框 -------------------- */
  showDialogue(speaker, text, options = null) {
    this.isDialogueActive = true;
    this.elements.dialogueSpeaker.textContent = speaker;
    this.elements.dialogueText.innerHTML = text;
    this.elements.dialogueOptions.innerHTML = '';

    if (options) {
      Object.keys(options).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          options[opt]();
          this.hideDialogue();
        });
        this.elements.dialogueOptions.appendChild(btn);
      });
    } else {
      const btn = document.createElement('button');
      btn.className = 'dialogue-option';
      btn.textContent = '继续';
      btn.addEventListener('click', () => this.hideDialogue());
      this.elements.dialogueOptions.appendChild(btn);
    }
    this.elements.dialogueBox.classList.remove('hidden');
  }

  hideDialogue() {
    this.isDialogueActive = false;
    this.elements.dialogueBox.classList.add('hidden');
  }

  /* -------------------- 专精选择 -------------------- */
  showSpecializationSelection() {
    this.isSpecializationSelectionActive = true;
    const box = document.createElement('div');
    box.className = 'specialization-selection';
    box.innerHTML = `
      <h2>选择你的元素专精</h2>
      <div class="specialization-options">
        <div class="specialization-option" data-specialization="fire">
          <div class="specialization-icon fire-icon"></div>
          <div class="specialization-name">火焰</div>
          <div class="specialization-description">高伤害、持续效果</div>
        </div>
        <div class="specialization-option" data-specialization="ice">
          <div class="specialization-icon ice-icon"></div>
          <div class="specialization-name">冰霜</div>
          <div class="specialization-description">控制效果、防御能力</div>
        </div>
        <div class="specialization-option" data-specialization="thunder">
          <div class="specialization-icon thunder-icon"></div>
          <div class="specialization-name">雷电</div>
          <div class="specialization-description">高爆发、范围效果</div>
        </div>
        <div class="specialization-option" data-specialization="nature">
          <div class="specialization-icon nature-icon"></div>
          <div class="specialization-name">自然</div>
          <div class="specialization-description">治疗效果、持续战斗</div>
        </div>
      </div>
      <div class="selection-note">选择后不可更改，请谨慎选择</div>`;
    document.body.appendChild(box);

    box.querySelectorAll('.specialization-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const spec = opt.dataset.specialization;
        this.game.playerController.specialization = spec;
        this.unlockSpellsForSpecialization(spec);
        this.updatePlayerStats();
        this.updateSpellsPanel();
        document.body.removeChild(box);
        this.isSpecializationSelectionActive = false;
        this.showDialogue('导师', `很好，你选择了${this.getSpecializationName(spec)}专精。现在你可以学习和使用${this.getSpecializationName(spec)}咒语了。`);
        this.game.eventBus.emit('specialization-selected', spec);
      });
    });
  }

  getSpecializationName(spec) {
    return { fire: '火焰', ice: '冰霜', thunder: '雷电', nature: '自然' }[spec] || '未知';
  }

  unlockSpellsForSpecialization(spec) {
    // 根据专精解锁初始咒语，具体逻辑自行扩展
  }

  /* -------------------- 咒语选择 -------------------- */
  showSpellSelection(element) {
    this.isSpellSelectionActive = true;
    const spells = this.game.spellSystem.getSpellsByElement(element);
    const box = document.createElement('div');
    box.className = 'selection-box';
    const elemName = { fire: '火焰', ice: '冰霜', thunder: '雷电', nature: '自然' }[element];
    box.innerHTML = `
      <h2>学习${elemName}咒语</h2>
      <div class="spell-selection-options">
        ${spells.map(s => `
          <div class="spell-selection-option ${this.game.playerController.learnedSpells.includes(s.id) ? 'learned' : ''}" data-spell-id="${s.id}">
            <img src="src/assets/icons/spells/${s.id}.png" alt="${s.name}">
            <div class="spell-name">${s.name}</div>
            <div class="spell-level">需要等级: ${s.level}</div>
            <div class="spell-cost">消耗: ${s.cost} MP</div>
            <div class="spell-description">${s.description}</div>
            ${this.game.playerController.learnedSpells.includes(s.id) ?
          '<div class="spell-status">已学习</div>' :
          `<div class="spell-status">需要: ${s.requirement}</div>`}
          </div>`).join('')}
      </div>`;
    document.body.appendChild(box);

    box.querySelectorAll('.spell-selection-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const id = opt.dataset.spellId;
        if (this.game.playerController.learnedSpells.includes(id)) return;
        if (!this.game.spellSystem.canLearnSpell(id)) {
          const sp = this.game.spellSystem.getSpell(id);
          return this.showNotification(`不满足学习条件: ${sp.requirement}`);
        }
        this.game.spellSystem.learnSpell(id);
        this.updateSpellsPanel();
        document.body.removeChild(box);
        this.isSpellSelectionActive = false;
        this.showNotification(`已学习咒语: ${this.game.spellSystem.getSpell(id).name}`);
        this.game.saveSystem.autoSave();
      });
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(box);
      this.isSpellSelectionActive = false;
    });
    box.appendChild(closeBtn);
  }

  /* -------------------- 商店 -------------------- */
  showShop(shopId) {
    this.isShopActive = true;
    const shop = this.game.shopSystem.getShop(shopId);
    const box = document.createElement('div');
    box.className = 'shop-box';
    box.innerHTML = `
      <h2>${shop.name}</h2>
      <div class="shop-items">
        ${shop.items.map(it => `
          <div class="shop-item" data-item-id="${it.id}">
            <img src="src/assets/icons/items/${it.id}.png" alt="${it.name}">
            <div class="item-name">${it.name}</div>
            <div class="item-description">${it.description}</div>
            <div class="item-price">${it.price} 金币</div>
            <button class="buy-button ${this.game.playerController.gold < it.price ? 'disabled' : ''}"
                    data-item-id="${it.id}" data-price="${it.price}">购买</button>
          </div>`).join('')}
      </div>
      <div class="shop-gold">当前金币: ${this.game.playerController.gold}</div>`;
    document.body.appendChild(box);

    box.querySelectorAll('.buy-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.itemId;
        const price = parseInt(btn.dataset.price);
        if (this.game.playerController.gold < price) return this.showNotification('金币不足');
        this.game.shopSystem.buyItem(id);
        this.updatePlayerStats();
        box.querySelector('.shop-gold').textContent = `当前金币: ${this.game.playerController.gold}`;
        if (this.game.inventorySystem.hasItem(id)) {
          btn.classList.add('disabled');
          btn.textContent = '已拥有';
        }
        const it = this.game.itemSystem.getItem(id);
        this.showNotification(`已购买: ${it.name}`);
        this.game.saveSystem.autoSave();
      });
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(box);
      this.isShopActive = false;
    });
    box.appendChild(closeBtn);
  }

  /* -------------------- 交互提示 -------------------- */
  showInteractionPrompt(name) {
    if (this.interactionPrompt) {
      this.interactionPrompt.textContent = `按 E 键与 ${name} 交互`;
      return;
    }
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.className = 'interaction-prompt';
    this.interactionPrompt.textContent = `按 E 键与 ${name} 交互`;
    document.body.appendChild(this.interactionPrompt);
  }

  hideInteractionPrompt() {
    if (!this.interactionPrompt) return;
    document.body.removeChild(this.interactionPrompt);
    this.interactionPrompt = null;
  }

  updateInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.style.bottom = '100px';
      this.interactionPrompt.style.left = '50%';
      this.interactionPrompt.style.transform = 'translateX(-50%)';
    }
  }

  /* -------------------- 通知 -------------------- */
  showNotification(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    this.notifications.push({ element: div, time: 3 });
    setTimeout(() => div.classList.add('show'), 10);
    setTimeout(() => {
      if (!document.body.contains(div)) return;
      div.classList.add('hide');
      setTimeout(() => {
        if (!document.body.contains(div)) return;
        document.body.removeChild(div);
        const idx = this.notifications.findIndex(n => n.element === div);
        if (idx !== -1) this.notifications.splice(idx, 1);
      }, 500);
    }, 3000);
  }

  updateNotifications(dt) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.time -= dt;
      if (n.time <= 0) {
        const el = n.element;
        if (document.body.contains(el)) {
          el.classList.add('hide');
          setTimeout(() => {
            if (document.body.contains(el)) document.body.removeChild(el);
          }, 500);
        }
        this.notifications.splice(i, 1);
      }
    }
  }

  /* -------------------- 伤害数字 & 特效 -------------------- */
  showDamageNumber(pos, dmg, isHeal = false) {
    const div = document.createElement('div');
    div.className = `damage-number ${isHeal ? 'heal' : 'damage'}`;
    div.textContent = isHeal ? `+${dmg}` : `-${dmg}`;
    const sp = pos.clone().project(this.game.camera);
    div.style.left = `${(sp.x + 1) * window.innerWidth / 2}px`;
    div.style.top = `${(-sp.y + 1) * window.innerHeight / 2}px`;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 10);
    setTimeout(() => {
      if (!document.body.contains(div)) return;
      div.classList.add('hide');
      setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 500);
    }, 1500);
  }

  showDamageEffect() {
    const div = document.createElement('div');
    div.className = 'damage-effect';
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 10);
    setTimeout(() => {
      if (!document.body.contains(div)) return;
      div.classList.add('hide');
      setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 500);
    }, 300);
  }

  showLevelUpEffect() {
    const div = document.createElement('div');
    div.className = 'level-up-effect';
    div.innerHTML = `<div class="level-up-text">LEVEL UP!</div><div class="level-up-particles"></div>`;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 10);
    setTimeout(() => {
      if (!document.body.contains(div)) return;
      div.classList.add('hide');
      setTimeout(() => { if (document.body.contains(div)) document.body.removeChild(div); }, 1000);
    }, 2000);
  }

  /* -------------------- 面板显隐 -------------------- */
  togglePanel(panelId) {
    const p = document.getElementById(panelId);
    p.classList.contains('hidden') ? this.showPanel(panelId) : this.hidePanel(panelId);
  }

  showPanel(panelId) {
    const p = document.getElementById(panelId);
    p.classList.remove('hidden');
    if (panelId === 'attributes-panel') this.updatePlayerStats();
    else if (panelId === 'spells-panel') this.updateSpellsPanel();
    else if (panelId === 'quests-panel') this.updateQuestsPanel();
  }

  hidePanel(panelId) {
    document.getElementById(panelId).classList.add('hidden');
  }

  hideAllPanels() {
    ['attributes-panel', 'spells-panel', 'quests-panel'].forEach(id => this.hidePanel(id));
  }

  updateAll() {
    this.updatePlayerStats();
    this.updateSpellsPanel();
    this.updateQuestsPanel();
  }

  /**
   * 更新加载进度显示
   * @param {number} progress - 加载进度百分比 (0-100)
   */
  updateLoadingProgress(progress) {
    // 获取加载进度元素
    const loadingProgress = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingProgress) {
      loadingProgress.style.width = `${progress}%`;
    }
    
    if (loadingText) {
      loadingText.textContent = `正在加载游戏资源... ${Math.round(progress)}%`;
    }
    
    // 如果进度达到100%，隐藏加载界面
    if (progress >= 100) {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 500);
        }, 500);
      }
    }
  }
}

