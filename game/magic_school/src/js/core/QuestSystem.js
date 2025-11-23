/**
 * 任务系统
 * 负责管理游戏中的所有任务，包括任务状态、进度、奖励等
 */
export class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = new Map();
        this.activeQuests = new Set();
        this.completedQuests = new Set();
        this.failedQuests = new Set();
        this.questProgress = new Map();
        
        // 初始化任务数据
        this.initializeQuests();
    }

    /**
     * 初始化任务数据
     */
    initializeQuests() {
        // 主线任务
        this.quests.set('main_01', {
            id: 'main_01',
            name: '初入魔法学院',
            type: 'main',
            description: '欢迎来到埃瑟里亚魔法学院！首先熟悉一下校园环境，与三位导师对话。',
            objectives: [
                {
                    id: 'talk_to_fire_master',
                    description: '与火焰导师对话',
                    type: 'talk',
                    target: 'npc_fire_master',
                    current: 0,
                    required: 1
                },
                {
                    id: 'talk_to_ice_master',
                    description: '与冰霜导师对话',
                    type: 'talk',
                    target: 'npc_ice_master',
                    current: 0,
                    required: 1
                },
                {
                    id: 'talk_to_thunder_master',
                    description: '与雷电导师对话',
                    type: 'talk',
                    target: 'npc_thunder_master',
                    current: 0,
                    required: 1
                }
            ],
            rewards: {
                exp: 50,
                gold: 100,
                items: ['basic-wand']
            },
            prerequisites: [],
            autoAccept: true,
            nextQuest: 'main_02'
        });

        this.quests.set('main_02', {
            id: 'main_02',
            name: '元素亲和力测试',
            type: 'main',
            description: '每位魔法师都需要了解自己的元素亲和力。完成元素测试，确定你的专精方向。',
            objectives: [
                {
                    id: 'complete_element_test',
                    description: '完成元素亲和力测试',
                    type: 'custom',
                    target: 'element_test',
                    current: 0,
                    required: 1
                }
            ],
            rewards: {
                exp: 100,
                gold: 150,
                spells: ['fireball', 'ice-shard', 'lightning-bolt', 'vine-grasp']
            },
            prerequisites: ['main_01'],
            nextQuest: 'main_03'
        });

        this.quests.set('main_03', {
            id: 'main_03',
            name: '第一次实战训练',
            type: 'main',
            description: '理论与实践相结合。在训练场击败5个魔法傀儡，证明你的实力。',
            objectives: [
                {
                    id: 'defeat_training_dummies',
                    description: '击败魔法傀儡',
                    type: 'kill',
                    target: 'training-dummy',
                    current: 0,
                    required: 5
                }
            ],
            rewards: {
                exp: 150,
                gold: 200,
                items: ['apprentice-robe']
            },
            prerequisites: ['main_02'],
            nextQuest: 'main_04'
        });

        this.quests.set('main_04', {
            id: 'main_04',
            name: '混沌的预兆',
            type: 'main',
            description: '学院附近的元素平衡开始紊乱。调查火峡谷的异常现象。',
            objectives: [
                {
                    id: 'investigate_fire_canyon',
                    description: '调查火峡谷',
                    type: 'explore',
                    target: 'fire-canyon',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_fire_elementals',
                    description: '击败火焰元素',
                    type: 'kill',
                    target: 'fire-elemental',
                    current: 0,
                    required: 10
                }
            ],
            rewards: {
                exp: 200,
                gold: 300,
                items: ['fire-crystal']
            },
            prerequisites: ['main_03'],
            nextQuest: 'main_05'
        });

        this.quests.set('main_05', {
            id: 'main_05',
            name: '冰原的秘密',
            type: 'main',
            description: '冰霜导师发现冰原的魔法波动异常。前往调查并收集冰霜样本。',
            objectives: [
                {
                    id: 'investigate_ice_plains',
                    description: '调查冰原',
                    type: 'explore',
                    target: 'ice-plains',
                    current: 0,
                    required: 1
                },
                {
                    id: 'collect_ice_samples',
                    description: '收集冰霜样本',
                    type: 'collect',
                    target: 'ice-sample',
                    current: 0,
                    required: 5
                },
                {
                    id: 'defeat_ice_wolves',
                    description: '击败冰霜狼',
                    type: 'kill',
                    target: 'ice-wolf',
                    current: 0,
                    required: 8
                }
            ],
            rewards: {
                exp: 250,
                gold: 400,
                items: ['ice-crystal', 'frost-wand']
            },
            prerequisites: ['main_04'],
            nextQuest: 'main_06'
        });

        this.quests.set('main_06', {
            id: 'main_06',
            name: '雷电高原的试炼',
            type: 'main',
            description: '雷电导师要求你在雷电高原完成雷电试炼，掌握雷电魔法的精髓。',
            objectives: [
                {
                    id: 'complete_thunder_trial',
                    description: '完成雷电试炼',
                    type: 'custom',
                    target: 'thunder-trial',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_thunder_bats',
                    description: '击败雷电蝙蝠',
                    type: 'kill',
                    target: 'thunder-bat',
                    current: 0,
                    required: 12
                }
            ],
            rewards: {
                exp: 300,
                gold: 500,
                items: ['thunder-crystal', 'storm-staff']
            },
            prerequisites: ['main_05'],
            nextQuest: 'main_07'
        });

        this.quests.set('main_07', {
            id: 'main_07',
            name: '自然森林的呼唤',
            type: 'main',
            description: '自然的力量在召唤你。前往自然森林，与自然精灵对话，学习治愈魔法。',
            objectives: [
                {
                    id: 'talk_to_nature_spirit',
                    description: '与自然精灵对话',
                    type: 'talk',
                    target: 'npc_nature_spirit',
                    current: 0,
                    required: 1
                },
                {
                    id: 'heal_wounded_animals',
                    description: '治愈受伤的动物',
                    type: 'heal',
                    target: 'wounded-animal',
                    current: 0,
                    required: 5
                },
                {
                    id: 'defeat_corrupted_trees',
                    description: '击败腐化的树木',
                    type: 'kill',
                    target: 'corrupted-tree',
                    current: 0,
                    required: 6
                }
            ],
            rewards: {
                exp: 350,
                gold: 600,
                items: ['nature-crystal', 'staff-of-life'],
                spells: ['heal', 'nature-blessing']
            },
            prerequisites: ['main_06'],
            nextQuest: 'main_08'
        });

        this.quests.set('main_08', {
            id: 'main_08',
            name: '混沌裂隙的出现',
            type: 'main',
            description: '一个巨大的混沌裂隙出现在学院附近！这是前所未有的威胁，必须立即调查。',
            objectives: [
                {
                    id: 'investigate_chaos_rift',
                    description: '调查混沌裂隙',
                    type: 'explore',
                    target: 'chaos-rift',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_chaos_servants',
                    description: '击败混沌仆从',
                    type: 'kill',
                    target: 'chaos-servant',
                    current: 0,
                    required: 15
                },
                {
                    id: 'seal_minor_rifts',
                    description: '封印小型裂隙',
                    type: 'interact',
                    target: 'minor-chaos-rift',
                    current: 0,
                    required: 3
                }
            ],
            rewards: {
                exp: 400,
                gold: 800,
                items: ['chaos-fragment', 'seal-of-order']
            },
            prerequisites: ['main_07'],
            nextQuest: 'main_09'
        });

        this.quests.set('main_09', {
            id: 'main_09',
            name: '四大元素的平衡',
            type: 'main',
            description: '为了对抗混沌的力量，必须重新平衡四大元素。收集四种元素精华。',
            objectives: [
                {
                    id: 'collect_fire_essence',
                    description: '收集火焰精华',
                    type: 'collect',
                    target: 'fire-essence',
                    current: 0,
                    required: 1
                },
                {
                    id: 'collect_ice_essence',
                    description: '收集冰霜精华',
                    type: 'collect',
                    target: 'ice-essence',
                    current: 0,
                    required: 1
                },
                {
                    id: 'collect_thunder_essence',
                    description: '收集雷电精华',
                    type: 'collect',
                    target: 'thunder-essence',
                    current: 0,
                    required: 1
                },
                {
                    id: 'collect_nature_essence',
                    description: '收集自然精华',
                    type: 'collect',
                    target: 'nature-essence',
                    current: 0,
                    required: 1
                }
            ],
            rewards: {
                exp: 500,
                gold: 1000,
                items: ['elemental-orb', 'master-robe']
            },
            prerequisites: ['main_08'],
            nextQuest: 'main_10'
        });

        this.quests.set('main_10', {
            id: 'main_10',
            name: '最终决战：混沌领主',
            type: 'main',
            description: '混沌领主即将降临！准备迎接最终决战，拯救埃瑟里亚大陆。',
            objectives: [
                {
                    id: 'defeat_chaos_knight',
                    description: '击败混沌骑士',
                    type: 'kill',
                    target: 'chaos-knight',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_shadow_mage',
                    description: '击败暗影法师',
                    type: 'kill',
                    target: 'shadow-mage',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_abyss_beast',
                    description: '击败深渊巨兽',
                    type: 'kill',
                    target: 'abyss-beast',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_chaos_lord_clone',
                    description: '击败混沌领主分身',
                    type: 'kill',
                    target: 'chaos-lord-clone',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_chaos_lord',
                    description: '击败混沌领主',
                    type: 'kill',
                    target: 'chaos-lord',
                    current: 0,
                    required: 1
                }
            ],
            rewards: {
                exp: 1000,
                gold: 2000,
                items: ['chaos-crown', 'legendary-robe', 'ultimate-wand'],
                spells: ['chaos-bolt', 'reality-tear']
            },
            prerequisites: ['main_09'],
            isFinalQuest: true
        });

        // 支线任务
        this.quests.set('side_01', {
            id: 'side_01',
            name: '草药收集',
            type: 'side',
            description: '炼金师需要一些草药来制作治疗药水。',
            objectives: [
                {
                    id: 'collect_herbs',
                    description: '收集草药',
                    type: 'collect',
                    target: 'herb',
                    current: 0,
                    required: 10
                }
            ],
            rewards: {
                exp: 50,
                gold: 100,
                items: ['health-potion', 'mana-potion']
            },
            prerequisites: ['main_01']
        });

        this.quests.set('side_02', {
            id: 'side_02',
            name: '失落的魔法书',
            type: 'side',
            description: '图书管理员发现有几本珍贵的魔法书丢失了。',
            objectives: [
                {
                    id: 'find_lost_books',
                    description: '找到失落的魔法书',
                    type: 'collect',
                    target: 'lost-book',
                    current: 0,
                    required: 3
                }
            ],
            rewards: {
                exp: 80,
                gold: 150,
                items: ['magic-scroll', 'knowledge-crystal']
            },
            prerequisites: ['main_02']
        });

        this.quests.set('side_03', {
            id: 'side_03',
            name: '元素结晶收集',
            type: 'side',
            description: '铁匠需要元素结晶来锻造魔法装备。',
            objectives: [
                {
                    id: 'collect_fire_crystals',
                    description: '收集火焰结晶',
                    type: 'collect',
                    target: 'fire-crystal',
                    current: 0,
                    required: 5
                },
                {
                    id: 'collect_ice_crystals',
                    description: '收集冰霜结晶',
                    type: 'collect',
                    target: 'ice-crystal',
                    current: 0,
                    required: 5
                },
                {
                    id: 'collect_thunder_crystals',
                    description: '收集雷电结晶',
                    type: 'collect',
                    target: 'thunder-crystal',
                    current: 0,
                    required: 5
                },
                {
                    id: 'collect_nature_crystals',
                    description: '收集自然结晶',
                    type: 'collect',
                    target: 'nature-crystal',
                    current: 0,
                    required: 5
                }
            ],
            rewards: {
                exp: 200,
                gold: 500,
                items: ['elemental-ring', 'crafting-materials']
            },
            prerequisites: ['main_06']
        });

        this.quests.set('side_04', {
            id: 'side_04',
            name: '守护者的挑战',
            type: 'side',
            description: '传说中的元素守护者出现了，击败它们获得强大的力量。',
            objectives: [
                {
                    id: 'defeat_fire_lord',
                    description: '击败火焰领主',
                    type: 'kill',
                    target: 'fire-lord',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_ice_queen',
                    description: '击败冰霜女王',
                    type: 'kill',
                    target: 'ice-queen',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_thunder_messenger',
                    description: '击败雷电使者',
                    type: 'kill',
                    target: 'thunder-messenger',
                    current: 0,
                    required: 1
                },
                {
                    id: 'defeat_nature_guardian',
                    description: '击败自然守护者',
                    type: 'kill',
                    target: 'nature-guardian',
                    current: 0,
                    required: 1
                }
            ],
            rewards: {
                exp: 500,
                gold: 1000,
                items: ['guardian-badge', 'elemental-mastery'],
                spells: ['elemental-fusion']
            },
            prerequisites: ['main_08']
        });

        this.quests.set('side_05', {
            id: 'side_05',
            name: '混沌研究',
            type: 'side',
            description: '学者想要研究混沌的本质。收集混沌碎片并交给学者。',
            objectives: [
                {
                    id: 'collect_chaos_fragments',
                    description: '收集混沌碎片',
                    type: 'collect',
                    target: 'chaos-fragment',
                    current: 0,
                    required: 20
                }
            ],
            rewards: {
                exp: 300,
                gold: 800,
                items: ['chaos-research-notes', 'chaos-resistance-potion']
            },
            prerequisites: ['main_08']
        });

        this.quests.set('side_06', {
            id: 'side_06',
            name: '传奇装备锻造',
            type: 'side',
            description: '传说中的铁匠可以为你锻造传奇装备，但需要稀有的材料。',
            objectives: [
                {
                    id: 'collect_chaos_cores',
                    description: '收集混沌核心',
                    type: 'collect',
                    target: 'chaos-core',
                    current: 0,
                    required: 10
                },
                {
                    id: 'collect_elemental_orbs',
                    description: '收集元素宝珠',
                    type: 'collect',
                    target: 'elemental-orb',
                    current: 0,
                    required: 4
                }
            ],
            rewards: {
                exp: 400,
                gold: 1500,
                items: ['legendary-weapon', 'legendary-armor']
            },
            prerequisites: ['main_09']
        });

        // 日常任务
        this.quests.set('daily_01', {
            id: 'daily_01',
            name: '日常训练',
            type: 'daily',
            description: '完成日常魔法训练，保持技能的熟练度。',
            objectives: [
                {
                    id: 'cast_spells',
                    description: '施放任意魔法',
                    type: 'cast',
                    target: 'any-spell',
                    current: 0,
                    required: 20
                }
            ],
            rewards: {
                exp: 100,
                gold: 200,
                items: ['training-token']
            },
            prerequisites: [],
            daily: true,
            resetTime: 24 * 60 * 60 * 1000 // 24小时
        });

        this.quests.set('daily_02', {
            id: 'daily_02',
            name: '元素收集',
            type: 'daily',
            description: '收集元素结晶，为学院的魔法研究做贡献。',
            objectives: [
                {
                    id: 'collect_any_crystals',
                    description: '收集任意元素结晶',
                    type: 'collect',
                    target: 'any-crystal',
                    current: 0,
                    required: 10
                }
            ],
            rewards: {
                exp: 80,
                gold: 150,
                items: ['crystal-pouch']
            },
            prerequisites: [],
            daily: true,
            resetTime: 24 * 60 * 60 * 1000
        });

        this.quests.set('daily_03', {
            id: 'daily_03',
            name: '魔兽狩猎',
            type: 'daily',
            description: '清除学院周围的危险魔兽，保护大家的安全。',
            objectives: [
                {
                    id: 'defeat_any_monsters',
                    description: '击败任意魔兽',
                    type: 'kill',
                    target: 'any-monster',
                    current: 0,
                    required: 15
                }
            ],
            rewards: {
                exp: 120,
                gold: 300,
                items: ['hunting-trophy']
            },
            prerequisites: [],
            daily: true,
            resetTime: 24 * 60 * 60 * 1000
        });
    }

    /**
     * 接受任务
     * @param {string} questId - 任务ID
     * @returns {boolean} 是否成功接受任务
     */
    acceptQuest(questId) {
        const quest = this.quests.get(questId);
        if (!quest) {
            console.error(`任务不存在: ${questId}`);
            return false;
        }

        // 检查是否已完成
        if (this.completedQuests.has(questId)) {
            this.game.uiController.showNotification('你已经完成过这个任务了！');
            return false;
        }

        // 检查是否已接受
        if (this.activeQuests.has(questId)) {
            this.game.uiController.showNotification('你已经接受了这个任务！');
            return false;
        }

        // 检查前置条件
        if (quest.prerequisites && quest.prerequisites.length > 0) {
            for (const prereq of quest.prerequisites) {
                if (!this.completedQuests.has(prereq)) {
                    this.game.uiController.showNotification('你还没有满足接受这个任务的条件！');
                    return false;
                }
            }
        }

        // 接受任务
        this.activeQuests.add(questId);
        
        // 初始化任务进度
        if (!this.questProgress.has(questId)) {
            this.questProgress.set(questId, {
                startedAt: Date.now(),
                objectives: new Map(),
                status: 'active'
            });
        }

        // 初始化目标进度
        const progress = this.questProgress.get(questId);
        for (const objective of quest.objectives) {
            progress.objectives.set(objective.id, {
                current: 0,
                completed: false
            });
        }

        this.game.uiController.showNotification(`接受了任务：${quest.name}`);
        this.game.uiController.updateQuestPanel();
        
        // 触发任务开始事件
        this.game.eventBus.emit('questStarted', { questId, quest });
        
        return true;
    }

    /**
     * 更新任务进度
     * @param {string} objectiveType - 目标类型
     * @param {string} target - 目标ID
     * @param {number} amount - 数量
     * @param {Object} context - 上下文信息
     */
    updateProgress(objectiveType, target, amount = 1, context = {}) {
        for (const questId of this.activeQuests) {
            const quest = this.quests.get(questId);
            const progress = this.questProgress.get(questId);
            
            if (!quest || !progress) continue;
            
            for (const objective of quest.objectives) {
                if (objective.type === objectiveType && 
                    (objective.target === target || objective.target === 'any-' + objectiveType || 
                     (objectiveType === 'kill' && target.includes('monster')))) {
                    
                    const objProgress = progress.objectives.get(objective.id);
                    if (!objProgress.completed) {
                        objProgress.current += amount;
                        
                        // 检查是否完成
                        if (objProgress.current >= objective.required) {
                            objProgress.completed = true;
                            this.game.uiController.showNotification(`任务目标完成：${objective.description}`);
                        } else {
                            this.game.uiController.showNotification(`任务进度：${objective.description} (${objProgress.current}/${objective.required})`);
                        }
                        
                        // 更新UI
                        this.game.uiController.updateQuestPanel();
                        
                        // 检查任务是否完成
                        this.checkQuestCompletion(questId);
                    }
                }
            }
        }
    }

    /**
     * 检查任务是否完成
     * @param {string} questId - 任务ID
     */
    checkQuestCompletion(questId) {
        const quest = this.quests.get(questId);
        const progress = this.questProgress.get(questId);
        
        if (!quest || !progress) return;
        
        // 检查所有目标是否完成
        let allCompleted = true;
        for (const objective of quest.objectives) {
            const objProgress = progress.objectives.get(objective.id);
            if (!objProgress || !objProgress.completed) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted) {
            this.completeQuest(questId);
        }
    }

    /**
     * 完成任务
     * @param {string} questId - 任务ID
     */
    completeQuest(questId) {
        const quest = this.quests.get(questId);
        const progress = this.questProgress.get(questId);
        
        if (!quest || !progress) return;
        
        // 给予奖励
        if (quest.rewards) {
            // 经验值
            if (quest.rewards.exp) {
                this.game.playerController.gainExperience(quest.rewards.exp);
            }
            
            // 金币
            if (quest.rewards.gold) {
                this.game.inventorySystem.addGold(quest.rewards.gold);
            }
            
            // 物品
            if (quest.rewards.items) {
                for (const item of quest.rewards.items) {
                    this.game.inventorySystem.addItem(item);
                }
            }
            
            // 法术
            if (quest.rewards.spells) {
                for (const spell of quest.rewards.spells) {
                    this.game.spellSystem.learnSpell(spell);
                }
            }
        }
        
        // 更新任务状态
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        progress.status = 'completed';
        progress.completedAt = Date.now();
        
        this.game.uiController.showNotification(`任务完成：${quest.name}！`);
        this.game.uiController.updateQuestPanel();
        
        // 触发任务完成事件
        this.game.eventBus.emit('questCompleted', { questId, quest });
        
        // 自动接受下一个任务
        if (quest.nextQuest) {
            setTimeout(() => {
                this.acceptQuest(quest.nextQuest);
            }, 2000);
        }
        
        // 检查是否是最终任务
        if (quest.isFinalQuest) {
            setTimeout(() => {
                this.game.showGameEnding();
            }, 3000);
        }
    }

    /**
     * 放弃任务
     * @param {string} questId - 任务ID
     */
    abandonQuest(questId) {
        if (!this.activeQuests.has(questId)) {
            this.game.uiController.showNotification('你没有接受这个任务！');
            return false;
        }
        
        const quest = this.quests.get(questId);
        this.activeQuests.delete(questId);
        
        const progress = this.questProgress.get(questId);
        if (progress) {
            progress.status = 'abandoned';
            progress.abandonedAt = Date.now();
        }
        
        this.game.uiController.showNotification(`放弃了任务：${quest.name}`);
        this.game.uiController.updateQuestPanel();
        
        return true;
    }

    /**
     * 获取任务状态
     * @param {string} questId - 任务ID
     * @returns {string} 任务状态
     */
    getQuestStatus(questId) {
        if (this.activeQuests.has(questId)) return 'active';
        if (this.completedQuests.has(questId)) return 'completed';
        if (this.failedQuests.has(questId)) return 'failed';
        
        const quest = this.quests.get(questId);
        if (quest && quest.prerequisites && quest.prerequisites.length > 0) {
            for (const prereq of quest.prerequisites) {
                if (!this.completedQuests.has(prereq)) {
                    return 'locked';
                }
            }
        }
        
        return 'available';
    }

    /**
     * 获取任务进度
     * @param {string} questId - 任务ID
     * @returns {Object} 任务进度
     */
    getQuestProgress(questId) {
        return this.questProgress.get(questId);
    }

    /**
     * 获取所有可接受的任务
     * @returns {Array} 可接受的任务列表
     */
    getAvailableQuests() {
        const available = [];
        
        for (const [questId, quest] of this.quests) {
            const status = this.getQuestStatus(questId);
            if (status === 'available') {
                available.push({ questId, quest });
            }
        }
        
        return available;
    }

    /**
     * 获取活动任务
     * @returns {Array} 活动任务列表
     */
    getActiveQuests() {
        const active = [];
        for (const questId of this.activeQuests) {
            const quest = this.findQuest(questId);
            if (quest) active.push(quest);
        }
        return active;
    }
}