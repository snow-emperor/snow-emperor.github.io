/**
 * 冰霜冻土场景
 * 冰霜元素专精的训练场景，充满冰霜元素和冰霜魔兽
 */
import * as THREE from 'three';
export class IceFieldScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.playerStartPosition = new THREE.Vector3(0, 0, 5);
        this.objects = [];
        this.lights = [];
        this.enemies = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xaaccff, 10, 100);

        // 设置光照
        this.setupLighting();

        // 加载场景模型
        await this.loadSceneModel();

        // 创建NPC
        this.createNPCs();

        // 创建物体
        this.createObjects();

        // 创建敌人
        this.createEnemies();
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

        // NPC由NPCController自动添加到场景

        // 添加物体
        this.objects.forEach(object => {
            this.game.sceneManager.scene.add(object.model);
        });

        // 添加敌人
        this.enemies.forEach(enemy => {
            this.game.sceneManager.scene.add(enemy.model);
        });

        // 播放场景音乐
        this.game.audioController.playBackgroundMusic('ice-field-theme');
    }

    /**
     * 卸载场景
     */
    unload() {
        // NPC控制器会自动处理NPC卸载

        // 移除光照
        this.lights.forEach(light => {
            this.game.sceneManager.scene.remove(light);
        });

        // 移除物体
        this.objects.forEach(object => {
            if (object.model) {
                this.game.sceneManager.scene.remove(object.model);
            }
        });

        // 移除敌人
        this.enemies.forEach(enemy => {
            if (enemy.model) {
                this.game.sceneManager.scene.remove(enemy.model);
            }
        });
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // NPC控制器会自动处理NPC更新
        // 更新物体
        this.objects.forEach(object => {
            if (object.update) {
                object.update(deltaTime);
            }
        });

        // 更新敌人
        this.enemies.forEach(enemy => {
            if (enemy.update) {
                enemy.update(deltaTime);
            }
        });

        // 检查玩家交互
        this.checkPlayerInteraction();
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光 - 冰霜场景使用冷色调
        const ambientLight = new THREE.AmbientLight(0x80a0ff, 0.4);
        this.lights.push(ambientLight);

        // 主光源 - 模拟冰面反射的冷光
        const directionalLight = new THREE.DirectionalLight(0xccddff, 0.6);
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

        // 冰晶光点
        const pointLight1 = new THREE.PointLight(0xaaccff, 0.4, 10);
        pointLight1.position.set(-5, 5, 0);
        this.lights.push(pointLight1);

        const pointLight2 = new THREE.PointLight(0x99ccff, 0.4, 10);
        pointLight2.position.set(5, 5, 0);
        this.lights.push(pointLight2);
    }

    /**
     * 加载场景模型
     */
    async loadSceneModel() {
        try {
            // 加载冰霜冻土模型
            const model = this.game.resourceManager.getResource('models','ice-field');
            if (model) {
                this.scene.add(model.clone());
            } else {
                // 如果没有模型，创建基本几何体
                this.createBasicIceField();
            }
        } catch (error) {
            console.error('加载冰霜冻土场景模型失败:', error);
            this.createBasicIceField();
        }
    }

    /**
     * 创建基本冰霜冻土场景（当模型加载失败时使用）
     */
    createBasicIceField() {
        // 冰面地板
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaccff,
            map: this.game.resourceManager.textures['ice-field-floor'] || null,
            transparent: true,
            opacity: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 冰墙
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0xbbddff,
            map: this.game.resourceManager.textures['ice-wall'] || null,
            transparent: true,
            opacity: 0.8
        });

        // 创建不规则形状的冰墙
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const wallHeight = 5 + Math.random() * 5;
            const wallWidth = 5 + Math.random() * 5;
            const wallThickness = 1;

            const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallThickness);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);

            const distance = 25;
            wall.position.x = Math.cos(angle) * distance;
            wall.position.y = wallHeight / 2;
            wall.position.z = Math.sin(angle) * distance;
            wall.rotation.y = angle + Math.PI / 2;

            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
        }

        // 冰柱
        const icicleGeometry = new THREE.ConeGeometry(0.5, 3, 8);
        const icicleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xccddff,
            transparent: true,
            opacity: 0.9
        });

        for (let i = 0; i < 20; i++) {
            const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            icicle.position.set(x, 1.5, z);
            icicle.rotation.x = Math.random() * 0.2 - 0.1;
            icicle.rotation.z = Math.random() * 0.2 - 0.1;
            icicle.castShadow = true;
            icicle.receiveShadow = true;
            this.scene.add(icicle);
        }

        // 雪堆
        const snowGeometry = new THREE.SphereGeometry(2, 8, 6);
        const snowMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

        for (let i = 0; i < 15; i++) {
            const snow = new THREE.Mesh(snowGeometry, snowMaterial);
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const scale = 0.5 + Math.random() * 1.5;
            snow.position.set(x, scale, z);
            snow.scale.set(scale, scale * 0.7, scale);
            snow.castShadow = true;
            snow.receiveShadow = true;
            this.scene.add(snow);
        }
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        // 冰霜导师
        this.game.npcController.addNPC('ice-field-mentor', {
            name: '冰霜导师',
            position: new THREE.Vector3(-10, 0, 0),
            modelId: 'npc-mentor',
            dialogue: [
                {
                    text: '欢迎来到冰霜冻土，这里是冰霜元素的圣地。冰霜之力源于冷静与控制，而非狂暴的力量。',
                    options: [
                        {
                            text: '我想学习冰霜咒语',
                            action: () => {
                                if (this.game.playerController.specialization === 'ice') {
                                    this.game.uiController.showSpellSelection('ice');
                                } else {
                                    this.game.uiController.showDialogue('冰霜导师', '你不是冰霜专精的学生，无法学习高级冰霜咒语。');
                                }
                            }
                        },
                        {
                            text: '我想接受冰霜试炼',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜导师', '准备好接受冰霜试炼了吗？你需要击败这片区域的冰霜魔兽，证明你的实力。');
                                this.game.questSystem.startQuest('ice-trial');
                            }
                        },
                        {
                            text: '冰霜魔法的原理是什么？',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜导师', '冰霜魔法是元素魔法中最需要冷静和控制力的分支。它不像火焰那样狂暴，而是需要施法者保持绝对的冷静和专注。冰霜咒语通常具有减速、冻结和控制效果，非常适合战术性战斗。');
                            }
                        },
                        {
                            text: '谢谢指导',
                            action: () => {
                                this.game.uiController.hideDialogue();
                                this.game.playerController.isInteracting = false;
                            }
                        }
                    ]
                }
            ]
        });

        // 冰霜商人
        this.game.npcController.addNPC('ice-field-merchant', {
            name: '冰霜商人',
            position: new THREE.Vector3(15, 0, -15),
            modelId: 'npc-merchant',
            dialogue: [
                {
                    text: '欢迎来到冰霜冻土！这里虽然寒冷，但我的商品绝对能让你感到温暖。我这里有各种冰霜抗性装备和冰霜魔法道具。',
                    options: [
                        {
                            text: '我想看看你的商品',
                            action: () => {
                                this.game.uiController.showShop([
                                    { id: 'ice-crystal', name: '冰霜结晶', price: 60, description: '冰霜元素的核心，可用于制作冰霜咒语和抗性装备' },
                                    { id: 'ice-potion', name: '冰霜药剂', price: 90, description: '恢复生命值并增加冰霜抗性，持续时间较长' },
                                    { id: 'frost-staff', name: '冰霜法杖', price: 250, description: '增强冰霜咒语威力，并有一定几率冻结敌人' },
                                    { id: 'ice-armor', name: '冰霜护甲', price: 300, description: '提供优秀的冰霜抗性和物理防御' }
                                ]);
                            }
                        },
                        {
                            text: '这里有什么危险？',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜商人', '冰霜冻土的危险主要来自三个方面：冰霜蠕虫会潜伏在冰面下突然袭击；冰霜元素生物对冰霜魔法有很强的抗性；最危险的是温度过低造成的持续伤害，除非你穿着足够的保暖装备。');
                            }
                        },
                        {
                            text: '有什么生存建议吗？',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜商人', '在冰霜冻土生存需要记住几点：保持移动以避免体温过低；携带足够的冰霜抗性药水；使用火焰或雷电咒语对付冰霜生物；注意观察冰面，有些地方可能隐藏着危险。');
                            }
                        },
                        {
                            text: '再见',
                            action: () => {
                                this.game.uiController.hideDialogue();
                                this.game.playerController.isInteracting = false;
                            }
                        }
                    ]
                }
            ]
        });

        // 冰霜法师
        this.game.npcController.addNPC('ice-field-mage', {
            name: '冰霜法师艾莎',
            position: new THREE.Vector3(-20, 0, 15),
            modelId: 'npc-mage',
            dialogue: [
                {
                    text: '啊，一个年轻的学徒。我是艾莎，冰霜魔法的大师。我感受到你体内有魔力的波动，但你还需要更多的训练才能真正掌握冰霜之力。',
                    options: [
                        {
                            text: '请指导我冰霜魔法',
                            action: () => {
                                if (this.game.playerController.level >= 4) {
                                    this.game.spellSystem.learnSpell('frost-bolt');
                                    this.game.uiController.showDialogue('冰霜法师艾莎', '很好！我已经传授给你冰霜箭咒语。记住，冰霜魔法的精髓在于控制而非破坏。用心去感受冰元素的律动，你会发现它们其实很温顺，只是需要正确的引导。');
                                } else {
                                    this.game.uiController.showDialogue('冰霜法师艾莎', '你的魔力还不够强大。等你达到4级后再来找我吧。冰霜魔法需要稳定的基础，急躁只会导致失败。');
                                }
                            }
                        },
                        {
                            text: '冰霜魔法的最高境界是什么？',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜法师艾莎', '冰霜魔法的最高境界是"绝对零度领域"。在这个领域中，一切运动都会停止，时间仿佛冻结。只有真正理解冰霜本质的法师才能施展这个传说中的咒语。它需要极高的魔力和精神集中力。');
                            }
                        },
                        {
                            text: '我该如何提升冰霜抗性？',
                            action: () => {
                                this.game.uiController.showDialogue('冰霜法师艾莎', '提升冰霜抗性有几种方法：穿着冰霜抗性装备；服用冰霜抗性药水；通过冥想适应寒冷环境；学习冰霜魔法本身也能增强你对寒冷的抵抗力。记住，理解冰霜是抵抗冰霜的最佳方式。');
                            }
                        },
                        {
                            text: '谢谢您的指导',
                            action: () => {
                                this.game.uiController.hideDialogue();
                                this.game.playerController.isInteracting = false;
                            }
                        }
                    ]
                }
            ]
        });
    }

    /**
     * 创建物体
     */
    createObjects() {
        // 冰霜祭坛
        const iceAltar = {
            id: 'ice-altar',
            name: '冰霜祭坛',
            position: new THREE.Vector3(0, 0, -10),
            rotation: new THREE.Euler(0, 0, 0),
            model: null,
            interaction: () => {
                this.game.uiController.showDialogue(
                    '冰霜祭坛',
                    '这个古老的祭坛蕴含着强大的冰霜之力。将你的手放在上面，你可以感受到冰元素的低语。在这里冥想，可以提升你对冰霜魔法的理解。'
                );

                // 增加冰霜魔法经验
                if (this.game.playerController.specialization === 'ice') {
                    this.game.playerController.gainExperience(50);
                    this.game.uiController.showNotification('获得了50点冰霜魔法经验！');
                }
            },
            update: function(deltaTime) {
                // 祭坛可以有微弱的光芒效果
                if (this.model) {
                    const time = Date.now() * 0.001;
                    this.model.material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;
                }
            }
        };

        // 加载冰霜祭坛模型
        const iceAltarModel = this.game.resourceManager.getResource('models','ice-altar');
        if (iceAltarModel) {
            iceAltar.model = iceAltarModel.clone();
            iceAltar.model.position.copy(iceAltar.position);
            iceAltar.model.rotation.copy(iceAltar.rotation);
            iceAltar.model.scale.set(1, 1, 1);

            // 确保材质可以发光
            iceAltar.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0x6699ff);
                    child.material.emissiveIntensity = 0.2;
                }
            });
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.CylinderGeometry(2, 3, 1, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0xaaccff,
                emissive: 0x4488ff,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.9
            });
            iceAltar.model = new THREE.Mesh(geometry, material);
            iceAltar.model.position.copy(iceAltar.position);
            iceAltar.model.rotation.copy(iceAltar.rotation);
        }

        this.objects.push(iceAltar);

        // 冰霜宝箱
        const iceChest = {
            id: 'ice-chest',
            name: '冰霜宝箱',
            position: new THREE.Vector3(10, 0, 0),
            rotation: new THREE.Euler(0, -Math.PI / 4, 0),
            model: null,
            isOpened: false,
            interaction: () => {
                if (!iceChest.isOpened) {
                    iceChest.isOpened = true;

                    // 奖励物品
                    const rewards = [
                        { id: 'ice-potion', name: '冰霜药剂', count: 3 },
                        { id: 'mana-potion', name: '魔法药剂', count: 2 }
                    ];

                    // 将物品添加到玩家背包
                    rewards.forEach(item => {
                        this.game.playerController.inventory.addItem(item.id, item.count);
                    });

                    this.game.uiController.showDialogue(
                        '冰霜宝箱',
                        '你获得了：\n\n' + rewards.map(r => `${r.name} x${r.count}`).join('\n')
                    );

                    // 更新宝箱模型（打开状态）
                    if (iceChest.model) {
                        iceChest.model.rotation.x = -Math.PI / 4;
                    }
                } else {
                    this.game.uiController.showDialogue(
                        '冰霜宝箱',
                        '宝箱已经是空的了。'
                    );
                }
            },
            update: function(deltaTime) {
                // 宝箱可以有微弱的光芒效果
                if (this.model && !this.isOpened) {
                    const time = Date.now() * 0.001;
                    this.model.material.emissiveIntensity = 0.15 + Math.sin(time * 3) * 0.05;
                }
            }
        };

        // 加载冰霜宝箱模型
        const iceChestModel = this.game.resourceManager.getResource('models','ice-chest');
        if (iceChestModel) {
            iceChest.model = iceChestModel.clone();
            iceChest.model.position.copy(iceChest.position);
            iceChest.model.rotation.copy(iceChest.rotation);
            iceChest.model.scale.set(1, 1, 1);

            // 确保材质可以发光
            iceChest.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0x6699ff);
                    child.material.emissiveIntensity = 0.15;
                }
            });
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.BoxGeometry(2, 1.5, 1.5);
            const material = new THREE.MeshPhongMaterial({
                color: 0xaaccff,
                emissive: 0x4488ff,
                emissiveIntensity: 0.15,
                transparent: true,
                opacity: 0.9
            });
            iceChest.model = new THREE.Mesh(geometry, material);
            iceChest.model.position.copy(iceChest.position);
            iceChest.model.rotation.copy(iceChest.rotation);
        }

        this.objects.push(iceChest);
    }

    /**
     * 创建敌人
     */
    createEnemies() {
        // 冰霜蠕虫
        const iceWorm = {
            id: 'ice-worm-1',
            name: '冰霜蠕虫',
            position: new THREE.Vector3(15, 0, 10),
            rotation: new THREE.Euler(0, Math.PI, 0),
            model: null,
            health: 50,
            maxHealth: 50,
            attack: 10,
            defense: 5,
            experience: 20,
            loot: [
                { id: 'ice-shard', chance: 0.5, count: 1 },
                { id: 'ice-potion', chance: 0.2, count: 1 }
            ],
            ai: {
                type: 'patrol',
                patrolPoints: [
                    new THREE.Vector3(15, 0, 10),
                    new THREE.Vector3(20, 0, 10),
                    new THREE.Vector3(20, 0, 5),
                    new THREE.Vector3(15, 0, 5)
                ],
                currentPointIndex: 0,
                speed: 1.0,
                detectionRange: 8,
                attackRange: 2,
                attackCooldown: 2,
                lastAttackTime: 0
            },
            update: function(deltaTime) {
                // 简单的AI行为
                const time = Date.now() * 0.001;

                // 蠕动动画
                if (this.model) {
                    this.model.position.y = this.position.y + Math.sin(time * 4) * 0.1;
                }

                // 巡逻或追逐玩家
                const playerPosition = this.game.playerController.position;
                const distanceToPlayer = this.position.distanceTo(playerPosition);

                if (distanceToPlayer <= this.ai.detectionRange) {
                    // 追逐玩家
                    const direction = new THREE.Vector3()
                        .subVectors(playerPosition, this.position)
                        .normalize();

                    this.position.add(direction.multiplyScalar(this.ai.speed * deltaTime));
                    this.rotation.y = Math.atan2(direction.x, direction.z);

                    // 攻击玩家
                    if (distanceToPlayer <= this.ai.attackRange) {
                        const now = Date.now() / 1000;
                        if (now - this.ai.lastAttackTime >= this.ai.attackCooldown) {
                            this.ai.lastAttackTime = now;
                            this.game.playerController.takeDamage(this.attack);
                            this.game.uiController.showNotification(`${this.name}造成了${this.attack}点伤害！`);
                        }
                    }
                } else {
                    // 巡逻
                    const targetPoint = this.ai.patrolPoints[this.ai.currentPointIndex];
                    const distanceToPoint = this.position.distanceTo(targetPoint);

                    if (distanceToPoint < 1) {
                        // 到达巡逻点，切换到下一个
                        this.ai.currentPointIndex = (this.ai.currentPointIndex + 1) % this.ai.patrolPoints.length;
                    } else {
                        // 移向当前巡逻点
                        const direction = new THREE.Vector3()
                            .subVectors(targetPoint, this.position)
                            .normalize();

                        this.position.add(direction.multiplyScalar(this.ai.speed * deltaTime));
                        this.rotation.y = Math.atan2(direction.x, direction.z);
                    }
                }

                // 更新模型位置
                if (this.model) {
                    this.model.position.copy(this.position);
                    this.model.rotation.copy(this.rotation);
                }
            },
            takeDamage: function(damage) {
                const actualDamage = Math.max(1, damage - this.defense);
                this.health -= actualDamage;

                // 显示伤害数字
                this.game.uiController.showDamageNumber(this.position, actualDamage);

                // 检查是否死亡
                if (this.health <= 0) {
                    this.die();
                }

                return actualDamage;
            },
            die: function() {
                // 掉落物品
                this.loot.forEach(item => {
                    if (Math.random() < item.chance) {
                        this.game.playerController.inventory.addItem(item.id, item.count);
                        this.game.uiController.showNotification(`获得了${item.count}个${item.name}`);
                    }
                });

                // 给予经验
                this.game.playerController.gainExperience(this.experience);

                // 从场景中移除
                const index = this.game.sceneManager.currentScene.enemies.indexOf(this);
                if (index > -1) {
                    this.game.sceneManager.currentScene.enemies.splice(index, 1);
                }

                this.game.sceneManager.scene.remove(this.model);
            }
        };

        // 加载冰霜蠕虫模型
        const iceWormModel = this.game.resourceManager.getResource('models','ice-worm');
        if (iceWormModel) {
            iceWorm.model = iceWormModel.clone();
            iceWorm.model.position.copy(iceWorm.position);
            iceWorm.model.rotation.copy(iceWorm.rotation);
            iceWorm.model.scale.set(1, 1, 1);
        } else {
            // 如果没有模型，创建一个简单的占位符
            const segments = 5;
            const segmentGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            const segmentMaterial = new THREE.MeshPhongMaterial({ color: 0xaaccff });

            iceWorm.model = new THREE.Group();

            for (let i = 0; i < segments; i++) {
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                segment.position.x = i * 0.8 - (segments - 1) * 0.4;
                segment.scale.y = 0.7;
                iceWorm.model.add(segment);
            }

            iceWorm.model.position.copy(iceWorm.position);
            iceWorm.model.rotation.copy(iceWorm.rotation);
        }

        this.enemies.push(iceWorm);

        // 冰霜元素
        const iceElemental = {
            id: 'ice-elemental-1',
            name: '冰霜元素',
            position: new THREE.Vector3(-15, 0, -10),
            rotation: new THREE.Euler(0, 0, 0),
            model: null,
            health: 80,
            maxHealth: 80,
            attack: 15,
            defense: 10,
            experience: 35,
            loot: [
                { id: 'ice-core', chance: 0.3, count: 1 },
                { id: 'ice-potion', chance: 0.4, count: 1 },
                { id: 'frost-ward-scroll', chance: 0.1, count: 1 }
            ],
            ai: {
                type: 'guard',
                guardPosition: new THREE.Vector3(-15, 0, -10),
                guardRadius: 5,
                speed: 0.8,
                detectionRange: 10,
                attackRange: 3,
                attackCooldown: 3,
                lastAttackTime: 0,
                spell: 'ice-blast',
                spellCooldown: 5,
                lastSpellTime: 0
            },
            update: function(deltaTime) {
                // 漂浮动画
                const time = Date.now() * 0.001;
                if (this.model) {
                    this.model.position.y = this.position.y + Math.sin(time * 2) * 0.2;
                    this.model.rotation.y += deltaTime * 0.5;
                }

                // 守护或追逐玩家
                const playerPosition = this.game.playerController.position;
                const distanceToPlayer = this.position.distanceTo(playerPosition);
                const distanceToGuardPoint = this.position.distanceTo(this.ai.guardPosition);

                if (distanceToPlayer <= this.ai.detectionRange) {
                    // 追逐玩家
                    const direction = new THREE.Vector3()
                        .subVectors(playerPosition, this.position)
                        .normalize();

                    this.position.add(direction.multiplyScalar(this.ai.speed * deltaTime));

                    // 近战攻击
                    if (distanceToPlayer <= this.ai.attackRange) {
                        const now = Date.now() / 1000;
                        if (now - this.ai.lastAttackTime >= this.ai.attackCooldown) {
                            this.ai.lastAttackTime = now;
                            this.game.playerController.takeDamage(this.attack);
                            this.game.uiController.showNotification(`${this.name}造成了${this.attack}点伤害！`);
                        }
                    }

                    // 远程法术攻击
                    const now = Date.now() / 1000;
                    if (now - this.ai.lastSpellTime >= this.ai.spellCooldown && distanceToPlayer > this.ai.attackRange) {
                        this.ai.lastSpellTime = now;
                        this.castSpell(this.ai.spell, playerPosition);
                    }
                } else if (distanceToGuardPoint > this.ai.guardRadius) {
                    // 返回守护点
                    const direction = new THREE.Vector3()
                        .subVectors(this.ai.guardPosition, this.position)
                        .normalize();

                    this.position.add(direction.multiplyScalar(this.ai.speed * deltaTime));
                }

                // 更新模型位置
                if (this.model) {
                    this.model.position.copy(this.position);
                    // 不更新旋转，让它自己旋转
                }
            },
            castSpell: function(spellType, targetPosition) {
                // 创建法术效果
                const spell = {
                    type: spellType,
                    position: this.position.clone(),
                    target: targetPosition.clone(),
                    speed: 5,
                    damage: this.attack * 1.2,
                    model: null
                };

                // 创建法术模型
                const spellGeometry = new THREE.SphereGeometry(0.3, 8, 6);
                const spellMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x88ccff,
                    transparent: true,
                    opacity: 0.8
                });
                spell.model = new THREE.Mesh(spellGeometry, spellMaterial);
                spell.model.position.copy(spell.position);

                // 添加到场景
                this.game.sceneManager.scene.add(spell.model);

                // 创建法术更新函数
                spell.update = function(deltaTime) {
                    const direction = new THREE.Vector3()
                        .subVectors(this.target, this.position)
                        .normalize();

                    this.position.add(direction.multiplyScalar(this.speed * deltaTime));
                    this.model.position.copy(this.position);

                    // 检查是否击中玩家
                    const distanceToPlayer = this.position.distanceTo(this.game.playerController.position);
                    if (distanceToPlayer < 1) {
                        // 造成伤害
                        this.game.playerController.takeDamage(this.damage);
                        this.game.uiController.showNotification(`冰霜爆破造成了${this.damage}点伤害！`);

                        // 移除法术
                        this.game.sceneManager.scene.remove(this.model);
                        const index = this.game.activeSpells.indexOf(this);
                        if (index > -1) {
                            this.game.activeSpells.splice(index, 1);
                        }
                    }

                    // 检查是否到达目标位置
                    const distanceToTarget = this.position.distanceTo(this.target);
                    if (distanceToTarget < 0.5) {
                        // 移除法术
                        this.game.sceneManager.scene.remove(this.model);
                        const index = this.game.activeSpells.indexOf(this);
                        if (index > -1) {
                            this.game.activeSpells.splice(index, 1);
                        }
                    }
                };

                // 添加到活动法术列表
                if (!this.game.activeSpells) {
                    this.game.activeSpells = [];
                }
                this.game.activeSpells.push(spell);

                this.game.uiController.showNotification(`${this.name}释放了冰霜爆破！`);
            },
            takeDamage: function(damage) {
                const actualDamage = Math.max(1, damage - this.defense);
                this.health -= actualDamage;

                // 显示伤害数字
                this.game.uiController.showDamageNumber(this.position, actualDamage);

                // 检查是否死亡
                if (this.health <= 0) {
                    this.die();
                }

                return actualDamage;
            },
            die: function() {
                // 掉落物品
                this.loot.forEach(item => {
                    if (Math.random() < item.chance) {
                        this.game.playerController.inventory.addItem(item.id, item.count);
                        this.game.uiController.showNotification(`获得了${item.count}个${item.name}`);
                    }
                });

                // 给予经验
                this.game.playerController.gainExperience(this.experience);

                // 从场景中移除
                const index = this.game.sceneManager.currentScene.enemies.indexOf(this);
                if (index > -1) {
                    this.game.sceneManager.currentScene.enemies.splice(index, 1);
                }

                this.game.sceneManager.scene.remove(this.model);
            }
        };

        // 加载冰霜元素模型
        const iceElementalModel = this.game.resourceManager.getResource('models','ice-elemental');
        if (iceElementalModel) {
            iceElemental.model = iceElementalModel.clone();
            iceElemental.model.position.copy(iceElemental.position);
            iceElemental.model.rotation.copy(iceElemental.rotation);
            iceElemental.model.scale.set(1, 1, 1);
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.IcosahedronGeometry(1.2, 1);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xaaccff,
                transparent: true,
                opacity: 0.8,
                emissive: 0x4488ff,
                emissiveIntensity: 0.2
            });
            iceElemental.model = new THREE.Mesh(geometry, material);
            iceElemental.model.position.copy(iceElemental.position);
            iceElemental.model.rotation.copy(iceElemental.rotation);
        }

        this.enemies.push(iceElemental);
    }

       /**
     * 创建NPC
     */
    createNPCs() {
        // 创建冰霜长老
        this.game.npcController.addNPC({
            id: 'ice-field-elder',
            name: '冰霜长老',
            position: new THREE.Vector3(10, 0, 10),
            modelId: 'npc-mentor',  // 使用现有的导师模型
            dialogue: {
                greeting: '欢迎来到冰霜冻土，年轻的法师。这里是冰雪元素的领域，充满了古老的秘密和危险。',
                options: [
                    {
                        text: '我想学习更高级的冰霜魔法',
                        condition: () => this.game.playerController.level >= 5 && this.game.playerController.hasSpell('frost-bolt'),
                        effects: () => {
                            this.game.playerController.learnSpell('ice-shield');
                            this.game.uiController.showMessage('你学会了冰霜护盾咒语！');
                        }
                    },
                    {
                        text: '这片土地有什么历史？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('很久以前，这里曾是一个繁荣的魔法王国。但在一场大灾难后，整个王国被永恒的冰雪覆盖。现在只剩下我们这些守护者还在这里坚守着古老的秘密。');
                        }
                    }
                ]
            }
        });

        // 创建冰原商人
        this.game.npcController.addNPC({
            id: 'ice-field-merchant',
            name: '冰原商人',
            position: new THREE.Vector3(-15, 0, 15),
            modelId: 'npc-merchant',
            dialogue: {
                greeting: '啊，一个勇敢的探险者！我这里有各种冰霜抗性装备和药水，在这个寒冷的地方你一定会用得上。',
                options: [
                    {
                        text: '购买冰霜抗性药水 (60金币)',
                        condition: () => this.game.playerController.gold >= 60,
                        effects: () => {
                            this.game.playerController.gold -= 60;
                            this.game.playerController.addItem('frost-resistance-potion', 1);
                            this.game.uiController.showMessage('你购买了冰霜抗性药水！');
                        }
                    },
                    {
                        text: '购买冰晶法杖 (150金币)',
                        condition: () => this.game.playerController.gold >= 150,
                        effects: () => {
                            this.game.playerController.gold -= 150;
                            this.game.playerController.addItem('ice-crystal-staff', 1);
                            this.game.uiController.showMessage('你购买了冰晶法杖！');
                        }
                    },
                    {
                        text: '这里有什么特别的吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('在这片冻土的深处，有一个传说中的冰霜之心，它能够大幅增强冰霜咒语的力量。但要小心，强大的冰霜元素守护着它。');
                        }
                    }
                ]
            }
        });

        // 创建冰霜学者
        this.game.npcController.addNPC({
            id: 'ice-field-scholar',
            name: '冰霜学者',
            position: new THREE.Vector3(20, 0, -10),
            modelId: 'npc-villager',  // 使用现有的村民模型
            dialogue: {
                greeting: '我一直在研究冰霜元素的行为模式。它们似乎对某种特定的魔法频率特别敏感...',
                options: [
                    {
                        text: '你有什么发现？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我发现冰霜元素在释放法术时会有短暂的能量聚集期。如果你能在这个时机攻击它们，会造成额外的伤害。');
                        }
                    },
                    {
                        text: '你能教我什么技巧吗？',
                        condition: () => this.game.playerController.level >= 6,
                        effects: () => {
                            this.game.uiController.showMessage('观察敌人的攻击模式很重要。当冰霜元素开始发光时，就是它准备释放强大法术的时候，这时是攻击的最佳时机！');
                        }
                    },
                    {
                        text: '我需要更多练习',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('实践是最好的老师。多与冰霜元素战斗，你会逐渐掌握它们的规律。');
                        }
                    }
                ]
            }
        });

        // 创建迷路的探险者
        this.game.npcController.addNPC({
            id: 'ice-field-explorer',
            name: '迷路的探险者',
            position: new THREE.Vector3(-5, 0, -20),
            modelId: 'npc-villager',  // 使用现有的村民模型
            dialogue: {
                greeting: '太好了，终于遇到其他人了！我在这里迷路了好几天，又冷又饿...你能帮帮我吗？',
                options: [
                    {
                        text: '给你一些食物',
                        condition: () => this.game.playerController.hasItem('food'),
                        effects: () => {
                            this.game.playerController.removeItem('food', 1);
                            this.game.uiController.showMessage('探险者感激地接受了你的食物，并告诉你一个秘密地点的位置。');
                        }
                    },
                    {
                        text: '我这里没有食物',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('探险者看起来很失望，但他还是感谢你停下来与他交谈。');
                        }
                    }
                ]
            }
        });
    }

    /**
     * 检查玩家交互
     */
    checkPlayerInteraction() {
        const playerPosition = this.game.playerController.position;
        const interactionDistance = 2.0; // 交互距离

        // 使用NPCController检查NPC交互
        const nearbyNPC = this.game.npcController.getNearbyNPC(playerPosition, interactionDistance);
        
        if (nearbyNPC) {
            // 显示交互提示
            this.game.uiController.showInteractionPrompt(nearbyNPC.name);

            // 如果玩家按下E键，触发交互
            if (this.game.playerController.isInteracting) {
                this.game.playerController.isInteracting = false;
                
                // 使用NPCController处理交互
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