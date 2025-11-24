export class TechTree {
  constructor(game) {
    this.game = game;
    this.techPoints = 0;
    this.unlockedTechs = new Map();
    this.techTree = this.initTechTree();
  }

  init() {
    // 初始解锁基础科技
    this.unlockedTechs.set('basicConstruction', 1);
    this.game.uiManager.updateTechTreeUI();
  }

  initTechTree() {
    return {
      'resourceCollection': {
        name: '资源收集',
        description: '提高资源收集效率',
        maxLevel: 5,
        costPerLevel: [1, 2, 3, 4, 5],
        prerequisites: new Map([['basicConstruction', 1]]),
        effect: (level) => { /* 已在资源收集处实现 */ }
      },
      'advancedConstruction': {
        name: '高级建造',
        description: '解锁更高级的建筑',
        maxLevel: 1,
        costPerLevel: [3],
        prerequisites: new Map([['basicConstruction', 1]]),
        effect: (level) => {
          if (level >= 1) {
            this.game.baseBuilder.initBuildableTypes(); // 重新初始化以添加高级建筑
          }
        }
      },
      'processingEfficiency': {
        name: '加工效率',
        description: '减少资源加工时间',
        maxLevel: 3,
        costPerLevel: [2, 3, 5],
        prerequisites: new Map([['resourceCollection', 2]]),
        effect: (level) => { /* 在加工设施处实现 */ }
      },
      'advancedScanning': {
        name: '高级扫描',
        description: '发现更多稀有资源',
        maxLevel: 2,
        costPerLevel: [2, 4],
        prerequisites: new Map([['resourceCollection', 1]]),
        effect: (level) => { /* 在资源生成处实现 */ }
      },
      'alienCommunication': {
        name: '外星交流',
        description: '提高与外星生物互动效果',
        maxLevel: 2,
        costPerLevel: [3, 5],
        prerequisites: new Map(),
        effect: (level) => { /* 在AlienManager处实现 */ }
      }
    };
  }

  getTechLevel(techId) {
    return this.unlockedTechs.get(techId) || 0;
  }

  canUpgradeTech(techId) {
    const tech = this.techTree[techId];
    if (!tech) return false;

    const currentLevel = this.getTechLevel(techId);
    if (currentLevel >= tech.maxLevel) return false;

    // 检查前置科技
    for (const [reqId, reqLevel] of tech.prerequisites) {
      if (this.getTechLevel(reqId) < reqLevel) return false;
    }

    // 检查科技点
    return this.techPoints >= tech.costPerLevel[currentLevel];
  }

  upgradeTech(techId) {
    if (!this.canUpgradeTech(techId)) return false;

    const tech = this.techTree[techId];
    const currentLevel = this.getTechLevel(techId);
    
    // 消耗科技点
    this.techPoints -= tech.costPerLevel[currentLevel];
    
    // 升级科技
    this.unlockedTechs.set(techId, currentLevel + 1);
    
    // 应用科技效果
    tech.effect(currentLevel + 1);
    
    // 更新UI
    this.game.uiManager.updateTechTreeUI();
    return true;
  }

  addTechPoints(amount) {
    this.techPoints += amount;
    this.game.uiManager.updateTechTreeUI();
  }
}
