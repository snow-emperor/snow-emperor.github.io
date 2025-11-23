/**
 * 雷电高原场景
 * 雷电元素的试炼场，包含雷电蝙蝠和雷电使者
 */
import * as THREE from 'three';


export class ThunderPlateauScene {
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
        this.scene.fog = new THREE.Fog(0x222244, 10, 100);

        // 创建环境光
        const ambientLight = new THREE.AmbientLight(0x444466, 0.5);
        this.scene.add(ambientLight);

        // 创建方向光
        const directionalLight = new THREE.DirectionalLight(0x9966ff, 0.5);
        directionalLight.position.set(0, 50, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // 创建地形
        this.createTerrain();

        // 创建NPC
        this.createNPCs();

        // 创建敌人
        this.createEnemies();

        // 创建物体
        this.createObjects();

        // 创建粒子效果
        this.createParticles();

        // 设置雷电效果
        this.setupLightningEffects();

        return this.scene;
    }

    /**
     * 创建地形
     */
    createTerrain() {
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333355,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 创建岩石
        for (let i = 0; i < 20; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x555577,
                roughness: 0.9,
                metalness: 0.1
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 10;
            rock.position.x = Math.cos(angle) * distance;
            rock.position.y = Math.random() * 2;
            rock.position.z = Math.sin(angle) * distance;
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;

            this.scene.add(rock);
        }
    }

    /**
     * 创建敌人
     */
    createEnemies() {
        // 创建雷电蝙蝠
        for (let i = 0; i < 5; i++) {
            const enemy = {
                type: 'thunder-bat',
                health: 30,
                maxHealth: 30,
                model: null,
                position: new THREE.Vector3(),
                skills: [
                    {
                        name: 'thunder-bite',
                        damage: 5,
                        range: 5,
                        cooldown: 2000,
                        lastUsed: 0
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
                    detectionRange: 20,
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

            // 创建雷电蝙蝠模型
            const batGroup = new THREE.Group();

            // 身体
            const bodyGeometry = new THREE.CylinderGeometry(1, 0.5, 2, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x666688,
                emissive: 0x333355,
                emissiveIntensity: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.z = Math.PI / 2;
            batGroup.add(body);

            // 左翅膀
            const leftWingGeometry = new THREE.ConeGeometry(3, 0.2, 8);
            const leftWingMaterial = new THREE.MeshStandardMaterial({
                color: 0x777799,
                emissive: 0x444466,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const leftWing = new THREE.Mesh(leftWingGeometry, leftWingMaterial);
            leftWing.position.set(-1.5, 0, 0);
            leftWing.rotation.z = Math.PI / 2;
            leftWing.rotation.y = Math.PI / 4;
            batGroup.add(leftWing);

            // 右翅膀
            const rightWingGeometry = new THREE.ConeGeometry(3, 0.2, 8);
            const rightWingMaterial = new THREE.MeshStandardMaterial({
                color: 0x777799,
                emissive: 0x444466,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const rightWing = new THREE.Mesh(rightWingGeometry, rightWingMaterial);
            rightWing.position.set(1.5, 0, 0);
            rightWing.rotation.z = Math.PI / 2;
            rightWing.rotation.y = -Math.PI / 4;
            batGroup.add(rightWing);

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x9966ff,
                emissive: 0x9966ff,
                emissiveIntensity: 0.8
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.3, 0.5, 0.8);
            batGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.3, 0.5, 0.8);
            batGroup.add(rightEye);

            // 设置位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 10;
            enemy.position.x = Math.cos(angle) * distance;
            enemy.position.y = Math.random() * 10 + 5;
            enemy.position.z = Math.sin(angle) * distance;

            batGroup.position.copy(enemy.position);
            batGroup.castShadow = true;

            enemy.model = batGroup;
            this.enemies.push(enemy);
            this.scene.add(enemy.model);
        }

        // 创建雷电使者
        for (let i = 0; i < 2; i++) {
            const enemy = {
                type: 'thunder-messenger',
                health: 50,
                maxHealth: 50,
                model: null,
                position: new THREE.Vector3(),
                skills: [
                    {
                        name: 'thunder-strike',
                        damage: 10,
                        range: 20,
                        cooldown: 3000,
                        lastUsed: 0
                    },
                    {
                        name: 'thunder-chain',
                        damage: 15,
                        range: 15,
                        cooldown: 5000,
                        lastUsed: 0
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
                    detectionRange: 20,
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

            // 创建雷电使者模型
            const messengerGroup = new THREE.Group();

            // 身体
            const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x666688,
                emissive: 0x333355,
                emissiveIntensity: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 2;
            messengerGroup.add(body);

            // 头部
            const headGeometry = new THREE.SphereGeometry(1, 8, 8);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0x777799,
                emissive: 0x444466,
                emissiveIntensity: 0.3
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 4.5;
            messengerGroup.add(head);

            // 雷电环绕
            const lightningGeometry = new THREE.TorusGeometry(2, 0.1, 8, 20);
            const lightningMaterial = new THREE.MeshStandardMaterial({
                color: 0x9966ff,
                emissive: 0x9966ff,
                emissiveIntensity: 0.8
            });
            const lightningRing = new THREE.Mesh(lightningGeometry, lightningMaterial);
            lightningRing.position.y = 2.5;
            lightningRing.rotation.x = Math.PI / 2;
            messengerGroup.add(lightningRing);

            // 手臂
            const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
            const armMaterial = new THREE.MeshStandardMaterial({
                color: 0x666688,
                emissive: 0x333355,
                emissiveIntensity: 0.3
            });

            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-2, 2.5, 0);
            leftArm.rotation.z = Math.PI / 6;
            messengerGroup.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(2, 2.5, 0);
            rightArm.rotation.z = -Math.PI / 6;
            messengerGroup.add(rightArm);

            // 眼睛
            const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0x9966ff,
                emissive: 0x9966ff,
                emissiveIntensity: 0.8
            });

            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.4, 4.6, 0.8);
            messengerGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.4, 4.6, 0.8);
            messengerGroup.add(rightEye);

            // 设置位置
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 20;
            enemy.position.x = Math.cos(angle) * distance;
            enemy.position.y = 0;
            enemy.position.z = Math.sin(angle) * distance;

            messengerGroup.position.copy(enemy.position);
            messengerGroup.castShadow = true;

            enemy.model = messengerGroup;
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
                    'thunder-crystal': { chance: 0.7, min: 1, max: 3 },
                    'attack-ring': { chance: 0.3, min: 1, max: 1 }
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
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 5;
            chest.position.x = Math.cos(angle) * distance;
            chest.position.y = 0;
            chest.position.z = Math.sin(angle) * distance;

            chestGroup.position.copy(chest.position);
            chestGroup.castShadow = true;
            chestGroup.receiveShadow = true;

            chest.model = chestGroup;
            this.objects.push(chest);
            this.scene.add(chest.model);
        }
    }

    /**
     * 创建粒子效果
     */
    createParticles() {
        // 创建雷电火花粒子
        const sparkCount = 200;
        const sparkGeometry = new THREE.BufferGeometry();
        const sparkPositions = new Float32Array(sparkCount * 3);
        const sparkColors = new Float32Array(sparkCount * 3);
        const sparkSizes = new Float32Array(sparkCount);

        for (let i = 0; i < sparkCount; i++) {
            // 随机位置
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = Math.random() * 40 + 10;

            sparkPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            sparkPositions[i * 3 + 1] = Math.random() * 20;
            sparkPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // 颜色（紫色）
            sparkColors[i * 3] = 0.6;     // R
            sparkColors[i * 3 + 1] = 0.4; // G
            sparkColors[i * 3 + 2] = 1.0; // B

            // 大小
            sparkSizes[i] = Math.random() * 0.5 + 0.1;
        }

        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
        sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));
        sparkGeometry.setAttribute('size', new THREE.BufferAttribute(sparkSizes, 1));

        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        this.particles.push(sparks);
        this.scene.add(sparks);
    }

    /**
     * 设置雷电效果
     */
    setupLightningEffects() {
        // 定期生成雷电
        setInterval(() => {
            if (Math.random() < 0.3) { // 30%概率生成雷电
                this.createLightningStrike();
            }
        }, 2000);
    }

    /**
     * 创建雷电打击效果
     */
    createLightningStrike() {
        // 随机位置
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;

        // 创建雷电几何体
        const lightningPoints = [];
        const segments = 10;

        for (let i = 0; i <= segments; i++) {
            const y = 40 - (i * 4);
            const offsetX = (Math.random() - 0.5) * 2;
            const offsetZ = (Math.random() - 0.5) * 2;

            lightningPoints.push(new THREE.Vector3(x + offsetX, y, z + offsetZ));
        }

        const lightningGeometry = new THREE.BufferGeometry().setFromPoints(lightningPoints);
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: 0x9966ff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });

        const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
        this.scene.add(lightning);

        // 创建闪光效果
        const flashLight = new THREE.PointLight(0x9966ff, 2, 50);
        flashLight.position.set(x, 0, z);
        this.scene.add(flashLight);

        // 播放雷声音效
        this.game.audioController.playSound('thunder');

        // 移除雷电和闪光
        setTimeout(() => {
            this.scene.remove(lightning);
            this.scene.remove(flashLight);

            // 检查是否击中玩家
            const playerPos = this.game.playerController.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - x, 2) + 
                Math.pow(playerPos.z - z, 2)
            );

            if (distance < 5) {
                // 对玩家造成伤害
                const damage = 5;
                this.game.playerController.takeDamage(damage);
                this.game.uiController.showNotification(`被雷电击中，受到 ${damage} 点伤害！`);
            }
        }, 200);
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        // 更新敌人
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;

            // 更新AI
            this.updateEnemyAI(enemy, deltaTime);

            // 更新动画
            if (enemy.model) {
                // 雷电蝙蝠翅膀扇动
                if (enemy.type === 'thunder-bat') {
                    const leftWing = enemy.model.children[1];
                    const rightWing = enemy.model.children[2];

                    const time = Date.now() * 0.005;
                    leftWing.rotation.z = Math.PI / 4 + Math.sin(time) * Math.PI / 6;
                    rightWing.rotation.z = -Math.PI / 4 - Math.sin(time) * Math.PI / 6;
                }

                // 雷电使者雷电环绕旋转
                if (enemy.type === 'thunder-messenger') {
                    const lightningRing = enemy.model.children[3];
                    lightningRing.rotation.y += 0.02;
                }
            }
        });

        // 更新粒子
        this.particles.forEach(particle => {
            if (particle instanceof THREE.Points) {
                // 旋转火花
                particle.rotation.y += 0.001;

                // 更新火花位置
                const positions = particle.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
                }
                particle.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * 更新敌人AI
     * @param {Object} enemy - 敌人对象
     * @param {number} deltaTime - 时间增量
     */
    updateEnemyAI(enemy, deltaTime) {
        const playerPos = this.game.playerController.position;
        const enemyPos = enemy.position;
        const distance = Math.sqrt(
            Math.pow(playerPos.x - enemyPos.x, 2) + 
            Math.pow(playerPos.z - enemyPos.z, 2)
        );

        // 根据状态执行不同行为
        switch (enemy.ai.state) {
            case 'idle':
                // 检测玩家
                if (distance < enemy.ai.detectionRange) {
                    enemy.ai.state = 'chase';
                    enemy.ai.target = this.game.playerController;
                }
                break;

            case 'chase':
                if (distance > enemy.ai.detectionRange * 1.5) {
                    enemy.ai.state = 'idle';
                    enemy.ai.target = null;
                } else if (distance <= enemy.ai.attackRange) {
                    enemy.ai.state = 'attack';
                } else {
                    // 追击玩家
                    const direction = new THREE.Vector3()
                        .subVectors(playerPos, enemyPos)
                        .normalize();

                    // 根据敌人类型调整移动速度
                    let moveSpeed = enemy.type === 'thunder-bat' ? 3.0 : 2.0;

                    enemyPos.add(direction.multiplyScalar(moveSpeed * deltaTime));

                    // 更新模型位置
                    if (enemy.model) {
                        enemy.model.position.copy(enemyPos);

                        // 朝向玩家
                        enemy.model.lookAt(playerPos);
                    }
                }
                break;

            case 'attack':
                if (distance > enemy.ai.attackRange) {
                    enemy.ai.state = 'chase';
                } else {
                    // 攻击冷却
                    enemy.ai.attackCooldown -= deltaTime;

                    if (enemy.ai.attackCooldown <= 0) {
                        // 执行攻击
                        this.enemyAttack(enemy);
                        enemy.ai.attackCooldown = enemy.ai.attackInterval;

                        // 雷电使者有概率使用技能
                        if (enemy.type === 'thunder-messenger' && Math.random() < 0.4) {
                            this.enemyUseSkill(enemy);
                        }
                    }
                }
                break;
        }
    }

    /**
     * 敌人攻击
     * @param {Object} enemy - 敌人对象
     */
    enemyAttack(enemy) {
        const damage = Math.max(1, enemy.attack - this.game.playerController.defense);
        this.game.playerController.takeDamage(damage);

        // 播放攻击音效
        this.game.audioController.playSound(`${enemy.type}-attack`);

        // 显示伤害数字
        this.game.uiController.showDamageNumber(
            this.game.playerController.position,
            damage,
            'player'
        );
    }

    /**
     * 敌人使用技能
     * @param {Object} enemy - 敌人对象
     */
    enemyUseSkill(enemy) {
        const now = Date.now();
        const skill = enemy.skills[0]; // 雷电连锁

        if (now - skill.lastUsed >= skill.cooldown) {
            skill.lastUsed = now;

            // 创建雷电连锁效果
            this.createThunderChain(enemy);

            // 计算伤害
            const damage = Math.max(1, enemy.attack * 1.2 - this.game.playerController.defense);
            this.game.playerController.takeDamage(damage);

            // 播放技能音效
            this.game.audioController.playSound('thunder-chain');

            // 显示伤害数字
            this.game.uiController.showDamageNumber(
                this.game.playerController.position,
                damage,
                'player'
            );

            // 显示技能名称
            this.game.uiController.showNotification(`${enemy.type} 使用了 ${skill.name}！`);
        }
    }

    /**
     * 创建雷电连锁效果
     * @param {Object} enemy - 施放技能的敌人
     */
    createThunderChain(enemy) {
        const playerPos = this.game.playerController.position;
        const enemyPos = enemy.position;

        // 创建从敌人到玩家的雷电
        const chainGeometry = new THREE.BufferGeometry().setFromPoints([enemyPos, playerPos]);
        const chainMaterial = new THREE.LineBasicMaterial({
            color: 0x9966ff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });

        const chain = new THREE.Line(chainGeometry, chainMaterial);
        this.scene.add(chain);

        // 移除雷电
        setTimeout(() => {
            this.scene.remove(chain);
        }, 500);

        // 查找附近的敌人作为连锁目标
        const nearbyEnemies = this.enemies.filter(e => {
            if (e === enemy || e.health <= 0) return false;

            const dist = Math.sqrt(
                Math.pow(e.position.x - playerPos.x, 2) + 
                Math.pow(e.position.z - playerPos.z, 2)
            );

            return dist < 20;
        });

        // 最多连锁2个敌人
        const chainTargets = nearbyEnemies.slice(0, 2);

        chainTargets.forEach((target, index) => {
            // 递减伤害
            const damage = Math.max(1, (enemy.attack * 1.2 * (1 - 0.2 * (index + 1))) - this.game.playerController.defense);

            // 创建从玩家到目标的雷电
            setTimeout(() => {
                const targetPos = target.position;
                const chainGeometry = new THREE.BufferGeometry().setFromPoints([playerPos, targetPos]);
                const chainMaterial = new THREE.LineBasicMaterial({
                    color: 0x9966ff,
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.7
                });

                const chain = new THREE.Line(chainGeometry, chainMaterial);
                this.scene.add(chain);

                // 移除雷电
                setTimeout(() => {
                    this.scene.remove(chain);
                }, 300);

                // 对目标造成伤害
                target.health -= damage;

                // 显示伤害数字
                this.game.uiController.showDamageNumber(
                    targetPos,
                    damage,
                    'enemy'
                );

                // 播放受击音效
                this.game.audioController.playSound('enemy-hit');
            }, 200 * (index + 1));
        });
    }

    /**
     * 创建NPC
     */
    createNPCs() {
        // 创建雷电大师
        this.game.npcController.addNPC({
            id: 'thunder-plateau-master',
            name: '雷电大师',
            position: new THREE.Vector3(0, 0, 20),
            modelId: 'master',
            dialogue: {
                greeting: '欢迎来到雷电高原，年轻的法师。这里是雷电元素的圣地，充满了强大的能量和古老的智慧。',
                options: [
                    {
                        text: '我想学习雷电咒语',
                        condition: () => this.game.playerController.level >= 5 && !this.game.playerController.hasSpell('lightning-bolt'),
                        effects: () => {
                            this.game.playerController.learnSpell('lightning-bolt');
                            this.game.uiController.showMessage('你学会了雷电箭咒语！');
                        }
                    },
                    {
                        text: '雷电元素有什么弱点？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('雷电元素对大地和岩石咒语很脆弱，但对水和金属导体特别有效。利用环境来增强你的雷电魔法！');
                        }
                    },
                    {
                        text: '如何掌握雷电之力？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('雷电魔法需要精准的时机和强大的精神集中力。观察天空中的雷电，感受自然的节奏，然后释放你的力量。');
                        }
                    }
                ]
            }
        });

        // 创建雷电商人
        this.game.npcController.addNPC({
            id: 'thunder-plateau-merchant',
            name: '雷电商人',
            position: new THREE.Vector3(-20, 0, 10),
            modelId: 'merchant',
            dialogue: {
                greeting: '啊，一个寻求雷电之力的法师！我这里有各种导电装备和雷电抗性药水，能够帮助你在这个危险的地方生存。',
                options: [
                    {
                        text: '购买雷电抗性药水 (70金币)',
                        condition: () => this.game.playerController.gold >= 70,
                        effects: () => {
                            this.game.playerController.gold -= 70;
                            this.game.playerController.addItem('thunder-resistance-potion', 1);
                            this.game.uiController.showMessage('你购买了雷电抗性药水！');
                        }
                    },
                    {
                        text: '购买导电法杖 (180金币)',
                        condition: () => this.game.playerController.gold >= 180,
                        effects: () => {
                            this.game.playerController.gold -= 180;
                            this.game.playerController.addItem('conductive-staff', 1);
                            this.game.uiController.showMessage('你购买了导电法杖！');
                        }
                    },
                    {
                        text: '这里有什么宝物？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('传说在高原的最高处，有一个雷电宝石，它能够大幅增强雷电咒语的力量。但要到达那里，你必须面对最强大的雷电使者。');
                        }
                    }
                ]
            }
        });

        // 创建雷电研究者
        this.game.npcController.addNPC({
            id: 'thunder-plateau-researcher',
            name: '雷电研究者',
            position: new THREE.Vector3(15, 0, -15),
            modelId: 'scholar',
            dialogue: {
                greeting: '我一直在研究雷电元素的行为模式。它们似乎遵循着某种特定的能量循环...',
                options: [
                    {
                        text: '你有什么发现？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我发现雷电元素在攻击前会有短暂的充能期，这时它们会发出特殊的紫色光芒。如果你能在这个时机打断它们，就能阻止强大的雷电连锁攻击。');
                        }
                    },
                    {
                        text: '如何更好地控制雷电？',
                        condition: () => this.game.playerController.level >= 7,
                        effects: () => {
                            this.game.uiController.showMessage('高级雷电法师能够引导雷电的力量，不仅仅用于攻击，还能用于增强自己的速度和反应能力。试着在释放雷电咒语时感受能量的流动。');
                        }
                    },
                    {
                        text: '雷电魔法的未来是什么？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我相信雷电魔法有无限的潜力。从简单的雷电箭到复杂的雷电风暴，甚至能够操控时间和空间。但这需要巨大的精神力量和深厚的理解。');
                        }
                    }
                ]
            }
        });

        // 创建受伤的雷电法师
        this.game.npcController.addNPC({
            id: 'thunder-plateau-injured-mage',
            name: '受伤的雷电法师',
            position: new THREE.Vector3(10, 0, -25),
            modelId: 'mage',
            dialogue: {
                greeting: '小心！这里的雷电元素比我想象的要强大得多。我被它们的连锁攻击重伤了...',
                options: [
                    {
                        text: '我来帮你治疗',
                        condition: () => this.game.playerController.health > 60,
                        effects: () => {
                            this.game.playerController.takeDamage(25);
                            this.game.uiController.showMessage('你帮助了受伤的雷电法师！他告诉你：谢谢你！作为回报，我告诉你一个秘密：雷电使者害怕大地魔法，用岩石咒语对付它们会很有效。');
                        }
                    },
                    {
                        text: '我给你治疗药水',
                        condition: () => this.game.playerController.hasItem('health-potion'),
                        effects: () => {
                            this.game.playerController.removeItem('health-potion', 1);
                            this.game.uiController.showMessage('雷电法师很感激你的帮助！他告诉你：在高原的中央有一个雷电祭坛，那里藏着古老的雷电魔法书。');
                        }
                    },
                    {
                        text: '你是怎么受伤的？',
                        condition: () => true,
                        effects: () => {
                            this.game.uiController.showMessage('我低估了雷电使者的智慧。它们会相互配合，一个吸引注意力，另一个从背后发动雷电连锁攻击。一定要小心它们的战术配合！');
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