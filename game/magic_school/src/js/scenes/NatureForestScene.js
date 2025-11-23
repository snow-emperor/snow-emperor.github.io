
/**
 * 自然森林场景
 * 自然元素的试炼场，包含藤蔓怪和自然守护者
 */
import * as THREE from 'three';

export class NatureForestScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.playerStartPosition = new THREE.Vector3(0, 0, 10);
        this.enemies = [];
        this.objects = [];
        this.lights = [];
        this.particles = [];
        this.trees = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x2a4d3a, 10, 100);

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

        // 设置自然效果
        this.setupNatureEffects();
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
        this.scene.children.forEach(child => {
            this.game.sceneManager.scene.add(child.clone());
        });

        // 设置玩家位置
        this.game.playerController.position.copy(this.playerStartPosition);

        // 初始化敌人
        this.enemies.forEach(enemy => {
            this.game.sceneManager.scene.add(enemy.model);
            enemy.reset();
        });

        // 初始化物体
        this.objects.forEach(obj => {
            this.game.sceneManager.scene.add(obj.model);
        });

        // 初始化光照
        this.lights.forEach(light => {
            this.game.sceneManager.scene.add(light.clone());
        });

        // 初始化粒子
        this.particles.forEach(particle => {
            this.game.sceneManager.scene.add(particle);
        });
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.lights.push(ambientLight);

        // 方向光（模拟阳光透过树叶）
        const directionalLight = new THREE.DirectionalLight(0xffffcc, 0.6);
        directionalLight.position.set(0, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.lights.push(directionalLight);

        // 模拟阳光斑驳效果
        for (let i = 0; i < 5; i++) {
            const spotLight = new THREE.SpotLight(0xffffcc, 0.3, 30, Math.PI / 6, 0.5, 1);
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 10;
            spotLight.position.set(
                Math.cos(angle) * distance,
                20 + Math.random() * 10,
                Math.sin(angle) * distance
            );
            spotLight.target.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            spotLight.castShadow = true;
            this.lights.push(spotLight);
            this.lights.push(spotLight.target);
        }
    }

    /**
     * 加载场景模型
     */
    async loadSceneModel() {
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a5f47,
            roughness: 0.8,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 创建草地纹理
        const grassGeometry = new THREE.PlaneGeometry(100, 100);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c59,
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.7
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0.01;
        this.scene.add(grass);

        // 创建树木
        this.createTrees();

        // 创建岩石
        for (let i = 0; i < 10; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x7a6a5a,
                roughness: 0.9,
                metalness: 0.1
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);

            // 随机位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40 + 10;
            rock.position.x = Math.cos(angle) * distance;
            rock.position.y = Math.random() * 1;
            rock.position.z = Math.sin(angle) * distance;

            // 随机旋转
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;

            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
        }

        // 创建小溪
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-40, 0, -20),
            new THREE.Vector3(-20, 0, -10),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(20, 0, 10),
            new THREE.Vector3(40, 0, 20)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 1, 8, false);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.7,
            roughness: 0.2,
            metalness: 0.8
        });
        const stream = new THREE.Mesh(tubeGeometry, waterMaterial);
        stream.position.y = 0.1;
        this.scene.add(stream);
    }

    /**
     * 创建树木
     */
    createTrees() {
        // 创建不同类型的树
        for (let i = 0; i < 30; i++) {
            const treeType = Math.floor(Math.random() * 3);
            let treeGroup = new THREE.Group();

            if (treeType === 0) {
                // 针叶树
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8b4513,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 2.5;
                trunk.castShadow = true;
                treeGroup.add(trunk);

                // 树冠（三层）
                for (let j = 0; j < 3; j++) {
                    const foliageGeometry = new THREE.ConeGeometry(3 - j * 0.5, 2, 8);
                    const foliageMaterial = new THREE.MeshStandardMaterial({
                        color: 0x2d5a2d,
                        roughness: 0.9,
                        metalness: 0.1
                    });
                    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                    foliage.position.y = 5 + j * 1.5;
                    foliage.castShadow = true;
                    treeGroup.add(foliage);
                }
            } else if (treeType === 1) {
                // 阔叶树
                const trunkGeometry = new THREE.CylinderGeometry(0.7, 1, 6, 8);
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8b4513,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 3;
                trunk.castShadow = true;
                treeGroup.add(trunk);

                // 树冠
                const foliageGeometry = new THREE.SphereGeometry(4, 8, 6);
                const foliageMaterial = new THREE.MeshStandardMaterial({
                    color: 0x3d7e3d,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.y = 7;
                foliage.castShadow = true;
                treeGroup.add(foliage);
            } else {
                // 棕榈树
                const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8, 8);
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: 0xa0826d,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 4;
                trunk.castShadow = true;
                treeGroup.add(trunk);

                // 树叶
                for (let j = 0; j < 8; j++) {
                    const leafGeometry = new THREE.PlaneGeometry(3, 1);
                    const leafMaterial = new THREE.MeshStandardMaterial({
                        color: 0x2d5a2d,
                        side: THREE.DoubleSide,
                        roughness: 0.9,
                        metalness: 0.1
                    });
                    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                    const angle = (j / 8) * Math.PI * 2;
                    leaf.position.set(
                        Math.cos(angle) * 2,
                        8,
                        Math.sin(angle) * 2
                    );
                    leaf.rotation.y = angle;
                    leaf.rotation.z = Math.PI / 6;
                    leaf.castShadow = true;
                    treeGroup.add(leaf);
                }
            }

            // 随机位置
            let validPosition = false;
            let position = new THREE.Vector3();

            // 尝试找到不与其他物体重叠的位置
            for (let attempts = 0; attempts < 10 && !validPosition; attempts++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 45 + 5;
                position.x = Math.cos(angle) * distance;
                position.y = 0;
                position.z = Math.sin(angle) * distance;

                validPosition = true;
                // 检查是否与其他树太近
                for (const tree of this.trees) {
                    const dist = position.distanceTo(tree.position);
                    if (dist < 5) {
                        validPosition = false;
                        break;
                    }
                }
            }

            treeGroup.position.copy(position);
            treeGroup.castShadow = true;
            treeGroup.receiveShadow = true;

            this.trees.push({
                position: position.clone(),
                model: treeGroup
            });

            this.scene.add(treeGroup);
        }
    }

    /**
     * 创建敌人
     */
    createEnemies() {
        // 创建藤蔓怪
        for (let i = 0; i < 8; i++) {
            const enemy = {
                type: 'vine-monster',
                model: null,
                position: new THREE.Vector3(),
                health: 85,
                maxHealth: 85,
                attack: 10,
                defense: 3,
                level: 2,
                experience: 30,
                loot: {
                    'nature-crystal': { chance: 1.0, min: 1, max: 1 }
                },
                ai: {
                    state: 'idle', // idle, patrol, chase, attack
                    target: null,
                    patrolPath: [],
                    currentPatrolIndex: 0,
                    attackCooldown: 0,
                    attackInterval: 2200, // 2.2秒
                    detectionRange: 12,
                    attackRange: 5
                },
                reset: function() {
                    this.health = this.maxHealth;
                    this.ai.state = 'idle';
                    this.ai.target = null;
                    this.ai.attackCooldown = 0;
                }
            };

            // 创建藤蔓怪模型
            const monsterGroup = new THREE.Group();

            // 身体（由藤蔓缠绕而成）
            const bodyGeometry = new THREE.SphereGeometry(1.5, 8, 6);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x2d5a2d,
                roughness: 0.9,
                metalness: 0.1
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 2;
            monsterGroup.add(body);

            // 藤蔓
            for (let j = 0; j < 6; j++) {
                const vineCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0, 2, 0),
                    new THREE.Vector3(
                        Math.sin(j * Math.PI / 3) * 1.5,
                        1.5,
                        Math.cos(j * Math.PI / 3) * 1.5
                    ),
                    new THREE.Vector3(
                        Math.sin(j * Math.PI / 3) * 2,
                        0.5,
                        Math.cos(j * Math.PI / 3) * 2
                    ),
                    new THREE.Vector3(
                        Math.sin(j * Math.PI / 3) * 1.5,
                        0,
                        Math.cos(j * Math.PI / 3) * 1.5
                    )
                ]);

                const vineGeometry = new THREE.TubeGeometry(vineCurve, 10, 0.1, 8, false);
                const vineMaterial = new THREE.MeshStandardMaterial({
                    color: 0x3d7e3d,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const vine = new THREE.Mesh(vineGeometry, vineMaterial);
                monsterGroup.add(vine);
            }

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x99ff33,
                emissive: 0x66cc00,
                emissiveIntensity: 0.5
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.5, 2.2, 1.2);
            monsterGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.5, 2.2, 1.2);
            monsterGroup.add(rightEye);

            // 设置位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 10;
            enemy.position.x = Math.cos(angle) * distance;
            enemy.position.y = 0;
            enemy.position.z = Math.sin(angle) * distance;

            monsterGroup.position.copy(enemy.position);
            monsterGroup.castShadow = true;

            enemy.model = monsterGroup;
            this.enemies.push(enemy);
            this.scene.add(enemy.model);
        }

        // 创建自然守护者
        for (let i = 0; i < 2; i++) {
            const enemy = {
                type: 'nature-guardian',
                model: null,
                position: new THREE.Vector3(),
                health: 350,
                maxHealth: 350,
                attack: 35,
                defense: 16,
                level: 6,
                experience: 150,
                loot: {
                    'advanced-nature-crystal': { chance: 1.0, min: 1, max: 1 },
                    'chaos-fragment': { chance: 1.0, min: 2, max: 2 }
                },
                skills: [
                    {
                        name: 'life-regeneration',
                        cooldown: 7000, // 7秒
                        lastUsed: 0,
                        description: '每7秒恢复自身50点生命值'
                    }
                ],
                ai: {
                    state: 'idle', // idle, patrol, chase, attack
                    target: null,
                    patrolPath: [],
                    currentPatrolIndex: 0,
                    attackCooldown: 0,
                    attackInterval: 2500, // 2.5秒
                    skillCooldown: 0,
                    detectionRange: 20,
                    attackRange: 8
                },
                reset: function() {
                    this.health = this.maxHealth;
                    this.ai.state = 'idle';
                    this.ai.target = null;
                    this.ai.attackCooldown = 0;
                    this.ai.skillCooldown = 0;
                    this.skills.forEach(skill => {
                        skill.lastUsed = 0;
                    });
                }
            };

            // 创建自然守护者模型
            const guardianGroup = new THREE.Group();

            // 身体
            const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.8, 5, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a7c59,
                roughness: 0.9,
                metalness: 0.1
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 2.5;
            guardianGroup.add(body);

            // 头部
            const headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0x5a8c69,
                roughness: 0.9,
                metalness: 0.1
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 5.5;
            guardianGroup.add(head);

            // 树叶环绕
            for (let j = 0; j < 12; j++) {
                const leafGeometry = new THREE.PlaneGeometry(1.5, 0.8);
                const leafMaterial = new THREE.MeshStandardMaterial({
                    color: 0x3d7e3d,
                    side: THREE.DoubleSide,
                    roughness: 0.9,
                    metalness: 0.1
                });
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

                const angle = (j / 12) * Math.PI * 2;
                const height = 2 + (j % 3) * 1.2;

                leaf.position.set(
                    Math.cos(angle) * 2.5,
                    height,
                    Math.sin(angle) * 2.5
                );
                leaf.rotation.y = angle;
                leaf.rotation.z = Math.random() * 0.5 - 0.25;

                guardianGroup.add(leaf);
            }

            // 手臂
            const armGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
            const armMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a7c59,
                roughness: 0.9,
                metalness: 0.1
            });

            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-2, 2.5, 0);
            leftArm.rotation.z = Math.PI / 6;
            guardianGroup.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(2, 2.5, 0);
            rightArm.rotation.z = -Math.PI / 6;
            guardianGroup.add(rightArm);

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x99ff33,
                emissive: 0x66cc00,
                emissiveIntensity: 0.7
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.4, 5.6, 0.9);
            guardianGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.4, 5.6, 0.9);
            guardianGroup.add(rightEye);

            // 设置位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 20;
            enemy.position.x = Math.cos(angle) * distance;
            enemy.position.y = 0;
            enemy.position.z = Math.sin(angle) * distance;

            guardianGroup.position.copy(enemy.position);
            guardianGroup.castShadow = true;

            enemy.model = guardianGroup;
            this.enemies.push(enemy);
            this.scene.add(enemy.model);
        }
    }

    /**
     * 创建物体
     */
    createObjects() {
        // 创建宝箱
        for (let i = 0; i < 3; i++) {
            const chest = {
                type: 'chest',
                model: null,
                position: new THREE.Vector3(),
                isOpened: false,
                loot: {
                    'nature-crystal': { chance: 0.7, min: 1, max: 3 },
                    'defense-ring': { chance: 0.3, min: 1, max: 1 }
                },
                interact: function() {
                    if (!this.isOpened) {
                        this.isOpened = true;
                        // 播放打开动画
                        const lid = this.model.getObjectByName('lid');
                        if (lid) {
                            const openAnimation = new TWEEN.Tween(lid.rotation)
                                .to({ x: -Math.PI / 2 }, 1000)
                                .easing(TWEEN.Easing.Quadratic.Out)
                                .start();
                        }

                        // 发放奖励
                        for (const [itemId, itemData] of Object.entries(this.loot)) {
                            if (Math.random() < itemData.chance) {
                                const amount = Math.floor(Math.random() * (itemData.max - itemData.min + 1)) + itemData.min;
                                this.game.playerController.addItem(itemId, amount);
                            }
                        }

                        // 显示获取物品提示
                        this.game.uiController.showNotification('宝箱已打开，获得了物品！');
                    }
                }
            };

            // 创建宝箱模型
            const chestGroup = new THREE.Group();

            // 箱体
            const boxGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
            const boxMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.7,
                metalness: 0.3
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.y = 0.75;
            chestGroup.add(box);

            // 箱盖
            const lidGeometry = new THREE.BoxGeometry(2.1, 0.2, 1.6);
            const lidMaterial = new THREE.MeshStandardMaterial({
                color: 0xA0522D,
                roughness: 0.7,
                metalness: 0.3
            });
            const lid = new THREE.Mesh(lidGeometry, lidMaterial);
            lid.position.set(0, 1.6, 0);
            lid.name = 'lid';
            chestGroup.add(lid);

            // 锁
            const lockGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
            const lockMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFD700,
                roughness: 0.3,
                metalness: 0.7
            });
            const lock = new THREE.Mesh(lockGeometry, lockMaterial);
            lock.rotation.z = Math.PI / 2;
            lock.position.set(0, 1.5, 0.8);
            chestGroup.add(lock);

            // 设置位置
            let validPosition = false;

            // 尝试找到不与树太近的位置
            for (let attempts = 0; attempts < 10 && !validPosition; attempts++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30 + 5;
                chest.position.x = Math.cos(angle) * distance;
                chest.position.y = 0;
                chest.position.z = Math.sin(angle) * distance;

                validPosition = true;
                // 检查是否与树太近
                for (const tree of this.trees) {
                    const dist = chest.position.distanceTo(tree.position);
                    if (dist < 3) {
                        validPosition = false;
                        break;
                    }
                }
            }

            chestGroup.position.copy(chest.position);
            chestGroup.castShadow = true;
            chestGroup.receiveShadow = true;

            chest.model = chestGroup;
            this.objects.push(chest);
            this.scene.add(chest.model);
        }
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        // 自然德鲁伊 - 森林的守护者
        this.game.npcController.addNPC({
            id: 'nature-druid',
            name: '自然德鲁伊艾文',
            position: new THREE.Vector3(-15, 0, -10),
            modelId: 'druid',
            dialogue: {
                greeting: '欢迎来到古老的森林，年轻的学徒。我是艾文，这片森林的守护者。',
                options: [
                    {
                        text: '我想学习自然魔法',
                        condition: () => !this.game.playerController.hasSpell('nature-heal'),
                        effects: () => {
                            this.game.playerController.learnSpell('nature-heal');
                            this.game.uiController.showMessage('你学会了自然治愈术！');
                        }
                    },
                    {
                        text: '森林中有什么危险吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('要小心藤蔓怪，它们会伪装成普通植物突然袭击。');
                        }
                    },
                    {
                        text: '我需要一些草药',
                        condition: () => this.game.playerController.gold >= 20,
                        effects: () => {
                            this.game.playerController.gold -= 20;
                            this.game.playerController.addItem('healing-herb', 3);
                            this.game.uiController.showMessage('你购买了3个治疗草药！');
                        }
                    }
                ]
            }
        });

        // 森林商人 - 出售自然物品
        this.game.npcController.addNPC({
            id: 'forest-merchant',
            name: '森林商人莉娜',
            position: new THREE.Vector3(20, 0, 15),
            modelId: 'merchant',
            dialogue: {
                greeting: '你好，冒险者！我这里有最好的森林特产。',
                options: [
                    {
                        text: '购买生命药水 (50金币)',
                        condition: () => this.game.playerController.gold >= 50,
                        effects: () => {
                            this.game.playerController.gold -= 50;
                            this.game.playerController.addItem('health-potion', 1);
                            this.game.uiController.showMessage('你购买了生命药水！');
                        }
                    },
                    {
                        text: '购买魔法草药 (30金币)',
                        condition: () => this.game.playerController.gold >= 30,
                        effects: () => {
                            this.game.playerController.gold -= 30;
                            this.game.playerController.addItem('mana-herb', 2);
                            this.game.uiController.showMessage('你购买了魔法草药！');
                        }
                    },
                    {
                        text: '森林中有什么宝藏吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('传说森林深处有古老的宝箱，但要小心守护它们的生物。');
                        }
                    }
                ]
            }
        });

        // 精灵法师 - 传授精灵魔法
        this.game.npcController.addNPC({
            id: 'forest-mage',
            name: '精灵法师希尔芙',
            position: new THREE.Vector3(0, 0, -25),
            modelId: 'elf-mage',
            dialogue: {
                greeting: '我感受到了你身上的魔法气息，年轻的学徒。我是希尔芙，精灵族的法师。',
                options: [
                    {
                        text: '我想学习精灵魔法',
                        condition: () => !this.game.playerController.hasSpell('wind-slash'),
                        effects: () => {
                            this.game.playerController.learnSpell('wind-slash');
                            this.game.uiController.showMessage('你学会了风刃术！');
                        }
                    },
                    {
                        text: '如何与森林生物交流？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('用心感受自然的气息，你就能听懂森林的低语。');
                        }
                    },
                    {
                        text: '请告诉我森林的秘密',
                        condition: () => this.game.playerController.level >= 5,
                        effects: () => {
                            this.game.uiController.showMessage('森林的中心有一棵千年古树，它见证了无数的故事...');
                        }
                    }
                ]
            }
        });
    }

    /**
     * 创建粒子效果
     */
    createParticles() {
        // 创建飘落的树叶粒子
        const leafCount = 100;
        const leafGeometry = new THREE.BufferGeometry();
        const leafPositions = new Float32Array(leafCount * 3);
        const leafColors = new Float32Array(leafCount * 3);
        const leafSizes = new Float32Array(leafCount);
        const leafVelocities = [];

        for (let i = 0; i < leafCount; i++) {
            // 随机位置
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 40 + 10;

            leafPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            leafPositions[i * 3 + 1] = Math.random() * 20 + 5;
            leafPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // 颜色（绿色到黄色渐变）
            const colorVariation = Math.random();
            leafColors[i * 3] = 0.3 + colorVariation * 0.4;     // R
            leafColors[i * 3 + 1] = 0.5 + colorVariation * 0.3; // G
            leafColors[i * 3 + 2] = 0.1;                          // B

            // 大小
            leafSizes[i] = Math.random() * 0.5 + 0.2;

            // 速度
            leafVelocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: -Math.random() * 0.05 - 0.01,
                z: (Math.random() - 0.5) * 0.02,
                rotation: Math.random() * 0.02
            });
        }

        leafGeometry.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
        leafGeometry.setAttribute('color', new THREE.BufferAttribute(leafColors, 3));
        leafGeometry.setAttribute('size', new THREE.BufferAttribute(leafSizes, 1));

        const leafMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });

        const leaves = new THREE.Points(leafGeometry, leafMaterial);
        leaves.userData.velocities = leafVelocities;
        this.particles.push(leaves);
        this.scene.add(leaves);

        // 创建萤火虫粒子
        const fireflyCount = 30;
        const fireflyGeometry = new THREE.BufferGeometry();
        const fireflyPositions = new Float32Array(fireflyCount * 3);
        const fireflyColors = new Float32Array(fireflyCount * 3);
        const fireflySizes = new Float32Array(fireflyCount);
        const fireflyVelocities = [];

        for (let i = 0; i < fireflyCount; i++) {
            // 随机位置
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 30 + 5;

            fireflyPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            fireflyPositions[i * 3 + 1] = Math.random() * 10 + 1;
            fireflyPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // 颜色（黄绿色）
            fireflyColors[i * 3] = 0.8;     // R
            fireflyColors[i * 3 + 1] = 1.0; // G
            fireflyColors[i * 3 + 2] = 0.2; // B

            // 大小
            fireflySizes[i] = Math.random() * 0.3 + 0.1;

            // 速度
            fireflyVelocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.03,
                z: (Math.random() - 0.5) * 0.05,
                pulse: Math.random() * Math.PI * 2
            });
        }

        fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
        fireflyGeometry.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));
        fireflyGeometry.setAttribute('size', new THREE.BufferAttribute(fireflySizes, 1));

        const fireflyMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
        fireflies.userData.velocities = fireflyVelocities;
        this.particles.push(fireflies);
        this.scene.add(fireflies);
    }

    /**
     * 设置自然效果
     */
    setupNatureEffects() {
        // 定期生成自然效果
        setInterval(() => {
            if (Math.random() < 0.2) { // 20%概率生成自然效果
                this.createNatureEffect();
            }
        }, 3000);
    }

    /**
     * 创建自然效果
     */
    createNatureEffect() {
        // 随机位置
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;

        // 创建花朵绽放效果
        const flowerGroup = new THREE.Group();

        // 花瓣
        for (let i = 0; i < 8; i++) {
            const petalGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            const petalMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
                transparent: true,
                opacity: 0.7
            });
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);

            const angle = (i / 8) * Math.PI * 2;
            petal.position.set(
                Math.cos(angle) * 0.5,
                0,
                Math.sin(angle) * 0.5
            );
            petal.scale.set(1, 0.3, 1);

            flowerGroup.add(petal);
        }

        // 花心
        const centerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);

        // 设置位置
        flowerGroup.position.set(x, 0.1, z);
        flowerGroup.scale.set(0.1, 0.1, 0.1);
        this.scene.add(flowerGroup);

        // 动画绽放
        const scaleAnimation = new TWEEN.Tween(flowerGroup.scale)
            .to({ x: 1, y: 1, z: 1 }, 1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();

        // 旋转动画
        const rotationAnimation = new TWEEN.Tween(flowerGroup.rotation)
            .to({ y: flowerGroup.rotation.y + Math.PI * 2 }, 3000)
            .easing(TWEEN.Easing.Linear.None)
            .start();

        // 播放自然音效
        this.game.audioController.playSound('nature-bloom');

        // 一段时间后移除
        setTimeout(() => {
            this.scene.remove(flowerGroup);
        }, 5000);
    }

    /**
     * 更新场景
     * @param {number} delta
     */
    update(delta) {
        // 更新粒子效果
        this.particles.forEach(particle => {
            if (particle.userData.velocities) {
                const positions = particle.geometry.attributes.position.array;
                const velocities = particle.userData.velocities;

                for (let i = 0; i < velocities.length; i++) {
                    const idx = i * 3;

                    // 更新位置
                    positions[idx] += velocities[i].x;
                    positions[idx + 1] += velocities[i].y;
                    positions[idx + 2] += velocities[i].z;

                    // 如果粒子太低，重置到顶部
                    if (positions[idx + 1] < 0) {
                        positions[idx + 1] = 20 + Math.random() * 10;
                        positions[idx] = (Math.random() - 0.5) * 80;
                        positions[idx + 2] = (Math.random() - 0.5) * 80;
                    }

                    // 如果粒子太远，重置到中心附近
                    const distance = Math.sqrt(
                        positions[idx] * positions[idx] + 
                        positions[idx + 2] * positions[idx + 2]
                    );

                    if (distance > 50) {
                        const angle = Math.random() * Math.PI * 2;
                        const newDistance = Math.random() * 20 + 5;
                        positions[idx] = Math.cos(angle) * newDistance;
                        positions[idx + 2] = Math.sin(angle) * newDistance;
                    }

                    // 萤火虫脉冲效果
                    if (velocities[i].pulse !== undefined) {
                        velocities[i].pulse += 0.05;
                        const intensity = (Math.sin(velocities[i].pulse) + 1) / 2;
                        particle.material.opacity = 0.4 + intensity * 0.4;
                    }
                }

                particle.geometry.attributes.position.needsUpdate = true;
            }
        });

        // 检查玩家交互
        this.checkPlayerInteraction();

        // 更新敌人AI
        this.enemies.forEach(enemy => {
            this.updateEnemyAI(enemy, delta);
        });
    }

    /**
     * 更新敌人AI
     * @param {Object} enemy
     * @param {number} delta
     */
    updateEnemyAI(enemy, delta) {
        const playerPos = this.game.playerController.position;
        const enemyPos = enemy.position;
        const distance = enemyPos.distanceTo(playerPos);

        // 根据距离更新AI状态
        if (distance <= enemy.ai.detectionRange) {
            if (distance <= enemy.ai.attackRange) {
                // 攻击状态
                enemy.ai.state = 'attack';
                enemy.ai.target = this.game.playerController;

                // 攻击冷却
                if (enemy.ai.attackCooldown <= 0) {
                    this.enemyAttack(enemy);
                    enemy.ai.attackCooldown = enemy.ai.attackInterval;
                } else {
                    enemy.ai.attackCooldown -= delta;
                }

                // 技能冷却
                if (enemy.skills && enemy.skills.length > 0) {
                    enemy.skills.forEach(skill => {
                        if (Date.now() - skill.lastUsed >= skill.cooldown) {
                            this.enemyUseSkill(enemy, skill);
                            skill.lastUsed = Date.now();
                        }
                    });
                }
            } else {
                // 追击状态
                enemy.ai.state = 'chase';
                enemy.ai.target = this.game.playerController;

                // 移向玩家
                const direction = new THREE.Vector3()
                    .subVectors(playerPos, enemyPos)
                    .normalize();

                // 根据敌人类型调整移动速度
                let moveSpeed = 1.0;
                if (enemy.type === 'vine-monster') {
                    moveSpeed = 0.9; // 藤蔓怪移动较慢
                } else if (enemy.type === 'nature-guardian') {
                    moveSpeed = 1.2; // 自然守护者移动较快
                }

                enemy.position.add(direction.multiplyScalar(moveSpeed * delta / 1000));
                enemy.model.position.copy(enemy.position);

                // 旋转面向玩家
                enemy.model.lookAt(playerPos);
            }
        } else {
            // 巡逻状态
            if (enemy.ai.state !== 'patrol') {
                enemy.ai.state = 'patrol';
                enemy.ai.target = null;

                // 生成巡逻路径
                enemy.ai.patrolPath = [];
                const patrolPoints = 3 + Math.floor(Math.random() * 3);

                for (let i = 0; i < patrolPoints; i++) {
                    const angle = (i / patrolPoints) * Math.PI * 2;
                    const radius = 5 + Math.random() * 5;

                    enemy.ai.patrolPath.push(new THREE.Vector3(
                        enemyPos.x + Math.cos(angle) * radius,
                        enemyPos.y,
                        enemyPos.z + Math.sin(angle) * radius
                    ));
                }

                enemy.ai.currentPatrolIndex = 0;
            }

            // 沿着巡逻路径移动
            if (enemy.ai.patrolPath.length > 0) {
                const targetPos = enemy.ai.patrolPath[enemy.ai.currentPatrolIndex];
                const direction = new THREE.Vector3()
                    .subVectors(targetPos, enemyPos)
                    .normalize();

                // 根据敌人类型调整移动速度
                let moveSpeed = 0.5;
                if (enemy.type === 'vine-monster') {
                    moveSpeed = 0.4; // 藤蔓怪移动较慢
                } else if (enemy.type === 'nature-guardian') {
                    moveSpeed = 0.6; // 自然守护者移动较快
                }

                enemy.position.add(direction.multiplyScalar(moveSpeed * delta / 1000));
                enemy.model.position.copy(enemy.position);

                // 旋转面向目标点
                enemy.model.lookAt(targetPos);

                // 如果到达目标点，切换到下一个
                if (enemyPos.distanceTo(targetPos) < 1) {
                    enemy.ai.currentPatrolIndex = (enemy.ai.currentPatrolIndex + 1) % enemy.ai.patrolPath.length;
                }
            }
        }
    }

    /**
     * 敌人攻击
     * @param {Object} enemy
     */
    enemyAttack(enemy) {
        // 计算伤害
        const damage = Math.max(1, enemy.attack - this.game.playerController.defense);

        // 对玩家造成伤害
        this.game.playerController.takeDamage(damage);

        // 显示伤害数字
        this.game.uiController.showDamageNumber(
            this.game.playerController.position,
            damage,
            'enemy'
        );

        // 播放攻击音效
        this.game.audioController.playSound(`${enemy.type}-attack`);

        // 播放攻击动画
        this.playEnemyAttackAnimation(enemy);
    }

    /**
     * 敌人使用技能
     * @param {Object} enemy
     * @param {Object} skill
     */
    enemyUseSkill(enemy, skill) {
        switch (skill.name) {
            case 'life-regeneration':
                // 恢复生命值
                const healAmount = 50;
                enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount);

                // 显示治疗数字
                this.game.uiController.showDamageNumber(
                    enemy.position,
                    healAmount,
                    'heal'
                );

                // 播放治疗特效
                this.playHealEffect(enemy);

                // 播放治疗音效
                this.game.audioController.playSound('nature-heal');
                break;
        }
    }

    /**
     * 播放敌人攻击动画
     * @param {Object} enemy
     */
    playEnemyAttackAnimation(enemy) {
        // 创建简单的攻击动画
        const originalScale = enemy.model.scale.x;

        // 攻击前缩放
        const attackPrep = new TWEEN.Tween(enemy.model.scale)
            .to({ x: originalScale * 1.2, y: originalScale * 1.2, z: originalScale * 1.2 }, 200)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        // 攻击后恢复
        const attackReset = new TWEEN.Tween(enemy.model.scale)
            .to({ x: originalScale, y: originalScale, z: originalScale }, 300)
            .easing(TWEEN.Easing.Bounce.Out)
            .start();

        attackPrep.chain(attackReset);
    }

    /**
     * 播放治疗特效
     * @param {Object} enemy
     */
    playHealEffect(enemy) {
        // 创建治疗粒子
        const particleCount = 20;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);

            // 随机位置
            particle.position.copy(enemy.position);
            particle.position.y += Math.random() * 2;
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.z += (Math.random() - 0.5) * 2;

            this.scene.add(particle);
            particles.push(particle);
        }

        // 粒子上升并消失
        particles.forEach(particle => {
            const riseAnimation = new TWEEN.Tween(particle.position)
                .to({ y: particle.position.y + 3 }, 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();

            const fadeAnimation = new TWEEN.Tween(particle.material)
                .to({ opacity: 0 }, 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    this.scene.remove(particle);
                })
                .start();
        });
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        // 森林守护者
        this.game.npcController.addNPC({
            id: 'forest-guardian',
            name: '森林守护者',
            position: new THREE.Vector3(15, 0, 15),
            modelId: 'forest-guardian',
            dialogue: {
                greeting: '欢迎来到自然森林，年轻的冒险者。我是这片森林的守护者，负责保护这里的平衡与和谐。',
                options: [
                    {
                        text: '告诉我关于这片森林的事情',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('这片自然森林是埃瑟里亚大陆最古老的生命之源。这里的每一棵树、每一株草都蕴含着纯净的自然魔力。森林深处居住着许多神奇的生物，但也潜藏着危险。');
                        }
                    },
                    {
                        text: '我需要自然咒语的帮助',
                        condition: () => this.game.playerController.specialization === 'nature',
                        effects: () => {
                            this.game.uiController.showSpellSelection('nature');
                        }
                    },
                    {
                        text: '森林中有哪些危险？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('森林中主要有两种威胁：藤蔓怪会缠绕入侵者，而自然守护者虽然通常温和，但在感受到威胁时会变得极具攻击性。记住，与自然和谐相处是关键。');
                        }
                    },
                    {
                        text: '我该如何与自然和谐相处？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('尊重每一个生命，不要无故伤害森林中的生物。使用自然魔法时要保持内心的平静，让魔力像溪流一样自然流动。当你需要帮助时，自然之力会回应你的呼唤。');
                        }
                    }
                ]
            }
        });

        // 德鲁伊长老
        this.game.npcController.addNPC({
            id: 'druid-elder',
            name: '德鲁伊长老',
            position: new THREE.Vector3(-20, 0, -15),
            modelId: 'druid-elder',
            dialogue: {
                greeting: '我感受到了你身上的自然气息，年轻的学徒。我是德鲁伊长老，已经在这片森林中生活了数百年。',
                options: [
                    {
                        text: '请教我自然魔法的奥秘',
                        condition: () => this.game.playerController.specialization === 'nature',
                        effects: () => {
                            this.game.uiController.showMessage('自然魔法的真谛在于理解和尊重。你要学会倾听风的声音，感受大地的脉搏，观察植物的生长。当你真正理解自然的循环时，你就能掌握它的力量。');
                        }
                    },
                    {
                        text: '我需要治疗药剂',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showShop('nature-potions');
                        }
                    },
                    {
                        text: '森林最近有什么异常吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('确实有些不寻常。最近森林中的魔力流动变得有些紊乱，一些通常温和的植物变得具有攻击性。我怀疑是混沌裂隙的影响开始波及到这里了。');
                        }
                    },
                    {
                        text: '我该如何成为一名真正的德鲁伊？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('成为德鲁伊需要时间和耐心。首先，你要学会尊重所有生命形式。其次，你要培养对自然魔力的敏感度。最后，你要学会在需要时寻求帮助，在可能时提供帮助。这是一个终身的修行过程。');
                        }
                    }
                ]
            }
        });

        // 受伤的探险者
        this.game.npcController.addNPC({
            id: 'injured-explorer',
            name: '受伤的探险者',
            position: new THREE.Vector3(25, 0, -20),
            modelId: 'injured-explorer',
            dialogue: {
                greeting: '啊...终于有人来了。我在探索这片森林时不小心被藤蔓怪袭击了，现在受了伤，无法继续前进。',
                options: [
                    {
                        text: '我来帮你治疗',
                        condition: () => this.game.playerController.specialization === 'nature',
                        effects: () => {
                            this.game.uiController.showMessage('你使用自然魔法为探险者治疗伤口。绿色的光芒笼罩着他的身体，伤口开始慢慢愈合。"谢谢你，善良的法师。作为回报，让我告诉你一个秘密：森林深处有一棵千年古树，它蕴含着强大的自然魔力。"');
                        }
                    },
                    {
                        text: '我给你一些治疗药剂',
                        condition: () => this.game.playerController.inventory.hasItem('health-potion'),
                        effects: () => {
                            this.game.playerController.inventory.removeItem('health-potion', 1);
                            this.game.uiController.showMessage('探险者喝下治疗药剂，脸色明显好转。"非常感谢你的帮助！我知道森林深处有一棵千年古树，它蕴含着强大的自然魔力，或许对你有用。"');
                        }
                    },
                    {
                        text: '这里发生了什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('"我是来寻找稀有草药的，但没想到这里的藤蔓怪如此凶猛。它们通常不会主动攻击人类，但最近似乎变得特别具有攻击性。我怀疑是森林深处的某种变化影响了它们。"');
                        }
                    },
                    {
                        text: '你需要我护送你离开吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('"谢谢你的好意，但我暂时还不能离开。我正在寻找一种叫做"生命之叶"的稀有植物，它能制作出强力的治疗药剂。如果你能帮我找到它，我会给你丰厚的报酬。"');
                        }
                    }
                ]
            }
        });

        // 森林商人
        this.game.npcController.addNPC({
            id: 'forest-merchant',
            name: '森林商人',
            position: new THREE.Vector3(-10, 0, 25),
            modelId: 'forest-merchant',
            dialogue: {
                greeting: '欢迎来到我的小店！我是森林商人，专门收集和出售各种与自然相关的物品。无论你是需要草药、种子还是自然魔法用品，我都能提供帮助。',
                options: [
                    {
                        text: '看看你的商品',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showShop('forest-items');
                        }
                    },
                    {
                        text: '你有稀有的自然物品吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('当然有！我有月光花种子，只能在月圆之夜采集；还有晨露草，必须在清晨第一缕阳光照射前采摘；最珍贵的是古树之心，那是千年古树的精华所在。');
                        }
                    },
                    {
                        text: '森林中哪里可以找到珍贵的植物？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('珍贵的植物通常生长在特殊的地方。月光花喜欢生长在森林的东部，那里有最多的月光照射；晨露草则偏爱小溪边；而古树之心，顾名思义，只能在最古老的树木中找到。但要小心，这些地方通常都有强大的守护者。');
                        }
                    },
                    {
                        text: '你在这里做生意多久了？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我已经在这片森林中做生意超过十年了。我对这里的每一寸土地都了如指掌。森林给了我生计，我也尽力保护它。这是一个相互依存的关系。');
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
        const playerPos = this.game.playerController.position;
        
        // 检查附近的NPC
        const nearbyNPC = this.game.npcController.getNearbyNPC(playerPos, 3);
        
        if (nearbyNPC) {
            // 显示交互提示
            this.game.uiController.showInteractionPrompt(`按E与${nearbyNPC.name}交谈`);
            
            // 检查E键交互
            if (this.game.inputController.isKeyPressed('KeyE')) {
                this.game.npcController.interactWithNPC(nearbyNPC.id);
            }
        } else {
            // 隐藏交互提示
            this.game.uiController.hideInteractionPrompt();
        }
    }
}