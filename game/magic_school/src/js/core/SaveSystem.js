/**
 * 存档系统
 * 负责保存和加载游戏进度
 */
export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.saveKey = 'aetheria_magic_school_save';
    }

    /**
     * 保存游戏
     */
    saveGame() {
        const saveData = {
            // 玩家数据
            player: {
                level: this.game.playerController.level,
                experience: this.game.playerController.experience,
                health: this.game.playerController.health,
                maxHealth: this.game.playerController.maxHealth,
                mana: this.game.playerController.mana,
                maxMana: this.game.playerController.maxMana,
                attack: this.game.playerController.attack,
                defense: this.game.playerController.defense,
                castSpeed: this.game.playerController.castSpeed,
                specialization: this.game.playerController.specialization,
                position: {
                    x: this.game.playerController.position.x,
                    y: this.game.playerController.position.y,
                    z: this.game.playerController.position.z
                },
                appearance: {
                    gender: this.game.playerController.gender,
                    hairStyle: this.game.playerController.hairStyle,
                    hairColor: this.game.playerController.hairColor,
                    robe: this.game.playerController.robe,
                    wand: this.game.playerController.wand,
                    accessory: this.game.playerController.accessory
                },
                gold: this.game.playerController.gold,
                learnedSpells: this.game.playerController.learnedSpells,
                selectedSpell: this.game.playerController.selectedSpell
            },

            // 场景数据
            scene: {
                currentSceneId: this.game.sceneManager.currentSceneIndex,
                sceneOrder: this.game.sceneManager.sceneOrder
            },

            // 任务数据
            quests: {
                mainQuests: this.game.questSystem.mainQuests,
                sideQuests: this.game.questSystem.sideQuests,
                dailyQuests: this.game.questSystem.dailyQuests,
                lastDailyReset: this.game.questSystem.lastDailyReset
            },

            // 物品数据
            inventory: this.game.inventorySystem.items,

            // 游戏统计
            stats: {
                playTime: this.game.stats.playTime,
                enemiesKilled: this.game.stats.enemiesKilled,
                spellsCast: this.game.stats.spellsCast,
                damageDealt: this.game.stats.damageDealt,
                damageTaken: this.game.stats.damageTaken
            },

            // 保存时间
            timestamp: Date.now()
        };

        // 将数据转换为JSON字符串并存储到localStorage
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            this.game.uiController.showNotification('游戏已保存');
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            this.game.uiController.showNotification('保存游戏失败', 'error');
            return false;
        }
    }

    /**
     * 加载游戏
     */
    loadGame() {
        try {
            const saveDataString = localStorage.getItem(this.saveKey);

            if (!saveDataString) {
                console.log('没有找到存档，开始新游戏');
                return false;
            }

            const saveData = JSON.parse(saveDataString);

            // 加载玩家数据
            if (saveData.player) {
                this.game.playerController.level = saveData.player.level || 1;
                this.game.playerController.experience = saveData.player.experience || 0;
                this.game.playerController.health = saveData.player.health || 100;
                this.game.playerController.maxHealth = saveData.player.maxHealth || 100;
                this.game.playerController.mana = saveData.player.mana || 80;
                this.game.playerController.maxMana = saveData.player.maxMana || 80;
                this.game.playerController.attack = saveData.player.attack || 10;
                this.game.playerController.defense = saveData.player.defense || 5;
                this.game.playerController.castSpeed = saveData.player.castSpeed || 1.0;
                this.game.playerController.specialization = saveData.player.specialization || null;

                if (saveData.player.position) {
                    this.game.playerController.position.set(
                        saveData.player.position.x,
                        saveData.player.position.y,
                        saveData.player.position.z
                    );
                }

                if (saveData.player.appearance) {
                    this.game.playerController.gender = saveData.player.appearance.gender || 'male';
                    this.game.playerController.hairStyle = saveData.player.appearance.hairStyle || 'short';
                    this.game.playerController.hairColor = saveData.player.appearance.hairColor || 'black';
                    this.game.playerController.robe = saveData.player.appearance.robe || 'basic';
                    this.game.playerController.wand = saveData.player.appearance.wand || 'basic';
                    this.game.playerController.accessory = saveData.player.appearance.accessory || null;
                }

                this.game.playerController.gold = saveData.player.gold || 100;
                this.game.playerController.learnedSpells = saveData.player.learnedSpells || [];
                this.game.playerController.selectedSpell = saveData.player.selectedSpell || null;
            }

            // 加载场景数据
            if (saveData.scene) {
                this.game.sceneManager.currentSceneIndex = saveData.scene.currentSceneId || 0;
                if (saveData.scene.sceneOrder) {
                    this.game.sceneManager.sceneOrder = saveData.scene.sceneOrder;
                }
            }

            // 加载任务数据
            if (saveData.quests) {
                if (saveData.quests.mainQuests) {
                    this.game.questSystem.mainQuests = saveData.quests.mainQuests;
                }
                if (saveData.quests.sideQuests) {
                    this.game.questSystem.sideQuests = saveData.quests.sideQuests;
                }
                if (saveData.quests.dailyQuests) {
                    this.game.questSystem.dailyQuests = saveData.quests.dailyQuests;
                }
                if (saveData.quests.lastDailyReset) {
                    this.game.questSystem.lastDailyReset = saveData.quests.lastDailyReset;
                }
            }

            // 加载物品数据
            if (saveData.inventory) {
                this.game.inventorySystem.items = saveData.inventory;
            }

            // 加载游戏统计
            if (saveData.stats) {
                this.game.stats.playTime = saveData.stats.playTime || 0;
                this.game.stats.enemiesKilled = saveData.stats.enemiesKilled || 0;
                this.game.stats.spellsCast = saveData.stats.spellsCast || 0;
                this.game.stats.damageDealt = saveData.stats.damageDealt || 0;
                this.game.stats.damageTaken = saveData.stats.damageTaken || 0;
            }

            // 更新UI
            this.game.uiController.updateAll();

            // 加载对应场景
            const sceneId = this.game.sceneManager.sceneOrder[this.game.sceneManager.currentSceneIndex];
            this.game.sceneManager.loadScene(sceneId);

            console.log('游戏加载成功');
            return true;
        } catch (error) {
            console.error('加载游戏失败:', error);
            this.game.uiController.showNotification('加载游戏失败', 'error');
            return false;
        }
    }

    /**
     * 检查是否有存档
     */
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * 删除存档
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('删除存档失败:', error);
            return false;
        }
    }

    /**
     * 自动保存
     */
    autoSave() {
        this.saveGame();
    }
}


