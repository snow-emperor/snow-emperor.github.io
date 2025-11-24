export class UIManager {
  constructor(game) {
    this.game = game;
    this.resourcesElement = document.getElementById('resources');
    this.buildMenuElement = document.getElementById('build-menu');
    this.questLogElement = document.getElementById('quest-log');
    this.techTreeElement = document.getElementById('tech-tree');
  }

  init() {
    this.initBuildMenu();
    this.updateResourceDisplay();
    this.updateQuestUI();
    this.updateTechTreeUI();
  }

  initBuildMenu() {
    this.buildMenuElement.innerHTML = '<h3>建造菜单</h3>';
    
    this.game.baseBuilder.buildableTypes.forEach((data, type) => {
      const button = document.createElement('div');
      button.className = 'building-btn';
      button.innerHTML = `
        <strong>${data.name}</strong><br>
        ${Array.from(data.requiredResources).map(([r, a]) => `${r}: ${a}`).join('<br>')}
      `;
      
      button.addEventListener('click', () => {
        // 在玩家前方生成建筑
        const playerDir = new THREE.Vector3();
        this.game.sceneManager.camera.getWorldDirection(playerDir);
        const buildPos = this.game.sceneManager.camera.position.clone()
          .add(playerDir.multiplyScalar(5));
        
        this.game.baseBuilder.placeBuilding(buildPos, type);
      });
      
      this.buildMenuElement.appendChild(button);
    });
  }

  updateResourceDisplay(resourceType = null) {
    let html = '<h3>资源</h3>';
    
    if (resourceType) {
      // 只更新特定资源
      const amount = this.game.resourceSystem.playerInventory.get(resourceType) || 0;
      html += `<div>${resourceType}: ${amount}</div>`;
      this.resourcesElement.innerHTML = html;
    } else {
      // 更新所有资源
      this.game.resourceSystem.playerInventory.forEach((amount, type) => {
        html += `<div>${type}: ${amount}</div>`;
      });
      this.resourcesElement.innerHTML = html;
    }
  }

  updateQuestUI() {
    this.questLogElement.innerHTML = '<h3>任务日志</h3><h4>可接受任务</h4>';
    
    // 可接受任务
    this.game.questSystem.availableQuests.forEach(quest => {
      const questEl = document.createElement('div');
      questEl.className = 'quest available';
      questEl.innerHTML = `
        <strong>${quest.name}</strong><br>
        ${quest.description}<br>
        <button class="accept-quest" data-id="${quest.id}">接受</button>
      `;
      this.questLogElement.appendChild(questEl);
    });
    
    // 进行中任务
    this.questLogElement.innerHTML += '<h4>进行中任务</h4>';
    this.game.questSystem.activeQuests.forEach(quest => {
      const questEl = document.createElement('div');
      questEl.className = 'quest active';
      questEl.innerHTML = `
        <strong>${quest.name}</strong><br>
        ${quest.description}<br>
        进度: ${Math.round(quest.progress * 100)}%
      `;
      this.questLogElement.appendChild(questEl);
    });
    
    // 绑定接受任务事件
    document.querySelectorAll('.accept-quest').forEach(button => {
      button.addEventListener('click', (e) => {
        const questId = parseInt(e.target.dataset.id);
        this.game.questSystem.acceptQuest(questId);
      });
    });
  }
    updateTechTreeUI() {
    this.techTreeElement.innerHTML = `<h3>科技树 (科技点: ${this.game.techTree.techPoints})</h3>`;
    
    Object.entries(this.game.techTree.techTree).forEach(([techId, techData]) => {
      const currentLevel = this.game.techTree.getTechLevel(techId);
      const canUpgrade = this.game.techTree.canUpgradeTech(techId);
      
      const techEl = document.createElement('div');
      techEl.className = `tech ${canUpgrade ? 'upgradable' : ''}`;
      
      let prerequisites = '';
      if (techData.prerequisites.size > 0) {
        prerequisites = '<br>前置科技: ';
        techData.prerequisites.forEach((level, reqId) => {
          const reqName = this.game.techTree.techTree[reqId]?.name || reqId;
          prerequisites += `${reqName} (等级 ${level}) `;
        });
      }
      
      techEl.innerHTML = `
        <strong>${techData.name}</strong> (等级 ${currentLevel}/${techData.maxLevel})<br>
        ${techData.description}${prerequisites}<br>
        升级消耗: ${techData.costPerLevel[currentLevel] || '已满级'}
        ${canUpgrade ? `<button class="upgrade-tech" data-id="${techId}">升级</button>` : ''}
      `;
      
      this.techTreeElement.appendChild(techEl);
    });
    
    // 绑定科技升级事件
    document.querySelectorAll('.upgrade-tech').forEach(button => {
      button.addEventListener('click', (e) => {
        const techId = e.target.dataset.id;
        this.game.techTree.upgradeTech(techId);
      });
    });
  }

  showPlanetInfo(planet) {
    const infoDiv = document.createElement('div');
    infoDiv.id = 'planet-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '20px';
    infoDiv.style.right = '300px';
    infoDiv.style.background = 'rgba(0,0,0,0.5)';
    infoDiv.style.color = 'white';
    infoDiv.style.padding = '10px';
    infoDiv.style.borderRadius = '5px';
    
    infoDiv.innerHTML = `
      <h3>星球信息</h3>
      <div>类型: ${planet.type}</div>
      <div>半径: ${planet.radius}</div>
      <div>重力: ${planet.gravity.toFixed(1)}</div>
      <div>地形: ${planet.terrainType}</div>
      <div>大气层: ${planet.atmosphere ? '有' : '无'}</div>
    `;
    
    // 移除旧信息
    const oldInfo = document.getElementById('planet-info');
    if (oldInfo) oldInfo.remove();
    
    document.body.appendChild(infoDiv);
  }

  showQuestComplete(quest, rewards) {
    const notification = document.createElement('div');
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.background = 'rgba(0,0,0,0.8)';
    notification.style.color = 'white';
    notification.style.padding = '20px';
    notification.style.borderRadius = '5px';
    
    let rewardsHtml = '<h4>奖励:</h4>';
    if (rewards.resources) {
      rewardsHtml += '<div>资源:</div>';
      rewards.resources.forEach((amount, type) => {
        rewardsHtml += `<div>${type}: +${amount}</div>`;
      });
    }
    if (rewards.experience) {
      rewardsHtml += `<div>经验: +${rewards.experience}</div>`;
    }
    if (rewards.techPoints) {
      rewardsHtml += `<div>科技点: +${rewards.techPoints}</div>`;
    }
    
    notification.innerHTML = `
      <h3>任务完成!</h3>
      <div>${quest.name}</div>
      ${rewardsHtml}
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后移除通知
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showLevelUp(level) {
    const notification = document.createElement('div');
    notification.style.position = 'absolute';
    notification.style.top = '20%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.background = 'rgba(255,215,0,0.8)';
    notification.style.color = 'black';
    notification.style.padding = '20px';
    notification.style.borderRadius = '5px';
    notification.style.fontSize = '24px';
    
    notification.innerHTML = `<strong>升级了! 当前等级: ${level}</strong>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  showDamageIndicator() {
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.top = '50%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.color = 'red';
    indicator.style.fontSize = '36px';
    indicator.style.opacity = '0';
    
    indicator.innerHTML = '受到伤害!';
    document.body.appendChild(indicator);
    
    // 闪烁动画
    let opacity = 1;
    let fadeOut = true;
    const animation = setInterval(() => {
      if (fadeOut) {
        opacity -= 0.1;
        if (opacity <= 0) {
          clearInterval(animation);
          indicator.remove();
        }
      } else {
        opacity += 0.1;
        if (opacity >= 1) fadeOut = true;
      }
      indicator.style.opacity = opacity;
    }, 50);
  }

  showMessage(text) {
    const message = document.createElement('div');
    message.style.position = 'absolute';
    message.style.bottom = '100px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.background = 'rgba(0,0,0,0.7)';
    message.style.color = 'white';
    message.style.padding = '10px';
    message.style.borderRadius = '5px';
    
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }
}

  
