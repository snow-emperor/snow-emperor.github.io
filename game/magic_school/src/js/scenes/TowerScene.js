/**
 * 星陨之塔场景
 * 游戏的初始场景，包含NPC、任务面板和存档石碑
 */
import * as THREE from 'three';
export class TowerScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.playerStartPosition = new THREE.Vector3(0, 0, 5);
        this.objects = [];
        this.lights = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x222244, 10, 100);

        // 设置光照
        this.setupLighting();

        // 加载场景模型
        await this.loadSceneModel();

        // 创建NPC
        this.createNPCs();

        // 创建物体
        this.createObjects();
    }

    /**
     * 加载场景
     */
    async load() {
        // 清空当前场景
        while (this.game.sceneManager.scene.children.length > 0) {
            this.game.sceneManager.scene.remove(this.game.sceneManager.scene.children[0]);
        }

        // 添加场景内容
        this.game.sceneManager.scene.add(this.scene);

        // 添加光照
        this.lights.forEach(light => {
            this.game.sceneManager.scene.add(light);
        });

        // 添加NPC - 使用新的NPCController
        this.game.npcController.loadNPCs();

        // 添加物体
        this.objects.forEach(object => {
            this.game.sceneManager.scene.add(object.model);
        });

        // 播放场景音乐
        this.game.audioController.playBackgroundMusic('tower-theme');
    }

    /**
     * 卸载场景
     */
    unload() {
        // 移除光照
        this.lights.forEach(light => {
            this.game.sceneManager.scene.remove(light);
        });

        // 移除NPC - 使用新的NPCController
        this.game.npcController.unloadNPCs();

        // 移除物体
        this.objects.forEach(object => {
            this.game.sceneManager.scene.remove(object.model);
        });
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 更新NPC - 使用新的NPCController
        this.game.npcController.update(deltaTime);

        // 更新物体
        this.objects.forEach(object => {
            if (object.update) {
                object.update(deltaTime);
            }
        });

        // 检查玩家交互
        this.checkPlayerInteraction();
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
        this.lights.push(ambientLight);

        // 主光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.lights.push(directionalLight);

        // 魔法光点
        const pointLight1 = new THREE.PointLight(0x8866ff, 0.5, 10);
        pointLight1.position.set(-5, 5, 0);
        this.lights.push(pointLight1);

        const pointLight2 = new THREE.PointLight(0x6688ff, 0.5, 10);
        pointLight2.position.set(5, 5, 0);
        this.lights.push(pointLight2);
    }

    /**
     * 加载场景模型
     */
    async loadSceneModel() {
        try {
            // 加载塔大厅模型
            const model = this.game.resourceManager.getResource('models', 'tower-scene');

            if (model) {
                this.scene.add(model.clone());
            } else {
                // 如果没有模型
                console.error('没有塔场景模型失败');
            }
        } catch (error) {
            console.error('加载塔场景模型失败:', error);
            
        }
    }
    /**
     * 创建NPC
     */
    createNPCs() {
        // 院长
    this.game.npcController.addNPC('headmaster', {
            name: '院长',
            position: new THREE.Vector3(0, 0, -5),
            modelId: 'headmaster',
            dialogue: {
                greeting: '欢迎来到星陨之塔，年轻的魔法师。我是这里的院长。你的天赋非常出色，但还需要不断学习和锻炼。首先，请选择你的元素专精，这将决定你未来能学习的咒语类型。',
                options: [
                    {
                        text: '选择专精',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showSpecializationSelection();
                        }
                    },
                    {
                        text: '告诉我更多关于魔法学院的事',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('星陨之塔是埃瑟里亚大陆最负盛名的魔法学院。这里培养了无数伟大的法师。每个法师都需要选择一个元素专精：火焰、冰霜、雷电或自然。');
                        }
                    },
                    {
                        text: '我该如何开始我的冒险？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('首先选择你的元素专精，然后向对应的导师学习基础咒语。之后你可以前往各个元素区域进行实战训练，提升你的魔法技能。');
                        }
                    }
                ]
            }
        });
        // 火焰导师
        this.game.npcController.addNPC('fire-tutor',{
            
            name: '火焰导师',
            position: new THREE.Vector3(-5, 0, 0),
            modelId: 'fire-tutor',
            dialogue: {
                greeting: '火焰是毁灭与重生的元素，掌握它需要强大的意志力。火焰咒语通常具有高伤害和持续效果，但消耗也较大。',
                options: [
                    {
                        text: '学习火焰咒语',
                        condition: () => this.game.playerController.specialization === 'fire',
                        effects: () => {
                            this.game.uiController.showSpellSelection('fire');
                        }
                    },
                    {
                        text: '火焰魔法的精髓是什么？',
                        condition: () => this.game.playerController.specialization === 'fire',
                        effects: () => {
                            this.game.uiController.showMessage('火焰魔法的精髓在于热情和毁灭的力量。当你释放火焰咒语时，要想象内心的热情转化为纯粹的破坏力。记住，火焰不仅能摧毁，也能净化。');
                        }
                    },
                    {
                        text: '我不是火焰专精',
                        condition: () => this.game.playerController.specialization !== 'fire',
                        effects: () => {
                            this.game.uiController.showMessage('你不是火焰专精的学生，无法学习火焰咒语。但如果你想了解火焰魔法，我可以告诉你：它是最具攻击性的元素魔法。');
                        }
                    }
                ]
            }
        });

        // 冰霜导师
        this.game.npcController.addNPC('ice-tutor',{
            
            name: '冰霜导师',
            position: new THREE.Vector3(-5, 0, 5),
            modelId: 'ice-tutor',
            dialogue: {
                greeting: '冰霜是控制与守护的元素，需要冷静的头脑。冰霜咒语通常具有控制效果和防御能力，适合稳健的战斗风格。',
                options: [
                    {
                        text: '学习冰霜咒语',
                        condition: () => this.game.playerController.specialization === 'ice',
                        effects: () => {
                            this.game.uiController.showSpellSelection('ice');
                        }
                    },
                    {
                        text: '冰霜魔法的秘密是什么？',
                        condition: () => this.game.playerController.specialization === 'ice',
                        effects: () => {
                            this.game.uiController.showMessage('冰霜魔法的秘密在于冷静和控制。当你施放冰霜咒语时，要保持内心的平静，让魔力像冰川一样缓慢但不可阻挡地流动。冰霜能冻结敌人的行动，也能保护你自己。');
                        }
                    },
                    {
                        text: '我不是冰霜专精',
                        condition: () => this.game.playerController.specialization !== 'ice',
                        effects: () => {
                            this.game.uiController.showMessage('你不是冰霜专精的学生，无法学习冰霜咒语。冰霜魔法需要特殊的体质和冷静的性格，不是所有人都能掌握。');
                        }
                    }
                ]
            }
        });

        // 雷电导师
        this.game.npcController.addNPC('thunder-tutor',{
            
            name: '雷电导师',
            position: new THREE.Vector3(5, 0, 0),
            modelId: 'thunder-tutor',
            dialogue: {
                greeting: '雷电是速度与力量的元素，需要敏锐的反应。雷电咒语通常具有高爆发和随机效果，适合快速战斗。',
                options: [
                    {
                        text: '学习雷电咒语',
                        condition: () => this.game.playerController.specialization === 'thunder',
                        effects: () => {
                            this.game.uiController.showSpellSelection('thunder');
                        }
                    },
                    {
                        text: '雷电魔法的奥义是什么？',
                        condition: () => this.game.playerController.specialization === 'thunder',
                        effects: () => {
                            this.game.uiController.showMessage('雷电魔法的奥义在于速度和精准。雷电是最快的元素，要求法师有敏锐的反应和精确的控制。当你释放雷电咒语时，要像闪电一样迅速和准确。');
                        }
                    },
                    {
                        text: '我不是雷电专精',
                        condition: () => this.game.playerController.specialization !== 'thunder',
                        effects: () => {
                            this.game.uiController.showMessage('你不是雷电专精的学生，无法学习雷电咒语。雷电魔法需要天赋和敏捷的思维，只有少数人能够真正掌握它的力量。');
                        }
                    }
                ]
            }
        });

        // 自然导师
        this.game.npcController.addNPC('nature-tutor',{
            
            name: '自然导师',
            position: new THREE.Vector3(5, 0, 5),
            modelId: 'nature-tutor',
            dialogue: {
                greeting: '自然是生命与成长的元素，需要耐心和智慧。自然咒语通常具有治疗和辅助效果，适合持久战斗。',
                options: [
                    {
                        text: '学习自然咒语',
                        condition: () => this.game.playerController.specialization === 'nature',
                        effects: () => {
                            this.game.uiController.showSpellSelection('nature');
                        }
                    },
                    {
                        text: '自然魔法的真谛是什么？',
                        condition: () => this.game.playerController.specialization === 'nature',
                        effects: () => {
                            this.game.uiController.showMessage('自然魔法的真谛在于和谐和平衡。自然是最温和的元素，但也是最持久的。当你使用自然咒语时，要感受大地的生命力，与自然融为一体。');
                        }
                    },
                    {
                        text: '我不是自然专精',
                        condition: () => this.game.playerController.specialization !== 'nature',
                        effects: () => {
                            this.game.uiController.showMessage('你不是自然专精的学生，无法学习自然咒语。自然魔法需要温和的心性和对生命的理解，它可能不是最华丽的，但绝对是最可靠的。');
                        }
                    }
                ]
            }
        });

        // 药剂师
        this.game.npcController.addNPC('alchemist',{
            
            name: '药剂师',
            position: new THREE.Vector3(0, 0, 5),
            modelId: 'alchemist',
            dialogue: {
                greeting: '我是这里的药剂师，可以为你提供各种药剂。生命药剂可以恢复你的生命值，魔法药剂可以恢复你的魔法值。需要购买药剂吗？',
                options: [
                    {
                        text: '购买药剂',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showShop('potions');
                        }
                    },
                    {
                        text: '你有什么好推荐？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('对于新手法师，我推荐准备一些生命药剂和魔法药剂。生命药剂能恢复50点生命值，魔法药剂能恢复30点魔法值。价格都很实惠。');
                        }
                    },
                    {
                        text: '药剂的效果是永久的吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('药剂的效果是暂时的，但它们能在关键时刻救你一命。记住，在战斗中合理使用药剂是法师生存的重要技能。');
                        }
                    }
                ]
            }
        });
    }

    /**
     * 创建物体
     */
    createObjects() {
        // 任务面板
        const taskBoard = {
            id: 'task-board',
            name: '任务面板',
            position: new THREE.Vector3(10, 1, 0),
            rotation: new THREE.Euler(0, -Math.PI / 2, 0),
            model: null,
            interaction: () => {
                this.game.uiController.togglePanel('quests-panel');
            },
            update: function(deltaTime) {
                // 物体可以有一些简单的动画或行为
                if (this.model) {
                    // 任务面板可以有微弱的光芒效果
                    const time = Date.now() * 0.001;
                    this.model.material.emissiveIntensity = 0.1 + Math.sin(time * 3) * 0.05;
                }
            }
        };

        // 加载任务面板模型
        const taskBoardModel = this.game.resourceManager.getResource('models','task-board');
        if (taskBoardModel) {
            taskBoard.model = taskBoardModel.clone();
            taskBoard.model.position.copy(taskBoard.position);
            taskBoard.model.rotation.copy(taskBoard.rotation);
            taskBoard.model.scale.set(1, 1, 1);

            // 确保材质可以发光
            taskBoard.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0x444466);
                    child.material.emissiveIntensity = 0.1;
                }
            });
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.BoxGeometry(2, 3, 0.2);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x666688,
                emissive: 0x222233,
                emissiveIntensity: 0.1
            });
            taskBoard.model = new THREE.Mesh(geometry, material);
            taskBoard.model.position.copy(taskBoard.position);
            taskBoard.model.rotation.copy(taskBoard.rotation);
        }

        this.objects.push(taskBoard);

        // 存档石碑
        const saveStone = {
            id: 'save-stone',
            name: '存档石碑',
            position: new THREE.Vector3(-10, 0, 0),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            model: null,
            interaction: () => {
                this.game.saveSystem.saveGame();
                this.game.uiController.showDialogue(
                    '存档石碑',
                    '游戏已保存。你的冒险旅程将被记录下来。'
                );
            },
            update: function(deltaTime) {
                // 石碑可以有微弱的光芒效果
                if (this.model) {
                    const time = Date.now() * 0.001;
                    this.model.material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;
                }
            }
        };

        // 加载存档石碑模型
        const saveStoneModel = this.game.resourceManager.getResource('models','save-stone');
        if (saveStoneModel) {
            saveStone.model = saveStoneModel.clone();
            saveStone.model.position.copy(saveStone.position);
            saveStone.model.rotation.copy(saveStone.rotation);
            saveStone.model.scale.set(1, 1, 1);

            // 确保材质可以发光
            saveStone.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0x4488ff);
                    child.material.emissiveIntensity = 0.2;
                }
            });
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x4466aa,
                emissive: 0x223355,
                emissiveIntensity: 0.2
            });
            saveStone.model = new THREE.Mesh(geometry, material);
            saveStone.model.position.copy(saveStone.position);
            saveStone.model.rotation.copy(saveStone.rotation);
        }

        this.objects.push(saveStone);

        // 书架
        const bookshelf = {
            id: 'bookshelf',
            name: '书架',
            position: new THREE.Vector3(0, 0, -10),
            rotation: new THREE.Euler(0, 0, 0),
            model: null,
            interaction: () => {
                this.game.uiController.showDialogue(
                    '书架',
                    '这些古老的书籍记录了埃瑟里亚大陆的历史和魔法知识。\n\n火焰魔法源于远古的巨龙之魂，是最具破坏力的元素。\n\n冰霜魔法诞生于极北之地的冰川深处，能够冻结一切。\n\n雷电魔法来自天空的怒火，迅猛而致命。\n\n自然魔法是大地本身的恩赐，充满生命力。'
                );
            },
            update: function(deltaTime) {
                // 书架不需要特殊更新
            }
        };

        // 加载书架模型
        const bookshelfModel = this.game.resourceManager.getResource('models','bookshelf');
        if (bookshelfModel) {
            bookshelf.model = bookshelfModel.clone();
            bookshelf.model.position.copy(bookshelf.position);
            bookshelf.model.rotation.copy(bookshelf.rotation);
            bookshelf.model.scale.set(1, 1, 1);
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.BoxGeometry(4, 3, 0.5);
            const material = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
            bookshelf.model = new THREE.Mesh(geometry, material);
            bookshelf.model.position.copy(bookshelf.position);
            bookshelf.model.rotation.copy(bookshelf.rotation);
        }

        this.objects.push(bookshelf);
    }

    /**
     * 检查玩家交互
     */
    checkPlayerInteraction() {
        const playerPosition = this.game.playerController.position;
        const interactionDistance = 2.0; // 交互距离

        // 检查NPC交互 - 使用新的NPCController
        const nearbyNPC = this.game.npcController.getNearbyNPC(playerPosition, interactionDistance);
        if (nearbyNPC) {
            // 显示交互提示
            this.game.uiController.showInteractionPrompt(nearbyNPC.name);

            // 如果玩家按下E键，触发交互
            if (this.game.playerController.isInteracting) {
                this.game.playerController.isInteracting = false;
                this.game.npcController.interactWithNPC(nearbyNPC.id);
                return;
            }
        }

        // 检查物体交互
        for (const object of this.objects) {
            const distance = playerPosition.distanceTo(object.position);

            if (distance <= interactionDistance) {
                // 显示交互提示
                this.game.uiController.showInteractionPrompt(object.name);

                // 如果玩家按下E键，触发交互
                if (this.game.playerController.isInteracting) {
                    this.game.playerController.isInteracting = false;

                    // 触发物体交互
                    if (object.interaction) {
                        object.interaction();
                    }
                    return;
                }
            }
        }

        // 如果没有可交互对象，隐藏交互提示
        this.game.uiController.hideInteractionPrompt();
    }
}