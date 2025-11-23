/**武器
 * NPC控制器
 * 负责管理游戏中的所有NPC角色
 */
import * as THREE from 'three';
export class NPCController {
    constructor(game) {
        this.game = game;
        this.npcs = new Map();
        this.currentDialogue = null;
        this.dialogueOptions = [];
    }

    /**
     * 根据NPC模型ID获取对应的颜色
     * @param {string} modelId - 模型ID
     * @returns {number} 颜色值
     */
    getNPCColor(modelId) {
        const colorMap = {
            'npc-merchant': 0xffd700,    // 金色 - 商人
            'npc-mentor': 0x4169e1,      // 蓝色 - 导师
            'npc-villager': 0x8b4513,    // 棕色 - 村民
            'npc-guard': 0x696969,       // 灰色 - 守卫
            'npc-mage': 0x9400d3,        // 紫色 - 法师
        };
        
        return colorMap[modelId] || 0x8888ff; // 默认紫色
    }

    /**
     * 添加NPC到场景
     * @param {Object} npcConfig - NPC配置对象
     * @param {string} npcConfig.id - NPC唯一ID
     * @param {string} npcConfig.name - NPC名称
     * @param {THREE.Vector3} npcConfig.position - NPC位置
     * @param {string} [npcConfig.modelId] - NPC模型ID
     * @param {Object} [npcConfig.dialogue] - 对话数据
     * @param {Object} [npcConfig.quest] - 任务数据
     * @param {Object} [npcConfig.shop] - 商店数据
     */
    addNPC(npcConfig) {
        // 检查必要的参数
        if (!npcConfig.id) {
            console.error('NPC ID is required');
            return;
        }
        
        if (!npcConfig.name) {
            console.error(`NPC ${npcConfig.id} is missing required 'name' field`);
            return;
        }
        
        if (!npcConfig.position) {
            console.error(`NPC ${npcConfig.id} is missing required 'position' field`);
            return;
        }

        const npc = {
            id: npcConfig.id,
            name: npcConfig.name,
            position: npcConfig.position.clone(),
            model: null,
            modelId: npcConfig.modelId || 'npc-villager', // 默认使用村民模型
            dialogue: npcConfig.dialogue || [],
            quest: npcConfig.quest || null,
            shop: npcConfig.shop || null,
            isInteractable: true,
            interactionDistance: 3.0
        };

        this.npcs.set(npcConfig.id, npc);
        this.loadNPCModel(npc);
    }

       /**
     * 加载NPC模型
     * @param {Object} npc - NPC对象
     */
    async loadNPCModel(npc) {
        try {
            // 尝试从ResourceManager获取NPC模型
            let npcModel = null;
            
            if (this.game.resourceManager && this.game.resourceManager.resources) {
                npcModel = this.game.resourceManager.getResource('models', npc.modelId);
            }
            
            if (npcModel) {
                // 使用ResourceManager中的模型
                npc.model = npcModel.clone();
                npc.model.position.copy(npc.position);
                npc.model.castShadow = true;
                npc.model.receiveShadow = true;
                npc.model.userData = { type: 'npc', id: npc.id };
                
                console.log(`成功加载NPC模型: ${npc.name} (${npc.modelId})`);
            } else {
                // 回退到简单的几何体作为占位符
                console.warn(`未找到NPC模型: ${npc.modelId}，使用占位符模型`);
                // 使用SphereGeometry替代CapsuleGeometry，因为当前Three.js版本不支持
                const geometry = new THREE.SphereGeometry(0.8, 16, 16);
                const material = new THREE.MeshPhongMaterial({ 
                    color: this.getNPCColor(npc.modelId),
                    transparent: true,
                    opacity: 0.9
                });
                
                npc.model = new THREE.Mesh(geometry, material);
                npc.model.position.copy(npc.position);
                npc.model.castShadow = true;
                npc.model.receiveShadow = true;
                npc.model.userData = { type: 'npc', id: npc.id };
            }

            // 添加NPC头顶的感叹号标记（如果有任务）
            if (npc.quest && !this.game.questSystem.isQuestCompleted(npc.quest)) {
                this.addQuestMarker(npc);
            }

            this.game.sceneManager.scene.add(npc.model);
        } catch (error) {
            console.error(`加载NPC模型失败: ${npc.id}`, error);
            
            // 严重错误时的最终回退
            const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            npc.model = new THREE.Mesh(geometry, material);
            npc.model.position.copy(npc.position);
            npc.model.userData = { type: 'npc', id: npc.id };
            this.game.sceneManager.scene.add(npc.model);
        }
    }

    /**
     * 添加任务标记
     * @param {Object} npc - NPC对象
     */
    addQuestMarker(npc) {
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 2, 0); // 头顶上方
        npc.model.add(marker);

        // 添加发光效果
        const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 2, 0);
        npc.model.add(glow);
    }

    /**
     * 检查玩家是否可以与NPC交互
     * @param {string} npcId - NPC ID
     * @returns {boolean} 是否可以交互
     */
    canInteractWithNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.isInteractable) return false;

        const player = this.game.playerController;
        const distance = npc.position.distanceTo(player.position);
        
        return distance <= npc.interactionDistance;
    }

    /**
     * 开始与NPC对话
     * @param {string} npcId - NPC ID
     */
    startDialogue(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        if (!this.canInteractWithNPC(npcId)) {
            this.game.uiController.showNotification('距离太远，无法交谈');
            return;
        }

        // 停止玩家移动
        this.game.playerController.isInteracting = true;

        // 显示对话界面
        this.showDialogue(npc);
    }

    /**
     * 与NPC交互
     * @param {string} npcId - NPC ID
     */
    interactWithNPC(npcId) {
        this.startDialogue(npcId);
    }

    /**
     * 显示对话
     * @param {Object} npc - NPC对象
     */
    showDialogue(npc) {
        const dialogue = this.getAvailableDialogue(npc);
        if (dialogue.length === 0) {
            this.game.uiController.showDialogue(npc.name, '我没有什么可以告诉你的了。');
            return;
        }

        // 选择第一个可用对话
        const currentDialogue = dialogue[0];
        
        this.game.uiController.showDialogue(
            npc.name,
            currentDialogue.text,
            currentDialogue.options || []
        );

        this.currentDialogue = currentDialogue;
    }

    /**
     * 获取可用的对话选项
     * @param {Object} npc - NPC对象
     * @returns {Array} 可用对话数组
     */
    getAvailableDialogue(npc) {
        const available = [];
        
        for (const dialogue of npc.dialogue) {
            // 检查对话条件
            if (this.checkDialogueConditions(dialogue.conditions)) {
                available.push(dialogue);
            }
        }
        
        return available;
    }

    /**
     * 检查对话条件
     * @param {Array} conditions - 条件数组
     * @returns {boolean} 是否满足条件
     */
    checkDialogueConditions(conditions) {
        if (!conditions || conditions.length === 0) return true;
        
        for (const condition of conditions) {
            switch (condition.type) {
                case 'level':
                    if (this.game.playerController.level < condition.value) return false;
                    break;
                case 'quest':
                    const questStatus = this.game.questSystem.getQuestStatus(condition.questId);
                    if (questStatus !== condition.status) return false;
                    break;
                case 'item':
                    if (!this.game.inventorySystem.hasItem(condition.itemId, condition.count)) return false;
                    break;
                case 'specialization':
                    if (this.game.playerController.specialization !== condition.specialization) return false;
                    break;
            }
        }
        
        return true;
    }

    /**
     * 处理对话选项选择
     * @param {number} optionIndex - 选项索引
     */
    selectDialogueOption(optionIndex) {
        if (!this.currentDialogue || !this.currentDialogue.options) return;

        const option = this.currentDialogue.options[optionIndex];
        if (!option) return;

        // 执行选项效果
        if (option.effects) {
            this.executeDialogueEffects(option.effects);
        }

        // 显示回复
        if (option.reply) {
            this.game.uiController.updateDialogueText(option.reply);
        }

        // 结束对话
        if (option.endDialogue) {
            this.endDialogue();
        }
    }

    /**
     * 执行对话效果
     * @param {Array} effects - 效果数组
     */
    executeDialogueEffects(effects) {
        for (const effect of effects) {
            switch (effect.type) {
                case 'give_item':
                    this.game.inventorySystem.addItem(effect.itemId, effect.count || 1);
                    this.game.uiController.showNotification(`获得 ${effect.itemId} x${effect.count || 1}`);
                    break;
                case 'give_gold':
                    this.game.playerController.gold += effect.amount;
                    this.game.uiController.showNotification(`获得 ${effect.amount} 金币`);
                    break;
                case 'give_quest':
                    this.game.questSystem.addQuest(effect.questId);
                    this.game.uiController.showNotification('接受新任务');
                    break;
                case 'complete_quest':
                    this.game.questSystem.completeQuest(effect.questId);
                    break;
                case 'learn_spell':
                    this.game.spellSystem.learnSpell(effect.spellId);
                    break;
                case 'teleport':
                    this.game.playerController.position.set(effect.x, effect.y, effect.z);
                    break;
            }
        }
    }

    /**
     * 结束对话
     */
    endDialogue() {
        this.game.playerController.isInteracting = false;
        this.game.uiController.hideDialogue();
        this.currentDialogue = null;
    }

    /**
     * 更新NPC状态
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 更新NPC动画和逻辑
        for (const [id, npc] of this.npcs) {
            if (npc.model) {
                // 简单的待机动画
                npc.model.rotation.y += Math.sin(Date.now() * 0.001 + id.charCodeAt(0)) * 0.001;
            }
        }
    }

    /**
     * 获取附近的可交互NPC
     * @param {THREE.Vector3} position - 检查位置
     * @param {number} maxDistance - 最大距离
     * @returns {Object|null} 最近的NPC或null
     */
    getNearbyNPC(position, maxDistance = 5) {
        let nearestNPC = null;
        let minDistance = maxDistance;

        for (const [id, npc] of this.npcs) {
            if (!npc.isInteractable || !npc.model) continue;
            
            const distance = position.distanceTo(npc.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNPC = npc;
            }
        }

        return nearestNPC;
    }

    /**
     * 移除NPC
     * @param {string} id - NPC ID
     */
    removeNPC(id) {
        const npc = this.npcs.get(id);
        if (npc && npc.model) {
            this.game.sceneManager.scene.remove(npc.model);
        }
        this.npcs.delete(id);
    }

    /**
     * 清理所有NPC
     */
    clear() {
        for (const [id, npc] of this.npcs) {
            if (npc.model) {
                this.game.sceneManager.scene.remove(npc.model);
            }
        }
        this.npcs.clear();
        this.currentDialogue = null;
    }
}