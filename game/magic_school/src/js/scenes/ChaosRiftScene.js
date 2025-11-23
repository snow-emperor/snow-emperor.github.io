
/**
 * 混沌裂隙场景
 * 终局场景，分为外围、核心1-3层、顶层，包含所有类型的敌人
 */
import * as THREE from 'three';
export class ChaosRiftScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.playerStartPosition = new THREE.Vector3(0, 0, 10);
        this.enemies = [];
        this.objects = [];
        this.lights = [];
        this.particles = [];
        this.currentLayer = 0; // 0=外围, 1=核心1层, 2=核心2层, 3=核心3层, 4=顶层
        this.layerPositions = [
            new THREE.Vector3(0, 0, 30),  // 外围
            new THREE.Vector3(0, 0, 0),   // 核心1层
            new THREE.Vector3(0, 0, -30), // 核心2层
            new THREE.Vector3(0, 0, -60), // 核心3层
            new THREE.Vector3(0, 0, -90)  // 顶层
        ];
        this.portals = [];
    }

    /**
     * 初始化场景
     */
    async init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0520, 10, 100);

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

        // 设置混沌效果
        this.setupChaosEffects();
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
        this.game.playerController.position.copy(this.layerPositions[this.currentLayer]);

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

        // 初始化传送门
        this.portals.forEach(portal => {
            this.game.sceneManager.scene.add(portal.model);
        });
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光（非常暗）
        const ambientLight = new THREE.AmbientLight(0x0a0520, 0.2);
        this.lights.push(ambientLight);

        // 混沌光源（紫色）
        const chaosLight = new THREE.PointLight(0x9933ff, 1, 50);
        chaosLight.position.set(0, 20, 0);
        this.lights.push(chaosLight);

        // 每层添加特殊光源
        for (let i = 0; i < 5; i++) {
            const layerLight = new THREE.PointLight(0x9933ff, 0.5, 30);
            layerLight.position.copy(this.layerPositions[i]);
            layerLight.position.y = 15;
            this.lights.push(layerLight);
        }
    }

    /**
     * 加载场景模型
     */
    async loadSceneModel() {
        // 创建多层地形
        for (let i = 0; i < 5; i++) {
            const groundGeometry = new THREE.PlaneGeometry(60, 60);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a0a30,
                roughness: 0.9,
                metalness: 0.3
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.copy(this.layerPositions[i]);
            ground.receiveShadow = true;
            this.scene.add(ground);

            // 添加边缘墙壁
            const wallGeometry = new THREE.BoxGeometry(60, 10, 2);
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a1a40,
                roughness: 0.9,
                metalness: 0.3
            });

            // 前墙
            const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
            frontWall.position.set(this.layerPositions[i].x, 5, this.layerPositions[i].z + 30);
            frontWall.castShadow = true;
            frontWall.receiveShadow = true;
            this.scene.add(frontWall);

            // 后墙
            const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
            backWall.position.set(this.layerPositions[i].x, 5, this.layerPositions[i].z - 30);
            backWall.castShadow = true;
            backWall.receiveShadow = true;
            this.scene.add(backWall);

            // 左墙
            const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
            leftWall.rotation.y = Math.PI / 2;
            leftWall.position.set(this.layerPositions[i].x - 30, 5, this.layerPositions[i].z);
            leftWall.castShadow = true;
            leftWall.receiveShadow = true;
            this.scene.add(leftWall);

            // 右墙
            const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
            rightWall.rotation.y = Math.PI / 2;
            rightWall.position.set(this.layerPositions[i].x + 30, 5, this.layerPositions[i].z);
            rightWall.castShadow = true;
            rightWall.receiveShadow = true;
            this.scene.add(rightWall);

            // 添加混沌水晶
            for (let j = 0; j < 5; j++) {
                const crystalGeometry = new THREE.OctahedronGeometry(Math.random() * 1 + 0.5, 0);
                const crystalMaterial = new THREE.MeshStandardMaterial({
                    color: 0x9933ff,
                    emissive: 0x9933ff,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.7,
                    roughness: 0.2,
                    metalness: 0.8
                });
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);

                const angle = (j / 5) * Math.PI * 2;
                const distance = Math.random() * 20 + 5;
                crystal.position.set(
                    this.layerPositions[i].x + Math.cos(angle) * distance,
                    Math.random() * 3 + 1,
                    this.layerPositions[i].z + Math.sin(angle) * distance
                );

                crystal.castShadow = true;
                this.scene.add(crystal);
            }

            // 创建传送门（除了顶层）
            if (i < 4) {
                const portal = {
                    type: 'portal',
                    model: null,
                    position: new THREE.Vector3(
                        this.layerPositions[i].x,
                        2,
                        this.layerPositions[i].z - 25
                    ),
                    targetLayer: i + 1,
                    interact: function() {
                        this.game.sceneManager.currentScene.currentLayer = this.targetLayer;
                        this.game.sceneManager.currentScene.load();
                        this.game.uiController.showNotification(`进入了混沌裂隙第${this.targetLayer}层`);
                    }
                };

                // 创建传送门模型
                const portalGroup = new THREE.Group();

                // 传送门框架
                const frameGeometry = new THREE.TorusGeometry(3, 0.5, 8, 20);
                const frameMaterial = new THREE.MeshStandardMaterial({
                    color: 0x553377,
                    emissive: 0x332255,
                    emissiveIntensity: 0.3,
                    roughness: 0.7,
                    metalness: 0.3
                });
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                portalGroup.add(frame);

                // 传送门内部
                const portalGeometry = new THREE.PlaneGeometry(5, 5);
                const portalMaterial = new THREE.MeshStandardMaterial({
                    color: 0x9933ff,
                    emissive: 0x9933ff,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const portalInner = new THREE.Mesh(portalGeometry, portalMaterial);
                portalGroup.add(portalInner);

                // 添加旋转动画
                portalInner.userData = {
                    update: function(delta) {
                        this.rotation.z += delta * 0.5;
                    }
                };

                portalGroup.position.copy(portal.position);
                portal.model = portalGroup;

                this.portals.push(portal);
                this.scene.add(portal.model);
            }
        }

        // 顶层特殊处理
        const topPlatformGeometry = new THREE.CylinderGeometry(20, 20, 2, 32);
        const topPlatformMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a40,
            roughness: 0.9,
            metalness: 0.3
        });
        const topPlatform = new THREE.Mesh(topPlatformGeometry, topPlatformMaterial);
        topPlatform.position.copy(this.layerPositions[4]);
        topPlatform.position.y = 1;
        topPlatform.receiveShadow = true;
        this.scene.add(topPlatform);

        // 添加混沌王座
        const throneGeometry = new THREE.BoxGeometry(5, 8, 5);
        const throneMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            roughness: 0.7,
            metalness: 0.3
        });
        const throne = new THREE.Mesh(throneGeometry, throneMaterial);
        throne.position.set(
            this.layerPositions[4].x,
            5,
            this.layerPositions[4].z
        );
        throne.castShadow = true;
        throne.receiveShadow = true;
        this.scene.add(throne);
    }

    /**
     * 创建敌人
     */
    createEnemies() {
        // 外围层：混沌仆从和暗影甲虫
        this.createChaosMinions(0, 5);
        this.createShadowBeetles(0, 5);

        // 核心1层：混沌骑士和暗影法师
        this.createChaosKnight(1);
        this.createShadowMage(1);

        // 核心2层：深渊巨兽
        this.createAbyssalBehemoth(2);

        // 核心3层：混沌领主分身
        this.createChaosLordAvatar(3);

        // 顶层：混沌领主
        this.createChaosLord(4);
    }

    /**
     * 创建混沌仆从
     */
    createChaosMinions(layer, count) {
        for (let i = 0; i < count; i++) {
            const enemy = {
                type: 'chaos-minion',
                model: null,
                position: new THREE.Vector3(),
                health: 150,
                maxHealth: 150,
                attack: 20,
                defense: 6,
                level: 4,
                experience: 50,
                loot: {
                    'chaos-fragment': { chance: 1.0, min: 1, max: 1 }
                },
                ai: {
                    state: 'idle', // idle, patrol, chase, attack
                    target: null,
                    patrolPath: [],
                    currentPatrolIndex: 0,
                    attackCooldown: 0,
                    attackInterval: 1500, // 1.5秒
                    detectionRange: 15,
                    attackRange: 5
                },
                reset: function() {
                    this.health = this.maxHealth;
                    this.ai.state = 'idle';
                    this.ai.target = null;
                    this.ai.attackCooldown = 0;
                }
            };

            // 创建混沌仆从模型
            const minionGroup = new THREE.Group();

            // 身体
            const bodyGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a0a30,
                emissive: 0x1a0a30,
                emissiveIntensity: 0.2,
                roughness: 0.9,
                metalness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.5;
            minionGroup.add(body);

            // 头部
            const headGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a1a40,
                emissive: 0x2a1a40,
                emissiveIntensity: 0.2,
                roughness: 0.9,
                metalness: 0.3
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 3.3;
            minionGroup.add(head);

            // 手臂
            const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
            const armMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a0a30,
                emissive: 0x1a0a30,
                emissiveIntensity: 0.2,
                roughness: 0.9,
                metalness: 0.3
            });

            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-1.5, 1.5, 0);
            leftArm.rotation.z = Math.PI / 6;
            minionGroup.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(1.5, 1.5, 0);
            rightArm.rotation.z = -Math.PI / 6;
            minionGroup.add(rightArm);

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x9933ff,
                emissive: 0x9933ff,
                emissiveIntensity: 0.8
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.3, 3.4, 0.7);
            minionGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.3, 3.4, 0.7);
            minionGroup.add(rightEye);

            // 随机位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 5;
            enemy.position.x = this.layerPositions[layer].x + Math.cos(angle) * distance;
            enemy.position.y = 0;
            enemy.position.z = this.layerPositions[layer].z + Math.sin(angle) * distance;

            minionGroup.position.copy(enemy.position);
            minionGroup.castShadow = true;

            enemy.model = minionGroup;
            this.enemies.push(enemy);
            this.scene.add(enemy.model);
        }
    }

    /**
     * 创建暗影甲虫
     */
    createShadowBeetles(layer, count) {
        for (let i = 0; i < count; i++) {
            const enemy = {
                type: 'shadow-beetle',
                model: null,
                position: new THREE.Vector3(),
                health: 130,
                maxHealth: 130,
                attack: 22,
                defense: 5,
                level: 4,
                experience: 50,
                loot: {
                    'chaos-fragment': { chance: 1.0, min: 1, max: 1 }
                },
                ai: {
                    state: 'idle', // idle, patrol, chase, attack
                    target: null,
                    patrolPath: [],
                    currentPatrolIndex: 0,
                    attackCooldown: 0,
                    attackInterval: 1600, // 1.6秒
                    detectionRange: 12,
                    attackRange: 3
                },
                reset: function() {
                    this.health = this.maxHealth;
                    this.ai.state = 'idle';
                    this.ai.target = null;
                    this.ai.attackCooldown = 0;
                }
            };

            // 创建暗影甲虫模型
            const beetleGroup = new THREE.Group();

            // 身体
            const bodyGeometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0510,
                emissive: 0x0a0510,
                emissiveIntensity: 0.3,
                roughness: 0.7,
                metalness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.z = Math.PI / 2;
            body.position.y = 1;
            beetleGroup.add(body);

            // 头部
            const headGeometry = new THREE.BoxGeometry(1, 0.8, 1.2);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0510,
                emissive: 0x0a0510,
                emissiveIntensity: 0.3,
                roughness: 0.7,
                metalness: 0.3
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(1.5, 1, 0);
            beetleGroup.add(head);

            // 腿
            const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
            const legMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0510,
                emissive: 0x0a0510,
                emissiveIntensity: 0.3,
                roughness: 0.7,
                metalness: 0.3
            });

            for (let j = 0; j < 6; j++) {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                const angle = (j / 6) * Math.PI * 2;
                leg.position.set(
                    Math.cos(angle) * 0.8,
                    0.5,
                    Math.sin(angle) * 0.8
                );
                leg.rotation.x = Math.PI / 4;
                beetleGroup.add(leg);
            }

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x9933ff,
                emissive: 0x9933ff,
                emissiveIntensity: 0.8
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(2, 1.2, 0.3);
            beetleGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(2, 1.2, -0.3);
            beetleGroup.add(rightEye);

            // 随机位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 5;
            enemy.position.x = this.layerPositions[layer].x + Math.cos(angle) * distance;
            enemy.position.y = 0;
            enemy.position.z = this.layerPositions[layer].z + Math.sin(angle) * distance;

            beetleGroup.position.copy(enemy.position);
            beetleGroup.castShadow = true;

            enemy.model = beetleGroup;
            this.enemies.push(enemy);
            this.scene.add(enemy.model);
        }
    }

    /**
     * 创建混沌骑士
     */
    createChaosKnight(layer) {
        const enemy = {
            type: 'chaos-knight',
            model: null,
            position: new THREE.Vector3(),
            health: 800,
            maxHealth: 800,
            attack: 70,
            defense: 30,
            level: 8,
            experience: 300,
            loot: {
                'chaos-core': { chance: 1.0, min: 1, max: 1 },
                'chaos-fragment': { chance: 1.0, min: 5, max: 5 }
            },
            skills: [
                {
                    name: 'chaos-slash',
                    cooldown: 3000, // 3秒
                    lastUsed: 0,
                    description: '混沌斩，造成直线范围伤害'
                },
                {
                    name: 'defense-aura',
                    cooldown: 0, // 被动技能
                    lastUsed: 0,
                    description: '防御光环，自身防御力提升20%',
                    passive: true
                }
            ],
            ai: {
                state: 'idle', // idle, patrol, chase, attack
                target: null,
                patrolPath: [],
                currentPatrolIndex: 0,
                attackCooldown: 0,
                attackInterval: 3000, // 3秒
                skillCooldown: 0,
                detectionRange: 20,
                attackRange: 10
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

        // 创建混沌骑士模型
        const knightGroup = new THREE.Group();

        // 身体
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        knightGroup.add(body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a40,
            emissive: 0x2a1a40,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 5.7;
        knightGroup.add(head);

        // 盔甲装饰
        const armorGeometry = new THREE.TorusGeometry(2, 0.3, 8, 20);
        const armorMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            emissive: 0x332255,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });

        const shoulderArmor = new THREE.Mesh(armorGeometry, armorMaterial);
        shoulderArmor.position.y = 4;
        shoulderArmor.rotation.x = Math.PI / 2;
        knightGroup.add(shoulderArmor);

        const waistArmor = new THREE.Mesh(armorGeometry, armorMaterial);
        waistArmor.position.y = 2;
        waistArmor.rotation.x = Math.PI / 2;
        knightGroup.add(waistArmor);

        // 手臂
        const armGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-2.5, 2.5, 0);
        leftArm.rotation.z = Math.PI / 6;
        knightGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(2.5, 2.5, 0);
        rightArm.rotation.z = -Math.PI / 6;
        knightGroup.add(rightArm);

        // 剑
        const swordGeometry = new THREE.BoxGeometry(0.3, 5, 1);
        const swordMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            emissive: 0x332255,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.7
        });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.position.set(3, 3, 0);
        sword.rotation.z = -Math.PI / 4;
        knightGroup.add(sword);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, 5.8, 1);
        knightGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, 5.8, 1);
        knightGroup.add(rightEye);

        // 设置位置
        enemy.position.copy(this.layerPositions[layer]);
        enemy.position.x += 10;

        knightGroup.position.copy(enemy.position);
        knightGroup.castShadow = true;

        enemy.model = knightGroup;
        this.enemies.push(enemy);
        this.scene.add(enemy.model);
    }

    /**
     * 创建暗影法师
     */
    createShadowMage(layer) {
        const enemy = {
            type: 'shadow-mage',
            model: null,
            position: new THREE.Vector3(),
            health: 750,
            maxHealth: 750,
            attack: 75,
            defense: 25,
            level: 8,
            experience: 300,
            loot: {
                'chaos-core': { chance: 1.0, min: 1, max: 1 },
                'chaos-fragment': { chance: 1.0, min: 5, max: 5 }
            },
            skills: [
                {
                    name: 'shadow-bolt',
                    cooldown: 2000, // 2秒
                    lastUsed: 0,
                    description: '暗影弹，每2秒释放3枚'
                },
                {
                    name: 'shadow-shield',
                    cooldown: 5000, // 5秒
                    lastUsed: 0,
                    description: '暗影护盾，吸收200点伤害'
                }
            ],
            ai: {
                state: 'idle', // idle, patrol, chase, attack
                target: null,
                patrolPath: [],
                currentPatrolIndex: 0,
                attackCooldown: 0,
                attackInterval: 2000, // 2秒
                skillCooldown: 0,
                detectionRange: 25,
                attackRange: 20
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

        // 创建暗影法师模型
        const mageGroup = new THREE.Group();

        // 身体
        const bodyGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2;
        mageGroup.add(body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(1, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 4.5;
        mageGroup.add(head);

        // 法袍
        const robeGeometry = new THREE.ConeGeometry(2, 3, 8);
        const robeMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.3,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const robe = new THREE.Mesh(robeGeometry, robeMaterial);
        robe.position.y = 1.5;
        mageGroup.add(robe);

        // 法杖
        const staffGeometry = new THREE.CylinderGeometry(0.1, 0.2, 4, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            emissive: 0x332255,
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.5
        });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(1.5, 3, 0);
        staff.rotation.z = -Math.PI / 6;
        mageGroup.add(staff);

        // 法杖宝石
        const gemGeometry = new THREE.OctahedronGeometry(0.5, 0);
        const gemMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8
        });
        const gem = new THREE.Mesh(gemGeometry, gemMaterial);
        gem.position.set(1.5, 5.2, 0);
        mageGroup.add(gem);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 4.6, 0.8);
        mageGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 4.6, 0.8);
        mageGroup.add(rightEye);

        // 设置位置
        enemy.position.copy(this.layerPositions[layer]);
        enemy.position.x -= 10;

        mageGroup.position.copy(enemy.position);
        mageGroup.castShadow = true;

        enemy.model = mageGroup;
        this.enemies.push(enemy);
        this.scene.add(enemy.model);
    }

    /**
     * 创建深渊巨兽
     */
    createAbyssalBehemoth(layer) {
        const enemy = {
            type: 'abyssal-behemoth',
            model: null,
            position: new THREE.Vector3(),
            health: 1200,
            maxHealth: 1200,
            attack: 90,
            defense: 40,
            level: 9,
            experience: 500,
            loot: {
                'chaos-core': { chance: 1.0, min: 2, max: 2 },
                'chaos-fragment': { chance: 1.0, min: 8, max: 8 }
            },
            skills: [
                {
                    name: 'abyssal-roar',
                    cooldown: 8000, // 8秒
                    lastUsed: 0,
                    description: '深渊咆哮，全屏减速30%，持续3秒'
                },
                {
                    name: 'behemoth-stomp',
                    cooldown: 5000, // 5秒
                    lastUsed: 0,
                    description: '巨兽践踏，造成范围伤害'
                }
            ],
            ai: {
                state: 'idle', // idle, patrol, chase, attack
                target: null,
                patrolPath: [],
                currentPatrolIndex: 0,
                attackCooldown: 0,
                attackInterval: 4000, // 4秒
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

        // 创建深渊巨兽模型
        const behemothGroup = new THREE.Group();

        // 身体
        const bodyGeometry = new THREE.BoxGeometry(6, 8, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 4;
        behemothGroup.add(body);

        // 头部
        const headGeometry = new THREE.BoxGeometry(4, 4, 4);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a40,
            emissive: 0x2a1a40,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 8, 3);
        behemothGroup.add(head);

        // 腿
        const legGeometry = new THREE.CylinderGeometry(0.8, 1, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });

        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const angle = (i / 4) * Math.PI * 2;
            leg.position.set(
                Math.cos(angle) * 2.5,
                2,
                Math.sin(angle) * 2.5
            );
            behemothGroup.add(leg);
        }

        // 尾巴
        const tailGeometry = new THREE.ConeGeometry(1, 4, 8);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 3, -4);
        tail.rotation.x = Math.PI / 2;
        behemothGroup.add(tail);

        // 背甲
        const armorGeometry = new THREE.BoxGeometry(7, 1, 5);
        const armorMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            emissive: 0x332255,
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.5
        });
        const armor = new THREE.Mesh(armorGeometry, armorMaterial);
        armor.position.y = 8.5;
        behemothGroup.add(armor);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-1, 8, 5);
        behemothGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(1, 8, 5);
        behemothGroup.add(rightEye);

        // 设置位置
        enemy.position.copy(this.layerPositions[layer]);

        behemothGroup.position.copy(enemy.position);
        behemothGroup.castShadow = true;

        enemy.model = behemothGroup;
        this.enemies.push(enemy);
        this.scene.add(enemy.model);
    }

    /**
     * 创建混沌领主分身
     */
    createChaosLordAvatar(layer) {
        const enemy = {
            type: 'chaos-lord-avatar',
            model: null,
            position: new THREE.Vector3(),
            health: 1500,
            maxHealth: 1500,
            attack: 100,
            defense: 45,
            level: 9,
            experience: 700,
            loot: {
                'chaos-core': { chance: 1.0, min: 3, max: 3 },
                'chaos-fragment': { chance: 1.0, min: 10, max: 10 }
            },
            skills: [
                {
                    name: 'chaos-storm',
                    cooldown: 10000, // 10秒
                    lastUsed: 0,
                    description: '混沌风暴，持续5秒，每秒造成攻击力×0.8范围伤害'
                },
                {
                    name: 'teleport',
                    cooldown: 5000, // 5秒
                    lastUsed: 0,
                    description: '瞬移，随机移动到玩家周围5m内'
                }
            ],
            ai: {
                state: 'idle', // idle, patrol, chase, attack
                target: null,
                patrolPath: [],
                currentPatrolIndex: 0,
                attackCooldown: 0,
                attackInterval: 3000, // 3秒
                skillCooldown: 0,
                detectionRange: 25,
                attackRange: 15
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

        // 创建混沌领主分身模型
        const avatarGroup = new THREE.Group();

        // 身体
        const bodyGeometry = new THREE.CylinderGeometry(2, 2.5, 6, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 3;
        avatarGroup.add(body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a40,
            emissive: 0x2a1a40,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 7;
        avatarGroup.add(head);

        // 斗篷
        const cloakGeometry = new THREE.ConeGeometry(3, 5, 8);
        const cloakMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.3,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const cloak = new THREE.Mesh(cloakGeometry, cloakMaterial);
        cloak.position.y = 2.5;
        avatarGroup.add(cloak);

        // 手臂
        const armGeometry = new THREE.CylinderGeometry(0.7, 0.7, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-3, 3, 0);
        leftArm.rotation.z = Math.PI / 6;
        avatarGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(3, 3, 0);
        rightArm.rotation.z = -Math.PI / 6;
        avatarGroup.add(rightArm);

        // 混沌能量球
        const energyGeometry = new THREE.SphereGeometry(1, 8, 8);
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const energyBall = new THREE.Mesh(energyGeometry, energyMaterial);
        energyBall.position.set(0, 3, 2);
        avatarGroup.add(energyBall);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 7.2, 1.2);
        avatarGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 7.2, 1.2);
        avatarGroup.add(rightEye);

        // 设置位置
        enemy.position.copy(this.layerPositions[layer]);

        avatarGroup.position.copy(enemy.position);
        avatarGroup.castShadow = true;

        enemy.model = avatarGroup;
        this.enemies.push(enemy);
        this.scene.add(enemy.model);
    }

    /**
     * 创建混沌领主
     */
    createChaosLord(layer) {
        const enemy = {
            type: 'chaos-lord',
            model: null,
            position: new THREE.Vector3(),
            health: 2000,
            maxHealth: 2000,
            attack: 120,
            defense: 50,
            level: 10,
            experience: 1000,
            loot: {
                'ultimate-wand': { chance: 1.0, min: 1, max: 1 },
                'chaos-core': { chance: 1.0, min: 5, max: 5 }
            },
            skills: [
                {
                    name: 'chaos-destruction',
                    cooldown: 10000, // 10秒
                    lastUsed: 0,
                    description: '混沌毁灭，全屏伤害=攻击力×3.0'
                },
                {
                    name: 'darkness-curse',
                    cooldown: 8000, // 8秒
                    lastUsed: 0,
                    description: '黑暗诅咒，玩家施法速度降低20%，持续5秒'
                },
                {
                    name: 'life-drain',
                    cooldown: 5000, // 5秒
                    lastUsed: 0,
                    description: '生命汲取，每5秒汲取玩家50点生命值'
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
                detectionRange: 30,
                attackRange: 20
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

        // 创建混沌领主模型
        const lordGroup = new THREE.Group();

        // 身体
        const bodyGeometry = new THREE.CylinderGeometry(2.5, 3, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.4,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 4;
        lordGroup.add(body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a0a30,
            emissive: 0x1a0a30,
            emissiveIntensity: 0.4,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 9;
        lordGroup.add(head);

        // 王座
        const throneGeometry = new THREE.BoxGeometry(6, 2, 6);
        const throneMaterial = new THREE.MeshStandardMaterial({
            color: 0x332255,
            emissive: 0x332255,
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const throne = new THREE.Mesh(throneGeometry, throneMaterial);
        throne.position.y = 1;
        lordGroup.add(throne);

        // 王座靠背
        const backrestGeometry = new THREE.BoxGeometry(6, 8, 1);
        const backrest = new THREE.Mesh(backrestGeometry, throneMaterial);
        backrest.position.set(0, 5, -2.5);
        lordGroup.add(backrest);

        // 手臂
        const armGeometry = new THREE.CylinderGeometry(1, 1, 5, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0510,
            emissive: 0x0a0510,
            emissiveIntensity: 0.4,
            roughness: 0.7,
            metalness: 0.3
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-4, 4, 0);
        leftArm.rotation.z = Math.PI / 6;
        lordGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(4, 4, 0);
        rightArm.rotation.z = -Math.PI / 6;
        lordGroup.add(rightArm);

        // 混沌能量
        const energyGeometry = new THREE.IcosahedronGeometry(2, 0);
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.7
        });
        const energyOrb = new THREE.Mesh(energyGeometry, energyMaterial);
        energyOrb.position.set(0, 4, 3);

        // 添加旋转动画
        energyOrb.userData = {
            update: function(delta) {
                this.rotation.x += delta * 0.5;
                this.rotation.y += delta * 0.3;
            }
        };

        lordGroup.add(energyOrb);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x9933ff,
            emissive: 0x9933ff,
            emissiveIntensity: 1.0
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.7, 9.2, 1.5);
        lordGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.7, 9.2, 1.5);
        lordGroup.add(rightEye);

        // 设置位置
        enemy.position.copy(this.layerPositions[layer]);
        enemy.position.y = 1; // 坐在王座上

        lordGroup.position.copy(enemy.position);
        lordGroup.castShadow = true;

        enemy.model = lordGroup;
        this.enemies.push(enemy);
        this.scene.add(enemy.model);
    }

    /**
     * 创建物体
     */
    createObjects() {
        // 混沌裂隙场景中不创建宝箱，只有敌人掉落物品
    }

    /**
     * 创建粒子效果
     */
    createParticles() {
        // 创建混沌雾气粒子
        const fogCount = 300;
        const fogGeometry = new THREE.BufferGeometry();
        const fogPositions = new Float32Array(fogCount * 3);
        const fogColors = new Float32Array(fogCount * 3);
        const fogSizes = new Float32Array(fogCount);

        for (let i = 0; i < fogCount; i++) {
            // 随机位置
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 50 + 10;

            fogPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            fogPositions[i * 3 + 1] = Math.random() * 10;
            fogPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // 颜色（深紫色）
            fogColors[i * 3] = 0.2;     // R
            fogColors[i * 3 + 1] = 0.1; // G
            fogColors[i * 3 + 2] = 0.4; // B

            // 大小
            fogSizes[i] = Math.random() * 2 + 0.5;
        }

        fogGeometry.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));
        fogGeometry.setAttribute('color', new THREE.BufferAttribute(fogColors, 3));
        fogGeometry.setAttribute('size', new THREE.BufferAttribute(fogSizes, 1));

        const fogMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const fog = new THREE.Points(fogGeometry, fogMaterial);
        this.particles.push(fog);
        this.scene.add(fog);

        // 创建混沌能量粒子
        const energyCount = 100;
        const energyGeometry = new THREE.BufferGeometry();
        const energyPositions = new Float32Array(energyCount * 3);
        const energyColors = new Float32Array(energyCount * 3);
        const energySizes = new Float32Array(energyCount);

        for (let i = 0; i < energyCount; i++) {
            // 随机位置（围绕各层中心）
            const layerIndex = Math.floor(Math.random() * 5);
            const theta = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 5;

            energyPositions[i * 3] = this.layerPositions[layerIndex].x + Math.cos(theta) * distance;
            energyPositions[i * 3 + 1] = Math.random() * 10 + 2;
            energyPositions[i * 3 + 2] = this.layerPositions[layerIndex].z + Math.sin(theta) * distance;

            // 颜色（亮紫色）
            energyColors[i * 3] = 0.6;     // R
            energyColors[i * 3 + 1] = 0.2; // G
            energyColors[i * 3 + 2] = 1.0; // B

            // 大小
            energySizes[i] = Math.random() * 0.5 + 0.1;
        }

        energyGeometry.setAttribute('position', new THREE.BufferAttribute(energyPositions, 3));
        energyGeometry.setAttribute('color', new THREE.BufferAttribute(energyColors, 3));
        energyGeometry.setAttribute('size', new THREE.BufferAttribute(energySizes, 1));

        const energyMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const energy = new THREE.Points(energyGeometry, energyMaterial);
        this.particles.push(energy);
        this.scene.add(energy);
    }

    /**
     * 设置混沌效果
     */
    setupChaosEffects() {
        // 定期生成混沌波动
        setInterval(() => {
            if (Math.random() < 0.2) { // 20%概率生成混沌波动
                this.createChaosWave();
            }
        }, 3000);
    }

    /**
     * 创建混沌波动效果
     */
    createChaosWave() {
        // 随机位置
        const layerIndex = Math.floor(Math.random() * 5);
        const x = this.layerPositions[layerIndex].x + (Math.random() - 0.5) * 40;
        const z = this.layerPositions[layerIndex].z + (Math.random() - 0.5) * 40;

        // 创建波动几何体
        const waveGeometry = new THREE.RingGeometry(0.1, 5, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x9933ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.set(x, 0.1, z);
        wave.rotation.x = -Math.PI / 2;
        this.scene.add(wave);

        // 播放混沌波动音效
        this.game.audioController.playSound('chaos-wave');

        // 波动扩散动画
        let scale = 0.1;
        let opacity = 0.7;

        const animateWave = () => {
            scale += 0.2;
            opacity -= 0.02;

            wave.scale.set(scale, scale, scale);
            wave.material.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animateWave);
            } else {
                this.scene.remove(wave);

                // 检查是否击中玩家
                const playerPos = this.game.playerController.position;
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - x, 2) + 
                    Math.pow(playerPos.z - z, 2)
                );

                if (distance < scale * 5) {
                    // 对玩家造成伤害
                    const damage = 10;
                    this.game.playerController.takeDamage(damage);
                    this.game.uiController.showNotification(`被混沌波动击中，受到 ${damage} 点伤害！`);
                }
            }
        };

        animateWave();
    }

    /**
     * 更新场景
     * @param {number} delta
     */
    update(delta) {
        // 更新粒子动画
        this.particles.forEach(particle => {
            if (particle.userData && particle.userData.update) {
                particle.userData.update(delta);
            }

            // 旋转粒子
            particle.rotation.y += delta * 0.1;
        });

        // 更新传送门动画
        this.portals.forEach(portal => {
            if (portal.model && portal.model.children[1]) {
                portal.model.children[1].rotation.z += delta * 0.5;
            }
        });

        // 检查玩家交互
        this.checkPlayerInteraction();
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        // 创建混沌守卫（外围层）
        this.game.npcController.addNPC({
            id: 'chaos-rift-guardian',
            name: '混沌守卫',
            position: new THREE.Vector3(0, 0, 30),
            modelId: 'guardian',
            dialogue: {
                greeting: '这里是混沌裂隙，法师的终极试炼之地。只有真正的强者才能通过这里的考验。',
                options: [
                    {
                        text: '我想进入混沌裂隙',
                        condition: () => this.game.playerController.level >= 10,
                        effects: () => {
                            this.game.uiController.showMessage('混沌守卫点了点头：很好，年轻的法师。记住，每一层都比上一层更加危险。准备好面对你的命运吧。');
                        }
                    },
                    {
                        text: '混沌裂隙有什么秘密？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('混沌裂隙是古老魔法的源头，这里汇聚了所有元素的力量。传说在最深处，藏着能够掌控所有元素的终极魔法书。');
                        }
                    },
                    {
                        text: '我需要准备什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('你需要所有元素的抗性药水，强大的装备，以及最重要的——坚定的意志。混沌会试图腐蚀你的心灵，只有最纯净的魔法之心才能抵抗。');
                        }
                    }
                ]
            }
        });

        // 创建混沌学者（核心1层）
        this.game.npcController.addNPC({
            id: 'chaos-rift-scholar',
            name: '混沌学者',
            position: new THREE.Vector3(0, 0, 0),
            modelId: 'scholar',
            dialogue: {
                greeting: '啊，又一个寻求力量的法师。我在这里研究混沌的本质已经很多年了...',
                options: [
                    {
                        text: '混沌的本质是什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('混沌不是混乱，而是所有元素的原始统一状态。火、水、风、雷、大地，在混沌中都是一体的。理解这一点，你就能掌握真正的力量。');
                        }
                    },
                    {
                        text: '如何抵抗混沌的腐蚀？',
                        condition: () => this.game.playerController.level >= 12,
                        effects: () => {
                            this.game.uiController.showMessage('你需要保持内心的平衡。当面对混沌元素时，不要试图对抗它，而是要理解它、引导它。让你的魔法之心成为混沌中的灯塔。');
                        }
                    },
                    {
                        text: '终极魔法书真的存在吗？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('确实存在，但它不是一个简单的物品。终极魔法书是混沌本身的知识，只有真正理解混沌本质的法师才能"阅读"它。这需要智慧，而不仅仅是力量。');
                        }
                    }
                ]
            }
        });

        // 创建受伤的古代法师（核心2层）
        this.game.npcController.addNPC({
            id: 'chaos-rift-ancient-mage',
            name: '受伤的古代法师',
            position: new THREE.Vector3(0, 0, -30),
            modelId: 'ancient-mage',
            dialogue: {
                greeting: '小心...混沌的力量超出了我的想象。我差点就...被它完全吞噬了...',
                options: [
                    {
                        text: '我来帮你',
                        condition: () => this.game.playerController.health > 80,
                        effects: () => {
                            this.game.playerController.takeDamage(40);
                            this.game.uiController.showMessage('你消耗自己的生命力帮助了古代法师！他告诉你：谢谢你，年轻的法师。作为回报，我告诉你：混沌元素害怕纯净的心灵力量。当你面对它们时，记住你是谁，不要让混沌改变你的本质。');
                        }
                    },
                    {
                        text: '我给你治疗药水',
                        condition: () => this.game.playerController.hasItem('health-potion'),
                        effects: () => {
                            this.game.playerController.removeItem('health-potion', 1);
                            this.game.uiController.showMessage('古代法师恢复了一些力量，他告诉你：在核心3层有一个混沌祭坛，那里是通往终极智慧的门户。但要激活它，你需要所有元素的认可。');
                        }
                    },
                    {
                        text: '发生了什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我试图强行控制混沌的力量，结果差点失去了自我。混沌不是用来控制的，而是用来理解和共存的。这是我用生命换来的教训...');
                        }
                    }
                ]
            }
        });

        // 创建混沌先知（核心3层）
        this.game.npcController.addNPC({
            id: 'chaos-rift-prophet',
            name: '混沌先知',
            position: new THREE.Vector3(0, 0, -60),
            modelId: 'prophet',
            dialogue: {
                greeting: '我已经等你很久了，年轻的法师。你的到来是命中注定的。',
                options: [
                    {
                        text: '你知道我会来？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('混沌之眼能看到所有可能的未来。你来到这里，说明你已经准备好接受终极的考验。但记住，真正的力量不在于征服，而在于理解。');
                        }
                    },
                    {
                        text: '终极考验是什么？',
                        condition: () => this.game.playerController.level >= 15,
                        effects: () => {
                            this.game.uiController.showMessage('终极考验不是战斗，而是选择。在顶层，你将面对混沌本身。你可以选择成为混沌的主人，也可以选择成为它的朋友，或者...成为它的一部分。每个选择都有不同的代价和回报。');
                        }
                    },
                    {
                        text: '我该如何准备？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('你已经准备好了。你的旅程、你的战斗、你的选择，都已经让你成为了现在的你。相信自己，相信你的魔法之心。在顶层，答案就在你心中。');
                        }
                    }
                ]
            }
        });

        // 创建元素融合大师（顶层）
        this.game.npcController.addNPC({
            id: 'chaos-rift-fusion-master',
            name: '元素融合大师',
            position: new THREE.Vector3(0, 0, -90),
            modelId: 'fusion-master',
            dialogue: {
                greeting: '欢迎，年轻的法师。我是元素融合大师，也是混沌裂隙最后的守护者。你已经走了很远，但最后的考验才刚刚开始。',
                options: [
                    {
                        text: '我想学习元素融合',
                        condition: () => this.game.playerController.level >= 18 && this.game.playerController.hasSpell('fire-bolt') && this.game.playerController.hasSpell('ice-shard') && this.game.playerController.hasSpell('wind-slash') && this.game.playerController.hasSpell('lightning-bolt'),
                        effects: () => {
                            this.game.playerController.learnSpell('elemental-fusion');
                            this.game.uiController.showMessage('你学会了元素融合咒语！这是所有魔法的终极形态，能够同时操控所有元素的力量。');
                        }
                    },
                    {
                        text: '混沌的真相是什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('混沌的真相就是统一。所有的对立都是表面的，火与水、风与雷、光明与黑暗，在混沌中都是一体的。当你理解这一点时，你就成为了真正的元素大师。');
                        }
                    },
                    {
                        text: '我准备好了最终考验',
                        condition: () => this.game.playerController.level >= 20,
                        effects: () => {
                            this.game.uiController.showMessage('很好！最终考验即将开始。记住，真正的力量不是征服混沌，而是与混沌和谐共存。让你的魔法之心引导你，成为你想成为的法师。元素的世界将因你而改变！');
                            // 这里可以触发最终的Boss战或结局
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

        // 如果没有可交互对象，隐藏交互提示
        this.game.uiController.hideInteractionPrompt();
    }
}