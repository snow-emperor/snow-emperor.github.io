/**
 * 火焰峡谷场景
 * 火焰元素的试炼场，包含火焰幼兽和火焰领主
 */
import * as THREE from 'three';
export class FireCanyonScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.playerStartPosition = new THREE.Vector3(0, 0, 10);
        this.enemies = [];
        this.objects = [];
        this.lights = [];
        this.particles = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x330000, 10, 100);

        // 设置光照
        this.setupLighting();

        // 加载场景模型
        await this.loadSceneModel();

        // 创建NPC
        this.createNPCs();

        // 创建敌人
        this.createEnemies();

        // 创建物体
        this.createObjects();

        // 创建粒子效果
        this.createParticles();
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

        // 添加敌人
        this.enemies.forEach(enemy => {
            this.game.sceneManager.scene.add(enemy.model);
        });

        // 添加物体
        this.objects.forEach(object => {
            this.game.sceneManager.scene.add(object.model);
        });

        // 添加粒子效果
        this.particles.forEach(particle => {
            this.game.sceneManager.scene.add(particle);
        });

        // 播放场景音乐
        this.game.audioController.playBackgroundMusic('fire-canyon-theme');
    }

    /**
     * 卸载场景
     */
    unload() {
        // 移除光照
        this.lights.forEach(light => {
            this.game.sceneManager.scene.remove(light);
        });

        // 移除敌人
        this.enemies.forEach(enemy => {
            this.game.sceneManager.scene.remove(enemy.model);
        });

        // 移除物体
        this.objects.forEach(object => {
            this.game.sceneManager.scene.remove(object.model);
        });

        // 移除粒子效果
        this.particles.forEach(particle => {
            this.game.sceneManager.scene.remove(particle);
        });

        // 移除NPC
        this.game.npcController.npcs.forEach((npc, id) => {
            if (npc.model) {
                this.game.sceneManager.scene.remove(npc.model);
            }
        });
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 更新敌人
        this.enemies.forEach(enemy => {
            if (enemy.update) {
                enemy.update(deltaTime);
            }
        });

        // 更新物体
        this.objects.forEach(object => {
            if (object.update) {
                object.update(deltaTime);
            }
        });

        // 更新粒子效果
        this.particles.forEach(particle => {
            if (particle.update) {
                particle.update(deltaTime);
            }
        });

        // 检查玩家交互
        this.checkPlayerInteraction();

        // 检查战斗状态
        this.checkCombatStatus();
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光（红色调）
        const ambientLight = new THREE.AmbientLight(0x401010, 0.4);
        this.lights.push(ambientLight);

        // 主光源（暖色调）
        const directionalLight = new THREE.DirectionalLight(0xff9944, 0.8);
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

        // 火焰光点
        const pointLight1 = new THREE.PointLight(0xff4422, 0.6, 10);
        pointLight1.position.set(-10, 5, 0);
        this.lights.push(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff4422, 0.6, 10);
        pointLight2.position.set(10, 5, 0);
        this.lights.push(pointLight2);
    }

    /**
     * 加载场景模型
     */
    async loadSceneModel() {
        try {
            // 加载火焰峡谷模型
            const model = this.game.resourceManager.getResource('models','fire-canyon');
            if (model) {
                this.scene.add(model.clone());
            } else {
                // 如果没有模型，创建基本几何体
                this.createBasicCanyon();
            }
        } catch (error) {
            console.error('加载火焰峡谷模型失败:', error);
            this.createBasicCanyon();
        }
    }

    /**
     * 创建基本峡谷场景（当模型加载失败时使用）
     */
    createBasicCanyon() {
        // 地板
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x663311,
            map: this.game.resourceManager.textures['fire-canyon-ground'] || null
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 岩石墙壁
        const rockMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x884422,
            map: this.game.resourceManager.textures['fire-canyon-lava'] || null
        });

        // 创建一些岩石障碍物
        for (let i = 0; i < 10; i++) {
            const rockGeometry = new THREE.BoxGeometry(
                Math.random() * 5 + 2,
                Math.random() * 5 + 2,
                Math.random() * 5 + 2
            );
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 40,
                Math.random() * 2.5,
                (Math.random() - 0.5) * 40
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
        }

        // 创建熔岩池
        const lavaGeometry = new THREE.CircleGeometry(5, 32);
        const lavaMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4422,
            emissive: 0xff2200,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 3; i++) {
            const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
            lava.position.set(
                (Math.random() - 0.5) * 30,
                0.01,
                (Math.random() - 0.5) * 30
            );
            lava.rotation.x = -Math.PI / 2;
            this.scene.add(lava);
        }
    }

    /**
     * 创建敌人
     */
    createEnemies() {
        // 创建火焰幼兽
        for (let i = 0; i < 5; i++) {
            const fireBeast = {
                id: `fire-beast-${i}`,
                type: 'fire-beast',
                level: 2,
                health: 80,
                maxHealth: 80,
                attack: 12,
                defense: 3,
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 40,
                    0,
                    (Math.random() - 0.5) * 40
                ),
                rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
                model: null,
                moveSpeed: 1.5,
                attackRange: 2,
                attackCooldown: 2000,
                lastAttackTime: 0,
                isDead: false,
                update: function(deltaTime) {
                    // 简单的AI：向玩家移动
                    if (this.isDead) return;

                    const playerPosition = this.game.playerController.position;
                    const distance = this.position.distanceTo(playerPosition);

                    // 如果玩家在攻击范围内，攻击
                    if (distance <= this.attackRange) {
                        const currentTime = Date.now();
                        if (currentTime - this.lastAttackTime > this.attackCooldown) {
                            this.lastAttackTime = currentTime;
                            this.attack();
                        }
                    }
                    // 否则，向玩家移动
                    else if (distance <= 10) {
                        const direction = new THREE.Vector3()
                            .subVectors(playerPosition, this.position)
                            .normalize();

                        direction.multiplyScalar(this.moveSpeed * deltaTime);
                        this.position.add(direction);

                        if (this.model) {
                            this.model.position.copy(this.position);
                            this.model.lookAt(playerPosition);
                        }
                    }
                },
                attack: function() {
                    // 对玩家造成伤害
                    this.game.playerController.takeDamage(this.attack);

                    // 播放攻击音效
                    this.game.audioController.playSound('enemy-hit');
                },
                takeDamage: function(damage) {
                    // 受到伤害
                    this.health -= damage;

                    // 确保生命值不低于0
                    this.health = Math.max(0, this.health);

                    // 播放受伤动画
                    if (this.model && this.model.animations && this.model.animations['hurt']) {
                        // 播放受伤动画
                    }

                    // 如果生命值为0，死亡
                    if (this.health <= 0) {
                        this.die();
                    }
                },
                die: function() {
                    this.isDead = true;

                    // 播放死亡动画
                    if (this.model && this.model.animations && this.model.animations['death']) {
                        // 播放死亡动画
                    }

                    // 掉落物品
                    this.dropItems();

                    // 移除模型
                    if (this.model) {
                        this.game.sceneManager.scene.remove(this.model);
                    }

                    // 从敌人列表中移除
                    const index = this.game.sceneManager.currentScene.enemies.indexOf(this);
                    if (index > -1) {
                        this.game.sceneManager.currentScene.enemies.splice(index, 1);
                    }

                    // 增加玩家经验
                    this.game.playerController.addExperience(10);
                },
                dropItems: function() {
                    // 掉落火焰结晶
                    this.game.inventorySystem.addItem('fire-crystal', 1);

                    // 显示掉落提示
                    this.game.uiController.showNotification('获得火焰结晶 x1');
                }
            };

            // 加载火焰幼兽模型
            const fireBeastModel = this.game.resourceManager.getResource('models','fire-beast');
            if (fireBeastModel) {
                fireBeast.model = fireBeastModel.clone();
                fireBeast.model.position.copy(fireBeast.position);
                fireBeast.model.rotation.copy(fireBeast.rotation);
                fireBeast.model.scale.set(1, 1, 1);
            } else {
                // 如果没有模型，创建一个简单的占位符
                const geometry = new THREE.BoxGeometry(1, 1.5, 1);
                const material = new THREE.MeshPhongMaterial({ color: 0xff4422 });
                fireBeast.model = new THREE.Mesh(geometry, material);
                fireBeast.model.position.copy(fireBeast.position);
                fireBeast.model.rotation.copy(fireBeast.rotation);
            }

            // 设置阴影
            if (fireBeast.model) {
                fireBeast.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }

            this.enemies.push(fireBeast);
        }

        // 创建火焰领主（精英敌人）
        const fireLord = {
            id: 'fire-lord',
            type: 'fire-lord',
            level: 6,
            health: 300,
            maxHealth: 300,
            attack: 40,
            defense: 15,
            position: new THREE.Vector3(0, 0, -20),
            rotation: new THREE.Euler(0, 0, 0),
            model: null,
            moveSpeed: 1.2,
            attackRange: 3,
            attackCooldown: 5000,
            lastAttackTime: 0,
            skillCooldown: 5000,
            lastSkillTime: 0,
            isDead: false,
            update: function(deltaTime) {
                // 精英AI：更智能的行为
                if (this.isDead) return;

                const playerPosition = this.game.playerController.position;
                const distance = this.position.distanceTo(playerPosition);

                // 如果玩家在攻击范围内，攻击
                if (distance <= this.attackRange) {
                    const currentTime = Date.now();

                    // 普通攻击
                    if (currentTime - this.lastAttackTime > this.attackCooldown) {
                        this.lastAttackTime = currentTime;
                        this.attack();
                    }

                    // 技能攻击（火焰冲击）
                    if (currentTime - this.lastSkillTime > this.skillCooldown) {
                        this.lastSkillTime = currentTime;
                        this.castSkill();
                    }
                }
                // 否则，向玩家移动
                else if (distance <= 15) {
                    const direction = new THREE.Vector3()
                        .subVectors(playerPosition, this.position)
                        .normalize();

                    direction.multiplyScalar(this.moveSpeed * deltaTime);
                    this.position.add(direction);

                    if (this.model) {
                        this.model.position.copy(this.position);
                        this.model.lookAt(playerPosition);
                    }
                }
            },
            attack: function() {
                // 对玩家造成伤害
                this.game.playerController.takeDamage(this.attack);

                // 播放攻击音效
                this.game.audioController.playSound('enemy-hit');
            },
            castSkill: function() {
                // 火焰冲击：范围伤害
                const damage = this.attack * 1.5;
                const radius = 5;

                // 创建火焰冲击效果
                const shockwaveGeometry = new THREE.RingGeometry(radius, 32);
                const shockwaveMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff4422, 
                    transparent: true, 
                    opacity: 0.7 
                });
                const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
                shockwave.position.copy(this.position);
                shockwave.position.y = 0.1;
                this.game.sceneManager.scene.add(shockwave);

                // 播放技能音效
                this.game.audioController.playSound('fire-spell');

                // 检查玩家是否在范围内
                const playerPosition = this.game.playerController.position;
                const distance = this.position.distanceTo(playerPosition);

                if (distance <= radius) {
                    // 对玩家造成伤害
                    this.game.playerController.takeDamage(damage);
                }

                // 动画效果：冲击波扩大并消失
                let scale = 0.1;
                const expandInterval = setInterval(() => {
                    scale += 0.1;
                    shockwave.scale.set(scale, scale, scale);
                    shockwave.material.opacity -= 0.07;

                    if (shockwave.material.opacity <= 0) {
                        clearInterval(expandInterval);
                        this.game.sceneManager.scene.remove(shockwave);
                    }
                }, 50);
            },
            takeDamage: function(damage) {
                // 受到伤害
                this.health -= damage;

                // 确保生命值不低于0
                this.health = Math.max(0, this.health);

                // 播放受伤动画
                if (this.model && this.model.animations && this.model.animations['hurt']) {
                    // 播放受伤动画
                }

                // 如果生命值为0，死亡
                if (this.health <= 0) {
                    this.die();
                }
            },
            die: function() {
                this.isDead = true;

                // 播放死亡动画
                if (this.model && this.model.animations && this.model.animations['death']) {
                    // 播放死亡动画
                }

                // 掉落物品
                this.dropItems();

                // 移除模型
                if (this.model) {
                    this.game.sceneManager.scene.remove(this.model);
                }

                // 从敌人列表中移除
                const index = this.game.sceneManager.currentScene.enemies.indexOf(this);
                if (index > -1) {
                    this.game.sceneManager.currentScene.enemies.splice(index, 1);
                }

                // 增加玩家经验
                this.game.playerController.addExperience(50);

                // 更新任务
                this.game.questSystem.updateQuestProgress('elite-challenge', 'fire-lord', 1);
            },
            dropItems: function() {
                // 掉落高级火焰结晶和混沌碎片
                this.game.inventorySystem.addItem('advanced-fire-crystal', 1);
                this.game.inventorySystem.addItem('chaos-fragment', 2);

                // 显示掉落提示
                this.game.uiController.showNotification('获得高级火焰结晶 x1，混沌碎片 x2');
            }
        };

        // 加载火焰领主模型
        const fireLordModel = this.game.resourceManager.getResource('models','fire-lord');
        if (fireLordModel) {
            fireLord.model = fireLordModel.clone();
            fireLord.model.position.copy(fireLord.position);
            fireLord.model.rotation.copy(fireLord.rotation);
            fireLord.model.scale.set(1.5, 1.5, 1.5);
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.BoxGeometry(2, 3, 2);
            const material = new THREE.MeshPhongMaterial({ color: 0xff2222 });
            fireLord.model = new THREE.Mesh(geometry, material);
            fireLord.model.position.copy(fireLord.position);
            fireLord.model.rotation.copy(fireLord.rotation);
        }

        // 设置阴影
        if (fireLord.model) {
            fireLord.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }

        this.enemies.push(fireLord);
    }

    /**
     * 创建物体
     */
    createObjects() {
        // 创建NPC商人
        this.createNPCs();
        // 创建宝箱
        for (let i = 0; i < 3; i++) {
            const treasureChest = {
                id: `treasure-chest-${i}`,
                name: '宝箱',
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 30,
                    0,
                    (Math.random() - 0.5) * 30
                ),
                rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
                model: null,
                isOpened: false,
                interaction: () => {
                    if (treasureChest.isOpened) {
                        this.game.uiController.showDialogue(
                            '宝箱',
                            '这个宝箱已经被打开过了。'
                        );
                        return;
                    }

                    // 打开宝箱
                    treasureChest.isOpened = true;

                    // 播放打开动画
                    if (treasureChest.model && treasureChest.model.animations && treasureChest.model.animations['open']) {
                        // 播放打开动画
                    }

                    // 播放打开音效
                    this.game.audioController.playSound('chest-open');

                    // 随机掉落物品
                    const random = Math.random();
                    let item;

                    if (random < 0.7) {
                        // 70%概率掉落火焰结晶
                        item = 'fire-crystal';
                        this.game.inventorySystem.addItem(item, 1);
                        this.game.uiController.showNotification(`获得火焰结晶 x1`);
                    } else {
                        // 30%概率掉落饰品
                        const accessories = ['life-necklace', 'mana-necklace', 'attack-ring', 'defense-ring'];
                        item = accessories[Math.floor(Math.random() * accessories.length)];
                        this.game.inventorySystem.addItem(item, 1);
                        this.game.uiController.showNotification(`获得${this.getItemName(item)} x1`);
                    }
                },
                update: function(deltaTime) {
                    // 宝箱不需要特殊更新
                },
                getItemName: function(itemId) {
                    const names = {
                        'life-necklace': '生命项链',
                        'mana-necklace': '魔法项链',
                        'attack-ring': '攻击戒指',
                        'defense-ring': '防御戒指'
                    };
                    return names[itemId] || '未知物品';
                }
            };

            // 加载宝箱模型
            const treasureChestModel = this.game.resourceManager.getResource('models','treasure-chest');
            if (treasureChestModel) {
                treasureChest.model = treasureChestModel.clone();
                treasureChest.model.position.copy(treasureChest.position);
                treasureChest.model.rotation.copy(treasureChest.rotation);
                treasureChest.model.scale.set(1, 1, 1);
            } else {
                // 如果没有模型，创建一个简单的占位符
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshPhongMaterial({ color: 0x886622 });
                treasureChest.model = new THREE.Mesh(geometry, material);
                treasureChest.model.position.copy(treasureChest.position);
                treasureChest.model.rotation.copy(treasureChest.rotation);
            }

            // 设置阴影
            if (treasureChest.model) {
                treasureChest.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }

            this.objects.push(treasureChest);
        }

        // 创建远古石碑
        const ancientStone = {
            id: 'ancient-stone-fire',
            name: '远古石碑',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            model: null,
            isRead: false,
            interaction: () => {
                if (ancientStone.isRead) {
                    this.game.uiController.showDialogue(
                        '远古石碑',
                        '这块石碑上的文字已经模糊不清，但似乎记录了关于火焰魔法的古老知识。'
                    );
                    return;
                }

                // 标记为已读
                ancientStone.isRead = true;

                // 显示石碑内容
                this.game.uiController.showDialogue(
                    '远古石碑',
                    '古老的火焰元素之力，源于创世之初的烈焰之心。掌握火焰魔法者，需有坚韧不拔的意志和炽热如火的激情。\n\n' +
                    '火焰咒语以高伤害和持续效果著称，但消耗也较大。初学者应从"火焰弹"开始，逐步掌握更强大的咒语。'
                );

                // 更新任务
                this.game.questSystem.updateQuestProgress('ancient-knowledge', 'fire-stone', 1);
            },
            update: function(deltaTime) {
                // 石碑不需要特殊更新
            }
        };

        // 加载远古石碑模型
        const ancientStoneModel = this.game.resourceManager.getResource('models','ancient-stone');
        if (ancientStoneModel) {
            ancientStone.model = ancientStoneModel.clone();
            ancientStone.model.position.copy(ancientStone.position);
            ancientStone.model.rotation.copy(ancientStone.rotation);
            ancientStone.model.scale.set(1, 1, 1);
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0xaa4422 });
            ancientStone.model = new THREE.Mesh(geometry, material);
            ancientStone.model.position.copy(ancientStone.position);
            ancientStone.model.rotation.copy(ancientStone.rotation);
        }

        // 设置阴影
        if (ancientStone.model) {
            ancientStone.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }

        this.objects.push(ancientStone);
    }

    /**
     * 创建粒子效果
     */
    createParticles() {
        // 创建熔岩火花
        const lavaSparks = this.game.resourceManager.getResource('particles','fire').clone();
        lavaSparks.position.set(0, 1, 0);
        this.particles.push(lavaSparks);

        // 为每个熔岩池添加火花效果
        for (let i = 0; i < 3; i++) {
            const sparks = this.game.resourceManager.getResource('particles','fire').clone();
            sparks.position.set(
                (Math.random() - 0.5) * 30,
                0.5,
                (Math.random() - 0.5) * 30
            );
            sparks.scale.set(0.5, 0.5, 0.5);
            this.particles.push(sparks);
        }
    }

    /**
     * 检查玩家交互
     */
    checkPlayerInteraction() {
        const playerPosition = this.game.playerController.position;
        const interactionDistance = 2.0; // 交互距离

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

      /**
     * 创建NPC
     */
    createNPCs() {
        // 创建火焰峡谷商人
        this.game.npcController.addNPC({
            id: 'fire-canyon-merchant',
            name: '火焰商人',
            position: new THREE.Vector3(15, 0, 15),
            modelId: 'npc-merchant',
            dialogue: {
                greeting: '欢迎来到火焰峡谷，年轻的法师！这里充满了危险，但也蕴藏着巨大的机遇。我有一些特殊的火焰道具，或许对你有用。',
                options: [
                    {
                        text: '购买火焰结晶 (50金币)',
                        condition: () => this.game.playerController.gold >= 50,
                        effects: () => {
                            this.game.playerController.gold -= 50;
                            this.game.playerController.addItem('fire-crystal', 1);
                            this.game.uiController.showMessage('你购买了火焰结晶！');
                        }
                    },
                    {
                        text: '购买火焰药水 (80金币)',
                        condition: () => this.game.playerController.gold >= 80,
                        effects: () => {
                            this.game.playerController.gold -= 80;
                            this.game.playerController.addItem('fire-potion', 1);
                            this.game.uiController.showMessage('你购买了火焰药水！');
                        }
                    },
                    {
                        text: '这里有什么危险？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('火焰峡谷中栖息着火焰幼兽和强大的火焰领主。它们对火焰魔法有很强的抗性，建议使用冰霜或雷电咒语对付它们。');
                        }
                    }
                ]
            }
        });

        // 创建火焰峡谷导师
        this.game.npcController.addNPC({
            id: 'fire-canyon-mentor',
            name: '火焰导师',
            position: new THREE.Vector3(-10, 0, 20),
            modelId: 'npc-mentor',
            dialogue: {
                greeting: '年轻的学徒，你渴望掌握火焰魔法的力量吗？火焰是毁灭与重生的象征，它需要坚定的意志才能驾驭。',
                options: [
                    {
                        text: '我想学习火焰咒语',
                        condition: () => this.game.playerController.level >= 3 && !this.game.playerController.hasSpell('fireball'),
                        effects: () => {
                            this.game.playerController.learnSpell('fireball');
                            this.game.uiController.showMessage('你学会了火焰弹咒语！');
                        }
                    },
                    {
                        text: '火焰魔法的原理是什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('火焰魔法源于元素之力的转化。我们将魔力转化为纯粹的火焰能量，通过咒语的形式释放出来。火焰咒语通常具有高伤害和持续燃烧效果，但消耗的法力也较多。');
                        }
                    },
                    {
                        text: '我需要更多练习',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('明智的选择，充分的准备是成功的关键。');
                        }
                    }
                ]
            }
        });

        // 创建受伤的探险者
        this.game.npcController.addNPC({
            id: 'fire-canyon-explorer',
            name: '受伤的探险者',
            position: new THREE.Vector3(-20, 0, -10),
            modelId: 'npc-villager',
            dialogue: {
                greeting: '啊... 年轻人，请帮帮我。我在探索峡谷时不小心被火焰幼兽攻击了，现在伤势很重。',
                options: [
                    {
                        text: '我来帮你治疗',
                        condition: () => this.game.playerController.health > 50,
                        effects: () => {
                            this.game.playerController.takeDamage(20);
                            this.game.uiController.showMessage('你帮助了受伤的探险者！他告诉你：在峡谷的深处有一个隐藏的宝箱，里面有一件强大的火焰抗性装备。');
                        }
                    },
                    {
                        text: '我这里有药水',
                        condition: () => this.game.playerController.hasItem('health-potion'),
                        effects: () => {
                            this.game.playerController.removeItem('health-potion', 1);
                            this.game.uiController.showMessage('探险者很感激你的帮助！');
                        }
                    },
                    {
                        text: '对不起，我帮不了你',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('探险者理解你的困难，并提醒你要小心前行。');
                        }
                    }
                ]
            }
        });

        // 创建火焰峡谷守卫
        this.game.npcController.addNPC({
            id: 'fire-canyon-guard',
            name: '峡谷守卫',
            position: new THREE.Vector3(0, 0, 30),
            modelId: 'npc-guard',
            dialogue: {
                greeting: '站住！前方是火焰峡谷的核心区域，只有经过考验的法师才能进入。你准备好了吗？',
                options: [
                    {
                        text: '我已经准备好了',
                        condition: () => this.game.playerController.level >= 5,
                        effects: () => {
                            this.game.uiController.showMessage('很好！你的勇气值得赞赏。记住，火焰领主是这里最强大的存在，它守护着古老的火焰秘密。祝你好运，年轻的法师！');
                        }
                    },
                    {
                        text: '我需要更多准备',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('明智的选择。充分的准备是成功的关键。去提升你的等级，收集更好的装备，学习更强大的咒语。');
                        }
                    },
                    {
                        text: '这里有什么考验？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('火焰峡谷的考验分为三个层次：首先是火焰幼兽的围攻，然后是穿越熔岩池的敏捷测试，最后是与火焰领主的正面对决。');
                        }
                    }
                ]
            }
        });
    }

    /**
     * 检查战斗状态
     */
    checkCombatStatus() {
        const playerPosition = this.game.playerController.position;
        let inCombat = false;
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        // 检查是否有敌人在附近
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;

            const distance = playerPosition.distanceTo(enemy.position);

            if (distance < 10) {
                inCombat = true;

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        }

        // 更新战斗面板
        if (inCombat && nearestEnemy) {
            this.game.uiController.showCombatPanel(
                nearestEnemy.type === 'fire-lord' ? '火焰领主' : '火焰幼兽',
                nearestEnemy.level,
                nearestEnemy.health,
                nearestEnemy.maxHealth
            );
        } else {
            this.game.uiController.hideCombatPanel();
        }
    }
    /**
     * 创建粒子效果
     */
    createParticles() {
        // 创建火焰粒子
        const fireParticleCount = 150;
        const fireGeometry = new THREE.BufferGeometry();
        const firePositions = new Float32Array(fireParticleCount * 3);
        const fireColors = new Float32Array(fireParticleCount * 3);
        const fireSizes = new Float32Array(fireParticleCount);
        const fireVelocities = [];

        for (let i = 0; i < fireParticleCount; i++) {
            // 随机位置（集中在峡谷底部）
            const theta = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30 + 5;

            firePositions[i * 3] = radius * Math.sin(theta);
            firePositions[i * 3 + 1] = Math.random() * 5;  // 靠近地面
            firePositions[i * 3 + 2] = radius * Math.cos(theta);

            // 颜色（橙色到红色渐变）
            const colorVariation = Math.random();
            fireColors[i * 3] = 1.0;                                    // R
            fireColors[i * 3 + 1] = 0.4 + colorVariation * 0.4;         // G
            fireColors[i * 3 + 2] = colorVariation * 0.3;               // B

            // 大小
            fireSizes[i] = Math.random() * 0.4 + 0.1;

            // 速度（向上飘升）
            fireVelocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: Math.random() * 0.05 + 0.01,
                z: (Math.random() - 0.5) * 0.02,
                life: 1.0,
                decay: Math.random() * 0.01 + 0.005
            });
        }

        fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
        fireGeometry.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));
        fireGeometry.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));

        const fireMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const fireParticles = new THREE.Points(fireGeometry, fireMaterial);
        fireParticles.userData.velocities = fireVelocities;
        this.particles.push(fireParticles);
        this.scene.add(fireParticles);

        // 创建烟雾粒子
        const smokeParticleCount = 100;
        const smokeGeometry = new THREE.BufferGeometry();
        const smokePositions = new Float32Array(smokeParticleCount * 3);
        const smokeColors = new Float32Array(smokeParticleCount * 3);
        const smokeSizes = new Float32Array(smokeParticleCount);
        const smokeVelocities = [];

        for (let i = 0; i < smokeParticleCount; i++) {
            // 随机位置（集中在峡谷底部）
            const theta = Math.random() * Math.PI * 2;
            const radius = Math.random() * 35 + 5;

            smokePositions[i * 3] = radius * Math.sin(theta);
            smokePositions[i * 3 + 1] = Math.random() * 3;  // 靠近地面
            smokePositions[i * 3 + 2] = radius * Math.cos(theta);

            // 颜色（灰色到深灰色）
            const grayLevel = 0.3 + Math.random() * 0.3;
            smokeColors[i * 3] = grayLevel;
            smokeColors[i * 3 + 1] = grayLevel;
            smokeColors[i * 3 + 2] = grayLevel;

            // 大小
            smokeSizes[i] = Math.random() * 0.8 + 0.2;

            // 速度（缓慢上升）
            smokeVelocities.push({
                x: (Math.random() - 0.5) * 0.01,
                y: Math.random() * 0.02 + 0.005,
                z: (Math.random() - 0.5) * 0.01,
                life: 1.0,
                decay: Math.random() * 0.005 + 0.002
            });
        }

        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
        smokeGeometry.setAttribute('color', new THREE.BufferAttribute(smokeColors, 3));
        smokeGeometry.setAttribute('size', new THREE.BufferAttribute(smokeSizes, 1));

        const smokeMaterial = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.NormalBlending
        });

        const smokeParticles = new THREE.Points(smokeGeometry, smokeMaterial);
        smokeParticles.userData.velocities = smokeVelocities;
        this.particles.push(smokeParticles);
        this.scene.add(smokeParticles);
    }

}