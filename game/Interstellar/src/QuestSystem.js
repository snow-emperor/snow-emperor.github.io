export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.activeQuests = [];
    this.completedQuests = [];
    this.availableQuests = [];
    this.questTypes = this.initQuestTypes();
  }

  initQuestTypes() {
    return {
      'collectResource': {
        name: '资源收集',
        description: '收集 {amount} 个 {resource}',
        checkProgress: (quest) => {
          const current = this.game.resourceSystem.playerInventory.get(quest.data.targetResource) || 0;
          quest.progress = Math.min(current / quest.data.targetAmount, 1);
          return quest.progress >= 1;
        },
        generate: () => {
          const resources = ['water', 'minerals', 'wood', 'food'];
          const resource = resources[Math.floor(Math.random() * resources.length)];
          const amount = 10 + Math.floor(Math.random() * 40);
          return {
            targetResource: resource,
            targetAmount: amount
          };
        },
        rewards: (data) => ({
          resources: new Map([[data.targetResource, Math.floor(data.targetAmount * 0.3)]]),
          experience: data.targetAmount * 5
        })
      },
      'buildStructure': {
        name: '建造建筑',
        description: '建造 {count} 个 {structure}',
        checkProgress: (quest) => {
          const count = this.game.baseBuilder.buildings.filter(
            b => !b.isConstructing && b.type === quest.data.targetStructure
          ).length;
          quest.progress = Math.min(count / quest.data.targetCount, 1);
          return quest.progress >= 1;
        },
        generate: () => {
          const structures = ['hut', 'refinery'];
          const structure = structures[Math.floor(Math.random() * structures.length)];
          const count = 1 + Math.floor(Math.random() * 2);
          return {
            targetStructure: structure,
            targetCount: count
          };
        },
        rewards: (data) => ({
          resources: new Map([['minerals', data.targetCount * 20]]),
          experience: data.targetCount * 50
        })
      },
      'explorePlanet': {
        name: '星球探索',
        description: '登录 {planetType} 星球',
        checkProgress: (quest) => {
          return this.game.activePlanet && this.game.activePlanet.type === quest.data.targetPlanetType;
        },
        generate: () => {
          const types = ['terran', 'ice', 'desert', 'volcanic'];
          const planetType = types[Math.floor(Math.random() * types.length)];
          return { targetPlanetType: planetType };
        },
        rewards: (data) => ({
          resources: new Map([['metal', 30]]),
          experience: 100,
          techPoints: 1
        })
      },
      'interactAlien': {
        name: '外星互动',
        description: '与 {count} 个 {alienType} 生物互动',
        checkProgress: (quest) => {
          // 实际项目中需要记录玩家与外星生物的互动
          quest.progress = Math.min(quest.interactions / quest.data.targetCount, 1);
          return quest.progress >= 1;
        },
        generate: () => {
          const types = ['friendly', 'neutral'];
          const alienType = types[Math.floor(Math.random() * types.length)];
          const count = 2 + Math.floor(Math.random() * 3);
          return { targetAlienType: alienType, targetCount: count };
        },
        rewards: (data) => ({
          resources: new Map([['food', data.targetCount * 5]]),
          experience: data.targetCount * 40,
          techPoints: 1
        })
      }
    };
  }

  init() {
    this.generateNewQuests(3);
  }

  generateNewQuests(count) {
    const questKeys = Object.keys(this.questTypes);
    for (let i = 0; i < count; i++) {
      const questTypeKey = questKeys[Math.floor(Math.random() * questKeys.length)];
      const questType = this.questTypes[questTypeKey];
      
      const questData = questType.generate();
      
      const quest = {
        id: Date.now() + i,
        type: questTypeKey,
        name: questType.name,
        description: this.replacePlaceholders(questType.description, {
          amount: questData.targetAmount,
          resource: questData.targetResource,
          count: questData.targetCount,
          structure: this.game.baseBuilder.buildableTypes.get(questData.targetStructure)?.name || questData.targetStructure,
          planetType: questData.targetPlanetType,
          alienType: questData.targetAlienType
        }),
        data: questData,
        progress: 0,
        isCompleted: false,
        interactions: 0
      };
      
      this.availableQuests.push(quest);
    }
  }

  acceptQuest(questId) {
    const questIndex = this.availableQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return false;
    
    const quest = this.availableQuests.splice(questIndex, 1)[0];
    this.activeQuests.push(quest);
    this.game.uiManager.updateQuestUI();
    return true;
  }

  checkProgress() {
    this.activeQuests.forEach(quest => {
      if (quest.isCompleted) return;
      
      const questType = this.questTypes[quest.type];
      const isCompleted = questType.checkProgress(quest);
      
      if (isCompleted) {
        this.completeQuest(quest);
      }
    });
  }

  completeQuest(quest) {
    quest.isCompleted = true;
    
    const index = this.activeQuests.indexOf(quest);
    if (index !== -1) {
      this.activeQuests.splice(index, 1);
      this.completedQuests.push(quest);
    }
    
    const rewards = this.questTypes[quest.type].rewards(quest.data);
    
    if (rewards.resources) {
      rewards.resources.forEach((amount, type) => {
        this.game.resourceSystem.addToInventory(type, amount);
      });
    }
    
    if (rewards.experience) {
      this.game.player.addExperience(rewards.experience);
    }
    
    if (rewards.techPoints) {
      this.game.techTree.addTechPoints(rewards.techPoints);
    }
    
    this.game.uiManager.showQuestComplete(quest, rewards);
    this.game.uiManager.updateQuestUI();
    this.game.uiManager.updateResourceDisplay();
    
    if (this.availableQuests.length < 2) {
      this.generateNewQuests(1);
    }
  }

  replacePlaceholders(text, data) {
    return text.replace(/{(\w+)}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
